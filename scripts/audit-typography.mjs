import fs from "node:fs";
import path from "node:path";

const roots = [
  "src/app",
  "src/components",
  "mission-control/src/app",
  "mission-control/src/components",
].filter(fs.existsSync);
const extensions = new Set([".js", ".jsx", ".ts", ".tsx", ".css"]);
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(filePath);
    else if (extensions.has(path.extname(entry.name))) files.push(filePath);
  }
}
roots.forEach(walk);

const rules = [
  { id: "tailwind-sub-12px", pattern: /text-\[(\d+(?:\.\d+)?)px\]/g, invalid: (match) => Number(match[1]) < 12 },
  { id: "css-sub-12px", pattern: /font-size\s*:\s*(\d+(?:\.\d+)?)px/gi, invalid: (match) => Number(match[1]) < 12 },
  { id: "jsx-sub-12px", pattern: /fontSize\s*:\s*["'`](\d+(?:\.\d+)?)px["'`]/g, invalid: (match) => Number(match[1]) < 12 },
  { id: "jsx-unitless-sub-12px", pattern: /fontSize\s*:\s*(\d+(?:\.\d+)?)(?![\d.])/g, invalid: (match) => Number(match[1]) < 12 },
  { id: "css-clamp-sub-12px", pattern: /font-size\s*:\s*clamp\(\s*(\d+(?:\.\d+)?)px/gi, invalid: (match) => Number(match[1]) < 12 },
  { id: "jsx-clamp-sub-12px", pattern: /fontSize\s*:\s*["'`]clamp\(\s*(\d+(?:\.\d+)?)px/gi, invalid: (match) => Number(match[1]) < 12 },
  { id: "css-font-shorthand-sub-12px", pattern: /\bfont\s*:[^;{}\n]*?(\d+(?:\.\d+)?)px(?:\s*\/|\s)/gi, invalid: (match) => Number(match[1]) < 12 },
  { id: "css-sub-0_75rem", pattern: /font-size\s*:\s*(0?\.\d+)rem/gi, invalid: (match) => Number(match[1]) < 0.75 },
  { id: "excessive-tracking", pattern: /letter-spacing\s*:\s*(0?\.\d+)em|tracking-\[(0?\.\d+)em\]/gi, invalid: (match) => Number(match[1] ?? match[2]) > 0.14 },
  { id: "jsx-excessive-em-tracking", pattern: /letterSpacing\s*:\s*["'`](\d+(?:\.\d+)?)em/gi, invalid: (match) => Number(match[1]) > 0.14 },
  { id: "css-excessive-px-tracking", pattern: /letter-spacing\s*:\s*(\d+(?:\.\d+)?)px/gi, invalid: (match) => Number(match[1]) > 1 },
  { id: "jsx-excessive-px-tracking", pattern: /letterSpacing\s*:\s*["'`](\d+(?:\.\d+)?)px/gi, invalid: (match) => Number(match[1]) > 1 },
  { id: "jsx-excessive-unitless-tracking", pattern: /letterSpacing\s*:\s*(\d+(?:\.\d+)?)(?![\d.])/g, invalid: (match) => Number(match[1]) > 1 },
  { id: "low-opacity-text", pattern: /text-(?:white|on-surface|text-primary|text-secondary)\/(\d+)\b/g, invalid: (match) => Number(match[1]) < 60 },
];

const violations = [];
for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    let match;
    while ((match = rule.pattern.exec(source))) {
      if (!rule.invalid(match)) continue;
      const line = source.slice(0, match.index).split("\n").length;
      violations.push({ rule: rule.id, file: file.replaceAll("\\", "/"), line, value: match[0] });
    }
  }
}

console.log(`Typography audit: ${files.length} source files scanned.`);
if (violations.length) {
  for (const violation of violations.slice(0, 200)) {
    console.error(`${violation.file}:${violation.line} [${violation.rule}] ${violation.value}`);
  }
  if (violations.length > 200) console.error(`...and ${violations.length - 200} more.`);
  console.error(`Typography audit failed with ${violations.length} readability violations.`);
  process.exit(1);
}
console.log("Typography audit passed: no sub-12px UI text, excessive em tracking, or low-opacity text utilities.");
