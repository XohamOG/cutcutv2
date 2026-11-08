"use client";

import { AnimatePresence, motion } from "motion/react";
import { ReactNode, useEffect, useState } from "react";
import { DEFAULT_MODEL, detectProvider, pickDefaultModel } from "@/lib/highlights/models";
import type { LlmProvider, SttProvider } from "@/lib/highlights/types";
import Sheet from "./Sheet";
import { Bars, Pill, SPRING, Toggle } from "./ui";
import styles from "./app.module.css";

export interface StudioSettings {
  burnCaptions: boolean;
  watchVideo: boolean;
  outroEnabled: boolean;
  outroMessage: string;
  outroHandle: string;
}

export interface StoredKeys {
  llmProvider: LlmProvider;
  llmKey: string;
  llmModel: string;
  sttProvider: SttProvider;
  sttKey: string;
}

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  settings: StudioSettings;
  onSettings: (patch: Partial<StudioSettings>) => void;
  keys: StoredKeys;
  onKeys: (patch: Partial<StoredKeys>) => void;
  remember: boolean;
  onRemember: (v: boolean) => void;
  chatFile: File | null;
  onChatFile: (f: File | null) => void;
}

const GUIDE_IDS: Record<LlmProvider, string> = { gemini: "gemini", groq: "groq", anthropic: "claude", openai: "openai" };
const KEY_CHECK_DELAY_MS = 500;

type KeyCheck = "idle" | "checking" | "ok" | "bad";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={styles.setting}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function Reveal({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" className={styles.link} aria-expanded={open} onClick={() => setOpen((v) => !v)}>{label}</button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div className={styles.revealBody} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING}>
            <div className={styles.revealInner}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SettingsSheet({ open, onClose, settings, onSettings, keys, onKeys, remember, onRemember, chatFile, onChatFile }: SettingsSheetProps) {
  const [check, setCheck] = useState<KeyCheck>("idle");

  /** One Groq or OpenAI key can do both jobs, so typing it once fills both. */
  const patchKeys = (patch: Partial<StoredKeys>) => {
    const next = { ...keys, ...patch };
    const out = { ...patch };
    if (next.sttProvider === next.llmProvider) {
      const linked = keys.sttKey === keys.llmKey;
      if ("llmKey" in patch && linked) out.sttKey = patch.llmKey;
      else if ("sttKey" in patch && linked) out.llmKey = patch.sttKey;
      else if (!next.sttKey && next.llmKey) out.sttKey = next.llmKey;
      else if (!next.llmKey && next.sttKey) out.llmKey = next.sttKey;
    }
    if ("llmKey" in patch || "llmProvider" in patch) setCheck("idle");
    onKeys(out);
  };

  // Pasting is all it takes: the key is checked and a model chosen without a button.
  const { llmProvider, llmKey, llmModel } = keys;
  useEffect(() => {
    if (!open || !llmKey) return;
    let live = true;
    const timer = setTimeout(async () => {
      setCheck("checking");
      try {
        const { listModels } = await import("@/lib/highlights/providers");
        const available = await listModels(llmProvider, llmKey.trim());
        if (!live) return;
        setCheck("ok");
        const model = pickDefaultModel(llmProvider, available, llmModel);
        if (model !== llmModel) onKeys({ llmModel: model });
      } catch {
        if (live) setCheck("bad");
      }
    }, KEY_CHECK_DELAY_MS);
    return () => {
      live = false;
      clearTimeout(timer);
    };
    // Only a new key or provider needs a new check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, llmKey, llmProvider]);

  const onJudgeKey = (value: string) => {
    const detected = detectProvider(value);
    if (detected && detected !== llmProvider) patchKeys({ llmKey: value, llmProvider: detected, llmModel: DEFAULT_MODEL[detected] });
    else patchKeys({ llmKey: value });
  };

  return (
    <Sheet open={open} onClose={onClose} label="Settings" desktop="side">
      <div className={styles.sheetHead}>
        <h2 className={styles.title}>settings</h2>
        <Pill variant="ghost" onClick={onClose}>close</Pill>
      </div>

      <div className={styles.keyCard}>
        <p className={styles.keyTitle}>Free works. Your own key works better.</p>
        <ul className={styles.keyList}>
          <li><b>AI judge</b> keeps real payoffs and writes the titles</li>
          <li><b>Post text</b> writes titles, descriptions and tags for each clip</li>
          <li><b>Transcription</b> gets cleaner captions, in any language</li>
        </ul>
        <div className={styles.keyLinks}>
          <a className={styles.link} href={`/keys#${GUIDE_IDS[keys.llmProvider]}`} target="_blank" rel="noreferrer">how do i get a key?</a>
          <Reveal label="is it safe?">
            <p className={styles.caption}>Your key stays in this browser and goes straight to the provider you pick. It never reaches us. They receive short text or audio snippets, never your video. You can revoke it on their site any time.</p>
          </Reveal>
        </div>
      </div>

      <div className={styles.group}>
        <Field label="transcription">
          <select className={styles.line} value={keys.sttProvider} onChange={(e) => patchKeys({ sttProvider: e.target.value as SttProvider })}>
            <option value="local">free, english</option>
            <option value="groq">groq, any language</option>
            <option value="openai">openai, any language</option>
          </select>
        </Field>
        {keys.sttProvider !== "local" && <Field label="transcription key"><input className={styles.line} type="password" autoComplete="off" spellCheck={false} value={keys.sttKey} onChange={(e) => patchKeys({ sttKey: e.target.value })} /></Field>}
      </div>

      <div className={styles.group}>
        <Field label="ai judge (optional)">
          <select className={styles.line} value={keys.llmProvider} onChange={(e) => patchKeys({ llmProvider: e.target.value as LlmProvider, llmKey: "", llmModel: DEFAULT_MODEL[e.target.value as LlmProvider] })}>
            <option value="gemini">gemini (easiest)</option>
            <option value="groq">groq</option>
            <option value="anthropic">claude</option>
            <option value="openai">openai</option>
          </select>
        </Field>
        <Field label="ai key"><input className={styles.line} type="password" autoComplete="off" spellCheck={false} value={keys.llmKey} onChange={(e) => onJudgeKey(e.target.value)} /></Field>
        <p className={styles.keyStatus} role="status">
          {check === "checking" && <Bars />}
          {check === "ok" && "Key works. It stays in this browser."}
          {check === "bad" && <span className={styles.errorLine}>That key didn’t work. Paste it again, or see the guide.</span>}
        </p>
        {keys.llmKey && check === "ok" && (
          <Reveal label={`using ${keys.llmModel || "automatic model"} · change`}>
            <Field label="model"><input className={styles.line} autoComplete="off" spellCheck={false} value={keys.llmModel} onChange={(e) => patchKeys({ llmModel: e.target.value })} /></Field>
          </Reveal>
        )}
        <Toggle checked={remember} onChange={onRemember}>remember keys on this device</Toggle>
      </div>

      <div className={styles.group}>
        <Toggle checked={settings.burnCaptions} onChange={(burnCaptions) => onSettings({ burnCaptions })}>add captions</Toggle>
        <Toggle checked={settings.watchVideo} onChange={(watchVideo) => onSettings({ watchVideo })}>watch the video too (slower, better picks)</Toggle>
        <Toggle checked={settings.outroEnabled} onChange={(outroEnabled) => onSettings({ outroEnabled })}>add end card</Toggle>
        <AnimatePresence initial={false}>
          {settings.outroEnabled && (
            <motion.div className={styles.reveal} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING}>
              <Field label="message"><input className={styles.line} value={settings.outroMessage} maxLength={40} onChange={(e) => onSettings({ outroMessage: e.target.value })} /></Field>
              <Field label="your handle"><input className={styles.line} placeholder="@yourchannel" autoComplete="off" value={settings.outroHandle} maxLength={40} onChange={(e) => onSettings({ outroHandle: e.target.value })} /></Field>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={styles.group}>
        <span className={styles.settingTitle}>chat replay (optional)</span>
        <a className={styles.link} href="/chat" target="_blank" rel="noreferrer">how do i get this?</a>
        <label className={styles.fileLine}>
          {chatFile ? chatFile.name : "add a YouTube or Twitch .json file"}
          <input type="file" accept=".json,application/json" className={styles.hiddenInput} onChange={(e) => onChatFile(e.target.files?.[0] ?? null)} />
        </label>
      </div>
    </Sheet>
  );
}
