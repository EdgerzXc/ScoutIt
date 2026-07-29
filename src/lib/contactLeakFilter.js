// ─────────────────────────────────────────────────────────────────────────
// CONTACT LEAK FILTER  (NEW_IDEAS.md §4.2)
//
// The public 3-Tier FAQ layer is the one place on ScoutIt where a seeker and
// an owner/advisor exchange free text in the open. Left unguarded it becomes
// a free bypass around the Connects handshake -- "just text me at 0917..." --
// which is the entire revenue model.
//
// DESIGN: the text is never mangled in a single destructive pass. Instead we
// build three independent VIEWS and point each rule at the view it needs:
//
//   raw        lowercased original      -> keyword rules (viber:, "text me at")
//   deob       bracket obfuscation      -> email + external-link rules
//              resolved: (at)->@ (dot)->.
//   digits     phone-shape normalised   -> phone-number rules
//              spelled digits -> numerals, homoglyphs fixed inside
//              digit-bearing tokens only, separators between digits stripped
//
// Applying homoglyph mapping to the whole string (the obvious approach) is
// what breaks it: "Price is 45000000" becomes "Pr1ce 15 45000000", which then
// collapses into a 10-digit run and gets flagged as a phone number. Scoping
// the mapping to tokens that already contain digits avoids that entirely.
//
// Dependency-free and deterministic so it runs in the serverless API route
// with zero cold-start cost. Biased toward false positives on contact-shaped
// strings: a rejected question is a minor annoyance, a leaked mobile number
// is lost revenue.
// ─────────────────────────────────────────────────────────────────────────

import { ownDomainsPattern } from "./siteUrl";

const WORD_DIGITS = {
  zero: "0", oh: "0", one: "1", two: "2", three: "3", four: "4",
  five: "5", six: "6", seven: "7", eight: "8", nine: "9",
};

// Homoglyphs evaders use to dodge naive \d matching. Applied ONLY inside
// tokens that already contain a digit -- see the note above.
const LEET = { o: "0", l: "1", i: "1", "|": "1", s: "5", b: "8" };

// ── View 1: raw ──────────────────────────────────────────────────────────
function rawView(text) {
  return String(text || "").toLowerCase();
}

// ── View 2: bracket-obfuscation resolved ─────────────────────────────────
// "juan (at) gmail (dot) com" -> "juan@gmail.com"
function deobView(text) {
  return String(text || "")
    .toLowerCase()
    // bracketed or spaced "dot"/"punto" sitting between alphanumerics
    .replace(/(?<=[a-z0-9])\s*[({[]?\s*(?:dot|d0t|punto)\s*[)}\]]?\s*(?=[a-z0-9])/g, ".")
    // bracketed "at" sitting between alphanumerics. Bracketed ONLY -- a bare
    // " at " is ordinary English and rewriting it breaks the keyword rules.
    .replace(/(?<=[a-z0-9])\s*[({[]\s*(?:at|@)\s*[)}\]]\s*(?=[a-z0-9])/g, "@")
    .replace(/\s*@\s*/g, "@");
}

// ── View 3: phone-shape normalised ───────────────────────────────────────
function digitsView(text) {
  let out = String(text || "").toLowerCase();

  // Spelled-out digits -> numerals ("zero nine one seven" -> "0 9 1 7")
  out = out.replace(
    /\b(zero|oh|one|two|three|four|five|six|seven|eight|nine)\b/g,
    (m) => WORD_DIGITS[m],
  );

  // Homoglyphs, scoped to tokens that already carry a digit. "o917" -> "0917",
  // but "Price is" is untouched because neither token contains a digit.
  out = out.replace(/[a-z0-9|]+/g, (token) =>
    /\d/.test(token) ? token.replace(/[olis|b]/g, (c) => LEET[c] ?? c) : token,
  );

  // Collapse separators that sit strictly between two digits, so
  // "0917 123 4567" and "0917.123.4567" both become one run. Letters are not
  // in the class, so "120 sqm, 4 bedrooms" never merges.
  out = out.replace(/(?<=\d)[\s._\-()+]+(?=\d)/g, "");

  return out;
}

// ── Detection rules ──────────────────────────────────────────────────────
const RULES = [
  {
    code: "email",
    view: "deob",
    pattern: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/,
    message: "Email addresses can't be posted in public Q&A.",
  },
  {
    code: "ph_mobile",
    view: "digits",
    // 09XXXXXXXXX | +639XXXXXXXXX | 639XXXXXXXXX
    pattern: /(?:\+?63|0)9\d{9}/,
    message: "Phone numbers can't be posted in public Q&A.",
  },
  {
    code: "ph_landline",
    view: "digits",
    // (02) 8XXX XXXX and other area-code landlines
    pattern: /(?:\+?63|0)[2-8]\d{7,9}/,
    message: "Phone numbers can't be posted in public Q&A.",
  },
  {
    code: "long_digit_run",
    view: "digits",
    // Catch-all. 11+ consecutive digits is never a legitimate FAQ answer --
    // SQM, floor numbers, years and even nine-figure peso prices sit below it.
    pattern: /\d{11,}/,
    message: "That looks like a phone number. Please remove it.",
  },
  {
    code: "messaging_handle",
    view: "raw",
    // "viber me: juan", "wa: juan", "telegram @juan"
    pattern: /\b(?:viber|whatsapp|wa|telegram|wechat|signal|messenger|kakao)\b\s*(?:me)?\s*[:@]/,
    message: "Please keep contact details out of public Q&A.",
  },
  {
    code: "social_handle",
    view: "raw",
    pattern: /(?:^|\s)@[a-z0-9._]{3,}/,
    message: "Social handles can't be posted in public Q&A.",
  },
  {
    code: "external_link",
    view: "deob",
    // Any URL that isn't one of OURS. The allowed hosts come from
    // lib/siteUrl.js — NEVER hardcode a hostname here.
    //
    // This used to hardcode `scoutit\.ph`. When the domain moved to
    // scoutit.space, that would have started rejecting legitimate links to
    // our own site as "external" — looking like a flaky filter rather than a
    // stale constant.
    pattern: new RegExp(
      `\\b(?:https?:\\/\\/|www\\.)(?!(?:[a-z0-9-]+\\.)*(?:${ownDomainsPattern()})\\b)[a-z0-9-]+\\.[a-z]{2,}`,
    ),
    message: "External links can't be posted in public Q&A.",
  },
  {
    code: "bypass_solicitation",
    view: "raw",
    // Explicit attempts to move the conversation off-platform
    pattern: /\b(?:text|call|dm|pm|message|contact|reach|hit)\s+me\s+(?:up\s+)?(?:at|on|via|sa|thru|through)\b/,
    message: "Please keep the conversation on ScoutIt so both sides stay protected.",
  },
];

/**
 * Scans free text for contact-detail leakage.
 *
 * @param {string} text - raw user input
 * @returns {{ clean: boolean, code: string|null, message: string|null }}
 */
export function detectContactLeak(text) {
  const views = {
    raw: rawView(text),
    deob: deobView(text),
    digits: digitsView(text),
  };

  for (const rule of RULES) {
    if (rule.pattern.test(views[rule.view])) {
      return { clean: false, code: rule.code, message: rule.message };
    }
  }

  return { clean: true, code: null, message: null };
}

/**
 * Convenience guard for API routes.
 * Returns null when the text is clean, or a { code, message } rejection.
 *
 * @param {string} text
 * @returns {{ code: string, message: string }|null}
 */
export function rejectIfContactLeak(text) {
  const result = detectContactLeak(text);
  return result.clean ? null : { code: result.code, message: result.message };
}

export default detectContactLeak;
