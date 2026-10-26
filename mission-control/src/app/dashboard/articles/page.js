import { redirect } from "next/navigation";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { FileText } from "lucide-react";
import { loadArticles } from "./actions";
import ArticlesClient from "./ArticlesClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Articles & Intelligence Publisher",
};

export default async function ArticlesPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/auth");

  const { articles = [] } = await loadArticles({ limit: 100 });
  const canPublish = staff.tier >= TIERS.OPS_MANAGER;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-gold">
          <FileText className="w-5 h-5 text-gold" />
          <h1 className="font-mono text-xs tracking-[0.12em] uppercase font-bold text-gold">
            Articles &amp; Intelligence Publisher // Layer 02
          </h1>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <p className="text-sm text-neutral-400 max-w-3xl leading-relaxed font-sans">
            Author, edit, and publish spatial intelligence dossiers, market reports, and development
            briefings. Bridge Supabase private drafts to Airtable INTEL_CMS with one-click live publication
            and immediate public cache purging.
          </p>
        </div>
      </header>

      <ArticlesClient initialArticles={articles} canPublish={canPublish} />
    </div>
  );
}
