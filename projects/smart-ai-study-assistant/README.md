# Smart AI Study Assistant

A study helper with a chat-style interface: **ask questions, explain concepts, make notes, generate quizzes and summarize text.**
Frontend: HTML, CSS, JavaScript. Backend: Python + FastAPI.

## Honest status
- **Demo mode** (no API key): works without AI. Summaries/notes/quizzes use simple rules (it picks important sentences and keywords). Questions and explanations are **not** answered. Every reply is tagged `DEMO · rule-based, not AI`.
- **Live mode** (API key set on the server): the backend calls the Anthropic API and replies are tagged `AI · <model>`.
- The live AI call has **not been tested yet** by the author of this repo, because it needs your own key. Test it once and report any errors.
- The Python backend runs **locally only**. The GitHub Pages page is just the frontend, and shows "Backend offline" unless you run the server on your computer.

## Run locally
```bash
cd projects/smart-ai-study-assistant/backend
python -m venv .venv
.venv\Scripts\activate          # Windows   (Mac/Linux: source .venv/bin/activate)
pip install -r requirements.txt
uvicorn main:app --reload
```
Open http://127.0.0.1:8000. You should see **Demo mode · no AI**.

### Enable real AI (optional)
1. Copy `.env.example` to `.env` (inside `backend/`).
2. Put your key in `ANTHROPIC_API_KEY=...` (get one from the Anthropic Console). `AI_MODEL` can be changed too.
3. Restart `uvicorn`. The badge changes to **AI live**.

`.env` is in `.gitignore`. **Never commit your key.** The key is only read by the server, and the browser never sees it.

## API
| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | `{status, mode: "demo" or "live", model}` |
| POST | `/api/assist` | body `{task, text, history}`; task is one of `ask, explain, notes, quiz, summarize` |

## Structure
```
smart-ai-study-assistant/
  index.html  style.css  script.js     frontend
  backend/main.py                      FastAPI app (CORS, validation, AI call)
  backend/demo.py                      rule-based demo logic
  backend/requirements.txt  .env.example
```

## Interview talking points
- Why the key stays on the server (a browser can be inspected by anyone).
- Input validation with Pydantic (task whitelist, length limits).
- Only three frontend files are served, so `backend/.env` can never be downloaded.
- Honest UI: demo output and AI output are labelled differently.
