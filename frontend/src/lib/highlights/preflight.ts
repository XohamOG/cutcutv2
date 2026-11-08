import type { ClipLength } from "./types";

// Rough per-step costs, set so that an 88-minute stream with 5 auto clips lands near the 12 minutes it took.
const MEASURE_SEC_PER_STREAM_SEC = 0.06;
const REACTION_SEC_PER_MOMENT = 1.5;
const TRANSCRIBE_SEC_PER_MOMENT = { gpu: 8, cpu: 30, cloud: 2 };
const RENDER_SEC_PER_CLIP_SEC = 1;
const AUTO_CLIP_SEC = 40;
const WATCH_SEC_PER_MOMENT = 4;
const READ_SCREEN_SEC = 60;
const MOMENTS_PER_CLIP = 4;
const MAX_MOMENTS = 20;
const BYTES_PER_CLIP_SEC = 1_000_000;
const LOW_MEMORY_GB = 4;
const TIGHT_MEMORY_GB = 8;

export interface PreflightInput {
  durationSec: number;
  clipCount: number;
  length: ClipLength;
  localTranscription: boolean;
  watchVideo?: boolean;
  hasGpu: boolean;
  modelsCached: boolean;
  /** Total memory as the browser reports it, capped at 8. Null if it won't say. */
  memoryGb: number | null;
  freeBytes: number | null;
}

export interface PreflightNote {
  text: string;
  warn: boolean;
}

export interface Preflight {
  minutes: number;
  time: string;
  notes: PreflightNote[];
}

const PLURALS = new Intl.PluralRules("en");
const MINUTE_WORDS: Partial<Record<Intl.LDMLPluralRule, string>> = { one: "minute", other: "minutes" };

const gigabytes = (bytes: number) => `${Math.max(0.1, Math.round((bytes / 1e9) * 10) / 10)} GB`;

export function checkBeforeStart(input: PreflightInput): Preflight {
  const clipSec = input.length === "auto" ? AUTO_CLIP_SEC : input.length;
  const moments = Math.min(MAX_MOMENTS, input.clipCount * MOMENTS_PER_CLIP);
  const transcribe = input.localTranscription ? (input.hasGpu ? TRANSCRIBE_SEC_PER_MOMENT.gpu : TRANSCRIBE_SEC_PER_MOMENT.cpu) : TRANSCRIBE_SEC_PER_MOMENT.cloud;
  const seconds =
    input.durationSec * MEASURE_SEC_PER_STREAM_SEC +
    moments * (REACTION_SEC_PER_MOMENT + transcribe) +
    (input.watchVideo ? moments * WATCH_SEC_PER_MOMENT + READ_SCREEN_SEC : 0) +
    input.clipCount * clipSec * RENDER_SEC_PER_CLIP_SEC;
  const minutes = Math.round(seconds / 60);
  const notes: PreflightNote[] = [];

  if (input.memoryGb !== null) {
    if (input.memoryGb < LOW_MEMORY_GB) notes.push({ text: `Only ${input.memoryGb} GB of memory. Try fewer clips and close other apps.`, warn: true });
    else if (input.memoryGb < TIGHT_MEMORY_GB) notes.push({ text: `${input.memoryGb} GB of memory. Close other tabs first.`, warn: true });
    else notes.push({ text: "Enough memory. Close heavy apps first.", warn: false });
  }

  const neededBytes = input.clipCount * clipSec * BYTES_PER_CLIP_SEC;
  if (input.freeBytes !== null && input.freeBytes < neededBytes) notes.push({ text: `Needs about ${gigabytes(neededBytes)} of free space, and only ${gigabytes(input.freeBytes)} is left.`, warn: true });
  if (!input.hasGpu && input.localTranscription) notes.push({ text: "No graphics acceleration, so captions will be slower.", warn: true });
  if (!input.modelsCached) notes.push({ text: "First run also downloads the AI models.", warn: false });

  return { minutes, time: seconds < 60 ? "Under a minute" : `About ${minutes} ${MINUTE_WORDS[PLURALS.select(minutes)] ?? "minutes"}`, notes };
}
