"use client";

import { AnimatePresence, motion, useReducedMotion, type HTMLMotionProps, type Variants } from "motion/react";
import { KeyboardEvent, PointerEvent, ReactNode, useRef, useState, useSyncExternalStore } from "react";
import styles from "./app.module.css";

/** Critically damped: springs retarget mid-flight and never overshoot. */
export const SPRING = { type: "spring", bounce: 0, duration: 0.35 } as const;
export const SHEET_SPRING = { type: "spring", bounce: 0, duration: 0.42 } as const;

/** Staged entrance for a whole screen: semantic chunks, 100ms apart. */
export function useStage() {
  const reduced = useReducedMotion();
  const blur = (px: number) => (reduced ? {} : { filter: `blur(${px}px)` });
  const screen: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
    exit: { opacity: 0, y: reduced ? 0 : -12, ...blur(4), transition: { duration: 0.15, ease: "easeOut" } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduced ? 0 : 12, ...blur(4) },
    visible: { opacity: 1, y: 0, ...blur(0), transition: { duration: 0.3, ease: "easeOut" } },
  };
  return { screen, item };
}

export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", notify);
      return () => list.removeEventListener("change", notify);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

type PillProps = HTMLMotionProps<"button"> & { variant?: "dark" | "orange" | "ghost" };

/** A press mark that spreads from the exact point of contact, on pointer-down. */
export function usePressMark() {
  const [mark, setMark] = useState<{ id: number; x: number; y: number; size: number } | null>(null);
  const id = useRef(0);
  const start = (e: PointerEvent<HTMLElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    setMark({ id: ++id.current, x: e.clientX - box.left, y: e.clientY - box.top, size: Math.hypot(box.width, box.height) * 2 });
  };
  const node = mark && (
    <motion.span
      key={mark.id}
      aria-hidden
      className={styles.pressMark}
      style={{ left: mark.x - mark.size / 2, top: mark.y - mark.size / 2, width: mark.size, height: mark.size }}
      initial={{ scale: 0, opacity: 0.32 }}
      animate={{ scale: 1, opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />
  );
  return { start, node };
}

export function Pill({ variant = "dark", className = "", children, onPointerDown, ...props }: PillProps) {
  const { start, node } = usePressMark();
  return (
    <motion.button
      type="button"
      whileTap={props.disabled ? undefined : { scale: 0.96 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={`${styles.pill} ${styles[variant]} ${className}`}
      onPointerDown={(e) => {
        if (!props.disabled) start(e);
        onPointerDown?.(e);
      }}
      {...props}
    >
      {node}
      <span className={styles.pillLabel}>{children as ReactNode}</span>
    </motion.button>
  );
}

/** A link styled as a pill, with the same press response. */
export function PillLink({ variant = "dark", className = "", children, ...props }: HTMLMotionProps<"a"> & { variant?: "dark" | "orange" | "ghost" }) {
  const { start, node } = usePressMark();
  return (
    <motion.a whileTap={{ scale: 0.96 }} transition={{ duration: 0.15, ease: "easeOut" }} className={`${styles.pill} ${styles[variant]} ${className}`} onPointerDown={start} {...props}>
      {node}
      <span className={styles.pillLabel}>{children as ReactNode}</span>
    </motion.a>
  );
}

/** Swaps a label in place with a quick cross-fade. */
export function Swap({ id, children }: { id: string; children: ReactNode }) {
  const reduced = useReducedMotion();
  const hidden = { opacity: 0, scale: reduced ? 1 : 0.6, filter: reduced ? "none" : "blur(4px)" };
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span key={id} className={styles.swap} initial={hidden} animate={{ opacity: 1, scale: 1, filter: "none" }} exit={hidden} transition={SPRING}>
        {children}
      </motion.span>
    </AnimatePresence>
  );
}

/** The product's loading mark: a tiny waveform. */
export function Bars({ label }: { label?: string }) {
  return (
    <span className={styles.bars} role={label ? "status" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {[0, 1, 2, 3].map((i) => (
        <motion.span key={i} animate={{ scaleY: [0.35, 1, 0.35], opacity: [0.55, 1, 0.55] }} transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.12, ease: "easeInOut" }} />
      ))}
    </span>
  );
}

const ARROW_STEP: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

interface RadioTabsProps<T extends string> {
  label: string;
  name: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (v: T) => void;
  className?: string;
  variants?: Variants;
}

/** One choice from a few. Tab reaches the group; arrow keys move and select within it. */
export function RadioTabs<T extends string>({ label, name, value, options, onChange, className = "", variants }: RadioTabsProps<T>) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = ARROW_STEP[e.key];
    if (!step) return;
    e.preventDefault();
    const next = options[(options.findIndex((o) => o.id === value) + step + options.length) % options.length];
    onChange(next.id);
    e.currentTarget.querySelector<HTMLElement>(`[data-option="${next.id}"]`)?.focus();
  };
  return (
    <motion.div variants={variants} className={`${styles.tabs} ${className}`} role="radiogroup" aria-label={label} onKeyDown={onKeyDown}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" data-option={o.id} aria-checked={o.id === value} tabIndex={o.id === value ? 0 : -1} className={`${styles.tab} ${o.id === value ? styles.tabOn : ""}`} onClick={() => onChange(o.id)}>
          {o.id === value && <motion.span layoutId={`${name}-pill`} className={styles.tabPill} transition={SPRING} />}
          <span className={styles.tabLabel}>{o.label}</span>
        </button>
      ))}
    </motion.div>
  );
}

export function Segment<T extends string>({ label, name, value, options, onChange }: { label: string; name: string; value: T; options: readonly { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className={styles.segment}>
      <span className={styles.segmentLabel}>{label}</span>
      <RadioTabs label={label} name={name} value={value} options={options} onChange={onChange} />
    </div>
  );
}

const COPIED_MS = 1600;

/** A copy link that says it worked, on screen and to screen readers. */
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), COPIED_MS);
  };
  return (
    <>
      <button type="button" className={styles.link} aria-label={`Copy ${label}`} onClick={() => void copy()}>
        <Swap id={copied ? "copied" : "copy"}>{copied ? "copied" : "copy"}</Swap>
      </button>
      <span className={styles.visuallyHidden} role="status">{copied ? `Copied ${label}` : ""}</span>
    </>
  );
}

export function Toggle({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className={styles.toggleRow} onClick={() => onChange(!checked)}>
      <span>{children}</span>
      <span className={`${styles.track} ${checked ? styles.trackOn : ""}`}>
        <motion.span layout transition={SPRING} className={styles.knob} />
      </span>
    </button>
  );
}

export function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string }) {
  const [direction, setDirection] = useState(1);
  const step = (delta: number) => {
    setDirection(delta);
    onChange(value + delta);
  };
  return (
    <div className={styles.stepper} role="group" aria-label={label}>
      <motion.button type="button" aria-label={`Fewer ${label}`} whileTap={{ scale: 0.96 }} disabled={value <= min} onClick={() => step(-1)}>−</motion.button>
      <span className={styles.stepperValue} aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.output key={value} initial={{ y: 14 * direction, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14 * direction, opacity: 0 }} transition={SPRING}>{value}</motion.output>
        </AnimatePresence>
      </span>
      <motion.button type="button" aria-label={`More ${label}`} whileTap={{ scale: 0.96 }} disabled={value >= max} onClick={() => step(1)}>+</motion.button>
      <span className={styles.stepperLabel}>{label}</span>
    </div>
  );
}
