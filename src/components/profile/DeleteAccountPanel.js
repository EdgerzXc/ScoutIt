"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signOut } from "@/lib/authClient";
import {
  ERASURE_CONFIRMATION,
  ERASED_DATA_LABELS,
  interpretErasureResponse,
} from "@/lib/accountErasure";

// ─────────────────────────────────────────────────────────────────────────
// A-126 — RA 10173 §16(e) gives a person the right to have their data erased,
// the Privacy Policy publishes that right, and until this panel nothing in the
// product let anyone use it: `/api/user/delete-account` existed, was tested,
// and had no caller (Standing Rule 13).
//
// Two rules this screen must not break:
// 1. It says only what the route does. "What is deleted" is rendered from
//    ERASED_DATA_LABELS, which a contract test ties to the route's own list.
// 2. A partial erasure is never shown as a completed one. That decision lives
//    in `interpretErasureResponse`, not in this file.
//
// "What this does not remove" is a factual description of the route, not a
// legal claim. Whether each kept item is lawfully retained is an owner and
// counsel question (O-003), and the wording is theirs to change.
// ─────────────────────────────────────────────────────────────────────────

const MONO = "'Courier New',monospace";

const NOT_REMOVED = [
  "Listings you created. Archive or remove them from your dashboard first.",
  "Messages you sent in conversations. They follow the normal chat rule and are cleared 7 days after a conversation closes.",
  "Connects on your account. They are not refunded.",
  "Your sign-in record, including your email address. It is closed, not erased.",
  "A record that you asked for deletion, and when.",
];

export default function DeleteAccountPanel() {
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const isConfirmed = typed.trim() === ERASURE_CONFIRMATION;

  const handleDelete = async () => {
    if (!isConfirmed || submitting) return;
    setSubmitting(true);
    setResult(null);
    try {
      const { data: { session } } = await getSession();
      const res = await fetch("/api/user/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ confirm: ERASURE_CONFIRMATION }),
      });
      const body = await res.json().catch(() => null);
      const outcome = interpretErasureResponse({ ok: res.ok, status: res.status, body });
      setResult(outcome);
      if (outcome.state === "deleted") {
        await signOut().catch(() => {});
        router.push("/");
      }
    } catch {
      setResult(interpretErasureResponse({ ok: false, status: 0, body: null }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="da-root">
      <style jsx global>{`
        .da-root {
          padding: 22px 18px;
          border: 1px solid var(--border-solid);
          border-radius: 12px;
          background: var(--surface);
        }
        .da-h {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 400;
          color: var(--text-primary);
          margin: 0 0 6px;
        }
        .da-intro {
          font-family: var(--font-display);
          font-size: 13px;
          line-height: 1.7;
          color: var(--text-secondary);
          margin: 0 0 18px;
          max-width: 58ch;
        }
        .da-cols { display: grid; gap: 18px; margin-bottom: 20px; }
        .da-label {
          font-family: ${MONO};
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin: 0 0 8px;
        }
        .da-list {
          margin: 0;
          padding-left: 18px;
          font-family: var(--font-display);
          font-size: 13px;
          line-height: 1.7;
          color: var(--text-primary);
        }
        .da-field-label {
          display: block;
          font-family: var(--font-display);
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0 0 6px;
        }
        .da-input {
          width: 100%;
          max-width: 360px;
          min-height: 44px;
          padding: 0 12px;
          border-radius: 6px;
          border: 1px solid var(--border-solid);
          background: var(--bg);
          color: var(--text-primary);
          font-family: ${MONO};
          font-size: 14px;
        }
        .da-input:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .da-btn {
          display: block;
          margin-top: 14px;
          min-height: 44px;
          padding: 0 18px;
          border-radius: 6px;
          border: 1px solid var(--red);
          background: transparent;
          color: var(--red);
          font-family: var(--font-display);
          font-size: 14px;
          cursor: pointer;
          transition: background-color 180ms ease-out;
        }
        .da-btn:hover:not(:disabled) { background: color-mix(in srgb, var(--red) 10%, transparent); }
        .da-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
        .da-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .da-err, .da-ok {
          font-family: var(--font-display);
          font-size: 13px;
          line-height: 1.7;
          margin-top: 14px;
          max-width: 58ch;
        }
        .da-err { color: var(--red); }
        .da-ok { color: var(--green); }
        .da-err a { color: inherit; text-decoration: underline; }
        @media (min-width: 700px) {
          .da-root { padding: 24px 26px; }
          .da-cols { grid-template-columns: 1fr 1fr; }
        }
        @media (prefers-reduced-motion: reduce) { .da-btn { transition: none; } }
      `}</style>

      <h3 className="da-h">Delete your account</h3>
      <p className="da-intro">
        This deletes your private data and closes your sign-in. You can&apos;t undo it yourself.
      </p>

      <div className="da-cols">
        <div>
          <p className="da-label">What is deleted</p>
          <ul className="da-list">
            {Object.values(ERASED_DATA_LABELS).map((label) => (
              <li key={label}>{label}</li>
            ))}
            <li>Your profile is cleared — name, photo, bio, licence details and date of birth are removed, and it is hidden.</li>
            <li>Your sign-in is closed.</li>
          </ul>
        </div>
        <div>
          <p className="da-label">What this does not remove</p>
          <ul className="da-list">
            {NOT_REMOVED.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      <label className="da-field-label" htmlFor="da-confirm">
        Type {ERASURE_CONFIRMATION} to confirm
      </label>
      <input
        id="da-confirm"
        className="da-input"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        autoComplete="off"
        spellCheck={false}
        disabled={submitting}
      />
      <button
        type="button"
        className="da-btn"
        onClick={handleDelete}
        disabled={!isConfirmed || submitting}
      >
        {submitting ? "Deleting…" : "Delete my account"}
      </button>

      {result && result.state !== "deleted" && (
        <p className="da-err" role="alert">
          {result.message}
          {result.state === "partial" && (
            <>
              {" "}
              <Link href="/contact">Contact us</Link>.
            </>
          )}
        </p>
      )}
      {result?.state === "deleted" && (
        <p className="da-ok" role="status">
          {result.message}
          {result.warning ? ` ${result.warning}` : ""}
        </p>
      )}
    </div>
  );
}
