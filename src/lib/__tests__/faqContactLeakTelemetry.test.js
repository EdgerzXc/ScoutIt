import { describe, expect, it, vi } from "vitest";
import {
  buildFaqContactLeakTelemetry,
  recordFaqContactLeakTelemetry,
} from "../faqContactLeakTelemetry.js";

describe("FAQ contact-leak telemetry", () => {
  it("records only rule code and controlled context", () => {
    const payload = buildFaqContactLeakTelemetry(
      "ph_mobile",
      "public_answer",
      "2026-08-11T10:00:00.000Z",
    );

    expect(payload.route_accessed).toBe("FRICTION:faq_contact_leak:public_answer:ph_mobile");
    expect(payload.flag_reason).toBe("FAQ contact-leak filter blocked a submission");
    expect(payload).not.toHaveProperty("answer_text");
    expect(payload).not.toHaveProperty("question_text");
    expect(payload).not.toHaveProperty("blocked_text");
    expect(JSON.stringify(payload)).not.toMatch(/0917|email@example/i);
  });

  it("rejects arbitrary rule codes and contexts", () => {
    expect(buildFaqContactLeakTelemetry("raw-user-text", "public_answer")).toBeNull();
    expect(buildFaqContactLeakTelemetry("email", "property-secret-slug")).toBeNull();
  });

  it("writes through the existing security telemetry table", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const database = { from: vi.fn().mockReturnValue({ insert }) };

    await expect(recordFaqContactLeakTelemetry(database, {
      ruleCode: "external_link",
      context: "public_question",
    })).resolves.toBe(true);
    expect(database.from).toHaveBeenCalledWith("security_access_logs");
    expect(insert).toHaveBeenCalledTimes(1);
  });
});
