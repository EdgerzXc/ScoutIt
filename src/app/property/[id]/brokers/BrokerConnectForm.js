"use client";

import { useState } from "react";
import Link from "next/link";
import { getSession } from "@/lib/authClient";
import PrivacyNotice from "@/components/ui/PrivacyNotice";
import { INTRO_MAX } from "@/lib/connectIntro";

export default function BrokerConnectForm({ propertySlug, brokerId, freeContact, recipientLabel = "broker" }) {
  const [message, setMessage] = useState("");
  const [state, setState] = useState({ busy: false, error: "", dealId: null, spent: null });
  async function submit(event) {
    event.preventDefault();
    if (state.busy) return;
    setState({ busy: true, error: "", dealId: null, spent: null });
    try {
      const { data: { session } } = await getSession();
      if (!session?.access_token) throw new Error("Sign in to contact this listing recipient.");
      const response = await fetch("/api/deals/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          propertySlug, ...(brokerId ? { preferredBrokerId: brokerId } : {}), role: "buyer",
          message: message.trim(), source_type: "property", expectOpenGate: freeContact === true,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send your request.");
      setState({ busy: false, error: "", dealId: data.dealId, spent: data.connects_spent });
    } catch (error) {
      setState({ busy: false, error: error.message || "Could not send your request.", dealId: null, spent: null });
    }
  }
  if (state.dealId) return <div className="form-success-alert" role="status">
    Request sent · {state.spent === 0 ? "0 Connects spent" : "1 Connect spent"}.
    {" "}<Link href={`/dashboard/inbox?dealId=${encodeURIComponent(state.dealId)}`}>Open your inbox →</Link>
  </div>;
  return <form onSubmit={submit} className="intent-form">
    <h4 className="form-title">{freeContact ? "Open Gate · free inbound request" : `Contact ${recipientLabel} · 1 Connect`}</h4>
    <p className="text-sm text-[var(--text-secondary)]">
      {freeContact
        ? `This ${recipientLabel} has opened free contact for this listing. Sign in to send; no Connect is charged. Your profile privacy choice controls your name.`
        : `Sign in to send this ${recipientLabel} a request. One Connect is charged when it is sent, whether or not they accept.`}
    </p>
    <textarea aria-label="Introduction message" value={message} onChange={event => setMessage(event.target.value)}
      required maxLength={INTRO_MAX} rows="3" className="form-textarea-field"
      placeholder="Introduce your interest in this property." />
    {state.error && <p role="alert" className="form-error-alert">{state.error}</p>}
    <PrivacyNotice />
    <button disabled={state.busy || !message.trim()} className="form-submit-btn">
      {state.busy ? "Sending…" : freeContact ? "Send free request →" : "Spend 1 Connect →"}
    </button>
  </form>;
}
