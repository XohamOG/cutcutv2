import { test } from "node:test";
import assert from "node:assert/strict";
import { toAgentCandidate } from "./agentApi.ts";
import type { Candidate } from "./types";

test("the agents get a compact moment: rounded numbers, times relative to the window, no extra fields", () => {
  const c: Candidate = {
    id: 4, peakSec: 130.456, windowStart: 100, windowEnd: 160.04, score: 0.87654, voice: 0.71234, loudness: 0.5, chat: null, laughter: 0.333333, shout: null,
    chatSample: ["LOL"], words: [{ start: 129.96, end: 130.4, text: "no" }, { start: 130.5, end: 130.9, text: "way" }],
    extra: { hypePhrase: "no way", screenWords: ["VICTORY"] },
  };
  assert.deepEqual(toAgentCandidate(c), {
    id: 4, score: 0.88, voice: 0.71, chat: null, laughter: 0.33, shout: null, window: 60, peak: 30.5,
    notes: [], screen: ["VICTORY"], words: [[30, "no"], [30.5, "way"]], chat_sample: ["LOL"],
  });
});
