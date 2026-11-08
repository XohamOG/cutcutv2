"use client";

import { KeyboardEvent, PointerEvent, ReactNode, useRef, useState } from "react";
import type { Rect, SplitRegions } from "@/lib/highlights/types";
import { resizeRegion, stretchRegion } from "@/lib/highlights/templates";
import styles from "./app.module.css";

type RegionName = keyof SplitRegions;
type Drag = { name: RegionName; mode: "move" | "resize"; startX: number; startY: number; origin: Rect; moved: boolean; onLabel: boolean; previous: RegionName };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const LABELS: Record<RegionName, string> = { cam: "Your face", game: "Game" };
const TAP_SLOP_PX = 6;
const KEY_STEP = 0.01;
const ARROWS: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

interface RegionPickerProps {
  regions: SplitRegions;
  ratios: Record<RegionName, number>;
  /** Locked boxes keep the slot's shape; unlocked ones stretch freely. */
  locked: boolean;
  boxes: RegionName[];
  onChange: (r: SplitRegions) => void;
  /** The source picture the boxes are drawn over. */
  children: ReactNode;
}

const moved = (o: Rect, x: number, y: number): Rect => ({ ...o, x: clamp(x, 0, 1 - o.w), y: clamp(y, 0, 1 - o.h) });

/**
 * Two boxes over the source frame. Each keeps the shape of its template slot and tracks
 * the pointer 1:1 from wherever it was grabbed. Without dragging: tap a label to pick a
 * box, then tap a spot to place it; or use the arrow keys.
 */
export default function RegionPicker({ regions, ratios, locked, boxes, onChange, children }: RegionPickerProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [chosen, setActive] = useState<RegionName>("cam");
  const active = boxes.includes(chosen) ? chosen : boxes[0];

  const begin = (e: PointerEvent, name: RegionName, mode: Drag["mode"], onLabel = false) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { name, mode, startX: e.clientX, startY: e.clientY, origin: regions[name], moved: false, onLabel, previous: active };
    if (onLabel || mode === "resize") setActive(name);
  };

  const track = (e: PointerEvent) => {
    const d = drag.current;
    const bounds = frameRef.current?.getBoundingClientRect();
    if (!d || !bounds) return;
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < TAP_SLOP_PX) return;
    if (!d.moved) setActive(d.name);
    d.moved = true;
    const dx = (e.clientX - d.startX) / bounds.width;
    const dy = (e.clientY - d.startY) / bounds.height;
    const next = d.mode === "move" ? moved(d.origin, d.origin.x + dx, d.origin.y + dy) : locked ? resizeRegion(d.origin, dx, ratios[d.name]) : stretchRegion(d.origin, dx, dy);
    onChange({ ...regions, [d.name]: next });
  };

  const placeActive = (e: { clientX: number; clientY: number }, name: RegionName) => {
    const bounds = frameRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const r = regions[name];
    onChange({ ...regions, [name]: moved(r, (e.clientX - bounds.left) / bounds.width - r.w / 2, (e.clientY - bounds.top) / bounds.height - r.h / 2) });
  };

  const end = (e: PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved && !d.onLabel && d.mode === "move" && d.name !== d.previous) placeActive(e, d.previous);
  };

  const onKey = (e: KeyboardEvent, name: RegionName) => {
    const arrow = ARROWS[e.key];
    if (!arrow) return;
    e.preventDefault();
    setActive(name);
    const o = regions[name];
    const next = e.shiftKey ? (locked ? resizeRegion(o, (arrow[0] || -arrow[1]) * KEY_STEP, ratios[name]) : stretchRegion(o, arrow[0] * KEY_STEP, arrow[1] * KEY_STEP)) : moved(o, o.x + arrow[0] * KEY_STEP, o.y + arrow[1] * KEY_STEP);
    onChange({ ...regions, [name]: next });
  };

  return (
    <div
      className={styles.picker}
      ref={frameRef}
      onPointerUp={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === "VIDEO") placeActive(e, active);
      }}
    >
      {children}
      {boxes.map((name) => {
        const r = regions[name];
        return (
          <div
            key={name}
            data-region={name}
            tabIndex={0}
            role="group"
            aria-label={`${LABELS[name]} box. Arrow keys move it. Shift and arrow keys resize it.`}
            className={`${styles.region} ${name === "cam" ? styles.regionCam : styles.regionGame} ${active === name ? styles.regionActive : ""}`}
            style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%` }}
            onPointerDown={(e) => begin(e, name, "move")}
            onPointerMove={track}
            onPointerUp={end}
            onKeyDown={(e) => onKey(e, name)}
          >
            <span className={styles.regionLabel} onPointerDown={(e) => begin(e, name, "move", true)} onPointerMove={track} onPointerUp={end}>{LABELS[name]}</span>
            <div data-handle={name} className={styles.regionHandle} onPointerDown={(e) => begin(e, name, "resize")} onPointerMove={track} onPointerUp={end} />
          </div>
        );
      })}
    </div>
  );
}
