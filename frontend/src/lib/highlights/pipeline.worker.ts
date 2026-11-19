/// <reference lib="webworker" />
import type { AudioFeatures, Candidate, ClipResult, ClipSettings, EditRequest, RunOptions, RunReport, RunRequest, SelectedMoment, WorkerEvent, WorkerRequest, Word } from "./types";
import { analyzeSignals, applyReactionBoost } from "./analyze.ts";
import { applyVerdicts, collapseRepeats, explainRanks, selectBySignals } from "./selection.ts";
import { applyMoments, learnTaste, speechExtras } from "./moments.ts";
import { createScreenReader, releaseFaceModel, watchMoment, type ScreenReader } from "./vision.ts";
import { parseLiveChat } from "./signals.ts";
import { listModels, judgeCandidates, transcribeRemote } from "./providers.ts";
import { detectDevice, detectReactions, releaseReactionModel, releaseSpeechModel, transcribeLocal } from "./localModels.ts";
import { breathe, setGentle } from "./pace.ts";
import { waveformBars } from "./progress.ts";
import { measureAudio, openMedia, readPcm16k, type OpenedMedia } from "./media.ts";
import { assertBrowserCanRender, outroLength, renderClip } from "./render.ts";
import { AGENT_LABELS, BACKEND_AGENTS, LOCAL_STT, SIGNAL_RANKER, ToolChain, Trace, planRun, routeMoments, sttToolName, type PlanStep, type RouteDecision, type Tool } from "./agents.ts";
import { backendReady, judgeWithAgents } from "./agentApi.ts";
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
const count = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** One trace per run: every agent step lands here and is streamed to the page as it happens. */
let trace = new Trace();
let plan: PlanStep[] = [];
/** Whether the LangGraph backend answered at the start of this run. */
let backendUp = false;
/** Moments the backend Reviewer sent to the person, by id. */
let reviewFlags = new Map<number, string>();

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
  const started = performance.now();
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
    const boosted = applyReactionBoost(candidates);
    trace.add({ agent: "reactions", action: `listened to ${count(candidates.length, "moment")}`, tool: "audioset model (on this device)", status: "ok", ms: performance.now() - started });
    return boosted;
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    trace.add({ agent: "reactions", action: "listen for laughter and shouting", status: "skipped", ms: performance.now() - started, detail: message });
    post({ type: "warn", message: `Laughter detection was skipped: ${message}` });
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

interface SpanInput {
  from: number;
  to: number;
  at: number;
}

/** The Transcriber's tools: the chosen cloud service first, then the free model on this device. Each caches its own words. */
function transcriptionChain(media: OpenedMedia, options: RunOptions, fp: string): ToolChain<SpanInput, Word[]> {
  const transcribe = (provider: RunOptions["stt"]["provider"], name: string): Tool<SpanInput, Word[]> => ({
    name,
    run: ({ from, to, at }) =>
      remember<Word[]>(`stt:${fp}:${provider}:${from}:${to}`, async () => {
        const pcm = await readPcm16k(media, from, to);
        const words = provider === "local"
          ? await transcribeLocal(pcm, (message) => progress("transcribing", at, message))
          : await transcribeRemote({ ...options.stt, provider }, pcm);
        return collapseRepeats(words).map((w) => ({ ...w, start: w.start + from, end: w.end + from }));
      }),
  });
  const tools = [transcribe(options.stt.provider, sttToolName(options.stt.provider))];
  if (options.stt.provider !== "local") tools.push(transcribe("local", LOCAL_STT));
  return new ToolChain("transcriber", tools, trace);
}

/** Transcribes each candidate's span. A failed one keeps whatever words it already had. */
async function transcribeCandidates(media: OpenedMedia, candidates: Candidate[], chain: ToolChain<SpanInput, Word[]>, pass: Pass): Promise<boolean> {
  let failed = 0;
  let lastError = "";
  const [from, to] = pass.progress;
  for (const [i, c] of candidates.entries()) {
    const at = from + ((to - from) * i) / candidates.length;
    progress("transcribing", at, `${pass.label} ${i + 1} of ${candidates.length}`);
    const span = pass.span(c, media.durationSec);
    try {
      c.words = (await chain.call(`${pass.label.toLowerCase()} ${i + 1}`, { ...span, at })).output;
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
  const started = performance.now();
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
  trace.add({ agent: "watcher", action: `watched ${candidates.length - failed} of ${candidates.length} moments`, tool: "face and motion model", status: failed === candidates.length ? "failed" : "ok", ms: performance.now() - started, ...(failed ? { detail: lastError } : {}) });
  if (failed) post({ type: "warn", message: `${failed} of ${candidates.length} moments couldn’t be watched (${lastError}), so they rely on sound and speech.` });
}

/** The Judge's tools: the AI model reviews the finalists, and the signal ranker takes over if it fails or approves nothing. */
async function chooseMoments(file: File, candidates: Candidate[], options: RunOptions, hasTranscript: boolean, fp: string): Promise<{ moments: SelectedMoment[]; usedLlm: boolean }> {
  const { llm } = options;
  const bySignals: Tool<Candidate[], SelectedMoment[]> = { name: SIGNAL_RANKER, run: async (list) => selectBySignals(list, options.clipCount, options.length) };
  const tools: Tool<Candidate[], SelectedMoment[]>[] = [bySignals];
  const agentTeam: Tool<Candidate[], SelectedMoment[]> = {
    name: BACKEND_AGENTS,
    run: async (list) => {
      progress("judging", 0, `The agent team is judging ${list.length} moments`);
      const key = `agents:${fp}:${options.clipCount}:${options.length}:${list.map((c) => `${c.peakSec}/${c.words.length}`).join(",")}`;
      const out = await remember(key, async () => {
        const { verdicts, flags } = await judgeWithAgents(list, options.clipCount, options.length, file.name, (step) => trace.add(step));
        return { verdicts, flags: [...flags] };
      });
      const moments = applyVerdicts(list, out.verdicts, options.clipCount, options.length);
      if (!moments.length) throw new Error("The agents didn’t approve any moment.");
      reviewFlags = new Map(out.flags);
      return moments;
    },
  };
  if (llm && hasTranscript) {
    tools.unshift({
      name: llm.model,
      run: async (list) => {
        progress("judging", 0, `Asking ${llm.model} to judge ${list.length} moments`);
        // Saved so that resuming a run doesn't bill the user's key a second time.
        const key = `judge:${fp}:${llm.provider}:${llm.model}:${options.clipCount}:${options.length}:${list.map((c) => `${c.peakSec}/${c.words.length}`).join(",")}`;
        const moments = await remember(key, () => judgeCandidates(llm, file.name, list, options.clipCount, options.length));
        if (!moments.length) throw new Error("The model didn’t approve any moment.");
        return moments;
      },
    });
  } else if (llm) {
    trace.add({ agent: "judge", action: "skip the AI judge", tool: llm.model, status: "skipped", ms: 0, detail: "no transcript to judge" });
  }
  if (backendUp) tools.unshift(agentTeam);
  const { output, tool } = await new ToolChain("judge", tools, trace).call(`pick up to ${options.clipCount} of ${count(candidates.length, "finalist")}`, candidates);
  const usedLlm = tool !== SIGNAL_RANKER;
  if ((backendUp || (llm && hasTranscript)) && !usedLlm) post({ type: "warn", message: "The AI judge didn’t give a usable answer, so clips are ranked by signals alone." });
  return { moments: output, usedLlm };
}

interface Placement {
  rank: number;
  rankReason?: string;
  route?: RouteDecision;
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

async function renderAll(media: OpenedMedia, moments: SelectedMoment[], routes: RouteDecision[], options: RunOptions, fp: string, file: File): Promise<void> {
  let rendered = 0;
  const rankReasons = explainRanks(moments);
  for (const [i, m] of moments.entries()) {
    try {
      progress("rendering", i / moments.length, `Rendering clip ${i + 1} of ${moments.length}`);
      const place = { rank: rendered + 1, rankReason: rankReasons[i], route: routes[i] };
      const clip = await trace.time("editor", `render clip ${i + 1}`, () =>
        renderOne(media, m, options, fp, file, place, (f) => progress("rendering", (i + f) / moments.length, `Rendering clip ${i + 1} of ${moments.length}`)), "webcodecs renderer");
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
    plan,
    trace: trace.steps,
  };
  await saveRunReport(entry).catch(() => undefined);
}

async function run({ file, chatText, options }: RunRequest): Promise<void> {
  setGentle(options.gentle ?? false);
  trace = new Trace((step) => post({ type: "trace", step }));
  reviewFlags = new Map();
  const planned = performance.now();
  backendUp = await backendReady();
  plan = planRun({ hasChat: Boolean(chatText), stt: options.stt.provider, llm: options.llm && { provider: options.llm.provider, model: options.llm.model }, watchVideo: options.watchVideo, clipCount: options.clipCount, backend: backendUp });
  trace.add({ agent: "planner", action: `planned ${plan.length} agents`, status: "ok", ms: performance.now() - planned, detail: `${plan.map((p) => AGENT_LABELS[p.agent]).join(" → ")}; agents backend ${backendUp ? "on" : "off"}` });
  post({ type: "plan", steps: plan });
  await assertBrowserCanRender();
  if (options.llm) {
    progress("keys", 0, "Checking your API key");
    const { provider, apiKey, model } = options.llm;
    await trace.time("planner", "check the AI key works", () => listModels(provider, apiKey), model);
  }

  const fp = sourceFingerprint(file);
  await setLastRun({ fileName: file.name, status: "running", settings: resumableSettings(options) });

  progress("measuring", 0, "Opening your video");
  const media = await openMedia(file);
  streamMinutes = Math.round(media.durationSec / 60);
  const features = await trace.time("listener", `measure ${streamMinutes} minutes of audio`, () =>
    remember<AudioFeatures>(`features:${fp}`, () =>
      measureAudio(media, (f, loudnessSoFar) => {
        progress("measuring", f, `Measuring voice and audio: ${Math.round(f * 100)}%`);
        post({ type: "waveform", bars: waveformBars(loudnessSoFar, media.durationSec) });
      })
    ), "audio analysis (on this device)");
  post({ type: "waveform", bars: waveformBars(features.loudnessDb, media.durationSec) });

  const messages = chatText ? parseLiveChat(chatText) : [];
  if (chatText) trace.add({ agent: "chat", action: `read ${messages.length} chat messages`, tool: "chat replay parser", status: messages.length ? "ok" : "skipped", ms: 0, ...(messages.length ? {} : { detail: "no readable messages" }) });
  if (chatText && !messages.length) post({ type: "warn", message: "That chat file had no readable messages, so it was ignored." });

  const shortlisted = performance.now();
  const { candidates: found, summary } = analyzeSignals(features, messages, options.clipCount, options.length);
  trace.add({ agent: "listener", action: `shortlisted ${count(found.length, "moment")}`, status: found.length ? "ok" : "failed", ms: performance.now() - shortlisted });
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
  trace.add({ agent: "planner", action: twoPasses ? "replan: two transcription passes" : "replan: one transcription pass", status: "ok", ms: 0, detail: twoPasses ? `${reacted.length} moments for ${finalistCount} finalist places, so short snippets first` : `only ${count(reacted.length, "moment")}, so every one gets its full window` });
  const stt = transcriptionChain(media, options, fp);
  const heard = await transcribeCandidates(media, reacted, stt, twoPasses ? SNIPPETS : EVERY_MOMENT);
  for (const c of reacted) c.extra = { ...c.extra, ...speechExtras(c) };
  await watchCandidates(media, reacted, options, fp);
  const ranking = performance.now();
  const ranked = applyMoments(reacted, learnTaste(await listRatings()));
  const finalists = ranked.slice(0, finalistCount);
  trace.add({ agent: "ranker", action: `ranked ${count(ranked.length, "moment")}, kept ${count(finalists.length, "finalist")}`, tool: "weighted signal fusion", status: "ok", ms: performance.now() - ranking });
  const usedTranscript = twoPasses && heard ? (await transcribeCandidates(media, finalists, stt, FINALISTS)) || heard : heard;
  await releaseSpeechModel();
  const { moments, usedLlm } = await chooseMoments(file, finalists, options, usedTranscript, fp);
  post({ type: "summary", summary, usedTranscript, usedLlm });

  // A strict length is the length of the finished file, end card included.
  const fitted = options.length === "auto" ? moments : moments.map((m) => ({ ...m, endSec: m.endSec - outroLength(options.outro, m.endSec, media.durationSec) }));

  const routing = performance.now();
  const { kept, dropped } = routeMoments(fitted, reviewFlags);
  const review = kept.filter((r) => r.decision.route === "review").length;
  for (const d of dropped) trace.add({ agent: "router", action: `dropped "${d.moment.title.slice(0, 40)}"`, status: "ok", ms: 0, detail: d.decision.why });
  trace.add({ agent: "router", action: `${kept.length - review} kept, ${review} sent to you, ${dropped.length} dropped`, tool: "confidence rules", status: "ok", ms: performance.now() - routing });
  if (dropped.length) post({ type: "warn", message: `${dropped.length} weak ${dropped.length === 1 ? "pick was" : "picks were"} dropped by the confidence check.` });
  await renderAll(media, kept.map((r) => r.moment), kept.map((r) => r.decision), options, fp, file);
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
