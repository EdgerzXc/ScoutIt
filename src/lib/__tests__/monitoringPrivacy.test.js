import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("human-pilot monitoring privacy", () => {
  it("keeps Sentry error telemetry but disables browser session replay", () => {
    const client = source("instrumentation-client.js");

    expect(client).toContain("dsn: process.env.NEXT_PUBLIC_SENTRY_DSN");
    expect(client).toContain("replaysSessionSampleRate: 0");
    expect(client).toContain("replaysOnErrorSampleRate: 0");
    expect(client).not.toContain("Sentry.replayIntegration(");
  });

  it("does not opt into default PII and limits trace sampling in every runtime", () => {
    for (const file of [
      "instrumentation-client.js",
      "sentry.server.config.js",
      "sentry.edge.config.js",
    ]) {
      const config = source(file);
      expect(config).toContain("sendDefaultPii: false");
      expect(config).toContain("tracesSampleRate: 0.1");
      expect(config).not.toContain("tracesSampleRate: 1");
    }
  });

  it("uses the Next.js 16 client and server instrumentation conventions", () => {
    const client = source("instrumentation-client.js");
    const server = source("instrumentation.js");

    expect(client).toContain("Sentry.captureRouterTransitionStart");
    expect(server).toContain('process.env.NEXT_RUNTIME === "nodejs"');
    expect(server).toContain('process.env.NEXT_RUNTIME === "edge"');
    expect(server).toContain("Sentry.captureRequestError");
  });
  it("keeps development and E2E runs out of Sentry and drops only known request disconnects", () => {
    const client = source("instrumentation-client.js");
    expect(client).toContain('process.env.NODE_ENV === "production"');
    expect(client).toContain('process.env.NEXT_PUBLIC_SCOUTIT_E2E !== "1"');

    for (const file of [
      "sentry.server.config.js",
      "sentry.edge.config.js",
    ]) {
      expect(source(file), file).toContain("enabled: shouldEnableSentry()");
    }

    const policy = source("src/lib/sentryEventPolicy.js");
    expect(policy).toContain("process.env.SCOUTIT_E2E");
    expect(policy).toContain("The destination stream closed early.");

    const server = source("sentry.server.config.js");
    expect(server).toContain("isExpectedNodeRequestAbort");
    expect(server).toContain("return isExpectedNodeRequestAbort(event, hint) ? null : event");
  });
});