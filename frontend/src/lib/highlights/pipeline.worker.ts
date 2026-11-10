/// <reference lib="webworker" />
import type { AudioFeatures, Candidate, ClipResult, ClipSettings, EditRequest, RunOptions, RunReport, RunRequest, SelectedMoment, WorkerEvent, WorkerRequest, Word } from "./types";
import { analyzeSignals, applyReactionBoost } from "./analyze.ts";
import { collapseRepeats, explainRanks, selectBySignals } from "./selection.ts";
import { applyMoments, learnTaste, speechExtras } from "./moments.ts";
import { createScreenReader, releaseFaceModel, watchMoment, type ScreenReader } from "./vision.ts";
import { parseLiveChat } from "./signals.ts";
import { listModels, judgeCandidates, transcribeRemote } from "./providers.ts";
import { detectDevice, detectReactions, releaseReactionModel, releaseSpeechModel, transcribeLocal } from "./localModels.ts";
import { breathe, setGentle } from "./pace.ts";
import { waveformBars } from "./progress.ts";
import { measureAudio, openMedia, readPcm16k, type OpenedMedia } from "./media.ts";
import { assertBrowserCanRender, outroLength, renderClip } from "./render.ts";
import { DEFAULT_CAPTIONS } from "./templates.ts";
import { deleteClip, hashKey, listRatings, loadClip, markRunFinished, remember, resumableSettings, saveClip, saveRating, saveRunReport, setLastRun, sourceFingerprint, updateClip } from "./storage.ts";

const REACTION_BEFORE_SEC = 8;
const REACTION_AFTER_SEC = 12;
/** Reading the screen is the slowest step, so only the strongest moments get it. */
const MAX_SCREEN_READS = 10;
/** First pass: just enough speech around each peak for hype words and pace. */
const SNIPPET_BEFORE_SEC = 8;
const SNIPPET_AFTER_SEC = 12;
/** Second pass: full windows only for the moments that can still become clips, plus spares for overlaps. */
const FINALIST_SPARE = 3;

const post = (event: WorkerEvent) => self.postMessage(event);

/** Time spent in each stage of the current run, for the run report. */
const stageSeconds: Record<string, number> = {};
let currentStage = "";
let stageStartedAt = 0;

function enterStage(stage: string) {
  if (stage === currentStage) return;
  const now = performance.now();
  if (currentStage) stageSeconds[currentStage] = (stageSeconds[currentStage] ?? 0) + (now - stageStartedAt) / 1000;
  currentStage = stage;
  stageStartedAt = now;
}

const progress = (stage: string, fraction: number, message: string) => {
  enterStage(stage);
  post({ type: "progress", stage, fraction, message });
};

async function scoreReactions(media: OpenedMedia, candidates: Candidate[], fp: string): Promise<Candidate[]> {
  try {
    for (const [i, c] of candidates.entries()) {
      progress("reactions", i / candidates.length, `Listening for laughter and shouting: ${i + 1} of ${candidates.length}`);
      const reactions = await remember(`react2:${fp}:${c.peakSec}`, async () => {
        const from = Math.max(0, c.peakSec - REACTION_BEFORE_SEC);
        const to = Math.min(media.durationSec, c.peakSec + REACTION_AFTER_SEC);
        return detectReactions(await readPcm16k(media, from, to), (message) => progress("reactions", 0, message));
      });
      const { gameSound, voices, ...heard } = reactions;
      Object.assign(c, heard);
      c.extra = { ...c.extra, gameSound, voices };
    }
    return applyReactionBoost(candidates);
  } catch (err) {
    post({ type: "warn", message: `Laughter detection was skipped: ${err instanceof Error ? err.message : "unknown error"}` });
    return candidates;
  } finally {
    await releaseReactionModel();
  }
}

interface Pass {
  span: (c: Candidate, durationSec: number) => { from: number; to: number };
  label: string;
  /** The share of the transcribing stage this pass covers. */
  progress: [number, number];
}

const SNIPPETS: Pass = {
  span: (c, durationSec) => ({ from: Math.max(c.windowStart, c.peakSec - SNIPPET_BEFORE_SEC), to: Math.min(c.windowEnd, durationSec, c.peakSec + SNIPPET_AFTER_SEC) }),
  label: "Listening to moment",
  progress: [0, 0.35],
};
const fullWindow: Pass["span"] = (c) => ({ from: c.windowStart, to: c.windowEnd });
const FINALISTS: Pass = { span: fullWindow, label: "Transcribing finalist", progress: [0.35, 1] };
const EVERY_MOMENT: Pass = { span: fullWindow, label: "Transcribing moment", progress: [0, 1] };

/** Transcribes each candidate's span. A failed one keeps whatever words it already had. */
async function transcribeCandidates(media: OpenedMedia, candidates: Candidate[], options: RunOptions, fp: string, pass: Pass): Promise<boolean> {
  let failed = 0;
  let lastError = "";
  const [from, to] = pass.progress;
  for (const [i, c] of candidates.entries()) {
    const at = from + ((to - from) * i) / candidates.length;
    progress("transcribing", at, `${pass.label} ${i + 1} of ${candidates.length}`);
    const span = pass.span(c, media.durationSec);
    try {
      c.words = await remember<Word[]>(`stt:${fp}:${options.stt.provider}:${span.from}:${span.to}`, async () => {
        const pcm = await readPcm16k(media, span.from, span.to);
        const words = options.stt.provider === "local"
          ? await transcribeLocal(pcm, (message) => progress("transcribing", at, message))
          : await transcribeRemote(options.stt, pcm);
        return collapseRepeats(words).map((w) => ({ ...w, start: w.start + span.from, end: w.end + span.from }));
      });
    } catch (err) {
      failed++;
      lastError = err instanceof Error ? err.message : "unknown error";
    }
  }
  if (failed) post({ type: "warn", message: `${failed} of ${candidates.length} moments couldn’t be transcribed (${lastError}).` });
  return failed < candidates.length;
}

async function watchCandidates(media: OpenedMedia, candidates: Candidate[], options: RunOptions, fp: string): Promise<void> {
  if (!options.watchVideo) return;
  let reader: ScreenReader | null = null;
  let failed = 0;
  let lastError = "";
  try {
    reader = createScreenReader();
    for (const [i, c] of candidates.entries()) {
      progress("watching", i / candidates.length, `Watching moment ${i + 1} of ${candidates.length}`);
      const readScreen = i < MAX_SCREEN_READS;
      try {
        const seen = await remember(`watch:${fp}:${c.peakSec}:${options.framing.hasFacecam ? JSON.stringify(options.regions.cam) : "nocam"}:${readScreen}`, () =>
          watchMoment(media, c.peakSec, { regions: options.regions, framing: options.framing, reader: readScreen ? reader : null, onStatus: (message) => progress("watching", i / candidates.length, message) })
        );
        c.extra = { ...c.extra, ...seen };
      } catch (err) {
        failed++;
        lastError = err instanceof Error ? err.message : "unknown error";
      }
    }
  } finally {
    await reader?.close().catch(() => undefined);
    await releaseFaceModel();
  }
  if (failed) post({ type: "warn", message: `${failed} of ${candidates.length} moments couldn’t be watched (${lastError}), so they rely on sound and speech.` });
}

async function chooseMoments(file: File, candidates: Candidate[], options: RunOptions, hasTranscript: boolean, fp: string): Promise<{ moments: SelectedMoment[]; usedLlm: boolean }> {
  const { llm } = options;
  if (llm && hasTranscript) {
    progress("judging", 0, `Asking ${llm.model} to judge ${candidates.length} moments`);
    try {
      // Saved so that resuming a run doesn't bill the user's key a second time.
      const key = `judge:${fp}:${llm.provider}:${llm.model}:${options.clipCount}:${options.length}:${candidates.map((c) => `${c.peakSec}/${c.words.length}`).join(",")}`;
      const moments = await remember(key, () => judgeCandidates(llm, file.name, candidates, options.clipCount, options.length));
      if (moments.length) return { moments, usedLlm: true };
      post({ type: "warn", message: "The model didn’t approve any moment, so clips are ranked by signals alone." });
    } catch (err) {
      post({ type: "warn", message: `Model judging failed (${err instanceof Error ? err.message : "unknown error"}), so clips are ranked by signals alone.` });
    }
  }
  return { moments: selectBySignals(candidates, options.clipCount, options.length), usedLlm: false };
}

interface Placement {
  rank: number;
  rankReason?: string;
}

async function renderOne(media: OpenedMedia, m: SelectedMoment, options: ClipSettings, fp: string, file: File, place: Placement, onProgress: (f: number) => void): Promise<ClipResult> {
  const words = options.burnCaptions ? m.candidate.words : [];
  const captions = options.captions ?? DEFAULT_CAPTIONS;
  const edit = {
    sourceFp: fp,
    windowStart: m.candidate.windowStart,
    windowEnd: m.candidate.windowEnd,
    endSec: m.endSec,
    words: m.candidate.words,
    settings: { template: options.template, regions: options.regions, framing: options.framing, outro: options.outro, burnCaptions: options.burnCaptions, captions },
  };
  // Everything that changes the pixels is in the id, so a new layout renders fresh.
  const id = await hashKey({ fp, start: m.startSec, end: m.endSec, template: options.template, regions: options.regions, framing: options.framing, outro: options.outro, captions, words: words.map((w) => w.text).join(" "), hook: m.hook, title: m.title });
  const saved = await loadClip(id);
  if (saved) {
    await updateClip(id, { ...place, edit });
    return { ...saved, ...place, edit };
  }

  const blob = await renderClip({
    media,
    startSec: m.startSec,
    endSec: m.endSec,
    template: options.template,
    regions: options.regions,
    framing: options.framing,
    outro: options.outro,
    words,
    captions,
    title: m.title,
    hook: m.hook,
    onProgress,
  });
  const clip: ClipResult = {
    id,
    sourceName: file.name,
    ...place,
    startSec: m.startSec,
    durationSec: m.endSec - m.startSec + outroLength(options.outro, m.endSec, media.durationSec),
    score: m.score,
    momentType: m.momentType,
    title: m.title,
    hook: m.hook,
    reason: m.reason,
    selectedBy: m.selectedBy,
    signals: { voice: m.candidate.voice, chat: m.candidate.chat, laughter: m.candidate.laughter, shout: m.candidate.shout, extra: m.candidate.extra },
    edit,
    blob,
  };
  const onDisk = await saveClip(clip);
  if (!onDisk) post({ type: "warn", message: "A clip couldn’t be saved to this device. Download it before closing the tab." });
  return onDisk ? { ...clip, blob: onDisk } : clip;
}

async function renderAll(media: OpenedMedia, moments: SelectedMoment[], options: RunOptions, fp: string, file: File): Promise<void> {
  let rendered = 0;
  const rankReasons = explainRanks(moments);
  for (const [i, m] of moments.entries()) {
    try {
      progress("rendering", i / moments.length, `Rendering clip ${i + 1} of ${moments.length}`);
      const clip = await renderOne(media, m, options, fp, file, { rank: rendered + 1, rankReason: rankReasons[i] }, (f) => progress("rendering", (i + f) / moments.length, `Rendering clip ${i + 1} of ${moments.length}`));
      rendered++;
      runClips = rendered;
      post({ type: "clip", clip });
      await breathe();
    } catch (err) {
      post({ type: "warn", message: `Clip ${i + 1} failed and was skipped: ${err instanceof Error ? err.message : "unknown error"}` });
    }
  }
  if (!rendered) throw new Error("Every selected clip failed to render.");
}

let runClips = 0;
let streamMinutes = 0;
let runStartedAt = 0;

/** Saves how the run went on this device. Never blocks or fails the run. */
async function report(options: RunOptions, outcome: RunReport["outcome"], error?: string): Promise<void> {
  const failedAt = currentStage;
  enterStage("");
  const nav = navigator as Navigator & { deviceMemory?: number };
  const usedModels = options.stt.provider === "local" || Object.keys(stageSeconds).includes("reactions");
  const entry: RunReport = {
    at: new Date().toISOString(),
    outcome,
    ...(outcome === "failed" ? { failedAt, error: error?.slice(0, 200) } : {}),
    streamMinutes,
    clips: runClips,
    options: { clipCount: options.clipCount, watchVideo: options.watchVideo, gentle: options.gentle ?? false, transcription: options.stt.provider, judged: Boolean(options.llm) },
    device: { cores: nav.hardwareConcurrency ?? null, memoryGb: nav.deviceMemory ?? null, models: usedModels ? await detectDevice().catch(() => null) : null },
    stages: Object.fromEntries(Object.entries(stageSeconds).map(([k, v]) => [k, Math.round(v)])),
    totalSec: Math.round((performance.now() - runStartedAt) / 1000),
  };
  await saveRunReport(entry).catch(() => undefined);
}

async function run({ file, chatText, options }: RunRequest): Promise<void> {
  setGentle(options.gentle ?? false);
  await assertBrowserCanRender();
  if (options.llm) {
    progress("keys", 0, "Checking your API key");
    await listModels(options.llm.provider, options.llm.apiKey);
  }

  const fp = sourceFingerprint(file);
  await setLastRun({ fileName: file.name, status: "running", settings: resumableSettings(options) });

  progress("measuring", 0, "Opening your video");
  const media = await openMedia(file);
  streamMinutes = Math.round(media.durationSec / 60);
  const features = await remember<AudioFeatures>(`features:${fp}`, () =>
    measureAudio(media, (f, loudnessSoFar) => {
      progress("measuring", f, `Measuring voice and audio: ${Math.round(f * 100)}%`);
      post({ type: "waveform", bars: waveformBars(loudnessSoFar, media.durationSec) });
    })
  );
  post({ type: "waveform", bars: waveformBars(features.loudnessDb, media.durationSec) });

  const messages = chatText ? parseLiveChat(chatText) : [];
  if (chatText && !messages.length) post({ type: "warn", message: "That chat file had no readable messages, so it was ignored." });

  const { candidates: found, summary } = analyzeSignals(features, messages, options.clipCount, options.length);
  if (!summary.hasCommentary) {
    post({ type: "warn", message: "Very little speech was found, so picks rely on game loudness and will be weaker." });
  }
  if (!found.length) throw new Error("Nothing stood out from the rest of this video.");
  post({ type: "moments", positions: found.map((c) => c.peakSec / media.durationSec) });

  const reacted = await scoreReactions(media, found, fp);
  // With many moments, short snippets rank them all and only the finalists get their full window, which is
  // where cuts and captions come from. With few, every moment is a finalist, so one full pass is quicker.
  const finalistCount = options.llm ? options.clipCount * 2 : options.clipCount + FINALIST_SPARE;
  const twoPasses = reacted.length > finalistCount;
  const heard = await transcribeCandidates(media, reacted, options, fp, twoPasses ? SNIPPETS : EVERY_MOMENT);
  for (const c of reacted) c.extra = { ...c.extra, ...speechExtras(c) };
  await watchCandidates(media, reacted, options, fp);
  const ranked = applyMoments(reacted, learnTaste(await listRatings()));
  const finalists = ranked.slice(0, finalistCount);
  const usedTranscript = twoPasses && heard ? (await transcribeCandidates(media, finalists, options, fp, FINALISTS)) || heard : heard;
  await releaseSpeechModel();
  const { moments, usedLlm } = await chooseMoments(file, finalists, options, usedTranscript, fp);
  post({ type: "summary", summary, usedTranscript, usedLlm });

  // A strict length is the length of the finished file, end card included.
  const fitted = options.length === "auto" ? moments : moments.map((m) => ({ ...m, endSec: m.endSec - outroLength(options.outro, m.endSec, media.durationSec) }));
  await renderAll(media, fitted, options, fp, file);
  await markRunFinished();
  // Saved before "done", because the page closes this worker as soon as it hears it.
  await report(options, "done");
  post({ type: "done" });
}

/** Cuts one clip again from the original video, with no new analysis. */
async function editOne({ file, clip, change }: EditRequest): Promise<void> {
  if (!clip.edit) throw new Error("This clip can’t be edited.");
  await assertBrowserCanRender();
  const media = await openMedia(file);
  const { edit } = clip;
  const candidate: Candidate = {
    id: 0,
    peakSec: change.startSec,
    windowStart: edit.windowStart,
    windowEnd: edit.windowEnd,
    score: clip.score / 100,
    voice: clip.signals.voice,
    loudness: 0,
    chat: clip.signals.chat,
    laughter: clip.signals.laughter,
    shout: clip.signals.shout ?? null,
    chatSample: [],
    words: change.words,
    extra: clip.signals.extra,
  };
  const moment: SelectedMoment = { candidate, startSec: change.startSec, endSec: change.endSec, score: clip.score, momentType: clip.momentType, title: clip.title, hook: change.hook, reason: clip.reason, selectedBy: clip.selectedBy };
  const next = await renderOne(media, moment, edit.settings, edit.sourceFp, file, { rank: clip.rank, rankReason: clip.rankReason }, (f) => progress("rendering", f, "Saving your edit"));
  if (next.id !== clip.id) {
    await deleteClip(clip.id);
    if (clip.rating) {
      await saveRating(clip, null);
      await saveRating(next, clip.rating);
    }
  }
  post({ type: "edited", clip: { ...next, rating: clip.rating } });
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  if (request.type === "edit") {
    editOne(request).catch((err: unknown) => post({ type: "error", message: err instanceof Error ? err.message : "That edit didn’t save." }));
    return;
  }
  runStartedAt = performance.now();
  run(request).catch(async (err: unknown) => {
    const message = err instanceof Error ? err.message : "The run failed.";
    await report(request.options, "failed", message);
    await markRunFinished();
    post({ type: "error", message });
  });
};
