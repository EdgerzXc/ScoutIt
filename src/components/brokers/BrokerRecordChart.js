import { buildRecordChart, ENCODINGS } from "@/lib/brokerRecordChart";

/**
 * A-037 — the at-a-glance ScoutIt Record, shown beside the advisor's identity.
 *
 * A dumb renderer. Every decision about what may be drawn is made in
 * `buildRecordChart`, which is unit-tested; this file only paints the model.
 *
 * The marks are CSS rather than SVG deliberately: at this size a viewBox would
 * scale hairlines and 12px labels into blur, while a flexed track stays crisp
 * and fluid from 320px to desktop.
 *
 * The bars are `aria-hidden` because every value they encode is already present
 * as text beside them. A screen reader gets the figure, not a description of a
 * rectangle, and identity is never carried by colour alone.
 */
function Row({ row }) {
  if (row.encoding === ENCODINGS.ABSENT) {
    return (
      <div className="record-chart-row record-chart-row--absent">
        <span className="record-chart-label">{row.label}</span>
        <span className="record-chart-absent">{row.note}</span>
      </div>
    );
  }

  return (
    <div className="record-chart-row">
      <span className="record-chart-label">{row.label}</span>

      <span className="record-chart-value">
        {/* The figure is its own element so a two-word value ("26 min") cannot
            be broken across lines by the context text sharing its row. */}
        <span className="record-chart-figure">{row.display}</span>
        {row.context && <small className="record-chart-context">{row.context}</small>}
      </span>

      {row.encoding === ENCODINGS.METER && (
        <span className="record-chart-track" aria-hidden="true">
          <span className="record-chart-fill" style={{ inlineSize: `${row.fill * 100}%` }} />
        </span>
      )}

      {row.encoding === ENCODINGS.UNITS && (
        <span className="record-chart-ticks" aria-hidden="true">
          {Array.from({ length: row.ticks }, (_, i) => (
            <span key={i} className="record-chart-tick" />
          ))}
          {row.overflowCount > 0 && (
            <span className="record-chart-tick-overflow">+{row.overflowCount}</span>
          )}
        </span>
      )}
    </div>
  );
}

export default function BrokerRecordChart({ record }) {
  const chart = buildRecordChart(record);

  // Nothing truthful to draw. The detail panel already states why in words, and
  // an empty instrument would look more authoritative than that sentence.
  if (!chart.hasChart) return null;

  return (
    <aside className="record-chart" aria-labelledby="record-chart-heading">
      <h2 id="record-chart-heading" className="record-chart-heading">
        ScoutIt Record
      </h2>

      <div className="record-chart-rows">
        {chart.rows.map((row) => (
          <Row key={row.key} row={row} />
        ))}
      </div>

      <p className="record-chart-foot">Measured on ScoutIt activity only</p>
    </aside>
  );
}
