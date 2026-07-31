import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { brainHasAI } from "@/lib/brain";
import { ingestDocument, deleteDocument } from "./actions";
import BrainSearch from "./BrainSearch";
import { BrainCircuit, Plus, FileText, Trash2, Zap } from "lucide-react";

// Team Brain — natural-language Q&A over the ScoutIt knowledge base. The Q&A
// island is a client component (BrainSearch); this Server Component handles
// gating, the ingest form, and the document library. Degrades to keyword
// search if no GEMINI_API_KEY is set; degrades to an empty library with a
// setup note if migration 0007 has not been applied.

async function safe(promise) {
  try {
    const result = await promise;
    if (result.error) throw new Error(result.error.message);
    return { data: result.data ?? [], error: null };
  } catch (err) {
    return { data: [], error: err.message || String(err) };
  }
}

export default async function BrainPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/?error=NotAuthorized");
  const canDelete = staff.tier >= TIERS.OPS_MANAGER;
  const aiAvailable = brainHasAI();

  const admin = createAdminClient();
  const docs = await safe(
    admin
      .from("brain_documents")
      .select("id, title, source, category, created_by, created_at")
      .order("created_at", { ascending: false })
      .limit(100)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-[#E8AE3C]" />
            Team Brain
          </h1>
          <p className="text-[10px] uppercase tracking-wide text-white/40 mt-1">
            Ask the knowledge base in plain language
          </p>
        </div>
        <span
          className={`text-[10px] uppercase tracking-wide rounded-full px-2.5 py-1 border whitespace-nowrap flex items-center gap-1.5 ${
            aiAvailable
              ? "text-emerald-400 border-emerald-400/25 bg-emerald-400/10"
              : "text-white/40 border-white/10"
          }`}
        >
          <Zap className="w-3 h-3" />
          {aiAvailable ? "AI answers on" : "Keyword mode"}
        </span>
      </div>

      {/* Q&A */}
      <BrainSearch aiAvailable={aiAvailable} />

      {docs.error && (
        <div className="text-xs text-white/50 bg-white/5 border border-white/10 rounded-xl p-4">
          Brain unavailable ({docs.error}). Apply migration
          <span className="font-mono text-white/70"> 0007_brain_rag.sql </span>
          to activate this module.
        </div>
      )}

      {/* Ingest */}
      <details className="bg-[#121212] border border-white/5 rounded-xl overflow-hidden">
        <summary className="flex items-center gap-2 px-6 py-4 cursor-pointer text-sm text-white/70 hover:text-white select-none">
          <Plus className="w-4 h-4 text-[#E8AE3C]" />
          Add knowledge to the Brain
        </summary>
        <form action={ingestDocument} className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs text-white/50">
            Title (required)
            <input
              name="title"
              required
              placeholder="e.g. Commercial upload playbook"
              className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20"
            />
          </label>
          <label className="text-xs text-white/50">
            Category
            <input
              name="category"
              placeholder="e.g. SOP, Pricing, Onboarding"
              className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20"
            />
          </label>
          <label className="text-xs text-white/50 sm:col-span-2">
            Content (required)
            <textarea
              name="content"
              required
              rows={6}
              placeholder="Paste the SOP, playbook, or reference text. It will be chunked and embedded automatically."
              className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20"
            />
          </label>
          <input type="hidden" name="source" value="manual" />
          <div className="sm:col-span-2">
            <button className="px-4 py-2 rounded-lg text-sm font-medium bg-[rgba(232,174,60,0.10)] hover:bg-[rgba(232,174,60,0.18)] text-[#F7C64E] border border-[rgba(232,174,60,0.25)] transition-colors">
              Ingest document
            </button>
          </div>
        </form>
      </details>

      {/* Library */}
      <section className="bg-[#121212] border border-white/5 rounded-xl p-6">
        <h2 className="text-sm font-medium text-white/70 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-white/40" />
          Knowledge library
          <span className="text-white/30">· {docs.data.length}</span>
        </h2>
        {docs.data.length === 0 ? (
          <p className="text-xs text-white/40">
            The Brain is empty. Add your first SOP or playbook above.
          </p>
        ) : (
          <div className="divide-y divide-white/5">
            {docs.data.map((d) => (
              <div key={d.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-white/90 truncate">{d.title}</div>
                  <div className="text-[11px] text-white/40 truncate">
                    {d.category ? `${d.category} · ` : ""}
                    {d.source} · {d.created_by || "—"} ·{" "}
                    {new Date(d.created_at).toLocaleDateString()}
                  </div>
                </div>
                {canDelete && (
                  <form action={deleteDocument}>
                    <input type="hidden" name="documentId" value={d.id} />
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400/70 hover:text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/20 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
