---
name: council-security
description: Use when adding authentication, integrating 3rd party APIs, or modifying database schemas to assess security risks.
origin: ECC
---

# Security Council

Convene four specialized security advisors for threat modeling and risk assessment:
- the in-context Security Lead voice
- a Threat Modeler subagent
- a Compliance Officer subagent
- an Ops Defender subagent

This is for **identifying structural flaws, compliance gaps, and exploitation vectors** before code merges.

## When to Use

Use council-security when:
- adding new authentication or authorization flows
- integrating third-party APIs that handle PII or credentials
- modifying database schemas with sensitive data
- the user asks for a security review or threat model

## Roles

| Voice | Lens |
| --- | --- |
| Security Lead | overall security posture, secure by default principles, secure coding standards |
| Threat Modeler | structural flaws, injection risks (SQLi, XSS), business logic bypass |
| Compliance Officer | data privacy, GDPR/HIPAA compliance, data retention, PII handling |
| Ops Defender | rate limiting, logging/monitoring, secret management, infrastructure security |

The three external voices should be launched as fresh subagents with **only the feature context/code**, not the full ongoing conversation. That is the anti-anchoring mechanism.

## Workflow

### 1. Extract the feature under review

Identify exactly what is being tested:
- which components or APIs?
- what data is being handled?

### 2. Gather only the necessary context

- collect the relevant files, schemas, or API routes
- keep it compact

### 3. Form the Security Lead position first

Before reading other voices, write down:
- your overall assessment of the feature's security posture
- the most obvious vulnerability or misconfiguration

### 4. Launch three independent voices in parallel

Each subagent gets:
- the feature context
- a strict role
- no unnecessary conversation history

Prompt shape:

```text
You are the [ROLE] on a specialized Security council.

Feature Context:
[only the relevant snippets or flow constraints]

Respond with:
1. Assessment — 1-2 sentences on how the feature holds up to your lens
2. Top Threats — 2-3 concise bullets pointing out specific vulnerabilities
3. Critical Risk — the single biggest security reason this shouldn't ship yet
4. Mitigation — one explicit step to resolve the critical risk

Be direct. No hedging. Keep it under 300 words.
```

### 5. Synthesize with bias guardrails

- do not dismiss an external view without explaining why
- aggregate the findings into a clear punchlist

### 6. Present a compact Security Report

Use this output shape:

```markdown
## Security Council Review: [Feature Name]

**Security Lead:** [1-2 sentence security assessment]

**Threat Modeler:** [1-2 sentence threat assessment]
[Top vulnerability]

**Compliance Officer:** [1-2 sentence compliance assessment]
[Top compliance gap]

**Ops Defender:** [1-2 sentence ops assessment]
[Top infrastructure risk]

### Security Punchlist
- **Critical:** [Vulnerabilities that must be fixed immediately]
- **High:** [Issues that should be addressed before ship]
- **Recommendation:** [Ship / Fix / Block]
```
