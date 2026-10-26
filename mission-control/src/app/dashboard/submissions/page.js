import { redirect } from "next/navigation";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { loadSubmissionsQueue } from "./actions";
import SubmissionsClient from "./SubmissionsClient";
import { Send } from "lucide-react";

export const metadata = {
  title: "Submissions & PDF Verification | Mission Control",
};

export default async function SubmissionsPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/?error=NotAuthorized");

  const { submissions = [], pdfDrafts = [] } = await loadSubmissionsQueue();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-gold" />
            Submissions &amp; PDF Verification
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Publishing gateway for owner submissions and source-document verification for PDF-assisted drafts (§2.4).
          </p>
        </div>
      </div>

      <SubmissionsClient
        initialSubmissions={submissions}
        initialPdfDrafts={pdfDrafts}
        staffTier={staff.tier}
      />
    </div>
  );
}
