"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShieldCheck, X } from "lucide-react";
import SatisfactionFace from "@/components/brokers/SatisfactionFace";
import { SATISFACTION_LEVELS } from "@/lib/brokerSatisfaction";
import { ATTRIBUTION_MODES } from "@/lib/brokerRecommendations";
import { MAX_RECOMMENDATION_LENGTH } from "@/lib/brokerRecommendationSubmission";

// ═══════════════════════════════════════════════════════════════
// A-038 — the caller that was missing.
//
// /api/broker/recommendations has existed, correct and authorization-tight,
// with nothing in the product calling it. Every recommendation on a dossier
// today was written into Supabase by an operator. This panel is the client's
// own way in, and it is deliberately an INVITATION:
//
//   • never modal, never over a close, never gating another action
//   • dismissible, and a dismissal is remembered per advisor
//   • absent entirely when nothing qualifies — no encouraging empty state
//
// Consent is chosen here, per submission, at write time. Nothing about
// verification, authorship or moderation is decided on this side of the wire;
// the route resolves all three and would reject them if they were sent.
// ═══════════════════════════════════════════════════════════════

const ENDPOINT = "/api/broker/recommendations";
const ELIGIBILITY_ENDPOINT = "/api/broker/recommendations/eligibility";
const DISMISSED_KEY = "scoutit:recommendation-invitations-dismissed";

const LEVEL_COPY = {
  angry: "Poorly",
  sad: "Below what I hoped",
  smile: "Well",
  happy: "Very well",
};

const ATTRIBUTION_COPY = [
  { mode: ATTRIBUTION_MODES.FULL_NAME, label: "My full name", needsName: true },
  { mode: ATTRIBUTION_MODES.INITIALS, label: "My initials", needsName: true },
  { mode: ATTRIBUTION_MODES.ROLE_ONLY, label: "My role only", needsRole: true },
  { mode: ATTRIBUTION_MODES.ANONYMOUS, label: "Anonymously" },
];

// localStorage is per-browser and may throw in private modes. A dismissal that
// fails to persist is a nuisance, never a failure — the panel still works.
function readDismissed() {
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function persistDismissed(ids) {
  try {
    window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
  } catch {
    /* A remembered dismissal is a convenience, not a guarantee. */
  }
}

export default function RecommendationInvitation({ className = "" }) {
  const [state, setState] = useState({ status: "loading", invitations: [] });
  const [dismissed, setDismissed] = useState([]);
  const [openBrokerId, setOpenBrokerId] = useState(null);

  useEffect(() => setDismissed(readDismissed()), []);

  useEffect(() => {
    let live = true;

    (async () => {
      try {
        const response = await fetch(ELIGIBILITY_ENDPOINT, { credentials: "include" });

        // 401 is not an error worth showing. A signed-out or expired session
        // has nothing to be invited about; it is the empty case.
        if (response.status === 401) {
          if (live) setState({ status: "ready", invitations: [] });
          return;
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const payload = await response.json();
        if (live) setState({ status: "ready", invitations: payload?.invitations || [] });
      } catch {
        if (live) setState({ status: "error", invitations: [] });
      }
    })();

    return () => {
      live = false;
    };
  }, []);

  const visible = useMemo(
    () => state.invitations.filter((invitation) => !dismissed.includes(invitation.brokerId)),
    [state.invitations, dismissed],
  );

  const dismiss = useCallback((brokerId) => {
    setDismissed((current) => {
      const next = current.includes(brokerId) ? current : [...current, brokerId];
      persistDismissed(next);
      return next;
    });
    setOpenBrokerId((current) => (current === brokerId ? null : current));
  }, []);

  const complete = useCallback((brokerId) => {
    setState((current) => ({
      ...current,
      invitations: current.invitations.filter((item) => item.brokerId !== brokerId),
    }));
    setOpenBrokerId(null);
  }, []);

  const toggle = useCallback((brokerId) => {
    setOpenBrokerId((current) => (current === brokerId ? null : brokerId));
  }, []);

  if (state.status === "loading") {
    return (
      <div
        className={`h-24 animate-pulse rounded-lg border border-surface-variant bg-surface/40 ${className}`}
        aria-hidden="true"
      />
    );
  }

  // An invitation that cannot be checked is not announced. Telling a client
  // "we could not load your feedback prompts" is noise about something they
  // never asked for; the dossier is the surface where a read failure must be
  // honest, because that one publishes a figure.
  if (state.status === "error" || !visible.length) return null;

  return (
    <section
      className={`space-y-3 ${className}`}
      aria-label="Share feedback on a completed connection"
    >
      {visible.map((invitation) => (
        <InvitationCard
          key={invitation.brokerId}
          invitation={invitation}
          isExpanded={openBrokerId === invitation.brokerId}
          onToggle={() => toggle(invitation.brokerId)}
          onDismiss={() => dismiss(invitation.brokerId)}
          onComplete={() => complete(invitation.brokerId)}
        />
      ))}
    </section>
  );
}

function InvitationCard({ invitation, isExpanded, onToggle, onDismiss, onComplete }) {
  const [level, setLevel] = useState("");
  const [body, setBody] = useState("");
  const [attributionMode, setAttributionMode] = useState("");
  const [authorDisplayName, setAuthorDisplayName] = useState("");
  const [relationshipType, setRelationshipType] = useState("");
  const [consentGranted, setConsentGranted] = useState(false);
  const [submitState, setSubmitState] = useState({ status: "idle", message: "", fields: {} });

  const choice = ATTRIBUTION_COPY.find((option) => option.mode === attributionMode);
  const canSubmit =
    Boolean(level && attributionMode && consentGranted) && submitState.status !== "saving";

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitState({ status: "saving", message: "", fields: {} });

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        // Exactly the keys the validator accepts. It rejects unknown keys
        // rather than stripping them, so sending anything extra — including a
        // helpful-looking moderation or verification field — fails the whole
        // submission, by design.
        body: JSON.stringify({
          brokerId: invitation.brokerId,
          satisfactionLevel: level,
          body,
          attributionMode,
          authorDisplayName,
          relationshipType,
          consentGranted,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSubmitState({
          status: "error",
          message: payload?.error || "Could not save your feedback.",
          fields: payload?.fields || {},
        });
        return;
      }

      setSubmitState({ status: "sent", message: payload?.message || "", fields: {} });
    } catch {
      setSubmitState({
        status: "error",
        message: "Could not reach ScoutIt. Your feedback was not saved.",
        fields: {},
      });
    }
  }

  if (submitState.status === "sent") {
    return (
      <article className="rounded-lg border border-gold-accent/40 bg-gold-accent/[0.06] p-4">
        <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-gold-accent">
          Received
        </p>
        <p className="mt-2 text-sm text-on-surface">
          {submitState.message ||
            "Thank you. Your recommendation is with ScoutIt for review before it appears."}
        </p>
        <button
          type="button"
          onClick={onComplete}
          className="mt-3 font-mono text-[12px] uppercase tracking-[0.12em] text-text-secondary underline-offset-4 hover:text-gold-accent hover:underline"
        >
          Close
        </button>
      </article>
    );
  }

  const dismissLabel = `Dismiss the feedback invitation for ${invitation.brokerName}`;
  const fieldNotes = Object.values(submitState.fields).flat().join(" ");

  return (
    <article className="rounded-lg border border-gold-accent/20 bg-surface/70 p-4 transition-colors hover:border-gold-accent/45">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* Read from the payload rather than printed unconditionally. The
              eligibility endpoint only returns an invitation when a completed
              two-sided handshake was confirmed server-side, so the label is
              already earned — but printing it as a constant means a future
              change to that endpoint could not take it away. The claim should
              travel with the data that justifies it. */}
          <p className="flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.12em] text-gold-accent">
            <ShieldCheck size={12} aria-hidden="true" />
            {invitation.verifiedConnection
              ? "Verified ScoutIt connection"
              : "Client-submitted · unverified"}
          </p>
          <h3 className="mt-1.5 text-sm text-on-surface">
            How did working with{" "}
            <Link
              href={`/brokers/${invitation.brokerSlug}`}
              className="text-gold-accent underline-offset-4 hover:underline"
            >
              {invitation.brokerName}
            </Link>{" "}
            go?
          </h3>
          <p className="mt-1 text-xs text-text-secondary">
            Optional, and only ever published after ScoutIt reviews it.
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="shrink-0 rounded p-1 text-text-muted hover:bg-surface-variant hover:text-on-surface"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      {!isExpanded ? (
        <button
          type="button"
          onClick={onToggle}
          className="mt-3 rounded border border-gold-accent/50 px-3 py-1.5 font-mono text-[12px] uppercase tracking-[0.12em] text-gold-accent hover:bg-gold-accent/10"
        >
          Share feedback
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <fieldset>
            <legend className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-secondary">
              How did it go?
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {SATISFACTION_LEVELS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={level === option}
                  onClick={() => setLevel(option)}
                  className={`flex min-w-[4.5rem] flex-col items-center gap-1 rounded border px-3 py-2 text-xs transition-colors ${
                    level === option
                      ? "border-gold-accent bg-gold-accent/10 text-on-surface"
                      : "border-surface-variant text-text-secondary hover:border-gold-accent/45"
                  }`}
                >
                  <SatisfactionFace level={option} label={LEVEL_COPY[option]} className="h-6 w-6" />
                  {LEVEL_COPY[option]}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-secondary">
              In your words (optional)
            </span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={MAX_RECOMMENDATION_LENGTH}
              rows={3}
              placeholder="What was it like to work with them?"
              className="mt-2 w-full rounded border border-surface-variant bg-background px-3 py-2 text-sm text-on-surface focus:border-gold-accent focus:outline-none"
            />
            <span className="mt-1 block text-xs text-text-muted">
              No contact details, and no claims ScoutIt cannot stand behind.
            </span>
          </label>

          <fieldset>
            <legend className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-secondary">
              Publish this as
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {ATTRIBUTION_COPY.map((option) => (
                <button
                  key={option.mode}
                  type="button"
                  aria-pressed={attributionMode === option.mode}
                  onClick={() => setAttributionMode(option.mode)}
                  className={`rounded border px-3 py-1.5 text-xs transition-colors ${
                    attributionMode === option.mode
                      ? "border-gold-accent bg-gold-accent/10 text-on-surface"
                      : "border-surface-variant text-text-secondary hover:border-gold-accent/45"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          {choice?.needsName && (
            <label className="block">
              <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-secondary">
                Name to credit
              </span>
              <input
                value={authorDisplayName}
                onChange={(event) => setAuthorDisplayName(event.target.value)}
                maxLength={120}
                className="mt-2 w-full rounded border border-surface-variant bg-background px-3 py-2 text-sm text-on-surface focus:border-gold-accent focus:outline-none"
              />
            </label>
          )}

          {choice?.needsRole && (
            <label className="block">
              <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-secondary">
                Your role
              </span>
              <input
                value={relationshipType}
                onChange={(event) => setRelationshipType(event.target.value)}
                maxLength={80}
                placeholder="Office tenant, first-time buyer…"
                className="mt-2 w-full rounded border border-surface-variant bg-background px-3 py-2 text-sm text-on-surface focus:border-gold-accent focus:outline-none"
              />
            </label>
          )}

          <label className="flex items-start gap-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={consentGranted}
              onChange={(event) => setConsentGranted(event.target.checked)}
              className="mt-0.5"
            />
            <span>
              I agree ScoutIt may publish this on {invitation.brokerName}&rsquo;s page under the
              attribution I chose, after review.
            </span>
          </label>

          {submitState.status === "error" && (
            <p role="alert" className="text-xs text-red-400">
              {submitState.message}
              {fieldNotes && <span className="mt-1 block text-text-muted">{fieldNotes}</span>}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded border border-gold-accent bg-gold-accent/10 px-4 py-2 font-mono text-[12px] uppercase tracking-[0.12em] text-gold-accent disabled:cursor-not-allowed disabled:border-surface-variant disabled:text-text-muted"
            >
              {submitState.status === "saving" ? "Sending…" : "Send for review"}
            </button>
            <button
              type="button"
              onClick={onToggle}
              className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-secondary underline-offset-4 hover:text-on-surface hover:underline"
            >
              Not now
            </button>
          </div>
        </form>
      )}
    </article>
  );
}
