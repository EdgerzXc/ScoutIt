"use client";

import { useState } from "react";
import {
  FileText,
  Search,
  Plus,
  Globe,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Edit,
  Trash2,
  Compass,
} from "lucide-react";
import ArticleEditorModal from "./ArticleEditorModal";
import { syncArticleToAirtable, setArticleLiveState, deleteArticle } from "./actions";

export default function ArticlesClient({ initialArticles = [], canPublish = false }) {
  const [articles, setArticles] = useState(initialArticles);
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "live" | "synced" | "draft"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [busyArticleId, setBusyArticleId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Derived counts
  const liveCount = articles.filter((a) => a.live_on_site).length;
  const syncedCount = articles.filter((a) => a.published_to_airtable && !a.live_on_site).length;
  const draftCount = articles.filter((a) => !a.published_to_airtable).length;

  const filteredArticles = articles.filter((article) => {
    // Status filter
    if (statusFilter === "live" && !article.live_on_site) return false;
    if (statusFilter === "synced" && (!article.published_to_airtable || article.live_on_site)) {
      return false;
    }
    if (statusFilter === "draft" && article.published_to_airtable) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = article.title?.toLowerCase().includes(q);
      const matchSlug = article.slug?.toLowerCase().includes(q);
      const matchCity = article.city?.toLowerCase().includes(q);
      const matchCategory = article.category?.toLowerCase().includes(q);
      if (!matchTitle && !matchSlug && !matchCity && !matchCategory) return false;
    }

    return true;
  });

  const handleOpenNew = () => {
    setSelectedArticle(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (article) => {
    setSelectedArticle(article);
    setIsEditorOpen(true);
  };

  const handleArticleSaved = (savedArticle) => {
    if (!savedArticle) return;
    setArticles((prev) => {
      const exists = prev.some((a) => a.id === savedArticle.id);
      if (exists) {
        return prev.map((a) => (a.id === savedArticle.id ? { ...a, ...savedArticle } : a));
      }
      return [savedArticle, ...prev];
    });
  };

  const handleQuickSync = async (article) => {
    setBusyArticleId(article.id);
    setFeedback(null);
    try {
      const res = await syncArticleToAirtable(article.id);
      if (!res.ok) throw new Error("Airtable sync failed");
      setArticles((prev) =>
        prev.map((a) =>
          a.id === article.id ? { ...a, published_to_airtable: true, airtable_record_id: res.recordId } : a
        )
      );
      setFeedback({ type: "success", message: `Synced '${article.slug}' to Airtable INTEL_CMS` });
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setBusyArticleId(null);
    }
  };

  const handleQuickLiveToggle = async (article, nextLiveState) => {
    setBusyArticleId(article.id);
    setFeedback(null);
    try {
      const res = await setArticleLiveState(article.id, nextLiveState);
      if (!res.ok) throw new Error("Live status update failed");
      setArticles((prev) =>
        prev.map((a) =>
          a.id === article.id
            ? {
                ...a,
                published_to_airtable: true,
                live_on_site: nextLiveState,
                airtable_record_id: res.recordId || a.airtable_record_id,
              }
            : a
        )
      );
      setFeedback({
        type: "success",
        message: nextLiveState
          ? `Article '${article.slug}' is now LIVE on public site!`
          : `Article '${article.slug}' was retracted from public site.`,
      });
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setBusyArticleId(null);
    }
  };

  const handleDelete = async (article) => {
    if (!window.confirm(`Are you sure you want to delete draft '${article.title}'?`)) return;
    setBusyArticleId(article.id);
    setFeedback(null);
    try {
      await deleteArticle(article.id);
      setArticles((prev) => prev.filter((a) => a.id !== article.id));
      setFeedback({ type: "success", message: `Deleted draft '${article.title}'.` });
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setBusyArticleId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-line bg-surface flex flex-col justify-between">
          <div className="text-xs font-mono text-white/60 uppercase tracking-wider">Total Articles</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{articles.length}</div>
        </div>
        <div className="p-4 rounded-xl border border-emerald-900/40 bg-emerald-950/20 flex flex-col justify-between">
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live on Site
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{liveCount}</div>
        </div>
        <div className="p-4 rounded-xl border border-amber-900/40 bg-amber-950/20 flex flex-col justify-between">
          <div className="text-xs font-mono text-amber-400 uppercase tracking-wider">Airtable Synced</div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">{syncedCount}</div>
        </div>
        <div className="p-4 rounded-xl border border-line bg-surface flex flex-col justify-between">
          <div className="text-xs font-mono text-white/60 uppercase tracking-wider">Private Drafts</div>
          <div className="text-2xl font-bold font-mono text-white/80 mt-1">{draftCount}</div>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-mono flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
              : "bg-red-950/40 border-red-800 text-red-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
          {[
            { id: "all", label: `All (${articles.length})` },
            { id: "live", label: `Live (${liveCount})` },
            { id: "synced", label: `Airtable (${syncedCount})` },
            { id: "draft", label: `Drafts (${draftCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                statusFilter === tab.id
                  ? "bg-gold text-black font-bold"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & New Action */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/60 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, slug, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3.5 py-2 rounded-lg border border-line bg-surface text-white placeholder-white/30 text-xs font-mono focus:border-gold focus:outline-none w-64"
            />
          </div>

          <button
            type="button"
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold text-black font-semibold text-xs uppercase tracking-wider hover:bg-gold-bright transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Article
          </button>
        </div>
      </div>

      {/* Articles Table */}
      <div className="rounded-xl border border-line bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-black/40 border-b border-line text-white/70 uppercase text-xs tracking-wider">
              <tr>
                <th className="p-3.5">Article / Dossier</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5">Live Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-white/60 font-mono text-xs">
                    No articles found matching this filter. Click &quot;New Article&quot; to author a briefing.
                  </td>
                </tr>
              ) : (
                filteredArticles.map((article) => {
                  const isBusy = busyArticleId === article.id;

                  return (
                    <tr
                      key={article.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Article Details */}
                      <td className="p-3.5">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gold shrink-0" />
                          <span className="truncate max-w-[300px] text-sm font-sans">
                            {article.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/60 mt-1 font-mono">
                          <span>/intel/{article.slug}</span>
                          {article.live_on_site && (
                            <a
                              href={`https://scoutit.space/intel/${article.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gold hover:underline inline-flex items-center gap-0.5"
                            >
                              View live <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded border border-gold-muted/40 bg-gold/5 text-gold text-[12px] uppercase">
                          {article.category || "INTEL"}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="p-3.5">
                        <span className="text-white/70">
                          {article.city || article.region || "—"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        {article.live_on_site ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live on Site
                          </span>
                        ) : article.published_to_airtable ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-950/60 text-amber-400 border border-amber-800">
                            Airtable Synced
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-neutral-800 text-neutral-300 border border-neutral-700">
                            Private Draft
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(article)}
                          disabled={isBusy}
                          className="px-2.5 py-1 rounded border border-line bg-surface hover:border-gold hover:text-gold text-white/80 transition-colors inline-flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>

                        {canPublish && !article.published_to_airtable && (
                          <button
                            type="button"
                            onClick={() => handleQuickSync(article)}
                            disabled={isBusy}
                            className="px-2.5 py-1 rounded border border-gold-muted/60 bg-gold/10 hover:bg-gold/20 text-gold transition-colors inline-flex items-center gap-1"
                            title="Sync draft to Airtable INTEL_CMS"
                          >
                            <UploadCloud className="w-3 h-3" />
                            Sync
                          </button>
                        )}

                        {canPublish && (
                          article.live_on_site ? (
                            <button
                              type="button"
                              onClick={() => handleQuickLiveToggle(article, false)}
                              disabled={isBusy}
                              className="px-2.5 py-1 rounded border border-red-800/60 bg-red-950/30 hover:bg-red-900/50 text-red-300 transition-colors"
                            >
                              {isBusy ? "Retracting..." : "Take Down"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleQuickLiveToggle(article, true)}
                              disabled={isBusy}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-black font-bold transition-colors inline-flex items-center gap-1"
                            >
                              <Globe className="w-3 h-3" />
                              {isBusy ? "Publishing..." : "Go Live"}
                            </button>
                          )
                        )}

                        {!article.live_on_site && (
                          <button
                            type="button"
                            onClick={() => handleDelete(article)}
                            disabled={isBusy}
                            className="p-1 rounded text-white/60 hover:text-red-400 transition-colors"
                            title="Delete draft"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Editor Modal */}
      {isEditorOpen && (
        <ArticleEditorModal
          article={selectedArticle}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSaved={handleArticleSaved}
          canPublish={canPublish}
        />
      )}
    </div>
  );
}
