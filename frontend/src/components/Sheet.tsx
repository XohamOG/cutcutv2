"use client";

import { AnimatePresence, motion, useDragControls, useReducedMotion, type PanInfo } from "motion/react";
import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { SHEET_SPRING, useMedia } from "./ui";
import styles from "./app.module.css";

const FOCUSABLE = 'a[href],button:not(:disabled),input:not(:disabled),select,textarea,[tabindex="0"]';
const DISMISS_FRACTION = 0.35;

/** Where a flick would come to rest, using scroll-like deceleration. */
const projected = (offset: number, velocity: number) => offset + (velocity / 1000) * (0.99 / 0.01);

interface SheetProps {
  open: boolean;
  onClose: () => void;
  label: string;
  /** How it appears on a computer. On phones every sheet comes up from the bottom. */
  desktop: "side" | "center";
  children: ReactNode;
}

export default function Sheet({ open, onClose, label, desktop, children }: SheetProps) {
  const compact = useMedia("(max-width: 640px)");
  const panel = useRef<HTMLDivElement>(null);
  const drag = useDragControls();
  const reduced = useReducedMotion();
  const close = useRef(onClose);

  useEffect(() => {
    close.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null;
    const page = document.getElementById("page");
    if (page) page.inert = true;
    const items = () => [...(panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
    items()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
      if (e.key !== "Tab") return;
      const list = items();
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (page) page.inert = false;
      trigger?.focus();
    };
  }, [open]);

  const away = reduced ? { opacity: 0 } : compact ? { y: "100%" } : desktop === "side" ? { x: "100%" } : { opacity: 0, y: 24 };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const height = panel.current?.offsetHeight ?? 400;
    if (projected(info.offset.y, info.velocity.y) > height * DISMISS_FRACTION) onClose();
  };

  // Outside #page, which goes inert while a sheet is open.
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div className={styles.backdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose} />
          <motion.div
            ref={panel}
            className={`${styles.sheet} ${compact ? styles.sheetBottom : desktop === "side" ? styles.sheetSide : styles.sheetCenter}`}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={away}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={away}
            transition={SHEET_SPRING}
            drag={compact ? "y" : false}
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.03, bottom: 1 }}
            dragMomentum={false}
            onDragEnd={onDragEnd}
          >
            {compact && <div className={styles.grabber} aria-hidden onPointerDown={(e) => drag.start(e)}><span /></div>}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
