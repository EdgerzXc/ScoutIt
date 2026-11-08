// ═══════════════════════════════════════════════════════════════════════════
// ZERO-COST IN-MEMORY CONTACT SPAM & ABUSE CLASSIFIER
//
// Runs strictly locally in the Node.js/Edge runtime with ZERO external API calls.
// Consumes 0 tokens, costs $0.00, and evaluates in < 0.2ms.
//
// Automatically classifies inbound contact form messages into:
// - "spam": High-confidence automated solicitation, link farms, casino, crypto,
//           or phishing blasts. Stored in `contact_messages` as `status: 'spam'`
//           with staff notifications suppressed so the human inbox stays clean.
// - "legitimate": Stored as `status: 'new'`, surfacing immediately for staff.
// ═══════════════════════════════════════════════════════════════════════════

const SPAM_PHRASES = [
  // Crypto / Forex / Financial Scams
  /\b(?:crypto(?:currency)?|bitcoin|btc|usdt|eth(?:ereum)?)\s+(?:investment|trading|yield|profit|doubler|recovery|giveaway)\b/i,
  /\b(?:passive income guaranteed|guaranteed returns|binary options|forex signal|automated trading bot)\b/i,
  /\b(?:airdrop claim|connect your wallet|seed phrase)\b/i,

  // Casino / Gambling / Adult
  /\b(?:online casino|slot machine|online slots|baccarat online|roulette table|sports betting odds|free spins bonus)\b/i,
  /\b(?:poker tournament|jili play|sabong online|bet365)\b/i,
  /\b(?:viagra|cialis|pharmacy online|weight loss pills)\b/i,

  // SEO / Link-building solicitation blasts
  /\b(?:guest post(?:ing)?|sponsored post|buy backlinks?|high da backlinks?|pbn links?)\b/i,
  /\b(?:increase your website traffic|rank #1 on google|seo audit report for your website)\b/i,
  /\b(?:link insertion|do-follow backlink|collaborative post)\b/i,

  // Direct messaging redirect scams
  /\b(?:contact (?:us|me) on whatsapp|message (?:us|me) on telegram|reach out on signal)\s*[:\-]?\s*[\w\+]/i,
  /\b(?:t\.me\/[a-zA-Z0-9_]+|wa\.me\/\d+)\b/i,
];

/** HTML / BBCode markup injected by spam blasters */
const MARKUP_INJECTION = [
  /\[url\s*=\s*[^\]]+\]/i,
  /\[link\s*=\s*[^\]]+\]/i,
  /<a\s+(?:[^>]*?\s+)?href=["'][^"']+["']/i,
];

/** URL matcher */
const URL_REGEX = /https?:\/\/[^\s<>"'{}|\\^`\[\]]+/gi;

/**
 * Classifies an inbound contact message for automated spam/abuse.
 *
 * @param {object} input
 * @param {string} input.name
 * @param {string} input.email
 * @param {string} [input.subject]
 * @param {string} input.message
 * @returns {{ isSpam: boolean, reason: string | null }}
 */
export function classifyContactSpam({ name = "", email = "", subject = "", message = "" } = {}) {
  const cleanSubject = String(subject || "").trim();
  const cleanMessage = String(message || "").trim();
  const cleanName = String(name || "").trim();
  const combinedText = `${cleanName} ${cleanSubject} ${cleanMessage}`;

  // 1. Injected HTML anchor tags or BBCode links
  for (const pattern of MARKUP_INJECTION) {
    if (pattern.test(cleanMessage) || pattern.test(cleanSubject)) {
      return { isSpam: true, reason: "markup_injection" };
    }
  }

  // 2. Excessive link stuffing (> 2 URLs in a single initial contact inquiry)
  const urls = combinedText.match(URL_REGEX) || [];
  if (urls.length > 2) {
    return { isSpam: true, reason: "excessive_links" };
  }

  // 3. High-confidence spam phrases (Crypto, Casino, SEO spam, Redirect scams)
  for (const phrase of SPAM_PHRASES) {
    if (phrase.test(combinedText)) {
      return { isSpam: true, reason: "solicitation_keyword" };
    }
  }

  // 4. Cyrillic / Non-target script spam blasts (> 25% Cyrillic characters in message)
  const letters = cleanMessage.replace(/[^a-zA-Z\u0400-\u04FF]/g, "");
  if (letters.length >= 20) {
    const cyrillicLetters = cleanMessage.match(/[\u0400-\u04FF]/g) || [];
    if (cyrillicLetters.length / letters.length > 0.25) {
      return { isSpam: true, reason: "non_target_script" };
    }
  }

  // 5. Blatant random gibberish or character repetition
  if (/([a-zA-Z0-9])\1{9,}/.test(cleanMessage)) {
    return { isSpam: true, reason: "repetitive_gibberish" };
  }

  return { isSpam: false, reason: null };
}
