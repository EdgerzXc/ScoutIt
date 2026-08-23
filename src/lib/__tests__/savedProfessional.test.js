import { describe, expect, it } from "vitest";
import { validateSavedProfessional } from "../savedProfessional";

describe("saved professional input", () => {
  it("accepts a category only with its authoritative source", () => {
    expect(validateSavedProfessional({ professionalKey: "airtable:broker:1", category: "broker", source: "airtable" }).value).toBeTruthy();
    expect(validateSavedProfessional({ professionalKey: "x", category: "photographer", source: "airtable" }).error).toBeTruthy();
  });

  it("rejects unknown, empty, and oversized keys", () => {
    expect(validateSavedProfessional({ professionalKey: "", category: "broker", source: "airtable" }).error).toBeTruthy();
    expect(validateSavedProfessional({ professionalKey: "x".repeat(241), category: "broker", source: "airtable" }).error).toBeTruthy();
    expect(validateSavedProfessional({ professionalKey: "x", category: "future", source: "supabase" }).error).toBeTruthy();
  });
});
