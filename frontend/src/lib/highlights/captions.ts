import type { Word } from "./types";

const MAX_WORDS_PER_LINE = 3;
const MAX_LINE_SEC = 1.8;
const MAX_GAP_SEC = 0.6;

/** Groups words into short on-screen lines, breaking at pauses. */
export function chunkWords(words: Word[]): Word[][] {
  const chunks: Word[][] = [];
  let current: Word[] = [];
  for (const w of words) {
    const last = current[current.length - 1];
    const startsNew =
      current.length >= MAX_WORDS_PER_LINE ||
      (last && w.start - last.end > MAX_GAP_SEC) ||
      (current[0] && w.end - current[0].start > MAX_LINE_SEC);
    if (startsNew) {
      chunks.push(current);
      current = [];
    }
    current.push(w);
  }
  if (current.length) chunks.push(current);
  return chunks;
}

/** The line on screen at time `t` and the word to highlight, or null between lines. */
export function captionAt(lines: Word[][], t: number): { line: Word[]; activeIndex: number } | null {
  for (const line of lines) {
    const end = line[line.length - 1].end;
    if (t < line[0].start) return null;
    if (t < end) {
      let activeIndex = 0;
      line.forEach((w, i) => {
        if (w.start <= t) activeIndex = i;
      });
      return { line, activeIndex };
    }
  }
  return null;
}

/** Applies edited caption lines. A line with a new word count shares its time evenly. */
export function applyCaptionEdits(lines: Word[][], edits: Map<number, string>): Word[] {
  return lines.flatMap((line, i) => {
    const edited = edits.get(i);
    if (edited === undefined) return line;
    const tokens = edited.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === line.length) return line.map((w, j) => ({ ...w, text: tokens[j] }));
    const start = line[0].start;
    const share = (line[line.length - 1].end - start) / tokens.length;
    return tokens.map((text, j) => ({ text, start: start + j * share, end: start + (j + 1) * share }));
  });
}

/** The words spoken inside a clip, as plain text. */
export function clipWords(words: Word[], startSec: number, endSec: number): string {
  return words.filter((w) => w.end > startSec && w.start < endSec).map((w) => w.text).join(" ");
}
