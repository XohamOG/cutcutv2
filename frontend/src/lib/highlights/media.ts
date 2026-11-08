import { ALL_FORMATS, AudioSampleSink, BlobSource, Input, type AudioSample, type InputAudioTrack, type InputVideoTrack } from "mediabunny";
import type { AudioFeatures } from "./types";
import { VoiceAnalyzer } from "./voice.ts";

export interface OpenedMedia {
  input: Input;
  audio: InputAudioTrack;
  video: InputVideoTrack;
  durationSec: number;
}

export async function openMedia(file: File): Promise<OpenedMedia> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const [audio, video, durationSec] = await Promise.all([input.getPrimaryAudioTrack(), input.getPrimaryVideoTrack(), input.computeDuration()]);
  if (!video) throw new Error("This file has no video track.");
  if (!audio) throw new Error("This file has no audio track, so there is nothing to analyze.");
  return { input, audio, video, durationSec };
}

function toMono(sample: AudioSample): Float32Array {
  const frames = sample.numberOfFrames;
  const mono = new Float32Array(frames);
  const channel = new Float32Array(frames);
  for (let planeIndex = 0; planeIndex < sample.numberOfChannels; planeIndex++) {
    sample.copyTo(channel, { planeIndex, format: "f32-planar" });
    for (let i = 0; i < frames; i++) mono[i] += channel[i];
  }
  if (sample.numberOfChannels > 1) for (let i = 0; i < frames; i++) mono[i] /= sample.numberOfChannels;
  return mono;
}

/** Decodes the whole audio track once, in streaming fashion, and keeps per-second numbers. */
export async function measureAudio(media: OpenedMedia, onProgress: (fraction: number, loudnessSoFar: number[]) => void): Promise<AudioFeatures> {
  const analyzer = new VoiceAnalyzer(media.audio.sampleRate);
  const sink = new AudioSampleSink(media.audio);
  let lastReport = 0;
  for await (const sample of sink.samples()) {
    analyzer.push(toMono(sample));
    const at = sample.timestamp;
    sample.close();
    if (at - lastReport >= 30) {
      lastReport = at;
      onProgress(Math.min(1, at / media.durationSec), analyzer.features.loudnessDb);
    }
  }
  return analyzer.finish();
}

/** Reads one time range as 16 kHz mono, the format the speech models expect. */
export async function readPcm16k(media: OpenedMedia, startSec: number, endSec: number): Promise<Float32Array> {
  const targetLength = Math.ceil((endSec - startSec) * 16000);
  const out = new Float32Array(targetLength);
  const ratio = media.audio.sampleRate / 16000;
  const sink = new AudioSampleSink(media.audio);
  for await (const sample of sink.samples(startSec, endSec)) {
    const mono = toMono(sample);
    const offset = sample.timestamp - startSec;
    sample.close();
    let source = 0;
    let target = Math.floor(offset * 16000);
    while (source < mono.length && target < targetLength) {
      const from = Math.floor(source);
      const to = Math.max(from + 1, Math.floor(source + ratio));
      let sum = 0;
      for (let i = from; i < Math.min(to, mono.length); i++) sum += mono[i];
      if (target >= 0) out[target] = sum / (Math.min(to, mono.length) - from);
      target++;
      source += ratio;
    }
  }
  return out;
}
