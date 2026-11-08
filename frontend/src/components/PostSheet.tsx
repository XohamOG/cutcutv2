"use client";

import { useState } from "react";
import { hashtags, tagList, tiktokCaption, type PostInput, type PostText } from "@/lib/highlights/postText";
import type { LlmKey } from "@/lib/highlights/types";
import { Bars, CopyButton, Pill, Segment } from "./ui";
import styles from "./app.module.css";

const PLATFORMS = [
  { id: "youtube", label: "YouTube" },
  { id: "tiktok", label: "TikTok" },
] as const;

export interface PostResult {
  text: PostText;
  searched: boolean;
}

function CopyBlock({ label, shown, value = shown }: { label: string; shown: string; value?: string }) {
  if (!shown) return null;
  return (
    <div className={styles.copyBlock}>
      <div className={styles.copyHead}>
        <span className={styles.settingTitle}>{label}</span>
        <CopyButton text={value} label={label} />
      </div>
      <p>{shown}</p>
    </div>
  );
}

interface PostSheetProps {
  input: Omit<PostInput, "game">;
  llm: LlmKey | undefined;
  game: string;
  onGame: (game: string) => void;
  result: PostResult | null;
  onResult: (result: PostResult) => void;
  onClose: () => void;
  onOpenSettings: () => void;
}

export default function PostSheet({ input, llm, game, onGame, result, onResult, onClose, onOpenSettings }: PostSheetProps) {
  const [platform, setPlatform] = useState<"youtube" | "tiktok">("youtube");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const write = async () => {
    if (!llm) return;
    setBusy(true);
    setError("");
    try {
      const { writePostText } = await import("@/lib/highlights/providers");
      onResult(await writePostText(llm, { ...input, game: game.trim() }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "The text couldn’t be written. Try again.");
    }
    setBusy(false);
  };

  const text = result?.text[platform];

  return (
    <>
      <div className={styles.sheetHead}>
        <h2 className={styles.title}>post text</h2>
        <Pill variant="ghost" onClick={onClose}>close</Pill>
      </div>

      {!llm ? (
        <div className={styles.group}>
          <p className={styles.lead}>Add an AI key to get a title, description and tags for each clip.</p>
          <Pill
            variant="orange"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
          >
            add a key
          </Pill>
        </div>
      ) : (
        <>
          <div className={styles.group}>
            <label className={styles.setting}>
              <span>game (optional)</span>
              <input className={styles.line} placeholder="Valorant" autoComplete="off" value={game} maxLength={60} onChange={(e) => onGame(e.target.value)} />
            </label>
            <div className={styles.row}>
              <Pill variant="orange" disabled={busy} onClick={() => void write()}>{result ? "write again" : "write it"}</Pill>
              {busy && <Bars label="Writing your post text" />}
            </div>
            {error && <p className={styles.errorLine} role="alert">{error}</p>}
          </div>

          {result && text && (
            <div className={styles.group}>
              <Segment label="platform" name="post-platform" value={platform} options={PLATFORMS} onChange={setPlatform} />
              <CopyBlock label="title" shown={text.title} />
              <CopyBlock label="description" shown={text.description} />
              <CopyBlock label="tags" shown={hashtags(text.tags)} value={platform === "youtube" ? tagList(text.tags) : hashtags(text.tags)} />
              {platform === "tiktok" && <CopyBlock label="full caption" shown="Title, description and hashtags together." value={tiktokCaption(text)} />}
              <p className={styles.caption}>Written by AI, so check it before posting. {result.searched ? "Checked current web results." : `Written without live trends. ${llm.provider === "gemini" || llm.provider === "anthropic" ? "The web search wasn’t available this time." : "Gemini and Claude keys can search the web."}`}</p>
            </div>
          )}
        </>
      )}
    </>
  );
}
