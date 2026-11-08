import type { LlmProvider } from "./types";

const PREFERRED: Record<Exclude<LlmProvider, "gemini">, RegExp> = {
  anthropic: /opus/,
  openai: /^gpt-.*mini/,
  groq: /versatile/,
};

/** The newest stable Flash model: fast, capable, and on Gemini's free tier. */
function pickGemini(available: string[]): string | undefined {
  if (available.includes("gemini-flash-latest")) return "gemini-flash-latest";
  const version = (id: string) => Number(id.match(/^gemini-([\d.]+)-flash$/)?.[1] ?? 0);
  const newest = [...available].sort((a, b) => version(b) - version(a))[0];
  return newest && version(newest) > 0 ? newest : available.find((id) => /flash/.test(id));
}

/** Fills in a sensible model once a key is known, so nobody has to know model names. */
export function pickDefaultModel(provider: LlmProvider, available: string[], current: string): string {
  if (current && available.includes(current)) return current;
  const preferred = provider === "gemini" ? pickGemini(available) : available.find((id) => PREFERRED[provider].test(id));
  return preferred ?? available[0] ?? current;
}

/** Each provider's keys start differently, so a pasted key says where it's from. */
export function detectProvider(key: string): LlmProvider | null {
  const k = key.trim();
  if (k.startsWith("AIza")) return "gemini";
  if (k.startsWith("gsk_")) return "groq";
  if (k.startsWith("sk-ant-")) return "anthropic";
  if (k.startsWith("sk-")) return "openai";
  return null;
}

export const DEFAULT_MODEL: Record<LlmProvider, string> = { anthropic: "claude-opus-5-5", gemini: "", groq: "", openai: "" };
