"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { SITE } from "@/lib/site";
import styles from "./app.module.css";

const HOLD_MS = 1250;
const SEEN_KEY = "viralbits.intro";
const EASE = [0.76, 0, 0.24, 1] as const;

/** The opening curtain, once per visit: the name rises letter by letter, then the panel lifts away. A tap skips it. */
export default function Intro() {
  const [visible, setVisible] = useState(() => sessionStorage.getItem(SEEN_KEY) === null);
  const reduced = useReducedMotion();

  useEffect(() => {
    sessionStorage.setItem(SEEN_KEY, "1");
    const timer = setTimeout(() => setVisible(false), HOLD_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div className={styles.intro} data-intro exit={reduced ? { opacity: 0 } : { y: "-100%" }} transition={{ duration: reduced ? 0.2 : 0.65, ease: EASE }} aria-hidden onPointerDown={() => setVisible(false)}>
          <div className={styles.introMark}>
            {[...SITE.name].map((letter, i) => (
              <span key={i} className={styles.introClip}>
                <motion.span className={styles.introLetter} initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ delay: 0.05 + i * 0.045, duration: 0.65, ease: EASE }}>
                  {letter}
                </motion.span>
              </span>
            ))}
          </div>
          <motion.div className={styles.introLine} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.15, duration: 1, ease: EASE }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
