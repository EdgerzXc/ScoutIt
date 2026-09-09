"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/lib/supabaseClient";
import { Building2, Check, AlertCircle, ShieldCheck, ShieldOff, Sliders, FileText, ShieldAlert, Wallet } from "lucide-react";
import IntelStudioPanel from "@/components/intel/IntelStudioPanel";
import FeatureConsolePanel from "@/components/admin/FeatureConsolePanel";
import ConnectsRefundPanel from "@/components/admin/ConnectsRefundPanel";
import PropertyVerifyPanel from "@/components/admin/PropertyVerifyPanel";
import { DashboardProvider } from "@/context/DashboardContext";
import VerifiedWorkspaceBoundary from "@/components/auth/VerifiedWorkspaceBoundary";
import { sanitizeError } from "@/lib/sanitizeError";

function AdminPageInner() {
  const [activeTab, setActiveTab] = useState("flags");
  const [pendingProperties, setPendingProperties] = useState([]);
  const [pendingError, setPendingError] = useState(null);
  const [loading, setLoading] = useState(true);

  // A-076: PDF-assisted drafts awaiting their source-document check. AGENTS.md
  // §2.4 requires this before publication, and until now nothing in the product
  // could perform it — the publish route's 422 had no matching key.
  const [pdfQueue, setPdfQueue] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(null);
  const [pdfProcessingId, setPdfProcessingId] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  // RA 9646: PRC credential verification queue
  const [prcQueue, setPrcQueue] = useState([]);
  const [prcLoading, setPrcLoading] = useState(true);
  const [prcProcessingId, setPrcProcessingId] = useState(null);

  async function authHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return { "Content-Type": "application/json", "Authorization": token ? `Bearer ${token}` : "" };
  }

  async function fetchPrcQueue() {
    setPrcLoading(true);
    try {
      const res = await fetch("/api/admin/prc", { headers: await authHeaders() });
      const result = await res.json();
      if (res.ok) setPrcQueue(result.data || []);
    } catch (err) {
      console.error("Failed to load PRC queue", err);
    } finally {
      setPrcLoading(false);
    }
  }

  const handlePrcToggle = async (userId, verified) => {
    setPrcProcessingId(userId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/prc", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ userId, verified }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update verification.");
      setPrcQueue((prev) => prev.map((p) => (p.id === userId ? { ...p, prc_verified: verified } : p)));
      setMessage({ type: "success", text: verified ? "Credential marked PRC Verified." : "Verification revoked." });
    } catch (err) {
      setMessage({ type: "error", text: sanitizeError(err) });
    } finally {
      setPrcProcessingId(null);
    }
  };

  // A-073: reads through a staff-authorized server route, NOT directly from the
  // browser. The old client-direct query was constrained by RLS to rows the
  // viewer owns, so staff saw an empty queue instead of third-party submissions.
  // See the header of /api/admin/pending for the full reasoning.
  async function fetchPending() {
    setLoading(true);
    setPendingError(null);
    try {
      const res = await fetch("/api/admin/pending", { headers: await authHeaders() });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Could not load the submission queue.");
      setPendingProperties(result.properties || []);
    } catch (err) {
      // An empty queue and a failed load look identical to a reviewer. Say which
      // one this is, rather than rendering "no submissions" over an error.
      console.error("Failed to load pending submissions", err);
      setPendingProperties([]);
      setPendingError(sanitizeError(err, "Could not load the submission queue."));
    } finally {
      setLoading(false);
    }
  };

  // A-076: the queue of PDF-assisted drafts a staff member must check against
  // their source document before the owner can publish.
  async function fetchPdfQueue() {
    setPdfLoading(true);
    setPdfError(null);
    try {
      const res = await fetch("/api/admin/pdf-verify", { headers: await authHeaders() });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Could not load the verification queue.");
      setPdfQueue(result.drafts || []);
    } catch (err) {
      console.error("Failed to load PDF verification queue", err);
      setPdfQueue([]);
      setPdfError(sanitizeError(err, "Could not load the verification queue."));
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleVerifyPdfDraft(propertyId) {
    setPdfProcessingId(propertyId);
    try {
      const res = await fetch("/api/admin/pdf-verify", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ propertyId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Could not record the verification.");
      setMessage({ type: "success", text: "Draft verified against its source document. The owner can now publish." });
      await fetchPdfQueue();
    } catch (err) {
      setMessage({ type: "error", text: sanitizeError(err) });
    } finally {
      setPdfProcessingId(null);
    }
  }

  useEffect(() => {
    fetchPending();
    fetchPrcQueue();
    fetchPdfQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (submissionId) => {
    setProcessingId(submissionId);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ submissionId }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to approve property.");
      }

      setMessage({ type: "success", text: "Property approved and synced to Airtable!" });
      
      // Remove from list
      setPendingProperties((prev) => prev.filter((p) => p.id !== submissionId));
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: sanitizeError(err, "Couldn't approve that property.") });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="admin-layout">
      <Header />
      <main className="admin-main">
        <header className="admin-header">
          <span className="vector-label">LAYER 00 // RESTRICTED ACCESS</span>
          {/* A-073: NOT "Mission Control" — that name belongs to exactly one
              thing, the separate staff console in `mission-control/`. See the
              rule in MissionControlMode.js:23-30; the collision cost real time
              once already. */}
          <h1 className="page-title">Admin Console</h1>
          <p className="page-subtitle">Master feature switches, verification queues, and system parameters.</p>
        </header>

        {message && (
          <div className={`admin-alert ${message.type}`}>
            {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-[#222] mb-8 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab("flags")}
            className={`px-4 py-3 text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 rounded-t-lg ${
              activeTab === "flags"
                ? "border-[#E8AE3C] text-[#E8AE3C] bg-[#E8AE3C]/10 font-bold"
                : "border-transparent text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            }`}
          >
            <Sliders size={15} />
            Kill-Switch Console
          </button>

          <button
            onClick={() => setActiveTab("approvals")}
            className={`px-4 py-3 text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 rounded-t-lg ${
              activeTab === "approvals"
                ? "border-[#E8AE3C] text-[#E8AE3C] bg-[#E8AE3C]/10 font-bold"
                : "border-transparent text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            }`}
          >
            <Building2 size={15} />
            Pending Approvals ({pendingProperties.length})
          </button>

          <button
            onClick={() => setActiveTab("prc")}
            className={`px-4 py-3 text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 rounded-t-lg ${
              activeTab === "prc"
                ? "border-[#E8AE3C] text-[#E8AE3C] bg-[#E8AE3C]/10 font-bold"
                : "border-transparent text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            }`}
          >
            <ShieldCheck size={15} />
            PRC Verification ({prcQueue.filter((p) => !p.prc_verified).length})
          </button>

          <button
            onClick={() => setActiveTab("pdf")}
            className={`px-4 py-3 text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 rounded-t-lg ${
              activeTab === "pdf"
                ? "border-[#E8AE3C] text-[#E8AE3C] bg-[#E8AE3C]/10 font-bold"
                : "border-transparent text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            }`}
          >
            <FileText size={15} />
            PDF Drafts ({pdfQueue.length})
          </button>

          <button
            onClick={() => setActiveTab("intel")}
            className={`px-4 py-3 text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 rounded-t-lg ${
              activeTab === "intel"
                ? "border-[#E8AE3C] text-[#E8AE3C] bg-[#E8AE3C]/10 font-bold"
                : "border-transparent text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            }`}
          >
            <FileText size={15} />
            Intel Studio
          </button>

          {/* §40.16 — the only legitimate refund path (§38.3). Before this
              existed, honouring the system-error exception meant hand-written
              SQL that moved a balance and recorded nothing. */}
          <button
            onClick={() => setActiveTab("refunds")}
            className={`px-4 py-3 text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 rounded-t-lg ${
              activeTab === "refunds"
                ? "border-[#E8AE3C] text-[#E8AE3C] bg-[#E8AE3C]/10 font-bold"
                : "border-transparent text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            }`}
          >
            <Wallet size={15} />
            Connect Refunds
          </button>

          {/* ACQ-01 · W12 — /api/property/verify had no caller until now (§51). */}
          <button
            onClick={() => setActiveTab("verify")}
            className={`px-4 py-3 text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 rounded-t-lg ${
              activeTab === "verify"
                ? "border-[#E8AE3C] text-[#E8AE3C] bg-[#E8AE3C]/10 font-bold"
                : "border-transparent text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            }`}
          >
            <ShieldCheck size={15} />
            Re-verification
          </button>
        </div>

        <div className="admin-content">
          {activeTab === "flags" && <FeatureConsolePanel />}

          {activeTab === "refunds" && (
            <div className="admin-panel">
              <div className="panel-header">
                <h2>Connect Refunds</h2>
              </div>
              <ConnectsRefundPanel />
            </div>
          )}

          {activeTab === "verify" && (
            <div className="admin-panel">
              <div className="panel-header">
                <h2>Listing Re-verification</h2>
              </div>
              <PropertyVerifyPanel />
            </div>
          )}

          {activeTab === "approvals" && (
            <div className="admin-panel">
              <div className="panel-header">
                <h2>Pending Approvals</h2>
                <span className="count-badge">{pendingProperties.length}</span>
              </div>

              {loading ? (
                <div className="loading-state">Scanning secure submissions...</div>
              ) : pendingError ? (
                /* A-073: a failed load must never render as "the queue is clear" —
                   a reviewer cannot tell the difference, and the wrong one means
                   real submissions sit unreviewed. */
                <div className="error-state" role="alert">
                  <p>{pendingError}</p>
                  <button type="button" className="btn-retry" onClick={fetchPending}>
                    Try again
                  </button>
                </div>
              ) : pendingProperties.length === 0 ? (
                <div className="empty-state">
                  <p>No pending properties. The queue is clear.</p>
                </div>
              ) : (
                <div className="submission-list">
                  {pendingProperties.map((prop) => (
                    <div key={prop.id} className="submission-card">
                      <div className="submission-info">
                        <div className="info-primary">
                          <Building2 size={16} color="#E8AE3C" />
                          <h3>{prop.title}</h3>
                        </div>
                        <div className="info-secondary">
                          <span className="info-tag">{prop.type}</span>
                          <span className="info-tag">{prop.location}</span>
                          <span className="info-tag coords">
                            {prop.coordinates ? "Geo-located" : "No Coords"}
                          </span>
                        </div>
                        <div className="info-meta">
                          Submitted by: {prop.owner_id || "Unknown"}
                        </div>
                      </div>
                      
                      <div className="submission-actions">
                        <button 
                          className="btn-approve"
                          disabled={processingId === prop.id}
                          onClick={() => handleApprove(prop.id)}
                        >
                          {processingId === prop.id ? "SYNCING..." : "APPROVE TO AIRTABLE"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "pdf" && (
            <div className="admin-panel">
              <div className="panel-header">
                <h2>PDF Draft Verification</h2>
                <span className="count-badge">{pdfQueue.length}</span>
              </div>

              {pdfLoading ? (
                <div className="loading-state">Loading PDF-assisted drafts...</div>
              ) : pdfError ? (
                <div className="error-state" role="alert">
                  <p>{pdfError}</p>
                  <button type="button" className="btn-retry" onClick={fetchPdfQueue}>
                    Try again
                  </button>
                </div>
              ) : pdfQueue.length === 0 ? (
                <div className="empty-state">
                  <p>
                    No PDF-assisted drafts awaiting verification. These appear when an owner
                    builds a listing from an uploaded document.
                  </p>
                </div>
              ) : (
                <div className="submission-list">
                  {pdfQueue.map((draft) => (
                    <div key={draft.id} className="submission-card">
                      <div className="submission-info">
                        <div className="info-primary">
                          <FileText size={16} color="#E8AE3C" />
                          <h3>{draft.title}</h3>
                        </div>
                        <div className="info-secondary">
                          {draft.type && <span className="info-tag">{draft.type}</span>}
                          {draft.location && <span className="info-tag">{draft.location}</span>}
                          <span className="info-tag coords">
                            {draft.pdf_source_url ? "Source attached" : "No source file"}
                          </span>
                        </div>
                        <div className="info-meta">
                          {/* Says what the staff member is attesting to, not just
                              "approve" — the attestation is the whole point. */}
                          Compare every field against the owner&apos;s document before verifying.
                          {draft.pdf_source_url && (
                            <>
                              {" "}
                              <a href={draft.pdf_source_url} target="_blank" rel="noopener noreferrer">
                                Open source document
                              </a>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="submission-actions">
                        <button
                          className="btn-approve"
                          disabled={pdfProcessingId === draft.id}
                          onClick={() => handleVerifyPdfDraft(draft.id)}
                        >
                          {pdfProcessingId === draft.id ? "RECORDING..." : "VERIFIED AGAINST SOURCE"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "prc" && (
            <div className="admin-panel">
              <div className="panel-header">
                <h2>PRC Verification</h2>
                <span className="count-badge">{prcQueue.filter((p) => !p.prc_verified).length}</span>
              </div>

              {prcLoading ? (
                <div className="loading-state">Loading credential submissions...</div>
              ) : prcQueue.length === 0 ? (
                <div className="empty-state">
                  <p>No PRC credentials submitted yet. Brokers add theirs from their dashboard ID card.</p>
                </div>
              ) : (
                <div className="submission-list">
                  {prcQueue.map((p) => (
                    <div key={p.id} className="submission-card">
                      <div className="submission-info">
                        <div className="info-primary">
                          {p.prc_verified
                            ? <ShieldCheck size={16} color="#4caf7d" />
                            : <ShieldOff size={16} color="#E8AE3C" />}
                          <h3>{p.display_name || p.id}</h3>
                        </div>
                        <div className="info-secondary">
                          <span className="info-tag coords">PRC {p.prc_license}</span>
                          {p.dhsud_number && <span className="info-tag">DHSUD {p.dhsud_number}</span>}
                          {p.prc_expiry && <span className="info-tag">Expires {p.prc_expiry}</span>}
                          {p.firm && <span className="info-tag">{p.firm}</span>}
                        </div>
                        <div className="info-meta">
                          {p.prc_verified
                            ? `Verified ${p.prc_verified_at ? new Date(p.prc_verified_at).toLocaleDateString() : ""} — badge live on public profile`
                            : "Unverified — check against the PRC public registry before approving"}
                        </div>
                      </div>

                      <div className="submission-actions">
                        <button
                          className="btn-approve"
                          disabled={prcProcessingId === p.id}
                          onClick={() => handlePrcToggle(p.id, !p.prc_verified)}
                          style={p.prc_verified ? { background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "var(--text-secondary)" } : undefined}
                        >
                          {prcProcessingId === p.id
                            ? "SAVING..."
                            : p.prc_verified ? "REVOKE BADGE" : "MARK PRC VERIFIED"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "intel" && (
            <div className="admin-panel">
              <div className="panel-header">
                <h2>Intel Studio</h2>
              </div>
              <p className="panel-hint">
                Turn any document into an Intel article. Upload a PDF market report, a CSV data
                sheet, or plain text — it gets structured into the universal article format,
                previewed here, and saved to the INTEL_CMS.
              </p>
              <IntelStudioPanel />
            </div>
          )}
        </div>
      </main>
      <Footer />

      <style jsx>{`
        .admin-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #090909;
        }

        .admin-main {
          flex: 1;
          padding: 80px 24px;
          max-width: 1000px;
          margin: 0 auto;
          width: 100%;
        }

        .admin-header {
          margin-bottom: 48px;
        }

        .vector-label {
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          /* A-074. AGENTS.md section 1 locks the palette to deep black plus
             gold; a raw #ff3333 was the only place on the platform breaking
             it. --red is the tokenised semantic red the rest of the app
             already uses, and it themes with the rest of the system. */
          color: var(--red);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          display: block;
          margin-bottom: 16px;
        }

        .page-title {
          font-family: var(--font-display);
          font-size: 38px;
          color: #fff;
          margin-bottom: 12px;
        }

        .page-subtitle {
          font-family: var(--font-body);
          font-size: 16px;
          color: var(--text-secondary);
        }

        .admin-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 4px;
          margin-bottom: 32px;
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .admin-alert.success {
          background: rgba(76, 175, 125, 0.1);
          border: 1px solid rgba(76, 175, 125, 0.3);
          color: #4caf7d;
        }

        .admin-alert.error {
          background: var(--red-dim);
          border: 1px solid var(--red);
          color: var(--red);
        }

        .admin-panel {
          background: #121212;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          overflow: hidden;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(255, 255, 255, 0.02);
        }

        .panel-header h2 {
          font-family: var(--font-display);
          font-size: 20px;
          color: #fff;
          margin: 0;
        }

        .panel-hint {
          padding: 16px 24px 0;
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-secondary);
        }

        .admin-panel :global(.intel-studio) {
          padding: 24px;
        }

        .count-badge {
          background: var(--accent);
          color: #000;
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 20px;
        }

        .loading-state, .empty-state, .error-state {
          padding: 64px;
          text-align: center;
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        /* A-073: reads as a fault, not as an empty queue. Signal red is status
           only — the retry stays the panel's neutral control, so the error does
           not spend the screen's one gold accent. */
        .error-state {
          color: var(--red);
        }
        .error-state .btn-retry {
          margin-top: 16px;
          min-height: 44px;
          padding: 0 20px;
          background: transparent;
          border: 1px solid var(--border-mid);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-family: inherit;
          font-size: inherit;
          text-transform: inherit;
          letter-spacing: inherit;
          cursor: pointer;
          transition: border-color 160ms ease-out, color 160ms ease-out;
        }
        @media (hover: hover) and (pointer: fine) {
          .error-state .btn-retry:hover {
            border-color: var(--accent-muted);
            color: var(--text-primary);
          }
        }
        .error-state .btn-retry:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .error-state .btn-retry:active {
          transform: translateY(1px);
        }

        .submission-list {
          display: flex;
          flex-direction: column;
        }

        .submission-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          transition: background 0.3s ease;
        }

        .submission-card:hover {
          background: rgba(255, 255, 255, 0.01);
        }

        .submission-card:last-child {
          border-bottom: none;
        }

        .submission-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .info-primary {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .info-primary h3 {
          font-family: var(--font-display);
          font-size: 18px;
          color: #fff;
          margin: 0;
        }

        .info-secondary {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .info-tag {
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 8px;
          border-radius: 2px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .info-tag.coords {
          color: var(--accent);
          background: rgba(232, 174, 60, 0.08);
        }

        .info-meta {
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          color: var(--text-muted);
        }

        .btn-approve {
          background: var(--accent);
          color: #000;
          border: none;
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
          transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease, opacity 0.3s ease, filter 0.3s ease;
        }

        .btn-approve:hover:not(:disabled) {
          background: var(--accent-bright);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(232, 174, 60, 0.2);
        }

        .btn-approve:disabled {
          background: var(--text-muted);
          cursor: not-allowed;
          opacity: 0.5;
        }

        @media (max-width: 768px) {
          .submission-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 24px;
          }
          
          .submission-actions {
            width: 100%;
          }
          
          .btn-approve {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default function AdminPage() {
  return (
    <DashboardProvider>
      <VerifiedWorkspaceBoundary>
        <AdminPageInner />
      </VerifiedWorkspaceBoundary>
    </DashboardProvider>
  );
}
