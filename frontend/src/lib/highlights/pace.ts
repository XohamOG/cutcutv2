/**
 * Lets a long run share the computer. After each stretch of heavy work it rests for a while,
 * so a laptop's fans and battery keep up instead of it heating until it shuts down.
 */
const STRETCH_MS = 1500;
const REST_PER_WORK = 0.6;

let gentle = false;
let workingSince = 0;

export function setGentle(on: boolean): void {
  gentle = on;
  workingSince = performance.now();
}

/** Cheap to call often: it only waits once a stretch of work has gone on long enough. */
export async function breathe(): Promise<void> {
  if (!gentle) return;
  const worked = performance.now() - workingSince;
  if (worked < STRETCH_MS) return;
  await new Promise((resolve) => setTimeout(resolve, worked * REST_PER_WORK));
  workingSince = performance.now();
}

/** How much longer a gentle run takes. Measured, not 1 + REST_PER_WORK, because waits on the graphics chip count as work too. */
export const GENTLE_SLOWDOWN = 1.8;

type BatteryNavigator = Navigator & { deviceMemory?: number; getBattery?: () => Promise<{ charging: boolean }> };

/** Gentle unless the machine looks strong and plugged in. Browsers cap reported memory at 8 GB. */
export async function suggestGentle(): Promise<boolean> {
  const nav = navigator as BatteryNavigator;
  const weak = (nav.deviceMemory ?? 8) < 8 || (nav.hardwareConcurrency ?? 8) < 8;
  const battery = await nav.getBattery?.().catch(() => null);
  return weak || battery?.charging === false;
}
