import type { CamBorder, CaptionFont, CaptionStyle, FramingOptions, OutroOptions, Rect, SplitRegions, TemplateId, Word } from "./types";

export const CANVAS_W = 1080;
export const CANVAS_H = 1920;
/** Text stays inside the area every platform's buttons and labels leave clear. */
export const SAFE_TEXT_WIDTH = 900;
export const SAFE_TOP = 210;
export const SAFE_BOTTOM = CANVAS_H - 300;

const FONT = 'Anton, Impact, "Arial Black", sans-serif';
const MIN_REGION = 0.05;
const MIN_CAPTION_SIZE = 48;
const CAPTION_LINE_HEIGHT = 1.2;
const CAPTION_STROKE = 1 / 7;
const FALLBACK_FONTS = 'Impact, "Arial Black", sans-serif';
const SAFE_SIDE = (CANVAS_W - SAFE_TEXT_WIDTH) / 2;

export const CAPTION_FONTS: { id: CaptionFont; label: string; family: string; file: string }[] = [
  { id: "anton", label: "anton", family: "Anton", file: "Anton-Regular.ttf" },
  { id: "bangers", label: "bangers", family: "Bangers", file: "Bangers-Regular.woff2" },
  { id: "archivo", label: "archivo black", family: "Archivo Black", file: "ArchivoBlack-Regular.woff2" },
  { id: "luckiest", label: "luckiest guy", family: "Luckiest Guy", file: "LuckiestGuy-Regular.woff2" },
  { id: "marker", label: "permanent marker", family: "Permanent Marker", file: "PermanentMarker-Regular.woff2" },
];

export const DEFAULT_CAPTIONS: CaptionStyle = { offsetX: 0, offsetY: 0, scale: 1, font: "anton" };
export const CAPTION_SCALE_MIN = 0.6;
export const CAPTION_SCALE_MAX = 1.5;

const captionFamily = (font: CaptionFont) => `"${CAPTION_FONTS.find((f) => f.id === font)?.family ?? "Anton"}", ${FALLBACK_FONTS}`;

export type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
/** Copies part of the source picture onto the canvas: a video element or a decoded frame. */
export type Blit = (target: Ctx, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number) => void;

export interface Slot {
  source: keyof SplitRegions;
  x: number;
  y: number;
  w: number;
  h: number;
  radius?: number;
  border?: boolean;
}

export interface Template {
  id: TemplateId;
  name: string;
  description: string;
  accent: string;
  /** Drawn in order, so later slots sit on top. */
  slots: Slot[];
  captionY: number;
  captionSize: number;
  titleBand?: { y: number; h: number };
}

export const DEFAULT_FRAMING: FramingOptions = { hasFacecam: true, lockAspect: true, fill: "blur", border: "clean" };

export const TEMPLATES: Template[] = [
  {
    id: "stacked",
    name: "Stacked",
    description: "Your face on top, the game below. The classic streamer clip.",
    accent: "#ffe500",
    slots: [
      { source: "cam", x: 0, y: 0, w: CANVAS_W, h: 640 },
      { source: "game", x: 0, y: 640, w: CANVAS_W, h: 1280 },
    ],
    captionY: 1250,
    captionSize: 112,
  },
  {
    id: "focus",
    name: "Game Focus",
    description: "The game fills the screen, with your face in a floating box.",
    accent: "#7dff3a",
    slots: [
      { source: "game", x: 0, y: 0, w: CANVAS_W, h: CANVAS_H },
      { source: "cam", x: 48, y: 230, w: 400, h: 400, radius: 48, border: true },
    ],
    captionY: 1300,
    captionSize: 112,
  },
  {
    id: "banner",
    name: "Title Banner",
    description: "A big headline over the whole game. Best for story moments.",
    accent: "#ff5000",
    slots: [
      { source: "game", x: 0, y: 540, w: CANVAS_W, h: 860 },
      { source: "cam", x: 48, y: 1090, w: 290, h: 290, radius: 40, border: true },
    ],
    titleBand: { y: SAFE_TOP, h: 310 },
    captionY: 1520,
    captionSize: 100,
  },
];

export function getTemplate(id: TemplateId): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

/** The template as it applies here: with no facecam, the game takes over the face's space. */
export function activeTemplate(t: Template, framing: Pick<FramingOptions, "hasFacecam">): Template {
  const cam = t.slots.find((s) => s.source === "cam");
  if (framing.hasFacecam || !cam) return t;
  const slots = t.slots
    .filter((s) => s.source !== "cam")
    .map((s) => (cam.x === s.x && cam.w === s.w && cam.y + cam.h === s.y ? { ...s, y: cam.y, h: s.h + cam.h } : s));
  return { ...t, slots };
}

/** Region width divided by region height, in frame fractions, that fills a slot exactly. */
export function regionRatio(t: Template, source: keyof SplitRegions, frameAspect: number): number {
  const slot = t.slots.find((s) => s.source === source);
  return slot ? slot.w / slot.h / frameAspect : 1;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Gives a region the slot's shape while keeping its center, staying inside the frame. */
export function fitRegion(r: Rect, ratio: number): Rect {
  let w = clamp(r.w, MIN_REGION, 1);
  let h = w / ratio;
  if (h > 1) {
    h = 1;
    w = ratio;
  }
  if (w > 1) {
    w = 1;
    h = 1 / ratio;
  }
  return { x: clamp(r.x + r.w / 2 - w / 2, 0, 1 - w), y: clamp(r.y + r.h / 2 - h / 2, 0, 1 - h), w, h };
}

export function fitRegions(regions: SplitRegions, t: Template, frameAspect: number): SplitRegions {
  return {
    cam: fitRegion(regions.cam, regionRatio(t, "cam", frameAspect)),
    game: fitRegion(regions.game, regionRatio(t, "game", frameAspect)),
  };
}

/** Resizes from the bottom-right corner, keeping the slot's shape. */
export function resizeRegion(o: Rect, dx: number, ratio: number): Rect {
  let w = clamp(o.w + dx, MIN_REGION, 1 - o.x);
  let h = w / ratio;
  if (o.y + h > 1) {
    h = 1 - o.y;
    w = h * ratio;
  }
  return { ...o, w, h };
}

/** Resizes from the bottom-right corner into any shape. */
export function stretchRegion(o: Rect, dx: number, dy: number): Rect {
  return { ...o, w: clamp(o.w + dx, MIN_REGION, 1 - o.x), h: clamp(o.h + dy, MIN_REGION, 1 - o.y) };
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** One painting step. `frame` is the slot it's clipped to. */
export type FrameOp =
  | { kind: "black"; frame: Box; radius?: number }
  | { kind: "blur"; src: Rect; frame: Box; radius?: number }
  | { kind: "picture"; source: keyof SplitRegions; src: Rect; dest: Box; frame: Box; radius?: number };

export interface FramePlan {
  ops: FrameOp[];
  cam: (Box & { radius?: number }) | null;
}

const SHAPE_TOLERANCE = 0.01;

function containIn(r: Rect, slot: Box, frameAspect: number, anchor: "center" | "end"): Box {
  const aspect = (r.w * frameAspect) / r.h;
  const wide = aspect > slot.w / slot.h;
  const w = wide ? slot.w : slot.h * aspect;
  const h = wide ? slot.w / aspect : slot.h;
  const share = anchor === "end" ? 1 : 0.5;
  return { x: slot.x + (slot.w - w) * share, y: slot.y + (slot.h - h) * share, w, h };
}

/** Decides what gets drawn where, separately from any drawing, so it can be tested. */
export function planFrame(template: Template, regions: SplitRegions, frameAspect: number, framing: FramingOptions): FramePlan {
  const t = activeTemplate(template, framing);
  const sized = framing.lockAspect ? fitRegions(regions, t, frameAspect) : regions;
  const fills = (r: Rect, slot: Box) => framing.lockAspect || Math.abs((r.w * frameAspect) / r.h / (slot.w / slot.h) - 1) < SHAPE_TOLERANCE;

  const gameSlot = t.slots.find((s) => s.source === "game")!;
  const camSlot = t.slots.find((s) => s.source === "cam");
  const faceInGap = camSlot !== undefined && framing.fill === "facecam" && !fills(sized.game, gameSlot);

  let gameDest: Box = gameSlot;
  let camFrame: Box = camSlot ?? gameSlot;
  if (faceInGap) {
    gameDest = containIn(sized.game, gameSlot, frameAspect, "end");
    const gapIsAbove = gameDest.y > gameSlot.y;
    const gap: Box = gapIsAbove ? { x: gameSlot.x, y: gameSlot.y, w: gameSlot.w, h: gameDest.y - gameSlot.y } : { x: gameSlot.x, y: gameSlot.y, w: gameDest.x - gameSlot.x, h: gameSlot.h };
    // Stacked: the gap touches the face slot, so the face simply grows into it.
    const touches = gapIsAbove && camSlot.x === gameSlot.x && camSlot.w === gameSlot.w && camSlot.y + camSlot.h === gameSlot.y;
    camFrame = touches ? { ...camSlot, h: camSlot.h + gap.h } : gap;
  }

  const backdrop = (r: Rect, frame: Box, radius?: number): FrameOp => (framing.fill === "black" ? { kind: "black", frame, radius } : { kind: "blur", src: r, frame, radius });
  const ops: FrameOp[] = [];
  let cam: FramePlan["cam"] = null;

  for (const slot of t.slots) {
    const r = sized[slot.source];
    if (slot.source === "cam") {
      const radius = faceInGap ? undefined : slot.radius;
      if (framing.fill === "facecam" || fills(r, camFrame)) {
        ops.push({ kind: "picture", source: "cam", src: fitRegion(r, camFrame.w / camFrame.h / frameAspect), dest: camFrame, frame: camFrame, radius });
      } else {
        ops.push(backdrop(r, camFrame, radius));
        ops.push({ kind: "picture", source: "cam", src: r, dest: containIn(r, camFrame, frameAspect, "center"), frame: camFrame, radius });
      }
      cam = { ...camFrame, radius };
    } else if (faceInGap) {
      ops.push({ kind: "picture", source: "game", src: r, dest: gameDest, frame: gameDest });
    } else if (fills(r, gameSlot)) {
      ops.push({ kind: "picture", source: "game", src: r, dest: gameSlot, frame: gameSlot, radius: slot.radius });
    } else {
      ops.push(backdrop(r, gameSlot, slot.radius));
      ops.push({ kind: "picture", source: "game", src: r, dest: containIn(r, gameSlot, frameAspect, "center"), frame: gameSlot, radius: slot.radius });
    }
  }
  return { ops, cam };
}

let blurCanvas: OffscreenCanvas | null = null;
const BLUR_WIDTH = 48;

/** Draws tiny, then scales up: a soft blur that doesn't depend on ctx.filter. */
function drawBlurred(ctx: Ctx, blit: Blit, frameW: number, frameH: number, src: Rect, frame: Box) {
  blurCanvas ??= new OffscreenCanvas(BLUR_WIDTH, BLUR_WIDTH);
  const h = Math.max(1, Math.round((BLUR_WIDTH * frame.h) / frame.w));
  if (blurCanvas.height !== h) blurCanvas.height = h;
  const small = blurCanvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
  const covered = fitRegion(src, frame.w / frame.h / (frameW / frameH));
  blit(small, covered.x * frameW, covered.y * frameH, covered.w * frameW, covered.h * frameH, 0, 0, BLUR_WIDTH, h);
  ctx.drawImage(blurCanvas, 0, 0, BLUR_WIDTH, h, frame.x, frame.y, frame.w, frame.h);
  ctx.fillStyle = "rgb(0 0 0 / 0.3)";
  ctx.fillRect(frame.x, frame.y, frame.w, frame.h);
}

function drawCamBorder(ctx: Ctx, t: Template, cam: NonNullable<FramePlan["cam"]>, border: CamBorder) {
  if (border === "none") return;
  ctx.save();
  ctx.strokeStyle = t.accent;
  if (border === "corners") {
    const inset = 22;
    const arm = Math.min(cam.w, cam.h) * 0.2;
    const [l, r, top, bottom] = [cam.x + inset, cam.x + cam.w - inset, cam.y + inset, cam.y + cam.h - inset];
    const path = () => {
      ctx.beginPath();
      for (const [cx, cy, dx, dy] of [[l, top, 1, 1], [r, top, -1, 1], [l, bottom, 1, -1], [r, bottom, -1, -1]]) {
        ctx.moveTo(cx + dx * arm, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + dy * arm);
      }
    };
    ctx.lineJoin = "miter";
    ctx.lineCap = "square";
    path();
    ctx.lineWidth = 20;
    ctx.strokeStyle = "#000000";
    ctx.stroke();
    path();
    ctx.lineWidth = 11;
    ctx.strokeStyle = t.accent;
    ctx.stroke();
  } else {
    const width = border === "neon" ? 7 : 9;
    // Neon sits inside the edge, so its glow has room on both sides.
    const edge = width / 2 + (border === "neon" ? 14 : 0);
    ctx.lineWidth = width;
    if (border === "neon") {
      ctx.shadowColor = t.accent;
      // Canvas shadows ignore scaling, so match it to keep the preview honest.
      ctx.shadowBlur = 70 * ctx.getTransform().a;
    }
    ctx.beginPath();
    ctx.roundRect(cam.x + edge, cam.y + edge, cam.w - edge * 2, cam.h - edge * 2, Math.max(0, (cam.radius ?? 0) - edge));
    ctx.stroke();
    if (border === "neon") ctx.stroke();
  }
  ctx.restore();
}

/** Paints the template's picture areas from one source frame. */
export function drawFrame(ctx: Ctx, blit: Blit, frameW: number, frameH: number, t: Template, regions: SplitRegions, framing: FramingOptions): void {
  const plan = planFrame(t, regions, frameW / frameH, framing);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  for (const op of plan.ops) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(op.frame.x, op.frame.y, op.frame.w, op.frame.h, op.radius ?? 0);
    ctx.clip();
    if (op.kind === "black") {
      ctx.fillStyle = "#000000";
      ctx.fillRect(op.frame.x, op.frame.y, op.frame.w, op.frame.h);
    } else if (op.kind === "blur") {
      drawBlurred(ctx, blit, frameW, frameH, op.src, op.frame);
    } else {
      blit(ctx, op.src.x * frameW, op.src.y * frameH, op.src.w * frameW, op.src.h * frameH, op.dest.x, op.dest.y, op.dest.w, op.dest.h);
    }
    ctx.restore();
  }
  if (plan.cam) drawCamBorder(ctx, t, plan.cam, framing.border);
}

function strokedText(ctx: Ctx, text: string, x: number, y: number, fill: string, strokeWidth: number) {
  ctx.lineJoin = "round";
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = "#000000";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

/** Where a line's center lands: the template's spot plus the offset, kept inside the safe area. */
export function placeCaption(t: Template, style: CaptionStyle, width: number, height: number): { x: number; y: number } {
  return {
    x: clamp(CANVAS_W / 2 + style.offsetX, SAFE_SIDE + width / 2, CANVAS_W - SAFE_SIDE - width / 2),
    y: clamp(t.captionY + style.offsetY, SAFE_TOP + height / 2, SAFE_BOTTOM - height / 2),
  };
}

/** The offsets that actually apply, so dragging past the edge leaves no dead zone. */
export function settleCaption(t: Template, style: CaptionStyle, width: number, height: number): CaptionStyle {
  const { x, y } = placeCaption(t, style, width, height);
  return { ...style, offsetX: x - CANVAS_W / 2, offsetY: y - t.captionY };
}

/** The tallest and lowest offsets a line of this size can use. */
export function captionOffsetRange(t: Template, scale: number): { min: number; max: number } {
  const half = (t.captionSize * scale * CAPTION_LINE_HEIGHT) / 2;
  return { min: SAFE_TOP + half - t.captionY, max: SAFE_BOTTOM - half - t.captionY };
}

function measureCaption(ctx: Ctx, t: Template, texts: string[], style: CaptionStyle) {
  const family = captionFamily(style.font);
  const widthAt = (s: number) => {
    ctx.font = `${s}px ${family}`;
    return ctx.measureText(texts.join(" ")).width;
  };
  let size = Math.round(t.captionSize * style.scale);
  while (widthAt(size) > SAFE_TEXT_WIDTH && size > MIN_CAPTION_SIZE) size -= 4;
  return { family, size, width: widthAt(size), height: size * CAPTION_LINE_HEIGHT };
}

/** The area a line of subtitles covers, in canvas units. */
export function captionBox(ctx: Ctx, t: Template, line: Word[], style: CaptionStyle): Box {
  const { width, height } = measureCaption(ctx, t, line.map((w) => w.text.toUpperCase()), style);
  const center = placeCaption(t, style, width, height);
  return { x: center.x - width / 2, y: center.y - height / 2, w: width, h: height };
}

/** Word-by-word caption: the spoken word turns the accent color and pops slightly larger. */
export function drawCaption(ctx: Ctx, t: Template, line: Word[], activeIndex: number, style: CaptionStyle = DEFAULT_CAPTIONS): void {
  const texts = line.map((w) => w.text.toUpperCase());
  const { family, size, width: total, height } = measureCaption(ctx, t, texts, style);
  const center = placeCaption(t, style, total, height);
  const stroke = size * CAPTION_STROKE;

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = `${size}px ${family}`;
  const space = ctx.measureText(" ").width;
  let x = center.x - total / 2;
  texts.forEach((text, i) => {
    const width = ctx.measureText(text).width;
    if (i === activeIndex) {
      const popped = Math.round(size * 1.12);
      ctx.font = `${popped}px ${family}`;
      strokedText(ctx, text, x - (ctx.measureText(text).width - width) / 2, center.y, t.accent, stroke * 1.12);
      ctx.font = `${size}px ${family}`;
    } else {
      strokedText(ctx, text, x, center.y, "#ffffff", stroke);
    }
    x += width + space;
  });
}

/** Wraps text to at most `maxLines`, shrinking the type until it fits. */
export function wrapTitle(measure: (text: string, size: number) => number, text: string, startSize: number, maxWidth: number, maxLines: number): { lines: string[]; size: number } {
  const words = text.trim().split(/\s+/);
  for (let size = startSize; ; size -= 6) {
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (current && measure(next, size) > maxWidth) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
    if ((lines.length <= maxLines && lines.every((l) => measure(l, size) <= maxWidth)) || size <= 44) {
      return { lines: lines.slice(0, maxLines), size };
    }
  }
}

function drawTitleBand(ctx: Ctx, t: Template, title: string) {
  if (!t.titleBand || !title) return;
  const { y, h } = t.titleBand;
  const { lines, size } = wrapTitle(
    (text, s) => {
      ctx.font = `${s}px ${FONT}`;
      return ctx.measureText(text).width;
    },
    title.toUpperCase(),
    104,
    SAFE_TEXT_WIDTH,
    3
  );
  const lineHeight = size * 1.12;
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((line, i) => {
    const lineY = y + h / 2 - ((lines.length - 1) * lineHeight) / 2 + i * lineHeight;
    strokedText(ctx, line, CANVAS_W / 2, lineY, i === lines.length - 1 ? t.accent : "#ffffff", 10);
  });
}

function drawHook(ctx: Ctx, t: Template, hook: string) {
  ctx.font = `76px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const text = hook.toUpperCase();
  const width = Math.min(ctx.measureText(text).width, SAFE_TEXT_WIDTH);
  ctx.fillStyle = t.accent;
  ctx.fillRect((CANVAS_W - width) / 2 - 30, SAFE_TOP + 40 - 60, width + 60, 120);
  ctx.fillStyle = "#000000";
  ctx.fillText(text, CANVAS_W / 2, SAFE_TOP + 40, SAFE_TEXT_WIDTH);
}

export interface Overlay {
  title: string;
  /** Short opening text; only shown when the template has no title band. */
  hook: string;
  caption: { line: Word[]; activeIndex: number } | null;
}

export function drawOverlays(ctx: Ctx, t: Template, overlay: Overlay, style: CaptionStyle = DEFAULT_CAPTIONS): void {
  drawTitleBand(ctx, t, overlay.title);
  if (overlay.hook && !t.titleBand) drawHook(ctx, t, overlay.hook);
  if (overlay.caption) drawCaption(ctx, t, overlay.caption.line, overlay.caption.activeIndex, style);
}

/** End card that fades in over the last frames. */
export function drawOutro(ctx: Ctx, t: Template, outro: OutroOptions, opacity: number): void {
  ctx.save();
  ctx.globalAlpha = opacity * 0.88;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.globalAlpha = opacity;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const centerY = CANVAS_H / 2 - 120;
  ctx.fillStyle = "#ffffff";
  ctx.font = `124px ${FONT}`;
  ctx.fillText(outro.message.toUpperCase(), CANVAS_W / 2, centerY, SAFE_TEXT_WIDTH);
  if (outro.handle) {
    ctx.font = `76px ${FONT}`;
    ctx.fillStyle = t.accent;
    ctx.fillText(outro.handle, CANVAS_W / 2, centerY + 150, SAFE_TEXT_WIDTH);
  }
  ctx.restore();
}

let fontsReady: Promise<void> | null = null;

/** Loads the caption fonts into the current page or worker. One failing leaves the others usable. */
export function ensureFonts(): Promise<void> {
  fontsReady ??= (async () => {
    const scope = globalThis as unknown as { fonts?: FontFaceSet; document?: Document; location: Location };
    const set = scope.fonts ?? scope.document?.fonts;
    if (!set) return;
    await Promise.all(
      CAPTION_FONTS.map(async ({ family, file }) => {
        const face = await new FontFace(family, `url(${scope.location.origin}/fonts/${file})`).load().catch(() => null);
        if (face) set.add(face);
      })
    );
  })().catch(() => undefined);
  return fontsReady;
}
