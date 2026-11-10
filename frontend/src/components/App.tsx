"use client";

import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CaptionStyle, ClipLength, FramingOptions, RunOptions, RunSettings, SplitRegions, TemplateId } from "@/lib/highlights/types";
import { DEFAULT_CAPTIONS, DEFAULT_FRAMING } from "@/lib/highlights/templates";
import { suggestGentle } from "@/lib/highlights/pace";
import { SITE } from "@/lib/site";
import ClipsScreen from "./ClipsScreen";
import DropScreen from "./DropScreen";
import FramingStudio from "./FramingStudio";
import Intro from "./Intro";
import PreflightLine from "./Preflight";
import ReportSheet from "./ReportSheet";
import SettingsSheet, { type StoredKeys, type StudioSettings } from "./SettingsSheet";
import WorkScreen from "./WorkScreen";
import { Pill, SPRING, Segment, Stepper, useStage } from "./ui";
import { useClipRun } from "./useClipRun";
import styles from "./app.module.css";

const KEYS_STORAGE = "viralbits.keys";
const EMPTY_KEYS: StoredKeys = { llmProvider: "gemini", llmKey: "", llmModel: "", sttProvider: "local", sttKey: "" };
const DEFAULT_REGIONS: SplitRegions = { cam: { x: 0.02, y: 0.62, w: 0.22, h: 0.38 }, game: { x: 0, y: 0, w: 1, h: 1 } };
const LENGTHS = [
  { id: "auto", label: "auto" },
  { id: "15", label: "15s" },
  { id: "30", label: "30s" },
  { id: "60", label: "60s" },
  { id: "75", label: "75s" },
  { id: "120", label: "2m" },
];
const STEPS = ["drop", "frame", "work", "clips"] as const;

function loadKeys(): StoredKeys {
  try {
    const saved = localStorage.getItem(KEYS_STORAGE) ?? sessionStorage.getItem(KEYS_STORAGE);
    return saved ? { ...EMPTY_KEYS, ...JSON.parse(saved) } : EMPTY_KEYS;
  } catch {
    return EMPTY_KEYS;
  }
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [chatFile, setChatFile] = useState<File | null>(null);
  const [clipCount, setClipCount] = useState(5);
  const [clipLength, setClipLength] = useState<ClipLength>("auto");
  const [template, setTemplate] = useState<TemplateId>("stacked");
  const [regions, setRegions] = useState<SplitRegions>(DEFAULT_REGIONS);
  const [framing, setFraming] = useState<FramingOptions>(DEFAULT_FRAMING);
  const [captions, setCaptions] = useState<CaptionStyle>(DEFAULT_CAPTIONS);
  const [settings, setSettings] = useState<StudioSettings>({ burnCaptions: true, watchVideo: true, gentle: true, outroEnabled: false, outroMessage: "Follow for more", outroHandle: "" });
  const [keys, setKeys] = useState<StoredKeys>(loadKeys);
  const [remember, setRemember] = useState(() => localStorage.getItem(KEYS_STORAGE) !== null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [formError, setFormError] = useState("");
  const mainRef = useRef<HTMLElement>(null);
  const firstScreen = useRef(true);
  const { screen: screenVariants, item } = useStage();

  const restored = useRef(false);
  const restore = useCallback((s: RunSettings) => {
    restored.current = true;
    setClipCount(s.clipCount);
    if (s.length !== undefined) setClipLength(s.length);
    if (s.template) setTemplate(s.template);
    setRegions(s.regions);
    if (s.framing) setFraming({ ...DEFAULT_FRAMING, ...s.framing });
    if (s.captions) setCaptions({ ...DEFAULT_CAPTIONS, ...s.captions });
    setSettings((now) => ({ burnCaptions: s.burnCaptions, watchVideo: s.watchVideo ?? true, gentle: s.gentle ?? now.gentle, outroEnabled: s.outro.enabled, outroMessage: s.outro.message, outroHandle: s.outro.handle }));
  }, []);
  const { run, savedClips, interrupted, notify, canNotify, start, cancel, reset, enableNotify, dismissInterrupted, clearSaved, editClip, rateClip } = useClipRun(restore);

  // Gentle by default, unless this looks like a strong machine on mains power.
  useEffect(() => {
    void suggestGentle().then((gentle) => {
      if (!restored.current) setSettings((s) => ({ ...s, gentle }));
    });
  }, []);

  useEffect(() => {
    const [keep, clear] = remember ? [localStorage, sessionStorage] : [sessionStorage, localStorage];
    clear.removeItem(KEYS_STORAGE);
    if (keys.llmKey || keys.sttKey) keep.setItem(KEYS_STORAGE, JSON.stringify(keys));
    else keep.removeItem(KEYS_STORAGE);
  }, [keys, remember]);

  const screen: (typeof STEPS)[number] = run ? (run.status === "done" ? "clips" : "work") : showSaved ? "clips" : file ? "frame" : "drop";

  // A new screen is a new page to keyboard and screen-reader users.
  useEffect(() => {
    if (firstScreen.current) {
      firstScreen.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    mainRef.current?.focus({ preventScroll: true });
  }, [screen]);

  const startOver = () => {
    reset();
    setFile(null);
    setShowSaved(false);
  };

  const makeClips = () => {
    if (!file) return;
    if (keys.llmKey && !keys.llmModel) return setFormError("Your AI key isn’t ready. Open settings and paste it again.");
    if (keys.sttProvider !== "local" && !keys.sttKey) return setFormError("Add a transcription key in settings.");
    setFormError("");
    const options: RunOptions = {
      clipCount,
      length: clipLength,
      template,
      regions,
      framing,
      outro: { enabled: settings.outroEnabled, message: settings.outroMessage.trim() || "Follow for more", handle: settings.outroHandle.trim() },
      burnCaptions: settings.burnCaptions,
      captions,
      watchVideo: settings.watchVideo,
      gentle: settings.gentle,
      stt: { provider: keys.sttProvider, apiKey: keys.sttKey || undefined },
      llm: keys.llmKey ? { provider: keys.llmProvider, apiKey: keys.llmKey, model: keys.llmModel } : undefined,
    };
    void start(file, chatFile, options);
  };

  const supported = typeof VideoEncoder !== "undefined" && typeof AudioDecoder !== "undefined";

  return (
    <MotionConfig reducedMotion="user">
      <Intro />
      <div className={styles.page} id="page">
        <header className={styles.header}>
          <button type="button" className={styles.wordmark} disabled={run?.status === "running"} onClick={startOver} aria-label="viralbits, start over">{SITE.name}</button>
          <LayoutGroup id="steps">
            <div className={styles.steps} aria-hidden>
              {STEPS.map((s) => (
                <span key={s} className={styles.stepDot}>
                  {s === screen && <motion.span layoutId="step" className={styles.stepOn} transition={SPRING} />}
                </span>
              ))}
            </div>
          </LayoutGroup>
          <div className={styles.headerEnd}>
            {(screen === "frame" || screen === "drop") && <button type="button" className={styles.link} onClick={() => setSettingsOpen(true)}>settings</button>}
          </div>
        </header>

        <main className={styles.main} ref={mainRef} tabIndex={-1}>
          <AnimatePresence mode="wait">
            <motion.section key={screen} className={styles.screen} variants={screenVariants} initial="hidden" animate="visible" exit="exit">
              {screen === "drop" && <DropScreen onFile={setFile} interrupted={interrupted} onDismiss={dismissInterrupted} savedCount={savedClips.length} onShowSaved={() => setShowSaved(true)} supported={supported} onOpenSettings={() => setSettingsOpen(true)} />}

              {screen === "frame" && file && (
                <>
                  <FramingStudio file={file} template={template} onTemplate={setTemplate} regions={regions} onRegions={setRegions} framing={framing} onFraming={setFraming} captions={captions} onCaptions={setCaptions} showCaptions={settings.burnCaptions} onShowCaptions={(burnCaptions) => setSettings((s) => ({ ...s, burnCaptions }))}>
                    <Segment label="clip length" name="length" value={String(clipLength)} options={LENGTHS} onChange={(v) => setClipLength(v === "auto" ? "auto" : Number(v))} />
                  </FramingStudio>
                  <motion.div variants={item} className={styles.actionDock}>
                    <div className={styles.actionInfo}>
                      <PreflightLine file={file} clipCount={clipCount} length={clipLength} localTranscription={keys.sttProvider === "local"} watchVideo={settings.watchVideo} gentle={settings.gentle} />
                      <div className={styles.actionLinks}>
                        <button type="button" className={styles.link} onClick={() => setFile(null)}>back</button>
                        {!keys.llmKey && <button type="button" className={styles.link} onClick={() => setSettingsOpen(true)}>better picks with your own key</button>}
                        {!chatFile && <a className={styles.link} href="/chat" target="_blank" rel="noreferrer">add your chat</a>}
                      </div>
                    </div>
                    <div className={styles.actionBar}>
                      <Stepper value={clipCount} min={1} max={10} label="clips" onChange={setClipCount} />
                      {formError && <span className={styles.errorLine} role="alert">{formError}</span>}
                      <Pill variant="orange" className={styles.make} onClick={makeClips}>make clips</Pill>
                    </div>
                  </motion.div>
                </>
              )}

              {screen === "work" && run && <WorkScreen run={run} notify={notify} canNotify={canNotify} onNotify={enableNotify} onCancel={cancel} onReport={() => setReportOpen(true)} onRestart={startOver} />}

              {screen === "clips" && <ClipsScreen clips={run?.clips.length ? run.clips : savedClips} file={file} llm={keys.llmKey && keys.llmModel ? { provider: keys.llmProvider, apiKey: keys.llmKey, model: keys.llmModel } : undefined} onOpenSettings={() => setSettingsOpen(true)} onEdit={editClip} onRate={rateClip} onNew={startOver} onClear={run ? undefined : () => void clearSaved().then(startOver)} />}
            </motion.section>
          </AnimatePresence>
        </main>

        <footer className={styles.footer}>
          <span>stays on your device</span>
          <button type="button" className={styles.link} onClick={() => setReportOpen(true)}>send feedback</button>
        </footer>
      </div>

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} settings={settings} onSettings={(patch) => setSettings((s) => ({ ...s, ...patch }))} keys={keys} onKeys={(patch) => setKeys((k) => ({ ...k, ...patch }))} remember={remember} onRemember={setRemember} chatFile={chatFile} onChatFile={setChatFile} />
      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        details={{
          error: run?.error ?? null,
          stage: run?.stage ?? null,
          warnings: run?.warnings ?? [],
          fileSizeMb: file ? Math.round(file.size / 1048576) : null,
          template,
          userAgent: navigator.userAgent,
          hasGpu: "gpu" in navigator,
          secrets: [keys.llmKey, keys.sttKey],
        }}
      />
    </MotionConfig>
  );
}
