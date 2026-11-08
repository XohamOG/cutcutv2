export interface FriendlyError {
  title: string;
  hint: string;
}

const RULES: [RegExp, FriendlyError][] = [
  [/unsupported|unrecognizable|can't be converted|no video track/i, { title: "This file can’t be read", hint: "Try an MP4 recording." }],
  [/no audio track/i, { title: "This video has no sound", hint: "Clips are picked from your voice. Try a recording with audio." }],
  [/stood out/i, { title: "Nothing stood out", hint: "Try a longer stream, or one with commentary." }],
  [/rejected the API key/i, { title: "Your API key was rejected", hint: "Check it in settings, or remove it to use the free options." }],
  [/rate-limited/i, { title: "Your API key hit its limit", hint: "Wait a minute and try again." }],
  [/Chrome or Edge/i, { title: "This browser can’t make video", hint: "Open viralbits in current Chrome or Edge." }],
  [/memory|allocation/i, { title: "Your device ran out of memory", hint: "Close other tabs and apps, then try again." }],
];

/** Turns a technical failure into what happened and what to do next. */
export function friendlyError(message: string): FriendlyError {
  return RULES.find(([pattern]) => pattern.test(message))?.[1] ?? { title: "Your clips couldn’t be made", hint: "Try again, or report this and we’ll look into it." };
}
