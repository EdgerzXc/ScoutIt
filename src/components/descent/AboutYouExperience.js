"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LayerNav from "@/components/descent/LayerNav";
import BackgroundOrbit from "@/components/descent/BackgroundOrbit";
import { CORE_ROLES, CORE_ROLE_ORDER } from "@/components/descent/coreExperienceData";
import useVerifiedIdentity from "@/components/descent/useVerifiedIdentity";
import { getCoreAccountPresentation } from "@/components/descent/coreAccountPresentation";

export default function AboutYouExperience() {
  const [roleKey, setRoleKey] = useState("seeker");
  const [stepIndex, setStepIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const detailRef = useRef(null);
  const identity = useVerifiedIdentity();
  const account = getCoreAccountPresentation(identity);
  const role = CORE_ROLES[roleKey];

  useEffect(() => {
    const syncHash = () => {
      const key = window.location.hash.slice(1);
      if (CORE_ROLE_ORDER.includes(key)) {
        setRoleKey(key);
        setStepIndex(0);
      }
    };
    syncHash();
    setHydrated(true);
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  function chooseRole(key) {
    setRoleKey(key);
    setStepIndex(0);
    window.history.replaceState(null, "", `#${key}`);
    window.requestAnimationFrame(() => detailRef.current?.focus({ preventScroll: true }));
  }

  function chooseStep(index) {
    setStepIndex(index);
    window.requestAnimationFrame(() => detailRef.current?.focus({ preventScroll: true }));
  }

  return (
    <main className="about-core-page">
      <LayerNav prev={{ href: "/layer/core", label: "Core" }} next={null} />
      <div className="about-core-bg" aria-hidden="true"><BackgroundOrbit /></div>
      <div className="about-core-scrim" aria-hidden="true" />

      <div className="about-core-content">
        <header className="about-core-hero">
          <span className="about-core-kicker">After Core // About You</span>
          <h1>You are not the product.<br /><em>You are the decision-maker.</em></h1>
          <p>ScoutIt’s layers exist to support a responsibility you already carry. Choose your perspective to see the exact path, evidence, and boundary attached to it.</p>
          <a href="#your-path" className="about-core-primary">Place yourself in the system <span aria-hidden="true">↓</span></a>
        </header>

        <section className="about-core-section" id="your-path" aria-labelledby="your-path-title">
          <header className="about-core-heading">
            <div><span className="about-core-kicker">01 // Perspective</span><h2 id="your-path-title">Your path through ScoutIt.</h2></div>
            <p>This selector previews a workflow. It never grants an account role, credential, entitlement, or permission.</p>
          </header>

          <div className="about-role-tabs" role="group" aria-label="Choose a ScoutIt perspective" aria-busy={!hydrated}>
            {CORE_ROLE_ORDER.map((key) => {
              const item = CORE_ROLES[key];
              return <button key={key} type="button" disabled={!hydrated} aria-pressed={key === roleKey} className={key === roleKey ? "is-active" : ""} onClick={() => chooseRole(key)}><span>{item.number}</span><strong>{item.short}</strong><small>{item.label}</small></button>;
            })}
          </div>

          <div className="about-role-intro" aria-live="polite">
            <span className="about-core-kicker">{"Perspective // " + role.label}</span>
            <h3>{role.thesis}</h3><p>{role.summary}</p>
          </div>

          <div className="core-schematic" aria-label={`${role.short} workflow diagram`}>
            <div className="schematic-center" aria-hidden="true"><span>{role.number}</span><strong>{role.short}</strong><small>At the center</small></div>
            <div className="schematic-ring" aria-hidden="true" />
            {role.steps.map(([label], index) => (
              <button key={label} type="button" className={`schematic-node node-${index + 1}${stepIndex === index ? " is-active" : ""}`} aria-pressed={stepIndex === index} onClick={() => chooseStep(index)}>
                <span>{String(index + 1).padStart(2, "0")}</span><strong>{label}</strong>
              </button>
            ))}
          </div>

          <article className="step-detail" aria-live="polite">
            <div className="step-copy">
              <span className="about-core-kicker">{"Step " + String(stepIndex + 1).padStart(2, "0") + " // " + role.short}</span>
              <h3 ref={detailRef} tabIndex={-1}>{role.steps[stepIndex][0]}</h3>
              <p>{role.steps[stepIndex][1]}</p>
            </div>
            <div className="step-controls" aria-label="Workflow step controls">
              <button type="button" onClick={() => chooseStep((stepIndex - 1 + role.steps.length) % role.steps.length)}>Previous</button>
              <span>{stepIndex + 1} / {role.steps.length}</span>
              <button type="button" onClick={() => chooseStep((stepIndex + 1) % role.steps.length)}>Next</button>
            </div>
          </article>

          <aside className="role-boundary">
            <span className="about-core-kicker">Your responsibility</span><p>{role.responsibility}</p>
          </aside>

          <div className="about-role-actions">
            <Link href={role.primary[1]} className="about-core-primary">{role.primary[0]}</Link>
            <Link href={role.secondary[1]} className="about-core-secondary">{role.secondary[0]}</Link>
          </div>
        </section>

        <section className="about-core-section account-section" aria-labelledby="account-state-title">
          <header className="about-core-heading">
            <div><span className="about-core-kicker">02 // Private workspace</span><h2 id="account-state-title">Public understanding.<br />Protected activity.</h2></div>
            <p>Your public path stays explorable while private activity remains behind verified identity and server authorization.</p>
          </header>
          <div className="identity-card">
            <span className={`identity-orbit ${identity.status}`} aria-hidden="true"><i /></span>
            <div className="identity-copy">
              <span className="about-core-kicker">Account state</span>
              <h3>{account.title}</h3>
              <p>{account.body}</p>
              <Link href={account.href} className="about-core-primary">{account.cta}</Link>
            </div>
          </div>
        </section>

        <section className="about-core-close" aria-labelledby="about-core-close-title">
          <span className="about-core-kicker">Orbit → Mantle → Core → You</span>
          <h2 id="about-core-close-title">Every layer leads back<br /><em>to a clearer next move.</em></h2>
          <div className="about-role-actions"><Link href="/property" className="about-core-primary">Explore properties</Link><Link href="/layer/mantle" className="about-core-secondary">Review how ScoutIt works</Link></div>
          <Link href="/layer/core" className="return-core">Return to Core ↑</Link>
        </section>
      </div>

      <style jsx global>{`
        .about-core-page{min-height:100vh;padding-top:52px;background:var(--bg);color:var(--text-primary);overflow-x:hidden;position:relative}.about-core-bg{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.32}.about-core-scrim{position:fixed;inset:0;z-index:1;pointer-events:none;background:radial-gradient(circle at 50% 30%,rgba(var(--bg-rgb),.55),var(--bg) 78%)}.about-core-content{position:relative;z-index:2;max-width:1180px;margin:0 auto;padding:0 clamp(20px,5vw,68px)}.about-core-kicker{font-family:var(--font-mono);font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent)}.about-core-hero{min-height:min(780px,calc(100vh - 52px));display:flex;flex-direction:column;align-items:flex-start;justify-content:center;max-width:980px;padding:80px 0}.about-core-hero h1,.about-core-close h2{font-family:var(--font-display);font-size:clamp(3.2rem,7.8vw,7.3rem);line-height:.94;letter-spacing:-.055em;margin:22px 0 30px}.about-core-hero h1 em,.about-core-close h2 em{color:var(--accent);font-weight:inherit}.about-core-hero p{max-width:64ch;color:var(--text-secondary);font-size:clamp(1rem,1.4vw,1.18rem);line-height:1.72}.about-core-primary,.about-core-secondary{min-height:44px;padding:0 18px;border-radius:13px;display:inline-flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:.13em;text-transform:uppercase}.about-core-primary{margin-top:28px;background:var(--accent-bright);border:1px solid var(--accent-bright);color:var(--bg)}.about-core-secondary{margin-top:28px;border:1px solid var(--border-solid);color:var(--text-primary);background:rgba(var(--surface-rgb),.55)}.about-core-section{scroll-margin-top:70px;padding:clamp(90px,12vw,170px) 0;border-top:1px solid var(--border-solid)}.about-core-heading{display:grid;grid-template-columns:1.2fr .8fr;gap:clamp(34px,8vw,110px);align-items:end;margin-bottom:56px}.about-core-heading h2{font-family:var(--font-display);font-size:clamp(2.7rem,5.8vw,5.4rem);line-height:.98;letter-spacing:-.045em;margin:20px 0 0}.about-core-heading>p{color:var(--text-secondary);font-size:14px;line-height:1.7;max-width:50ch}.about-role-tabs{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--border-solid);border-radius:16px;overflow:hidden}.about-role-tabs button{min-height:74px;padding:12px;border:0;border-right:1px solid var(--border-solid);background:rgba(var(--surface-rgb),.64);color:var(--text-primary);display:grid;grid-template-columns:24px 1fr;gap:3px 8px;text-align:left;cursor:pointer}.about-role-tabs button:last-child{border-right:0}.about-role-tabs span{grid-row:1/3;font-family:var(--font-mono);font-size:8px;color:var(--text-muted)}.about-role-tabs strong{font-family:var(--display);font-size:1rem}.about-role-tabs small{font-family:var(--font-mono);font-size:7px;letter-spacing:.09em;text-transform:uppercase;color:var(--text-muted)}.about-role-tabs button.is-active{background:rgba(var(--accent-rgb),.1);box-shadow:inset 0 -2px 0 var(--accent)}.about-role-tabs button.is-active span,.about-role-tabs button.is-active small{color:var(--accent)}.about-role-tabs button:disabled{cursor:wait}.about-role-intro{max-width:800px;margin:clamp(52px,8vw,90px) auto 30px;text-align:center}.about-role-intro h3{font-family:var(--font-display);font-size:clamp(2.5rem,5vw,4.8rem);line-height:1;letter-spacing:-.045em;margin:18px 0}.about-role-intro p{color:var(--text-secondary);font-size:15px;line-height:1.7}.core-schematic{width:min(780px,100%);aspect-ratio:1.65;margin:0 auto;position:relative}.schematic-ring{position:absolute;inset:15%;border:1px solid rgba(var(--accent-rgb),.22);border-radius:50%;box-shadow:inset 0 0 50px rgba(var(--accent-rgb),.03)}.schematic-center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:150px;height:150px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle,rgba(var(--accent-rgb),.2),var(--surface) 68%);border:1px solid var(--accent-muted);box-shadow:0 0 48px rgba(var(--accent-rgb),.12);z-index:2}.schematic-center span,.schematic-center small{font-family:var(--font-mono);font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}.schematic-center strong{font-family:var(--font-display);font-size:1.45rem;margin:5px 0}.schematic-node{position:absolute;width:150px;min-height:64px;padding:10px 14px;border:1px solid var(--border-solid);border-radius:13px;background:var(--surface);color:var(--text-primary);display:flex;align-items:center;gap:12px;text-align:left;cursor:pointer;z-index:3}.schematic-node span{font-family:var(--font-mono);font-size:8px;color:var(--text-muted)}.schematic-node strong{font-family:var(--font-mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase}.schematic-node.is-active{border-color:var(--accent);background:rgba(var(--accent-rgb),.1);box-shadow:0 0 24px rgba(var(--accent-rgb),.1)}.schematic-node.is-active span{color:var(--accent)}.schematic-node.node-1{left:6%;top:9%}.schematic-node.node-2{right:6%;top:9%}.schematic-node.node-3{right:6%;bottom:9%}.schematic-node.node-4{left:6%;bottom:9%}.step-detail{display:grid;grid-template-columns:1fr auto;gap:40px;align-items:end;padding:clamp(28px,5vw,54px);border:1px solid var(--border-solid);border-radius:18px;background:rgba(var(--surface-rgb),.76);backdrop-filter:blur(18px)}.step-copy h3{font-family:var(--font-display);font-size:clamp(2rem,4vw,3.5rem);margin:14px 0;outline:none}.step-copy p{color:var(--text-secondary);font-size:14px;line-height:1.7;max-width:66ch}.step-controls{display:flex;align-items:center;gap:12px}.step-controls button{min-height:40px;padding:0 13px;border:1px solid var(--border-solid);border-radius:10px;background:transparent;color:var(--text-secondary);font-family:var(--font-mono);font-size:8px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer}.step-controls span{font-family:var(--font-mono);font-size:8px;color:var(--accent)}.role-boundary{margin-top:16px;padding:22px 26px;border-left:2px solid var(--accent);background:rgba(var(--accent-rgb),.045)}.role-boundary p{color:var(--text-secondary);font-size:13px;line-height:1.7;margin:10px 0 0;max-width:78ch}.about-role-actions{display:flex;flex-wrap:wrap;gap:12px}.identity-card{display:grid;grid-template-columns:260px 1fr;gap:clamp(32px,8vw,100px);align-items:center;padding:clamp(30px,6vw,70px);border:1px solid var(--border-solid);border-radius:22px;background:rgba(var(--surface-rgb),.74);backdrop-filter:blur(20px)}.identity-orbit{width:220px;height:220px;border:1px solid var(--border-solid);border-radius:50%;display:grid;place-items:center;position:relative}.identity-orbit:before,.identity-orbit:after{content:"";position:absolute;border:1px solid rgba(var(--accent-rgb),.2);border-radius:50%;inset:18%}.identity-orbit:after{inset:35%}.identity-orbit i{width:14px;height:14px;border-radius:50%;background:var(--text-muted)}.identity-orbit.signed-in i{background:var(--accent-bright);box-shadow:0 0 26px rgba(var(--accent-bright-rgb),.8)}.identity-copy h3{font-family:var(--font-display);font-size:clamp(2rem,4vw,3.7rem);line-height:1.05;margin:16px 0}.identity-copy p{color:var(--text-secondary);font-size:14px;line-height:1.72;max-width:64ch}.about-core-close{padding:clamp(110px,17vw,220px) 0 100px}.about-core-close h2{font-size:clamp(3rem,7vw,6.8rem)}.return-core{display:inline-block;margin-top:64px;color:var(--text-muted);font-family:var(--font-mono);font-size:8px;letter-spacing:.13em;text-transform:uppercase}
        @media(max-width:800px){.about-core-heading{grid-template-columns:1fr}.about-role-tabs{grid-template-columns:repeat(2,1fr)}.about-role-tabs button:nth-child(2){border-right:0}.about-role-tabs button:nth-child(-n+2){border-bottom:1px solid var(--border-solid)}.core-schematic{aspect-ratio:auto;display:grid;grid-template-columns:repeat(2,1fr);gap:10px;padding:26px 0}.schematic-ring,.schematic-center{display:none}.schematic-node{position:static;width:auto;min-height:70px}.step-detail{grid-template-columns:1fr}.step-controls{justify-content:space-between}.identity-card{grid-template-columns:1fr}.identity-orbit{width:170px;height:170px}.about-core-bg{opacity:.2}}
        @media(max-width:520px){.about-core-page{padding-top:45px}.about-core-content{padding-left:16px;padding-right:16px}.about-core-hero{min-height:auto;padding:110px 0 90px}.about-core-hero h1{font-size:clamp(3rem,15vw,4.7rem)}.about-role-tabs{grid-template-columns:1fr}.about-role-tabs button{border-right:0;border-bottom:1px solid var(--border-solid)}.core-schematic{grid-template-columns:1fr}.about-role-actions{display:grid}.about-core-primary,.about-core-secondary{width:100%;margin-top:12px}.step-detail{padding:26px 20px}.step-controls button{min-height:44px}.identity-card{padding:32px 22px}.identity-orbit{margin:0 auto}}
        @media(prefers-reduced-motion:reduce){.about-core-bg{display:none}}
        @media(prefers-reduced-transparency:reduce){.step-detail,.identity-card{backdrop-filter:none;background:var(--surface)}}
      `}</style>
    </main>
  );
}
