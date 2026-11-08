import type { ClipResult, Rating, RunOptions, RunSettings } from "./types";

// Bump when analysis output changes shape or meaning, so old checkpoints are ignored.
const CACHE_VERSION = 1;
const DB_NAME = "viralbits";
const STORE = "kv";
const CLIPS_DIR = "clips";
const LAST_RUN_KEY = "run:last";

export interface LastRun {
  fileName: string;
  status: "running" | "finished";
  settings: RunSettings;
}

export interface SavedClip extends ClipResult {
  savedAt: number;
}

type ClipRecord = Omit<SavedClip, "blob">;

/** A like or dislike, with enough about the clip to judge the detector later. */
export interface RatingRecord {
  clipId: string;
  rating: Rating;
  ratedAt: number;
  sourceName: string;
  rank: number;
  score: number;
  durationSec: number;
  startSec: number;
  momentType: string;
  selectedBy: ClipResult["selectedBy"];
  signals: ClipResult["signals"];
  title: string;
}

const ratingKey = (id: string) => `rating:${id}`;

/** Identifies a source file across visits without reading its contents. */
export function sourceFingerprint(file: { name: string; size: number; lastModified: number }): string {
  return `v${CACHE_VERSION}|${file.name}|${file.size}|${file.lastModified}`;
}

/** The settings worth restoring on resume. API keys are deliberately left out. */
export function resumableSettings(o: RunOptions): RunSettings {
  return {
    clipCount: o.clipCount,
    length: o.length,
    template: o.template,
    regions: o.regions,
    framing: o.framing,
    outro: o.outro,
    burnCaptions: o.burnCaptions,
    captions: o.captions,
    watchVideo: o.watchVideo,
    sttProvider: o.stt.provider,
  };
}

export async function hashKey(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value)));
  return Array.from(new Uint8Array(digest).subarray(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

function transact<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const request = work(db.transaction(STORE, mode).objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
  );
}

// Saving is a convenience: a storage failure must never stop a run.
async function getValue<T>(key: string): Promise<T | undefined> {
  try {
    return await transact<T>("readonly", (s) => s.get(key));
  } catch {
    return undefined;
  }
}

async function setValue(key: string, value: unknown): Promise<void> {
  try {
    await transact("readwrite", (s) => s.put(value, key));
  } catch {
    // Quota or private-mode failures just mean this step won't be resumable.
  }
}

/** Returns the saved result for `key`, or computes and saves it. Failures aren't saved. */
export async function remember<T>(key: string, compute: () => Promise<T>): Promise<T> {
  const saved = await getValue<T>(key);
  if (saved !== undefined) return saved;
  const value = await compute();
  await setValue(key, value);
  return value;
}

export const getLastRun = () => getValue<LastRun>(LAST_RUN_KEY);
export const setLastRun = (run: LastRun) => setValue(LAST_RUN_KEY, run);

export async function markRunFinished(): Promise<void> {
  const last = await getLastRun();
  if (last) await setLastRun({ ...last, status: "finished" });
}

async function clipsDirectory(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(CLIPS_DIR, { create: true });
}

/** Writes a finished clip to disk and returns the disk-backed file, or null if that failed. */
export async function saveClip(clip: ClipResult): Promise<File | null> {
  try {
    const dir = await clipsDirectory();
    const handle = await dir.getFileHandle(`${clip.id}.mp4`, { create: true });
    const writable = await handle.createWritable();
    await writable.write(clip.blob);
    await writable.close();
    const { blob: _blob, ...meta } = clip; // eslint-disable-line @typescript-eslint/no-unused-vars
    await setValue(`clip:${clip.id}`, { ...meta, savedAt: Date.now() } satisfies ClipRecord);
    return await handle.getFile();
  } catch {
    return null;
  }
}

export async function loadClip(id: string): Promise<SavedClip | null> {
  const record = await getValue<ClipRecord>(`clip:${id}`);
  if (!record) return null;
  try {
    const handle = await (await clipsDirectory()).getFileHandle(`${id}.mp4`);
    const rated = await getValue<RatingRecord>(ratingKey(id));
    return { ...record, rating: rated?.rating, blob: await handle.getFile() };
  } catch {
    return null;
  }
}

/** Updates a saved clip's details, such as its place in the ranking. */
export async function updateClip(id: string, patch: Partial<ClipRecord>): Promise<void> {
  const record = await getValue<ClipRecord>(`clip:${id}`);
  if (record) await setValue(`clip:${id}`, { ...record, ...patch });
}

/** Removes one saved clip. Used when an edit replaces it. */
export async function deleteClip(id: string): Promise<void> {
  try {
    await transact("readwrite", (s) => s.delete(`clip:${id}`));
    await (await clipsDirectory()).removeEntry(`${id}.mp4`);
  } catch {
    // A leftover file only costs a little disk space.
  }
}

/** Saves or clears a rating. Ratings stay on this device. */
export async function saveRating(clip: Omit<ClipResult, "blob">, rating: Rating | null): Promise<void> {
  if (!rating) {
    await transact("readwrite", (s) => s.delete(ratingKey(clip.id))).catch(() => undefined);
    return;
  }
  await setValue(ratingKey(clip.id), {
    clipId: clip.id,
    rating,
    ratedAt: Date.now(),
    sourceName: clip.sourceName,
    rank: clip.rank,
    score: clip.score,
    durationSec: clip.durationSec,
    startSec: clip.startSec,
    momentType: clip.momentType,
    selectedBy: clip.selectedBy,
    signals: clip.signals,
    title: clip.title,
  } satisfies RatingRecord);
}

export async function listRatings(): Promise<RatingRecord[]> {
  try {
    return await transact<RatingRecord[]>("readonly", (s) => s.getAll(IDBKeyRange.bound("rating:", "rating:\uffff")));
  } catch {
    return [];
  }
}

export async function listSavedClips(): Promise<SavedClip[]> {
  try {
    const range = IDBKeyRange.bound("clip:", "clip:￿");
    const records = await transact<ClipRecord[]>("readonly", (s) => s.getAll(range));
    const clips = await Promise.all(records.map((r) => loadClip(r.id)));
    return clips.filter((c): c is SavedClip => c !== null).sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

/** Removes every saved clip and checkpoint on this device. Ratings are kept for testing. */
export async function clearSavedWork(): Promise<void> {
  const ratings = await listRatings();
  await transact("readwrite", (s) => s.clear()).catch(() => undefined);
  await Promise.all(ratings.map((r) => setValue(ratingKey(r.clipId), r)));
  const root = await navigator.storage.getDirectory();
  await root.removeEntry(CLIPS_DIR, { recursive: true }).catch(() => undefined);
}
