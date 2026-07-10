"""
data/synthetic.py
──────────────────
Generates ALL training data from rules — fully offline, no downloads.

Produces three datasets:
  • quality_data   : (prompt, quality_score 0-100, signal flags)
  • intent_data    : (prompt, intent_label)
  • response_data  : (prompt, intent, response_template)

Strategy:
  Templates × slot-fill combinations × perturbations = diverse coverage.
  Each intent has 12-20 seed templates. Slots are filled from curated
  word banks. Perturbations (truncation, noise, extra signals) create
  weak/medium/strong quality variants for the regression target.
"""

import re, random, itertools
from dataclasses import dataclass, field
from typing import Optional

random.seed(42)

# ── Slot banks ────────────────────────────────────────────────────────────────
ROLES = [
    "a senior software engineer", "an expert data scientist", "a professional copywriter",
    "an experienced teacher", "a medical doctor", "a financial analyst",
    "a creative director", "a research scientist", "a UX designer", "a product manager",
    "a machine learning engineer", "a cybersecurity expert", "a marketing strategist",
    "a legal expert", "a seasoned journalist", "a business consultant",
]
TOPICS = [
    "machine learning", "climate change", "quantum computing", "blockchain technology",
    "natural language processing", "renewable energy", "artificial intelligence",
    "data privacy", "microservices architecture", "neural networks",
    "supply chain management", "agile methodology", "user experience design",
    "distributed systems", "cloud computing", "DevOps practices",
    "cybersecurity threats", "API design", "database optimisation", "software testing",
]
AUDIENCES = [
    "a 10-year-old", "a complete beginner", "a senior executive",
    "a technical expert", "a university student", "a non-technical stakeholder",
    "a software engineer", "a business analyst", "a product manager",
    "someone with no prior knowledge",
]
FORMATS = [
    "a JSON object", "a numbered list", "a bullet-point summary",
    "a markdown table", "a structured report with headers",
    "a concise paragraph", "step-by-step instructions", "an executive summary",
]
LANGUAGES = ["Python", "JavaScript", "TypeScript", "Java", "Go", "Rust", "C++", "SQL"]
CONSTRAINTS = [
    "in under 200 words", "using only simple language", "without technical jargon",
    "in exactly 5 bullet points", "with concrete examples only", "citing no external sources",
    "in a formal tone", "in under 100 words", "using an analogy", "with code examples",
]
CONTEXTS = [
    "I am building a startup", "Our team uses AWS", "We have a strict budget",
    "The project deadline is next week", "Our users are non-technical",
    "We are migrating from a monolith", "The system handles 1M requests per day",
]

# ── Intent templates ───────────────────────────────────────────────────────────
# Each template list has (template_string, base_quality_score)
# base_quality reflects how well-formed the template is before perturbation

INTENT_TEMPLATES: dict[str, list[tuple[str, int]]] = {

    "code": [
        ("Write a {lang} function that {task}.",                                             35),
        ("You are {role}. Write clean {lang} code that {task}. Include inline comments.",   72),
        ("Implement a {lang} {component} that {task}. Output only code, no explanation.",   68),
        ("You are {role}. Write a {lang} solution for {task}. Add docstrings and tests.",   85),
        ("Code a {lang} script to {task}. Format output as a markdown code block.",         70),
        ("You are {role}. Implement {task} in {lang}. Constraints: no external libraries, O(n log n) time.", 88),
        ("Fix this bug in my {lang} code: {task}. Explain what was wrong.",                 62),
        ("Refactor this {lang} function to be more readable: {task}.",                      58),
    ],

    "explain": [
        ("What is {topic}?",                                                                 18),
        ("Explain {topic} in simple terms.",                                                 32),
        ("Explain {topic} to {audience}. Use an analogy.",                                  64),
        ("You are {role}. Explain {topic} to {audience}. Format as {fmt}.",                 80),
        ("You are {role}. Explain {topic} clearly. Audience: {audience}. {constraint}.",    85),
        ("Define {topic}. Give 3 real-world examples. Keep it under 150 words.",            70),
        ("Break down {topic} into its core components. Use plain language.",                 55),
        ("You are {role}. Teach {topic} step by step to {audience}. Include a summary.",    82),
    ],

    "summarise": [
        ("Summarise this: {topic}.",                                                         25),
        ("Give me a summary of {topic}.",                                                    28),
        ("Summarise {topic} in 3 bullet points.",                                            55),
        ("TL;DR of {topic} for {audience}. Max 100 words.",                                  65),
        ("You are {role}. Summarise {topic} for {audience}. Format: {fmt}. {constraint}.",  84),
        ("Condense the key ideas of {topic} into an executive summary.",                     62),
        ("Provide a structured summary of {topic} with: Overview, Key Points, Conclusion.", 78),
    ],

    "compare": [
        ("Compare {topic} and machine learning.",                                             30),
        ("What is the difference between {topic} and AI?",                                   34),
        ("Compare {topic} vs cloud computing for {audience}. Use a table.",                  68),
        ("You are {role}. Compare {topic} and DevOps. Format as {fmt}. Include a recommendation.", 86),
        ("Pros and cons of {topic} vs microservices. {constraint}.",                         72),
        ("You are {role}. Compare {topic} and blockchain from a {audience} perspective. Include trade-offs.", 88),
    ],

    "creative": [
        ("Write a story about {topic}.",                                                      22),
        ("Write a short poem about {topic}.",                                                 28),
        ("Write a creative essay about {topic} for {audience}.",                              54),
        ("You are {role}. Write a compelling narrative about {topic}. Tone: professional. Length: 300 words.", 80),
        ("Write a persuasive piece about {topic} targeting {audience}. {constraint}.",        75),
        ("Craft a creative short story involving {topic}. Include a twist ending.",           62),
    ],

    "analyse": [
        ("Analyse {topic}.",                                                                  20),
        ("What are the key factors in {topic}?",                                              32),
        ("Analyse {topic} and identify risks. Format as {fmt}.",                             62),
        ("You are {role}. Perform a SWOT analysis of {topic}. Context: {ctx}. Format: {fmt}.", 88),
        ("Critically evaluate {topic} for {audience}. Include data-backed insights only.",   76),
        ("You are {role}. Analyse the impact of {topic}. {constraint}. Conclude with recommendations.", 85),
    ],

    "list": [
        ("List some things about {topic}.",                                                   18),
        ("Give me 5 facts about {topic}.",                                                    42),
        ("List the top 10 best practices for {topic}. Rank by importance.",                  65),
        ("You are {role}. Enumerate 7 key challenges in {topic}. Format as {fmt}. Add a one-line explanation per item.", 86),
        ("Provide a ranked list of {topic} tools for {audience}. Include pros of each.",     74),
    ],

    "plan": [
        ("How do I learn {topic}?",                                                           22),
        ("Give me a plan to get started with {topic}.",                                       38),
        ("Create a 30-day learning roadmap for {topic} for {audience}. Format as {fmt}.",    70),
        ("You are {role}. Build a step-by-step project plan for implementing {topic}. Context: {ctx}. Include milestones and risks.", 90),
        ("Design a 3-phase adoption strategy for {topic}. Include success criteria per phase.", 78),
    ],

    "write": [
        ("Write an email about {topic}.",                                                     25),
        ("Draft a professional email about {topic} to a {audience}.",                         52),
        ("You are {role}. Write a formal report on {topic} for {audience}. Format as {fmt}. {constraint}.", 88),
        ("Write a LinkedIn post about {topic} targeting {audience}. Keep it engaging.",       65),
        ("Draft a technical document explaining {topic}. Audience: {audience}. Include: intro, details, conclusion.", 80),
    ],

    "refine": [
        ("Improve this text: {topic}.",                                                       30),
        ("Rewrite this to be clearer: {topic}.",                                              42),
        ("Proofread and improve this: {topic}. Preserve meaning exactly. Flag all changes.",  74),
        ("You are {role}. Refine this for {audience}: '{topic}'. Make it more concise, formal, and impactful.", 86),
        ("Edit the following for clarity and tone: {topic}. {constraint}.",                   68),
    ],

    "qa": [
        ("What is the answer to {topic}?",                                                    20),
        ("Answer this question about {topic}: what are the main risks?",                      44),
        ("You are {role}. Answer questions about {topic} for {audience}. If uncertain, say so explicitly.", 80),
        ("Based on this context: '{ctx}' — answer: what are the implications for {topic}?",  72),
        ("You are {role}. Answer the following about {topic} with evidence only. No speculation.", 88),
    ],

    "translate": [
        ("Translate this to French: {topic}.",                                                30),
        ("Translate the following technical text about {topic} to Spanish. Preserve all terminology.", 65),
        ("You are {role}. Translate: '{topic}' to {lang}. Use formal register. Note any untranslatable terms.", 84),
        ("Translate this for {audience}: {topic}. Localise idioms appropriately.",            72),
    ],

    "general": [
        ("Tell me about {topic}.",                                                            15),
        ("I need help with {topic}.",                                                         12),
        ("Can you help me understand {topic}?",                                               22),
        ("What do you think about {topic}?",                                                  18),
        ("{topic}.",                                                                           8),
        ("Help.",                                                                              4),
    ],
}

# ── Response templates (what a good answer looks like per intent) ──────────────
RESPONSE_TEMPLATES: dict[str, list[str]] = {
    "code": [
        "Here's a {lang} implementation:\n\n```{lang}\n{task_code}\n```\n\n**Explanation:** This solves the problem directly. Add error handling and tests before deploying.\n\n**Usage:**\n```{lang}\nresult = solution()\nprint(result)\n```",
        "```{lang}\n{task_code}\n```\n\nThis implementation is clean and readable. It follows best practices for {lang} and runs efficiently.",
    ],
    "explain": [
        "**{topic}** is a fundamental concept in modern technology.\n\n**In simple terms:** Think of it like a recipe — you provide instructions, and the system follows them precisely.\n\n**Key points:**\n- It processes information systematically\n- It improves with more data\n- It has broad real-world applications\n\n**Example:** A recommendation system that suggests movies based on your watch history uses this exact principle.",
        "Great question. {topic} works by breaking complex problems into smaller, manageable steps.\n\n1. **Input phase:** Data is collected and preprocessed\n2. **Processing phase:** Algorithms are applied\n3. **Output phase:** Results are generated and validated\n\nThe key insight is that each step builds on the previous one, creating a reliable pipeline.",
    ],
    "summarise": [
        "**Summary of {topic}:**\n\n- **Core idea:** The fundamental principle involves systematic processing of structured information\n- **Key benefit:** Enables faster decision-making with higher accuracy\n- **Main challenge:** Requires quality data and careful implementation\n\n**TL;DR:** {topic} is a powerful approach that, when implemented correctly, delivers measurable improvements in efficiency and outcomes.",
        "**Executive Summary:**\n\n{topic} represents a significant shift in how we approach complex problems. The core value proposition is clear: by applying structured methods, organisations can reduce costs by up to 40% while improving accuracy.\n\n**Key Takeaways:**\n1. Start small and iterate\n2. Measure everything\n3. Focus on user outcomes",
    ],
    "compare": [
        "**Comparison: {topic} vs Alternative**\n\n| Dimension | {topic} | Alternative |\n|---|---|---|\n| Performance | High | Medium |\n| Complexity | Medium | Low |\n| Scalability | Excellent | Good |\n| Cost | Medium | Low |\n| Maturity | High | Growing |\n\n**Recommendation:** Choose {topic} if scalability and performance are priorities. Choose the alternative for simpler use cases with tighter budgets.",
    ],
    "analyse": [
        "**Analysis of {topic}:**\n\n**Strengths:**\n- Strong theoretical foundation\n- Wide industry adoption\n- Active community and tooling\n\n**Weaknesses:**\n- Steep learning curve\n- High initial investment\n- Requires specialised expertise\n\n**Opportunities:**\n- Growing market demand\n- Emerging integration patterns\n- Cost reduction through automation\n\n**Threats:**\n- Rapid technology change\n- Talent shortage\n- Regulatory uncertainty\n\n**Conclusion:** The opportunity outweighs the risks for organisations with a clear strategy.",
    ],
    "list": [
        "Here are the top items for **{topic}**:\n\n1. **Define clear objectives** — Start with measurable goals before implementation\n2. **Choose the right tools** — Match technology to your specific requirements\n3. **Build iteratively** — Start small, validate, then scale\n4. **Monitor continuously** — Establish metrics and review them regularly\n5. **Document everything** — Future-you will thank present-you\n6. **Test thoroughly** — Automated testing reduces long-term costs significantly\n7. **Involve stakeholders early** — Alignment prevents costly pivots later",
    ],
    "plan": [
        "**30-Day Plan for {topic}:**\n\n**Week 1 — Foundation**\n- [ ] Research core concepts and terminology\n- [ ] Set up development environment\n- [ ] Complete introductory tutorial\n\n**Week 2 — Core Skills**\n- [ ] Build first working prototype\n- [ ] Study best practices and patterns\n- [ ] Join relevant communities\n\n**Week 3 — Application**\n- [ ] Work on a real project\n- [ ] Get feedback from experts\n- [ ] Identify and fill knowledge gaps\n\n**Week 4 — Consolidation**\n- [ ] Complete a portfolio project\n- [ ] Document lessons learned\n- [ ] Plan next learning phase\n\n**Success metric:** You can build and deploy a working solution independently.",
    ],
    "write": [
        "**Subject:** Update on {topic} Initiative\n\nDear [Recipient],\n\nI hope this message finds you well. I am writing to provide an update on our {topic} initiative and outline the next steps.\n\n**Current Status:** The project is progressing on schedule with all major milestones met.\n\n**Key Achievements:**\n- Phase 1 completed successfully\n- Team capacity is fully allocated\n- Stakeholder alignment confirmed\n\n**Next Steps:** We will proceed to Phase 2 starting [date]. I welcome your feedback.\n\nBest regards,\n[Your Name]",
    ],
    "general": [
        "I'd be happy to help with that. Could you provide more details about what specifically you're looking for? The more context you give, the better I can tailor my response to your needs.\n\nIn the meantime, here are a few things to consider:\n- What is your end goal?\n- Who is your target audience?\n- What format works best for you?\n\nWith those details, I can give you a much more useful and precise answer.",
        "That's an interesting area to explore. Here's a starting point:\n\nThe core principles involve understanding the problem deeply before jumping to solutions. I recommend breaking this into smaller questions and tackling each systematically.\n\nWould you like me to focus on a specific aspect?",
    ],
}

# Fill defaults for missing intents
for _intent in INTENT_TEMPLATES:
    if _intent not in RESPONSE_TEMPLATES:
        RESPONSE_TEMPLATES[_intent] = RESPONSE_TEMPLATES["general"]


# ── Signal detection (mirrors frontend analysis) ───────────────────────────────
def detect_signals(text: str) -> dict[str, bool]:
    t = text.lower()
    return {
        "has_role":        bool(re.search(r"you are|act as|as a |as an ", t)),
        "has_format":      bool(re.search(r"json|markdown|table|bullet|numbered|format|list", t)),
        "has_constraints": bool(re.search(r"\bmax\b|limit|only|must|avoid|\bno \b|don.t|do not|within|under \d+", t)),
        "has_cot":         bool(re.search(r"step by step|think through|first.*then|reasoning|phase|roadmap", t)),
        "has_audience":    bool(re.search(r"for a |for an |audience|explain to|aimed at|targeting", t)),
        "has_context":     bool(re.search(r"context:|background:|given that|note that|ctx|our team|i am building", t)),
        "has_examples":    bool(re.search(r"\bexample\b|e\.g\.|for instance|such as|include.*example", t)),
    }


def score_prompt(text: str, base: int) -> int:
    sigs = detect_signals(text)
    n    = sum(sigs.values())
    wc   = len(text.split())
    # Signal richness 0-50, base score 0-35, length bonus 0-15
    score = int(base * 0.35 + (n / 7) * 50 + min(wc, 60) / 60 * 15)
    return max(0, min(100, score))


# ── Fill a template ────────────────────────────────────────────────────────────
def fill(template: str) -> str:
    replacements = {
        "{role}":       random.choice(ROLES),
        "{topic}":      random.choice(TOPICS),
        "{audience}":   random.choice(AUDIENCES),
        "{fmt}":        random.choice(FORMATS),
        "{lang}":       random.choice(LANGUAGES),
        "{constraint}": random.choice(CONSTRAINTS),
        "{ctx}":        random.choice(CONTEXTS),
        "{task}":       f"process and validate {random.choice(TOPICS).lower()} data",
        "{component}":  random.choice(["class", "module", "utility", "service", "handler"]),
        "{subjects}":   f"{random.choice(TOPICS)} and {random.choice(TOPICS)}",
        "{col1}":       random.choice(TOPICS)[:12],
        "{col2}":       random.choice(TOPICS)[:12],
    }
    result = template
    for k, v in replacements.items():
        result = result.replace(k, v)
    return result


def fill_response(intent: str) -> str:
    tmpl = random.choice(RESPONSE_TEMPLATES[intent])
    return fill(tmpl)


# ── Perturbations to create weak/medium/strong variants ───────────────────────
def perturb_weak(text: str) -> str:
    """Strip it down to a vague, under-specified version."""
    # Keep only first sentence-ish
    parts = text.split(".")
    short = parts[0].strip() if parts else text
    # Remove role/format/constraint sections
    short = re.sub(r"you are.*?\.", "", short, flags=re.I).strip()
    short = re.sub(r"format.*", "", short, flags=re.I).strip()
    return short or text[:40]


# ── Main generator ─────────────────────────────────────────────────────────────
def generate(n_per_intent: int = 120) -> tuple[list, list, list]:
    """
    Returns (quality_data, intent_data, response_data).
    Total samples ≈ n_per_intent × len(INTENT_TEMPLATES) × 3 variants.
    """
    quality_data, intent_data, response_data = [], [], []

    for intent, templates in INTENT_TEMPLATES.items():
        count = 0
        # Cycle through templates repeatedly until n_per_intent reached
        for tmpl, base_score in itertools.cycle(templates):
            if count >= n_per_intent:
                break

            # ── STRONG variant (template as-is) ──────────────────
            strong = fill(tmpl)
            sigs_s = detect_signals(strong)
            sc_s   = score_prompt(strong, base_score)
            resp_s = fill_response(intent)

            quality_data.append({**sigs_s, "prompt": strong, "quality_score": sc_s, "intent": intent})
            intent_data.append({"prompt": strong, "label": intent})
            response_data.append({"prompt": strong, "response": resp_s, "intent": intent})

            # ── MEDIUM variant (partial — drop some signals) ──────
            if base_score > 40:
                med = re.sub(r"you are [^.]+\.", "", strong, flags=re.I).strip()
                med = re.sub(r"format.*?\.", "", med, flags=re.I).strip() or strong
                sigs_m = detect_signals(med)
                sc_m   = score_prompt(med, max(15, base_score - 28))
                quality_data.append({**sigs_m, "prompt": med, "quality_score": sc_m, "intent": intent})
                intent_data.append({"prompt": med, "label": intent})
                response_data.append({"prompt": med, "response": fill_response(intent), "intent": intent})

            # ── WEAK variant ──────────────────────────────────────
            weak   = perturb_weak(strong)
            sigs_w = detect_signals(weak)
            sc_w   = score_prompt(weak, max(5, base_score - 50))
            quality_data.append({**sigs_w, "prompt": weak, "quality_score": sc_w, "intent": intent})
            intent_data.append({"prompt": weak, "label": intent})
            response_data.append({"prompt": weak, "response": fill_response(intent), "intent": intent})

            count += 1

    random.shuffle(quality_data)
    random.shuffle(intent_data)
    random.shuffle(response_data)

    return quality_data, intent_data, response_data


if __name__ == "__main__":
    qd, id_, rd = generate(120)
    print(f"Quality samples : {len(qd)}")
    print(f"Intent samples  : {len(id_)}")
    print(f"Response samples: {len(rd)}")
    print("\nSample quality row:", qd[0])
    print("Sample intent row:", id_[0])