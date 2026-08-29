"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  MessageSquareText,
  ShieldAlert,
} from "lucide-react";
import { crmFetch } from "@/lib/crmClient";

// The first thing an owner should see on the dashboard: whether anything in
// the Inbox, CRM or Calendar needs them right now.
//
// Deliberately not a notification list. The bell already carries "something
// happened"; this carries "something is waiting", which is the question people
// actually open the dashboard to answer. Everything shown here is a live count
// of real rows — when a workspace is quiet it says so rather than filling the
// space with an encouraging number.

const ICONS = {
  inbox: MessageSquareText,
  crm: BriefcaseBusiness,
  calendar: CalendarDays,
};

// Severity is carried by weight and fill, not by a new colour family — the
// dashboard stays on the gold system, and urgency reads as more of it.
const TONE = {
  urgent: {
    card: "border-gold-accent/45 bg-gold-accent/[0.07] hover:border-gold-bright/70",
    rule: "w-[3px] bg-gold-bright",
    label: "text-gold-accent",
    headline: "text-on-surface",
    pill: "bg-gold-accent text-background",
  },
  attention: {
    card: "border-gold-accent/20 bg-surface/70 hover:border-gold-accent/45",
    rule: "w-[2px] bg-gold-accent/50",
    label: "text-text-secondary",
    headline: "text-on-surface",
    pill: "border border-gold-accent/50 text-gold-accent",
  },
  clear: {
    card: "border-surface-variant bg-surface/50 hover:border-gold-accent/25",
    rule: "w-px bg-surface-variant",
    label: "text-text-muted",
    headline: "text-text-secondary",
    pill: "",
  },
};

const REFRESH_MS = 120_000;

export default function AttentionRail({ mockUserId, className = "" }) {
  const reduceMotion = useReducedMotion();
  const [state, setState] = useState({ status: "loading", data: null });

  const load = useCallback(async () => {
    try {
      const data = await crmFetch("/api/dashboard/attention", { mockUserId });
      setState({ status: "ready", data });
    } catch {
      // Silence here would be a lie: an empty rail looks exactly like a calm
      // one. Say the check failed and let the user open a workspace directly.
      setState((previous) => (previous.status === "ready" ? previous : { status: "error", data: null }));
    }
  }, [mockUserId]);

  useEffect(() => {
    let cancelled = false;
    const run = () => { if (!cancelled) load(); };
    run();
    const timer = setInterval(run, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [load]);

  if (state.status === "loading") {
    return (
      <section aria-label="What needs you" className={className}>
        <div className="h-[124px] animate-pulse rounded-lg border border-surface-variant bg-surface/40" />
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section aria-label="What needs you" className={className}>
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-surface-variant bg-surface/50 p-4">
          <ShieldAlert size={16} className="text-text-muted" aria-hidden="true" />
          <p className="font-body text-base text-text-secondary">
            We could not check your workspaces just now.
          </p>
          <button
            type="button"
            onClick={() => load()}
            className="min-h-11 rounded-full border border-gold-accent/40 px-4 font-label-caps text-label-caps uppercase text-gold-accent transition-colors duration-200 ease-out hover:border-gold-accent"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  const { signals = [], summary, severity, unavailable = [] } = state.data || {};

  return (
    <section aria-label="What needs you" className={className}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-label-caps text-label-caps uppercase text-text-secondary">
          What needs you
        </h2>
        <p
          className={`font-body text-base ${severity === "urgent" ? "text-gold-accent" : "text-text-muted"}`}
          aria-live="polite"
        >
          {summary}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {signals.map((signal) => {
          const Icon = ICONS[signal.id] || MessageSquareText;
          const tone = TONE[signal.severity] || TONE.clear;
          const missing = unavailable.includes(signal.id);

          return (
            <Link
              key={signal.id}
              href={signal.href}
              className={`group relative flex min-h-11 flex-col gap-2 overflow-hidden rounded-lg border p-4 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-accent/70 ${tone.card}`}
            >
              <span
                aria-hidden="true"
                className={`absolute inset-y-0 left-0 ${tone.rule} ${
                  signal.severity === "urgent" && !reduceMotion ? "animate-pulse" : ""
                }`}
              />

              <span className="flex items-center justify-between gap-2">
                <span className={`flex items-center gap-2 font-label-caps text-label-caps uppercase ${tone.label}`}>
                  <Icon size={14} strokeWidth={1.7} aria-hidden="true" />
                  {signal.label}
                </span>
                {signal.count > 0 && (
                  <span className={`rounded-full px-2 py-0.5 font-body text-sm font-semibold tabular-nums ${tone.pill}`}>
                    {signal.count}
                  </span>
                )}
              </span>

              <span className={`font-body text-base leading-snug ${tone.headline}`}>
                {missing ? "We could not read this workspace" : signal.headline}
              </span>

              {!missing && signal.detail && (
                <span className="truncate font-body text-sm text-text-muted">{signal.detail}</span>
              )}

              {/* The whole card is the link, so the word "Open" repeated three
                  times was noise. A quiet chevron that warms on hover carries
                  the same affordance without the shouting. */}
              <ChevronRight
                size={15}
                strokeWidth={2}
                aria-hidden="true"
                className="mt-auto self-end text-text-muted transition-colors duration-200 ease-out group-hover:text-gold-accent group-focus-visible:text-gold-accent"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
