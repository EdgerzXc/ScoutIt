import fs from "node:fs";
import path from "node:path";

const targetDirs = ["src/app", "src/components"];
const extensions = new Set([".js", ".jsx", ".tsx", ".css"]);
const files = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!p.includes("__tests__") && !p.includes(".git") && !p.includes("node_modules")) {
        walk(p);
      }
    } else if (extensions.has(path.extname(entry.name))) {
      files.push(p);
    }
  }
}

targetDirs.forEach(walk);

const findings = [];
let findingId = 1;

function addFinding({ rule, priority, file, line, snippet, issue, suggestion }) {
  findings.push({
    id: findingId++,
    rule,
    priority,
    file: file.replaceAll("\\", "/"),
    line,
    snippet: snippet.trim(),
    issue,
    suggestion,
  });
}

// Slop checks
const BUZZWORDS = [
  /\bseamlessly\b/i,
  /\bcutting-edge\b/i,
  /\brevolutionary\b/i,
  /\bgame-changing\b/i,
  /\bsupercharge\b/i,
  /\bunleash\b/i,
  /\belevate your\b/i,
  /\bnext-gen(?:eration)?\b/i,
  /\bAI-powered\b/i,
  /\bstate-of-the-art\b/i,
  /\bworld-class\b/i,
];

const FAKE_STATS = [
  /\b\d+k\+\s*(?:users|clients|founders|properties)/i,
  /\b99\.9%\s*(?:uptime|satisfaction|accuracy)/i,
  /\b500M\+\b/i,
  /\b120\+\s*countries\b/i,
];

const GENERIC_CTAS = [
  />\s*(?:Get Started|Learn More|Click Here|Try Now|Explore More)\s*</i,
  /["'](?:Get Started|Learn More|Click Here|Try Now|Explore More)["']/i,
];

for (const f of files) {
  const content = fs.readFileSync(f, "utf8");
  const lines = content.split("\n");

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;

    // Check R-02: Em dash in user-facing JSX text
    // Exclude comments, imports, regex, and docs
    if (lineText.includes("—") && !lineText.trim().startsWith("//") && !lineText.trim().startsWith("/*") && !lineText.trim().startsWith("*")) {
      // Check if it's in a string or JSX text
      if (lineText.includes("<") || lineText.includes('"') || lineText.includes("'") || lineText.includes("`")) {
        // Exclude internal doc comments or regex
        if (!lineText.includes("regex") && !lineText.includes("replace(") && !lineText.includes("test(")) {
          addFinding({
            rule: "R-02",
            priority: "HIGH",
            file: f,
            line: lineNum,
            snippet: lineText,
            issue: "Forbidden em dash (—) found in user-facing copy or component string.",
            suggestion: "Replace with comma (,), period (.), colon (:), or parentheses () per antislop rule R-02.",
          });
        }
      }
    }

    // Check R-16: AI Marketing Buzzwords in JSX text
    for (const pattern of BUZZWORDS) {
      if (pattern.test(lineText) && !lineText.trim().startsWith("//") && !lineText.trim().startsWith("/*")) {
        const match = lineText.match(pattern)[0];
        addFinding({
          rule: "R-16",
          priority: "LOW",
          file: f,
          line: lineNum,
          snippet: lineText,
          issue: `AI marketing buzzword '${match}' found in text or copy.`,
          suggestion: "Replace with grounded, precise human copy stating concrete capability.",
        });
      }
    }

    // Check R-17: Fake statistics
    for (const pattern of FAKE_STATS) {
      if (pattern.test(lineText) && !lineText.trim().startsWith("//")) {
        const match = lineText.match(pattern)[0];
        addFinding({
          rule: "R-17",
          priority: "HIGH",
          file: f,
          line: lineNum,
          snippet: lineText,
          issue: `Unverified/fabricated statistic '${match}' detected in user-facing view.`,
          suggestion: "Use actual platform metrics, honest ranges, or mark clearly as demonstration sample.",
        });
      }
    }

    // Check R-15: Lazy/Generic CTAs
    for (const pattern of GENERIC_CTAS) {
      if (pattern.test(lineText) && !lineText.trim().startsWith("//") && !lineText.includes("eslint")) {
        const match = lineText.match(pattern)[0];
        addFinding({
          rule: "R-15",
          priority: "LOW",
          file: f,
          line: lineNum,
          snippet: lineText,
          issue: `Generic CTA '${match.replace(/[<>'"]/g, "")}' lacks intent and context.`,
          suggestion: "Use action-oriented verbs describing the exact outcome (e.g. 'View Space Details', 'Propose Mandate', 'Browse Roster').",
        });
      }
    }

    // Check R-24: Dead links (href="#" or href="")
    if (/<(?:a|Link)\b[^>]*href=["'](?:#|)["']/i.test(lineText)) {
      addFinding({
        rule: "R-24",
        priority: "HIGH",
        file: f,
        line: lineNum,
        snippet: lineText,
        issue: "Dead link href='#' or empty href leads to nowhere.",
        suggestion: "Point to an actual route or use an accessible <button type='button'> with an explicit onClick handler.",
      });
    }

    // Check R-26: Empty interactive handlers
    if (/onClick=\{?\(\)\s*=>\s*\{\}\}?/i.test(lineText) && !lineText.includes("defaultProps") && !f.includes(".test.")) {
      addFinding({
        rule: "R-26",
        priority: "HIGH",
        file: f,
        line: lineNum,
        snippet: lineText,
        issue: "Dummy no-op onClick handler creates non-functional interactive element.",
        suggestion: "Implement real behavior or remove interactive affordance.",
      });
    }

    // Check R-09: Gratuitous AI Capsule badges (e.g. "AI Powered", "BETA")
    if (/<span[^>]*class(?:Name)?=["'][^"']*(?:badge|pill)[^"']*["'][^>]*>\s*(?:AI POWERED|BETA|NEXT GEN)\s*<\/span>/i.test(lineText)) {
      addFinding({
        rule: "R-09",
        priority: "MEDIUM",
        file: f,
        line: lineNum,
        snippet: lineText,
        issue: "Gratuitous AI capsule badge parked on interface.",
        suggestion: "Remove decorative hype badge or replace with substantive telemetry indicator.",
      });
    }
  });
}

console.log(`Scanned ${files.length} frontend files.`);
console.log(`Total findings: ${findings.length}`);

// Write JSON output for audit report generation
fs.writeFileSync("scratch/audit-findings.json", JSON.stringify(findings, null, 2), "utf8");
