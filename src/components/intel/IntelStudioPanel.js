"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileText, Eye, Send, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import ArticleBlocks from "./ArticleBlocks";

// Intel Studio — turn any document into a published Intel article.
// Upload a PDF / CSV / TXT / MD (or paste text), preview the structured
// result, then save it straight into the Airtable INTEL_CMS via
// /api/intel/ingest. One universal schema for every article.

export default function IntelStudioPanel() {
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState("");
  const [preview, setPreview] = useState(null); // { article, engine }
  const [isWorking, setIsWorking] = useState(false);
  const [publishNow, setPublishNow] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', text, url? }
  const fileInputRef = useRef(null);

  const buildFormData = async (extra = {}) => {
    const fd = new FormData();
    if (file) fd.append("file", file);
    if (!file && pastedText.trim()) fd.append("text", pastedText.trim());
    // Dev sandbox bypass mirrors the rest of the dashboard toolbox.
    try {
      const mockStr = localStorage.getItem("scoutit_user");
      if (mockStr && mockStr.includes("master-dev")) fd.append("mockOwnerId", "master-dev");
    } catch { /* localStorage unavailable */ }
    Object.entries(extra).forEach(([k, v]) => fd.append(k, v));
    return fd;
  };

  const authHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  };

  const run = async ({ previewOnly }) => {
    if (!file && !pastedText.trim()) {
      setStatus({ type: "error", text: "Choose a file or paste some text first." });
      return;
    }
    setIsWorking(true);
    setStatus(null);
    try {
      const fd = await buildFormData(
        previewOnly ? { previewOnly: "true" } : { publish: publishNow ? "true" : "false" }
      );
      const res = await fetch("/api/intel/ingest", {
        method: "POST",
        headers: await authHeader(),
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "The document could not be processed.");

      if (previewOnly) {
        setPreview({ article: data.article, engine: data.engine });
      } else {
        setPreview(null);
        setFile(null);
        setPastedText("");
        setStatus({
          type: "success",
          text: data.published
            ? `Published "${data.article.title}" — it is live on the site now.`
            : `Saved "${data.article.title}" as a draft. Check Approved_For_Live_Site in Airtable to publish it.`,
          url: data.published ? data.url : null,
        });
      }
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="intel-studio">
      <div className="studio-grid">
        <div className="studio-input">
          <button
            type="button"
            className="dropzone"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud size={22} />
            {file ? (
              <span className="file-chip">
                <FileText size={13} /> {file.name}
                <X
                  size={13}
                  onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                />
              </span>
            ) : (
              <span>Upload a PDF, CSV, TXT, or Markdown file</span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.csv,.txt,.md,application/pdf,text/csv,text/plain,text/markdown"
              hidden
              onChange={(e) => { setFile(e.target.files?.[0] || null); setPreview(null); }}
            />
          </button>

          <div className="or-rule"><span>or paste text</span></div>

          <textarea
            className="paste-area"
            rows={5}
            placeholder="Paste a market report, memo, or article draft here..."
            value={pastedText}
            onChange={(e) => { setPastedText(e.target.value); setPreview(null); }}
            disabled={!!file}
          />

          <label className="publish-toggle">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(e) => setPublishNow(e.target.checked)}
            />
            <span>Publish immediately (otherwise it saves as a draft for review)</span>
          </label>

          <div className="studio-actions">
            <button
              type="button"
              className="btn-ghost"
              disabled={isWorking}
              onClick={() => run({ previewOnly: true })}
            >
              <Eye size={14} /> {isWorking ? "Working..." : "Preview"}
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={isWorking}
              onClick={() => run({ previewOnly: false })}
            >
              <Send size={14} /> {isWorking ? "Working..." : publishNow ? "Publish Article" : "Save Draft"}
            </button>
          </div>

          {status && (
            <div className={`studio-status ${status.type}`}>
              {status.text}
              {status.url && (
                <a href={status.url} target="_blank" rel="noreferrer"> View it →</a>
              )}
            </div>
          )}
        </div>

        {preview && (
          <div className="studio-preview">
            <div className="preview-head">
              <span className="preview-engine">
                Structured by {preview.engine === "gemini" ? "AI" : "the built-in parser"} · {preview.article.category} · {preview.article.intelType}
              </span>
              <h3 className="preview-title">{preview.article.title}</h3>
              {preview.article.lead && <p className="preview-lead">{preview.article.lead}</p>}
            </div>
            <div className="preview-body">
              <ArticleBlocks blocks={preview.article.blocks} />
            </div>
          </div>
        )}
      </div>

      <style>{`
        .intel-studio { width: 100%; }
        .studio-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .studio-input {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .dropzone {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 28px 16px;
          border: 1px dashed rgba(232, 174, 60, 0.4);
          border-radius: var(--radius-lg);
          background: rgba(232, 174, 60, 0.03);
          color: var(--text-secondary);
          font-family: var(--font-mono), monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: border-color 0.2s ease, background 0.2s ease;
          min-height: 44px;
          width: 100%;
        }
        .dropzone:hover { border-color: var(--accent); background: rgba(232, 174, 60, 0.06); }
        .dropzone svg { color: var(--accent); }
        .file-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--accent);
          text-transform: none;
          letter-spacing: 0.02em;
          font-size: 12px;
          word-break: break-all;
        }
        .or-rule {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-muted);
          font-family: var(--font-mono), monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .or-rule::before, .or-rule::after {
          content: "";
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
        }
        .paste-area {
          width: 100%;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-lg);
          padding: 14px 16px;
          font-size: 16px;
          line-height: 1.6;
          color: var(--text-primary);
          resize: vertical;
        }
        .paste-area:focus { outline: none; border-color: rgba(232, 174, 60, 0.5); }
        .paste-area:disabled { opacity: 0.4; }
        .publish-toggle {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--text-secondary);
          cursor: pointer;
          min-height: 44px;
        }
        .publish-toggle input { accent-color: var(--accent); width: 16px; height: 16px; }
        .studio-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .btn-primary, .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 22px;
          border-radius: 999px;
          font-family: var(--font-mono), monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          min-height: 44px;
          transition: all 0.2s ease;
        }
        .btn-primary {
          background: var(--accent);
          border: 1px solid var(--accent);
          color: #0d0d0d;
          font-weight: 700;
        }
        .btn-primary:hover:not(:disabled) { background: var(--accent-bright, #F7C64E); }
        .btn-ghost {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: var(--text-secondary);
        }
        .btn-ghost:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
        .btn-primary:disabled, .btn-ghost:disabled { opacity: 0.5; cursor: wait; }
        .studio-status {
          padding: 14px 16px;
          border-radius: var(--radius-md);
          font-size: 13px;
          line-height: 1.5;
        }
        .studio-status.success {
          background: rgba(76, 175, 125, 0.1);
          border: 1px solid rgba(76, 175, 125, 0.3);
          color: #4caf7d;
        }
        .studio-status.error {
          background: rgba(255, 82, 82, 0.08);
          border: 1px solid rgba(255, 82, 82, 0.3);
          color: #ff8a8a;
        }
        .studio-status a { color: var(--accent); text-decoration: underline; }
        .studio-preview {
          border: 1px solid rgba(232, 174, 60, 0.2);
          border-radius: var(--radius-lg);
          background: rgba(255, 255, 255, 0.02);
          padding: clamp(16px, 4vw, 32px);
        }
        .preview-head { margin-bottom: 20px; }
        .preview-engine {
          font-family: var(--font-mono), monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
          display: block;
          margin-bottom: 8px;
        }
        .preview-title {
          font-family: var(--font-display);
          font-size: clamp(20px, 4vw, 26px);
          color: var(--text-primary);
          line-height: 1.3;
        }
        .preview-lead {
          margin-top: 8px;
          font-style: italic;
          color: var(--text-secondary);
          font-size: 15px;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
