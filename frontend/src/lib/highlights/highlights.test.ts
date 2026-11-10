import test from "node:test";
import assert from "node:assert/strict";
import { aboveTrailingAverage, chatReactionQuality, chatReliability, chatSurge, estimateChatLag, parseLiveChat, poissonSurprise, robustZ } from "./signals.ts";
import { VoiceAnalyzer } from "./voice.ts";
import { analyzeSignals } from "./analyze.ts";
import { applyVerdicts, clampClip, collapseRepeats, explainRanks, findNaturalEnd, findNaturalStart, finishSentence, judgeSystem, lengthLimits, MAX_CLIP_SEC, MIN_CLIP_SEC, quoteAtPeak, selectBySignals, snapToWords, type Verdict } from "./selection.ts";
import { captionAt, chunkWords } from "./captions.ts";
import { HYPE_PHRASE_COUNT, applyMoments, faceChange, findHype, learnTaste, matchScreenWords, motionStats, noticed, scoreChanged, screenScore, speechExtras } from "./moments.ts";
import { chatExtras, quietThenLoud } from "./signals.ts";
import { buildUserPrompt } from "./selection.ts";
import { hashKey, resumableSettings, sourceFingerprint } from "./storage.ts";
import { CANVAS_H, CANVAS_W, DEFAULT_CAPTIONS, DEFAULT_FRAMING, SAFE_BOTTOM, SAFE_TOP, TEMPLATES, captionOffsetRange, placeCaption, settleCaption, fitRegion, planFrame, regionRatio, resizeRegion, stretchRegion, wrapTitle } from "./templates.ts";
import { detectProvider, pickDefaultModel } from "./models.ts";
import { applyCaptionEdits, clipWords } from "./captions.ts";
import { checkBeforeStart } from "./preflight.ts";
import { GENTLE_SLOWDOWN, breathe, setGentle } from "./pace.ts";
import { buildPostPrompt, cleanPostText, parsePostText, postSystem, tiktokCaption } from "./postText.ts";
import { parseYouTubeId, studioUrl } from "./youtube.ts";
import { WAVE_SLICES, overallProgress, stageLabel, waveformBars } from "./progress.ts";
import { friendlyError } from "./errors.ts";
import { buildReport, needsMessage, reportToText } from "../report.ts";
import type { AudioFeatures, Candidate, ChatMessage, RunOptions } from "./types";

function rng(seed: number) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

/** A talking streamer at a steady level, with planted excited seconds. */
function stream(duration: number, excited: number[], seed = 7): AudioFeatures {
  const random = rng(seed);
  const f: AudioFeatures = { loudnessDb: [], voicedRatio: [], voicedDb: [], pitchHz: [] };
  for (let t = 0; t < duration; t++) {
    const hot = excited.some((m) => t >= m && t < m + 5);
    const talking = random() < 0.6 || hot;
    const db = -28 + random() * 2 + (hot ? 12 : 0);
    f.loudnessDb.push(db);
    f.voicedRatio.push(talking ? 0.7 : 0);
    f.voicedDb.push(talking ? db : NaN);
    f.pitchHz.push(talking ? 140 + random() * 10 + (hot ? 90 : 0) : NaN);
  }
  return f;
}

const near = (cands: Candidate[], t: number, tol = 8) => cands.some((c) => Math.abs(c.peakSec - t) <= tol);

test("finds voice spikes on a stream with no chat at all", () => {
  const { candidates, summary } = analyzeSignals(stream(3600, [700, 2500]), [], 2);
  assert.equal(summary.chatLevel, "none");
  assert.ok(near(candidates, 700) && near(candidates, 2500), `${candidates.map((c) => c.peakSec)}`);
});

test("a steady stream gives no candidates rather than invented ones", () => {
  assert.equal(analyzeSignals(stream(3600, []), [], 3).candidates.length, 0);
});

test("a moment must beat the average of the window before it", () => {
  const series = [...new Array(200).fill(-30), ...new Array(5).fill(-20), ...new Array(300).fill(-20)];
  const passes = aboveTrailingAverage(series, 120, 3);
  assert.equal(passes[100], false, "ordinary second");
  assert.equal(passes[201], true, "jump above recent average");
  assert.equal(passes[450], false, "stays loud, so the new level becomes normal");
});

test("speaking after a long silence still counts", () => {
  const series = [...new Array(300).fill(NaN), -30];
  assert.equal(aboveTrailingAverage(series, 120, 3)[300], true);
});

test("a handful of viewers reacting together registers on a tiny channel", () => {
  const quiet: ChatMessage[] = Array.from({ length: 8 }, (_, i) => ({ t: 100 + i * 400, author: `a${i}`, text: "hey" }));
  const burst = ["LOL", "lol", "LOOOL", "lmao"].map((text, i) => ({ t: 1500 + i, author: `v${i}`, text }));
  assert.ok(chatSurge([...quiet, ...burst], 3600)[1500] > 0.3);
});

test("one chatter on their own is not a surge", () => {
  const solo = Array.from({ length: 12 }, (_, i) => ({ t: 500 + i, author: "same", text: "wow" }));
  assert.equal(Math.max(...chatSurge(solo, 3600)), 0);
});

test("the same count is ordinary in a big chat but rare in a small one", () => {
  assert.ok(poissonSurprise(6, 0.2) > 6);
  assert.equal(poissonSurprise(6, 20), 0);
});

test("repeated reactions outrank unrelated chatter, in any language", () => {
  const same = chatReactionQuality(["हाहाहा", "हाहाहाहा", "हाहा", "हाहाहा"]);
  const mixed = chatReactionQuality(["what rank are you", "nice stream today", "where are you from", "drop the settings"]);
  assert.ok(same > mixed + 0.2, `${same} vs ${mixed}`);
});

test("chat counts for less when it is sparse, but never nothing", () => {
  assert.equal(chatReliability(20), 0.3);
  assert.equal(chatReliability(2000), 1);
});

test("a thin chat cannot override the voice ranking", () => {
  const f = stream(3600, [800]);
  const chat = ["a", "b", "c"].map((author, i) => ({ t: 2000 + i, author, text: "lol" }));
  const { candidates } = analyzeSignals(f, chat, 1);
  assert.ok(Math.abs(candidates[0].peakSec - 800) <= 8, `${candidates[0].peakSec}`);
});

test("an unmeasurable lag is reported as unmeasured and uses the fallback", () => {
  assert.deepEqual(estimateChatLag(new Array(200).fill(0), new Array(200).fill(0)), { lagSec: 15, measured: false });
  const f = stream(3600, [900]);
  const { summary } = analyzeSignals(f, ["a", "b", "c", "d", "e"].map((author, i) => ({ t: 3000 + i, author, text: "x" })), 1);
  assert.equal(summary.chatLagMeasured, false);
});

function analyzeTone(make: (t: number) => number, seconds: number): AudioFeatures {
  const rate = 48000;
  const a = new VoiceAnalyzer(rate);
  const buf = new Float32Array(rate * seconds);
  for (let i = 0; i < buf.length; i++) buf[i] = make(i / rate);
  // Delivered in pieces, as a decoder would.
  for (let i = 0; i < buf.length; i += 1024) a.push(buf.subarray(i, i + 1024));
  return a.finish();
}

test("a voice-like harmonic tone is voiced, and its pitch is measured", () => {
  const f = analyzeTone((t) => 0.2 * Math.sin(2 * Math.PI * 180 * t) + 0.1 * Math.sin(2 * Math.PI * 360 * t), 4);
  assert.equal(f.loudnessDb.length, 4);
  assert.ok(f.voicedRatio[1] > 0.9);
  assert.ok(Math.abs(f.pitchHz[1] - 180) < 12, `${f.pitchHz[1]}`);
});

test("gunfire-like noise is loud but is not treated as speech", () => {
  const random = rng(11);
  const f = analyzeTone(() => 0.5 * (random() * 2 - 1), 4);
  assert.ok(f.loudnessDb[1] > -20);
  assert.ok(f.voicedRatio[1] < 0.1, `${f.voicedRatio[1]}`);
  assert.ok(Number.isNaN(f.voicedDb[1]));
});

test("no-commentary streams fall back to loudness and say so", () => {
  const f: AudioFeatures = {
    loudnessDb: Array.from({ length: 3600 }, (_, t) => (t >= 1000 && t < 1006 ? -14 : -30 + (t % 3))),
    voicedRatio: new Array(3600).fill(0),
    voicedDb: new Array(3600).fill(NaN),
    pitchHz: new Array(3600).fill(NaN),
  };
  const { candidates, summary } = analyzeSignals(f, [], 1);
  assert.equal(summary.hasCommentary, false);
  assert.ok(near(candidates, 1003));
});

test("robustZ ignores gaps in the baseline", () => {
  const series = Array.from({ length: 600 }, (_, t) => (t % 2 ? NaN : -30));
  series[300] = -10;
  assert.ok(robustZ(series, 1.5)[300] > 5);
  assert.equal(robustZ(series, 1.5)[301], 0);
});

test("parses a chat replay file, including emoji and malformed rows", () => {
  const line = JSON.stringify({
    replayChatItemAction: {
      videoOffsetTimeMsec: "12500",
      actions: [{ addChatItemAction: { item: { liveChatTextMessageRenderer: {
        authorExternalChannelId: "abc",
        message: { runs: [{ text: "gg " }, { emoji: { shortcuts: [":skull:"] } }] },
      } } } }],
    },
  });
  assert.deepEqual(parseLiveChat(`${line}\nnot json\n`), [{ t: 12.5, author: "abc", text: "gg :skull:", emotes: 1 }]);
});

const candidate = (over: Partial<Candidate> = {}): Candidate => ({
  id: 0, peakSec: 545, windowStart: 500, windowEnd: 570, score: 0.8, voice: 0.8, loudness: 0.3, chat: null,
  laughter: 0.6, shout: 0.1, chatSample: [], words: [], ...over,
});
const verdict = (over: Partial<Verdict> = {}): Verdict => ({
  id: 0, keep: true, score: 80, moment_type: "clutch", start_offset: 20, end_offset: 50, title: "t", hook: "h", reason: "r", ...over,
});

test("model offsets can't escape the window or the length limits", () => {
  const c = candidate();
  for (const [a, b] of [[-50, 9999], [40, 41], [NaN, NaN], [60, 10]]) {
    const { start, end } = clampClip(c, a, b);
    assert.ok(start >= c.windowStart && end <= c.windowEnd);
    assert.ok(end - start >= MIN_CLIP_SEC && end - start <= MAX_CLIP_SEC);
  }
});

test("cut points move off mid-word", () => {
  const words = [{ start: 10, end: 10.8, text: "no" }, { start: 30, end: 31, text: "way" }];
  assert.deepEqual(snapToWords(10.4, 30.5, words), { start: 10, end: 31 });
});

test("verdicts drop rejections and unknown ids, and overlapping clips collapse", () => {
  const a = candidate({ id: 0 });
  const b = candidate({ id: 1, windowStart: 510, windowEnd: 580, peakSec: 555 });
  const out = applyVerdicts([a, b], [verdict({ id: 0, score: 70 }), verdict({ id: 1, score: 90, start_offset: 10, end_offset: 40 }), verdict({ id: 9 })], 5);
  assert.equal(out.length, 1);
  assert.equal(out[0].candidate.id, 1);
});

test("free mode titles a clip with the streamer's own words, and names laughter", () => {
  const words = [{ start: 543, end: 544, text: "no" }, { start: 544, end: 545, text: "way" }];
  const c = candidate({ words });
  assert.equal(quoteAtPeak(c), "no way");
  const [m] = selectBySignals([c], 1);
  assert.equal(m.title, "no way");
  assert.equal(m.momentType, "laughter");
  assert.equal(m.hook, "");
});

test("caption lines break at pauses and the active word tracks time", () => {
  const words = [0, 0.3, 0.6, 0.9, 1.2, 5].map((start, i) => ({ start, end: start + 0.2, text: `w${i}` }));
  const lines = chunkWords(words);
  assert.deepEqual(lines.map((c) => c.length), [3, 2, 1]);
  assert.equal(captionAt(lines, 0.65)?.activeIndex, 2);
  assert.equal(captionAt(lines, 3), null);
});

const spoken = (...items: [number, string][]) => items.map(([start, text]) => ({ start, end: start + 0.4, text }));

test("a clip ends at the first real pause after the reaction", () => {
  const words = spoken([100, "no"], [101, "way."], [106, "did"], [106.5, "you"], [107, "see."], [110, "okay"]);
  assert.equal(findNaturalEnd(words, 100, 125), 107.4 + 0.35);
});

test("non-stop talking ends on the last finished sentence in reach", () => {
  const words = Array.from({ length: 60 }, (_, i) => ({ start: 100 + i * 0.5, end: 100.45 + i * 0.5, text: i === 20 ? "done." : "word" }));
  assert.equal(findNaturalEnd(words, 100, 125), 110.45 + 0.35);
});

test("with no usable speech there is no natural end to find", () => {
  assert.equal(findNaturalEnd([], 100, 125), null);
});

test("a model's end point is extended to finish the sentence, but only so far", () => {
  const words = spoken([50, "and"], [51, "then."], [80, "much"], [81, "later."]);
  assert.equal(finishSentence(50.2, words, 100), 51.4 + 0.35);
  assert.equal(finishSentence(60, words, 100), 60);
});

test("Whisper's invented repeats are trimmed, while natural repetition stays", () => {
  const bam = Array.from({ length: 20 }, (_, i) => ({ start: i, end: i + 0.3, text: "BAM" }));
  assert.equal(collapseRepeats(bam).length, 3);
  const real = ["no,", "no,", "no,", "stupid"].map((text, i) => ({ start: i, end: i + 0.3, text }));
  assert.equal(collapseRepeats(real).length, 4);
});

test("saved progress never contains API keys", () => {
  const options: RunOptions = {
    clipCount: 5, length: "auto", watchVideo: true, captions: DEFAULT_CAPTIONS, template: "stacked", regions: { cam: { x: 0, y: 0, w: 1, h: 1 }, game: { x: 0, y: 0, w: 1, h: 1 } }, framing: DEFAULT_FRAMING,
    outro: { enabled: true, message: "m", handle: "" }, burnCaptions: true,
    stt: { provider: "groq", apiKey: "secret-stt" }, llm: { provider: "anthropic", apiKey: "secret-llm", model: "x" },
  };
  const saved = JSON.stringify(resumableSettings(options));
  assert.ok(!saved.includes("secret"));
  assert.ok(saved.includes("groq"));
});

test("a different file gets different checkpoints", () => {
  const a = { name: "a.mp4", size: 10, lastModified: 1 };
  assert.equal(sourceFingerprint(a), sourceFingerprint({ ...a }));
  assert.notEqual(sourceFingerprint(a), sourceFingerprint({ ...a, size: 11 }));
  assert.notEqual(sourceFingerprint(a), sourceFingerprint({ ...a, lastModified: 2 }));
});

test("clip ids depend on everything that changes the picture", async () => {
  assert.equal(await hashKey({ layout: "blur", start: 1 }), await hashKey({ layout: "blur", start: 1 }));
  assert.notEqual(await hashKey({ layout: "blur", start: 1 }), await hashKey({ layout: "crop", start: 1 }));
});

test("every template stays on the canvas and keeps captions in the safe zone", () => {
  assert.equal(TEMPLATES.length, 3);
  for (const t of TEMPLATES) {
    for (const s of t.slots) assert.ok(s.x >= 0 && s.y >= 0 && s.x + s.w <= CANVAS_W && s.y + s.h <= CANVAS_H, `${t.id} ${s.source}`);
    assert.ok(t.captionY >= SAFE_TOP && t.captionY <= SAFE_BOTTOM, t.id);
    assert.ok(t.slots.some((s) => s.source === "cam") && t.slots.some((s) => s.source === "game"), t.id);
  }
});

test("a framed region has the slot's shape, stays in frame, and keeps its center when it can", () => {
  const ratio = regionRatio(TEMPLATES[1], "game", 16 / 9);
  const r = fitRegion({ x: 0, y: 0, w: 1, h: 1 }, ratio);
  assert.ok(Math.abs(r.w / r.h - ratio) < 1e-9);
  assert.equal(r.h, 1);
  assert.ok(Math.abs(r.x + r.w / 2 - 0.5) < 1e-9);
  const corner = fitRegion({ x: 0.95, y: 0.95, w: 0.3, h: 0.3 }, 1);
  assert.ok(corner.x + corner.w <= 1 && corner.y + corner.h <= 1);
});

test("resizing keeps the shape and can't run off the frame", () => {
  const r = resizeRegion({ x: 0.5, y: 0.7, w: 0.2, h: 0.2 }, 0.9, 1);
  assert.ok(r.y + r.h <= 1 + 1e-9 && r.x + r.w <= 1 + 1e-9);
  assert.ok(Math.abs(r.w / r.h - 1) < 1e-9);
});

test("long titles wrap and shrink to fit", () => {
  const measure = (text: string, size: number) => text.length * size * 0.5;
  const { lines, size } = wrapTitle(measure, "a fairly long title that needs to wrap over several lines to fit", 104, 900, 3);
  assert.ok(lines.length <= 3);
  assert.ok(lines.every((l) => measure(l, size) <= 900));
});

test("YouTube links resolve to the creator's Studio page", () => {
  const id = "dQw4w9WgXcQ";
  for (const url of [`https://www.youtube.com/watch?v=${id}&t=5`, `https://youtu.be/${id}`, `https://www.youtube.com/live/${id}?si=x`, `https://studio.youtube.com/video/${id}/edit`]) {
    assert.equal(parseYouTubeId(url), id);
  }
  assert.equal(studioUrl(id), `https://studio.youtube.com/video/${id}/edit`);
  for (const bad of ["nope", "https://evil.com/watch?v=dQw4w9WgXcQ", "https://www.youtube.com/playlist?list=PL1"]) assert.equal(parseYouTubeId(bad), null);
});

test("the bar moves through the stages in order and never leaves 0..1", () => {
  const order = ["keys", "measuring", "reactions", "transcribing", "judging", "rendering"];
  let last = 0;
  for (const stage of order) {
    for (const fraction of [0, 0.5, 1]) {
      const v = overallProgress(stage, fraction);
      assert.ok(v >= last && v <= 1, `${stage} ${fraction}`);
      last = v;
    }
  }
  assert.equal(last, 1);
  assert.equal(overallProgress("unknown", 1), 0);
});

test("the model download gets a plain label", () => {
  assert.equal(stageLabel("transcribing", "Downloading the free speech model (first run only): 40%"), "setting up, first time only");
  assert.equal(stageLabel("rendering", "Rendering clip 1 of 5"), "cutting clips");
});

test("reports carry diagnostics but never API keys", () => {
  const report = buildReport({
    kind: "problem", name: "", note: "broke with sk-abc", error: "401 for key sk-abc", stage: "judging", warnings: ["w sk-abc"], fileSizeMb: 400,
    template: "focus", userAgent: "UA", hasGpu: true, secrets: ["sk-abc", ""],
  });
  assert.ok(!JSON.stringify(report).includes("sk-abc"));
  assert.ok(!("fileName" in report));
  const text = reportToText(report);
  assert.match(text, /Stage: judging/);
  assert.match(text, /File size: 400 MB/);
});

test("the waveform marks unheard slices as empty and scales heard ones", () => {
  const halfHeard = Array.from({ length: 1800 }, (_, s) => (s === 900 ? -10 : -40));
  const bars = waveformBars(halfHeard, 3600);
  assert.equal(bars.length, WAVE_SLICES);
  assert.equal(bars[WAVE_SLICES - 1], null);
  const heard = bars.filter((b): b is number => b !== null);
  assert.ok(heard.every((b) => b > 0 && b <= 1));
  assert.equal(Math.max(...heard), 1);
});

test("the waveform survives silence and an hours-long stream", () => {
  assert.ok(waveformBars(new Array(100).fill(-60), 100).every((b) => b !== null && b <= 1));
  assert.equal(waveformBars(new Array(43200).fill(-30), 43200).length, WAVE_SLICES);
});

test("every failure says what to do next", () => {
  for (const message of ["Input has an unsupported or unrecognizable format.", "Nothing stood out from the rest of this video.", "Anthropic rejected the API key.", "The processing worker crashed."]) {
    const { title, hint } = friendlyError(message);
    assert.ok(title.length > 0 && hint.length > 0, message);
    assert.ok(!/oops|!/i.test(title + hint), message);
  }
  assert.match(friendlyError("Input has an unsupported or unrecognizable format.").hint, /MP4/);
});

const feedbackBase = { error: "boom", stage: "judging", warnings: ["w"], fileSizeMb: 9, template: "focus", userAgent: "UA", hasGpu: true, secrets: [] };

test("a blank name is sent as Anonymous", () => {
  assert.equal(buildReport({ ...feedbackBase, kind: "feedback", name: "   ", note: "nice" }).name, "Anonymous");
  assert.equal(buildReport({ ...feedbackBase, kind: "feedback", name: " Sam ", note: "nice" }).name, "Sam");
});

test("an idea carries only the message, with no diagnostics", () => {
  const report = buildReport({ ...feedbackBase, kind: "feedback", name: "", note: "add a dark mode" });
  assert.equal(reportToText(report), "add a dark mode");
  assert.equal(report.error, null);
  assert.equal(report.userAgent, "");
});

test("a problem carries the error details", () => {
  const text = reportToText(buildReport({ ...feedbackBase, kind: "problem", name: "", note: "" }));
  assert.match(text, /Error: boom/);
  assert.match(text, /Stage: judging/);
});

test("a problem with an error can be sent without typing; anything else needs a message", () => {
  assert.equal(needsMessage("problem", "", "boom"), false);
  assert.equal(needsMessage("problem", "  ", null), true);
  assert.equal(needsMessage("feedback", "", "boom"), true);
  assert.equal(needsMessage("feedback", "hi", null), false);
});

const [stacked, focus] = TEMPLATES;
const wideBoxes = { cam: { x: 0, y: 0.6, w: 0.2, h: 0.4 }, game: { x: 0, y: 0, w: 1, h: 1 } };
const free = (fill: "blur" | "black" | "facecam") => ({ ...DEFAULT_FRAMING, lockAspect: false, fill });
const pictures = (plan: ReturnType<typeof planFrame>, source: string) => plan.ops.filter((o) => o.kind === "picture" && o.source === source);

test("locked boxes fill their slots, with nothing behind them", () => {
  const plan = planFrame(focus, wideBoxes, 16 / 9, DEFAULT_FRAMING);
  assert.ok(plan.ops.every((o) => o.kind === "picture"));
});

test("an unlocked box keeps its shape, with blur or black in the empty space", () => {
  const blur = planFrame(focus, wideBoxes, 16 / 9, free("blur"));
  assert.ok(blur.ops.some((o) => o.kind === "blur"));
  const black = planFrame(focus, wideBoxes, 16 / 9, free("black"));
  assert.ok(black.ops.some((o) => o.kind === "black"));
  const game = pictures(black, "game")[0];
  assert.ok(game.kind === "picture" && Math.abs(game.dest.w / game.dest.h - 16 / 9) < 0.01, "not distorted");
});

test("putting the face in the empty space never shows it twice", () => {
  for (const t of TEMPLATES) {
    const plan = planFrame(t, wideBoxes, 16 / 9, free("facecam"));
    assert.equal(pictures(plan, "cam").length, 1, t.id);
    assert.equal(plan.ops.filter((o) => o.kind !== "picture").length, 0, t.id);
  }
});

test("in Stacked, the face grows into the gap and meets the game exactly", () => {
  const plan = planFrame(stacked, wideBoxes, 16 / 9, free("facecam"));
  const cam = pictures(plan, "cam")[0];
  const game = pictures(plan, "game")[0];
  assert.ok(cam.kind === "picture" && game.kind === "picture");
  assert.ok(Math.abs(cam.dest.y + cam.dest.h - game.dest.y) < 0.5);
  assert.equal(game.dest.y + game.dest.h, CANVAS_H);
});

test("every drawn area stays on the canvas, in every mode", () => {
  for (const t of TEMPLATES) {
    for (const fill of ["blur", "black", "facecam"] as const) {
      for (const op of planFrame(t, wideBoxes, 16 / 9, free(fill)).ops) {
        const b = op.kind === "picture" ? op.dest : op.frame;
        assert.ok(b.x >= -0.5 && b.y >= -0.5 && b.x + b.w <= CANVAS_W + 0.5 && b.y + b.h <= CANVAS_H + 0.5, `${t.id} ${fill}`);
      }
    }
  }
});

test("a stretched box changes shape freely but stays in frame", () => {
  const r = stretchRegion({ x: 0.5, y: 0.5, w: 0.2, h: 0.2 }, 0.9, -0.1);
  assert.equal(r.x + r.w, 1);
  assert.ok(Math.abs(r.h - 0.1) < 1e-9);
});

test("a working key picks a sensible model by itself", () => {
  assert.equal(pickDefaultModel("groq", ["whatever-1", "llama-x-versatile"], ""), "llama-x-versatile");
  assert.equal(pickDefaultModel("openai", ["o-mega", "gpt-9-mini"], ""), "gpt-9-mini");
  assert.equal(pickDefaultModel("anthropic", ["claude-opus-5-5", "x"], "claude-opus-5-5"), "claude-opus-5-5");
  assert.equal(pickDefaultModel("groq", [], "kept"), "kept");
});

const noCam = (over = {}) => ({ ...DEFAULT_FRAMING, hasFacecam: false, ...over });

test("with no facecam, no template draws a face or a border", () => {
  for (const t of TEMPLATES) {
    for (const lockAspect of [true, false]) {
      const plan = planFrame(t, wideBoxes, 16 / 9, noCam({ lockAspect, fill: "facecam" }));
      assert.equal(pictures(plan, "cam").length, 0, t.id);
      assert.equal(plan.cam, null, t.id);
      assert.equal(pictures(plan, "game").length, 1, t.id);
    }
  }
});

test("with no facecam, Stacked gives the whole screen to the game", () => {
  const game = pictures(planFrame(stacked, wideBoxes, 16 / 9, noCam()), "game")[0];
  assert.ok(game.kind === "picture");
  assert.deepEqual([game.dest.y, game.dest.h], [0, CANVAS_H]);
});

test("old saved settings without the new field keep working", () => {
  const { hasFacecam: _ignored, ...old } = DEFAULT_FRAMING; // eslint-disable-line @typescript-eslint/no-unused-vars
  const plan = planFrame(stacked, wideBoxes, 16 / 9, { ...DEFAULT_FRAMING, ...old });
  assert.equal(pictures(plan, "cam").length, 1);
});

test("Gemini picks its newest stable Flash model", () => {
  assert.equal(pickDefaultModel("gemini", ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-pro"], ""), "gemini-3.5-flash");
  assert.equal(pickDefaultModel("gemini", ["gemini-3.5-flash", "gemini-flash-latest"], ""), "gemini-flash-latest");
  assert.equal(pickDefaultModel("gemini", ["gemini-x-flash-preview"], ""), "gemini-x-flash-preview");
});

test("a pasted key says which provider it belongs to", () => {
  assert.equal(detectProvider(" AIzaSyabc "), "gemini");
  assert.equal(detectProvider("gsk_abc"), "groq");
  assert.equal(detectProvider("sk-ant-api03"), "anthropic");
  assert.equal(detectProvider("sk-proj-abc"), "openai");
  assert.equal(detectProvider("hello"), null);
});

const longWindow = (over: Partial<Candidate> = {}) => candidate({ peakSec: 1000, windowStart: 900, windowEnd: 1050, ...over });

test("a strict length is exact, for both free and AI-judged clips", () => {
  for (const seconds of [15, 30, 60, 75, 120]) {
    const [free] = selectBySignals([longWindow()], 1, seconds);
    assert.equal(free.endSec - free.startSec, seconds, `free ${seconds}`);
    const [judged] = applyVerdicts([longWindow()], [verdict({ start_offset: 5, end_offset: 40 })], 1, seconds);
    assert.equal(judged.endSec - judged.startSec, seconds, `judged ${seconds}`);
  }
});

test("a strict length keeps the peak inside the clip", () => {
  for (const seconds of [15, 60, 120]) {
    const [m] = selectBySignals([longWindow()], 1, seconds);
    assert.ok(m.startSec < 1000 && m.endSec > 1000, `${seconds}: ${m.startSec}-${m.endSec}`);
  }
});

test("auto length follows the speech and stays within its limits", () => {
  const words = spoken([975, "okay"], [976, "so"], [990, "wait."], [1001, "no"], [1002, "way."], [1006, "wow."], [1020, "next"]);
  const [m] = selectBySignals([longWindow({ words })], 1, "auto");
  assert.ok(Math.abs(m.startSec - (978 - 3 + 0)) <= 3, `start ${m.startSec}`);
  assert.equal(m.endSec, 1006.4 + 0.35);
  const { min, max } = lengthLimits("auto");
  assert.ok(m.endSec - m.startSec >= min && m.endSec - m.startSec <= max);
});

test("the natural start finds where the setup begins", () => {
  const words = spoken([960, "um"], [977, "so"], [977.5, "this"], [980, "guy"]);
  assert.equal(findNaturalStart(words, 1000, 900), 977 - 0.15);
  assert.equal(findNaturalStart([], 1000, 900), null);
});

test("the judge is told the chosen length", () => {
  assert.match(judgeSystem(30), /exactly 30 seconds/);
  assert.match(judgeSystem("auto"), /as long as the moment needs/);
});

const ranked = (score: number, over: Partial<Candidate>, selectedBy: "llm" | "signals" = "signals") => ({ candidate: candidate(over), startSec: 0, endSec: 30, score, momentType: "x", title: "t", hook: "", reason: "r", selectedBy });

test("each rank says why it is there, comparing with the top clip", () => {
  const reasons = explainRanks([ranked(64, { voice: 0.72, laughter: 0 }), ranked(53, { voice: 0.58, laughter: 0 }), ranked(46, { voice: 0.51, laughter: 0 })]);
  assert.match(reasons[0], /voice excitement hit 72%, 11 points ahead of #2/);
  assert.match(reasons[2], /Ranked #3: 46\/100, 18 points behind #1. Its voice excitement was 51%, against 72% in #1/);
});

test("AI-judged and tied ranks read correctly", () => {
  const judged = explainRanks([ranked(90, {}, "llm"), ranked(75, {}, "llm")]);
  assert.match(judged[0], /AI judge scored this highest: 90\/100, 15 points ahead/);
  assert.match(judged[1], /AI judge gave this 75\/100, 15 points behind #1/);
  const tied = explainRanks([ranked(50, {}), ranked(50, {})]);
  assert.match(tied[1], /level with #1, with similar reactions/);
  assert.equal(explainRanks([ranked(50, { voice: 0.5, laughter: 0 })])[0], "Strongest moment of the stream: voice excitement hit 50%.");
});

const line = (...parts: [number, string][]) => parts.map(([start, text]) => ({ start, end: start + 0.5, text }));

test("editing a caption keeps its timing, and new word counts share the time", () => {
  const lines = [line([1, "no"], [1.5, "wey"]), line([4, "gone"])];
  assert.deepEqual(applyCaptionEdits(lines, new Map([[0, "no way"]]))[1], { start: 1.5, end: 2, text: "way" });
  const longer = applyCaptionEdits(lines, new Map([[0, "not a chance"]]));
  assert.deepEqual(longer.slice(0, 3).map((w) => w.text), ["not", "a", "chance"]);
  assert.equal(longer[0].start, 1);
  assert.equal(longer[2].end, 2);
});

test("clearing a caption removes it, and untouched lines survive", () => {
  const lines = [line([1, "um"]), line([4, "gone"])];
  assert.deepEqual(applyCaptionEdits(lines, new Map([[0, "   "]])).map((w) => w.text), ["gone"]);
  assert.equal(chunkWords(applyCaptionEdits(lines, new Map())).length, 2);
});

test("the transcript sent for post text only covers the clip", () => {
  assert.equal(clipWords(line([1, "before"], [10, "inside"], [30, "after"]), 5, 20), "inside");
});

const device = { durationSec: 5280, clipCount: 5, length: "auto" as const, localTranscription: true, hasGpu: true, modelsCached: true, memoryGb: 8, freeBytes: 5e10 };

test("the time estimate matches the measured long stream and grows with the work", () => {
  // The same stream took 12 minutes when every moment was transcribed in full.
  assert.equal(checkBeforeStart(device).time, "About 11 minutes");
  assert.ok(checkBeforeStart({ ...device, length: 120 }).minutes > checkBeforeStart(device).minutes);
  assert.ok(checkBeforeStart({ ...device, hasGpu: false }).minutes > checkBeforeStart(device).minutes);
  assert.equal(checkBeforeStart({ ...device, durationSec: 60, clipCount: 1, localTranscription: false }).time, "Under a minute");
});

test("a free Groq key is suggested on weak machines and long runs, and not otherwise", () => {
  const suggests = (input: Parameters<typeof checkBeforeStart>[0]) => checkBeforeStart(input).notes.some((n) => n.href === "/keys#groq");
  assert.equal(suggests(device), false);
  assert.equal(suggests({ ...device, hasGpu: false }), true);
  assert.equal(suggests({ ...device, memoryGb: 4 }), true);
  assert.equal(suggests({ ...device, durationSec: 6 * 3600 }), true);
  assert.equal(suggests({ ...device, hasGpu: false, localTranscription: false }), false);
});

test("gentle mode is counted in the time estimate", () => {
  const slower = checkBeforeStart({ ...device, gentle: true }).minutes;
  assert.ok(Math.abs(slower - checkBeforeStart(device).minutes * GENTLE_SLOWDOWN) <= 1, `${slower} minutes`);
});

test("gentle mode rests after a stretch of work, and normal mode never waits", async () => {
  setGentle(false);
  const fast = performance.now();
  await breathe();
  assert.ok(performance.now() - fast < 20);
  setGentle(true);
  const busyUntil = performance.now() + 1600;
  while (performance.now() < busyUntil);
  const before = performance.now();
  await breathe();
  assert.ok(performance.now() - before >= 900, "rested about 60% of the work time");
  const after = performance.now();
  await breathe();
  assert.ok(performance.now() - after < 20, "no second rest straight away");
  setGentle(false);
});

test("the check warns about low memory and storage, and stays quiet when unknown", () => {
  assert.equal(checkBeforeStart({ ...device, memoryGb: 2 }).notes[0].warn, true);
  assert.equal(checkBeforeStart({ ...device, memoryGb: 8 }).notes[0].warn, false);
  assert.equal(checkBeforeStart({ ...device, memoryGb: null, freeBytes: null }).notes.length, 0);
  assert.match(checkBeforeStart({ ...device, freeBytes: 1e6 }).notes.at(-1)!.text, /free space/);
  assert.match(checkBeforeStart({ ...device, modelsCached: false }).notes.at(-1)!.text, /downloads/);
});

test("post text is held to each platform's limits", () => {
  const clean = cleanPostText({
    youtube: { title: `${"word ".repeat(40)}`, description: "d", tags: ["#Clutch", "clutch", " ace round ", 5, ...Array.from({ length: 30 }, (_, i) => `t${i}`)] },
    tiktok: { title: "t", description: "x", tags: ["#one two", "three"] },
  });
  assert.ok(clean.youtube.title.length <= 100 && !clean.youtube.title.endsWith(" "));
  assert.deepEqual(clean.youtube.tags.slice(0, 2), ["Clutch", "ace round"]);
  assert.equal(clean.youtube.tags.length, 15);
  assert.deepEqual(clean.tiktok.tags, ["onetwo", "three"]);
  assert.equal(tiktokCaption(clean.tiktok), "t\n\nx\n\n#onetwo #three");
});

test("answers with text around the JSON still read, and bad ones fail clearly", () => {
  const body = '{"youtube":{"title":"A","description":"","tags":[]},"tiktok":{"title":"B","description":"","tags":[]}}';
  assert.equal(parsePostText(`Here you go:\n${body}\nEnjoy`).tiktok.title, "B");
  assert.throws(() => parsePostText("sorry"), /couldn.t be read/);
  assert.throws(() => parsePostText('{"youtube":{}}'), /didn.t return/);
});

test("trends are only claimed when the provider can search", () => {
  assert.match(postSystem(true), /search the web/);
  assert.match(postSystem(false), /don't claim anything is currently trending/);
  assert.match(buildPostPrompt({ title: "t", hook: "", momentType: "clutch", transcript: "", game: "Valorant", durationSec: 30 }), /Game: Valorant[\s\S]*no speech was transcribed/);
});

test("hype phrases are found however they're typed, and ordinary speech isn't", () => {
  assert.deepEqual(findHype("NOOO WAY, let's gooooo!"), ["no way", "lets go"]);
  assert.deepEqual(findHype("I went that way and got some loot"), []);
});

test("the hype list has over 1000 phrases after merging spellings", () => {
  assert.ok(HYPE_PHRASE_COUNT > 1000, `only ${HYPE_PHRASE_COUNT}`);
});

test("Hindi hype is found in any spelling and in Hindi script", () => {
  assert.deepEqual(findHype("BHAIII kya hogya"), findHype("bhai kya ho gaya"));
  assert.deepEqual(findHype("bhai kya ho gaya"), ["bhai kya ho gaya"]);
  assert.deepEqual(findHype("arey yr"), ["arre yaar"]);
  assert.deepEqual(findHype("bohot sahi"), ["bahut sahi"]);
  assert.deepEqual(findHype("भाई ये क्या हो गया!"), ["भाई ये क्या हो गया"]);
  assert.deepEqual(findHype("मजा आ गया"), ["मज़ा आ गया"]);
});

test("one shout counts once, however many phrases sit inside it", () => {
  assert.deepEqual(findHype("no way bro"), ["no way bro"]);
  assert.deepEqual(findHype("what the hell was that"), ["what the hell was that"]);
});

test("ordinary talk doesn't look like hype, in either language", () => {
  const ordinary = [
    "okay so we are going to the north side and then we will loot that building",
    "thanks for the follow and welcome to the stream everyone how is your day going",
    "he went that way and I think she has a good gun but we need more ammo",
    "let me check the map first, then we can talk about what to do next",
    "what is this item and how much does it cost in the shop",
    "the constructor of this class is not important right now",
    "bhai aaj kya khana khaya tune",
    "yaar kal college jana hai aur assignment bhi karna hai",
    "main ghar pe hu aur thodi der mein khana khaunga",
    "bhai tum log kaise ho aaj stream thodi late hai",
    "ye gun achi hai lekin ammo kam hai",
    "आज हम नया गेम खेलेंगे और आप लोग कमेंट में बताना",
    "भाई आज खाना क्या बनाया है",
    "मैं घर पर हूं और थोड़ी देर में आता हूं",
  ];
  for (const line of ordinary) assert.deepEqual(findHype(line), [], line);
});

test("a chat phrase needs more than one message", () => {
  const at = { words: [], peakSec: 1000, windowStart: 900, windowEnd: 1050 };
  assert.equal(speechExtras({ ...at, chatSample: ["omg"] }).hype, 0);
  assert.equal(speechExtras({ ...at, chatSample: ["omg", "OMG bro"] }).hypePhrase, "omg");
  assert.equal(speechExtras({ ...at, chatSample: ["bhai kya khela (x3)"] }).hypePhrase, "bhai kya khela");
});

test("speech around the peak gives hype and a pace burst", () => {
  const slow = Array.from({ length: 20 }, (_, i) => ({ start: 900 + i * 4, end: 900.3 + i * 4, text: "and" }));
  const fast = Array.from({ length: 14 }, (_, i) => ({ start: 996 + i * 0.4, end: 996.3 + i * 0.4, text: i === 3 ? "wtf" : "um" }));
  const extras = speechExtras({ words: [...slow, ...fast], peakSec: 1000, windowStart: 900, windowEnd: 1050, chatSample: [] });
  assert.equal(extras.hypePhrase, "wtf");
  assert.ok(extras.speechBurst! > 0.5);
  assert.equal(speechExtras({ words: [], peakSec: 1000, windowStart: 900, windowEnd: 1050, chatSample: ["clip it (x4)"] }).hypePhrase, "clip it");
});

test("a jump out of quiet scores, but steady loudness doesn't", () => {
  const db = [...new Array(20).fill(-50), -15, -15, ...new Array(20).fill(-15)];
  const rise = quietThenLoud(db);
  assert.equal(rise[20], 1);
  assert.equal(rise[35], 0);
});

test("Twitch files are read, with bits, subs and emotes", () => {
  const raw = JSON.stringify({ comments: [
    { content_offset_seconds: 12.5, commenter: { _id: "a" }, message: { body: "PogChamp nice", bits_spent: 0, fragments: [{ text: "PogChamp", emoticon: { emoticon_id: "1" } }, { text: " nice", emoticon: null }] } },
    { content_offset_seconds: 14, commenter: { _id: "b" }, message: { body: "cheer100", bits_spent: 100, fragments: [] } },
  ] });
  const parsed = parseLiveChat(raw);
  assert.deepEqual(parsed.map((m) => [m.t, m.author, Boolean(m.paid), m.emotes ?? 0]), [[12.5, "a", false, 1], [14, "b", true, 0]]);
});

test("YouTube files mark paid messages and emoji", () => {
  const entry = (item: object) => JSON.stringify({ replayChatItemAction: { videoOffsetTimeMsec: "5000", actions: [{ addChatItemAction: { item } }] } });
  const raw = [
    entry({ liveChatTextMessageRenderer: { authorExternalChannelId: "a", message: { runs: [{ text: "hi " }, { emoji: { emojiId: "x", shortcuts: [":fire:"] } }] } } }),
    entry({ liveChatPaidStickerRenderer: { authorExternalChannelId: "b" } }),
  ].join("\n");
  assert.deepEqual(parseLiveChat(raw).map((m) => [m.text, Boolean(m.paid), m.emotes ?? 0]), [["hi :fire:", false, 1], ["", true, 0]]);
});

test("paid messages and emotes become per-second activity", () => {
  const messages = [1, 2, 3].map((t) => ({ t, author: String(t), text: "x", paid: true, emotes: 1 }));
  const { paid, emotes } = chatExtras(messages, 30);
  assert.equal(paid[0], 1);
  assert.equal(paid[25], 0);
  assert.ok(emotes[0] > 0 && emotes[0] < 1);
});

test("movement counts only when it rises above the calm before it", () => {
  const still = (v: number) => new Uint8Array(100).fill(v);
  const times = Array.from({ length: 30 }, (_, i) => 90 + i * 0.5);
  const calm = motionStats(times.map(() => still(40)), times, 100);
  assert.deepEqual(calm, { motion: 0, sceneCut: 0 });
  const busy = motionStats(times.map((t, i) => still(t >= 98 ? (i % 2 ? 240 : 10) : 40)), times, 100);
  assert.equal(busy.motion, 1);
  assert.equal(busy.sceneCut, 1);
});

const mood = (label: string, score: number) => [{ label, score }, { label: "neutral", score: 1 - score }];

test("a face counts when it changes, not when it always smiles", () => {
  assert.equal(faceChange([mood("neutral", 0.9)], [mood("surprise", 0.9)]), 1);
  assert.equal(faceChange([mood("happy", 0.9)], [mood("happy", 0.9)]), 0);
  assert.equal(faceChange([], [mood("happy", 0.9)]), 0);
});

test("screen text finds announcements and rising scores", () => {
  assert.deepEqual(matchScreenWords("Jay ELIMINATED\nVictory Royale"), ["eliminated", "victory"]);
  assert.deepEqual(matchScreenWords("menu settings"), []);
  assert.equal(scoreChanged("3 - 2", "4 - 2"), true);
  assert.equal(scoreChanged("3 - 2", "3 - 2"), false);
  assert.equal(scoreChanged("3 - 2", "12:40"), false);
  assert.equal(scoreChanged("3 2", "90 2"), false);
  assert.equal(screenScore(["victory"], true), 0.9);
});

test("extra signals lift a moment without passing 100", () => {
  const plain = candidate({ score: 0.5, id: 1 });
  const loaded = candidate({ score: 0.5, id: 2, extra: { hype: 1, gameSound: 1, screenText: 1, face: 1 } });
  const [top, next] = applyMoments([plain, loaded]);
  assert.equal(top.id, 2);
  assert.ok(top.score > 0.5 && top.score < 1);
  assert.equal(next.score, plain.score + (1 - plain.score) * (1 - Math.exp(-(0))));
});

const rated = (rating: "up" | "down", laughter: number, gameSound: number) => ({ rating, signals: { voice: 0.5, chat: null, laughter, extra: { gameSound } } });

test("ratings change nothing until there are enough of them", () => {
  assert.deepEqual(learnTaste([rated("up", 1, 0), rated("down", 0, 1)]), {});
  assert.deepEqual(learnTaste(Array.from({ length: 10 }, () => rated("up", 1, 0))), {});
});

test("signals in liked clips gain weight, within limits, and move the ranking", () => {
  const ratings = [...Array.from({ length: 5 }, () => rated("up", 0.9, 0.1)), ...Array.from({ length: 5 }, () => rated("down", 0.1, 0.9))];
  const taste = learnTaste(ratings);
  assert.equal(taste.laughter, 1.5);
  assert.equal(taste.gameSound, 0.5);
  const funny = candidate({ id: 1, score: 0.5, laughter: 0.8, extra: { gameSound: 0 } });
  const loud = candidate({ id: 2, score: 0.5, laughter: 0, extra: { gameSound: 0.8 } });
  assert.equal(applyMoments([loud, funny])[0].id, 2);
  assert.equal(applyMoments([loud, funny], taste)[0].id, 1);
});

test("what stood out is listed in plain words", () => {
  assert.deepEqual(noticed({ hypePhrase: "no way", screenWords: ["victory"], gameSound: 0.72, voices: 0.1 }), ["on screen: victory", "heard “no way”", "game sounds 72%"]);
  assert.deepEqual(noticed(undefined), []);
});

test("an epic moment is named, and the judge is told what stood out", () => {
  const c = candidate({ voice: 0.7, laughter: 0, shout: 0, extra: { gameSound: 0.8, screenWords: ["ace"] } });
  assert.equal(selectBySignals([c], 1)[0].momentType, "epic moment");
  const prompt = buildUserPrompt("a.mp4", [c]);
  assert.match(prompt, /game sounds 80%/);
  assert.match(prompt, /words read from the screen:\n<untrusted>\nace/);
});

const captionTemplate = TEMPLATES[0];

test("subtitles sit where the template puts them until moved", () => {
  assert.deepEqual(placeCaption(captionTemplate, DEFAULT_CAPTIONS, 500, 130), { x: CANVAS_W / 2, y: captionTemplate.captionY });
  assert.deepEqual(placeCaption(captionTemplate, { ...DEFAULT_CAPTIONS, offsetX: -100, offsetY: 200 }, 500, 130), { x: CANVAS_W / 2 - 100, y: captionTemplate.captionY + 200 });
});

test("subtitles can't leave the area platforms keep clear", () => {
  const far = { ...DEFAULT_CAPTIONS, offsetX: 5000, offsetY: -5000 };
  const placed = placeCaption(captionTemplate, far, 500, 130);
  assert.equal(placed.y, SAFE_TOP + 65);
  assert.equal(placed.x + 250, 990);
  assert.equal(placeCaption(captionTemplate, { ...DEFAULT_CAPTIONS, offsetY: 5000 }, 500, 130).y, SAFE_BOTTOM - 65);
});

test("dragging past an edge leaves no dead zone", () => {
  const settled = settleCaption(captionTemplate, { ...DEFAULT_CAPTIONS, offsetY: -5000 }, 500, 130);
  assert.equal(captionTemplate.captionY + settled.offsetY, SAFE_TOP + 65);
});

test("the up-and-down range shrinks as subtitles grow", () => {
  const small = captionOffsetRange(captionTemplate, 0.6);
  const big = captionOffsetRange(captionTemplate, 1.5);
  assert.ok(small.min < big.min && small.max > big.max);
  assert.ok(small.min < 0 && small.max > 0);
});

test("subtitle choices survive a resume", () => {
  const options = { clipCount: 5, length: "auto" as const, watchVideo: true, captions: { ...DEFAULT_CAPTIONS, font: "bangers" as const, scale: 1.3 }, template: "stacked" as const, regions: { cam: { x: 0, y: 0, w: 1, h: 1 }, game: { x: 0, y: 0, w: 1, h: 1 } }, framing: DEFAULT_FRAMING, outro: { enabled: false, message: "m", handle: "" }, burnCaptions: true, stt: { provider: "local" as const } };
  assert.deepEqual(resumableSettings(options).captions, options.captions);
});
