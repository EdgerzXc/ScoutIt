"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

// ─────────────────────────────────────────────────────────────────────────
// TURNSTILE GATE — the shared bot-check widget
//
// Wraps @marsidev/react-turnstile so every protected form behaves the same
// and, critically, so token resets are handled in ONE place.
//
// ── WHY THE RESET MATTERS ───────────────────────────────────────────
// A Turnstile token is SINGLE-USE. It's redeemed the moment the server
// calls siteverify. If the request then fails for any reason — wrong
// password, validation error, network blip — the browser still holds the
// spent token in the DOM. A naive retry submits the same token and
// Cloudflare rejects it with `timeout-or-duplicate`.
//
// The user experiences that as "it worked, then it stopped working, and now
// nothing I do helps." Call `ref.current.reset()` after ANY failed submit.
//
// ── DESIGN ──────────────────────────────────────────────────────────
// theme: dark to match the 95% void-black DNA (AGENTS.md §1).
// data-action carries the Spin telemetry marker — account-level aggregate
// only, no per-user data. Removing it doesn't break anything, it just loses
// Cloudflare's activation analytics.
// ─────────────────────────────────────────────────────────────────────────

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const TurnstileGate = forwardRef(function TurnstileGate(
  { onToken, onError, action = "turnstile-spin-v2", className = "" },
  ref,
) {
  const widgetRef = useRef(null);
  const [failed, setFailed] = useState(false);
  // Resolvers waiting on the next token, for refresh(). Held in a ref so the
  // onSuccess handler can settle them without stale-closure problems.
  const waitersRef = useRef([]);

  const settleWaiters = (token) => {
    const waiters = waitersRef.current;
    waitersRef.current = [];
    for (const resolve of waiters) resolve(token);
  };

  useImperativeHandle(ref, () => ({
    /** Discard the spent token and issue a fresh challenge. */
    reset: () => {
      setFailed(false);
      onToken?.("");
      try { widgetRef.current?.reset(); } catch { /* not mounted yet */ }
    },

    /**
     * Reset AND wait for the replacement token.
     *
     * Needed whenever one user action makes two consecutive auth calls — e.g.
     * "try sign-in, fall back to sign-up". The first call REDEEMS the token,
     * so the second must have a fresh one or Cloudflare rejects it as
     * 'timeout-or-duplicate'. A managed widget re-solves in about a second.
     *
     * @returns {Promise<string>} the new token, or "" if it didn't arrive in time
     */
    refresh: (timeoutMs = 6000) => new Promise((resolve) => {
      setFailed(false);
      onToken?.("");

      let done = false;
      const settle = (token) => {
        if (done) return;
        done = true;
        resolve(token);
      };

      waitersRef.current.push(settle);
      // Never hang the caller. An empty token means the second call proceeds
      // without one — which Supabase rejects cleanly with a real message,
      // rather than the user watching a frozen button.
      setTimeout(() => settle(""), timeoutMs);

      try {
        widgetRef.current?.reset();
      } catch {
        settle("");
      }
    }),
  }));

  // No site key = the widget can't render. Say so rather than showing an
  // empty box the user can't get past. Server-side siteverify still fails
  // closed in production, so this is a UX message, not the security control.
  if (!SITE_KEY) {
    return (
      <div
        className={className}
        style={{
          fontFamily: "'Courier New',monospace",
          fontSize: "var(--type-micro)",
          letterSpacing: "0.08em",
          color: "#e06c6c",
          lineHeight: 1.6,
        }}
      >
        Bot check unavailable — NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set.
      </div>
    );
  }

  return (
    <div className={className}>
      <Turnstile
        ref={widgetRef}
        siteKey={SITE_KEY}
        options={{ theme: "dark", action }}
        onSuccess={(token) => {
          setFailed(false);
          onToken?.(token);
          settleWaiters(token);
        }}
        onExpire={() => {
          // Tokens expire after ~5 minutes. Clear ours so the form can't
          // submit something Cloudflare will reject as stale.
          onToken?.("");
          try { widgetRef.current?.reset(); } catch { /* ignore */ }
        }}
        onError={() => {
          setFailed(true);
          onToken?.("");
          // Unblock anyone awaiting refresh() — otherwise a widget error
          // leaves the caller hanging until the timeout.
          settleWaiters("");
          onError?.("Bot check failed to load. Please try again.");
        }}
      />
      {failed && (
        <div
          style={{
            fontFamily: "'Courier New',monospace",
            fontSize: "var(--type-floor)",
            letterSpacing: "0.06em",
            color: "#e06c6c",
            marginTop: "6px",
            lineHeight: 1.5,
          }}
        >
          Bot check couldn&apos;t load. Check your connection and try again.
        </div>
      )}
    </div>
  );
});

export default TurnstileGate;
