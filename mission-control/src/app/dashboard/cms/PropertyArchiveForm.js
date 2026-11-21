"use client";

import { Archive, ArchiveRestore } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useContext, useEffect } from "react";
import { QueueFeedbackContext } from "@/components/dashboard/BulkSelectManager";
import { setPropertyArchived } from "./actions";

export function PropertyArchiveForm({ propertyId, title, isArchived }) {
  const [result, formAction, pending] = useActionState(setPropertyArchived, null);
  const announce = useContext(QueueFeedbackContext);
  const router = useRouter();
  const Icon = isArchived ? ArchiveRestore : Archive;
  const label = isArchived ? "Restore to pending" : "Archive";

  useEffect(() => {
    if (pending) {
      announce?.("");
      return;
    }
    if (!result) return;
    announce?.(result.message, result.saved ? [propertyId] : []);
    if (result.saved) router.refresh();
  }, [pending, result, announce, router, propertyId]);

  return (
    <form action={formAction} aria-label={`${isArchived ? "Restore" : "Archive"} ${title || "property"}`}>
      <input type="hidden" name="propertyId" value={propertyId} />
      <input type="hidden" name="nextValue" value={(!isArchived).toString()} />
      {!isArchived && <input type="hidden" name="reason" value="Archived via CMS queue" />}
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-colors disabled:opacity-50"
      >
        <Icon className="w-4 h-4" aria-hidden="true" />
        {pending ? "Saving…" : label}
      </button>
    </form>
  );
}
