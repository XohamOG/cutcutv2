"use client";

import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { ReactNode, RefObject, useRef } from "react";
import { Pill, useStage } from "./ui";
import styles from "./app.module.css";

const BAR_SHAPE = [0.35, 0.6, 0.42, 0.8, 0.5, 0.3, 0.55, 1, 0.7, 0.45, 0.62, 0.34, 0.5, 0.92, 0.58, 0.4, 0.66, 0.3, 0.48, 0.74];
const WORDS = ["THAT", "WAS", "INSANE"];

/** Scrubs with the scroll position, so scrolling back runs the demo in reverse. */
function useStepProgress(ref: RefObject<HTMLElement | null>): MotionValue<number> {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 88%", "center 58%"] });
  const eased = useSpring(scrollYProgress, { stiffness: 130, damping: 32, restDelta: 0.001 });
  const finished = useMotionValue(1);
  return reduced ? finished : eased;
}

function Bar({ p, index, height }: { p: MotionValue<number>; index: number; height: number }) {
  const start = 0.55 + index * 0.012;
  const scaleY = useTransform(p, [start, start + 0.16], [0.08, 1]);
  const on = useTransform(p, (v) => (v > start + 0.1 ? "var(--color-signal-orange)" : "var(--color-charcoal)"));
  return <motion.span className={styles.demoBar} style={{ height: `${height * 100}%`, scaleY, backgroundColor: on }} />;
}

function DropDemo({ p }: { p: MotionValue<number> }) {
  const y = useTransform(p, [0, 0.55], ["-150%", "0%"]);
  const rotate = useTransform(p, [0, 0.55], [-9, 0]);
  const scale = useTransform(p, [0.52, 0.68], [1, 0.86]);
  const fileOpacity = useTransform(p, [0, 0.12], [0, 1]);
  return (
    <div className={styles.demo}>
      <div className={styles.demoDrop}>
        <motion.div className={styles.demoFile} style={{ y, rotate, scale, opacity: fileOpacity }}>
          <span className={styles.demoPlay} />
          my_stream.mp4
        </motion.div>
      </div>
      <div className={styles.demoWave}>
        {BAR_SHAPE.map((h, i) => <Bar key={i} p={p} index={i} height={h} />)}
      </div>
    </div>
  );
}

function Face() {
  return (
    <span className={styles.demoFace}>
      <i />
      <b />
    </span>
  );
}

function FrameDemo({ p }: { p: MotionValue<number> }) {
  const camX = useTransform(p, [0.05, 0.75], ["130%", "0%"]);
  const camY = useTransform(p, [0.05, 0.75], ["-70%", "0%"]);
  const gameScale = useTransform(p, [0.1, 0.8], [0.55, 1]);
  const phoneOpacity = useTransform(p, [0.45, 0.85], [0.25, 1]);
  const phoneY = useTransform(p, [0.45, 0.85], [18, 0]);
  return (
    <div className={`${styles.demo} ${styles.demoRow}`}>
      <div className={styles.demoFrame}>
        <span className={styles.demoGround} />
        <span className={styles.demoFaceSpot}><Face /></span>
        <motion.span className={styles.demoGameBox} style={{ scaleX: gameScale }} />
        <motion.span className={styles.demoCamBox} style={{ x: camX, y: camY }} />
      </div>
      <motion.div className={styles.demoPhone} style={{ opacity: phoneOpacity, y: phoneY }}>
        <span className={styles.demoPhoneCam}><Face /></span>
        <span className={styles.demoPhoneGame} />
      </motion.div>
    </div>
  );
}

function ClipCard({ p, offset, tint, active }: { p: MotionValue<number>; offset: number; tint: string; active: number }) {
  const x = useTransform(p, [0.05, 0.85], ["0%", `${offset * 108}%`]);
  const rotate = useTransform(p, [0.05, 0.85], [offset * 2, offset * 8]);
  const y = useTransform(p, [0.05, 0.85], ["0%", `${Math.abs(offset) * 7}%`]);
  return (
    <motion.div className={styles.demoClip} style={{ x, rotate, y, zIndex: 3 - Math.abs(offset) }}>
      <span className={styles.demoPhoneCam} style={{ backgroundColor: tint }}><Face /></span>
      <span className={styles.demoPhoneGame} />
      <span className={styles.demoCaption}>
        {WORDS.map((w, i) => <em key={w} className={i === active ? styles.demoWordOn : undefined}>{w}</em>)}
      </span>
    </motion.div>
  );
}

function ClipsDemo({ p }: { p: MotionValue<number> }) {
  return (
    <div className={`${styles.demo} ${styles.demoFan}`}>
      <ClipCard p={p} offset={-1} tint="var(--color-seafoam-panel)" active={0} />
      <ClipCard p={p} offset={1} tint="var(--color-charcoal)" active={2} />
      <ClipCard p={p} offset={0} tint="var(--color-signal-orange)" active={1} />
    </div>
  );
}

function Step({ number, title, children, demo }: { number: number; title: string; children: ReactNode; demo: (p: MotionValue<number>) => ReactNode }) {
  const ref = useRef<HTMLLIElement>(null);
  const p = useStepProgress(ref);
  const { item } = useStage();
  return (
    <li ref={ref} className={styles.howStep}>
      <motion.div className={styles.howText} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
        <motion.span variants={item} className={styles.howNumber} aria-hidden>{number}</motion.span>
        <motion.h3 variants={item} className={styles.howTitle}>{title}</motion.h3>
        <motion.p variants={item} className={styles.lead}>{children}</motion.p>
      </motion.div>
      <div aria-hidden>{demo(p)}</div>
    </li>
  );
}

/** The three-step tour under the drop zone. Its demos play as you scroll. */
export default function HowTo({ inputId, cta, onOpenSettings }: { inputId: string; cta: string; onOpenSettings: () => void }) {
  return (
    <section id="how" className={styles.how} aria-labelledby="how-title">
      <h2 id="how-title" className={styles.visuallyHidden}>How viralbits works</h2>
      <ol className={styles.howList}>
        <Step number={1} title="Drop it." demo={(p) => <DropDemo p={p} />}>Add your livestream recording.</Step>
        <Step number={2} title="Frame it." demo={(p) => <FrameDemo p={p} />}>AI hunts the best moments. You pick the template and line up the boxes.</Step>
        <Step number={3} title="Post it." demo={(p) => <ClipsDemo p={p} />}>Get a stack of captioned vertical clips, ready to upload.</Step>
      </ol>
      <div className={styles.howEnd}>
        <Pill variant="orange" className={styles.make} onClick={() => document.getElementById(inputId)?.click()}>{cta}</Pill>
        <p className={styles.caption}>
          Free to use. <button type="button" className={styles.link} onClick={onOpenSettings}>Add your own AI key</button> for sharper picks and captions.
        </p>
      </div>
    </section>
  );
}
