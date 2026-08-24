"use client";

import { useActionState } from "react";
import { runDemoAuthorityTransfer } from "./actions";

const initialState = { ok: null, message: "", preview: null };

function Inventory({ title, items, tone = "text-white/75" }) {
  return (
    <div>
      <h3 className={`label-mono ${tone}`}>{title}</h3>
      <ul className="mt-2 space-y-1 text-sm text-white/70">
        {items.length ? items.map((item) => <li key={`${item.table}:${item.label}`}>{item.label}: {item.count}</li>) : <li>None</li>}
      </ul>
    </div>
  );
}

export default function DemoAuthorityTransferForm() {
  const [state, action, pending] = useActionState(runDemoAuthorityTransfer, initialState);
  const preview = state?.preview;
  return (
    <div className="mt-5 space-y-5">
      <form action={action} className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input type="hidden" name="command" value="dry_run" />
        <label className="grid gap-2 text-sm text-white/75">
          Target Supabase Auth email
          <input name="targetEmail" type="email" required maxLength={254} defaultValue={preview?.target?.email || ""} className="min-h-11 rounded border border-line bg-black/25 px-3 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold" />
        </label>
        <button disabled={pending} className="min-h-11 self-end rounded border border-gold-muted bg-gold/10 px-4 font-mono text-xs uppercase tracking-widest text-gold disabled:opacity-50">{pending ? "Checking…" : "Run dry-run"}</button>
      </form>
      {state?.message && <p role={state.ok ? "status" : "alert"} className={`rounded border p-3 text-sm ${state.ok ? "border-ok/25 bg-ok/10 text-ok" : "border-danger/25 bg-danger/10 text-danger"}`}>{state.message}</p>}
      {preview && <>
        <div className="grid gap-4 rounded-lg border border-line bg-black/25 p-4 sm:grid-cols-3">
          <Inventory title="Eligible to transfer" items={preview.eligible} tone="text-ok" />
          <Inventory title="Blocked authority" items={preview.blocked} tone="text-danger" />
          <Inventory title="Retained history" items={preview.retained} tone="text-white/70" />
        </div>
        <div className="text-xs leading-5 text-white/70">
          <p>Resolved account: <span className="font-mono text-white/80">{preview.target.email}</span> · <span className="font-mono">{preview.target.id}</span></p>
          <p>Plan: <span className="break-all font-mono">{preview.planHash}</span></p>
          {preview.notDeployed.length > 0 && <p>Not deployed (therefore no live rows): {preview.notDeployed.join(", ")}</p>}
        </div>
        <form action={action} className="space-y-3 rounded-lg border border-gold-muted/60 bg-gold/5 p-4">
          <input type="hidden" name="command" value="execute" />
          <input type="hidden" name="targetEmail" value={preview.target.email} />
          <input type="hidden" name="planHash" value={preview.planHash} />
          <label className="grid gap-2 text-sm text-white/75">Confirmation
            <input name="confirmation" autoComplete="off" placeholder="TRANSFER DEMO AUTHORITY" className="min-h-11 rounded border border-line bg-black/30 px-3 font-mono text-white" />
          </label>
          <label className="grid gap-2 text-sm text-white/75">Operational reason
            <textarea name="reason" minLength={12} maxLength={500} required className="min-h-24 rounded border border-line bg-black/30 p-3 text-white" />
          </label>
          <button disabled={pending || !preview.canExecute} className="min-h-11 rounded bg-gold px-4 font-mono text-xs font-bold uppercase tracking-widest text-black disabled:cursor-not-allowed disabled:opacity-40">Execute reviewed transfer</button>
          {!preview.canExecute && <p className="text-xs text-danger">Execution stays disabled until at least one eligible property exists and every active blocked reference is resolved.</p>}
        </form>
      </>}
    </div>
  );
}
