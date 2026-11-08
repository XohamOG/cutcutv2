"use client";

import { AnimatePresence, motion } from "motion/react";
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CamBorder, EmptyFill, FramingOptions, SplitRegions, TemplateId } from "@/lib/highlights/types";
import { CANVAS_H, CANVAS_W, TEMPLATES, drawFrame, drawOverlays, ensureFonts, activeTemplate, fitRegions, getTemplate, regionRatio, type Ctx, type Template } from "@/lib/highlights/templates";
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

function paint(canvas: HTMLCanvasElement | null, video: HTMLVideoElement | null, t: Template, regions: SplitRegions, framing: FramingOptions) {
  const ctx = canvas?.getContext("2d") as Ctx | null;
  if (!canvas || !ctx || !video || video.readyState < 2) return;
  const scale = canvas.width / CANVAS_W;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  drawFrame(ctx, (target, sx, sy, sw, sh, dx, dy, dw, dh) => target.drawImage(video, sx, sy, sw, sh, dx, dy, dw, dh), video.videoWidth, video.videoHeight, t, regions, framing);
  drawOverlays(ctx, t, { title: "your clip title goes here", hook: "", caption: { line: SAMPLE_LINE, activeIndex: 1 } });
}

interface FramingStudioProps {
  file: File;
  template: TemplateId;
  onTemplate: (id: TemplateId) => void;
  regions: SplitRegions;
  onRegions: (r: SplitRegions) => void;
  framing: FramingOptions;
  onFraming: (f: FramingOptions) => void;
  /** Extra controls shown with the framing options. */
  children?: ReactNode;
}

/** Template choice and framing, shown on a real frame before anything is processed. */
export default function FramingStudio({ file, template, onTemplate, regions, onRegions, framing, onFraming, children }: FramingStudioProps) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [aspect, setAspect] = useState(16 / 9);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [tick, setTick] = useState(0);
  const [ready, setReady] = useState(false);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const videoElement = useRef<HTMLVideoElement | null>(null);
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

  useEffect(() => paint(previewRef.current, video, current, regions, framing), [current, video, regions, framing, tick]);

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
          {children}
        </motion.div>
      </div>

      <motion.div variants={item} className={styles.previewWrap}>
        <motion.canvas key={template} ref={previewRef} data-preview width={CANVAS_W / 2} height={CANVAS_H / 2} className={styles.preview} initial={{ opacity: 0.5, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={SPRING} aria-label={`Preview of the ${current.name} template`} role="img" />
      </motion.div>
    </div>
  );
}
