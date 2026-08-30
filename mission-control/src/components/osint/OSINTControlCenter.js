"use client";

import { useState, useEffect, useCallback } from "react";
import {
  addOsintSignal,
  generateOsintPrompt,
  loadOsintWorkspace,
  publishOsintBriefing,
} from "@/app/dashboard/osint/actions";
import {
  Radio,
  Plus,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  MapPin,
  Upload,
  Layers,
  Send,
  Eye,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

export default function OSINTControlCenter() {
  const [sources, setSources] = useState([]);
  const [briefings, setBriefings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("raw_sources");

  // Selection state
  const [selectedSourceIds, setSelectedSourceIds] = useState([]);

  // Modals & Panels
  const [showQuickInputModal, setShowQuickInputModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Quick Input Form State
  const [quickInput, setQuickInput] = useState({
    sourceName: "PSE EDGE Gazette",
    sourceUrl: "",
    rawTitle: "",
    rawContent: "",
    city: "BGC, Taguig",
    region: "Metro Manila",
    lat: 14.5547,
    lng: 121.0244,
  });

  // Prompt Generator State
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // AI Staging & Publishing Form State
  const [rawAiJson, setRawAiJson] = useState("");
  const [parsedPreview, setParsedPreview] = useState(null);
  const [jsonError, setJsonError] = useState(null);

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Base API Host lookup
  // The cross-app endpoint is gone. This page reads and writes Supabase and
  // Airtable through Mission Control's own server actions, which enforce the
  // tier and write the audit entry. See src/lib/crossAppPolicy.mjs.

  // 1. Fetch OSINT Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadOsintWorkspace();
      setSources(data.sources || []);
      setBriefings(data.briefings || []);
      // An unreadable queue and an empty queue look identical on screen and
      // mean opposite things, so the failure is shown rather than logged.
      setStatusMessage(
        data.error ? { type: "error", text: `Could not read the OSINT queue: ${data.error}` } : null
      );
    } catch (err) {
      setStatusMessage({ type: "error", text: `Could not read the OSINT queue: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Selection helper
  const toggleSourceSelection = (id) => {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 2. Submit Manual Quick Input
  const handleQuickInputSubmit = async (e) => {
    e.preventDefault();
    if (!quickInput.rawTitle || !quickInput.rawContent) return;

    setIsActionLoading(true);
    setStatusMessage(null);
    try {
      const form = new FormData();
      for (const [k, v] of Object.entries(quickInput)) form.append(k, String(v ?? ""));
      const data = await addOsintSignal(form);
      if (data.ok) {
        setStatusMessage({ type: "success", text: "Raw OSINT signal added to repository!" });
        setShowQuickInputModal(false);
        setQuickInput({
          sourceName: "PSE EDGE Gazette",
          sourceUrl: "",
          rawTitle: "",
          rawContent: "",
          city: "BGC, Taguig",
          region: "Metro Manila",
          lat: 14.5547,
          lng: 121.0244,
        });
        loadData();
      } else {
        setStatusMessage({ type: "error", text: data.message || "Failed to save signal" });
      }
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  // 3. Generate Master Prompt
  const handleGeneratePrompt = async () => {
    if (selectedSourceIds.length === 0) return;
    setIsActionLoading(true);
    try {
      const data = await generateOsintPrompt(selectedSourceIds);
      if (data.ok) {
        setGeneratedPrompt(data.prompt);
        setShowPromptModal(true);
        setStatusMessage(null);
      } else {
        setStatusMessage({ type: "error", text: data.message || "Failed to generate prompt" });
      }
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  // 4. Copy Prompt to Clipboard
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  // 5. Live Validate Pasted AI JSON
  const handleJsonChange = (val) => {
    setRawAiJson(val);
    setJsonError(null);
    if (!val.trim()) {
      setParsedPreview(null);
      return;
    }

    try {
      // Handle markdown code blocks ```json ... ```
      let cleaned = val.trim();
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();
      }

      const parsed = JSON.parse(cleaned);
      if (!parsed.title || !parsed.our_take) {
        setJsonError("JSON is missing required keys: 'title' or 'our_take'");
        setParsedPreview(null);
      } else {
        // Auto-generate slug if missing
        if (!parsed.slug) {
          parsed.slug = parsed.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        }
        setParsedPreview(parsed);
      }
    } catch (err) {
      setJsonError("Invalid JSON syntax: " + err.message);
      setParsedPreview(null);
    }
  };

  // 6. Publish Staged AI Briefing
  const handlePublishBriefing = async () => {
    if (!parsedPreview) return;
    setIsActionLoading(true);
    setStatusMessage(null);
    try {
      const selectedSource = sources.find((s) => selectedSourceIds.includes(s.id));
      const data = await publishOsintBriefing({
        briefingData: parsedPreview,
        sourceId: selectedSource ? selectedSource.id : null,
      });
      if (data.ok) {
        // The old copy claimed the article was live and on the map whatever
        // happened, including when the Airtable hop failed. A draft that never
        // reached Airtable is not on the public site, so the message is now
        // whatever actually occurred.
        setStatusMessage({
          type: data.airtable?.status === "published" ? "success" : "error",
          text: data.message,
        });
        setShowPublishModal(false);
        setRawAiJson("");
        setParsedPreview(null);
        setSelectedSourceIds([]);
        loadData();
      } else {
        setStatusMessage({ type: "error", text: data.message || "Failed to publish" });
      }
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Status Notification Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            statusMessage.type === "success"
              ? "bg-[#E8AE3C]/10 border-[#E8AE3C]/30 text-[#F7C64E]"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-white/70 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Control Bar Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#121212] border border-white/10">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab("raw_sources")}
            className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "raw_sources"
                ? "bg-[#E8AE3C] text-black font-bold shadow-lg shadow-[#E8AE3C]/20"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Raw OSINT Signals ({sources.length})
          </button>
          <button
            onClick={() => setActiveTab("live_briefings")}
            className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "live_briefings"
                ? "bg-[#E8AE3C] text-black font-bold shadow-lg shadow-[#E8AE3C]/20"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Published Briefings ({briefings.length})
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Refresh OSINT Repository"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setShowQuickInputModal(true)}
            className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/20 text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4 text-[#E8AE3C]" />
            Quick Signal Input
          </button>

          {selectedSourceIds.length > 0 && (
            <button
              onClick={handleGeneratePrompt}
              disabled={isActionLoading}
              className="px-4 py-2.5 rounded-xl bg-[#E8AE3C] text-black hover:bg-[#F7C64E] font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-[#E8AE3C]/25"
            >
              <Sparkles className="w-4 h-4" />
              Generate Master Prompt ({selectedSourceIds.length})
            </button>
          )}

          <button
            onClick={() => setShowPublishModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#F7C64E]/20 border border-[#F7C64E]/40 text-[#F7C64E] hover:bg-[#F7C64E]/30 font-semibold text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Paste &amp; Publish AI JSON
          </button>
        </div>
      </div>

      {/* TAB 1: RAW OSINT SIGNALS REPOSITORY */}
      {activeTab === "raw_sources" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-white/70 px-2">
            <span>SELECT OSINT SIGNALS TO COMBINE INTO A MASTER PROMPT</span>
            <span>{selectedSourceIds.length} SELECTED</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-white/70 font-mono text-sm border border-white/5 rounded-2xl bg-[#121212]">
              Scanning OSINT repository...
            </div>
          ) : sources.length === 0 ? (
            <div className="p-12 text-center space-y-3 border border-white/10 rounded-2xl bg-[#121212]">
              <Radio className="w-8 h-8 text-[#E8AE3C] mx-auto opacity-50" />
              <div className="text-white font-medium">No OSINT signals ingested yet</div>
              <p className="text-xs text-white/70 max-w-sm mx-auto">
                Use &quot;Quick Signal Input&quot; to add a new PSE filing, LGU gazette, or news link, or wait for the scheduled background scraper.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sources.map((src) => {
                const isSelected = selectedSourceIds.includes(src.id);
                return (
                  <div
                    key={src.id}
                    onClick={() => toggleSourceSelection(src.id)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? "bg-[#E8AE3C]/10 border-[#E8AE3C] shadow-lg shadow-[#E8AE3C]/10"
                        : "bg-[#121212] border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[12px] font-mono text-[#E8AE3C] uppercase">
                            {src.source_name}
                          </span>
                          <span className="text-[12px] font-mono text-white/70">
                            {new Date(src.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-semibold text-white group-hover:text-[#F7C64E] transition-colors leading-snug">
                          {src.raw_title}
                        </h3>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected ? "bg-[#E8AE3C] border-[#E8AE3C] text-black" : "border-white/20 bg-black/40"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    <p className="text-xs text-white/60 line-clamp-3 mt-3 leading-relaxed">
                      {src.raw_content}
                    </p>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[12px] font-mono text-white/70">
                      <div className="flex items-center gap-1.5 text-white/60">
                        <MapPin className="w-3 h-3 text-[#E8AE3C]" />
                        <span>{src.city}</span>
                      </div>
                      <span className="capitalize px-2 py-0.5 rounded bg-black/40 text-white/60 border border-white/5">
                        Status: {src.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE PUBLISHED BRIEFINGS */}
      {activeTab === "live_briefings" && (
        <div className="space-y-4">
          {briefings.length === 0 ? (
            <div className="p-12 text-center text-white/70 font-mono text-sm border border-white/5 rounded-2xl bg-[#121212]">
              No published briefings found in Supabase yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {briefings.map((b) => (
                <div key={b.id} className="p-5 rounded-2xl bg-[#121212] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-white/70">
                    <span className="px-2.5 py-0.5 rounded bg-[#E8AE3C]/10 border border-[#E8AE3C]/30 text-[#F7C64E]">
                      {b.category}
                    </span>
                    <span>{new Date(b.created_at).toLocaleDateString()}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white leading-tight">{b.title}</h3>
                  <p className="text-xs text-white/70 line-clamp-2">{b.excerpt}</p>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-[#F7C64E]/90 font-mono space-y-1">
                    <div className="text-[12px] text-white/70 uppercase">ScoutIt &quot;Our Take&quot;</div>
                    <div className="line-clamp-2">{b.our_take}</div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-white/70 font-mono flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#E8AE3C]" /> {b.city}
                    </span>
                    <a
                      href={`/intel/${b.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#E8AE3C] hover:underline flex items-center gap-1 font-mono text-xs"
                    >
                      View Live <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: QUICK SIGNAL INPUT */}
      {showQuickInputModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#121212] border border-white/15 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#E8AE3C]" />
                Manual OSINT Quick Input
              </h3>
              <button onClick={() => setShowQuickInputModal(false)} className="text-white/70 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickInputSubmit} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/60 block mb-1">SOURCE NAME</label>
                  <input
                    type="text"
                    required
                    value={quickInput.sourceName}
                    onChange={(e) => setQuickInput({ ...quickInput, sourceName: e.target.value })}
                    className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white focus:border-[#E8AE3C] outline-none"
                    placeholder="E.g. PSE EDGE, DENR, Makati LGU"
                  />
                </div>
                <div>
                  <label className="text-white/60 block mb-1">SOURCE URL (OPTIONAL)</label>
                  <input
                    type="url"
                    value={quickInput.sourceUrl}
                    onChange={(e) => setQuickInput({ ...quickInput, sourceUrl: e.target.value })}
                    className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white focus:border-[#E8AE3C] outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="text-white/60 block mb-1">RAW HEADLINE / TITLE</label>
                <input
                  type="text"
                  required
                  value={quickInput.rawTitle}
                  onChange={(e) => setQuickInput({ ...quickInput, rawTitle: e.target.value })}
                  className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white focus:border-[#E8AE3C] outline-none"
                  placeholder="Headline from filing or article"
                />
              </div>

              <div>
                <label className="text-white/60 block mb-1">RAW CONTENT / BODY</label>
                <textarea
                  required
                  rows={4}
                  value={quickInput.rawContent}
                  onChange={(e) => setQuickInput({ ...quickInput, rawContent: e.target.value })}
                  className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white focus:border-[#E8AE3C] outline-none font-sans"
                  placeholder="Paste text excerpt or PDF content here..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-white/60 block mb-1">CITY / AREA</label>
                  <input
                    type="text"
                    value={quickInput.city}
                    onChange={(e) => setQuickInput({ ...quickInput, city: e.target.value })}
                    className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white focus:border-[#E8AE3C] outline-none"
                  />
                </div>
                <div>
                  <label className="text-white/60 block mb-1">LATITUDE</label>
                  <input
                    type="number"
                    step="any"
                    value={quickInput.lat}
                    onChange={(e) => setQuickInput({ ...quickInput, lat: parseFloat(e.target.value) })}
                    className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white focus:border-[#E8AE3C] outline-none"
                  />
                </div>
                <div>
                  <label className="text-white/60 block mb-1">LONGITUDE</label>
                  <input
                    type="number"
                    step="any"
                    value={quickInput.lng}
                    onChange={(e) => setQuickInput({ ...quickInput, lng: parseFloat(e.target.value) })}
                    className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white focus:border-[#E8AE3C] outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowQuickInputModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-6 py-2.5 rounded-xl bg-[#E8AE3C] text-black font-bold hover:bg-[#F7C64E] flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Save to OSINT Repository
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: 1-CLICK MASTER PROMPT DISPLAY */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#121212] border border-white/15 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#E8AE3C]" />
                1-Click Master AI Prompt Generated
              </h3>
              <button onClick={() => setShowPromptModal(false)} className="text-white/70 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-xs text-white/70">
              Copy this prompt and paste it directly into your subscribed **ChatGPT Pro** or **Claude Pro** browser chat.
            </p>

            <div className="relative">
              <textarea
                readOnly
                rows={12}
                value={generatedPrompt}
                className="w-full p-4 rounded-2xl bg-black/70 border border-white/10 text-white/90 font-mono text-xs leading-relaxed outline-none"
              />
              <button
                onClick={handleCopyPrompt}
                className="absolute top-3 right-3 px-4 py-2 rounded-xl bg-[#E8AE3C] text-black font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-2 shadow-lg hover:bg-[#F7C64E] transition-colors"
              >
                {copiedPrompt ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedPrompt ? "Copied to Clipboard!" : "1-Click Copy Prompt"}
              </button>
            </div>

            <div className="pt-2 flex justify-between items-center text-xs">
              <span className="text-white/70 font-mono">Next: Paste result into &quot;Paste &amp; Publish AI JSON&quot; button</span>
              <button
                onClick={() => {
                  setShowPromptModal(false);
                  setShowPublishModal(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/20 font-mono uppercase"
              >
                Proceed to Publish Step →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PASTE & PUBLISH AI BRIEFING JSON */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#121212] border border-white/15 rounded-3xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#F7C64E]" />
                Paste &amp; Publish AI Briefing JSON
              </h3>
              <button onClick={() => setShowPublishModal(false)} className="text-white/70 hover:text-white">
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-mono text-white/60 block mb-2">
                PASTE AI OUTPUT (JSON BLOCK FROM CHATGPT / CLAUDE)
              </label>
              <textarea
                rows={8}
                value={rawAiJson}
                onChange={(e) => handleJsonChange(e.target.value)}
                placeholder='{"title": "BGC COMMERCIAL CORE EXPANSION", "our_take": "Strategic yield...", ...}'
                className="w-full p-4 rounded-2xl bg-black/70 border border-white/10 text-white font-mono text-xs leading-relaxed outline-none focus:border-[#F7C64E]"
              />
              {jsonError && <p className="text-xs font-mono text-red-400 mt-2">{jsonError}</p>}
            </div>

            {/* Live Real-Time Preview */}
            {parsedPreview && (
              <div className="p-4 rounded-2xl bg-black/50 border border-[#F7C64E]/30 space-y-3">
                <div className="flex items-center justify-between text-[12px] font-mono text-[#F7C64E]">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> REAL-TIME PUBLICATION PREVIEW
                  </span>
                  <span>Category: {parsedPreview.category || "MARKET INTEL"}</span>
                </div>

                <h4 className="text-base font-bold text-white">{parsedPreview.title}</h4>
                <p className="text-xs text-white/70">{parsedPreview.excerpt}</p>

                <div className="p-3 rounded-xl bg-[#E8AE3C]/10 border border-[#E8AE3C]/20 text-xs text-[#F7C64E]">
                  <span className="font-mono text-[12px] text-white/70 block mb-1">SCOUTIT &quot;OUR TAKE&quot;</span>
                  {parsedPreview.our_take}
                </div>

                <div className="text-[12px] font-mono text-white/70 flex items-center justify-between">
                  <span>City: {parsedPreview.city}</span>
                  <span>Slug: {parsedPreview.slug}</span>
                </div>
              </div>
            )}

            <div className="pt-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-xs font-mono uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!parsedPreview || isActionLoading}
                onClick={handlePublishBriefing}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all ${
                  parsedPreview && !isActionLoading
                    ? "bg-[#F7C64E] text-black hover:bg-[#E8AE3C] shadow-lg shadow-[#F7C64E]/25"
                    : "bg-white/10 text-white/70 cursor-not-allowed"
                }`}
              >
                <Send className="w-4 h-4" />
                {isActionLoading ? "Publishing..." : "Approve & Publish Live"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
