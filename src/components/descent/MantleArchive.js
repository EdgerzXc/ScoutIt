"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LayerNav from "@/components/descent/LayerNav";
import BackgroundMantle from "@/components/descent/BackgroundMantle";
import LayerHeader from "@/components/descent/LayerHeader";
import LayerTransition from "@/components/descent/LayerTransition";

const CATEGORY_ORDER = ["story", "architecture", "philosophy", "trust"];

const DISCLOSURES = {
  story: {
    number: "01",
    label: "Our Story",
    eyebrow: "Why ScoutIt exists",
    title: "The decision was fragmented.",
    intro: "ScoutIt began with a practical problem: understanding a space required stitching together listings, messages, documents, neighborhood knowledge, and professional advice with no shared structure.",
    paragraphs: [
      "ScoutIt treats a property page as a briefing rather than a lead card. The aim is not to make the decision for someone; it is to make the sources, context, people, and next actions easier to read before a conversation begins.",
      "The platform is built for seekers, owners, licensed brokers, and spatial professionals. Each group sees a different workflow, but the public record and the responsibility attached to it must remain coherent across those perspectives.",
    ],
    proof: [
      ["Position", "Spatial intelligence and discovery"],
      ["Launch market", "The Philippines"],
      ["Current stage", "Invited human-testing pilot"],
      ["Commercial state", "Payments inactive"],
    ],
    diagram: {
      label: "From noise to a readable decision path",
      nodes: ["Scattered records", "Structured briefing", "Informed conversation"],
    },
    links: [["Read the complete Manifesto", "/about"], ["Begin with live spaces", "/property"]],
  },
  architecture: {
    number: "02",
    label: "Platform Architecture",
    eyebrow: "How the system operates",
    title: "Two data systems. One controlled bridge.",
    intro: "ScoutIt deliberately separates public content from private user state. That boundary is the operating model—not an implementation detail hidden behind the interface.",
    paragraphs: [
      "Airtable is the public read layer for published properties, articles, and professional records. Public pages access it through ScoutIt’s central CMS proxy, which can normalize locations and apply supported discovery filters.",
      "Supabase is the private account layer for authentication, owner drafts, submissions, saved account state, conversations, and permissioned workflows. Publishing is the bridge: an owner-approved Supabase property syncs to Airtable, whose first-publication slug becomes the canonical public URL.",
    ],
    proof: [
      ["Public source", "Airtable via CMS proxy"],
      ["Private source", "Supabase with authorization"],
      ["Location normalization", "Mapbox when coordinates are missing"],
      ["URL continuity", "First public slug remains reserved"],
    ],
    diagram: {
      label: "The dual-CMS publish path",
      nodes: ["Owner draft · Supabase", "Publish bridge", "Public record · Airtable"],
    },
    links: [["See the six-layer model", "/descent"], ["Inspect the public directory", "/property"]],
  },
  philosophy: {
    number: "03",
    label: "Data Philosophy",
    eyebrow: "How information earns its place",
    title: "Blank is better than invented.",
    intro: "ScoutIt’s data standard is source-aware. A useful record says what is known, where it came from, what remains unknown, and how recently a time-sensitive fact was checked.",
    paragraphs: [
      "Owner-authored facts remain owner-authored facts. Derived location or market context must not quietly become an owner claim. A verification label belongs to the specific credential, field, document comparison, or freshness event it describes.",
      "Public sample inventory exists only to exercise the product during invited testing. Those records are visibly disclosed, excluded from indexing and structured property data, and prevented from routing ordinary inquiries to an unintended recipient.",
    ],
    proof: [
      ["Missing source fact", "Leave the field blank"],
      ["Sample inventory", "Disclose and isolate"],
      ["Freshness", "Show the relevant checked date"],
      ["Derived context", "Keep provenance distinct"],
    ],
    diagram: {
      label: "The information qualification path",
      nodes: ["Source", "Qualification", "Displayed claim"],
    },
    links: [["Read current intelligence", "/intel"], ["Review trust boundaries", "#trust"]],
  },
  trust: {
    number: "04",
    label: "Trust & Verification",
    eyebrow: "What ScoutIt can actually claim",
    title: "Verification is specific, not universal.",
    intro: "Trust comes from named sources, scoped checks, protected actions, lifecycle history, and honest limitations. A badge cannot replace those boundaries.",
    paragraphs: [
      "Owners are the primary authority for owner-authored listings and may publish after attestation. The exception is a PDF-assisted draft structured by ScoutIt: that draft must be checked against the supplied source document before first publication.",
      "Professional credential claims, representation, and private actions have their own checks. None of them guarantees title, physical condition, future value, legal compliance, or transaction outcome; users still need qualified legal, financial, technical, and licensing due diligence.",
    ],
    proof: [
      ["Owner-authored listing", "Owner attestation"],
      ["PDF-assisted draft", "Source-document comparison"],
      ["Credential label", "Applies only to that credential"],
      ["Private action", "Authentication + server authorization"],
    ],
    diagram: {
      label: "A scoped trust claim",
      nodes: ["Named source", "Defined check", "Qualified label"],
    },
    links: [["Meet public professionals", "/layer/crust"], ["Read the legal boundaries", "/terms"]],
  },
};

export default function MantleArchive() {
  const [activeKey, setActiveKey] = useState("story");
  const [hydrated, setHydrated] = useState(false);
  const [atmospherePaused, setAtmospherePaused] = useState(false);
  const titleRef = useRef(null);
  const disclosure = DISCLOSURES[activeKey];

  useEffect(() => {
    const syncHash = () => {
      const key = window.location.hash.slice(1);
      if (CATEGORY_ORDER.includes(key)) setActiveKey(key);
    };
    syncHash();
    setHydrated(true);
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  function selectDisclosure(key) {
    if (!CATEGORY_ORDER.includes(key)) return;
    setActiveKey(key);
    window.history.replaceState(null, "", `#${key}`);
    window.requestAnimationFrame(() => titleRef.current?.focus({ preventScroll: true }));
  }

  return (
    <main className="mantle-page">
      <LayerNav prev={{ href: "/layer/crust", label: "Crust" }} next={{ href: "/layer/core", label: "Core" }} />
      <div className="mantle-atmosphere" aria-hidden="true">
        <BackgroundMantle paused={atmospherePaused} />
      </div>

      <div className="layer-pane mantle-pane">
        <LayerHeader
          layerNum="05"
          layerName="Mantle"
          title="How ScoutIt Thinks"
          description="The operating layer beneath discovery: why the platform exists, where information lives, how it moves, and what a trust claim means."
          missionText="Mantle is ScoutIt’s disclosure layer. The system should remain understandable without asking a visitor to trust invisible machinery or leave this page to complete the explanation."
          ctaText="Read the complete Manifesto →"
          ctaHref="/about"
        />

        <section className="mantle-archive" aria-labelledby="mantle-index-title">
          <header className="archive-intro">
            <div>
              <span className="archive-kicker">Layer 05 // Authored Index</span>
              <h2 id="mantle-index-title">The operating archive.</h2>
            </div>
            <div className="archive-intro-copy">
              <p>Four disclosures explain the company and platform as they operate today. Choose a chapter or read them in order using the index.</p>
              <button type="button" className="atmosphere-toggle" disabled={!hydrated} aria-pressed={atmospherePaused} onClick={() => setAtmospherePaused((value) => !value)}>
                <span aria-hidden="true">{atmospherePaused ? "▶" : "Ⅱ"}</span>{atmospherePaused ? "Resume atmosphere" : "Pause atmosphere"}
              </button>
            </div>
          </header>

          <div className="archive-shell">
            <nav className="archive-index" aria-label="Mantle disclosures" aria-busy={!hydrated}>
              {CATEGORY_ORDER.map((key) => {
                const item = DISCLOSURES[key];
                const active = key === activeKey;
                return (
                  <button key={key} type="button" disabled={!hydrated} className={active ? "is-active" : ""} aria-pressed={active} onClick={() => selectDisclosure(key)}>
                    <span>{item.number}</span><strong>{item.label}</strong><small>{item.eyebrow}</small>
                  </button>
                );
              })}
            </nav>

            <article className="archive-disclosure" key={activeKey} aria-live="polite">
              <div className="disclosure-copy">
                <span className="archive-kicker">{disclosure.number + " // " + disclosure.eyebrow}</span>
                <h2 ref={titleRef} tabIndex={-1}>{disclosure.title}</h2>
                <p className="disclosure-intro">{disclosure.intro}</p>
                {disclosure.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>

              <figure className="mantle-diagram" aria-labelledby={`diagram-${activeKey}`}>
                <figcaption id={`diagram-${activeKey}`}>{disclosure.diagram.label}</figcaption>
                <div className="diagram-flow">
                  {disclosure.diagram.nodes.map((node, index) => (
                    <div className="diagram-stage" key={node}>
                      <span>{String(index + 1).padStart(2, "0")}</span><strong>{node}</strong>
                      {index < disclosure.diagram.nodes.length - 1 && <i aria-hidden="true">→</i>}
                    </div>
                  ))}
                </div>
              </figure>

              <div className="proof-grid" aria-label={`${disclosure.label} proof points`}>
                {disclosure.proof.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
              </div>

              <div className="archive-links">
                {disclosure.links.map(([label, href]) => (
                  href.startsWith("#")
                    ? <button type="button" key={label} onClick={() => selectDisclosure(href.slice(1))}>{label} <span aria-hidden="true">→</span></button>
                    : <Link key={label} href={href}>{label} <span aria-hidden="true">→</span></Link>
                ))}
              </div>
            </article>
          </div>

          <div className="archive-continuity" aria-label="Mantle reading sequence">
            {CATEGORY_ORDER.map((key) => <a key={key} href={`#${key}`} aria-current={activeKey === key ? "step" : undefined} onClick={(event) => { event.preventDefault(); selectDisclosure(key); }}>{DISCLOSURES[key].number}</a>)}
          </div>
        </section>

        <LayerTransition nextNum="06" nextName="Core" nextHref="/layer/core" teaser="The system is disclosed. Now turn it toward the person at the center." />
      </div>

      <style jsx global>{`
        .mantle-page{min-height:100vh;padding-top:52px;background:radial-gradient(circle at 50% 10%,rgba(var(--accent-rgb),.07),transparent 36%),linear-gradient(180deg,var(--bg),var(--surface));color:var(--text-primary);overflow-x:hidden;position:relative}.mantle-atmosphere{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.38}.mantle-pane{position:relative;z-index:1}.mantle-archive{max-width:1220px;margin:0 auto;padding:clamp(80px,10vw,140px) clamp(20px,5vw,72px)}.archive-intro{display:grid;grid-template-columns:1.2fr .8fr;gap:clamp(38px,8vw,110px);align-items:end;margin-bottom:64px}.archive-kicker{font-family:var(--font-mono);font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent)}.archive-intro h2{font-family:var(--font-display);font-size:clamp(2.8rem,6vw,5.7rem);line-height:.98;letter-spacing:-.045em;margin:20px 0 0}.archive-intro-copy p{color:var(--text-secondary);font-size:15px;line-height:1.7;max-width:50ch}.atmosphere-toggle{margin-top:18px;min-height:40px;padding:0 14px;border:1px solid var(--border-solid);border-radius:12px;background:rgba(var(--surface-rgb),.65);color:var(--text-secondary);font-family:var(--font-mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}.atmosphere-toggle:disabled{cursor:wait;opacity:.62}.atmosphere-toggle span{color:var(--accent);margin-right:9px}.archive-shell{display:grid;grid-template-columns:minmax(250px,.42fr) minmax(0,1.58fr);border:1px solid var(--border-solid);border-radius:22px;overflow:hidden;background:rgba(var(--bg-rgb),.82);backdrop-filter:blur(22px);box-shadow:var(--shadow-lg)}.archive-index{background:rgba(var(--surface-rgb),.76);border-right:1px solid var(--border-solid)}.archive-index button{width:100%;min-height:98px;padding:18px 20px;border:0;border-bottom:1px solid var(--border-solid);background:transparent;color:var(--text-primary);display:grid;grid-template-columns:34px 1fr;gap:5px 12px;text-align:left;cursor:pointer}.archive-index button:last-child{border-bottom:0}.archive-index button>span{grid-row:1/3;font-family:var(--font-mono);font-size:12px;color:var(--text-muted);letter-spacing:.14em;padding-top:3px}.archive-index strong{font-family:var(--font-display);font-size:1.12rem;font-weight:500}.archive-index small{font-family:var(--font-mono);font-size:12px;letter-spacing:.11em;text-transform:uppercase;color:var(--text-muted)}.archive-index button:disabled{cursor:wait}.archive-index button.is-active{background:rgba(var(--accent-rgb),.09);box-shadow:inset 2px 0 0 var(--accent)}.archive-index button.is-active>span,.archive-index button.is-active small{color:var(--accent)}.archive-disclosure{padding:clamp(34px,6vw,76px);animation:mantleReveal 220ms var(--ease-out-custom)}@keyframes mantleReveal{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}.disclosure-copy{max-width:780px}.disclosure-copy h2{font-family:var(--font-display);font-size:clamp(2.5rem,5vw,5rem);line-height:1;letter-spacing:-.045em;margin:18px 0 24px;outline:none}.disclosure-copy p{color:var(--text-secondary);font-size:14px;line-height:1.78;max-width:72ch;margin:15px 0}.disclosure-copy .disclosure-intro{font-size:clamp(1rem,1.5vw,1.18rem);color:var(--text-primary);line-height:1.65;margin-bottom:28px}.mantle-diagram{margin:50px 0 30px;padding:24px;border:1px solid var(--border-solid);border-radius:16px;background:var(--surface)}.mantle-diagram figcaption{font-family:var(--font-mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-muted);margin-bottom:20px}.diagram-flow{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.diagram-stage{min-height:100px;border:1px solid rgba(var(--accent-rgb),.2);border-radius:12px;padding:16px;background:rgba(var(--accent-rgb),.035);display:flex;flex-direction:column;justify-content:space-between;position:relative}.diagram-stage>span{font-family:var(--font-mono);font-size:12px;color:var(--accent)}.diagram-stage strong{font-family:var(--font-mono);font-size:12px;letter-spacing:.09em;text-transform:uppercase;line-height:1.5}.diagram-stage i{position:absolute;right:-16px;top:50%;transform:translateY(-50%);z-index:2;color:var(--accent);font-style:normal}.proof-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--border-solid);border:1px solid var(--border-solid);border-radius:16px;overflow:hidden}.proof-grid>div{min-height:92px;padding:18px;background:var(--surface)}.proof-grid span{display:block;font-family:var(--font-mono);font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px}.proof-grid strong{font-family:var(--font-mono);font-size:12px;letter-spacing:.06em;line-height:1.5;color:var(--text-primary)}.archive-links{display:flex;flex-wrap:wrap;gap:12px;margin-top:34px}.archive-links a,.archive-links button{min-height:42px;padding:0 16px;border:1px solid var(--border-solid);border-radius:12px;background:transparent;color:var(--text-secondary);display:inline-flex;align-items:center;font-family:var(--font-mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}.archive-links a:hover,.archive-links button:hover{border-color:var(--accent);color:var(--text-primary)}.archive-links span{color:var(--accent);margin-left:8px}.archive-continuity{display:flex;justify-content:center;gap:8px;margin-top:34px}.archive-continuity a{width:38px;height:38px;border:1px solid var(--border-solid);border-radius:50%;display:grid;place-items:center;font-family:var(--font-mono);font-size:12px;color:var(--text-muted)}.archive-continuity a[aria-current=step]{border-color:var(--accent);color:var(--accent);background:rgba(var(--accent-rgb),.08)}
        @media(max-width:820px){.archive-intro,.archive-shell{grid-template-columns:1fr}.archive-index{border-right:0;border-bottom:1px solid var(--border-solid);display:grid;grid-template-columns:repeat(2,1fr)}.archive-index button:nth-child(odd){border-right:1px solid var(--border-solid)}.archive-index button:nth-child(3){border-bottom:0}.archive-disclosure{padding:38px 24px}.diagram-flow{grid-template-columns:1fr}.diagram-stage{min-height:82px}.diagram-stage i{right:auto;left:50%;top:auto;bottom:-17px;transform:translateX(-50%) rotate(90deg)}.mantle-atmosphere{opacity:.22}}
        @media(max-width:520px){.mantle-page{padding-top:45px}.mantle-archive{padding-left:16px;padding-right:16px}.archive-intro{margin-bottom:38px}.archive-index{grid-template-columns:1fr}.archive-index button{min-height:76px;border-right:0!important;border-bottom:1px solid var(--border-solid)!important}.archive-index button:last-child{border-bottom:0!important}.proof-grid{grid-template-columns:1fr}.archive-links a,.archive-links button{width:100%;justify-content:center}.archive-intro h2{font-size:clamp(2.7rem,15vw,4.2rem)}}
        @media(prefers-reduced-motion:reduce){.archive-disclosure{animation:none}.archive-links a,.archive-links button{transition:none}}
        @media(prefers-reduced-transparency:reduce){.archive-shell{backdrop-filter:none;background:var(--bg)}.mantle-atmosphere{display:none}}
      `}</style>
    </main>
  );
}
