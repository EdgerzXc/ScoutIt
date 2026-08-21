import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ImportForm from "./ImportForm";

export default function BulkImportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Bulk import properties</h1>
        <Link
          href="/dashboard/cms"
          className="text-xs text-white/70 hover:text-white flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to review queue
        </Link>
      </div>

      <div className="text-xs text-white/70 bg-[#121212] border border-white/5 rounded-xl p-4">
        CSV columns: <code>title</code>, <code>type</code>, <code>location</code> (required),{" "}
        <code>price</code>, <code>description</code>, <code>media_link</code>,{" "}
        <code>owner_id</code> (all optional). Every row lands in the Review Queue as pending —
        nothing goes live without an approve, same as a single property submission.
      </div>

      <div className="bg-[#121212] border border-white/5 rounded-xl p-5">
        <ImportForm />
      </div>
    </div>
  );
}
