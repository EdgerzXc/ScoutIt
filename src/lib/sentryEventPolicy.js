const PRIVATE_ROUTE_SEGMENT = /^(\/(?:claim|wishlist\/shared|property\/[^/]+\/via)\/)[^/]+/i;
const LOCATION_TEXT = /https?:\/\/[^\s<>"'`]+|(^|[\s(])\/[^\s<>"'`]+/gi;
const URL_ATTRIBUTES = ["url", "url.full", "url.path", "http.url", "http.target", "http.route"];
const PRIVATE_HTTP_ATTRIBUTE = /^(?:url\.(?:query|fragment)$|http\.(?:request|response)\.(?:headers?|body)(?:\.|$))/i;

function sanitizeLocation(value) {
  if (typeof value !== "string") return value;
  if (value.startsWith("/") && !value.startsWith("//")) {
    return value.split(/[?#]/, 1)[0].replace(PRIVATE_ROUTE_SEGMENT, "$1[redacted]");
  }
  try {
    const url = new URL(value, "https://scoutit.space");
    const path = url.pathname.replace(PRIVATE_ROUTE_SEGMENT, "$1[redacted]");
    return value.startsWith("//") || /^https?:/i.test(value) ? url.origin + path : value.split(/[?#]/, 1)[0];
  } catch {
    return value.split(/[?#]/, 1)[0];
  }
}

function sanitizeLocationText(value) {
  return typeof value === "string"
    ? value.replace(LOCATION_TEXT, (match, prefix = "") => prefix + sanitizeLocation(match.slice(prefix.length)))
    : value;
}

function sanitizeLocationFields(target, keys) {
  for (const key of keys) {
    if (typeof target?.[key] === "string") target[key] = sanitizeLocation(target[key]);
  }
}

function sanitizeTraceAttributes(attributes) {
  if (!attributes) return;
  sanitizeLocationFields(attributes, URL_ATTRIBUTES);
  for (const key of Object.keys(attributes)) {
    if (PRIVATE_HTTP_ATTRIBUTE.test(key)) delete attributes[key];
  }
}

function sanitizeBreadcrumb(breadcrumb) {
  if (["console", "ui.click", "ui.input"].includes(breadcrumb.category)) return null;
  sanitizeLocationFields(breadcrumb.data, ["url", "from", "to"]);
  if (breadcrumb.message) breadcrumb.message = sanitizeLocationText(breadcrumb.message);
  return breadcrumb;
}

function sanitizeSentrySpan(span) {
  if (span.description) span.description = sanitizeLocationText(span.description);
  sanitizeTraceAttributes(span.data);
  return span;
}

export function sanitizeSentryEvent(event) {
  if (event.request) {
    const { method, url } = event.request;
    event.request = { method, url: sanitizeLocation(url) };
  }
  if (event.user) event.user = event.user.id ? { id: event.user.id } : undefined;
  if (event.transaction) event.transaction = sanitizeLocationText(event.transaction);
  if (event.message) event.message = sanitizeLocationText(event.message);
  if (event.logentry?.message) event.logentry.message = sanitizeLocationText(event.logentry.message);
  if (event.logentry?.formatted) event.logentry.formatted = sanitizeLocationText(event.logentry.formatted);
  if (event.breadcrumbs) event.breadcrumbs = event.breadcrumbs.map(sanitizeBreadcrumb).filter(Boolean);

  sanitizeLocationFields(event.contexts?.nextjs, ["request_path", "router_path"]);
  sanitizeLocationFields(event.contexts?.scoutit_report, ["page_path"]);
  sanitizeTraceAttributes(event.contexts?.trace?.data);
  for (const exception of event.exception?.values || []) {
    if (exception.value) exception.value = sanitizeLocationText(exception.value);
    for (const frame of exception.stacktrace?.frames || []) {
      sanitizeLocationFields(frame, ["filename", "abs_path"]);
    }
  }
  return event;
}

export const sentryPrivacyOptions = {
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    graphQL: { document: false, variables: false },
    genAI: { inputs: false, outputs: false },
    databaseQueryData: false,
    stackFrameVariables: false,
    frameContextLines: 0,
  },
  beforeBreadcrumb: sanitizeBreadcrumb,
  beforeSendTransaction: sanitizeSentryEvent,
  beforeSendSpan: sanitizeSentrySpan,
};

export function shouldEnableSentry({
  nodeEnv = process.env.NODE_ENV,
  e2eFlag = process.env.SCOUTIT_E2E || process.env.NEXT_PUBLIC_SCOUTIT_E2E,
} = {}) {
  return nodeEnv === "production" && e2eFlag !== "1";
}

export function isLocalSentryUrl(value) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === "localhost"
      || hostname.endsWith(".localhost")
      || hostname === "127.0.0.1"
      || hostname === "[::1]";
  } catch {
    return false;
  }
}

export function isLocalSentryEvent(event) {
  return isLocalSentryUrl(event?.request?.url);
}

export function isExpectedNodeRequestAbort(event = {}, hint = {}) {
  const original = hint?.originalException;
  const message = original instanceof Error
    ? original.message
    : event.exception?.values?.[0]?.value;
  const isLegacyNodeAbort = message === "aborted";
  const isDestinationClosed = message === "The destination stream closed early.";

  const originalStack = original instanceof Error ? original.stack || "" : "";
  const frames = event.exception?.values?.[0]?.stacktrace?.frames || [];
  const isNodeAbortFrame = frames.some(
    (frame) => frame.filename?.includes("node:_http_server")
      && frame.function === "abortIncoming",
  );
  const hasLegacyNodeAbortSignature = (
    originalStack.includes("node:_http_server")
      && originalStack.includes("abortIncoming")
  ) || isNodeAbortFrame;

  const hasNextStreamFrame = frames.some(
    (frame) => frame.filename?.includes("next-server/app-page")
      || frame.filename?.includes("next-server\\app-page"),
  );
  const hasNodeStreamFrame = frames.some(
    (frame) => frame.filename?.includes("node:internal/streams")
      || frame.function === "PassThrough",
  );
  const hasDestinationCloseSignature = (
    originalStack.includes("next-server")
      && originalStack.includes("app-page")
      && (
        originalStack.includes("node:internal/streams")
        || originalStack.includes("PassThrough")
      )
  ) || (hasNextStreamFrame && hasNodeStreamFrame);

  return (isLegacyNodeAbort && hasLegacyNodeAbortSignature)
    || (isDestinationClosed && hasDestinationCloseSignature);
}
