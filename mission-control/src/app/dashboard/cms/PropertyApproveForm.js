"use client";

import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useContext, useEffect } from "react";
import { QueueFeedbackContext } from "@/components/dashboard/BulkSelectManager";
import { approveProperty } from "./actions";

export function PropertyApproveForm({ propertyId, title }) {
  const [result, formAction, pending] = useActionState(approveProperty, null);
  const announce = useContext(QueueFeedbackContext);
  const router = useRouter();

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
    <form action={formAction} aria-label={`Approve ${title || "property"}`}>
      <input type="hidden" name="propertyId" value={propertyId} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 bg-green-400/10 hover:bg-green-400/20 text-green-400 border border-green-400/20 transition-colors disabled:opacity-50"
      >
        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
        {pending ? "Publishing…" : "Approve & publish"}
      </button>
    </form>
  );
}
