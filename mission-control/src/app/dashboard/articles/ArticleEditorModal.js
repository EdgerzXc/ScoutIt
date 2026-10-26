"use client";

import { useState } from "react";
import { X, Globe, Save, UploadCloud, Eye, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { saveArticle, syncArticleToAirtable, setArticleLiveState } from "./actions";

const CATEGORIES = [
  "MARKET INTEL",
  "DEVELOPMENT",
  "LEASING",
  "INFRASTRUCTURE",
  "VALUATION",
  "HOSPITALITY",
  "POLICY & ZONING",
];

export default function ArticleEditorModal({
  article,
  isOpen,
  onClose,
  onSaved,
  canPublish = false,
}) {
  const [activeTab, setActiveTab] = useState("edit"); // "edit" | "preview"
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    id: article?.id || null,
    title: article?.title || "",
    slug: article?.slug || "",
    category: article?.category || "MARKET INTEL",
    excerpt: article?.excerpt || "",
    lead: article?.lead || "",
    our_take: article?.our_take || "",
    cover_image_url: article?.cover_image_url || "",
    city: article?.city || "",
    region: article?.region || "",
    lat: article?.lat !== null && article?.lat !== undefined ? String(article.lat) : "",
    lng: article?.lng !== null && article?.lng !== undefined ? String(article.lng) : "",
    source_name: article?.source_name || "",
    source_url: article?.source_url || "",
    bodyText: Array.isArray(article?.body_json)
      ? article.body_json
          .map((b) => (b.text ? b.text : typeof b === "string" ? b : JSON.stringify(b)))
          .join("\n\n")
      : typeof article?.body_json === "string"
      ? article.body_json
      : "",
  });

  if (!isOpen) return null;

  const generateSlugFromTitle = () => {
    if (!formData.title) return;
    const clean = formData.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setFormData((prev) => ({ ...prev, slug: clean }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsPending(true);

    try {
      // Split paragraphs by blank lines into structured blocks
      const paragraphs = formData.bodyText
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);

      const bodyBlocks = paragraphs.map((text) => {
        if (text.startsWith("## ")) {
          return { type: "heading", level: 2, text: text.replace(/^##\s+/, "") };
        }
        if (text.startsWith("> ")) {
          return { type: "quote", text: text.replace(/^>\s+/, "") };
        }
        return { type: "paragraph", text };
      });

      const payload = {
        id: formData.id,
        title: formData.title,
        slug: formData.slug,
        category: formData.category,
        excerpt: formData.excerpt,
        lead: formData.lead,
        our_take: formData.our_take,
        cover_image_url: formData.cover_image_url,
        city: formData.city,
        region: formData.region,
        lat: formData.lat.trim() ? parseFloat(formData.lat) : null,
        lng: formData.lng.trim() ? parseFloat(formData.lng) : null,
        source_name: formData.source_name,
        source_url: formData.source_url,
        body_json: bodyBlocks,
      };

      const res = await saveArticle(payload);
      if (!res.ok) throw new Error(res.error || "Failed to save article");

      setSuccessMsg("Article draft saved successfully.");
      setFormData((prev) => ({ ...prev, id: res.article.id }));
      if (onSaved) onSaved(res.article);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsPending(false);
    }
  };

  const handleSyncAirtable = async () => {
    if (!formData.id) {
      setErrorMsg("Please save the article draft first before syncing to Airtable.");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    setIsPending(true);

    try {
      const res = await syncArticleToAirtable(formData.id);
      if (!res.ok) throw new Error("Airtable sync failed");
      setSuccessMsg(`Synced to Airtable INTEL_CMS (ID: ${res.recordId}).`);
      if (onSaved) onSaved();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsPending(false);
    }
  };

  const handleToggleLive = async (isLive) => {
    if (!formData.id) {
      setErrorMsg("Please save the article draft first.");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    setIsPending(true);

    try {
      const res = await setArticleLiveState(formData.id, isLive);
      if (!res.ok) throw new Error("Status update failed");
      setSuccessMsg(
        isLive
          ? "Article is now LIVE on the ScoutIt public website!"
          : "Article has been taken down / retracted from live site."
      );
      if (onSaved) onSaved();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-line bg-surface shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gold/10 border border-gold/20 text-gold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                {formData.id ? "Edit Article Dossier" : "Compose New Intel Article"}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs text-white/60">
                  {formData.slug ? `/intel/${formData.slug}` : "Unpublished Draft"}
                </span>
                {article?.live_on_site && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[12px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex rounded-lg border border-line bg-black/40 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                  activeTab === "edit"
                    ? "bg-gold text-black font-bold"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1 rounded text-xs font-mono transition-colors flex items-center gap-1.5 ${
                  activeTab === "preview"
                    ? "bg-gold text-black font-bold"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Live Preview
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="px-6 py-3 bg-red-950/40 border-b border-red-800/40 text-red-300 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="px-6 py-3 bg-emerald-950/40 border-b border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "edit" ? (
            <form onSubmit={handleSave} className="space-y-6">
              {/* Core Attributes */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-mono uppercase tracking-wider text-white/70">
                      Article Title <span className="text-gold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. BGC Grade A Office Supply & Vacancy Trends 2026"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-black/40 text-white placeholder-white/30 text-sm focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase tracking-wider text-white/70">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-black/40 text-white text-sm focus:border-gold focus:outline-none font-mono"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="bg-neutral-900">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono uppercase tracking-wider text-white/70">
                        Canonical Slug <span className="text-gold">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={generateSlugFromTitle}
                        className="text-[12px] font-mono text-gold hover:underline"
                      >
                        Auto-generate from Title
                      </button>
                    </div>
                    <div className="flex items-center">
                      <span className="px-3 py-2.5 rounded-l-lg border border-r-0 border-line bg-black/60 font-mono text-xs text-white/60">
                        /intel/
                      </span>
                      <input
                        type="text"
                        required
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="bgc-grade-a-office-supply"
                        className="flex-1 px-3.5 py-2.5 rounded-r-lg border border-line bg-black/40 text-white placeholder-white/30 text-sm font-mono focus:border-gold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase tracking-wider text-white/70">
                      Cover Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.cover_image_url}
                      onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                      placeholder="https://images.unsplash.com/... or /assets/..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-black/40 text-white placeholder-white/30 text-sm focus:border-gold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Editorial Lead & Excerpt */}
              <div className="space-y-4 pt-2 border-t border-line">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-white/70">
                    Lead Paragraph (Executive Hook)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.lead}
                    onChange={(e) => setFormData({ ...formData, lead: e.target.value })}
                    placeholder="Concise, high-impact overview paragraph shown prominently at the top of the article."
                    className="w-full px-3.5 py-2 rounded-lg border border-line bg-black/40 text-white placeholder-white/30 text-sm focus:border-gold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase tracking-wider text-white/70">
                      SEO Excerpt
                    </label>
                    <textarea
                      rows={2}
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      placeholder="Brief 1-2 sentence meta summary used for previews and search engines."
                      className="w-full px-3.5 py-2 rounded-lg border border-line bg-black/40 text-white placeholder-white/30 text-sm focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase tracking-wider text-white/70">
                      ScoutIt Editorial Stance (Our Take)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.our_take}
                      onChange={(e) => setFormData({ ...formData, our_take: e.target.value })}
                      placeholder="Proprietary ScoutIt commentary or tactical market takeaway."
                      className="w-full px-3.5 py-2 rounded-lg border border-line bg-black/40 text-white placeholder-white/30 text-sm focus:border-gold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Body Text */}
              <div className="space-y-1.5 pt-2 border-t border-line">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase tracking-wider text-white/70">
                    Article Body Content
                  </label>
                  <span className="text-[12px] font-mono text-white/60">
                    Paragraphs separated by blank lines · Use &quot;## &quot; for subheadings · &quot;&gt; &quot; for quotes
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={formData.bodyText}
                  onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
                  placeholder="Write the full body analysis here..."
                  className="w-full px-3.5 py-3 rounded-lg border border-line bg-black/40 text-white placeholder-white/30 text-sm font-sans leading-relaxed focus:border-gold focus:outline-none"
                />
              </div>

              {/* Spatial & Provenance Metadata */}
              <div className="space-y-4 pt-2 border-t border-line">
                <div className="text-xs font-mono uppercase tracking-wider text-gold font-bold">
                  Spatial &amp; Source Provenance
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-white/70">City / Submarket</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. BGC, Taguig"
                      className="w-full px-3 py-2 rounded-lg border border-line bg-black/40 text-white text-xs focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-white/70">Region</label>
                    <input
                      type="text"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      placeholder="e.g. Metro Manila"
                      className="w-full px-3 py-2 rounded-lg border border-line bg-black/40 text-white text-xs focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-white/70">Latitude</label>
                    <input
                      type="text"
                      value={formData.lat}
                      onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                      placeholder="e.g. 14.5547"
                      className="w-full px-3 py-2 rounded-lg border border-line bg-black/40 text-white text-xs font-mono focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-white/70">Longitude</label>
                    <input
                      type="text"
                      value={formData.lng}
                      onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                      placeholder="e.g. 121.0244"
                      className="w-full px-3 py-2 rounded-lg border border-line bg-black/40 text-white text-xs font-mono focus:border-gold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-white/70">Source Name / Attribution</label>
                    <input
                      type="text"
                      value={formData.source_name}
                      onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
                      placeholder="e.g. Philippine Statistics Authority"
                      className="w-full px-3 py-2 rounded-lg border border-line bg-black/40 text-white text-xs focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-white/70">Source URL</label>
                    <input
                      type="url"
                      value={formData.source_url}
                      onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                      placeholder="https://psa.gov.ph/..."
                      className="w-full px-3 py-2 rounded-lg border border-line bg-black/40 text-white text-xs focus:border-gold focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* Live Preview Tab */
            <div className="rounded-xl border border-line bg-[#0d0d0d] p-8 max-w-3xl mx-auto space-y-6">
              {formData.cover_image_url && (
                <div className="w-full h-48 rounded-xl overflow-hidden border border-line bg-black/60 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.cover_image_url}
                    alt={formData.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-gold/10 border border-gold/30 text-gold font-mono text-xs font-bold uppercase tracking-wider">
                    {formData.category}
                  </span>
                  {formData.city && (
                    <span className="text-xs font-mono text-white/60">
                      📍 {formData.city} {formData.region ? `· ${formData.region}` : ""}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight leading-snug">
                  {formData.title || "Untitled Intelligence Dossier"}
                </h1>

                {formData.lead && (
                  <p className="text-base text-neutral-300 font-sans leading-relaxed border-l-2 border-gold pl-4 py-1 italic">
                    {formData.lead}
                  </p>
                )}
              </div>

              {formData.our_take && (
                <div className="p-4 rounded-xl border border-gold-muted/40 bg-gold/5 space-y-1.5">
                  <div className="text-xs font-mono text-gold-bright uppercase tracking-wider font-bold">
                    ScoutIt Assessment // Our Take
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed font-sans">{formData.our_take}</p>
                </div>
              )}

              {/* Body rendering */}
              <div className="space-y-4 pt-4 border-t border-line text-sm text-neutral-300 font-sans leading-relaxed">
                {formData.bodyText ? (
                  formData.bodyText
                    .split(/\n\s*\n/)
                    .map((block, idx) => {
                      if (block.startsWith("## ")) {
                        return (
                          <h2 key={idx} className="text-lg font-bold text-white pt-2">
                            {block.replace(/^##\s+/, "")}
                          </h2>
                        );
                      }
                      if (block.startsWith("> ")) {
                        return (
                          <blockquote
                            key={idx}
                            className="border-l-2 border-gold/60 pl-4 py-1 text-gold-bright italic"
                          >
                            {block.replace(/^>\s+/, "")}
                          </blockquote>
                        );
                      }
                      return <p key={idx}>{block}</p>;
                    })
                ) : (
                  <p className="text-white/60 italic font-mono text-xs">
                    No body content written yet.
                  </p>
                )}
              </div>

              {/* Provenance Footer */}
              {(formData.source_name || formData.source_url) && (
                <div className="pt-6 border-t border-line text-xs font-mono text-white/60 space-y-1">
                  <div>Source Receipt: {formData.source_name || "Public Filing"}</div>
                  {formData.source_url && (
                    <a
                      href={formData.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold hover:underline truncate block max-w-lg"
                    >
                      {formData.source_url}
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Action Bar */}
        <div className="border-t border-line px-6 py-4 bg-black/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-gold text-black font-semibold text-xs uppercase tracking-wider hover:bg-gold-bright transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {isPending ? "Saving..." : "Save Draft"}
            </button>

            {canPublish && (
              <button
                type="button"
                onClick={handleSyncAirtable}
                disabled={isPending || !formData.id}
                className="px-4 py-2 rounded-lg border border-line bg-surface hover:border-gold hover:text-gold text-white/80 font-mono text-xs uppercase tracking-wider transition-colors disabled:opacity-40 flex items-center gap-1.5"
                title="Pushes Supabase draft to Airtable INTEL_CMS"
              >
                <UploadCloud className="w-4 h-4" />
                Sync to Airtable
              </button>
            )}
          </div>

          {canPublish && article?.airtable_record_id && (
            <div className="flex items-center gap-2">
              {article.live_on_site ? (
                <button
                  type="button"
                  onClick={() => handleToggleLive(false)}
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg border border-red-800/60 bg-red-950/30 hover:bg-red-900/40 text-red-300 font-mono text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  Take Down / Retract
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleToggleLive(true)}
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-emerald-950"
                >
                  <Globe className="w-4 h-4" />
                  Approve &amp; Go Live
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
