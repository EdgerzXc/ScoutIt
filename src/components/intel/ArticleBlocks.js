// Renders the universal article block array (see src/lib/articleSchema.js).
// Every Intel article — legacy 3-paragraph ones and uploaded PDF/CSV ones —
// flows through this single reader, tuned for mobile readability first:
// 17px serif body, comfortable measure, tables scroll inside their own rail.

export default function ArticleBlocks({ blocks }) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="article-blocks">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "heading":
            return block.level === 3 ? (
              <h3 key={idx} className="ab-h3">{block.text}</h3>
            ) : (
              <h2 key={idx} className="ab-h2">{block.text}</h2>
            );
          case "paragraph":
            return <p key={idx} className="ab-p">{block.text}</p>;
          case "quote":
            return (
              <blockquote key={idx} className="ab-quote">
                <p>{block.text}</p>
                {block.cite && <cite>— {block.cite}</cite>}
              </blockquote>
            );
          case "list":
            return block.style === "number" ? (
              <ol key={idx} className="ab-list">
                {block.items.map((item, i) => <li key={i}>{item}</li>)}
              </ol>
            ) : (
              <ul key={idx} className="ab-list">
                {block.items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            );
          case "table":
            return (
              <div key={idx} className="ab-table-rail">
                <table className="ab-table">
                  <thead>
                    <tr>{block.headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r}>{row.map((cell, c) => <td key={c}>{cell}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "stat":
            return (
              <div key={idx} className="ab-stat">
                <span className="ab-stat-value">{block.value}</span>
                <span className="ab-stat-label">{block.label}</span>
                {block.detail && <span className="ab-stat-detail">{block.detail}</span>}
              </div>
            );
          case "callout":
            return (
              <aside key={idx} className="ab-callout">
                {block.label && <span className="ab-callout-label">{block.label}</span>}
                <p>{block.text}</p>
              </aside>
            );
          case "image":
            return (
              <figure key={idx} className="ab-figure">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={block.url} alt={block.caption || ""} loading="lazy" />
                {block.caption && <figcaption>{block.caption}</figcaption>}
              </figure>
            );
          case "divider":
            return <hr key={idx} className="ab-divider" />;
          default:
            return null;
        }
      })}

      <style>{`
        .article-blocks {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .ab-h2 {
          font-family: var(--font-display);
          font-size: clamp(22px, 4.5vw, 28px);
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.3;
          margin-top: 18px;
        }

        .ab-h3 {
          font-family: var(--font-display);
          font-size: clamp(18px, 4vw, 22px);
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.35;
          margin-top: 10px;
        }

        .ab-p {
          font-size: clamp(16px, 2vw, 17px);
          line-height: 1.85;
          color: var(--text-secondary);
        }

        .ab-quote {
          border-left: 3px solid var(--accent);
          padding: 4px 0 4px 20px;
          margin: 8px 0;
        }
        .ab-quote p {
          font-family: var(--font-display);
          font-size: clamp(17px, 2.4vw, 20px);
          font-style: italic;
          line-height: 1.6;
          color: var(--text-primary);
        }
        .ab-quote cite {
          display: block;
          margin-top: 10px;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--accent);
          font-style: normal;
        }

        .ab-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-left: 22px;
        }
        .ab-list li {
          font-size: clamp(16px, 2vw, 17px);
          line-height: 1.7;
          color: var(--text-secondary);
        }
        .ab-list li::marker { color: var(--accent); }

        /* Tables scroll inside their own rail — the page never scrolls sideways */
        .ab-table-rail {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border: 1px solid var(--border-solid, #262626);
          border-radius: var(--radius-lg);
          background: rgba(255, 255, 255, 0.02);
        }
        .ab-table {
          width: 100%;
          min-width: 480px;
          border-collapse: collapse;
          font-size: 13px;
        }
        .ab-table th {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--accent);
          text-align: left;
          padding: 12px 14px;
          border-bottom: 1px solid var(--border-solid, #262626);
          white-space: nowrap;
        }
        .ab-table td {
          padding: 11px 14px;
          color: var(--text-secondary);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          line-height: 1.5;
        }
        .ab-table tr:last-child td { border-bottom: none; }

        .ab-stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 20px 24px;
          border: 1px solid rgba(232, 174, 60, 0.25);
          border-radius: var(--radius-lg);
          background: rgba(232, 174, 60, 0.05);
        }
        .ab-stat-value {
          font-family: var(--font-display);
          font-size: clamp(28px, 6vw, 38px);
          color: var(--accent);
          line-height: 1.1;
        }
        .ab-stat-label {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-primary);
        }
        .ab-stat-detail {
          font-size: 13px;
          line-height: 1.5;
          color: var(--text-secondary);
        }

        .ab-callout {
          border: 1px solid rgba(232, 174, 60, 0.3);
          border-left: 3px solid var(--accent);
          border-radius: var(--radius-sm);
          padding: 16px 20px;
          background: rgba(232, 174, 60, 0.06);
        }
        .ab-callout-label {
          display: block;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 6px;
          font-weight: 700;
        }
        .ab-callout p {
          font-size: 14px;
          line-height: 1.65;
          color: var(--text-primary);
          margin: 0;
        }

        .ab-figure { margin: 8px 0; }
        .ab-figure img {
          width: 100%;
          height: auto;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-solid, #262626);
        }
        .ab-figure figcaption {
          margin-top: 8px;
          font-size: 12px;
          color: var(--text-muted);
          text-align: center;
        }

        .ab-divider {
          border: none;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(232, 174, 60, 0.35), transparent);
          margin: 12px 0;
        }
      `}</style>
    </div>
  );
}
