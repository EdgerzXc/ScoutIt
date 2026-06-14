"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Building2, Camera, Search, CalendarDays, Lock, LayoutGrid, Bookmark, User } from "lucide-react";
import BoardPodium from "@/components/board/BoardPodium";
import EventHorizon from "@/components/cinematic/EventHorizon";
import ProfileButton from "@/components/ui/ProfileButton";
import Footer from "@/components/layout/Footer";
import "./descent.css";

const BUILDINGS = [
  { l: "1%", bw: 46, bh: 150, st: 0.04, rg: 0.42 }, { l: "8%", bw: 34, bh: 205, st: 0.13, rg: 0.4 },
  { l: "15%", bw: 52, bh: 120, st: 0.26, rg: 0.4 }, { l: "24%", bw: 38, bh: 235, st: 0.09, rg: 0.44 },
  { l: "32%", bw: 44, bh: 165, st: 0.33, rg: 0.4 }, { l: "42%", bw: 56, bh: 205, st: 0.19, rg: 0.42 },
  { l: "53%", bw: 36, bh: 140, st: 0.4, rg: 0.38 }, { l: "61%", bw: 50, bh: 225, st: 0.15, rg: 0.44 },
  { l: "71%", bw: 40, bh: 175, st: 0.29, rg: 0.4 }, { l: "80%", bw: 48, bh: 195, st: 0.23, rg: 0.42 },
  { l: "89%", bw: 34, bh: 132, st: 0.43, rg: 0.38 },
];

const ROLES = [
  { name: "Brokers", head: "Be found.", body: "A public profile owners and buyers actually reach, warm leads from real reactions on your listings, and the intel tools that make you the most prepared advisor in the room." },
  { name: "Owners", head: "List once, get pursued.", body: "Vetted brokers compete to represent your space, and you see exactly who's interested — through real signals — before you commit to anyone." },
  { name: "Providers", head: "Work where the demand is.", body: "Photographers, researchers, and planners get a profile that sits right beside the properties that need you, so you're hired from inside the platform." },
];

const PIONEERS = [
  { initials: "JD", name: "J. Dela Cruz", tag: "Broker · 001" },
  { initials: "MR", name: "M. Reyes", tag: "Owner · 004" },
  { initials: "AL", name: "A. Lim", tag: "Photographer · 009" },
  { initials: "SV", name: "S. Villanueva", tag: "Researcher · 012" },
];

function CityBuilding({ b }) {
  const n = Math.min(Math.max(1, Math.floor(b.bw / 11)) * Math.max(1, Math.floor(b.bh / 26)), 30);
  return (
    <div className="bld" style={{ left: b.l, "--bw": `${b.bw}px`, "--bh": `${b.bh}px`, "--st": b.st, "--rg": b.rg }}>
      <div className="win-layer">
        {Array.from({ length: n }).map((_, k) => <span className="win" key={k} />)}
      </div>
    </div>
  );
}

export default function DescentPage() {
  const rootRef = useRef(null);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    try { setSignedIn(!!localStorage.getItem("scoutit_user")); } catch (e) { /* signed out */ }
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) root.classList.add("reduced");
    const sections = Array.from(root.querySelectorAll(".dl"));
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

    // Each section's 0..1 progress as it travels up through the viewport,
    // written to --sp. Every layer's animation reads this, so scrolling
    // *down* is what plays the descent.
    const compute = () => {
      raf = 0;
      const rootRect = root.getBoundingClientRect();
      const vh = rootRect.height || 1;
      for (const el of sections) {
        const r = el.getBoundingClientRect();
        const top = r.top - rootRect.top;
        const sp = clamp((vh - top) / (vh + r.height), 0, 1);
        el.style.setProperty("--sp", sp.toFixed(4));
      }
    };
    let raf = 0;
    compute();
    if (reduce) { sections.forEach((el) => el.style.setProperty("--sp", "0.6")); return; }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(compute); };
    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { root.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="descent-root" ref={rootRef}>
      {/* minimal brand bar */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 20, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px clamp(20px, 6vw, 90px)", pointerEvents: "none" }}>
        <Link href="/" style={{ fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.24em", fontSize: 13, color: "#f0ede8", textDecoration: "none", pointerEvents: "auto" }}>
          SCOUT<span style={{ color: "#ffb800" }}>IT</span>
        </Link>
        <div style={{ pointerEvents: "auto" }}><ProfileButton /></div>
      </div>

      {/* LAYER 1 — ORBIT (space) */}
      <section className="dl layer-orbit">
        <div className="layer-bg">
          <EventHorizon />
          <div className="pool" />
        </div>
        <div className="layer-content">
          <div className="dz-ufo">
            <svg viewBox="0 0 120 70" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="60" cy="44" rx="55" ry="13" fill="#1a1a1a" stroke="#ffb800" strokeWidth="2" />
              <ellipse cx="60" cy="48" rx="40" ry="8" fill="#222222" />
              <circle className="ufo-belly" cx="36" cy="49" r="2.2" /><circle className="ufo-belly" cx="52" cy="51" r="2.2" />
              <circle className="ufo-belly" cx="68" cy="51" r="2.2" /><circle className="ufo-belly" cx="84" cy="49" r="2.2" />
              <path d="M37 38 Q60 4 83 38 Z" fill="#1e2a1e" stroke="#ffb800" strokeWidth="1" />
              <circle className="porthole porthole-1" cx="49" cy="28" r="4" /><circle className="porthole porthole-2" cx="60" cy="24" r="4" /><circle className="porthole porthole-3" cx="71" cy="28" r="4" />
            </svg>
          </div>
          <div className="dz-wordmark"><span className="w-scout">Scout</span><span className="w-it">IT</span></div>
          <div className="dz-badge">SPACE · INTELLIGENCE · TECHNOLOGY</div>
          <div className="dz-divider" />
          <p className="dz-tag1">Get lost in spaces that actually inspire you.</p>
          <div className="dz-tag2">SPACE INTELLIGENCE · PHILIPPINE PROPERTY</div>
          <div className="hero-cue">Begin the descent <span className="cue-arrow">↓</span></div>
        </div>
      </section>

      {/* SUMMIT — Showcase board on a space backdrop */}
      <section className="dl layer-board" style={{ padding: 0, justifyContent: "stretch" }}>
        <div className="layer-bg">
          <div className="bstars" />
          <div className="bnebula" />
          <div className="bnebula n2" />
        </div>
        <div className="layer-content" style={{ width: "100%" }}>
          <BoardPodium />
        </div>
      </section>

      {/* ATMOSPHERE — News */}
      <section className="dl layer-atmos">
        <div className="layer-bg">
          <div className="cloud c1" /><div className="cloud c2" /><div className="cloud c3" />
          {["12%", "28%", "44%", "61%", "77%", "90%"].map((l, i) => (
            <div className="mote" key={i} style={{ left: l, animationDuration: `${12 + i * 1.5}s`, animationDelay: `${-i * 2}s` }} />
          ))}
        </div>
        <div className="layer-content">
          <div className="dl-eyebrow">Layer 02 · the atmosphere</div>
          <h2 className="dl-title">News travels in the air.</h2>
          <p className="dl-sub">Before your feet touch the ground — what's moving, what's shifting, what's worth knowing. The market, read from above.</p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 30 }}>
            {[{ t: "Makati CBD yields drop", k: "Market intel", href: "/intel/makati-yields" }, { t: "Nuvali expansion patterns", k: "Area guide", href: "/intel/nuvali-expansion" }, { t: "Pasig zoning changes", k: "Regulatory", href: "/intel/pasig-zoning" }].map((a) => (
              <Link key={a.href} href={a.href} style={{ flex: "1 1 240px", textDecoration: "none", background: "rgba(10,12,24,0.6)", border: "0.5px solid rgba(255,184,0,0.2)", borderRadius: 10, padding: "18px 20px", backdropFilter: "blur(4px)" }}>
                <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#ffb800", marginBottom: 10 }}>{a.k}</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: "#f5f1ea" }}>{a.t}</div>
              </Link>
            ))}
          </div>
          <Link href="/discover" className="dl-cta">Enter discovery →</Link>
        </div>
      </section>

      {/* CITY — Properties */}
      <section className="dl layer-city">
        <div className="layer-bg">
          <div className="sky sky-day" /><div className="sky sky-dusk" /><div className="sky sky-night" />
          <div className="citystars" />
          <div className="sun" /><div className="moon" />
          <div className="skyline">
            {BUILDINGS.map((b, i) => <CityBuilding b={b} i={i} key={i} />)}
          </div>
          <div className="ground" />
        </div>
        <div className="layer-content">
          <div className="dl-eyebrow">Layer 03 · the city</div>
          <h2 className="dl-title">Show the space, not the spreadsheet.</h2>
          <p className="dl-sub">Down into the streets. Real, desirable spaces — browse the market itself, building by building.</p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 30 }}>
            {[{ t: "The Proscenium", l: "Rockwell Center, Makati", c: "Condo" }, { t: "Ayala Alabang Core", l: "Muntinlupa City", c: "House" }, { t: "High Street South Block", l: "BGC, Taguig", c: "Commercial" }].map((p) => (
              <Link key={p.t} href="/property" style={{ flex: "1 1 240px", textDecoration: "none", background: "rgba(10,12,24,0.55)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 10, overflow: "hidden", backdropFilter: "blur(4px)" }}>
                <div style={{ height: 120, background: "linear-gradient(135deg, #1c2340, #2a1d3e)" }} />
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#ffb800", marginBottom: 6 }}>{p.c}</div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#f5f1ea" }}>{p.t}</div>
                  <div style={{ fontSize: 12, color: "#c8c8c8", marginTop: 4 }}>{p.l}</div>
                </div>
              </Link>
            ))}
          </div>
          <Link href="/property" className="dl-cta">Browse all properties →</Link>
        </div>
      </section>

      {/* CRUST — Services */}
      <section className="dl layer-crust">
        <div className="layer-bg">
          <div className="strata" />
          <div className="vein" style={{ top: "30%", left: "10%", width: "30%", transform: "rotate(-4deg)" }} />
          <div className="vein" style={{ top: "52%", left: "40%", width: "40%", transform: "rotate(3deg)", animationDelay: "-1.5s" }} />
          <div className="vein" style={{ top: "68%", left: "8%", width: "34%", transform: "rotate(-2deg)", animationDelay: "-2.5s" }} />
          <div className="vein" style={{ top: "80%", left: "55%", width: "30%", transform: "rotate(5deg)", animationDelay: "-3.5s" }} />
        </div>
        <div className="layer-content">
          <div className="dl-eyebrow">Layer 04 · the crust</div>
          <h2 className="dl-title">What holds it all together.</h2>
          <p className="dl-sub">The vetted ecosystem — the people who make the data trustworthy. The solid layer the whole world rests on.</p>
          <div className="role-grid" style={{ marginBottom: 30 }}>
            {[{ Icon: Building2, t: "Verified advisors", d: "Licensed professionals to guide the deal.", href: "/brokers" }, { Icon: Camera, t: "Space photography", d: "Make every space look the way it deserves.", href: "/photographers" }, { Icon: Search, t: "Site research", d: "Due diligence before you commit.", href: "/researchers" }, { Icon: CalendarDays, t: "Event design", d: "Turn great spaces into great events.", href: "/event-planners" }].map((s) => (
              <Link key={s.href} href={s.href} style={{ textDecoration: "none", background: "rgba(20,14,8,0.6)", border: "0.5px solid rgba(255,184,0,0.22)", borderRadius: 10, padding: "18px 20px", backdropFilter: "blur(4px)" }}>
                <s.Icon strokeWidth={1.5} size={26} style={{ color: "#ffb800" }} />
                <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#f5f1ea", margin: "10px 0 5px" }}>{s.t}</div>
                <div style={{ fontSize: 13, color: "#d6d2c8", lineHeight: 1.5 }}>{s.d}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* MANTLE — About Us */}
      <section className="dl layer-mantle">
        <div className="layer-bg">
          <div className="magma m1" /><div className="magma m2" />
          {[{ l: "18%", s: 14, du: 9, de: -1 }, { l: "33%", s: 9, du: 11, de: -5 }, { l: "49%", s: 17, du: 8, de: -3 }, { l: "64%", s: 11, du: 12, de: -7 }, { l: "79%", s: 8, du: 10, de: -2 }, { l: "88%", s: 13, du: 13, de: -6 }].map((b, i) => (
            <div className="bubble" key={i} style={{ left: b.l, width: b.s, height: b.s, animationDuration: `${b.du}s`, animationDelay: `${b.de}s` }} />
          ))}
        </div>
        <div className="layer-content">
          <div className="dl-eyebrow">Layer 05 · the mantle</div>
          <h2 className="dl-title">We're the layer around you.</h2>
          <p className="dl-sub">ScoutIT is the molten company wrapped around the thing at the center. Not a self-celebration — a promise: everything we build is to surround and protect you.</p>
          <Link href="/about" className="dl-cta">Read our story →</Link>
        </div>
      </section>

      {/* CORE — About You */}
      <section className="dl layer-core">
        <div className="layer-bg">
          <div className="coreglow" />
          <div className="ering" /><div className="ering e2" /><div className="ering e3" />
        </div>
        <div className="layer-content">
          <div className="core-wrap">
            <div>
              <div className="dl-eyebrow" style={{ color: "#ffd24a" }}>Layer 06 · the core</div>
              <h2 className="dl-title" style={{ color: "#fff" }}>It was always about you.</h2>
              <p className="dl-sub">The molten center. Everything above led here — to the people who got here first, and to your own place inside it.</p>
            </div>
            <div>
              <div className="membrane">Outer core · public</div>
              <div className="role-grid">
                {ROLES.map((r) => (
                  <div className="role-card" key={r.name}>
                    <div className="role-name">{r.name}</div>
                    <div className="role-head">{r.head}</div>
                    <div className="role-body">{r.body}</div>
                  </div>
                ))}
              </div>
              <div className="pioneer-strip" style={{ marginTop: 18 }}>
                <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#c8c8c8" }}>The pioneers</span>
                {PIONEERS.map((p) => (
                  <div className="pioneer" key={p.name}>
                    <span className="pi-av">{p.initials}</span>
                    <span><span className="pi-name" style={{ display: "block" }}>{p.name}</span><span className="pi-tag">{p.tag}</span></span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="membrane">Inner core · private</div>
              {signedIn ? (
                <div className="inner-core">
                  <div className="ic-head"><LayoutGrid strokeWidth={1.5} size={22} style={{ color: "#ffb800" }} /> Welcome back — here's your world.</div>
                  <div className="ic-sub">Your board, your saved spaces, your profile. The center is yours.</div>
                  <div className="ic-links">
                    <Link href="/dashboard" className="dl-cta solid">Enter your space →</Link>
                    <Link href="/wishlist" className="dl-cta"><Bookmark strokeWidth={1.5} size={15} /> Wishlist</Link>
                    <Link href="/dashboard" className="dl-cta"><User strokeWidth={1.5} size={15} /> Profile</Link>
                  </div>
                </div>
              ) : (
                <div className="inner-core locked">
                  <div className="ic-head"><Lock strokeWidth={1.5} size={20} style={{ color: "#ffb800" }} /> Your space is sealed.</div>
                  <div className="ic-sub">Board, wishlist, profile — the inner core is yours alone, and it opens the moment you join. Becoming a pioneer is the only way to the center.</div>
                  <div className="ic-links"><Link href="/onboarding" className="dl-cta solid">Become a pioneer →</Link></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
