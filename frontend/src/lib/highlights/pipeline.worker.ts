/// <reference lib="webworker" />
import type { AudioFeatures, Candidate, ClipResult, ClipSettings, EditRequest, RunOptions, RunRequest, SelectedMoment, WorkerEvent, WorkerRequest, Word } from "./types";
import { analyzeSignals, applyReactionBoost } from "./analyze.ts";
import { collapseRepeats, explainRanks, selectBySignals } from "./selection.ts";
import { applyMoments, learnTaste, speechExtras } from "./moments.ts";
import { createScreenReader, watchMoment, type ScreenReader } from "./vision.ts";
import { parseLiveChat } from "./signals.ts";
import { listModels, judgeCandidates, transcribeRemote } from "./providers.ts";
import { detectReactions, transcribeLocal } from "./localModels.ts";
import { waveformBars } from "./progress.ts";
import { measureAudio, openMedia, readPcm16k, type OpenedMedia } from "./media.ts";
import { assertBrowserCanRender, outroLength, renderClip } from "./render.ts";
import { deleteClip, hashKey, listRatings, loadClip, markRunFinished, remember, resumableSettings, saveClip, saveRating, setLastRun, sourceFingerprint, updateClip } from "./storage.ts";

const REACTION_BEFORE_SEC = 8;
const REACTION_AFTER_SEC = 12;
/** Reading the screen is the slowest step, so only the strongest moments get it. */
const MAX_SCREEN_READS = 10;

const post = (event: WorkerEvent) => self.postMessage(event);
const progress = (stage: string, fraction: number, message: string) => post({ type: "progress", stage, fraction, message });

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
  }
}

async function transcribeCandidates(media: OpenedMedia, candidates: Candidate[], options: RunOptions, fp: string): Promise<boolean> {
  let failed = 0;
  let lastError = "";
  for (const [i, c] of candidates.entries()) {
    progress("transcribing", i / candidates.length, `Transcribing moment ${i + 1} of ${candidates.length}`);
    try {
      c.words = await remember<Word[]>(`stt:${fp}:${options.stt.provider}:${c.windowStart}:${c.windowEnd}`, async () => {
        const pcm = await readPcm16k(media, c.windowStart, c.windowEnd);
        const words = options.stt.provider === "local"
          ? await transcribeLocal(pcm, (message) => progress("transcribing", 0, message))
          : await transcribeRemote(options.stt, pcm);
        return collapseRepeats(words).map((w) => ({ ...w, start: w.start + c.windowStart, end: w.end + c.windowStart }));
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
  const edit = {
    sourceFp: fp,
    windowStart: m.candidate.windowStart,
    windowEnd: m.candidate.windowEnd,
    endSec: m.endSec,
    words: m.candidate.words,
    settings: { template: options.template, regions: options.regions, framing: options.framing, outro: options.outro, burnCaptions: options.burnCaptions },
  };
  // Everything that changes the pixels is in the id, so a new layout renders fresh.
  const id = await hashKey({ fp, start: m.startSec, end: m.endSec, template: options.template, regions: options.regions, framing: options.framing, outro: options.outro, words: words.map((w) => w.text).join(" "), hook: m.hook, title: m.title });
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
      post({ type: "clip", clip });
    } catch (err) {
      post({ type: "warn", message: `Clip ${i + 1} failed and was skipped: ${err instanceof Error ? err.message : "unknown error"}` });
    }
  }
  if (!rendered) throw new Error("Every selected clip failed to render.");
}

async function run({ file, chatText, options }: RunRequest): Promise<void> {
  await assertBrowserCanRender();
  if (options.llm) {
    progress("keys", 0, "Checking your API key");
    await listModels(options.llm.provider, options.llm.apiKey);
  }

  const fp = sourceFingerprint(file);
  await setLastRun({ fileName: file.name, status: "running", settings: resumableSettings(options) });

  progress("measuring", 0, "Opening your video");
  const media = await openMedia(file);
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
  const usedTranscript = await transcribeCandidates(media, reacted, options, fp);
  for (const c of reacted) c.extra = { ...c.extra, ...speechExtras(c) };
  await watchCandidates(media, reacted, options, fp);
  const candidates = applyMoments(reacted, learnTaste(await listRatings()));
  const { moments, usedLlm } = await chooseMoments(file, candidates, options, usedTranscript, fp);
  post({ type: "summary", summary, usedTranscript, usedLlm });

  // A strict length is the length of the finished file, end card included.
  const fitted = options.length === "auto" ? moments : moments.map((m) => ({ ...m, endSec: m.endSec - outroLength(options.outro, m.endSec, media.durationSec) }));
  await renderAll(media, fitted, options, fp, file);
  await markRunFinished();
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
  run(request).catch(async (err: unknown) => {
    await markRunFinished();
    post({ type: "error", message: err instanceof Error ? err.message : "The run failed." });
  });
};
