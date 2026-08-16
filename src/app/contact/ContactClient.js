"use client";

import { useRef, useState } from "react";
import TurnstileGate from "@/components/ui/TurnstileGate";

// The contact form.
//
// Ships all four states deliberately (RULES.md Part B — "the four states nobody
// builds"): idle, sending, error, success. The error state matters more here
// than anywhere else in the product, because the thing this replaces was a
// `mailto:` to a domain with no MX records — a channel that failed silently and
// looked like it worked. A form that cannot say "that didn't send" would be the
// same bug with a nicer face.

const MAX_MESSAGE = 4000;

export default function ContactClient() {
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
        body: JSON.stringify({ ...form, turnstileToken: token }),
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
    return (
      <div className="contact-panel contact-panel--done" role="status">
        <span className="contact-eyebrow">Message received</span>
        <h2 className="contact-done-title">We have it.</h2>
        <p className="contact-done-body">
          Your message is in the queue and a person will read it. If you asked something we
          can answer quickly, expect a reply at <strong>{form.email}</strong>.
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

  return (
    <form className="contact-panel" onSubmit={handleSubmit} noValidate>
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
        />
      </div>

      <div className="contact-field">
        <label className="contact-label" htmlFor="contact-message">Message</label>
        <textarea
          id="contact-message"
          className="contact-input contact-textarea"
          value={form.message}
          onChange={set("message")}
          required
          rows={7}
          maxLength={MAX_MESSAGE}
          disabled={sending}
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

      <button type="submit" className="contact-submit" disabled={sending || !token}>
        {sending ? "Sending…" : "Send message"}
      </button>

      {!token && status !== "error" && (
        <p className="contact-hint contact-hint--center">
          The bot check above must finish before the button turns on.
        </p>
      )}
    </form>
  );
}
