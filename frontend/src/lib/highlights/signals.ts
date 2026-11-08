import type { ChatMessage } from "./types";

/** Centered moving average that ignores NaN gaps. A second with no data stays NaN. */
export function smooth(series: number[], radius: number): number[] {
  const n = series.length;
  const sum = new Float64Array(n + 1);
  const count = new Int32Array(n + 1);
  for (let i = 0; i < n; i++) {
    const ok = Number.isFinite(series[i]);
    sum[i + 1] = sum[i] + (ok ? series[i] : 0);
    count[i + 1] = count[i] + (ok ? 1 : 0);
  }
  return series.map((v, i) => {
    if (!Number.isFinite(v)) return NaN;
    const lo = Math.max(0, i - radius);
    const hi = Math.min(n, i + radius + 1);
    return (sum[hi] - sum[lo]) / (count[hi] - count[lo]);
  });
}

function median(sorted: Float64Array): number {
  if (!sorted.length) return NaN;
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Rolling median/MAD z-score. A local baseline matters because a stream changes over
 * hours. NaN seconds are left out of the baseline and score 0.
 */
export function robustZ(series: number[], minScale: number, halfWindow = 300, hop = 5): number[] {
  const out = new Array<number>(series.length).fill(0);
  for (let g = 0; g < series.length; g += hop) {
    const win = Float64Array.from(series.slice(Math.max(0, g - halfWindow), g + halfWindow).filter(Number.isFinite)).sort();
    if (!win.length) continue;
    const base = median(win);
    const dev = Float64Array.from(win, (v) => Math.abs(v - base)).sort();
    const scale = Math.max(minScale, 1.4826 * median(dev));
    for (let t = g; t < Math.min(g + hop, series.length); t++) {
      if (Number.isFinite(series[t])) out[t] = (series[t] - base) / scale;
    }
  }
  return out;
}

/** Maps z-scores to 0..1: below `low` is ordinary, `high` and above is a maximal spike. */
export function zToUnit(z: number[], low = 1, high = 5): number[] {
  return z.map((v) => Math.min(1, Math.max(0, (v - low) / (high - low))));
}

/**
 * True where a second is above the average of the window just before it, by at least
 * `margin`. After a long gap there is nothing to compare against, so a second passes.
 */
export function aboveTrailingAverage(series: number[], windowSec: number, margin: number, minSamples = 5): boolean[] {
  const n = series.length;
  const sum = new Float64Array(n + 1);
  const count = new Int32Array(n + 1);
  for (let i = 0; i < n; i++) {
    const ok = Number.isFinite(series[i]);
    sum[i + 1] = sum[i] + (ok ? series[i] : 0);
    count[i + 1] = count[i] + (ok ? 1 : 0);
  }
  return series.map((v, t) => {
    if (!Number.isFinite(v)) return false;
    const lo = Math.max(0, t - windowSec);
    const samples = count[t] - count[lo];
    if (samples < minSamples) return true;
    return v > (sum[t] - sum[lo]) / samples + margin;
  });
}

function normalizeMessage(text: string): string {
  return text
    .toLowerCase()
    .replace(/(.)\1{2,}/gu, "$1$1")
    .replace(/[^\p{L}\p{N}\p{Extended_Pictographic}:]/gu, "");
}

function bigrams(text: string): Set<string> {
  const chars = [...text];
  if (chars.length < 2) return new Set([text]);
  const out = new Set<string>();
  for (let i = 0; i < chars.length - 1; i++) out.add(chars[i] + chars[i + 1]);
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let shared = 0;
  for (const x of a) if (b.has(x)) shared++;
  return shared / (a.size + b.size - shared);
}

/**
 * How much a group of messages looks like a crowd reacting together: the same or
 * similar short lines. Written with no word list, so it works in any language.
 */
export function chatReactionQuality(texts: string[]): number {
  const norm = texts.map(normalizeMessage).filter(Boolean);
  if (norm.length < 2) return 0;
  const repetition = 1 - new Set(norm).size / norm.length;
  const sets = norm.slice(0, 40).map(bigrams);
  let total = 0;
  let pairs = 0;
  for (let i = 0; i < sets.length; i++) {
    for (let j = i + 1; j < sets.length; j++) {
      total += jaccard(sets[i], sets[j]);
      pairs++;
    }
  }
  const short = norm.filter((t) => [...t].length <= 12).length / norm.length;
  return 0.5 * (total / pairs) + 0.3 * repetition + 0.2 * short;
}

function logGamma(x: number): number {
  return (x - 0.5) * Math.log(x) - x + 0.5 * Math.log(2 * Math.PI) + 1 / (12 * x) - 1 / (360 * x ** 3);
}

/** -log10 of P(X >= k) for a Poisson rate: how unusual this many messages is. */
export function poissonSurprise(k: number, lambda: number): number {
  if (k <= lambda) return 0;
  let logTerm = k * Math.log(lambda) - lambda - logGamma(k + 1);
  let tail = 1;
  let ratio = 1;
  for (let i = 1; i < 60; i++) {
    ratio *= lambda / (k + i);
    tail += ratio;
    if (ratio < 1e-6) break;
  }
  logTerm += Math.log(tail);
  return Math.max(0, -logTerm / Math.LN10);
}

const CHAT_WINDOW_SEC = 15;
const CHAT_HOP_SEC = 5;
const MIN_LAMBDA = 0.15;
const MIN_DISTINCT_AUTHORS = 2;
const MAX_PER_AUTHOR = 3;

/**
 * Per-second chat surge, 0..1. Uses how improbable a window's count is given that
 * stream's own usual rate, so three people reacting at once registers on a tiny
 * channel, while a big chat needs a much larger jump.
 */
export function chatSurge(messages: ChatMessage[], durationSec: number): number[] {
  const sorted = [...messages].sort((a, b) => a.t - b.t);
  const hops = Math.ceil(durationSec / CHAT_HOP_SEC);
  const counts = new Array<number>(hops).fill(0);
  const windows: ChatMessage[][] = [];

  let first = 0;
  for (let h = 0; h < hops; h++) {
    const from = h * CHAT_HOP_SEC;
    while (first < sorted.length && sorted[first].t < from) first++;
    const inWindow: ChatMessage[] = [];
    const perAuthor = new Map<string, number>();
    for (let i = first; i < sorted.length && sorted[i].t < from + CHAT_WINDOW_SEC; i++) {
      const seen = perAuthor.get(sorted[i].author) ?? 0;
      perAuthor.set(sorted[i].author, seen + 1);
      if (seen < MAX_PER_AUTHOR) inWindow.push(sorted[i]);
    }
    counts[h] = inWindow.length;
    windows.push(inWindow);
  }

  const halfHops = Math.round(300 / CHAT_HOP_SEC);
  const out = new Array<number>(durationSec).fill(0);
  for (let h = 0; h < hops; h++) {
    if (new Set(windows[h].map((m) => m.author)).size < MIN_DISTINCT_AUTHORS) continue;
    const around = Float64Array.from(counts.slice(Math.max(0, h - halfHops), h + halfHops)).sort();
    const surprise = poissonSurprise(counts[h], Math.max(MIN_LAMBDA, median(around)));
    if (surprise < 2) continue;
    const base = Math.min(1, (surprise - 2) / 4);
    const value = Math.min(1, base * (0.7 + 0.6 * chatReactionQuality(windows[h].map((m) => m.text))));
    for (let t = h * CHAT_HOP_SEC; t < Math.min(durationSec, (h + 1) * CHAT_HOP_SEC); t++) out[t] = value;
  }
  return out;
}

function pearson(a: number[], b: number[], lag: number): number {
  const n = a.length - lag;
  if (n < 2) return 0;
  let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i];
    const y = b[i + lag];
    sa += x; sb += y; saa += x * x; sbb += y * y; sab += x * y;
  }
  const denom = Math.sqrt((n * saa - sa * sa) * (n * sbb - sb * sb));
  return denom === 0 ? 0 : (n * sab - sa * sb) / denom;
}

/** Chat reacts seconds after the moment; measured per video, with a fallback. */
export function estimateChatLag(
  voiceUnit: number[],
  chatUnit: number[],
  minLag = 3,
  maxLag = 30,
  defaultLag = 15
): { lagSec: number; measured: boolean } {
  let best = defaultLag;
  let bestR = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag++) {
    const r = pearson(voiceUnit, chatUnit, lag);
    if (r > bestR) {
      bestR = r;
      best = lag;
    }
  }
  return bestR >= 0.1 ? { lagSec: best, measured: true } : { lagSec: defaultLag, measured: false };
}

export function shiftEarlier(series: number[], lag: number): number[] {
  return series.map((_, i) => series[i + lag] ?? 0);
}

/** How much to trust chat: full at 500 messages/hour, a small corroborating share below. */
export function chatReliability(messagesPerHour: number): number {
  return Math.max(0.3, Math.min(1, messagesPerHour / 500));
}

/**
 * Weighted fusion over the signals present. The streamer's voice leads because it
 * exists on every commentary stream however small the audience; raw loudness is
 * minor because it rewards gunfire. Agreement adds a smooth bonus.
 */
export function fuseSignals(
  voice: number[] | null,
  loudness: number[],
  chat: number[] | null,
  reliability: number
): number[] {
  const wVoice = voice ? 0.5 : 0;
  const wLoud = voice ? 0.1 : 0.6;
  const wChat = chat ? 0.4 * reliability : 0;
  const total = wVoice + wLoud + wChat;
  return loudness.map((l, t) => {
    const v = voice?.[t] ?? 0;
    const c = chat?.[t] ?? 0;
    const base = (wVoice * v + wLoud * l + wChat * c) / total;
    return Math.min(1, base * (1 + 0.5 * Math.sqrt(v * c)));
  });
}

/** Greedy non-maximum suppression: strongest seconds first, spaced at least `minGapSec`. */
export function pickPeaks(
  score: number[],
  opts: { max: number; minGapSec?: number; minScore?: number; skipStart?: number; skipEnd?: number }
): number[] {
  const { max, minGapSec = 60, minScore = 0.15, skipStart = 0, skipEnd = 0 } = opts;
  const order = score
    .map((s, t) => ({ s, t }))
    .filter(({ s, t }) => s >= minScore && t >= skipStart && t < score.length - skipEnd)
    .sort((a, b) => b.s - a.s || a.t - b.t);
  const peaks: number[] = [];
  for (const { t } of order) {
    if (peaks.length >= max) break;
    if (peaks.every((p) => Math.abs(p - t) >= minGapSec)) peaks.push(t);
  }
  return peaks;
}

/** Moves a smoothed peak onto the most excited second close by. */
export function refinePeak(peak: number, signal: number[], before = 6, after = 3): number {
  let best = peak;
  for (let t = Math.max(0, peak - before); t <= Math.min(signal.length - 1, peak + after); t++) {
    if (signal[t] > signal[best]) best = t;
  }
  return best;
}

/** The most repeated chat lines in a time range, as `text (xN)`. */
export function sampleChat(messages: ChatMessage[], fromSec: number, toSec: number, limit = 25): string[] {
  const counts = new Map<string, { text: string; n: number }>();
  for (const m of messages) {
    if (m.t < fromSec || m.t > toSec) continue;
    const text = m.text.trim().slice(0, 120);
    if (!text) continue;
    const key = text.toLowerCase();
    const entry = counts.get(key);
    if (entry) entry.n++;
    else counts.set(key, { text, n: 1 });
  }
  return [...counts.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, limit)
    .map(({ text, n }) => (n > 1 ? `${text} (x${n})` : text));
}

const QUIET_SEC = 8;
const QUIET_GAP_SEC = 1;
const QUIET_MIN_RISE_DB = 10;
const QUIET_FULL_RISE_DB = 25;
const MIN_QUIET_SAMPLES = 4;

/** A sudden jump out of a quiet stretch, 0..1: the tension before a big reaction. */
export function quietThenLoud(db: number[]): number[] {
  return db.map((level, t) => {
    if (!Number.isFinite(level)) return 0;
    const before = db.slice(Math.max(0, t - QUIET_SEC - QUIET_GAP_SEC), Math.max(0, t - QUIET_GAP_SEC)).filter(Number.isFinite);
    if (before.length < MIN_QUIET_SAMPLES) return 0;
    const rise = level - before.reduce((a, b) => a + b, 0) / before.length;
    return Math.min(1, Math.max(0, (rise - QUIET_MIN_RISE_DB) / (QUIET_FULL_RISE_DB - QUIET_MIN_RISE_DB)));
  });
}

const PAID_FOR_FULL = 3;
const EMOTE_FULL_COUNT = 10;

/** Per-second paid-message and emote activity, 0..1, from the same windows as the chat surge. */
export function chatExtras(messages: ChatMessage[], durationSec: number): { paid: number[]; emotes: number[] } {
  const paid = new Array<number>(durationSec).fill(0);
  const emotes = new Array<number>(durationSec).fill(0);
  const sorted = [...messages].sort((a, b) => a.t - b.t);
  let first = 0;
  for (let h = 0; h * CHAT_HOP_SEC < durationSec; h++) {
    const from = h * CHAT_HOP_SEC;
    while (first < sorted.length && sorted[first].t < from) first++;
    let total = 0;
    let paidCount = 0;
    let emoteCount = 0;
    for (let i = first; i < sorted.length && sorted[i].t < from + CHAT_WINDOW_SEC; i++) {
      total++;
      if (sorted[i].paid) paidCount++;
      if (sorted[i].emotes) emoteCount++;
    }
    const emoteValue = total ? (emoteCount / total) * Math.min(1, emoteCount / EMOTE_FULL_COUNT) : 0;
    for (let t = from; t < Math.min(durationSec, from + CHAT_HOP_SEC); t++) {
      paid[t] = Math.min(1, paidCount / PAID_FOR_FULL);
      emotes[t] = emoteValue;
    }
  }
  return { paid, emotes };
}

/** Twitch chat as saved by TwitchDownloader, or null if this isn't that kind of file. */
function parseTwitchChat(text: string): ChatMessage[] | null {
  if (!text.trimStart().startsWith("{")) return null;
  let root: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    root = JSON.parse(text);
  } catch {
    return null;
  }
  if (!Array.isArray(root?.comments)) return null;
  const messages: ChatMessage[] = [];
  for (const c of root.comments) {
    const t = Number(c?.content_offset_seconds);
    if (!Number.isFinite(t) || !c?.message) continue;
    const emotes = (c.message.fragments ?? []).filter((f: any) => f?.emoticon).length || (c.message.emoticons?.length ?? 0); // eslint-disable-line @typescript-eslint/no-explicit-any
    messages.push({
      t,
      author: String(c.commenter?._id ?? c.commenter?.name ?? ""),
      text: String(c.message.body ?? ""),
      ...(Number(c.message.bits_spent) > 0 || c.message.user_notice_params?.["msg-id"] ? { paid: true } : {}),
      ...(emotes ? { emotes } : {}),
    });
  }
  return messages;
}

/** Reads a saved chat replay: a YouTube live-chat file or a Twitch JSON file. Bad lines are skipped. */
export function parseLiveChat(raw: string): ChatMessage[] {
  const twitch = parseTwitchChat(raw);
  if (twitch) return twitch;
  const messages: ChatMessage[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    let entry: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    const replay = entry?.replayChatItemAction;
    const t = Number(replay?.videoOffsetTimeMsec) / 1000;
    if (!Number.isFinite(t)) continue;
    for (const action of replay.actions ?? []) {
      const item = action?.addChatItemAction?.item;
      const paidRenderer = item?.liveChatPaidMessageRenderer ?? item?.liveChatPaidStickerRenderer ?? item?.liveChatMembershipItemRenderer;
      const renderer = item?.liveChatTextMessageRenderer ?? paidRenderer;
      if (!renderer) continue;
      const runs = renderer.message?.runs ?? [];
      const text = runs
        .map((r: any) => r.text ?? r.emoji?.shortcuts?.[0] ?? r.emoji?.emojiId ?? "") // eslint-disable-line @typescript-eslint/no-explicit-any
        .join("");
      const emotes = runs.filter((r: any) => r.emoji).length; // eslint-disable-line @typescript-eslint/no-explicit-any
      messages.push({ t, author: renderer.authorExternalChannelId ?? "", text, ...(paidRenderer ? { paid: true } : {}), ...(emotes ? { emotes } : {}) });
    }
  }
  return messages;
}
