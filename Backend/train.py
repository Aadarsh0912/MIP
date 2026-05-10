"""
train.py
---------
Master training script — runs the full pipeline in ~2 minutes, fully offline.

Steps:
  1. Generate synthetic training data (rule-based, no downloads)
  2. Train the Quality Analyser  (GBR regression)
  3. Train the Intent Classifier (LR + RF ensemble)
  4. Build the Response Generator index (TF-IDF similarity)

Usage:
    python train.py

All models are saved to models/saved/ and auto-loaded by app.py.
Re-run at any time to retrain from scratch.
"""

import sys
import time
import logging
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(message)s",
    handlers=[
        logging.StreamHandler(open(sys.stdout.fileno(), mode='w', encoding='utf-8', closefd=False)),
        logging.FileHandler("training.log", encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)

BANNER = "=" * 52


def header(step: int, total: int, title: str):
    log.info(f"\n{BANNER}")
    log.info(f"  Step {step}/{total} — {title}")
    log.info(BANNER)


def main():
    t_start = time.time()
    log.info(f"\n{BANNER}")
    log.info("  Prompt Lab NLP Backend — Training Pipeline")
    log.info("  Synthetic data - Fully offline - No API keys")
    log.info(BANNER)

    # -- Step 1: Generate synthetic data ---------------------------------------
    header(1, 4, "Generating synthetic training data")
    t0 = time.time()

    from data.synthetic import generate
    quality_rows, intent_rows, response_rows = generate(n_per_intent=140)

    log.info(f"  Quality  samples : {len(quality_rows)}")
    log.info(f"  Intent   samples : {len(intent_rows)}")
    log.info(f"  Response samples : {len(response_rows)}")
    log.info(f"  Done in {time.time() - t0:.1f}s")

    # -- Step 2: Quality Analyser -----------------------------------------------
    header(2, 4, "Training Quality Analyser")
    t0 = time.time()

    from models.quality_analyser import QualityAnalyser
    qa = QualityAnalyser()
    qa.train(quality_rows)
    log.info(f"  Done in {time.time() - t0:.1f}s")

    # -- Step 3: Intent Classifier ----------------------------------------------
    header(3, 4, "Training Intent Classifier")
    t0 = time.time()

    from models.intent_classifier import IntentClassifier
    ic = IntentClassifier()
    ic.train(intent_rows)
    log.info(f"  Done in {time.time() - t0:.1f}s")

    # -- Step 4: Response Generator ---------------------------------------------
    header(4, 4, "Building Response Generator Index")
    t0 = time.time()

    from models.response_generator import ResponseGenerator
    rg = ResponseGenerator()
    rg.train(response_rows)
    log.info(f"  Done in {time.time() - t0:.1f}s")

    # -- Summary ----------------------------------------------------------------
    elapsed = time.time() - t_start
    m, s = divmod(int(elapsed), 60)
    log.info(f"\n{BANNER}")
    log.info(f"  [OK] All models trained in {m}m {s}s")
    log.info(f"  [OK] Saved to models/saved/")
    log.info(f"  -> Run: python app.py   (starts on http://localhost:5000)")
    log.info(BANNER + "\n")


if __name__ == "__main__":
    main()