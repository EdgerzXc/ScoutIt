// One place for the Gemini model id. The hardcoded "gemini-2.5-flash" broke
// every AI route in July 2026 when Google retired it for new API keys — the
// "-latest" alias tracks whatever flash model is current, so it can't rot.
// Override per-deploy with GEMINI_MODEL if a specific pin is ever needed.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
