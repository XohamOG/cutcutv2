"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { applyCaptionEdits, chunkWords } from "@/lib/highlights/captions";
import { sourceFingerprint } from "@/lib/highlights/storage";
import type { ClipChange, ClipEdit } from "@/lib/highlights/types";
import type { ClipView } from "./useClipRun";
import { Bars, Pill } from "./ui";
import styles from "./app.module.css";

const MIN_CLIP_SEC = 3;
const STEP_SEC = 0.1;

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

interface EditorProps {
  clip: ClipView;
  edit: ClipEdit;
  sourceFile: File | null;
  onPickSource: (file: File) => void;
  onSave: (change: ClipChange, onProgress: (fraction: number) => void) => Promise<void>;
  onClose: () => void;
  onBusy: (busy: boolean) => void;
}

function SourcePicker({ name, wrong, onPick }: { name: string; wrong: boolean; onPick: (file: File) => void }) {
  return (
    <div className={styles.group}>
      <p className={styles.lead}>Choose the original video to edit this clip.</p>
      <label className={styles.fileLine}>
        {name}
        <input type="file" accept="video/*,.mkv" className={styles.hiddenInput} onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />
      </label>
      {wrong && <p className={styles.errorLine} role="alert">That’s a different file. Choose {name}.</p>}
    </div>
  );
}

export default function ClipEditor({ clip, edit, sourceFile, onPickSource, onSave, onClose, onBusy }: EditorProps) {
  const [start, setStart] = useState(clip.startSec);
  const [end, setEnd] = useState(edit.endSec);
  const [hook, setHook] = useState(clip.hook || clip.title);
  const [changes, setChanges] = useState<Map<number, string>>(new Map());
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState("");
  const video = useRef<HTMLVideoElement | null>(null);
  const stopAt = useRef<number | null>(null);
  const lines = useMemo(() => chunkWords(edit.words), [edit.words]);

  const attach = useCallback(
    (node: HTMLVideoElement | null) => {
      if (!node || !sourceFile) return;
      const url = URL.createObjectURL(sourceFile);
      node.src = url;
      node.currentTime = clip.startSec;
      video.current = node;
      return () => URL.revokeObjectURL(url);
    },
    [sourceFile, clip.startSec]
  );

  const source = sourceFile && sourceFingerprint(sourceFile) === edit.sourceFp ? sourceFile : null;
  const seek = (seconds: number) => {
    stopAt.current = null;
    if (!video.current) return;
    video.current.pause();
    video.current.currentTime = seconds;
  };
  const moveStart = (value: number) => {
    const next = Math.min(value, end - MIN_CLIP_SEC);
    setStart(next);
    seek(next);
  };
  const moveEnd = (value: number) => {
    const next = Math.max(value, start + MIN_CLIP_SEC);
    setEnd(next);
    seek(next);
  };
  const preview = () => {
    if (!video.current) return;
    video.current.currentTime = start;
    stopAt.current = end;
    void video.current.play();
  };
  const onTime = () => {
    if (video.current && stopAt.current !== null && video.current.currentTime >= stopAt.current) {
      video.current.pause();
      stopAt.current = null;
    }
  };

  const save = async () => {
    setError("");
    setSaving(0);
    onBusy(true);
    try {
      await onSave({ startSec: start, endSec: end, words: applyCaptionEdits(lines, changes), hook: hook.trim() }, setSaving);
      onBusy(false);
      onClose();
    } catch (err) {
      setError(`${err instanceof Error ? err.message : "That edit didn’t save."} Try again, or close other tabs first.`);
      setSaving(null);
      onBusy(false);
    }
  };

  const span = edit.windowEnd - edit.windowStart;
  const left = ((start - edit.windowStart) / span) * 100;
  const right = ((edit.windowEnd - end) / span) * 100;
  const shown = lines.map((line, i) => ({ line, i })).filter(({ line }) => line[line.length - 1].end > start && line[0].start < end);

  return (
    <>
      <div className={styles.sheetHead}>
        <h2 className={styles.title}>edit clip</h2>
        <Pill variant="ghost" disabled={saving !== null} onClick={onClose}>close</Pill>
      </div>

      {!source ? (
        <SourcePicker name={clip.sourceName} wrong={sourceFile !== null} onPick={onPickSource} />
      ) : (
        <>
          <video ref={attach} className={styles.editorVideo} muted={false} playsInline preload="metadata" onTimeUpdate={onTime} />

          <div className={styles.group}>
            <div className={styles.trimHead}>
              <span>{clock(start)} to {clock(end)}</span>
              <b>{Math.round(end - start)}s</b>
            </div>
            <div className={styles.trim}>
              <span className={styles.trimTrack} aria-hidden />
              <span className={styles.trimFill} style={{ left: `${left}%`, right: `${right}%` }} aria-hidden />
              <input type="range" aria-label="Clip start" min={edit.windowStart} max={edit.windowEnd} step={STEP_SEC} value={start} aria-valuetext={clock(start)} onChange={(e) => moveStart(Number(e.target.value))} />
              <input type="range" aria-label="Clip end" min={edit.windowStart} max={edit.windowEnd} step={STEP_SEC} value={end} aria-valuetext={clock(end)} onChange={(e) => moveEnd(Number(e.target.value))} />
            </div>
            <Pill variant="ghost" onClick={preview}>play this part</Pill>
          </div>

          <label className={styles.setting}>
            <span>on-screen title</span>
            <input className={styles.line} value={hook} maxLength={80} onChange={(e) => setHook(e.target.value)} />
          </label>

          {edit.settings.burnCaptions && (
            <div className={styles.group}>
              <span className={styles.settingTitle}>captions</span>
              {shown.length ? (
                <div className={styles.captionList}>
                  {shown.map(({ line, i }) => (
                    <label key={i} className={styles.captionRow}>
                      <span>{clock(line[0].start)}</span>
                      <input
                        className={styles.line}
                        aria-label={`Caption at ${clock(line[0].start)}`}
                        value={changes.get(i) ?? line.map((w) => w.text).join(" ")}
                        onChange={(e) => setChanges((m) => new Map(m).set(i, e.target.value))}
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <p className={styles.caption}>No speech in this part.</p>
              )}
            </div>
          )}

          {error && <p className={styles.errorLine} role="alert">{error}</p>}
          <div className={`${styles.row} ${styles.sheetFoot}`}>
            <Pill variant="orange" disabled={saving !== null} onClick={() => void save()}>
              {saving === null ? "save changes" : `saving ${Math.round(saving * 100)}%`}
            </Pill>
            {saving !== null && <Bars label="Saving your edit" />}
          </div>
        </>
      )}
    </>
  );
}
