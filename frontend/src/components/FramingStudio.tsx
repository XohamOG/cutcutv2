"use client";

import { AnimatePresence, motion } from "motion/react";
import { KeyboardEvent, PointerEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CamBorder, CaptionFont, CaptionStyle, EmptyFill, FramingOptions, SplitRegions, TemplateId } from "@/lib/highlights/types";
import { CANVAS_H, CANVAS_W, CAPTION_FONTS, CAPTION_SCALE_MAX, CAPTION_SCALE_MIN, DEFAULT_CAPTIONS, TEMPLATES, captionBox, captionOffsetRange, drawFrame, drawOverlays, ensureFonts, activeTemplate, fitRegions, getTemplate, regionRatio, settleCaption, type Ctx, type Template } from "@/lib/highlights/templates";
import RegionPicker from "./RegionPicker";
import { Bars, RadioTabs, SPRING, Segment, Toggle, useStage } from "./ui";
import styles from "./app.module.css";

const PREVIEW_START_SEC = 60;
const TEMPLATE_OPTIONS = TEMPLATES.map((t) => ({ id: t.id, label: t.name.toLowerCase() }));
const FILLS: { id: EmptyFill; label: string }[] = [
  { id: "blur", label: "blur" },
  { id: "black", label: "black" },
  { id: "facecam", label: "your face" },
];
const BORDERS: { id: CamBorder; label: string }[] = [
  { id: "none", label: "none" },
  { id: "clean", label: "clean" },
  { id: "neon", label: "neon" },
  { id: "corners", label: "corners" },
];
const SAMPLE_LINE = ["THAT", "WAS", "INSANE"].map((text, i) => ({ text, start: i, end: i + 1 }));

const CENTER_SNAP = 24;
const CAPTION_KEY_STEP = 12;
const SCALE_STEP = 0.05;
const ARROWS: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

function paint(canvas: HTMLCanvasElement | null, video: HTMLVideoElement | null, t: Template, regions: SplitRegions, framing: FramingOptions, captions: CaptionStyle, showCaptions: boolean) {
  const ctx = canvas?.getContext("2d") as Ctx | null;
  if (!canvas || !ctx || !video || video.readyState < 2) return;
  const scale = canvas.width / CANVAS_W;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  drawFrame(ctx, (target, sx, sy, sw, sh, dx, dy, dw, dh) => target.drawImage(video, sx, sy, sw, sh, dx, dy, dw, dh), video.videoWidth, video.videoHeight, t, regions, framing);
  drawOverlays(ctx, t, { title: "your clip title goes here", hook: "", caption: showCaptions ? { line: SAMPLE_LINE, activeIndex: 1 } : null }, captions);
}

interface FramingStudioProps {
  file: File;
  template: TemplateId;
  onTemplate: (id: TemplateId) => void;
  regions: SplitRegions;
  onRegions: (r: SplitRegions) => void;
  framing: FramingOptions;
  onFraming: (f: FramingOptions) => void;
  captions: CaptionStyle;
  onCaptions: (c: CaptionStyle) => void;
  showCaptions: boolean;
  onShowCaptions: (show: boolean) => void;
  /** Extra controls shown with the framing options. */
  children?: ReactNode;
}

/** Template choice and framing, shown on a real frame before anything is processed. */
export default function FramingStudio({ file, template, onTemplate, regions, onRegions, framing, onFraming, captions, onCaptions, showCaptions, onShowCaptions, children }: FramingStudioProps) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [aspect, setAspect] = useState(16 / 9);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [tick, setTick] = useState(0);
  const [ready, setReady] = useState(false);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const videoElement = useRef<HTMLVideoElement | null>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const captionDrag = useRef<{ x: number; y: number; origin: CaptionStyle } | null>(null);
  const captionSize = useRef({ w: 0, h: 0 });
  const { item } = useStage();
  const attachVideo = useCallback((el: HTMLVideoElement | null) => {
    videoElement.current = el;
    setVideo(el);
  }, []);
  const current = activeTemplate(getTemplate(template), framing);
  const shown = useMemo(() => (framing.lockAspect ? fitRegions(regions, current, aspect) : regions), [regions, current, aspect, framing.lockAspect]);

  useEffect(() => {
    const element = videoElement.current;
    if (!element) return;
    const url = URL.createObjectURL(file);
    element.src = url;
    return () => URL.revokeObjectURL(url);
  }, [video, file]);

  useEffect(() => {
    void ensureFonts().then(() => setTick((n) => n + 1));
  }, []);

  // A seek can finish before its frame is decoded, which paints black. This fires once
  // the new frame is really on screen, on every seek.
  useEffect(() => {
    if (!video?.requestVideoFrameCallback) return;
    let id = 0;
    const onFrame = () => {
      setTick((n) => n + 1);
      id = video.requestVideoFrameCallback(onFrame);
    };
    id = video.requestVideoFrameCallback(onFrame);
    return () => video.cancelVideoFrameCallback(id);
  }, [video]);

  useEffect(() => {
    paint(previewRef.current, video, current, regions, framing, captions, showCaptions);
    const ctx = previewRef.current?.getContext("2d");
    const handle = handleRef.current;
    if (!ctx || !handle) return;
    // Sits exactly over the drawn words, so what you grab is what you see.
    const box = captionBox(ctx, current, SAMPLE_LINE, captions);
    captionSize.current = { w: box.w, h: box.h };
    Object.assign(handle.style, { left: `${(box.x / CANVAS_W) * 100}%`, top: `${(box.y / CANVAS_H) * 100}%`, width: `${(box.w / CANVAS_W) * 100}%`, height: `${(box.h / CANVAS_H) * 100}%` });
  }, [current, video, regions, framing, captions, showCaptions, tick]);

  const moveCaption = (next: CaptionStyle) => onCaptions(settleCaption(current, next, captionSize.current.w, captionSize.current.h));
  const startCaptionDrag = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    captionDrag.current = { x: e.clientX, y: e.clientY, origin: captions };
  };
  const trackCaptionDrag = (e: PointerEvent<HTMLDivElement>) => {
    const drag = captionDrag.current;
    const bounds = previewRef.current?.getBoundingClientRect();
    if (!drag || !bounds) return;
    const offsetX = drag.origin.offsetX + ((e.clientX - drag.x) * CANVAS_W) / bounds.width;
    moveCaption({ ...drag.origin, offsetX: Math.abs(offsetX) < CENTER_SNAP ? 0 : offsetX, offsetY: drag.origin.offsetY + ((e.clientY - drag.y) * CANVAS_H) / bounds.height });
  };
  const onCaptionKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const arrow = ARROWS[e.key];
    if (!arrow) return;
    e.preventDefault();
    moveCaption({ ...captions, offsetX: captions.offsetX + arrow[0] * CAPTION_KEY_STEP, offsetY: captions.offsetY + arrow[1] * CAPTION_KEY_STEP });
  };
  const offsetRange = captionOffsetRange(current, captions.scale);
  const moved = captions.offsetX !== 0 || captions.offsetY !== 0 || captions.scale !== 1 || captions.font !== DEFAULT_CAPTIONS.font;

  const ratios = { cam: regionRatio(current, "cam", aspect), game: regionRatio(current, "game", aspect) };

  return (
    <div className={styles.framing}>
      <h1 className={styles.visuallyHidden}>Frame your clips</h1>
      <div className={styles.framingMain}>
        <RadioTabs variants={item} label="Template" name="template" value={template} options={TEMPLATE_OPTIONS} onChange={onTemplate} />

        <motion.div variants={item}>
          <RegionPicker regions={shown} ratios={ratios} locked={framing.lockAspect} boxes={framing.hasFacecam ? ["game", "cam"] : ["game"]} onChange={onRegions}>
            <video
              ref={attachVideo}
              className={`${styles.pickerVideo} ${ready ? styles.pickerReady : ""}`}
              muted
              playsInline
              preload="auto"
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                setAspect(v.videoWidth / v.videoHeight);
                setDuration(v.duration);
                const start = Math.min(PREVIEW_START_SEC, v.duration / 2);
                setPosition(start);
                v.currentTime = start;
              }}
              onSeeked={() => {
                setReady(true);
                setTick((n) => n + 1);
              }}
            />
            <AnimatePresence>
              {!ready && (
                <motion.div className={styles.pickerLoading} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Bars label="Loading your stream" />
                </motion.div>
              )}
            </AnimatePresence>
          </RegionPicker>
        </motion.div>

        <motion.div variants={item} className={styles.scrubRow}>
          <input
            className={styles.scrub}
            type="range"
            aria-label="Check another moment"
            min={0}
            max={Math.floor(duration)}
            value={position}
            onChange={(e) => {
              const next = Number(e.target.value);
              setPosition(next);
              if (videoElement.current) videoElement.current.currentTime = next;
            }}
          />
          <p className={styles.caption}>{framing.hasFacecam ? "Drag the boxes onto your face and the game, or tap a label, then a spot." : "Drag the box onto the part of the game to show."}</p>
        </motion.div>

        <motion.div variants={item} className={styles.options}>
          <div className={styles.lockRow}>
            <Toggle
              checked={framing.hasFacecam}
              onChange={(hasFacecam) => onFraming({ ...framing, hasFacecam, fill: !hasFacecam && framing.fill === "facecam" ? "blur" : framing.fill })}
            >
              show facecam
            </Toggle>
            <Toggle
              checked={framing.lockAspect}
              onChange={(lockAspect) => {
                // Unlocking starts from what's on screen, so the boxes don't jump.
                if (!lockAspect) onRegions(shown);
                onFraming({ ...framing, lockAspect });
              }}
            >
              lock box shape
            </Toggle>
          </div>
          <AnimatePresence initial={false}>
            {!framing.lockAspect && (
              <motion.div className={styles.reveal} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING}>
                <Segment label="empty space" name="fill" value={framing.fill} options={framing.hasFacecam ? FILLS : FILLS.filter((f) => f.id !== "facecam")} onChange={(fill) => onFraming({ ...framing, fill })} />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {framing.hasFacecam && (
              <motion.div className={styles.reveal} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING}>
                <Segment label="face border" name="border" value={framing.border} options={BORDERS} onChange={(border) => onFraming({ ...framing, border })} />
              </motion.div>
            )}
          </AnimatePresence>
          <Toggle checked={showCaptions} onChange={onShowCaptions}>show subtitles</Toggle>
          <AnimatePresence initial={false}>
            {showCaptions && (
              <motion.div className={styles.reveal} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING}>
                <label className={styles.optionRow}>
                  <span className={styles.segmentLabel}>subtitle font</span>
                  <select className={styles.line} value={captions.font} onChange={(e) => onCaptions({ ...captions, font: e.target.value as CaptionFont })}>
                    {CAPTION_FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                </label>
                <label className={styles.optionRow}>
                  <span className={styles.segmentLabel}>subtitle size</span>
                  <input className={styles.scrub} type="range" min={CAPTION_SCALE_MIN} max={CAPTION_SCALE_MAX} step={SCALE_STEP} value={captions.scale} aria-valuetext={`${Math.round(captions.scale * 100)}%`} onChange={(e) => onCaptions({ ...captions, scale: Number(e.target.value) })} />
                </label>
                <label className={styles.optionRow}>
                  <span className={styles.segmentLabel}>move up or down</span>
                  <input className={styles.scrub} type="range" min={Math.round(offsetRange.min)} max={Math.round(offsetRange.max)} step={4} value={Math.round(captions.offsetY)} onChange={(e) => onCaptions({ ...captions, offsetY: Number(e.target.value) })} />
                </label>
                <p className={styles.caption}>
                  Drag the subtitles in the preview to place them.{" "}
                  {moved && <button type="button" className={styles.link} onClick={() => onCaptions(DEFAULT_CAPTIONS)}>reset subtitles</button>}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {children}
        </motion.div>
      </div>

      <motion.div variants={item} className={styles.previewWrap}>
        <div className={styles.previewBox}>
          <motion.canvas key={template} ref={previewRef} data-preview width={CANVAS_W / 2} height={CANVAS_H / 2} className={styles.preview} initial={{ opacity: 0.5, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={SPRING} aria-label={`Preview of the ${current.name} template`} role="img" />
          {showCaptions && (
            <div
              ref={handleRef}
              data-caption-handle
              className={styles.captionHandle}
              tabIndex={0}
              role="group"
              aria-label="Subtitles. Arrow keys move them."
              onPointerDown={startCaptionDrag}
              onPointerMove={trackCaptionDrag}
              onPointerUp={() => {
                captionDrag.current = null;
              }}
              onKeyDown={onCaptionKey}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
