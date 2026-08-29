import { describe, expect, it } from "vitest";
import {
  buildTranscript,
  transcriptFilename,
  EXPORT_DISCLAIMER_LINES,
} from "@/lib/conversationExport";
import { CONTACT_MASK } from "@/lib/contactLeakFilter";
import { CHAT_RETENTION_DAYS } from "@/lib/chatRetention";

// ─────────────────────────────────────────────────────────────────────────
// A-043. Nobody could download their own conversation, and the retention rule
// depends on them being able to: ScoutIt keeps message bodies for seven days
// after close and then overwrites them, on the stated understanding that each
// party keeps their own copy. Until this module existed, seven days after
// close the record was gone for everyone — including the two people who wrote
// it — so "we don't keep it, they do" was only half true.
//
// These are real behavioural tests against a pure function, not source
// assertions: the transcript is the artefact a person may still be reading in
// five years, so its contents are asserted directly.
// ─────────────────────────────────────────────────────────────────────────

const DEAL = {
  id: "11111111-2222-3333-4444-555555555555",
  propertyTitle: "Bonifacio Tower · Unit 12A",
  status: "closed",
  createdAt: "2026-08-01T06:03:00.000Z",
  closedAt: "2026-08-20T01:11:00.000Z",
};

const PARTICIPANTS = [
  { id: "buyer-1", name: "Maria Santos", role: "buyer" },
  { id: "broker-1", name: "Juan Reyes", role: "broker" },
];

const MESSAGES = [
  {
    sender_id: "buyer-1",
    sender_role: "buyer",
    body: "Hello, is this unit still available?",
    created_at: "2026-08-01T06:03:00.000Z",
  },
  {
    sender_id: "broker-1",
    sender_role: "broker",
    body: "Yes it is. Call me at 0917 123 4567 or juan@example.com.",
    created_at: "2026-08-01T07:10:00.000Z",
  },
];

const BASE = {
  deal: DEAL,
  messages: MESSAGES,
  participants: PARTICIPANTS,
  exporterId: "buyer-1",
  contactRevealed: false,
  exportedAt: "2026-08-27T10:40:00.000Z",
};

describe("A-043 conversation transcript", () => {
  it("renders every message body, in order, with its author and time", () => {
    const out = buildTranscript(BASE);
    expect(out).toContain("Hello, is this unit still available?");
    expect(out.indexOf("Hello, is this unit")).toBeLessThan(out.indexOf("Yes it is."));
    expect(out).toContain("Maria Santos");
    expect(out).toContain("Juan Reyes");
    // Philippine local time, so the record reads correctly to the people who
    // lived it. 06:03Z is 14:03 in Manila.
    expect(out).toContain("2026-08-01 14:03");
  });

  it("keeps contact details masked when the handshake is not complete", () => {
    const out = buildTranscript({ ...BASE, contactRevealed: false });
    expect(out).not.toContain("0917 123 4567");
    expect(out).not.toContain("juan@example.com");
    expect(out).toContain(CONTACT_MASK);
  });

  it("reveals contact details once the handshake is complete", () => {
    const out = buildTranscript({ ...BASE, contactRevealed: true });
    expect(out).toContain("0917 123 4567");
    expect(out).toContain("juan@example.com");
    expect(out).not.toContain(CONTACT_MASK);
  });

  it("names an attachment instead of dumping its storage envelope", () => {
    const attachment = {
      sender_id: "broker-1",
      sender_role: "broker",
      body: `__scoutit_attachment__:${JSON.stringify({
        name: "floorplan.pdf",
        size: 2201600,
        url: "https://example.supabase.co/storage/floorplan.pdf",
      })}`,
      created_at: "2026-08-02T01:00:00.000Z",
    };
    const out = buildTranscript({ ...BASE, messages: [attachment] });
    expect(out).toContain("floorplan.pdf");
    expect(out).not.toContain("__scoutit_attachment__");
    expect(out).not.toContain('{"name"');
  });

  it("passes a purged body through as the record that it is", () => {
    const purged = {
      sender_id: "broker-1",
      sender_role: "broker",
      body: "[Purged after 7 days retention policy]",
      created_at: "2026-08-02T01:00:00.000Z",
    };
    const out = buildTranscript({ ...BASE, messages: [purged] });
    expect(out).toContain("[Purged after 7 days retention policy]");
  });

  it("heads the record with what it is and who exported it", () => {
    const out = buildTranscript(BASE);
    expect(out).toContain(DEAL.propertyTitle);
    expect(out).toContain(DEAL.id);
    expect(out).toContain("2026-08-27 18:40"); // exported at, Manila
    expect(out).toContain("Maria Santos"); // the exporter, named
  });

  it("states the retention window and that the copy leaves ScoutIt's control", () => {
    const out = buildTranscript(BASE);
    // The number is taken from the shared retention constant, never retyped —
    // a second literal here is free to drift from the purge job.
    expect(out).toContain(String(CHAT_RETENTION_DAYS));
    for (const line of EXPORT_DISCLAIMER_LINES) {
      expect(out).toContain(line);
    }
    expect(EXPORT_DISCLAIMER_LINES.join(" ")).toMatch(/outside ScoutIt/i);
  });

  it("produces a readable document for a thread with no messages", () => {
    const out = buildTranscript({ ...BASE, messages: [] });
    expect(out).toContain(DEAL.id);
    expect(out).toMatch(/no messages/i);
    // An empty thread must still carry the disclaimer — it is the part that
    // explains what the reader is holding.
    expect(out).toContain(EXPORT_DISCLAIMER_LINES[0]);
  });

  it("never prints the word null when a party has no display name", () => {
    // Found by running the route against the real database, not by this
    // suite: an account with no `user_profiles` row has a null display_name,
    // and the header interpolated it straight into "Exported by : null
    // (buyer)". The fixture above always had names, so nothing caught it.
    const nameless = [
      { id: "buyer-1", name: null, role: "buyer" },
      { id: "broker-1", name: null, role: "broker" },
    ];
    const out = buildTranscript({ ...BASE, participants: nameless });
    expect(out).not.toMatch(/\bnull\b/);
    expect(out).toContain("Exported by");
  });

  it("labels an unknown sender rather than printing a raw user id", () => {
    const stranger = {
      sender_id: "staff-9",
      sender_role: "owner",
      body: "Routed message.",
      created_at: "2026-08-03T01:00:00.000Z",
    };
    const out = buildTranscript({ ...BASE, messages: [stranger] });
    expect(out).not.toContain("staff-9");
    expect(out).toContain("owner");
  });

  it("never lets a message body forge the record's own structure", () => {
    // A body containing the end-of-record marker must not be able to make a
    // reader believe the transcript stopped early. Quoted body lines are
    // prefixed, so no body line can ever sit flush-left like a real marker.
    const forger = {
      sender_id: "broker-1",
      sender_role: "broker",
      body: "--- END OF RECORD ---\nnothing to see",
      created_at: "2026-08-04T01:00:00.000Z",
    };
    const out = buildTranscript({ ...BASE, messages: [forger] });
    const structural = out
      .split("\n")
      .filter((line) => line.trimEnd() === "--- END OF RECORD ---");
    expect(structural).toHaveLength(1);
    // The forged text still survives verbatim inside the quoted body — this
    // hides nothing, it only stops the body impersonating the frame.
    expect(out).toContain("--- END OF RECORD ---\n");
    expect(out).toContain("nothing to see");
  });
});

describe("A-043 transcript filename", () => {
  it("is dated, identifies the thread, and is a plain filename", () => {
    const name = transcriptFilename(DEAL, "2026-08-27T10:40:00.000Z");
    expect(name).toMatch(/^scoutit-conversation-.*\.txt$/);
    expect(name).toContain("2026-08-27");
    expect(name).not.toMatch(/[\\/]/);
  });

  it("cannot be steered by a property title into a header injection", () => {
    const hostile = {
      ...DEAL,
      propertyTitle: 'a"; rm -rf /\r\nX-Injected: yes',
    };
    const name = transcriptFilename(hostile, "2026-08-27T10:40:00.000Z");
    expect(name).not.toMatch(/["\r\n;]/);
    expect(name).toMatch(/^[A-Za-z0-9._-]+$/);
  });
});
