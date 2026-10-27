"use client";

import { useState, useRef } from "react";
import useModalDialog from "@/components/ui/useModalDialog";
import { X, UploadCloud, FileText, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Users } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { detectAndParseLeads } from "@/lib/leadImport";

export default function ImportLeadsModal({
  isOpen,
  onClose,
  onImport,
  existingDeals = [],
}) {
  const dialogRef = useRef(null);
  useModalDialog(dialogRef, { active: isOpen, onClose });

  const reduceMotion = useReducedMotion();
  const fileInputRef = useRef(null);

  const [inputMode, setInputMode] = useState("file"); // "file" | "paste"
  const [pastedText, setPastedText] = useState("");
  const [parseResult, setParseResult] = useState(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleReset = () => {
    setParseResult(null);
    setPastedText("");
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processText = (text, name = "") => {
    setIsProcessing(true);
    setFileName(name);
    try {
      const res = detectAndParseLeads(text, existingDeals);
      setParseResult(res);
    } catch (err) {
      setParseResult({ success: false, error: err.message || "Failed to process lead file." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        processText(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        processText(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    processText(pastedText, "pasted-content.csv");
  };

  const handleCommit = () => {
    if (!parseResult || !parseResult.success) return;
    const leadsToImport = skipDuplicates
      ? parseResult.rows.filter((r) => !r.isDuplicate)
      : parseResult.rows;

    if (onImport) {
      onImport(leadsToImport);
    }
    handleReset();
    onClose();
  };

  const validCount = parseResult?.rows?.filter((r) => !r.isDuplicate)?.length || 0;
  const duplicateCount = parseResult?.duplicateCount || 0;
  const commitCount = skipDuplicates ? validCount : (parseResult?.totalCount || 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop Scrim */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
          className="absolute inset-0 backdrop-blur-sm"
          style={{ background: "var(--modal-scrim)" }}
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: reduceMotion ? 0 : 0.24, ease: "easeOut" }}
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-leads-modal-title"
          className="relative w-full max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto bg-surface border border-surface-variant rounded-xl shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-surface-variant bg-surface/50">
            <div>
              <span className="font-label-caps text-xs uppercase text-gold-accent tracking-widest font-mono">
                Super-User Lead Mobility
              </span>
              <h2 id="import-leads-modal-title" className="font-headline-editorial text-2xl text-on-surface flex items-center gap-2 mt-0.5">
                <Users size={22} className="text-gold-accent" /> Import Pipeline Leads
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="min-h-11 min-w-11 flex items-center justify-center rounded-full text-text-muted hover:text-on-surface hover:bg-surface-alt transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {!parseResult ? (
              <>
                {/* Method Switcher */}
                <div className="flex gap-2 border-b border-surface-variant pb-3">
                  <button
                    type="button"
                    onClick={() => setInputMode("file")}
                    className={`min-h-11 px-4 py-2 font-label-caps text-xs uppercase font-mono tracking-wider rounded transition ${
                      inputMode === "file"
                        ? "bg-gold-accent/10 border border-gold-accent/40 text-gold-accent"
                        : "text-text-secondary hover:text-on-surface"
                    }`}
                  >
                    Upload CSV or vCard (.vcf)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode("paste")}
                    className={`min-h-11 px-4 py-2 font-label-caps text-xs uppercase font-mono tracking-wider rounded transition ${
                      inputMode === "paste"
                        ? "bg-gold-accent/10 border border-gold-accent/40 text-gold-accent"
                        : "text-text-secondary hover:text-on-surface"
                    }`}
                  >
                    Paste Raw Text
                  </button>
                </div>

                {inputMode === "file" ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                      isDragging
                        ? "border-gold-accent bg-gold-accent/5"
                        : "border-surface-variant hover:border-gold-accent/40 bg-surface-alt"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.vcf,text/csv,text/vcard,text/plain"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-container flex items-center justify-center border border-surface-variant text-gold-accent">
                      <UploadCloud size={24} />
                    </div>
                    <p className="font-working-title text-base text-on-surface mb-1">
                      Drag & drop your CSV or vCard file here
                    </p>
                    <p className="text-xs text-text-secondary font-mono tracking-wider">
                      Supports HubSpot, Salesforce, Google Contacts (.csv) and Apple / Android Address Book (.vcf)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-xs uppercase tracking-wider font-mono text-text-secondary">
                      Paste CSV rows or vCard data
                    </label>
                    <textarea
                      rows={6}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="Name, Email, Phone, Property, Budget, Notes&#10;Juan Dela Cruz, juan@example.com, +639171234567, High Street South, 150000, Inquiring on 2BR"
                      className="w-full bg-surface-alt border border-surface-variant rounded-lg p-3 text-sm text-on-surface font-mono placeholder:text-text-muted focus:outline-none focus:border-gold-accent transition"
                    />
                    <button
                      type="button"
                      onClick={handlePasteSubmit}
                      disabled={!pastedText.trim()}
                      className="min-h-11 px-5 py-2 rounded bg-gold-accent text-background font-label-caps text-xs font-mono font-bold uppercase tracking-wider hover:bg-gold-bright transition disabled:opacity-50"
                    >
                      Parse Input
                    </button>
                  </div>
                )}
              </>
            ) : parseResult.success ? (
              <div className="space-y-5">
                {/* File & Detection Banner */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-surface-alt border border-surface-variant">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-gold-accent/10 border border-gold-accent/30 flex items-center justify-center text-gold-accent">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-on-surface flex items-center gap-2">
                        <span>{fileName || "Import Batch"}</span>
                        <span className="px-2 py-0.5 rounded text-xs uppercase font-mono bg-surface border border-surface-variant text-gold-accent">
                          {parseResult.format.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-text-secondary mt-0.5">
                        {parseResult.totalCount} total rows detected • {validCount} ready • {duplicateCount} duplicates
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="min-h-11 px-3 py-1.5 rounded text-xs font-mono uppercase text-text-secondary hover:text-on-surface flex items-center gap-1.5 transition"
                  >
                    <RefreshCw size={14} /> Re-upload
                  </button>
                </div>

                {/* 3-Row Sanity Preview */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-text-secondary font-bold">
                      Sanity Preview (First 3 Rows)
                    </span>
                    <span className="text-xs font-mono text-text-muted">
                      RFC 4180 / RFC 6350 Parsed
                    </span>
                  </div>

                  <div className="border border-surface-variant rounded-lg overflow-hidden divide-y divide-surface-variant bg-surface-alt">
                    {parseResult.previewRows.map((row, idx) => (
                      <div key={row.id || idx} className="p-3 text-xs font-mono space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-on-surface font-semibold text-sm">
                            {row.name || "-"}
                          </span>
                          {row.isDuplicate ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase flex items-center gap-1">
                              <AlertTriangle size={12} /> Duplicate
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-success/10 border border-success/30 text-success text-xs font-mono uppercase flex items-center gap-1">
                              <CheckCircle2 size={12} /> Ready
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-text-secondary">
                          <div>
                            <span className="text-text-muted">Email: </span>
                            <span className="text-on-surface">{row.email || "-"}</span>
                          </div>
                          <div>
                            <span className="text-text-muted">Phone: </span>
                            <span className="text-on-surface">{row.phone || "-"}</span>
                          </div>
                          <div>
                            <span className="text-text-muted">Property: </span>
                            <span className="text-on-surface">{row.propertyTitle || "-"}</span>
                          </div>
                        </div>
                        {row.isDuplicate && (
                          <div className="text-amber-400 text-xs mt-1">
                            {row.duplicateReason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deduplication Switch */}
                {duplicateCount > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                      <span className="text-xs font-mono text-on-surface">
                        Skip {duplicateCount} duplicate records to preserve pipeline hygiene
                      </span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-gold-accent self-end sm:self-auto min-h-11 sm:min-h-0">
                      <input
                        type="checkbox"
                        checked={skipDuplicates}
                        onChange={(e) => setSkipDuplicates(e.target.checked)}
                        className="rounded border-surface-variant text-gold-accent focus:ring-0"
                      />
                      Skip duplicates
                    </label>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-error/10 border border-error/30 text-error text-xs font-mono space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle size={16} /> Parsing Failed
                </div>
                <div>{parseResult.error}</div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="min-h-11 px-4 py-2 mt-2 rounded bg-surface border border-error/40 text-on-surface uppercase font-mono text-xs hover:bg-surface-alt transition"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between gap-3 p-4 sm:p-6 border-t border-surface-variant bg-surface/50">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 px-4 py-2 rounded text-xs font-mono uppercase text-text-secondary hover:text-on-surface transition"
            >
              Cancel
            </button>
            {parseResult?.success && (
              <button
                type="button"
                onClick={handleCommit}
                disabled={commitCount === 0}
                className="min-h-11 px-6 py-2 rounded bg-gold-accent text-background font-label-caps text-xs font-mono font-bold uppercase tracking-wider hover:bg-gold-bright transition disabled:opacity-50 flex items-center gap-2"
              >
                Import {commitCount} Leads <ArrowRight size={14} />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
