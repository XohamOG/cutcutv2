"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { Swap } from "./ui";
import styles from "./app.module.css";

const MIN_BAR = 0.05;
const BAR_SLOT = 6;
const FRONT_SPREAD = 0.05;

interface StreamWaveProps {
  value: number;
  /** The stream's real loudness, 0..1 per slice; null where it hasn't been heard yet. */
  bars: (number | null)[];
  /** Where the candidate moments fall, 0..1 along the stream. */
  moments: number[];
  label: string;
}

/**
 * The progress bar is the creator's own stream: its waveform draws in as it's heard,
 * fills as the work advances, and the best moments pop up where they happen.
 */
export default function StreamWave({ value, bars, moments, label }: StreamWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const live = useRef({ value, bars, moments, reduced });

  useEffect(() => {
    live.current = { value, bars, moments, reduced };
  }, [value, bars, moments, reduced]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const css = getComputedStyle(canvas);
    const accent = css.getPropertyValue("--color-signal-orange").trim();
    const ink = css.getPropertyValue("--color-ink").trim();

    let width = 0;
    let height = 0;
    const observer = new ResizeObserver(() => {
      const ratio = window.devicePixelRatio || 1;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    });
    observer.observe(canvas);

    let level = 0;
    let shown: number[] = [];
    const momentBorn = new Map<number, number>();
    let last = performance.now();
    let frame = 0;

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const state = live.current;
      level += (state.value - level) * (1 - Math.exp(-dt * 5));

      const count = Math.max(8, Math.floor(width / BAR_SLOT));
      if (shown.length !== count) shown = new Array(count).fill(MIN_BAR);
      const usable = height - 28;
      const baseline = height - 2;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < count; i++) {
        const from = Math.floor((i / count) * state.bars.length);
        const to = Math.max(from + 1, Math.floor(((i + 1) / count) * state.bars.length));
        let target = MIN_BAR;
        for (let b = from; b < to; b++) target = Math.max(target, state.bars[b] ?? MIN_BAR);

        shown[i] += (target - shown[i]) * (1 - Math.exp(-dt * 9));
        const x = (i / count) * width;
        const position = (i + 0.5) / count;
        let h = shown[i];
        if (!state.reduced) {
          const closeness = Math.exp(-(((position - level) / FRONT_SPREAD) ** 2));
          h += closeness * (0.16 + 0.1 * Math.sin(now / 130 - i * 0.75));
        }
        const barH = Math.max(3, Math.min(1, h) * usable);
        ctx.fillStyle = accent;
        ctx.globalAlpha = position <= level ? 1 : 0.16;
        if (position > level) ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.roundRect(x + 1, baseline - barH, Math.max(2, width / count - 2), barH, 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      state.moments.forEach((m, index) => {
        if (!momentBorn.has(index)) momentBorn.set(index, now + index * 60);
        const age = (now - momentBorn.get(index)!) / 320;
        if (age <= 0) return;
        const t = state.reduced ? 1 : 1 - (1 - Math.min(1, age)) ** 3;
        const x = m * width;
        ctx.fillStyle = ink;
        ctx.fillRect(x - 1, 16 + (1 - t) * (baseline - 16), 2, t * (baseline - 16));
        ctx.beginPath();
        ctx.arc(x, 10, 6 * t, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = ink;
        ctx.stroke();
      });

      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  const percent = Math.round(value * 100);
  return (
    <div className={styles.wave}>
      <div className={styles.waveCard} role="progressbar" aria-label="Making your clips" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <canvas ref={canvasRef} className={styles.waveCanvas} aria-hidden />
      </div>
      <div className={styles.waveFoot}>
        <span className={styles.stage} role="status">
          <Swap id={label}>{label}</Swap>
        </span>
        <span className={styles.percent}>{percent}%</span>
      </div>
    </div>
  );
}
