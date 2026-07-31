"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// A6 — real time-series charts with a Daily / Weekly / Monthly toggle.
// The server page ships raw event timestamps (serializable); bucketing
// happens here so the toggle is instant with no server round-trip.
//
// series: {
//   properties: string[]            (created_at ISO)
//   connects:  {t: string, amount: number}[]
//   actions:   string[]             (created_at ISO)
// }

const PERIODS = {
  daily: { label: "Daily", buckets: 14, ms: 24 * 60 * 60 * 1000 },
  weekly: { label: "Weekly", buckets: 12, ms: 7 * 24 * 60 * 60 * 1000 },
  monthly: { label: "Monthly", buckets: 12, ms: 30 * 24 * 60 * 60 * 1000 },
};

function bucketLabel(date, period) {
  if (period === "daily") {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  if (period === "weekly") {
    return `wk ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  }
  return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

function buildBuckets(period) {
  const { buckets, ms } = PERIODS[period];
  const now = Date.now();
  const out = [];
  for (let i = buckets - 1; i >= 0; i--) {
    const start = now - (i + 1) * ms;
    const end = now - i * ms;
    out.push({ start, end, name: bucketLabel(new Date(end), period) });
  }
  return out;
}

function bucketize(timestamps, period, weights = null) {
  const buckets = buildBuckets(period);
  const counts = buckets.map((b) => ({ name: b.name, value: 0 }));
  timestamps.forEach((t, idx) => {
    const time = new Date(t).getTime();
    if (Number.isNaN(time)) return;
    for (let i = 0; i < buckets.length; i++) {
      if (time >= buckets[i].start && time < buckets[i].end) {
        counts[i].value += weights ? Math.abs(weights[idx] || 0) : 1;
        break;
      }
    }
  });
  return counts;
}

const GOLD = "#E8AE3C";

function Chart({ title, data, unit }) {
  const isEmpty = data.every((d) => d.value === 0);
  return (
    <div className="bg-surface border border-line rounded-xl p-4">
      <div className="text-xs text-white/50 mb-3">{title}</div>
      {isEmpty ? (
        <div className="h-[180px] flex items-center justify-center text-xs text-white/30">
          No activity in this window yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(232,174,60,0.06)" }}
              contentStyle={{
                background: "#121212",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "rgba(255,255,255,0.6)" }}
              itemStyle={{ color: GOLD }}
              formatter={(value) => [`${value.toLocaleString()}${unit ? ` ${unit}` : ""}`, title]}
            />
            <Bar dataKey="value" fill={GOLD} radius={[3, 3, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function MetricsCharts({ series }) {
  const [period, setPeriod] = useState("daily");

  const charts = useMemo(
    () => ({
      properties: bucketize(series.properties, period),
      connects: bucketize(
        series.connects.map((c) => c.t),
        period,
        series.connects.map((c) => c.amount)
      ),
      actions: bucketize(series.actions, period),
    }),
    [series, period]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-white/50">Trends</div>
        <div className="flex gap-1 bg-surface border border-line rounded-lg p-1">
          {Object.entries(PERIODS).map(([key, p]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                period === key
                  ? "bg-[rgba(232,174,60,0.15)] text-[#F7C64E]"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <Chart title="Properties created" data={charts.properties} />
        <Chart title="Connects volume" data={charts.connects} unit="connects" />
        <Chart title="Staff actions" data={charts.actions} />
      </div>
    </div>
  );
}
