"use client";

import { useRef, useState } from "react";
import TurnstileGate from "@/components/ui/TurnstileGate";
import PrivacyNotice from "@/components/ui/PrivacyNotice";
import { CONTACT_RETENTION_NOTICE } from "@/lib/contactRetention";

// The contact & direct support intake form.
//
// Ships all four states deliberately (RULES.md Part B — "the four states nobody
// builds"): idle, sending, error, success. The error state matters more here
// than anywhere else in the product, because the thing this replaces was a
// `mailto:` to a domain with no MX records — a channel that failed silently and
// looked like it worked. A form that cannot say "that didn't send" would be the
// same bug with a nicer face.

const MAX_MESSAGE = 4000;

const TOPICS = [
  {
    id: "support",
    label: "Direct Support",
    desc: "Platform help & technical issues",
  },
  {
    id: "vip_support",
    label: "VIP Pioneer SLA",
    desc: "Fast-track resolution for charter holders",
  },
  {
    id: "general",
    label: "General Inquiry",
    desc: "Spaces, partnerships, or questions",
  },
  {
    id: "listing",
    label: "Listing & Claims",
    desc: "Torrens titles, PDFs & publishing",
  },
];

export default function ContactClient({ initialTopic = "general" }) {
  const [topic, setTopic] = useState(initialTopic === "support" || initialTopic === "vip_support" ? initialTopic : "general");
  const [priority, setPriority] = useState("normal");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const turnstileRef = useRef(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, topic, priority, turnstileToken: token }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        // The Turnstile token is single-use and was just spent. Without this
        // reset a retry reuses it and Cloudflare rejects it as a duplicate —
        // which the sender experiences as "nothing I do helps".
        turnstileRef.current?.reset?.();
        setToken("");
        setStatus("error");
        setError(data.message || "We could not send that. Please try again.");
        return;
      }

      setStatus("sent");
    } catch {
      turnstileRef.current?.reset?.();
      setToken("");
      setStatus("error");
      setError("We could not reach the server. Please check your connection and try again.");
    }
  }

  if (status === "sent") {
    const isSupportTicket = topic === "support" || topic === "vip_support";
    return (
      <div className="contact-panel contact-panel--done" role="status">
        <span className="contact-eyebrow">
          {isSupportTicket ? "TICKET RECEIVED // QUEUED FOR ENGINEERING" : "MESSAGE RECEIVED"}
        </span>
        <h2 className="contact-done-title">
          {isSupportTicket ? "Ticket logged in queue." : "We have it."}
        </h2>
        <p className="contact-done-body">
          {isSupportTicket
            ? `Your direct support inquiry has been received and routed to our technical triage queue. ${
                topic === "vip_support"
                  ? "As an accredited Pioneer Charter holder, your ticket is prioritized under our VIP Support SLA."
                  : "A person will read it and respond."
              } Expect a reply at `
            : "Your message is in the queue and a person will read it. If you asked something we can answer quickly, expect a reply at "}
          <strong>{form.email}</strong>.
        </p>
        <button
          type="button"
          className="contact-secondary"
          onClick={() => {
            setForm({ name: "", email: "", subject: "", message: "" });
            setStatus("idle");
          }}
        >
          Send another
        </button>
      </div>
    );
  }

  const sending = status === "sending";
  const isSupportTopic = topic === "support" || topic === "vip_support";

  return (
    <form className="contact-panel" onSubmit={handleSubmit} noValidate>
      {/* ── Topic / Channel Selector ── */}
      <div className="contact-topics-group">
        <label className="contact-label">Channel / Topic</label>
        <div className="contact-topics-grid" role="radiogroup" aria-label="Support or Inquiry category">
          {TOPICS.map((t) => {
            const isActive = topic === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={isActive}
                className={`contact-topic-btn ${isActive ? "contact-topic-btn--active" : ""}`}
                onClick={() => setTopic(t.id)}
                disabled={sending}
              >
                <span className="contact-topic-label">{t.label}</span>
                <span className="contact-topic-desc">{t.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── VIP Pioneer SLA Notice ── */}
      {topic === "vip_support" && (
        <div className="contact-vip-banner" role="status">
          <div className="contact-vip-badge">
            <span className="contact-vip-dot" aria-hidden="true" />
            VIP PRIORITY ROUTING (TERMS §09)
          </div>
          <p className="contact-vip-body">
            Fast-track engineering resolution for accredited Pioneer Charter holders. Routed directly to on-call operational triage with accelerated response.
          </p>
        </div>
      )}

      {/* ── Urgency Level (for Support Desks) ── */}
      {isSupportTopic && (
        <div className="contact-field">
          <label className="contact-label">Urgency</label>
          <div className="contact-urgency-row" role="radiogroup" aria-label="Urgency level">
            <button
              type="button"
              role="radio"
              aria-checked={priority === "normal"}
              className={`contact-urgency-chip ${priority === "normal" ? "contact-urgency-chip--active" : ""}`}
              onClick={() => setPriority("normal")}
              disabled={sending}
            >
              Standard Resolution (24–48h)
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={priority === "urgent"}
              className={`contact-urgency-chip ${priority === "urgent" ? "contact-urgency-chip--active" : ""}`}
              onClick={() => setPriority("urgent")}
              disabled={sending}
            >
              Urgent / Blocking Issue
            </button>
          </div>
        </div>
      )}

      <div className="contact-field">
        <label className="contact-label" htmlFor="contact-name">Your name</label>
        <input
          id="contact-name"
          className="contact-input"
          value={form.name}
          onChange={set("name")}
          required
          maxLength={120}
          autoComplete="name"
          disabled={sending}
        />
      </div>

      <div className="contact-field">
        <label className="contact-label" htmlFor="contact-email">Email</label>
        <input
          id="contact-email"
          type="email"
          className="contact-input"
          value={form.email}
          onChange={set("email")}
          required
          maxLength={200}
          autoComplete="email"
          disabled={sending}
        />
        <p className="contact-hint">This is the only way we can reply.</p>
      </div>

      <div className="contact-field">
        <label className="contact-label" htmlFor="contact-subject">
          Subject <span className="contact-optional">optional</span>
        </label>
        <input
          id="contact-subject"
          className="contact-input"
          value={form.subject}
          onChange={set("subject")}
          maxLength={200}
          disabled={sending}
          placeholder={isSupportTopic ? "e.g., Cannot publish listing in BGC / Map error" : undefined}
        />
      </div>

      <div className="contact-field">
        <label className="contact-label" htmlFor="contact-message">
          {isSupportTopic ? "Problem description & details" : "Message"}
        </label>
        <textarea
          id="contact-message"
          className="contact-input contact-textarea"
          value={form.message}
          onChange={set("message")}
          required
          rows={7}
          maxLength={MAX_MESSAGE}
          disabled={sending}
          placeholder={isSupportTopic ? "Describe the issue, steps to reproduce, or space URL..." : undefined}
        />
        <p className="contact-hint">
          {form.message.length.toLocaleString()} / {MAX_MESSAGE.toLocaleString()}
        </p>
      </div>

      <TurnstileGate ref={turnstileRef} action="contact-form" onToken={setToken} onError={setError} />

      {status === "error" && (
        <p className="contact-error" role="alert">
          {error}
        </p>
      )}

      {/* A-002: the retention promise is rendered from the same module the
          nightly job imports, so the sentence and the behaviour cannot drift
          into two different numbers. */}
      <p className="contact-hint">{CONTACT_RETENTION_NOTICE}</p>

      <button type="submit" className="contact-submit" disabled={sending || !token}>
        {sending ? "Sending…" : isSupportTopic ? "Submit Support Ticket" : "Send message"}
      </button>

      {/* A-150: explicit Privacy Policy link beside the submit (RA 10173 §11). */}
      <PrivacyNotice />

      {!token && status !== "error" && (
        <p className="contact-hint contact-hint--center">
          The bot check above must finish before the button turns on.
        </p>
      )}
    </form>
  );
}
