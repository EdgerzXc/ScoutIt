import { beforeEach, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { mapPropertyCsvRows, MAX_PROPERTY_CSV_ROWS, normalizeCsvCategory } from "@/lib/propertyCsvImport";

const state = vi.hoisted(() => ({ userId: null, rows: new Map(), write: vi.fn(), failRead: false }));
vi.mock("@/lib/serverAuth", () => ({ resolveUserId: async () => state.userId }));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: () => ({
      upsert: state.write,
      select: () => ({
        eq: (column, owner) => ({
          in: async (_key, ids) => state.failRead
            ? { error: { code: "57014" } }
            : { data: [...state.rows.values()].filter((row) => row[column] === owner && ids.includes(row.id)) },
        }),
      }),
    }),
  },
}));
const { POST } = await import("@/app/api/dashboard/bulk-insert/route");

const IMPORT_ID = "10000000-0000-4000-8000-000000000000";
const OWNER = "20000000-0000-4000-8000-000000000000";
const row = { title: "Makati suite", location: "Makati, Metro Manila", type: "commercial" };
const columns = new Set([
  "id", "owner_id", "title", "location", "type", "space_category", "price", "description", "media_link",
  "details", "creation_source", "pipeline_status", "lifecycle_state", "moderation_status",
]);

function submit(properties, importId = IMPORT_ID) {
  return POST(new Request("https://www.scoutit.space/api/dashboard/bulk-insert", {
    method: "POST", body: JSON.stringify({ properties, importId }),
  }));
}

beforeEach(() => {
  state.rows.clear();
  state.userId = OWNER;
  state.failRead = false;
  state.write.mockReset().mockImplementation(async (rows) => {
    if (rows.some((record) => Object.keys(record).some((key) => !columns.has(key)))) return { error: { code: "PGRST204" } };
    for (const record of rows) {
      if (!state.rows.has(record.id)) state.rows.set(record.id, { slug: null, canonical_slug: null, ...record });
    }
    return {};
  });
});

it("maps supported headers without a provider and preserves other CSV columns in the draft notes", () => {
  const headers = ["Property Name", "Address", "Bedrooms", "Asking Price", "Parking note"];
  expect(mapPropertyCsvRows(headers, [{
    "Property Name": " Suite 3 ", Address: "Makati, Metro Manila", Bedrooms: "2",
    "Asking Price": "₱25,000", "Parking note": "One slot",
  }])).toEqual([{
    title: "Suite 3", location: "Makati, Metro Manila", type: "commercial",
    details: { beds: "2" }, price: "₱25,000", description: "Parking note — One slot",
  }]);
});

it("creates private owner-scoped drafts with server-set trust fields", async () => {
  const response = await submit([{
    ...row, title: "<b>Makati suite</b>", price: "₱25,000.50", owner_id: "other-owner", id: IMPORT_ID,
    creation_source: "pdf_assisted", pipeline_status: "approved", lifecycle_state: "live",
    pdf_verified: true, canonical_slug: "reserved", airtable_record_id: "recPrivate",
    details: { furnishing: "<b>Furnished</b>", pdf_verified: "true" },
  }, { ...row, title: "Second suite" }]);
  expect(response.status).toBe(200);
  const result = await response.json();
  expect(result.count).toBe(2);
  expect(result.inserted[0]).toMatchObject({
    title: "Makati suite", owner_id: OWNER, creation_source: "csv", pipeline_status: "draft",
    lifecycle_state: "draft", moderation_status: "pending", canonical_slug: null, slug: null, price: 25000.5,
    details: { furnishing: "Furnished" },
  });
  expect(result.inserted[0].id).not.toBe(IMPORT_ID);
  expect(result.inserted[0]).not.toHaveProperty("pdf_verified");
  expect(result.inserted[0].details).not.toHaveProperty("pdf_verified");
});

it("recovers a committed batch after a failed response read without duplicating or overwriting drafts", async () => {
  state.failRead = true;
  expect((await submit([row])).status).toBe(503);
  expect(state.rows.size).toBe(1);
  const saved = [...state.rows.values()][0];
  saved.title = "Owner's later edit";
  state.failRead = false;
  const [first, second] = await Promise.all([submit([row]), submit([row])]);
  expect(first.status).toBe(200);
  expect(second.status).toBe(200);
  expect((await first.json()).inserted[0]).toMatchObject({ id: saved.id, title: "Owner's later edit" });
  expect(state.rows.size).toBe(1);
  expect(state.write.mock.lastCall[1]).toEqual({ onConflict: "id", ignoreDuplicates: true });
  state.userId = "30000000-0000-4000-8000-000000000000";
  expect((await submit([row])).status).toBe(200);
  expect(state.rows.size).toBe(2);
});

it("rejects the entire invalid batch before any write", async () => {
  const invalid = await submit([row, { ...row, title: " " }]);
  expect(invalid.status).toBe(400);
  expect(await invalid.json()).toEqual({ error: "Check title on row 2." });
  expect((await submit([{ ...row, media_link: "/relative-image" }])).status).toBe(400);
  expect((await submit(Array.from({ length: MAX_PROPERTY_CSV_ROWS + 1 }, () => row))).status).toBe(413);
  state.userId = null;
  expect((await submit([row])).status).toBe(401);
  expect(state.write).not.toHaveBeenCalled();
});

it("normalizes 6-vertical CSV categories and maps canonical vertical detail headers", () => {
  expect(normalizeCsvCategory("F&B")).toBe("restaurants");
  expect(normalizeCsvCategory("Food & Beverage")).toBe("restaurants");
  expect(normalizeCsvCategory("Boutique Hotel")).toBe("hospitality");
  expect(normalizeCsvCategory("Vacation Rental")).toBe("str");
  expect(normalizeCsvCategory("Event Venue")).toBe("venues");
  expect(normalizeCsvCategory("Developer")).toBe("commercial");
  expect(normalizeCsvCategory("Condo")).toBe("residential");
  expect(normalizeCsvCategory("")).toBe("commercial");
  expect(normalizeCsvCategory("Mixed Use")).toBe("mixed use");

  const headers = [
    "Title",
    "Address",
    "Space Category",
    "Seating Capacity",
    "Kitchen Exhaust",
    "Liquor License",
    "Room Count",
    "Star Rating",
    "Nightly Rate",
    "Max Guests",
    "Seated Capacity",
    "Standing Capacity",
    "Total GLA",
    "PEZA Status",
  ];
  const mapped = mapPropertyCsvRows(headers, [
    {
      Title: "Bistro BGC",
      Address: "High Street, BGC",
      "Space Category": "Food & Beverage",
      "Seating Capacity": "80",
      "Kitchen Exhaust": "Yes",
      "Liquor License": "Eligible",
    },
    {
      Title: "Makati Grand Hotel",
      Address: "Ayala Ave, Makati",
      "Space Category": "Hotel",
      "Room Count": "140",
      "Star Rating": "5",
    },
    {
      Title: "Siargao Villa",
      Address: "General Luna, Siargao",
      "Space Category": "Airbnb",
      "Nightly Rate": "12500",
      "Max Guests": "6",
    },
    {
      Title: "Manila Pavilion Hall",
      Address: "Ermita, Manila",
      "Space Category": "Event Space",
      "Seated Capacity": "350",
      "Standing Capacity": "600",
    },
    {
      Title: "Ortigas Tower",
      Address: "Ortigas Center, Pasig",
      "Space Category": "Office",
      "Total GLA": "24000",
      "PEZA Status": "Accredited",
    },
  ]);

  expect(mapped).toEqual([
    {
      title: "Bistro BGC",
      location: "High Street, BGC",
      type: "restaurants",
      details: {
        RST_Seating_Capacity: "80",
        RST_Hood_Exhaust: "Yes",
        RST_Liquor_License: "Eligible",
      },
    },
    {
      title: "Makati Grand Hotel",
      location: "Ayala Ave, Makati",
      type: "hospitality",
      details: {
        HOSP_Room_Count: "140",
        HOSP_Star_Rating: "5",
      },
    },
    {
      title: "Siargao Villa",
      location: "General Luna, Siargao",
      type: "str",
      details: {
        STR_Nightly_Rate: "12500",
        STR_Max_Guests: "6",
      },
    },
    {
      title: "Manila Pavilion Hall",
      location: "Ermita, Manila",
      type: "venues",
      details: {
        VEN_Capacity_Seated: "350",
        VEN_Capacity_Standing: "600",
      },
    },
    {
      title: "Ortigas Tower",
      location: "Ortigas Center, Pasig",
      type: "commercial",
      details: {
        CM_Total_GLA: "24000",
        PEZA: "Accredited",
      },
    },
  ]);
  expect(mapped[0]).not.toHaveProperty("spaceCategory");
});

it("persists normalized 6-vertical CSV rows and canonical detail fields via bulk-insert while stripping unknown fields", async () => {
  const mapped = mapPropertyCsvRows(
    [
      "Title",
      "Location",
      "Type",
      "Seating Capacity",
      "Room Count",
      "Nightly Rate",
      "Seated Capacity",
      "Total GLA",
      "PEZA",
    ],
    [
      { Title: "Tasting Room", Location: "Poblacion, Makati", Type: "Dining", "Seating Capacity": "48" },
      { Title: "Harbor Suites", Location: "BGC, Taguig", Type: "Resort", "Room Count": "96" },
      { Title: "Cliffside Loft", Location: "Tagaytay", Type: "Short-Term Rental", "Nightly Rate": "8500" },
      { Title: "Skyline Atrium", Location: "Alabang, Muntinlupa", Type: "Event Venue", "Seated Capacity": "220" },
      { Title: "IT Park Hub", Location: "Cebu City", Type: "Developer", "Total GLA": "18500", PEZA: "Certified" },
    ]
  ).map((item) => ({
    ...item,
    details: { ...item.details, pdf_verified: "true" },
  }));

  const response = await submit(mapped);
  expect(response.status).toBe(200);
  const result = await response.json();
  expect(result.count).toBe(5);

  const byTitle = new Map(result.inserted.map((item) => [item.title, item]));
  expect(byTitle.get("Tasting Room")).toMatchObject({
    type: "restaurants",
    space_category: "restaurants",
    details: { RST_Seating_Capacity: "48" },
  });
  expect(byTitle.get("Harbor Suites")).toMatchObject({
    type: "hospitality",
    space_category: "hospitality",
    details: { HOSP_Room_Count: "96" },
  });
  expect(byTitle.get("Cliffside Loft")).toMatchObject({
    type: "str",
    space_category: "str",
    details: { STR_Nightly_Rate: "8500" },
  });
  expect(byTitle.get("Skyline Atrium")).toMatchObject({
    type: "venues",
    space_category: "venues",
    details: { VEN_Capacity_Seated: "220" },
  });
  expect(byTitle.get("IT Park Hub")).toMatchObject({
    type: "commercial",
    space_category: "commercial",
    details: { CM_Total_GLA: "18500", PEZA: "Certified" },
  });
  for (const record of result.inserted) {
    expect(record.details).not.toHaveProperty("pdf_verified");
  }
});

it("builds a 6-vertical CSV template that round-trips cleanly through Papa.parse and mapPropertyCsvRows", () => {
  const bulkImporterSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/dashboard/BulkImporterMode.js"),
    "utf8"
  );
  expect(bulkImporterSource).toContain('data-testid="download-csv-template-btn"');
  expect(bulkImporterSource).toContain("buildSixVerticalCsvTemplate");
  for (const cat of ["commercial", "residential", "restaurants", "hospitality", "str", "venues"]) {
    expect(bulkImporterSource).toContain(cat);
  }

  const headers = [
    "Title",
    "Location",
    "Category",
    "Price",
    "Floor_Sqm",
    "Beds",
    "Baths",
    "Total_GLA",
    "PEZA",
    "Seating_Capacity",
    "Hood_Exhaust",
    "Liquor_License",
    "Room_Count",
    "Star_Rating",
    "Nightly_Rate",
    "Max_Guests",
    "Seated_Capacity",
    "Standing_Capacity",
    "Description",
  ];
  const sampleRows = [
    { Title: "BGC Grade-A Office Floor", Location: "Bonifacio Global City, Taguig", Category: "commercial", Price: "1450", Floor_Sqm: "1200", Total_GLA: "28500", PEZA: "Accredited" },
    { Title: "Rockwell Sky Residence", Location: "Rockwell Center, Makati", Category: "residential", Price: "42000000", Floor_Sqm: "185", Beds: "3", Baths: "3" },
    { Title: "Poblacion Bistro Flagship", Location: "Poblacion, Makati", Category: "restaurants", Price: "260000", Floor_Sqm: "240", Seating_Capacity: "88", Hood_Exhaust: "Yes", Liquor_License: "Eligible" },
    { Title: "Mactan Bay Resort Hotel", Location: "Lapu-Lapu City, Cebu", Category: "hospitality", Price: "650000000", Floor_Sqm: "8400", Room_Count: "120", Star_Rating: "5" },
    { Title: "Siargao Cloud Loft Villa", Location: "General Luna, Siargao", Category: "str", Price: "12500", Floor_Sqm: "140", Beds: "2", Baths: "2", Nightly_Rate: "12500", Max_Guests: "6" },
    { Title: "Intramuros Heritage Atrium", Location: "Intramuros, Manila", Category: "venues", Price: "180000", Floor_Sqm: "620", Seated_Capacity: "320", Standing_Capacity: "550" },
  ];

  const csv = Papa.unparse({
    fields: headers,
    data: sampleRows.map((row) => headers.map((h) => row[h] ?? "")),
  });
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
  expect(parsed.errors).toEqual([]);
  expect(parsed.meta.fields).toEqual(headers);
  expect(parsed.data).toHaveLength(6);

  const mapped = mapPropertyCsvRows(parsed.meta.fields, parsed.data);
  expect(mapped.map((item) => item.type)).toEqual([
    "commercial",
    "residential",
    "restaurants",
    "hospitality",
    "str",
    "venues",
  ]);
  expect(mapped[0].details).toMatchObject({ CM_Total_GLA: "28500", PEZA: "Accredited", floor_sqm: "1200" });
  expect(mapped[1].details).toMatchObject({ beds: "3", baths: "3", floor_sqm: "185" });
  expect(mapped[2].details).toMatchObject({
    RST_Seating_Capacity: "88",
    RST_Hood_Exhaust: "Yes",
    RST_Liquor_License: "Eligible",
  });
  expect(mapped[3].details).toMatchObject({ HOSP_Room_Count: "120", HOSP_Star_Rating: "5" });
  expect(mapped[4].details).toMatchObject({ STR_Nightly_Rate: "12500", STR_Max_Guests: "6" });
  expect(mapped[5].details).toMatchObject({ VEN_Capacity_Seated: "320", VEN_Capacity_Standing: "550" });
});
