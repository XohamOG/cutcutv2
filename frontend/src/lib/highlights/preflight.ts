import type { ClipLength } from "./types";
import { GENTLE_SLOWDOWN } from "./pace.ts";

// Rough per-step costs, set from an 88-minute stream with 5 auto clips that took 12 minutes when every moment was transcribed in full.
const MEASURE_SEC_PER_STREAM_SEC = 0.06;
const REACTION_SEC_PER_MOMENT = 1.5;
const TRANSCRIBE_SEC_PER_MOMENT = { gpu: 8, cpu: 30, cloud: 2 };
const RENDER_SEC_PER_CLIP_SEC = 1;
const AUTO_CLIP_SEC = 40;
const WATCH_SEC_PER_MOMENT = 4;
const READ_SCREEN_SEC = 60;
const MOMENTS_PER_CLIP = 4;
/** Every moment gets a short snippet transcribed; only finalists get the full window the costs above are for. */
const SNIPPET_SHARE = 20 / 90;
const FINALIST_SPARE = 3;
/** Past this, a cloud key is worth suggesting even on a strong machine. */
const LONG_RUN_MINUTES = 15;
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
  gentle?: boolean;
  hasGpu: boolean;
  modelsCached: boolean;
  /** Total memory as the browser reports it, capped at 8. Null if it won't say. */
  memoryGb: number | null;
  freeBytes: number | null;
}

export interface PreflightNote {
  text: string;
  warn: boolean;
  href?: string;
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
  const busySeconds =
    input.durationSec * MEASURE_SEC_PER_STREAM_SEC +
    moments * REACTION_SEC_PER_MOMENT +
    transcribe * (moments * SNIPPET_SHARE + Math.min(moments, input.clipCount + FINALIST_SPARE)) +
    (input.watchVideo ? moments * WATCH_SEC_PER_MOMENT + READ_SCREEN_SEC : 0) +
    input.clipCount * clipSec * RENDER_SEC_PER_CLIP_SEC;
  const seconds = busySeconds * (input.gentle ? GENTLE_SLOWDOWN : 1);
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
  const weak = !input.hasGpu || (input.memoryGb !== null && input.memoryGb < TIGHT_MEMORY_GB);
  if (input.localTranscription && (weak || minutes >= LONG_RUN_MINUTES)) {
    notes.push({ text: "A free Groq key does the transcribing instead: faster, and easier on this computer.", warn: false, href: "/keys#groq" });
  }
  if (!input.modelsCached) notes.push({ text: "First run also downloads the AI models.", warn: false });

  return { minutes, time: seconds < 60 ? "Under a minute" : `About ${minutes} ${MINUTE_WORDS[PLURALS.select(minutes)] ?? "minutes"}`, notes };
}
