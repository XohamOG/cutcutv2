import type { AudioFeatures } from "./types";

const ANALYSIS_RATE = 8000;
const FRAME_SAMPLES = 320; // 40 ms
const FRAMES_PER_SEC = ANALYSIS_RATE / FRAME_SAMPLES;
const PITCH_RATE = ANALYSIS_RATE / 2;
const MIN_LAG = Math.floor(PITCH_RATE / 500);
const MAX_LAG = Math.ceil(PITCH_RATE / 75);
const VOICED_PERIODICITY = 0.55;
const VOICED_MIN_DB = -50;
const FLOOR_DB = -60;
const SPEECH_SECOND_RATIO = 0.25;

const toDb = (power: number) => Math.max(FLOOR_DB, 10 * Math.log10(power || 1e-12));

/**
 * Streaming per-second speech analysis. Voiced speech is strongly periodic, while
 * gunfire and explosions are noise-like, so periodicity separates the streamer from
 * most game sound without running a model over hours of audio. Only per-second
 * numbers are kept, so a long stream never sits in memory.
 */
export class VoiceAnalyzer {
  private readonly ratio: number;
  private phase = 0;
  private acc = 0;
  private accCount = 0;
  private readonly frame = new Float32Array(FRAME_SAMPLES);
  private frameFill = 0;
  private readonly halved = new Float32Array(FRAME_SAMPLES / 2);

  private secondFrames = 0;
  private powerSum = 0;
  private voicedFrames = 0;
  private voicedPower = 0;
  private pitches: number[] = [];

  readonly features: AudioFeatures = { loudnessDb: [], voicedRatio: [], voicedDb: [], pitchHz: [] };

  constructor(sampleRate: number) {
    this.ratio = sampleRate / ANALYSIS_RATE;
  }

  push(mono: Float32Array): void {
    for (let i = 0; i < mono.length; i++) {
      this.acc += mono[i];
      this.accCount++;
      this.phase += 1;
      if (this.phase >= this.ratio) {
        this.phase -= this.ratio;
        this.frame[this.frameFill++] = this.acc / this.accCount;
        this.acc = 0;
        this.accCount = 0;
        if (this.frameFill === FRAME_SAMPLES) {
          this.frameFill = 0;
          this.processFrame();
        }
      }
    }
  }

  finish(): AudioFeatures {
    if (this.secondFrames > FRAMES_PER_SEC / 2) this.flushSecond();
    return this.features;
  }

  private processFrame(): void {
    let power = 0;
    for (let i = 0; i < FRAME_SAMPLES; i++) power += this.frame[i] * this.frame[i];
    power /= FRAME_SAMPLES;
    this.powerSum += power;
    this.secondFrames++;

    if (toDb(power) > VOICED_MIN_DB) {
      const pitch = this.detectPitch();
      if (pitch !== null) {
        this.voicedFrames++;
        this.voicedPower += power;
        this.pitches.push(pitch);
      }
    }
    if (this.secondFrames === FRAMES_PER_SEC) this.flushSecond();
  }

  private detectPitch(): number | null {
    const x = this.halved;
    const n = x.length;
    let mean = 0;
    for (let i = 0; i < n; i++) {
      x[i] = (this.frame[2 * i] + this.frame[2 * i + 1]) / 2;
      mean += x[i];
    }
    mean /= n;
    let r0 = 0;
    for (let i = 0; i < n; i++) {
      x[i] -= mean;
      r0 += x[i] * x[i];
    }
    if (r0 === 0) return null;

    let bestLag = 0;
    let best = 0;
    for (let lag = MIN_LAG; lag <= MAX_LAG; lag++) {
      let r = 0;
      for (let i = 0; i < n - lag; i++) r += x[i] * x[i + lag];
      const normalized = (r / r0) * (n / (n - lag));
      if (normalized > best) {
        best = normalized;
        bestLag = lag;
      }
    }
    return best >= VOICED_PERIODICITY ? PITCH_RATE / bestLag : null;
  }

  private flushSecond(): void {
    const f = this.features;
    const ratio = this.voicedFrames / this.secondFrames;
    f.loudnessDb.push(toDb(this.powerSum / this.secondFrames));
    f.voicedRatio.push(ratio);
    if (ratio >= SPEECH_SECOND_RATIO) {
      f.voicedDb.push(toDb(this.voicedPower / this.voicedFrames));
      const sorted = this.pitches.sort((a, b) => a - b);
      f.pitchHz.push(sorted[sorted.length >> 1]);
    } else {
      f.voicedDb.push(NaN);
      f.pitchHz.push(NaN);
    }
    this.secondFrames = 0;
    this.powerSum = 0;
    this.voicedFrames = 0;
    this.voicedPower = 0;
    this.pitches = [];
  }
}
