# viralbits (CLUTCHCUT AI)
### An agentic system that turns gaming streams into vertical clips
> **Course:** Agentic AI Engg & Enterprise Automation Lab (26CMPC72)  
> **Class:** B.E. (Computer Engineering) / Sem VII / D17  
> **Branch notice:** This is the `lab-experiments` branch. The live site at viralbits.xyz is built from `main`, which this branch never changes.

---

## The app as an agentic system (Micro Project, Exp-9)

A run is a team of agents with one shared trace. The **Planner** decides which agents and tools a run needs, **worker agents** each add evidence to the same candidate moments, the **Judge** reviews the finalists, the **Router** decides which clips are kept automatically and which go to the person, and the **Editor** renders them. Everything runs in the browser.

```
Planner ──► Listener ──► (Chat reader) ──► Reaction detector ──► Transcriber ──► (Watcher) ──► Ranker ──► Judge ──► Router ──► Editor
   │            every step is recorded in one Trace, streamed to the screen and saved with the run            │
   └──────────── replans mid-run (one or two transcription passes) ──────────────── person reviews ◄──────────┘
```

| Agent | Job | Tools, in fallback order |
| :--- | :--- | :--- |
| Planner | Builds the run plan from the settings, checks the AI key works, replans the transcription passes | rules |
| Listener | Measures voice, loudness and pitch every second; shortlists moments | audio analysis (on device) |
| Chat reader | Scores chat surges from a replay file | chat replay parser |
| Reaction detector | Hears laughter and shouting at each peak | AudioSet model (on device) |
| Transcriber | Writes down the words around each moment | Groq / OpenAI Whisper → local Whisper |
| Watcher | Looks at faces, motion and screen text | face and motion model, OCR |
| Ranker | Weighted fusion of every signal plus the person's past ratings | weighted signal fusion |
| Judge | Reviews finalists, sets cuts, writes titles | the person's AI model → signal ranker |
| Router | Confidence (high / medium / low) and routing: keep, send to the person, or drop | confidence rules |
| Editor | Cuts, frames and captions each clip | WebCodecs renderer |

**LLM agent team:** when the [LangGraph backend](backend/README.md) is running, the Judge hands the finalists to a graph of model agents (Planner and Screeners in parallel → Supervisor → Judge → Reviewer) and streams every step, model and token count back into the run trace. When it is not running, the in-browser judges are used exactly as before.

Code: [`frontend/src/lib/highlights/agents.ts`](frontend/src/lib/highlights/agents.ts) (trace, tool chain, planner, router), wired into [`pipeline.worker.ts`](frontend/src/lib/highlights/pipeline.worker.ts). Tests: [`agents.test.ts`](frontend/src/lib/highlights/agents.test.ts).

## Lab concepts used in the app

| Lab | Concept | Where it lives in the app |
| :--- | :--- | :--- |
| Exp-1 | Deterministic behaviour, structured output contracts | Free mode gives the same clips for the same video; the Planner and Router are pure rules (same input, same plan and decision); the AI judge answers against a JSON schema (`VERDICT_SCHEMA` in `selection.ts`) |
| Exp-2 | Rule-based thresholds, risk and confidence | A moment only counts if it beats the 2 minutes before it (`analyze.ts`); the Router's confidence levels and its 30/100 drop floor (`agents.ts`) |
| Exp-3 | Tool contracts, error classification, retries (max 3), fallbacks | `ToolChain` in `agents.ts`: errors are classed (auth, rate-limit, network, unavailable, bad-output); dropped connections are retried up to 3 times with exponential backoff; busy servers are retried by the HTTP layer (`fetchWithRetry` in `providers.ts`); a bad key or quota switches that tool off for the rest of the run (circuit breaker) and the next tool takes over |
| Exp-5 | Planner, router, shared state, human in the loop | `planRun` decides the agents; every agent writes into the same candidate list; clips the Router is unsure of are marked "your call" and the person's thumbs up / down feeds the Ranker's learned taste next run |
| Exp-7 | Weighted scoring, multi-tier routing, audit log | Signal fusion in `moments.ts`; keep / review / drop tiers in `routeMoments`; every decision is in the run trace |
| Exp-8 | Escalation when automation is unsure | When the AI judge and the signals disagree by more than 35 points, the clip is escalated to the person instead of being trusted |
| Exp-9 | Observability | The live agent board on the work screen; "how this run worked" on the clips screen (steps, tool calls, retries, fallbacks, time per agent); run reports saved on the device |

The standalone Python versions of Exp-1 to Exp-8 from the lab manual are kept in [`experiments/`](experiments/) (`python experiments/run_all_experiments.py`).

---

# viralbits (Original Project Overview)

Turn a gaming stream recording into vertical (9:16) clips of its best moments. Everything runs in the creator's browser: the video never leaves their device, and there is no server to pay for.

## How clips are chosen

Built for small channels, where chat is often empty. The streamer's own voice leads, and chat is extra evidence when it exists.

| Step | What happens | Cost |
| :--- | :--- | :--- |
| 1. Measure | Decodes the audio once and records per-second loudness, speech presence and pitch. Speech is separated from gunfire and explosions by periodicity | Free |
| 2. Chat (optional) | Scores surges by how improbable they are at that stream's own rate, boosted when viewers repeat similar lines. Measures chat delay per video | Free |
| 3. Gate | A moment only counts if it beats the average of the 2 minutes before it | Free |
| 4. Shortlist | Fuses voice excitement, chat and loudness, then picks spaced peaks | Free |
| 5. Reactions | An AudioSet model listens for laughter and shouting around each peak | Free, local |
| 6. Transcribe | Whisper (English) runs locally on about 70 seconds around each candidate, with word timing. Groq or OpenAI are optional and handle other languages | Free by default |
| 7. Judge (optional) | One LLM call with the user's key rejects non-moments, sets cuts and writes titles and hooks | User's key |
| 8. Render | Composes 1080x1920 in the chosen template, with word-by-word captions, using hardware encoding | Free |

The code is in [frontend/src/lib/highlights/](frontend/src/lib/highlights/). Heavy work runs in a Web Worker so the page stays responsive.

## Framing

Each template has a facecam box and a game box. By default they keep the shape of their slot. With "lock box shape" off, a box can be any shape: its picture is never distorted, and the leftover space shows a blur, black, or the facecam. The facecam border can be none, clean, neon or corners. For streams with no camera, "show facecam" off removes the face box and lets the game use its space.

## Clip length and ranking

Length defaults to auto: each clip runs from where the setup begins to the first natural pause after the reaction, up to 75 seconds. Strict lengths of 15, 30, 60 or 75 seconds or 2 minutes are exact. Every clip states why it holds its rank.

## After the render

Each clip can be trimmed and its captions and on-screen title edited; this re-renders that one clip from the original video without new analysis. With an AI key, "post text" writes a YouTube and TikTok title, description and tags on request. Gemini and Claude search the web first; Groq and OpenAI write without live data, and the sheet says which happened. Likes and dislikes stay in the browser and download as `viralbits-ratings.json`.

## Signals

Stage one measures the whole audio track and any chat: voice loudness and pitch against the streamer's own baseline, overall noise, quiet-then-loud jumps, chat surges and repetition, paid messages and emotes. Each candidate is then checked for laughter, shouting, game sounds and several voices (on-device audio model), hype phrases and speech pace (transcript), and, unless turned off, motion, scene cuts, facecam expression and on-screen text (on-device models, frames near the moment only). Weights in `lib/highlights/moments.ts` are starting values. After 8 ratings with at least 2 likes and 2 dislikes, signals stronger in liked clips gain weight on that device.

Chat replays can be YouTube `.live_chat.json` files or TwitchDownloader JSON. `/chat` has the steps.

## Getting the video

A website can't download from YouTube: browsers block it, and YouTube's Terms bar downloading and automated access. So the creator supplies the file:

1. Their OBS or local recording (best quality).
2. YouTube Studio: the app's "Open in YouTube Studio" button goes to the creator's own video page, where the three-dot menu has Download.
3. Google Takeout, for bulk or original-quality exports.

A chat replay file is optional, one JSON object per line (the format YouTube's replay data uses).

## API keys

Paste a key in settings and the app detects the provider from its prefix, checks it, and picks a model. `/keys` has a step-by-step guide per provider, including how to revoke a key.

None are required. Optional keys (Anthropic, OpenAI or Groq) stay in the browser's `sessionStorage`, or `localStorage` if the user ticks "Remember", and go directly from the browser to that provider.

## Saved progress

Each expensive step (audio analysis, laughter, each transcript, model judging) is saved in IndexedDB as it finishes, and finished clips are written to the browser's private file storage. After a closed tab or a crash, selecting the same file reuses all of that. Changing only the layout re-renders without repeating the analysis. API keys are never saved with progress.

## Feedback and problem reports

Anyone can send feedback or report a problem with no account; the name is optional and defaults to "Anonymous". Messages arrive by email through [Web3Forms](https://web3forms.com). The access key is in `frontend/src/lib/site.ts`; set `NEXT_PUBLIC_WEB3FORMS_KEY` at build time to override it. The key is public by design and can only deliver messages to the inbox it was created for.

Problem reports add error details and browser info. Nothing ever includes the video, its name, or API keys.

## Requirements and setup

Users need a current Chrome or Edge (WebCodecs; WebGPU is used when available). The first run downloads about 300 MB of models, which the browser caches.

```bash
npm install
npm run dev:frontend   # http://localhost:3000
```

Tests: `npm --workspace=@cutcut/frontend test`

## Limits

- Signal weights and thresholds are starting values and have not been tuned on real streams.
- Streams with no commentary fall back to game loudness and produce weaker picks.
- Free transcription is English only and modest on noisy audio. A Groq or OpenAI key gives a larger model and other languages. Claude keys are used for judging, not transcription.
