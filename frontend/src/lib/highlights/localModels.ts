import { AutoModelForAudioClassification, AutoProcessor, env, pipeline } from "@huggingface/transformers";
import type { Word } from "./types";
import { breathe } from "./pace.ts";

env.allowLocalModels = false;

const WHISPER_MODEL = "onnx-community/whisper-base_timestamped";
const REACTION_MODEL = "Xenova/ast-finetuned-audioset-10-10-0.4593";
const SAMPLE_RATE = 16000;
const CHUNK_SEC = 28;
const CHUNK_OVERLAP_SEC = 1;
const REACTION_SEGMENT_SEC = 10;

const LAUGH_LABELS = new Set(["Laughter", "Giggle", "Snicker", "Belly laugh", "Chuckle, chortle", "Baby laughter"]);
const SHOUT_LABELS = new Set(["Screaming", "Shout", "Yell", "Bellow", "Whoop", "Battle cry", "Children shouting"]);

const GAME_LABELS = new Set(["Explosion", "Gunshot, gunfire", "Machine gun", "Fusillade", "Artillery fire", "Cap gun", "Eruption", "Boom", "Cheering", "Applause"]);
const VOICES_LABELS = new Set(["Hubbub, speech noise, speech babble", "Chatter", "Crowd", "Conversation"]);

export type ProgressFn = (message: string) => void;

type Device = "webgpu" | "wasm";
let devicePromise: Promise<Device> | null = null;

export function detectDevice(): Promise<Device> {
  devicePromise ??= (async () => {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
    return (await gpu?.requestAdapter().catch(() => null)) ? "webgpu" : "wasm";
  })();
  return devicePromise;
}

function downloadReporter(label: string, onStatus: ProgressFn) {
  const files = new Map<string, { loaded: number; total: number }>();
  return (p: { status: string; file?: string; loaded?: number; total?: number }) => {
    if (p.status !== "progress" || !p.file) return;
    files.set(p.file, { loaded: p.loaded ?? 0, total: p.total ?? 0 });
    let loaded = 0;
    let total = 0;
    files.forEach((f) => {
      loaded += f.loaded;
      total += f.total;
    });
    if (total) onStatus(`Downloading ${label} (first run only): ${Math.round((loaded / total) * 100)}%`);
  };
}

interface WordChunk {
  text: string;
  timestamp: [number, number | null];
}
type Transcriber = ((audio: Float32Array, options: Record<string, unknown>) => Promise<{ chunks?: WordChunk[] }>) & { dispose: () => Promise<unknown> };

let transcriberPromise: Promise<Transcriber> | null = null;

function loadTranscriber(onStatus: ProgressFn): Promise<Transcriber> {
  transcriberPromise ??= (async () => {
    const device = await detectDevice();
    const dtype = device === "webgpu" ? { encoder_model: "fp32", decoder_model_merged: "q4" } : { encoder_model: "q8", decoder_model_merged: "q8" };
    const options = { device, dtype, progress_callback: downloadReporter("the free speech model", onStatus) };
    return (await pipeline("automatic-speech-recognition", WHISPER_MODEL, options as never)) as unknown as Transcriber;
  })();
  return transcriberPromise;
}

/** Free English transcription on the user's own device. Timestamps are relative to the audio. */
export async function transcribeLocal(pcm16k: Float32Array, onStatus: ProgressFn): Promise<Word[]> {
  const transcriber = await loadTranscriber(onStatus);
  const words: Word[] = [];
  const stepSamples = (CHUNK_SEC - CHUNK_OVERLAP_SEC) * SAMPLE_RATE;
  for (let offset = 0; offset < pcm16k.length; offset += stepSamples) {
    const piece = pcm16k.subarray(offset, offset + CHUNK_SEC * SAMPLE_RATE);
    const pieceStart = offset / SAMPLE_RATE;
    const { chunks = [] } = await transcriber(piece, { return_timestamps: "word", language: "en", task: "transcribe" });
    for (const chunk of chunks) {
      const start = chunk.timestamp[0] + pieceStart;
      const end = (chunk.timestamp[1] ?? chunk.timestamp[0] + 0.3) + pieceStart;
      const last = words[words.length - 1];
      if (!last || start >= last.end - 0.05) words.push({ start, end, text: chunk.text.trim() });
    }
    if (piece.length < CHUNK_SEC * SAMPLE_RATE) break;
    await breathe();
  }
  return words.filter((w) => w.text);
}

/** Frees the speech model once every moment is transcribed. It reloads from the browser cache if needed again. */
export async function releaseSpeechModel(): Promise<void> {
  const loading = transcriberPromise;
  transcriberPromise = null;
  await (await loading?.catch(() => null))?.dispose().catch(() => undefined);
}

/** Returns every sound class with its own independent 0..1 confidence. */
interface Classifier {
  classify: (audio: Float32Array) => Promise<{ label: string; score: number }[]>;
  dispose: () => Promise<unknown>;
}

let classifierPromise: Promise<Classifier> | null = null;

function loadClassifier(onStatus: ProgressFn): Promise<Classifier> {
  classifierPromise ??= (async () => {
    const device = await detectDevice();
    const progress_callback = downloadReporter("the laughter model", onStatus);
    const [processor, model] = await Promise.all([
      AutoProcessor.from_pretrained(REACTION_MODEL, { progress_callback } as never),
      AutoModelForAudioClassification.from_pretrained(REACTION_MODEL, { device, dtype: "q8", progress_callback } as never),
    ]);
    const id2label = (model.config as unknown as { id2label: Record<number, string> }).id2label;
    const classify = async (audio: Float32Array) => {
      const { logits } = await model(await processor(audio));
      // AudioSet is multi-label: speech and laughter can both be true at once. The stock
      // pipeline uses softmax, which makes classes compete and pushes laughter to zero.
      return Array.from(logits.data as Float32Array, (logit, i) => ({ label: id2label[i], score: 1 / (1 + Math.exp(-logit)) }));
    };
    return { classify, dispose: () => model.dispose() };
  })();
  return classifierPromise;
}

export interface Reactions {
  laughter: number;
  shout: number;
  gameSound: number;
  voices: number;
}

/** Highest confidence (0..1) for each kind of sound across the given audio. */
export async function detectReactions(pcm16k: Float32Array, onStatus: ProgressFn): Promise<Reactions> {
  const classifier = await loadClassifier(onStatus);
  const size = REACTION_SEGMENT_SEC * SAMPLE_RATE;
  let laughter = 0;
  let shout = 0;
  let gameSound = 0;
  let voices = 0;
  for (let offset = 0; offset < pcm16k.length; offset += size) {
    const labels = await classifier.classify(pcm16k.subarray(offset, offset + size));
    await breathe();
    for (const { label, score } of labels) {
      if (LAUGH_LABELS.has(label)) laughter = Math.max(laughter, score);
      if (SHOUT_LABELS.has(label)) shout = Math.max(shout, score);
      if (GAME_LABELS.has(label)) gameSound = Math.max(gameSound, score);
      if (VOICES_LABELS.has(label)) voices = Math.max(voices, score);
    }
  }
  return { laughter, shout, gameSound, voices };
}

/** Frees the laughter model once every moment has been listened to. */
export async function releaseReactionModel(): Promise<void> {
  const loading = classifierPromise;
  classifierPromise = null;
  await (await loading?.catch(() => null))?.dispose().catch(() => undefined);
}
