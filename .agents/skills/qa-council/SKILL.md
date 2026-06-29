---
name: QA Council Orchestration
description: Run comprehensive QA checks on the application using Lighthouse, Playwright, and specialized skills to assess website health, security, and performance.
---

# QA Council Orchestration

This skill orchestrates a multi-faceted quality assurance review of the ScoutIt application by deploying specialized tools to evaluate various dimensions of application health.

## Overview
When invoked, this skill triggers a comprehensive audit involving:
1. **Performance Evaluation**: Utilizing Lighthouse to check LCP and Speed Index.
2. **End-to-End Testing**: Using Playwright to verify core user journeys.
3. **Security & Workflow Checks**: Applying rules from external QA skills (like `petrkindlmann/qa-skills` and `PramodDutta/qaskills`).
4. **Documentation Sync**: Updating notes using Obsidian workflows.

## Execution Steps

### Step 1: Health & Performance Checks
Run automated checks against the live or local development server.
```bash
# Run Lighthouse on the development environment
npx @lhci/cli autorun --collect.url=http://localhost:3000 --collect.numberOfRuns=3
```

### Step 2: Automated Testing (Playwright)
Run the core UI tests to ensure critical functionality like the `owner-deep-intel-flow` and others work correctly.
```bash
npx playwright test e2e_tests/owner-deep-intel-flow.spec.js --project=chromium
```

### Step 3: Analysis & Reporting
Review the outputs generated from Lighthouse and Playwright. The agent should compile a comprehensive markdown report (`QA_AUDIT_REPORT.md`) highlighting:
- Render-blocking issues resolved
- Remaining performance bottlenecks
- UI functionality test results
- Recommendations for the next sprint

### Step 4: Documentation (Obsidian)
Create artifacts and log findings into the local Obsidian vault if configured, using the `kepano/obsidian-skills` integration.
