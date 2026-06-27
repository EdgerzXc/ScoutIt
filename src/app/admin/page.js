"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/lib/supabaseClient";
import { Building2, Check, AlertCircle } from "lucide-react";

export default function AdminPage() {
  const [pendingProperties, setPendingProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('pipeline_status', 'pending')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPendingProperties(data);
    }
    setLoading(false);
  };

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
      setMessage({ type: "error", text: err.message });
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
          <h1 className="page-title">Intelligence Control</h1>
          <p className="page-subtitle">Review and sync pending property submissions to the public directory.</p>
        </header>

        {message && (
          <div className={`admin-alert ${message.type}`}>
            {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="admin-content">
          <div className="admin-panel">
            <div className="panel-header">
              <h2>Pending Approvals</h2>
              <span className="count-badge">{pendingProperties.length}</span>
            </div>

            {loading ? (
              <div className="loading-state">Scanning secure submissions...</div>
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
          font-size: 10px;
          color: #ff3333; /* Red accent for restricted/admin */
          text-transform: uppercase;
          letter-spacing: 0.2em;
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
          background: rgba(255, 51, 51, 0.1);
          border: 1px solid rgba(255, 51, 51, 0.3);
          color: #ff3333;
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

        .count-badge {
          background: var(--accent);
          color: #000;
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 20px;
        }

        .loading-state, .empty-state {
          padding: 64px;
          text-align: center;
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
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
          font-size: 10px;
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
          font-size: 10px;
          color: var(--text-muted);
        }

        .btn-approve {
          background: var(--accent);
          color: #000;
          border: none;
          font-family: var(--font-mono), monospace;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
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
