import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
  parseShorthandNumber, 
  matchFieldFromQuery, 
  parseHeuristicUpdates, 
  formatPhp,
  SYNONYM_MAP 
} from "@/lib/propertyUpdateParser";
import { POST as intentPost } from "@/app/api/properties/updates/intent/route";

vi.mock("@/lib/serverAuth", () => ({
  resolveUserId: vi.fn(),
}));

describe("PropertyUpdateHub - Shorthand & Synonym Parser", () => {
  it("correctly parses shorthand currency formats into numbers", () => {
    expect(parseShorthandNumber("45k")).toBe(45000);
    expect(parseShorthandNumber("45K")).toBe(45000);
    expect(parseShorthandNumber("1.5m")).toBe(1500000);
    expect(parseShorthandNumber("1.5M")).toBe(1500000);
    expect(parseShorthandNumber("₱45,000")).toBe(45000);
    expect(parseShorthandNumber("Php 55,000")).toBe(55000);
    expect(parseShorthandNumber("45000")).toBe(45000);
    expect(parseShorthandNumber("")).toBeNull();
    expect(parseShorthandNumber("abc")).toBeNull();
  });

  it("formats numbers into clean Philippine Peso display", () => {
    expect(formatPhp(45000)).toBe("₱45,000");
    expect(formatPhp(1500000)).toBe("₱1,500,000");
    expect(formatPhp(0)).toBe("₱0");
    expect(formatPhp(null)).toBe("₱0");
  });

  it("matches natural real estate synonyms to internal schema fields", () => {
    expect(matchFieldFromQuery("rent")).toBe("price_php");
    expect(matchFieldFromQuery("rent:")).toBe("price_php");
    expect(matchFieldFromQuery("arkila")).toBe("price_php");
    expect(matchFieldFromQuery("arkila:")).toBe("price_php");
    expect(matchFieldFromQuery("parking")).toBe("parking_slots");
    expect(matchFieldFromQuery("parking:")).toBe("parking_slots");
    expect(matchFieldFromQuery("parkingan")).toBe("parking_slots");
    expect(matchFieldFromQuery("vacant")).toBe("status");
    expect(matchFieldFromQuery("bakante")).toBe("status");
    expect(matchFieldFromQuery("phone")).toBe("contact_number");
    expect(matchFieldFromQuery("viber")).toBe("contact_number");
    expect(matchFieldFromQuery("sqm")).toBe("sqm");
    expect(matchFieldFromQuery("sukat")).toBe("sqm");
    expect(matchFieldFromQuery("unknown_field_xyz")).toBeNull();
  });

  it("extracts structured unit updates from natural sentences and pasted notes", () => {
    const mockProperties = [
      { id: "prop-1", title: "One Corporate Centre" },
      { id: "prop-2", title: "Wynsum Corporate Plaza" }
    ];

    const notes = `
One Corporate Centre
1201 available
1202 occupied
1203 rent 45k
Parking 5000
Contact: 09171234567
    `;

    const updates = parseHeuristicUpdates(notes, mockProperties);
    expect(updates.length).toBeGreaterThanOrEqual(5);

    const u1201 = updates.find(u => u.unitIdentifier === "1201");
    expect(u1201).toBeDefined();
    expect(u1201.propertyTitle).toBe("One Corporate Centre");
    expect(u1201.field).toBe("status");
    expect(u1201.newValue).toBe("available");

    const u1202 = updates.find(u => u.unitIdentifier === "1202");
    expect(u1202).toBeDefined();
    expect(u1202.field).toBe("status");
    expect(u1202.newValue).toBe("occupied");

    const u1203 = updates.find(u => u.unitIdentifier === "1203");
    expect(u1203).toBeDefined();
    expect(u1203.field).toBe("price_php");
    expect(u1203.newValue).toBe(45000);

    const parking = updates.find(u => u.field === "parking_slots");
    expect(parking).toBeDefined();
    expect(parking.newValue).toBe(5000);

    const contact = updates.find(u => u.field === "contact_number");
    expect(contact).toBeDefined();
    expect(contact.newValue).toBe("09171234567");
  });

  it("A-301: handles combined comma-separated single-line input without unit collision or misclassification", () => {
    const mockProperties = [{ id: "prop-1", title: "One Corporate Centre" }];
    const combinedLine = "rent: 45k, 120 sqm, parking 5000, call 09171234567";

    const updates = parseHeuristicUpdates(combinedLine, mockProperties);
    expect(updates.length).toBe(4);

    const rent = updates.find(u => u.field === "price_php");
    expect(rent).toBeDefined();
    expect(rent.newValue).toBe(45000);
    expect(rent.unitIdentifier).toBeNull(); // No unit collision with 45

    const area = updates.find(u => u.field === "sqm");
    expect(area).toBeDefined();
    expect(area.newValue).toBe(120);
    expect(area.displayValue).toBe("120 sqm");

    const parking = updates.find(u => u.field === "parking_slots");
    expect(parking).toBeDefined();
    expect(parking.newValue).toBe(5000);

    const contact = updates.find(u => u.field === "contact_number");
    expect(contact).toBeDefined();
    expect(contact.newValue).toBe("09171234567");
  });

  it("A-301: ensures shorthand rent 'rent 45k' without unit never consumes 45 as unit number", () => {
    const mockProperties = [{ id: "prop-1", title: "One Corporate Centre" }];
    const updates = parseHeuristicUpdates("rent 45k", mockProperties);
    expect(updates.length).toBe(1);
    expect(updates[0].field).toBe("price_php");
    expect(updates[0].newValue).toBe(45000);
    expect(updates[0].unitIdentifier).toBeNull();
  });
});

describe("POST /api/properties/updates/intent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    const { resolveUserId } = await import("@/lib/serverAuth");
    resolveUserId.mockResolvedValue(null);

    const req = new Request("http://localhost/api/properties/updates/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Unit 1201 rent 45k" })
    });

    const res = await intentPost(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when text is empty", async () => {
    const { resolveUserId } = await import("@/lib/serverAuth");
    resolveUserId.mockResolvedValue("user-123");

    const req = new Request("http://localhost/api/properties/updates/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "" })
    });

    const res = await intentPost(req);
    expect(res.status).toBe(400);
  });

  it("parses natural language updates and returns structured diff proposals", async () => {
    const { resolveUserId } = await import("@/lib/serverAuth");
    resolveUserId.mockResolvedValue("user-123");

    const properties = [
      { id: "prop-1", title: "One Corporate Centre" }
    ];

    const req = new Request("http://localhost/api/properties/updates/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "Unit 1201 rent 45k and is now vacant",
        properties
      })
    });

    const res = await intentPost(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.updates.length).toBeGreaterThan(0);
    expect(data.updates[0].propertyTitle).toBe("One Corporate Centre");
  });

  it("marks units as ambiguous when multiple properties exist without explicit building context", async () => {
    const { resolveUserId } = await import("@/lib/serverAuth");
    resolveUserId.mockResolvedValue("user-123");

    const properties = [
      { id: "prop-1", title: "One Corporate Centre" },
      { id: "prop-2", title: "Wynsum Corporate Plaza" }
    ];

    const req = new Request("http://localhost/api/properties/updates/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "1201 rent 45k",
        properties
      })
    });

    const res = await intentPost(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.updates.length).toBe(1);
    expect(data.updates[0].isAmbiguous).toBe(true);
    expect(data.updates[0].candidateProperties.length).toBe(2);
  });
});
