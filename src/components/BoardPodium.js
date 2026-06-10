"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const TIER = {
  1: { color: "#c8a96e", rgb: "200,169,110", label: "Universe" },
  2: { color: "#C0C0C0", rgb: "192,192,192", label: "Cluster" },
  3: { color: "#CD7F32", rgb: "205,127,50", label: "Solar" },
  rest: { color: "#888888", rgb: "136,136,136", label: "Starry" },
};
const tierFor = (rank) => TIER[rank] || TIER.rest;

function BoardCard({ e, size }) {
  const t = tierFor(e.rank);
  return (
    <Link href={`/property/${e.property_slug}`} className={`bp-card bp-${size}`} style={{ borderColor: `rgba(${t.rgb},0.55)` }}>
      <div className="bp-photo" style={e.photo ? { backgroundImage: `url(${e.photo})` } : undefined}>
        <span className="bp-rank" style={{ color: t.color, borderColor: `rgba(${t.rgb},0.6)` }}>#{String(e.rank).padStart(2, "0")}</span>
      </div>
      <div className="bp-body">
        {e.category && <div className="bp-cat" style={{ color: t.color }}>{e.category}</div>}
        <div className="bp-name">{e.name}</div>
        {e.location && <div className="bp-loc">{e.location}</div>}
        {size !== "mini" && (
          <>
            <div className="bp-divider" />
            <div className="bp-stats">
              {[["Inquiries", e.inquiry_count], ["Views", e.views], ["Saves", e.saves]].filter(([, v]) => v).map(([l, v]) => (
                <div className="bp-stat" key={l}><span className="bp-num" style={{ color: t.color }}>{v}</span><span className="bp-lbl">{l}</span></div>
              ))}
            </div>
            <div className="bp-cta">View Full Briefing <span>→</span></div>
          </>
        )}
        {size === "mini" && e.inquiry_count != null && (
          <div className="bp-mini-stat"><span style={{ color: t.color }}>{e.inquiry_count}</span> inquiries</div>
        )}
      </div>
    </Link>
  );
}

export default function BoardPodium() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    let alive = true;
    fetch("/api/showcase").then((r) => r.json()).then((d) => {
      if (alive && d.showcase) setEntries(d.showcase["Most Inquired"] || []);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const byRank = (r) => entries.find((e) => e.rank === r);
  const top1 = byRank(1), top2 = byRank(2), top3 = byRank(3);
  const rest = entries.filter((e) => e.rank >= 4);

  return (
    <div className="board-layer">
      <div className="board-head">
        <div className="board-head-l">
          <span className="board-kicker">Layer 01 // The Board</span>
          <h2 className="board-title">Most Inquired</h2>
          <p className="board-sub">The properties Manila is watching — ranked by real inquiry demand.</p>
        </div>
        <Link href="/showcase" className="board-seeall">See Full Board →</Link>
      </div>

      <div className="board-podium">
        {top1 && <BoardCard e={top1} size="hero" />}
        <div className="board-mids">
          {top2 && <BoardCard e={top2} size="mid" />}
          {top3 && <BoardCard e={top3} size="mid" />}
        </div>
      </div>

      {rest.length > 0 && (
        <div className="board-rest-wrap">
          <div className="board-rest-label">Ranks 4–10</div>
          <div className="board-rest">
            {rest.map((e) => <BoardCard key={e.rank} e={e} size="mini" />)}
          </div>
        </div>
      )}

      <style jsx>{`
        .board-layer {
          width: 100%; min-height: 100%;
          background:
            radial-gradient(ellipse at 50% 30%, rgba(200,169,110,0.05), transparent 55%),
            #0c0c0e;
          display: flex; flex-direction: column; justify-content: center;
          padding: clamp(28px, 5vh, 56px) clamp(20px, 5vw, 64px);
          gap: 24px; overflow: hidden;
        }
        .board-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; flex-wrap: wrap; }
        .board-kicker { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; color: var(--accent); text-transform: uppercase; }
        .board-title { font-family: var(--font-display); font-weight: 400; font-size: clamp(26px, 4vw, 42px); color: #f0ede8; margin: 8px 0 4px; }
        .board-sub { font-family: Georgia, serif; font-style: italic; font-size: 14px; color: #8a8a8a; }
        .board-seeall { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); text-decoration: none; border: 1px solid rgba(200,169,110,0.4); padding: 10px 18px; white-space: nowrap; transition: background 0.2s; }
        .board-seeall:hover { background: rgba(200,169,110,0.12); }

        .board-podium { display: grid; grid-template-columns: 1.3fr 1fr; gap: 18px; align-items: start; }
        .board-mids { display: grid; grid-auto-rows: 1fr; gap: 18px; }

        :global(.bp-card) {
          display: flex; background: rgba(18,18,20,0.9); border: 1px solid; border-radius: 4px;
          overflow: hidden; text-decoration: none; transition: transform 0.25s, border-color 0.25s;
        }
        :global(.bp-card:hover) { transform: translateY(-3px); }
        :global(.bp-hero) { flex-direction: column; min-height: 360px; }
        :global(.bp-mid) { flex-direction: row; min-height: 171px; }
        :global(.bp-photo) { position: relative; background: #161616; background-size: cover; background-position: center; flex-shrink: 0; }
        :global(.bp-hero .bp-photo) { width: 100%; height: 200px; }
        :global(.bp-mid .bp-photo) { width: 42%; min-width: 110px; }
        :global(.bp-rank) { position: absolute; top: 10px; left: 10px; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.1em; padding: 3px 9px; border: 1px solid; background: rgba(0,0,0,0.6); backdrop-filter: blur(6px); }
        :global(.bp-body) { padding: 16px; display: flex; flex-direction: column; flex: 1; min-width: 0; }
        :global(.bp-cat) { font-family: var(--font-mono); font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 6px; }
        :global(.bp-name) { font-family: Georgia, serif; color: #f0ede8; line-height: 1.25; }
        :global(.bp-hero .bp-name) { font-size: 24px; }
        :global(.bp-mid .bp-name) { font-size: 16px; }
        :global(.bp-loc) { font-family: var(--font-mono); font-size: 8px; letter-spacing: 0.1em; text-transform: uppercase; color: #666; margin-top: 4px; }
        :global(.bp-divider) { height: 1px; background: #222; margin: 12px 0; }
        :global(.bp-stats) { display: flex; gap: 18px; margin-bottom: auto; }
        :global(.bp-stat) { display: flex; flex-direction: column; }
        :global(.bp-num) { font-family: Georgia, serif; font-size: 18px; }
        :global(.bp-lbl) { font-family: var(--font-mono); font-size: 7px; letter-spacing: 0.15em; text-transform: uppercase; color: #555; }
        :global(.bp-cta) { font-family: var(--font-mono); font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase; color: #888; display: flex; justify-content: space-between; margin-top: 14px; padding-top: 10px; border-top: 1px solid #1a1a1a; }
        :global(.bp-card:hover .bp-cta) { color: var(--accent); }

        .board-rest-wrap { flex-shrink: 0; }
        .board-rest-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.2em; color: #555; text-transform: uppercase; margin-bottom: 10px; }
        .board-rest { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: none; }
        .board-rest::-webkit-scrollbar { display: none; }
        :global(.bp-mini) { flex-direction: column; width: 150px; flex: 0 0 auto; }
        :global(.bp-mini .bp-photo) { width: 100%; height: 72px; }
        :global(.bp-mini .bp-body) { padding: 10px; }
        :global(.bp-mini .bp-name) { font-size: 13px; }
        :global(.bp-mini .bp-rank) { font-size: 9px; padding: 2px 7px; }
        :global(.bp-mini-stat) { font-family: var(--font-mono); font-size: 9px; color: #555; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 8px; }
        :global(.bp-mini-stat span) { font-family: Georgia, serif; font-size: 13px; }

        @media (max-width: 900px) {
          .board-podium { grid-template-columns: 1fr; }
          .board-mids { grid-template-rows: none; grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 600px) {
          .board-mids { grid-template-columns: 1fr; }
          :global(.bp-mid) { flex-direction: column; }
          :global(.bp-mid .bp-photo) { width: 100%; height: 120px; }
        }
      `}</style>
    </div>
  );
}
