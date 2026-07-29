// ─────────────────────────────────────────────────────────────────────────
// ERROR SANITIZER  (NEW_IDEAS.md §2)
//
// Two jobs:
//   1. Turn raw Postgres / Supabase / network codes into a sentence a broker
//      standing in a lobby can act on.
//   2. Make sure a stack trace, table name, or connection string never
//      reaches the client. Anything unrecognised collapses to a safe generic.
//
// Deliberately dependency-free -- this runs inside error boundaries, which
// must never themselves throw.
// ─────────────────────────────────────────────────────────────────────────

const GENERIC = "Something went wrong on our end. Please try again.";

// Postgres SQLSTATE -> human sentence
const PG_CODES = {
  "23505": "This record already exists.",
  "23503": "That item is linked to something else and can't be changed yet.",
  "23502": "A required field is missing.",
  "23514": "That value isn't allowed for this field.",
  "22P02": "One of the values sent wasn't in the expected format.",
  "42501": "You don't have permission to do that.",
  "42P01": GENERIC, // undefined_table — never name our schema to the client
  "40001": "The server was busy. Please try that again.",
  "57014": "That took too long and was cancelled. Please try again.",
  "P0001": "That action isn't allowed right now.",
};

// PostgREST codes surfaced by supabase-js
const POSTGREST_CODES = {
  PGRST116: "We couldn't find what you were looking for.",
  PGRST301: "Your session has expired. Please log in again.",
};

// Supabase Auth error names / messages
const AUTH_PATTERNS = [
  [/jwt (expired|is expired)/i,            "Your session has expired. Please log in again."],
  [/invalid (jwt|token|claim)/i,           "Your session is no longer valid. Please log in again."],
  [/refresh_token_not_found/i,             "Your session has expired. Please log in again."],
  [/invalid login credentials/i,           "That email and password don't match."],
  [/email not confirmed/i,                 "Please confirm your email address first."],
  [/user already registered/i,             "An account with that email already exists."],
  [/(rate limit|too many requests|429)/i,  "Too many attempts. Please wait a moment and try again."],
];

// Network / transport
const NETWORK_PATTERNS = [
  [/failed to fetch|networkerror|network request failed/i, "You appear to be offline. Check your connection and try again."],
  [/(abort|timeout|etimedout)/i,                            "That request timed out. Please try again."],
  [/(econnrefused|enotfound|econnreset)/i,                  "We couldn't reach the server. Please try again shortly."],
];

// HTTP status -> sentence
const HTTP_STATUS = {
  400: "That request wasn't valid.",
  401: "Please log in to continue.",
  403: "You don't have permission to view this.",
  404: "We couldn't find what you were looking for.",
  409: "That conflicts with something that already exists.",
  413: "That file is too large.",
  422: "Some of the information sent wasn't accepted.",
  429: "Too many requests. Please wait a moment and try again.",
  500: GENERIC,
  502: "The server is having a moment. Please try again shortly.",
  503: "ScoutIt is briefly unavailable. Please try again in a minute.",
  504: "That took too long. Please try again.",
};

/**
 * Converts any thrown value into a client-safe, human-readable message.
 *
 * Pass `fallback` at call sites that already had a good contextual message
 * (e.g. "Couldn't save the event."). A recognised error still wins -- an
 * expired session should say so rather than blaming the save -- but an
 * unrecognised one keeps your specific wording instead of the bare generic.
 *
 * @param {unknown} error - an Error, a Supabase error object, a string, or anything
 * @param {string} [fallback] - contextual message used when nothing matches
 * @returns {string} a message safe to render to a user
 */
export function sanitizeError(error, fallback = GENERIC) {
  if (!error) return fallback;

  const code = typeof error === "object" ? error.code : null;
  const status = typeof error === "object" ? (error.status ?? error.statusCode) : null;
  const raw = typeof error === "string" ? error : (error?.message || "");

  if (code && PG_CODES[code]) return PG_CODES[code];
  if (code && POSTGREST_CODES[code]) return POSTGREST_CODES[code];

  for (const [pattern, message] of AUTH_PATTERNS) {
    if (pattern.test(raw)) return message;
  }
  for (const [pattern, message] of NETWORK_PATTERNS) {
    if (pattern.test(raw)) return message;
  }

  if (status && HTTP_STATUS[status]) return HTTP_STATUS[status];

  // Unrecognised. Never echo the raw message -- it can carry table names,
  // column names, or a connection string.
  return fallback;
}

/**
 * Short uppercase code for the recovery card, so a user can quote something
 * useful in a support message without us leaking internals.
 *
 * @param {unknown} error
 * @returns {string}
 */
export function errorReference(error) {
  const digest = typeof error === "object" ? (error?.digest || error?.code) : null;
  if (digest) return String(digest).slice(0, 12).toUpperCase();
  return "UNKNOWN";
}

export default sanitizeError;
