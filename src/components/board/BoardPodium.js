"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { rankBoard, BOARD_CATEGORIES } from "@/data/mockShowcase";

const TIER = {
  universe: { color: "#ffb800", rgb: "255,184,0" },
  cluster: { color: "#C0C0C0", rgb: "192,192,192" },
  solar: { color: "#CD7F32", rgb: "205,127,50" },
  starry: { color: "#c8c8c8", rgb: "138,138,138" },
};

function BoardCard({ e, variant }) {
  const t = TIER[e.tier] || TIER.starry;
  return (
    <Link href="/showcase" className={`bp-card bp-${variant}`} style={{ borderColor: `rgba(${t.rgb},0.6)`, "--tg": `rgba(${t.rgb},0.55)`, "--tc": t.color }}>
      <div className="bp-photo" style={e.photo ? { backgroundImage: `url(${e.photo})` } : undefined}>
        <span className="bp-rank" style={{ color: t.color, borderColor: `rgba(${t.rgb},0.65)` }}>#{String(e.rank).padStart(2, "0")}</span>
        {variant === "hero" && <span className="bp-tier-tag" style={{ color: t.color, borderColor: `rgba(${t.rgb},0.5)` }}>{e.tier === "universe" ? "Champion" : e.tier === "cluster" ? "Runner-up" : e.tier === "solar" ? "Podium" : "Contender"}</span>}
        <span className="bp-showcase">Showcase →</span>
      </div>
      <div className="bp-body">
        {e.category && <div className="bp-cat" style={{ color: t.color }}>{e.category}</div>}
        <div className="bp-name">{e.name}</div>
        {e.location && <div className="bp-loc">{e.location}</div>}
        {variant === "hero" && (
          <>
            <div className="bp-divider" />
            <div className="bp-stats">
              {[["Inquiries", e.inquiry_count], ["Views", e.views], ["Saves", e.saves]].filter(([, v]) => v).map(([l, v]) => (
                <div className="bp-stat" key={l}><span className="bp-num" style={{ color: t.color }}>{v}</span><span className="bp-lbl">{l}</span></div>
              ))}
            </div>
          </>
        )}
        {variant !== "hero" && (
          <div className="bp-mini-stat"><span style={{ color: t.color }}>{e.inquiry_count}</span> inquiries</div>
        )}
      </div>
    </Link>
  );
}

export default function BoardPodium() {
  const [entries, setEntries] = useState([]);
  const [category, setCategory] = useState("All");

  useEffect(() => {
    let alive = true;
    fetch("/api/showcase").then((r) => r.json()).then((d) => { if (alive && d.entries) setEntries(d.entries); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const ranked = useMemo(() => rankBoard(entries, { award: "Most Inquired", category }).slice(0, 4), [entries, category]);
  const hero = ranked[0];
  const rest = ranked.slice(1);

  return (
    <div className="board-split">
      {/* LEFT — menu */}
      <aside className="board-menu">
        <div>
          <span className="board-kicker">Layer 01 // The Board</span>
          <h2 className="board-title">The Board</h2>
          <p className="board-sub">The properties Manila is watching — ranked by real inquiry demand.</p>
          <nav className="board-nav">
            {BOARD_CATEGORIES.map((c) => (
              <button key={c} className={`board-cat ${category === c ? "on" : ""}`} onClick={() => setCategory(c)}>
                {c === "All" ? "All Properties" : c}
              </button>
            ))}
          </nav>
        </div>
        <Link href="/showcase" className="board-seeall">See The Showcase →</Link>
      </aside>

      {/* RIGHT — leaderboard preview */}
      <div className="board-content">
        <div className="board-content-head">
          <h3 className="board-content-title">{category === "All" ? "Overall" : category} · Most Inquired</h3>
          <div className="board-content-sub">Live Leaderboard — Updated Monthly</div>
        </div>

        {ranked.length === 0 ? (
          <div className="board-empty">No ranked spaces in this category yet.</div>
        ) : (
          <div className="board-podium">
            {hero && <BoardCard e={hero} variant="hero" />}
            <div className="board-runners">
              {rest.map((e, i) => <BoardCard key={e.rank} e={e} variant={i === 0 ? "mid" : "mini"} />)}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .board-split {
          width: 100%; min-height: 100%;
          display: grid; grid-template-columns: 320px 1fr;
          background:
            radial-gradient(ellipse at 80% 20%, rgba(255,184,0,0.05), transparent 55%),
            #0b0b0d;
        }
        .board-menu {
          display: flex; flex-direction: column; justify-content: space-between;
          padding: clamp(36px, 6vh, 64px) 36px;
          border-right: 1px solid #1a1a1a;
        }
        .board-kicker { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.2em; color: var(--accent); text-transform: uppercase; }
        .board-title { font-family: var(--font-display); font-weight: 400; font-size: clamp(34px, 4vw, 48px); color: #f0ede8; margin: 12px 0 8px; }
        .board-sub { font-family: Georgia, serif; font-style: italic; font-size: 14px; color: #c8c8c8; line-height: 1.6; margin-bottom: 28px; }
        .board-nav { display: flex; flex-direction: column; gap: 2px; }
        .board-cat {
          text-align: left; font-family: Georgia, serif; font-size: 17px; color: #c8c8c8;
          background: none; border: 1px solid transparent; padding: 13px 16px; cursor: pointer;
          border-radius: 4px; transition: all 0.2s;
        }
        .board-cat:hover { color: #f0ede8; }
        .board-cat.on { color: var(--accent); border-color: rgba(255,184,0,0.4); background: rgba(255,184,0,0.06); }
        :global(.board-seeall) {
          font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--accent); text-decoration: none; border: 1px solid rgba(255,184,0,0.5);
          padding: 16px; text-align: center; transition: background 0.2s; margin-top: 28px;
        }
        :global(.board-seeall:hover) { background: rgba(255,184,0,0.12); }

        .board-content { padding: clamp(36px, 6vh, 64px) clamp(28px, 4vw, 56px); display: flex; flex-direction: column; min-width: 0; }
        .board-content-head { margin-bottom: 28px; }
        .board-content-title { font-family: var(--font-display); font-weight: 400; font-size: clamp(28px, 3.4vw, 40px); color: #f0ede8; }
        .board-content-sub { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.22em; color: #555; text-transform: uppercase; margin-top: 8px; }
        .board-empty { font-family: Georgia, serif; font-style: italic; color: #666; font-size: 18px; padding: 60px 0; }

        .board-podium { display: grid; grid-template-columns: 1.45fr 1fr; gap: 18px; align-items: start; }
        .board-runners { display: flex; flex-direction: column; gap: 18px; }

        :global(.bp-card) {
          position: relative; display: flex; background: rgba(18,18,20,0.92);
          border: 1px solid; border-radius: 5px; overflow: hidden; text-decoration: none;
          transition: transform 0.28s ease, box-shadow 0.28s ease;
        }
        :global(.bp-card:hover) { transform: translateY(-4px); box-shadow: 0 0 0 1px var(--tg), 0 16px 44px -18px var(--tg); }
        :global(.bp-hero) { flex-direction: column; min-height: 392px; }
        :global(.bp-mid) { flex-direction: row; min-height: 188px; }
        :global(.bp-mini) { flex-direction: row; min-height: 150px; }
        :global(.bp-photo) { position: relative; background: #161616; background-size: cover; background-position: center; flex-shrink: 0; overflow: hidden; transition: transform 0.5s ease; }
        :global(.bp-hero .bp-photo) { width: 100%; height: 210px; }
        :global(.bp-mid .bp-photo), :global(.bp-mini .bp-photo) { width: 44%; min-width: 120px; height: auto; }
        :global(.bp-card:hover .bp-photo) { transform: scale(1.05); }
        :global(.bp-rank) { position: absolute; top: 12px; left: 12px; font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.08em; padding: 4px 11px; border: 1px solid; background: rgba(0,0,0,0.62); backdrop-filter: blur(6px); }
        :global(.bp-tier-tag) { position: absolute; top: 12px; right: 12px; font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; padding: 4px 10px; border: 1px solid; background: rgba(0,0,0,0.55); backdrop-filter: blur(6px); }
        :global(.bp-showcase) { position: absolute; bottom: 12px; right: 12px; font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #fff; background: rgba(0,0,0,0.6); padding: 5px 11px; opacity: 0; transform: translateY(6px); transition: all 0.28s ease; }
        :global(.bp-card:hover .bp-showcase) { opacity: 1; transform: translateY(0); }
        :global(.bp-body) { padding: 18px; display: flex; flex-direction: column; flex: 1; min-width: 0; }
        :global(.bp-cat) { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 7px; }
        :global(.bp-name) { font-family: Georgia, serif; color: #f0ede8; line-height: 1.25; }
        :global(.bp-hero .bp-name) { font-size: 26px; }
        :global(.bp-mid .bp-name) { font-size: 18px; }
        :global(.bp-mini .bp-name) { font-size: 16px; }
        :global(.bp-loc) { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: #666; margin-top: 5px; }
        :global(.bp-divider) { height: 1px; background: #232323; margin: 16px 0; }
        :global(.bp-stats) { display: flex; gap: 22px; }
        :global(.bp-stat) { display: flex; flex-direction: column; }
        :global(.bp-num) { font-family: Georgia, serif; font-size: 22px; }
        :global(.bp-lbl) { font-family: var(--font-mono); font-size: 8px; letter-spacing: 0.16em; text-transform: uppercase; color: #555; margin-top: 2px; }
        :global(.bp-mini-stat) { font-family: var(--font-mono); font-size: 10px; color: #555; letter-spacing: 0.1em; text-transform: uppercase; margin-top: auto; }
        :global(.bp-mini-stat span) { font-family: Georgia, serif; font-size: 16px; }

        @media (max-width: 1024px) {
          .board-split { grid-template-columns: 260px 1fr; }
        }
        @media (max-width: 820px) {
          .board-split { grid-template-columns: 1fr; }
          .board-menu { border-right: none; border-bottom: 1px solid #1a1a1a; }
          .board-nav { flex-direction: row; flex-wrap: wrap; }
          .board-podium { grid-template-columns: 1fr; }
        }
        @media (max-width: 560px) {
          :global(.bp-mid), :global(.bp-mini) { flex-direction: column; }
          :global(.bp-mid .bp-photo), :global(.bp-mini .bp-photo) { width: 100%; height: 120px; }
        }
      `}</style>
    </div>
  );
}
