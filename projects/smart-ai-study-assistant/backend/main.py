"""Smart AI Study Assistant - FastAPI backend.

The API key is read from the environment on the SERVER only and is never sent to the browser.
No key -> demo mode (rule-based, not AI). Key present -> real AI responses.
"""
import os
from pathlib import Path
from typing import List, Literal

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

import demo

try:  # optional: load backend/.env if python-dotenv is installed
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).with_name(".env"))
except ImportError:
    pass

FRONTEND = Path(__file__).resolve().parent.parent
API_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()
MODEL = os.getenv("AI_MODEL", "claude-haiku-5-5")
ORIGINS = [o.strip() for o in os.getenv(
    "ALLOWED_ORIGINS", "https://anuragpr-0810.github.io,http://127.0.0.1:8000,http://localhost:8000").split(",") if o.strip()]

SYSTEM = {
    "ask": "You are a helpful study assistant for university students. Answer clearly and accurately. If you are unsure, say so.",
    "explain": "Explain the concept simply and step by step for a beginner. Include one short example.",
    "notes": "Turn the text into concise study notes: a short title, key points as bullet points, and key terms.",
    "quiz": "Create a 5-question quiz (mix of multiple choice and short answer) from the text. Put an answer key at the end.",
    "summarize": "Summarize the text in 3 to 5 sentences. Keep the important facts.",
}

app = FastAPI(title="Smart AI Study Assistant")
app.add_middleware(CORSMiddleware, allow_origins=ORIGINS, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])


class Msg(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=4000)


class Req(BaseModel):
    task: Literal["ask", "explain", "notes", "quiz", "summarize"]
    text: str = Field(min_length=1, max_length=6000)
    history: List[Msg] = Field(default_factory=list, max_length=10)


def call_ai(req: Req) -> str:
    msgs = [m.model_dump() for m in req.history] if req.task in ("ask", "explain") else []
    while msgs and msgs[0]["role"] != "user":  # the API needs the first message to be from the user
        msgs.pop(0)
    msgs.append({"role": "user", "content": req.text})
    try:
        r = httpx.post(
            "https://api.anthropic.com/v1/messages",
            headers={"x-api-key": API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json"},
            json={"model": MODEL, "max_tokens": 1000, "system": SYSTEM[req.task], "messages": msgs},
            timeout=40,
        )
    except httpx.HTTPError:
        raise HTTPException(502, "Could not reach the AI provider.")
    if r.status_code != 200:
        raise HTTPException(502, f"AI provider returned an error (HTTP {r.status_code}). Check your key and model name.")
    parts = [b.get("text", "") for b in r.json().get("content", []) if b.get("type") == "text"]
    return "\n".join(parts).strip() or "(empty response)"


@app.get("/health")
def health():
    return {"status": "ok", "mode": "live" if API_KEY else "demo", "model": MODEL if API_KEY else None}


@app.post("/api/assist")
def assist(req: Req):
    if API_KEY:
        return {"source": "ai", "model": MODEL, "output": call_ai(req)}
    return {"source": "demo", "model": None, "output": demo.respond(req.task, req.text)}


# Serve only the three frontend files (never the whole folder, so backend/.env stays private).
@app.get("/")
def index():
    return FileResponse(FRONTEND / "index.html")


@app.get("/style.css")
def css():
    return FileResponse(FRONTEND / "style.css")


@app.get("/script.js")
def js():
    return FileResponse(FRONTEND / "script.js")
