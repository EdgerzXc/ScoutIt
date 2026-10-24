import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  contactKey,
  contactRowFromInput,
  contactToPipelineCard,
  mergeContactFields,
  normaliseImportStage,
  planContactMerge,
} from "@/lib/crmContactMerge";
import { leadsToCsv, normaliseLead } from "@/lib/leadExport";

const ROUTE = "src/app/api/crm/contacts/route.js";
const path = () => resolve(process.cwd(), ROUTE);
// Comments are stripped before asserting, so a rule described in prose can
// never satisfy a check the code is supposed to satisfy.
const readCode = () =>
  readFileSync(path(), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

// ─────────────────────────────────────────────────────────────────────────
// A-234. The CRM lead import had three failures that all looked like one
// success message:
//
//   1. The write used PostgREST's onConflict against a table whose
//      uniqueness is a partial EXPRESSION index
//      (owner_user_id, lower(email)) WHERE email IS NOT NULL. PostgreSQL
//      answered 42P10 and the batch was lost.
//   2. The rows that appeared on the board existed only in the browser tab.
//   3. The export read a different set of keys than the import wrote, so an
//      imported lead exported without a name, a number or an address.
// ─────────────────────────────────────────────────────────────────────────

describe("A-234 CRM contact merge", () => {
  it("matches an existing contact case-insensitively", () => {
    const plan = planContactMerge(
      [{ id: "c1", email: "john@example.com", full_name: "John", phone: "+639171234567" }],
      [contactRowFromInput({ fullName: "John Doe", email: "John@Example.com" }, "owner-1")]
    );

    expect(plan).toHaveLength(1);
    expect(plan[0].action).toBe("update");
    expect(plan[0].existing.id).toBe("c1");
  });

  it("creates when the email is unknown", () => {
    const plan = planContactMerge([], [contactRowFromInput({ email: "new@example.com" }, "owner-1")]);
    expect(plan[0].action).toBe("create");
  });

  it("creates a contact that has no email, because the index excludes NULL emails", () => {
    const plan = planContactMerge([], [contactRowFromInput({ fullName: "Walk In", phone: "0917" }, "owner-1")]);
    expect(plan[0].action).toBe("create");
    expect(plan[0].row.email).toBeNull();
  });

  it("skips a duplicate inside one batch instead of writing it twice", () => {
    const plan = planContactMerge(
      [],
      [
        contactRowFromInput({ email: "dup@example.com" }, "owner-1"),
        contactRowFromInput({ email: "DUP@example.com" }, "owner-1"),
      ]
    );
    expect(plan.map((p) => p.action)).toEqual(["create", "skip"]);
  });

  it("keeps the stored values the imported file does not carry", () => {
    const merged = mergeContactFields(
      {
        full_name: "John Doe",
        email: "john@example.com",
        phone: "+639171234567",
        company_name: "Acme",
        contact_type: "buyer",
        source: "csv_import",
        requirements: { budget: 150000, notes: "called twice" },
      },
      {
        full_name: "John Doe",
        email: "john@example.com",
        phone: null,
        company_name: null,
        contact_type: "buyer",
        source: "csv_import",
        requirements: { budget: 150000 },
      }
    );

    expect(merged.phone).toBe("+639171234567");
    expect(merged.company_name).toBe("Acme");
    expect(merged.requirements.notes).toBe("called twice");
  });

  it("lets a value the file does carry replace the stored one", () => {
    const merged = mergeContactFields(
      { full_name: "John", phone: "+639170000000", requirements: {} },
      { full_name: "John Doe", phone: "+639171234567", requirements: { budget: 900000 } }
    );
    expect(merged.full_name).toBe("John Doe");
    expect(merged.phone).toBe("+639171234567");
    expect(merged.requirements.budget).toBe(900000);
  });

  it("never takes the owner of the record from the imported file", () => {
    const row = contactRowFromInput({ email: "x@example.com", owner_user_id: "someone-else" }, "owner-1");
    expect(row.owner_user_id).toBe("owner-1");
  });

  it("builds a match key only for a real address", () => {
    expect(contactKey(" John@Example.com ")).toBe("john@example.com");
    expect(contactKey("   ")).toBeNull();
    expect(contactKey(null)).toBeNull();
  });
  it("keeps the pipeline stage the spreadsheet carried", () => {
    // A-234: the stage used to be dropped on import, which put every lead in
    // New Inquiry no matter where the owner's own pipeline had it.
    expect(normaliseImportStage("closed")).toBe("closed");
    expect(normaliseImportStage("Accepted")).toBe("accepted");
    // A stage ScoutIt does not have is not invented.
    expect(normaliseImportStage("closed-won")).toBe("connected");
    expect(normaliseImportStage("")).toBe("connected");
    expect(normaliseImportStage(null)).toBe("connected");
  });

  it("carries the stage through to the pipeline card", () => {
    const row = contactRowFromInput({ name: "Juan", email: "juan@example.com", stage: "pending" }, "owner-1");
    expect(row.requirements.stage).toBe("pending");

    const card = contactToPipelineCard(
      { id: "abc", full_name: "Juan", source: "csv_import", requirements: { stage: "pending" } },
      "owner"
    );
    expect(card.status).toBe("pending");
  });
});

describe("A-234 imported lead card", () => {
  const contact = {
    id: "11111111-2222-3333-4444-555555555555",
    full_name: "Juan Dela Cruz",
    email: "juan@example.com",
    phone: "+639171234567",
    source: "csv_import",
    requirements: { budget: 150000, propertyTitle: "High Street South", notes: "wants 2BR" },
    created_at: "2026-10-01T00:00:00.000Z",
    updated_at: "2026-10-02T00:00:00.000Z",
  };

  it("can never be mistaken for a deal id", () => {
    const card = contactToPipelineCard(contact, "broker");
    expect(card.id).toBe("contact:11111111-2222-3333-4444-555555555555");
    expect(card.isImportedContact).toBe(true);
  });

  it("keeps the seeker's budget out of the listed-price field", () => {
    const card = contactToPipelineCard(contact, "owner");
    expect(card.budget).toBe(150000);
    // propertyPrice is what the pipeline-value KPI sums. A budget is not a
    // listed price, so it must never land there.
    expect(card.propertyPrice).toBeUndefined();
  });
});

describe("A-234 export parity", () => {
  it("exports the name, contact details and budget of an imported lead", () => {
    const card = contactToPipelineCard(
      {
        id: "abc",
        full_name: "Juan Dela Cruz",
        email: "juan@example.com",
        phone: "+639171234567",
        source: "csv_import",
        requirements: { budget: 150000, propertyTitle: "High Street South" },
      },
      "broker"
    );

    const row = normaliseLead(card);
    expect(row.name).toBe("Juan Dela Cruz");
    expect(row.email).toBe("juan@example.com");
    expect(row.phone).toBe("+639171234567");
    expect(row.budget).toBe(150000);
    expect(row.property).toBe("High Street South");

    const csv = leadsToCsv([card]);
    expect(csv).toContain("Juan Dela Cruz");
    expect(csv).toContain("juan@example.com");
    expect(csv).toContain("+639171234567");
    expect(csv).toContain("150000");
  });

  it("still reads a platform deal row in its own shape", () => {
    const row = normaliseLead({
      otherParty: "Maria Santos",
      propertyTitle: "Some Tower",
      status: "connected",
      lastMessage: "Interested in a viewing",
      createdAt: "2026-10-01T00:00:00.000Z",
    });
    expect(row.name).toBe("Maria Santos");
    expect(row.property).toBe("Some Tower");
    expect(row.message).toBe("Interested in a viewing");
    expect(row.source).toBe("ScoutIt");
  });
});

describe("A-234 CRM contacts route", () => {
  it("exists at all", () => {
    expect(existsSync(path())).toBe(true);
  });

  it("never asks PostgREST to upsert against the expression index", () => {
    // This is the 42P10: PostgreSQL has no unique constraint matching
    // (owner_user_id, email) because the real index is on lower(email).
    const code = readCode();
    expect(code).not.toContain("onConflict");
    expect(code).not.toMatch(/\.upsert\(/);
  });

  it("plans the merge before it writes", () => {
    const code = readCode();
    expect(code).toContain("planContactMerge");
    expect(code).toContain("mergeContactFields");
  });

  it("does not report success when nothing was written", () => {
    const code = readCode();
    expect(code).toMatch(/saved === 0[\s\S]{0,400}500/);
  });
});
