"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import InfoTip from "@/components/ui/InfoTip";
import entrance from "@/components/ui/OverlayEntrance.module.css";
import {
  MONETIZATION_PHASES,
  PIONEER_ACCESS_BADGE_TEXT,
  UNIVERSE_MONTHLY_PRICE_LABEL,
  resolveMonetizationPhase,
  evaluateMonetizationGate,
  logPaywallConversionIntent,
} from "@/lib/monetizationGate";

export default function OffMarketPage() {
  const [properties, setProperties] = useState([]);
  const [state, setState] = useState("loading");
  const [sessionToken, setSessionToken] = useState("");
  const [isUniverseSeeker, setIsUniverseSeeker] = useState(false);
  const [userTier, setUserTier] = useState("starry");
  const [monetizationPhase, setMonetizationPhase] = useState(() => resolveMonetizationPhase());
  const [pioneerAccessBadge, setPioneerAccessBadge] = useState(
    () => (resolveMonetizationPhase() === MONETIZATION_PHASES.PILOT_ZERO_PAYWALL ? PIONEER_ACCESS_BADGE_TEXT : null),
  );
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [sendState, setSendState] = useState("idle");

  useEffect(() => {
    if (!selected) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected]);

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
      setIsUniverseSeeker(Boolean(data.isUniverseSeeker));
      setUserTier(data.userTier || "starry");
      if (data.monetizationPhase) {
        setMonetizationPhase(resolveMonetizationPhase({ phase: data.monetizationPhase }));
      }
      if ("pioneerAccessBadge" in data) {
        setPioneerAccessBadge(data.pioneerAccessBadge);
      }
      setState("ready");
    }
    load().catch(() => active && setState("error"));
    return () => { active = false; };
  }, []);

  async function sendContact(event) {
    event.preventDefault();
    if (!selected || !sessionToken) return;
    setSendState("sending");
    logPaywallConversionIntent({
      feature: "connect_spend",
      role: "seeker",
      tier: userTier,
      source: "/off-market",
      phase: monetizationPhase,
    });
    const response = await fetch("/api/deals/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify({ propertySlug: selected.slug, message, role: "buyer" }),
    });
    setSendState(response.ok ? "sent" : "error");
    if (response.ok) setMessage("");
  }

  const vaultDecision = evaluateMonetizationGate({
    feature: "off_market_vault",
    role: "seeker",
    tier: isUniverseSeeker ? "universe" : userTier,
    phase: monetizationPhase,
    source: "/off-market",
    silent: true,
  });

  return (
    <main className="min-h-screen bg-background text-on-surface px-4 py-16 md:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/property" className="font-label-caps text-xs tracking-[0.12em] text-gold-accent">← LIVE DIRECTORY</Link>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <p className="font-label-caps text-xs tracking-[0.12em] text-gold-accent">AUTHENTICATED OFF-MARKET</p>
          <InfoTip tipId="offMarketVault" label="About Off-Market Vault" />
          {(pioneerAccessBadge || vaultDecision.badgeText) && (
            <span
              data-testid="pioneer-access-badge"
              className="inline-flex items-center gap-1.5 rounded-full border border-gold-accent/40 bg-gold-accent/10 px-3 py-1 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-gold-accent shadow-[var(--shadow-glow-soft)]"
            >
              <span>◈</span>
              <span>{pioneerAccessBadge || vaultDecision.badgeText}</span>
            </span>
          )}
        </div>
        <h1 className="mt-3 font-display-md text-4xl md:text-6xl">Quiet inventory, kept private.</h1>
        <p className="mt-4 max-w-2xl text-text-secondary leading-relaxed">
          Withdrawn listings are not part of the ordinary public directory. This surface is limited to entitled Universe seekers ({UNIVERSE_MONTHLY_PRICE_LABEL}) and asset owners, with contact shown only when Quietly open to offers is enabled. <InfoTip tipId="whisperPricing" label="About whisper pricing" />
        </p>

        {state === "loading" && (
          <div className="mt-10 grid gap-5 md:grid-cols-2" aria-busy="true" aria-label="Loading private inventory">
            {[1, 2].map((n) => (
              <div key={n} aria-hidden="true" className="rounded border border-surface-variant bg-surface-alt/60 p-5 animate-pulse space-y-3">
                <div className="h-3 w-32 rounded bg-gold-accent/20" />
                <div className="h-6 w-3/4 rounded bg-surface-variant/60" />
                <div className="h-4 w-1/2 rounded bg-surface-variant/40" />
                <div className="h-9 w-40 rounded bg-surface-variant/50 mt-4" />
              </div>
            ))}
          </div>
        )}
        {state === "auth" && (
          <div className="mt-12 rounded border border-surface-variant bg-surface-alt/90 p-8 text-center max-w-xl mx-auto shadow-[var(--shadow-glow-soft)]">
            <p className="font-label-caps text-xs tracking-[0.14em] text-gold-accent uppercase mb-2">RESTRICTED OFF-MARKET VAULT</p>
            <h2 className="text-2xl font-display-md text-on-surface mb-3">Sign in with an entitled account</h2>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">
              The Off-Market Vault contains confidential whisper inventory and unlisted trophy assets. Sign in with a Universe tier account or manage your own off-market spaces.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/login" className="min-h-11 w-full sm:w-auto px-6 rounded bg-gold-accent font-label-caps text-xs font-bold tracking-widest text-background flex items-center justify-center">
                SIGN IN TO VAULT
              </Link>
              <Link
                href="/pricing/seeker"
                onClick={() => logPaywallConversionIntent({ feature: "off_market_vault", role: "seeker", tier: "universe", source: "/off-market", phase: monetizationPhase })}
                className="min-h-11 w-full sm:w-auto px-6 rounded border border-border hover:border-gold-accent font-label-caps text-xs tracking-widest text-text-secondary hover:text-gold-accent flex items-center justify-center transition-colors"
              >
                VIEW UNIVERSE PLAN
              </Link>
            </div>
          </div>
        )}
        {state === "error" && <p className="mt-12 border border-error/40 bg-surface-alt p-5 text-text-secondary">Private inventory is temporarily unavailable.</p>}
        {state === "ready" && properties.length === 0 && (
          !isUniverseSeeker ? (
            <div className="mt-12 rounded border border-gold-accent/30 bg-surface-alt/90 p-8 text-center max-w-xl mx-auto shadow-[var(--shadow-glow-soft)]">
              <p className="font-label-caps text-xs tracking-[0.14em] text-gold-accent uppercase mb-2">UNIVERSE EXCLUSIVE SURFACE</p>
              <h2 className="text-2xl font-display-md text-on-surface mb-3">Off-Market Vault Locked</h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                Your current account is on the {userTier.toUpperCase()} tier. The full Off-Market Vault is accessible exclusively to Universe tier seekers. Any unlisted properties you own will appear here automatically.
              </p>
              <Link
                href="/pricing/seeker"
                onClick={() => logPaywallConversionIntent({ feature: "off_market_vault", role: "seeker", tier: "universe", source: "/off-market", phase: monetizationPhase })}
                className="min-h-11 px-6 rounded bg-gold-accent font-label-caps text-xs font-bold tracking-widest text-background inline-flex items-center justify-center"
              >
                UPGRADE TO UNIVERSE
              </Link>
            </div>
          ) : (
            <p className="mt-12 border border-surface-variant bg-surface-alt p-5 text-text-secondary">No off-market properties are available to this account yet.</p>
          )
        )}

        {state === "ready" && properties.length > 0 && (
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {properties.map((property) => (
              <article key={property.id} className="rounded border border-surface-variant bg-surface-alt/80 p-5 shadow-[var(--shadow-glow-soft)]">
                <p className="font-label-caps text-[12px] tracking-[0.12em] text-text-secondary">OFF-MARKET · {property.spaceCategory || property.type || "PROPERTY"}</p>
                <h2 className="mt-3 text-2xl text-on-surface">{property.title}</h2>
                <p className="mt-2 text-sm text-text-secondary">{property.location || "Philippines"}</p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="rounded border border-surface-variant px-3 py-2 font-label-caps text-[12px] tracking-widest text-text-secondary">VIEW-ONLY BRIEFING</span>
                  {property.contactAvailable ? (
                    <button
                      type="button"
                      className="min-h-11 rounded border border-gold-accent/60 px-3 py-2 font-label-caps text-[12px] tracking-widest text-gold-accent"
                      onClick={() => {
                        logPaywallConversionIntent({
                          feature: "connect_spend",
                          role: "seeker",
                          tier: userTier,
                          source: "/off-market",
                          phase: monetizationPhase,
                        });
                        setSelected(property);
                        setSendState("idle");
                      }}
                    >
                      REQUEST CONTACT · 1 CONNECT
                    </button>
                  ) : (
                    <span className="rounded border border-surface-variant px-3 py-2 font-label-caps text-[12px] tracking-widest text-text-secondary" title="Contact appears here when the owner enables Quietly open to offers for this listing">CONTACT DISABLED</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {selected && (
          <div
            className={`fixed inset-0 z-50 flex items-end justify-center p-4 md:items-center ${entrance.backdrop}`}
            style={{ background: "var(--modal-scrim)" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="off-market-contact-title"
            onClick={(event) => {
              if (event.target === event.currentTarget) setSelected(null);
            }}
          >
            <form onSubmit={sendContact} className={`w-full max-w-lg rounded border border-gold-accent/50 bg-surface p-5 ${entrance.panel}`} style={{ boxShadow: "var(--shadow-glow-soft)" }}>
              <div className="flex items-start justify-between gap-4">
                <div><p className="font-label-caps text-[12px] tracking-[0.12em] text-gold-accent">ONE-CONNECT CONTACT</p><h2 id="off-market-contact-title" className="mt-2 text-xl">{selected.title}</h2></div>
                <button type="button" className="min-h-11 min-w-11 text-2xl text-text-secondary" aria-label="Close contact form" onClick={() => setSelected(null)}>×</button>
              </div>
              <p className="mt-4 text-sm text-text-secondary">The owner has enabled Quietly open to offers. Decline, non-response, or timeout does not create an automatic refund.</p>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} className="mt-4 min-h-28 w-full rounded border border-surface-variant bg-background p-3 text-base md:text-sm text-on-surface" placeholder="What would you like to ask?" required />
              <button type="submit" disabled={sendState === "sending" || sendState === "sent"} className="mt-4 min-h-11 w-full rounded bg-gold-accent px-4 py-3 font-label-caps text-xs font-bold tracking-widest text-background disabled:opacity-50">{sendState === "sending" ? "SENDING…" : sendState === "sent" ? "REQUEST SENT" : "SEND REQUEST · 1 CONNECT"}</button>
              {sendState === "error" && <p className="mt-3 text-sm text-error">The request could not be sent. No successful delivery should be treated as a completed contact.</p>}
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
