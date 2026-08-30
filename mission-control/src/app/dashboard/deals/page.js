import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { Handshake, Lock, MessageSquare, CalendarClock, ShieldAlert, Briefcase } from "lucide-react";

import { summarise, toOversightRow } from "@/lib/dealOversightPolicy.mjs";

// Deal Oversight — staff could not previously see that a deal existed at all.
//
// Read-only by design. This answers "is this real, is it moving, who is in it",
// which is every question staff are actually asked. It does not answer "what
// did they say" unless a party has filed a dispute — see dealOversightPolicy.mjs
// for that line and why it is drawn there.

export const dynamic = "force-dynamic";

export default async function DealsPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  if (staff.tier < TIERS.OPS_MANAGER) {
    redirect("/dashboard?error=InsufficientTier");
  }

  const admin = createAdminClient();

  const { data: deals, error } = await admin
    .from("deals")
    .select(
      "id, status, buyer_id, broker_id, property_id, unit_id, connects_spent, created_at, closed_at, expires_at, archived_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  let rows = [];
  if (deals?.length) {
    const dealIds = deals.map((d) => d.id);

    // Counts and timing only. The bodies are fetched below, and only for the
    // deals whose dispute state permits it.
    const [messages, disputes, handshakes, viewings] = await Promise.all([
      admin.from("deal_messages").select("deal_id, created_at").in("deal_id", dealIds),
      admin.from("deal_disputes").select("deal_id, status").in("deal_id", dealIds),
      admin
        .from("deal_handshakes")
        .select("id, deal_id, handshake_type, status, party_a_signed_at, party_b_signed_at")
        .in("deal_id", dealIds),
      admin
        .from("viewing_appointments")
        .select("id, deal_id, scheduled_at, status, duration_minutes")
        .in("deal_id", dealIds),
    ]);

    const group = (list, key = "deal_id") => {
      const out = {};
      for (const item of list || []) (out[item[key]] ||= []).push(item);
      return out;
    };
    const msgsByDeal = group(messages.data);
    const disputesByDeal = group(disputes.data);
    const shakesByDeal = group(handshakes.data);
    const viewsByDeal = group(viewings.data);

    // Bodies are read for disputed deals only — and the policy still filters
    // them, so a mistake here cannot leak them onto the page.
    const disputedIds = Object.entries(disputesByDeal)
      .filter(([, ds]) => ds.some((d) => ["open_hold", "under_review"].includes(d.status)))
      .map(([id]) => id);

    let bodiesByDeal = {};
    if (disputedIds.length) {
      const { data: bodies } = await admin
        .from("deal_messages")
        .select("id, deal_id, sender_role, body, created_at")
        .in("deal_id", disputedIds)
        .order("created_at", { ascending: true });
      bodiesByDeal = group(bodies);
    }

    rows = deals.map((deal) => {
      const msgs = msgsByDeal[deal.id] || [];
      return toOversightRow({
        deal,
        messageCount: msgs.length,
        lastMessageAt: msgs.reduce(
          (latest, m) => (!latest || m.created_at > latest ? m.created_at : latest),
          null
        ),
        disputeStatuses: (disputesByDeal[deal.id] || []).map((d) => d.status),
        handshakes: shakesByDeal[deal.id] || [],
        viewings: viewsByDeal[deal.id] || [],
        messages: bodiesByDeal[deal.id] || null,
      });
    });
  }

  const disputed = rows.filter((r) => r.hasOpenDispute).length;
  const waiting = rows.filter((r) => r.handshakes.some((h) => h.awaitingCountersignature)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-[#E8AE3C]" />
          Deal Oversight
        </h1>
        <p className="text-sm text-white/60 mt-1 max-w-3xl">
          Every deal, whether it is moving, and who is in it. Read-only. What the parties said to
          each other stays private unless one of them files a dispute — that is the promise the
          product makes, and staff oversight does not quietly revoke it.
        </p>
        {rows.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3 text-[12px] uppercase tracking-wide">
            <span className="text-white/70 border border-white/10 bg-white/5 rounded-full px-3 py-1">
              {rows.length} deals
            </span>
            {disputed > 0 && (
              <span className="text-red-300 border border-red-400/30 bg-red-400/10 rounded-full px-3 py-1">
                {disputed} in dispute
              </span>
            )}
            {waiting > 0 && (
              <span className="text-[#F7C64E] border border-[rgba(232,174,60,0.3)] bg-[rgba(232,174,60,0.08)] rounded-full px-3 py-1">
                {waiting} awaiting a countersignature
              </span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-4">
          Could not read the deal pipeline: {error.message}
        </div>
      )}

      {rows.length === 0 && !error ? (
        <div className="bg-[#121212] border border-white/5 rounded-xl p-8 text-center text-sm text-white/70 flex flex-col items-center gap-2">
          <Handshake className="w-5 h-5 text-white/70" />
          No deals yet. Every buyer–broker connection made on the site appears here from the moment
          it opens.
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <section
              key={row.id}
              className={`bg-[#121212] border rounded-xl p-5 space-y-3 ${
                row.hasOpenDispute ? "border-red-400/30" : "border-white/5"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-white/90">{summarise(row)}</p>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-white/60">
                    <span className="font-mono">deal {row.id.slice(0, 8)}</span>
                    <span className="font-mono">buyer {row.buyerId || "—"}</span>
                    <span className="font-mono">broker {row.brokerId || "—"}</span>
                    <span>opened {new Date(row.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className="text-[12px] uppercase tracking-wide border border-white/10 bg-white/5 rounded-full px-2 py-0.5 text-white/70">
                  {row.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/70">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {row.messageCount} message{row.messageCount === 1 ? "" : "s"}
                  {row.lastMessageAt && (
                    <span className="text-white/60">
                      · last {new Date(row.lastMessageAt).toLocaleString()}
                    </span>
                  )}
                </span>
                {row.handshakes.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Handshake className="w-3.5 h-3.5" />
                    {row.handshakes.length} handshake{row.handshakes.length === 1 ? "" : "s"}
                    {row.handshakes.some((h) => h.awaitingCountersignature) && (
                      <span className="text-[#F7C64E]">· one side is waiting</span>
                    )}
                  </span>
                )}
                {row.viewings.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5" />
                    {row.viewings.length} viewing{row.viewings.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              {/* The line. Stated on every deal, in both directions. */}
              <div
                className={`text-xs rounded-lg border p-3 flex items-start gap-2 ${
                  row.messagesVisible
                    ? "text-red-300 border-red-400/25 bg-red-400/10"
                    : "text-white/70 border-white/10 bg-white/5"
                }`}
              >
                {row.messagesVisible ? (
                  <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 mt-0.5 shrink-0" />
                )}
                <p>{row.messagesReason}</p>
              </div>

              {row.messagesVisible && row.messages && (
                <details>
                  <summary className="text-[12px] text-white/60 hover:text-white/80 cursor-pointer select-none">
                    Read the conversation ({row.messages.length})
                  </summary>
                  <ul className="mt-2 space-y-2">
                    {row.messages.map((m) => (
                      <li
                        key={m.id}
                        className="text-xs text-white/80 bg-black/40 border border-white/10 rounded-lg p-3"
                      >
                        <div className="text-[12px] text-white/60 mb-1">
                          {m.sender_role} · {new Date(m.created_at).toLocaleString()}
                        </div>
                        {m.body}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
