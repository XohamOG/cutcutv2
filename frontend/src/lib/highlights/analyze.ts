import type { AnalysisSummary, AudioFeatures, Candidate, ChatLevel, ChatMessage, ClipLength } from "./types";
import {
  aboveTrailingAverage,
  chatExtras,
  chatReliability,
  chatSurge,
  estimateChatLag,
  fuseSignals,
  pickPeaks,
  quietThenLoud,
  refinePeak,
  robustZ,
  sampleChat,
  shiftEarlier,
  smooth,
  zToUnit,
} from "./signals.ts";

const BASE_WINDOW_SEC = 90;
const WINDOW_SPARE_SEC = 30;
const BEFORE_PEAK_SHARE = 2 / 3;
const CANDIDATE_MULTIPLIER = 4;
const MAX_CANDIDATES = 20;
const LONG_VIDEO_SEC = 1800;
const LONG_VIDEO_EDGE_SEC = 120;
const MIN_SPEECH_COVERAGE = 0.05;
const ACTIVE_CHAT_PER_HOUR = 500;

/** A moment only counts if it beats the average of the two minutes before it. */
export const TRAILING_WINDOW_SEC = 120;
const VOICE_MARGIN_DB = 3;
const LOUDNESS_MARGIN_DB = 4;
const CHAT_MARGIN = 0.1;

export interface SignalAnalysis {
  candidates: Candidate[];
  summary: AnalysisSummary;
}

function semitones(hz: number): number {
  return Number.isFinite(hz) ? 12 * Math.log2(hz / 100) : NaN;
}

/** Excitement in the streamer's voice, relative to how they usually sound. */
function voiceExcitement(f: AudioFeatures): number[] {
  const loud = robustZ(smooth(f.voicedDb, 1), 1.5);
  const pitch = robustZ(smooth(f.pitchHz.map(semitones), 1), 1);
  return zToUnit(loud.map((l, t) => 0.6 * l + 0.4 * pitch[t]), 1, 3.5);
}

function chatLevel(messages: number, perHour: number): ChatLevel {
  if (messages < 5) return "none";
  return perHour >= ACTIVE_CHAT_PER_HOUR ? "active" : "sparse";
}

/** How much of the stream to examine around a peak, so any chosen length fits. */
function windowAround(length: ClipLength): { before: number; after: number } {
  const total = length === "auto" ? BASE_WINDOW_SEC : Math.max(BASE_WINDOW_SEC, length + WINDOW_SPARE_SEC);
  const before = Math.round(total * BEFORE_PEAK_SHARE);
  return { before, after: total - before };
}

export function analyzeSignals(f: AudioFeatures, messages: ChatMessage[], clipCount: number, length: ClipLength = "auto"): SignalAnalysis {
  const duration = f.loudnessDb.length;
  const speechSeconds = f.voicedDb.filter(Number.isFinite).length;
  const speechCoverage = duration ? speechSeconds / duration : 0;
  const hasCommentary = speechCoverage >= MIN_SPEECH_COVERAGE;

  const loudSmoothed = smooth(f.loudnessDb, 1);
  const loudness = zToUnit(robustZ(loudSmoothed, 1.5));
  const voice = hasCommentary ? voiceExcitement(f) : null;
  const primary = voice ?? loudness;

  const perHour = duration ? (messages.length / duration) * 3600 : 0;
  const level = chatLevel(messages.length, perHour);
  let chat: number[] | null = null;
  let chatLagSec: number | null = null;
  let chatLagMeasured = false;
  let paid: number[] | null = null;
  let emotes: number[] | null = null;
  if (level !== "none") {
    const surge = chatSurge(messages, duration);
    const lag = estimateChatLag(primary, surge);
    chatLagSec = lag.lagSec;
    chatLagMeasured = lag.measured;
    chat = shiftEarlier(surge, lag.lagSec);
    const extras = chatExtras(messages, duration);
    paid = shiftEarlier(extras.paid, lag.lagSec);
    emotes = shiftEarlier(extras.emotes, lag.lagSec);
  }

  const score = fuseSignals(voice, loudness, chat, chatReliability(perHour));

  const audioPasses = hasCommentary
    ? aboveTrailingAverage(smooth(f.voicedDb, 1), TRAILING_WINDOW_SEC, VOICE_MARGIN_DB)
    : aboveTrailingAverage(loudSmoothed, TRAILING_WINDOW_SEC, LOUDNESS_MARGIN_DB);
  const chatPasses = chat ? aboveTrailingAverage(chat, TRAILING_WINDOW_SEC, CHAT_MARGIN) : null;
  const quiet = quietThenLoud(loudSmoothed);
  // A jump out of silence or a burst of paid messages can lift a moment over quieter rivals.
  const gated = score.map((s, t) => (audioPasses[t] || chatPasses?.[t] ? Math.min(1, s * (1 + 0.25 * quiet[t] + 0.15 * (paid?.[t] ?? 0))) : 0));

  // Long streams usually open and close on waiting screens and outros.
  const edge = duration > LONG_VIDEO_SEC ? LONG_VIDEO_EDGE_SEC : 0;
  const peaks = pickPeaks(gated, {
    max: Math.min(MAX_CANDIDATES, clipCount * CANDIDATE_MULTIPLIER),
    skipStart: edge,
    skipEnd: edge,
  });

  const window = windowAround(length);
  const candidates = peaks.map((raw, id): Candidate => {
    const peakSec = refinePeak(raw, primary);
    const lag = chatLagSec ?? 0;
    return {
      id,
      peakSec,
      windowStart: Math.max(0, peakSec - window.before),
      windowEnd: Math.min(duration, peakSec + window.after),
      score: gated[raw],
      voice: voice ? voice[raw] : 0,
      loudness: loudness[raw],
      chat: chat ? chat[raw] : null,
      laughter: null,
      shout: null,
      chatSample: sampleChat(messages, peakSec + lag - 8, peakSec + lag + 15),
      words: [],
      extra: { quietBefore: quiet[raw], ...(paid && emotes ? { paidChat: paid[raw], emotes: emotes[raw] } : {}) },
    };
  });

  return {
    candidates,
    summary: {
      chatLevel: level,
      chatMessagesPerHour: Math.round(perHour),
      chatLagSec,
      chatLagMeasured,
      speechCoverage,
      hasCommentary,
    },
  };
}

/** Laughter and shouting lift a moment; a model confirmed these, so they get real weight. */
export function applyReactionBoost(candidates: Candidate[]): Candidate[] {
  return candidates
    .map((c) => ({ ...c, score: Math.min(1, c.score * (1 + 0.6 * Math.max(c.laughter ?? 0, c.shout ?? 0))) }))
    .sort((a, b) => b.score - a.score);
}
