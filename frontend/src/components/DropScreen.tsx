"use client";

import { AnimatePresence, motion } from "motion/react";
import { DragEvent, useState } from "react";
import type { LastRun } from "@/lib/highlights/storage";
import { parseYouTubeId, studioUrl } from "@/lib/highlights/youtube";
import HowTo from "./HowTo";
import { PillLink, Swap, SPRING, useMedia, useStage } from "./ui";
import styles from "./app.module.css";

const INPUT_ID = "stream-input";
const ACCEPT = "video/mp4,video/webm,video/quicktime,.mkv";
const isVideo = (f: File) => f.type.startsWith("video/") || /\.(mkv|mp4|mov|webm)$/i.test(f.name);

interface DropScreenProps {
  onFile: (file: File) => void;
  interrupted: LastRun | null;
  onDismiss: () => void;
  savedCount: number;
  onShowSaved: () => void;
  supported: boolean;
  onOpenSettings: () => void;
}

export default function DropScreen({ onFile, interrupted, onDismiss, savedCount, onShowSaved, supported, onOpenSettings }: DropScreenProps) {
  const [over, setOver] = useState(false);
  const [rejected, setRejected] = useState(0);
  const [link, setLink] = useState("");
  const touch = useMedia("(hover: none)");
  const { item } = useStage();
  const youtubeId = parseYouTubeId(link);

  const take = (file: File | undefined) => {
    if (!file) return;
    if (isVideo(file)) onFile(file);
    else setRejected((n) => n + 1);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    take(e.dataTransfer.files[0]);
  };

  if (!supported) {
    return (
      <div className={styles.center}>
        <motion.h1 variants={item} className={styles.big}>This browser can’t make video</motion.h1>
        <motion.p variants={item} className={styles.lead}>Open viralbits in current Chrome or Edge.</motion.p>
      </div>
    );
  }

  const heading = over ? "let go" : touch ? "choose your stream" : "drop your stream";
  const caption = rejected ? "That isn’t a video. Choose an MP4." : touch ? "works best on a computer" : "or click to browse";

  return (
    <>
    <div className={`${styles.center} ${styles.hero}`}>
      <h1 className={styles.visuallyHidden}>Turn your stream into clips</h1>
      <AnimatePresence>
        {interrupted && (
          <motion.p className={styles.resume} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={SPRING}>
            <span>Choose {interrupted.fileName} to pick up where you left off.</span>
            <button type="button" className={styles.link} onClick={onDismiss}>dismiss</button>
          </motion.p>
        )}
      </AnimatePresence>

      <motion.label
        variants={item}
        className={`${styles.drop} ${over ? styles.dropOver : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        <svg className={styles.dropEdge} aria-hidden>
          <rect width="100%" height="100%" rx="26" />
        </svg>
        <input id={INPUT_ID} type="file" accept={ACCEPT} className={styles.hiddenInput} aria-label="Choose your stream" onChange={(e) => take(e.target.files?.[0])} />
        <motion.span key={rejected} className={styles.dropInner} animate={{ x: rejected ? [0, -8, 8, -4, 4, 0] : 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
          <span className={styles.giant}><Swap id={heading}>{heading}</Swap></span>
          <span className={styles.caption}>{caption}</span>
        </motion.span>
      </motion.label>

      <motion.div variants={item} className={styles.youtube}>
        <label className={styles.setting}>
          <span>Paste your YouTube link</span>
          <input className={styles.line} type="url" inputMode="url" autoComplete="off" spellCheck={false} value={link} placeholder="https://youtu.be/…" onChange={(e) => setLink(e.target.value)} />
        </label>
        <p className={styles.caption} role="status">{link && !youtubeId ? "Paste a link to one video." : ""}</p>
        <AnimatePresence initial={false}>
          {youtubeId && (
            <motion.div className={styles.youtubeNext} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING}>
              <div className={styles.youtubeInner}>
                <PillLink variant="orange" href={studioUrl(youtubeId)} target="_blank" rel="noreferrer">open YouTube Studio</PillLink>
                <p className={styles.caption}>Download it from the ⋮ menu, then drop the file above. This works for videos on your own channel, while you’re signed in.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div variants={item} className={styles.dropFooter}>
        <a className={styles.link} href="#how">how it works</a>
        {savedCount > 0 && <button type="button" className={styles.link} onClick={onShowSaved}>saved clips ({savedCount})</button>}
      </motion.div>
    </div>
    <HowTo inputId={INPUT_ID} cta={touch ? "choose your stream" : "drop your stream"} onOpenSettings={onOpenSettings} />
    </>
  );
}
