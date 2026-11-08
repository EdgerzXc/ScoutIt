import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/property/claim/route";
import * as serverAuth from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { AUTO_VERIFIER_SYSTEM_ACTOR_ID } from "../claimAutoVerificationPolicy.mjs";

vi.mock("@/lib/serverAuth", () => ({
  resolveUserId: vi.fn(),
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: { from: vi.fn() },
}));

describe("Property Claim Auto-Verification Engine — Integration Tests", () => {
  const CLAIMANT_ID = "user-claimant-100";

  const MOCK_PROPERTY = {
    id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    slug: "bgc-tower-200",
    canonical_slug: "bgc-tower-200",
    title: "BGC Corporate Center Suite 1204",
    owner_id: "prior-broker-300",
    verified: false,
    lister_relationship: "authorized_broker",
    pipeline_status: "approved",
  };

  const MOCK_PROFILE = {
    id: CLAIMANT_ID,
    full_name: "Juan Mercado Dela Cruz",
    display_name: "Juan Dela Cruz",
    role: "seeker",
    active_roles: ["seeker"],
    subscription_tier: "starry",
  };

  const CLEAN_TCT_DOCS = [
    {
      documentType: "transfer_certificate_of_title",
      storagePath: "user-claimant-100/claims/tct_1204.pdf",
      originalFilename: "TCT_1204.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 204800,
    },
  ];

  let insertedEvents = [];
  let updatedClaimStatus = null;
  let updatedPropertyOwner = null;

  beforeEach(() => {
    insertedEvents = [];
    updatedClaimStatus = null;
    updatedPropertyOwner = null;
    vi.clearAllMocks();
    serverAuth.resolveUserId.mockResolvedValue(CLAIMANT_ID);

    supabaseAdmin.from = vi.fn().mockImplementation((table) => {
      if (table === "properties") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((field, val) => {
              if (field === "id") {
                return {
                  maybeSingle: vi.fn().mockResolvedValue({ data: MOCK_PROPERTY, error: null }),
                  single: vi.fn().mockResolvedValue({ data: MOCK_PROPERTY, error: null }),
                };
              }
              if (field === "owner_id") {
                return {
                  eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                };
              }
              return { maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) };
            }),
          }),
          update: vi.fn().mockImplementation((payload) => {
            updatedPropertyOwner = payload.owner_id;
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          }),
        };
      }

      if (table === "user_profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: MOCK_PROFILE, error: null }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }

      if (table === "property_claims") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
              neq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "claim-auto-1",
                  property_id: MOCK_PROPERTY.id,
                  claimant_user_id: CLAIMANT_ID,
                  claimed_relationship: "owner",
                  status: "submitted",
                },
                error: null,
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "claim-auto-1",
                  property_id: MOCK_PROPERTY.id,
                  claimant_user_id: CLAIMANT_ID,
                  claimed_relationship: "owner",
                  status: "submitted",
                },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockImplementation((payload) => {
            updatedClaimStatus = payload.status;
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          }),
        };
      }

      if (table === "property_claim_documents") {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }

      if (table === "property_claim_events") {
        return {
          insert: vi.fn().mockImplementation((eventRow) => {
            insertedEvents.push(eventRow);
            return Promise.resolve({ error: null });
          }),
        };
      }

      if (table === "deals") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }

      if (table === "user_notifications" || table === "private_notifications") {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }

      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
    });
  });

  it("1. Automatically verifies clean Land Title claim with matching owner name", async () => {
    const req = new Request("http://localhost/api/property/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: MOCK_PROPERTY.id,
        claimedRelationship: "owner",
        agreed: true,
        documents: CLEAN_TCT_DOCS,
        ocrData: {
          registeredOwner: "JUAN MERCADO DELA CRUZ",
          titleNumber: "TCT-001204",
          city: "Taguig",
        },
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.autoVerified).toBe(true);
    expect(body.provisional).toBe(true);
    expect(body.provisionalWindowHours).toBe(72);
    expect(body.status).toBe("approved");

    // Verified that property ownership was transferred to claimant
    expect(updatedPropertyOwner).toBe(CLAIMANT_ID);
    expect(updatedClaimStatus).toBe("approved");

    // Verified that auto-verification audit event was recorded with system actor
    const autoEvent = insertedEvents.find((e) => e.event_type === "CLAIM_AUTO_VERIFIED_CLEAN_TITLE");
    expect(autoEvent).toBeDefined();
    expect(autoEvent.payload.systemActor).toBe(AUTO_VERIFIER_SYSTEM_ACTOR_ID);
    expect(autoEvent.payload.confidence).toBe(1.0);
    expect(autoEvent.payload.titleNumber).toBe("TCT-001204");
  });

  it("2. Safely routes represented broker claim with Land Title to human staff review", async () => {
    const req = new Request("http://localhost/api/property/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: MOCK_PROPERTY.id,
        claimedRelationship: "authorized_broker",
        agreed: true,
        documents: CLEAN_TCT_DOCS,
        ocrData: {
          registeredOwner: "JUAN MERCADO DELA CRUZ",
          titleNumber: "TCT-001204",
        },
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.autoVerified).toBe(false);
    expect(body.routedToStaff).toBe(true);
    expect(body.status).toBe("submitted");

    // Verified that property ownership was NOT transferred
    expect(updatedPropertyOwner).toBeNull();

    // Verified that staff routing event was recorded with reason
    const routeEvent = insertedEvents.find((e) => e.event_type === "CLAIM_ROUTED_TO_STAFF_REVIEW");
    expect(routeEvent).toBeDefined();
    expect(routeEvent.payload.reasonCode).toBe("represented_claim_requires_staff");
  });

  it("3. Safely routes name discrepancy (mismatched owner) to human staff review", async () => {
    const req = new Request("http://localhost/api/property/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: MOCK_PROPERTY.id,
        claimedRelationship: "owner",
        agreed: true,
        documents: CLEAN_TCT_DOCS,
        ocrData: {
          registeredOwner: "ROBERTO LIM CHUA",
          titleNumber: "TCT-001204",
        },
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.autoVerified).toBe(false);
    expect(body.routedToStaff).toBe(true);
    expect(body.staffReviewReason).toContain("Name match confidence");

    // Verified that property ownership was NOT transferred
    expect(updatedPropertyOwner).toBeNull();

    const routeEvent = insertedEvents.find((e) => e.event_type === "CLAIM_ROUTED_TO_STAFF_REVIEW");
    expect(routeEvent).toBeDefined();
    expect(routeEvent.payload.reasonCode).toBe("name_match_insufficient");
  });
});
