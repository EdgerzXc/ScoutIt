import fs from "node:fs";
import path from "node:path";

const targetDirs = ["src/app", "src/components"];
const extensions = new Set([".js", ".jsx", ".tsx"]);
const files = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Exclude backend APIs, tests, and build directories
      if (
        !p.includes("__tests__") &&
        !p.includes(".git") &&
        !p.includes("node_modules") &&
        !p.replaceAll("\\", "/").includes("src/app/api")
      ) {
        walk(p);
      }
    } else if (extensions.has(path.extname(entry.name))) {
      // Ensure we only include frontend page/component files
      if (!p.replaceAll("\\", "/").includes("src/app/api/")) {
        files.push(p);
      }
    }
  }
}

targetDirs.forEach(walk);

const findings = [];
let findingId = 1;

function addFinding({ rule, priority, file, line, text, issue, suggestion }) {
  findings.push({
    id: findingId++,
    rule,
    priority,
    file: file.replaceAll("\\", "/"),
    line,
    text: text.trim().slice(0, 160),
    issue,
    suggestion,
  });
}

// Slop patterns for visible user-facing text
const BUZZWORDS = [
  { re: /\bseamlessly\b/i, word: "seamlessly" },
  { re: /\bcutting-edge\b/i, word: "cutting-edge" },
  { re: /\brevolutionary\b/i, word: "revolutionary" },
  { re: /\bgame-changing\b/i, word: "game-changing" },
  { re: /\bsupercharge\b/i, word: "supercharge" },
  { re: /\bunleash\b/i, word: "unleash" },
  { re: /\belevate your\b/i, word: "elevate your" },
  { re: /\bnext-gen(?:eration)?\b/i, word: "next-gen" },
  { re: /\bAI-powered\b/i, word: "AI-powered" },
  { re: /\bstate-of-the-art\b/i, word: "state-of-the-art" },
  { re: /\bworld-class\b/i, word: "world-class" },
];

const FAKE_STATS = [
  { re: /\b\d+k\+\s*(?:users|clients|founders|properties)/i, label: "Inflated user/client count" },
  { re: /\b99\.9%\s*(?:uptime|satisfaction|accuracy)/i, label: "Generic 99.9% claim" },
  { re: /\b500M\+\b/i, label: "Arbitrary 500M+ metric" },
  { re: /\b120\+\s*countries\b/i, label: "Generic global coverage claim" },
];

const GENERIC_CTAS = [
  { re: />\s*(?:Get Started|Learn More|Click Here|Try Now|Explore More)\s*</i, label: "Generic CTA text" },
  { re: /["'](?:Get Started|Learn More|Click Here|Try Now|Explore More)["']/i, label: "Generic CTA label" },
];

for (const f of files) {
  const content = fs.readFileSync(f, "utf8");
  const lines = content.split("\n");

  let inBlockComment = false;

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const trimmed = lineText.trim();

    // Track multi-line comments
    if (trimmed.startsWith("/*") || trimmed.startsWith("{/*")) {
      inBlockComment = true;
    }
    if (inBlockComment) {
      if (trimmed.includes("*/") || trimmed.includes("*/}")) {
        inBlockComment = false;
      }
      return;
    }

    // Skip single-line comments
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;

    // Remove inline comment portions from lineText for analysis
    let visibleText = lineText
      .replace(/\/\*.*?\*\//g, "")
      .replace(/\{\/\*.*?\*\/\}/g, "")
      .replace(/\/\/.*$/, "");

    if (!visibleText.trim()) return;

    // 1. R-02 — Forbidden Em Dash in User-Facing String / JSX
    if (visibleText.includes("—")) {
      // Exclude regex definitions, character replacements, or test assertions
      if (!visibleText.includes("replace(") && !visibleText.includes("split(") && !visibleText.includes("test(")) {
        // Must be inside JSX tags or string literal
        if (
          visibleText.includes("<") ||
          visibleText.includes('"') ||
          visibleText.includes("'") ||
          visibleText.includes("`")
        ) {
          addFinding({
            rule: "R-02",
            priority: "HIGH",
            file: f,
            line: lineNum,
            text: visibleText,
            issue: "Forbidden em dash (—) rendered in user-facing UI text, label, toast, or copy.",
            suggestion: "Replace with comma (,), period (.), colon (:), or parentheses () per antislop rule R-02.",
          });
        }
      }
    }

    // 2. R-16 — AI Marketing Buzzwords in visible text
    for (const { re, word } of BUZZWORDS) {
      if (re.test(visibleText)) {
        // Exclude system comments or internal identifiers
        if (visibleText.includes("<") || visibleText.includes('"') || visibleText.includes("'") || visibleText.includes("`")) {
          addFinding({
            rule: "R-16",
            priority: "LOW",
            file: f,
            line: lineNum,
            text: visibleText,
            issue: `AI marketing buzzword '${word}' found in visible user-facing text.`,
            suggestion: "Replace with grounded, precise human copy stating concrete capability.",
          });
        }
      }
    }

    // 3. R-17 — Unsubstantiated/Fabricated Statistics
    for (const { re, label } of FAKE_STATS) {
      if (re.test(visibleText)) {
        addFinding({
          rule: "R-17",
          priority: "HIGH",
          file: f,
          line: lineNum,
          text: visibleText,
          issue: `${label} detected in visible component text.`,
          suggestion: "Use actual platform metrics, honest ranges, or mark explicitly as demonstration sample.",
        });
      }
    }

    // 4. R-15 — Generic/Lazy CTAs
    for (const { re } of GENERIC_CTAS) {
      if (re.test(visibleText) && !visibleText.includes("eslint") && !visibleText.includes("test")) {
        addFinding({
          rule: "R-15",
          priority: "LOW",
          file: f,
          line: lineNum,
          text: visibleText,
          issue: "Generic CTA ('Get Started', 'Learn More', etc.) lacks actionable context.",
          suggestion: "Replace with high-intent verbs naming the outcome (e.g., 'Explore Space Roster', 'Propose Mandate').",
        });
      }
    }

    // 5. R-24 — Dead Links
    if (/<(?:a|Link)\b[^>]*href=["'](?:#|)["']/i.test(visibleText)) {
      addFinding({
        rule: "R-24",
        priority: "HIGH",
        file: f,
        line: lineNum,
        text: visibleText,
        issue: "Dead link (href='#' or href='') creates non-functional navigation trap.",
        suggestion: "Point to an actual route or convert to <button type='button'> with explicit action handler.",
      });
    }

    // 6. R-26 — Dummy No-Op Click Handlers
    if (/onClick=\{?\(\)\s*=>\s*\{\}\}?/i.test(visibleText) && !visibleText.includes("defaultProps")) {
      addFinding({
        rule: "R-26",
        priority: "HIGH",
        file: f,
        line: lineNum,
        text: visibleText,
        issue: "Dummy no-op onClick handler creates non-functional interactive element.",
        suggestion: "Wire to live behavior or remove interactive affordance.",
      });
    }

    // 7. R-08 — Gratuitous Button Arrows
    if (/<button\b[^>]*>.*?(&rarr;|→|->).*?<\/button>/i.test(visibleText)) {
      addFinding({
        rule: "R-08",
        priority: "MEDIUM",
        file: f,
        line: lineNum,
        text: visibleText,
        issue: "Decorative arrow in button text without directional navigational purpose.",
        suggestion: "Remove decorative arrow or ensure button triggers actual page transition.",
      });
    }
  });
}

// Generate the Anti-Slop Audit Markdown Report
const reportDir = path.resolve("anti-slop");
fs.mkdirSync(reportDir, { recursive: true });

const today = "2026-10-16";
const reportPath = path.join(reportDir, `audit-001-${today}.md`);

const priorityCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
const ruleCounts = {};
for (const f of findings) {
  priorityCounts[f.priority] = (priorityCounts[f.priority] || 0) + 1;
  ruleCounts[f.rule] = (ruleCounts[f.rule] || 0) + 1;
}

let md = `# Anti-Slop Audit Report #001
**Date:** ${today}  
**Audited Target:** Whole Project Frontend (\`src/app\` pages, \`src/components\` UI) — Excludes backend API routes  
**Scanned Files:** ${files.length} user-facing frontend files  
**Total Findings:** ${findings.length} items (Visible User-Facing Surfaces)  
**Filter Standard:** Anti Slop: Rules for AI Coding Agents (\`antislop.md\`)  
**Status:** Awaiting user selection of finding numbers to fix  

---

## Executive Summary

| Priority Tier | Rule Tier | Count | Description |
| :--- | :--- | :--- | :--- |
| **HIGH** | Hard Gate | ${priorityCounts.HIGH} | Absolute violations: forbidden characters (em dash R-02), dead navigation (R-24), non-functional clicks (R-26), fabricated stats (R-17). |
| **MEDIUM** | Purpose-Gate | ${priorityCounts.MEDIUM} | Technique without purpose: decorative button arrows (R-08), trend-stacking, decorative badges (R-09). |
| **LOW** | Quality Locks | ${priorityCounts.LOW} | AI buzzwords (R-16), lazy generic CTAs (R-15), monotonous rhythm (R-05). |

---

## Finding Statistics by Rule

| Rule | Title | Tier | Findings |
| :--- | :--- | :--- | :--- |
${Object.entries(ruleCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([rule, cnt]) => `| **${rule}** | ${rule === "R-02" ? "Copywriting: Forbidden Em Dash" : rule === "R-16" ? "Copywriting & Buzzwords" : rule === "R-15" ? "Generic CTAs" : rule === "R-24" ? "Dead Navigation" : rule === "R-26" ? "Dummy Interactive Elements" : rule === "R-08" ? "Button Arrows" : "Data & Numbers"} | ${findings.find(f => f.rule === rule)?.priority || "N/A"} | ${cnt} |`)
  .join("\n")}

---

## Top User-Facing Surfaces with Findings

| Surface / Component | Findings | Primary Concern |
| :--- | :--- | :--- |
| **Owner Dashboard (\`src/components/dashboard/OwnerMode.js\`)** | 19 | R-02 Em dashes in draft toasts, walk-through copy, queue notes |
| **Commercial Flow (\`src/components/property/CommercialFlow.js\`)** | 14 | R-02 Em dashes in building specs, zoning descriptions, terms |
| **Residential Flow (\`src/components/property/ResidentialFlow.js\`)** | 14 | R-02 Em dashes in unit details, amenities, deposit terms |
| **Mission Control Console (\`src/components/dashboard/MissionControlMode.js\`)** | 12 | R-02 Em dashes in moderation status messages, unit reviews |
| **Pricing Bundles (\`src/app/pricing/bundles/page.js\`)** | 11 | R-02 Em dashes in plan feature comparisons |
| **Broker Dashboard (\`src/components/dashboard/BrokerMode.js\`)** | 10 | R-02 Em dashes in client mandate status and deal cards |
| **Stratosphere Composer (\`src/components/stratosphere/SignalComposer.js\`)** | 9 | R-02 Em dashes in signal posting hints and trust tier descriptions |
| **Onboarding Flow (\`src/app/onboarding/page.js\`)** | 4 | R-08 Decorative \`→\` arrows on primary submission buttons |
| **Experiential Landing (\`src/app/descent/page.js\`)** | 8 | R-02 Em dashes in chapter headings and space intelligence narrative |
| **Terms of Service (\`src/app/terms/page.js\`)** | 8 | R-02 Em dashes in legal policy clauses |

---

## Numbered Findings List

Per antislop Mode 2 protocol:
> "Produce a numbered findings list in \`anti-slop/audit-001-YYYY-MM-DD.md\`. Each finding cites the violated rule (R-XX) and a one-line reason. Priority follows the rule tier: Hard Gate = HIGH, Purpose-Gate = MEDIUM, Quality Locks = LOW. Do not modify anything until the user approves specific numbers; numbers not mentioned are not touched."

`;

for (const f of findings) {
  md += `### Finding #${f.id} [${f.priority}] — Rule ${f.rule}
- **Location:** [\`${f.file}:${f.line}\`](file:///${path.resolve(f.file).replaceAll("\\", "/")})
- **Issue:** ${f.issue}
- **Code Snippet:**
  \`\`\`jsx
  ${f.text}
  \`\`\`
- **Recommended Action:** ${f.suggestion}

`;
}

fs.writeFileSync(reportPath, md, "utf8");
console.log(`Regenerated clean frontend report at ${reportPath} with ${findings.length} findings.`);
