"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { revertAction } from "./actions";

export function AuditRevertForm({ id }) {
  const [result, setResult] = useState(null);
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  async function reopen(formData) {
    setPending(true);
    setResult(null);
    try {
      setResult(await revertAction(formData));
    } catch {
      setResult({ error: "Could not confirm the reopen. Refresh the audit log before retrying." });
    } finally {
      setPending(false);
    }
  }
  return (
    <form action={reopen} className="inline-block">
      <input type="hidden" name="actionId" value={id} />
      <button type="submit" disabled={!ready || pending || Boolean(result?.message)}
        className="min-h-11 inline-flex items-center gap-1 px-3 text-xs rounded bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-colors disabled:opacity-60">
        <RotateCcw className="w-3 h-3 text-gold" aria-hidden="true" />
        {pending ? "Reopening…" : "Reopen review"}
      </button>
      <div role="alert" className="text-xs text-red-300">{!pending ? result?.error : ""}</div>
      <div role="status" className="text-xs text-white/80">{!pending ? result?.message : ""}</div>
    </form>
  );
}
