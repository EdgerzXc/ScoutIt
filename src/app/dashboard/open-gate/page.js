"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Kanban, MessageSquare, Unlock, ArrowRight, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/authClient";
import { DashboardProvider, useDashboard } from "@/context/DashboardContext";
import VerifiedWorkspaceBoundary from "@/components/auth/VerifiedWorkspaceBoundary";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WorkspaceCommandBar from "@/components/dashboard/WorkspaceCommandBar";
import { loadDeals } from "@/lib/deals/dealsClient";
import {
  getPersistedWorkspaceRole,
  normalizeDashboardMode,
  setPersistedWorkspaceRole,
} from "@/lib/dashboardModes";

const ROLES = [
  { id: "owner", label: "Property Owner" },
  { id: "broker", label: "Accredited Broker" },
  { id: "operator", label: "Co-Operator" },
];

function OpenGateDashboardInner() {
  const { currentUser } = useDashboard();
  const [role, setRole] = useState("owner");
  const [state, setState] = useState({ loading: true, listings: [] });
  const [deals, setDeals] = useState([]);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    const persisted = normalizeDashboardMode(getPersistedWorkspaceRole());
    if (persisted === "owner" || persisted === "broker" || persisted === "operator") {
      setRole(persisted);
    }
  }, []);

  async function token() {
    const {
      data: { session },
    } = await getSession();
    return session?.access_token || null;
  }

  useEffect(() => {
    let live = true;
    (async () => {
      const auth = await token();
      if (!auth) {
        if (live) setState({ error: "Sign in to manage Open Gate.", listings: [] });
        return;
      }
      const [response, dealsResult] = await Promise.all([
        fetch(`/api/dashboard/open-gate?role=${role}`, {
          headers: { Authorization: `Bearer ${auth}` },
          cache: "no-store",
        }),
        loadDeals({ mockUserId: currentUser?.id || null }).catch(() => []),
      ]);
      const data = await response.json();
      if (live) {
        setState(response.ok ? data : { error: data.error || "Open Gate unavailable", listings: [] });
        setDeals(Array.isArray(dealsResult) ? dealsResult : []);
      }
    })();
    return () => {
      live = false;
    };
  }, [role, currentUser?.id]);

  async function toggle(listing) {
    const key = `${listing.id}:${listing.unitId || ""}`;
    setBusy(key);
    try {
      const auth = await token();
      const response = await fetch("/api/dashboard/open-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth}` },
        body: JSON.stringify({
          propertyId: listing.id,
          unitId: listing.unitId,
          role,
          enabled: !listing.enabled,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update listing");
      setState((previous) => ({
        ...previous,
        listings: previous.listings.map((item) =>
          item.id === listing.id && item.unitId === listing.unitId
            ? { ...item, enabled: data.enabled }
            : item
        ),
      }));
    } catch (error) {
      setState((previous) => ({ ...previous, error: error.message }));
    } finally {
      setBusy(null);
    }
  }

  const openGateDeals = deals.filter((d) => Boolean(d?.open_gate_inbound));
  const enabledCount = (state.listings || []).filter((l) => l.enabled).length;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 pb-12 text-on-surface">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="mb-2">
              <Link
                href="/settings#open-gate"
                className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-text-secondary hover:text-gold-accent transition"
              >
                <span>← Back to Settings</span>
              </Link>
            </div>
            <p className="font-mono text-xs uppercase tracking-widest text-gold-accent">
              ENTERPRISE CONTACT CONTROL · CONNECTED TO CRM &amp; INBOX
            </p>
            <h1 className="mt-1 font-headline-editorial text-3xl md:text-4xl text-on-surface">
              Open Gate
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-text-secondary">
              Open free inbound contact on any property or delegated unit you handle so verified buyers can reach you without spending a Connect. Every Open Gate inquiry routes directly into your Deal Inbox and CRM pipeline with an <span className="font-mono text-xs text-gold-accent">OPEN GATE</span> badge.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full md:w-auto shrink-0">
            <Link
              href="/dashboard/crm"
              className="min-h-11 px-4 py-2.5 rounded-xl bg-gold-accent text-background font-mono text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 hover:opacity-95 transition"
            >
              <Kanban size={14} aria-hidden="true" />
              <span>CRM ({deals.length})</span>
            </Link>
            <Link
              href="/dashboard/inbox"
              className="min-h-11 px-4 py-2.5 rounded-xl border border-surface-variant bg-surface-alt hover:border-gold-accent/40 text-on-surface font-mono text-xs uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition"
            >
              <MessageSquare size={14} aria-hidden="true" />
              <span>Deal Inbox</span>
            </Link>
          </div>
        </div>

        <div className="w-full md:max-w-xl">
          <WorkspaceCommandBar active="workspace" mode={role} />
        </div>

        {/* Open Gate ↔ CRM & Inbox Live Bridge Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-surface-variant bg-surface/90 p-4">
            <span className="font-mono text-xs uppercase tracking-wider text-text-secondary block">
              Open Gate Listings Active
            </span>
            <div className="mt-1 font-mono text-2xl font-bold text-gold-bright tabular-nums">
              {state.loading ? "-" : `${enabledCount} / ${(state.listings || []).length}`}
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              Properties or units accepting 0-Connect inbound inquiries
            </p>
          </div>

          <div className="rounded-xl border border-gold-accent/30 bg-gold-accent/10 p-4">
            <span className="font-mono text-xs uppercase tracking-wider text-gold-accent block">
              Open Gate Leads in CRM
            </span>
            <div className="mt-1 font-mono text-2xl font-bold text-on-surface tabular-nums">
              {openGateDeals.length}
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              Free-inbound leads stamped &amp; synced to your CRM Kanban
            </p>
          </div>

          <div className="rounded-xl border border-surface-variant bg-surface/90 p-4 flex flex-col justify-between">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-text-secondary block">
                Enterprise Gate Status
              </span>
              <div className="mt-1 flex items-center flex-wrap gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-gold-accent break-words [overflow-wrap:anywhere]">
                <ShieldCheck size={15} className="shrink-0" aria-hidden="true" />
                <span>
                  {state.eligible
                    ? `Active until ${new Date(state.expiresAt).toLocaleDateString()}`
                    : "Enterprise Tier Required to Open New Gates"}
                </span>
              </div>
            </div>
            <p className="mt-2 text-xs text-text-secondary">
              Direct contact unlocks automatically once you accept an Open Gate inquiry in Inbox or CRM.
            </p>
          </div>
        </div>

        {/* Role Selector */}
        <div className="pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full" role="group" aria-label="Choose your Open Gate role">
            {ROLES.map((item) => {
              const active = role === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setRole(item.id);
                    setPersistedWorkspaceRole(item.id);
                    setState({ loading: true, listings: [] });
                  }}
                  aria-pressed={active}
                  className={`min-h-11 rounded-xl border px-4 py-2 font-mono text-xs uppercase tracking-wider transition inline-flex items-center justify-center text-center ${
                    active
                      ? "border-gold-accent bg-gold-accent text-background font-bold shadow-[0_0_12px_rgba(var(--accent-rgb),0.3)]"
                      : "border-surface-variant bg-surface-alt text-text-secondary hover:text-on-surface hover:border-gold-accent/40"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {state.error && (
          <p role="alert" className="rounded-xl border border-error/40 bg-error/10 p-4 text-sm text-error">
            {state.error}
          </p>
        )}

        {state.loading ? (
          <div className="space-y-3" aria-busy="true">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-20 rounded-xl border border-surface-variant bg-surface/60 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {state.listings.map((listing) => {
              const key = `${listing.id}:${listing.unitId || ""}`;
              return (
                <article
                  key={key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-surface-variant bg-surface/90 p-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-gold-accent/15 border border-gold-accent/35 font-mono text-xs uppercase tracking-wider text-gold-accent">
                        {role.toUpperCase()} GATE
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-xs uppercase tracking-wider border ${
                          listing.enabled
                            ? "bg-success/15 border-success/40 text-success"
                            : "bg-surface-alt border-surface-variant text-text-secondary"
                        }`}
                      >
                        {listing.enabled ? "Free Inbound Contact Open" : "1 Connect Required"}
                      </span>
                    </div>
                    <h2 className="mt-2 font-working-title text-lg font-semibold text-on-surface break-words [overflow-wrap:anywhere]">
                      {listing.title}
                    </h2>
                    <p className="mt-1 text-xs text-text-secondary">
                      {listing.enabled
                        ? "Seekers can inquire without spending a Connect. Inquiries appear in your Deal Inbox and CRM with an OPEN GATE badge."
                        : "Standard Connect gate active. Seekers spend 1 Connect to open a deal room."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(listing)}
                    disabled={busy === key || (!state.eligible && !listing.enabled)}
                    className={`min-h-11 w-full sm:w-auto shrink-0 rounded-xl border px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider transition disabled:opacity-50 inline-flex items-center justify-center gap-1.5 ${
                      listing.enabled
                        ? "border-surface-variant bg-surface-alt text-on-surface hover:border-gold-accent/40"
                        : "border-gold-accent bg-gold-accent text-background hover:opacity-95"
                    }`}
                  >
                    <Unlock size={14} aria-hidden="true" />
                    <span>{listing.enabled ? "Close Gate" : "Open Gate"}</span>
                  </button>
                </article>
              );
            })}
            {state.listings.length === 0 && (
              <div className="rounded-xl border border-dashed border-surface-variant bg-surface/50 p-6 text-center">
                <p className="font-working-title text-base font-semibold text-on-surface">
                  No eligible listings or units for the {role} lens yet
                </p>
                <p className="mt-1 text-xs text-text-secondary max-w-md mx-auto">
                  Publish a property as an Owner, secure an active Broker mandate, or accept an Operator unit delegation to configure Open Gate on that listing.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Recent Open Gate Leads routed to CRM & Inbox */}
        {openGateDeals.length > 0 && (
          <section className="rounded-2xl border border-surface-variant bg-surface/90 p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-gold-accent">
                  OPEN GATE INBOUND PIPELINE
                </span>
                <h2 className="font-working-title text-lg font-semibold text-on-surface">
                  Recent Free-Inbound Inquiries ({openGateDeals.length})
                </h2>
              </div>
              <Link
                href="/dashboard/crm"
                className="min-h-11 px-3.5 py-2 rounded-xl border border-gold-accent/40 bg-gold-accent/10 text-gold-accent font-mono text-xs uppercase tracking-wider inline-flex items-center gap-1.5"
              >
                <span>View in CRM</span>
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
            <div className="divide-y divide-surface-variant/60">
              {openGateDeals.slice(0, 5).map((deal) => (
                <div key={deal.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-gold-accent/15 border border-gold-accent/35 font-mono text-xs font-semibold uppercase tracking-wider text-gold-accent">
                        {deal.intentBadge || "OPEN GATE INQUIRY"}
                      </span>
                      <span className="font-mono text-xs uppercase text-text-secondary">
                        Status: {deal.status}
                      </span>
                    </div>
                    <p className="mt-1 font-working-title text-sm font-semibold text-on-surface truncate">
                      {deal.intentSummary || deal.propertyTitle}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      From: {deal.otherParty}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/inbox?dealId=${encodeURIComponent(deal.id)}`}
                    className="min-h-11 w-full sm:w-auto px-3.5 py-2 rounded-xl border border-surface-variant bg-surface-alt hover:border-gold-accent/40 font-mono text-xs uppercase tracking-wider text-on-surface inline-flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <span>Open in Inbox</span>
                    <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function OpenGateDashboard() {
  return (
    <DashboardProvider>
      <VerifiedWorkspaceBoundary>
        <OpenGateDashboardInner />
      </VerifiedWorkspaceBoundary>
    </DashboardProvider>
  );
}
