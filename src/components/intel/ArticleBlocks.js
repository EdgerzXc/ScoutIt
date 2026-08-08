import "./article-blocks.css";
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

    </div>
  );
}
