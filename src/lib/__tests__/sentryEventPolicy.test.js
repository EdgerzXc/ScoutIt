import { describe, expect, it } from "vitest";
import {
  isExpectedNodeRequestAbort,
  isLocalSentryEvent,
  isLocalSentryUrl,
  sanitizeSentryEvent,
  sentryPrivacyOptions,
  shouldEnableSentry,
} from "@/lib/sentryEventPolicy";

describe("Sentry server event policy", () => {
  it("recognizes the exact Node request-disconnect exception", () => {
    const error = new Error("aborted");
    error.stack = "Error: aborted\n at abortIncoming (node:_http_server:855:19)";
    expect(isExpectedNodeRequestAbort({}, { originalException: error })).toBe(true);
  });

  it("recognizes the same signature from normalized Sentry frames", () => {
    const event = {
      exception: {
        values: [{
          value: "aborted",
          stacktrace: {
            frames: [{ filename: "node:_http_server", function: "abortIncoming" }],
          },
        }],
      },
    };
    expect(isExpectedNodeRequestAbort(event)).toBe(true);
  });

  it("recognizes a Next renderer destination closed by the requesting client", () => {
    const error = new Error("The destination stream closed early.");
    error.stack = [
      "Error: The destination stream closed early.",
      " at PassThrough.<anonymous> (node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:11:1)",
      " at emitCloseNT (node:internal/streams/destroy:148:8)",
    ].join("\n");

    expect(isExpectedNodeRequestAbort({}, { originalException: error })).toBe(true);
  });

  it("recognizes the destination-close signature from normalized Sentry frames", () => {
    const event = {
      exception: {
        values: [{
          value: "The destination stream closed early.",
          stacktrace: {
            frames: [
              { filename: "node:internal/streams/destroy", function: "emitCloseNT" },
              {
                filename: "node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",
                function: "PassThrough",
              },
            ],
          },
        }],
      },
    };

    expect(isExpectedNodeRequestAbort(event)).toBe(true);
  });

  it("does not suppress an application error that copies the destination-close text", () => {
    const error = new Error("The destination stream closed early.");
    error.stack = "Error: The destination stream closed early.\n at renderProfile (src/app/profile/page.js:10:2)";

    expect(isExpectedNodeRequestAbort({}, { originalException: error })).toBe(false);
  });

  it("does not suppress application errors that merely use the word aborted", () => {
    const error = new Error("aborted");
    error.stack = "Error: aborted\n at submitInquiry (src/app/api/inquiries/route.js:10:2)";
    expect(isExpectedNodeRequestAbort({}, { originalException: error })).toBe(false);
    expect(isExpectedNodeRequestAbort({}, { originalException: new Error("fetch failed") })).toBe(false);
  });

  it("disables telemetry in E2E production builds but keeps real production enabled", () => {
    expect(shouldEnableSentry({ nodeEnv: "production", e2eFlag: "1" })).toBe(false);
    expect(shouldEnableSentry({ nodeEnv: "production", e2eFlag: undefined })).toBe(true);
    expect(shouldEnableSentry({ nodeEnv: "development", e2eFlag: undefined })).toBe(false);
  });

  it("suppresses localhost test origins without suppressing live ScoutIt errors", () => {
    for (const url of [
      "http://localhost:3817/error-probe-local",
      "http://127.0.0.1:3000/",
      "http://[::1]:3000/",
      "http://dev.localhost:3817/",
    ]) {
      expect(isLocalSentryUrl(url), url).toBe(true);
      expect(isLocalSentryEvent({ request: { url } }), url).toBe(true);
    }
    expect(isLocalSentryUrl("https://www.scoutit.space/")).toBe(false);
    expect(isLocalSentryEvent({ request: { url: "https://www.scoutit.space/" } })).toBe(false);
    expect(isLocalSentryUrl("https://www.scoutit.space/?next=localhost")).toBe(false);
    expect(isLocalSentryEvent({})).toBe(false);
  });
});

describe("Sentry telemetry data minimization", () => {
  it("drops request data and redacts private links in errors and captured navigation", () => {
    const event = sanitizeSentryEvent({
      request: {
        method: "GET",
        url: "https://scoutit.space/claim/private-claim?email=private-email#recovery-fragment",
        headers: { "X-Account": "private-header" },
        cookies: { scout_did: "private-cookie" },
        data: "private-body",
        query_string: "email=private-query",
      },
      user: { id: "opaque-id", email: "private-user" },
      transaction: "GET /claim/private-transaction?code=private-code",
      message: "Could not open https://scoutit.space/wishlist/shared/private-message?email=private-query",
      contexts: {
        nextjs: { request_path: "/claim/private-provider?source=private-query", router_path: "/claim/[token]" },
        scoutit_report: { page_path: "/wishlist/shared/private-context" },
      },
      breadcrumbs: [
        { category: "console", message: "private-console" },
        { category: "ui.click", message: "private-dom-label" },
        { category: "navigation", data: { from: "/reset-password#private-fragment", to: "/wishlist/shared/private-board?ref=private-query" } },
      ],
      exception: {
        values: [{
          value: "Unable to load /property/tower/via/private-attribution",
          stacktrace: { frames: [{ filename: "https://scoutit.space/_next/chunk.js?token=private-source", lineno: 2 }] },
        }],
      },
    });
    expect(event.request).toEqual({ method: "GET", url: "https://scoutit.space/claim/[redacted]" });
    expect(event.user).toEqual({ id: "opaque-id" });
    expect(event.transaction).toBe("GET /claim/[redacted]");
    expect(event.contexts).toEqual({
      nextjs: { request_path: "/claim/[redacted]", router_path: "/claim/[redacted]" },
      scoutit_report: { page_path: "/wishlist/shared/[redacted]" },
    });
    expect(event.breadcrumbs).toEqual([
      { category: "navigation", data: { from: "/reset-password", to: "/wishlist/shared/[redacted]" } },
    ]);
    expect(event.exception.values[0]).toMatchObject({
      value: "Unable to load /property/tower/via/[redacted]",
      stacktrace: { frames: [{ filename: "https://scoutit.space/_next/chunk.js", lineno: 2 }] },
    });
    expect(JSON.stringify(event)).not.toContain("private-");
  });

  it("filters span attributes before transport and preserves route and status diagnostics", () => {
    const span = sentryPrivacyOptions.beforeSendSpan({
      description: "GET https://public.example.test/wishlist/shared/board-secret?search=query-secret",
      data: {
        "url.full": "https://public.example.test/wishlist/shared/board-secret?search=query-secret",
        "url.query": "query-secret",
        "url.fragment": "fragment-secret",
        "http.response.header.set-cookie": "cookie-secret",
        "http.request.body.data": "body-secret",
        "http.response.status_code": 403,
      },
    });
    expect(span).toEqual({
      description: "GET https://public.example.test/wishlist/shared/[redacted]",
      data: {
        "url.full": "https://public.example.test/wishlist/shared/[redacted]",
        "http.response.status_code": 403,
      },
    });
    expect(sentryPrivacyOptions.beforeSendTransaction({
      contexts: { trace: { data: { "url.query": "query-secret", "http.route": "/discover?q=query-secret" } } },
    }).contexts.trace.data).toEqual({ "http.route": "/discover" });
    expect(sentryPrivacyOptions.dataCollection).toMatchObject({
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      stackFrameVariables: false,
    });
  });
});
