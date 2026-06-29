---
name: council-workflow
description: Use when deciding whether to ship an imperfect feature, rewrite a legacy system, or prioritize technical debt vs velocity.
origin: ECC
---

# Workflow & Tradeoff Council

Convene four specialized project management and delivery advisors:
- the in-context Tradeoff Professional voice
- a Product Manager subagent
- a Technical Debt Manager subagent
- a Delivery Lead subagent

This is for **balancing speed, quality, and technical debt** when making project management decisions.

## When to Use

Use council-workflow when:
- deciding whether to release a feature with known non-critical bugs
- deciding between a quick hack vs a proper architectural refactor
- the user asks for a tradeoff analysis between velocity and maintainability

## Roles

| Voice | Lens |
| --- | --- |
| Tradeoff Professional | overall balance of cost, speed, and quality; opportunity cost |
| Product Manager | pure user impact, feature adoption, business value |
| Technical Debt Manager | long-term maintainability, clean architecture, tech debt interest |
| Delivery Lead | time-to-market, unblocking the dev pipeline, release predictability |

The three external voices should be launched as fresh subagents with **only the decision context**, not the full ongoing conversation. That is the anti-anchoring mechanism.

## Workflow

### 1. Extract the decision under review

Identify exactly what the tradeoff is:
- Option A vs Option B?
- What are the stated constraints (e.g. strict deadline)?

### 2. Gather only the necessary context

- collect the relevant files or decision summary
- keep it compact

### 3. Form the Tradeoff Professional position first

Before reading other voices, write down:
- your overall recommendation on the best path forward
- the biggest opportunity cost of your choice

### 4. Launch three independent voices in parallel

Each subagent gets:
- the decision context
- a strict role
- no unnecessary conversation history

Prompt shape:

```text
You are the [ROLE] on a specialized Workflow Tradeoff council.

Decision Context:
[only the relevant snippets or constraints]

Respond with:
1. Position — 1-2 sentences on your recommended path
2. Justification — 2-3 concise bullets explaining why based on your lens
3. Concession — the biggest downside to your recommendation
4. Mitigation — one explicit step to reduce that downside

Be direct. No hedging. Keep it under 300 words.
```

### 5. Synthesize with bias guardrails

- do not dismiss an external view without explaining why
- if an external voice changed your recommendation, say so explicitly
- always include the strongest dissent, even if you reject it

### 6. Present a compact Decision Report

Use this output shape:

```markdown
## Workflow Council Review: [Decision Name]

**Tradeoff Professional:** [1-2 sentence recommendation]

**Product Manager:** [1-2 sentence recommendation]
[Main justification]

**Technical Debt Manager:** [1-2 sentence recommendation]
[Main justification]

**Delivery Lead:** [1-2 sentence recommendation]
[Main justification]

### Verdict
- **Consensus:** [Where voices align]
- **Strongest Dissent:** [Most important disagreement]
- **Final Recommendation:** [The synthesized path forward]
```
