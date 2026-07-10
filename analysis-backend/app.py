"""
app.py  —  Prompt Lab Backend  (Final)
───────────────────────────────────────
Start:
  set GROQ_API_KEY=gsk_...
  python app.py

Routes:
  GET  /api/health
  GET  /api/test
  POST /api/generate
  POST /api/analyse
  GET  /api/history
  POST /api/history/save
  GET  /api/history/saved
  DELETE /api/history/saved/<item_id>
"""

import os, re, sys, json, time, logging, hashlib
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from threading import Lock

import requests
from requests.adapters import HTTPAdapter
# pyrefly: ignore [missing-import]
from urllib3.util.retry import Retry
# pyrefly: ignore [missing-import]
from flask import Flask, request, jsonify
from flask_cors import CORS

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.StreamHandler(open(sys.stdout.fileno(), mode="w", encoding="utf-8", closefd=False)),
        logging.FileHandler("app.log", encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

# ── Config ────────────────────────────────────────────────────────────────────
# Auto-load .env file so GROQ_API_KEY doesn't need to be set manually each time
_env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(_env_path):
    with open(_env_path) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _v = _line.split("=", 1)
                os.environ.setdefault(_k.strip(), _v.strip())

API_KEY = os.environ.get("GROQ_API_KEY", "")
URL     = "https://api.groq.com/openai/v1/chat/completions"
MODELS  = [
    "llama-3.3-70b-versatile",   # primary (fast, smart)
    "llama-3.1-8b-instant",      # fallback (even faster)
    "gemma2-9b-it",              # fallback 2
]

if not API_KEY:
    log.warning("GROQ_API_KEY not set — run: set GROQ_API_KEY=gsk_...")

# ── Persistent HTTP session ───────────────────────────────────────────────────
_session = requests.Session()
_session.mount("https://", HTTPAdapter(
    pool_connections=10, pool_maxsize=20,
    max_retries=Retry(total=0),   # we handle retries ourselves
))

# ── Response cache (128 entries, thread-safe) ─────────────────────────────────
_cache: dict = {}
_cache_lock  = Lock()

def _cache_get(prompt: str):
    return _cache.get(hashlib.md5(prompt.strip().lower().encode()).hexdigest())

def _cache_set(prompt: str, value: str):
    key = hashlib.md5(prompt.strip().lower().encode()).hexdigest()
    with _cache_lock:
        if len(_cache) >= 128:
            del _cache[next(iter(_cache))]
        _cache[key] = value

# ── Thread pool ───────────────────────────────────────────────────────────────
_pool = ThreadPoolExecutor(max_workers=4)

# ── NLP models ────────────────────────────────────────────────────────────────
_qa, _ic = None, None

def _load_models():
    global _qa, _ic
    for path, attr in [
        ("models.quality_analyser.QualityAnalyser",   "_qa"),
        ("models.intent_classifier.IntentClassifier", "_ic"),
    ]:
        try:
            mod, cls = path.rsplit(".", 1)
            obj = getattr(__import__(mod, fromlist=[cls]), cls)()
            if obj.is_saved():
                obj.load()
                globals()[attr] = obj
                log.info(f"{cls} loaded.")
            else:
                log.warning(f"{cls} not trained — run: python train.py")
        except Exception as e:
            log.warning(f"{path} unavailable: {e}")

_load_models()

_history: list = []
_saved:   list = []


# =============================================================================
#  Groq — with automatic model fallback on 429
# =============================================================================

def _call(messages: list, max_tokens: int = 800) -> str:
    """
    Try each model in MODELS waterfall.
    On 429 rate-limit: wait the retry_after seconds (max 8s) then try next model.
    On any other error: raise immediately.
    """
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type":  "application/json",
    }

    last_error = None
    for model in MODELS:
        try:
            r = _session.post(URL, timeout=45, headers=headers, json={
                "model":       model,
                "messages":    messages,
                "max_tokens":  max_tokens,
                "temperature": 0.3,
            })

            # Rate limited — wait briefly then try next model
            if r.status_code == 429:
                wait = min(
                    r.json().get("error", {}).get("metadata", {}).get("retry_after_seconds", 5),
                    8,
                )
                log.warning(f"{model} rate-limited (429) — waiting {wait}s, trying next model...")
                time.sleep(wait)
                last_error = f"{model} rate-limited"
                continue

            if not r.ok:
                log.error(f"{model} error {r.status_code}: {r.text[:300]}")
                last_error = f"{model} HTTP {r.status_code}"
                continue

            data = r.json()
            content = data["choices"][0]["message"]["content"]
            if content is None:
                last_error = f"{model} returned null content"
                continue

            log.info(f"Response from: {model}")
            return content.strip()

        except Exception as e:
            log.warning(f"{model} exception: {e}")
            last_error = str(e)
            continue

    raise RuntimeError(f"All models failed. Last error: {last_error}")


# =============================================================================
#  Prompt builders
# =============================================================================

def _ai_response(prompt: str) -> str:
    return _call([
        {"role": "system", "content": (
            "You are a direct AI assistant. "
            "Output ONLY the answer — no thinking, no planning, no meta-commentary, no restating. "
            "Be accurate and concise. "
            "Last line must be: 'Prompt tip: [one specific improvement under 15 words]'"
        )},
        {"role": "user", "content": prompt},
    ], max_tokens=800)


def _ai_tips(prompt: str, signals: dict) -> list:
    missing = [k.replace("has_", "") for k, v in signals.items() if not v]
    try:
        raw = _call([
            {"role": "system", "content": (
                "You are a prompt-engineering coach. "
                "Return ONLY a valid JSON array with 2 objects, no other text:\n"
                '[{"title":"short title","description":"specific actionable tip"},'
                '{"title":"short title","description":"specific actionable tip"}]'
            )},
            {"role": "user", "content": (
                f'Prompt: "{prompt}"\n'
                f'Missing elements: {", ".join(missing) or "none"}.\n'
                "Return JSON array only."
            )},
        ], max_tokens=220)
        raw = re.sub(r"^```[a-z]*\n?|```$", "", raw.strip())
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return [{"title": t.get("title", "Tip"), "description": t.get("description", "")}
                    for t in parsed[:2] if isinstance(t, dict)]
    except Exception as e:
        log.warning(f"Tips failed (non-fatal): {e}")
    return []


def _rewrite_prompt(prompt: str, signals: dict) -> str:
    """
    Use Groq to produce a professionally rewritten version of the prompt,
    incorporating the missing structural elements detected by `_quality()`.
    """
    missing = [k.replace("has_", "").replace("_", " ") for k, v in signals.items() if not v]
    try:
        raw = _call([
            {"role": "system", "content": (
                "You are a world-class prompt engineer specialising in writing precise, effective AI prompts. "
                "Rewrite the user's prompt to be significantly more professional and effective by naturally "
                "incorporating: a clear role assignment, specific output format, concrete constraints, "
                "target audience, relevant context, and specific details where appropriate. "
                "Return ONLY the rewritten prompt \u2014 no explanation, no preamble, no surrounding quotes. "
                "Keep it direct and natural. Target length: 40\u2013140 words."
            )},
            {"role": "user", "content": (
                f'Original prompt: "{prompt}"\n'
                f'Elements to strengthen: {", ".join(missing) if missing else "make it even more precise and impactful"}.\n'
                "Rewrite this into a significantly more professional and effective prompt."
            )},
        ], max_tokens=400)
        return raw.strip().strip('"\'')
    except Exception as e:
        log.warning(f"Rewrite prompt failed (non-fatal): {e}")
        return ""


# =============================================================================
#  NLP helpers
# =============================================================================

def _quality(prompt: str) -> dict:
    if _qa:
        return _qa.analyse(prompt)
    t, words = prompt.lower(), prompt.split()
    wc = len(words)
    sentences    = [s.strip() for s in re.split(r"[.!?]+", prompt.strip()) if s.strip()]
    avg_sent_len = wc / max(len(sentences), 1)
    unique_ratio = len(set(w.lower() for w in words)) / max(wc, 1)

    signals = {
        # Core structure
        "has_role":               bool(re.search(r"you are|act as|as a |as an|pretend|your role|imagine you", t)),
        "has_format":             bool(re.search(r"json|list|table|bullet|format|numbered|markdown|outline|paragraph|step[- ]by[- ]step", t)),
        "has_constraints":        bool(re.search(r"limit|only|must|avoid|max|do not|don.t|under \d+|no more than|restrict|exclude", t)),
        "has_cot":                bool(re.search(r"step by step|think through|reasoning|phase|first.*then|let.s think|break it down", t)),
        # Audience & context
        "has_audience":           bool(re.search(r"for a |for an |audience|explain to|aimed at|beginner|expert|professional|non.technical", t)),
        "has_context":            bool(re.search(r"context:|background:|given that|note that|assume|the situation is|here is|provided that", t)),
        # Richness
        "has_examples":           bool(re.search(r"example|e\.g\.|for instance|such as|like this|sample|illustration", t)),
        "has_specificity":        bool(re.search(r"\b\d+\b|\bspecific(ally)?\b|exactly|precise|detail|thorough|comprehensive|in.depth", t)),
        "has_output_type":        bool(re.search(r"\b(write|generate|create|produce|draft|compose|list|explain|describe|summarize|compare|analyze|give me)\b", t)),
        "has_tone":               bool(re.search(r"formal|informal|professional|casual|friendly|technical|simple|concise|persuasive|neutral|humorous", t)),
        "has_negative_constraint": bool(re.search(r"do not|don.t|avoid|never|without|exclude|no \w|not \w", t)),
    }

    # Weighted signal scoring (max 94 pts)
    signal_score = (
        signals["has_role"]               * 12 +
        signals["has_format"]             * 10 +
        signals["has_constraints"]        *  8 +
        signals["has_cot"]                * 10 +
        signals["has_audience"]           *  8 +
        signals["has_context"]            * 10 +
        signals["has_examples"]           *  9 +
        signals["has_specificity"]        *  8 +
        signals["has_output_type"]        *  7 +
        signals["has_tone"]               *  7 +
        signals["has_negative_constraint"] * 5
    )

    # Length component: diminishing returns, max 20 pts
    length_score = min(20, round(wc * 1.1))

    # Readability bonus
    readability = 0
    if 6 <= avg_sent_len <= 22:
        readability += 5
    if unique_ratio >= 0.55:
        readability += 5

    score = min(100, max(5, signal_score + length_score + readability))

    return {
        "quality_score": score,
        "clarity_label": "Strong" if score >= 75 else "Good" if score >= 52 else "Fair" if score >= 32 else "Weak",
        "signals": signals,
        "tips": [{"title": "Train models", "description": "Run python train.py for full NLP analysis."}],
        "stats": {
            "word_count":          wc,
            "char_count":          len(prompt),
            "unique_words":        len(set(w.lower() for w in words)),
            "lexical_diversity":   round(unique_ratio, 2),
            "sentence_count":      len(sentences),
            "avg_sentence_length": round(avg_sent_len, 1),
        },
    }


def _intent(prompt: str) -> dict:
    if _ic:
        return _ic.predict(prompt)
    q = prompt.lower()
    for label, kws in [
        ("code",      ["code","program","function","script","implement","algorithm"]),
        ("explain",   ["explain","what is","how does","describe","define","teach"]),
        ("summarise", ["summarise","summarize","summary","tldr","brief","overview"]),
        ("compare",   ["compare","versus","vs","difference","pros and cons"]),
        ("creative",  ["story","poem","creative","fiction","compose","write a"]),
        ("analyse",   ["analyse","analyze","evaluate","assess","swot","review"]),
        ("list",      ["list","enumerate","top","best","give me","name"]),
        ("plan",      ["plan","roadmap","steps","how to","guide","strategy"]),
        ("write",     ["email","letter","memo","report","draft","essay","blog"]),
        ("refine",    ["improve","refine","edit","rewrite","fix my","proofread"]),
        ("translate", ["translate","in french","in spanish","in german","language"]),
    ]:
        if any(k in q for k in kws):
            return {"primary_intent": label, "confidence": 0.75, "top3": [], "techniques": []}
    return {"primary_intent": "general", "confidence": 0.6, "top3": [], "techniques": []}


# =============================================================================
#  Routes
# =============================================================================

@app.route("/api/health")
def health():
    return jsonify({
        "status": "ok", "all_ready": True,
        "primary_model": MODELS[0], "fallback_models": MODELS[1:],
        "nlp_qa": _qa is not None, "nlp_ic": _ic is not None,
        "api_key_set": bool(API_KEY),
        "cache_entries": len(_cache),
    })


@app.route("/api/test")
def test():
    try:
        reply = _call([{"role": "user", "content": "Say OK and nothing else."}], max_tokens=10)
        return jsonify({"ok": True, "reply": reply})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 502


@app.route("/api/generate", methods=["POST"])
def generate():
    body   = request.get_json(force=True)
    prompt = body.get("prompt", "").strip()
    if not prompt:
        return jsonify({"error": "prompt is required"}), 400

    q = _quality(prompt)
    i = _intent(prompt)

    # Cache hit \u2014 instant response (skip rewrite for cached hits)
    cached = _cache_get(prompt)
    if cached:
        log.info("Cache hit")
        _history.append({"id": datetime.utcnow().isoformat(), "prompt": prompt,
                          "response": cached, "quality": q, "intent": i,
                          "ts": datetime.utcnow().isoformat()})
        return jsonify({"generation": {"response": cached}, "quality": q, "intent": i, "rewritten_prompt": ""})

    # Fire response + tips + rewrite in parallel
    f_resp    = _pool.submit(_ai_response, prompt)
    f_tips    = _pool.submit(_ai_tips, prompt, q.get("signals", {}))
    f_rewrite = _pool.submit(_rewrite_prompt, prompt, q.get("signals", {}))

    try:
        response = f_resp.result(timeout=60)
        _cache_set(prompt, response)
    except Exception as e:
        log.error(f"Response failed: {e}")
        f_tips.cancel()
        f_rewrite.cancel()
        return jsonify({"error": str(e), "hint": "Check /api/test", "quality": q, "intent": i}), 502

    try:
        tips = f_tips.result(timeout=20)
    except Exception as e:
        log.warning(f"Tips timed out: {e}")
        tips = []

    try:
        rewritten = f_rewrite.result(timeout=25)
    except Exception as e:
        log.warning(f"Rewrite timed out: {e}")
        rewritten = ""

    q["tips"] = (tips + q.get("tips", []))[:5]

    _history.append({"id": datetime.utcnow().isoformat(), "prompt": prompt,
                      "response": response, "quality": q, "intent": i,
                      "ts": datetime.utcnow().isoformat()})
    if len(_history) > 200:
        _history.pop(0)

    return jsonify({"generation": {"response": response}, "quality": q, "intent": i, "rewritten_prompt": rewritten})


@app.route("/api/analyse", methods=["POST"])
def analyse():
    body   = request.get_json(force=True)
    prompt = body.get("prompt", "").strip()
    if not prompt:
        return jsonify({"error": "prompt is required"}), 400

    q = _quality(prompt)
    i = _intent(prompt)

    # Tips + AI rewrite run in parallel for speed
    f_tips    = _pool.submit(_ai_tips, prompt, q.get("signals", {}))
    f_rewrite = _pool.submit(_rewrite_prompt, prompt, q.get("signals", {}))

    try:
        tips = f_tips.result(timeout=20)
    except Exception as e:
        log.warning(f"Tips timed out: {e}")
        tips = []

    try:
        rewritten = f_rewrite.result(timeout=25)
    except Exception as e:
        log.warning(f"Rewrite timed out: {e}")
        rewritten = ""

    q["tips"] = (tips + q.get("tips", []))[:5]
    return jsonify({"quality": q, "intent": i, "rewritten_prompt": rewritten})


@app.route("/api/history")
def get_history():
    return jsonify({"history": list(reversed(_history))})


@app.route("/api/history/save", methods=["POST"])
def save_prompt():
    data = request.get_json(force=True)
    data["saved_at"] = datetime.utcnow().isoformat()
    _saved.append(data)
    return jsonify({"ok": True})


@app.route("/api/history/saved")
def get_saved():
    return jsonify({"saved": list(reversed(_saved))})


@app.route("/api/history/saved/<item_id>", methods=["DELETE"])
def delete_saved(item_id: str):
    global _saved
    _saved = [s for s in _saved if s.get("id") != item_id]
    return jsonify({"ok": True})


# =============================================================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    log.info(f"Prompt Lab | primary={MODELS[0]} | port={port} | key={'set' if API_KEY else 'MISSING'}")
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)