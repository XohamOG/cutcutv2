"use client";

import { motion } from "motion/react";
import { friendlyError } from "@/lib/highlights/errors";
import type { RunState } from "./useClipRun";
import StreamWave from "./StreamWave";
import { Pill, Swap, useStage } from "./ui";
import styles from "./app.module.css";

interface WorkScreenProps {
  run: RunState;
  notify: boolean;
  canNotify: boolean;
  onNotify: () => void;
  onCancel: () => void;
  onReport: () => void;
  onRestart: () => void;
}

export default function WorkScreen({ run, notify, canNotify, onNotify, onCancel, onReport, onRestart }: WorkScreenProps) {
  const { item } = useStage();

  if (run.status === "error") {
    const { title, hint } = friendlyError(run.error ?? "");
    return (
      <div className={styles.center} role="alert">
        <motion.h1 variants={item} className={styles.big}>{title}</motion.h1>
        <motion.p variants={item} className={styles.lead}>{hint}</motion.p>
        <motion.div variants={item} className={styles.row}>
          <Pill variant="orange" onClick={onRestart}>try another file</Pill>
          <Pill variant="ghost" onClick={onReport}>report this</Pill>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={styles.work}>
      <h1 className={styles.visuallyHidden}>Making your clips</h1>
      <motion.div variants={item} className={styles.keepOpen}>
        <span className={styles.pulseDot} />
        keep this tab open
      </motion.div>

      <motion.div variants={item} className={styles.waveHolder}>
        <StreamWave value={run.overall} bars={run.bars} moments={run.moments} label={run.label} />
      </motion.div>

      <motion.div variants={item} className={styles.row}>
        {canNotify && (
          <Pill variant={notify ? "dark" : "ghost"} disabled={notify} onClick={onNotify}>
            <Swap id={notify ? "on" : "off"}>{notify ? "notifications on" : "notify me when done"}</Swap>
          </Pill>
        )}
        <Pill variant="ghost" onClick={onCancel}>cancel</Pill>
      </motion.div>
      <div className={styles.warnings} role="status">{run.warnings.map((warning) => <p key={warning} className={styles.caption}>{warning}</p>)}</div>
    </div>
  );
}
