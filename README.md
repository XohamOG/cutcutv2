# CLUTCHCUT AI (PS-16)
### Autonomous Gaming Highlight Clipping & Publishing Agent

> **Domain:** Gaming & Esports Content  
> **Architecture:** Clean 3-Tier Monorepo (`frontend`, `backend`, `aai`)  
> **Tech Stack:** Next.js (Turbopack, TypeScript), Node.js (API Server), `@langchain/langgraph` (Agentic AI), Vanilla CSS Design System.

---

## 📁 Project Structure

```
d:\cutcut\
├── aai\                       # 🧠 Agentic AI Module (LangGraph)
│   ├── src\
│   │   ├── agents\            # 10 Specialized Autonomous Agents
│   │   │   ├── ingestionAgent.ts
│   │   │   ├── gameEventAgent.ts
│   │   │   ├── excitementAgent.ts
│   │   │   ├── candidateAgent.ts
│   │   │   ├── rankingAgent.ts
│   │   │   ├── captionAgent.ts
│   │   │   ├── reformattingAgent.ts
│   │   │   ├── safetyAgent.ts
│   │   │   ├── publishingAgent.ts
│   │   │   └── feedbackAgent.ts
│   │   ├── orchestrator.ts    # Compiled LangGraph StateGraph Engine
│   │   ├── presets\           # Multi-game VOD telemetry & creator profiles
│   │   ├── types\             # Pipeline state & telemetry TypeScript models
│   │   └── index.ts           # Public module exports
│   ├── package.json
│   └── tsconfig.json
│
├── backend\                   # ⚡ Node.js API Backend (Port 4000)
│   ├── src\
│   │   └── server.ts          # REST API server connecting routes to AAI
│   ├── package.json
│   └── tsconfig.json
│
├── frontend\                  # 🎨 Next.js Web Application (Port 3000)
│   ├── src\
│   │   ├── app\               # App Router pages & API proxy
│   │   │   ├── page.tsx       # Main dashboard & interactive tabs
│   │   │   ├── layout.tsx     # Typography & metadata
│   │   │   ├── globals.css    # Cyberpunk esports design system
│   │   │   └── api\pipeline\  # Route connecting to Node.js backend
│   │   └── components\        # Interactive UI components
│   │       ├── Navbar.tsx
│   │       ├── PipelineVisualizer.tsx
│   │       ├── StreamIngestion.tsx
│   │       ├── ClipStudio.tsx
│   │       ├── BeforeAfterPlayer.tsx
│   │       ├── LiveStreamMonitor.tsx
│   │       ├── MultiGameAdapter.tsx
│   │       ├── PerformanceDashboard.tsx
│   │       ├── CreatorStyleStudio.tsx
│   │       └── HighlightReelModal.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── package.json               # Root monorepo workspace coordinator
├── .npmrc                     # Drive cache configuration
└── README.md
```

---

## 🤖 10-Agent LangGraph Pipeline (`aai/`)

| Agent | File | Function |
| :--- | :--- | :--- |
| **1. Ingestion Agent** | `aai/src/agents/ingestionAgent.ts` | Chunks VODs into 10-minute analysis windows & syncs game telemetry |
| **2. Game Event Agent** | `aai/src/agents/gameEventAgent.ts` | Detects clutch plays, 3 HP survival, defuse timers, killfeed cascades |
| **3. Excitement Agent** | `aai/src/agents/excitementAgent.ts` | Correlates vocal pitch (480Hz spike) + chat surges (8.4x baseline) |
| **4. Candidate Gen Agent** | `aai/src/agents/candidateAgent.ts` | Trims bounded clips (14s lead-in context + 8s reaction tail) |
| **5. Virality Ranking Agent**| `aai/src/agents/rankingAgent.ts` | Ranks clips by engagement index (0–100) into S-Tier and A-Tier |
| **6. Caption & Hook Agent**| `aai/src/agents/captionAgent.ts` | Generates 1-2s retention hooks & speech-synced yellow subtitles |
| **7. Vertical Reformat Agent**| `aai/src/agents/reformattingAgent.ts` | 16:9 ➔ 9:16 action-center crop with webcam PiP & UI safe zones |
| **8. Rights & Safety Agent**| `aai/src/agents/safetyAgent.ts` | DMCA audio copyright scanner & profanity brand-safety rating |
| **9. Human Review Gate** | `aai/src/orchestrator.ts` | Creator opt-in pause point before publishing |
| **10. Publishing Agent** | `aai/src/agents/publishingAgent.ts` | Auto-posts to Shorts/TikTok & schedules 7:00 PM peak slot for Reels |
| **11. Performance Feedback** | `aai/src/agents/feedbackAgent.ts` | Compares retention curves against predicted scores to update weights |

---

## 🚀 Running the Services

### 1. Run Everything from Root
```bash
# Run both frontend and backend
npm run dev
```

### 2. Run Independently
```bash
# In one terminal: Node.js Backend Server (Port 4000)
npm run dev:backend

# In another terminal: Next.js Frontend (Port 3000)
npm run dev:frontend
```

---

## 🌐 Endpoints

- **Frontend UI:** `http://localhost:3000`
- **Backend Health Check:** `http://localhost:4000/health`
- **Backend Pipeline API:** `POST http://localhost:4000/api/pipeline`
- **Backend Streams Feed:** `GET http://localhost:4000/api/streams`
- **Backend Creators Feed:** `GET http://localhost:4000/api/creators`
