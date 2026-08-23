import { describe, expect, it } from "vitest";
import {
  PROFESSIONAL_CATEGORIES,
  activitySignal,
  directoryFacets,
  filterAndSortProfessionals,
  normalizeAirtableBroker,
  normalizeSupabaseProfessional,
} from "../professionalDirectory";

describe("professional directory truth contract", () => {
  it("keeps missing evidence and activity absent", () => {
    const record = normalizeAirtableBroker({ id: "br-1", name: "A. Advisor" });
    expect(record.credentials).toEqual([]);
    expect(record.accomplishments).toEqual([]);
    expect(record.availability).toBeNull();
    expect(record.activity).toBeNull();
  });

  it("uses stable source identifiers for canonical routes", () => {
    expect(normalizeAirtableBroker({ id: "br-1", name: "A" }).canonicalPath).toBe("/brokers/br-1");
    expect(normalizeSupabaseProfessional({ id: "user-1", display_name: "A" }, "photographer").canonicalPath).toBe("/profile/user-1");
  });

  it("does not treat missing availability as available", () => {
    const missing = normalizeSupabaseProfessional({ id: "u1", display_name: "A" }, "researcher");
    const declared = normalizeSupabaseProfessional({ id: "u2", display_name: "B", provider_availability: true }, "researcher");
    expect(missing.availability).toBeNull();
    expect(declared.availability).toEqual({ available: true, source: "Owner-declared availability" });
  });

  it("admits only known traceable badge grants", () => {
    const record = normalizeSupabaseProfessional({
      id: "u1",
      display_name: "A",
      badges: [{ id: "pioneer", minted_at: "2026-08-01T00:00:00Z" }, { id: "invented_badge" }],
    }, "photographer");
    expect(record.badges).toEqual([{ id: "pioneer", label: "The Pioneer", minted_at: "2026-08-01T00:00:00Z", source: "ScoutIt badge grant" }]);
  });

  it("only emits named, sourced, fresh activity", () => {
    const now = new Date("2026-08-23T00:00:00.000Z");
    expect(activitySignal({ label: "Responded recently", observedAt: "2026-08-10", source: "Inquiry response log" }, now)).not.toBeNull();
    expect(activitySignal({ label: "Online", observedAt: "2026-01-01", source: "Browser" }, now)).toBeNull();
    expect(activitySignal({ label: "Online", observedAt: "2026-08-20" }, now)).toBeNull();
  });

  it("derives facets and filters without hard-coded future-category choices", () => {
    const rows = [
      normalizeSupabaseProfessional({ id: "1", display_name: "Zed", service: "Drone", location: "Cebu" }, "photographer"),
      normalizeSupabaseProfessional({ id: "2", display_name: "Ana", service: "Interior", location: "Makati", provider_availability: true }, "photographer"),
    ];
    expect(directoryFacets(rows)).toEqual({ specialties: ["Drone", "Interior"], locations: ["Cebu", "Makati"] });
    expect(filterAndSortProfessionals(rows, { query: "interior" }).map((row) => row.name)).toEqual(["Ana"]);
    expect(filterAndSortProfessionals(rows, { sort: "availability" })[0].name).toBe("Ana");
    expect(PROFESSIONAL_CATEGORIES.event_planner.source).toBe("supabase");
  });
});
