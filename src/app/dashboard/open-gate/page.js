"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSession } from "@/lib/authClient";
import { DashboardProvider } from "@/context/DashboardContext";
import VerifiedWorkspaceBoundary from "@/components/auth/VerifiedWorkspaceBoundary";

const ROLES = ["owner", "broker", "operator"];

function OpenGateDashboardInner() {
  const [role, setRole] = useState("owner");
  const [state, setState] = useState({ loading: true, listings: [] });
  const [busy, setBusy] = useState(null);
  async function token() {
    const { data: { session } } = await getSession();
    return session?.access_token || null;
  }
  useEffect(() => {
    let live = true;
    (async () => {
      const auth = await token();
      if (!auth) { if (live) setState({ error: "Sign in to manage Open Gate.", listings: [] }); return; }
      const response = await fetch(`/api/dashboard/open-gate?role=${role}`, {
        headers: { Authorization: `Bearer ${auth}` }, cache: "no-store",
      });
      const data = await response.json();
      if (live) setState(response.ok ? data : { error: data.error || "Open Gate unavailable", listings: [] });
    })();
    return () => { live = false; };
  }, [role]);
  async function toggle(listing) {
    const key = `${listing.id}:${listing.unitId || ""}`;
    setBusy(key);
    try {
      const auth = await token();
      const response = await fetch("/api/dashboard/open-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth}` },
        body: JSON.stringify({ propertyId: listing.id, unitId: listing.unitId, role, enabled: !listing.enabled }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update listing");
      setState(previous => ({ ...previous, listings: previous.listings.map(item =>
        item.id === listing.id && item.unitId === listing.unitId ? { ...item, enabled: data.enabled } : item,
      ) }));
    } catch (error) {
      setState(previous => ({ ...previous, error: error.message }));
    } finally { setBusy(null); }
  }
  return <main className="min-h-screen bg-[var(--bg)] px-5 py-12 text-[var(--text-primary)]">
    <div className="mx-auto max-w-3xl space-y-7">
      <Link href="/dashboard" className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">← Dashboard</Link>
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">Enterprise contact control</p>
        <h1 className="mt-2 text-3xl">Open Gate</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">With active Enterprise access, you can open free inbound contact on each property or delegated unit you handle. Your own outgoing requests still follow normal Connect rules. Close any gate at any time.</p>
      </header>
      <div className="flex flex-wrap gap-2" aria-label="Choose your role">
        {ROLES.map(value => <button key={value} type="button" onClick={() => { setRole(value); setState({ loading: true, listings: [] }); }}
          aria-pressed={role === value} className="min-h-11 rounded border border-[var(--accent-muted)] px-3 py-2 font-mono text-xs uppercase tracking-wide aria-pressed:bg-[var(--accent-muted)]">
          {value}
        </button>)}
      </div>
      {state.error && <p role="alert" className="rounded border border-red-400/40 p-4 text-red-300">{state.error}</p>}
      {state.loading ? <p>Loading your targets…</p> : <>
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--accent)]">
          {state.eligible ? `Enterprise access until ${new Date(state.expiresAt).toLocaleDateString()}` : "Enterprise access unavailable"}
        </p>
        {state.listings.map(listing => <article key={`${listing.id}:${listing.unitId || ""}`} className="flex items-center justify-between gap-4 rounded-xl border border-[var(--accent-muted)] bg-[var(--surface)] p-5">
          <div className="min-w-0 flex-1"><h2 className="text-lg break-words [overflow-wrap:anywhere]">{listing.title}</h2><p className="mt-1 text-xs text-[var(--text-secondary)]">{listing.enabled ? "Free inbound contact open" : "Connect required"}</p></div>
          <button type="button" onClick={() => toggle(listing)} disabled={busy === `${listing.id}:${listing.unitId || ""}` || (!state.eligible && !listing.enabled)}
            className="min-h-11 shrink-0 rounded border border-[var(--accent-muted)] px-4 py-2 font-mono text-xs uppercase tracking-wide text-[var(--accent)] disabled:opacity-50">
            {listing.enabled ? "Close" : "Open"}
          </button>
        </article>)}
        {state.listings.length === 0 && <p className="text-sm text-[var(--text-secondary)]">No eligible listings or units for this role.</p>}
      </>}
    </div>
  </main>;
}

export default function OpenGateDashboard() {
  return <DashboardProvider><VerifiedWorkspaceBoundary><OpenGateDashboardInner /></VerifiedWorkspaceBoundary></DashboardProvider>;
}
