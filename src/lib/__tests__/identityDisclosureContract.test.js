import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  IDENTITY_REVEALING_STATUSES,
  isIdentityPublic,
  canSeeCounterpartyName,
  counterpartyDisplayName,
  viewerIsRequestSender,
} from "@/lib/identityDisclosure";

const read = (path) => readFileSync(path, "utf8");
// A comment quoting the rule satisfies a guard that requires it (the A-080
// trap), so every source assertion runs on comment-stripped text.
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

const dealsRoute = stripComments(read("src/app/api/deals/route.js"));
const chatBox = stripComments(read("src/components/dashboard/ChatBox.js"));
const privacyRoute = stripComments(read("src/app/api/user/privacy-settings/route.js"));

// The owner's model, stated once: browse anonymously; sign in to reach for
// someone; the FIRST Connect is still anonymous; the name is revealed by
// acceptance and contact details by the handshake. An owner may also keep
// their name off their own listings entirely.
describe("identity disclosure — a pending Connect is anonymous", () => {
  it("withholds the sender's name from the recipient while the request is pending", () => {
    expect(
      counterpartyDisplayName({
        viewerIsSender: false,
        dealStatus: "pending",
        counterpartyIsPublic: true,
        name: "Ana Cruz",
        roleLabel: "Broker",
      })
    ).toBe("Broker");
  });

  it("reveals the name once the recipient has accepted", () => {
    expect(
      counterpartyDisplayName({
        viewerIsSender: false,
        dealStatus: "accepted",
        counterpartyIsPublic: false,
        name: "Ana Cruz",
        roleLabel: "Broker",
      })
    ).toBe("Ana Cruz");
  });

  it("treats acceptance as the reveal, for every post-acceptance status", () => {
    for (const status of ["accepted", "active", "connected"]) {
      expect(
        canSeeCounterpartyName({ viewerIsSender: false, dealStatus: status }),
        `${status} should reveal`
      ).toBe(true);
    }
  });

  it("never reveals on a status that precedes acceptance", () => {
    // `pending` is what both initiate and pitch write on creation; `invited`
    // is the owner-invites-broker shape; `pitching` is the column's legacy
    // default. None of them means anyone said yes.
    for (const status of ["pending", "invited", "pitching", ""]) {
      expect(
        canSeeCounterpartyName({ viewerIsSender: false, dealStatus: status }),
        `${status || "(empty)"} must NOT reveal`
      ).toBe(false);
    }
  });

  it("a refusal is not a disclosure", () => {
    // Declined/withdrawn/expired all mean the request died unanswered. If the
    // name was never revealed, refusing must not reveal it.
    for (const status of ["declined", "withdrawn", "expired"]) {
      expect(
        canSeeCounterpartyName({ viewerIsSender: false, dealStatus: status }),
        `${status} must NOT reveal`
      ).toBe(false);
    }
  });

  it("does not re-hide a name the two parties already used", () => {
    // closed/reported imply a conversation happened, which implies acceptance.
    for (const status of ["closed", "reported"]) {
      expect(canSeeCounterpartyName({ viewerIsSender: false, dealStatus: status })).toBe(true);
    }
  });
});

describe("identity disclosure — an owner can keep their name off their listings", () => {
  it("withholds a private person's name even from the sender who contacted them", () => {
    // The old reasoning was "the sender already knows who they contacted".
    // That only holds while the counterparty publishes their name. Someone who
    // switched it off was never known to the sender.
    expect(
      counterpartyDisplayName({
        viewerIsSender: true,
        dealStatus: "pending",
        counterpartyIsPublic: false,
        name: "Ana Cruz",
        roleLabel: "Owner",
      })
    ).toBe("Owner");
  });

  it("shows a public person's name to the sender who chose them", () => {
    expect(
      counterpartyDisplayName({
        viewerIsSender: true,
        dealStatus: "pending",
        counterpartyIsPublic: true,
        name: "Ana Cruz",
        roleLabel: "Owner",
      })
    ).toBe("Ana Cruz");
  });

  it("an unset privacy flag is not consent (Rule 14: a NULL is never an assertion)", () => {
    expect(isIdentityPublic({ is_profile_public: null })).toBe(false);
    expect(isIdentityPublic({})).toBe(false);
    expect(isIdentityPublic(undefined)).toBe(false);
    expect(isIdentityPublic({ is_profile_public: "true" })).toBe(false);
    expect(isIdentityPublic({ is_profile_public: true })).toBe(true);
  });
});

describe("identity disclosure — the rule is applied, not just defined", () => {
  it("the deals API decides through the shared rule, never handing out a raw name", () => {
    expect(dealsRoute).toContain("counterpartyDisplayName({");
    expect(dealsRoute).toContain("viewerIsRequestSender(myRole)");
    // The exact expression that leaked: the name with no status and no
    // privacy check, role label as a mere fallback for a missing name.
    expect(dealsRoute).not.toMatch(/otherParty:\s*otherId\s*\?\s*\(namesById/);
  });

  it("the deals API reads the privacy flag it is supposed to honour", () => {
    expect(dealsRoute).toContain("is_profile_public");
    expect(dealsRoute).toContain("isIdentityPublic(p)");
  });

  it("the UI and the API share one definition of who sent the request", () => {
    // Two derivations that drift is how the API and the screen end up
    // disagreeing about whether a name may be shown.
    expect(chatBox).toContain("viewerIsRequestSender(deal.myRole)");
    expect(chatBox).not.toMatch(/isRequestSender\s*=\s*\(deal\.myRole/);
    expect(viewerIsRequestSender("buyer")).toBe(true);
    expect(viewerIsRequestSender("owner")).toBe(false);
    expect(viewerIsRequestSender("broker")).toBe(false);
    // Unknown/missing role defaults to sender only because ChatBox always did;
    // the conservative half is that everyone else is a recipient.
    expect(viewerIsRequestSender(undefined)).toBe(true);
  });

  it("the privacy setting never reports public for an unset flag", () => {
    // Both the GET and the read-back after a save. A privacy control that
    // fails open is worse than one that does not exist.
    expect(privacyRoute).not.toContain("is_profile_public ?? true");
    const reports = privacyRoute.match(/isProfilePublic: [^,]+/g) || [];
    expect(reports.length).toBeGreaterThanOrEqual(2);
    for (const line of reports) {
      expect(line, `${line} must be an explicit === true`).toContain("=== true");
    }
  });

  it("the revealing set is frozen so it cannot be widened at runtime", () => {
    expect(Object.isFrozen(IDENTITY_REVEALING_STATUSES)).toBe(true);
  });
});
