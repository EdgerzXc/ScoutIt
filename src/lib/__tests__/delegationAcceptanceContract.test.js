import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  DELEGATION_ACCEPT_NOTICE,
  isBrokerRepresentationDeal,
  mayAnswerBrokerRequest,
  representationStateForAnswer,
} from "@/lib/deals/delegationDisclosure";

// A-134 — REPRESENTATION_AND_DISCLOSURE_RULES §2: the owner has no veto over how
// an accepted broker runs the listing, so they are told what they hand over
// BEFORE they accept, on every surface where they can accept a broker.

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");
// Comments stripped, so an assertion can never be satisfied by a comment that
// merely mentions the thing (the A-080 trap). `://` in URLs is preserved.
const strip = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

const PITCH = { status: "pending", broker_id: "b", buyer_id: null, properties: { owner_id: "o" } };

describe("who may answer a broker request", () => {
  it("a pitch is answered by the owner, never by the broker who sent it", () => {
    expect(mayAnswerBrokerRequest(PITCH, "o")).toBe(true);
    expect(mayAnswerBrokerRequest(PITCH, "b")).toBe(false);
    expect(mayAnswerBrokerRequest(PITCH, "stranger")).toBe(false);
    expect(mayAnswerBrokerRequest(PITCH, null)).toBe(false);
  });

  it("an owner's invitation is answered by the broker, never by the owner", () => {
    const invite = { ...PITCH, status: "invited" };
    expect(mayAnswerBrokerRequest(invite, "b")).toBe(true);
    expect(mayAnswerBrokerRequest(invite, "o")).toBe(false);
  });

  it("a deal with a buyer in it is not a broker request", () => {
    const routed = { ...PITCH, buyer_id: "u" };
    expect(isBrokerRepresentationDeal(routed)).toBe(false);
    expect(mayAnswerBrokerRequest(routed, "o")).toBe(false);
    expect(isBrokerRepresentationDeal({ buyer_id: "u", broker_id: null })).toBe(false);
  });

  it("only accept and decline are answers", () => {
    expect(representationStateForAnswer("accepted")).toBe("active");
    expect(representationStateForAnswer("declined")).toBe("declined");
    for (const other of ["closed", "withdrawn", "reported", "pending", undefined]) {
      expect(representationStateForAnswer(other)).toBeNull();
    }
  });
});

describe("the notice says what accepting hands over, in the owner's words", () => {
  it("names the exit and never uses the jargon", () => {
    expect(DELEGATION_ACCEPT_NOTICE).toMatch(/remove this broker/i);
    expect(DELEGATION_ACCEPT_NOTICE).toMatch(/up to them/i);
    expect(DELEGATION_ACCEPT_NOTICE).toMatch(/ScoutIt doesn't step in/i);
    expect(DELEGATION_ACCEPT_NOTICE).not.toMatch(/represent/i);
  });

  it("OwnerMode shows it on a pending broker pitch, before the accept button", () => {
    const src = strip(read("src/components/dashboard/OwnerMode.js"));
    expect(src).toContain('from "@/lib/deals/delegationDisclosure"');
    const notice = src.indexOf("{DELEGATION_ACCEPT_NOTICE}");
    expect(notice).toBeGreaterThan(-1);
    const guard = src.lastIndexOf("pitch.otherPartyRole === 'Broker'", notice);
    expect(guard).toBeGreaterThan(-1);
    expect(notice - guard).toBeLessThan(300);
    expect(src.slice(guard - 120, guard)).toContain("pitch.status === 'pending'");
    const accept = src.indexOf("updatePitchStatus(pitch.id, 'accepted')");
    expect(accept).toBeGreaterThan(notice);
  });

  it("the inbox ChatBox shows it to the recipient of a broker's request, before Accept", () => {
    const src = strip(read("src/components/dashboard/ChatBox.js"));
    const notice = src.indexOf("{DELEGATION_ACCEPT_NOTICE}");
    expect(notice).toBeGreaterThan(-1);
    const guard = src.lastIndexOf('deal.otherPartyRole === "Broker"', notice);
    expect(guard).toBeGreaterThan(-1);
    expect(notice - guard).toBeLessThan(200);
    const accept = src.indexOf("onAcceptRequest?.(deal.id)", notice);
    expect(accept).toBeGreaterThan(notice);
  });
});

describe("both answer routes consult the gate before writing the deal", () => {
  for (const path of ["src/app/api/dashboard/deals/update/route.js", "src/app/api/deals/[id]/route.js"]) {
    it(`${path}: gate, then deal write, then representation write`, () => {
      const src = strip(read(path));
      const gate = src.indexOf("mayAnswerBrokerRequest(deal, userId)");
      const dealWrite = src.search(/\.from\(\s*["']deals["']\s*\)\s*\.update\(/);
      const repWrite = src.indexOf('.from("property_broker_representations")');
      expect(gate).toBeGreaterThan(-1);
      expect(dealWrite).toBeGreaterThan(gate);
      expect(repWrite).toBeGreaterThan(dealWrite);
      expect(src.slice(repWrite - 200, repWrite)).toContain("if (representationState)");
    });
  }
});
