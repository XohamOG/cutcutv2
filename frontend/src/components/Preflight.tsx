"use client";

import { useEffect, useState } from "react";
import { checkBeforeStart } from "@/lib/highlights/preflight";
import type { ClipLength } from "@/lib/highlights/types";
import styles from "./app.module.css";

interface Device {
  durationSec: number;
  hasGpu: boolean;
  modelsCached: boolean;
  memoryGb: number | null;
  freeBytes: number | null;
}

async function readDevice(file: File): Promise<Device> {
  const durationSec = await new Promise<number>((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    const finish = (value: number) => {
      // Stops the element reading on, which would fail once the URL is gone.
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      resolve(value);
    };
    video.preload = "metadata";
    video.onloadedmetadata = () => finish(video.duration);
    video.onerror = () => finish(0);
    video.src = url;
  });
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> }; deviceMemory?: number });
  const [adapter, estimate, modelsCached] = await Promise.all([
    gpu.gpu?.requestAdapter().catch(() => null) ?? null,
    navigator.storage?.estimate?.().catch(() => null) ?? null,
    caches.has("transformers-cache").catch(() => false),
  ]);
  const free = estimate?.quota !== undefined ? estimate.quota - (estimate.usage ?? 0) : null;
  return { durationSec, hasGpu: Boolean(adapter), modelsCached, memoryGb: gpu.deviceMemory ?? null, freeBytes: free };
}

export default function PreflightLine({ file, clipCount, length, localTranscription, watchVideo, gentle }: { file: File; clipCount: number; length: ClipLength; localTranscription: boolean; watchVideo: boolean; gentle: boolean }) {
  const [device, setDevice] = useState<Device | null>(null);

  useEffect(() => {
    let live = true;
    void readDevice(file).then((d) => {
      if (live) setDevice(d);
    });
    return () => {
      live = false;
    };
  }, [file]);

  if (!device || !device.durationSec) return null;
  const check = checkBeforeStart({ ...device, clipCount, length, localTranscription, watchVideo, gentle });
  return (
    <p className={styles.preflight}>
      <b>{check.time}</b>
      {check.notes.map((n) =>
        n.href ? (
          <a key={n.text} className={styles.link} href={n.href} target="_blank" rel="noreferrer">{n.text}</a>
        ) : (
          <span key={n.text} className={n.warn ? styles.preflightWarn : undefined}>{n.text}</span>
        )
      )}
      <span>Keep this tab open.</span>
    </p>
  );
}
