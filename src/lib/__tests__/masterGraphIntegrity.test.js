import { describe, it, expect } from "vitest";
import { MASTER_FLOW_NODES, MASTER_FLOW_EDGES } from "@/data/masterFlowGraphData";

describe("ScoutIt Master Directed System Graph Integrity (Full Recorded Scenarios)", () => {
  const nodeMap = new Map();
  MASTER_FLOW_NODES.forEach((n) => nodeMap.set(n.id, n));

  it("contains all core architectural and recorded scenario nodes with unique IDs", () => {
    expect(MASTER_FLOW_NODES.length).toBeGreaterThanOrEqual(48);
    const ids = MASTER_FLOW_NODES.map((n) => n.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("ensures every node has a recognized node type", () => {
    const validTypes = new Set([
      "ENTRY",
      "LAYER",
      "PAGE",
      "SECTION",
      "ACTION",
      "DECISION",
      "GATE",
      "SYSTEM",
      "EXCEPTION",
      "RECOVERY",
      "OUTCOME",
      "TERMINAL"
    ]);
    MASTER_FLOW_NODES.forEach((node) => {
      expect(validTypes.has(node.type), `Node "${node.id}" has invalid type "${node.type}"`).toBe(true);
    });
  });

  it("ensures every node has a category distinction ('architecture' or 'scenario')", () => {
    MASTER_FLOW_NODES.forEach((node) => {
      expect(["architecture", "scenario"]).toContain(node.category);
    });
  });

  it("ensures every referenced child exists in the graph", () => {
    MASTER_FLOW_NODES.forEach((node) => {
      node.children.forEach((childId) => {
        const childNode = nodeMap.get(childId);
        expect(childNode, `Node "${node.id}" references missing child "${childId}"`).toBeDefined();
      });
    });
  });

  it("ensures every referenced parent exists in the graph", () => {
    MASTER_FLOW_NODES.forEach((node) => {
      node.parents.forEach((parentId) => {
        const parentNode = nodeMap.get(parentId);
        expect(parentNode, `Node "${node.id}" references missing parent "${parentId}"`).toBeDefined();
      });
    });
  });

  it("ensures parent-child relationships are strictly reciprocal", () => {
    MASTER_FLOW_NODES.forEach((node) => {
      // If node has child C, then C should have node in its parents
      node.children.forEach((childId) => {
        const childNode = nodeMap.get(childId);
        if (childNode) {
          expect(
            childNode.parents,
            `Child "${childId}" must include "${node.id}" in its parents array`
          ).toContain(node.id);
        }
      });

      // If node has parent P, then P should have node in its children
      node.parents.forEach((parentId) => {
        const parentNode = nodeMap.get(parentId);
        if (parentNode) {
          expect(
            parentNode.children,
            `Parent "${parentId}" must include "${node.id}" in its children array`
          ).toContain(node.id);
        }
      });
    });
  });

  it("verifies multi-path convergence onto the Property Experience Page (PEP)", () => {
    const pepNode = nodeMap.get("pep");
    expect(pepNode).toBeDefined();
    expect(pepNode.parents).toContain("orbit");
    expect(pepNode.parents).toContain("showcase");
    expect(pepNode.parents).toContain("search_results");
    expect(pepNode.parents).toContain("direct_slug");
    expect(pepNode.parents).toContain("brokers_roster");
    expect(pepNode.parents).toContain("api_publish_listing");
  });

  it("verifies 4 Listing Creation Methods and AI Honest Blank / Council Deadlock branches", () => {
    const hub = nodeMap.get("owner_creation_pipeline");
    expect(hub.children).toEqual(
      expect.arrayContaining(["method_scratch", "method_advanced", "method_csv", "method_pdf"])
    );

    const pdfMethod = nodeMap.get("method_pdf");
    expect(pdfMethod.children).toContain("ai_listing_engine");

    const aiEngine = nodeMap.get("ai_listing_engine");
    expect(aiEngine.children).toContain("exc_missing_pdf_metric");
    expect(aiEngine.children).toContain("exc_ai_deadlock");
    expect(aiEngine.children).toContain("api_publish_listing");

    const honestBlank = nodeMap.get("exc_missing_pdf_metric");
    expect(honestBlank.children).toContain("rec_owner_manual_override");

    const deadlock = nodeMap.get("exc_ai_deadlock");
    expect(deadlock.children).toContain("rec_manual_approval_queue");
  });

  it("verifies Recorded Playbook Scenarios exist and are linked", () => {
    expect(nodeMap.get("scenario_churned_owner_escrow")).toBeDefined();
    expect(nodeMap.get("scenario_listing_cap_limit")).toBeDefined();
    expect(nodeMap.get("scenario_prc_expired_notice")).toBeDefined();
    expect(nodeMap.get("scenario_broker_lead_collision")).toBeDefined();
    expect(nodeMap.get("scenario_offmarket_pitch")).toBeDefined();
    expect(nodeMap.get("scenario_pii_erasure")).toBeDefined();
    expect(nodeMap.get("scenario_non_refundable_connect")).toBeDefined();
    expect(nodeMap.get("scenario_chat_purge")).toBeDefined();
  });

  it("verifies Spend 1 Connect exception & recovery loop", () => {
    const inquiry = nodeMap.get("inquiry_modal");
    expect(inquiry.children).toContain("exc_insufficient_connects");
    const exc = nodeMap.get("exc_insufficient_connects");
    expect(exc.children).toContain("rec_topup_connects");
    const rec = nodeMap.get("rec_topup_connects");
    expect(rec.children).toContain("inquiry_modal");
  });

  it("verifies Schedule Viewing exception & recovery loop", () => {
    const booking = nodeMap.get("booking_modal");
    expect(booking.children).toContain("exc_slot_conflict");
    const exc = nodeMap.get("exc_slot_conflict");
    expect(exc.children).toContain("rec_propose_alt_slot");
    const rec = nodeMap.get("rec_propose_alt_slot");
    expect(rec.children).toContain("booking_modal");
  });

  it("verifies Public FAQ contact leak filter exception & redaction recovery loop", () => {
    const faq = nodeMap.get("action_ask_faq");
    expect(faq.children).toContain("exc_contact_leak_blocked");
    const exc = nodeMap.get("exc_contact_leak_blocked");
    expect(exc.children).toContain("rec_redact_contact_faq");
    const rec = nodeMap.get("rec_redact_contact_faq");
    expect(rec.children).toContain("action_ask_faq");
  });

  it("verifies Deal Room Viewing No-Show exception & reschedule recovery loop", () => {
    const dealRoom = nodeMap.get("deal_room");
    expect(dealRoom.children).toContain("gate_viewing");
    const gateViewing = nodeMap.get("gate_viewing");
    expect(gateViewing.children).toContain("exc_viewing_noshow");
    const exc = nodeMap.get("exc_viewing_noshow");
    expect(exc.children).toContain("reschedule_modal");
    const reschedule = nodeMap.get("reschedule_modal");
    expect(reschedule.children).toContain("deal_room");
  });

  it("verifies role filtering support across all standard roles", () => {
    const allRoles = ["visitor", "seeker", "owner", "broker", "staff", "enterprise"];
    allRoles.forEach((role) => {
      const matchingNodes = MASTER_FLOW_NODES.filter((n) => n.roles.includes(role));
      expect(matchingNodes.length).toBeGreaterThan(0);
    });
  });
});
