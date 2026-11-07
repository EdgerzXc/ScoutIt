import { beforeEach, describe, expect, it, vi } from "vitest";

// Tests for Property Listing Queue:
// 1. Intake: Upload, register in queue, calculate queue number, notify.
// 2. Status: Check real-time queue position and completion state.
// 3. Process: Single-download parse, schema assimilation, file deletion, and completion notification.
// 4. Poison-Pill Quarantine: Corrupt PDF, oversize PDF (>25MB), max retries exceeded, hostile values.

const storageLog = [];
const dbLog = [];
let storageRemoveCalls = [];
let queryResult = { data: null, error: null, count: 1 };
let updateResult = { data: null, error: null };
let insertResult = { data: null, error: null };
let customDownloadHandler = null;
let customAssimilateHandler = null;

function makeQueryBuilder() {
  let isCountQuery = false;
  const builder = {
    select(fields, opts) {
      dbLog.push(["select", fields, opts]);
      if (opts?.count) isCountQuery = true;
      return builder;
    },
    insert(rows) {
      dbLog.push(["insert", rows]);
      return builder;
    },
    update(patch) {
      dbLog.push(["update", patch]);
      return builder;
    },
    eq(col, val) {
      dbLog.push(["eq", col, val]);
      return builder;
    },
    lte(col, val) {
      dbLog.push(["lte", col, val]);
      return builder;
    },
    order(col, opts) {
      dbLog.push(["order", col, opts]);
      return builder;
    },
    limit(num) {
      dbLog.push(["limit", num]);
      return builder;
    },
    contains(col, val) {
      dbLog.push(["contains", col, val]);
      return builder;
    },
    single() {
      return Promise.resolve(insertResult);
    },
    maybeSingle() {
      return Promise.resolve(queryResult);
    },
    then(onFulfilled, onRejected) {
      if (isCountQuery) {
        return Promise.resolve({ count: queryResult.count, error: null }).then(onFulfilled, onRejected);
      }
      if (Array.isArray(queryResult.data)) {
        return Promise.resolve({ data: queryResult.data, error: null }).then(onFulfilled, onRejected);
      }
      const targetId = queryResult.data?.id || insertResult?.data?.id;
      const items = queryResult.count && targetId
        ? Array.from({ length: queryResult.count }, (_, i) => ({ id: i === queryResult.count - 1 ? targetId : `prior-${i}` }))
        : (queryResult.data ? [queryResult.data] : []);
      return Promise.resolve({ data: items, error: null }).then(onFulfilled, onRejected);
    },
  };
  return builder;
}

const mockStorage = {
  from(bucket) {
    storageLog.push(["from", bucket]);
    return {
      upload(path, bytes, opts) {
        storageLog.push(["upload", path, opts]);
        return Promise.resolve({ data: { path }, error: null });
      },
      download(path) {
        storageLog.push(["download", path]);
        if (customDownloadHandler) {
          return customDownloadHandler(path);
        }
        const pdfHeader = "%PDF-1.4 sample content";
        const blob = new Blob([pdfHeader], { type: "application/pdf" });
        return Promise.resolve({ data: blob, error: null });
      },
      remove(paths) {
        storageRemoveCalls.push(...paths);
        storageLog.push(["remove", paths]);
        return Promise.resolve({ data: paths, error: null });
      },
    };
  },
};

const mockAdminClient = {
  from(table) {
    dbLog.push(["from", table]);
    return makeQueryBuilder();
  },
  storage: mockStorage,
};

vi.mock("@/lib/supabaseAdmin", () => ({
  get supabaseAdmin() {
    return mockAdminClient;
  },
}));

let mockUserId = "test-owner-123";
vi.mock("@/lib/serverAuth", () => ({
  resolveUserId: async () => mockUserId,
}));

const notificationLog = [];
vi.mock("@/lib/notifications", () => ({
  notifyUser: async (client, payload) => {
    notificationLog.push(payload);
    return true;
  },
}));

vi.mock("@/lib/auditTrail", () => ({
  writeAuditLog: async () => true,
}));

vi.mock("unpdf", () => ({
  getDocumentProxy: async (buf) => {
    // If buffer does not have %PDF, throw
    if (!buf || buf.length < 5 || buf[0] !== 0x25 || buf[1] !== 0x50 || buf[2] !== 0x44 || buf[3] !== 0x46) {
      throw new Error("Invalid PDF header");
    }
    return {};
  },
  extractText: async () => ({
    text: "Sample Commercial Office Building in BGC Taguig. Price: 15000000. Floor: 350 sqm.",
    totalPages: 2,
  }),
}));

vi.mock("@/lib/assimilateProperty", () => ({
  MAX_PDF_BYTES: 25 * 1024 * 1024,
  assimilatePropertyText: async (text, filename) => {
    if (customAssimilateHandler) {
      return customAssimilateHandler(text, filename);
    }
    return {
      title: "Prime BGC Commercial Tower",
      location: "BGC, Taguig",
      space_category: "commercial",
      price: 15000000,
      description: "Sample description extracted from PDF.",
      media_link: null,
      floor_sqm: 350,
      confidence: 0.95,
      gaps: [],
      details: { parsed_from: filename },
    };
  },
}));

const intakeRoute = await import("@/app/api/properties/queue/intake/route");
const statusRoute = await import("@/app/api/properties/queue/status/route");
const processRoute = await import("@/app/api/properties/queue/process/route");

describe("Property Listing Queue · Intake & Status", () => {
  beforeEach(() => {
    storageLog.length = 0;
    dbLog.length = 0;
    storageRemoveCalls.length = 0;
    notificationLog.length = 0;
    mockUserId = "test-owner-123";
    customDownloadHandler = null;
    customAssimilateHandler = null;
    queryResult = { data: null, error: null, count: 3 };
    insertResult = {
      data: {
        id: "prop-new-1",
        title: "Drafting: Brochure",
        created_at: new Date().toISOString(),
      },
      error: null,
    };
  });

  it("intake rejects unauthenticated requests", async () => {
    mockUserId = null;
    const req = new Request("https://scoutit.space/api/properties/queue/intake", {
      method: "POST",
    });
    const res = await intakeRoute.POST(req);
    expect(res.status).toBe(401);
  });

  it("intake accepts a valid PDF, stores it temporarily, registers queue, and notifies owner of queue number", async () => {
    const pdfBytes = Buffer.from("%PDF-1.4 sample property brochure content");
    const req = new Request("https://scoutit.space/api/properties/queue/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileBase64: pdfBytes.toString("base64"),
        filename: "property-deck.pdf",
      }),
    });

    const res = await intakeRoute.POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.queueNumber).toBe(3);
    expect(body.propertyId).toBe("prop-new-1");

    // Verify notification was sent with the correct queue number
    expect(notificationLog.length).toBe(1);
    expect(notificationLog[0].title).toBe("Property Queued for Parsing");
    expect(notificationLog[0].desc).toContain("You are #3 in line");
    expect(notificationLog[0].notificationType).toBe("property_drafting");

    // Verify storage upload occurred
    expect(storageLog.some(([op, bucket]) => op === "from" && bucket === "property_photos")).toBe(true);
  });

  it("status reports in-queue position when listing is in ai_drafting", async () => {
    queryResult = {
      data: {
        id: "prop-new-1",
        owner_id: "test-owner-123",
        title: "Drafting: Brochure",
        pipeline_status: "ai_drafting",
        created_at: new Date().toISOString(),
      },
      error: null,
      count: 2,
    };

    const req = new Request("https://scoutit.space/api/properties/queue/status?propertyId=prop-new-1");
    const res = await statusRoute.GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.isDone).toBe(false);
    expect(body.pipelineStatus).toBe("ai_drafting");
    expect(body.queueNumber).toBe(2);
  });

  it("status reports isDone: true when listing has finished parsing", async () => {
    queryResult = {
      data: {
        id: "prop-new-1",
        owner_id: "test-owner-123",
        title: "Prime BGC Commercial Tower",
        pipeline_status: "pending",
        created_at: new Date().toISOString(),
      },
      error: null,
    };

    const req = new Request("https://scoutit.space/api/properties/queue/status?propertyId=prop-new-1");
    const res = await statusRoute.GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.isDone).toBe(true);
    expect(body.pipelineStatus).toBe("pending");
  });
});

describe("Property Listing Queue · Processing & Single-Use Deletion Policy", () => {
  beforeEach(() => {
    storageLog.length = 0;
    dbLog.length = 0;
    storageRemoveCalls.length = 0;
    notificationLog.length = 0;
    mockUserId = "test-owner-123";
    customDownloadHandler = null;
    customAssimilateHandler = null;
    queryResult = {
      data: {
        id: "prop-123",
        owner_id: "test-owner-123",
        title: "Drafting: Brochure",
        location: "Location Pending",
        pipeline_status: "ai_drafting",
        pdf_source_url: "temp_queue_docs/test-owner-123/123_deck.pdf",
        details: {
          temp_storage_path: "temp_queue_docs/test-owner-123/123_deck.pdf",
          source_pdf: "deck.pdf",
        },
      },
      error: null,
    };
  });

  it("downloads the PDF once, updates listing to pending with pdf_verified: false, deletes PDF from storage, and notifies owner", async () => {
    const req = new Request("https://scoutit.space/api/properties/queue/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: "prop-123" }),
    });

    const res = await processRoute.POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.done).toBe(true);
    expect(body.deletedPdf).toBe(true);
    expect(body.pdf_verified).toBe(false);

    // Verify single-use download happened
    expect(storageLog.some(([op]) => op === "download")).toBe(true);

    // Verify CRITICAL REQUIREMENT: PDF file was permanently deleted from storage
    expect(storageRemoveCalls).toContain("temp_queue_docs/test-owner-123/123_deck.pdf");

    // Verify DB update transitioned pipeline_status to 'pending' with pdf_verified: false
    const updateOps = dbLog.filter(([op]) => op === "update");
    expect(updateOps.length).toBeGreaterThan(0);
    const finalPatch = updateOps[updateOps.length - 1][1];
    expect(finalPatch.pipeline_status).toBe("pending");
    expect(finalPatch.pdf_source_url).toBe(null);
    expect(finalPatch.pdf_verified).toBe(false); // A-302: Human verification required
    expect(finalPatch.details?.pdf_verification_required).toBe(true);
    expect(finalPatch.title).toBe("Prime BGC Commercial Tower");

    // Verify completion notification dispatched to owner
    expect(notificationLog.length).toBe(1);
    expect(notificationLog[0].title).toBe("Property Dossier Ready");
    expect(notificationLog[0].desc).toContain("Human source verification is required");
    expect(notificationLog[0].userId).toBe("test-owner-123");
  });

  it("quarantines corrupt PDF, purges temporary file, and unblocks queue", async () => {
    // Return corrupt bytes missing %PDF header
    customDownloadHandler = () => {
      const corruptBlob = new Blob(["THIS IS CORRUPT NOT A VALID PDF AT ALL"], { type: "application/pdf" });
      return Promise.resolve({ data: corruptBlob, error: null });
    };

    const req = new Request("https://scoutit.space/api/properties/queue/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: "prop-123" }),
    });

    const res = await processRoute.POST(req);
    expect(res.status).toBe(422);
    const body = await res.json();

    expect(body.success).toBe(false);
    expect(body.quarantined).toBe(true);
    expect(body.reason).toBe("corrupt_pdf");

    // Verify corrupt file was deleted from storage
    expect(storageRemoveCalls).toContain("temp_queue_docs/test-owner-123/123_deck.pdf");

    // Verify status was transitioned to quarantined
    const updateOps = dbLog.filter(([op]) => op === "update");
    const quarantinePatch = updateOps[updateOps.length - 1][1];
    expect(quarantinePatch.pipeline_status).toBe("quarantined");
    expect(quarantinePatch.details?.quarantine_reason).toBe("corrupt_pdf");
  });

  it("quarantines oversize PDF (> 25 MB) without memory buffering", async () => {
    // Return a mock blob with size > 25 MB
    customDownloadHandler = () => {
      const oversizeBlob = {
        size: 26 * 1024 * 1024,
        arrayBuffer: async () => new ArrayBuffer(0),
      };
      return Promise.resolve({ data: oversizeBlob, error: null });
    };

    const req = new Request("https://scoutit.space/api/properties/queue/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: "prop-123" }),
    });

    const res = await processRoute.POST(req);
    expect(res.status).toBe(422);
    const body = await res.json();

    expect(body.success).toBe(false);
    expect(body.quarantined).toBe(true);
    expect(body.reason).toBe("pdf_oversize");

    // Verify storage was purged
    expect(storageRemoveCalls).toContain("temp_queue_docs/test-owner-123/123_deck.pdf");

    // Verify status is quarantined
    const updateOps = dbLog.filter(([op]) => op === "update");
    const quarantinePatch = updateOps[updateOps.length - 1][1];
    expect(quarantinePatch.pipeline_status).toBe("quarantined");
    expect(quarantinePatch.details?.quarantine_reason).toBe("pdf_oversize");
  });

  it("quarantines listing when max retries are exceeded", async () => {
    queryResult.data.details.process_attempts = 3; // Already attempted 3 times

    const req = new Request("https://scoutit.space/api/properties/queue/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: "prop-123" }),
    });

    const res = await processRoute.POST(req);
    expect(res.status).toBe(422);
    const body = await res.json();

    expect(body.quarantined).toBe(true);
    expect(body.reason).toBe("max_retries_exceeded");
  });
});
