"use client";

import { useState } from "react";
import Link from "next/link";
import LayerNav from "@/components/descent/LayerNav";
import LayerHeader from "@/components/descent/LayerHeader";
import BackgroundCore from "@/components/descent/BackgroundCore";
import { CORE_ROLES, CORE_ROLE_ORDER } from "@/components/descent/coreExperienceData";
import useVerifiedIdentity from "@/components/descent/useVerifiedIdentity";
import { getCoreAccountPresentation } from "@/components/descent/coreAccountPresentation";

export default function CoreGateway() {
  const [roleKey, setRoleKey] = useState("seeker");
  const role = CORE_ROLES[roleKey];
  const identity = useVerifiedIdentity();
  const account = getCoreAccountPresentation(identity);

  return (
    <main className="core-gateway">
      <LayerNav prev={{ href: "/layer/mantle", label: "Mantle" }} next={null} />
      <div className="core-gateway-bg" aria-hidden="true"><BackgroundCore isLoggedIn={identity.isAuthenticated} /></div>

      <div className="layer-pane core-gateway-pane">
        <LayerHeader
          layerNum="06"
          layerName="Core"
          title={identity.isAuthenticated ? `Welcome to the center, ${identity.name}.` : "The System Turns Toward You"}
          description="Mantle explained how ScoutIt operates. Core begins with your responsibility: what are you here to decide, publish, represent, or contribute?"
          missionText="Core is the personal threshold. It does not invent a profile or infer permissions from browser state; it verifies identity, offers an honest starting point, and sends real account activity to protected surfaces."
          ctaText={identity.isAuthenticated ? "Open Your Dashboard →" : "Create Your Account →"}
          ctaHref={identity.isAuthenticated ? "/dashboard" : "/onboarding"}
        />

        <section className="core-threshold" aria-labelledby="core-threshold-title">
          <header className="threshold-heading">
            <div>
              <span className="core-kicker">Mantle → Core → About You</span>
              <h2 id="core-threshold-title">Choose a perspective.</h2>
            </div>
            <p>This preview changes the explanation only. Account roles and permissions come from verified server records—not this selection.</p>
          </header>

          <div className="core-role-shell">
            <div className="core-role-index" role="group" aria-label="Preview ScoutIt perspectives">
              {CORE_ROLE_ORDER.map((key) => {
                const item = CORE_ROLES[key];
                return (
                  <button key={key} type="button" aria-pressed={key === roleKey} className={key === roleKey ? "is-active" : ""} onClick={() => setRoleKey(key)}>
                    <span>{item.number}</span><strong>{item.short}</strong><small>{item.label}</small>
                  </button>
                );
              })}
            </div>

            <article className="core-role-preview" aria-live="polite">
              <span className="core-kicker">{"Perspective // " + role.label}</span>
              <h3>{role.thesis}</h3>
              <p>{role.summary}</p>
              <div className="core-orbit-line" aria-label={`${role.short} workflow preview`}>
                {role.orbit.map((node, index) => <span key={node}><i>{String(index + 1).padStart(2, "0")}</i>{node}</span>)}
              </div>
              <Link href={`/about-you#${roleKey}`} className="core-continue">See your complete path <span aria-hidden="true">→</span></Link>
            </article>
          </div>

          <aside className="core-account" aria-label="Account state">
            <div className="account-state">
              <span className={`account-dot ${identity.status}`} aria-hidden="true" />
              <div><span className="core-kicker">Private workspace</span><strong>{account.compactTitle}</strong></div>
            </div>
            <p>{account.body}</p>
            <Link href={account.href}>{account.cta} <span aria-hidden="true">→</span></Link>
          </aside>
        </section>

        <section className="core-final-transition" aria-labelledby="core-final-title">
          <span className="core-kicker">Final chapter</span>
          <h2 id="core-final-title">The system is clear.<br /><em>Now place yourself inside it.</em></h2>
          <Link href={`/about-you#${roleKey}`}>Continue to About You <span aria-hidden="true">→</span></Link>
        </section>
      </div>

      <style jsx global>{`
        .core-gateway{min-height:100vh;padding-top:52px;background:radial-gradient(circle at 50% 20%,rgba(var(--accent-rgb),.08),transparent 34%),var(--bg);color:var(--text-primary);overflow-x:hidden;position:relative}.core-gateway-bg{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.42}.core-gateway-pane{position:relative;z-index:1}.core-threshold{max-width:1180px;margin:0 auto;padding:clamp(80px,10vw,150px) clamp(20px,5vw,68px)}.core-kicker{font-family:var(--font-mono);font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent)}.threshold-heading{display:grid;grid-template-columns:1.2fr .8fr;gap:clamp(34px,8vw,110px);align-items:end;margin-bottom:60px}.threshold-heading h2{font-family:var(--font-display);font-size:clamp(2.8rem,6vw,5.8rem);line-height:.98;letter-spacing:-.045em;margin:20px 0 0}.threshold-heading p{color:var(--text-secondary);font-size:16px;line-height:1.7;max-width:50ch}.core-role-shell{display:grid;grid-template-columns:minmax(240px,.48fr) minmax(0,1.52fr);border:1px solid var(--border-solid);border-radius:22px;overflow:hidden;background:rgba(var(--bg-rgb),.84);backdrop-filter:blur(22px);box-shadow:var(--shadow-lg)}.core-role-index{background:rgba(var(--surface-rgb),.74);border-right:1px solid var(--border-solid)}.core-role-index button{width:100%;min-height:86px;padding:14px 18px;border:0;border-bottom:1px solid var(--border-solid);background:transparent;color:var(--text-primary);display:grid;grid-template-columns:34px 1fr;gap:4px 10px;text-align:left;cursor:pointer}.core-role-index button:last-child{border-bottom:0}.core-role-index span{grid-row:1/3;font-family:var(--font-mono);font-size:12px;color:var(--text-muted);padding-top:4px}.core-role-index strong{font-family:var(--font-display);font-size:1.1rem}.core-role-index small{font-family:var(--font-mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted)}.core-role-index button.is-active{background:rgba(var(--accent-rgb),.09);box-shadow:inset 2px 0 0 var(--accent)}.core-role-index button.is-active span,.core-role-index button.is-active small{color:var(--accent)}.core-role-preview{min-height:430px;padding:clamp(36px,6vw,76px);background:radial-gradient(circle at 88% 12%,rgba(var(--accent-rgb),.09),transparent 40%),var(--surface2);display:flex;flex-direction:column;justify-content:center}.core-role-preview h3{font-family:var(--font-display);font-size:clamp(2.5rem,5vw,4.8rem);line-height:1;letter-spacing:-.045em;margin:18px 0 22px;max-width:14ch}.core-role-preview>p{color:var(--text-secondary);font-size:16px;line-height:1.72;max-width:62ch}.core-orbit-line{display:grid;grid-template-columns:repeat(5,1fr);margin-top:34px;border:1px solid var(--border-solid);border-radius:14px;overflow:hidden}.core-orbit-line span{min-height:66px;padding:12px;border-right:1px solid var(--border-solid);display:flex;flex-direction:column;justify-content:space-between;font-family:var(--font-mono);font-size:12px;letter-spacing:.09em;text-transform:uppercase;color:var(--text-secondary)}.core-orbit-line span:last-child{border-right:0}.core-orbit-line i{font-style:normal;color:var(--accent);font-size:12px}.core-continue,.core-account>a,.core-final-transition>a{align-self:flex-start;margin-top:28px;min-height:44px;padding:0 16px;border:1px solid var(--accent-muted);border-radius:12px;display:inline-flex;align-items:center;color:var(--text-primary);font-family:var(--font-mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase}.core-continue span,.core-account>a span,.core-final-transition>a span{color:var(--accent);margin-left:8px}.core-account{margin-top:18px;padding:24px clamp(20px,4vw,38px);border:1px solid var(--border-solid);border-radius:18px;background:rgba(var(--surface-rgb),.7);display:grid;grid-template-columns:.75fr 1.25fr auto;gap:32px;align-items:center;backdrop-filter:blur(18px)}.account-state{display:flex;gap:14px;align-items:center}.account-state>div{display:flex;flex-direction:column;gap:7px}.account-state strong{font-family:var(--font-display);font-size:1rem}.account-dot{width:9px;height:9px;border-radius:50%;background:var(--text-muted)}.account-dot.signed-in{background:var(--accent-bright);box-shadow:0 0 16px rgba(var(--accent-bright-rgb),.65)}.core-account p{color:var(--text-secondary);font-size:14px;line-height:1.65;margin:0}.core-account>a{margin:0;white-space:nowrap}.core-final-transition{max-width:1180px;margin:0 auto;padding:clamp(90px,13vw,180px) clamp(20px,5vw,68px)}.core-final-transition h2{font-family:var(--font-display);font-size:clamp(2.8rem,6vw,6rem);line-height:.98;letter-spacing:-.05em;margin:22px 0 0}.core-final-transition h2 em{color:var(--accent);font-weight:inherit}.core-final-transition>a{margin-top:38px}
        @media(max-width:850px){.threshold-heading,.core-role-shell{grid-template-columns:1fr}.core-role-index{display:grid;grid-template-columns:repeat(2,1fr);border-right:0;border-bottom:1px solid var(--border-solid)}.core-role-index button:nth-child(odd){border-right:1px solid var(--border-solid)}.core-role-preview{min-height:380px}.core-account{grid-template-columns:1fr;gap:18px}.core-account>a{justify-self:start}.core-gateway-bg{opacity:.24}}
        @media(max-width:560px){.core-gateway{padding-top:45px}.core-threshold,.core-final-transition{padding-left:16px;padding-right:16px}.core-role-index{grid-template-columns:1fr}.core-role-index button{min-height:70px;border-right:0!important}.core-orbit-line{grid-template-columns:1fr}.core-orbit-line span{min-height:50px;border-right:0;border-bottom:1px solid var(--border-solid);flex-direction:row;align-items:center}.core-orbit-line span:last-child{border-bottom:0}.core-role-preview{padding:34px 22px}.core-continue,.core-account>a,.core-final-transition>a{width:100%;justify-content:center}}
        @media(prefers-reduced-transparency:reduce){.core-role-shell,.core-account{backdrop-filter:none;background:var(--surface)}}

        .account-state strong{font-family:var(--font-display)}
        .core-continue,.core-account>a,.core-final-transition>a{min-height:44px;transition:color var(--transition-slow),border-color var(--transition-slow),background var(--transition-slow)}
        .core-role-index button{transition:color var(--transition-slow),background var(--transition-slow)}
        .core-continue:hover,.core-account>a:hover,.core-final-transition>a:hover{border-color:var(--accent);background:rgba(var(--accent-rgb),.055)}
        .core-continue:focus-visible,.core-account>a:focus-visible,.core-final-transition>a:focus-visible{outline:2px solid var(--accent-bright);outline-offset:3px}
        .core-role-index button:focus-visible{outline:2px solid var(--accent-bright);outline-offset:-3px;position:relative;z-index:2}
        @media(prefers-reduced-motion:reduce){.core-role-index button,.core-continue,.core-account>a,.core-final-transition>a{transition:none}}
        @media(prefers-reduced-transparency:reduce){.core-role-index{background:var(--surface)}}
      `}</style>
    </main>
  );
}
