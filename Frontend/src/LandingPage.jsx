import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

// ─── Theme ────────────────────────────────────────────────────────────────────
const S = {
  bg: "#08080F", card: "#0F0F1A",
  silver: "#A8A9AD", silverLt: "#C8C9CC",
  muted: "rgba(255,255,255,0.38)",
  mutedMd: "rgba(255,255,255,0.62)",
  white: "#FFFFFF",
};
function hexToRgb(hex) {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)].join(",");
}

// ─── All 10 Stages ────────────────────────────────────────────────────────────
const STAGES = [
  {
    id:1, icon:"◈", color:"#A8A9AD", glow:"rgba(168,169,173,0.5)",
    title:"Prompt Basics", subtitle:"The foundation of every great prompt",
    desc:"Every interaction with an AI begins with a prompt. This stage deconstructs what a prompt truly is — not just a question, but a precise set of instructions that shapes the model's entire response. You will learn how even minor wording changes cascade into dramatically different outputs, and build the mental model that all advanced techniques rest upon.",
    sections:[
      {
        heading:"What is a Prompt?",
        body:"A prompt is any input — text, image, code, or structured data — passed to a language model. The model predicts the statistically most probable continuation. This means every token you include biases the model's sampling process. A vague prompt produces an averaged, generic response; a precise prompt narrows the probability distribution to exactly what you need.\n\nLanguage models are trained on vast corpora of human-written text. When you write a prompt, you are essentially selecting which region of that learned knowledge to activate. Think of it as a coordinate in a vast conceptual space — the more specific your prompt, the smaller and more targeted the region you activate.",
        example:{ label:"Vague — too broad", text:"Tell me about dogs." },
        example2:{ label:"Precise — targeted", text:"Compare the temperament, exercise needs, and grooming requirements of Golden Retrievers vs Border Collies in a markdown table. Write for first-time dog owners." },
      },
      {
        heading:"The Four-Element Anatomy",
        body:"Every effective prompt contains four building blocks:\n\n1. TASK — The core action verb: Summarise, Compare, Write, Classify, Translate.\n2. CONTEXT — Background that disambiguates the request. Who is the audience? What is the purpose?\n3. FORMAT — The shape of the output: bullet list, JSON, markdown table, numbered steps.\n4. CONSTRAINTS — Limits that prevent drift: max 200 words, no jargon, formal tone.\n\nMissing any one element forces the model to guess — and its guess is rarely yours. Professional prompt engineers treat these four elements as a checklist before every prompt is submitted.",
        example:{ label:"Missing context and format", text:"Explain machine learning." },
        example2:{ label:"All four elements present", text:"TASK: Explain machine learning.\nCONTEXT: For a CFO with no technical background evaluating an AI investment.\nFORMAT: Three short paragraphs — what it is, how it works, why it matters.\nCONSTRAINTS: Avoid math and code. Max 200 words." },
      },
      {
        heading:"Iterative Refinement",
        body:"Professional prompt engineers rarely get results right on the first attempt. They treat prompting as a feedback loop: write → run → identify failure mode → patch the specific weakness → repeat.\n\nCommon failure modes and their targeted fixes:\n• Output too long: Add 'in exactly X words'\n• Wrong tone: Add 'write in the style of [publication]'\n• Missing key points: Explicitly state what must be included\n• Hallucination: Add 'only use facts from the text I provide'\n• Generic answer: Add a concrete scenario or detailed persona\n\nEach iteration should change only one variable so you can isolate which change improved the output.",
        example:{ label:"Iteration 1 — too generic", text:"Write a product description for our app." },
        example2:{ label:"Iteration 3 — refined with all four elements", text:"Write a 60-word App Store description for FocusFlow, a Pomodoro timer app for remote workers. Tone: calm and productive. Lead with the core benefit. End with a soft CTA. No exclamation marks." },
      },
    ],
    tips:["Always include your audience — it changes vocabulary, depth and tone automatically.","The FORMAT element is most commonly omitted — and most impactful when added.","Read the output as if you had never seen your prompt. Would it make sense?","Treat every failed output as a data point revealing a missing constraint."],
    quiz:[
      {q:"What does a language model fundamentally do when given a prompt?",opts:["Searches the internet for an answer","Predicts the most statistically probable continuation","Executes code to compute a result","Retrieves a stored response from a database"],ans:1},
      {q:"Which element of the four-part anatomy specifies the shape of the output?",opts:["Task","Context","Format","Constraints"],ans:2},
      {q:"A prompt missing CONTEXT forces the model to:",opts:["Return an error","Guess, producing a generic averaged response","Ask a clarifying question","Default to bullet points"],ans:1},
      {q:"Which of the following is an example of a CONSTRAINT?",opts:["'Write a product description'","'For a CFO with no technical background'","'Max 150 words, no jargon'","'In three paragraphs'"],ans:2},
      {q:"What is iterative refinement in prompt engineering?",opts:["Running the same prompt multiple times and averaging","Write → run → identify failure → patch → repeat","Adding more words until it works","Using multiple AI models simultaneously"],ans:1},
      {q:"Why does a vague prompt produce a generic response?",opts:["The model has less training data for vague topics","Vague prompts narrow the distribution","Vague prompts leave the distribution wide, activating averaged knowledge","The model ignores vague prompts"],ans:2},
      {q:"Which fix is most appropriate when the model's output is too long?",opts:["Remove all constraints","Add 'in exactly X words'","Switch to a different AI model","Use a shorter input prompt"],ans:1},
      {q:"The TASK element should begin with:",opts:["A noun describing the topic","An action verb like Summarise or Compare","The audience description","The output format"],ans:1},
      {q:"When iterating on a prompt, why should you change only one variable at a time?",opts:["It is faster to generate","It isolates which change improved the output","The model handles fewer changes better","Multiple changes break the API"],ans:1},
      {q:"Which scenario best illustrates the FORMAT element?",opts:["'For a non-technical audience'","'Avoid jargon'","'Present the data as a markdown table with three columns'","'Summarise the quarterly report'"],ans:2},
    ],
  },
  {
    id:2, icon:"◇", color:"#8B9ED4", glow:"rgba(139,158,212,0.5)",
    title:"Role Prompting", subtitle:"Give the AI a calibrated persona",
    desc:"Assigning a role shifts the model's perspective, vocabulary, depth of knowledge, and stylistic register. A prompt prefixed with a credible, specific persona consistently outperforms a bare question — because training data contains text written by domain experts, and invoking a role steers the model toward that subset of knowledge.",
    sections:[
      {
        heading:"Why Roles Work",
        body:"Language models are trained on text produced by humans across every domain. When you specify a role, you activate a cluster of learned patterns associated with how that type of expert writes and reasons. A 'senior network engineer' activates technical vocabulary, structured explanations, and practical caveats. A 'children's book author' activates simple vocabulary, rhythm, and concrete imagery.\n\nThe effect is not cosmetic — the actual content produced changes. Experts hedge differently, sequence information differently, and choose different analogies. By assigning a credible role, you inherit all of that behaviour automatically without needing to specify every detail.",
        example:{ label:"No role — surface-level answer", text:"Explain TCP/IP." },
        example2:{ label:"With role — depth and analogy", text:"You are a senior network engineer teaching a CS undergraduate. Explain TCP/IP using a postal analogy, then show a real-world packet flow for a web page request." },
      },
      {
        heading:"Stacking Roles and Audiences",
        body:"You can compound two roles: an expert identity and an audience description. The model then translates expert knowledge into the appropriate register for the specified reader automatically.\n\nYou can also stack multiple professional perspectives to generate richer analysis. For example, asking for a startup pitch evaluated simultaneously by a VC investor, a technical founder, and a marketing executive produces multi-dimensional feedback in a single prompt.\n\nRole stacking works best when the roles are coherent — asking for an analysis from three conflicting perspectives (e.g., optimist + pessimist + realist) produces genuinely contrasting viewpoints rather than a single homogenised answer.",
        example:{ label:"Expert plus audience", text:"Act as a Harvard economist explaining inflation to a 14-year-old. Use a simple shopping analogy and end with one practical money-saving tip." },
        example2:{ label:"Multi-role critique", text:"Evaluate this startup pitch from three perspectives, clearly labelled:\n1. A Series A venture capitalist focused on market size\n2. A senior software engineer focused on technical feasibility\n3. A growth marketer focused on customer acquisition\n\n[PASTE PITCH]" },
      },
      {
        heading:"Calibrating Role Specificity",
        body:"Role precision directly correlates with output quality. Generic roles produce generic behaviour; specific roles produce specialist behaviour.\n\nSPECIFICITY LADDER (bottom to top):\n• Expert (weakest) → 'a doctor'\n• Domain expert → 'a medical doctor'\n• Specialised expert → 'a board-certified cardiologist'\n• Experienced specialist → 'a senior interventional cardiologist with 15 years in ICU'\n• Contextualised specialist (strongest) → '...who has written clinical guidelines for post-MI care'\n\nEach rung narrows the probability distribution further, producing more precise and authoritative responses. Add institutional context ('at Johns Hopkins') for maximum grounding.",
        example:{ label:"Weak role", text:"You are a marketing expert. Write a tagline." },
        example2:{ label:"Calibrated role", text:"You are an award-winning copywriter with 12 years at Ogilvy, specialising in luxury brand positioning. Write three alternative taglines for a new ultra-premium mineral water brand targeting high-net-worth travellers. Tone: restrained, evocative, aspirational." },
      },
    ],
    tips:["Be specific: 'senior interventional cardiologist' beats 'doctor' by a large margin.","Add the audience role: 'explain to a non-technical Series A investor'.","Add institutional context for maximum authority: 'at McKinsey' or 'at MIT'.","Test the same prompt with three different role specificities — the quality gap will be immediately obvious."],
    quiz:[
      {q:"Why does assigning a role change the model's output beyond just tone?",opts:["The model switches to a different neural network","It activates clusters of learned patterns from how that expert type writes","The API charges different rates for different roles","It increases token limit automatically"],ans:1},
      {q:"What is 'role stacking'?",opts:["Running the same role twice for consistency","Combining an expert identity with an audience description, or multiple expert perspectives","Nesting one role inside another in the system prompt","Adding multiple language constraints"],ans:1},
      {q:"Which role description is most specific and will produce the best results?",opts:["A doctor","A medical professional","A board-certified cardiologist","A senior interventional cardiologist with 15 years in ICU"],ans:3},
      {q:"Specifying an audience role (e.g., 'explain to a 14-year-old') primarily affects:",opts:["The factual accuracy of the response","The vocabulary register and depth of explanation","The response length","The JSON formatting"],ans:1},
      {q:"What does activating a role cluster mean in terms of model behaviour?",opts:["The model searches for role-related content online","The model uses role-specific vocabulary, reasoning patterns and analogies from training data","The model copies text from an expert's website","The model refuses to answer outside the role"],ans:1},
      {q:"Which of the following best illustrates a 'contextualised specialist' role?",opts:["You are a doctor","You are a cardiologist","You are a cardiologist who has authored clinical ICU guidelines","You are an expert in heart health"],ans:2},
      {q:"What is the primary benefit of multi-role critique prompting?",opts:["It reduces generation time","It produces multi-dimensional feedback without running multiple separate prompts","It forces the model to be shorter","It improves grammar"],ans:1},
      {q:"Adding institutional context to a role (e.g., 'at MIT') primarily:",opts:["Restricts the model to MIT-published papers","Grounds the role with specificity, further narrowing the distribution","Causes the model to cite sources","Increases response length"],ans:1},
      {q:"What is the weakest form of role specification?",opts:["A board-certified cardiologist","A senior ICU physician","A doctor","An experienced medical professional"],ans:2},
      {q:"Role prompting works because language models are trained on:",opts:["Structured databases","Expert-annotated datasets only","Vast corpora of human text across every domain, including expert writing","Curated encyclopaedias"],ans:2},
    ],
  },
  {
    id:3, icon:"◆", color:"#C47FA0", glow:"rgba(196,127,160,0.5)",
    title:"Few-Shot Prompting", subtitle:"Teach by example, not instruction",
    desc:"Providing 2–5 input/output examples before your actual request lets the model infer pattern, format and tone without any fine-tuning. Few-shot prompting is one of the highest-leverage techniques available — it communicates what you want through demonstration rather than description, eliminating ambiguity at its source.",
    sections:[
      {
        heading:"Zero-Shot vs Few-Shot",
        body:"Zero-shot asks the model to perform with no examples — relying entirely on its training. Few-shot shows it what 'correct' looks like. The gap in quality is dramatic for structured or stylised outputs because examples communicate implicit constraints that are nearly impossible to articulate in prose.\n\nFew-shot examples operate as implicit formatting templates, implicit tone guides, and implicit coverage criteria simultaneously. A single well-chosen example often eliminates three separate constraint lines from your prompt.",
        example:{ label:"Zero-shot — ambiguous", text:"Classify the sentiment: 'The queue was endless but staff were lovely.'" },
        example2:{ label:"Few-shot — pattern established", text:"'Great food!' → Positive\n'Waited 40 min with no update.' → Negative\n'Decent, nothing special.' → Neutral\n'The queue was endless but staff were lovely.' → ?" },
      },
      {
        heading:"Choosing High-Quality Examples",
        body:"Examples should be chosen strategically, not randomly. The most common mistake is selecting only easy, unambiguous cases — the model already handles those. Your examples should cover:\n\n1. EDGE CASES — Scenarios where the correct answer is not immediately obvious.\n2. NUANCE — Cases that require judgment, like mixed sentiment or conditional logic.\n3. FORMAT VARIATION — Examples that demonstrate how to handle formatting edge cases.\n4. FAILURE-PRONE PATTERNS — The specific cases where zero-shot fails.\n\nOrder matters: place the most complex or nuanced example last, immediately before the actual query. Recency bias means the final example has the strongest influence on the response.",
        example:{ label:"Weak examples — too obvious", text:"'This product is excellent!' → Positive\n'The worst purchase of my life.' → Negative\n[Query] 'The design is clever but it breaks in a week.' → ?" },
        example2:{ label:"Strong examples — edge cases covered", text:"'Not bad, I suppose.' → Neutral (hedged positive)\n'I cannot believe how badly this failed.' → Negative (hyperbolic)\n'Beautiful packaging, shame about the product.' → Negative (mixed, product dominant)\n[Query] 'The design is clever but it breaks in a week.' → ?" },
      },
      {
        heading:"Format Consistency Across Examples",
        body:"Identical formatting across all examples is not optional — it is critical. Any formatting inconsistency between examples confuses the model about which format is normative and which is a variant. This is especially important for:\n\n• Delimiter consistency (colons vs em-dashes vs brackets)\n• Capitalisation patterns\n• Label placement (before or after the content)\n• Whitespace and line breaks\n\nIf your actual query has different formatting from the examples, the model may attempt to 'correct' its output to match the query format instead of the example format — producing inconsistent results. Always make the query format match the example format exactly.",
        example:{ label:"Inconsistent formatting — confusing", text:"Input: 'Hello' - Translation: 'Hola'\nInput: 'Goodbye' → Spanish: 'Adios'\nInput: 'Thank you' | Result: 'Gracias'\nTranslate: 'Please'" },
        example2:{ label:"Consistent formatting — clear pattern", text:"Input: 'Hello' → Spanish: 'Hola'\nInput: 'Goodbye' → Spanish: 'Adios'\nInput: 'Thank you' → Spanish: 'Gracias'\nInput: 'Please' → Spanish:" },
      },
    ],
    tips:["Three examples is usually the sweet spot — two is often too few, five is often unnecessary.","Order matters: put the trickiest, most nuanced example immediately before the query.","Keep formatting identical across all examples — any inconsistency becomes ambiguity.","Choose examples from failure cases, not success cases — you already handle those."],
    quiz:[
      {q:"What is the core mechanism behind few-shot prompting?",opts:["The model downloads examples from the internet","The model infers pattern, format and tone from demonstrations","The model copies the examples verbatim","The examples override the model's training"],ans:1},
      {q:"Why do few-shot examples communicate more efficiently than constraint descriptions?",opts:["They use fewer tokens","They communicate implicit constraints in format, tone and coverage simultaneously","They are easier for the model to parse","They bypass the system prompt"],ans:1},
      {q:"What is 'recency bias' in few-shot ordering?",opts:["The model prefers recent training data","The final example before the query has the strongest influence on the response","The model ignores early examples","Recent examples are weighted by timestamp"],ans:1},
      {q:"Which type of example is most strategically valuable to include?",opts:["The easiest, most obvious case","A clearly positive or clearly negative case","An edge case that zero-shot typically fails on","A case with the shortest possible output"],ans:2},
      {q:"What is the danger of formatting inconsistency across few-shot examples?",opts:["The model runs out of context window","The model becomes confused about which format is normative","The model refuses to answer","The API returns an error"],ans:1},
      {q:"In a 3-example few-shot setup, where should the most complex example be placed?",opts:["First, to set the tone","Second, in the middle","Third, immediately before the actual query","Order does not matter"],ans:2},
      {q:"Few-shot prompting is most valuable when:",opts:["The task is simple and well-defined","Zero-shot already performs well","The output requires stylised, structured, or nuanced formatting that is hard to describe","You want shorter responses"],ans:2},
      {q:"How many examples is typically the sweet spot for few-shot prompting?",opts:["1","3","7","10"],ans:1},
      {q:"What makes a 'weak' few-shot example?",opts:["It is too long","It covers an edge case","It is an obvious, unambiguous case that zero-shot already handles correctly","It uses different vocabulary from the query"],ans:2},
      {q:"If your query has different formatting from your examples, the model may:",opts:["Ignore the formatting difference","Ask for clarification","Attempt to 'correct' its output to match the query format instead of the example format","Return an error"],ans:2},
    ],
  },
  {
    id:4, icon:"⬡", color:"#7BC4A0", glow:"rgba(123,196,160,0.5)",
    title:"Chain of Thought", subtitle:"Make the AI reason step-by-step",
    desc:"Adding 'Think step by step' or demonstrating a worked reasoning chain dramatically improves accuracy on mathematics, logic, and multi-step tasks. Chain-of-thought prompting forces the model to externalise its reasoning process, where each intermediate step conditions the next — reducing compounding errors and making the reasoning auditable.",
    sections:[
      {
        heading:"Why Step-by-Step Reasoning Works",
        body:"Without chain-of-thought, the model compresses multi-step reasoning into a single forward pass — a fundamentally different (and inferior) computational process compared to explicit step generation. When steps are written out, each generated token becomes context for the next, allowing the model to 'think' through problems rather than guess at answers.\n\nThe performance improvement is especially large for:\n• Multi-step arithmetic (where single-step answers compound errors)\n• Logical deduction chains (where each premise depends on the previous)\n• Commonsense reasoning tasks (where implicit assumptions need surfacing)\n• Code debugging (where identifying the error location precedes fixing it)\n\nThe mechanism is simple: externalising the reasoning process converts a classification problem (predict the answer) into a generation problem (generate the path to the answer).",
        example:{ label:"Without CoT — single-step, error-prone", text:"Q: A train travels 60km/h for 2.5 hours, then 80km/h for 1.5 hours. Total distance?\nA: 270km" },
        example2:{ label:"With CoT — each step conditions the next", text:"Q: A train travels 60km/h for 2.5h, then 80km/h for 1.5h. Think step by step.\nStep 1: Segment 1 distance = 60 × 2.5 = 150km\nStep 2: Segment 2 distance = 80 × 1.5 = 120km\nStep 3: Total = 150 + 120 = 270km\nAnswer: 270km" },
      },
      {
        heading:"Zero-Shot CoT and Structured Variants",
        body:"Zero-Shot CoT simply appends 'Let's think step by step.' to any question — triggering chain-of-thought behaviour without requiring example reasoning chains. This is remarkably powerful for a two-sentence addition.\n\nVariants that outperform the basic trigger:\n1. STEP-NUMBERED CoT: 'List your reasoning as numbered steps before answering.'\n2. SCRATCHPAD CoT: 'Show all working in <scratch> tags, then give the final answer outside the tags.'\n3. VERIFICATION CoT: 'After answering, verify your answer by checking it from a different angle.'\n4. PLAN-EXECUTE CoT: 'First create a plan for how you will answer, then execute each step.'\n\nThe scratchpad variant is particularly powerful for reducing hallucination — it forces the model to commit its assumptions to text where they become visible and correctable.",
        example:{ label:"Zero-Shot CoT trigger", text:"Is 1,997 a prime number? Let's think step by step." },
        example2:{ label:"Scratchpad variant", text:"Analyse the strategic implications of this merger for the acquirer.\n\n<scratch>\n[Work through market position, synergies, integration risk, and financial impact here]\n</scratch>\n\nStrategic assessment:" },
      },
      {
        heading:"CoT for Complex Multi-Domain Problems",
        body:"Chain-of-thought becomes indispensable for problems that span multiple domains or require integrating information from different parts of a long document. By forcing each reasoning step to be explicit, CoT makes it possible to identify exactly where a reasoning chain goes wrong — enabling surgical correction rather than wholesale prompt rewriting.\n\nFor code debugging, a structured CoT prompt decomposes the problem into: (1) identify what the code is supposed to do, (2) trace through the actual execution, (3) identify the divergence point, (4) formulate the fix, (5) verify the fix does not break other functionality.\n\nThis mirrors how expert engineers debug — the structured decomposition is the skill, and CoT transfers that structure to the model.",
        example:{ label:"Unstructured debugging request", text:"Why is my Python function returning None instead of the sum?" },
        example2:{ label:"CoT-structured debugging", text:"Debug this Python function using these steps:\n1. State what the function is supposed to do\n2. Trace the actual execution path line by line\n3. Identify exactly where the logic diverges from the intent\n4. Provide the corrected code\n5. Confirm the fix does not affect other functionality\n\n[PASTE CODE]" },
      },
    ],
    tips:["'Let's think step by step.' is the single highest-ROI addition to any analytical prompt.","Use scratchpad tags for complex reasoning — they make assumptions visible and correctable.","For maths and logic, require the model to verify its answer using a second method.","The quality of CoT is proportional to step granularity — more specific steps produce more reliable chains."],
    quiz:[
      {q:"What is the core mechanism that makes chain-of-thought prompting effective?",opts:["It gives the model more time to think","Each generated reasoning step becomes context that conditions the next step","It bypasses token limits","It connects to external calculation tools"],ans:1},
      {q:"What is 'Zero-Shot CoT'?",opts:["CoT with zero examples required","Appending 'Let's think step by step.' without providing any worked examples","CoT that produces zero errors","A CoT prompt with zero constraints"],ans:1},
      {q:"Which task type benefits most from chain-of-thought prompting?",opts:["Simple factual lookup","Single-step classification","Multi-step arithmetic or logical deduction chains","Short creative writing"],ans:2},
      {q:"What is the 'scratchpad variant' of CoT?",opts:["A notepad integration","Showing all working in designated tags before giving the final answer","A prompt that generates a PDF","CoT applied to image analysis"],ans:1},
      {q:"Why does CoT reduce hallucination?",opts:["It limits response length","It forces assumptions to be committed to text where they become visible and correctable","It bypasses the model's creative tendencies","It uses a different model architecture"],ans:1},
      {q:"The 'verification CoT' variant asks the model to:",opts:["Run the prompt twice","After answering, verify the answer by checking it from a different angle","Verify that the prompt is well-formed","Ask the user to confirm the answer"],ans:1},
      {q:"Without CoT, multi-step reasoning is compressed into:",opts:["A database lookup","Multiple API calls","A single forward pass, which compounds errors","A structured JSON output"],ans:2},
      {q:"Plan-Execute CoT differs from standard CoT by:",opts:["Using fewer steps","First generating a plan before executing each step","Adding examples before the reasoning","Using a different trigger phrase"],ans:1},
      {q:"For code debugging, which CoT structure mirrors how expert engineers work?",opts:["Guess and check","Intent → Execution trace → Divergence identification → Fix → Verification","Generate → Test → Discard","Explain → Rewrite → Run"],ans:1},
      {q:"The performance improvement from CoT is LARGEST for which of these tasks?",opts:["Translating a sentence between languages","Summarising a short paragraph","Solving a multi-step word problem requiring integration of several facts","Classifying an email as spam or not spam"],ans:2},
    ],
  },
  {
    id:5, icon:"✦", color:"#E8A87C", glow:"rgba(232,168,124,0.5)",
    title:"Instruction Tuning", subtitle:"Constraints that sharpen and discipline output",
    desc:"Explicit constraints, length limits, output schemas, and do/don't rules prevent the model from rambling, hallucinating, or drifting from the required format. Instruction tuning transforms a capable but undisciplined model into a reliable production component — the difference between a talented generalist and a trained specialist.",
    sections:[
      {
        heading:"Hard and Soft Constraints",
        body:"Constraints come in two categories with very different enforcement characteristics:\n\nHARD CONSTRAINTS are non-negotiable rules the output must satisfy:\n• 'Do not mention competitor products by name'\n• 'The response must be exactly 100 words'\n• 'Return only valid JSON — no prose'\n• 'Never use passive voice'\n\nSOFT CONSTRAINTS are strong preferences that improve quality but tolerate exceptions:\n• 'Prefer active voice'\n• 'Favour concrete nouns over abstract ones'\n• 'Lead with the most important information'\n\nHard constraints should be stated using imperative language: DO, DO NOT, MUST, NEVER. Soft constraints use preference language: 'prefer', 'favour', 'when possible'. Mixing the two dilutes hard constraints — the model may treat a 'NEVER' as a 'when possible' if the list contains both.",
        example:{ label:"Unconstrained — unpredictable output", text:"Write a bio for our CEO." },
        example2:{ label:"Hard and soft constraints applied", text:"Write a 90-word third-person bio for our CEO, Dr. Sarah Chen.\n\nHARD RULES:\n- MUST be exactly 90 words\n- DO NOT mention revenue or valuation figures\n- NEVER use first person\n\nSOFT PREFERENCES:\n- Prefer active verbs over passive constructions\n- Lead with her professional achievement\n- End with a personal detail that humanises her" },
      },
      {
        heading:"Output Schema Control",
        body:"Specifying a precise output schema is the single most powerful technique for making AI output programmatically usable. When the model knows exactly what structure is expected, it stops making formatting decisions — and formatting decisions are a major source of inconsistency.\n\nSchema control techniques in increasing strictness:\n1. PROSE DESCRIPTION: 'Return three sections: Summary, Key Points, and Recommendation'\n2. MARKDOWN TEMPLATE: Provide the exact headers and placeholders filled in\n3. JSON SCHEMA: Specify field names, types, and constraints explicitly\n4. EXAMPLE OUTPUT: Show the exact output structure with dummy data\n\nFor production systems, always combine JSON schema with 'Return ONLY valid JSON — no markdown backticks, no prose outside the JSON object.'",
        example:{ label:"Prose description — inconsistent", text:"Return a summary with the key points and your recommendation." },
        example2:{ label:"JSON schema — reliable", text:"Return ONLY valid JSON matching this exact schema. No text outside the JSON object:\n{\n  \"title\": string,\n  \"summary\": string (max 30 words),\n  \"key_points\": string[] (exactly 3 items),\n  \"recommendation\": string,\n  \"confidence\": \"high\" | \"medium\" | \"low\"\n}" },
      },
      {
        heading:"Preventing Hallucination with Grounding Instructions",
        body:"Hallucination — the generation of plausible-sounding but false information — is the most significant reliability risk in deployed AI systems. Instruction tuning provides several proven countermeasures:\n\n1. SOURCE RESTRICTION: 'Answer using only information explicitly stated in the provided document. Do not use external knowledge.'\n2. UNCERTAINTY EXPRESSION: 'If you are not certain of a fact, state your uncertainty explicitly rather than guessing.'\n3. CITATION REQUIREMENT: 'Every factual claim must be followed by the sentence in the source document that supports it.'\n4. HALLUCINATION GATE: 'If the answer to the question is not found in the document, respond only with: INSUFFICIENT INFORMATION.'\n\nCombining source restriction with a hallucination gate virtually eliminates confabulation for document-grounded tasks.",
        example:{ label:"No grounding — hallucination risk", text:"What were the company's revenue figures for Q3 2023?\n[Document attached]" },
        example2:{ label:"Grounded with hallucination gate", text:"Using ONLY information explicitly stated in the document below, answer the question.\nIf the answer is not found in the document, respond ONLY with: INSUFFICIENT INFORMATION.\nDo not use any external knowledge or make inferences beyond what is written.\n\nQuestion: What were the company's revenue figures for Q3 2023?\n\n[DOCUMENT]\n..." },
      },
    ],
    tips:["List all hard constraints in a numbered 'RULES' block before the task — it forces the model to process them as a checklist.","Repeat the single most critical constraint at the end of the prompt — recency bias reinforces it.","UPPERCASE hard constraints — empirical testing shows it reduces violation rates.","Test your constraints by deliberately trying to violate them — if you can, so can the model."],
    quiz:[
      {q:"What distinguishes a HARD constraint from a SOFT constraint?",opts:["Hard constraints are longer","Hard constraints are non-negotiable rules; soft constraints are preferences","Hard constraints use more tokens","Soft constraints cannot be violated"],ans:1},
      {q:"Which language is most appropriate for a hard constraint?",opts:["'Please try to avoid...'","'Prefer...'","'DO NOT mention competitor products by name'","'It would be ideal if...'"],ans:2},
      {q:"What is the most reliable technique for making AI output programmatically usable?",opts:["Requesting a summary","Asking for bullet points","Specifying a precise JSON output schema","Using chain-of-thought"],ans:2},
      {q:"What does 'Return ONLY valid JSON — no markdown backticks, no prose outside the JSON object' prevent?",opts:["Hallucination","Format drift that breaks downstream JSON parsers","Overly long responses","The model from refusing the task"],ans:1},
      {q:"A 'hallucination gate' instruction does what?",opts:["Blocks the model from creative tasks","Requires the model to respond with a specific phrase when the answer is not in the document","Restricts the model to 50 words","Forces citation of sources"],ans:1},
      {q:"Why should hard and soft constraints be listed separately?",opts:["To save tokens","Mixing them dilutes hard constraints — the model may treat a MUST as a preference","Separate lists are easier to read","The model cannot process mixed constraint lists"],ans:1},
      {q:"Which schema technique provides the strictest output control?",opts:["Prose description","Markdown template","JSON schema with explicit field types","Numbered list"],ans:2},
      {q:"Source restriction ('Answer only from the provided document') primarily addresses which risk?",opts:["Response length","Hallucination and confabulation of facts","Tone inconsistency","JSON parsing errors"],ans:1},
      {q:"Repeating the most critical constraint at the END of a prompt exploits which cognitive phenomenon?",opts:["Primacy bias","Recency bias","Availability heuristic","Anchoring"],ans:1},
      {q:"Which combination virtually eliminates confabulation for document-grounded tasks?",opts:["Role prompting plus few-shot","Chain-of-thought plus role","Source restriction plus hallucination gate","JSON schema plus few-shot"],ans:2},
    ],
  },
  {
    id:6, icon:"⟡", color:"#9B8ED4", glow:"rgba(155,142,212,0.5)",
    title:"Prompt Chaining", subtitle:"Pipelines of connected, purposeful prompts",
    desc:"Complex tasks that require fundamentally different cognitive modes — research vs synthesis, outlining vs prose writing, generation vs critique — should be decomposed into sequential prompts where each output feeds the next. Prompt chaining mirrors expert human workflows and produces dramatically superior results compared to monolithic prompts attempting to do everything at once.",
    sections:[
      {
        heading:"When to Chain and Why",
        body:"A single prompt asking a model to simultaneously research, outline, write, and proofread a 2,000-word article is asking it to excel at four fundamentally different tasks in one pass. The model allocates attention across all four, excelling at none.\n\nChaining is the correct architecture when:\n1. The task requires switching cognitive modes (e.g., analysis → creative → critique)\n2. The output of one step needs validation before it is used as input to the next\n3. The task is long enough that context window constraints become a concern\n4. You need transparency into intermediate steps for quality control\n5. Different steps might require different models or temperature settings\n\nThe chain is most powerful when there is a validation or critique step between generation and use — human or AI review of intermediate outputs catches errors before they compound.",
        example:{ label:"Monolithic — fragile, mediocre", text:"Research, outline, write and proofread a 1,500-word article on quantum computing for business executives. Make it engaging and accurate." },
        example2:{ label:"Chained — controlled, high quality", text:"Prompt 1: List 8 key quantum computing concepts relevant to business strategy, with a one-sentence plain-English definition for each.\nPrompt 2: Create a 6-section article outline using exactly those 8 concepts. For each section, specify the key argument, the supporting evidence, and the business implication.\nPrompt 3: Write each section (250 words each) following the outline precisely.\nPrompt 4: Proofread for jargon, passive voice, and claims unsupported by the outline." },
      },
      {
        heading:"State Management and Variable Injection",
        body:"Language models have no memory between separate API calls. Every piece of state — every intermediate output — must be explicitly passed as context in the next call. This is the most common source of chaining failures: engineers assume the model 'remembers' previous outputs when it does not.\n\nBest practices for state management:\n1. EXPLICIT INJECTION: Always paste the previous output verbatim into the next prompt.\n2. NAMED VARIABLES: Label each intermediate output with a variable name in your code before passing it on.\n3. CONTEXT SUMMARISATION: For very long chains, summarise earlier outputs to prevent context window overflow.\n4. VERSIONING: Keep a log of each step's input and output for debugging.\n5. ASSERTION CHECKS: Before passing an output to the next step, programmatically verify it meets minimum quality criteria (correct JSON, expected length, required fields present).",
        example:{ label:"State injection template", text:"Here is the outline produced in the previous step:\n\n[PASTE OUTLINE HERE]\n\nNow write the Introduction section in 200 words, matching the logical flow of the outline. Do not add points not present in the outline." },
        example2:{ label:"Dynamic variable injection (code template)", text:"// In your application code:\nconst outline = await callClaude(outlinePrompt);\nconst draftPrompt = `\nOutline:\n${outline}\n\nWrite the Introduction section following this outline precisely.\n`;\nconst draft = await callClaude(draftPrompt);" },
      },
      {
        heading:"Critique-and-Refine Chains",
        body:"One of the most powerful chaining patterns is the Critique-and-Refine loop, which mirrors professional editing and peer review processes:\n\n1. GENERATE: Produce an initial draft with a generation prompt.\n2. CRITIQUE: A separate prompt analyses the draft against explicit criteria, identifying specific weaknesses.\n3. REFINE: A third prompt takes the original draft AND the critique, and produces an improved version.\n4. VERIFY: An optional fourth prompt confirms the refinements were applied correctly.\n\nThe critique step is most effective when it is given specific evaluation criteria rather than a general 'is this good?' instruction. The criteria should mirror your actual quality standards: logical consistency, factual accuracy, tone, format compliance, and coverage.",
        example:{ label:"Generation prompt (Step 1)", text:"Write a 200-word executive summary of this research report:\n[REPORT]" },
        example2:{ label:"Critique prompt (Step 2)", text:"Evaluate this executive summary against these criteria:\n1. Does it state the core finding in the first sentence?\n2. Are all numbers from the original report present and accurate?\n3. Is the tone appropriate for a C-suite audience?\n4. Is it exactly 200 words?\n\nFor each criterion, state: PASS or FAIL, and if FAIL, explain the specific issue.\n\n[PASTE SUMMARY]" },
      },
    ],
    tips:["Map your chain as a flowchart before writing a single prompt — the architecture clarifies the logic.","Always include a validation step between generation and downstream use.","Language models have no memory between API calls — always inject state explicitly.","The critique step is most valuable when given specific, measurable evaluation criteria."],
    quiz:[
      {q:"What is the primary reason to use prompt chaining instead of a single monolithic prompt?",opts:["To save on API costs","Different cognitive modes (analysis, writing, critique) are handled better in dedicated prompts","To make the prompt shorter","To use different models"],ans:1},
      {q:"Language models have no memory between API calls. What must you always do?",opts:["Use the same system prompt","Explicitly inject the previous output as context in the next prompt","Ask the model to remember","Use persistent storage in the API"],ans:1},
      {q:"What is the 'Critique-and-Refine' chaining pattern?",opts:["Generate → Critique → Refine (and optionally Verify)","Write → Delete → Rewrite","Plan → Execute → Summarise","Research → Outline → Draft"],ans:0},
      {q:"An 'assertion check' in a prompt chain does what?",opts:["Checks that the API key is valid","Programmatically verifies the output meets minimum quality criteria before passing to the next step","Checks the prompt for grammar errors","Validates the user's identity"],ans:1},
      {q:"Which scenario is the BEST candidate for prompt chaining?",opts:["Translating a 10-word phrase","Classifying a single email","Writing, editing, and fact-checking a 3,000-word research article","Generating a product tagline"],ans:2},
      {q:"'Context summarisation' in long chains is used to:",opts:["Improve response quality","Prevent context window overflow from earlier outputs","Speed up API calls","Reduce costs"],ans:1},
      {q:"The critique step in a Critique-and-Refine chain is most effective when:",opts:["It asks 'Is this good?'","It is given specific, measurable evaluation criteria","It is written by the same prompt as the generation step","It is optional and skipped in production"],ans:1},
      {q:"Why is chaining most powerful when different steps use different temperature settings?",opts:["Lower temperatures reduce costs","Different tasks need different levels of creativity vs determinism — analysis benefits from low temperature, brainstorming from high","The API requires different temperatures for different models","High temperature is required for JSON output"],ans:1},
      {q:"What does 'versioning' mean in the context of prompt chain debugging?",opts:["Using version 4 of the model","Keeping a log of each step's input and output","Labelling prompt versions with semantic version numbers","Tracking API version changes"],ans:1},
      {q:"A validation step between generation and downstream use primarily prevents:",opts:["Long responses","Errors in one step from compounding in subsequent steps","API rate limiting","Context window overflow"],ans:1},
    ],
  },
  {
    id:7, icon:"◉", color:"#D4A574", glow:"rgba(212,165,116,0.5)",
    title:"Self-Consistency", subtitle:"Majority-vote reasoning across independent paths",
    desc:"Generate multiple independent completions for the same question and select the most frequent answer. This ensemble approach exploits the stochastic nature of language model inference — different reasoning paths sometimes reach different conclusions, and the majority answer is significantly more reliable than any single completion. Error rates drop 10–30% on reasoning-intensive tasks.",
    sections:[
      {
        heading:"The Statistical Foundation",
        body:"Language models are non-deterministic: the same prompt at temperature > 0 produces a slightly different output on each run. This variance is usually treated as a nuisance, but self-consistency turns it into an asset.\n\nIf the model has a 75% per-run accuracy on a task, then:\n• 1 run: 75% accuracy\n• 3 runs, majority vote: ~84% accuracy\n• 5 runs, majority vote: ~90% accuracy\n\nThe improvement compounds because different incorrect runs tend to fail in different ways — their errors are diverse and uncorrelated. Correct reasoning paths, however, tend to converge on the same answer. The majority vote therefore systematically selects correct reasoning over incorrect reasoning.\n\nSelf-consistency is most powerful for tasks with determinate correct answers: mathematics, logic, factual lookups, and structured classification.",
        example:{ label:"Single-run risk — confident error", text:"[Run 1] The answer is 42. [Stated with full confidence, but incorrect]" },
        example2:{ label:"Self-consistency — convergence on truth", text:"Run 1: → 84\nRun 2: → 84\nRun 3: → 83\nRun 4: → 84\nRun 5: → 84\nMajority vote: 84 (4/5 agreement — high confidence)" },
      },
      {
        heading:"Single-Call Self-Consistency",
        body:"Running five separate API calls is expensive. A single-call approximation achieves similar results by instructing the model to generate multiple reasoning paths within one response:\n\n'Solve this problem using 3 independent methods. Show each method's full working. Then state the answer that appears most frequently across your methods.'\n\nThis is less powerful than true multi-sampling (because the methods are not fully independent within a single context window) but provides a strong improvement over single-path reasoning at minimal cost. It also has an important secondary benefit: the model's reasoning is forced to be explicit across all paths, making errors easy to spot.",
        example:{ label:"Single-call SC prompt", text:"Solve this maths problem using 3 independent methods. Label each METHOD A, METHOD B, METHOD C. Show all working for each. After completing all three, state: 'Most frequent answer: X' where X is the answer appearing most often." },
        example2:{ label:"Output demonstrating convergence", text:"METHOD A (algebraic): ... = 1,260\nMETHOD B (unit analysis): ... = 1,260\nMETHOD C (estimation + correction): ... = 1,255\n\nMost frequent answer: 1,260 (2/3 methods agree — verify METHOD C for arithmetic error)" },
      },
      {
        heading:"Universal Verifier and Disagreement Analysis",
        body:"A more sophisticated variant adds a VERIFIER step after the multiple reasoning paths are generated. The verifier is given all paths and instructed to identify which reasoning is correct — not just which answer appears most frequently.\n\nThis matters because majority voting can fail when two incorrect methods produce the same wrong answer while one correct method produces a different (correct) answer. The verifier catches this failure mode.\n\nDisagreement between runs is also valuable data: it signals either prompt ambiguity, a genuine boundary case in the model's knowledge, or a task that requires external verification. Logging disagreements and investigating them is one of the most efficient ways to improve both your prompts and your understanding of model capabilities.",
        example:{ label:"Verifier prompt (added after SC paths)", text:"Here are three independent solution attempts to the same problem:\n[PASTE ALL THREE METHODS]\n\nYour task:\n1. Identify which reasoning path is logically correct and which contain errors.\n2. State the correct answer with a brief justification.\n3. If all paths are incorrect, state that explicitly." },
        example2:{ label:"Using disagreement as diagnostic", text:"Disagreement detected: Method A → 840, Method B → 840, Method C → 924.\nDiagnosis: Method C likely has an error in step 3 (multiplication of 22 × 42 = 924 is wrong; correct is 22 × 42 = 924... verifying: 20×42=840, 2×42=84, total=924 — Method C is correct).\nRevised majority: 924." },
      },
    ],
    tips:["Use temperature 0.7–1.0 to ensure genuine path diversity between runs.","For factual Q&A, 3 runs is usually sufficient; for complex maths, use 5+.","Log disagreements — they are diagnostics revealing prompt ambiguity or knowledge boundaries.","Single-call SC is often good enough for production — full multi-sampling for high-stakes tasks only."],
    quiz:[
      {q:"Self-consistency exploits which property of language model inference?",opts:["The model's memory of previous conversations","The stochastic (non-deterministic) nature of generation at temperature > 0","The model's ability to access external databases","Structured output parsing"],ans:1},
      {q:"Why do errors across different runs tend to be uncorrelated in self-consistency?",opts:["The model uses different training data each run","Different incorrect reasoning paths fail in different ways, while correct paths converge","The temperature setting ensures diversity","The model deliberately introduces different errors"],ans:1},
      {q:"Self-consistency is MOST effective for which task type?",opts:["Open-ended creative writing","Tasks with determinate correct answers: maths, logic, structured classification","Long-form essay generation","Language translation"],ans:1},
      {q:"In the 5-run majority vote scenario, if per-run accuracy is 75%, the combined accuracy is approximately:",opts:["75%","80%","90%","99%"],ans:2},
      {q:"What is the key limitation of single-call self-consistency vs true multi-sampling?",opts:["It costs more tokens","The reasoning paths are not fully independent within a single context window","It only works for maths problems","The model refuses to use multiple methods"],ans:1},
      {q:"A 'Universal Verifier' step is added after SC paths to address what failure mode?",opts:["When all paths agree but none are correct","When two incorrect methods produce the same wrong answer while one correct method gives a different answer","When the majority vote is ambiguous","When the model runs out of context"],ans:1},
      {q:"What does persistent disagreement between SC runs indicate?",opts:["A bug in the API","Model laziness","Either prompt ambiguity, a genuine knowledge boundary, or a task requiring external verification","That more examples are needed"],ans:2},
      {q:"Which temperature range is recommended for self-consistency to ensure genuine path diversity?",opts:["0 (fully deterministic)","0.1–0.3 (low variance)","0.7–1.0","Above 1.0"],ans:2},
      {q:"The single-call SC prompt asks the model to:",opts:["Return the same answer three times","Generate multiple independent reasoning paths within one response, then vote on the most frequent answer","Use three different AI models","Answer in three different languages"],ans:1},
      {q:"What is the primary advantage of logging SC disagreements in a production system?",opts:["It reduces API costs","It provides diagnostics for prompt ambiguity and model capability boundaries","It improves response speed","It enables automatic model retraining"],ans:1},
    ],
  },
  {
    id:8, icon:"◎", color:"#6EC6D4", glow:"rgba(110,198,212,0.5)",
    title:"Tree of Thoughts", subtitle:"Multi-path deliberate reasoning",
    desc:"Tree of Thoughts (ToT) extends chain-of-thought by generating multiple candidate reasoning steps at each decision point, evaluating them, and selectively expanding the most promising branches — analogous to how chess engines explore move trees. This turns problem-solving into a structured search rather than a linear narrative.",
    sections:[
      {
        heading:"The Architecture of Thought Trees",
        body:"In standard CoT, reasoning is a linear sequence: Thought 1 → Thought 2 → Thought 3 → Answer. In Tree of Thoughts, reasoning is a branching tree:\n\n• ROOT: The problem statement\n• BRANCHES: Multiple candidate thoughts at each level (typically 3–5)\n• EVALUATION: Each candidate thought is scored or ranked\n• SELECTION: The highest-scoring thought is expanded\n• BACKTRACKING: If a branch leads to a dead end, the algorithm backtracks to the best unexplored branch\n• LEAVES: Terminal nodes where an answer is reached\n\nThis architecture allows the model to explore promising directions, abandon poor ones, and recover from reasoning errors that would otherwise propagate in a linear chain.",
        example:{ label:"Linear CoT — cannot backtrack", text:"Step 1: Assume the variable is positive → Step 2: Derive formula A → Step 3: Answer X [If Step 1 was wrong, the entire chain is wrong with no recovery]" },
        example2:{ label:"Tree of Thoughts — branching and evaluation", text:"From the problem: Consider 3 approaches:\nApproach A (algebraic): promising score 8/10\nApproach B (geometric): promising score 6/10\nApproach C (trial-and-error): promising score 3/10\n\nExpand Approach A: leads to sub-problem P1...\n[Evaluate P1 solutions, select best, continue expanding]" },
      },
      {
        heading:"Implementing ToT in a Prompt",
        body:"Full ToT requires programmatic orchestration — typically a loop in your application code. However, a single-prompt approximation captures most of the benefit:\n\nSTAGE 1 — GENERATION: 'Generate 4 distinctly different approaches to this problem. For each approach, write 2 sentences explaining the reasoning direction.'\n\nSTAGE 2 — EVALUATION: 'Rate each approach on: (a) likelihood of reaching a correct answer, (b) computational tractability, (c) coverage of the problem's edge cases. Score 1–10 for each criterion.'\n\nSTAGE 3 — SELECTION: 'Select the highest-scoring approach and solve the problem using it, showing all steps.'\n\nSTAGE 4 — VERIFICATION: 'Verify the solution handles the edge cases identified in Stage 2.'",
        example:{ label:"Single-prompt ToT structure", text:"STAGE 1: Generate 4 different approaches to [PROBLEM]. For each, describe the reasoning direction in 2 sentences.\n\nSTAGE 2: Score each approach 1-10 for: correctness likelihood, tractability, edge case coverage. Show scoring.\n\nSTAGE 3: Solve using the top-scoring approach, with full step-by-step reasoning.\n\nSTAGE 4: Verify by testing the solution against 2 edge cases." },
        example2:{ label:"Programmatic ToT loop (Python pseudocode)", text:"thoughts = generate_thoughts(problem, n=4)\nscores = evaluate_thoughts(thoughts)\nbest = select_best(thoughts, scores)\nsolution = expand_thought(best)\nif is_dead_end(solution):\n    next_best = backtrack(thoughts, scores, exclude=best)\n    solution = expand_thought(next_best)\nfinal_answer = verify(solution)" },
      },
      {
        heading:"ToT vs CoT: When to Use Each",
        body:"ToT has higher computational cost (more generation, more evaluation) than CoT. It is worth this cost only when:\n\n1. The problem space is large enough that the first reasoning direction is unlikely to be optimal.\n2. The problem has clearly identifiable dead ends that would waste linear reasoning.\n3. The task is a planning or puzzle problem where backtracking is a natural cognitive operation.\n4. The cost of an incorrect answer is high enough to justify the compute overhead.\n\nTasks that benefit MOST from ToT:\n• Multi-step puzzle solving (logic grids, Sudoku, crossword construction)\n• Mathematical proof construction\n• Strategic planning with multiple viable approaches\n• Creative constraint satisfaction (writing a story satisfying 10 specific requirements)\n\nFor most everyday tasks, CoT with single-call self-consistency achieves 90% of ToT's benefit at 20% of the cost.",
        example:{ label:"Use CoT — problem is linear", text:"Calculate the compound interest on £5,000 at 4.5% over 7 years, compounded monthly." },
        example2:{ label:"Use ToT — problem has branching strategy space", text:"Design a marketing campaign for a luxury EV brand launching in India. The campaign must: reach tier-1 and tier-2 cities, respect cultural sensitivities around wealth display, differentiate from existing EV brands, fit within a ₹50 crore budget, and launch in 90 days." },
      },
    ],
    tips:["Use ToT for problems where the first reasoning direction is unlikely to be optimal.","A single-prompt ToT approximation (Generate → Score → Solve → Verify) captures 80% of full ToT benefit.","ToT is especially powerful for constraint satisfaction problems with multiple competing requirements.","Always include a backtracking trigger: 'If this approach reaches a dead end, backtrack and try the second-ranked approach.'"],
    quiz:[
      {q:"How does Tree of Thoughts differ from Chain of Thought?",opts:["ToT uses more tokens","CoT is branching; ToT is linear","ToT generates multiple candidate thoughts at each step, evaluates them, and expands the best","ToT always produces longer answers"],ans:2},
      {q:"What is 'backtracking' in a Tree of Thoughts?",opts:["Reviewing previous prompts","When a branch leads to a dead end, returning to the best unexplored branch","Going back to the original question","Regenerating the entire tree"],ans:1},
      {q:"What are the four stages of a single-prompt ToT approximation?",opts:["Plan, Execute, Verify, Summarise","Generate → Evaluate → Select → Verify","Research, Outline, Write, Edit","Think, Check, Answer, Confirm"],ans:1},
      {q:"ToT is MOST appropriate for which type of problem?",opts:["Simple factual lookups","Single-step arithmetic","Multi-step planning problems with a large strategy space","Short creative tasks"],ans:2},
      {q:"In the ToT tree structure, what are 'leaves'?",opts:["The starting branches","Evaluation scores","Terminal nodes where an answer is reached","Dead-end branches"],ans:2},
      {q:"Why does ToT have higher computational cost than CoT?",opts:["It requires larger models","It generates and evaluates multiple candidate thoughts at each step","It uses more examples","It requires internet access"],ans:1},
      {q:"For which everyday task would CoT with self-consistency be preferable to full ToT?",opts:["Designing a complex marketing strategy with 10 constraints","Solving a logic grid puzzle","Calculating compound interest step-by-step","Planning a product launch with multiple viable approaches"],ans:2},
      {q:"The ToT evaluation stage scores candidate thoughts on which dimensions?",opts:["Length, clarity, accuracy","Correctness likelihood, tractability, edge case coverage","Token count, response time, format compliance","Creativity, specificity, tone"],ans:1},
      {q:"Creative constraint satisfaction (writing a story satisfying 10 specific requirements) benefits from ToT because:",opts:["Stories are always long","The constraint space requires exploring multiple structural approaches and abandoning those that violate constraints","Stories cannot be written with CoT","The model cannot handle multiple requirements in one step"],ans:1},
      {q:"What does a 'programmatic ToT loop' enable that a single-prompt approximation cannot?",opts:["Better grammar","True iterative backtracking — generating new branches and re-evaluating across multiple API calls","Faster response times","Access to external databases"],ans:1},
    ],
  },
  {
    id:9, icon:"◑", color:"#E8C06A", glow:"rgba(232,192,106,0.5)",
    title:"Multimodal Prompting", subtitle:"Text, images and documents in unified prompts",
    desc:"Modern language models accept text, images, PDFs, code, and audio as simultaneous inputs. Effective multimodal prompting requires understanding how each modality is processed, how to direct model attention within images and documents, and how to extract structured information from non-text sources with precision.",
    sections:[
      {
        heading:"Image Prompting: Directing Visual Attention",
        body:"When a model processes an image alongside text, the text prompt primes the model's attention before visual tokens are processed. This means the task description should be stated BEFORE the image — doing so dramatically improves performance on targeted extraction tasks.\n\nImage prompting techniques:\n1. REGION REFERENCING: 'Describe the object in the top-right corner of the image.'\n2. COMPARISON PROMPTING: 'List every visual difference between image A and image B.'\n3. CHAIN-OF-THOUGHT FOR IMAGES: 'First describe what you see in detail, then answer the question.'\n4. STRUCTURED EXTRACTION: 'Extract all text visible in this image into a JSON object with fields: header, body_text, labels.'\n5. GROUNDED DESCRIPTION: 'Describe only what is explicitly visible — do not infer or assume off-screen content.'",
        example:{ label:"Unstructured image prompt", text:"What is in this image?" },
        example2:{ label:"Directed extraction prompt", text:"Examine this product label image. Extract the following information as a JSON object:\n{\n  \"product_name\": string,\n  \"net_weight\": string,\n  \"ingredients\": string[],\n  \"allergen_warnings\": string[],\n  \"manufacturer\": string\n}\nIf any field is not visible, set it to null." },
      },
      {
        heading:"Document Prompting: Long-Form Extraction",
        body:"Language models can process multi-page PDFs and documents. Effective document prompting requires matching the extraction strategy to the document structure:\n\n1. FLAT SUMMARISATION: 'Summarise this document in 200 words.' (Fast, loses detail)\n2. TARGETED EXTRACTION: 'Extract every section with the heading pattern [X] and list the key commitments in each.' (Precise, structured)\n3. HIERARCHICAL SUMMARISATION: 'Process pages 1–10, produce a summary, then pages 11–20, produce a summary, then synthesise all summaries.' (Handles very long documents)\n4. DOCUMENT COMPARISON: 'List every provision present in Document A but absent in Document B.'\n5. GROUNDED Q&A: 'Answer these questions using ONLY the explicit text of the document. Cite the relevant clause for each answer.'\n\nFor legal, financial, or medical documents, always use GROUNDED Q&A with the hallucination gate instruction to prevent the model from supplementing with general knowledge.",
        example:{ label:"Flat summarisation — loses critical detail", text:"Summarise this 40-page lease agreement." },
        example2:{ label:"Targeted extraction — preserves critical detail", text:"In this lease agreement, extract every clause that:\n1. Imposes a financial obligation on the tenant (amount, trigger, frequency)\n2. Restricts modification of the property\n3. Defines termination conditions and penalties\n\nFor each clause, state: the clause number, the exact obligation, and the consequence of breach.\nUse ONLY text explicitly in the document — do not infer or supplement." },
      },
      {
        heading:"Cross-Modal Reasoning",
        body:"The most powerful multimodal applications link references across modalities — asking the model to reason about connections between text and images, or between different visual elements.\n\nCross-modal prompting patterns:\n1. TEXT-TO-IMAGE GROUNDING: 'This report mentions a 340% increase in user engagement. Identify which element in the attached dashboard graph represents this metric.'\n2. IMAGE-TO-TEXT ENRICHMENT: 'This architectural diagram shows the system. Write the corresponding technical specification document, referencing each numbered component.'\n3. MULTI-IMAGE ANALYSIS: 'These five product images show manufacturing defects. Categorise each defect type and estimate its severity on a 1–5 scale.'\n4. DOCUMENT-IMAGE COMPARISON: 'The contract states the dimensions are 4m × 6m. Does the blueprint image confirm these dimensions? Identify any discrepancies.'\n\nCross-modal reasoning requires explicitly naming the connection you want the model to make — it will not infer linkages between modalities without instruction.",
        example:{ label:"No cross-modal instruction", text:"Here is the report and the chart. What do you think?" },
        example2:{ label:"Explicit cross-modal grounding", text:"The attached financial report (PDF) and the bar chart (image) both cover Q3 2024.\n\n1. For each revenue figure mentioned in the report, locate the corresponding bar in the chart and verify it matches.\n2. Identify any figures in the report that are NOT represented in the chart.\n3. Identify any bars in the chart that are NOT mentioned in the report.\n\nReturn your findings as a structured list." },
      },
    ],
    tips:["State the task BEFORE attaching the image — visual tokens are conditioned on the preceding text.","For legal or medical documents, always use grounded Q&A with a hallucination gate.","Explicitly name the cross-modal connection you want — the model will not infer it without instruction.","Use structured extraction schemas for images — 'extract as JSON' produces far more consistent output than 'describe'."],
    quiz:[
      {q:"Why should the task description be stated BEFORE the image in a multimodal prompt?",opts:["It reduces token count","The text primes the model's attention before visual tokens are processed","The API requires text before images","It prevents hallucination in image analysis"],ans:1},
      {q:"What is 'region referencing' in image prompting?",opts:["Referencing geographic regions in a map","Directing spatial attention with phrases like 'the object in the top-right corner'","Providing GPS coordinates within the prompt","Specifying image resolution"],ans:1},
      {q:"For a 40-page legal contract, which document prompting strategy preserves the most critical detail?",opts:["Flat summarisation","Hierarchical summarisation","Targeted extraction of specific clause types with citation requirements","Single-prompt Q&A"],ans:2},
      {q:"What does 'grounded Q&A with hallucination gate' mean for document prompting?",opts:["The model searches the internet for related documents","The model answers ONLY from the explicit document text, responding 'INSUFFICIENT INFORMATION' if not found","The model provides general knowledge supplemented by the document","The model cites external legal databases"],ans:1},
      {q:"Cross-modal reasoning requires the model to:",opts:["Use different models for different modalities","Reason about connections between elements across different input modalities (text and images)","Translate between modalities automatically","Only work with text and code"],ans:1},
      {q:"Why does 'extract as JSON' outperform 'describe' for structured image data?",opts:["JSON uses fewer tokens","It forces consistent field structure regardless of the model's descriptive preferences","JSON is faster to generate","The model cannot describe images"],ans:1},
      {q:"'TEXT-TO-IMAGE GROUNDING' means:",opts:["Using text to generate an image","Linking a specific claim in a text document to a corresponding visual element","Adding text labels to an image","Comparing two images using a text prompt"],ans:1},
      {q:"Hierarchical summarisation is appropriate for documents that are:",opts:["Short and well-structured","Very long, requiring chunked processing to avoid context window overflow","Legal or financial in nature","Written in multiple languages"],ans:1},
      {q:"'Grounded description' in image prompting instructs the model to:",opts:["Describe the image using geographical grounding","Only describe what is explicitly visible — do not infer off-screen content","Provide GPS coordinates of the scene","Use geographic landmarks as reference points"],ans:1},
      {q:"Document comparison prompting ('List every provision in A but absent in B') is most valuable for:",opts:["Summarising a single contract","Identifying differences between two versions of a legal or technical document","Extracting financial figures","Translating a document"],ans:1},
    ],
  },
  {
    id:10, icon:"▲", color:"#B87ED4", glow:"rgba(184,126,212,0.6)",
    title:"Agentic and Meta-Prompting", subtitle:"Prompts that write prompts and agents that act autonomously",
    desc:"The frontier of prompt engineering: meta-prompting (AI that generates and optimises its own prompts), autonomous agents (AI that plans and executes multi-step goals using tools), and systematic prompt optimisation. These techniques turn prompt engineering from a manual craft into a scalable, programmable discipline.",
    sections:[
      {
        heading:"Meta-Prompting: AI That Writes Prompts",
        body:"Meta-prompting asks the model to generate or improve its own prompt for a given task. This recursive technique produces prompts optimised for the model's own strengths — often outperforming hand-crafted prompts, especially for specialised or technical tasks.\n\nMeta-prompting workflow:\n1. DESCRIBE the task and the context in which the prompt will be used.\n2. Ask the model to GENERATE the best possible prompt for this task.\n3. Ask the model to CRITIQUE its own generated prompt, identifying weaknesses.\n4. Ask the model to REFINE based on the critique.\n5. TEST the resulting prompt on representative inputs.\n\nMeta-prompting is especially powerful for:\n• Generating system prompts for AI assistants\n• Creating evaluation rubrics for AI-generated content\n• Designing few-shot examples for specialised domains\n• Producing task-specific instruction sets",
        example:{ label:"Meta-prompting request", text:"I need a prompt that extracts structured action items from messy meeting transcripts. The prompt will be used in a production system processing 500 transcripts per day. Generate the best possible prompt for this task, including any necessary constraints and output schema." },
        example2:{ label:"Model-generated optimised prompt", text:"You are an expert meeting analyst. Given a raw meeting transcript delimited by <transcript> tags, extract every action item.\n\nFor each action item, output:\n- OWNER: The person responsible (full name)\n- ACTION: The specific task in active voice (verb + object)\n- DEADLINE: The agreed date or 'TBD' if not stated\n- CONTEXT: One sentence explaining why this action is needed\n\nReturn ONLY a JSON array of objects with fields: owner, action, deadline, context.\nIf no action items are found, return an empty array []." },
      },
      {
        heading:"Agentic Loops: Autonomous Multi-Step Execution",
        body:"An agent is an AI that can plan, execute tool calls, observe results, and adapt its plan — repeating this loop until a goal is achieved. Agents extend prompting from single-request interactions to autonomous workflows.\n\nThe standard ReAct agent loop:\n1. THOUGHT: The model reasons about the current state and what action to take next.\n2. ACTION: The model calls a tool (web search, code execution, API call, file read/write).\n3. OBSERVATION: The model receives the tool's output.\n4. REFLECTION: The model evaluates whether the goal is met or if the plan needs revision.\n5. REPEAT until the stop condition is satisfied.\n\nCritical agent design principles:\n• Always define a clear STOP CONDITION ('stop when you have verified all 5 data points')\n• Always define a FALLBACK ('if a tool fails 3 times, report the failure and stop')\n• Log every THOUGHT-ACTION-OBSERVATION triple for debugging\n• Validate tool outputs before using them as inputs to subsequent steps",
        example:{ label:"ReAct agent prompt structure", text:"You are an autonomous research agent. Your goal: [GOAL]\n\nYou have access to these tools: [TOOL LIST]\n\nWork in the format:\nTHOUGHT: [Your reasoning about what to do next]\nACTION: [Tool call and parameters]\nOBSERVATION: [Tool output — you will receive this]\n\nRepeat THOUGHT/ACTION/OBSERVATION until the goal is complete.\nThen output FINAL ANSWER: [Result].\n\nSTOP CONDITION: Stop after 10 iterations or when all required data is verified." },
        example2:{ label:"Concrete agent example", text:"GOAL: Research the top 3 competitors of Tesla in the EV market and compare their Q4 2024 delivery numbers.\n\nTHOUGHT: I need to identify Tesla's top 3 EV competitors by global market share.\nACTION: web_search('EV market share 2024 top competitors Tesla')\nOBSERVATION: [Results: BYD, Volkswagen Group, SAIC...]\n\nTHOUGHT: I have the top 3. Now I need Q4 2024 delivery data for each.\nACTION: web_search('BYD Q4 2024 EV deliveries')\n[...continues until all data is gathered and verified]" },
      },
      {
        heading:"Prompt Optimisation: Systematic Improvement",
        body:"Manual prompt engineering is artisanal — skilled but not scalable. Systematic prompt optimisation applies engineering discipline to the process:\n\n1. BASELINE MEASUREMENT: Run your current prompt on 50–100 representative inputs. Score outputs against a rubric.\n2. FAILURE ANALYSIS: Categorise failure modes (wrong format 40%, missed key points 35%, tone drift 25%).\n3. TARGETED ITERATION: Address the highest-frequency failure mode first with a targeted change.\n4. A/B EVALUATION: Run the original and new prompt on the same test set. Compare scores.\n5. REGRESSION TESTING: When a new change improves one failure mode, verify it does not worsen others.\n\nAutomated prompt optimisation (using an LLM to evaluate and improve prompts) is now possible with frameworks like DSPy and Promptfoo. These tools apply gradient-free optimisation to prompt text — treating prompt tokens as parameters to be tuned against a held-out evaluation set.",
        example:{ label:"Manual A/B test structure", text:"Test set: 50 customer support emails (25 routine, 15 edge cases, 10 adversarial)\nPrompt A (baseline): [current prompt]\nPrompt B (iteration): [modified prompt]\n\nEvaluation rubric:\n- Tone: 1-5 (5 = perfectly professional)\n- Accuracy: 1-5 (5 = all facts correct)\n- Completeness: 1-5 (5 = all required fields present)\n- Format: Pass/Fail (JSON valid or not)\n\nPrompt B is accepted if it scores higher on 3+ criteria with no regression." },
        example2:{ label:"Automated optimisation (DSPy-style)", text:"// Define the task with input/output examples\nconst task = new dspy.Predict('email -> response');\n\n// Define the evaluation metric\nconst metric = (pred, gold) => (\n  toneScore(pred.response) * 0.3 +\n  accuracyScore(pred.response, gold.facts) * 0.5 +\n  formatScore(pred.response) * 0.2\n);\n\n// Optimise the prompt automatically\nconst optimiser = new dspy.BootstrapFewShot({ metric });\nconst optimisedTask = optimiser.compile(task, trainset);" },
      },
    ],
    tips:["Meta-prompting often produces better prompts than manual engineering for specialised domains — always try it first.","Every agent MUST have an explicit stop condition and a fallback for tool failures — without these, agents loop indefinitely.","Treat prompt optimisation as a software engineering discipline: baseline → measure → iterate → A/B test → regression test.","Log every THOUGHT-ACTION-OBSERVATION triple in agent runs — debugging without logs is nearly impossible."],
    quiz:[
      {q:"What is meta-prompting?",opts:["Prompting a model about its training data","Asking the model to generate or optimise its own prompt for a given task","Using prompts that reference other prompts","A technique for reducing token count"],ans:1},
      {q:"In the ReAct agent loop, what does 'OBSERVATION' refer to?",opts:["The model's reasoning step","The user's feedback","The output received from a tool call","The agent's final answer"],ans:2},
      {q:"Why must every agentic prompt include an explicit stop condition?",opts:["To save API costs","Without a stop condition, agents can loop indefinitely","The API requires it","To prevent hallucination"],ans:1},
      {q:"What is a 'fallback' in agent design?",opts:["A backup model to use if the primary fails","Instructions for what to do if a tool fails repeatedly (e.g., report the failure and stop)","A lower-quality output the agent produces when rushed","The agent's default reasoning mode"],ans:1},
      {q:"Meta-prompting is especially powerful for which use case?",opts:["Simple Q&A tasks","Generating system prompts for AI assistants and creating evaluation rubrics","Short creative writing","Single-call classification tasks"],ans:1},
      {q:"What does 'systematic prompt optimisation' treat prompts as?",opts:["Art that cannot be measured","Natural language that only humans can evaluate","Parameters to be tuned against a held-out evaluation set","Fixed inputs that should not be modified after deployment"],ans:2},
      {q:"In the prompt optimisation workflow, what is 'regression testing'?",opts:["Testing the model on regression datasets","Verifying a new change does not worsen failure modes that were previously fixed","Rolling back to a previous prompt version","Testing prompts on a smaller dataset"],ans:1},
      {q:"The ReAct agent format stands for:",opts:["Reason, Execute, Analyse, Create, Test","Retrieve, Evaluate, Apply, Confirm, Terminate","Reasoning and Acting — thought steps interleaved with tool action steps","Request, Extract, Aggregate, Calculate, Transmit"],ans:2},
      {q:"Which framework is associated with automated, gradient-free prompt optimisation?",opts:["LangChain for retrieval","DSPy for systematic prompt compilation against evaluation metrics","AutoGPT for multi-agent orchestration","Hugging Face for model fine-tuning"],ans:1},
      {q:"Why is logging every THOUGHT-ACTION-OBSERVATION triple essential in agentic systems?",opts:["It is required by the API","Debugging agent failures is nearly impossible without a full trace of the decision process","It improves response quality","It reduces hallucination"],ans:1},
    ],
  },
  {
    id:11, icon:"▶", color:"#7EC8A4", glow:"rgba(126,200,164,0.5)",
    title:"Video Generation Prompting", subtitle:"Direct AI video models with cinematic precision",
    desc:"Video generation models — Sora, Runway, Kling, Pika, and their successors — transform text descriptions into moving images. Prompting them effectively requires a completely different mental model from text: you must think in shots, motion arcs, camera language, lighting continuity, and temporal coherence. This stage teaches the precise vocabulary and structural techniques that separate cinematic AI video from generic output.",
    sections:[
      {
        heading:"Shot Language & Camera Direction",
        body:"Video models respond strongly to cinematographic vocabulary because their training data is tagged with production metadata. Using the correct technical terms activates learned visual patterns with far greater precision than descriptive prose.\n\nCamera shot types:\n• EXTREME WIDE SHOT (EWS) — establishes environment, subject tiny in frame\n• WIDE SHOT (WS) — full subject visible, strong environmental context\n• MEDIUM SHOT (MS) — subject from waist up, the conversational default\n• CLOSE-UP (CU) — face or object fills frame, emotion and detail\n• EXTREME CLOSE-UP (ECU) — single detail: eye, texture, mechanism\n\nCamera movement:\n• DOLLY IN / DOLLY OUT — camera physically moves toward/away (immersive)\n• ZOOM IN / ZOOM OUT — lens zooms (more artificial, dream-like)\n• PAN LEFT / PAN RIGHT — horizontal rotation on fixed axis\n• TILT UP / TILT DOWN — vertical rotation on fixed axis\n• CRANE SHOT — sweeping vertical movement from low to high or reverse\n• HANDHELD — intentional shake, adds urgency and realism\n• TRACKING SHOT — camera follows subject laterally\n• RACK FOCUS — focus shifts from foreground to background subject",
        example:{ label:"Prose description — imprecise", text:"A woman walks through a busy market and we follow her as she picks up fruit and talks to vendors." },
        example2:{ label:"Shot-language prompt — precise", text:"ESTABLISHING: Extreme wide shot, overhead drone, bustling Moroccan souk, golden hour. CUT TO: Medium tracking shot, camera follows woman (30s, flowing linen dress) from behind through market stalls. CLOSE-UP: Her hand selecting pomegranates from terracotta bowl. MEDIUM TWO-SHOT: She bargains with elderly vendor, warm smile, rack focus from fruit to faces." },
      },
      {
        heading:"Motion, Time & Atmosphere Descriptors",
        body:"Motion quality is one of the most important and most neglected dimensions of video prompting. The difference between 'leaves falling' and 'leaves drifting in slow-motion spirals, each catching amber light' is the difference between generic and cinematic.\n\nMotion speed modifiers:\n• slow motion / ultra slow-motion / phantom-speed\n• time-lapse / hyper-lapse / time-compressed\n• real-time / natural pace\n• frozen moment / bullet-time\n\nAtmosphere and light:\n• Golden hour — warm amber, long shadows, magic hour glow\n• Blue hour — cool twilight before full dark, high contrast\n• Overcast — soft diffused shadowless light, muted palette\n• Neon night — high-contrast artificial colour, reflective wet streets\n• Underwater caustics — rippling light patterns from surface above\n• Volumetric fog — light visible as beams through mist or smoke\n\nCamera physics descriptors improve coherence:\n• 'Shot on 35mm film' — grain, natural colour science\n• 'Anamorphic lens flare' — horizontal blue/amber streaks from light sources\n• 'Shallow depth of field f/1.4' — subject sharp, background blurred\n• 'Deep focus' — everything in frame sharp, Kubrick style",
        example:{ label:"Generic motion description", text:"Water drops fall from a leaf. The sun is shining." },
        example2:{ label:"Cinematic motion prompt", text:"Ultra slow-motion phantom-speed: a single water droplet falls from the tip of a monstera leaf, shattering into a crown splash in a dark shallow pool below. Backlit by a single hard key light. Shot on phantom flex at 3000fps. Macro lens, extreme shallow depth of field. Dark studio, black background. The crown splash holds in frame for 4 seconds." },
      },
      {
        heading:"Temporal Coherence & Structural Prompting",
        body:"The most common failure in AI video generation is temporal incoherence — subjects change appearance mid-clip, physics break down, or scenes cut abruptly with no logical motion arc. Structural prompting prevents this by explicitly defining the beginning, middle and end of every shot, and by anchoring subject identity with consistent descriptors.\n\nTemporal structure formula:\n[OPENING STATE] → [MOTION/ACTION] → [END STATE]\n\nSubject anchoring — repeat the same physical descriptors whenever the subject appears:\nWeak: 'the man' → 'him' → 'the person'\nStrong: 'the man (late 40s, silver-streaked beard, charcoal peacoat)' used consistently\n\nEnvironmental continuity:\n• Lock lighting direction: 'Key light always from camera-left throughout'\n• Lock colour palette: 'Desaturated teal and amber palette, consistent throughout'\n• Define loop points for looping video: 'The sequence loops seamlessly at 6 seconds — end state identical to opening state'\n\nDuration and pacing:\nAlways specify clip duration. Most models default to ~4s. Specify transitions:\n'4-second clip, slow push-in throughout, motion eases in over first 0.5s and eases out over final 0.5s'",
        example:{ label:"No temporal structure — incoherent", text:"A candle melts and the wax drips down and eventually goes out and it gets dark." },
        example2:{ label:"Full temporal structure — coherent 6-second clip", text:"6-second clip. OPENING: Extreme close-up of a white pillar candle, flame burning steadily, warm amber glow fills frame, dark background. MOTION: Slow dolly back over 5 seconds revealing the candle is one of hundreds arranged in a dark cathedral nave, camera continues pulling back, flame reflections multiply in polished stone floor. END STATE: Wide shot, sea of candlelight receding to vanishing point. Colour palette: warm amber, deep shadow. Loopable: no. Mood: solemn reverence." },
      },
    ],
    tips:["Use cinematographic shot vocabulary — 'medium tracking shot' is vastly more precise than 'we follow the character'.","Define motion explicitly: speed (slow-motion), quality (smooth/handheld), and arc (dolly in over 4 seconds).","Anchor subject identity with repeated consistent descriptors — models lose track of subjects without reinforcement.","Always specify clip duration and whether it should loop — models default to ~4s with no loop."],
    quiz:[
      {q:"Which camera shot type places the subject tiny within a large environmental context?",opts:["Close-up","Medium shot","Extreme wide shot","Rack focus"],ans:2},
      {q:"What distinguishes a DOLLY IN from a ZOOM IN?",opts:["Dolly changes lens focal length; zoom moves camera physically","Zoom moves camera physically; dolly changes lens focal length","Dolly moves camera physically toward subject; zoom changes focal length","They are identical in result"],ans:2},
      {q:"'Rack focus' in a video prompt instructs the model to:",opts:["Pan the camera on a fixed axis","Shift focus from one depth plane to another within the shot","Move the camera vertically on a crane","Use handheld camera technique"],ans:1},
      {q:"The temporal structure formula for coherent video prompting is:",opts:["Shot type → Camera movement → Lighting","Opening state → Motion/Action → End state","Subject → Environment → Atmosphere","Duration → Speed → Loop point"],ans:1},
      {q:"'Shot on 35mm film' in a video prompt primarily communicates:",opts:["The video should be 35 minutes long","A specific aspect ratio requirement","Film grain texture and natural colour science","The camera should move at 35mm/second"],ans:2},
      {q:"Why should subject descriptors be repeated consistently throughout a video prompt?",opts:["To increase prompt length for better results","Models lose track of subject identity without reinforcement, causing appearance drift","Repeated descriptors improve motion smoothness","To specify the subject appears multiple times"],ans:1},
      {q:"'Volumetric fog' in a lighting descriptor means:",opts:["The scene is set underwater","Light is visible as beams or shafts through mist or smoke","The camera is moving through fog","The background should be blurred"],ans:1},
      {q:"'Anamorphic lens flare' produces which visual effect?",opts:["Circular bokeh highlights","Vertical green streaks","Horizontal blue/amber streaks from bright light sources","Fish-eye distortion at frame edges"],ans:2},
      {q:"What is the primary cause of temporal incoherence in AI video generation?",opts:["Using too many camera cuts","Lack of explicit beginning-middle-end structure and inconsistent subject anchoring","Specifying too long a clip duration","Using real-time motion instead of slow-motion"],ans:1},
      {q:"For a seamlessly looping video, the prompt should specify:",opts:["'Use a zoom-in at the end'","'End state identical to opening state — loopable'","'Shot on digital, no grain'","'Handheld camera throughout'"],ans:1},
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const useInView = (threshold = 0.15) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
};

function scoreToStars(score) {
  if (score >= 9) return 3;
  if (score >= 7) return 2;
  if (score >= 5) return 1;
  return 0;
}

const StarRow = ({ earned, size = 13, gap = 3 }) => (
  <span style={{ display:"inline-flex", gap:`${gap}px`, alignItems:"center" }}>
    {[1,2,3].map(i => (
      <svg key={i} width={size} height={size} viewBox="0 0 16 16">
        <polygon points="8,1 10,6 15,6 11,9.5 12.5,15 8,12 3.5,15 5,9.5 1,6 6,6"
          fill={i<=earned?"#FFD700":"rgba(200,201,204,0.13)"}
          stroke={i<=earned?"#FFA500":"rgba(200,201,204,0.08)"} strokeWidth="0.5"/>
      </svg>
    ))}
  </span>
);

// ─── Silver Wave SVG ──────────────────────────────────────────────────────────
const SilverWaves = () => {
  const waves = [
    { dur: 18, delay: 0,   opacity: 0.09, scaleY: 1.0,  yOffset: "72%" },
    { dur: 22, delay: 3,   opacity: 0.065, scaleY: 0.85, yOffset: "60%" },
    { dur: 26, delay: 6,   opacity: 0.045, scaleY: 0.7,  yOffset: "48%" },
    { dur: 20, delay: 1.5, opacity: 0.028, scaleY: 0.55, yOffset: "35%" },
  ];
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:1, overflow:"hidden" }}>
      {waves.map((w, i) => (
        <motion.div key={i}
          style={{ position:"absolute", bottom:0, left:"-10%", width:"120%", top: w.yOffset, opacity: w.opacity }}
          animate={{ x: ["0%", "-25%", "0%"] }}
          transition={{ duration: w.dur, delay: w.delay, repeat: Infinity, ease: "easeInOut" }}>
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none"
            style={{ width:"100%", height:"100%", display:"block" }}>
            <defs>
              <linearGradient id={`wg${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#A8A9AD" stopOpacity="0"/>
                <stop offset="25%"  stopColor="#C8C9CC" stopOpacity="1"/>
                <stop offset="50%"  stopColor="#E0E0E2" stopOpacity="1"/>
                <stop offset="75%"  stopColor="#C8C9CC" stopOpacity="1"/>
                <stop offset="100%" stopColor="#A8A9AD" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <motion.path
              d={`M0,${80 + i*10} C240,${20 + i*8} 480,${140 + i*12} 720,${80 + i*10} C960,${20 + i*8} 1200,${140 + i*12} 1440,${80 + i*10} L1440,320 L0,320 Z`}
              fill={`url(#wg${i})`}
              animate={{
                d: [
                  `M0,${80+i*10} C240,${20+i*8} 480,${140+i*12} 720,${80+i*10} C960,${20+i*8} 1200,${140+i*12} 1440,${80+i*10} L1440,320 L0,320 Z`,
                  `M0,${110+i*10} C240,${60+i*8} 480,${100+i*12} 720,${110+i*10} C960,${60+i*8} 1200,${100+i*12} 1440,${110+i*10} L1440,320 L0,320 Z`,
                  `M0,${80+i*10} C240,${20+i*8} 480,${140+i*12} 720,${80+i*10} C960,${20+i*8} 1200,${140+i*12} 1440,${80+i*10} L1440,320 L0,320 Z`,
                ]
              }}
              transition={{ duration: w.dur * 0.8, delay: w.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
};

// ─── Flying Book (fish-leap animation) ────────────────────────────────────────
// ─── Harry Potter Flying Book ─────────────────────────────────────────────────
const FlyingBook = ({ isBackground = false }) => {
  const canvasRef  = useRef(null);
  const rafRef     = useRef(null);
  const stateRef   = useRef({
    phase:      "idle",   // "idle" | "flying"
    t:          0,        // 0→1 progress along arc
    dir:        1,        // 1=R→L, -1=L→R; alternates each leap
    startTime:  null,
    // Ocean particles (spray + droplets)
    particles:  [],
    // Glitter flakes that follow the book
    glitter:    [],
    // Foam rings at entry/exit
    foam:       [],
    // Motion-trail ghost positions
    trail:      [],
  });

  // ─── Bezier math ────────────────────────────────────────────────────────────
  const cubicBez = (t, p0, p1, p2, p3) => {
    const u = 1 - t;
    return {
      x: u*u*u*p0.x + 3*u*u*t*p1.x + 3*u*t*t*p2.x + t*t*t*p3.x,
      y: u*u*u*p0.y + 3*u*u*t*p1.y + 3*u*t*t*p2.y + t*t*t*p3.y,
    };
  };
  const cubicBezTan = (t, p0, p1, p2, p3) => {
    const u = 1 - t;
    return {
      x: 3*(u*u*(p1.x-p0.x) + 3*u*t*(p2.x-p1.x)/2 + t*t*(p3.x-p2.x)),
      y: 3*(u*u*(p1.y-p0.y) + 3*u*t*(p2.y-p1.y)/2 + t*t*(p3.y-p2.y)),
    };
  };

  // ─── Control points for arc ──────────────────────────────────────────────
  const getArcPoints = (dir, W, H) => ({
    p0: { x: dir===1 ? W*0.84 : W*0.16, y: H + 80 },
    p1: { x: dir===1 ? W*0.70 : W*0.30, y: H*0.18  },
    p2: { x: dir===1 ? W*0.30 : W*0.70, y: H*0.15  },
    p3: { x: dir===1 ? W*0.16 : W*0.84, y: H + 80  },
  });

  // ─── Spawn ocean spray burst ─────────────────────────────────────────────
  const spawnSpray = (x, y, count, upward) => {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      const angle = upward
        ? -Math.PI/2 + (Math.random()-0.5) * Math.PI * 0.85   // fan upward
        :  Math.PI/2 + (Math.random()-0.5) * Math.PI * 0.9;   // fan downward
      const speed  = 1.8 + Math.random() * 4.5;
      const size   = 1.5 + Math.random() * 4;
      const type   = Math.random() < 0.55 ? "drop" : "foam";  // mix of droplets & foam
      s.particles.push({
        x, y,
        vx: Math.cos(angle) * speed * (0.5 + Math.random()*0.8),
        vy: Math.sin(angle) * speed,
        life: 1, decay: 0.012 + Math.random()*0.022,
        size, type,
        shimmer: Math.random() < 0.35,   // some drops catch light
        wobble:  Math.random() * Math.PI * 2,
      });
    }
  };

  // ─── Spawn glitter flakes ─────────────────────────────────────────────────
  const spawnGlitter = (x, y, count) => {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd   = 0.4 + Math.random() * 2.2;
      s.glitter.push({
        x: x + (Math.random()-0.5)*30,
        y: y + (Math.random()-0.5)*20,
        vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd - 0.8,
        life: 1,
        decay: 0.008 + Math.random()*0.018,
        size:  1 + Math.random()*2.5,
        phase: Math.random()*Math.PI*2,   // glint phase offset
        hue:   200 + Math.random()*40,    // blue-silver range
      });
    }
  };

  // ─── Spawn foam ring at splash point ─────────────────────────────────────
  const spawnFoam = (x, y) => {
    stateRef.current.foam.push({ x, y, r: 4, life: 1, maxR: 55 + Math.random()*20 });
  };

  // ─── Draw the entire scene ────────────────────────────────────────────────
  const draw = useCallback((elapsed) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const s = stateRef.current;
    if (s.phase === "idle" && !s.particles.length && !s.glitter.length && !s.foam.length) return;

    const TOTAL_DUR = 3600;
    const t = s.t;
    const dir = s.dir;
    const { p0, p1, p2, p3 } = getArcPoints(dir, W, H);

    // Book position & angle
    const pos = cubicBez(t, p0, p1, p2, p3);
    const tan = cubicBezTan(t, p0, p1, p2, p3);
    const angle = Math.atan2(tan.y, tan.x);

    // Speed factor: how fast the book is moving (normalised)
    const speedFactor = Math.sqrt(tan.x*tan.x + tan.y*tan.y) / (W * 0.015);
    const atApex = t > 0.40 && t < 0.62;
    const inWater = t < 0.10 || t > 0.90;

    // ── Update & spawn particles every frame ──────────────────────────────
    if (s.phase === "flying") {
      // Continuous light spray trailing from spine when near water
      if (t < 0.14) spawnSpray(pos.x, pos.y, 2, true);
      if (t > 0.86) spawnSpray(pos.x, pos.y, 2, false);

      // Continuous glitter: thin trail throughout flight
      if (Math.random() < 0.45) spawnGlitter(pos.x, pos.y, 1);
      // Dense glitter at apex
      if (atApex && Math.random() < 0.70) spawnGlitter(pos.x, pos.y, 2);

      // Motion trail snapshot
      if (s.trail.length > 8) s.trail.shift();
      s.trail.push({ x: pos.x, y: pos.y, angle, t });
    }

    // ── Draw motion trail (ghost blur) ────────────────────────────────────
    s.trail.forEach((pt, i) => {
      const alpha = (i / s.trail.length) * 0.12;
      const sc    = 0.55 + (i / s.trail.length) * 0.45;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(pt.x, pt.y);
      ctx.rotate(pt.angle + Math.PI/2);
      ctx.scale(sc, sc);
      // Ghost book silhouette
      ctx.fillStyle = "rgba(190,200,230,0.5)";
      ctx.beginPath(); ctx.roundRect(-20, -26, 40, 52, 2); ctx.fill();
      ctx.restore();
    });

    // ── Draw foam rings ───────────────────────────────────────────────────
    s.foam = s.foam.filter(f => f.life > 0);
    s.foam.forEach(f => {
      f.r += (f.maxR - f.r) * 0.07;
      f.life -= 0.025;
      ctx.save();
      ctx.globalAlpha = f.life * 0.55;
      // Elliptical ring (perspective: wider than tall)
      ctx.strokeStyle = `rgba(200,215,240,${f.life * 0.7})`;
      ctx.lineWidth = 2 * f.life;
      ctx.beginPath();
      ctx.ellipse(f.x, f.y, f.r, f.r * 0.3, 0, 0, Math.PI*2);
      ctx.stroke();
      // Inner foam texture dots
      if (f.r > 12) {
        for (let i = 0; i < 6; i++) {
          const fa = (i/6)*Math.PI*2 + f.r*0.04;
          const fr = f.r * 0.7;
          ctx.fillStyle = `rgba(230,238,255,${f.life*0.4})`;
          ctx.beginPath();
          ctx.arc(f.x + Math.cos(fa)*fr, f.y + Math.sin(fa)*fr*0.3, Math.max(0, 2.5*f.life), 0, Math.PI*2);
          ctx.fill();
        }
      }
      ctx.restore();
    });

    // ── Update & draw ocean particles ─────────────────────────────────────
    s.particles = s.particles.filter(p => p.life > 0);
    s.particles.forEach(p => {
      p.vy   += 0.09;  // gravity
      p.vx   *= 0.97;  // air resistance
      p.x    += p.vx;
      p.y    += p.vy;
      p.life -= p.decay;
      p.wobble += 0.18;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life) * (p.type==="foam" ? 0.65 : 0.82);

      if (p.type === "drop") {
        // Teardrop shape: elongated in direction of travel
        const len = Math.max(p.size, Math.sqrt(p.vx*p.vx+p.vy*p.vy)*0.6);
        const dropAngle = Math.atan2(p.vy, p.vx);
        ctx.translate(p.x, p.y);
        ctx.rotate(dropAngle);
        if (p.shimmer) {
          // Glinting droplet: bright core
          const grd = ctx.createRadialGradient(0,0,0, 0,0,p.size*1.5);
          grd.addColorStop(0, `rgba(255,255,255,${p.life*0.95})`);
          grd.addColorStop(0.4, `rgba(185,200,235,${p.life*0.7})`);
          grd.addColorStop(1, "rgba(140,160,210,0)");
          ctx.fillStyle = grd;
          ctx.beginPath(); ctx.ellipse(0,0, len*0.7, p.size*0.55, 0, 0, Math.PI*2); ctx.fill();
        } else {
          const grd = ctx.createRadialGradient(-len*0.15, 0, 0, 0, 0, p.size*1.2);
          grd.addColorStop(0, `rgba(210,225,250,${p.life*0.85})`);
          grd.addColorStop(0.6, `rgba(170,190,230,${p.life*0.5})`);
          grd.addColorStop(1, "rgba(140,165,215,0)");
          ctx.fillStyle = grd;
          ctx.beginPath(); ctx.ellipse(0,0, len*0.55, p.size*0.45, 0, 0, Math.PI*2); ctx.fill();
        }
      } else {
        // Foam bubble: wobbly circle with specular highlight
        const wobR = Math.max(0, p.size * (1 + 0.12*Math.sin(p.wobble)));
        const grd = ctx.createRadialGradient(-wobR*0.3, -wobR*0.3, 0, 0, 0, wobR*1.1);
        grd.addColorStop(0, `rgba(255,255,255,${p.life*0.8})`);
        grd.addColorStop(0.5, `rgba(200,215,245,${p.life*0.35})`);
        grd.addColorStop(1, `rgba(160,185,230,${p.life*0.1})`);
        ctx.translate(p.x, p.y);
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(0, 0, wobR, 0, Math.PI*2); ctx.fill();
        // Thin bubble outline
        ctx.strokeStyle = `rgba(200,218,250,${p.life*0.4})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      ctx.restore();
    });

    // ── Update & draw glitter flakes ──────────────────────────────────────
    s.glitter = s.glitter.filter(g => g.life > 0);
    s.glitter.forEach(g => {
      g.vx *= 0.96; g.vy += 0.04;
      g.x  += g.vx; g.y  += g.vy;
      g.life -= g.decay;
      g.phase += 0.22;

      // Glitter flashes: brightness oscillates like a rotating facet
      const glintBright = 0.5 + 0.5*Math.sin(g.phase);
      const alpha = Math.max(0, g.life) * glintBright;
      const size  = g.size * (0.7 + 0.5*glintBright);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(g.x, g.y);
      ctx.rotate(g.phase * 0.5);

      // 4-point star (lens flare shape)
      const r1 = size, r2 = size*0.28;
      ctx.fillStyle = `hsla(${g.hue}, 60%, ${75 + glintBright*22}%, 1)`;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i/8)*Math.PI*2;
        const r = i%2===0 ? r1 : r2;
        i===0 ? ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r)
              : ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
      }
      ctx.closePath(); ctx.fill();

      // Bright centre dot
      if (glintBright > 0.65) {
        ctx.fillStyle = `rgba(255,255,255,${(glintBright-0.65)*2.5})`;
        ctx.beginPath(); ctx.arc(0, 0, Math.max(0, size*0.22), 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
    });

    // ── Draw the book ─────────────────────────────────────────────────────
    if (s.phase !== "idle") {

      // ══════════════════════════════════════════════════════════════════
      // SMOOTH BIRD-WING FLAP — physically correct 3-D hinge projection
      //
      // Each wing is a panel hinged at the book spine, rotating in 3-D.
      // At angle θ from horizontal:
      //   screen_x(d) = dir * d * cos(θ)   — foreshortened width
      //   screen_y(d) =     − d * sin(θ)   — actual vertical displacement
      //                                       (−ve = upward in canvas coords)
      //
      // Timing — albatross / eagle style (heavy, powerful, slow):
      //   Period: 2 800 ms (glide apex) / 1 800 ms (climbing phase)
      //   0 → 40% of cycle : slow ease-in upstroke  0° → +82°
      //   40 → 100%         : powerful downstroke  +82° → −48° → back to 0°
      //
      // Wing tip lags shoulder by 18% of the cycle → natural flex under
      // air load. Both shoulders move identically (symmetric bird).
      //
      // The book body (cover + spine) is drawn SEPARATELY in travel-
      // rotated space AFTER the wings, so they never fight each other.
      // ══════════════════════════════════════════════════════════════════

      // ── Smooth angle curve (C1-continuous, no kinks) ──────────────
      // We use a single cosine-arch mapping so the curve and its first
      // derivative are both continuous at every transition point.
      const PERIOD   = atApex ? 2800 : 1800;   // ms per flap cycle
      const UP_END   = 0.40;                    // 0→UP_END = upstroke
      const UP_AMP   = 1.432;                   // +82°  (just below vertical)
      const DOWN_AMP = 0.838;                   // −48°  (below horizontal)

      // smoothAngle(t): t is 0→1 within a cycle; returns radians
      // +ve = above horizontal (canvas −y), −ve = below (canvas +y)
      const smoothAngle = (t) => {
        if (t < UP_END) {
          // Upstroke: 0 → UP_AMP, ease-in-out (cosine arch)
          const p = t / UP_END;                          // 0→1
          return UP_AMP * 0.5 * (1 - Math.cos(p * Math.PI));
        } else {
          // Downstroke: UP_AMP → −DOWN_AMP → 0, single smooth arch
          // At p=0: angle = UP_AMP; at p=0.5: angle = −DOWN_AMP; at p=1: angle = 0
          const p    = (t - UP_END) / (1 - UP_END);     // 0→1
          const mid  = (UP_AMP - DOWN_AMP) * 0.5;       // vertical midpoint
          const span = (UP_AMP + DOWN_AMP) * 0.5;       // half-span
          return mid + span * Math.cos(p * Math.PI);
        }
      };

      const cycleT       = (elapsed % PERIOD) / PERIOD;            // 0→1
      const shoulderA    = smoothAngle(cycleT);
      const tipA         = smoothAngle(((cycleT - 0.18) + 1) % 1); // tip lags 18%

      // ── Dimensions ────────────────────────────────────────────────
      const BW        = 44;   // cover width  (px)
      const BH        = 58;   // cover height (px)
      const SPINE     = 10;   // spine thickness
      const PAGES     = 6;    // page-block edge width
      const WING_FLAT = 76;   // flat half-wingspan per side
      const SEGS      = 7;    // segments per wing (more = smoother flex curve)
      const sw        = WING_FLAT / SEGS;
      const atApexLocal = atApex;

      // ── 1. WINGS — screen-space, hinge at book centre ─────────────
      ctx.save();
      ctx.translate(pos.x, pos.y);

      // Glow aura (dims slightly on downstroke, peaks on upstroke)
      const glowPulse = 0.5 + 0.5 * Math.sin(cycleT * Math.PI * 2);
      const auraStr   = atApexLocal ? (0.28 + glowPulse * 0.18) : (0.10 + glowPulse * 0.08);
      const aura      = ctx.createRadialGradient(0, 0, 4, 0, 0, 115);
      aura.addColorStop(0,    `rgba(215,228,255,${auraStr})`);
      aura.addColorStop(0.42, `rgba(172,198,242,${auraStr * 0.28})`);
      aura.addColorStop(1,    "rgba(140,170,232,0)");
      ctx.fillStyle = aura;
      ctx.beginPath(); ctx.ellipse(0, 0, 115, 68, 0, 0, Math.PI * 2); ctx.fill();

      // drawWing — one side
      const drawWing = (dir, rootA, tipA_) => {
        for (let i = 0; i < SEGS; i++) {
          // Lerp angle smoothly from root (spine) to tip
          const fA = i       / SEGS;
          const fB = (i + 1) / SEGS;
          const θA = rootA + (tipA_ - rootA) * fA;
          const θB = rootA + (tipA_ - rootA) * fB;
          const θM = (θA + θB) * 0.5;

          // 3-D → 2-D projection (see header comment)
          const dA = i       * sw;
          const dB = (i + 1) * sw;
          const xA = dir *  dA * Math.cos(θA);
          const yA =       -dA * Math.sin(θA);
          const xB = dir *  dB * Math.cos(θB);
          const yB =       -dB * Math.sin(θB);

          // Taper: outer segment is slightly narrower (natural wing shape)
          const hA = BH * (1 - fA * 0.26);
          const hB = BH * (1 - fB * 0.26);

          // Lighting model:
          //   cos(θM) = 1 → horizontal, full top face lit
          //   cos(θM) = 0 → edge-on, face vanishes (naturally handled by foreshortening)
          //   cos(θM) < 0 → underside visible, darker and cooler
          const cosM    = Math.cos(θM);
          const topFace = cosM >= 0;

          const L = topFace
            ? Math.round(72 + cosM * 24)         // 72 – 96 % bright top face
            : Math.round(36 - cosM * 12);         // 36 – 48 % cooler underside
          const Sat = topFace ? 13 : 22;

          ctx.shadowColor = topFace
            ? `rgba(185,210,245,${0.15 + cosM * 0.45})`
            : `rgba(25, 40, 95,${0.25 + Math.abs(cosM) * 0.40})`;
          ctx.shadowBlur  = 4 + Math.abs(cosM) * 18;

          const grd = ctx.createLinearGradient(xA, yA - hA * 0.5, xB, yB + hB * 0.5);
          grd.addColorStop(0,    `hsl(226,${Sat}%,${L + 13}%)`);
          grd.addColorStop(0.40, `hsl(226,${Sat}%,${L + 2}%)`);
          grd.addColorStop(1,    `hsl(226,${Sat + 5}%,${L - 9}%)`);
          ctx.fillStyle = grd;

          ctx.beginPath();
          ctx.moveTo(xA,  yA - hA * 0.5);
          ctx.lineTo(xB,  yB - hB * 0.5);
          ctx.lineTo(xB,  yB + hB * 0.5);
          ctx.lineTo(xA,  yA + hA * 0.5);
          ctx.closePath();
          ctx.fill();

          // Specular highlight (sky catching the top face on upstroke)
          if (topFace && cosM > 0.12) {
            ctx.shadowBlur = 0;
            const shine = ctx.createLinearGradient(xA, yA - hA * 0.5, xB, yB - hB * 0.5);
            shine.addColorStop(0,   `rgba(255,255,255,${cosM * 0.50})`);
            shine.addColorStop(0.5, `rgba(255,255,255,${cosM * 0.16})`);
            shine.addColorStop(1,   "rgba(255,255,255,0)");
            ctx.fillStyle = shine;
            ctx.beginPath();
            ctx.moveTo(xA,  yA - hA * 0.5);
            ctx.lineTo(xB,  yB - hB * 0.5);
            ctx.lineTo(xB,  yB + hB * 0.5);
            ctx.lineTo(xA,  yA + hA * 0.5);
            ctx.closePath();
            ctx.fill();
          }

          // Edge rib (subtle page-spine line)
          ctx.shadowBlur  = 0;
          ctx.strokeStyle = `rgba(95,105,142,${0.22 * Math.abs(cosM)})`;
          ctx.lineWidth   = 0.65;
          ctx.beginPath();
          ctx.moveTo(xA, yA);
          ctx.lineTo(xB, yB);
          ctx.stroke();
        }
      };

      drawWing(-1, shoulderA, tipA);   // left wing
      drawWing( 1, shoulderA, tipA);   // right wing

      ctx.restore();

      // ── 2. BOOK BODY — travel-rotated coordinate space ────────────
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(angle + Math.PI / 2);

      // ── SPINE (hardcover) ──────────────────────────────────────────────
      ctx.shadowColor = "rgba(160,180,225,0.6)";
      ctx.shadowBlur  = atApexLocal ? 22 : 10;
      const spineGrd = ctx.createLinearGradient(-BW/2-SPINE, 0, -BW/2, 0);
      spineGrd.addColorStop(0,   "#8A8CA0");
      spineGrd.addColorStop(0.35,"#BEC0CE");
      spineGrd.addColorStop(0.7, "#A8AAB8");
      spineGrd.addColorStop(1,   "#9698A8");
      ctx.fillStyle = spineGrd;
      ctx.beginPath();
      ctx.moveTo(-BW/2,       -BH/2+2);
      ctx.lineTo(-BW/2-SPINE, -BH/2+5);
      ctx.lineTo(-BW/2-SPINE,  BH/2-5);
      ctx.lineTo(-BW/2,        BH/2-2);
      ctx.closePath(); ctx.fill();
      // Spine highlight ridge
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(210,215,230,0.7)";
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(-BW/2-SPINE+2.5, -BH/2+6);
      ctx.lineTo(-BW/2-SPINE+2.5,  BH/2-6);
      ctx.stroke();
      // Spine label lines
      [0.28, 0.5, 0.72].forEach(frac => {
        const sy = -BH/2 + frac*BH;
        ctx.strokeStyle = "rgba(165,168,185,0.5)";
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(-BW/2-SPINE+4, sy); ctx.lineTo(-BW/2-2, sy); ctx.stroke();
      });

      // ── COVER FACE (between spine and pages) ──────────────────────────
      ctx.shadowColor = "rgba(180,200,235,0.5)";
      ctx.shadowBlur  = atApexLocal ? 20 : 10;
      const covGrd = ctx.createLinearGradient(-BW/2, -BH/2, BW/2-PAGES, BH/2);
      covGrd.addColorStop(0,   "#D5D7E5");
      covGrd.addColorStop(0.18,"#EEF0F6");
      covGrd.addColorStop(0.5, "#E4E6F0");
      covGrd.addColorStop(0.82,"#C8CADC");
      covGrd.addColorStop(1,   "#AEAFC0");
      ctx.fillStyle = covGrd;
      ctx.beginPath();
      ctx.roundRect(-BW/2, -BH/2, BW-PAGES, BH, [2,1,1,2]);
      ctx.fill();

      // Shimmer sweep across cover
      const shimX = -BW/2 + ((elapsed*0.00015) % 1) * (BW-PAGES);
      const shimGrd = ctx.createLinearGradient(shimX-18, -BH/2, shimX+18, BH/2);
      shimGrd.addColorStop(0, "rgba(255,255,255,0)");
      shimGrd.addColorStop(0.45, `rgba(255,255,255,${atApexLocal?0.55:0.3})`);
      shimGrd.addColorStop(1, "rgba(255,255,255,0)");
      ctx.shadowBlur = 0;
      ctx.fillStyle = shimGrd;
      ctx.beginPath();
      ctx.roundRect(-BW/2, -BH/2, BW-PAGES, BH, [2,1,1,2]);
      ctx.fill();

      // Cover border
      ctx.strokeStyle = "rgba(165,170,192,0.85)";
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.roundRect(-BW/2, -BH/2, BW-PAGES, BH, [2,1,1,2]); ctx.stroke();
      // Inner decorative frame
      ctx.strokeStyle = "rgba(148,152,175,0.45)";
      ctx.lineWidth = 0.55;
      ctx.beginPath(); ctx.roundRect(-BW/2+4, -BH/2+5, BW-PAGES-8, BH-10, 2); ctx.stroke();

      // Title bars
      ctx.fillStyle = "rgba(118,122,148,0.6)";
      ctx.beginPath(); ctx.roundRect(-BW/2+7, -BH/2+12, BW-PAGES-14, 3.5, 1); ctx.fill();
      ctx.fillStyle = "rgba(118,122,148,0.42)";
      ctx.beginPath(); ctx.roundRect(-BW/2+7, -BH/2+19, BW-PAGES-20, 2.5, 1); ctx.fill();
      ctx.beginPath(); ctx.roundRect(-BW/2+7, -BH/2+25, BW-PAGES-17, 2.5, 1); ctx.fill();

      // Crest / seal
      ctx.strokeStyle = "rgba(145,150,175,0.55)";
      ctx.lineWidth = 0.75;
      ctx.beginPath(); ctx.arc(0, 7, 7.5, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 7, 4.5, 0, Math.PI*2); ctx.stroke();
      // 5-point star in crest
      const glintStar = 0.5 + 0.5*Math.sin(elapsed*0.003);
      ctx.fillStyle = `rgba(190,195,220,${0.5 + glintStar*0.35})`;
      ctx.beginPath();
      for (let i=0; i<10; i++) {
        const sa = (i/10)*Math.PI*2 - Math.PI/2;
        const sr = i%2===0 ? 3.8 : 1.6;
        i===0 ? ctx.moveTo(Math.cos(sa)*sr, 7+Math.sin(sa)*sr)
              : ctx.lineTo(Math.cos(sa)*sr, 7+Math.sin(sa)*sr);
      }
      ctx.closePath(); ctx.fill();

      // Author rule
      ctx.fillStyle = "rgba(118,122,148,0.38)";
      ctx.beginPath(); ctx.roundRect(-BW/2+7, BH/2-16, BW-PAGES-24, 2, 1); ctx.fill();

      // ── PAGE THICKNESS BLOCK ──────────────────────────────────────────
      const pgThkGrd = ctx.createLinearGradient(BW/2-PAGES, 0, BW/2, 0);
      pgThkGrd.addColorStop(0,   "#BEC0CA");
      pgThkGrd.addColorStop(0.3, "#DCDEE6");
      pgThkGrd.addColorStop(0.7, "#CACED8");
      pgThkGrd.addColorStop(1,   "#B2B4C0");
      ctx.shadowBlur = 0;
      ctx.fillStyle = pgThkGrd;
      ctx.beginPath();
      ctx.moveTo(BW/2-PAGES, -BH/2+3);
      ctx.lineTo(BW/2,       -BH/2+1);
      ctx.lineTo(BW/2,        BH/2-1);
      ctx.lineTo(BW/2-PAGES,  BH/2-3);
      ctx.closePath(); ctx.fill();
      for (let i=1; i<=7; i++) {
        const py = -BH/2+3 + (BH-6)*i/8;
        ctx.strokeStyle = "rgba(155,158,170,0.32)";
        ctx.lineWidth = 0.55;
        ctx.beginPath(); ctx.moveTo(BW/2-PAGES+1, py); ctx.lineTo(BW/2-1, py); ctx.stroke();
      }

      ctx.restore(); // book transform
    }
  }, []);

  // ─── Main animation tick ─────────────────────────────────────────────────
  const TOTAL_DUR = 3600;

  const startLeap = useCallback(() => {
    const s = stateRef.current;
    s.phase     = "flying";
    s.t         = 0;
    s.dir      *= -1;
    s.startTime = null;
    s.trail     = [];

    const W = window.innerWidth, H = window.innerHeight;
    const { p0, p3 } = getArcPoints(s.dir, W, H);

    // Breach spray & foam (entry)
    setTimeout(() => {
      spawnSpray(p0.x, H*0.88, 28, true);
      spawnSpray(p0.x, H*0.88, 12, true);
      spawnGlitter(p0.x, H*0.88, 18);
      spawnFoam(p0.x, H*0.92);
    }, 60);

    // Apex glitter burst
    setTimeout(() => {
      const W2 = window.innerWidth, H2 = window.innerHeight;
      const mid = cubicBez(0.5, getArcPoints(s.dir,W2,H2).p0, getArcPoints(s.dir,W2,H2).p1, getArcPoints(s.dir,W2,H2).p2, getArcPoints(s.dir,W2,H2).p3);
      spawnGlitter(mid.x, mid.y, 30);
      spawnSpray(mid.x, mid.y, 8, true);
    }, TOTAL_DUR * 0.48);

    // Dive back in: spray + foam at exit point
    setTimeout(() => {
      spawnSpray(p3.x, H*0.88, 28, false);
      spawnGlitter(p3.x, H*0.88, 14);
      spawnFoam(p3.x, H*0.92);
    }, TOTAL_DUR * 0.90);

    let startT = null;
    const tick = (now) => {
      if (!startT) startT = now;
      const elapsed = now - startT;
      s.t = Math.min(elapsed / TOTAL_DUR, 1);

      // Ease in-out sine for smooth arc
      const eased = 0.5 - 0.5*Math.cos(s.t * Math.PI);
      s.t = eased; // use eased t for bezier position

      draw(elapsed);
      s.t = Math.min(elapsed / TOTAL_DUR, 1); // restore raw t for phase tracking

      if (s.t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        s.phase = "idle";
        s.trail = [];
        // Keep drawing until particles die
        const drain = (now2) => {
          draw(now2 - startT + TOTAL_DUR);
          if (s.particles.length || s.glitter.length || s.foam.length) {
            rafRef.current = requestAnimationFrame(drain);
          }
        };
        rafRef.current = requestAnimationFrame(drain);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [draw]);

  useEffect(() => {
    let cancelled = false;
    const schedule = async () => {
      await new Promise(r => setTimeout(r, 1600));
      while (!cancelled) {
        startLeap();
        await new Promise(r => setTimeout(r, TOTAL_DUR + 10000));
      }
    };
    schedule();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [startLeap]);

  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) {
        canvasRef.current.width  = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <canvas ref={canvasRef} style={{ position:"fixed", inset:0, zIndex: isBackground ? 0 : 5, pointerEvents:"none", opacity: isBackground ? 0.35 : 1, transition:"opacity 0.6s ease, z-index 0s" }} />
  );
};

// ─── Floating orbs ────────────────────────────────────────────────────────────
const Orbs = ({ visible = true }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: visible ? 1 : 0 }}
    transition={{ duration: 1.1, ease: [0.4, 0, 0.2, 1] }}
    style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}
  >
    {/* Ambient orbs — slightly brighter than before */}
    {[
      { size:700, top:"-120px", left:"-200px", color:"rgba(168,169,173,0.055)", dur:14 },
      { size:450, bottom:"8%",  right:"-100px",color:"rgba(139,158,212,0.06)",  dur:10 },
      { size:350, top:"42%",   left:"58%",     color:"rgba(155,142,212,0.05)",  dur:17 },
      { size:300, top:"20%",   left:"30%",     color:"rgba(190,185,220,0.04)",  dur:21 },
    ].map((o,i) => (
      <motion.div key={i}
        animate={{ scale:[1,1.1,1], opacity:[0.5,1,0.5] }}
        transition={{ duration:o.dur, repeat:Infinity, ease:"easeInOut" }}
        style={{ position:"absolute", width:o.size, height:o.size, top:o.top, bottom:o.bottom, left:o.left, right:o.right, borderRadius:"50%", background:`radial-gradient(circle, ${o.color} 0%, transparent 70%)` }}/>
    ))}
    {/* Silver waves */}
    <SilverWaves/>
  </motion.div>
);

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = ({ onBack, showBack, onNav, activeView }) => (
  <motion.nav initial={{ y:-60, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ duration:0.6, ease:[0.25,0.46,0.45,0.94] }}
    style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, height:"64px", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 40px", background:"rgba(8,8,15,0.9)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(168,169,173,0.09)" }}>
    <motion.div onClick={() => onNav?.("home")} whileHover={{ opacity:0.85 }} style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer" }}>
      <svg width="26" height="26" viewBox="0 0 26 26">
        <circle cx="13" cy="13" r="12" stroke={S.silver} strokeWidth="0.7" strokeDasharray="4 2" />
        <circle cx="13" cy="13" r="7"  stroke={S.silver} strokeWidth="0.45" opacity="0.35" />
        <polygon points="13,7 15,11 19.5,11 16,14 17.5,18.5 13,15.5 8.5,18.5 10,14 6.5,11 11,11" fill="#C8C9CC" opacity="0.92"/>
      </svg>
      <span style={{ fontFamily:"'Playfair Display', serif", fontSize:"17px", fontWeight:700, color:S.white, letterSpacing:"-0.01em" }}>
        The Art of Prompting
      </span>
    </motion.div>
    {showBack ? (
      <motion.button onClick={onBack} whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
        style={{ background:"rgba(168,169,173,0.08)", border:"1px solid rgba(168,169,173,0.18)", borderRadius:"8px", padding:"8px 20px", color:S.silverLt, fontSize:"11px", letterSpacing:"0.14em", textTransform:"uppercase", fontFamily:"'Cormorant Garamond', serif", fontWeight:600, cursor:"pointer" }}>
        Back to Journey
      </motion.button>
    ) : (
      <div style={{ display:"flex", gap:"6px" }}>
        {[["Prompt Lab","lab"],["Challenges","challenges"],["Dashboard","home"]].map(([label,dest]) => (
          <motion.button key={label}
            onClick={() => onNav?.(dest)}
            whileHover={{ scale:1.03, background:"rgba(168,169,173,0.1)" }} whileTap={{ scale:0.96 }}
            style={{ background: activeView===dest ? "rgba(168,169,173,0.14)" : "rgba(168,169,173,0.05)", border: activeView===dest ? "1px solid rgba(168,169,173,0.3)" : "1px solid rgba(168,169,173,0.12)", borderRadius:"8px", padding:"8px 16px", color: activeView===dest ? S.silverLt : S.muted, fontSize:"11px", letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:"'Cormorant Garamond', serif", fontWeight:600, cursor:"pointer", transition:"all 0.2s" }}>
            {label}
          </motion.button>
        ))}
      </div>
    )}
  </motion.nav>
);

// ─── Quiz Modal ───────────────────────────────────────────────────────────────
const QuizModal = ({ stage, onClose, onPass }) => {
  const [current,  setCurrent]  = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers,  setAnswers]  = useState([]);
  const [phase,    setPhase]    = useState("answering"); // answering | score

  const q     = stage.quiz[current];
  const total = stage.quiz.length;
  const score = answers.filter(a => a.sel === a.ans).length;
  const stars = scoreToStars(score);
  const passed = score >= 5;

  const handleSelect = (idx) => { if (selected !== null) return; setSelected(idx); };
  const handleNext = () => {
    const next = [...answers, { sel:selected, ans:q.ans }];
    setAnswers(next);
    if (current < total - 1) { setCurrent(c => c+1); setSelected(null); }
    else setPhase("score");
  };
  const handleDone = () => { if (passed) onPass(stage.id, stars); onClose(); };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px", background:"rgba(0,0,0,0.88)", backdropFilter:"blur(16px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale:0.88, y:40, opacity:0 }} animate={{ scale:1, y:0, opacity:1 }}
        exit={{ scale:0.93, y:20, opacity:0 }} transition={{ type:"spring", stiffness:280, damping:28 }}
        style={{ width:"100%", maxWidth:"600px", maxHeight:"88vh", overflowY:"auto", background:S.bg, border:`1px solid rgba(${hexToRgb(stage.color)},0.3)`, borderRadius:"22px", boxShadow:`0 30px 90px rgba(0,0,0,0.9), 0 0 0 1px rgba(${hexToRgb(stage.color)},0.1)` }}>

        {/* Header */}
        <div style={{ padding:"24px 28px 16px", borderBottom:"1px solid rgba(168,169,173,0.08)", position:"sticky", top:0, background:S.bg, zIndex:10, borderRadius:"22px 22px 0 0" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <span style={{ fontSize:"10px", letterSpacing:"0.22em", textTransform:"uppercase", fontFamily:"'Cormorant Garamond', serif", fontWeight:600, color:stage.color }}>Stage {stage.id} · Quiz</span>
              <div style={{ fontFamily:"'Playfair Display', serif", fontSize:"17px", fontWeight:700, color:S.white, marginTop:"3px" }}>{stage.title}</div>
            </div>
            <motion.button onClick={onClose} whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
              style={{ width:"32px", height:"32px", borderRadius:"50%", background:"rgba(168,169,173,0.06)", border:"1px solid rgba(168,169,173,0.14)", color:S.muted, fontSize:"13px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              x
            </motion.button>
          </div>
          {phase === "answering" && (
            <div style={{ marginTop:"14px" }}>
              <div style={{ display:"flex", gap:"3px", marginBottom:"6px" }}>
                {stage.quiz.map((_,i) => (
                  <div key={i} style={{ flex:1, height:"2.5px", borderRadius:"2px", background: i<current ? stage.color : i===current ? `rgba(${hexToRgb(stage.color)},0.4)` : "rgba(168,169,173,0.09)", transition:"all 0.3s" }}/>
                ))}
              </div>
              <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"11px", color:S.muted }}>Question {current+1} of {total}</span>
            </div>
          )}
        </div>

        <div style={{ padding:"24px 28px 28px" }}>
          {phase === "answering" && (
            <AnimatePresence mode="wait">
              <motion.div key={current} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:0.25 }}>
                <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"16px", color:S.white, lineHeight:1.75, marginBottom:"20px", fontWeight:600 }}>{q.q}</p>
                <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"22px" }}>
                  {q.opts.map((opt, i) => {
                    let bg="rgba(168,169,173,0.04)", border="rgba(168,169,173,0.12)", col=S.mutedMd;
                    if (selected !== null) {
                      if (i===q.ans) { bg=`rgba(${hexToRgb(stage.color)},0.13)`; border=stage.color; col=S.white; }
                      else if (i===selected) { bg="rgba(255,60,60,0.08)"; border="rgba(255,80,80,0.4)"; col="rgba(255,140,140,0.8)"; }
                    }
                    return (
                      <motion.div key={i} onClick={() => handleSelect(i)}
                        whileHover={selected===null?{ scale:1.01, x:3 }:{}}
                        style={{ padding:"12px 16px", borderRadius:"11px", border:`1px solid ${border}`, background:bg, cursor:selected===null?"pointer":"default", display:"flex", alignItems:"center", gap:"11px", transition:"all 0.2s ease" }}>
                        <span style={{ width:"21px", height:"21px", borderRadius:"50%", border:`1.5px solid ${border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", fontWeight:700, color: selected!==null&&i===q.ans?stage.color : selected!==null&&i===selected?"rgba(255,110,110,0.85)":S.muted, flexShrink:0, fontFamily:"'Cormorant Garamond', serif" }}>
                          {selected!==null ? (i===q.ans?"v" : i===selected?"x" : String.fromCharCode(65+i)) : String.fromCharCode(65+i)}
                        </span>
                        <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"14px", color:col, lineHeight:1.45 }}>{opt}</span>
                      </motion.div>
                    );
                  })}
                </div>
                {selected !== null && (
                  <motion.button onClick={handleNext} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                    whileHover={{ scale:1.03, boxShadow:`0 8px 24px rgba(${hexToRgb(stage.color)},0.25)` }} whileTap={{ scale:0.97 }}
                    style={{ width:"100%", padding:"13px", borderRadius:"10px", background:`linear-gradient(135deg, ${stage.color}, ${S.silverLt})`, border:"none", color:"#08080F", fontFamily:"'Cormorant Garamond', serif", fontWeight:700, fontSize:"12px", letterSpacing:"0.16em", textTransform:"uppercase", cursor:"pointer" }}>
                    {current < total-1 ? "Next Question" : "Submit Quiz"}
                  </motion.button>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {phase === "score" && (
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.4 }}
              style={{ textAlign:"center", padding:"10px 0" }}>
              <motion.div
                animate={{ boxShadow: passed ? [`0 0 0px rgba(${hexToRgb(stage.color)},0)`, `0 0 40px rgba(${hexToRgb(stage.color)},0.5)`, `0 0 0px rgba(${hexToRgb(stage.color)},0)`] : [] }}
                transition={{ duration:2, repeat:passed?Infinity:0 }}
                style={{ width:"90px", height:"90px", borderRadius:"50%", background:`rgba(${hexToRgb(stage.color)},${passed?0.15:0.05})`, border:`2px solid rgba(${hexToRgb(stage.color)},${passed?0.6:0.2})`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", flexDirection:"column" }}>
                <span style={{ fontFamily:"'Playfair Display', serif", fontSize:"28px", fontWeight:700, color: passed ? stage.color : S.muted }}>{score}</span>
                <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"11px", color:S.muted }}>/{total}</span>
              </motion.div>

              <StarRow earned={stars} size={20} gap={6}/>
              <div style={{ fontFamily:"'Playfair Display', serif", fontSize:"22px", fontWeight:700, color:S.white, margin:"14px 0 8px" }}>
                {passed ? "Stage Passed" : "Not Passed Yet"}
              </div>
              <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"14px", color:S.muted, lineHeight:1.7, marginBottom:"24px" }}>
                {passed
                  ? `You answered ${score} of ${total} correctly. This stage is now marked complete.`
                  : `You answered ${score} of ${total} correctly. You need at least 5 to pass. Review the lesson and try again.`}
              </p>

              {/* Answer review */}
              <div style={{ textAlign:"left", marginBottom:"24px" }}>
                <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"11px", letterSpacing:"0.18em", textTransform:"uppercase", color:S.muted, marginBottom:"12px" }}>Answer Review</div>
                <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                  {answers.map((a,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"9px 14px", borderRadius:"9px", background: a.sel===a.ans ? `rgba(${hexToRgb(stage.color)},0.07)` : "rgba(255,60,60,0.06)", border: `1px solid ${a.sel===a.ans ? `rgba(${hexToRgb(stage.color)},0.22)` : "rgba(255,80,80,0.18)"}` }}>
                      <span style={{ fontSize:"11px", color: a.sel===a.ans ? stage.color : "rgba(255,110,110,0.8)", flexShrink:0, fontWeight:700 }}>{a.sel===a.ans?"v":"x"}</span>
                      <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"12px", color:S.mutedMd, flex:1 }}>Q{i+1}: {stage.quiz[i].q.length>60 ? stage.quiz[i].q.slice(0,60)+"…" : stage.quiz[i].q}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:"flex", gap:"10px" }}>
                {!passed && (
                  <motion.button onClick={onClose} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                    style={{ flex:1, padding:"12px", borderRadius:"10px", background:"rgba(168,169,173,0.06)", border:"1px solid rgba(168,169,173,0.16)", color:S.muted, fontFamily:"'Cormorant Garamond', serif", fontWeight:600, fontSize:"11px", letterSpacing:"0.14em", textTransform:"uppercase", cursor:"pointer" }}>
                    Review Lesson
                  </motion.button>
                )}
                <motion.button onClick={handleDone} whileHover={{ scale:1.03, boxShadow:`0 8px 24px rgba(${hexToRgb(stage.color)},0.25)` }} whileTap={{ scale:0.97 }}
                  style={{ flex:1, padding:"12px", borderRadius:"10px", background:passed?`linear-gradient(135deg, ${stage.color}, ${S.silverLt})`:"rgba(168,169,173,0.06)", border:passed?"none":"1px solid rgba(168,169,173,0.16)", color:passed?"#08080F":S.muted, fontFamily:"'Cormorant Garamond', serif", fontWeight:700, fontSize:"11px", letterSpacing:"0.14em", textTransform:"uppercase", cursor:"pointer" }}>
                  {passed ? "Continue Journey" : "Close"}
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Stage Node ───────────────────────────────────────────────────────────────
const StageNode = ({ stage, index, unlocked, completed, stageStars, onClick }) => {
  const [ref, inView] = useInView(0.12);
  const isLeft = index % 2 === 0;

  return (
    <motion.div ref={ref}
      initial={{ opacity:0, x: isLeft?-50:50, y:16 }}
      animate={inView ? { opacity:1, x:0, y:0 } : {}}
      transition={{ duration:0.65, ease:[0.25,0.46,0.45,0.94], delay:0.08 }}
      style={{ display:"flex", alignItems:"center", justifyContent: isLeft?"flex-end":"flex-start", paddingRight: isLeft?"calc(50% + 44px)":"0", paddingLeft: isLeft?"0":"calc(50% + 44px)", position:"relative" }}>

      {/* Spine connector dot */}
      <div style={{ position:"absolute", left:"calc(50% - 7px)", top:"50%", transform:"translateY(-50%)", width:"14px", height:"14px", borderRadius:"50%", background: completed?stage.color : unlocked?"rgba(168,169,173,0.35)":"rgba(168,169,173,0.12)", boxShadow: completed?`0 0 14px ${stage.glow}`:"none", zIndex:3, transition:"all 0.4s" }}/>

      <motion.div
        whileHover={unlocked ? { scale:1.025, y:-3 } : {}}
        whileTap={unlocked ? { scale:0.98 } : {}}
        onClick={() => unlocked && onClick(stage)}
        style={{ width:"300px", background: completed?`linear-gradient(135deg, rgba(${hexToRgb(stage.color)},0.1) 0%, rgba(8,8,15,0.97) 100%)`:"rgba(13,13,22,0.97)", border: completed?`1px solid rgba(${hexToRgb(stage.color)},0.32)` : unlocked?"1px solid rgba(168,169,173,0.2)":"1px solid rgba(168,169,173,0.07)", borderRadius:"16px", padding:"22px 24px", cursor:unlocked?"pointer":"default", opacity:unlocked?1:0.38, filter:unlocked?"none":"grayscale(0.7)", boxShadow: completed?`0 6px 36px rgba(${hexToRgb(stage.color)},0.16)` : unlocked?"0 3px 20px rgba(0,0,0,0.45)":"none", transition:"all 0.3s ease", position:"relative", overflow:"hidden" }}>

        {completed && (
          <motion.div animate={{ x:["-100%","200%"] }} transition={{ duration:3.5, repeat:Infinity, repeatDelay:5, ease:"easeInOut" }}
            style={{ position:"absolute", top:0, left:0, width:"50%", height:"100%", background:`linear-gradient(90deg, transparent, rgba(${hexToRgb(stage.color)},0.07), transparent)`, pointerEvents:"none" }}/>
        )}

        <div style={{ display:"flex", alignItems:"flex-start", gap:"14px" }}>
          <div style={{ width:"44px", height:"44px", borderRadius:"12px", flexShrink:0, background:unlocked?`rgba(${hexToRgb(stage.color)},0.12)`:"rgba(168,169,173,0.05)", border:`1.5px solid rgba(${hexToRgb(stage.color)},${unlocked?0.38:0.12})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", color:unlocked?stage.color:"rgba(168,169,173,0.25)", boxShadow:completed?`0 0 14px rgba(${hexToRgb(stage.color)},0.25)`:"none", transition:"all 0.3s" }}>
            {unlocked ? stage.icon : <svg width="12" height="14" viewBox="0 0 12 14" fill="none"><rect x="1" y="5" width="10" height="8" rx="2" stroke="rgba(168,169,173,0.4)" strokeWidth="1.2"/><path d="M3 5V3.5a3 3 0 016 0V5" stroke="rgba(168,169,173,0.4)" strokeWidth="1.2"/></svg>}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"3px" }}>
              <span style={{ fontSize:"9px", letterSpacing:"0.22em", textTransform:"uppercase", fontFamily:"'Cormorant Garamond', serif", fontWeight:600, color:unlocked?stage.color:"rgba(168,169,173,0.25)" }}>Stage {stage.id}</span>
              {completed && <StarRow earned={stageStars} size={11} gap={2}/>}
            </div>
            <div style={{ fontFamily:"'Playfair Display', serif", fontSize:"15px", fontWeight:700, color:unlocked?S.white:"rgba(255,255,255,0.25)", marginBottom:"3px", lineHeight:1.2 }}>{stage.title}</div>
            <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"12px", color:unlocked?S.muted:"rgba(255,255,255,0.18)", lineHeight:1.5, marginBottom:unlocked?"12px":"0" }}>{stage.subtitle}</div>
            {unlocked && (
              <div style={{ display:"inline-flex", alignItems:"center", gap:"5px", padding:"5px 12px", borderRadius:"20px", background:`rgba(${hexToRgb(stage.color)},0.1)`, border:`1px solid rgba(${hexToRgb(stage.color)},0.22)` }}>
                <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"10px", letterSpacing:"0.1em", textTransform:"uppercase", color:stage.color, fontWeight:600 }}>
                  {completed ? "Review" : "Begin"} →
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Lesson Page ──────────────────────────────────────────────────────────────
const LessonPage = ({ stage, completed, stageStars, onBack, onOpenQuiz }) => {
  const [activeSection, setActiveSection] = useState(0);
  const sec = stage.sections[activeSection];

  return (
    <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-16 }} transition={{ duration:0.45, ease:[0.25,0.46,0.45,0.94] }}
      style={{ minHeight:"100vh", background:S.bg, paddingTop:"80px", paddingBottom:"100px" }}>
      <div style={{ maxWidth:"780px", margin:"0 auto", padding:"48px 32px 0" }}>

        {/* Hero */}
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"14px" }}>
            <span style={{ fontSize:"10px", letterSpacing:"0.24em", textTransform:"uppercase", fontFamily:"'Cormorant Garamond', serif", fontWeight:600, color:stage.color }}>Stage {stage.id}</span>
            {completed && (
              <span style={{ display:"inline-flex", alignItems:"center", gap:"6px", padding:"3px 10px", borderRadius:"20px", background:`rgba(${hexToRgb(stage.color)},0.1)`, border:`1px solid rgba(${hexToRgb(stage.color)},0.25)`, fontFamily:"'Cormorant Garamond', serif", fontSize:"10px", color:stage.color, letterSpacing:"0.1em", textTransform:"uppercase" }}>
                Completed · <StarRow earned={stageStars} size={10} gap={2}/>
              </span>
            )}
          </div>
          <h1 style={{ fontFamily:"'Playfair Display', serif", fontSize:"clamp(32px,5vw,50px)", fontWeight:700, color:S.white, margin:"0 0 8px", lineHeight:1.1 }}>{stage.title}</h1>
          <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"15px", color:stage.color, marginBottom:"12px", letterSpacing:"0.02em" }}>{stage.subtitle}</p>
          <div style={{ width:"72px", height:"1.5px", background:`linear-gradient(90deg, ${stage.color}, transparent)`, marginBottom:"22px" }}/>
          <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"16px", color:S.mutedMd, lineHeight:1.85, marginBottom:"40px" }}>{stage.desc}</p>
        </motion.div>

        {/* Section tabs */}
        <div style={{ display:"flex", gap:"8px", marginBottom:"32px", flexWrap:"wrap" }}>
          {stage.sections.map((s, i) => (
            <motion.button key={i} onClick={() => setActiveSection(i)} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
              style={{ padding:"9px 18px", borderRadius:"9px", border:"none", cursor:"pointer", fontFamily:"'Cormorant Garamond', serif", fontSize:"12px", fontWeight:600, letterSpacing:"0.05em", background: activeSection===i ? stage.color : "rgba(168,169,173,0.07)", color: activeSection===i ? "#08080F" : S.muted, transition:"all 0.22s ease", boxShadow: activeSection===i ? `0 4px 18px rgba(${hexToRgb(stage.color)},0.28)` : "none" }}>
              {s.heading}
            </motion.button>
          ))}
        </div>

        {/* Section content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeSection} initial={{ opacity:0, x:18 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-18 }} transition={{ duration:0.3, ease:[0.25,0.46,0.45,0.94] }}>
            {/* Explanation */}
            <div style={{ background:"rgba(13,13,22,0.9)", border:"1px solid rgba(168,169,173,0.1)", borderRadius:"15px", padding:"26px 30px", marginBottom:"20px" }}>
              <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:"20px", color:S.white, marginBottom:"14px", fontWeight:700 }}>{sec.heading}</h2>
              {sec.body.split("\n").map((line, i) => (
                line.trim() === "" ? <div key={i} style={{ height:"10px" }}/> :
                <p key={i} style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"15px", color:S.mutedMd, lineHeight:1.85, marginBottom:"4px" }}>{line}</p>
              ))}
            </div>

            {/* Examples */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px", marginBottom:"28px" }}>
              {[sec.example, sec.example2].map((ex, ei) => (
                <div key={ei} style={{ background: ei===0 ? "rgba(255,70,70,0.04)" : `rgba(${hexToRgb(stage.color)},0.05)`, border: ei===0 ? "1px solid rgba(255,80,80,0.13)" : `1px solid rgba(${hexToRgb(stage.color)},0.18)`, borderRadius:"13px", padding:"18px 20px" }}>
                  <div style={{ fontSize:"9px", letterSpacing:"0.2em", textTransform:"uppercase", fontFamily:"'Cormorant Garamond', serif", fontWeight:600, color: ei===0 ? "rgba(255,110,110,0.7)" : stage.color, marginBottom:"10px" }}>{ex.label}</div>
                  <pre style={{ fontFamily:"'Courier New', monospace", fontSize:"12px", color: ei===0 ? "rgba(255,170,170,0.7)" : S.mutedMd, lineHeight:1.7, whiteSpace:"pre-wrap", wordBreak:"break-word", margin:0 }}>{ex.text}</pre>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Tips */}
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
          style={{ background:`rgba(${hexToRgb(stage.color)},0.05)`, border:`1px solid rgba(${hexToRgb(stage.color)},0.16)`, borderRadius:"15px", padding:"24px 28px", marginBottom:"40px" }}>
          <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"10px", letterSpacing:"0.2em", textTransform:"uppercase", fontWeight:600, color:stage.color, marginBottom:"14px" }}>Key Principles</div>
          {stage.tips.map((tip, i) => (
            <motion.div key={i} initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.35+i*0.07 }}
              style={{ display:"flex", gap:"10px", alignItems:"flex-start", marginBottom: i<stage.tips.length-1 ? "12px" : "0" }}>
              <span style={{ color:stage.color, fontSize:"10px", marginTop:"4px", flexShrink:0, opacity:0.7 }}>◆</span>
              <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"14px", color:S.mutedMd, lineHeight:1.65 }}>{tip}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Action buttons */}
        <div style={{ display:"flex", gap:"14px", justifyContent:"center", flexWrap:"wrap" }}>
          {/* Take Quiz */}
          <motion.button onClick={onOpenQuiz}
            whileHover={{ scale:1.04, boxShadow:`0 12px 40px rgba(${hexToRgb(stage.color)},0.32)` }} whileTap={{ scale:0.97 }}
            style={{ padding:"15px 44px", borderRadius:"11px", border:"none", cursor:"pointer", background:`linear-gradient(135deg, ${stage.color} 0%, ${S.silverLt} 100%)`, color:"#08080F", fontFamily:"'Cormorant Garamond', serif", fontWeight:700, fontSize:"12px", letterSpacing:"0.18em", textTransform:"uppercase" }}>
            {completed ? "Retake Quiz" : "Take the Quiz"}
          </motion.button>
          <motion.button onClick={onBack}
            whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            style={{ padding:"15px 28px", borderRadius:"11px", background:"rgba(168,169,173,0.07)", border:"1px solid rgba(168,169,173,0.16)", color:S.muted, fontFamily:"'Cormorant Garamond', serif", fontWeight:600, fontSize:"12px", letterSpacing:"0.14em", textTransform:"uppercase", cursor:"pointer" }}>
            Back to Journey
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Home Page ────────────────────────────────────────────────────────────────
const HomePage = ({ completed, stageStarsMap, onOpenStage }) => {
  const { scrollY } = useScroll();
  const heroY  = useTransform(scrollY, [0,350], [0,-50]);
  const heroOp = useTransform(scrollY, [0,280], [1,0.65]);
  const courseComplete = completed.length === STAGES.length;

  return (
    <div style={{ background:S.bg, minHeight:"100vh", paddingTop:"64px" }}>
      {/* Hero */}
      <motion.div style={{ y:heroY, opacity:heroOp }} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.75, ease:[0.25,0.46,0.45,0.94] }}>
        <div style={{ textAlign:"center", padding:"72px 32px 36px" }}>
          <motion.h1 initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15, duration:0.6 }}
            style={{ fontFamily:"'Playfair Display', serif", fontSize:"clamp(38px,6vw,68px)", fontWeight:700, color:S.white, margin:"0 0 6px", lineHeight:1.06 }}>
            Welcome, <span style={{ color:S.silverLt }}>Aadarsh Rao</span>
          </motion.h1>
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.25 }}
            style={{ width:"60px", height:"1.5px", background:`linear-gradient(90deg, transparent, ${S.silver}, transparent)`, margin:"14px auto 20px" }}/>
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
            style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"16px", color:S.muted, maxWidth:"520px", margin:"0 auto 28px", lineHeight:1.8 }}>
            Master the art of prompt engineering through an interactive journey. Each stage brings you closer to becoming a prompt expert.
          </motion.p>

          {/* Progress */}
          <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
            style={{ display:"inline-flex", flexDirection:"column", alignItems:"center", gap:"10px" }}>
            <div style={{ display:"flex", gap:"5px" }}>
              {STAGES.map(s => (
                <div key={s.id} style={{ width:"22px", height:"4px", borderRadius:"2px", background: completed.includes(s.id) ? s.color : "rgba(168,169,173,0.12)", boxShadow: completed.includes(s.id) ? `0 0 6px ${s.glow}` : "none", transition:"all 0.4s" }}/>
              ))}
            </div>
            <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"11px", color:S.muted, letterSpacing:"0.08em" }}>
              {completed.length} of {STAGES.length} stages completed
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Roadmap heading */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.44 }}
        style={{ textAlign:"center", padding:"24px 32px 52px" }}>
        <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:"clamp(22px,3.5vw,34px)", fontWeight:700, color:S.white, marginBottom:"8px" }}>
          Your Learning Journey
        </h2>
        <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"13px", color:S.muted }}>
          {courseComplete ? "All stages complete — review any stage below." : "Select an unlocked stage to begin learning"}
        </p>
      </motion.div>

      {/* Zigzag Roadmap */}
      <div style={{ maxWidth:"820px", margin:"0 auto", padding:"0 24px 100px", position:"relative" }}>
        <div style={{ position:"absolute", left:"50%", top:0, bottom:0, width:"1.5px", background:"linear-gradient(180deg, transparent, rgba(168,169,173,0.09) 4%, rgba(168,169,173,0.09) 96%, transparent)", transform:"translateX(-50%)", zIndex:0 }}/>

        {STAGES.map((stage, i) => {
          const unlocked    = i===0 || completed.includes(STAGES[i-1].id);
          const isCompleted = completed.includes(stage.id);
          const stars       = stageStarsMap[stage.id] || 0;
          return (
            <div key={stage.id} style={{ position:"relative" }}>
              <div style={{ paddingTop: i===0?0:"14px", paddingBottom:"14px" }}>
                <StageNode stage={stage} index={i} unlocked={unlocked} completed={isCompleted} stageStars={stars} onClick={onOpenStage}/>
              </div>
              {i < STAGES.length-1 && (
                <div style={{ display:"flex", justifyContent:"center", height:"52px", position:"relative", zIndex:1 }}>
                  <div style={{ width:"1.5px", height:"100%", background:`linear-gradient(180deg, rgba(${hexToRgb(stage.color)},0.42), rgba(${hexToRgb(STAGES[i+1].color)},0.25))` }}/>
                </div>
              )}
            </div>
          );
        })}

        {/* Finish */}
        <motion.div initial={{ opacity:0, scale:0.85 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }}
          style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"10px", paddingTop:"16px" }}>
          <motion.div
            animate={courseComplete ? { boxShadow:["0 0 10px rgba(200,201,204,0.1)","0 0 30px rgba(200,201,204,0.4)","0 0 10px rgba(200,201,204,0.1)"] } : { y:[0,-4,0] }}
            transition={{ duration: courseComplete?2:3, repeat:Infinity, ease:"easeInOut" }}
            style={{ width:"52px", height:"52px", borderRadius:"50%", background: courseComplete?"rgba(200,201,204,0.12)":"rgba(168,169,173,0.05)", border:`1.5px solid ${courseComplete?"rgba(200,201,204,0.45)":"rgba(168,169,173,0.14)"}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <polygon points="10,2 12,8 18,8 13,12 15,18 10,14 5,18 7,12 2,8 8,8" fill={courseComplete?"#FFD700":"rgba(168,169,173,0.3)"} />
            </svg>
          </motion.div>
          <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"10px", color: courseComplete?S.silverLt:S.muted, letterSpacing:"0.14em", textTransform:"uppercase" }}>
            {courseComplete ? "Prompt Master — Achieved" : "Prompt Master"}
          </span>
          {courseComplete && <StarRow earned={3} size={14} gap={4}/>}
        </motion.div>
      </div>
    </div>
  );
};

// ─── Prompt Lab ───────────────────────────────────────────────────────────────
const TECHNIQUES = [
  { label:"Role Prompting",    icon:"◇", insert:"You are a [expert role]. " },
  { label:"Few-Shot",          icon:"◆", insert:"Example 1: [input] → [output]\nExample 2: [input] → [output]\n\nNow: " },
  { label:"Chain of Thought",  icon:"⬡", insert:"Think through this step by step:\n1. First, consider...\n2. Then...\n3. Finally...\n\n" },
  { label:"Constraints",       icon:"◈", insert:"[Your task here]\n\nConstraints:\n- Max 150 words\n- Formal tone\n- No jargon\n- Structured output" },
  { label:"Output Format",     icon:"◉", insert:"[Your task here]\n\nRespond ONLY as a JSON object:\n{\n  \"answer\": string,\n  \"confidence\": number,\n  \"reasoning\": string\n}" },
  { label:"Audience",          icon:"◑", insert:"Explain [topic] to a [audience, e.g. 10-year-old / CFO / expert]. Use [analogies / data / plain language]." },
];

function analysePrompt(text) {
  const words   = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars   = text.length;
  const hasRole = /you are|act as|as a|as an/i.test(text);
  const hasFmt  = /json|markdown|table|bullet|list|paragraph|numbered/i.test(text);
  const hasCon  = /max|limit|only|must|avoid|no |don't|do not|within/i.test(text);
  const hasCot  = /step by step|think through|first.*then|reasoning|let's think/i.test(text);
  const hasAud  = /for a|audience|explain to|aimed at/i.test(text);
  const hasCtx  = /context:|background:|given that|note that/i.test(text);

  const signals = [hasRole, hasFmt, hasCon, hasCot, hasAud, hasCtx];
  const score   = signals.filter(Boolean).length;

  const clarity = Math.min(100, Math.round(
    (words > 5 ? 20 : words * 4) +
    (score / 6) * 50 +
    (chars > 80 ? 20 : chars * 0.25) +
    (words > 30 ? 10 : 0)
  ));

  const tips = [];
  if (!hasRole) tips.push({ t:"Add a role", d:"Start with 'You are a [expert]...' to activate domain-specific patterns." });
  if (!hasFmt)  tips.push({ t:"Specify output format", d:"Tell the model how to structure its response — JSON, bullet list, table, etc." });
  if (!hasCon)  tips.push({ t:"Add constraints", d:"Set limits: word count, tone, forbidden phrases. Constraints sharpen output." });
  if (!hasCot)  tips.push({ t:"Use chain-of-thought", d:"Add 'Think step by step' for complex tasks. Reduces reasoning errors significantly." });
  if (!hasAud)  tips.push({ t:"Define your audience", d:"'Explain for a [role/age]' changes vocabulary and depth automatically." });
  if (!hasCtx)  tips.push({ t:"Provide context", d:"Background information reduces hallucination and improves relevance." });

  return { words, chars, clarity, signals:{ hasRole, hasFmt, hasCon, hasCot, hasAud, hasCtx }, tips: tips.slice(0,3) };
}

const BACKEND = "http://localhost:5000";

const PromptLabPage = ({ onBack }) => {
  const [prompt,       setPrompt]       = useState("");
  const [response,     setResponse]     = useState("");
  const [loading,      setLoading]      = useState(false);
  const [history,      setHistory]      = useState([]);
  const [activeTab,    setActiveTab]    = useState("lab");
  const [saved,        setSaved]        = useState([]);
  const [isSaved,      setIsSaved]      = useState(false);
  const [backendOk,    setBackendOk]    = useState(null); // null=checking, true, false
  const [nlpAnalysis,  setNlpAnalysis]  = useState(null); // from backend
  const [nlpIntent,    setNlpIntent]    = useState(null);
  const responseRef  = useRef(null);
  const textareaRef  = useRef(null);
  const analyseTimer = useRef(null);

  // ── Check backend health on mount ───────────────────────────────────────────
  useEffect(() => {
    fetch(`${BACKEND}/api/health`)
      .then(r => r.json())
      .then(d => setBackendOk(d.all_ready === true))
      .catch(() => setBackendOk(false));
  }, []);

  // ── Load history + saved from backend on mount ───────────────────────────
  useEffect(() => {
    if (!backendOk) return;
    fetch(`${BACKEND}/api/history`).then(r=>r.json()).then(d => setHistory(d.history||[])).catch(()=>{});
    fetch(`${BACKEND}/api/history/saved`).then(r=>r.json()).then(d => setSaved(d.saved||[])).catch(()=>{});
  }, [backendOk]);

  // ── Live analysis as user types (debounced 400ms) ─────────────────────────
  useEffect(() => {
    if (!backendOk || prompt.length < 10) { setNlpAnalysis(null); setNlpIntent(null); return; }
    clearTimeout(analyseTimer.current);
    analyseTimer.current = setTimeout(async () => {
      try {
        const res  = await fetch(`${BACKEND}/api/analyse`, {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ prompt }),
        });
        const data = await res.json();
        if (data.quality) setNlpAnalysis(data.quality);
        if (data.intent)  setNlpIntent(data.intent);
      } catch {}
    }, 400);
    return () => clearTimeout(analyseTimer.current);
  }, [prompt, backendOk]);

  // ── Fallback local analysis (used if backend offline) ─────────────────────
  const localAnalysis = analysePrompt(prompt);

  // Use backend analysis when available, local as fallback
  const analysis = nlpAnalysis ? {
    clarity:  nlpAnalysis.quality_score,
    words:    nlpAnalysis.stats?.word_count  ?? localAnalysis.words,
    chars:    nlpAnalysis.stats?.char_count  ?? localAnalysis.chars,
    signals: {
      hasRole: nlpAnalysis.signals?.has_role        ?? false,
      hasFmt:  nlpAnalysis.signals?.has_format       ?? false,
      hasCon:  nlpAnalysis.signals?.has_constraints  ?? false,
      hasCot:  nlpAnalysis.signals?.has_cot          ?? false,
      hasAud:  nlpAnalysis.signals?.has_audience     ?? false,
      hasCtx:  nlpAnalysis.signals?.has_context      ?? false,
    },
    tips: (nlpAnalysis.tips||[]).map(t=>({ t: t.title, d: t.description })),
  } : localAnalysis;

  // ── Generate via Python backend ────────────────────────────────────────────
  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResponse("");
    setIsSaved(false);
    try {
      if (!backendOk) throw new Error("Python backend is not running. Start it with: python app.py");
      const res  = await fetch(`${BACKEND}/api/generate`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ prompt, max_words: 350 }),
      });
      const data = await res.json();

      // Set response text
      const text = data.generation?.response || "No response returned.";
      setResponse(text);
      if (responseRef.current) responseRef.current.scrollTop = responseRef.current.scrollHeight;

      // Update NLP analysis from generate response (more accurate — full pipeline ran)
      if (data.quality) setNlpAnalysis(data.quality);
      if (data.intent)  setNlpIntent(data.intent);

      // Refresh history from backend
      fetch(`${BACKEND}/api/history`).then(r=>r.json()).then(d=>setHistory(d.history||[])).catch(()=>{});

    } catch(e) {
      setResponse("⚠ " + (e.message || "Request failed."));
    }
    setLoading(false);
  };

  const insertTechnique = (ins) => {
    const ta = textareaRef.current;
    if (!ta) { setPrompt(p => p + ins); return; }
    const start = ta.selectionStart, end = ta.selectionEnd;
    setPrompt(prompt.slice(0,start) + ins + prompt.slice(end));
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + ins.length; ta.focus(); }, 0);
  };

  const savePrompt = async () => {
    if (!prompt.trim()) return;
    try {
      await fetch(`${BACKEND}/api/history/save`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ prompt }),
      });
      const d = await fetch(`${BACKEND}/api/history/saved`).then(r=>r.json());
      setSaved(d.saved||[]);
    } catch {
      setSaved(s => [{ id:Date.now(), prompt, ts:new Date().toISOString() }, ...s].slice(0,10));
    }
    setIsSaved(true);
  };

  const deleteSaved = async (id) => {
    try {
      await fetch(`${BACKEND}/api/history/saved/${id}`, { method:"DELETE" });
      setSaved(s => s.filter(x => x.id !== id));
    } catch {
      setSaved(s => s.filter(x => x.id !== id));
    }
  };

  const loadFromHistory = (item) => {
    setPrompt(item.prompt);
    setResponse(item.response || "");
    setActiveTab("lab");
  };

  const score        = analysis.clarity ?? 0;
  const clarityColor = score >= 70 ? "#7EC8A4" : score >= 40 ? "#D4A574" : "#C47FA0";
  const clarityLabel = score >= 70 ? "Strong"  : score >= 40 ? "Fair"    : "Weak";

  // Backend status badge
  const statusDot = backendOk === null
    ? { color:"#D4A574", label:"Checking…" }
    : backendOk
      ? { color:"#7EC8A4", label:"Backend ready" }
      : { color:"#C47FA0", label:"Backend offline — run python app.py" };

  return (
    <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-16 }}
      transition={{ duration:0.45, ease:[0.25,0.46,0.45,0.94] }}
      style={{ minHeight:"100vh", background:S.bg, paddingTop:"64px" }}>

      {/* Header */}
      <div style={{ borderBottom:"1px solid rgba(168,169,173,0.09)", background:"rgba(8,8,15,0.6)", backdropFilter:"blur(12px)", padding:"28px 48px 24px", position:"sticky", top:"64px", zIndex:50 }}>
        <div style={{ maxWidth:"1300px", margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"5px" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 15L7 11M7 11C7 11 8 9 9 8C10 7 12 6 14 4C15 3 15 5 14 6C13 7 11 9 10 10C9 11 7 11 7 11Z" stroke={S.silver} strokeWidth="1.2" strokeLinecap="round"/>
                <circle cx="14" cy="4" r="1.5" fill={S.silverLt} opacity="0.7"/>
              </svg>
              <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"10px", letterSpacing:"0.24em", textTransform:"uppercase", fontWeight:600, color:S.silver }}>Prompt Lab</span>
            </div>
            <h1 style={{ fontFamily:"'Playfair Display', serif", fontSize:"clamp(24px,3vw,34px)", fontWeight:700, color:S.white, margin:0, lineHeight:1.1 }}>
              Interactive <span style={{ color:S.silverLt }}>Prompt Lab</span>
            </h1>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginTop:"6px" }}>
              <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"13px", color:S.muted, margin:0 }}>
                Write, test, and analyse your prompts with real-time NLP feedback
              </p>
              <div style={{ display:"flex", alignItems:"center", gap:"5px", padding:"3px 10px", borderRadius:"6px", background:"rgba(13,13,22,0.8)", border:`1px solid ${statusDot.color}33` }}>
                <motion.div animate={{ opacity: backendOk===null ? [1,0.3,1] : 1 }} transition={{ duration:1, repeat: backendOk===null ? Infinity : 0 }}
                  style={{ width:"6px", height:"6px", borderRadius:"50%", background:statusDot.color, flexShrink:0 }}/>
                <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"10px", color:statusDot.color, letterSpacing:"0.06em", whiteSpace:"nowrap" }}>
                  {statusDot.label}
                </span>
              </div>
            </div>
          </div>

          {/* Tab switcher */}
          <div style={{ display:"flex", gap:"4px", background:"rgba(168,169,173,0.06)", borderRadius:"10px", padding:"4px", border:"1px solid rgba(168,169,173,0.1)" }}>
            {[["lab","◈  Lab"],["history","◉  History"]].map(([k,l]) => (
              <motion.button key={k} onClick={() => setActiveTab(k)} whileTap={{ scale:0.97 }}
                style={{ padding:"7px 18px", borderRadius:"7px", border:"none", cursor:"pointer", fontFamily:"'Cormorant Garamond', serif", fontSize:"12px", fontWeight:600, letterSpacing:"0.06em", transition:"all 0.2s",
                  background: activeTab===k ? "rgba(168,169,173,0.15)" : "transparent",
                  color: activeTab===k ? S.white : S.muted,
                  boxShadow: activeTab===k ? "0 2px 8px rgba(0,0,0,0.3)" : "none"
                }}>{l}</motion.button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:"1300px", margin:"0 auto", padding:"32px 48px 80px" }}>
        <AnimatePresence mode="wait">

          {/* ── LAB TAB ─────────────────────────────────────────── */}
          {activeTab === "lab" && (
            <motion.div key="lab" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}>

              {/* Technique chips */}
              <div style={{ marginBottom:"24px" }}>
                <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"10px", letterSpacing:"0.2em", textTransform:"uppercase", color:S.muted, marginBottom:"10px" }}>Quick Techniques — click to insert</div>
                <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                  {TECHNIQUES.map((t) => (
                    <motion.button key={t.label} onClick={() => insertTechnique(t.insert)}
                      whileHover={{ scale:1.04, y:-1 }} whileTap={{ scale:0.97 }}
                      style={{ display:"inline-flex", alignItems:"center", gap:"6px", padding:"7px 14px", borderRadius:"8px", border:"1px solid rgba(168,169,173,0.16)", background:"rgba(168,169,173,0.05)", cursor:"pointer", fontFamily:"'Cormorant Garamond', serif", fontSize:"12px", color:S.mutedMd, letterSpacing:"0.04em", transition:"all 0.2s" }}>
                      <span style={{ color:S.silver, fontSize:"11px" }}>{t.icon}</span> {t.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Main grid */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px", alignItems:"start" }}>

                {/* LEFT — Prompt input */}
                <div>
                  <div style={{ background:"rgba(13,13,22,0.97)", border:"1px solid rgba(168,169,173,0.13)", borderRadius:"16px", overflow:"hidden" }}>
                    <div style={{ padding:"18px 20px 12px", borderBottom:"1px solid rgba(168,169,173,0.07)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <span style={{ fontFamily:"'Playfair Display', serif", fontSize:"15px", fontWeight:700, color:S.white }}>Your Prompt</span>
                      <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                        <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"11px", color:S.muted }}>{analysis.chars} chars · {analysis.words} words</span>
                        <motion.button onClick={savePrompt} whileHover={{ scale:1.08 }} whileTap={{ scale:0.94 }}
                          title="Save prompt"
                          style={{ width:"28px", height:"28px", borderRadius:"7px", border:`1px solid ${isSaved?"rgba(126,200,164,0.4)":"rgba(168,169,173,0.16)"}`, background:isSaved?"rgba(126,200,164,0.1)":"rgba(168,169,173,0.05)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:isSaved?"#7EC8A4":S.muted, fontSize:"13px", transition:"all 0.2s" }}>
                          {isSaved ? "✦" : "☆"}
                        </motion.button>
                      </div>
                    </div>
                    <textarea ref={textareaRef} value={prompt} onChange={e => { setPrompt(e.target.value); setIsSaved(false); }}
                      placeholder={"Type your prompt here...\n\nTip: Use the technique chips above to insert proven prompt structures."}
                      onKeyDown={e => { if (e.key==="Enter" && (e.metaKey||e.ctrlKey)) generate(); }}
                      style={{ width:"100%", minHeight:"280px", background:"transparent", border:"none", outline:"none", resize:"vertical", padding:"20px", fontFamily:"'Courier New', monospace", fontSize:"13px", color:S.mutedMd, lineHeight:1.75, caretColor:S.silverLt }}/>
                    <div style={{ padding:"12px 20px 16px", borderTop:"1px solid rgba(168,169,173,0.07)", display:"flex", alignItems:"center", gap:"10px" }}>
                      <motion.button onClick={generate} disabled={!prompt.trim() || loading}
                        whileHover={prompt.trim()&&!loading ? { scale:1.02, boxShadow:"0 8px 28px rgba(168,169,173,0.22)" } : {}}
                        whileTap={prompt.trim()&&!loading ? { scale:0.98 } : {}}
                        style={{ flex:1, padding:"12px 20px", borderRadius:"10px", border:"none", cursor:prompt.trim()&&!loading?"pointer":"not-allowed", fontFamily:"'Cormorant Garamond', serif", fontWeight:700, fontSize:"12px", letterSpacing:"0.16em", textTransform:"uppercase", transition:"all 0.3s",
                          background: prompt.trim()&&!loading ? `linear-gradient(135deg, ${S.silver}, #7E8194)` : "rgba(168,169,173,0.08)",
                          color: prompt.trim()&&!loading ? "#08080F" : "rgba(168,169,173,0.3)",
                          opacity: loading ? 0.7 : 1 }}>
                        {loading ? (
                          <span style={{ display:"inline-flex", alignItems:"center", gap:"8px" }}>
                            <motion.span animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:"linear" }} style={{ display:"inline-block" }}>◈</motion.span>
                            Generating…
                          </span>
                        ) : "⟶  Generate Response"}
                      </motion.button>
                      {prompt && (
                        <motion.button initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}
                          onClick={() => { setPrompt(""); setResponse(""); setIsSaved(false); }}
                          whileHover={{ scale:1.08 }} whileTap={{ scale:0.94 }}
                          style={{ padding:"12px 14px", borderRadius:"10px", border:"1px solid rgba(168,169,173,0.14)", background:"rgba(168,169,173,0.05)", cursor:"pointer", fontFamily:"'Cormorant Garamond', serif", fontSize:"11px", color:S.muted, letterSpacing:"0.08em", whiteSpace:"nowrap" }}>
                          Clear
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT — Response */}
                <div>
                  <div style={{ background:"rgba(13,13,22,0.97)", border:"1px solid rgba(168,169,173,0.13)", borderRadius:"16px", overflow:"hidden" }}>
                    <div style={{ padding:"18px 20px 12px", borderBottom:"1px solid rgba(168,169,173,0.07)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                        <span style={{ fontFamily:"'Playfair Display', serif", fontSize:"15px", fontWeight:700, color:S.white }}>AI Response</span>
                        {nlpIntent && (
                          <motion.span initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }}
                            style={{ padding:"2px 9px", borderRadius:"5px", background:"rgba(168,169,173,0.1)", border:"1px solid rgba(168,169,173,0.2)", fontFamily:"'Cormorant Garamond', serif", fontSize:"10px", color:S.silver, letterSpacing:"0.1em" }}>
                            {nlpIntent.primary_intent} · {Math.round(nlpIntent.confidence*100)}%
                          </motion.span>
                        )}
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                        {loading && (
                          <motion.div animate={{ opacity:[1,0.4,1] }} transition={{ duration:0.8, repeat:Infinity }}
                            style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#7EC8A4" }}/>
                        )}
                        {response && !loading && (
                          <motion.button initial={{ opacity:0 }} animate={{ opacity:1 }}
                            onClick={() => navigator.clipboard?.writeText(response)}
                            whileHover={{ scale:1.08 }} whileTap={{ scale:0.94 }}
                            style={{ padding:"4px 10px", borderRadius:"6px", border:"1px solid rgba(168,169,173,0.14)", background:"rgba(168,169,173,0.05)", cursor:"pointer", fontFamily:"'Cormorant Garamond', serif", fontSize:"10px", color:S.muted, letterSpacing:"0.1em" }}>
                            Copy
                          </motion.button>
                        )}
                      </div>
                    </div>
                    <div ref={responseRef} style={{ minHeight:"280px", maxHeight:"520px", overflowY:"auto", padding:"20px" }}>
                      {response ? (
                        <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"15px", color:S.mutedMd, lineHeight:1.85, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
                          {response}
                          {loading && <motion.span animate={{ opacity:[1,0] }} transition={{ duration:0.5, repeat:Infinity }} style={{ display:"inline-block", marginLeft:"2px", color:S.silver }}>▌</motion.span>}
                        </div>
                      ) : (
                        <div style={{ height:"240px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"12px" }}>
                          <motion.div animate={{ opacity:[0.3,0.6,0.3], scale:[0.98,1.02,0.98] }} transition={{ duration:3, repeat:Infinity, ease:"easeInOut" }}>
                            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                              <circle cx="18" cy="18" r="16" stroke="rgba(168,169,173,0.15)" strokeWidth="1"/>
                              <circle cx="18" cy="18" r="10" stroke="rgba(168,169,173,0.1)" strokeWidth="0.7"/>
                              <polygon points="18,10 20,15 25,15 21,18.5 22.5,23.5 18,20.5 13.5,23.5 15,18.5 11,15 16,15" fill="rgba(168,169,173,0.18)"/>
                            </svg>
                          </motion.div>
                          <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"13px", color:"rgba(168,169,173,0.28)", letterSpacing:"0.05em" }}>
                            AI response will appear here
                          </span>
                          <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"11px", color:"rgba(168,169,173,0.18)" }}>
                            ⌘ + Enter to generate
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── PROMPT ANALYSIS — Full-width prominent section ── */}
              <AnimatePresence>
                {prompt.length > 10 && (
                  <motion.div
                    initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }}
                    transition={{ duration:0.4, ease:[0.25,0.46,0.45,0.94] }}
                    style={{ marginTop:"28px", position:"relative", overflow:"hidden" }}>

                    <div style={{ position:"absolute", inset:0, borderRadius:"20px", background:`radial-gradient(ellipse 60% 80% at 50% 0%, rgba(${hexToRgb(clarityColor)},0.06) 0%, transparent 70%)`, pointerEvents:"none" }}/>

                    <div style={{ background:"rgba(10,10,18,0.98)", border:`1px solid rgba(${hexToRgb(clarityColor)},0.22)`, borderRadius:"20px", overflow:"hidden" }}>

                      {/* Section header — PROMPT ANALYSIS centered */}
                      <div style={{ padding:"28px 32px 22px", textAlign:"center", borderBottom:"1px solid rgba(168,169,173,0.07)" }}>
                        <div style={{ display:"inline-flex", alignItems:"center", gap:"12px", marginBottom:"16px" }}>
                          <motion.div animate={{ opacity:[0.4,1,0.4] }} transition={{ duration:2.5, repeat:Infinity }}
                            style={{ width:"5px", height:"5px", borderRadius:"50%", background:clarityColor }}/>
                          <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"10px", letterSpacing:"0.36em", textTransform:"uppercase", color:S.muted }}>
                            Prompt Analysis
                          </span>
                          <motion.div animate={{ opacity:[0.4,1,0.4] }} transition={{ duration:2.5, repeat:Infinity, delay:1.25 }}
                            style={{ width:"5px", height:"5px", borderRadius:"50%", background:clarityColor }}/>
                        </div>

                        {/* Clarity score — large centered */}
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"12px" }}>
                          <div style={{ display:"flex", alignItems:"baseline", gap:"10px" }}>
                            <span style={{ fontFamily:"'Playfair Display', serif", fontSize:"48px", fontWeight:700, color:clarityColor, lineHeight:1 }}>{analysis.clarity}</span>
                            <div style={{ display:"flex", flexDirection:"column", gap:"2px", textAlign:"left" }}>
                              <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"14px", fontWeight:600, color:clarityColor, letterSpacing:"0.14em", textTransform:"uppercase" }}>{clarityLabel}</span>
                              <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"11px", color:S.muted }}>out of 100</span>
                            </div>
                          </div>
                          <div style={{ width:"360px", height:"6px", background:"rgba(168,169,173,0.08)", borderRadius:"3px", overflow:"hidden" }}>
                            <motion.div animate={{ width:`${analysis.clarity}%` }} transition={{ duration:0.7, ease:"easeOut" }}
                              style={{ height:"100%", borderRadius:"3px", background:`linear-gradient(90deg, ${clarityColor}66, ${clarityColor})` }}/>
                          </div>
                        </div>
                      </div>

                      {/* Signal badges — centered prominent row */}
                      <div style={{ padding:"20px 32px", borderBottom:"1px solid rgba(168,169,173,0.07)", display:"flex", justifyContent:"center", gap:"8px", flexWrap:"wrap" }}>
                        {[
                          ["Role",        analysis.signals.hasRole,  "◇"],
                          ["Format",      analysis.signals.hasFmt,   "□"],
                          ["Constraints", analysis.signals.hasCon,   "◈"],
                          ["CoT",         analysis.signals.hasCot,   "⬡"],
                          ["Audience",    analysis.signals.hasAud,   "◑"],
                          ["Context",     analysis.signals.hasCtx,   "◉"],
                        ].map(([label, active, icon]) => (
                          <span key={label} style={{ display:"inline-flex", alignItems:"center", gap:"6px", padding:"8px 16px", borderRadius:"8px", fontFamily:"'Cormorant Garamond', serif", fontSize:"12px", letterSpacing:"0.08em", fontWeight:600, transition:"all 0.3s",
                            background: active ? `rgba(${hexToRgb(clarityColor)},0.12)` : "rgba(168,169,173,0.04)",
                            color:      active ? clarityColor : "rgba(168,169,173,0.28)",
                            border:     `1px solid ${active ? `rgba(${hexToRgb(clarityColor)},0.35)` : "rgba(168,169,173,0.08)"}`,
                            boxShadow:  active ? `0 0 14px rgba(${hexToRgb(clarityColor)},0.1)` : "none" }}>
                            <span style={{ fontSize:"13px", opacity: active ? 1 : 0.35 }}>{icon}</span>
                            {active ? "✓ " : "○ "}{label}
                          </span>
                        ))}
                      </div>

                      {/* Tips — full-width grid of cards */}
                      {analysis.tips.length > 0 && (
                        <div style={{ padding:"22px 32px 28px" }}>
                          <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"9px", letterSpacing:"0.26em", textTransform:"uppercase", color:S.muted, marginBottom:"16px", textAlign:"center" }}>
                            Improvement Suggestions
                          </div>
                          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:"10px" }}>
                            {analysis.tips.map((tip, i) => (
                              <motion.div key={i}
                                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}
                                style={{ display:"flex", gap:"12px", padding:"14px 16px", borderRadius:"12px", background:"rgba(168,169,173,0.03)", border:`1px solid rgba(${hexToRgb(clarityColor)},0.14)` }}>
                                <span style={{ color:clarityColor, flexShrink:0, fontSize:"14px", marginTop:"2px" }}>→</span>
                                <div>
                                  <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"13px", fontWeight:600, color:S.silverLt, marginBottom:"3px" }}>{tip.t}</div>
                                  <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"12px", color:S.muted, lineHeight:1.65 }}>{tip.d}</div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                      {analysis.tips.length === 0 && (
                        <div style={{ padding:"24px 32px", textAlign:"center" }}>
                          <motion.span animate={{ scale:[1,1.1,1] }} transition={{ duration:1.5, repeat:Infinity }}
                            style={{ display:"inline-block", fontFamily:"'Playfair Display', serif", fontSize:"24px", color:clarityColor }}>✦</motion.span>
                          <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"14px", color:clarityColor, marginTop:"8px" }}>All signals detected — your prompt is firing on all cylinders</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}

          {/* ── HISTORY TAB ─────────────────────────────────────── */}
          {activeTab === "history" && (
            <motion.div key="history" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>

                {/* Recent runs */}
                <div>
                  <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"10px", letterSpacing:"0.2em", textTransform:"uppercase", color:S.muted, marginBottom:"12px" }}>Recent Runs ({history.length})</div>
                  {history.length === 0 ? (
                    <div style={{ padding:"48px 24px", textAlign:"center", background:"rgba(13,13,22,0.95)", borderRadius:"14px", border:"1px solid rgba(168,169,173,0.08)" }}>
                      <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"14px", color:"rgba(168,169,173,0.3)" }}>No runs yet — generate a response in the Lab tab to see history here.</p>
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                      {history.map((item, i) => (
                        <motion.div key={item.id} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
                          onClick={() => loadFromHistory(item)}
                          whileHover={{ scale:1.01, x:2 }}
                          style={{ padding:"16px 18px", background:"rgba(13,13,22,0.97)", border:"1px solid rgba(168,169,173,0.1)", borderRadius:"12px", cursor:"pointer", transition:"all 0.2s" }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                              <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:(item.analysis?.clarity ?? 0) >= 70 ? "#7EC8A4" : (item.analysis?.clarity ?? 0) >= 40 ? "#D4A574" : "#C47FA0" }}/>
                              <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"10px", color:S.muted }}>
                                {item.analysis?.words ?? 0}w · {item.analysis?.chars ?? 0}c
                              </span>
                            </div>
                            <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"10px", color:"rgba(168,169,173,0.28)" }}>
                              {new Date(item.ts).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
                            </span>
                          </div>
                          <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"13px", color:S.mutedMd, lineHeight:1.5, margin:0, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                            {item.prompt}
                          </p>
                          <div style={{ marginTop:"8px", display:"flex", gap:"4px", flexWrap:"wrap" }}>
                            {Object.entries(item.analysis?.signals ?? {}).filter(([,v])=>v).map(([k]) => (
                              <span key={k} style={{ padding:"2px 7px", borderRadius:"4px", background:"rgba(168,169,173,0.07)", border:"1px solid rgba(168,169,173,0.12)", fontFamily:"'Cormorant Garamond', serif", fontSize:"9px", color:"rgba(168,169,173,0.55)", letterSpacing:"0.08em" }}>
                                {k.replace("has","")}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Saved prompts */}
                <div>
                  <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"10px", letterSpacing:"0.2em", textTransform:"uppercase", color:S.muted, marginBottom:"12px" }}>Saved Prompts ({saved.length})</div>
                  {saved.length === 0 ? (
                    <div style={{ padding:"48px 24px", textAlign:"center", background:"rgba(13,13,22,0.95)", borderRadius:"14px", border:"1px solid rgba(168,169,173,0.08)" }}>
                      <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"14px", color:"rgba(168,169,173,0.3)" }}>No saved prompts yet — click ☆ in the Lab to save your best prompts.</p>
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                      {saved.map((item, i) => (
                        <motion.div key={item.id} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
                          whileHover={{ scale:1.01, x:2 }}
                          style={{ padding:"16px 18px", background:`rgba(168,169,173,0.04)`, border:`1px solid rgba(168,169,173,0.14)`, borderRadius:"12px", cursor:"pointer", transition:"all 0.2s" }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px" }}>
                            <span style={{ color:"#C8C9CC", fontSize:"12px" }}>✦</span>
                            <div style={{ display:"flex", gap:"6px" }}>
                              <motion.button onClick={() => loadFromHistory(item)} whileHover={{ scale:1.06 }} whileTap={{ scale:0.95 }}
                                style={{ padding:"3px 10px", borderRadius:"6px", border:"1px solid rgba(168,169,173,0.16)", background:"rgba(168,169,173,0.07)", cursor:"pointer", fontFamily:"'Cormorant Garamond', serif", fontSize:"10px", color:S.muted, letterSpacing:"0.08em" }}>
                                Load
                              </motion.button>
                              <motion.button onClick={() => deleteSaved(item.id)} whileHover={{ scale:1.06 }} whileTap={{ scale:0.95 }}
                                style={{ padding:"3px 10px", borderRadius:"6px", border:"1px solid rgba(196,127,160,0.2)", background:"rgba(196,127,160,0.05)", cursor:"pointer", fontFamily:"'Cormorant Garamond', serif", fontSize:"10px", color:"rgba(196,127,160,0.6)", letterSpacing:"0.08em" }}>
                                Remove
                              </motion.button>
                            </div>
                          </div>
                          <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"13px", color:S.mutedMd, lineHeight:1.5, margin:0, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical" }}>
                            {item.prompt}
                          </p>
                          <div style={{ marginTop:"8px", fontFamily:"'Cormorant Garamond', serif", fontSize:"10px", color:"rgba(168,169,173,0.28)" }}>
                            {new Date(item.ts).toLocaleString([], { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
};


// ─── Challenges Page ──────────────────────────────────────────────────────────
const CHALLENGES = [

  // ── 1 ── TAP TO SELECT ── Starter ────────────────────────────────────────────
  {
    id:"ct1", trail:"Clarity Trail",
    title:"Spot the Vague Words I",
    subtitle:"Tap every word that makes this prompt fail",
    type:"TAP TO SELECT", difficulty:"Starter", xp:30, color:"#A8A9AD",
    timeLimit:90,
    scenario:"A product manager sent this to an AI before a board meeting. The AI returned a confusing off-topic response. Tap every word or phrase that is too vague to work.",
    prompt:"Can you help me put together something useful for the important meeting we have coming up soon about the stuff we discussed?",
    words:["Can","you","help","me","put","together","something","useful","for","the","important","meeting","we","have","coming","up","soon","about","the","stuff","we","discussed"],
    vagueWords:["something","useful","important","soon","stuff","discussed"],
    explanation:"Six words are fatally vague: 'something' (what deliverable?), 'useful' (useful how?), 'important' (every meeting feels important), 'soon' (when exactly?), 'stuff' (what topic?), 'discussed' (when, with whom?). Each forces the AI to guess — and every guess diverges from your intent.",
    rewrite:"Prepare a 10-slide executive summary for the Q3 board meeting on 15 August, covering our revenue miss, three root causes, and the recovery plan. Tone: direct. One chart recommendation per root cause.",
  },

  // ── 2 ── JIGSAW ── Starter ────────────────────────────────────────────────────
  {
    id:"ct2", trail:"Clarity Trail",
    title:"The Jigsaw I",
    subtitle:"Reassemble a shattered prompt in the correct reading order",
    type:"JIGSAW", difficulty:"Starter", xp:35, color:"#85B7EB",
    timeLimit:150,
    scenario:"A content strategist wrote a near-perfect prompt for a blog post, then accidentally scrambled the file. Drag the fragments back into the correct order so the prompt reads logically from top to bottom.",
    fragments:[
      {id:"f1", text:"You are a senior content strategist specialising in B2B SaaS.", correct:0},
      {id:"f2", text:"Write a 600-word thought leadership blog post for Flowspace, a remote team project management tool.", correct:1},
      {id:"f3", text:"Target audience: operations managers at companies of 50–200 people who are frustrated with Slack and spreadsheets.", correct:2},
      {id:"f4", text:"Angle: 'The hidden cost of async overload — and how structured workflows fix it.'", correct:3},
      {id:"f5", text:"Format: catchy headline, 3 subheadings, one stat callout box, closing CTA to start a free trial.", correct:4},
      {id:"f6", text:"Tone: authoritative but conversational. No jargon. No buzzwords like 'synergy' or 'leverage'.", correct:5},
    ],
    explanation:"The optimal prompt order is: Role → Task → Audience → Angle/Context → Format → Tone/Constraints. This mirrors how a human expert briefs a writer — establish who they are, what to create, who it's for, the specific hook, how to structure it, and finally the guardrails.",
  },

  // ── 3 ── WORD SURGEON ── Starter ──────────────────────────────────────────────
  {
    id:"ct3", trail:"Clarity Trail",
    title:"Word Surgeon I",
    subtitle:"Change exactly 3 words to transform this failing prompt",
    type:"WORD SURGEON", difficulty:"Starter", xp:40, color:"#7EC8A4",
    timeLimit:120,
    scenario:"A recruiter wrote this prompt to generate a job description. The AI produced generic filler. You can change, add, or delete exactly 3 words — no more, no fewer. Make every edit count.",
    prompt:"Write a job description for a developer role at our company.",
    maxEdits:3,
    hints:["The role type is undefined — be specific.", "The company has no identity — name it or describe it.", "'Job description' gives no format — add a structural instruction."],
    modelAnswer:"Write a job description for a senior backend engineer at a Series A fintech startup. Include: responsibilities, required skills, and a 'Why join us' section.",
    modelChanges:["'developer role' → 'senior backend engineer'", "added 'Series A fintech startup'", "added 'Include: responsibilities, required skills, and a Why join us section'"],
    explanation:"Three targeted edits transform a generic request into a specific brief: specifying seniority and stack, defining the company stage and sector, and adding structural requirements. The AI now has enough signal to produce a real output without inventing details.",
  },

  // ── 4 ── DIAGNOSE & REWRITE ── Medium ─────────────────────────────────────────
  {
    id:"ct4", trail:"Clarity Trail",
    title:"Prompt Autopsy I — The Developer",
    subtitle:"Diagnose a failed documentation prompt and fix it",
    type:"DIAGNOSE & REWRITE", difficulty:"Medium", xp:60, color:"#8B9ED4",
    timeLimit:240,
    scenario:"A junior developer sent this prompt to generate onboarding docs. The AI returned three paragraphs of shallow, generic text with no product references. It was discarded entirely. Diagnose every flaw — then rewrite it.",
    prompt:"Write some documentation for our app so new users know how to use it.",
    flaws:[
      {id:"a", label:"No product name or context given", correct:true},
      {id:"b", label:"No specific features or flows mentioned", correct:true},
      {id:"c", label:"No target audience defined", correct:true},
      {id:"d", label:"No format or structure specified", correct:true},
      {id:"e", label:"No tone or brand voice", correct:true},
      {id:"f", label:"Prompt is grammatically incorrect", correct:false},
      {id:"g", label:"Should use numbered lists in the prompt", correct:false},
    ],
    explanation:"Every structural element is absent. The AI has no product name, no feature list, no target user, no structure (step-by-step? FAQs? video script?), and no tone direction. The output is mathematically guaranteed to be generic — the model averaged every onboarding doc it has ever seen.",
    rewrite:"You are a senior technical writer. Write a Getting Started guide for Flowspace, a project management app for remote design teams.\n\nCover these 4 features in order:\n1. Creating your first workspace\n2. Inviting team members\n3. Creating a project board\n4. Setting notification preferences\n\nFormat: numbered steps with a screenshot callout after each step.\nTone: friendly, encouraging, zero jargon.\nAudience: non-technical designers, first day on the product.\nMax 400 words.",
  },

  // ── 5 ── IMPOSTOR ── Medium ───────────────────────────────────────────────────
  {
    id:"ct5", trail:"Clarity Trail",
    title:"The Impostor I",
    subtitle:"Four prompts are strong. One has a hidden flaw. Find it.",
    type:"IMPOSTOR", difficulty:"Medium", xp:50, color:"#C4A5E0",
    timeLimit:120,
    task:"Task: Get an AI to write a cold outreach email to a venture capitalist.",
    prompts:[
      {id:"p1", text:"You are a startup fundraising advisor. Write a 120-word cold email to a pre-seed VC at a London fund. We are Hireflow, an AI CV screening tool. Mention our £180k ARR and 40% MoM growth. End with a CTA to book a 20-minute call. Tone: confident, concise.", isImpostor:false},
      {id:"p2", text:"You are a B2B copywriter. Write a cold email to a Series A SaaS-focused VC in New York. We are Dataloop, a data pipeline tool for analytics teams. Highlight: 60% reduction in engineering time. CTA: reply to this email. Tone: direct, no buzzwords. Max 150 words.", isImpostor:false},
      {id:"p3", text:"You are a founder outreach specialist. Write a cold email to an impact-focused VC. We are Greentrack, a carbon accounting SaaS for SMEs. Mention our 200 paying customers and B Corp certification. CTA: 15-minute intro call. Tone: mission-driven but commercially sharp. Max 130 words.", isImpostor:false},
      {id:"p4", text:"You are a startup advisor. Write a really good cold email to investors about our amazing AI product that solves a big problem in the market. Make it compelling and professional. Include why they should invest in us.", isImpostor:true},
      {id:"p5", text:"You are a fundraising copywriter. Write a 140-word cold email to a climate-tech VC partner. We are SolarOps, a predictive maintenance platform for solar farms. Highlight our 3x ROI case study. CTA: 30-minute demo call. Tone: technical credibility with commercial urgency.", isImpostor:false},
    ],
    impostorExplanation:"Prompt 4 is the impostor. Despite sounding confident ('really good', 'amazing', 'compelling'), it has zero specifics: no company name, no product description, no traction metrics, no specific VC type, no word count, no CTA format. Every other prompt gives the AI a named company, a specific metric, a target audience, and a clear structure. Prompt 4 gives it vibes.",
  },

  // ── 6 ── COMPRESS ── Medium ───────────────────────────────────────────────────
  {
    id:"ct6", trail:"Clarity Trail",
    title:"The Minimizer I",
    subtitle:"Compress 52 bloated words to under 15",
    type:"COMPRESS", difficulty:"Medium", xp:70, color:"#C4A5E0",
    timeLimit:300,
    scenario:"A content lead wrote this prompt during a rushed meeting. It works — barely — but 52 words of filler confuse the AI. Compress to 15 words or fewer without losing topic, audience, format, or tone.",
    original:"I was thinking it would be really great if you could possibly write something for us — specifically a short email that we could send to our customers who have been with us for more than a year, to let them know about our new loyalty programme in a friendly and warm way.",
    targetWords:15,
    modelAnswer:"Write a warm 100-word retention email announcing our loyalty programme to customers of 1+ years.",
    modelWordCount:15,
  },

  // ── 7 ── DRAG & ORDER ── Medium ───────────────────────────────────────────────
  {
    id:"ct7", trail:"Clarity Trail",
    title:"Build the Structure I — Legal Tech",
    subtitle:"Assemble a contract summary prompt from broken fragments",
    type:"DRAG & ORDER", difficulty:"Medium", xp:50, color:"#9B8ED4",
    timeLimit:180,
    scenario:"A legal tech startup needs an AI to summarise contracts for non-lawyer clients. The prompt is broken into 7 fragments — 5 correct, 2 decoys. Place the 5 correct ones in the right order.",
    correctOrder:["role","task","context","format","constraint"],
    blocks:[
      {id:"role",       type:"role",       label:"ROLE",       text:"You are a plain-English legal summariser"},
      {id:"task",       type:"task",       label:"TASK",       text:"Summarise this contract clause for a non-lawyer client"},
      {id:"context",    type:"context",    label:"CONTEXT",    text:"The client is signing a SaaS vendor agreement and needs to understand their liability exposure"},
      {id:"format",     type:"format",     label:"FORMAT",     text:"Three bullet points: key obligation, key risk, recommended question to ask a lawyer"},
      {id:"constraint", type:"constraint", label:"CONSTRAINT", text:"Max 80 words total. Plain English. No Latin terms."},
      {id:"decoy1",     type:"decoy",      label:"DECOY",      text:"Be as detailed and thorough as possible and cover everything"},
      {id:"decoy2",     type:"decoy",      label:"DECOY",      text:"Write in formal legal style using proper terminology throughout"},
    ],
  },

  // ── 8 ── TAP TO SELECT ── Starter ────────────────────────────────────────────
  {
    id:"ct8", trail:"Clarity Trail",
    title:"Spot the Vague Words II — The Inbox",
    subtitle:"A second set — harder, more subtle ambiguities",
    type:"TAP TO SELECT", difficulty:"Starter", xp:35, color:"#A8A9AD",
    timeLimit:100,
    scenario:"A startup founder sent this to write a fundraising email. The AI produced a generic three-paragraph pitch that could have been for any company. Identify every vague or ambiguous word.",
    prompt:"Write a nice email to investors that explains what we do and why they should be interested in supporting our exciting company at this stage.",
    words:["Write","a","nice","email","to","investors","that","explains","what","we","do","and","why","they","should","be","interested","in","supporting","our","exciting","company","at","this","stage"],
    vagueWords:["nice","investors","what we do","interested","supporting","exciting","this stage"],
    explanation:"'Nice' gives no tone direction. 'Investors' — what type, stage, sector? 'What we do' is the entire pitch, left undefined. 'Interested' — in what outcome? 'Supporting' — equity, SAFE, grant? 'Exciting' is filler. 'This stage' — pre-seed, Series A? Each vague word hides a decision the AI cannot make for you.",
    rewrite:"Write a 150-word cold email to a pre-seed SaaS-focused VC partner at a London fund. We are Flowlane, an AI scheduling tool for remote engineering teams. Ask for a 20-minute call. Tone: confident, concise, no jargon. Mention our £180k ARR and 40% MoM growth.",
  },

  // ── 9 ── JIGSAW ── Medium ─────────────────────────────────────────────────────
  {
    id:"ct9", trail:"Clarity Trail",
    title:"The Jigsaw II — The Legal Brief",
    subtitle:"6 fragments, harder order — role comes last, not first",
    type:"JIGSAW", difficulty:"Medium", xp:55, color:"#85B7EB",
    timeLimit:180,
    scenario:"A legal tech founder scrambled this prompt for a contract risk summary. The correct order is non-obvious — the role is stated at the end as a style calibration, not at the start. Reassemble it correctly.",
    fragments:[
      {id:"f1", text:"Identify the top 3 liability risks for a buyer in this SaaS enterprise agreement.", correct:0},
      {id:"f2", text:"For each risk: state the clause number, explain the risk in plain English, and rate severity as High / Medium / Low.", correct:1},
      {id:"f3", text:"The buyer is a UK-based financial services firm subject to FCA regulation. Flag any clause that may conflict with FCA requirements.", correct:2},
      {id:"f4", text:"Format: numbered list, one risk per section, max 60 words per risk.", correct:3},
      {id:"f5", text:"Do not summarise the whole contract — focus only on risk exposure for the buyer.", correct:4},
      {id:"f6", text:"Calibrate language for a senior in-house counsel with 10+ years in financial services contracts.", correct:5},
    ],
    explanation:"This prompt leads with Task, then Format-per-item, then Context, then Structure, then Scope constraint, then Audience calibration. The role is deliberately last because it is a style instruction, not a framing instruction. Understanding when role comes first vs last is an advanced prompting skill.",
  },

  // ── 10 ── WORD SURGEON ── Medium ─────────────────────────────────────────────
  {
    id:"ct10", trail:"Clarity Trail",
    title:"Word Surgeon II — The Marketing Brief",
    subtitle:"Maximum impact with exactly 4 word changes",
    type:"WORD SURGEON", difficulty:"Medium", xp:55, color:"#7EC8A4",
    timeLimit:150,
    scenario:"A marketing manager wrote this prompt to generate a product announcement. The AI produced a generic, tone-deaf draft. You have exactly 4 word-level edits (change, add, or delete). Make them count.",
    prompt:"Write an announcement for our new feature that we can post on social media for our audience.",
    maxEdits:4,
    hints:["Which feature? Name it.", "Which platform? LinkedIn ≠ Twitter ≠ Instagram.", "Who exactly is your audience?", "'Announcement' is vague — what format and length?"],
    modelAnswer:"Write a 120-character LinkedIn announcement for Flowspace's new AI Sprint Planner feature, targeting operations managers. Hook with a metric. End with a link CTA.",
    modelChanges:["added 'LinkedIn'","added '120-character'","added 'Flowspace's AI Sprint Planner'","added 'targeting operations managers. Hook with a metric.'"],
    explanation:"Four edits, four transformations: platform (LinkedIn changes everything about format and tone), length (120 characters is a real constraint), product name (grounds the AI), and audience + hook instruction (defines purpose). The AI now has enough to write something real.",
  },

  // ── 11 ── DIAGNOSE & REWRITE ── Medium ────────────────────────────────────────
  {
    id:"ct11", trail:"Clarity Trail",
    title:"Prompt Autopsy II — The Marketing Email",
    subtitle:"A subtler failure — what is missing rather than what is wrong",
    type:"DIAGNOSE & REWRITE", difficulty:"Medium", xp:65, color:"#8B9ED4",
    timeLimit:260,
    scenario:"A marketing manager used this prompt to write a product launch email. The AI produced a technically correct but completely generic email their audience would ignore. Find the flaws.",
    prompt:"Write a product launch email for our new feature that will go out to our customers.",
    flaws:[
      {id:"a", label:"No feature name or description", correct:true},
      {id:"b", label:"No customer segment identified", correct:true},
      {id:"c", label:"No benefit or value proposition", correct:true},
      {id:"d", label:"No CTA specified", correct:true},
      {id:"e", label:"No subject line requested", correct:true},
      {id:"f", label:"Prompt is too short overall", correct:false},
      {id:"g", label:"Should have used bullet points", correct:false},
    ],
    explanation:"Five critical gaps: no feature name (the AI invented one), no customer segment (B2B vs consumer changes everything), no benefit statement (features ≠ benefits), no CTA (what should readers do?), and no subject line request (the most impactful part of any email). Each gap forced the AI to guess.",
    rewrite:"You are a conversion-focused email copywriter. Write a product launch email for Flowspace's new AI Sprint Planner feature, going to 2,400 B2B SaaS teams on our paid plan.\n\nInclude:\n- Subject line optimised for open rate\n- 3-sentence benefit-led intro\n- Three bullet points: what it does, time saved, who it's best for\n- CTA button: 'Try Sprint Planner Free'\n\nTone: confident, warm, not salesy. Max 200 words in body.",
  },

  // ── 12 ── IMPOSTOR ── Hard ────────────────────────────────────────────────────
  {
    id:"ct12", trail:"Clarity Trail",
    title:"The Impostor II — The System Prompts",
    subtitle:"One of these system prompts will cause dangerous drift. Find it.",
    type:"IMPOSTOR", difficulty:"Hard", xp:70, color:"#C4A5E0",
    timeLimit:150,
    task:"Task: These are system prompts for an AI customer support agent for a fintech app.",
    prompts:[
      {id:"p1", text:"You are a customer support agent for Moneyflow, a UK personal finance app. Answer questions about account features, transactions, and billing only. For regulatory or legal queries, always say: 'I recommend speaking with our compliance team.' Never give financial advice. Never confirm or deny fraud suspicions — escalate immediately.", isImpostor:false},
      {id:"p2", text:"You are a helpful assistant for Moneyflow. Answer customer questions clearly and professionally. If you don't know something, say so honestly and offer to escalate to a human agent.", isImpostor:true},
      {id:"p3", text:"You are a Tier 1 support agent for Moneyflow. Handle: account access, transaction queries, subscription billing. Do not handle: fraud reports, regulatory complaints, data deletion requests — route these to human agents. Respond in under 100 words. Never guess at account balances or transaction statuses.", isImpostor:false},
      {id:"p4", text:"You are a support specialist for Moneyflow. Scope: billing, plan changes, feature questions only. Always verify the user is asking about their own account before providing details. If a user expresses distress or mentions financial hardship, respond with empathy and escalate to the human wellbeing team.", isImpostor:false},
      {id:"p5", text:"You are a Moneyflow support agent. Your tone is warm and efficient. Resolve queries in the fewest messages possible. For any query involving account security, identity verification, or suspicious activity, immediately say: 'For your security, I need to transfer you to our security team.' Do not attempt to resolve security issues yourself.", isImpostor:false},
    ],
    impostorExplanation:"Prompt 2 is the impostor. It sounds reasonable — 'helpful', 'professional', 'honest' — but it has no scope boundaries, no escalation rules, no forbidden topics, and no guardrails against financial advice or fraud handling. In a fintech context, a support AI with no explicit constraints will attempt to answer anything confidently, including questions it should never touch. The word 'helpful' is dangerous without a definition of what 'help' is permitted.",
  },

  // ── 13 ── COMPRESS ── Hard ────────────────────────────────────────────────────
  {
    id:"ct13", trail:"Clarity Trail",
    title:"The Minimizer II — The Technical Brief",
    subtitle:"60 words of engineering waffle — compress to 18",
    type:"COMPRESS", difficulty:"Hard", xp:85, color:"#C4A5E0",
    timeLimit:320,
    scenario:"An engineer wrote this to generate API docs. It is bloated with hedging and commentary that confused the AI about which part was the actual task. Compress to 18 words or fewer.",
    original:"So what I need here, if possible, is for you to maybe help me by writing some kind of API documentation for the endpoint that handles user authentication in our system, ideally in a way that another developer who might be new to our codebase could understand without too much trouble.",
    targetWords:18,
    modelAnswer:"Write developer-friendly API docs for our user authentication endpoint. Audience: engineers new to the codebase.",
    modelWordCount:17,
  },

  // ── 14 ── JIGSAW ── Hard ──────────────────────────────────────────────────────
  {
    id:"ct14", trail:"Clarity Trail",
    title:"The Jigsaw III — The Data Analyst",
    subtitle:"7 fragments — one is a decoy that almost fits",
    type:"JIGSAW", difficulty:"Hard", xp:65, color:"#85B7EB",
    timeLimit:200,
    scenario:"A data analyst wrote this prompt to analyse a churn dataset. It was scrambled and one decoy fragment was inserted that almost fits but subtly breaks the logic. Identify the decoy and reassemble the 6 real fragments correctly.",
    fragments:[
      {id:"f1", text:"Analyse the attached customer churn dataset for a B2B SaaS product.", correct:0},
      {id:"f2", text:"Identify the top 5 predictors of churn based on correlation with the 'churned' column.", correct:1},
      {id:"f3", text:"For each predictor: state the variable name, correlation coefficient, and a plain-English explanation of why this factor might drive churn.", correct:2},
      {id:"f4", text:"Then recommend 3 retention interventions ranked by expected impact, citing which predictor each addresses.", correct:3},
      {id:"f5", text:"Format: structured markdown with one section per predictor, then a separate Recommendations section.", correct:4},
      {id:"f6", text:"Assume the audience is a non-technical Chief Customer Officer who will present this to the board.", correct:5},
      {id:"decoy", text:"Include all statistical methodology and p-values so the analysis is academically rigorous.", correct:-1},
    ],
    explanation:"The decoy is the last fragment about 'statistical methodology and p-values'. It contradicts the established audience (a non-technical CCO presenting to a board). Academic rigour framing directly conflicts with plain-English explanations and board-level communication. Inserting it would break the coherence of the prompt and produce an output that satisfies neither audience.",
  },

  // ── 15 ── WORD SURGEON ── Hard ────────────────────────────────────────────────
  {
    id:"ct15", trail:"Clarity Trail",
    title:"Word Surgeon III — The Research Brief",
    subtitle:"Only 3 edits — but the flaw is structural, not lexical",
    type:"WORD SURGEON", difficulty:"Hard", xp:70, color:"#7EC8A4",
    timeLimit:180,
    scenario:"A researcher used this prompt and the AI confidently fabricated two citations and invented a statistic. The flaw is not a single bad word — it is a missing structural constraint. Use exactly 3 edits to add anti-hallucination guardrails.",
    prompt:"Summarise this research paper and tell me what the main findings mean for my industry.",
    maxEdits:3,
    hints:["The AI has no instruction to stay within the paper — add a grounding constraint.", "The AI has no fallback for uncertainty — add one.", "The phrase 'my industry' is undefined — specify it."],
    modelAnswer:"Using only facts stated in this paper, summarise the main findings and their implications for B2B SaaS companies. If anything is unclear in the paper, write 'Not stated in source'.",
    modelChanges:["added 'Using only facts stated in this paper'","replaced 'my industry' with 'B2B SaaS companies'","added 'If anything is unclear in the paper, write Not stated in source'"],
    explanation:"Three edits, three hallucination prevention mechanisms: a grounding constraint ('only facts stated in this paper'), an audience definition that removes ambiguity, and an explicit uncertainty fallback ('Not stated in source') that prevents the model from filling gaps with confident inventions.",
  },

  // ── 16 ── DRAG & ORDER ── Hard ────────────────────────────────────────────────
  {
    id:"ct16", trail:"Clarity Trail",
    title:"Build the Structure II — Medical Comms",
    subtitle:"6 elements, 3 decoys — order and selection both matter",
    type:"DRAG & ORDER", difficulty:"Hard", xp:70, color:"#9B8ED4",
    timeLimit:200,
    scenario:"A health-tech company needs a prompt to explain drug side-effects to patients. Assemble the 6 correct blocks from a pool of 9. Order matters — wrong sequence produces wrong output.",
    correctOrder:["role","task","context","audience","format","constraint"],
    blocks:[
      {id:"role",       type:"role",       label:"ROLE",       text:"You are a clinical pharmacist with patient communication expertise"},
      {id:"task",       type:"task",       label:"TASK",       text:"Explain the side effects of metformin"},
      {id:"context",    type:"context",    label:"CONTEXT",    text:"The patient has just been prescribed this for Type 2 diabetes and has no prior medical knowledge"},
      {id:"audience",   type:"audience",   label:"AUDIENCE",   text:"A 58-year-old retired teacher with no medical background"},
      {id:"format",     type:"format",     label:"FORMAT",     text:"Three sections: Common (expect these), Rare but serious (call your doctor), What to do if you miss a dose"},
      {id:"constraint", type:"constraint", label:"CONSTRAINT", text:"No medical jargon. Plain English. Max 250 words. Never use the word 'adverse'."},
      {id:"decoy1",     type:"decoy",      label:"DECOY",      text:"Include all known side effects in full clinical detail"},
      {id:"decoy2",     type:"decoy",      label:"DECOY",      text:"Write for a medical professional reviewing the prescription"},
      {id:"decoy3",     type:"decoy",      label:"DECOY",      text:"Be reassuring and downplay any serious risks to avoid patient anxiety"},
    ],
  },

  // ── 17 ── DIAGNOSE & REWRITE ── Hard ──────────────────────────────────────────
  {
    id:"ct17", trail:"Clarity Trail",
    title:"Prompt Autopsy III — The Constraint Builder",
    subtitle:"Add constraints that stop this prompt from hallucinating",
    type:"DIAGNOSE & REWRITE", difficulty:"Hard", xp:75, color:"#8B9ED4",
    timeLimit:240,
    scenario:"A researcher used this prompt and the AI fabricated three citations, invented a statistic, and gave a recommendation that contradicted the paper's actual conclusions. The researcher nearly submitted it. Add the constraints that would have prevented every failure.",
    prompt:"Summarise this research paper and tell me what the main findings mean for my industry.",
    flaws:[
      {id:"a", label:"No instruction to only use information from the paper", correct:true},
      {id:"b", label:"No instruction to flag uncertainty or gaps", correct:true},
      {id:"c", label:"No specific industry context given", correct:true},
      {id:"d", label:"No format — AI chose its own structure", correct:true},
      {id:"e", label:"No explicit ban on fabricating citations", correct:true},
      {id:"f", label:"Prompt is not long enough", correct:false},
      {id:"g", label:"Should have asked for bullet points", correct:false},
    ],
    explanation:"Hallucination occurs when the model fills gaps with high-confidence guesses. Every missing constraint was a gap: no grounding instruction, no uncertainty flag, no industry context, no format, and no citation boundary. Each absence became a fabrication opportunity.",
    rewrite:"Using ONLY information from the paper I have provided — do not add any external facts or citations — summarise:\n1. Core research question\n2. Methodology (2 sentences)\n3. Three key findings\n4. Implications for B2B SaaS companies specifically\n\nIf any section is unclear in the paper, write 'Not stated in paper' rather than inferring. Do not cite any source not explicitly mentioned in the text. Max 300 words.",
  },

  // ── 18 ── IMPOSTOR ── Medium ──────────────────────────────────────────────────
  {
    id:"ct18", trail:"Clarity Trail",
    title:"The Impostor III — The Tone Mismatch",
    subtitle:"Same task, five prompts. One will produce the wrong tone for the context.",
    type:"IMPOSTOR", difficulty:"Medium", xp:55, color:"#C4A5E0",
    timeLimit:130,
    task:"Task: Write an apology email to a customer whose order was lost in transit.",
    prompts:[
      {id:"p1", text:"You are a customer experience specialist. Write a 150-word apology email to a customer whose order was lost. Acknowledge the failure directly, offer a full refund or replacement, and give a realistic resolution timeline. Tone: sincere, accountable, no corporate deflection.", isImpostor:false},
      {id:"p2", text:"Write a professional apology email to a customer for a lost order. Take clear responsibility, explain next steps concisely, and end with a goodwill gesture (10% off next order). Tone: warm and human. Max 120 words.", isImpostor:false},
      {id:"p3", text:"You are a customer retention specialist. Write a brief apology for a lost order. Lead with the solution, not the apology. Offer a choice: full refund or priority re-ship within 48 hours. Close with a genuine expression of accountability. Max 100 words.", isImpostor:false},
      {id:"p4", text:"Draft a crisp, corporate apology to a customer regarding an order fulfilment failure. Use formal register throughout. Reference our logistics partner's error as context. Offer standard compensation per policy. Tone: precise, measured, legally cautious.", isImpostor:true},
      {id:"p5", text:"Write a heartfelt apology email to a customer whose package never arrived. Keep it human — no templates, no 'we apologise for the inconvenience'. Own the mistake, offer a fix, and make them feel valued. 130 words max.", isImpostor:false},
    ],
    impostorExplanation:"Prompt 4 is the impostor. It instructs the AI to use 'formal register', 'reference the logistics partner's error as context' (deflecting blame), and 'legally cautious' tone. For a customer apology email, this combination is the opposite of effective — it reads as corporate cover, not accountability. The other prompts all prioritise direct ownership, human warmth, and solution-first framing, which is what actually retains customers.",
  },

  // ── 19 ── COMPRESS ── Expert ──────────────────────────────────────────────────
  {
    id:"ct19", trail:"Clarity Trail",
    title:"The Minimizer III — Expert Mode",
    subtitle:"Academic hedging — compress 60 words to 12",
    type:"COMPRESS", difficulty:"Expert", xp:100, color:"#C4A5E0",
    timeLimit:360,
    scenario:"A researcher wrote this prompt to summarise a paper. It is wrapped in academic hedging that obscures the actual request. Cut through all of it. Compress to 12 words or fewer while preserving every meaningful element.",
    original:"I would appreciate it if you could, drawing upon the content of the research paper I have provided, attempt to produce a condensed summary that captures the primary findings, the methodology employed by the researchers, and the implications of the study for practitioners working in the field, all within a reasonable word count and in language accessible to a non-specialist reader.",
    targetWords:12,
    modelAnswer:"Summarise this paper: key findings, methodology, and practitioner implications. Plain English, 200 words.",
    modelWordCount:13,
  },

  // ── 20 ── JIGSAW ── Expert ────────────────────────────────────────────────────
  {
    id:"ct20", trail:"Clarity Trail",
    title:"The Jigsaw IV — The Investor Memo",
    subtitle:"8 fragments, 2 decoys, no labels — hardest assembly yet",
    type:"JIGSAW", difficulty:"Expert", xp:80, color:"#85B7EB",
    timeLimit:240,
    scenario:"A VC analyst wrote this prompt to generate a one-pager investment memo. 8 real fragments, 2 decoys. No labels this time — you must judge each fragment by its content alone.",
    fragments:[
      {id:"f1", text:"You are a VC analyst at a Series A fund with deep expertise in B2B SaaS.", correct:0},
      {id:"f2", text:"Write a one-page investment memo for Hireflow, an AI-powered CV screening tool for enterprise HR teams.", correct:1},
      {id:"f3", text:"Hireflow has £420k ARR, 35% MoM growth, 3 enterprise pilots with FTSE 250 companies, and a £1.8M pre-seed round closed in March 2024.", correct:2},
      {id:"f4", text:"Structure: Problem, Solution, Traction, Market Size, Why Now, Why This Team, Risks, Verdict.", correct:3},
      {id:"f5", text:"For the Verdict section: give a clear Invest / Pass / Watch recommendation with one-sentence rationale.", correct:4},
      {id:"f6", text:"Tone: analytical, direct, no marketing language. Write as if presenting to an IC meeting.", correct:5},
      {id:"f7", text:"Max 400 words. Use bold headers for each section.", correct:6},
      {id:"f8", text:"Do not fabricate any metrics or claims not provided above. If information is missing, write '[Data needed]'.", correct:7},
      {id:"decoy1", text:"Include a full competitive landscape analysis with Porter's Five Forces framework.", correct:-1},
      {id:"decoy2", text:"Write in an inspiring, visionary tone to excite potential investors about the opportunity.", correct:-1},
    ],
    explanation:"The two decoys are 'Porter's Five Forces' (too academic and long for a one-pager, contradicts the 400-word limit) and 'inspiring, visionary tone' (directly contradicts 'analytical, direct, no marketing language'). Both decoys would actively break the output quality. The real fragments form a complete, unambiguous brief with role, task, context, structure, verdict instruction, tone, length, and anti-hallucination constraint.",
  },

  // ── 21 ── DRAG & ORDER ── Expert ─────────────────────────────────────────────
  {
    id:"ct21", trail:"Clarity Trail",
    title:"Build the Structure III — The Crisis Comms",
    subtitle:"7 elements — the order is counter-intuitive",
    type:"DRAG & ORDER", difficulty:"Expert", xp:80, color:"#9B8ED4",
    timeLimit:220,
    scenario:"A comms director needs a prompt to generate a crisis response statement. The correct order is deliberately non-obvious — constraints come before format here, because in crisis comms, what you cannot say is more important than how you say it.",
    correctOrder:["role","task","context","constraint","audience","format","tone"],
    blocks:[
      {id:"role",       type:"role",       label:"ROLE",       text:"You are a crisis communications director with 15 years in financial services PR"},
      {id:"task",       type:"task",       label:"TASK",       text:"Write a public statement responding to a data breach affecting 40,000 customer records"},
      {id:"context",    type:"context",    label:"CONTEXT",    text:"The breach occurred 6 hours ago. The ICO has been notified. No financial data was accessed — only names and email addresses."},
      {id:"constraint", type:"constraint", label:"CONSTRAINT", text:"Do not admit liability. Do not speculate on cause. Do not use passive voice. Legal has approved the facts above — no additional claims."},
      {id:"audience",   type:"audience",   label:"AUDIENCE",   text:"Primary: affected customers. Secondary: press and regulators reading the published statement."},
      {id:"format",     type:"format",     label:"FORMAT",     text:"Three paragraphs: what happened, what we have done, what customers should do now."},
      {id:"tone",       type:"tone",       label:"TONE",       text:"Accountable, transparent, calm authority. No corporate deflection. No hollow 'we take this very seriously'."},
      {id:"decoy1",     type:"decoy",      label:"DECOY",      text:"Express deep remorse and acknowledge full responsibility for the breach."},
      {id:"decoy2",     type:"decoy",      label:"DECOY",      text:"Include a detailed technical explanation of how the breach occurred."},
    ],
  },

  // ── 22 ── WORD SURGEON ── Expert ──────────────────────────────────────────────
  {
    id:"ct22", trail:"Clarity Trail",
    title:"Word Surgeon IV — The Scope Creep",
    subtitle:"5 edits only — stop the AI from expanding beyond the brief",
    type:"WORD SURGEON", difficulty:"Expert", xp:85, color:"#7EC8A4",
    timeLimit:200,
    scenario:"A strategist wrote this prompt and the AI produced a 2,000-word strategic report when they needed a 3-slide executive summary. The prompt has no scope boundaries. Add exactly 5 edits to constrain the output precisely.",
    prompt:"Analyse our competitive position in the UK HR tech market and recommend how we should respond to recent moves by our main competitors.",
    maxEdits:5,
    hints:["Add an output format (slides, not prose).", "Add a slide count.", "Add a word limit per slide.", "Define which competitors to analyse.", "Add a decision-focus instruction — what is this for?"],
    modelAnswer:"Produce a 3-slide executive summary analysing Hireflow's competitive position against Workday and Greenhouse in UK HR tech. Each slide: max 60 words. Frame for a board decision on Q3 product roadmap prioritisation.",
    modelChanges:["'Analyse' → 'Produce a 3-slide executive summary analysing'","added 'Hireflow's'","added 'against Workday and Greenhouse'","added 'Each slide: max 60 words'","added 'Frame for a board decision on Q3 product roadmap prioritisation'"],
    explanation:"Five targeted edits install five scope boundaries: output type (slides, not prose), quantity (3), length per unit (60 words), named subject (Hireflow), named competitors (Workday, Greenhouse), and decision context (Q3 roadmap). Without these, 'analyse' is an invitation to write everything the AI knows.",
  },

  // ── 23 ── TAP TO SELECT ── Medium ────────────────────────────────────────────
  {
    id:"ct23", trail:"Clarity Trail",
    title:"Spot the Vague Words III — The Strategy Brief",
    subtitle:"More subtle this time — the vagueness is structural, not lexical",
    type:"TAP TO SELECT", difficulty:"Medium", xp:45, color:"#A8A9AD",
    timeLimit:110,
    scenario:"A consultant sent this to generate a strategy document. The AI produced an 8-page generic framework document. Find the structural vagueness — some of these look specific but aren't.",
    prompt:"Write a go-to-market strategy for our product targeting the enterprise segment with a focus on growth and a timeline that works for our launch.",
    words:["Write","a","go-to-market","strategy","for","our","product","targeting","the","enterprise","segment","with","a","focus","on","growth","and","a","timeline","that","works","for","our","launch"],
    vagueWords:["our product","enterprise segment","focus on growth","timeline that works","our launch"],
    explanation:"'Our product' gives the AI nothing to work with. 'Enterprise segment' is 5,000+ employees? 500+? UK only? 'Focus on growth' is tautological — all strategies focus on growth. 'Timeline that works' is undefined — 3 months? 18 months? 'Our launch' has no date. Five phrases that sound specific but contain zero information the AI can act on.",
    rewrite:"Write a 90-day go-to-market strategy for Hireflow (AI CV screening for enterprise HR teams, targeting UK companies of 500+ employees). Focus on: channel prioritisation (inbound vs outbound), pricing strategy for enterprise deals, and first 10 customer acquisition playbook. Launch date: 1 September.",
  },

  // ── 24 ── DIAGNOSE & REWRITE ── Expert ───────────────────────────────────────
  {
    id:"ct24", trail:"Clarity Trail",
    title:"Prompt Autopsy IV — The Negotiator",
    subtitle:"Three attempts all failed. Find the systematic flaw they share.",
    type:"DIAGNOSE & REWRITE", difficulty:"Expert", xp:90, color:"#8B9ED4",
    timeLimit:300,
    scenario:"A UX designer tried 3 times to get useful user interview questions. All three attempts produced generic satisfaction questions. Identify the systematic flaw that all three share — then write the prompt that would have worked from the start.",
    prompt:"Attempt 1: Write user interview questions for our app.\nAttempt 2: Write better user interview questions for our banking app.\nAttempt 3: Write good user interview questions for a mobile banking app for young people.",
    flaws:[
      {id:"a", label:"None of the 3 prompts specify the research goal or hypothesis", correct:true},
      {id:"b", label:"No interview stage specified (discovery, usability, validation?)", correct:true},
      {id:"c", label:"No question format or count specified", correct:true},
      {id:"e", label:"No specific feature or flow to investigate", correct:true},
      {id:"d", label:"The word 'good' in attempt 3 is the main problem", correct:false},
      {id:"f", label:"The prompts are too short", correct:false},
    ],
    explanation:"All three share the same systematic flaw: they describe the subject but never specify the research purpose. 'User interview questions' for what goal? Onboarding friction? Feature discovery? Trust barriers? Without a hypothesis, the AI defaults to generic satisfaction questions — which is exactly what happened all three times. More detail about the same un-framed subject just produces more detailed wrong output.",
    rewrite:"You are a senior UX researcher. Write 8 semi-structured discovery interview questions for 18-25 year old first-time mobile banking users.\n\nResearch goal: understand the emotional and practical barriers preventing this group from switching to digital-only banks.\n\nInclude:\n- 2 warm-up questions about current banking behaviour\n- 4 questions probing specific moments of friction or distrust\n- 2 questions about what would build enough confidence to switch\n\nFormat: question followed by one follow-up probe in italics.",
  },

  // ── 25 ── JIGSAW ── Medium ────────────────────────────────────────────────────
  {
    id:"ct25", trail:"Clarity Trail",
    title:"The Jigsaw V — The Performance Review",
    subtitle:"Reassemble a sensitive HR prompt — order affects meaning",
    type:"JIGSAW", difficulty:"Medium", xp:60, color:"#85B7EB",
    timeLimit:190,
    scenario:"An HR manager wrote this performance review prompt. Scrambled and one near-perfect decoy inserted. The real fragments reassembled in the correct order produce a fair, structured, legally defensible review.",
    fragments:[
      {id:"f1", text:"Write a performance review for a mid-level software engineer at a UK tech company.", correct:0},
      {id:"f2", text:"Base the review on these observed behaviours: delivered the payment gateway feature 2 weeks early, mentored two junior engineers, missed two sprint planning meetings without notice.", correct:1},
      {id:"f3", text:"Structure: four labelled sections — Technical Delivery, Collaboration, Areas for Development, Overall Rating (Exceeds / Meets / Below Expectations).", correct:2},
      {id:"f4", text:"For each section: cite a specific example from the behaviours listed above. Do not introduce examples not provided.", correct:3},
      {id:"f5", text:"Tone: specific, evidence-based, constructive. No generic praise. No vague criticism.", correct:4},
      {id:"f6", text:"Max 300 words. Avoid any language that could be interpreted as discriminatory or legally problematic.", correct:5},
      {id:"decoy", text:"Write in a warm, encouraging tone that prioritises the employee's feelings and avoids any negative framing.", correct:-1},
    ],
    explanation:"The decoy ('warm, encouraging tone that prioritises feelings and avoids negative framing') directly contradicts the established tone ('specific, evidence-based, constructive') and would prevent the AI from addressing the development area (missed meetings). In a legally defensible performance review, evidence-based directness is required. The decoy sounds humane but produces a review that cannot be used for HR purposes.",
  },

  // ── 26 ── WORD SURGEON ── Medium ─────────────────────────────────────────────
  {
    id:"ct26", trail:"Clarity Trail",
    title:"Word Surgeon V — The Customer Survey",
    subtitle:"3 edits — but the flaw is leading language that biases responses",
    type:"WORD SURGEON", difficulty:"Medium", xp:55, color:"#7EC8A4",
    timeLimit:150,
    scenario:"A product manager wrote this prompt to generate customer survey questions. The AI produced leading, biased questions that would skew results. Use exactly 3 edits to make the prompt produce neutral, methodologically sound questions.",
    prompt:"Write 5 survey questions to find out how much customers love our new dashboard feature and what they think is great about it.",
    maxEdits:3,
    hints:["'Love' presupposes a positive reaction — remove the assumption.", "'Great about it' only allows positive feedback — add balance.", "The question count and format are fine — focus on the bias."],
    modelAnswer:"Write 5 neutral survey questions to evaluate customer sentiment about our new dashboard feature, covering both positive and negative experiences. Use a Likert scale for quantitative questions.",
    modelChanges:["'how much customers love' → 'customer sentiment about'","'what they think is great about it' → 'covering both positive and negative experiences'","added 'Use a Likert scale for quantitative questions'"],
    explanation:"Three edits remove three sources of bias: 'love' presupposes positive sentiment (replaced with 'sentiment'), 'what they think is great' forecloses negative feedback (replaced with 'both positive and negative'), and adding a Likert scale instruction prevents free-text only responses that are hard to analyse at scale.",
  },

  // ── 27 ── FILL GAP ── Medium ──────────────────────────────────────────────────
  {
    id:"ct27", trail:"Clarity Trail",
    title:"Fill the Gap I — The Cold Email",
    subtitle:"Complete the half-written prompt with 5 missing elements",
    type:"FILL GAP", difficulty:"Medium", xp:55, color:"#A8A9AD",
    timeLimit:150,
    scenario:"A sales rep wrote this base prompt but left 5 critical elements blank. Fill each gap to produce a complete, actionable brief that would generate a real cold email.",
    basePrompt:"Write a cold outreach email for our HR software product.",
    missingElements:[
      {id:"m1", label:"Role / persona", hint:"Who should the AI be? A B2B copywriter? A sales expert?", placeholder:"You are a..."},
      {id:"m2", label:"Target recipient", hint:"Job title, company size, sector?", placeholder:"The recipient is..."},
      {id:"m3", label:"Key value proposition", hint:"What specific problem does the product solve? With a metric if possible.", placeholder:"Our product..."},
      {id:"m4", label:"CTA", hint:"What should the reader do after reading?", placeholder:"End with a CTA to..."},
      {id:"m5", label:"Constraints", hint:"Word count, tone, format restriction?", placeholder:"Max ... words. Tone: ..."},
    ],
    modelAnswer:"You are a B2B SaaS sales copywriter. Write a 120-word cold email to an HR Director at a 200-500 person tech company. Our product, Hireflow, automates CV screening and reduces time-to-hire by 40%. Tone: direct, data-led, no buzzwords. End with a CTA to book a 15-minute demo call.",
  },

  // ── 28 ── IMPOSTOR ── Hard ────────────────────────────────────────────────────
  {
    id:"ct28", trail:"Clarity Trail",
    title:"The Impostor IV — The Chain of Thought",
    subtitle:"One prompt will produce confident wrong answers. Find it.",
    type:"IMPOSTOR", difficulty:"Hard", xp:75, color:"#C4A5E0",
    timeLimit:150,
    task:"Task: Get an AI to solve a complex multi-step business problem accurately.",
    prompts:[
      {id:"p1", text:"Analyse this pricing decision step by step. First, identify all relevant cost inputs. Then calculate the break-even margin. Then evaluate three pricing strategies against our target 40% gross margin. Show your working at each step before reaching a conclusion.", isImpostor:false},
      {id:"p2", text:"Work through this market sizing problem methodically. Step 1: define the total addressable market. Step 2: estimate our serviceable market based on the constraints I've listed. Step 3: project Year 1 revenue at 1% market penetration. Explain each assumption explicitly.", isImpostor:false},
      {id:"p3", text:"Solve this resource allocation problem. Think out loud as you work through it — show every assumption, flag where data is missing, and state your confidence level for each conclusion before moving to the next step.", isImpostor:false},
      {id:"p4", text:"Figure out the best strategy for us and give me your recommendation with the reasoning behind it.", isImpostor:true},
      {id:"p5", text:"Before answering, break this problem into its component parts and list them. Then solve each component separately. Only synthesise a final recommendation after all components are resolved. If any component requires data I haven't provided, say so explicitly rather than assuming.", isImpostor:false},
    ],
    impostorExplanation:"Prompt 4 is the impostor. 'Figure out the best strategy' gives the AI no problem definition, no constraints, no data, no structure, and no instruction to show reasoning. Without chain-of-thought instruction, the AI will jump directly to a confident-sounding conclusion, skipping the reasoning that would reveal whether the conclusion is actually valid. The other four prompts all explicitly instruct step-by-step reasoning, assumption declaration, and uncertainty flagging.",
  },

  // ── 29 ── COMPRESS ── Hard ────────────────────────────────────────────────────
  {
    id:"ct29", trail:"Clarity Trail",
    title:"The Minimizer IV — The Strategy Memo",
    subtitle:"Remove everything except what the AI actually needs",
    type:"COMPRESS", difficulty:"Hard", xp:90, color:"#C4A5E0",
    timeLimit:340,
    scenario:"A strategy consultant wrote this prompt for a competitive analysis. It is full of managerial hedging and redundant qualifiers. Compress to 20 words or fewer without losing any information the AI actually needs.",
    original:"What I am really trying to understand here is whether it might be possible for you to provide some kind of analysis or overview of what our main competitors are currently doing in the market, particularly with respect to their pricing strategies and any recent product changes they may have made.",
    targetWords:20,
    modelAnswer:"Analyse Hireflow's top 3 competitors: current pricing strategies and product changes in the last 6 months.",
    modelWordCount:18,
  },

  // ── 30 ── JIGSAW ── Hard ──────────────────────────────────────────────────────
  {
    id:"ct30", trail:"Clarity Trail",
    title:"The Jigsaw VI — The Sales Enablement",
    subtitle:"8 fragments — two are almost identical but one is subtly wrong",
    type:"JIGSAW", difficulty:"Hard", xp:70, color:"#85B7EB",
    timeLimit:220,
    scenario:"A sales enablement manager wrote this prompt for a battle card (a 1-page competitive comparison doc used by sales reps). Two fragments look almost identical — one is correct, one will produce an unusable output.",
    fragments:[
      {id:"f1", text:"You are a senior sales enablement manager at a B2B SaaS company.", correct:0},
      {id:"f2", text:"Create a battle card comparing Hireflow against Workday Recruiting for use by sales development reps in discovery calls.", correct:1},
      {id:"f3", text:"Hireflow strengths: AI-native, 3x faster screening, 60% lower cost per hire, direct Slack integration. Workday weaknesses: complex implementation (6-9 months), enterprise pricing only, no AI screening.", correct:2},
      {id:"f4", text:"Format: two-column table. Left column: evaluation criteria. Right column: Hireflow vs Workday for each criterion.", correct:3},
      {id:"f5", text:"Criteria to cover: Implementation time, Pricing model, AI capabilities, Integration options, Best-fit company size.", correct:4},
      {id:"f6", text:"Add a 'How to handle objections' section below the table with the top 3 Workday objections and a one-sentence counter for each.", correct:5},
      {id:"f7", text:"Tone: confident, factual, no unverifiable claims. Reps will use this verbatim — accuracy is critical.", correct:6},
      {id:"decoy", text:"Tone: persuasive and compelling — make Hireflow sound as impressive as possible to close deals faster.", correct:-1},
    ],
    explanation:"The decoy ('persuasive and compelling — make Hireflow sound as impressive as possible') is the wrong tone instruction. The correct tone is 'confident, factual, no unverifiable claims' because sales reps use battle cards in live calls — if a claim is wrong or exaggerated, the rep loses credibility instantly. The decoy prioritises persuasion over accuracy, which is exactly wrong for this use case.",
  },

  // ── 31 ── TAP TO SELECT ── Hard ───────────────────────────────────────────────
  {
    id:"ct31", trail:"Clarity Trail",
    title:"Spot the Vague Words IV — The System Prompt",
    subtitle:"Vague words in a system prompt cause compounding failures",
    type:"TAP TO SELECT", difficulty:"Hard", xp:55, color:"#A8A9AD",
    timeLimit:120,
    scenario:"This system prompt was deployed for a customer service AI. Within a week, it was giving refunds it wasn't authorised to give, sharing internal pricing data, and answering questions outside its scope. Find every vague word that allowed this to happen.",
    prompt:"You are a helpful customer service agent for our company. Answer customer questions as best you can and try to resolve their issues in a friendly and efficient way.",
    words:["You","are","a","helpful","customer","service","agent","for","our","company","Answer","customer","questions","as","best","you","can","and","try","to","resolve","their","issues","in","a","friendly","and","efficient","way"],
    vagueWords:["helpful","our company","as best you can","try to resolve","their issues","friendly","efficient"],
    explanation:"Every vague word became a failure mode: 'helpful' had no scope, so the AI helped with anything. 'Our company' gave no product scope. 'As best you can' had no limits, so it tried everything. 'Try to resolve' meant it attempted refunds and escalations it wasn't authorised for. 'Their issues' had no topic boundary. 'Friendly and efficient' are personality traits, not operational constraints. A working system prompt defines scope, forbidden actions, escalation rules, and fallback behaviour explicitly.",
    rewrite:"You are a Tier 1 customer support agent for Flowspace (project management SaaS). Handle only: billing questions, account access, and feature FAQs.\n\nForbidden: issuing refunds, discussing unreleased features, sharing pricing not on the public website, commenting on competitor products.\n\nFor any query outside this scope: 'I'll connect you with our specialist team — one moment.'\n\nTone: professional, concise. Resolve in under 3 messages where possible.",
  },

  // ── 32 ── DIAGNOSE & REWRITE ── Expert ───────────────────────────────────────
  {
    id:"ct32", trail:"Clarity Trail",
    title:"Prompt Autopsy V — The Misleading Instruction",
    subtitle:"The prompt looks good. The flaw is one word that inverts the output.",
    type:"DIAGNOSE & REWRITE", difficulty:"Expert", xp:95, color:"#8B9ED4",
    timeLimit:280,
    scenario:"A product manager wrote this prompt to get honest user feedback themes from interview transcripts. The AI produced a beautifully structured report — but every theme it identified was positive. The PM almost presented it to the board before realising the AI had been instructed to find positives only. Find the single word that caused this.",
    prompt:"Analyse these 12 user interview transcripts and identify the key themes that highlight what users find valuable and satisfying about the product. Organise themes by frequency and include supporting quotes.",
    flaws:[
      {id:"a", label:"'Valuable and satisfying' instructs the AI to find only positive themes", correct:true},
      {id:"b", label:"No instruction to surface negative themes, frustrations, or unmet needs", correct:true},
      {id:"c", label:"'Highlight' implies emphasis on positives, not balanced analysis", correct:true},
      {id:"d", label:"No format for presenting negative vs positive themes separately", correct:true},
      {id:"e", label:"The word 'analyse' is too vague", correct:false},
      {id:"f", label:"12 transcripts is too many to analyse accurately", correct:false},
    ],
    explanation:"Three words do the damage: 'valuable', 'satisfying', and 'highlight'. Together they instruct the AI to curate positives. A genuine UX research analysis must surface frictions, drop-off points, unmet needs, and confusions — the exact things that drive product decisions. The AI followed the brief perfectly. The brief was wrong.",
    rewrite:"Analyse these 12 user interview transcripts and identify all key themes — both positive (what users value) and negative (frustrations, confusions, unmet needs, drop-off moments).\n\nFor each theme:\n- Frequency (how many of 12 interviews mentioned it)\n- Representative quote\n- Implication for product decisions\n\nOrganise into two sections: Strengths and Friction Points. Do not omit negative themes.",
  },

  // ── 33 ── WORD SURGEON ── Hard ────────────────────────────────────────────────
  {
    id:"ct33", trail:"Clarity Trail",
    title:"Word Surgeon VI — The Persona Trap",
    subtitle:"4 edits — the role is causing the AI to be too confident",
    type:"WORD SURGEON", difficulty:"Hard", xp:75, color:"#7EC8A4",
    timeLimit:180,
    scenario:"A healthcare startup used this prompt for an AI health information chatbot. The role assignment caused the AI to give diagnosis-level confident answers with zero hedging or safety disclaimers. Patients acted on its advice without seeing a doctor. Use exactly 4 edits to make this prompt safe without making the bot useless.",
    prompt:"You are a doctor. Answer patient questions about symptoms and provide guidance on what they should do.",
    maxEdits:4,
    hints:["The role 'doctor' removes all hedging — soften it.", "Add a scope limitation on what types of questions to answer.", "Add a mandatory safety disclaimer instruction.", "Add a referral instruction for serious symptoms."],
    modelAnswer:"You are a medical information assistant, not a doctor. Provide general health information only — never diagnose. Always end responses with: 'Please consult a qualified healthcare professional for personal medical advice.' For symptoms suggesting emergency (chest pain, difficulty breathing, severe bleeding): immediately direct to emergency services.",
    modelChanges:["'a doctor' → 'a medical information assistant, not a doctor'","added 'Provide general health information only — never diagnose'","added mandatory disclaimer instruction","added emergency referral rule"],
    explanation:"Four edits transform a dangerous prompt into a responsible one: softening the role (removes the authority that suppresses hedging), adding a scope boundary (information vs diagnosis), mandating a safety disclaimer (every response), and adding an emergency referral rule (life safety). The bot is still useful — it can still provide general information. It is now also safe.",
  },

  // ── 34 ── DRAG & ORDER ── Medium ─────────────────────────────────────────────
  {
    id:"ct34", trail:"Clarity Trail",
    title:"Build the Structure IV — The Onboarding Email",
    subtitle:"5 elements — but two are in the wrong positions by default",
    type:"DRAG & ORDER", difficulty:"Medium", xp:55, color:"#9B8ED4",
    timeLimit:170,
    scenario:"An email marketer needs a prompt to generate a Day 1 onboarding email for new SaaS users. The correct order prioritises user outcome before product features — a common mistake to get wrong.",
    correctOrder:["role","task","audience","format","constraint"],
    blocks:[
      {id:"role",       type:"role",       label:"ROLE",       text:"You are a lifecycle email specialist with expertise in SaaS onboarding sequences"},
      {id:"task",       type:"task",       label:"TASK",       text:"Write the Day 1 onboarding email for Flowspace, a project management tool"},
      {id:"audience",   type:"audience",   label:"AUDIENCE",   text:"New user who signed up 1 hour ago — likely evaluating 2-3 tools, not yet committed"},
      {id:"format",     type:"format",     label:"FORMAT",     text:"Subject line + 3-paragraph body: welcome + single key action + what to expect next"},
      {id:"constraint", type:"constraint", label:"CONSTRAINT", text:"Max 120 words in body. One CTA only: 'Create your first project'. Tone: warm, confident, not salesy. No feature list."},
      {id:"decoy1",     type:"decoy",      label:"DECOY",      text:"List all the features available in the free plan to help the user understand the product"},
      {id:"decoy2",     type:"decoy",      label:"DECOY",      text:"Write in a formal corporate tone to establish brand credibility with new users"},
    ],
  },

  // ── 35 ── IMPOSTOR ── Expert ──────────────────────────────────────────────────
  {
    id:"ct35", trail:"Clarity Trail",
    title:"The Impostor V — The Fine Print",
    subtitle:"The flaw is not in what the prompt says — it is in what it allows.",
    type:"IMPOSTOR", difficulty:"Expert", xp:90, color:"#C4A5E0",
    timeLimit:170,
    task:"Task: System prompts for an AI that generates financial projections for a startup pitch deck.",
    prompts:[
      {id:"p1", text:"You are a financial modelling assistant. Generate projection tables only when given actual base metrics (current ARR, growth rate, cost structure). Always label outputs as 'Illustrative projections — not a financial forecast'. Never generate projections without input data.", isImpostor:false},
      {id:"p2", text:"You are a startup finance assistant. Build 3-year revenue projections based on the inputs provided. Show assumptions explicitly for every number. Flag where assumptions are speculative vs data-driven. Output format: table with a separate assumptions column.", isImpostor:false},
      {id:"p3", text:"You are a financial analyst. Create realistic-looking financial projections for our pitch deck that will impress investors.", isImpostor:true},
      {id:"p4", text:"You are a financial projection tool. Accept: current MRR, growth rate, churn rate, headcount plan. Output: monthly projections for 36 months. All projections must be mechanically derived from inputs — no adjustments for 'story'. Label as estimates.", isImpostor:false},
      {id:"p5", text:"You are a finance assistant specialising in early-stage SaaS metrics. Generate projections only from provided data. If asked to project without data, respond: 'I need your current ARR, growth rate, and cost base to build projections.' Never fabricate numbers.", isImpostor:false},
    ],
    impostorExplanation:"Prompt 3 is the impostor. 'Realistic-looking projections that will impress investors' instructs the AI to optimise for appearance over accuracy. It has no input requirement (projections without data = fabrication), no assumption transparency, no labelling requirement, and an explicit goal of impression over truth. In a regulated context, this prompt could produce materially misleading financial documents. The word 'realistic-looking' is the tell — it means 'looks real' not 'is real'.",
  },

  // ── 36 ── FILL GAP ── Hard ────────────────────────────────────────────────────
  {
    id:"ct36", trail:"Clarity Trail",
    title:"Fill the Gap II — The System Prompt",
    subtitle:"Complete the AI agent's system prompt — 5 structural gaps",
    type:"FILL GAP", difficulty:"Hard", xp:70, color:"#A8A9AD",
    timeLimit:200,
    scenario:"A startup is deploying an AI assistant for their B2B SaaS product. The system prompt is half-written. Fill the 5 critical gaps to make it safe, scoped, and useful.",
    basePrompt:"You are an AI assistant for Flowspace.",
    missingElements:[
      {id:"m1", label:"Scope definition", hint:"What topics/tasks is this agent allowed to handle?", placeholder:"You handle only..."},
      {id:"m2", label:"Forbidden actions", hint:"What should it never do or say?", placeholder:"Never..."},
      {id:"m3", label:"Escalation rule", hint:"When should it hand off to a human?", placeholder:"If the user asks about... say..."},
      {id:"m4", label:"Tone and persona", hint:"How should it communicate? Brand voice?", placeholder:"Your tone is..."},
      {id:"m5", label:"Uncertainty handling", hint:"What should it do when it does not know something?", placeholder:"If you are unsure..."},
    ],
    modelAnswer:"You are an AI assistant for Flowspace. You handle only: product feature questions, onboarding guidance, and billing FAQs. Never: issue refunds, share internal data, discuss unreleased features, or give legal/financial advice. If the user reports a bug or requests account deletion, say: 'I'll connect you with our support team right away.' Your tone is warm, concise, and solution-focused — never robotic. If you are unsure of an answer, say: 'Let me check that for you' and escalate rather than guessing.",
  },

  // ── 37 ── JIGSAW ── Expert ────────────────────────────────────────────────────
  {
    id:"ct37", trail:"Clarity Trail",
    title:"The Jigsaw VII — The Crisis Memo",
    subtitle:"9 fragments, 3 decoys — every decoy subtly contradicts a real fragment",
    type:"JIGSAW", difficulty:"Expert", xp:90, color:"#85B7EB",
    timeLimit:260,
    scenario:"A comms director wrote this prompt for a crisis response memo after a product outage. 9 real fragments, 3 decoys — each decoy contradicts a real fragment's intent. Identify the decoys and reassemble the 6 correct fragments.",
    fragments:[
      {id:"f1", text:"You are a crisis communications director with experience in B2B SaaS outage communications.", correct:0},
      {id:"f2", text:"Write an internal memo to all staff explaining the 4-hour outage that occurred on 14 May between 09:00 and 13:00 GMT.", correct:1},
      {id:"f3", text:"Facts to include: root cause (database replication failure), number of affected customers (1,200), revenue impact (est. £85k), fix deployed at 13:00, post-mortem scheduled for 16 May.", correct:2},
      {id:"f4", text:"Tone: direct, accountable, no blame language. Acknowledge what went wrong. State what is fixed. State what will change.", correct:3},
      {id:"f5", text:"Structure: What happened, Impact, Root cause, Fix deployed, What changes to prevent recurrence.", correct:4},
      {id:"f6", text:"Max 300 words. Avoid jargon. Every employee should understand this, not just engineers.", correct:5},
      {id:"decoy1", text:"Emphasise that the engineering team worked incredibly hard and should not be blamed — frame the failure as a system issue.", correct:-1},
      {id:"decoy2", text:"Use technical detail to demonstrate engineering rigour and rebuild staff confidence in the platform's stability.", correct:-1},
      {id:"decoy3", text:"Keep the financial impact and customer numbers vague to avoid unnecessary internal panic.", correct:-1},
    ],
    explanation:"Decoy 1 ('should not be blamed') contradicts 'no blame language' — the real instruction is about tone, not exoneration. Decoy 2 ('technical detail') contradicts 'avoid jargon, every employee should understand'. Decoy 3 ('keep numbers vague') directly contradicts the facts section which requires specific numbers. Each decoy sounds reasonable in isolation but breaks the prompt's internal logic when placed alongside the real fragments.",
  },

  // ── 38 ── DRAG & ORDER ── Expert ─────────────────────────────────────────────
  {
    id:"ct38", trail:"Clarity Trail",
    title:"Build the Structure V — The Pitch Deck Slide",
    subtitle:"8 elements — the correct order is expert-level non-obvious",
    type:"DRAG & ORDER", difficulty:"Expert", xp:90, color:"#9B8ED4",
    timeLimit:240,
    scenario:"A founder needs a prompt to generate the Problem slide for a Series A pitch deck. The correct order is: constraint first, then role, because the constraint defines the entire lens through which the role operates. This is advanced prompt architecture.",
    correctOrder:["constraint","role","task","context","evidence","format","tone","antipattern"],
    blocks:[
      {id:"constraint",   type:"constraint",   label:"CONSTRAINT",    text:"This is for a 60-second verbal pitch to a Series A VC — not a document. Every word must be audibly clear."},
      {id:"role",         type:"role",         label:"ROLE",          text:"You are a VC pitch coach who has helped 40 startups raise Series A rounds."},
      {id:"task",         type:"task",         label:"TASK",          text:"Write the Problem slide narrative for Hireflow's Series A pitch deck."},
      {id:"context",      type:"context",      label:"CONTEXT",       text:"Hireflow automates CV screening for enterprise HR teams. The problem: enterprise hiring teams spend 60% of their time on CV screening that could be automated, leading to 45-day average time-to-hire."},
      {id:"evidence",     type:"evidence",     label:"EVIDENCE",      text:"Use these real data points: 73% of HR managers say screening volume is their #1 bottleneck (SHRM 2023). Average enterprise role receives 250 CVs."},
      {id:"format",       type:"format",       label:"FORMAT",        text:"One punchy problem statement (1 sentence). One 'Why now' sentence. Two supporting statistics. One 'Therefore' sentence setting up the solution."},
      {id:"tone",         type:"tone",         label:"TONE",          text:"Urgency without hyperbole. Numbers-first. No adjectives that can't be verified."},
      {id:"antipattern",  type:"antipattern",  label:"AVOID",         text:"Do not start with 'Every company struggles with...'. Do not use the word 'revolutionary'. Do not end with a question."},
      {id:"decoy1",       type:"decoy",        label:"DECOY",         text:"Make it inspirational and emotionally compelling to connect with investors on a human level."},
      {id:"decoy2",       type:"decoy",        label:"DECOY",         text:"Include a detailed market size calculation to establish the scale of the opportunity."},
    ],
  },

  // ── 39 ── TAP TO SELECT ── Expert ────────────────────────────────────────────
  {
    id:"ct39", trail:"Clarity Trail",
    title:"Spot the Vague Words V — The Chain Prompt",
    subtitle:"Vague words in a multi-step prompt cascade into compound failure",
    type:"TAP TO SELECT", difficulty:"Expert", xp:65, color:"#A8A9AD",
    timeLimit:130,
    scenario:"A growth analyst wrote this multi-step prompt for a market analysis. At step 2, the AI had no idea what 'the above' referred to. At step 3, 'actionable recommendations' produced a 6-page strategy document. Find every word that causes cascading failure.",
    prompt:"First analyse our market position then based on the above create a summary and finally provide some actionable recommendations that our team can use going forward.",
    words:["First","analyse","our","market","position","then","based","on","the","above","create","a","summary","and","finally","provide","some","actionable","recommendations","that","our","team","can","use","going","forward"],
    vagueWords:["analyse","our market position","based on the above","a summary","some","actionable","our team","going forward"],
    explanation:"Eight failure modes: 'analyse' without scope, 'our market position' without naming a company or market, 'based on the above' is a reference to nothing defined, 'a summary' has no length or format, 'some' is indefinite, 'actionable' means anything from a post-it note to a strategy overhaul, 'our team' is undefined, and 'going forward' is a corporate filler phrase with no temporal meaning. In a multi-step prompt, each vagueness compounds the next.",
    rewrite:"Step 1: Analyse Hireflow's competitive position in UK enterprise HR tech against Workday and Greenhouse. Focus: pricing, AI capabilities, implementation time.\nStep 2: Summarise in 150 words — one paragraph per competitor.\nStep 3: Recommend 3 specific product or GTM actions for Hireflow's next 90 days, each in one sentence.",
  },

  // ── 40 ── FILL GAP ── Expert ──────────────────────────────────────────────────
  {
    id:"ct40", trail:"Clarity Trail",
    title:"Fill the Gap III — The Research Prompt",
    subtitle:"Complete a research analysis prompt — 5 expert-level gaps",
    type:"FILL GAP", difficulty:"Expert", xp:80, color:"#A8A9AD",
    timeLimit:220,
    scenario:"A strategy consultant is building a competitive intelligence prompt to run against 50 company websites. The base prompt produces inconsistent outputs because 5 structural elements are missing. Fill them to make it produce consistent, comparable outputs every time.",
    basePrompt:"Analyse this company's website and provide a competitive intelligence summary.",
    missingElements:[
      {id:"m1", label:"Specific extraction fields", hint:"What exact data points should be extracted every time?", placeholder:"Extract: pricing, target customer, key differentiators..."},
      {id:"m2", label:"Output format for comparability", hint:"How should output be structured so 50 summaries can be compared?", placeholder:"Format: structured table with columns..."},
      {id:"m3", label:"Handling missing information", hint:"What should the AI do when a field is not findable on the site?", placeholder:"If a field is not available..."},
      {id:"m4", label:"Inference rule", hint:"When is the AI allowed to infer vs only report?", placeholder:"Only report what is explicitly stated..."},
      {id:"m5", label:"Length constraint per field", hint:"How long should each field be to ensure conciseness?", placeholder:"Max ... words per field..."},
    ],
    modelAnswer:"Analyse this company's website and extract competitive intelligence.\n\nExtract exactly these 6 fields: Target customer segment, Core value proposition, Pricing model (if public), Top 3 features highlighted, Integration ecosystem, Trust signals (customers, certifications, case studies).\n\nFormat: structured table, one row per field, two columns (Field | Finding).\n\nIf a field is not findable on the website, write 'Not publicly available' — do not infer.\n\nOnly report what is explicitly stated on the site. Do not draw conclusions not supported by the text.\n\nMax 20 words per field.",
  },

  // ── 41 ── WORD SURGEON ── Expert ─────────────────────────────────────────────
  {
    id:"ct41", trail:"Clarity Trail",
    title:"Word Surgeon VII — The Feedback Loop",
    subtitle:"5 edits — the prompt is causing the AI to agree with everything",
    type:"WORD SURGEON", difficulty:"Expert", xp:90, color:"#7EC8A4",
    timeLimit:200,
    scenario:"A product team used this prompt to evaluate their product strategy. The AI responded positively to every idea, even weak ones. It never pushed back. This is sycophancy — caused by the prompt. Use exactly 5 edits to make the AI a genuine critical evaluator.",
    prompt:"Review our product strategy and give us your thoughts on how we can improve and build on the good ideas we have developed.",
    maxEdits:5,
    hints:["'Build on the good ideas' pre-approves everything — remove the positive framing.", "Add an explicit instruction to challenge assumptions.", "Add an instruction to identify the weakest element.", "Add a steelmanning instruction — argue the opposing case.", "Add a specific output format that forces critical structure."],
    modelAnswer:"Critically evaluate this product strategy. For each element: state your honest assessment including weaknesses, not just improvements. Identify the single weakest assumption. Steelman the strongest counter-argument to our overall direction. Format: strength, weakness, and critical question for each section.",
    modelChanges:["'give us your thoughts on' → 'Critically evaluate'","removed 'build on the good ideas we have developed'","added 'including weaknesses, not just improvements'","added 'Identify the single weakest assumption. Steelman the strongest counter-argument'","added format instruction forcing critical structure"],
    explanation:"Five edits dismantle five sycophancy triggers: 'give us your thoughts' (too soft) → 'critically evaluate', 'build on the good ideas' (pre-approves) → removed, no weakness instruction → added, no challenge instruction → added steelmanning, no format → added critical structure. A prompt that asks for improvement on 'good ideas' will never get honest pushback.",
  },

  // ── 42 ── DIAGNOSE & REWRITE ── Expert ───────────────────────────────────────
  {
    id:"ct42", trail:"Clarity Trail",
    title:"Prompt Autopsy VI — The Tone Inversion",
    subtitle:"The prompt looks thorough. The flaw is one instruction that inverts the output.",
    type:"DIAGNOSE & REWRITE", difficulty:"Expert", xp:95, color:"#8B9ED4",
    timeLimit:290,
    scenario:"A comms team wrote this prompt to generate a transparent incident report for customers after a data breach. The report the AI produced was thorough and well-structured — but customers felt it was evasive and corporate. A single instruction in the prompt caused this. Find it.",
    prompt:"Write a customer-facing incident report about a data breach. Cover: what happened, what data was affected, what we have done, and what customers should do. Tone: professional and legally cautious. Include all relevant facts.",
    flaws:[
      {id:"a", label:"'Legally cautious' instructs the AI to hedge and avoid direct accountability", correct:true},
      {id:"b", label:"'Professional' in this context means corporate distance, not warmth", correct:true},
      {id:"c", label:"No instruction to use plain English — legal hedging produces jargon", correct:true},
      {id:"d", label:"'All relevant facts' gives the AI discretion to omit uncomfortable details", correct:true},
      {id:"e", label:"The four-part structure is wrong for incident reports", correct:false},
      {id:"f", label:"The prompt is too long", correct:false},
    ],
    explanation:"'Legally cautious' is the primary culprit — it instructs the AI to hedge, qualify, and avoid direct statements of accountability. Combined with 'professional', the AI produces exactly what companies are criticised for: technically accurate but humanly evasive communications. In a data breach context, customers need direct acknowledgement, plain language, and clear next steps — the opposite of 'legally cautious'.",
    rewrite:"Write a customer-facing incident report about a data breach. Cover: what happened, what data was affected, what we have done, and what customers should do.\n\nTone: direct, human, accountable — NOT legally cautious. Own the mistake in plain language. No passive voice. No 'we regret to inform you'. No qualifications that soften responsibility.\n\nLanguage: plain English only. If a 10-year-old couldn't understand a sentence, rewrite it.\n\nInclude every fact listed. Do not omit anything that increases our accountability.",
  },

  // ── 43 ── COMPRESS ── Expert ──────────────────────────────────────────────────
  {
    id:"ct43", trail:"Clarity Trail",
    title:"The Minimizer V — The Ultimate Compression",
    subtitle:"A 70-word prompt full of every bad habit. Compress to 10 words.",
    type:"COMPRESS", difficulty:"Expert", xp:110, color:"#C4A5E0",
    timeLimit:380,
    scenario:"This is the hardest compression challenge in the trail. A non-technical founder wrote this prompt. It contains every prompting anti-pattern: over-politeness, hedging, redundancy, vagueness, and filler. Compress to 10 words or fewer while preserving every element that actually matters.",
    original:"Hi, I was just wondering if it might be at all possible for you to perhaps help me out by writing a fairly brief overview or introduction type of thing about what machine learning is for someone who doesn't really have a technical background and might find all the jargon a bit confusing and overwhelming.",
    targetWords:10,
    modelAnswer:"Explain machine learning simply for a non-technical reader. 150 words.",
    modelWordCount:10,
  },

  // ── 44 ── JIGSAW ── Medium ────────────────────────────────────────────────────
  {
    id:"ct44", trail:"Clarity Trail",
    title:"The Jigsaw VIII — The Pricing Strategy",
    subtitle:"Reassemble a complex business analysis prompt — 7 fragments",
    type:"JIGSAW", difficulty:"Medium", xp:65, color:"#85B7EB",
    timeLimit:210,
    scenario:"A startup CPO wrote this prompt to analyse a pricing strategy decision. Fragments were scrambled. No decoys this time — every fragment is real and necessary. The challenge is in the order alone.",
    fragments:[
      {id:"f1", text:"Analyse whether Hireflow should move from usage-based pricing to a seat-based subscription model.", correct:0},
      {id:"f2", text:"Current state: £49/month per 100 CVs screened. 80% of customers use under 200 CVs/month. 20% use over 1,000 CVs/month and are our highest-retention segment.", correct:1},
      {id:"f3", text:"Proposed model: £299/month per recruiter seat. Average customer has 3 recruiters.", correct:2},
      {id:"f4", text:"Evaluate using these 3 lenses: revenue impact for top 20% customers, churn risk for bottom 80%, and competitive positioning vs Workday (seat-based) and Greenhouse (seat-based).", correct:3},
      {id:"f5", text:"For each lens: give a clear positive case, a risk case, and a recommended mitigation.", correct:4},
      {id:"f6", text:"Conclude with a recommended decision and the one data point you would want before committing.", correct:5},
      {id:"f7", text:"Format: one section per lens plus a Conclusion section. Max 400 words total.", correct:6},
    ],
    explanation:"The correct order follows the structure of a sound business analysis: define the decision, establish current state, define the proposed alternative, set the evaluation framework, define the output format for each evaluation, define the conclusion format, then set the length constraint. Each fragment depends on the previous one — the evaluation framework (f4) only makes sense after both the current state (f2) and proposed model (f3) are established.",
  },

  // ── 45 ── WORD SURGEON ── Expert ─────────────────────────────────────────────
  {
    id:"ct45", trail:"Clarity Trail",
    title:"Word Surgeon VIII — The Final Cut",
    subtitle:"The hardest surgical challenge — 2 edits only, maximum impact",
    type:"WORD SURGEON", difficulty:"Expert", xp:100, color:"#7EC8A4",
    timeLimit:240,
    scenario:"A founder used this prompt to generate a one-sentence company positioning statement. The AI produced a generic sentence that could describe any SaaS company. You have only 2 edits — the fewest of any challenge. Make them count. Think carefully before you edit.",
    prompt:"Write a positioning statement for our software company that clearly explains what we do and who we are for.",
    maxEdits:2,
    hints:["The entire prompt is about a hypothetical company — the AI has nothing real to work with.", "One edit should anchor the company. One edit should anchor the differentiator or category."],
    modelAnswer:"Write a one-sentence positioning statement for Hireflow: AI CV screening that reduces enterprise time-to-hire by 60%.",
    modelChanges:["replaced 'our software company' with 'Hireflow: AI CV screening that reduces enterprise time-to-hire by 60%'","added 'one-sentence' to constrain the output length"],
    explanation:"With only 2 edits, every word must earn its place. Edit 1: replace the generic company reference with real product identity — without this, the AI invents a generic SaaS company. Edit 2: add 'one-sentence' as a format constraint — without it, 'positioning statement' can mean anything from a tagline to a paragraph. Two edits, two transformations. Less is the test.",
  },

  // ── TONE DOJO ────────────────────────────────────────────────────────────────

  {
    id:"td1", trail:"Tone Dojo", step:1, total:7,
    title:"Tone Identifier",
    subtitle:"Read the AI output — name the tone that produced it",
    type:"MULTIPLE CHOICE", difficulty:"Starter", xp:30, color:"#D4A574",
    timeLimit:60,
    questions:[
      {
        statement:"Identify the tone of this AI output:",
        output:"The quarterly numbers, I must confess, carry a certain melancholy weight. Revenue declined 12% — not catastrophically, but enough to warrant the kind of quiet, searching questions that good organisations ask themselves in the small hours.",
        options:["Formal corporate","Literary & reflective","Aggressive sales","Technical analytical"],
        correct:1,
        explanation:"'Melancholy weight', 'small hours', 'quiet searching questions' — literary devices. The prompt specified: 'You are a seasoned essayist. Reflect on our Q3 results with emotional intelligence and literary flair.'"
      },
      {
        statement:"Identify the tone of this AI output:",
        output:"YOUR COMPETITION IS EATING YOUR LUNCH. While you read this, three rivals just closed deals you could have won. The question isn't whether to act — it's whether you'll act before it's too late.",
        options:["Formal corporate","Literary & reflective","Aggressive urgency","Academic neutral"],
        correct:2,
        explanation:"Short punchy sentences, second-person attack, manufactured scarcity — classic aggressive urgency. The prompt specified: 'Write like a high-pressure sales trainer addressing a complacent team. No softening.'"
      },
      {
        statement:"Identify the tone of this AI output:",
        output:"The dataset exhibits statistically significant heteroscedasticity (Breusch-Pagan p < 0.03), suggesting OLS assumptions are violated. Recommend robust standard errors or WLS regression as remediation strategies.",
        options:["Technical analytical","Formal corporate","Aggressive urgency","Conversational"],
        correct:0,
        explanation:"Domain terminology, statistical notation, passive construction, zero hedging — textbook technical-analytical register. The prompt specified: 'You are a PhD econometrician. Produce a technical assessment for a peer reviewer.'"
      },
    ],
  },

  {
    id:"td2", trail:"Tone Dojo", step:2, total:7,
    title:"Audience Switcher",
    subtitle:"Rewrite the same brief for 3 radically different audiences",
    type:"MULTI-REWRITE", difficulty:"Hard", xp:90, color:"#D4A574",
    timeLimit:360,
    scenario:"Same topic, three completely different humans. Each requires a different vocabulary, analogy set, and depth. There is no correct answer — but there is a clearly wrong one: using the same voice for all three.",
    topic:"Explain what a REST API is and why it matters.",
    audiences:[
      { label:"A 10-year-old", hint:"Use a physical world analogy. No jargon. One or two short sentences maximum.", icon:"◇" },
      { label:"A non-technical CEO", hint:"Focus on business value, risk, and dependency. What does this mean for their company decisions? 2-3 sentences.", icon:"◈" },
      { label:"A senior backend engineer", hint:"Skip the basics entirely. Versioning strategy, idempotency, rate limit design, HTTP semantics.", icon:"◉" },
    ],
  },

  // ── TONE DOJO 3 ──────────────────────────────────────────────────────────────
  {
    id:"td3", trail:"Tone Dojo", step:3, total:7,
    title:"Tone Transplant I",
    subtitle:"Same content, radically different register — spot which prompt produced which output",
    type:"MULTIPLE CHOICE", difficulty:"Medium", xp:45, color:"#D4A574",
    timeLimit:90,
    questions:[
      {
        statement:"Which role prompt produced this output?",
        output:"Right, so the thing with compounding interest is — imagine you've got a snowball rolling down a hill. It picks up more snow as it goes, gets bigger, rolls faster. Your savings work the same way. The longer you leave it, the more it grows on its own growth. Dead simple once you see it.",
        options:["A chartered accountant preparing a board report","A secondary school maths teacher explaining to a Year 9 class","A hedge fund analyst briefing institutional investors","A legal clerk drafting investment documentation"],
        correct:1,
        explanation:"'Right, so', 'Dead simple', snowball analogy — all markers of an informal pedagogical register aimed at young students. The prompt specified: 'You are a secondary school teacher making compound interest accessible to 13-year-olds. Use a physical analogy. Conversational tone. No formulas.'"
      },
      {
        statement:"Which constraint produced this precise, clipped output?",
        output:"Objective: reduce churn. Method: identify top 3 friction points from exit survey data. Owner: Product. Deadline: Q3. Success metric: NPS +8 points.",
        options:["'Write in a warm, encouraging tone'","'Summarise as bullet points for a management meeting'","'Return only valid JSON'","'Format as a five-field action plan. Max 10 words per field. No verbs in labels.'"],
        correct:3,
        explanation:"The rigid parallel structure, consistent label format, and extreme brevity point to a strict formatting constraint. The 'No verbs in labels' instruction explains why each label is a noun phrase. Option 2 would produce longer bullets; option 3 would produce JSON syntax."
      },
      {
        statement:"Identify the register mismatch — which output was produced by the WRONG role for its intended audience?",
        output:"The implementation leverages a microservices architecture predicated on containerised orchestration via Kubernetes, enabling horizontal scalability and fault-tolerant service mesh configurations for enterprise-grade deployment pipelines.",
        options:["A senior DevOps engineer writing technical documentation for the engineering team","A product manager explaining the tech stack to the board of directors","A solutions architect briefing a prospective enterprise client","A CTO drafting an RFP response for a government tender"],
        correct:1,
        explanation:"A product manager's brief to the board should translate technical decisions into business implications — cost, risk, speed-to-market. Dense technical jargon without business framing means the role prompt was too technical for this audience. The board doesn't need to know what a service mesh is; they need to know what it means for uptime and cost."
      },
    ],
  },

  // ── TONE DOJO 4 ──────────────────────────────────────────────────────────────
  {
    id:"td4", trail:"Tone Dojo", step:4, total:7,
    title:"The Register Ladder",
    subtitle:"Rank these 4 AI outputs from most formal to most casual",
    type:"RANK", difficulty:"Medium", xp:55, color:"#D4A574",
    timeLimit:120,
    task:"All four outputs are responses to the same question: 'What time should we launch the product?' Rank from most formal (1) to most casual (4).",
    prompts:[
      {id:"r1", rank:1, text:"Following a comprehensive review of market readiness indicators, competitive positioning, and internal capacity assessments, it is recommended that the product launch be scheduled for Q3, contingent upon the satisfactory resolution of outstanding compliance requirements."},
      {id:"r2", rank:2, text:"Based on our current readiness assessment, we recommend a Q3 launch window. This accounts for the remaining compliance sign-offs and aligns with our competitive window before the Workday update drops."},
      {id:"r3", rank:3, text:"Q3 makes sense — gives us time to sort the compliance stuff and we'd be ahead of Workday's new release. Probably aim for early September if the sign-offs come through."},
      {id:"r4", rank:4, text:"Honestly? September. Get the compliance thing done, beat Workday to market. Don't overthink it."},
    ],
    explanations:[
      "Most formal: passive construction, nominalisation ('assessments', 'requirements'), hedged recommendation ('it is recommended'), no contractions — classic boardroom register.",
      "Professional but direct: first-person plural, present tense, active voice, specific business rationale — this is the executive briefing register.",
      "Conversational professional: contractions ('we'd'), informal qualifier ('stuff'), but still structured — a Slack message to a trusted colleague.",
      "Most casual: 'Honestly?', rhetorical framing, imperative close ('Don't overthink it') — this is how you talk to a co-founder at 11pm.",
    ],
  },

  // ── TONE DOJO 5 ──────────────────────────────────────────────────────────────
  {
    id:"td5", trail:"Tone Dojo", step:5, total:7,
    title:"Tone Injection",
    subtitle:"Match each role prompt to the output it produced",
    type:"MULTIPLE CHOICE", difficulty:"Hard", xp:70, color:"#D4A574",
    timeLimit:120,
    questions:[
      {
        statement:"Which role prompt produced this output about cybersecurity risks?",
        output:"You are standing in the middle of a battlefield, and the enemy can see you — but you cannot see them. Every system you operate is a door. Most of those doors are unlocked. You are not being paranoid. You are being accurate.",
        options:["You are a CISO briefing the security team on technical vulnerabilities","You are a military strategist turned cybersecurity consultant briefing C-suite executives with zero technical background","You are a cybersecurity journalist writing for a mainstream tech publication","You are an IT helpdesk technician writing a user guide on password security"],
        correct:1,
        explanation:"Military metaphors ('battlefield', 'enemy'), second-person direct address, non-technical framing, dramatic urgency — these markers align perfectly with a consultant using military analogies to create visceral impact for a non-technical C-suite audience. The role's 'military strategist' background explains the warfare metaphor set."
      },
      {
        statement:"This prompt was sent: 'You are a stoic philosopher. Respond to this user who is anxious about a work presentation.' Which output is correct?",
        output:"The presentation is not the problem. Your judgment of the presentation is the problem. You cannot control the audience's reaction. You can control your preparation. Prepare completely. Then release attachment to the outcome.",
        options:["This output is correct — stoic philosophy emphasises dichotomy of control and emotional detachment","This output is wrong — a stoic would be warmer and more empathetic","This output is wrong — a stoic would provide practical tips, not philosophy","This output is wrong — a stoic would begin by asking clarifying questions"],
        correct:0,
        explanation:"This output is textbook stoicism: dichotomy of control ('cannot control... can control'), imperative directness, emotional detachment without coldness — exactly how Marcus Aurelius or Epictetus would frame it. Stoicism is not cold; it is precise about what matters and what doesn't."
      },
      {
        statement:"Which single word in this role prompt is causing all the hedging and uncertainty in the output?",
        output:"I think the best approach might possibly be to consider whether perhaps restructuring the team could potentially have some positive effects, though of course there are many factors to weigh up here and different people might reasonably see this differently.",
        options:["'consider'","'perhaps'","'possibly' — but more importantly, the role prompt said 'You are a cautious management consultant who avoids definitive claims'","The hedging is caused by the task, not the role prompt"],
        correct:2,
        explanation:"'Cautious' and 'avoids definitive claims' in the role prompt directly instructs the model to hedge. Every vague word in the output ('might', 'possibly', 'perhaps', 'potentially') is a direct consequence of those two role qualifiers. This is an anti-pattern: roles should be calibrated, not generically hedged."
      },
    ],
  },

  // ── TONE DOJO 6 ──────────────────────────────────────────────────────────────
  {
    id:"td6", trail:"Tone Dojo", step:6, total:7,
    title:"Audience Switcher II — The Hard Cases",
    subtitle:"Three audiences where the wrong tone causes real damage",
    type:"MULTI-REWRITE", difficulty:"Hard", xp:90, color:"#D4A574",
    timeLimit:400,
    scenario:"These are high-stakes communications. Getting the register wrong doesn't just sound odd — it erodes trust, causes confusion, or provokes defensiveness. Rewrite for each audience with precision.",
    topic:"Communicate that the product launch has been delayed by 6 weeks due to a critical security vulnerability discovered in testing.",
    audiences:[
      { label:"Investors / board members", hint:"Frame in terms of risk management, responsible disclosure, and long-term value. No panic. No over-apologising. They need confidence the team is in control.", icon:"◈" },
      { label:"Enterprise customers with signed contracts", hint:"Be direct, specific, honest. Acknowledge the impact. Offer concrete alternatives or compensation. Do not bury the delay in corporate softening language.", icon:"◇" },
      { label:"The internal engineering team who found the bug", hint:"Acknowledge their work positively. Explain the business decision. Keep morale up. Be authentic — they will see through corporate spin immediately.", icon:"◉" },
    ],
  },

  // ── TONE DOJO 7 ──────────────────────────────────────────────────────────────
  {
    id:"td7", trail:"Tone Dojo", step:7, total:7,
    title:"The Tone Architect",
    subtitle:"Build the role prompt that produces a specific target tone",
    type:"DIAGNOSE & REWRITE", difficulty:"Expert", xp:100, color:"#D4A574",
    timeLimit:300,
    scenario:"The target output has a very specific tone: rigorous but accessible, data-driven but narrative, authoritative but not condescending. Your task is to reverse-engineer the role prompt that would produce this tone.",
    prompt:"The retention data tells a clear story: users who complete the onboarding sequence retain at 3x the rate of those who don't. This is not a product problem. It is a discovery problem. The product works. Users just need to find the feature that makes it work for them — and right now, 68% of them never do.",
    flaws:[
      {id:"a", label:"No role or persona is specified — the prompt is just a bare task", correct:true},
      {id:"b", label:"No instruction to lead with data before interpretation", correct:true},
      {id:"c", label:"No instruction to use second-person or narrative framing", correct:false},
      {id:"d", label:"No instruction to be direct and avoid hedging language", correct:true},
      {id:"e", label:"No instruction to distinguish symptom from root cause", correct:true},
      {id:"f", label:"The output is too short — the prompt needs a minimum word count", correct:false},
    ],
    explanation:"The output has four defining characteristics: (1) it opens with data, then interprets it; (2) the role is a sharp analyst-communicator, not a hedging consultant; (3) it draws a precise diagnostic distinction ('not a product problem — a discovery problem'); (4) the tone is direct and confident. None of these emerge from a bare task prompt — they all require explicit role and style instructions.",
    rewrite:"You are a product analytics lead presenting findings to a product and growth team. Write in a data-first, narrative style: open with the key metric, then interpret it in plain language. Be direct and confident — no hedging. Diagnose root cause explicitly, distinguishing it from surface symptoms. Maximum 80 words.",
  },];
const difficultyColor = { Starter:"#A8A9AD", Medium:"#8B9ED4", Hard:"#C47FA0", Expert:"#EF9F27" };

const ChallengesPage = ({ onBack }) => {
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [phase, setPhase] = useState("map"); // map | challenge | result
  const [completedIds, setCompletedIds] = useState([]);
  const [xpTotal, setXpTotal] = useState(0);
  const [result, setResult] = useState(null);

  const openChallenge = (ch) => { setSelectedChallenge(ch); setPhase("challenge"); window.scrollTo({top:0,behavior:"smooth"}); };
  const closeChallenge = () => { setSelectedChallenge(null); setPhase("map"); window.scrollTo({top:0,behavior:"smooth"}); };
  const PASS_THRESHOLD = 70; // minimum score to mark complete

  const completeChallenge = (ch, score, timeTaken) => {
    const passed = score >= PASS_THRESHOLD;
    if (passed && !completedIds.includes(ch.id)) { setCompletedIds(p=>[...p,ch.id]); setXpTotal(p=>p+ch.xp); }
    setResult({ch, score, timeTaken: timeTaken || 0, passed}); setPhase("result");
  };

  const trails = [...new Set(CHALLENGES.map(c=>c.trail))];

  return (
    <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}} transition={{duration:0.45}}
      style={{minHeight:"100vh",background:S.bg,paddingTop:"80px",paddingBottom:"100px"}}>
      <div style={{maxWidth:"860px",margin:"0 auto",padding:"48px 32px 0"}}>

        {phase==="map" && (
          <>
            {/* Header */}
            <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} style={{marginBottom:"42px"}}>
              <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"10px",letterSpacing:"0.28em",textTransform:"uppercase",color:S.muted,marginBottom:"10px"}}>Prompt World</div>
              <h1 style={{fontFamily:"'Playfair Display', serif",fontSize:"clamp(32px,5vw,50px)",fontWeight:700,color:S.white,marginBottom:"8px",lineHeight:1.1}}>Challenge Arena</h1>
              <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"15px",color:S.mutedMd,lineHeight:1.8,maxWidth:"540px",marginBottom:"24px"}}>Each challenge tests a distinct prompting skill through active practice. Read carefully — these are not trivial. Real scenarios. Real failure modes. Real stakes.</p>

              {/* Stats strip */}
              <div style={{display:"flex",gap:"12px",flexWrap:"wrap"}}>
                {[
                  {label:"Challenges completed", val:`${completedIds.length} / ${CHALLENGES.length}`},
                  {label:"XP earned", val:`${xpTotal} XP`},
                  {label:"Trails available", val:`${trails.length}`},
                ].map((s,i)=>(
                  <div key={i} style={{padding:"10px 18px",background:"rgba(168,169,173,0.05)",border:"1px solid rgba(168,169,173,0.1)",borderRadius:"10px",display:"flex",gap:"10px",alignItems:"center"}}>
                    <span style={{fontFamily:"'Playfair Display', serif",fontSize:"17px",fontWeight:700,color:S.silverLt}}>{s.val}</span>
                    <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"11px",color:S.muted,letterSpacing:"0.06em"}}>{s.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Trails */}
            {trails.map((trail,ti)=>{
              const trailChallenges = CHALLENGES.filter(c=>c.trail===trail);
              return (
              <motion.div key={trail} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:ti*0.1}} style={{marginBottom:"52px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"14px",marginBottom:"18px"}}>
                  <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"10px",letterSpacing:"0.24em",textTransform:"uppercase",color:S.muted}}>{trail}</div>
                  <div style={{flex:1,height:"1px",background:"rgba(168,169,173,0.1)"}}/>
                  <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"10px",color:S.muted}}>{trailChallenges.filter(c=>completedIds.includes(c.id)).length} / {trailChallenges.length} done</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(248px,1fr))",gap:"12px"}}>
                  {trailChallenges.map((ch)=>{
                    const done = completedIds.includes(ch.id);
                    return (
                      <motion.div key={ch.id} whileHover={{scale:1.02,y:-2}} whileTap={{scale:0.98}}
                        onClick={()=>openChallenge(ch)}
                        style={{background:done?`rgba(${hexToRgb(ch.color)},0.07)`:"rgba(13,13,22,0.97)",border:done?`1px solid rgba(${hexToRgb(ch.color)},0.28)`:"1px solid rgba(168,169,173,0.14)",borderRadius:"14px",padding:"20px",cursor:"pointer",position:"relative",overflow:"hidden"}}>
                        {done && <div style={{position:"absolute",top:10,right:12,fontSize:"10px",color:ch.color,letterSpacing:"0.14em",fontFamily:"'Cormorant Garamond', serif"}}>✦ DONE</div>}
                        <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"10px",flexWrap:"wrap"}}>
                          <span style={{padding:"2px 8px",borderRadius:"20px",background:`rgba(${hexToRgb(ch.color)},0.12)`,border:`1px solid rgba(${hexToRgb(ch.color)},0.22)`,fontFamily:"'Cormorant Garamond', serif",fontSize:"8px",letterSpacing:"0.14em",textTransform:"uppercase",color:ch.color}}>{ch.type}</span>
                          <span style={{padding:"2px 8px",borderRadius:"20px",background:"rgba(168,169,173,0.06)",fontFamily:"'Cormorant Garamond', serif",fontSize:"8px",letterSpacing:"0.1em",color:difficultyColor[ch.difficulty]||S.muted}}>{ch.difficulty}</span>
                        </div>
                        <div style={{fontFamily:"'Playfair Display', serif",fontSize:"15px",fontWeight:700,color:S.white,marginBottom:"4px",lineHeight:1.25}}>{ch.title}</div>
                        <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"11px",color:S.muted,lineHeight:1.55,marginBottom:"14px"}}>{ch.subtitle}</div>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"11px",color:ch.color,fontWeight:600}}>+{ch.xp} XP</span>
                          <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"10px",color:S.muted}}>⏱ {Math.floor(ch.timeLimit/60)}:{String(ch.timeLimit%60).padStart(2,"0")}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );})}
          </>
        )}

        {phase==="challenge" && selectedChallenge && (
          <ChallengeRunner ch={selectedChallenge} onBack={closeChallenge} onComplete={completeChallenge}/>
        )}

        {phase==="result" && result && (
          <ResultScreen result={result} onBack={closeChallenge}
            onRetry={()=>{ setPhase("challenge"); }}
            onNext={()=>{
            const idx = CHALLENGES.findIndex(c=>c.id===result.ch.id);
            const next = CHALLENGES[idx+1];
            if(next){ setSelectedChallenge(next); setPhase("challenge"); }
            else closeChallenge();
          }}/>
        )}
      </div>
    </motion.div>
  );
};

// ─── Challenge Runner ─────────────────────────────────────────────────────────
const ChallengeRunner = ({ ch, onBack, onComplete }) => {
  const [timerSecs, setTimerSecs] = useState(ch.timeLimit);
  const [submitted, setSubmitted] = useState(false);
  const elapsedRef = useRef(0);

  useEffect(()=>{
    if(submitted) return;
    const id = setInterval(()=>{
      setTimerSecs(t=>Math.max(0,t-1));
      elapsedRef.current += 1;
    },1000);
    return ()=>clearInterval(id);
  },[submitted]);

  const mins = Math.floor(timerSecs/60);
  const secs = String(timerSecs%60).padStart(2,"0");
  const timerColor = timerSecs < 30 ? "#C47FA0" : timerSecs < 60 ? "#D4A574" : S.muted;

  const handleDone = (score) => { setSubmitted(true); onComplete(ch, score, elapsedRef.current); };

  return (
    <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"28px"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"8px"}}>
            <motion.button onClick={onBack} whileHover={{scale:1.04}} whileTap={{scale:0.96}}
              style={{background:"rgba(168,169,173,0.07)",border:"1px solid rgba(168,169,173,0.14)",borderRadius:"7px",padding:"6px 14px",color:S.muted,fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Cormorant Garamond', serif",cursor:"pointer"}}>
              ← Back
            </motion.button>
            <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"10px",letterSpacing:"0.2em",textTransform:"uppercase",color:`rgba(${hexToRgb(ch.color)},0.8)`}}>{ch.trail} · Step {ch.step}/{ch.total}</span>
          </div>
          <h1 style={{fontFamily:"'Playfair Display', serif",fontSize:"28px",fontWeight:700,color:S.white,marginBottom:"4px"}}>{ch.title}</h1>
          <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"14px",color:S.muted}}>{ch.subtitle}</p>
        </div>
        <div style={{textAlign:"right",flexShrink:0,marginLeft:"20px"}}>
          <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"22px",fontWeight:600,color:timerColor,letterSpacing:"0.06em",fontVariantNumeric:"tabular-nums"}}>{mins}:{secs}</div>
          <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.16em",color:S.muted,textTransform:"uppercase"}}>Remaining</div>
        </div>
      </div>

      {/* Scenario */}
      <div style={{background:"rgba(168,169,173,0.04)",border:"1px solid rgba(168,169,173,0.1)",borderRadius:"14px",padding:"20px 24px",marginBottom:"24px"}}>
        <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.22em",textTransform:"uppercase",color:S.muted,marginBottom:"8px"}}>Scenario</div>
        <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"14px",color:S.mutedMd,lineHeight:1.8}}>{ch.scenario || ch.topic}</p>
      </div>

      {/* Challenge body by type */}
      {ch.type==="TAP TO SELECT"    && <TapToSelectChallenge   ch={ch} onDone={handleDone}/>}
      {ch.type==="DIAGNOSE & REWRITE" && <DiagnoseChallenge     ch={ch} onDone={handleDone}/>}
      {ch.type==="COMPRESS"         && <CompressChallenge       ch={ch} onDone={handleDone}/>}
      {ch.type==="MULTIPLE CHOICE"  && <MultipleChoiceChallenge ch={ch} onDone={handleDone}/>}
      {ch.type==="MULTI-REWRITE"    && <MultiRewriteChallenge   ch={ch} onDone={handleDone}/>}
      {ch.type==="DRAG & ORDER"     && <DragOrderChallenge      ch={ch} onDone={handleDone}/>}
      {ch.type==="TRUE FALSE"       && <TrueFalseChallenge      ch={ch} onDone={handleDone}/>}
      {ch.type==="RANK"             && <RankChallenge           ch={ch} onDone={handleDone}/>}
      {ch.type==="FILL GAP"         && <FillGapChallenge        ch={ch} onDone={handleDone}/>}
      {ch.type==="JIGSAW"           && <JigsawChallenge         ch={ch} onDone={handleDone}/>}
      {ch.type==="WORD SURGEON"     && <WordSurgeonChallenge    ch={ch} onDone={handleDone}/>}
      {ch.type==="IMPOSTOR"         && <ImpostorChallenge       ch={ch} onDone={handleDone}/>}
    </motion.div>
  );
};

// ─── Tap to Select ────────────────────────────────────────────────────────────
const TapToSelectChallenge = ({ ch, onDone }) => {
  const [selected, setSelected] = useState(new Set());
  const [checked, setChecked] = useState(false);

  const toggle = (w) => { if(checked) return; setSelected(p=>{ const n=new Set(p); n.has(w)?n.delete(w):n.add(w); return n; }); };
  const check = () => setChecked(true);
  const getScore = () => {
    let correct=0, wrong=0;
    selected.forEach(w=>{ if(ch.vagueWords.includes(w)) correct++; else wrong++; });
    ch.vagueWords.forEach(w=>{ if(!selected.has(w)) wrong++; });
    return Math.max(0, Math.round((correct/(ch.vagueWords.length+wrong))*100));
  };

  return (
    <div>
      <div style={{background:"rgba(13,13,22,0.97)",border:"1px solid rgba(168,169,173,0.14)",borderRadius:"14px",padding:"22px 26px",marginBottom:"20px"}}>
        <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.22em",textTransform:"uppercase",color:S.muted,marginBottom:"14px"}}>The failing prompt — tap every vague word</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"6px",lineHeight:2}}>
          {ch.words.map((w,i)=>{
            const isSelected=selected.has(w);
            const isCorrect=checked&&ch.vagueWords.includes(w);
            const isWrong=checked&&isSelected&&!ch.vagueWords.includes(w);
            return (
              <motion.span key={i} whileHover={{scale:1.06}} whileTap={{scale:0.94}}
                onClick={()=>toggle(w)}
                style={{padding:"4px 10px",borderRadius:"6px",cursor:checked?"default":"pointer",fontFamily:"'Cormorant Garamond', serif",fontSize:"15px",fontWeight:600,transition:"all 0.15s",
                  background: isCorrect?"rgba(100,200,150,0.18)" : isWrong?"rgba(196,127,160,0.18)" : isSelected?`rgba(${hexToRgb(ch.color)},0.18)`:"rgba(168,169,173,0.05)",
                  border: isCorrect?"1px solid rgba(100,200,150,0.4)" : isWrong?"1px solid rgba(196,127,160,0.4)" : isSelected?`1px solid rgba(${hexToRgb(ch.color)},0.4)`:"1px solid rgba(168,169,173,0.1)",
                  color: isCorrect?"#7EC8A4" : isWrong?"#C47FA0" : isSelected?ch.color : S.mutedMd}}>
                {w}
              </motion.span>
            );
          })}
        </div>
      </div>

      {checked && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{background:"rgba(13,13,22,0.97)",border:`1px solid rgba(${hexToRgb(ch.color)},0.2)`,borderRadius:"14px",padding:"22px 26px",marginBottom:"20px"}}>
          <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.22em",textTransform:"uppercase",color:ch.color,marginBottom:"10px"}}>Why These Words Failed</div>
          <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"14px",color:S.mutedMd,lineHeight:1.8,marginBottom:"16px"}}>{ch.explanation}</p>
          <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.22em",textTransform:"uppercase",color:S.muted,marginBottom:"8px"}}>Model Rewrite</div>
          <pre style={{fontFamily:"'Courier New',monospace",fontSize:"12px",color:S.mutedMd,lineHeight:1.7,whiteSpace:"pre-wrap",background:"rgba(168,169,173,0.04)",padding:"14px 16px",borderRadius:"9px",border:"1px solid rgba(168,169,173,0.1)"}}>{ch.rewrite}</pre>
        </motion.div>
      )}

      <div style={{display:"flex",gap:"12px",justifyContent:"flex-end"}}>
        {!checked ? (
          <motion.button onClick={check} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
            style={{padding:"12px 32px",borderRadius:"10px",border:"none",cursor:"pointer",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.16em",textTransform:"uppercase"}}>
            Check My Answer
          </motion.button>
        ) : (
          <motion.button onClick={()=>onDone(getScore())} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
            style={{padding:"12px 32px",borderRadius:"10px",border:"none",cursor:"pointer",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.16em",textTransform:"uppercase"}}>
            Complete →
          </motion.button>
        )}
      </div>
    </div>
  );
};

// ─── Diagnose Challenge ───────────────────────────────────────────────────────
const DiagnoseChallenge = ({ ch, onDone }) => {
  const [selected, setSelected] = useState(new Set());
  const [rewrite, setRewrite] = useState("");
  const [phase, setPhase] = useState("diagnose"); // diagnose | rewrite | reveal
  const [checked, setChecked] = useState(false);

  const toggle = (id) => { if(checked) return; setSelected(p=>{ const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; }); };
  const correctFlaws = ch.flaws.filter(f=>f.correct).map(f=>f.id);

  const checkDiagnosis = () => { setChecked(true); setTimeout(()=>setPhase("rewrite"), 1200); };
  const submit = () => setPhase("reveal");
  const score = () => {
    let s=60;
    let correctHits = [...selected].filter(id=>correctFlaws.includes(id)).length;
    let wrongHits = [...selected].filter(id=>!correctFlaws.includes(id)).length;
    s += Math.round((correctHits/correctFlaws.length)*25);
    s -= wrongHits*5;
    if(rewrite.length > 80) s += 15;
    return Math.max(0,Math.min(100,s));
  };

  return (
    <div>
      {/* Failing prompt */}
      <div style={{background:"rgba(255,60,60,0.04)",border:"1px solid rgba(255,80,80,0.12)",borderRadius:"14px",padding:"20px 24px",marginBottom:"20px"}}>
        <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.22em",textTransform:"uppercase",color:"rgba(255,110,110,0.6)",marginBottom:"8px"}}>The failing prompt</div>
        <p style={{fontFamily:"'Courier New',monospace",fontSize:"14px",color:"rgba(255,170,170,0.75)",lineHeight:1.7,fontStyle:"italic"}}>"{ch.prompt}"</p>
      </div>

      {/* Flaw diagnosis */}
      <div style={{background:"rgba(13,13,22,0.97)",border:"1px solid rgba(168,169,173,0.12)",borderRadius:"14px",padding:"20px 24px",marginBottom:"20px"}}>
        <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.22em",textTransform:"uppercase",color:S.muted,marginBottom:"14px"}}>Select every flaw — do not guess. Think carefully.</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
          {ch.flaws.map(f=>{
            const sel=selected.has(f.id);
            const isCorrect=checked&&f.correct;
            const isWrong=checked&&sel&&!f.correct;
            return (
              <motion.div key={f.id} whileHover={{scale:1.02}} whileTap={{scale:0.97}}
                onClick={()=>toggle(f.id)}
                style={{padding:"11px 14px",borderRadius:"10px",cursor:checked?"default":"pointer",transition:"all 0.15s",
                  background: isCorrect?"rgba(100,200,150,0.1)" : isWrong?"rgba(196,127,160,0.1)" : sel?`rgba(${hexToRgb(ch.color)},0.1)`:"rgba(168,169,173,0.04)",
                  border: isCorrect?"1px solid rgba(100,200,150,0.35)" : isWrong?"1px solid rgba(196,127,160,0.3)" : sel?`1px solid rgba(${hexToRgb(ch.color)},0.3)`:"1px solid rgba(168,169,173,0.1)"}}>
                <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"13px",color: isCorrect?"#7EC8A4" : isWrong?"#C47FA0" : sel?ch.color : S.mutedMd,lineHeight:1.4}}>{f.label}</span>
              </motion.div>
            );
          })}
        </div>
        {!checked && (
          <div style={{marginTop:"14px",display:"flex",justifyContent:"flex-end"}}>
            <motion.button onClick={checkDiagnosis} disabled={selected.size===0} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
              style={{padding:"10px 28px",borderRadius:"9px",border:"none",cursor:selected.size===0?"not-allowed":"pointer",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.14em",textTransform:"uppercase",opacity:selected.size===0?0.4:1}}>
              Check Diagnosis
            </motion.button>
          </div>
        )}
      </div>

      {/* Rewrite section */}
      {(phase==="rewrite"||phase==="reveal") && (
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} style={{marginBottom:"20px"}}>
          <div style={{background:"rgba(13,13,22,0.97)",border:`1px solid rgba(${hexToRgb(ch.color)},0.18)`,borderRadius:"14px",padding:"20px 24px",marginBottom:"16px"}}>
            <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.22em",textTransform:"uppercase",color:ch.color,marginBottom:"6px"}}>Now fix it — rewrite the prompt addressing all the flaws you found</div>
            <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"12px",color:S.muted,marginBottom:"12px",lineHeight:1.6}}>Include: what the AI is, what to write, who it's for, what format, what tone, what constraints.</p>
            <textarea value={rewrite} onChange={e=>setRewrite(e.target.value)} disabled={phase==="reveal"}
              placeholder="You are a senior technical writer. Write a..."
              style={{width:"100%",minHeight:"110px",padding:"12px 14px",borderRadius:"9px",border:"1px solid rgba(168,169,173,0.14)",background:"rgba(168,169,173,0.04)",color:S.mutedMd,fontFamily:"'Courier New',monospace",fontSize:"13px",lineHeight:1.7,resize:"vertical",outline:"none"}}/>
          </div>
          {phase==="rewrite" && (
            <div style={{display:"flex",justifyContent:"flex-end"}}>
              <motion.button onClick={submit} disabled={rewrite.length<40} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
                style={{padding:"12px 32px",borderRadius:"10px",border:"none",cursor:rewrite.length<40?"not-allowed":"pointer",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.16em",textTransform:"uppercase",opacity:rewrite.length<40?0.4:1}}>
                Submit Rewrite
              </motion.button>
            </div>
          )}
        </motion.div>
      )}

      {/* Model answer reveal */}
      {phase==="reveal" && (
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
          <div style={{background:`rgba(${hexToRgb(ch.color)},0.05)`,border:`1px solid rgba(${hexToRgb(ch.color)},0.2)`,borderRadius:"14px",padding:"20px 24px",marginBottom:"20px"}}>
            <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.22em",textTransform:"uppercase",color:ch.color,marginBottom:"10px"}}>Why the original failed — full explanation</div>
            <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"13px",color:S.mutedMd,lineHeight:1.8,marginBottom:"16px"}}>{ch.explanation}</p>
            <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.22em",textTransform:"uppercase",color:S.muted,marginBottom:"8px"}}>Model rewrite</div>
            <pre style={{fontFamily:"'Courier New',monospace",fontSize:"12px",color:S.mutedMd,lineHeight:1.7,whiteSpace:"pre-wrap",background:"rgba(168,169,173,0.04)",padding:"14px 16px",borderRadius:"9px",border:"1px solid rgba(168,169,173,0.1)"}}>{ch.rewrite}</pre>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <motion.button onClick={()=>onDone(score())} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
              style={{padding:"12px 32px",borderRadius:"10px",border:"none",cursor:"pointer",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.16em",textTransform:"uppercase"}}>
              Complete →
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ─── Compress Challenge ───────────────────────────────────────────────────────
const CompressChallenge = ({ ch, onDone }) => {
  const [text, setText] = useState("");
  const [phase, setPhase] = useState("write"); // write | reveal
  const wc = text.trim() ? text.trim().split(/\s+/).length : 0;
  const underLimit = wc <= ch.targetWords && wc > 0;
  const barPct = Math.min(100, Math.round((wc / ch.targetWords)*100));
  const barColor = wc===0?"rgba(168,169,173,0.2)" : underLimit?"#7EC8A4" : "#C47FA0";
  const score = () => { let s=50; if(underLimit) s+=30; if(wc<=10) s+=20; else if(wc<=ch.targetWords) s+=10; return Math.min(100,s); };

  return (
    <div>
      <div style={{background:"rgba(255,60,60,0.04)",border:"1px solid rgba(255,80,80,0.12)",borderRadius:"14px",padding:"20px 24px",marginBottom:"20px"}}>
        <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.22em",textTransform:"uppercase",color:"rgba(255,110,110,0.6)",marginBottom:"8px"}}>Original — {ch.original.trim().split(/\s+/).length} words</div>
        <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"14px",color:"rgba(255,170,170,0.7)",lineHeight:1.85,fontStyle:"italic"}}>"{ch.original}"</p>
      </div>

      <div style={{background:"rgba(13,13,22,0.97)",border:"1px solid rgba(168,169,173,0.12)",borderRadius:"14px",padding:"20px 24px",marginBottom:"20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"14px"}}>
          <div style={{flex:1,height:"6px",background:"rgba(168,169,173,0.08)",borderRadius:"3px",overflow:"hidden"}}>
            <motion.div animate={{width:`${barPct}%`}} transition={{duration:0.2}} style={{height:"100%",background:barColor,borderRadius:"3px"}}/>
          </div>
          <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"13px",fontWeight:600,color:barColor,minWidth:"70px",textAlign:"right",fontVariantNumeric:"tabular-nums"}}>{wc} / {ch.targetWords} words</span>
        </div>
        <textarea value={text} onChange={e=>setText(e.target.value)} disabled={phase==="reveal"}
          placeholder={`Compress to ${ch.targetWords} words or fewer...`}
          style={{width:"100%",minHeight:"80px",padding:"12px 14px",borderRadius:"9px",border:`1px solid ${underLimit&&wc>0?"rgba(100,200,150,0.3)":wc>ch.targetWords&&wc>0?"rgba(196,127,160,0.3)":"rgba(168,169,173,0.14)"}`,background:"rgba(168,169,173,0.04)",color:S.mutedMd,fontFamily:"'Courier New',monospace",fontSize:"13px",lineHeight:1.7,resize:"vertical",outline:"none"}}/>
        {!underLimit && wc > ch.targetWords && <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"12px",color:"#C47FA0",marginTop:"6px"}}>Still {wc - ch.targetWords} words over — keep cutting. Remove courtesy phrases, redundant adjectives, filler verbs.</p>}
        {underLimit && <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"12px",color:"#7EC8A4",marginTop:"6px"}}>Within limit ✓ — check you've kept the meaning before submitting.</p>}
      </div>

      {phase==="reveal" && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{background:`rgba(${hexToRgb(ch.color)},0.05)`,border:`1px solid rgba(${hexToRgb(ch.color)},0.2)`,borderRadius:"14px",padding:"20px 24px",marginBottom:"20px"}}>
          <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.22em",textTransform:"uppercase",color:ch.color,marginBottom:"8px"}}>Model answer ({ch.modelWordCount} words)</div>
          <p style={{fontFamily:"'Courier New',monospace",fontSize:"13px",color:S.mutedMd,lineHeight:1.7,fontStyle:"italic",marginBottom:"14px"}}>"{ch.modelAnswer}"</p>
          <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"13px",color:S.muted,lineHeight:1.7}}>Filler removed: courtesy openers, hedging verbs ("was thinking", "would be great if"), redundant adjectives ("really", "possibly"), and repetitive phrases ("let them know about"). The core meaning — who, what, tone, constraints — survived intact.</p>
        </motion.div>
      )}

      <div style={{display:"flex",justifyContent:"flex-end",gap:"10px"}}>
        {phase==="write" ? (
          <motion.button onClick={()=>setPhase("reveal")} disabled={!underLimit} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
            style={{padding:"12px 32px",borderRadius:"10px",border:"none",cursor:underLimit?"pointer":"not-allowed",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.16em",textTransform:"uppercase",opacity:underLimit?1:0.4}}>
            Submit
          </motion.button>
        ) : (
          <motion.button onClick={()=>onDone(score())} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
            style={{padding:"12px 32px",borderRadius:"10px",border:"none",cursor:"pointer",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.16em",textTransform:"uppercase"}}>
            Complete →
          </motion.button>
        )}
      </div>
    </div>
  );
};

// ─── Multiple Choice Challenge ────────────────────────────────────────────────
const MultipleChoiceChallenge = ({ ch, onDone }) => {
  const items = ch.questions || ch.rounds || [];
  const [round, setRound] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [correct, setCorrect] = useState(0);
  const r = items[round];

  const pick = (i) => {
    if(chosen!==null) return;
    setChosen(i);
    if(i===r.correct) setCorrect(p=>p+1);
  };

  const next = () => {
    const finalCorrect = correct + (chosen===r.correct ? 1 : 0);
    if(round < items.length-1){ setRound(p=>p+1); setChosen(null); }
    else onDone(Math.round((finalCorrect/items.length)*100));
  };

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"16px"}}>
        {items.map((_,i)=>(
          <div key={i} style={{flex:1,height:"3px",borderRadius:"2px",background: i<round?"#7EC8A4" : i===round?ch.color:"rgba(168,169,173,0.14)",transition:"all 0.3s"}}/>
        ))}
        <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"11px",color:S.muted,whiteSpace:"nowrap",marginLeft:"6px"}}>{round+1} / {items.length}</span>
      </div>

      <div style={{background:"rgba(13,13,22,0.97)",border:"1px solid rgba(168,169,173,0.14)",borderRadius:"14px",padding:"22px 26px",marginBottom:"18px"}}>
        {r.statement && <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"13px",color:S.muted,marginBottom:"10px"}}>{r.statement}</div>}
        {r.output && <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"15px",color:S.mutedMd,lineHeight:1.85,fontStyle:"italic"}}>"{r.output}"</p>}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"18px"}}>
        {r.options.map((opt,i)=>{
          const isCorrect=chosen!==null&&i===r.correct;
          const isWrong=chosen===i&&i!==r.correct;
          return (
            <motion.div key={i} whileHover={{scale:chosen===null?1.02:1}} whileTap={{scale:chosen===null?0.97:1}}
              onClick={()=>pick(i)}
              style={{padding:"14px 16px",borderRadius:"11px",cursor:chosen===null?"pointer":"default",transition:"all 0.15s",
                background: isCorrect?"rgba(100,200,150,0.1)" : isWrong?"rgba(196,127,160,0.1)" : chosen===i?`rgba(${hexToRgb(ch.color)},0.1)`:"rgba(168,169,173,0.04)",
                border: isCorrect?"1px solid rgba(100,200,150,0.35)" : isWrong?"1px solid rgba(196,127,160,0.3)" : chosen===i?`1px solid rgba(${hexToRgb(ch.color)},0.3)`:"1px solid rgba(168,169,173,0.1)"}}>
              <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"14px",fontWeight:600,color: isCorrect?"#7EC8A4" : isWrong?"#C47FA0" : chosen===i?ch.color : S.mutedMd}}>{opt}</span>
            </motion.div>
          );
        })}
      </div>

      {chosen!==null && (
        <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} style={{background:`rgba(${hexToRgb(ch.color)},0.05)`,border:`1px solid rgba(${hexToRgb(ch.color)},0.18)`,borderRadius:"12px",padding:"16px 20px",marginBottom:"18px"}}>
          <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"13px",color:S.mutedMd,lineHeight:1.75}}>{r.explanation}</p>
        </motion.div>
      )}

      {chosen!==null && (
        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <motion.button onClick={next} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
            style={{padding:"11px 28px",borderRadius:"10px",border:"none",cursor:"pointer",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.14em",textTransform:"uppercase"}}>
            {round<items.length-1?"Next →":"Complete →"}
          </motion.button>
        </div>
      )}
    </div>
  );
};

// ─── Multi Rewrite Challenge ──────────────────────────────────────────────────
const MultiRewriteChallenge = ({ ch, onDone }) => {
  const [texts, setTexts] = useState(ch.audiences.map(()=>""));
  const [phase, setPhase] = useState("write"); // write | reveal
  const allFilled = texts.every(t=>t.trim().length>20);

  const score = () => {
    let s=40;
    texts.forEach(t=>{ if(t.trim().length>30) s+=18; });
    return Math.min(100,s);
  };

  return (
    <div>
      <div style={{background:"rgba(13,13,22,0.97)",border:"1px solid rgba(168,169,173,0.12)",borderRadius:"14px",padding:"20px 24px",marginBottom:"20px"}}>
        <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.22em",textTransform:"uppercase",color:S.muted,marginBottom:"8px"}}>The brief</div>
        <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"15px",color:S.mutedMd,lineHeight:1.8,fontStyle:"italic"}}>{ch.topic}</p>
      </div>

      {ch.audiences.map((aud,i)=>(
        <motion.div key={i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.08}}
          style={{background:"rgba(13,13,22,0.97)",border:"1px solid rgba(168,169,173,0.12)",borderRadius:"14px",padding:"20px 24px",marginBottom:"14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
            <span style={{fontSize:"16px",color:ch.color}}>{aud.icon}</span>
            <div>
              <div style={{fontFamily:"'Playfair Display', serif",fontSize:"14px",fontWeight:700,color:S.white}}>{aud.label}</div>
              <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"11px",color:S.muted,marginTop:"1px"}}>{aud.hint}</div>
            </div>
          </div>
          <textarea value={texts[i]} onChange={e=>{ const n=[...texts]; n[i]=e.target.value; setTexts(n); }} disabled={phase==="reveal"}
            placeholder={`Write your prompt for: ${aud.label}`}
            style={{width:"100%",minHeight:"80px",padding:"11px 13px",borderRadius:"9px",border:"1px solid rgba(168,169,173,0.14)",background:"rgba(168,169,173,0.04)",color:S.mutedMd,fontFamily:"'Courier New',monospace",fontSize:"13px",lineHeight:1.7,resize:"vertical",outline:"none"}}/>
        </motion.div>
      ))}

      {phase==="reveal" && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{background:`rgba(${hexToRgb(ch.color)},0.05)`,border:`1px solid rgba(${hexToRgb(ch.color)},0.2)`,borderRadius:"14px",padding:"20px 24px",marginBottom:"20px"}}>
          <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.22em",textTransform:"uppercase",color:ch.color,marginBottom:"10px"}}>What makes each version different</div>
          <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"13px",color:S.mutedMd,lineHeight:1.8}}>The same fact requires three completely different prompts: a child needs analogy and wonder; a CEO needs business risk and opportunity; an engineer needs to skip basics and get to edge cases. Tone is not decoration — it is the difference between comprehension and confusion.</p>
        </motion.div>
      )}

      <div style={{display:"flex",justifyContent:"flex-end"}}>
        {phase==="write" ? (
          <motion.button onClick={()=>setPhase("reveal")} disabled={!allFilled} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
            style={{padding:"12px 32px",borderRadius:"10px",border:"none",cursor:allFilled?"pointer":"not-allowed",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.16em",textTransform:"uppercase",opacity:allFilled?1:0.4}}>
            Submit All Three
          </motion.button>
        ) : (
          <motion.button onClick={()=>onDone(score())} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
            style={{padding:"12px 32px",borderRadius:"10px",border:"none",cursor:"pointer",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.16em",textTransform:"uppercase"}}>
            Complete →
          </motion.button>
        )}
      </div>
    </div>
  );
};

// ─── Drag Order Challenge ─────────────────────────────────────────────────────
const DragOrderChallenge = ({ ch, onDone }) => {
  const [pool, setPool] = useState(ch.blocks.filter(b=>b.type!=="decoy").concat(ch.blocks.filter(b=>b.type==="decoy")).sort(()=>Math.random()-0.5));
  const [slots, setSlots] = useState(ch.correctOrder.map(()=>null));
  const [checked, setChecked] = useState(false);
  const [dragging, setDragging] = useState(null);

  const blockColors = { role:"#8B9ED4", task:"#7EC8A4", context:"#D4A574", format:"#85B7EB", constraint:"#C47FA0", decoy:"rgba(168,169,173,0.3)" };

  const placeInSlot = (blockId, slotIdx) => {
    if(checked) return;
    const block = ch.blocks.find(b=>b.id===blockId);
    if(!block || block.type==="decoy") return;
    const newSlots=[...slots];
    const prevSlotIdx = newSlots.indexOf(blockId);
    if(prevSlotIdx!==-1) newSlots[prevSlotIdx]=null;
    if(newSlots[slotIdx]) { setPool(p=>[...p.filter(b=>b.id!==blockId), ch.blocks.find(b=>b.id===newSlots[slotIdx])]); }
    newSlots[slotIdx]=blockId;
    setSlots(newSlots);
    setPool(p=>p.filter(b=>b.id!==blockId));
  };

  const removeFromSlot = (slotIdx) => {
    if(checked) return;
    const blockId=slots[slotIdx];
    if(!blockId) return;
    const newSlots=[...slots]; newSlots[slotIdx]=null; setSlots(newSlots);
    setPool(p=>[...p,ch.blocks.find(b=>b.id===blockId)]);
  };

  const check = () => setChecked(true);
  const score = () => { const correct=slots.filter((id,i)=>id===ch.correctOrder[i]).length; return Math.round((correct/ch.correctOrder.length)*100); };
  const allFilled = slots.every(s=>s!==null);

  return (
    <div>
      {/* Pool */}
      <div style={{background:"rgba(168,169,173,0.04)",border:"1px solid rgba(168,169,173,0.1)",borderRadius:"14px",padding:"16px 20px",marginBottom:"18px"}}>
        <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.22em",textTransform:"uppercase",color:S.muted,marginBottom:"12px"}}>Available blocks — click to place, avoid decoys</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
          {pool.map(b=>(
            <motion.div key={b.id} whileHover={{scale:1.04}} whileTap={{scale:0.96}}
              onClick={()=>{ const empty=slots.findIndex(s=>s===null); if(empty!==-1) placeInSlot(b.id,empty); }}
              style={{padding:"8px 14px",borderRadius:"9px",cursor:b.type==="decoy"?"not-allowed":"pointer",border:`1px solid ${b.type==="decoy"?"rgba(168,169,173,0.12)":`${blockColors[b.type]}55`}`,background:b.type==="decoy"?"rgba(168,169,173,0.04)":`${blockColors[b.type]}18`}}>
              <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.16em",textTransform:"uppercase",color:b.type==="decoy"?"rgba(168,169,173,0.3)":blockColors[b.type],marginBottom:"3px"}}>{b.label}</div>
              <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"12px",color:b.type==="decoy"?"rgba(168,169,173,0.35)":S.mutedMd}}>{b.text}</div>
            </motion.div>
          ))}
          {pool.length===0 && <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"13px",color:S.muted,fontStyle:"italic"}}>All blocks placed</span>}
        </div>
      </div>

      {/* Slots */}
      <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"18px"}}>
        {slots.map((id,i)=>{
          const block=id?ch.blocks.find(b=>b.id===id):null;
          const isCorrect=checked&&id===ch.correctOrder[i];
          const isWrong=checked&&id&&id!==ch.correctOrder[i];
          return (
            <div key={i} style={{display:"flex",alignItems:"center",gap:"12px"}}>
              <div style={{width:"20px",fontFamily:"'Cormorant Garamond', serif",fontSize:"11px",color:S.muted,textAlign:"center",flexShrink:0}}>{i+1}</div>
              <motion.div whileHover={!checked&&block?{scale:1.01}:{}}
                onClick={()=>block&&removeFromSlot(i)}
                style={{flex:1,padding:"11px 16px",borderRadius:"10px",minHeight:"46px",cursor:block&&!checked?"pointer":"default",transition:"all 0.15s",
                  background: isCorrect?"rgba(100,200,150,0.1)" : isWrong?"rgba(196,127,160,0.1)" : block?`${blockColors[block.type]}12`:"rgba(168,169,173,0.04)",
                  border: isCorrect?"1px solid rgba(100,200,150,0.35)" : isWrong?"1px solid rgba(196,127,160,0.3)" : block?`1px solid ${blockColors[block.type]}44`:"1px dashed rgba(168,169,173,0.18)"}}>
                {block ? (
                  <div>
                    <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.16em",textTransform:"uppercase",color: isCorrect?"#7EC8A4" : isWrong?"#C47FA0" : blockColors[block.type],marginBottom:"2px"}}>{block.label} {isCorrect?"✓":isWrong?"✗":""}</div>
                    <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"13px",color:S.mutedMd}}>{block.text}</div>
                  </div>
                ) : (
                  <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"12px",color:"rgba(168,169,173,0.25)",fontStyle:"italic"}}>Click a block above to place it here</span>
                )}
              </motion.div>
            </div>
          );
        })}
      </div>

      {checked && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{background:`rgba(${hexToRgb(ch.color)},0.05)`,border:`1px solid rgba(${hexToRgb(ch.color)},0.2)`,borderRadius:"12px",padding:"16px 20px",marginBottom:"16px"}}>
          <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"13px",color:S.mutedMd,lineHeight:1.8}}>Correct order: <strong style={{color:S.silverLt}}>Role → Task → Context → Format → Constraint</strong>. The AI reads top to bottom — it needs to know who it is before what to do, and what to do before how to structure it.</p>
        </motion.div>
      )}

      <div style={{display:"flex",justifyContent:"flex-end",gap:"10px"}}>
        {!checked ? (
          <motion.button onClick={check} disabled={!allFilled} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
            style={{padding:"12px 32px",borderRadius:"10px",border:"none",cursor:allFilled?"pointer":"not-allowed",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.16em",textTransform:"uppercase",opacity:allFilled?1:0.4}}>
            Check Order
          </motion.button>
        ) : (
          <motion.button onClick={()=>onDone(score())} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
            style={{padding:"12px 32px",borderRadius:"10px",border:"none",cursor:"pointer",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.16em",textTransform:"uppercase"}}>
            Complete →
          </motion.button>
        )}
      </div>
    </div>
  );
};


// ─── True False Challenge ─────────────────────────────────────────────────────
const TrueFalseChallenge = ({ ch, onDone }) => {
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const q = ch.questions[idx];

  const pick = (val) => {
    if (chosen !== null) return;
    setChosen(val);
    if (val === q.answer) setCorrect(p => p + 1);
  };

  const next = () => {
    const isLast = idx >= ch.questions.length - 1;
    const finalCorrect = correct + (chosen === q.answer ? 1 : 0);
    if (isLast) { onDone(Math.round((finalCorrect / ch.questions.length) * 100)); }
    else { setIdx(p => p + 1); setChosen(null); }
  };

  return (
    <div>
      <div style={{display:"flex",gap:"6px",marginBottom:"18px"}}>
        {ch.questions.map((_,i)=>(
          <div key={i} style={{flex:1,height:"3px",borderRadius:"2px",background:i<idx?"#7EC8A4":i===idx?ch.color:"rgba(168,169,173,0.14)",transition:"all 0.3s"}}/>
        ))}
        <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"11px",color:S.muted,whiteSpace:"nowrap",marginLeft:"6px"}}>{idx+1} / {ch.questions.length}</span>
      </div>

      <div style={{background:"rgba(13,13,22,0.97)",border:"1px solid rgba(168,169,173,0.14)",borderRadius:"14px",padding:"24px 26px",marginBottom:"18px"}}>
        <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.22em",textTransform:"uppercase",color:S.muted,marginBottom:"12px"}}>True or False?</div>
        <p style={{fontFamily:"'Playfair Display', serif",fontSize:"17px",fontWeight:700,color:S.white,lineHeight:1.5,marginBottom:"22px"}}>"{q.statement}"</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
          {[true,false].map(val=>{
            const isChosen = chosen===val;
            const isCorrect = chosen!==null && val===q.answer;
            const isWrong = chosen===val && val!==q.answer;
            return (
              <motion.div key={String(val)} whileHover={{scale:chosen===null?1.03:1}} whileTap={{scale:chosen===null?0.97:1}}
                onClick={()=>pick(val)}
                style={{padding:"18px",borderRadius:"12px",cursor:chosen===null?"pointer":"default",textAlign:"center",transition:"all 0.15s",
                  background:isCorrect?"rgba(100,200,150,0.12)":isWrong?"rgba(196,127,160,0.1)":isChosen?`rgba(${hexToRgb(ch.color)},0.12)`:"rgba(168,169,173,0.05)",
                  border:isCorrect?"1px solid rgba(100,200,150,0.4)":isWrong?"1px solid rgba(196,127,160,0.35)":isChosen?`1px solid rgba(${hexToRgb(ch.color)},0.4)`:"1px solid rgba(168,169,173,0.12)"}}>
                <div style={{fontFamily:"'Playfair Display', serif",fontSize:"20px",fontWeight:700,color:isCorrect?"#7EC8A4":isWrong?"#C47FA0":isChosen?ch.color:S.mutedMd}}>{val?"TRUE":"FALSE"}</div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {chosen !== null && (
        <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
          style={{background:chosen===q.answer?"rgba(100,200,150,0.07)":"rgba(196,127,160,0.07)",border:chosen===q.answer?"1px solid rgba(100,200,150,0.25)":"1px solid rgba(196,127,160,0.22)",borderRadius:"12px",padding:"16px 20px",marginBottom:"16px"}}>
          <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"10px",letterSpacing:"0.18em",textTransform:"uppercase",color:chosen===q.answer?"#7EC8A4":"#C47FA0",marginBottom:"6px"}}>{chosen===q.answer?"Correct":"Incorrect"} — The answer is {q.answer?"TRUE":"FALSE"}</div>
          <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"13px",color:S.mutedMd,lineHeight:1.75}}>{q.explanation}</p>
        </motion.div>
      )}

      {chosen !== null && (
        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <motion.button onClick={next} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
            style={{padding:"11px 28px",borderRadius:"10px",border:"none",cursor:"pointer",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.14em",textTransform:"uppercase"}}>
            {idx<ch.questions.length-1?"Next →":"Complete →"}
          </motion.button>
        </div>
      )}
    </div>
  );
};

// ─── Rank Challenge ───────────────────────────────────────────────────────────
const RankChallenge = ({ ch, onDone }) => {
  const [order, setOrder] = useState(() => [...ch.prompts].sort(()=>Math.random()-0.5));
  const [checked, setChecked] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const moveItem = (fromId, toId) => {
    if (fromId === toId) return;
    const from = order.findIndex(p=>p.id===fromId);
    const to   = order.findIndex(p=>p.id===toId);
    const next = [...order];
    const [item] = next.splice(from,1);
    next.splice(to,0,item);
    setOrder(next);
  };

  const score = () => {
    let correct = 0;
    order.forEach((p,i)=>{ if(p.rank === i+1) correct++; });
    return Math.round((correct/order.length)*100);
  };

  return (
    <div>
      <div style={{background:"rgba(13,13,22,0.97)",border:"1px solid rgba(168,169,173,0.12)",borderRadius:"14px",padding:"20px 24px",marginBottom:"18px"}}>
        <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.22em",textTransform:"uppercase",color:S.muted,marginBottom:"8px"}}>The task</div>
        <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"14px",color:S.mutedMd,lineHeight:1.7}}>{ch.task}</p>
      </div>

      <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"12px",color:S.muted,marginBottom:"12px"}}>Drag to reorder — rank from <strong style={{color:S.silverLt}}>strongest (1) to weakest (4)</strong></div>

      <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"18px"}}>
        {order.map((p,i)=>{
          const isCorrect = checked && p.rank===i+1;
          const isWrong   = checked && p.rank!==i+1;
          return (
            <motion.div key={p.id}
              draggable={!checked}
              onDragStart={()=>setDraggingId(p.id)}
              onDragEnd={()=>{setDraggingId(null);setDragOverId(null);}}
              onDragOver={e=>{e.preventDefault();setDragOverId(p.id);}}
              onDrop={()=>{moveItem(draggingId,p.id);setDragOverId(null);}}
              whileHover={!checked?{scale:1.01}:{}}
              style={{display:"flex",alignItems:"flex-start",gap:"12px",padding:"14px 16px",borderRadius:"11px",cursor:checked?"default":"grab",transition:"all 0.15s",
                background:isCorrect?"rgba(100,200,150,0.08)":isWrong?"rgba(196,127,160,0.07)":dragOverId===p.id?`rgba(${hexToRgb(ch.color)},0.08)`:"rgba(168,169,173,0.04)",
                border:isCorrect?"1px solid rgba(100,200,150,0.3)":isWrong?"1px solid rgba(196,127,160,0.25)":dragOverId===p.id?`1px solid rgba(${hexToRgb(ch.color)},0.3)`:"1px solid rgba(168,169,173,0.1)",
                opacity:draggingId===p.id?0.4:1}}>
              <div style={{width:"24px",height:"24px",borderRadius:"50%",background:`rgba(${hexToRgb(ch.color)},0.12)`,border:`1px solid rgba(${hexToRgb(ch.color)},0.25)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"12px",fontWeight:700,color:ch.color}}>{i+1}</span>
              </div>
              <div style={{flex:1}}>
                <p style={{fontFamily:"'Courier New',monospace",fontSize:"13px",color:S.mutedMd,lineHeight:1.6,margin:0}}>{p.text}</p>
                {checked && <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"11px",color:isCorrect?"#7EC8A4":"#C47FA0",marginTop:"6px",lineHeight:1.5}}>{ch.explanations[p.rank-1]}</p>}
              </div>
              {checked && <span style={{fontSize:"16px",flexShrink:0}}>{isCorrect?"✓":"✗"}</span>}
            </motion.div>
          );
        })}
      </div>

      <div style={{display:"flex",justifyContent:"flex-end"}}>
        {!checked ? (
          <motion.button onClick={()=>setChecked(true)} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
            style={{padding:"12px 32px",borderRadius:"10px",border:"none",cursor:"pointer",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.16em",textTransform:"uppercase"}}>
            Check My Ranking
          </motion.button>
        ) : (
          <motion.button onClick={()=>onDone(score())} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
            style={{padding:"12px 32px",borderRadius:"10px",border:"none",cursor:"pointer",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.16em",textTransform:"uppercase"}}>
            Complete →
          </motion.button>
        )}
      </div>
    </div>
  );
};

// ─── Fill Gap Challenge ───────────────────────────────────────────────────────
const FillGapChallenge = ({ ch, onDone }) => {
  const [values, setValues] = useState(ch.missingElements.map(()=>""));
  const [phase, setPhase] = useState("write");
  const allFilled = values.every(v=>v.trim().length>10);

  const score = () => {
    const filled = values.filter(v=>v.trim().length>15).length;
    return Math.round((filled/ch.missingElements.length)*100);
  };

  return (
    <div>
      <div style={{background:"rgba(255,60,60,0.04)",border:"1px solid rgba(255,80,80,0.12)",borderRadius:"14px",padding:"20px 24px",marginBottom:"20px"}}>
        <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.22em",textTransform:"uppercase",color:"rgba(255,110,110,0.6)",marginBottom:"8px"}}>The incomplete prompt</div>
        <p style={{fontFamily:"'Courier New',monospace",fontSize:"14px",color:"rgba(255,170,170,0.75)",lineHeight:1.7,fontStyle:"italic"}}>"{ch.basePrompt}"</p>
        <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"12px",color:S.muted,marginTop:"8px"}}>This prompt is missing {ch.missingElements.length} critical elements. Fill each one below.</p>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:"12px",marginBottom:"20px"}}>
        {ch.missingElements.map((el,i)=>(
          <div key={el.id} style={{background:"rgba(13,13,22,0.97)",border:"1px solid rgba(168,169,173,0.12)",borderRadius:"12px",padding:"16px 20px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
              <span style={{padding:"2px 8px",borderRadius:"20px",background:`rgba(${hexToRgb(ch.color)},0.12)`,border:`1px solid rgba(${hexToRgb(ch.color)},0.22)`,fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.14em",textTransform:"uppercase",color:ch.color}}>{el.label}</span>
              <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"11px",color:S.muted,fontStyle:"italic"}}>{el.hint}</span>
            </div>
            <textarea value={values[i]} onChange={e=>{const n=[...values];n[i]=e.target.value;setValues(n);}} disabled={phase==="reveal"}
              placeholder={el.placeholder}
              style={{width:"100%",minHeight:"60px",padding:"10px 12px",borderRadius:"8px",border:"1px solid rgba(168,169,173,0.14)",background:"rgba(168,169,173,0.04)",color:S.mutedMd,fontFamily:"'Courier New',monospace",fontSize:"12px",lineHeight:1.6,resize:"vertical",outline:"none"}}/>
          </div>
        ))}
      </div>

      {phase==="reveal" && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{background:`rgba(${hexToRgb(ch.color)},0.05)`,border:`1px solid rgba(${hexToRgb(ch.color)},0.2)`,borderRadius:"14px",padding:"20px 24px",marginBottom:"20px"}}>
          <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.22em",textTransform:"uppercase",color:ch.color,marginBottom:"8px"}}>Model complete prompt</div>
          <pre style={{fontFamily:"'Courier New',monospace",fontSize:"12px",color:S.mutedMd,lineHeight:1.7,whiteSpace:"pre-wrap",background:"rgba(168,169,173,0.04)",padding:"14px 16px",borderRadius:"9px",border:"1px solid rgba(168,169,173,0.1)"}}>{ch.modelAnswer}</pre>
        </motion.div>
      )}

      <div style={{display:"flex",justifyContent:"flex-end"}}>
        {phase==="write" ? (
          <motion.button onClick={()=>setPhase("reveal")} disabled={!allFilled} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
            style={{padding:"12px 32px",borderRadius:"10px",border:"none",cursor:allFilled?"pointer":"not-allowed",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.16em",textTransform:"uppercase",opacity:allFilled?1:0.4}}>
            Submit & Reveal
          </motion.button>
        ) : (
          <motion.button onClick={()=>onDone(score())} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
            style={{padding:"12px 32px",borderRadius:"10px",border:"none",cursor:"pointer",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.16em",textTransform:"uppercase"}}>
            Complete →
          </motion.button>
        )}
      </div>
    </div>
  );
};

// ─── Tower Challenge ──────────────────────────────────────────────────────────
const TowerChallenge = ({ ch, onDone }) => {
  const [promptText, setPromptText] = useState("");
  const [phase, setPhase] = useState("write"); // write | testing | reveal
  const [testIdx, setTestIdx]   = useState(0);
  const [passed,  setPassed]    = useState(null);

  const scorePrompt = (text) => {
    const lower = text.toLowerCase();
    let score = 0;
    const keywords = ["exactly","specifically","only","format","tone","max","words","audience","do not","must","include","numbered","bullet","table","per","each","section"];
    keywords.forEach(k=>{ if(lower.includes(k)) score++; });
    if(text.length > 80)  score += 2;
    if(text.length > 140) score += 2;
    if(text.length > 200) score += 1;
    return score;
  };

  const launch = () => {
    const s = scorePrompt(promptText);
    const idx = s >= 10 ? 2 : s >= 5 ? 1 : 0;
    setTestIdx(idx);
    setPhase("testing");
    setTimeout(()=>{
      setPassed(ch.testCases[idx].passes);
      setPhase("reveal");
    }, 1800);
  };

  const finalScore = () => {
    const tc = ch.testCases[testIdx];
    if (tc.passes) return ch.towerLevel >= 5 ? 100 : 85;
    return ch.towerLevel >= 4 ? 55 : 40;
  };

  return (
    <div>
      {/* Tower level indicator */}
      <div style={{display:"flex",gap:"6px",marginBottom:"20px",alignItems:"center"}}>
        {Array.from({length:ch.towerTotal},(_,i)=>(
          <div key={i} style={{flex:1,height:"4px",borderRadius:"2px",background: i<ch.towerLevel-1?"#7EC8A4":i===ch.towerLevel-1?ch.color:"rgba(168,169,173,0.14)",transition:"all 0.3s"}}/>
        ))}
        <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"11px",color:S.muted,whiteSpace:"nowrap",marginLeft:"8px"}}>Level {ch.towerLevel} / {ch.towerTotal}</span>
      </div>

      {/* Floor description */}
      <div style={{background:`rgba(${hexToRgb(ch.color)},0.06)`,border:`1px solid rgba(${hexToRgb(ch.color)},0.2)`,borderRadius:"14px",padding:"18px 22px",marginBottom:"20px"}}>
        <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.22em",textTransform:"uppercase",color:ch.color,marginBottom:"6px"}}>This floor: {ch.floorName}</div>
        <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"13px",color:S.mutedMd,lineHeight:1.7}}>{ch.floorDesc}</p>
      </div>

      {phase==="write" && (
        <>
          <div style={{background:"rgba(13,13,22,0.97)",border:"1px solid rgba(168,169,173,0.12)",borderRadius:"14px",padding:"20px 24px",marginBottom:"16px"}}>
            <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.22em",textTransform:"uppercase",color:S.muted,marginBottom:"10px"}}>Write your prompt</div>
            <textarea value={promptText} onChange={e=>setPromptText(e.target.value)}
              placeholder="Write a prompt that survives this floor..."
              style={{width:"100%",minHeight:"110px",padding:"12px 14px",borderRadius:"9px",border:"1px solid rgba(168,169,173,0.14)",background:"rgba(168,169,173,0.04)",color:S.mutedMd,fontFamily:"'Courier New',monospace",fontSize:"13px",lineHeight:1.7,resize:"vertical",outline:"none"}}/>
            <div style={{marginTop:"8px",fontFamily:"'Cormorant Garamond', serif",fontSize:"11px",color:S.muted}}>
              Strength indicators: exact numbers • named constraints • explicit format • 'only' / 'do not' / 'must'
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <motion.button onClick={launch} disabled={promptText.trim().length<20} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
              style={{padding:"12px 32px",borderRadius:"10px",border:"none",cursor:promptText.trim().length>=20?"pointer":"not-allowed",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.16em",textTransform:"uppercase",opacity:promptText.trim().length>=20?1:0.4}}>
              Send through the floor ↗
            </motion.button>
          </div>
        </>
      )}

      {phase==="testing" && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{textAlign:"center",padding:"40px"}}>
          <motion.div animate={{rotate:360}} transition={{duration:1.2,repeat:Infinity,ease:"linear"}}
            style={{width:"36px",height:"36px",borderRadius:"50%",border:`2px solid rgba(${hexToRgb(ch.color)},0.2)`,borderTop:`2px solid ${ch.color}`,margin:"0 auto 16px"}}/>
          <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"14px",color:S.muted}}>Testing against the {ch.floorName}...</p>
        </motion.div>
      )}

      {phase==="reveal" && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
          <div style={{background:passed?"rgba(100,200,150,0.08)":"rgba(196,127,160,0.08)",border:passed?"1px solid rgba(100,200,150,0.3)":"1px solid rgba(196,127,160,0.25)",borderRadius:"14px",padding:"20px 24px",marginBottom:"16px"}}>
            <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"10px",letterSpacing:"0.2em",textTransform:"uppercase",color:passed?"#7EC8A4":"#C47FA0",marginBottom:"8px"}}>{passed?"Floor cleared ✓":"Floor failed ✗"}</div>
            {!passed && ch.testCases[testIdx].issue && (
              <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"13px",color:S.mutedMd,lineHeight:1.75,marginBottom:"14px"}}>
                <strong style={{color:"#C47FA0"}}>What the {ch.floorName} exploited:</strong> {ch.testCases[testIdx].issue}
              </p>
            )}
            {passed && <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"13px",color:S.mutedMd,lineHeight:1.75,marginBottom:"14px"}}>Your prompt survived this floor. Every constraint was explicit enough to resist misinterpretation.</p>}
            <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.18em",textTransform:"uppercase",color:S.muted,marginBottom:"8px"}}>Why it {passed?"works":"fails"} — explanation</div>
            <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"13px",color:S.mutedMd,lineHeight:1.75,marginBottom:"16px"}}>{ch.explanation}</p>
            <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.18em",textTransform:"uppercase",color:S.muted,marginBottom:"8px"}}>Model answer for this floor</div>
            <pre style={{fontFamily:"'Courier New',monospace",fontSize:"12px",color:S.mutedMd,lineHeight:1.7,whiteSpace:"pre-wrap",background:"rgba(168,169,173,0.04)",padding:"14px 16px",borderRadius:"9px",border:"1px solid rgba(168,169,173,0.1)"}}>{ch.modelAnswer}</pre>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:"10px"}}>
            {!passed && (
              <motion.button onClick={()=>{setPromptText("");setPhase("write");setPassed(null);}} whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                style={{padding:"11px 22px",borderRadius:"10px",background:"rgba(168,169,173,0.07)",border:"1px solid rgba(168,169,173,0.16)",color:S.muted,fontFamily:"'Cormorant Garamond', serif",fontWeight:600,fontSize:"11px",letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>
                Try Again
              </motion.button>
            )}
            <motion.button onClick={()=>onDone(finalScore())} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
              style={{padding:"11px 28px",borderRadius:"10px",border:"none",cursor:"pointer",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.14em",textTransform:"uppercase"}}>
              {passed?"Next level →":"Continue anyway →"}
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};


// ─── Jigsaw Challenge ─────────────────────────────────────────────────────────
const JigsawChallenge = ({ ch, onDone }) => {
  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
  const realFragments = ch.fragments.filter(f => f.correct !== -1);
  const decoyFragments = ch.fragments.filter(f => f.correct === -1);
  const [pool, setPool] = useState(() => shuffle(ch.fragments));
  const [slots, setSlots] = useState(realFragments.map(() => null));
  const [checked, setChecked] = useState(false);
  const [selected, setSelected] = useState(null);

  const slotCount = realFragments.length;

  const handlePoolClick = (frag) => {
    if (checked) return;
    if (frag.correct === -1) return; // decoy — not placeable
    setSelected(frag.id === selected ? null : frag.id);
  };

  const handleSlotClick = (slotIdx) => {
    if (checked) return;
    if (selected) {
      const frag = ch.fragments.find(f => f.id === selected);
      if (!frag || frag.correct === -1) { setSelected(null); return; }
      const newSlots = [...slots];
      const prevSlot = newSlots.indexOf(selected);
      if (prevSlot !== -1) newSlots[prevSlot] = null;
      if (newSlots[slotIdx]) setPool(p => [...p, ch.fragments.find(f => f.id === newSlots[slotIdx])]);
      newSlots[slotIdx] = selected;
      setSlots(newSlots);
      setPool(p => p.filter(f => f.id !== selected));
      setSelected(null);
    } else if (slots[slotIdx]) {
      const fragId = slots[slotIdx];
      const newSlots = [...slots]; newSlots[slotIdx] = null; setSlots(newSlots);
      setPool(p => [...p, ch.fragments.find(f => f.id === fragId)]);
    }
  };

  const score = () => {
    let correct = 0;
    slots.forEach((id, i) => { if (id && ch.fragments.find(f => f.id === id)?.correct === i) correct++; });
    return Math.round((correct / slotCount) * 100);
  };

  const allFilled = slots.every(s => s !== null);

  return (
    <div>
      {/* Pool */}
      <div style={{background:"rgba(168,169,173,0.04)",border:"1px solid rgba(168,169,173,0.1)",borderRadius:"14px",padding:"16px 18px",marginBottom:"18px"}}>
        <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.22em",textTransform:"uppercase",color:S.muted,marginBottom:"12px"}}>
          Fragment pool — click a fragment, then click a slot to place it
          {decoyFragments.length > 0 && <span style={{color:"#C47FA0",marginLeft:"10px"}}>⚠ Contains {decoyFragments.length} decoy{decoyFragments.length>1?"s":""} — do not place them</span>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          {pool.map(frag => {
            const isDecoy = frag.correct === -1;
            const isSel = selected === frag.id;
            return (
              <motion.div key={frag.id} whileHover={{scale: isDecoy ? 1 : 1.01}} whileTap={{scale: isDecoy ? 1 : 0.99}}
                onClick={() => handlePoolClick(frag)}
                style={{padding:"10px 14px",borderRadius:"9px",cursor:isDecoy?"not-allowed":"pointer",transition:"all 0.15s",
                  background: isDecoy?"rgba(196,127,160,0.06)": isSel?`rgba(${hexToRgb(ch.color)},0.14)`:"rgba(168,169,173,0.05)",
                  border: isDecoy?"1px solid rgba(196,127,160,0.2)": isSel?`1px solid rgba(${hexToRgb(ch.color)},0.4)`:"1px solid rgba(168,169,173,0.1)",
                  opacity: isDecoy ? 0.5 : 1}}>
                <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"13px",color: isDecoy?"#C47FA0": isSel?ch.color:S.mutedMd,lineHeight:1.55}}>
                  {isDecoy && <span style={{fontSize:"10px",marginRight:"8px",letterSpacing:"0.1em",textTransform:"uppercase"}}>DECOY — </span>}
                  {frag.text}
                </span>
              </motion.div>
            );
          })}
          {pool.length === 0 && <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"13px",color:S.muted,fontStyle:"italic"}}>All fragments placed</span>}
        </div>
      </div>

      {/* Slots */}
      <div style={{marginBottom:"18px"}}>
        <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.22em",textTransform:"uppercase",color:S.muted,marginBottom:"12px"}}>Your order — click a filled slot to return it to the pool</div>
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          {slots.map((id, i) => {
            const frag = id ? ch.fragments.find(f => f.id === id) : null;
            const isCorrect = checked && frag && frag.correct === i;
            const isWrong = checked && frag && frag.correct !== i;
            return (
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"12px"}}>
                <div style={{width:"22px",height:"22px",borderRadius:"50%",background:`rgba(${hexToRgb(ch.color)},0.1)`,border:`1px solid rgba(${hexToRgb(ch.color)},0.25)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"10px"}}>
                  <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"11px",fontWeight:700,color:ch.color}}>{i+1}</span>
                </div>
                <motion.div whileHover={!checked&&frag?{scale:1.005}:{}} onClick={() => handleSlotClick(i)}
                  style={{flex:1,padding:"11px 15px",borderRadius:"10px",minHeight:"44px",cursor:frag&&!checked?"pointer":"default",transition:"all 0.15s",
                    background: isCorrect?"rgba(100,200,150,0.09)": isWrong?"rgba(196,127,160,0.08)": selected&&!frag?`rgba(${hexToRgb(ch.color)},0.07)`:"rgba(168,169,173,0.04)",
                    border: isCorrect?"1px solid rgba(100,200,150,0.35)": isWrong?"1px solid rgba(196,127,160,0.3)": selected&&!frag?`1px solid rgba(${hexToRgb(ch.color)},0.3)`:"1px dashed rgba(168,169,173,0.18)"}}>
                  {frag
                    ? <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"13px",color: isCorrect?"#7EC8A4": isWrong?"#C47FA0":S.mutedMd,lineHeight:1.55}}>
                        {frag.text} {checked && (isCorrect ? "✓" : "✗")}
                      </span>
                    : <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"12px",color: selected?"rgba(133,183,235,0.5)":"rgba(168,169,173,0.25)",fontStyle:"italic"}}>
                        {selected ? "Click to place here" : "Empty — click a fragment first"}
                      </span>
                  }
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      {checked && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
          style={{background:`rgba(${hexToRgb(ch.color)},0.05)`,border:`1px solid rgba(${hexToRgb(ch.color)},0.2)`,borderRadius:"12px",padding:"16px 20px",marginBottom:"16px"}}>
          <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.18em",textTransform:"uppercase",color:ch.color,marginBottom:"8px"}}>Why this order works</div>
          <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"13px",color:S.mutedMd,lineHeight:1.75}}>{ch.explanation}</p>
        </motion.div>
      )}

      <div style={{display:"flex",justifyContent:"flex-end",gap:"10px"}}>
        <motion.button onClick={() => { setPool(shuffle(ch.fragments)); setSlots(realFragments.map(() => null)); setChecked(false); setSelected(null); }}
          whileHover={{scale:1.03}} whileTap={{scale:0.97}}
          style={{padding:"10px 18px",borderRadius:"9px",background:"rgba(168,169,173,0.07)",border:"1px solid rgba(168,169,173,0.16)",color:S.muted,fontFamily:"'Cormorant Garamond', serif",fontWeight:600,fontSize:"11px",letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>
          Reset
        </motion.button>
        {!checked
          ? <motion.button onClick={() => setChecked(true)} disabled={!allFilled} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
              style={{padding:"11px 28px",borderRadius:"10px",border:"none",cursor:allFilled?"pointer":"not-allowed",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.16em",textTransform:"uppercase",opacity:allFilled?1:0.4}}>
              Check Order
            </motion.button>
          : <motion.button onClick={() => onDone(score())} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
              style={{padding:"11px 28px",borderRadius:"10px",border:"none",cursor:"pointer",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.16em",textTransform:"uppercase"}}>
              Complete →
            </motion.button>
        }
      </div>
    </div>
  );
};

// ─── Word Surgeon Challenge ───────────────────────────────────────────────────
const WordSurgeonChallenge = ({ ch, onDone }) => {
  const words = ch.prompt.split(' ');
  const [editedWords, setEditedWords] = useState([...words]);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [editsUsed, setEditsUsed] = useState(0);
  const [editedIdxs, setEditedIdxs] = useState(new Set());
  const [phase, setPhase] = useState('edit'); // edit | hint | reveal
  const [showHints, setShowHints] = useState(false);
  const atLimit = editsUsed >= ch.maxEdits;

  const startEdit = (i) => {
    if (atLimit && !editedIdxs.has(i)) return;
    setEditingIdx(i);
    setEditVal(editedWords[i]);
  };

  const commitEdit = () => {
    if (editingIdx === null) return;
    const newWords = [...editedWords];
    const wasEdited = editedIdxs.has(editingIdx);
    const changed = editVal.trim() !== words[editingIdx];
    newWords[editingIdx] = editVal.trim() || words[editingIdx];
    setEditedWords(newWords);
    if (!wasEdited && changed) {
      setEditsUsed(e => e + 1);
      setEditedIdxs(s => new Set([...s, editingIdx]));
    }
    setEditingIdx(null);
    setEditVal('');
  };

  const resetWord = (i) => {
    if (!editedIdxs.has(i)) return;
    const newWords = [...editedWords];
    newWords[i] = words[i];
    setEditedWords(newWords);
    setEditsUsed(e => Math.max(0, e - 1));
    setEditedIdxs(s => { const n = new Set(s); n.delete(i); return n; });
  };

  const score = () => {
    const used = editsUsed;
    if (used === 0) return 20;
    if (used <= ch.maxEdits) return 60 + Math.round((ch.maxEdits - used + 1) / ch.maxEdits * 40);
    return 40;
  };

  const editsLeft = ch.maxEdits - editsUsed;

  return (
    <div>
      {/* Original prompt */}
      <div style={{background:"rgba(255,60,60,0.04)",border:"1px solid rgba(255,80,80,0.12)",borderRadius:"14px",padding:"18px 22px",marginBottom:"18px"}}>
        <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.22em",textTransform:"uppercase",color:"rgba(255,110,110,0.6)",marginBottom:"8px"}}>Original failing prompt</div>
        <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"14px",color:"rgba(255,170,170,0.7)",lineHeight:1.7,fontStyle:"italic"}}>"{ch.prompt}"</p>
      </div>

      {/* Edit counter */}
      <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"16px"}}>
        <div style={{display:"flex",gap:"6px"}}>
          {Array.from({length:ch.maxEdits},(_,i)=>(
            <div key={i} style={{width:"28px",height:"6px",borderRadius:"3px",background: i<editsUsed?ch.color:"rgba(168,169,173,0.15)",transition:"all 0.2s"}}/>
          ))}
        </div>
        <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"12px",color: atLimit?"#C47FA0":S.muted}}>
          {atLimit ? `${ch.maxEdits}/${ch.maxEdits} edits used — no more changes` : `${editsUsed}/${ch.maxEdits} edits used — ${editsLeft} remaining`}
        </span>
      </div>

      {/* Word editor */}
      <div style={{background:"rgba(13,13,22,0.97)",border:`1px solid rgba(${hexToRgb(ch.color)},0.18)`,borderRadius:"14px",padding:"20px 22px",marginBottom:"16px"}}>
        <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.22em",textTransform:"uppercase",color:S.muted,marginBottom:"14px"}}>
          Click any word to edit it — double-click an edited word to restore original
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"6px",lineHeight:2.2}}>
          {editedWords.map((w, i) => {
            const isEdited = editedIdxs.has(i);
            const isEditing = editingIdx === i;
            const canEdit = !atLimit || isEdited;
            return isEditing ? (
              <input key={i} autoFocus value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={e => { if(e.key==='Enter') commitEdit(); if(e.key==='Escape'){setEditingIdx(null);setEditVal('');} }}
                style={{padding:"3px 8px",borderRadius:"5px",border:`1px solid ${ch.color}`,background:`rgba(${hexToRgb(ch.color)},0.1)`,color:ch.color,fontFamily:"'Cormorant Garamond', serif",fontSize:"14px",fontWeight:600,width:`${Math.max(w.length+2,6)}ch`,outline:"none"}}/>
            ) : (
              <motion.span key={i} whileHover={{scale:canEdit?1.08:1}} whileTap={{scale:canEdit?0.94:1}}
                onClick={() => canEdit && startEdit(i)}
                onDoubleClick={() => isEdited && resetWord(i)}
                title={isEdited ? "Double-click to restore" : canEdit ? "Click to edit" : "Edit limit reached"}
                style={{padding:"3px 10px",borderRadius:"6px",cursor:canEdit?"pointer":"default",fontFamily:"'Cormorant Garamond', serif",fontSize:"14px",fontWeight:600,transition:"all 0.15s",
                  background: isEdited?`rgba(${hexToRgb(ch.color)},0.15)`:"rgba(168,169,173,0.05)",
                  border: isEdited?`1px solid rgba(${hexToRgb(ch.color)},0.4)`:"1px solid rgba(168,169,173,0.1)",
                  color: isEdited?ch.color:S.mutedMd,
                  opacity: !canEdit && !isEdited ? 0.5 : 1}}>
                {w}
              </motion.span>
            );
          })}
        </div>
        <div style={{marginTop:"14px",padding:"10px 12px",background:"rgba(168,169,173,0.04)",borderRadius:"8px",border:"1px solid rgba(168,169,173,0.08)"}}>
          <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"10px",color:S.muted,marginRight:"8px",letterSpacing:"0.1em",textTransform:"uppercase"}}>Current prompt:</span>
          <span style={{fontFamily:"'Courier New',monospace",fontSize:"12px",color:S.mutedMd}}>{editedWords.join(' ')}</span>
        </div>
      </div>

      {/* Hints */}
      <div style={{marginBottom:"16px"}}>
        <motion.button onClick={() => setShowHints(!showHints)} whileHover={{scale:1.02}} whileTap={{scale:0.97}}
          style={{padding:"8px 16px",borderRadius:"9px",border:`1px solid rgba(${hexToRgb(ch.color)},0.2)`,background:`rgba(${hexToRgb(ch.color)},0.05)`,color:ch.color,fontFamily:"'Cormorant Garamond', serif",fontSize:"11px",letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>
          {showHints ? "Hide hints" : `Show hints (${ch.hints.length})`}
        </motion.button>
        {showHints && (
          <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} style={{marginTop:"10px",display:"flex",flexDirection:"column",gap:"6px"}}>
            {ch.hints.map((h,i) => (
              <div key={i} style={{padding:"8px 14px",borderRadius:"8px",background:"rgba(168,169,173,0.04)",border:"1px solid rgba(168,169,173,0.1)"}}>
                <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"12px",color:S.mutedMd}}>
                  <span style={{color:ch.color,marginRight:"8px"}}>{i+1}.</span>{h}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Reveal */}
      {phase === 'reveal' && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{background:`rgba(${hexToRgb(ch.color)},0.05)`,border:`1px solid rgba(${hexToRgb(ch.color)},0.2)`,borderRadius:"14px",padding:"20px 22px",marginBottom:"16px"}}>
          <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.18em",textTransform:"uppercase",color:ch.color,marginBottom:"8px"}}>Model answer & what changed</div>
          <pre style={{fontFamily:"'Courier New',monospace",fontSize:"12px",color:S.mutedMd,lineHeight:1.7,whiteSpace:"pre-wrap",marginBottom:"14px",background:"rgba(168,169,173,0.04)",padding:"12px 14px",borderRadius:"8px",border:"1px solid rgba(168,169,173,0.1)"}}>{ch.modelAnswer}</pre>
          <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
            {ch.modelChanges.map((c,i) => (
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"8px"}}>
                <span style={{color:ch.color,fontFamily:"'Cormorant Garamond', serif",fontSize:"13px",flexShrink:0}}>Edit {i+1}:</span>
                <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"13px",color:S.mutedMd,lineHeight:1.5}}>{c}</span>
              </div>
            ))}
          </div>
          <div style={{marginTop:"14px",paddingTop:"14px",borderTop:"1px solid rgba(168,169,173,0.1)"}}>
            <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"13px",color:S.muted,lineHeight:1.75}}>{ch.explanation}</p>
          </div>
        </motion.div>
      )}

      <div style={{display:"flex",justifyContent:"flex-end",gap:"10px"}}>
        {phase === 'edit'
          ? <motion.button onClick={() => setPhase('reveal')} disabled={editsUsed === 0} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
              style={{padding:"12px 30px",borderRadius:"10px",border:"none",cursor:editsUsed>0?"pointer":"not-allowed",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.16em",textTransform:"uppercase",opacity:editsUsed>0?1:0.4}}>
              Submit & Reveal
            </motion.button>
          : <motion.button onClick={() => onDone(score())} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
              style={{padding:"12px 30px",borderRadius:"10px",border:"none",cursor:"pointer",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.16em",textTransform:"uppercase"}}>
              Complete →
            </motion.button>
        }
      </div>
    </div>
  );
};

// ─── Impostor Challenge ───────────────────────────────────────────────────────
const ImpostorChallenge = ({ ch, onDone }) => {
  const [chosen, setChosen] = useState(null);
  const [checked, setChecked] = useState(false);

  const pick = (id) => { if (checked) return; setChosen(id); };
  const check = () => { if (!chosen) return; setChecked(true); };
  const correct = ch.prompts.find(p => p.isImpostor)?.id;
  const isCorrect = chosen === correct;

  const score = () => isCorrect ? 100 : 30;

  return (
    <div>
      {/* Task context */}
      <div style={{background:"rgba(168,169,173,0.04)",border:"1px solid rgba(168,169,173,0.1)",borderRadius:"14px",padding:"16px 20px",marginBottom:"18px"}}>
        <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"9px",letterSpacing:"0.22em",textTransform:"uppercase",color:S.muted,marginBottom:"6px"}}>The task</div>
        <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"14px",color:S.mutedMd,lineHeight:1.7}}>{ch.task}</p>
      </div>

      <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"12px",color:S.muted,marginBottom:"14px",lineHeight:1.6}}>
        {ch.prompts.filter(p=>!p.isImpostor).length} of these prompts are strong and well-structured. <strong style={{color:"#C47FA0"}}>One is the impostor</strong> — it looks plausible but has a critical hidden flaw. Study each carefully before choosing.
      </div>

      {/* Prompt cards */}
      <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"18px"}}>
        {ch.prompts.map((p, i) => {
          const isSel = chosen === p.id;
          const isRight = checked && p.isImpostor;
          const isWrongPick = checked && isSel && !p.isImpostor;
          return (
            <motion.div key={p.id} whileHover={{scale:checked?1:1.005}} whileTap={{scale:checked?1:0.998}}
              onClick={() => pick(p.id)}
              style={{padding:"16px 18px",borderRadius:"12px",cursor:checked?"default":"pointer",transition:"all 0.15s",position:"relative",
                background: isRight?"rgba(196,127,160,0.1)": isWrongPick?"rgba(255,100,100,0.07)": isSel?`rgba(${hexToRgb(ch.color)},0.1)`:"rgba(13,13,22,0.97)",
                border: isRight?"1px solid rgba(196,127,160,0.4)": isWrongPick?"1px solid rgba(255,100,100,0.2)": isSel?`1px solid rgba(${hexToRgb(ch.color)},0.35)`:"1px solid rgba(168,169,173,0.12)"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:"12px"}}>
                <div style={{width:"22px",height:"22px",borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",marginTop:"1px",
                  background: isRight?"rgba(196,127,160,0.2)": isSel?`rgba(${hexToRgb(ch.color)},0.15)`:"rgba(168,169,173,0.08)",
                  border: isRight?"1px solid rgba(196,127,160,0.4)": isSel?`1px solid rgba(${hexToRgb(ch.color)},0.35)`:"1px solid rgba(168,169,173,0.15)"}}>
                  <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"11px",fontWeight:700,color: isRight?"#C47FA0": isSel?ch.color:S.muted}}>{i+1}</span>
                </div>
                <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"13px",color: isRight?"#C47FA0":S.mutedMd,lineHeight:1.65,margin:0}}>{p.text}</p>
              </div>
              {isRight && (
                <div style={{marginTop:"10px",paddingTop:"10px",borderTop:"1px solid rgba(196,127,160,0.2)"}}>
                  <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",color:"#C47FA0",marginBottom:"6px"}}>⚠ The Impostor — Here's why</div>
                  <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"12px",color:S.mutedMd,lineHeight:1.7}}>{ch.impostorExplanation}</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {checked && !isCorrect && (
        <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
          style={{background:"rgba(100,200,150,0.07)",border:"1px solid rgba(100,200,150,0.25)",borderRadius:"12px",padding:"14px 18px",marginBottom:"16px"}}>
          <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",color:"#7EC8A4",marginBottom:"6px"}}>You picked the wrong one — here's what you missed</div>
          <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"13px",color:S.mutedMd,lineHeight:1.7}}>{ch.impostorExplanation}</p>
        </motion.div>
      )}

      <div style={{display:"flex",justifyContent:"flex-end",gap:"10px"}}>
        {!checked
          ? <motion.button onClick={check} disabled={!chosen} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
              style={{padding:"12px 30px",borderRadius:"10px",border:"none",cursor:chosen?"pointer":"not-allowed",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.16em",textTransform:"uppercase",opacity:chosen?1:0.4}}>
              That's the Impostor
            </motion.button>
          : <motion.button onClick={() => onDone(score())} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
              style={{padding:"12px 30px",borderRadius:"10px",border:"none",cursor:"pointer",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.16em",textTransform:"uppercase"}}>
              Complete →
            </motion.button>
        }
      </div>
    </div>
  );
};


// ─── Result Screen ────────────────────────────────────────────────────────────
const ResultScreen = ({ result, onBack, onNext, onRetry }) => {
  const { ch, score, timeTaken, passed } = result;

  const fmtTime = (s) => {
    const m = Math.floor(s/60), sec = s%60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  const xpEarned = passed ? ch.xp : 0;

  // Failure screen
  if (!passed) {
    return (
      <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} style={{maxWidth:"520px",margin:"0 auto",textAlign:"center",paddingTop:"20px"}}>
        <motion.div animate={{rotate:[-3,3,-3]}} transition={{duration:0.4,repeat:2}} style={{marginBottom:"16px"}}>
          <div style={{fontFamily:"'Playfair Display', serif",fontSize:"52px",color:"#C47FA0",lineHeight:1}}>✗</div>
        </motion.div>
        <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"11px",letterSpacing:"0.24em",textTransform:"uppercase",color:"#C47FA0",marginBottom:"6px"}}>Not quite there</div>
        <div style={{fontFamily:"'Playfair Display', serif",fontSize:"36px",fontWeight:700,color:S.white,marginBottom:"4px"}}>{score}<span style={{fontSize:"18px",color:S.muted}}>/100</span></div>
        <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"13px",color:S.muted,marginBottom:"24px"}}>You need <strong style={{color:"#D4A574"}}>70+</strong> to complete this challenge</div>

        <div style={{background:"rgba(196,127,160,0.07)",border:"1px solid rgba(196,127,160,0.2)",borderRadius:"14px",padding:"20px 24px",marginBottom:"24px"}}>
          <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"14px",color:S.mutedMd,lineHeight:1.8,marginBottom:"12px"}}>
            {score >= 50
              ? "So close — you're reading the patterns correctly. Sharpen your eye for the details that separate good from great."
              : "Back to basics. Every master prompt engineer started here. The lesson is in the gap between what you chose and what was correct."}
          </p>
          <div style={{display:"flex",gap:"16px",justifyContent:"center"}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Playfair Display', serif",fontSize:"20px",fontWeight:700,color:"#C47FA0"}}>{score}</div>
              <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"10px",color:S.muted,letterSpacing:"0.1em"}}>SCORE</div>
            </div>
            <div style={{width:"1px",background:"rgba(168,169,173,0.1)"}}/>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Playfair Display', serif",fontSize:"20px",fontWeight:700,color:"#C47FA0"}}>{fmtTime(timeTaken)}</div>
              <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"10px",color:S.muted,letterSpacing:"0.1em"}}>TIME SPENT</div>
            </div>
          </div>
        </div>

        <div style={{display:"flex",gap:"12px",justifyContent:"center"}}>
          <motion.button onClick={onBack} whileHover={{scale:1.03}} whileTap={{scale:0.97}}
            style={{padding:"12px 24px",borderRadius:"10px",background:"rgba(168,169,173,0.07)",border:"1px solid rgba(168,169,173,0.16)",color:S.muted,fontFamily:"'Cormorant Garamond', serif",fontWeight:600,fontSize:"11px",letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>
            Back to Arena
          </motion.button>
          <motion.button onClick={onRetry} whileHover={{scale:1.04,boxShadow:"0 8px 24px rgba(196,127,160,0.3)"}} whileTap={{scale:0.97}}
            style={{padding:"12px 28px",borderRadius:"10px",border:"none",cursor:"pointer",background:"#C47FA0",color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.16em",textTransform:"uppercase"}}>
            ↺  Try Again
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Success screen
  return (
    <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} style={{maxWidth:"520px",margin:"0 auto",textAlign:"center",paddingTop:"20px"}}>
      <motion.div initial={{scale:0,rotate:-20}} animate={{scale:1,rotate:0}} transition={{type:"spring",stiffness:280,damping:16}} style={{marginBottom:"10px"}}>
        <div style={{fontFamily:"'Playfair Display', serif",fontSize:"56px",color:ch.color,lineHeight:1}}>✦</div>
      </motion.div>
      <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"11px",letterSpacing:"0.32em",textTransform:"uppercase",color:ch.color,marginBottom:"6px"}}>Challenge Complete</div>
      <div style={{fontFamily:"'Playfair Display', serif",fontSize:"22px",fontWeight:700,color:S.white,marginBottom:"24px"}}>{ch.title}</div>

      <div style={{background:`rgba(${hexToRgb(ch.color)},0.06)`,border:`1px solid rgba(${hexToRgb(ch.color)},0.22)`,borderRadius:"16px",padding:"24px 32px",marginBottom:"24px"}}>
        <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"14px",color:S.mutedMd,lineHeight:1.8,marginBottom:"20px"}}>
          {score >= 90 ? "Flawless execution — that is genuine mastery." : score >= 70 ? "Solid work. You've earned this one." : "Squeaked through — sharpen your instincts for next time."}
        </p>
        <div style={{display:"flex",gap:"0",justifyContent:"center"}}>
          <div style={{textAlign:"center",padding:"0 24px",borderRight:`1px solid rgba(${hexToRgb(ch.color)},0.2)`}}>
            <motion.div initial={{scale:0}} animate={{scale:1}} transition={{delay:0.2,type:"spring",stiffness:260}}>
              <div style={{fontFamily:"'Playfair Display', serif",fontSize:"32px",fontWeight:700,color:ch.color}}>+{xpEarned}</div>
            </motion.div>
            <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"10px",color:S.muted,letterSpacing:"0.14em",textTransform:"uppercase",marginTop:"2px"}}>XP Gained</div>
          </div>
          <div style={{textAlign:"center",padding:"0 24px"}}>
            <motion.div initial={{scale:0}} animate={{scale:1}} transition={{delay:0.32,type:"spring",stiffness:260}}>
              <div style={{fontFamily:"'Playfair Display', serif",fontSize:"32px",fontWeight:700,color:ch.color}}>{fmtTime(timeTaken)}</div>
            </motion.div>
            <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:"10px",color:S.muted,letterSpacing:"0.14em",textTransform:"uppercase",marginTop:"2px"}}>Time Taken</div>
          </div>
        </div>
      </div>

      <div style={{display:"flex",gap:"12px",justifyContent:"center"}}>
        <motion.button onClick={onBack} whileHover={{scale:1.03}} whileTap={{scale:0.97}}
          style={{padding:"12px 24px",borderRadius:"10px",background:"rgba(168,169,173,0.07)",border:"1px solid rgba(168,169,173,0.16)",color:S.muted,fontFamily:"'Cormorant Garamond', serif",fontWeight:600,fontSize:"11px",letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>
          Back to Arena
        </motion.button>
        <motion.button onClick={onNext} whileHover={{scale:1.04,boxShadow:`0 8px 24px rgba(${hexToRgb(ch.color)},0.25)`}} whileTap={{scale:0.97}}
          style={{padding:"12px 28px",borderRadius:"10px",border:"none",cursor:"pointer",background:ch.color,color:"#08080F",fontFamily:"'Cormorant Garamond', serif",fontWeight:700,fontSize:"11px",letterSpacing:"0.16em",textTransform:"uppercase"}}>
          Next Challenge →
        </motion.button>
      </div>
    </motion.div>
  );
};

// ─── Intro Animation: Typewriter Terminal + Cursor Click + Silver Wave ───────
const PROMPT_TEXT   = "Create a world-class prompt engineering course.";
const TYPE_SPEED_MS = 42;
const PRE_DELAY_MS  = 600;
const POST_DELAY_MS = 820;
const CURSOR_BLINK  = 530;

const SPARKS = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  angle: (i / 22) * 360,
  dist: 36 + Math.random() * 32,
  size: 1.5 + Math.random() * 2.5,
  delay: Math.random() * 0.14,
}));

// ─── Silver Wave Transition ────────────────────────────────────────────────────
// Canvas is ALWAYS mounted (zIndex 10000, opacity 0 until active).
// When `active` flips true the wave immediately begins — no cold-start delay.
// Four staggered silver waves sweep up from below, then the canvas fades out.
function SilverWaveTransition({ active, onDone }) {
  const canvasRef   = useRef(null);
  const rafRef      = useRef(null);
  const startRef    = useRef(null);
  const activeRef   = useRef(false);   // track without re-render
  const doneRef     = useRef(false);

  const SWEEP_MS = 1100;   // waves fully visible
  const FADE_MS  = 600;    // canvas fades out
  const TOTAL_MS = SWEEP_MS + FADE_MS;

  const WAVES = useRef([
    { amp:72,  freq:0.0022, speed:1.6, phase:0,    color:"rgba(168,169,173,0.72)", sweepFrac:0    },
    { amp:56,  freq:0.0018, speed:2.1, phase:2.1,  color:"rgba(168,169,173,0.50)", sweepFrac:0.12 },
    { amp:88,  freq:0.0014, speed:1.3, phase:4.3,  color:"rgba(200,201,204,0.35)", sweepFrac:0.23 },
    { amp:46,  freq:0.0028, speed:2.5, phase:1.1,  color:"rgba(168,169,173,0.25)", sweepFrac:0.33 },
  ]).current;

  // Single persistent rAF loop — runs from mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (ts) => {
      rafRef.current = requestAnimationFrame(draw);

      if (!activeRef.current) {
        // Not active yet — keep canvas fully transparent (nothing to paint)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;

      const W = canvas.width;
      const H = canvas.height;

      const fadeProgress = elapsed > SWEEP_MS
        ? Math.min((elapsed - SWEEP_MS) / FADE_MS, 1) : 0;
      const globalAlpha = 1 - fadeProgress;

      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.globalAlpha = globalAlpha;

      // Solid dark bg so waves are opaque against the page
      ctx.fillStyle = "#08080F";
      ctx.fillRect(0, 0, W, H);

      WAVES.forEach((wv) => {
        const sweepT = Math.max(0, Math.min(
          (elapsed / SWEEP_MS - wv.sweepFrac) / (1 - wv.sweepFrac), 1
        ));
        const ease = 1 - Math.pow(1 - sweepT, 3); // cubic-out
        const restY = H * (0.36 + WAVES.indexOf(wv) * 0.04);
        const midY  = H + (restY - H) * ease;

        // Filled wave body
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 3) {
          const y = midY + Math.sin(x * wv.freq + (elapsed / 1000) * wv.speed + wv.phase) * wv.amp;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, midY - wv.amp, 0, H);
        grad.addColorStop(0,   wv.color);
        grad.addColorStop(0.6, wv.color.replace(/[\d.]+\)$/, "0.10)"));
        grad.addColorStop(1,   "rgba(8,8,15,0)");
        ctx.fillStyle = grad;
        ctx.fill();

        // Bright crest
        ctx.beginPath();
        for (let x = 0; x <= W; x += 3) {
          const y = midY + Math.sin(x * wv.freq + (elapsed / 1000) * wv.speed + wv.phase) * wv.amp;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = wv.color.replace(/[\d.]+\)$/, "0.95)");
        ctx.lineWidth   = 1.5;
        ctx.stroke();
      });

      ctx.restore();

      if (!doneRef.current && elapsed >= TOTAL_MS) {
        doneRef.current = true;
        ctx.clearRect(0, 0, W, H);
        onDone?.();
      }
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When active flips, kick the timer — no re-render needed
  useEffect(() => {
    if (active && !activeRef.current) {
      activeRef.current = true;
      startRef.current  = null; // reset so next rAF sets it fresh
    }
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position:"fixed", inset:0, zIndex:10000, pointerEvents:"none", display:"block" }}
    />
  );
}

// ─── Main IntroAnimation ─────────────────────────────────────────────────────
function IntroAnimation({ onComplete }) {
  // Phases: pre → typing → cursor-in → cursor-click → sparks → reveal → wave → done
  const [phase, setPhase]               = useState("pre");
  const [displayed, setDisplayed]       = useState("");
  const [showCursor, setShowCursor]     = useState(true);
  const [showResponse, setShowResponse] = useState(false);
  const [showSparks, setShowSparks]     = useState(false);
  const [showWave, setShowWave]         = useState(false);
  const [btnPressed, setBtnPressed]     = useState(false);

  // Animated mouse cursor state
  const [mousePos, setMousePos]         = useState({ x: -80, y: -80 }); // starts off-screen
  const [showMouse, setShowMouse]       = useState(false);
  const [mouseClicking, setMouseClicking] = useState(false);

  // Refs for the enter button so we can fly the cursor to it
  const enterBtnRef = useRef(null);
  const terminalRef = useRef(null);

  const charIdx    = useRef(0);
  const typeTimer  = useRef(null);
  const blinkTimer = useRef(null);

  // Text cursor blink — stops once typing finishes
  useEffect(() => {
    blinkTimer.current = setInterval(() => setShowCursor(v => !v), CURSOR_BLINK);
    return () => clearInterval(blinkTimer.current);
  }, []);

  // After typing done → run the cursor-click sequence
  const runCursorClick = useCallback(() => {
    // Get the Enter button's position on screen
    const btn = enterBtnRef.current;
    if (!btn) { return; }
    const rect = btn.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top  + rect.height / 2;

    // Cursor starts from bottom-left of viewport
    const startX = window.innerWidth  * 0.12;
    const startY = window.innerHeight * 0.82;

    // Phase 1: cursor fades in at start position
    setShowMouse(true);
    setMousePos({ x: startX, y: startY });
    setPhase("cursor-in");

    // Phase 2: cursor glides to the button (600ms)
    setTimeout(() => {
      setMousePos({ x: targetX, y: targetY });
      setPhase("cursor-move");
    }, 180);

    // Phase 3: cursor arrives and clicks (after 600ms travel)
    setTimeout(() => {
      setMouseClicking(true);
      setBtnPressed(true);
      setPhase("cursor-click");

      // Phase 4: release click, sparks burst, response appears
      setTimeout(() => {
        setMouseClicking(false);
        setBtnPressed(false);
        setShowSparks(true);
        setPhase("sparks");

        // Cursor glides away upward-right after clicking
        setTimeout(() => {
          setMousePos({ x: targetX + 120, y: targetY - 80 });
        }, 80);

        setTimeout(() => {
          setShowSparks(false);
          setShowResponse(true);
          setShowMouse(false);
          setPhase("reveal");

          // After shimmer, trigger wave transition — short delay so shimmer is seen briefly
          setTimeout(() => {
            setShowWave(true);
          }, 200);
        }, POST_DELAY_MS);
      }, 160);
    }, 780);
  }, []);

  const startTyping = useCallback(() => {
    setPhase("typing");
    charIdx.current = 0;
    const tick = () => {
      charIdx.current += 1;
      setDisplayed(PROMPT_TEXT.slice(0, charIdx.current));
      if (charIdx.current < PROMPT_TEXT.length) {
        const jitter = Math.random() < 0.08 ? TYPE_SPEED_MS * 3.5 : TYPE_SPEED_MS;
        typeTimer.current = setTimeout(tick, jitter);
      } else {
        // Typing done — stop blinking cursor, wait, then start cursor click
        clearInterval(blinkTimer.current);
        setShowCursor(true); // keep cursor visible while mouse moves in
        setTimeout(() => {
          runCursorClick();
        }, 420);
      }
    };
    typeTimer.current = setTimeout(tick, 0);
  }, [runCursorClick]);

  useEffect(() => {
    const pre = setTimeout(startTyping, PRE_DELAY_MS);
    return () => { clearTimeout(pre); clearTimeout(typeTimer.current); };
  }, [startTyping]);

  // The moment the wave flag fires, immediately signal parent so homepage
  // and wave both start at frame 0 together — no sequential delay.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  useEffect(() => {
    if (showWave) requestAnimationFrame(() => onCompleteRef.current?.());
  }, [showWave]);

  return (
    <>
      {/* ── Dark full-screen overlay — fades out as wave starts ── */}
      <motion.div
        key="intro-bg"
        initial={{ opacity: 1 }}
        animate={{ opacity: showWave ? 0 : 1 }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "#08080F",
          pointerEvents: showWave ? "none" : "auto",
        }}
      >
        {/* Ambient glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `
            radial-gradient(ellipse 55% 40% at 18% 72%, rgba(168,169,173,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 40% 35% at 82% 28%, rgba(139,158,212,0.06) 0%, transparent 70%)
          `,
        }}/>
        {/* Scanlines */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)",
          backgroundSize: "100% 4px",
        }}/>

        {/* Terminal box */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <motion.div
            ref={terminalRef}
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: showWave ? 0 : 1, y: 0, scale: 1 }}
            transition={{ duration: showWave ? 0.25 : 0.5, ease: [0.22, 1, 0.36, 1], delay: showWave ? 0 : 0.1 }}
            style={{ position: "relative", width: "min(680px, 92vw)" }}
          >
            {/* Chrome bar — contains the Enter button */}
            <div style={{
              background: "rgba(168,169,173,0.06)",
              border: "1px solid rgba(168,169,173,0.14)",
              borderBottom: "none", borderRadius: "12px 12px 0 0",
              padding: "10px 18px", display: "flex", alignItems: "center", gap: 8,
            }}>
              {[0,1,2].map(i => (
                <span key={i} style={{ width:9, height:9, borderRadius:"50%", background:"rgba(168,169,173,0.22)", display:"block" }}/>
              ))}
              <span style={{ marginLeft:"auto", fontSize:11, letterSpacing:"0.12em", color:"rgba(168,169,173,0.38)", fontFamily:"monospace", textTransform:"uppercase" }}>
                prompt_terminal
              </span>
              {/* ↵ Enter button — the target for the animated cursor */}
              <motion.button
                ref={enterBtnRef}
                animate={btnPressed
                  ? { scale: 0.88, background: "rgba(168,169,173,0.38)", boxShadow: "0 0 0 2px rgba(200,201,204,0.55)" }
                  : { scale: 1,    background: "rgba(168,169,173,0.13)", boxShadow: "0 0 0 0px rgba(200,201,204,0)" }
                }
                transition={{ duration: 0.12, ease: "easeOut" }}
                style={{
                  marginLeft: 8,
                  border: "1px solid rgba(168,169,173,0.3)",
                  borderRadius: 6,
                  padding: "3px 10px",
                  color: "rgba(200,201,204,0.7)",
                  fontFamily: "monospace",
                  fontSize: 12,
                  letterSpacing: "0.06em",
                  cursor: "default",
                  userSelect: "none",
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                <span style={{ fontSize: 11, opacity: 0.8 }}>↵</span>
                <span>enter</span>
                {/* Click ripple */}
                <AnimatePresence>
                  {btnPressed && (
                    <motion.span
                      key="ripple"
                      initial={{ scale: 0, opacity: 0.7 }}
                      animate={{ scale: 3.5, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                      style={{
                        position: "absolute", inset: 0, margin: "auto",
                        width: "100%", height: "100%",
                        borderRadius: 6,
                        background: "rgba(200,201,204,0.25)",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            </div>

            {/* Terminal body */}
            <div style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(168,169,173,0.14)", borderTop: "none",
              borderRadius: "0 0 12px 12px",
              padding: "28px 28px 32px", minHeight: 110,
            }}>
              <div style={{
                fontSize:11, letterSpacing:"0.14em", color:"rgba(168,169,173,0.42)",
                marginBottom:18, fontFamily:"monospace", textTransform:"uppercase",
                display:"flex", alignItems:"center", gap:10,
              }}>
                <motion.span
                  style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:"#A8A9AD" }}
                  animate={{ opacity:[1,0.3,1] }}
                  transition={{ duration:1.8, repeat:Infinity, ease:"easeInOut" }}
                />
                user prompt
              </div>

              {/* Typed text + text cursor */}
              <div style={{
                fontFamily:"'Cormorant Garamond','Georgia',serif",
                fontSize:"clamp(19px,3.2vw,26px)",
                color:"#C8C9CC", lineHeight:1.55, letterSpacing:"0.01em",
                minHeight:"1.6em", display:"flex", alignItems:"flex-start",
                flexWrap:"wrap", wordBreak:"break-word",
              }}>
                <span>{displayed}</span>
                <motion.span
                  style={{ display:"inline-block", width:"2px", height:"1.1em", background:"#A8A9AD", marginLeft:3, verticalAlign:"middle", flexShrink:0, alignSelf:"center", borderRadius:1 }}
                  animate={{ opacity: showCursor ? 1 : 0 }}
                  transition={{ duration:0.05 }}
                />
              </div>
            </div>

            {/* Sparks — burst from the Enter button area */}
            <AnimatePresence>
              {showSparks && (
                <div style={{ position:"absolute", top:18, right:28, width:0, height:0, pointerEvents:"none" }}>
                  {SPARKS.map(s => (
                    <motion.span key={s.id}
                      initial={{ opacity:0, x:0, y:0, scale:0 }}
                      animate={{ opacity:[0,1,0], x:Math.cos((s.angle*Math.PI)/180)*s.dist, y:Math.sin((s.angle*Math.PI)/180)*s.dist, scale:[0,1,0] }}
                      transition={{ duration:0.6, delay:s.delay, ease:"easeOut" }}
                      style={{ position:"absolute", width:s.size, height:s.size, borderRadius:"50%", display:"block",
                        background: s.id%3===0 ? "#C8C9CC" : s.id%3===1 ? "#8B9ED4" : "#E0E0E2" }}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* Response shimmer box */}
            <AnimatePresence>
              {showResponse && (
                <motion.div
                  initial={{ opacity:0, y:10, scale:0.98 }}
                  animate={{ opacity:1, y:0, scale:1 }}
                  transition={{ duration:0.55, ease:[0.22,1,0.36,1], delay:0.05 }}
                  style={{
                    marginTop:14,
                    background:"rgba(168,169,173,0.055)",
                    border:"1px solid rgba(168,169,173,0.18)",
                    borderLeft:"2.5px solid rgba(168,169,173,0.55)",
                    borderRadius:"0 10px 10px 0", padding:"18px 22px",
                  }}
                >
                  <div style={{ fontSize:11, letterSpacing:"0.14em", color:"rgba(168,169,173,0.42)", marginBottom:10, fontFamily:"monospace", textTransform:"uppercase", display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontFamily:"monospace", fontSize:13, color:"rgba(168,169,173,0.55)", marginRight:2 }}>◈</span>
                    generating response
                  </div>
                  {[1, 0.75, 0.5].map((w, i) => (
                    <motion.div key={i}
                      initial={{ scaleX:0, opacity:0 }}
                      animate={{ scaleX:1, opacity:1 }}
                      transition={{ duration:0.45, delay:0.08+i*0.1, ease:[0.22,1,0.36,1] }}
                      style={{ height:2, width:`${w*100}%`, background:"linear-gradient(90deg, rgba(168,169,173,0.28) 0%, rgba(168,169,173,0.08) 100%)", borderRadius:2, marginBottom:i<2?10:0, transformOrigin:"left" }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Watermark */}
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:0.22 }}
            transition={{ duration:1.2, delay:0.3 }}
            style={{ position:"absolute", bottom:"8vh", left:"50%", transform:"translateX(-50%)", fontFamily:"'Playfair Display',serif", fontSize:"clamp(11px,1.4vw,13px)", letterSpacing:"0.32em", color:"#A8A9AD", textTransform:"uppercase", whiteSpace:"nowrap", userSelect:"none" }}
          >
            Prompt Engineering · Mastery
          </motion.div>
        </div>
      </motion.div>

      {/* ── Animated mouse cursor ── */}
      <AnimatePresence>
        {showMouse && (
          <motion.div
            key="mouse-cursor"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{
              opacity: 1,
              scale: mouseClicking ? 0.82 : 1,
              x: mousePos.x,
              y: mousePos.y,
            }}
            exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.2 } }}
            transition={{
              opacity: { duration: 0.22 },
              scale: { duration: 0.12, ease: "easeOut" },
              x: { duration: phase === "cursor-move" ? 0.6 : 0.18, ease: [0.25, 0.46, 0.45, 0.94] },
              y: { duration: phase === "cursor-move" ? 0.6 : 0.18, ease: [0.25, 0.46, 0.45, 0.94] },
            }}
            style={{
              position: "fixed",
              top: 0, left: 0,
              zIndex: 11000,
              pointerEvents: "none",
              // Offset so the cursor tip is the transform origin
              marginLeft: -2, marginTop: -2,
            }}
          >
            {/* SVG mouse cursor — clean pointer arrow */}
            <svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"
              style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.55))" }}>
              <path d="M2 2L2 22L7.5 16.5L11.5 25L14 24L10 15.5H18L2 2Z"
                fill="white" stroke="rgba(40,40,60,0.7)" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* wave is rendered in App, not here */}
    </>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [introComplete, setIntroComplete] = useState(false);
  const [showAppWave,   setShowAppWave]   = useState(false);
  const [view,         setView]         = useState("home");
  const [activeStage,  setActiveStage]  = useState(null);
  const [completed,    setCompleted]    = useState([]);
  const [stageStarsMap,setStageStarsMap]= useState({});
  const [quizOpen,     setQuizOpen]     = useState(false);

  const openStage       = (stage) => { setActiveStage(stage); setView("lesson"); window.scrollTo({ top:0, behavior:"smooth" }); };
  const goBack          = () => { setView("home"); setActiveStage(null); setQuizOpen(false); setTimeout(() => window.scrollTo({ top:0, behavior:"smooth" }), 50); };
  const openLab         = () => { setView("lab"); setQuizOpen(false); window.scrollTo({ top:0, behavior:"smooth" }); };
  const openChallenges  = () => { setView("challenges"); setQuizOpen(false); window.scrollTo({ top:0, behavior:"smooth" }); };
  const handleNav = (dest) => {
    if (dest==="home")       goBack();
    if (dest==="lab")        openLab();
    if (dest==="challenges") openChallenges();
  };

  const handleQuizPass = (stageId, stars) => {
    const newCompleted = completed.includes(stageId) ? completed : [...completed, stageId];
    const prevStars    = stageStarsMap[stageId] || 0;
    const newStarsMap  = { ...stageStarsMap, [stageId]: Math.max(prevStars, stars) };
    setCompleted(newCompleted);
    setStageStarsMap(newStarsMap);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html { scroll-behavior:smooth; } body { background:#08080F; }
        ::-webkit-scrollbar { width:3px; } ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(168,169,173,0.18); border-radius:2px; }
        button { transition:all 0.2s ease; }
      `}</style>

      {/* Intro overlay — sits on top, exits with a long dissolve */}
      <AnimatePresence>
        {!introComplete && (
          <IntroAnimation onComplete={() => { setIntroComplete(true); setShowAppWave(true); }} />
        )}
      </AnimatePresence>

      {/* Background layers — fade in only after intro completes, preventing the flash */}
      <Orbs visible={introComplete}/>
      <FlyingBook isBackground={view==="lesson" || view==="lab" || view==="challenges"}/>

      {/* Landing page — simple fade in after intro, slightly delayed to match wave fade */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={introComplete ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.0, ease: [0.4, 0, 0.2, 1], delay: introComplete ? 0.05 : 0 }}
      >
        <Navbar onBack={goBack} showBack={view==="lesson"} onNav={handleNav} activeView={view}/>

        <AnimatePresence mode="wait">
          {view === "home" && (
            <motion.div key="home" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}>
              <HomePage completed={completed} stageStarsMap={stageStarsMap} onOpenStage={openStage}/>
            </motion.div>
          )}
          {view === "lesson" && (
            <motion.div key="lesson" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}>
              <LessonPage
                stage={activeStage}
                completed={completed.includes(activeStage?.id)}
                stageStars={stageStarsMap[activeStage?.id] || 0}
                onBack={goBack}
                onOpenQuiz={() => setQuizOpen(true)}
              />
            </motion.div>
          )}
          {view === "lab" && (
            <motion.div key="lab" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}>
              <PromptLabPage onBack={goBack}/>
            </motion.div>
          )}
          {view === "challenges" && (
            <motion.div key="challenges" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}>
              <ChallengesPage onBack={goBack}/>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {quizOpen && activeStage && (
            <QuizModal stage={activeStage} onClose={() => setQuizOpen(false)} onPass={handleQuizPass}/>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Silver wave plays ON TOP of homepage at the exact moment it appears */}
      <SilverWaveTransition active={showAppWave} onDone={() => setShowAppWave(false)} />
    </>
  );
}