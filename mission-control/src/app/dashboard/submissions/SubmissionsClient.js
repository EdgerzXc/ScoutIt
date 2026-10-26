"use client";

import { useState } from "react";
import {
  approveSubmissionAction,
  verifyPdfDraftAction,
  generatePropertySeoAction,
} from "./actions";
import {
  FileCheck,
  FileText,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Building,
} from "lucide-react";

export default function SubmissionsClient({ initialSubmissions, initialPdfDrafts, staffTier }) {
  const [activeTab, setActiveTab] = useState("submissions"); // submissions, pdf_drafts
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [pdfDrafts, setPdfDrafts] = useState(initialPdfDrafts);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const isOpsManager = staffTier >= 2;

  const handleApprove = async (prop) => {
    if (!isOpsManager) return;
    setError(null);
    setSuccess(null);
    setBusyId(prop.id);

    try {
      const res = await approveSubmissionAction({
        propertyId: prop.id,
        reason: `Staff approval by tier ${staffTier} operator`,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(`Listing "${prop.title}" successfully approved to live catalogue! Public cache purged.`);
        setSubmissions((prev) => prev.filter((p) => p.id !== prop.id));
      }
    } catch (err) {
      setError(err.message || "Approval failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handleVerifyPdf = async (draft) => {
    if (!isOpsManager) return;
    setError(null);
    setSuccess(null);
    setBusyId(draft.id);

    try {
      const res = await verifyPdfDraftAction({
        propertyId: draft.id,
        reason: "Source document verified against PDF upload by staff operator",
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(`PDF-assisted draft "${draft.title}" verified. Listing is now eligible for publication.`);
        setPdfDrafts((prev) => prev.filter((d) => d.id !== draft.id));
      }
    } catch (err) {
      setError(err.message || "PDF verification failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handleGenerateSeo = async (prop) => {
    if (!isOpsManager) return;
    setError(null);
    setSuccess(null);
    setBusyId(`seo-${prop.id}`);

    try {
      const res = await generatePropertySeoAction({ propertyId: prop.id });
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(`Generated SEO title: "${res.title}"`);
      }
    } catch (err) {
      setError(err.message || "SEO generation failed.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="p-6 rounded-xl border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("submissions")}
              className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-2 ${
                activeTab === "submissions"
                  ? "bg-gold text-black font-medium"
                  : "bg-black/40 text-white/60 hover:text-white border border-line"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              Submissions Queue ({submissions.length})
            </button>
            <button
              onClick={() => setActiveTab("pdf_drafts")}
              className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-2 ${
                activeTab === "pdf_drafts"
                  ? "bg-gold text-black font-medium"
                  : "bg-black/40 text-white/60 hover:text-white border border-line"
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              PDF-Assisted Drafts ({pdfDrafts.length})
            </button>
          </div>

          <span className="text-xs font-mono text-white/60">
            {activeTab === "submissions"
              ? "Live publication pushes directly to Airtable PROPERTIES_CMS"
              : "Mandatory source-document verification before publication (§2.4)"}
          </span>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}
      </div>

      {/* Tab 1: Submissions */}
      {activeTab === "submissions" && (
        <div className="p-6 rounded-xl border border-line bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line text-white/60 font-mono text-xs uppercase tracking-wider">
                  <th className="pb-3">Listing Title</th>
                  <th className="pb-3">Location / City</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Submitted At</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Publication Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-white/60 font-mono">
                      No pending submissions in the queue.
                    </td>
                  </tr>
                ) : (
                  submissions.map((prop) => {
                    const isBusy = busyId === prop.id;
                    const isSeoBusy = busyId === `seo-${prop.id}`;

                    return (
                      <tr key={prop.id} className="hover:bg-white/[0.02]">
                        <td className="py-3.5">
                          <div className="font-medium text-white">{prop.title}</div>
                          <div className="text-xs font-mono text-white/60">ID: {prop.id}</div>
                        </td>
                        <td className="py-3.5 text-white/70">
                          {prop.location || prop.city || "—"}
                        </td>
                        <td className="py-3.5 font-mono text-white/60">
                          {prop.space_category || prop.type || "Commercial"}
                        </td>
                        <td className="py-3.5 font-mono text-white/60">
                          {new Date(prop.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded text-xs font-mono uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            {prop.pipeline_status || "Pending"}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isOpsManager && (
                              <button
                                onClick={() => handleGenerateSeo(prop)}
                                disabled={isSeoBusy}
                                title="Generate SEO Title & Description"
                                className="p-1.5 rounded border border-line hover:border-gold/40 text-white/60 hover:text-gold transition-colors disabled:opacity-50"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {isOpsManager ? (
                              <button
                                onClick={() => handleApprove(prop)}
                                disabled={isBusy}
                                className="px-3 py-1 rounded bg-gold text-black font-medium text-xs font-mono uppercase tracking-wider hover:bg-gold/90 transition-colors disabled:opacity-50"
                              >
                                {isBusy ? "Publishing..." : "Approve to Live"}
                              </button>
                            ) : (
                              <span className="text-xs font-mono text-white/60 uppercase">Tier 2+</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: PDF-Assisted Drafts */}
      {activeTab === "pdf_drafts" && (
        <div className="p-6 rounded-xl border border-line bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line text-white/60 font-mono text-xs uppercase tracking-wider">
                  <th className="pb-3">Draft Title</th>
                  <th className="pb-3">Location</th>
                  <th className="pb-3">Created</th>
                  <th className="pb-3">Source Document</th>
                  <th className="pb-3 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {pdfDrafts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-white/60 font-mono">
                      No unverified PDF-assisted drafts in the queue.
                    </td>
                  </tr>
                ) : (
                  pdfDrafts.map((draft) => {
                    const isBusy = busyId === draft.id;

                    return (
                      <tr key={draft.id} className="hover:bg-white/[0.02]">
                        <td className="py-3.5">
                          <div className="font-medium text-white">{draft.title}</div>
                          <div className="text-xs font-mono text-white/60">ID: {draft.id}</div>
                        </td>
                        <td className="py-3.5 text-white/70">{draft.location || "—"}</td>
                        <td className="py-3.5 font-mono text-white/60">
                          {new Date(draft.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5">
                          {draft.pdf_source_url ? (
                            <a
                              href={draft.pdf_source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-gold hover:underline font-mono text-xs"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              View PDF Source
                              <ExternalLink className="w-3 h-3 opacity-60" />
                            </a>
                          ) : (
                            <span className="text-white/60 font-mono text-xs">No PDF link attached</span>
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          {isOpsManager ? (
                            <button
                              onClick={() => handleVerifyPdf(draft)}
                              disabled={isBusy}
                              className="px-3 py-1 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-medium text-xs font-mono uppercase tracking-wider hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                            >
                              {isBusy ? "Verifying..." : "Verify Against Source"}
                            </button>
                          ) : (
                            <span className="text-xs font-mono text-white/60 uppercase">Tier 2+</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
