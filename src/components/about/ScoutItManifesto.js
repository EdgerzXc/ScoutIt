"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AtmosphereBackground from "@/components/ui/AtmosphereBackground";

const CHAPTERS = [
  ["problem", "01", "The problem"],
  ["model", "02", "Six layers"],
  ["workflow", "03", "How it moves"],
  ["trust", "04", "Trust model"],
  ["people", "05", "Your path"],
  ["limits", "06", "Current limits"],
];

const LAYERS = [
  { id: "orbit", number: "01", name: "Orbit", purpose: "Orientation", body: "The first view from above: what ScoutIt is, why space needs context, and where to begin." },
  { id: "stratosphere", number: "02", name: "Stratosphere", purpose: "Editorial signal", body: "Selected spaces and intelligence that show the standard before the full directory opens." },
  { id: "metropolis", number: "03", name: "Metropolis", purpose: "Live discovery", body: "Public properties from Airtable, normalized for location and searchable through the directory." },
  { id: "crust", number: "04", name: "Crust", purpose: "Professional network", body: "Brokers and spatial professionals who help document, interpret, represent, or activate a space." },
  { id: "mantle", number: "05", name: "Mantle", purpose: "System disclosure", body: "The architecture, data philosophy, verification boundaries, and operating logic beneath the interface." },
  { id: "core", number: "06", name: "Core", purpose: "Personal command", body: "Authenticated tools: your Board, listings, conversations, profile, and permitted account activity." },
];

const WORKFLOW = [
  { label: "Owner source", title: "A space begins with its owner.", body: "An owner creates a private listing in Supabase through the guided workspace, advanced editor, CSV portfolio, or a PDF-assisted draft.", proof: "Private draft · Supabase" },
  { label: "Source review", title: "The source determines the gate.", body: "Owner-authored listings publish after owner attestation. A ScoutIt-structured PDF draft must first be checked against the owner’s source document; absent facts remain blank.", proof: "Owner authority · Source-aware review" },
  { label: "Publish bridge", title: "Private becomes public through one bridge.", body: "Publishing syncs the approved public fields to Airtable. Airtable computes the first public slug, and ScoutIt stores that canonical URL for future continuity.", proof: "Supabase → Airtable · Canonical slug" },
  { label: "Discovery", title: "The public directory reads from Airtable.", body: "People browse the public record, inspect category-specific details, save spaces privately, and see sample disclosures when a listing exists only for human testing.", proof: "Public read path · Explicit provenance" },
  { label: "Connection", title: "Interest enters a routed private flow.", body: "An inquiry follows the property’s current representation rules. Protected actions require authentication and server-side authorization before private records or notifications are created.", proof: "Authenticated action · Routed recipient" },
  { label: "Lifecycle", title: "A listing can change without losing its history.", body: "Owners may edit, withdraw, or reactivate. Permanent removal ends market access while the canonical slug, audit history, and required internal records remain reserved.", proof: "Continuity · Auditability" },
];

const ROLES = {
  seeker: {
    label: "Seeker",
    title: "Read a space before committing to it.",
    body: "Explore public listings, compare context, keep a private Board on your device, and choose when to authenticate for account tools or a routed inquiry.",
    actions: [["Explore spaces", "/property"], ["Open your Board", "/wishlist"]],
  },
  owner: {
    label: "Owner",
    title: "Publish with authority and continuity.",
    body: "Build the structured record, attest to owner-authored facts, publish through the controlled bridge, and manage the listing lifecycle from the private dashboard.",
    actions: [["Create an account", "/onboarding"], ["Understand the workflow", "#workflow"]],
  },
  broker: {
    label: "Broker",
    title: "Build trust around real representation.",
    body: "Create a professional identity, submit a PRC claim for verification, participate in owner-approved representation, and manage routed opportunities privately.",
    actions: [["Meet the network", "/brokers"], ["Create an account", "/onboarding"]],
  },
  professional: {
    label: "Professional",
    title: "Make spatial work discoverable.",
    body: "Photographers, researchers, and event professionals can present their specialty and connect their work to higher-quality space decisions.",
    actions: [["Explore professionals", "/layer/crust"], ["Create an account", "/onboarding"]],
  },
};

export default function ScoutItManifesto() {
  const [activeLayer, setActiveLayer] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [activeRole, setActiveRole] = useState("seeker");

  useEffect(() => {
    const focusHashTarget = () => {
      const id = window.location.hash.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      window.requestAnimationFrame(() => target.focus({ preventScroll: true }));
    };
    focusHashTarget();
    window.addEventListener("hashchange", focusHashTarget);
    return () => window.removeEventListener("hashchange", focusHashTarget);
  }, []);

  const role = ROLES[activeRole];

  return (
    <div className="manifesto-page">
      <AtmosphereBackground variant="default" />
      <Header />

      <main className="manifesto-main">
        <header className="manifesto-hero" id="top" tabIndex={-1}>
          <div className="hero-copy">
            <span className="manifesto-kicker">ScoutIt // System Manifesto</span>
            <h1>Understand space.<br /><em>Then decide.</em></h1>
            <p className="hero-lead">
              ScoutIt is a spatial intelligence and discovery platform for the Philippines.
              It brings property records, contextual signals, and the people around a space
              into one calmer decision path.
            </p>
            <div className="hero-actions">
              <Link href="#problem" className="manifesto-primary">Read the system <span aria-hidden="true">↓</span></Link>
              <Link href="/property" className="manifesto-secondary">Explore live spaces</Link>
            </div>
          </div>
          <aside className="status-card" aria-label="Current platform status">
            <span className="status-signal" aria-hidden="true" />
            <span className="status-label">Current state</span>
            <strong>Human-testing pilot</strong>
            <p>Public records may include clearly labelled sample data. Payments are not active.</p>
          </aside>
        </header>

        <nav className="chapter-rail" aria-label="Manifesto chapters">
          {CHAPTERS.map(([id, number, label]) => (
            <a key={id} href={`#${id}`}><span>{number}</span>{label}</a>
          ))}
        </nav>

        <section className="manifesto-section problem-section" id="problem" tabIndex={-1}>
          <ChapterMark number="01" label="The problem" />
          <div className="section-heading">
            <h2>A listing tells you what is offered.<br />A decision needs more.</h2>
            <p>Space decisions are often assembled from disconnected listings, private messages, incomplete documents, and professional advice with unclear provenance.</p>
          </div>
          <div className="problem-grid">
            <article><span>Fragmented</span><h3>The record is scattered.</h3><p>Property facts, location context, media, representation, and follow-up usually live in separate systems.</p></article>
            <article><span>Unclear</span><h3>Confidence is hard to price.</h3><p>A polished page does not prove that every claim is current, complete, or independently verified.</p></article>
            <article><span>Pressured</span><h3>The interface rushes the choice.</h3><p>Lead capture can arrive before a person has enough context to know whether a space deserves attention.</p></article>
          </div>
          <div className="definition-line">
            <span>ScoutIt is</span><strong>A structured path from discovery to a more informed conversation.</strong>
            <span>ScoutIt is not</span><strong>A guarantee, brokerage, appraisal, title authority, or substitute for legal and technical due diligence.</strong>
          </div>
        </section>

        <section className="manifesto-section" id="model" tabIndex={-1}>
          <ChapterMark number="02" label="The six-layer model" />
          <div className="section-heading split-heading">
            <h2>One platform.<br />Six depths.</h2>
            <p>The descent is not decorative. Each layer changes the depth of information and the responsibility attached to it.</p>
          </div>
          <div className="layer-system">
            <div className="layer-list" role="group" aria-label="ScoutIt layers">
              {LAYERS.map((layer, index) => (
                <button
                  key={layer.id}
                  type="button"
                  aria-pressed={activeLayer === index}
                  className={activeLayer === index ? "is-active" : ""}
                  onClick={() => setActiveLayer(index)}
                >
                  <span>{layer.number}</span><strong>{layer.name}</strong><small>{layer.purpose}</small>
                </button>
              ))}
            </div>
            <div className="layer-detail" id="layer-detail" aria-live="polite">
              <span className="detail-number">{LAYERS[activeLayer].number}</span>
              <span className="manifesto-kicker">Layer // {LAYERS[activeLayer].purpose}</span>
              <h3>{LAYERS[activeLayer].name}</h3>
              <p>{LAYERS[activeLayer].body}</p>
              <Link href={`/layer/${LAYERS[activeLayer].id}`}>Enter this layer <span aria-hidden="true">→</span></Link>
            </div>
          </div>
          <noscript><p className="noscript-note">JavaScript is optional: visit the complete <a href="/descent">six-layer index</a>.</p></noscript>
        </section>

        <section className="manifesto-section" id="workflow" tabIndex={-1}>
          <ChapterMark number="03" label="How a property moves" />
          <div className="section-heading">
            <h2>One record.<br />A visible chain of responsibility.</h2>
            <p>The public page is the result of a verified lifecycle, not an isolated marketing card.</p>
          </div>
          <div className="workflow-shell">
            <ol className="workflow-steps" aria-label="Property lifecycle">
              {WORKFLOW.map((step, index) => (
                <li key={step.label}>
                  <button type="button" className={activeStep === index ? "is-active" : ""} onClick={() => setActiveStep(index)} aria-pressed={activeStep === index}>
                    <span>{String(index + 1).padStart(2, "0")}</span>{step.label}
                  </button>
                </li>
              ))}
            </ol>
            <article className="workflow-detail" aria-live="polite">
              <span>{WORKFLOW[activeStep].proof}</span>
              <h3>{WORKFLOW[activeStep].title}</h3>
              <p>{WORKFLOW[activeStep].body}</p>
              <div className="step-meter" aria-hidden="true"><i style={{ width: `${((activeStep + 1) / WORKFLOW.length) * 100}%` }} /></div>
            </article>
          </div>
        </section>

        <section className="manifesto-section" id="trust" tabIndex={-1}>
          <ChapterMark number="04" label="Trust and data" />
          <div className="section-heading split-heading">
            <h2>Trust comes from boundaries,<br />not badges alone.</h2>
            <p>ScoutIt separates public content from private account data and qualifies claims according to their actual source.</p>
          </div>
          <div className="data-split">
            <article>
              <span className="data-tag">Public read layer</span><h3>Airtable</h3>
              <p>Published properties, public articles, and public professional records. The website reads these through ScoutIt’s central CMS proxy.</p>
            </article>
            <div className="data-bridge" aria-hidden="true"><span>Controlled publish bridge</span></div>
            <article>
              <span className="data-tag">Private account layer</span><h3>Supabase</h3>
              <p>Authentication, private drafts, saved account state, submissions, conversations, and other permissioned user records.</p>
            </article>
          </div>
          <div className="trust-disclosures">
            <Disclosure title="Owner authority" body="Owners are the primary source for owner-authored property facts. Their attestation permits publication, but it does not turn every field into an independent ScoutIt verification." />
            <Disclosure title="PDF-assisted exception" body="When ScoutIt structures a listing from an owner PDF, the draft must be checked against that document before first publication. Missing source facts remain blank." />
            <Disclosure title="Verification language" body="A verification label applies only to the specific credential, source, field, or freshness event described. It is not a blanket guarantee about the property or person." />
            <Disclosure title="Canonical continuity" body="The first public Airtable slug becomes the permanent property URL. Later title changes must not silently break the old address or recycle it for another listing." />
            <Disclosure title="Sample inventory" body="Properties created solely for the invited human-testing pilot are labelled as sample data and excluded from search indexing and structured property data." />
            <Disclosure title="User responsibility" body="People must still perform legal, financial, physical, title, licensing, and technical due diligence with qualified professionals before committing." />
          </div>
        </section>

        <section className="manifesto-section" id="people" tabIndex={-1}>
          <ChapterMark number="05" label="Your path" />
          <div className="section-heading">
            <h2>The system changes<br />with your responsibility.</h2>
            <p>Choose the perspective closest to yours. This changes the explanation, not your account permissions.</p>
          </div>
          <div className="role-system">
            <div className="role-tabs" role="group" aria-label="Choose your ScoutIt role">
              {Object.entries(ROLES).map(([id, item]) => (
                <button key={id} type="button" aria-pressed={activeRole === id} className={activeRole === id ? "is-active" : ""} onClick={() => setActiveRole(id)}>{item.label}</button>
              ))}
            </div>
            <article className="role-detail" aria-live="polite">
              <span className="manifesto-kicker">Path // {role.label}</span>
              <h3>{role.title}</h3><p>{role.body}</p>
              <div className="role-actions">
                {role.actions.map(([label, href], index) => <Link key={label} href={href} className={index === 0 ? "manifesto-primary" : "manifesto-secondary"}>{label}</Link>)}
              </div>
            </article>
          </div>
        </section>

        <section className="manifesto-section limits-section" id="limits" tabIndex={-1}>
          <ChapterMark number="06" label="Current limits" />
          <div className="section-heading split-heading">
            <h2>What is true<br />right now.</h2>
            <p>ScoutIt is preparing for invited human testing. Accuracy requires being explicit about what is and is not active.</p>
          </div>
          <ul className="limits-list">
            <li><span>01</span><div><strong>No active payments</strong><p>Pricing and Connect concepts may be explained in the product, but payment collection is not active during this pilot.</p></div></li>
            <li><span>02</span><div><strong>Some inventory is sample data</strong><p>Testing records are visibly disclosed and isolated from indexing. They are not presented as ordinary live inventory.</p></div></li>
            <li><span>03</span><div><strong>Coverage is not completeness</strong><p>A property page can only show fields and media supplied or derived through supported sources. Blank information should remain blank.</p></div></li>
            <li><span>04</span><div><strong>The pilot is for finding friction</strong><p>Human-testing observations will move into a separate action plan so defects can be reproduced, prioritized, fixed, and verified.</p></div></li>
          </ul>
        </section>

        <section className="manifesto-close" aria-labelledby="manifesto-close-title">
          <span className="manifesto-kicker">The next move is yours</span>
          <h2 id="manifesto-close-title">Start with a space.<br /><em>Leave with context.</em></h2>
          <div className="hero-actions"><Link href="/property" className="manifesto-primary">Explore properties</Link><Link href="/descent" className="manifesto-secondary">Take the full descent</Link></div>
          <a href="#top" className="back-to-top">Return to the top ↑</a>
        </section>
      </main>
      <Footer />

      <style jsx global>{`
        .manifesto-page{min-height:100vh;background:var(--bg);color:var(--text-primary);position:relative}.manifesto-main{position:relative;z-index:1;max-width:1240px;margin:0 auto;padding:clamp(92px,10vw,150px) clamp(20px,5vw,72px) 80px}.manifesto-hero{min-height:min(760px,calc(100vh - 80px));display:grid;grid-template-columns:minmax(0,1.55fr) minmax(260px,.55fr);gap:clamp(48px,9vw,140px);align-items:center;outline:none}.hero-copy{max-width:820px}.manifesto-kicker,.chapter-mark,.status-label,.data-tag{font-family:var(--font-mono);font-size: var(--type-micro);letter-spacing:var(--track-label);text-transform:uppercase;color:var(--accent)}.manifesto-hero h1,.manifesto-close h2{font-family:var(--font-display);font-size:clamp(3.3rem,8vw,7.8rem);line-height:.93;letter-spacing:-.055em;margin:22px 0 30px;text-wrap:balance}.manifesto-hero h1 em,.manifesto-close h2 em{color:var(--accent);font-weight:inherit}.hero-lead{max-width:62ch;color:var(--text-secondary);font-size:clamp(1rem,1.5vw,1.2rem);line-height:1.75}.hero-actions,.role-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:32px}.manifesto-primary,.manifesto-secondary{min-height:44px;display:inline-flex;align-items:center;justify-content:center;padding:0 20px;border-radius:14px;font-family:var(--font-mono);font-size: var(--type-micro);font-weight:700;letter-spacing:.14em;text-transform:uppercase;transition:transform 160ms var(--ease-out-custom),border-color 160ms var(--ease-out-custom),background 160ms var(--ease-out-custom)}.manifesto-primary{background:var(--accent-bright);color:var(--bg);border:1px solid var(--accent-bright)}.manifesto-secondary{background:rgba(var(--surface-rgb),.45);color:var(--text-primary);border:1px solid var(--border-solid)}.manifesto-primary:hover,.manifesto-secondary:hover{transform:translateY(-2px);border-color:var(--accent)}.status-card{align-self:end;margin-bottom:clamp(70px,9vw,130px);padding:24px;border:1px solid var(--border-solid);border-radius:20px;background:rgba(var(--surface-rgb),.68);backdrop-filter:blur(18px);box-shadow:var(--shadow-lg);position:relative}.status-signal{position:absolute;top:26px;right:24px;width:7px;height:7px;border-radius:50%;background:var(--accent-bright);box-shadow:0 0 14px rgba(var(--accent-bright-rgb),.75)}.status-card strong{display:block;margin:10px 0;font-family:var(--font-display);font-size:1.4rem}.status-card p{color:var(--text-secondary);font-size:13px;line-height:1.6;margin:0}.chapter-rail{position:sticky;top:52px;z-index:20;display:grid;grid-template-columns:repeat(6,1fr);border:1px solid var(--border-solid);border-radius:16px;background:rgba(var(--bg-rgb),.86);backdrop-filter:blur(20px);overflow:hidden}.chapter-rail a{min-height:52px;display:flex;align-items:center;gap:10px;padding:0 14px;border-right:1px solid var(--border-solid);font-family:var(--font-mono);font-size:var(--type-floor);letter-spacing:.12em;text-transform:uppercase;color:var(--text-secondary)}.chapter-rail a:last-child{border-right:0}.chapter-rail a:hover,.chapter-rail a:focus-visible{background:rgba(var(--accent-rgb),.08);color:var(--text-primary)}.chapter-rail span{color:var(--accent)}.manifesto-section{scroll-margin-top:125px;padding:clamp(90px,12vw,170px) 0;border-bottom:1px solid var(--border-solid);outline:none}.chapter-mark{display:flex;gap:14px;align-items:center;margin-bottom:32px}.chapter-mark span{color:var(--text-muted)}.section-heading{max-width:900px;margin-bottom:clamp(44px,7vw,84px)}.section-heading h2{font-family:var(--font-display);font-size:clamp(2.5rem,5.7vw,5.3rem);line-height:1.02;letter-spacing:-.04em;text-wrap:balance;margin:0}.section-heading p{max-width:58ch;margin:26px 0 0;color:var(--text-secondary);font-size:clamp(1rem,1.4vw,1.15rem);line-height:1.75}.split-heading{display:grid;grid-template-columns:1.25fr .75fr;gap:clamp(32px,8vw,100px);max-width:none;align-items:end}.split-heading p{margin:0}.problem-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border-solid);border:1px solid var(--border-solid);border-radius:18px;overflow:hidden}.problem-grid article{background:var(--surface);padding:clamp(24px,4vw,44px)}.problem-grid article>span{font-family:var(--font-mono);font-size:var(--type-floor);letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}.problem-grid h3{font-family:var(--font-display);font-size:1.45rem;margin:22px 0 12px}.problem-grid p,.definition-line strong{color:var(--text-secondary);font-size:14px;line-height:1.7}.definition-line{display:grid;grid-template-columns:140px 1fr;gap:18px 30px;margin-top:42px;padding:28px 0;border-top:1px solid var(--border-solid)}.definition-line span{font-family:var(--font-mono);font-size:var(--type-floor);letter-spacing:.14em;text-transform:uppercase;color:var(--accent);padding-top:5px}.layer-system{display:grid;grid-template-columns:minmax(300px,.8fr) minmax(0,1.2fr);gap:1px;background:var(--border-solid);border:1px solid var(--border-solid);border-radius:20px;overflow:hidden}.layer-list{display:flex;flex-direction:column;background:var(--surface)}.layer-list button{appearance:none;border:0;border-bottom:1px solid var(--border-solid);background:transparent;color:var(--text-primary);min-height:72px;padding:14px 20px;display:grid;grid-template-columns:38px 1fr auto;align-items:center;text-align:left;cursor:pointer}.layer-list button:last-child{border-bottom:0}.layer-list button span,.workflow-steps button span,.limits-list>li>span{font-family:var(--font-mono);font-size:var(--type-floor);color:var(--text-muted);letter-spacing:.14em}.layer-list button strong{font-family:var(--font-display);font-size:1.1rem}.layer-list button small{font-family:var(--font-mono);font-size:var(--type-floor);letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted)}.layer-list button.is-active{background:rgba(var(--accent-rgb),.08);box-shadow:inset 2px 0 0 var(--accent)}.layer-list button.is-active span,.layer-list button.is-active small{color:var(--accent)}.layer-detail{min-height:430px;padding:clamp(38px,7vw,88px);background:radial-gradient(circle at 80% 20%,rgba(var(--accent-rgb),.1),transparent 44%),var(--surface2);display:flex;flex-direction:column;justify-content:flex-end;position:relative;overflow:hidden}.detail-number{position:absolute;right:-.02em;top:-.2em;font-family:var(--font-display);font-size:clamp(10rem,25vw,20rem);color:rgba(var(--accent-rgb),.045);line-height:1}.layer-detail h3,.workflow-detail h3,.role-detail h3{font-family:var(--font-display);font-size:clamp(2.4rem,5vw,4.6rem);letter-spacing:-.04em;line-height:1;margin:18px 0}.layer-detail p,.workflow-detail p,.role-detail p{max-width:56ch;color:var(--text-secondary);font-size:15px;line-height:1.75}.layer-detail a{margin-top:24px;color:var(--accent);font-family:var(--font-mono);font-size:var(--type-floor);letter-spacing:.14em;text-transform:uppercase}.workflow-shell{display:grid;grid-template-columns:minmax(260px,.6fr) minmax(0,1.4fr);border:1px solid var(--border-solid);border-radius:20px;overflow:hidden}.workflow-steps{list-style:none;margin:0;padding:0;background:var(--surface)}.workflow-steps button{width:100%;min-height:68px;padding:0 20px;border:0;border-bottom:1px solid var(--border-solid);background:transparent;color:var(--text-secondary);display:flex;gap:18px;align-items:center;text-align:left;font-family:var(--font-mono);font-size:var(--type-floor);letter-spacing:.12em;text-transform:uppercase;cursor:pointer}.workflow-steps li:last-child button{border-bottom:0}.workflow-steps button.is-active{background:rgba(var(--accent-rgb),.08);color:var(--text-primary);box-shadow:inset 2px 0 0 var(--accent)}.workflow-steps button.is-active span{color:var(--accent)}.workflow-detail{min-height:420px;padding:clamp(36px,7vw,86px);display:flex;flex-direction:column;justify-content:center;background:var(--surface2)}.workflow-detail>span{font-family:var(--font-mono);font-size:var(--type-floor);letter-spacing:.14em;text-transform:uppercase;color:var(--accent)}.step-meter{height:2px;background:var(--border-solid);margin-top:40px}.step-meter i{display:block;height:100%;background:var(--accent);transition:width 240ms var(--ease-out-custom)}.data-split{display:grid;grid-template-columns:1fr 150px 1fr;align-items:stretch}.data-split article{padding:clamp(28px,5vw,54px);background:var(--surface);border:1px solid var(--border-solid);border-radius:18px}.data-split h3{font-family:var(--font-display);font-size:2.3rem;margin:18px 0 14px}.data-split p{color:var(--text-secondary);font-size:14px;line-height:1.7}.data-bridge{display:flex;align-items:center;justify-content:center;position:relative}.data-bridge:before{content:"";position:absolute;left:0;right:0;height:1px;background:var(--accent-muted)}.data-bridge span{z-index:1;background:var(--bg);padding:12px 8px;writing-mode:vertical-rl;font-family:var(--font-mono);font-size:var(--type-floor);letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted)}.trust-disclosures{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:54px}.trust-disclosures details{border:1px solid var(--border-solid);border-radius:14px;background:rgba(var(--surface-rgb),.55);padding:0 20px}.trust-disclosures summary{min-height:58px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;font-family:var(--font-mono);font-size:var(--type-floor);letter-spacing:.14em;text-transform:uppercase;color:var(--text-primary);list-style:none}.trust-disclosures summary::-webkit-details-marker{display:none}.trust-disclosures summary:after{content:"+";color:var(--accent);font-size:16px}.trust-disclosures details[open] summary:after{content:"−"}.trust-disclosures details p{margin:0;padding:0 0 22px;color:var(--text-secondary);font-size:13px;line-height:1.7}.role-system{border:1px solid var(--border-solid);border-radius:20px;overflow:hidden;background:var(--surface)}.role-tabs{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid var(--border-solid)}.role-tabs button{min-height:54px;border:0;border-right:1px solid var(--border-solid);background:transparent;color:var(--text-secondary);font-family:var(--font-mono);font-size:var(--type-floor);letter-spacing:.14em;text-transform:uppercase;cursor:pointer}.role-tabs button:last-child{border-right:0}.role-tabs button.is-active{background:rgba(var(--accent-rgb),.09);color:var(--accent);box-shadow:inset 0 -2px 0 var(--accent)}.role-detail{min-height:390px;padding:clamp(38px,7vw,84px);background:radial-gradient(circle at 90% 10%,rgba(var(--accent-rgb),.09),transparent 45%),var(--surface2)}.limits-list{list-style:none;padding:0;margin:0;border-top:1px solid var(--border-solid)}.limits-list li{display:grid;grid-template-columns:54px 1fr;gap:26px;padding:28px 0;border-bottom:1px solid var(--border-solid)}.limits-list strong{font-family:var(--display);font-size:1.2rem}.limits-list p{color:var(--text-secondary);font-size:14px;line-height:1.65;margin:8px 0 0;max-width:72ch}.manifesto-close{padding:clamp(110px,17vw,230px) 0 90px}.manifesto-close h2{font-size:clamp(3rem,7vw,7rem)}.back-to-top{display:inline-block;margin-top:70px;color:var(--text-muted);font-family:var(--font-mono);font-size:var(--type-floor);letter-spacing:.14em;text-transform:uppercase}.noscript-note{padding:16px;color:var(--text-secondary)}
        @media(max-width:900px){.manifesto-hero{grid-template-columns:1fr;min-height:auto;padding:60px 0 80px}.status-card{align-self:auto;margin:0;max-width:440px}.chapter-rail{grid-template-columns:repeat(3,1fr)}.chapter-rail a:nth-child(3){border-right:0}.chapter-rail a:nth-child(-n+3){border-bottom:1px solid var(--border-solid)}.split-heading,.layer-system,.workflow-shell{grid-template-columns:1fr}.layer-list{display:grid;grid-template-columns:repeat(2,1fr)}.layer-list button:nth-child(odd){border-right:1px solid var(--border-solid)}.layer-detail,.workflow-detail{min-height:360px}.data-split{grid-template-columns:1fr}.data-bridge{min-height:90px}.data-bridge:before{top:0;bottom:0;left:50%;right:auto;width:1px;height:auto}.data-bridge span{writing-mode:horizontal-tb}.problem-grid{grid-template-columns:1fr}.trust-disclosures{grid-template-columns:1fr}}
        @media(max-width:600px){.manifesto-main{padding-left:18px;padding-right:18px}.manifesto-hero h1{font-size:clamp(3rem,16vw,4.8rem)}.chapter-rail{top:45px;overflow-x:auto;display:flex;border-radius:12px}.chapter-rail a{flex:0 0 auto;min-width:138px;border-bottom:0!important}.section-heading h2{font-size:clamp(2.35rem,12vw,3.8rem)}.definition-line{grid-template-columns:1fr;gap:8px}.definition-line strong{margin-bottom:16px}.layer-list{grid-template-columns:1fr}.layer-list button{border-right:0!important}.layer-detail,.workflow-detail,.role-detail{padding:32px 22px}.role-tabs{grid-template-columns:repeat(2,1fr)}.role-tabs button:nth-child(2){border-right:0}.role-tabs button:nth-child(-n+2){border-bottom:1px solid var(--border-solid)}.data-split article{padding:28px 22px}.manifesto-primary,.manifesto-secondary{width:100%}}
        @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto!important}.manifesto-primary,.manifesto-secondary,.step-meter i{transition:none}.manifesto-primary:hover,.manifesto-secondary:hover{transform:none}}
        @media(prefers-reduced-transparency:reduce){.status-card,.chapter-rail{backdrop-filter:none;background:var(--surface)}}
      `}</style>
    </div>
  );
}

function ChapterMark({ number, label }) {
  return <div className="chapter-mark" aria-hidden="true"><span>{number}</span>{label}</div>;
}

function Disclosure({ title, body }) {
  return <details><summary>{title}</summary><p>{body}</p></details>;
}
