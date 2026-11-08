/** "auto" lets each moment set its own length; a number is an exact length in seconds. */
export type ClipLength = "auto" | number;
export type TemplateId = "stacked" | "focus" | "banner";

/** An area of the source frame, each value 0..1. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SplitRegions {
  cam: Rect;
  game: Rect;
}

export type EmptyFill = "blur" | "black" | "facecam";
export type CamBorder = "none" | "clean" | "neon" | "corners";

export interface FramingOptions {
  /** Off for streams with no camera: the face box and its border disappear. */
  hasFacecam: boolean;
  /** Locked boxes always match their template slot; unlocked ones can be any shape. */
  lockAspect: boolean;
  /** What fills the space an unlocked box leaves in its slot. */
  fill: EmptyFill;
  border: CamBorder;
}

export interface OutroOptions {
  enabled: boolean;
  message: string;
  handle: string;
}

export type LlmProvider = "anthropic" | "openai" | "groq" | "gemini";
export type SttProvider = "local" | "groq" | "openai";

export interface LlmKey {
  provider: LlmProvider;
  apiKey: string;
  model: string;
}

export interface SttChoice {
  provider: SttProvider;
  apiKey?: string;
}

export interface RunOptions {
  clipCount: number;
  length: ClipLength;
  template: TemplateId;
  regions: SplitRegions;
  framing: FramingOptions;
  outro: OutroOptions;
  burnCaptions: boolean;
  /** Also looks at the picture around each moment. Slower. */
  watchVideo: boolean;
  stt: SttChoice;
  llm?: LlmKey;
}

/** What a clip needs to be rendered again exactly as it was. */
export type ClipSettings = Pick<RunOptions, "template" | "regions" | "framing" | "outro" | "burnCaptions">;

/** Run settings kept for resuming. Never includes API keys. */
export type RunSettings = Pick<RunOptions, "clipCount" | "length" | "template" | "regions" | "framing" | "outro" | "burnCaptions" | "watchVideo"> & {
  sttProvider: SttProvider;
};

export interface Word {
  start: number;
  end: number;
  text: string;
}

export interface ChatMessage {
  t: number;
  author: string;
  text: string;
  /** Super Chat, sticker, membership, bits or subscription. */
  paid?: boolean;
  emotes?: number;
}

/** Per-second measurements of the whole stream. NaN means no speech in that second. */
export interface AudioFeatures {
  loudnessDb: number[];
  voicedRatio: number[];
  voicedDb: number[];
  pitchHz: number[];
}

/** Further evidence about a moment, each 0..1. Absent means it wasn't measured. */
export interface MomentExtras {
  gameSound?: number;
  voices?: number;
  quietBefore?: number;
  speechBurst?: number;
  hype?: number;
  hypePhrase?: string;
  paidChat?: number;
  emotes?: number;
  motion?: number;
  sceneCut?: number;
  face?: number;
  camMotion?: number;
  screenText?: number;
  screenWords?: string[];
}

/** A spot the measured signals flagged. Every signal is 0..1. */
export interface Candidate {
  id: number;
  peakSec: number;
  windowStart: number;
  windowEnd: number;
  score: number;
  voice: number;
  loudness: number;
  chat: number | null;
  laughter: number | null;
  shout: number | null;
  chatSample: string[];
  words: Word[];
  extra?: MomentExtras;
}

export interface SelectedMoment {
  candidate: Candidate;
  startSec: number;
  endSec: number;
  score: number;
  momentType: string;
  title: string;
  hook: string;
  reason: string;
  selectedBy: "llm" | "signals";
}

export type ChatLevel = "none" | "sparse" | "active";

export interface AnalysisSummary {
  chatLevel: ChatLevel;
  chatMessagesPerHour: number;
  chatLagSec: number | null;
  chatLagMeasured: boolean;
  speechCoverage: number;
  hasCommentary: boolean;
}

export interface ClipResult {
  id: string;
  sourceName: string;
  rank: number;
  startSec: number;
  durationSec: number;
  score: number;
  momentType: string;
  title: string;
  hook: string;
  reason: string;
  /** Why this clip sits at its place in the ranking. */
  rankReason?: string;
  selectedBy: "llm" | "signals";
  signals: Pick<Candidate, "voice" | "chat" | "laughter"> & Partial<Pick<Candidate, "shout" | "extra">>;
  /** Missing on clips made before editing existed. */
  edit?: ClipEdit;
  rating?: Rating;
  blob: Blob;
}

export type Rating = "up" | "down";

/** Everything needed to re-cut a clip. Never includes API keys. */
export interface ClipEdit {
  sourceFp: string;
  windowStart: number;
  windowEnd: number;
  endSec: number;
  words: Word[];
  settings: ClipSettings;
}

export interface ClipChange {
  startSec: number;
  endSec: number;
  words: Word[];
  hook: string;
}

export type RunRequest = { type: "run"; file: File; chatText: string | null; options: RunOptions };
export type EditRequest = { type: "edit"; file: File; clip: ClipResult; change: ClipChange };
export type WorkerRequest = RunRequest | EditRequest;

export type WorkerEvent =
  | { type: "progress"; stage: string; fraction: number; message: string }
  | { type: "warn"; message: string }
  /** The stream's loudness shape, null where it hasn't been heard yet. */
  | { type: "waveform"; bars: (number | null)[] }
  /** Where the candidate moments fall, 0..1 along the stream. */
  | { type: "moments"; positions: number[] }
  | { type: "summary"; summary: AnalysisSummary; usedTranscript: boolean; usedLlm: boolean }
  | { type: "clip"; clip: ClipResult }
  | { type: "edited"; clip: ClipResult }
  | { type: "done" }
  | { type: "error"; message: string };
