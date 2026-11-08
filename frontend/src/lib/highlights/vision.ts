import { RawImage, pipeline, env } from "@huggingface/transformers";
import { VideoSampleSink, type VideoSample } from "mediabunny";
import type { OpenedMedia } from "./media.ts";
import { faceChange, matchScreenWords, motionStats, screenScore, scoreChanged, type MoodScores } from "./moments.ts";
import type { FramingOptions, MomentExtras, Rect, SplitRegions } from "./types";

env.allowLocalModels = false;

const FACE_MODEL = "Xenova/facial_emotions_image_detection";
const FACE_SIZE = 224;
const STRIP_BEFORE_SEC = 12;
const STRIP_AFTER_SEC = 6;
const STRIP_STEP_SEC = 0.5;
const SMALL = { w: 64, h: 36 };
const CAM_SMALL = 32;
const FACE_BEFORE_OFFSETS = [-10, -7];
const FACE_DURING_OFFSETS = [0, 1.5, 3];
const TEXT_OFFSETS = [-1, 1, 3];
const SCORE_BEFORE_OFFSET = -10;
const SCORE_AFTER_OFFSET = 4;
/** Text reads best at about this frame height, so low-resolution streams get enlarged. */
const TEXT_TARGET_HEIGHT = 1080;
const TEXT_MAX_SCALE = 3;

const KILL_FEED: Rect = { x: 0.62, y: 0, w: 0.38, h: 0.3 };
const BANNER: Rect = { x: 0.2, y: 0.2, w: 0.6, h: 0.35 };
const SCOREBOARD: Rect = { x: 0.35, y: 0, w: 0.3, h: 0.1 };

type MoodFn = (image: RawImage, options: { top_k: number }) => Promise<MoodScores>;
let moodPromise: Promise<MoodFn> | null = null;

function loadMood(onStatus: (message: string) => void): Promise<MoodFn> {
  moodPromise ??= (async () => {
    const options = { device: "wasm", dtype: "q8", progress_callback: (p: { status: string; progress?: number }) => {
      if (p.status === "progress" && p.progress !== undefined) onStatus(`Downloading the face model (first run only): ${Math.round(p.progress)}%`);
    } };
    return (await pipeline("image-classification", FACE_MODEL, options as never)) as unknown as MoodFn;
  })();
  return moodPromise;
}

export interface ScreenReader {
  read: (image: Blob) => Promise<string>;
  close: () => Promise<void>;
}

/** Reads on-screen text on this device. The engine downloads once; frames never leave. */
export function createScreenReader(): ScreenReader {
  let engine: Promise<{ recognize: (image: Blob) => Promise<{ data: { text: string } }>; terminate: () => Promise<unknown> }> | null = null;
  return {
    read: async (image) => {
      engine ??= import("tesseract.js").then((t) => t.createWorker("eng"));
      return (await (await engine).recognize(image)).data.text;
    },
    close: async () => {
      if (engine) await (await engine).terminate();
    },
  };
}

function drawCrop(sample: VideoSample, ctx: OffscreenCanvasRenderingContext2D, rect: Rect, width: number, height: number) {
  const { displayWidth: w, displayHeight: h } = sample;
  sample.draw(ctx, rect.x * w, rect.y * h, rect.w * w, rect.h * h, 0, 0, width, height);
}

function grayFrom(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number): Uint8Array {
  const { data } = ctx.getImageData(0, 0, width, height);
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < gray.length; i++) gray[i] = (data[i * 4] * 77 + data[i * 4 + 1] * 150 + data[i * 4 + 2] * 29) >> 8;
  return gray;
}

function canvas2d(width: number, height: number) {
  const canvas = new OffscreenCanvas(width, height);
  return { canvas, ctx: canvas.getContext("2d", { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D };
}

function textCrop(sample: VideoSample, rect: Rect): OffscreenCanvas {
  const scale = Math.min(TEXT_MAX_SCALE, Math.max(1, TEXT_TARGET_HEIGHT / sample.displayHeight));
  const width = Math.round(rect.w * sample.displayWidth * scale);
  const height = Math.round(rect.h * sample.displayHeight * scale);
  const { canvas, ctx } = canvas2d(width, height);
  drawCrop(sample, ctx, rect, width, height);
  return canvas;
}

const nearestIndex = (times: number[], target: number) => times.reduce((best, t, i) => (Math.abs(t - target) < Math.abs(times[best] - target) ? i : best), 0);
const toPng = (canvas: OffscreenCanvas) => canvas.convertToBlob({ type: "image/png" });

export interface WatchOptions {
  regions: SplitRegions;
  framing: FramingOptions;
  reader: ScreenReader | null;
  onStatus: (message: string) => void;
}

/** Looks at the video around one moment: movement, the facecam, and on-screen text. */
export async function watchMoment(media: OpenedMedia, peakSec: number, options: WatchOptions): Promise<MomentExtras> {
  const { regions, framing, reader, onStatus } = options;
  const times: number[] = [];
  for (let t = Math.max(0, peakSec - STRIP_BEFORE_SEC); t <= Math.min(media.durationSec - 0.1, peakSec + STRIP_AFTER_SEC); t += STRIP_STEP_SEC) times.push(t);
  if (times.length < 4) return {};

  const small = canvas2d(SMALL.w, SMALL.h);
  const cam = canvas2d(CAM_SMALL, CAM_SMALL);
  const face = canvas2d(FACE_SIZE, FACE_SIZE);
  const useCam = framing.hasFacecam;
  const faceBefore = new Set(FACE_BEFORE_OFFSETS.map((o) => nearestIndex(times, peakSec + o)));
  const faceDuring = new Set(FACE_DURING_OFFSETS.map((o) => nearestIndex(times, peakSec + o)));
  const textAt = new Set(TEXT_OFFSETS.map((o) => nearestIndex(times, peakSec + o)));
  const scoreBefore = nearestIndex(times, peakSec + SCORE_BEFORE_OFFSET);
  const scoreAfter = nearestIndex(times, peakSec + SCORE_AFTER_OFFSET);

  const frames: Uint8Array[] = [];
  const camFrames: Uint8Array[] = [];
  const frameTimes: number[] = [];
  const faceImages: { before: boolean; image: RawImage }[] = [];
  const textCrops: OffscreenCanvas[] = [];
  let scoreCrops: [OffscreenCanvas | null, OffscreenCanvas | null] = [null, null];

  const sink = new VideoSampleSink(media.video);
  let index = -1;
  for await (const sample of sink.samplesAtTimestamps(times)) {
    index++;
    if (!sample) continue;
    try {
      drawCrop(sample, small.ctx, { x: 0, y: 0, w: 1, h: 1 }, SMALL.w, SMALL.h);
      frames.push(grayFrom(small.ctx, SMALL.w, SMALL.h));
      frameTimes.push(times[index]);
      if (useCam) {
        drawCrop(sample, cam.ctx, regions.cam, CAM_SMALL, CAM_SMALL);
        camFrames.push(grayFrom(cam.ctx, CAM_SMALL, CAM_SMALL));
        if (faceBefore.has(index) || faceDuring.has(index)) {
          drawCrop(sample, face.ctx, regions.cam, FACE_SIZE, FACE_SIZE);
          const { data } = face.ctx.getImageData(0, 0, FACE_SIZE, FACE_SIZE);
          const rgb = new Uint8ClampedArray(FACE_SIZE * FACE_SIZE * 3);
          for (let p = 0; p < FACE_SIZE * FACE_SIZE; p++) {
            rgb[p * 3] = data[p * 4];
            rgb[p * 3 + 1] = data[p * 4 + 1];
            rgb[p * 3 + 2] = data[p * 4 + 2];
          }
          faceImages.push({ before: faceBefore.has(index), image: new RawImage(rgb, FACE_SIZE, FACE_SIZE, 3) });
        }
      }
      if (reader) {
        if (textAt.has(index)) textCrops.push(textCrop(sample, KILL_FEED), textCrop(sample, BANNER));
        if (index === scoreBefore) scoreCrops = [textCrop(sample, SCOREBOARD), scoreCrops[1]];
        if (index === scoreAfter) scoreCrops = [scoreCrops[0], textCrop(sample, SCOREBOARD)];
      }
    } finally {
      sample.close();
    }
  }

  const extras: MomentExtras = motionStats(frames, frameTimes, peakSec);
  if (useCam) {
    extras.camMotion = motionStats(camFrames, frameTimes, peakSec).motion;
    if (faceImages.length) {
      const mood = await loadMood(onStatus);
      const before: MoodScores[] = [];
      const during: MoodScores[] = [];
      for (const { before: isBefore, image } of faceImages) (isBefore ? before : during).push(await mood(image, { top_k: 7 }));
      extras.face = faceChange(before, during);
    }
  }
  if (reader) {
    let text = "";
    for (const crop of textCrops) text += ` ${await reader.read(await toPng(crop))}`;
    const [a, b] = scoreCrops;
    const changed = a && b ? scoreChanged(await reader.read(await toPng(a)), await reader.read(await toPng(b))) : false;
    const words = matchScreenWords(text);
    extras.screenText = screenScore(words, changed);
    if (words.length) extras.screenWords = words;
  }
  return extras;
}
