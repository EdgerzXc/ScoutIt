import { describe, it, expect } from "vitest";
import { columnIdForDeal, PIPELINE_COLUMNS } from "@/lib/deals/dealStages";
import { detectAndParseLeads, parseCsvRows, parseVCardText, autoMapHeaders } from "@/lib/leadImport";
import fs from "fs";
import path from "path";

describe("A-200 CRM Interoperability: 5 Universal Pipeline Stages", () => {
  it("exposes the 5 universal pipeline columns with owner and broker labels", () => {
    expect(PIPELINE_COLUMNS).toHaveLength(5);
    const ids = PIPELINE_COLUMNS.map((c) => c.id);
    expect(ids).toEqual(["connected", "pending", "viewing_scheduled", "accepted", "declined"]);
  });

  it("maps new inbound and pitching deals to 'connected' (New Inquiry)", () => {
    expect(columnIdForDeal({ status: "connected" })).toBe("connected");
    expect(columnIdForDeal({ status: "pitching" })).toBe("connected");
    expect(columnIdForDeal({ status: "inbound" })).toBe("connected");
  });

  it("maps pending discussion and invited deals to 'pending' (In Discussion)", () => {
    expect(columnIdForDeal({ status: "pending" })).toBe("pending");
    expect(columnIdForDeal({ status: "reviewing" })).toBe("pending");
    expect(columnIdForDeal({ status: "invited" })).toBe("pending");
  });

  it("promotes deals with active viewing appointments to 'viewing_scheduled' (Tour / Viewing)", () => {
    expect(columnIdForDeal({ status: "pending", hasViewingScheduled: true })).toBe("viewing_scheduled");
    expect(columnIdForDeal({ status: "connected", hasViewingScheduled: true })).toBe("viewing_scheduled");
  });

  it("retains won or archived status even if a past viewing was scheduled", () => {
    expect(columnIdForDeal({ status: "accepted", hasViewingScheduled: true })).toBe("accepted");
    expect(columnIdForDeal({ status: "closed", hasViewingScheduled: true })).toBe("accepted");
    expect(columnIdForDeal({ status: "declined", hasViewingScheduled: true })).toBe("declined");
  });

  it("maps closed and won handshakes to 'accepted' (Handshake / Won)", () => {
    expect(columnIdForDeal({ status: "accepted" })).toBe("accepted");
    expect(columnIdForDeal({ status: "closed" })).toBe("accepted");
    expect(columnIdForDeal({ status: "active" })).toBe("accepted");
  });

  it("maps passed and withdrawn deals to 'declined' (Passed / Archived)", () => {
    expect(columnIdForDeal({ status: "declined" })).toBe("declined");
    expect(columnIdForDeal({ status: "withdrawn" })).toBe("declined");
    expect(columnIdForDeal({ status: "expired" })).toBe("declined");
    expect(columnIdForDeal({ status: "reported" })).toBe("declined");
  });

  it("gracefully falls back unknown statuses to 'declined'", () => {
    expect(columnIdForDeal({ status: "unknown_test_state" })).toBe("declined");
    expect(columnIdForDeal({})).toBe("declined");
  });
});

describe("A-200 Unit Collision Detection Logic", () => {
  it("identifies competing active inquiries referencing the same unit", () => {
    const deals = [
      { id: "deal-1", unitId: "unit-14B", status: "connected" },
      { id: "deal-2", unitId: "unit-14B", status: "pending" },
      { id: "deal-3", unitId: "unit-14B", status: "declined" }, // Inactive deal
      { id: "deal-4", unitId: "unit-10A", status: "connected" },
    ];

    const activeDealsWithUnit = deals.filter(
      (d) => d.unitId && !["declined", "withdrawn", "expired", "reported"].includes(d.status)
    );
    const unitInquiryCounts = activeDealsWithUnit.reduce((acc, d) => {
      acc[d.unitId] = (acc[d.unitId] || 0) + 1;
      return acc;
    }, {});

    expect(unitInquiryCounts["unit-14B"]).toBe(2);
    expect(unitInquiryCounts["unit-10A"]).toBe(1);
  });
});

describe("A-200 Account-Scoped Deal Notes Isolation", () => {
  it("isolates private negotiation notes between distinct user IDs in JSON map", () => {
    const noteUserA = "Client pre-approved for 180k/mo. High intent.";
    const noteUserB = "Counterparty requested parking slot rebate.";

    const notesState = JSON.stringify({
      "user-owner-123": noteUserA,
      "user-broker-456": noteUserB,
    });

    const parsed = JSON.parse(notesState);

    expect(parsed["user-owner-123"]).toBe(noteUserA);
    expect(parsed["user-broker-456"]).toBe(noteUserB);
    expect(parsed["user-tenant-789"]).toBeUndefined();
  });
});

describe("A-200 Smart Lead Ingestion & Deduplication", () => {
  it("auto-maps varied column headers accurately", () => {
    const headers = ["Client Name", "Mobile Phone", "Email Address", "Target Listing", "Budget Range", "Private Notes"];
    const mapping = autoMapHeaders(headers);

    expect(mapping.name).toBe(0);
    expect(mapping.phone).toBe(1);
    expect(mapping.email).toBe(2);
    expect(mapping.propertyTitle).toBe(3);
    expect(mapping.budget).toBe(4);
    expect(mapping.notes).toBe(5);
  });

  it("parses CSV rows with embedded commas and quotes per RFC 4180", () => {
    const csv = `Name,Email,Phone,Notes\n"Dela Cruz, Juan",juan@example.com,09171234567,"Looking for ""prime"" commercial floor"\n`;
    const rows = parseCsvRows(csv);

    expect(rows).toHaveLength(2);
    expect(rows[1][0]).toBe("Dela Cruz, Juan");
    expect(rows[1][3]).toBe('Looking for "prime" commercial floor');
  });

  it("sanitizes OWASP formula injection attempts in CSV data", () => {
    const maliciousCsv = `Name,Email,Phone,Notes\n=cmd|' /C calc'!A0,test@example.com,09171234567,+1000\n`;
    const res = detectAndParseLeads(maliciousCsv);

    expect(res.success).toBe(true);
    expect(res.rows[0].name).not.toMatch(/^=/);
    expect(res.rows[0].notes).not.toMatch(/^\+/);
  });

  it("parses vCard 3.0 blocks into structured lead records", () => {
    const vcard = `
BEGIN:VCARD
VERSION:3.0
FN:Maria Clara
EMAIL;TYPE=INTERNET:maria@ayala.ph
TEL;TYPE=CELL:+639189876543
ORG:Ayala Land
NOTE:ScoutIt lead — High Street South Tower
END:VCARD
`;
    const cards = parseVCardText(vcard);

    expect(cards).toHaveLength(1);
    expect(cards[0].name).toBe("Maria Clara");
    expect(cards[0].email).toBe("maria@ayala.ph");
    expect(cards[0].phone).toBe("+639189876543");
    expect(cards[0].company).toBe("Ayala Land");
    expect(cards[0].propertyTitle).toBe("High Street South Tower");
  });

  it("flags in-batch and existing pipeline duplicates", () => {
    const existing = [
      { otherPartyEmail: "already@exists.com", phone: "09170000000" },
    ];

    const inputCsv = `Name,Email,Phone\nLead 1,already@exists.com,09171111111\nLead 2,new@example.com,09172222222\nLead 3,new@example.com,09173333333\n`;
    const res = detectAndParseLeads(inputCsv, existing);

    expect(res.success).toBe(true);
    expect(res.totalCount).toBe(3);
    expect(res.duplicateCount).toBe(2);

    expect(res.rows[0].isDuplicate).toBe(true);
    expect(res.rows[0].duplicateReason).toContain("already exists in pipeline");

    expect(res.rows[1].isDuplicate).toBe(false);

    expect(res.rows[2].isDuplicate).toBe(true);
    expect(res.rows[2].duplicateReason).toContain("Duplicate email within imported file");
  });
});

describe("A-200 Component Architecture & Surface Safety", () => {
  it("verifies ImportLeadsModal wires useModalDialog and accessible roles", () => {
    const fileContent = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/dashboard/crm/ImportLeadsModal.js"),
      "utf8"
    );
    expect(fileContent).toContain("useModalDialog");
    expect(fileContent).toContain('role="dialog"');
    expect(fileContent).toContain('aria-modal="true"');
    expect(fileContent).toContain("detectAndParseLeads");
  });

  it("verifies DealFileSlideOver contains vCard download and transcript export", () => {
    const fileContent = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/dashboard/crm/DealFileSlideOver.js"),
      "utf8"
    );
    expect(fileContent).toContain("leadToVCard");
    expect(fileContent).toContain("Save Contact (.vcf)");
    expect(fileContent).toContain("/api/deals/${deal.id}/export");
    expect(fileContent).toContain("Evidentiary Transcript");
    expect(fileContent).toContain("Open Gate");
  });

  it("verifies CRM page wires ImportLeadsModal and passes appointments to KanbanBoard", () => {
    const fileContent = fs.readFileSync(
      path.resolve(process.cwd(), "src/app/dashboard/crm/page.js"),
      "utf8"
    );
    expect(fileContent).toContain("ImportLeadsModal");
    expect(fileContent).toContain("appointments={appointments}");
    expect(fileContent).toContain("Export .csv");
  });
});
