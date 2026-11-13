# viralbits (CLUTCHCUT AI)
### Autonomous Agentic Video Engineering & Enterprise Automation Platform
> **Course:** Agentic AI Engg & Enterprise Automation Lab (26CMPC72)  
> **Class:** B.E. (Computer Engineering) / Sem VII / D17  
> **Branch Notice:** This branch (`lab-experiments`) contains the complete implementation and test suites for all Lab Manual Experiments (Exp-1 to Exp-9). It is isolated from `main` and production deployment.

---

## 🧪 Lab Experiments Implementation Mapping (26CMPC72)

The table below details how the concepts and technical requirements of each experiment from the lab manual are implemented and integrated within the project.

| Experiment | Description (What the Experiment Says) | Implementation in Project (Where & How Implemented) |
| :--- | :--- | :--- |
| **Exp-1** | **Deterministic Tutoring Agent:** Design a deterministic academic response system using rule-based logic and JSON templates, ensuring identical outputs for identical inputs without probabilistic hallucinations, incorporating clarification for ambiguous terms, self-reflection response validation, and adversarial prompt-injection guardrails. | Implemented in `experiments/exp1_deterministic_tutor/` (`tutor_agent.py`, `templates.json`, `logger.py`, `test_tutor.py`). Enforces strict contract templates, SQLite audit tracking, clarification for vague concepts, and active prompt-injection defense. Also powers the deterministic game event and clip reasoning rules in `frontend/src/lib/highlights/moments.ts`. |
| **Exp-2** | **Agent-Driven Financial Advisory System:** Build a financial advisory system that fetches market data, calculates percentage changes, executes rule-based BUY/SELL/HOLD decisions (> +2% BUY, < -2% SELL, [-2%, +2%] HOLD), assesses moving average & volume indicators, outputs risk & confidence metrics, and protects trusted decisions against adversarial prompt injection. | Implemented in `experiments/exp2_financial_advisor/` (`advisor_agent.py`, `rule_engine.py`, `data_fetcher.py`, `test_advisor.py`, `financial_log.csv`). Features deterministic threshold rules, boundary tests, portfolio analysis, and prompt-injection guardrails. The metric thresholding concept directly reflects in viral clip score gating (`signals.ts`, `moments.ts`). |
| **Exp-3** | **Clinical Research Assistant with Tool Integration:** Implement an intelligent healthcare assistant with standardized tool contracts, schemas, authorization policies, execution engine, error classification, controlled exponential retries (max 3), safe fallback tools, and adversarial safety tests. | Implemented in `experiments/exp3_clinical_assistant/` (`clinical_assistant.py`, `tool_contracts.py`, `execution_engine.py`, `test_clinical_assistant.py`, `clinical_research_interaction_log.csv`). Features `medical_calculator`, `medical_literature_search`, `healthcare_knowledge_search`, and safe failure principles. Parallels the tool pipeline in `frontend/src/lib/highlights/providers.ts` and `media.ts`. |
| **Exp-4** | **Legal Document Intelligence & Retrieval System (RAG):** Build a multi-layer RAG pipeline for legal/compliance documents: ingestion, cleaning, chunking with metadata, vector semantic search, relevance thresholding, grounded response generation with document/page citations, grounding validation, and prompt-injection defense. | Implemented in `experiments/exp4_legal_doc_rag/` (`legal_rag.py`, `chunking.py`, `vector_index.py`, `test_legal_rag.py`, `audit_log.json`, `sample_contracts/`). Features TF-IDF vector indexing, traceable clause citations, grounding validation (`PASS`/`REVIEW`/`FAIL`), and out-of-domain rejection. Relates to subtitle transcription indexing in `frontend/src/lib/highlights/captions.ts`. |
| **Exp-5** | **E-Commerce Product Analysis & Recommendation Multi-Agent Pipeline:** Coordinate 8 specialized agents (Planner, Router, Search, Filter, Comparison, Ranking, Validator, Supervisor) using a shared workflow state, sequential & parallel execution (DOP benchmark), human-in-the-loop approval, and cost metrics. | Implemented in `experiments/exp5_ecommerce_orchestrator/` (`orchestrator.py`, `agents.py`, `state.py`, `products.json`, `test_ecommerce.py`). Decomposes natural-language queries into constraints, executes parallel matrix comparison, ranks candidates, and verifies via human gate. Mirrors the multi-agent video analysis workflow in `aai/src/orchestrator.ts` and `frontend/src/lib/highlights/pipeline.worker.ts`. |
| **Exp-6** | **Developer Automation System using MCP Protocol:** Implement Model Context Protocol client-server architecture with stdio transport, dynamic tool discovery (`list_tools`), 5 developer tools (file listing, reading, code search, AST code analysis, automated test execution), path traversal protection, dependency-aware workflow, and JSONL tracing. | Implemented in `experiments/exp6_mcp_developer/` (`mcp_server.py`, `mcp_client.py`, `test_mcp_developer.py`, `mcp_traces.jsonl`, `sample_project/`). Exposes 5 MCP tools with AST analysis, path security (`safe_project_path()`), parallel Phase 1 execution, and latency benchmarks. Connects with the Claude skills and agent tooling defined in `.claude/skills/`. |
| **Exp-7** | **Automated Recruitment Workflow System (HR Domain):** Build an enterprise recruitment automation pipeline: candidate CSV ingestion, validation & duplicate quarantine, weighted scoring ($S = 0.40K + 0.30E + 0.30A$), multi-tier routing (Shortlist, Manual, Not-Shortlisted), human-in-the-loop approval actions, notification drafts, and audit logging. | Implemented in `experiments/exp7_recruitment_workflow/` (`recruitment_workflow.py`, `candidates.csv`, `rules.json`, `notifications.py`, `test_recruitment.py`, `audit_log.csv`, `rejected_records.csv`). Evaluates validation rate, quarantine mechanics, explainable score breakdown, and reviewer override actions. Corresponds to the clip qualification and publisher review gate in `aai/src/agents/publishingAgent.ts`. |
| **Exp-8** | **Intelligent Customer Support System with Escalation (SaaS Domain):** Implement 3D query classification (Intent, Complexity, Priority P1-P4), approved knowledge base retrieval, SLA deadline tracking, ticket lifecycle state machine (Open -> Triaged -> Assigned -> Resolved -> Closed), notification retries with exponential backoff, and audit logging. | Implemented in `experiments/exp8_customer_support/` (`customer_support.py`, `classifier.py`, `resolver.py`, `ticket_manager.py`, `notifications.py`, `test_support.py`, `customer_queries.csv`, `knowledge_base.json`, `config.json`, `audit_log.csv`). Features P1 outage overrides, ticket reopening, and SLA breach monitors. Connects with the issue tracking and feedback mechanism in `frontend/src/lib/site.ts`. |
| **Exp-9** | **Micro Project – End-to-End Autonomous Agentic System Design:** Comprehensive production-grade agentic pipeline featuring multi-agent coordination, planner-reviewer workflows, tool integration (FFmpeg, AudioSet, Whisper, LLMs), observability, and full-stack interactive UI. | Implemented as the core project **CLUTCHCUT AI / viralbits** (`cutcutv2/`). Features 10 specialized agent roles (`aai/src/agents/`), multi-signal moment fusion (`frontend/src/lib/highlights/moments.ts`), on-device AudioSet/Whisper inference, hardware-accelerated 9:16 rendering, interactive framing studio, and automated social publishing. |

---

### 🔬 Running All Experiment Tests
A master test orchestrator is provided to verify all 8 lab experiment suites at once:
```bash
cd experiments
python run_all_experiments.py
```
To run an individual experiment test:
```bash
# Example for Experiment 1:
cd experiments/exp1_deterministic_tutor && python test_tutor.py

# Example for Experiment 6 (MCP):
cd experiments/exp6_mcp_developer && python test_mcp_developer.py
```

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
