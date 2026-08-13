export function shouldEnableSentry({
  nodeEnv = process.env.NODE_ENV,
  e2eFlag = process.env.SCOUTIT_E2E || process.env.NEXT_PUBLIC_SCOUTIT_E2E,
} = {}) {
  return nodeEnv === "production" && e2eFlag !== "1";
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
