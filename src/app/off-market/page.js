"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function OffMarketPage() {
  const [properties, setProperties] = useState([]);
  const [state, setState] = useState("loading");
  const [sessionToken, setSessionToken] = useState("");
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [sendState, setSendState] = useState("idle");

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (active) setState("auth");
        return;
      }
      setSessionToken(session.access_token);
      const response = await fetch("/api/off-market", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!active) return;
      if (!response.ok) {
        setState(response.status === 401 || response.status === 403 ? "auth" : "error");
        return;
      }
      setProperties(data.properties || []);
      setState("ready");
    }
    load().catch(() => active && setState("error"));
    return () => { active = false; };
  }, []);

  async function sendContact(event) {
    event.preventDefault();
    if (!selected || !sessionToken) return;
    setSendState("sending");
    const response = await fetch("/api/deals/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify({ propertySlug: selected.slug, message, role: "buyer" }),
    });
    setSendState(response.ok ? "sent" : "error");
    if (response.ok) setMessage("");
  }

  return (
    <main className="min-h-screen bg-background text-on-surface px-4 py-16 md:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/property" className="font-label-caps text-xs tracking-[0.2em] text-gold-accent">← LIVE DIRECTORY</Link>
        <p className="mt-10 font-label-caps text-xs tracking-[0.25em] text-gold-accent">AUTHENTICATED OFF-MARKET</p>
        <h1 className="mt-3 font-display-md text-4xl md:text-6xl">Quiet inventory, kept private.</h1>
        <p className="mt-4 max-w-2xl text-text-secondary">Withdrawn listings are not part of the ordinary directory. This surface is limited to entitled Cluster and Universe seekers, with contact shown only when the owner has enabled Quietly open to offers.</p>

        {state === "loading" && <p className="mt-12 text-text-secondary">Loading private inventory…</p>}
        {state === "auth" && <p className="mt-12 border border-surface-variant bg-surface-alt p-5 text-text-secondary">Sign in with an entitled account to view off-market inventory.</p>}
        {state === "error" && <p className="mt-12 border border-error/40 bg-surface-alt p-5 text-text-secondary">Private inventory is temporarily unavailable.</p>}
        {state === "ready" && properties.length === 0 && <p className="mt-12 border border-surface-variant bg-surface-alt p-5 text-text-secondary">No off-market properties are available to this account yet.</p>}

        {state === "ready" && properties.length > 0 && (
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {properties.map((property) => (
              <article key={property.id} className="rounded border border-surface-variant bg-surface-alt/80 p-5 shadow-[0_0_28px_rgba(232,174,60,0.05)]">
                <p className="font-label-caps text-[10px] tracking-[0.2em] text-text-secondary">OFF-MARKET · {property.spaceCategory || property.type || "PROPERTY"}</p>
                <h2 className="mt-3 text-2xl text-on-surface">{property.title}</h2>
                <p className="mt-2 text-sm text-text-secondary">{property.location || "Philippines"}</p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="rounded border border-surface-variant px-3 py-2 font-label-caps text-[10px] tracking-widest text-text-secondary">VIEW-ONLY BRIEFING</span>
                  {property.contactAvailable ? (
                    <button type="button" className="min-h-11 rounded border border-gold-accent/60 px-3 py-2 font-label-caps text-[10px] tracking-widest text-gold-accent" onClick={() => { setSelected(property); setSendState("idle"); }}>REQUEST CONTACT · 1 CONNECT</button>
                  ) : (
                    <span className="rounded border border-surface-variant px-3 py-2 font-label-caps text-[10px] tracking-widest text-text-secondary">CONTACT DISABLED</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4 md:items-center" role="dialog" aria-modal="true" aria-labelledby="off-market-contact-title">
            <form onSubmit={sendContact} className="w-full max-w-lg rounded border border-gold-accent/50 bg-surface p-5 shadow-[0_0_35px_rgba(232,174,60,0.12)]">
              <div className="flex items-start justify-between gap-4">
                <div><p className="font-label-caps text-[10px] tracking-[0.2em] text-gold-accent">ONE-CONNECT CONTACT</p><h2 id="off-market-contact-title" className="mt-2 text-xl">{selected.title}</h2></div>
                <button type="button" className="min-h-11 min-w-11 text-2xl text-text-secondary" aria-label="Close contact form" onClick={() => setSelected(null)}>×</button>
              </div>
              <p className="mt-4 text-sm text-text-secondary">The owner has enabled Quietly open to offers. Decline, non-response, or timeout does not create an automatic refund.</p>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} className="mt-4 min-h-28 w-full rounded border border-surface-variant bg-background p-3 text-sm text-on-surface" placeholder="What would you like to ask?" required />
              <button type="submit" disabled={sendState === "sending" || sendState === "sent"} className="mt-4 min-h-11 w-full rounded bg-gold-accent px-4 py-3 font-label-caps text-xs font-bold tracking-widest text-background disabled:opacity-50">{sendState === "sending" ? "SENDING…" : sendState === "sent" ? "REQUEST SENT" : "SEND REQUEST · 1 CONNECT"}</button>
              {sendState === "error" && <p className="mt-3 text-sm text-error">The request could not be sent. No successful delivery should be treated as a completed contact.</p>}
            </form>
          </div>
        )}
      </div>
    </main>
  );
}