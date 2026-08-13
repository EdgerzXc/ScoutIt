import { describe, expect, it } from "vitest";
import {
  isExpectedNodeRequestAbort,
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
});
