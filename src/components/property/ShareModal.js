"use client";

// ═══════════════════════════════════════════════════════════════
// ShareModal — the one share surface.
//
// Rebuilt 2026-08-13. Three things were wrong with the previous version and
// each fix is load-bearing, so please read before simplifying:
//
// 1. FACEBOOK SILENTLY ATE THE COPY. `sharer.php` accepts only `u=`. It ignores
//    `quote=` and every text parameter — deliberate on Facebook's side, not a
//    bug we can route around. The carefully built briefing was simply discarded
//    and the user got a bare link. Same for LinkedIn's share-offsite dialog and
//    for Messenger's app scheme. Those channels are now COPY-THEN-OPEN: the
//    text goes to the clipboard, the user is told in plain words to paste it,
//    and only then does the platform open.
//
// 2. NO VIBER, NO MESSENGER. For a Philippine platform that is backwards —
//    those are where listings actually get forwarded here. X is marginal.
//
// 3. NOTHING WAS MEASURABLE. Every outbound link now carries per-channel UTM
//    parameters and an opaque `ref` (see src/lib/shareAttribution.js), and a
//    GA4 outcome event fires when the share actually leaves.
//
// Also merged in: the three ready-to-post formats from buildPromoPack(), which
// used to live only behind the separate "AI Promote" button where nobody
// looking for Share would ever find them (owner ruling 2026-08-13: surface
// them here, ungated — they are promotional material and reach beats gating).
// These are the DETERMINISTIC formats built client-side from the listing's own
// recorded facts. They are not the AI route, so there is no request, no key and
// no tier resolution involved — nothing was un-gated server-side.
//
// COMPLIANCE: every string rendered here originates in shareBriefing.js, which
// is where the "no monetary values in share copy" rule is enforced. Do not
// introduce copy that bypasses it.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from "react";
import {
  Share2, Copy, Check, Globe, MessageSquare, MessageCircle,
  Send, Mail, Link2, X,
} from "lucide-react";
import { buildShareText, buildPromoPack } from "@/lib/shareBriefing";
import {
  buildShareUrl, cleanPropertyUrl, resolveShareRef,
} from "@/lib/shareAttribution";
import { trackEvent, GA_EVENTS } from "@/lib/analytics";

// `prefill: false` means the platform will NOT carry our text, so we must copy
// it to the clipboard first and say so. This flag is the whole of Task 3.
const CHANNELS = [
  { key: "viber",     name: "Viber",     icon: <MessageCircle size={18} />, prefill: true  },
  { key: "messenger", name: "Messenger", icon: <Send size={18} />,          prefill: false },
  { key: "facebook",  name: "Facebook",  icon: <Globe size={18} />,         prefill: false },
  { key: "linkedin",  name: "LinkedIn",  icon: <Globe size={18} />,         prefill: false },
  { key: "x",         name: "X",         icon: <MessageSquare size={18} />, prefill: true  },
  { key: "email",     name: "Email",     icon: <Mail size={18} />,          prefill: true  },
  { key: "copy",      name: "Copy",      icon: <Link2 size={18} />,         prefill: true  },
];

// Clipboard with a legacy fallback for blocked/insecure contexts. Mirrors the
// helper in BottomNav.js. Returns whether the text actually landed.
async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function channelHref(key, url, text) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  switch (key) {
    case "viber":
      // Viber's forward scheme takes free text; the URL lives inside the text.
      return `viber://forward?text=${t}`;
    case "messenger":
      // The Messenger SEND dialog (facebook.com/dialog/send) requires a
      // registered Facebook App ID. There is none anywhere in this repo, and
      // inventing one produces a broken dialog — so we use the app scheme,
      // which works on a phone with Messenger installed and does nothing on
      // desktop. Obtaining an App ID is an owner task; see the handoff doc.
      return `fb-messenger://share?link=${u}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case "x":
      return `https://twitter.com/intent/tweet?text=${t}`;
    case "email":
      return `mailto:?subject=${encodeURIComponent("ScoutIt Market Intelligence Briefing")}&body=${t}`;
    default:
      return url;
  }
}

function CopyRow({ label, text }) {
  const [done, setDone] = useState(false);
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <span className="text-[12px] font-mono uppercase tracking-[0.14em] text-gold-accent truncate">
          {label}
        </span>
        <button
          type="button"
          onClick={async () => {
            const ok = await copyText(text);
            setDone(ok);
            setTimeout(() => setDone(false), 2000);
          }}
          aria-label={`Copy ${label}`}
          className="shrink-0 flex items-center gap-1 text-[12px] text-on-surface/70 hover:text-gold-accent transition-colors"
        >
          {done ? <Check size={13} /> : <Copy size={13} />}
          {done ? "Copied" : "Copy"}
        </button>
      </div>
      {/* An attributed share URL is a single unbroken ~110-character token, so
          the wrap rule here is load-bearing at 375px. Verified by rendering
          against the real compiled Tailwind: document scrollWidth stays 375. */}
      <div className="bg-background/80 border border-on-surface/10 rounded p-3 text-[13px] text-on-surface/85 leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
        {text}
      </div>
    </div>
  );
}

export default function ShareModal({
  isOpen,
  onClose,
  shareText,
  propertyUrl,
  property = null,
  userId = null,
}) {
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const [ref, setRef] = useState("");
  const [showFormats, setShowFormats] = useState(false);

  // Minted once per open. A failure here yields "" and attribution silently
  // degrades to channel-only — it must never block a share.
  useEffect(() => {
    if (!isOpen) return undefined;
    let alive = true;
    resolveShareRef(userId)
      .then((code) => { if (alive) setRef(code); })
      .catch(() => {});
    return () => { alive = false; };
  }, [isOpen, userId]);

  const baseUrl = useMemo(() => {
    if (propertyUrl) return cleanPropertyUrl(propertyUrl);
    if (typeof window !== "undefined") return cleanPropertyUrl(window.location.href);
    return "";
  }, [propertyUrl]);

  const slug = property?.slug || property?.id || "";

  // Text for a given channel: rebuilt against that channel's attributed URL so
  // the link inside the copy matches the link the platform receives. Without a
  // property object we fall back to the pre-built string the caller passed.
  const textFor = (channelKey) => {
    const url = buildShareUrl(baseUrl, { channel: channelKey, ref });
    if (property) return buildShareText(property, url);
    return shareText || url;
  };

  const promo = useMemo(() => {
    if (!property) return null;
    return buildPromoPack(property, buildShareUrl(baseUrl, { channel: "copy", ref }));
  }, [property, baseUrl, ref]);

  if (!isOpen) return null;

  const fireShared = (channel) =>
    trackEvent(GA_EVENTS.SHARE_COMPLETED, {
      channel,
      property_slug: slug || undefined,
      ref: ref || undefined,
    });

  const handleChannel = async (channel) => {
    const url = buildShareUrl(baseUrl, { channel: channel.key, ref });
    const text = textFor(channel.key);

    if (channel.key === "copy") {
      const ok = await copyText(text);
      setNotice(ok ? "Briefing copied. Paste it anywhere." : "Couldn't copy — select the text below.");
      if (ok) fireShared("copy");
      setTimeout(() => setNotice(""), 4000);
      return;
    }

    // Copy-then-open. The platform cannot carry our text, so the clipboard
    // does — and the user is told, rather than left wondering where the copy
    // went. Opening happens regardless of clipboard success; a blocked
    // clipboard should not also block the share.
    if (!channel.prefill) {
      const ok = await copyText(text);
      setNotice(
        ok
          ? `Briefing copied — paste it into the ${channel.name} post.`
          : `${channel.name} can't carry the text. Copy it below, then paste.`
      );
      setTimeout(() => setNotice(""), 6000);
    }

    window.open(channelHref(channel.key, url, text), "_blank", "noopener,noreferrer");
    fireShared(channel.key);
  };

  const handleCopyRaw = async () => {
    const ok = await copyText(textFor("copy"));
    setCopied(ok);
    if (ok) fireShared("copy");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-3 sm:p-4 pointer-events-none">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm pointer-events-auto transition-opacity"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Share this briefing"
        className="relative w-full max-w-md max-h-[88vh] flex flex-col overflow-hidden bg-surface border border-gold-accent/20 sm:rounded-xl rounded-t-2xl shadow-2xl pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-on-surface/5 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-full bg-gold-accent/10 flex items-center justify-center text-gold-accent">
              <Share2 size={16} strokeWidth={2} />
            </div>
            <h3 className="text-lg font-serif text-on-surface truncate">Share Briefing</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close share modal"
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-on-surface/70 hover:text-on-surface hover:bg-on-surface/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 custom-scrollbar">
          <p className="text-[13px] text-text-secondary mb-4">
            Share this property&apos;s market intelligence with your network or clients.
          </p>

          <div className="grid grid-cols-4 gap-2 mb-3">
            {CHANNELS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => handleChannel(c)}
                aria-label={`Share via ${c.name}`}
                className="min-w-0 flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-lg bg-on-surface/5 border border-on-surface/5 text-on-surface/70 transition-all hover:bg-on-surface/10 hover:text-gold-accent active:scale-[0.97]"
              >
                {c.icon}
                <span className="text-[12px] font-mono uppercase tracking-[0.08em] truncate max-w-full">
                  {c.name}
                </span>
              </button>
            ))}
          </div>

          {/* Plain-language status. This is the visible half of Task 3 — the
              copy-then-open flow only works if the user is actually told. */}
          {notice && (
            <div
              role="status"
              aria-live="polite"
              className="mb-4 px-3 py-2 rounded border border-gold-accent/30 bg-gold-accent/10 text-[12px] text-gold-accent"
            >
              {notice}
            </div>
          )}

          <div className="relative mt-5">
            <div className="absolute -top-2.5 left-3 px-2 bg-surface text-[12px] uppercase tracking-[0.14em] text-gold-accent font-mono">
              Raw Briefing Text
            </div>
            <textarea
              readOnly
              aria-label="Raw briefing text"
              className="w-full h-28 bg-background border border-on-surface/10 rounded-lg p-4 pt-5 text-[13px] text-on-surface/80 font-mono resize-none focus:outline-none focus:border-gold-accent/50 transition-colors custom-scrollbar"
              value={textFor("copy")}
            />
          </div>

          {/* Ready-to-post formats — previously stranded behind AI Promote. */}
          {promo && (
            <div className="mt-5 border-t border-on-surface/5 pt-4">
              <button
                type="button"
                onClick={() => setShowFormats((v) => !v)}
                aria-expanded={showFormats}
                className="w-full flex items-center justify-between text-[12px] font-mono uppercase tracking-[0.14em] text-on-surface/60 hover:text-gold-accent transition-colors"
              >
                <span>Ready-to-post formats</span>
                <span aria-hidden="true">{showFormats ? "−" : "+"}</span>
              </button>

              {showFormats && (
                <div className="mt-4">
                  <CopyRow label="Short Pitch (Viber / X)" text={promo.fastPitch} />
                  <CopyRow label="Executive Summary (LinkedIn / Email)" text={promo.executiveSummary} />
                  <CopyRow label="Editorial Hook (Facebook / Instagram)" text={promo.editorialHook} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 pt-3 shrink-0 border-t border-on-surface/5">
          <button
            onClick={handleCopyRaw}
            aria-label="Copy the raw briefing text"
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm transition-all duration-300 ${
              copied
                ? "bg-success/10 text-success border border-success/20"
                : "bg-gold-accent text-background hover:bg-gold-bright"
            }`}
          >
            {copied ? (
              <>
                <Check size={16} strokeWidth={3} />
                <span>Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copy Raw Text</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
