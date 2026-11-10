import type { Candidate, ClipResult, MomentExtras, Rating, Word } from "./types";
import { HYPE_PHRASES, SAME_WORD } from "./hypePhrases.ts";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

type NumericExtra = Exclude<keyof MomentExtras, "hypePhrase" | "screenWords">;

/**
 * How much each extra signal can lift a moment. Judgment calls until real ratings replace
 * them: signals that are precise about a big moment count most, and those that fire
 * constantly in ordinary play count least.
 */
const EXTRA_WEIGHTS: Record<NumericExtra, number> = {
  // Said out loud at a spike: the most direct evidence there is.
  hype: 0.35,
  // Game fonts read badly, and kill feeds show these words all match long.
  screenText: 0.15,
  // Gunfire is near-constant in shooters, so it says little by itself.
  gameSound: 0.1,
  speechBurst: 0.1,
  emotes: 0.1,
  // Already lifted once when moments are picked.
  quietBefore: 0.08,
  paidChat: 0.08,
  motion: 0.08,
  // Expression scores on small webcam crops ran high on ordinary moments in testing.
  face: 0.08,
  voices: 0.05,
  camMotion: 0.05,
  // Menus and loading screens are scene changes too.
  sceneCut: 0.02,
};

/** Base signals already count once, so ratings can only nudge them. */
const BASE_TASTE_WEIGHT = 0.3;
const BASE_SIGNALS = ["voice", "laughter", "shout", "chat"] as const;

const MIN_RATINGS = 8;
const MIN_PER_SIDE = 2;
const MIN_SIGNAL_SAMPLES = 4;
const TASTE_STRENGTH = 2;
const TASTE_MIN = 0.5;
const TASTE_MAX = 1.5;

export type Taste = Record<string, number>;

export interface RatedSignals {
  rating: Rating;
  signals: ClipResult["signals"];
}

/** One flat list of a clip's numeric signals. Missing ones are left out, not zeroed. */
function flatten(signals: ClipResult["signals"]): Record<string, number> {
  const out: Record<string, number> = {};
  const add = (key: string, value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
  };
  add("voice", signals.voice);
  add("laughter", signals.laughter);
  add("shout", signals.shout);
  add("chat", signals.chat);
  for (const key of Object.keys(EXTRA_WEIGHTS)) add(key, signals.extra?.[key as NumericExtra]);
  return out;
}

const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

/**
 * Compares liked clips with disliked ones, signal by signal. A signal stronger in liked
 * clips gets more say, within limits, and only once there are enough ratings to mean anything.
 */
export function learnTaste(ratings: RatedSignals[]): Taste {
  const liked = ratings.filter((r) => r.rating === "up").map((r) => flatten(r.signals));
  const disliked = ratings.filter((r) => r.rating === "down").map((r) => flatten(r.signals));
  if (ratings.length < MIN_RATINGS || liked.length < MIN_PER_SIDE || disliked.length < MIN_PER_SIDE) return {};
  const taste: Taste = {};
  for (const key of [...BASE_SIGNALS, ...Object.keys(EXTRA_WEIGHTS)]) {
    const up = liked.map((s) => s[key]).filter((v) => v !== undefined);
    const down = disliked.map((s) => s[key]).filter((v) => v !== undefined);
    if (up.length + down.length < MIN_SIGNAL_SAMPLES || !up.length || !down.length) continue;
    taste[key] = Math.min(TASTE_MAX, Math.max(TASTE_MIN, 1 + (mean(up) - mean(down)) * TASTE_STRENGTH));
  }
  return taste;
}

/** Lifts or lowers a score without ever passing 1, so strong moments stay distinguishable. */
function adjusted(score: number, change: number): number {
  return change >= 0 ? score + (1 - score) * (1 - Math.exp(-change)) : score * Math.exp(change);
}

/** Applies every extra signal, and the creator's taste, then re-ranks. */
export function applyMoments(candidates: Candidate[], taste: Taste = {}): Candidate[] {
  return candidates
    .map((c) => {
      const signals = flatten({ voice: c.voice, chat: c.chat, laughter: c.laughter, shout: c.shout, extra: c.extra });
      let change = 0;
      for (const [key, weight] of Object.entries(EXTRA_WEIGHTS)) change += weight * (signals[key] ?? 0) * (taste[key] ?? 1);
      for (const key of BASE_SIGNALS) change += BASE_TASTE_WEIGHT * (signals[key] ?? 0) * ((taste[key] ?? 1) - 1);
      return { ...c, score: adjusted(c.score, change) };
    })
    .sort((a, b) => b.score - a.score);
}

const SAME_WORDS = new Map(Object.entries(SAME_WORD));

/** Reduces text to comparable words, so "BHAIII kya hogya" reads the same as "bhai kya ho gaya". Keeps Hindi vowel signs. */
function hypeWords(text: string): string[] {
  const plain = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f\u0901\u0902\u093c'’]/g, "").replace(/[^\p{L}\p{N}\p{M}\s]/gu, " ");
  return plain.split(/\s+/).filter(Boolean).flatMap((word) => {
    const single = word.replace(/(.)\1+/gu, "$1");
    return (SAME_WORDS.get(single) ?? single).split(" ");
  });
}

const HYPE_LOOKUP = new Map<string, string>();
for (const phrase of HYPE_PHRASES) {
  const key = hypeWords(phrase).join(" ");
  if (!HYPE_LOOKUP.has(key)) HYPE_LOOKUP.set(key, phrase);
}
const LONGEST_HYPE = Math.max(...[...HYPE_LOOKUP.keys()].map((key) => key.split(" ").length));

/** Distinct phrases once spelling variants are merged. */
export const HYPE_PHRASE_COUNT = HYPE_LOOKUP.size;

/** Phrases people say at big moments, found in speech or chat. The longest match wins, so one shout counts once. */
export function findHype(text: string): string[] {
  const words = hypeWords(text);
  const found = new Set<string>();
  for (let i = 0; i < words.length; ) {
    let matched = 0;
    for (let n = Math.min(LONGEST_HYPE, words.length - i); n > 0 && !matched; n--) {
      const phrase = HYPE_LOOKUP.get(words.slice(i, i + n).join(" "));
      if (phrase) {
        found.add(phrase);
        matched = n;
      }
    }
    i += matched || 1;
  }
  return [...found];
}

const MIN_CHAT_MESSAGES = 2;

/** One viewer's "omg" is nothing in a busy chat, so a phrase has to come from at least two messages. */
function chatHype(lines: string[]): string[] {
  const counts = new Map<string, number>();
  for (const line of lines) {
    const repeats = Number(line.match(/\(x(\d+)\)$/)?.[1] ?? 1);
    for (const phrase of findHype(line)) counts.set(phrase, (counts.get(phrase) ?? 0) + repeats);
  }
  return [...counts].filter(([, n]) => n >= MIN_CHAT_MESSAGES).map(([phrase]) => phrase);
}

const HYPE_BEFORE_SEC = 6;
const HYPE_AFTER_SEC = 8;
const BURST_BEFORE_SEC = 4;
const BURST_AFTER_SEC = 3;
const MIN_WORDS_FOR_PACE = 10;

function wordsPerSecond(words: Word[], from: number, to: number): number {
  return words.filter((w) => w.start >= from && w.start < to).length / Math.max(1, to - from);
}

/** What the words around the peak say: hype phrases and a sudden rush of speech. */
export function speechExtras(c: Pick<Candidate, "words" | "peakSec" | "windowStart" | "windowEnd" | "chatSample">): MomentExtras {
  const near = c.words.filter((w) => w.end >= c.peakSec - HYPE_BEFORE_SEC && w.start <= c.peakSec + HYPE_AFTER_SEC).map((w) => w.text).join(" ");
  const phrases = [...new Set([...findHype(near), ...chatHype(c.chatSample)])];
  const extras: MomentExtras = { hype: phrases.length ? clamp01(0.5 + 0.25 * (phrases.length - 1)) : 0 };
  if (phrases.length) extras.hypePhrase = phrases[0];
  if (c.words.length >= MIN_WORDS_FOR_PACE) {
    const heardFrom = Math.max(c.windowStart, c.words[0].start);
    const heardTo = Math.min(c.windowEnd, c.words[c.words.length - 1].end);
    const usual = wordsPerSecond(c.words, heardFrom, heardTo);
    const burst = wordsPerSecond(c.words, c.peakSec - BURST_BEFORE_SEC, c.peakSec + BURST_AFTER_SEC);
    extras.speechBurst = usual > 0 ? clamp01((burst / usual - 1) / 1.5) : 0;
  }
  return extras;
}

const CALM_BEFORE_SEC = 4;
const ACTIVE_BEFORE_SEC = 3;
const ACTIVE_AFTER_SEC = 6;
const CUT_DIFF = 0.18;
const CUTS_FOR_FULL = 2;

/** On-screen movement around the peak compared with just before it. Frames are grayscale, same size. */
export function motionStats(frames: Uint8Array[], times: number[], peakSec: number): { motion: number; sceneCut: number } {
  const diffs = frames.slice(1).map((frame, i) => {
    let sum = 0;
    for (let p = 0; p < frame.length; p++) sum += Math.abs(frame[p] - frames[i][p]);
    return { t: times[i + 1], value: sum / (frame.length * 255) };
  });
  const calm = diffs.filter((d) => d.t < peakSec - CALM_BEFORE_SEC).map((d) => d.value).sort((a, b) => a - b);
  const active = diffs.filter((d) => d.t >= peakSec - ACTIVE_BEFORE_SEC && d.t <= peakSec + ACTIVE_AFTER_SEC).map((d) => d.value);
  if (!calm.length || !active.length) return { motion: 0, sceneCut: 0 };
  const usual = calm[calm.length >> 1];
  return {
    motion: clamp01((mean(active) / (usual + 0.01) - 1) / 2),
    sceneCut: clamp01(active.filter((v) => v >= CUT_DIFF).length / CUTS_FOR_FULL),
  };
}

const REACTING_MOODS = new Set(["happy", "surprise", "fear", "angry"]);

export type MoodScores = { label: string; score: number }[];
const reacting = (moods: MoodScores) => moods.reduce((best, m) => (REACTING_MOODS.has(m.label) ? Math.max(best, m.score) : best), 0);

/** How much more expressive a face became. Someone who always smiles doesn't count. */
export function faceChange(before: MoodScores[], during: MoodScores[]): number {
  if (!before.length || !during.length) return 0;
  return clamp01((Math.max(...during.map(reacting)) - mean(before.map(reacting))) / 0.5);
}

const SCREEN_WORDS = /\b(victory|winner|champion|eliminated|knocked|killed|headshot|clutch|ace|double kill|triple kill|quadra ?kill|penta ?kill|multi ?kill|first blood|slain|defeat|game over|you died|wasted|mvp|round won|round lost|level up)\b/g;

/** Game-announcement words read off the screen. */
export function matchScreenWords(text: string): string[] {
  return [...new Set(text.toLowerCase().replace(/\s+/g, " ").match(SCREEN_WORDS) ?? [])];
}

/** True when a number on the scoreboard went up. Unreadable or reshaped scoreboards are ignored. */
export function scoreChanged(before: string, after: string): boolean {
  const digits = (s: string) => (s.match(/\d+/g) ?? []).map(Number);
  const a = digits(before);
  const b = digits(after);
  return a.length > 0 && a.length === b.length && a.every((v, i) => b[i] >= v) && a.some((v, i) => b[i] - v >= 1 && b[i] - v <= 5);
}

export function screenScore(words: string[], changed: boolean): number {
  return clamp01((words.length ? 0.5 + 0.2 * (words.length - 1) : 0) + (changed ? 0.4 : 0));
}

const LABELS: [NumericExtra, string][] = [
  ["gameSound", "game sounds"],
  ["voices", "several voices"],
  ["quietBefore", "quiet, then loud"],
  ["speechBurst", "talking faster"],
  ["paidChat", "paid chat"],
  ["emotes", "emote spike"],
  ["motion", "big on-screen action"],
  ["sceneCut", "scene change"],
  ["face", "face reaction"],
  ["camMotion", "movement on camera"],
];
const NOTICE_FROM = 0.3;

/** Short plain phrases for what stood out in a clip. */
export function noticed(extra: MomentExtras | undefined): string[] {
  if (!extra) return [];
  const out = LABELS.filter(([key]) => (extra[key] ?? 0) >= NOTICE_FROM).map(([key, label]) => `${label} ${Math.round((extra[key] ?? 0) * 100)}%`);
  if (extra.hypePhrase) out.unshift(`heard “${extra.hypePhrase}”`);
  if (extra.screenWords?.length) out.unshift(`on screen: ${extra.screenWords.join(", ")}`);
  else if ((extra.screenText ?? 0) >= NOTICE_FROM) out.push("score changed");
  return out;
}

/** The extra signals that rank a clip, for explaining its place. */
export function extraRankSignals(extra: MomentExtras | undefined): { label: string; value: number }[] {
  return [
    { label: "game sounds", value: extra?.gameSound ?? 0 },
    { label: "hype phrases", value: extra?.hype ?? 0 },
    { label: "on-screen text", value: extra?.screenText ?? 0 },
    { label: "face reaction", value: extra?.face ?? 0 },
  ];
}
