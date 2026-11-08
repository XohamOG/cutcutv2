import Anthropic from "@anthropic-ai/sdk";
import type { Candidate, ClipLength, LlmKey, LlmProvider, SelectedMoment, SttChoice, Word } from "./types";
import { applyVerdicts, buildUserPrompt, judgeSystem, VERDICT_SCHEMA, type Verdict } from "./selection.ts";
import { buildPostPrompt, parsePostText, POST_SCHEMA, postSystem, type PostInput, type PostText } from "./postText.ts";

const OPENAI_COMPATIBLE = {
  openai: "https://api.openai.com/v1",
  groq: "https://api.groq.com/openai/v1",
} as const;

const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta";
const NON_TEXT_GEMINI = /embedding|aqa|tts|image|live|robotics|computer|nano|veo|imagen|learnlm|gemma/i;

const STT_MODEL = { groq: "whisper-large-v3-turbo", openai: "whisper-1" } as const;
const NON_TEXT_MODEL = /whisper|tts|guard|embed|moderation|dall-e|image|audio|realtime|transcribe|sora/i;
const REFUSAL_FALLBACK_MODELS = new Set(["claude-fable-5-1", "claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5"]);

/** The user's own key, used directly from their browser. No server of ours is involved. */
function claudeClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

async function fetchWithRetry(url: string, init: () => RequestInit, label: string): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, init());
    if (res.ok) return res;
    if ((res.status === 429 || res.status >= 500) && attempt < 3) {
      const retryAfter = Number(res.headers.get("retry-after"));
      await new Promise((r) => setTimeout(r, (retryAfter > 0 ? retryAfter : 2 ** attempt * 2) * 1000));
      continue;
    }
    const detail = await res.text();
    // Gemini reports a bad key as a 400 with this wording.
    if (res.status === 401 || res.status === 403 || (res.status === 400 && /api key/i.test(detail))) throw new Error(`${label} rejected the API key.`);
    throw new Error(`${label} returned ${res.status}: ${detail.slice(0, 300)}`);
  }
}

/** Lists chat models for a key; doubles as a free check that the key works. */
export async function listModels(provider: LlmProvider, apiKey: string): Promise<string[]> {
  if (provider === "anthropic") {
    try {
      const page = await claudeClient(apiKey).models.list({ limit: 100 });
      return page.data.map((m) => m.id);
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) throw new Error("Anthropic rejected the API key.");
      throw err;
    }
  }
  if (provider === "gemini") {
    const res = await fetchWithRetry(`${GEMINI_API}/models?pageSize=1000`, () => ({ headers: { "x-goog-api-key": apiKey } }), "Gemini");
    const body = (await res.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
    return (body.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name.replace(/^models\//, ""))
      .filter((id) => !NON_TEXT_GEMINI.test(id));
  }
  const res = await fetchWithRetry(
    `${OPENAI_COMPATIBLE[provider]}/models`,
    () => ({ headers: { Authorization: `Bearer ${apiKey}` } }),
    provider === "groq" ? "Groq" : "OpenAI"
  );
  const body = (await res.json()) as { data: { id: string }[] };
  return body.data.map((m) => m.id).filter((id) => !NON_TEXT_MODEL.test(id)).sort();
}

function encodeWav(pcm: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + pcm.length * 2);
  const view = new DataView(buffer);
  const writeText = (offset: number, text: string) => [...text].forEach((ch, i) => view.setUint8(offset + i, ch.charCodeAt(0)));
  writeText(0, "RIFF");
  view.setUint32(4, 36 + pcm.length * 2, true);
  writeText(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, pcm.length * 2, true);
  pcm.forEach((s, i) => view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * 32767, true));
  return new Blob([buffer], { type: "audio/wav" });
}

/** Optional cloud transcription. Timestamps are relative to the audio passed in. */
export async function transcribeRemote(stt: SttChoice, pcm16k: Float32Array): Promise<Word[]> {
  if (stt.provider === "local" || !stt.apiKey) throw new Error("A cloud transcription key is required.");
  const { provider, apiKey } = stt;
  const wav = encodeWav(pcm16k, 16000);
  const res = await fetchWithRetry(
    `${OPENAI_COMPATIBLE[provider]}/audio/transcriptions`,
    () => {
      const form = new FormData();
      form.append("file", wav, "window.wav");
      form.append("model", STT_MODEL[provider]);
      form.append("response_format", "verbose_json");
      form.append("timestamp_granularities[]", "word");
      return { method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: form };
    },
    provider === "groq" ? "Groq" : "OpenAI"
  );
  const body = (await res.json()) as { words?: { word: string; start: number; end: number }[] };
  return (body.words ?? []).map((w) => ({ start: w.start, end: w.end, text: w.word.trim() }));
}

async function askClaude(llm: LlmKey, user: string, instructions: string): Promise<string> {
  try {
    const response = await claudeClient(llm.apiKey).beta.messages.create({
      model: llm.model,
      max_tokens: 16000,
      system: instructions,
      messages: [{ role: "user", content: user }],
      output_config: {
        ...(/^claude-(opus|sonnet|haiku|fable)-5/.test(llm.model) ? { effort: "medium" as const } : {}),
        format: { type: "json_schema", schema: VERDICT_SCHEMA },
      },
      ...(REFUSAL_FALLBACK_MODELS.has(llm.model)
        ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
        : {}),
    });
    if (response.stop_reason === "refusal") throw new Error("Claude declined to judge these moments.");
    if (response.stop_reason === "max_tokens") throw new Error("Claude’s answer was cut off before it finished.");
    return response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new Error("Anthropic rejected the API key.");
    if (err instanceof Anthropic.RateLimitError) throw new Error("Anthropic rate-limited this key. Try again shortly.");
    if (err instanceof Anthropic.APIError) throw new Error(`Anthropic returned ${err.status}: ${err.message}`);
    throw err;
  }
}

const withSchema = (instructions: string, schema: object = VERDICT_SCHEMA) => `${instructions}\n\nReply with JSON matching this schema:\n${JSON.stringify(schema)}`;

async function askGemini(llm: LlmKey, user: string, instructions: string): Promise<string> {
  const res = await fetchWithRetry(
    `${GEMINI_API}/models/${encodeURIComponent(llm.model)}:generateContent`,
    () => ({
      method: "POST",
      headers: { "x-goog-api-key": llm.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: withSchema(instructions) }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }),
    "Gemini"
  );
  const body = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[]; promptFeedback?: { blockReason?: string } };
  if (body.promptFeedback?.blockReason) throw new Error("Gemini declined to judge these moments.");
  return (body.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
}

async function askOpenAiCompatible(llm: LlmKey, user: string, instructions: string, schema: object = VERDICT_SCHEMA): Promise<string> {
  const provider = llm.provider as "openai" | "groq";
  const system = withSchema(instructions, schema);
  const res = await fetchWithRetry(
    `${OPENAI_COMPATIBLE[provider]}/chat/completions`,
    () => ({
      method: "POST",
      headers: { Authorization: `Bearer ${llm.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: llm.model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    }),
    provider === "groq" ? "Groq" : "OpenAI"
  );
  const body = (await res.json()) as { choices: { message: { content: string } }[] };
  return body.choices[0]?.message?.content ?? "";
}

export async function judgeCandidates(llm: LlmKey, sourceName: string, candidates: Candidate[], count: number, length: ClipLength): Promise<SelectedMoment[]> {
  const instructions = judgeSystem(length);
  const prompt = buildUserPrompt(sourceName, candidates);
  const ask = llm.provider === "anthropic" ? askClaude : llm.provider === "gemini" ? askGemini : askOpenAiCompatible;
  const text = await ask(llm, prompt, instructions);
  const result = JSON.parse(text) as { verdicts?: Verdict[] };
  return applyVerdicts(candidates, Array.isArray(result?.verdicts) ? result.verdicts : [], count, length);
}

const MAX_SEARCH_CONTINUATIONS = 3;
const SEARCH_LIMIT = 3;
// Newer models filter search results as they read them; the rest use the basic tool.
const DYNAMIC_SEARCH_MODEL = /^claude-(opus-(5|4-[678])|sonnet-(5|4-6))/;

interface Written {
  text: string;
  searched: boolean;
}

async function claudePostText(llm: LlmKey, user: string, search: boolean): Promise<Written> {
  const tools = search
    ? [DYNAMIC_SEARCH_MODEL.test(llm.model) ? ({ type: "web_search_20260209", name: "web_search", max_uses: SEARCH_LIMIT } as const) : ({ type: "web_search_20250305", name: "web_search", max_uses: SEARCH_LIMIT } as const)]
    : undefined;
  const client = claudeClient(llm.apiKey);
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: user }];
  for (let turn = 0; turn <= MAX_SEARCH_CONTINUATIONS; turn++) {
    const response = await client.beta.messages.create({
      model: llm.model,
      max_tokens: 16000,
      system: postSystem(search),
      messages,
      ...(tools ? { tools } : {}),
      ...(/^claude-(opus|sonnet|haiku|fable)-5/.test(llm.model) ? { output_config: { effort: "medium" as const } } : {}),
      ...(REFUSAL_FALLBACK_MODELS.has(llm.model) ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
    });
    if (response.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: response.content as Anthropic.Beta.BetaContentBlockParam[] });
      continue;
    }
    if (response.stop_reason === "refusal") throw new Error("Claude declined to write this.");
    if (response.stop_reason === "max_tokens") throw new Error("Claude’s answer was cut off before it finished.");
    return {
      text: response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join(""),
      searched: response.content.some((b) => b.type === "web_search_tool_result" && Array.isArray(b.content)),
    };
  }
  throw new Error("Claude took too long searching. Try again.");
}

async function geminiPostText(llm: LlmKey, user: string, search: boolean): Promise<Written> {
  const res = await fetchWithRetry(
    `${GEMINI_API}/models/${encodeURIComponent(llm.model)}:generateContent`,
    () => ({
      method: "POST",
      headers: { "x-goog-api-key": llm.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: postSystem(search) }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        ...(search ? { tools: [{ google_search: {} }] } : { generationConfig: { responseMimeType: "application/json" } }),
      }),
    }),
    "Gemini"
  );
  const body = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] }; groundingMetadata?: { webSearchQueries?: string[] } }[] };
  const first = body.candidates?.[0];
  return { text: (first?.content?.parts ?? []).map((p) => p.text ?? "").join(""), searched: Boolean(first?.groundingMetadata?.webSearchQueries?.length) };
}

const isBadKey = (err: unknown) => err instanceof Anthropic.AuthenticationError || (err instanceof Error && /rejected the API key/.test(err.message));

/** Writes upload text for one clip. Searches the web where the provider can; if that fails, writes without it. */
export async function writePostText(llm: LlmKey, input: PostInput): Promise<{ text: PostText; searched: boolean }> {
  const user = buildPostPrompt(input);
  let written: Written;
  try {
    if (llm.provider === "openai" || llm.provider === "groq") {
      written = { text: await askOpenAiCompatible(llm, user, postSystem(false), POST_SCHEMA), searched: false };
    } else {
      const ask = llm.provider === "anthropic" ? claudePostText : geminiPostText;
      written = await ask(llm, user, true).catch((err: unknown) => {
        if (isBadKey(err)) throw err;
        return ask(llm, user, false);
      });
    }
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new Error("Anthropic rejected the API key.");
    if (err instanceof Anthropic.RateLimitError) throw new Error("Anthropic rate-limited this key. Try again shortly.");
    if (err instanceof Anthropic.APIError) throw new Error(`Anthropic returned ${err.status}: ${err.message}`);
    throw err;
  }
  return { text: parsePostText(written.text), searched: written.searched };
}
