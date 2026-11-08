/** Each stage's share of the whole bar, sized to roughly how long it takes. */
const STAGES: Record<string, { from: number; to: number; label: string }> = {
  keys: { from: 0, to: 0.01, label: "getting ready" },
  measuring: { from: 0.01, to: 0.12, label: "listening" },
  reactions: { from: 0.12, to: 0.22, label: "finding moments" },
  transcribing: { from: 0.22, to: 0.68, label: "writing captions" },
  watching: { from: 0.68, to: 0.8, label: "watching the moments" },
  judging: { from: 0.8, to: 0.85, label: "picking the best" },
  rendering: { from: 0.85, to: 1, label: "cutting clips" },
};

export function overallProgress(stage: string, fraction: number): number {
  const s = STAGES[stage];
  if (!s) return 0;
  return s.from + (s.to - s.from) * Math.min(1, Math.max(0, fraction));
}

const FLOOR_DB = -60;
export const WAVE_SLICES = 240;

/** Reduces per-second loudness to a fixed number of 0..1 bars across the whole stream. */
export function waveformBars(loudnessDb: number[], durationSec: number, slices = WAVE_SLICES): (number | null)[] {
  let floor = Infinity;
  let top = -Infinity;
  for (const db of loudnessDb) {
    if (db <= FLOOR_DB) continue;
    floor = Math.min(floor, db);
    top = Math.max(top, db);
  }
  if (floor === Infinity) [floor, top] = [FLOOR_DB, 0];
  top = Math.max(top, floor + 1);

  const perSlice = slices / Math.max(1, durationSec);
  const bars: (number | null)[] = new Array(slices).fill(null);
  loudnessDb.forEach((db, second) => {
    const level = Math.min(1, Math.max(0.06, (db - floor) / (top - floor))) ** 1.6;
    // One second covers several slices on a short video, so fill them all.
    const first = Math.min(slices - 1, Math.floor(second * perSlice));
    const last = Math.min(slices - 1, Math.max(first, Math.ceil((second + 1) * perSlice) - 1));
    for (let slice = first; slice <= last; slice++) bars[slice] = Math.max(bars[slice] ?? 0, level);
  });
  return bars;
}

export function stageLabel(stage: string, message: string): string {
  if (message.startsWith("Downloading")) return "setting up, first time only";
  return STAGES[stage]?.label ?? "getting ready";
}
