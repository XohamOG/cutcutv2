"use client";

import { motion } from "motion/react";
import { ReactNode } from "react";
import { useStage } from "./ui";
import styles from "./keys.module.css";

export function subscribeToHash(notify: () => void) {
  window.addEventListener("hashchange", notify);
  return () => window.removeEventListener("hashchange", notify);
}

export function Browser({ url, children }: { url: string; children: ReactNode }) {
  return (
    <div className={styles.browser} aria-hidden>
      <div className={styles.browserBar}>
        <span className={styles.dots}><i /><i /><i /></span>
        <span className={styles.address}>{url.replace("https://", "")}</span>
      </div>
      <div className={styles.browserBody}>{children}</div>
    </div>
  );
}

/** Draws the eye to what to click, a few times, then rests. */
export function Target({ children }: { children: ReactNode }) {
  return (
    <motion.span className={styles.target} initial={{ scale: 1 }} whileInView={{ scale: [1, 1.07, 1] }} viewport={{ once: false, amount: 0.8 }} transition={{ duration: 0.9, repeat: 3, ease: "easeInOut" }}>
      {children}
    </motion.span>
  );
}

export function Step({ number, title, children, mock }: { number: number; title: string; children: ReactNode; mock: ReactNode }) {
  const { item } = useStage();
  return (
    <motion.li className={styles.step} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
      <motion.div variants={item} className={styles.stepText}>
        <span className={styles.number} aria-hidden>{number}</span>
        <h2 className={styles.stepTitle}>{title}</h2>
        <div className={styles.stepBody}>{children}</div>
      </motion.div>
      <motion.div variants={item}>{mock}</motion.div>
    </motion.li>
  );
}
