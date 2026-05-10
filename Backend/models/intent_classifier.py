"""
models/intent_classifier.py
────────────────────────────
Lightweight Intent Classifier — trains in < 20 seconds on synthetic data.

Pipeline:
  TF-IDF trigrams (5k vocab) + keyword-match features
    → Logistic Regression  (calibrated soft probabilities)
    → Random Forest        (non-linear patterns)
    → Weighted soft-vote ensemble

13 intent classes: code, explain, summarise, compare, creative, analyse,
                   list, plan, write, refine, qa, translate, general
"""

import re, logging, joblib
import numpy as np
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

log = logging.getLogger(__name__)
SAVE_DIR = Path(__file__).parent / "saved" / "intent"
SAVE_DIR.mkdir(parents=True, exist_ok=True)

KEYWORDS: dict = {
    "code":      ["code","function","implement","program","script","class","algorithm","debug","fix","refactor","syntax","loop","array","method"],
    "explain":   ["explain","what is","how does","define","describe","teach","clarify","understand","mean","concept","works"],
    "summarise": ["summarise","summarize","summary","tldr","brief","overview","condense","shorten","key points","main points"],
    "compare":   ["compare","difference","versus","vs","pros and cons","trade-off","better","which is","contrast","similarities"],
    "creative":  ["story","poem","creative","fiction","narrative","imagine","invent","write a","craft","compose","novel"],
    "analyse":   ["analyse","analyze","evaluate","assess","swot","review","critique","impact","factors","risks","examine"],
    "list":      ["list","enumerate","give me","name","provide","top","best","examples","items","things","ways"],
    "plan":      ["plan","schedule","outline","roadmap","steps to","how to","guide","strategy","phase","milestone","approach"],
    "write":     ["email","letter","memo","report","document","draft","message","post","article","blog","essay"],
    "refine":    ["improve","refine","edit","proofread","correct","enhance","rewrite","fix my","make it","better","revise"],
    "qa":        ["question","quiz","test","practice","answer","what are","how many","when did","who is","which"],
    "translate": ["translate","translation","in french","in spanish","in german","in japanese","convert to","language","portuguese"],
    "general":   ["help","tell me","can you","i need","what do you think","about","please"],
}

TECHNIQUES: dict = {
    "code":      ["Specify language and version explicitly.","State what the code must and must NOT do.","Ask for inline comments and usage examples.","Provide input/output examples for each function."],
    "explain":   ["Define the audience's knowledge level.","Ask for a real-world analogy.","Specify 'explain like I'm 10' or 'explain like I'm a PhD'.","Add 'Give one concrete example after the explanation'."],
    "summarise": ["Set the desired length: '3 bullets', '150 words', 'one sentence'.","Define what to preserve: 'keep all statistics and names'.","Set the audience: a CEO summary differs from a student's.","Ask for a TL;DR at the top followed by key sections."],
    "compare":   ["List the exact dimensions to compare.","Request a comparison table for clarity.","Specify whether you want a final recommendation.","Add context: 'comparing for a startup with 3 engineers'."],
    "creative":  ["Set genre, tone, and target audience.","Give a style reference: 'in the style of Hemingway'.","Define length and structure: '500 words, three acts'.","Add sensory details to the scene description."],
    "analyse":   ["Define the analysis framework (SWOT, PESTLE, etc.).","Specify what to include: strengths, risks, opportunities.","Ask for evidence-backed claims only.","Define the output format: structured sections with headers."],
    "list":      ["Specify the exact number of items.","Set the format: ranked, bulleted, or numbered.","Add a constraint: 'actionable items only', 'no duplicates'.","Ask for a one-line explanation after each item."],
    "plan":      ["Define goal, timeline, and available resources.","Ask for milestones and success criteria per phase.","Request risk mitigation alongside each step.","Specify: numbered steps, weekly breakdown, or Gantt-style."],
    "write":     ["Specify document type, length, audience, and purpose.","Set tone: professional, conversational, persuasive, neutral.","Ask for subject line/title/headline separately.","Define what action the reader should take after reading."],
    "refine":    ["Paste the original text and state what is wrong.","List specific criteria: 'more concise', 'formal tone'.","Ask to preserve the original meaning exactly.","Request a tracked-changes style showing what changed."],
    "qa":        ["Provide source context for the model to answer from.","Ask for a confidence level if the answer may be uncertain.","Add 'If unknown, say unknown' to prevent hallucination.","Request citations where available."],
    "translate": ["Specify source and target language and dialect.","State formality level: formal written vs. casual spoken.","For technical text, ask to preserve all terminology.","Request a back-translation if accuracy is critical."],
    "general":   ["Add a role: 'You are a [expert]…' to set persona.","Be specific — vague prompts produce vague answers.","Break complex requests into explicit numbered steps.","Specify the exact output format you want."],
}


def _keyword_feats(text: str) -> np.ndarray:
    t = text.lower()
    return np.array([
        sum(1 for kw in kws if kw in t)
        for kws in KEYWORDS.values()
    ], dtype=np.float32)


class IntentClassifier:
    def __init__(self):
        self.tfidf = TfidfVectorizer(max_features=5000, ngram_range=(1, 3),
                                      sublinear_tf=True, min_df=1)
        self.enc   = LabelEncoder()
        self.lr    = LogisticRegression(max_iter=600, C=2.5, random_state=42, n_jobs=-1)
        self.rf    = RandomForestClassifier(n_estimators=150, max_depth=16,
                                             random_state=42, n_jobs=-1)
        self._trained = False

    def _features(self, prompts, fit=False):
        tf = self.tfidf.fit_transform(prompts).toarray() if fit \
             else self.tfidf.transform(prompts).toarray()
        kf = np.vstack([_keyword_feats(p) for p in prompts])
        return np.hstack([tf, kf])

    def train(self, rows: list):
        log.info(f"  Intent: {len(rows)} samples")
        prompts = [r["prompt"] for r in rows]
        labels  = [r["label"]  for r in rows]
        y       = self.enc.fit_transform(labels)

        X = self._features(prompts, fit=True)
        Xtr, Xva, ytr, yva = train_test_split(
            X, y, test_size=0.12, random_state=42, stratify=y)

        self.lr.fit(Xtr, ytr)
        self.rf.fit(Xtr, ytr)

        preds = self._ensemble_pred(Xva)
        log.info(f"\n{classification_report(yva, preds, target_names=self.enc.classes_, zero_division=0)}")
        self._trained = True
        self._save()

    def _ensemble_pred(self, X):
        return (0.55 * self.lr.predict_proba(X) +
                0.45 * self.rf.predict_proba(X)).argmax(axis=1)

    def _ensemble_proba(self, X):
        return (0.55 * self.lr.predict_proba(X) +
                0.45 * self.rf.predict_proba(X))

    def _save(self):
        joblib.dump(self.tfidf, SAVE_DIR / "tfidf.pkl")
        joblib.dump(self.enc,   SAVE_DIR / "enc.pkl")
        joblib.dump(self.lr,    SAVE_DIR / "lr.pkl")
        joblib.dump(self.rf,    SAVE_DIR / "rf.pkl")

    def load(self):
        self.tfidf = joblib.load(SAVE_DIR / "tfidf.pkl")
        self.enc   = joblib.load(SAVE_DIR / "enc.pkl")
        self.lr    = joblib.load(SAVE_DIR / "lr.pkl")
        self.rf    = joblib.load(SAVE_DIR / "rf.pkl")
        self._trained = True

    def is_saved(self):
        return all((SAVE_DIR / f).exists()
                   for f in ["tfidf.pkl","enc.pkl","lr.pkl","rf.pkl"])

    def predict(self, prompt: str) -> dict:
        X     = self._features([prompt])
        proba = self._ensemble_proba(X)[0]
        top3  = proba.argsort()[::-1][:3]
        label = self.enc.inverse_transform([top3[0]])[0]
        return {
            "primary_intent": label,
            "confidence":     round(float(proba[top3[0]]), 3),
            "top3": [
                {"intent":     self.enc.inverse_transform([i])[0],
                 "confidence": round(float(proba[i]), 3)}
                for i in top3
            ],
            "techniques": TECHNIQUES.get(label, TECHNIQUES["general"]),
        }
