import { readdirSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const scriptsDir = join(process.cwd(), "scripts");
const files = readdirSync(scriptsDir).filter((f) => f.endsWith(".mjs") || f.endsWith(".js"));

let errorCount = 0;
for (const file of files) {
  const filePath = join(scriptsDir, file);
  try {
    execFileSync(process.execPath, ["--check", filePath], { stdio: "pipe" });
  } catch (err) {
    console.error(`Syntax error in scripts/${file}:`, err.message);
    errorCount++;
  }
}

if (errorCount > 0) {
  process.exit(1);
} else {
  console.log(`Script syntax audit passed: ${files.length} scripts verified.`);
}
