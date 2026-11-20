"""Rule-based DEMO responses. This is NOT AI: it only picks sentences and keywords from your text."""
import re
from collections import Counter

STOP = set("the a an and or of to in on for with is are was were be been it this that as at by from which can will have has had not but if then than so such into their its also more most other these those about over under between during each".split())


def sentences(text):
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+|\n+", text.strip()) if len(s.strip()) > 12]


def words(text):
    return [w for w in re.findall(r"[A-Za-z][A-Za-z'-]+", text.lower()) if w not in STOP and len(w) > 3]


def key_terms(text, n=6):
    return [w for w, _ in Counter(words(text)).most_common(n)]


def top_sentences(text, n):
    ss = sentences(text)
    freq = Counter(words(text))
    scored = [(sum(freq[w] for w in words(s)) / (len(words(s)) or 1), i, s) for i, s in enumerate(ss)]
    best = sorted(scored, reverse=True)[:n]
    return [s for _, _, s in sorted(best, key=lambda x: x[1])]


def summarize(text):
    if len(sentences(text)) < 2:
        return "Please paste a longer text (at least 2 sentences) to summarize."
    return " ".join(top_sentences(text, 3))


def notes(text):
    if not sentences(text):
        return "Please paste a longer text to make notes."
    out = ["Key terms: " + ", ".join(key_terms(text)), ""]
    out += ["• " + s for s in top_sentences(text, 5)]
    return "\n".join(out)


def quiz(text):
    picked = top_sentences(text, 4)
    if not picked:
        return "Please paste a longer text to make a quiz."
    qs, answers = [], []
    for s in picked:
        cands = [w for w in re.findall(r"[A-Za-z]{6,}", s) if w.lower() not in STOP]
        if not cands:
            continue
        ans = max(cands, key=len)
        qs.append(f"Q{len(qs) + 1}. Fill in the blank: " + s.replace(ans, "_____", 1))
        answers.append(f"{len(qs)}) {ans}")
    return "\n\n".join(qs) + "\n\nAnswers: " + "  ".join(answers) if qs else "Text too short for a quiz."


def chat(text):
    terms = ", ".join(key_terms(text, 4)) or "none"
    return ("Demo mode has no AI, so it can't answer questions or explain concepts. "
            "Set ANTHROPIC_API_KEY on the server to get real AI answers. "
            f"Key words I noticed in your message: {terms}.")


def respond(task, text):
    return {"summarize": summarize, "notes": notes, "quiz": quiz}.get(task, chat)(text)
