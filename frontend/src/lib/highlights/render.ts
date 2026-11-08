import { AudioSample, BufferTarget, Conversion, Mp4OutputFormat, Output, QUALITY_HIGH, canEncodeAudio, canEncodeVideo } from "mediabunny";
import type { CaptionStyle, FramingOptions, OutroOptions, SplitRegions, TemplateId, Word } from "./types";
import type { OpenedMedia } from "./media.ts";
import { captionAt, chunkWords } from "./captions.ts";
import { CANVAS_H, CANVAS_W, drawFrame, drawOutro, drawOverlays, ensureFonts, getTemplate } from "./templates.ts";

const HOOK_SEC = 2.5;
export const OUTRO_SEC = 2.5;
const OUTRO_FADE_SEC = 0.3;
const AUDIO_FADE_SEC = 0.35;

export async function assertBrowserCanRender(): Promise<void> {
  const [video, audio] = await Promise.all([canEncodeVideo("avc", { width: CANVAS_W, height: CANVAS_H }), canEncodeAudio("aac")]);
  if (!video || !audio) throw new Error("This browser can't encode MP4 video. Use a current version of Chrome or Edge.");
}

/** Fades the clip's sound out at its end and silences anything after it. */
function applyEndFade(sample: AudioSample, clipDuration: number): AudioSample {
  const fadeStart = clipDuration - AUDIO_FADE_SEC;
  if (sample.timestamp + sample.duration <= fadeStart) return sample;
  const { numberOfFrames: frames, numberOfChannels: channels, sampleRate, timestamp } = sample;
  const data = new Float32Array(frames * channels);
  for (let planeIndex = 0; planeIndex < channels; planeIndex++) {
    const plane = data.subarray(planeIndex * frames, (planeIndex + 1) * frames);
    sample.copyTo(plane, { planeIndex, format: "f32-planar" });
    for (let i = 0; i < frames; i++) {
      const t = timestamp + i / sampleRate;
      plane[i] *= Math.max(0, Math.min(1, (clipDuration - t) / AUDIO_FADE_SEC));
    }
  }
  sample.close();
  return new AudioSample({ data, format: "f32-planar", numberOfChannels: channels, sampleRate, timestamp });
}

export interface RenderInput {
  media: OpenedMedia;
  startSec: number;
  endSec: number;
  template: TemplateId;
  regions: SplitRegions;
  framing: FramingOptions;
  outro: OutroOptions;
  words: Word[];
  captions: CaptionStyle;
  title: string;
  hook: string;
  onProgress: (fraction: number) => void;
}

/** Seconds of end card a clip gets; shorter only if the recording runs out. */
export function outroLength(outro: OutroOptions, endSec: number, sourceDuration: number): number {
  return outro.enabled ? Math.max(0, Math.min(OUTRO_SEC, sourceDuration - endSec)) : 0;
}

export async function renderClip(input: RenderInput): Promise<Blob> {
  await ensureFonts();
  const template = getTemplate(input.template);
  const canvas = new OffscreenCanvas(CANVAS_W, CANVAS_H);
  const ctx = canvas.getContext("2d", { alpha: false }) as OffscreenCanvasRenderingContext2D;
  const clipDuration = input.endSec - input.startSec;
  const lines = chunkWords(
    input.words
      .filter((w) => w.end > input.startSec && w.start < input.endSec)
      .map((w) => ({ text: w.text, start: w.start - input.startSec, end: Math.min(w.end, input.endSec) - input.startSec }))
  );

  const output = new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target: new BufferTarget() });
  const conversion = await Conversion.init({
    input: input.media.input,
    output,
    tracks: "primary",
    // The outro plays over the footage just after the clip, so no extra frames are needed.
    trim: { start: input.startSec, end: input.endSec + outroLength(input.outro, input.endSec, input.media.durationSec) },
    showWarnings: false,
    video: {
      codec: "avc",
      quality: QUALITY_HIGH,
      frameRate: 30,
      forceTranscode: true,
      processedWidth: CANVAS_W,
      processedHeight: CANVAS_H,
      process: (sample) => {
        drawFrame(ctx, (target, sx, sy, sw, sh, dx, dy, dw, dh) => sample.draw(target, sx, sy, sw, sh, dx, dy, dw, dh), sample.displayWidth, sample.displayHeight, template, input.regions, input.framing);
        // Timestamps inside the conversion are already relative to the trim start.
        const t = sample.timestamp;
        if (t >= clipDuration) {
          drawOutro(ctx, template, input.outro, Math.min(1, (t - clipDuration) / OUTRO_FADE_SEC));
          return canvas;
        }
        drawOverlays(ctx, template, { title: input.hook || input.title, hook: t < HOOK_SEC ? input.hook : "", caption: captionAt(lines, t) }, input.captions);
        return canvas;
      },
    },
    audio: { codec: "aac", forceTranscode: true, process: (sample) => applyEndFade(sample, clipDuration) },
  });
  if (!conversion.isValid) {
    const reasons = conversion.discardedTracks.map((t) => t.reason).join(", ");
    throw new Error(`This file can't be converted in the browser (${reasons}).`);
  }
  conversion.onProgress = input.onProgress;
  await conversion.execute();
  return new Blob([output.target.buffer as ArrayBuffer], { type: "video/mp4" });
}
