---
name: council-qa
description: Use when reviewing a new feature for bugs, performance bottlenecks, or accessibility issues before merging.
origin: ECC
---

# QA & Health Council

Convene four specialized QA advisors for a comprehensive health and quality review:
- the in-context QA Lead voice
- an Accessibility Advocate subagent
- a Performance Engineer subagent
- an Edge Case Tester subagent

This is for **comprehensive quality assurance**, finding blind spots, and validating web vitals before a feature ships.

## When to Use

Use council-qa when:
- a new feature or complex UI component is ready for final review
- you need explicit accessibility and performance checks
- you need to surface edge cases or "unhappy paths"
- the user asks for a website health check or QA review

## Roles

| Voice | Lens |
| --- | --- |
| QA Lead | overall functionality, user flow friction, requirement satisfaction |
| Accessibility Advocate | WCAG compliance, screen readers, contrast, keyboard nav |
| Performance Engineer | Lighthouse metrics (LCP, CLS), render blocking, payload size |
| Edge Case Tester | unexpected inputs, slow networks, extreme screen sizes, offline mode |

The three external voices should be launched as fresh subagents with **only the feature context/code**, not the full ongoing conversation. That is the anti-anchoring mechanism.

## Workflow

### 1. Extract the feature under review

Identify exactly what is being tested:
- which components or pages?
- what is the expected "happy path"?

### 2. Gather only the necessary context

- collect the relevant files, snippets, or component code
- keep it compact

### 3. Form the QA Lead position first

Before reading other voices, write down:
- your overall assessment of the feature's readiness
- the biggest functional gap or UX friction point

### 4. Launch three independent voices in parallel

Each subagent gets:
- the feature context
- a strict role
- no unnecessary conversation history

Prompt shape:

```text
You are the [ROLE] on a specialized Quality Assurance council.

Feature Context:
[only the relevant snippets or flow constraints]

Respond with:
1. Assessment — 1-2 sentences on how the feature holds up to your lens
2. Top Issues — 2-3 concise bullets pointing out specific flaws
3. Showstopper Risk — the single biggest reason this shouldn't ship yet
4. Quick Win — one easy fix to improve quality

Be direct. No hedging. Keep it under 300 words.
```

### 5. Synthesize with bias guardrails

- do not dismiss an external view without explaining why
- aggregate the findings into a clear punchlist

### 6. Present a compact QA Report

Use this output shape:

```markdown
## QA Council Review: [Feature Name]

**QA Lead:** [1-2 sentence functional assessment]

**Accessibility Advocate:** [1-2 sentence accessibility assessment]
[Top a11y issue]

**Performance Engineer:** [1-2 sentence performance assessment]
[Top performance issue]

**Edge Case Tester:** [1-2 sentence edge case assessment]
[Top edge case risk]

### QA Punchlist
- **Blockers:** [Issues that must be fixed before ship]
- **Warnings:** [Issues to fix if time permits]
- **Recommendation:** [Ship / Fix / Block]
```
