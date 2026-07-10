# Prompt Lab — NLP Python Backend

A professional NLP backend built **entirely from scratch** — no API keys,
no Ollama, no external LLMs, no internet required after install.

Trains in ~60–90 seconds on any CPU. Serves responses in < 250 ms.

---

## Architecture

```
prompt_lab_v2/
├── app.py                     ← Flask API server  →  python app.py
├── train.py                   ← Training script   →  python train.py
├── requirements.txt
├── README.md
├── data/
│   ├── __init__.py
│   └── synthetic.py           ← Rule-based synthetic data generator
└── models/
    ├── __init__.py
    ├── quality_analyser.py    ← Prompt quality scorer (0–100)
    ├── intent_classifier.py   ← Task intent detector (13 classes)
    └── response_generator.py  ← TF-IDF RAG response engine
```

After training, a `models/saved/` directory is created automatically
containing all serialised model artifacts.

---

## Three NLP Models

### 1 · Quality Analyser
Scores how well-structured a prompt is (0–100) and detects which
prompt-engineering signals are present.

| Component | Detail |
|---|---|
| Text features | TF-IDF (3 000 vocab, unigrams + bigrams, sublinear TF) |
| Structural features | 15 hand-crafted NLP signals (role, format, constraints, CoT, audience, context, examples, lexical diversity, sentence count, capitalisation, punctuation density…) |
| Score model | Gradient Boosting Regressor — 120 trees, depth 4 |
| Signal model | 7 independent Logistic Regression classifiers (one per signal) with DummyClassifier fallback for imbalanced columns |
| Output | `quality_score` (0–100), `clarity_label` (Weak / Fair / Good / Strong), detected `signals` dict, up to 3 actionable `tips`, vocabulary `stats` |

### 2 · Intent Classifier
Identifies what type of task the prompt is trying to accomplish.

| Component | Detail |
|---|---|
| Text features | TF-IDF (5 000 vocab, unigrams + trigrams) |
| Keyword features | 13 keyword-match counts (one per class) |
| Models | Logistic Regression (55%) + Random Forest 150 trees (45%) — weighted soft-vote ensemble |
| Classes | `code` · `explain` · `summarise` · `compare` · `creative` · `analyse` · `list` · `plan` · `write` · `refine` · `qa` · `translate` · `general` |
| Output | `primary_intent`, `confidence`, `top3`, `techniques` (4 actionable suggestions) |

### 3 · Response Generator (RAG)
Retrieval-Augmented Generation over the synthetic corpus — no decoder LLM needed.

| Component | Detail |
|---|---|
| Index | TF-IDF sparse matrix (6 000 vocab) over all training prompts |
| Retrieval | Cosine similarity + intent-match boost (+15%) + keyword overlap bonus |
| Reranking | Top-8 hits; secondary hits contribute supporting sentences |
| Synthesis | Intent-specific opener, best-match response as base, up to 2 supporting sentences from secondary hits, intent-specific closer |
| Post-processing | Sentence deduplication, word-limit trim at sentence boundary, whitespace normalisation |

---

## Setup (3 commands)

```bash
# 1. Install dependencies
pip install flask scikit-learn numpy scipy joblib

# 2. Train all models (~60–90 seconds, fully offline)
python train.py

# 3. Start the API server
python app.py
#  → http://localhost:5000
```

> **Python 3.10+** required. No GPU needed.

---

## API Reference

### `POST /api/generate`
Full pipeline — intent detection + quality analysis + response generation.

**Request**
```json
{
  "prompt":    "Explain neural networks to a 10-year-old using an analogy.",
  "max_words": 320
}
```

**Response**
```json
{
  "intent": {
    "primary_intent": "explain",
    "confidence":     0.71,
    "top3":           [{"intent": "explain", "confidence": 0.71}, ...],
    "techniques":     ["Define the audience's knowledge level.", ...],
    "latency_ms":     210.0
  },
  "quality": {
    "quality_score":  17,
    "clarity_label":  "Weak",
    "signals": {
      "has_role": false, "has_format": false, "has_constraints": false,
      "has_cot":  false, "has_audience": true, "has_context": false, "has_examples": false
    },
    "tips": [
      {"title": "Add a role",      "description": "Start with 'You are a [expert]…'"},
      {"title": "Specify format",  "description": "Tell the model how to structure output…"},
      {"title": "Add constraints", "description": "Set limits: word count, tone…"}
    ],
    "stats": {
      "word_count": 10, "char_count": 61, "unique_words": 9,
      "lexical_diversity": 0.9, "sentence_count": 2
    },
    "latency_ms": 2.0
  },
  "generation": {
    "response":        "Great question. Here's a clear breakdown:\n\n...",
    "retrieval_score": 0.769,
    "sources_used":    8,
    "latency_ms":      21.0
  }
}
```

---

### `POST /api/analyse`
Quality + intent analysis only — no response generated. Faster, use for
live analysis as the user types.

**Request**
```json
{ "prompt": "You are a Python expert. Write a sorting function." }
```

**Response** — same shape as `/api/generate` but without `generation` key.

---

### `GET /api/health`
```json
{
  "status":    "ok",
  "all_ready": true,
  "models":    {"quality": "ready", "intent": "ready", "response": "ready"},
  "timestamp": 1234567890.0
}
```

---

### `GET /api/techniques?intent=code`
Returns technique suggestions for a given intent label.
```json
{
  "intent":     "code",
  "techniques": [
    "Specify language and version explicitly.",
    "State what the code must and must NOT do.",
    "Ask for inline comments and usage examples.",
    "Provide input/output examples for each function."
  ]
}
```

---

### `GET /api/history`
Returns the last 30 generation runs (in-memory, resets on server restart).
```json
{
  "history": [
    {
      "id":       1717000000.0,
      "prompt":   "...",
      "response": "...",
      "quality":  {...},
      "intent":   "explain",
      "ts":       "2025-01-01T12:00:00"
    }
  ],
  "count": 1
}
```

---

### `POST /api/history/save`
Save a prompt to the favourites list (persists until server restarts).
```json
{ "prompt": "...", "label": "optional display label" }
```

### `GET /api/history/saved`
List all saved prompts.

### `DELETE /api/history/saved/<id>`
Remove a saved prompt by its numeric `id`.

---

## Connecting to the React Frontend

In `LandingPageV2_v6.jsx`, the `PromptLabPage` component currently calls
the Anthropic Claude API. To switch it to this Python backend, replace the
`generate` function body with:

```js
const BASE = "http://localhost:5000";

const generate = async () => {
  if (!prompt.trim() || loading) return;
  setLoading(true);
  setResponse("");
  try {
    const res = await fetch(`${BASE}/api/generate`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ prompt, max_words: 350 }),
    });
    const data = await res.json();

    // Response text
    setResponse(data.generation?.response || "No response.");

    // Quality analysis (same shape as the existing analysePrompt() output)
    if (data.quality) setAnalysis(data.quality);

    // Intent + techniques
    if (data.intent) setIntent(data.intent);

  } catch (e) {
    setResponse("Error: " + e.message);
  }
  setLoading(false);
};
```

For live analysis as the user types, call `POST /api/analyse` with a
debounce of ~400 ms.

---

## Retraining

```bash
# Full retrain from scratch
python train.py

# Retrain only one model
python -c "
from data.synthetic import generate
from models.quality_analyser import QualityAnalyser
rows, _, _ = generate(140)
QualityAnalyser().train(rows)
"
```

---

## Performance (measured on this machine)

| Model | Metric | Value |
|---|---|---|
| Quality Analyser | MAE on validation set | ~2.6 pts |
| Intent Classifier | Top-1 accuracy | ~88% |
| Response Generator | Mean retrieval cosine sim | ~0.75 |
| `/api/generate` | End-to-end latency | ~250 ms |
| `/api/analyse` | End-to-end latency | ~300 ms |
| Training time | Total (all 3 models) | ~65 s |
