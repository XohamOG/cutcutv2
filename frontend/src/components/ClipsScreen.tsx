"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { clipWords } from "@/lib/highlights/captions";
import { noticed } from "@/lib/highlights/moments";
import { listRatings } from "@/lib/highlights/storage";
import type { ClipChange, LlmKey, Rating } from "@/lib/highlights/types";
import ClipEditor from "./ClipEditor";
import PostSheet, { type PostResult } from "./PostSheet";
import Sheet from "./Sheet";
import type { ClipView } from "./useClipRun";
import { Bars, Pill, PillLink, SPRING, Swap, useStage } from "./ui";
import styles from "./app.module.css";

const THUMB = "M7 21H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3m0 10V11m0 10h10.3a2 2 0 0 0 2-1.7l1.2-7A2 2 0 0 0 18.5 10H14V5.5A2.5 2.5 0 0 0 11.5 3L7 11";

function RateButton({ kind, active, onClick }: { kind: Rating; active: boolean; onClick: () => void }) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.96 }} transition={SPRING} className={`${styles.rate} ${active ? styles.rateOn : ""}`} aria-pressed={active} aria-label={kind === "up" ? "Like this clip" : "Dislike this clip"} onClick={onClick}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={kind === "down" ? { transform: "rotate(180deg)" } : undefined}>
        <path d={THUMB} />
      </svg>
    </motion.button>
  );
}

interface CardProps {
  clip: ClipView;
  sourceFile: File | null;
  onPickSource: (file: File) => void;
  llm: LlmKey | undefined;
  game: string;
  onGame: (game: string) => void;
  onOpenSettings: () => void;
  onEdit: (clip: ClipView, file: File, change: ClipChange, onProgress: (fraction: number) => void) => Promise<void>;
  onRate: (clip: ClipView, rating: Rating | null) => void;
}

function ClipCard({ clip, sourceFile, onPickSource, llm, game, onGame, onOpenSettings, onEdit, onRate }: CardProps) {
  const [saved, setSaved] = useState(false);
  const [why, setWhy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sheet, setSheet] = useState<"edit" | "post" | null>(null);
  const [post, setPost] = useState<PostResult | null>(null);
  const [saving, setSaving] = useState(false);
  const { item } = useStage();
  const name = `viralbits_clip${clip.rank}.mp4`;
  const file = new File([clip.blob], name, { type: "video/mp4" });
  const canShare = typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] });
  const { edit } = clip;

  const onDownload = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const clipEnd = edit?.endSec ?? clip.startSec + clip.durationSec;
  const rate = (kind: Rating) => onRate(clip, clip.rating === kind ? null : kind);

  return (
    <motion.article className={styles.clip} variants={item}>
      <div className={styles.playerWrap}>
        {!loaded && <div className={styles.playerLoading}><Bars /></div>}
        <video className={styles.player} src={clip.url} controls playsInline preload="metadata" onLoadedData={() => setLoaded(true)} />
      </div>
      <div className={styles.clipMeta}>
        <span className={styles.rankBadge}>#{clip.rank}</span>
        <span>{clip.score}/100 · {Math.round(clip.durationSec)}s</span>
        <span className={styles.rateRow}>
          <RateButton kind="up" active={clip.rating === "up"} onClick={() => rate("up")} />
          <RateButton kind="down" active={clip.rating === "down"} onClick={() => rate("down")} />
        </span>
      </div>
      <p className={styles.clipTitle}>{clip.title}</p>
      {clip.rankReason && <p className={styles.rankReason}>{clip.rankReason}</p>}
      <div className={styles.row}>
        <PillLink variant="orange" href={clip.url} download={name} onClick={onDownload}>
          <Swap id={saved ? "saved" : "idle"}>{saved ? "downloaded" : "download"}</Swap>
        </PillLink>
        {canShare && <Pill variant="ghost" onClick={() => navigator.share({ files: [file] }).catch(() => undefined)}>share</Pill>}
      </div>
      <div className={styles.clipLinks}>
        {edit && <button type="button" className={styles.link} onClick={() => setSheet("edit")}>edit</button>}
        <button type="button" className={styles.link} onClick={() => setSheet("post")}>post text</button>
        <button type="button" className={styles.link} aria-expanded={why} onClick={() => setWhy((v) => !v)}>more detail</button>
      </div>
      <AnimatePresence initial={false}>
        {why && (
          <motion.p className={styles.why} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING}>
            {clip.selectedBy === "llm" ? [clip.reason, noticed(clip.signals.extra).join(" · ")].filter(Boolean).join(" ") : clip.reason}
          </motion.p>
        )}
      </AnimatePresence>

      <Sheet open={sheet === "edit"} onClose={() => !saving && setSheet(null)} label="Edit clip" desktop="side">
        {edit && (
          <ClipEditor
            clip={clip}
            edit={edit}
            sourceFile={sourceFile}
            onPickSource={onPickSource}
            onClose={() => setSheet(null)}
            onBusy={setSaving}
            onSave={(change, onProgress) => onEdit(clip, sourceFile as File, change, onProgress)}
          />
        )}
      </Sheet>
      <Sheet open={sheet === "post"} onClose={() => setSheet(null)} label="Post text" desktop="side">
        <PostSheet
          input={{ title: clip.title, hook: clip.hook, momentType: clip.momentType, transcript: edit ? clipWords(edit.words, clip.startSec, clipEnd) : "", durationSec: clip.durationSec }}
          llm={llm}
          game={game}
          onGame={onGame}
          result={post}
          onResult={setPost}
          onClose={() => setSheet(null)}
          onOpenSettings={onOpenSettings}
        />
      </Sheet>
    </motion.article>
  );
}

async function downloadRatings() {
  const ratings = await listRatings();
  const url = URL.createObjectURL(new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ratings }, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "viralbits-ratings.json";
  link.click();
  URL.revokeObjectURL(url);
}

interface ScreenProps extends Pick<CardProps, "llm" | "onOpenSettings" | "onEdit" | "onRate"> {
  clips: ClipView[];
  file: File | null;
  onNew: () => void;
  onClear?: () => void;
}

export default function ClipsScreen({ clips, file, llm, onOpenSettings, onEdit, onRate, onNew, onClear }: ScreenProps) {
  const [confirming, setConfirming] = useState(false);
  const [picked, setPicked] = useState<File | null>(null);
  const [game, setGame] = useState("");
  const { item } = useStage();
  const anyRated = clips.some((c) => c.rating);
  return (
    <div className={styles.clips}>
      <motion.div variants={item} className={styles.clipsHead}>
        <h1 className={styles.big}>{new Intl.PluralRules("en").select(clips.length) === "one" ? "1 clip" : `${clips.length} clips`}</h1>
        <div className={styles.row}>
          {anyRated && <button type="button" className={styles.link} onClick={() => void downloadRatings()}>download my ratings</button>}
          {onClear && (
            <button type="button" className={`${styles.link} ${confirming ? styles.linkDanger : ""}`} onClick={() => (confirming ? onClear() : setConfirming(true))}>
              <Swap id={confirming ? "confirm" : "idle"}>{confirming ? "delete all saved clips?" : "delete saved"}</Swap>
            </button>
          )}
          <Pill onClick={onNew}>cut another stream</Pill>
        </div>
      </motion.div>
      <motion.div className={styles.grid} variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
        {/* Position, not id: an edit gives a clip a new id and its card should stay put. */}
        {clips.map((c, i) => <ClipCard key={i} clip={c} sourceFile={picked ?? file} onPickSource={setPicked} llm={llm} game={game} onGame={setGame} onOpenSettings={onOpenSettings} onEdit={onEdit} onRate={onRate} />)}
      </motion.div>
    </div>
  );
}
