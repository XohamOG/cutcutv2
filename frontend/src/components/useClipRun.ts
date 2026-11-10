"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ClipChange, ClipResult, Rating, RunOptions, RunSettings, WorkerEvent } from "@/lib/highlights/types";
import { WAVE_SLICES, overallProgress, stageLabel } from "@/lib/highlights/progress";
import { clearSavedWork, getLastRun, listSavedClips, markRunFinished, saveRating, type LastRun } from "@/lib/highlights/storage";
import { SITE } from "@/lib/site";

export type ClipView = ClipResult & { url: string };

export interface RunState {
  status: "running" | "done" | "error";
  overall: number;
  label: string;
  stage: string | null;
  error: string | null;
  warnings: string[];
  clips: ClipView[];
  bars: (number | null)[];
  moments: number[];
}

const canNotify = () => typeof Notification !== "undefined";

type WakeLock = EventTarget & { release: () => Promise<void> };
type WakeLockNavigator = Navigator & { wakeLock?: { request: (type: "screen") => Promise<WakeLock> } };

export function useClipRun(onRestore: (settings: RunSettings) => void) {
  const [run, setRun] = useState<RunState | null>(null);
  const [savedClips, setSavedClips] = useState<ClipView[]>([]);
  const [interrupted, setInterrupted] = useState<LastRun | null>(null);
  const [notify, setNotify] = useState(false);
  const notifyRef = useRef(false);
  const workerRef = useRef<Worker | null>(null);
  const clipUrls = useRef<string[]>([]);
  const savedUrls = useRef<string[]>([]);
  const restore = useRef(onRestore);
  const wakeLock = useRef<WakeLock | null>(null);
  const running = useRef(false);

  // A sleeping screen can pause the work, so the screen stays on while a run is going.
  const holdAwake = async () => {
    if (!running.current || wakeLock.current || document.visibilityState !== "visible") return;
    const lock = await (navigator as WakeLockNavigator).wakeLock?.request("screen").catch(() => null);
    if (!lock) return;
    wakeLock.current = lock;
    lock.addEventListener("release", () => {
      if (wakeLock.current === lock) wakeLock.current = null;
    });
  };

  const stopWorker = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    running.current = false;
    void wakeLock.current?.release().catch(() => undefined);
    wakeLock.current = null;
  };
  const release = (urls: { current: string[] }) => {
    urls.current.forEach((url) => URL.revokeObjectURL(url));
    urls.current = [];
  };

  useEffect(() => {
    const onVisible = () => void holdAwake();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([listSavedClips(), getLastRun()]).then(([clips, last]) => {
      if (!active) return;
      setSavedClips(
        clips.map((clip) => {
          const url = URL.createObjectURL(clip.blob);
          savedUrls.current.push(url);
          return { ...clip, url };
        })
      );
      if (last?.status === "running") {
        setInterrupted(last);
        restore.current(last.settings);
      }
    });
    return () => {
      active = false;
      stopWorker();
      release(clipUrls);
      release(savedUrls);
    };
  }, []);

  const announce = useCallback((title: string) => {
    if (notifyRef.current && canNotify() && Notification.permission === "granted" && (document.hidden || !document.hasFocus())) {
      new Notification(title, { icon: "/icon.svg" });
    }
  }, []);

  const handleEvent = useCallback(
    (event: WorkerEvent) => {
      setRun((r) => {
        if (!r) return r;
        switch (event.type) {
          case "progress":
            return { ...r, stage: event.stage, label: stageLabel(event.stage, event.message), overall: Math.max(r.overall, overallProgress(event.stage, event.fraction)) };
          case "waveform":
            return { ...r, bars: event.bars };
          case "moments":
            return { ...r, moments: event.positions };
          case "warn":
            return { ...r, warnings: [...r.warnings, event.message] };
          case "clip": {
            const url = URL.createObjectURL(event.clip.blob);
            clipUrls.current.push(url);
            return { ...r, clips: [...r.clips, { ...event.clip, url }] };
          }
          case "done":
            return { ...r, status: "done", overall: 1 };
          case "error":
            return { ...r, status: "error", error: event.message };
          default:
            return r;
        }
      });
      if (event.type === "done") announce("Your clips are ready");
      if (event.type === "error") announce("Something went wrong");
      if (event.type === "done" || event.type === "error") stopWorker();
    },
    [announce]
  );

  const start = useCallback(
    async (file: File, chatFile: File | null, options: RunOptions) => {
      setInterrupted(null);
      void navigator.storage?.persist?.();
      stopWorker();
      release(clipUrls);
      setRun({ status: "running", overall: 0, label: "getting ready", stage: null, error: null, warnings: [], clips: [], bars: new Array(WAVE_SLICES).fill(null), moments: [] });
      const worker = new Worker(new URL("../lib/highlights/pipeline.worker.ts", import.meta.url), { type: "module" });
      workerRef.current = worker;
      running.current = true;
      void holdAwake();
      worker.onmessage = (message: MessageEvent<WorkerEvent>) => handleEvent(message.data);
      worker.onerror = (err) => handleEvent({ type: "error", message: err.message || "The processing worker crashed." });
      worker.postMessage({ type: "run", file, chatText: chatFile ? await chatFile.text() : null, options });
    },
    [handleEvent]
  );

  const cancel = useCallback(() => {
    stopWorker();
    setRun(null);
    void markRunFinished();
  }, []);

  /** Back to the start. Finished clips stay in the saved list. */
  const reset = useCallback(() => {
    setSavedClips((saved) => {
      const known = new Set(saved.map((c) => c.id));
      return [...(run?.clips.filter((c) => !known.has(c.id)) ?? []), ...saved];
    });
    savedUrls.current.push(...clipUrls.current);
    clipUrls.current = [];
    setRun(null);
  }, [run]);

  const enableNotify = useCallback(async () => {
    if (!canNotify()) return;
    const on = (await Notification.requestPermission()) === "granted";
    notifyRef.current = on;
    setNotify(on);
  }, []);

  const updateClips = useCallback((update: (clip: ClipView) => ClipView) => {
    setRun((r) => (r ? { ...r, clips: r.clips.map(update) } : r));
    setSavedClips((saved) => saved.map(update));
  }, []);

  const rateClip = useCallback(
    (clip: ClipView, rating: Rating | null) => {
      void saveRating(clip, rating);
      updateClips((c) => (c.id === clip.id ? { ...c, rating: rating ?? undefined } : c));
    },
    [updateClips]
  );

  /** Re-cuts one clip in its own worker. Resolves when the new version is in place. */
  const editClip = useCallback(
    (clip: ClipView, file: File, change: ClipChange, onProgress: (fraction: number) => void) =>
      new Promise<void>((resolve, reject) => {
        const worker = new Worker(new URL("../lib/highlights/pipeline.worker.ts", import.meta.url), { type: "module" });
        worker.onerror = (err) => {
          worker.terminate();
          reject(new Error(err.message || "That edit didn’t save."));
        };
        worker.onmessage = ({ data }: MessageEvent<WorkerEvent>) => {
          if (data.type === "progress") onProgress(data.fraction);
          if (data.type === "error") {
            worker.terminate();
            reject(new Error(data.message));
          }
          if (data.type !== "edited") return;
          worker.terminate();
          const url = URL.createObjectURL(data.clip.blob);
          clipUrls.current.push(url);
          updateClips((c) => (c.id === clip.id ? { ...data.clip, url } : c));
          URL.revokeObjectURL(clip.url);
          resolve();
        };
        const { url: _url, ...plain } = clip; // eslint-disable-line @typescript-eslint/no-unused-vars
        worker.postMessage({ type: "edit", file, clip: plain, change });
      }),
    [updateClips]
  );

  const dismissInterrupted = useCallback(() => {
    setInterrupted(null);
    void markRunFinished();
  }, []);

  const clearSaved = useCallback(async () => {
    await clearSavedWork();
    release(savedUrls);
    setSavedClips([]);
    setInterrupted(null);
  }, []);

  const busy = run?.status === "running";
  const percent = run ? Math.round(run.overall * 100) : 0;

  useEffect(() => {
    if (busy) document.title = `${percent}% · ${SITE.name}`;
    else document.title = run?.status === "done" ? `Done · ${SITE.name}` : SITE.name;
  }, [busy, percent, run?.status]);

  useEffect(() => {
    if (!busy) return;
    let lock: WakeLockSentinel | null = null;
    const acquire = () => {
      navigator.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => undefined);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") acquire();
    };
    const warnBeforeLeaving = (e: BeforeUnloadEvent) => e.preventDefault();
    acquire();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("beforeunload", warnBeforeLeaving);
      void lock?.release();
    };
  }, [busy]);

  return { run, savedClips, interrupted, notify, canNotify: canNotify(), start, cancel, reset, enableNotify, dismissInterrupted, clearSaved, editClip, rateClip };
}
