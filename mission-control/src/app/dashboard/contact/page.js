import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { Inbox, Mail, Clock } from "lucide-react";
import { setContactStatus } from "./actions";

// The staff end of the contact surface.
//
// /contact on the main site writes to contact_messages; this is where a human
// reads it. Without this page the table is a queue nobody opens, which is the
// same failure as the mailto it replaced — a channel that accepts messages and
// delivers them nowhere.
//
// The table is RLS deny-all by design and holds a stranger's name, email and
// free text, so it is reachable only through the service role, only here, and
// only above OPS_MANAGER.

export const dynamic = "force-dynamic";

const STATUS_STYLES = {
  new: "bg-amber-400/10 text-amber-300 border-amber-400/20",
  in_progress: "bg-sky-400/10 text-sky-300 border-sky-400/20",
  resolved: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  spam: "bg-white/5 text-white/40 border-white/10",
};

const NEXT_ACTIONS = {
  new: [["in_progress", "Pick up"], ["spam", "Spam"]],
  in_progress: [["resolved", "Resolve"], ["spam", "Spam"]],
  resolved: [["in_progress", "Reopen"]],
  spam: [["new", "Not spam"]],
};

function formatWhen(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  });
}

export default async function ContactQueuePage() {
  const staff = await getCurrentStaff();

  if (!staff || staff.tier < TIERS.OPS_MANAGER) {
    redirect("/dashboard?error=InsufficientTier");
  }

  const admin = createAdminClient();
  const { data: messages, error } = await admin
    .from("contact_messages")
    .select("id, created_at, name, email, subject, message, status, handled_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = messages ?? [];
  const openCount = rows.filter((m) => m.status === "new" || m.status === "in_progress").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contact Queue</h1>
          <p className="text-sm text-white/40 mt-1">
            Messages from <span className="text-white/60">/contact</span> on the public site.
          </p>
        </div>
        {openCount > 0 && (
          <span className="text-xs px-3 py-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 text-amber-300">
            {openCount} open
          </span>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-4">
          Failed to load the contact queue: {error.message}
        </div>
      )}

      {!error && rows.length === 0 && (
        <div className="bg-[#121212] border border-white/5 rounded-xl text-sm text-white/50 p-8 text-center flex flex-col items-center gap-2">
          <Inbox className="w-5 h-5 text-white/30" />
          Nothing waiting. Messages sent through the public contact form land here.
        </div>
      )}

      <div className="space-y-3">
        {rows.map((m) => (
          <div key={m.id} className="bg-[#121212] border border-white/5 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{m.name}</span>
                  <span
                    className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                      STATUS_STYLES[m.status] || STATUS_STYLES.spam
                    }`}
                  >
                    {m.status.replace("_", " ")}
                  </span>
                </div>
                <a
                  href={`mailto:${m.email}`}
                  className="text-sm text-white/50 hover:text-white/80 inline-flex items-center gap-1.5 mt-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {m.email}
                </a>
              </div>
              <span className="text-xs text-white/30 inline-flex items-center gap-1.5 shrink-0">
                <Clock className="w-3.5 h-3.5" />
                {formatWhen(m.created_at)}
              </span>
            </div>

            {m.subject && <p className="text-sm text-white/70 mt-3 font-medium">{m.subject}</p>}

            {/* whitespace-pre-wrap: the sender's line breaks are part of what
                they wrote. Collapsing them turns a structured message into a
                wall and loses meaning the reader put there deliberately. */}
            <p className="text-sm text-white/60 mt-2 whitespace-pre-wrap leading-relaxed">
              {m.message}
            </p>

            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {(NEXT_ACTIONS[m.status] || []).map(([next, label]) => (
                <form key={next} action={setContactStatus}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="status" value={next} />
                  <button
                    type="submit"
                    className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/70 hover:text-white hover:border-white/25 transition-colors"
                  >
                    {label}
                  </button>
                </form>
              ))}
              {m.handled_at && (
                <span className="text-xs text-white/25">handled {formatWhen(m.handled_at)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
