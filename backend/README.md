# viralbits agents (LangGraph backend)

The browser still does the heavy, private work: it reads the video, measures the sound, finds the moments,
transcribes them and renders the clips. This backend is where the judging happens: a team of LLM agents
built with LangGraph decides which moments become clips and writes their titles.

Only text is sent here: each moment's signal numbers, its transcript and its chat lines. Never audio or video.
If the backend isn't running, the app uses its in-browser judges exactly as before.

```
START ─┬─ many moments → Planner ∥ Screener × N   (all at the same time) ─┐
       └─ few moments  → Planner (rules only, no screening) ─────────────┴→ Supervisor → Judge ─┬→ Reviewer → END
                                                                                                └→ END (failed: the browser falls back)
```

The Planner and the Screeners don't need each other's output, so they run in the same step and the Supervisor
joins them. The browser's on-device models stay sequential on purpose: they share one machine, so running them
together adds no compute but holds every model in memory at once.

| Agent | Model | Job |
| :--- | :--- | :--- |
| Planner | small (Groq gpt-oss-20b, low reasoning), or rules | How many finalists the Judge sees, decided while the Screeners work; skips screening when every moment fits |
| Screener | small, one call per 10 moments, in parallel | Rates every moment 0-10 from its signals and ~25 words around the peak |
| Supervisor | rules | Fuses the screener's rating with the signal score and picks the finalists |
| Judge | strong (Gemini Flash → Gemini Flash-Lite → Groq gpt-oss-120b) | Keeps or rejects each finalist, sets the cut, writes title and hook |
| Reviewer | rules, then small | Sends clips the Judge kept but the Screener disliked to the person; fixes titles over 70 characters and hooks over 8 words |

## Spending fewer tokens

- Rules before models: the Planner skips its model and the Screener entirely when few moments are found.
- Small model for wide work, strong model only for the finalists.
- One batched call per agent, never one per moment; screening batches run in parallel.
- Compact input: rounded numbers, ~25 words per moment for screening, full transcripts only for finalists.
- Fixed system prompts, so providers can cache them; JSON-only answers with tight token caps.
- Low reasoning effort on every model (Gemini thinking level "low", Groq reasoning effort "low"), with hidden reasoning never returned.
- Answers cached in `.cache/llm.sqlite`: a repeated run costs zero tokens.
- A token budget per run (`MAX_RUN_TOKENS`): past it, screening and title polishing are skipped.

## Run

```powershell
cd backend
py -3.12 -m venv .venv
.venv\Scripts\pip install -r requirements.txt
copy .env.example .env    # then paste your keys into .env
.venv\Scripts\uvicorn app.main:app --port 8000
```

Then run the app as usual (`npm run dev` in `frontend`). On the work screen the Judge's tool reads
`langgraph agents`, and the Screener, Supervisor and Reviewer appear under it.

Check it is up: <http://localhost:8000/health>. Tests (no keys needed): `.venv\Scripts\python -m pytest -q`.
