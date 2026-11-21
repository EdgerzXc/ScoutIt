"use client";

import { useRef, useState } from "react";
import {
  approveSubmissionAction,
  loadPdfReviewAction,
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

export default function SubmissionsClient({ initialSubmissions, initialPdfDrafts, pdfQueueError, submissionQueueError, staffTier }) {
  const [activeTab, setActiveTab] = useState("submissions"); // submissions, pdf_drafts
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [pdfDrafts, setPdfDrafts] = useState(initialPdfDrafts);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [review, setReview] = useState(null);
  const [reviewError, setReviewError] = useState(null);
  const reviewDialog = useRef(null);

  const isOpsManager = staffTier >= 2;

  const handleApprove = async (prop) => {
    if (!isOpsManager || busyId) return;
    setError(null);
    setSuccess(null);
    setBusyId(prop.id);

    try {
      const res = await approveSubmissionAction({
        propertyId: prop.id,
        reason: `Staff approval by tier ${staffTier} operator`,
      });

      if (!res.success) {
        setError(res.error || "Could not confirm publication. Refresh the queue before trying again.");
      } else {
        setSuccess(res.publicCachePending
          ? `Approved "${prop.title}". Check the public listing before sharing it.`
          : `Published "${prop.title}".`);
        setSubmissions((prev) => prev.filter((p) => p.id !== prop.id));
      }
    } catch (err) {
      setError(err.message || "Approval failed.");
    } finally {
      setBusyId(null);
    }
  };

  const loadReview = async (draft) => {
    setReview({ draft });
    setReviewError(null);
    setBusyId(draft.id);
    try {
      const result = await loadPdfReviewAction(draft.id);
      if (result.error) setReviewError(result.error);
      else if (reviewDialog.current?.open) setReview({ draft, ...result, sourceOpened: false });
    } catch {
      setReviewError("Could not open the PDF review. Check your staff session and try again.");
    } finally {
      setBusyId(null);
    }
  };

  const openReview = (draft) => {
    reviewDialog.current.showModal();
    void loadReview(draft);
  };

  const handleVerifyPdf = async (draft, comparison) => {
    setError(null);
    setSuccess(null);
    setReviewError(null);
    setBusyId(draft.id);

    try {
      const res = await verifyPdfDraftAction({
        propertyId: draft.id,
        ...(draft.quarantined ? { discard: true } : {}),
        ...(comparison ? {
          sourceReviewed: comparison.quarantined || comparison.sourceOpened,
          sourceVersion: comparison.sourceVersion,
          reviewedDraft: comparison.reviewedDraft,
        } : {}),
      });

      if (res.error) {
        if (comparison && reviewDialog.current?.open) {
          setReviewError(res.error);
          if (res.status === 409) setReview({ draft });
        } else setError(res.error);
      } else {
        reviewDialog.current?.close();
        setSuccess(res.discarded
          ? res.cleanupPending ? "Discard was recorded. Retry deleting the stored PDF." : "Source PDF deleted. The listing remains quarantined."
          : res.cleanupPending ? "Verification was recorded. Retry deleting the stored PDF."
            : comparison ? "Draft verified and source deleted. The owner can publish." : "Source PDF deleted.");
        setPdfDrafts((prev) => res.cleanupPending
          ? prev.map((item) => item.id === draft.id ? { ...item, cleanupPending: true } : item)
          : prev.filter((item) => item.id !== draft.id));
      }
    } catch {
      const message = "Could not finish the PDF review. Check your staff session and try again.";
      if (comparison && reviewDialog.current?.open) setReviewError(message);
      else setError(message);
    } finally {
      setBusyId(null);
    }
  };

  const handleGenerateSeo = async (prop) => {
    if (!isOpsManager || busyId) return;
    setError(null);
    setSuccess(null);
    setBusyId(`seo-${prop.id}`);

    try {
      const res = await generatePropertySeoAction({ propertyId: prop.id });
      if (res.error) {
        setError(res.error);
      } else {
        if (res.publicationPending) setSuccess(`Search metadata saved for "${prop.title}". It will go live with the listing.`);
        else setSuccess(res.publicCachePending ? "Metadata saved. Check the public listing before sharing it." : "Public search metadata updated.");
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
            {isOpsManager && <button
              onClick={() => setActiveTab("pdf_drafts")}
              className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-2 ${
                activeTab === "pdf_drafts"
                  ? "bg-gold text-black font-medium"
                  : "bg-black/40 text-white/60 hover:text-white border border-line"
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              PDF-Assisted Drafts ({pdfDrafts.length})
            </button>}
          </div>

          <span className="text-xs font-mono text-white/60">
            {activeTab === "submissions"
              ? "Live publication pushes directly to Airtable PROPERTIES_CMS"
              : "Mandatory source-document verification before publication (§2.4)"}
          </span>
        </div>

        <div role="alert">
          {error && (
            <div className="mt-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div role="status">
          {success && (
            <div className="mt-4 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{success}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab 1: Submissions */}
      {activeTab === "submissions" && submissionQueueError && (
        <p role="alert" className="rounded-lg border border-line p-4 text-sm text-white/80">
          {submissionQueueError} Reload this page to try again.
        </p>
      )}
      {activeTab === "submissions" && !submissionQueueError && (
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
                          {prop.location || "—"}
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
                                disabled={Boolean(busyId)}
                                aria-busy={isSeoBusy}
                                aria-label={`Prepare search metadata for ${prop.title}`}
                                className="min-h-11 min-w-11 inline-flex items-center justify-center rounded border border-line hover:border-gold/40 text-white/60 hover:text-gold transition-colors disabled:opacity-50"
                              >
                                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            )}
                            {isOpsManager ? (
                              <button
                                onClick={() => handleApprove(prop)}
                                disabled={Boolean(busyId)}
                                className="min-h-11 px-3 py-1 rounded bg-gold text-black font-medium text-xs font-mono uppercase tracking-wider hover:bg-gold/90 transition-colors disabled:opacity-50"
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
                      {pdfQueueError ? <span role="alert">{pdfQueueError}</span> : "No PDF-assisted drafts need review or cleanup."}
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
                          {draft.cleanupPending ? "Deletion pending" : draft.quarantined ? "Quarantined" : draft.sourceAttached ? "Attached" : "PDF missing"}
                        </td>
                        <td className="py-3.5 text-right">
                          {isOpsManager ? (
                            <button
                              type="button"
                              onClick={() => draft.cleanupPending ? handleVerifyPdf(draft) : openReview(draft)}
                              disabled={Boolean(busyId) || !draft.sourceAttached}
                              className="min-h-11 px-3 py-1 rounded border border-line text-gold text-xs font-mono uppercase tracking-wider hover:border-gold/40 focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-50"
                            >
                              {isBusy ? "Working…" : draft.cleanupPending ? "Retry deletion" : draft.quarantined ? "Review quarantine" : "Review source"}
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
      <dialog
        ref={reviewDialog}
        aria-labelledby="pdf-review-heading"
        onClose={() => { setReview(null); setReviewError(null); }}
        className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-xl border border-line bg-surface p-5 text-white backdrop:bg-black/80 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="pdf-review-heading" className="text-xl font-semibold">{review?.draft.quarantined ? "Review quarantined PDF" : "Review source PDF"}</h2>
          <button type="button" onClick={() => reviewDialog.current.close()} className="min-h-11 rounded border border-line px-3 font-mono text-xs uppercase tracking-wider focus-visible:outline-2 focus-visible:outline-gold">Close</button>
        </div>
        {review?.draft?.title && <p className="mt-1 break-words text-sm text-white/70">{review.draft.title}</p>}
        {reviewError && <p className="mt-3 text-sm text-red-400" role="alert">{reviewError}</p>}
        {review && !review.reviewedDraft && !review.quarantined && (
          busyId === review.draft.id ? <p role="status" className="mt-3 text-sm text-white/70">Opening review…</p>
            : <button type="button" className="mt-3 min-h-11 text-sm text-gold underline focus-visible:outline-2 focus-visible:outline-gold" onClick={() => loadReview(review.draft)}>Reload review</button>
        )}
        {review?.quarantined && (
          <>
            <p className="mt-3 text-sm text-white/80">{review.quarantineReason}</p>
            <p className="mt-2 text-sm text-white/70">The owner can upload a new file or enter the listing manually. Discarding this source keeps the listing quarantined.</p>
            <button type="button" disabled={Boolean(busyId)} onClick={() => handleVerifyPdf(review.draft, review)} className="mt-4 min-h-11 rounded border border-line px-4 text-gold font-mono text-xs font-semibold uppercase tracking-wider focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-50">
              {busyId === review.draft.id ? "Recording…" : "Record discard and delete PDF"}
            </button>
          </>
        )}
        {review?.reviewedDraft && (
          <>
            <a href={review.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={() => setReview({ ...review, sourceOpened: true })} className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm text-gold underline focus-visible:outline-2 focus-visible:outline-gold">
              <FileText size={16} aria-hidden="true" /> Download source PDF <ExternalLink size={14} aria-hidden="true" />
            </a>
            <p className="text-sm text-white/70">Compare the draft fields with the source. Confirming records the review and deletes the PDF.</p>
            <PdfReviewFacts facts={review.reviewedDraft} />
            <button type="button" disabled={!review.sourceOpened || Boolean(busyId)} onClick={() => handleVerifyPdf(review.draft, review)} className="mt-4 min-h-11 rounded bg-gold px-4 text-black font-mono text-xs font-semibold uppercase tracking-wider focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-50">
              {busyId === review.draft.id ? "Confirming…" : "Confirm match and delete PDF"}
            </button>
          </>
        )}
      </dialog>
    </div>
  );
}

function PdfReviewFacts({ facts }) {
  const { listing_details: details = {}, ...summary } = facts;
  return (
    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
      {[["summary", summary], ["details", details]].flatMap(([section, values]) =>
        Object.entries(values).map(([key, value]) => (
          <div key={`${section}-${key}`} className="min-w-0">
            <dt className="font-mono text-xs uppercase tracking-wider text-white/70">{key.replaceAll("_", " ")}</dt>
            <dd className="break-words text-sm">{value == null || value === "" ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value)}</dd>
          </div>
        )),
      )}
    </dl>
  );
}
