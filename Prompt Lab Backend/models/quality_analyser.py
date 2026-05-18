"""
models/quality_analyser.py
───────────────────────────
Lightweight Quality Analyser — trains in < 30 seconds on synthetic data.

Pipeline:
  TF-IDF (3k vocab, bigrams) + 15 hand-crafted signals
    → StandardScaler
    → GradientBoostingRegressor   (quality score 0-100)
    → per-signal LogisticRegression (7 binary signal detectors, safe fallback)
"""

import re, logging, joblib
import numpy as np
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.dummy import DummyClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

log = logging.getLogger(__name__)
SAVE_DIR = Path(__file__).parent / "saved" / "quality"
SAVE_DIR.mkdir(parents=True, exist_ok=True)

SIGNAL_COLS = ["has_role","has_format","has_constraints","has_cot",
               "has_audience","has_context","has_examples"]

TIPS = {
    "has_role":        ("Add a role",          "Start with 'You are a [expert]…' to activate domain-specific tone and knowledge."),
    "has_format":      ("Specify format",       "Tell the model how to structure its output — JSON, bullet list, table, numbered steps."),
    "has_constraints": ("Add constraints",      "Set limits: word count, tone, forbidden phrases. Constraints sharpen the output."),
    "has_cot":         ("Chain of thought",     "Add 'Think step by step' or structure with phases to improve reasoning quality."),
    "has_audience":    ("Define your audience", "Specify who this is for: 'explain to a CFO', 'write for a 10-year-old'."),
    "has_context":     ("Provide context",      "Add background: 'Context: [info]'. More context = less hallucination."),
    "has_examples":    ("Include examples",     "Few-shot examples are the most reliable way to control output format and style."),
}


def _hand_feats(text: str) -> np.ndarray:
    t    = text.lower()
    wds  = text.split()
    sents = max(len(re.split(r'[.!?]+', text)), 1)
    uniq  = len(set(w.lower() for w in wds))
    wc    = len(wds)
    return np.array([
        wc,
        uniq / max(wc, 1),
        wc / sents,
        text.count("\n"),
        text.count("?"),
        len(re.findall(r'["\']', text)),
        sum(c.isupper() for c in text) / max(len(text), 1),
        sum(c in '.,;:' for c in text) / max(len(text), 1),
        int(bool(re.search(r"you are|act as|as a |as an", t))),
        int(bool(re.search(r"json|markdown|table|bullet|numbered|format|list", t))),
        int(bool(re.search(r"\bmax\b|limit|only|must|avoid|\bno \b|don.t|do not|within|under \d+", t))),
        int(bool(re.search(r"step by step|think through|first.*then|reasoning|phase|roadmap", t))),
        int(bool(re.search(r"for a |for an |audience|explain to|aimed at|targeting", t))),
        int(bool(re.search(r"context:|background:|given that|note that|our team|i am building", t))),
        int(bool(re.search(r"\bexample\b|e\.g\.|for instance|such as|include.*example", t))),
    ], dtype=np.float32)


class QualityAnalyser:
    def __init__(self):
        self.tfidf       = TfidfVectorizer(max_features=3000, ngram_range=(1, 2),
                                            sublinear_tf=True, min_df=1)
        self.scaler      = StandardScaler()
        self.scorer      = GradientBoostingRegressor(n_estimators=120, max_depth=4,
                                                      learning_rate=0.1, subsample=0.8,
                                                      random_state=42)
        # One classifier per signal column (safe: falls back to Dummy if only one class)
        self.signal_clfs: list = []
        self._trained    = False

    def _features(self, prompts, fit=False):
        if fit:
            tf = self.tfidf.fit_transform(prompts).toarray()
        else:
            tf = self.tfidf.transform(prompts).toarray()
        hf = np.vstack([_hand_feats(p) for p in prompts])
        if fit:
            hf = self.scaler.fit_transform(hf)
        else:
            hf = self.scaler.transform(hf)
        return np.hstack([tf, hf])

    def train(self, rows: list[dict]):
        log.info(f"  Quality: {len(rows)} samples")
        prompts = [r["prompt"] for r in rows]
        scores  = np.array([r["quality_score"] for r in rows], dtype=np.float32)
        sigs    = np.array([[int(r.get(c, 0)) for c in SIGNAL_COLS] for r in rows])

        X = self._features(prompts, fit=True)
        Xtr, Xva, ytr, yva, str_, sva = train_test_split(
            X, scores, sigs, test_size=0.12, random_state=42)

        # Train score regressor
        self.scorer.fit(Xtr, ytr)
        mae = mean_absolute_error(yva, self.scorer.predict(Xva))
        log.info(f"  Quality MAE: {mae:.1f} pts")

        # Train one classifier per signal — use Dummy if column is all-one-class
        self.signal_clfs = []
        for i, col in enumerate(SIGNAL_COLS):
            col_y = str_[:, i]
            if len(np.unique(col_y)) < 2:
                clf = DummyClassifier(strategy="most_frequent")
            else:
                clf = LogisticRegression(max_iter=300, C=1.5, random_state=42)
            clf.fit(Xtr, col_y)
            self.signal_clfs.append(clf)

        self._trained = True
        self._save()

    def _save(self):
        joblib.dump(self.tfidf,       SAVE_DIR / "tfidf.pkl")
        joblib.dump(self.scaler,      SAVE_DIR / "scaler.pkl")
        joblib.dump(self.scorer,      SAVE_DIR / "scorer.pkl")
        joblib.dump(self.signal_clfs, SAVE_DIR / "signal_clfs.pkl")

    def load(self):
        self.tfidf       = joblib.load(SAVE_DIR / "tfidf.pkl")
        self.scaler      = joblib.load(SAVE_DIR / "scaler.pkl")
        self.scorer      = joblib.load(SAVE_DIR / "scorer.pkl")
        self.signal_clfs = joblib.load(SAVE_DIR / "signal_clfs.pkl")
        self._trained    = True

    def is_saved(self):
        return all((SAVE_DIR / f).exists()
                   for f in ["tfidf.pkl","scaler.pkl","scorer.pkl","signal_clfs.pkl"])

    def analyse(self, prompt: str) -> dict:
        X     = self._features([prompt])
        score = max(0, min(100, round(float(self.scorer.predict(X)[0]))))

        signals = {}
        for i, col in enumerate(SIGNAL_COLS):
            pred = self.signal_clfs[i].predict(X)[0]
            signals[col] = bool(pred)

        clarity = ("Strong" if score >= 75 else
                   "Good"   if score >= 52 else
                   "Fair"   if score >= 32 else "Weak")

        tips = [{"title": t, "description": d}
                for col, (t, d) in TIPS.items() if not signals[col]][:3]

        words  = prompt.split()
        sents  = max(len(re.split(r'[.!?]+', prompt)), 1)
        unique = len(set(w.lower() for w in words))

        return {
            "quality_score": score,
            "clarity_label": clarity,
            "signals":       signals,
            "tips":          tips,
            "stats": {
                "word_count":        len(words),
                "char_count":        len(prompt),
                "unique_words":      unique,
                "lexical_diversity": round(unique / max(len(words), 1), 2),
                "sentence_count":    sents,
            },
        }
