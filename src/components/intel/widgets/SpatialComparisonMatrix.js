"use client";

import { BarChart3, Sparkles, ShieldCheck, Layers } from "lucide-react";

/**
 * SpatialComparisonMatrix — Side-by-side district benchmark comparison matrix (A-195).
 * Compares rates, efficiency, and engineering redundancy against neighboring benchmark developments.
 */
export default function SpatialComparisonMatrix({
  title = "District Benchmark Comparison",
  benchmarkCategory = "Prime Commercial & Residential Towers",
  items = [],
}) {
  if (!items || items.length < 2) return null;

  return (
    <div
      className="my-6 rounded-xl border border-gold-accent/25 bg-surface-alt/90 p-5 sm:p-6 backdrop-blur-md shadow-lg"
      role="region"
      aria-label="District Comparison Matrix"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-variant/80 pb-4 mb-4">
        <div>
          <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-gold-accent font-semibold flex items-center gap-1.5 mb-1">
            <BarChart3 className="w-3.5 h-3.5" />
            MICRO-DISTRICT BENCHMARK ANALYSIS
          </span>
          <h3 className="font-serif text-lg sm:text-xl text-text-primary m-0 font-normal">
            {title}
          </h3>
          <span className="font-mono text-[12px] text-text-tertiary block mt-0.5">
            Category: <strong className="text-text-secondary">{benchmarkCategory}</strong>
          </span>
        </div>

        <span className="font-mono text-[12px] text-text-secondary bg-black/40 border border-surface-variant px-2.5 py-1 rounded shrink-0">
          COMPARING <strong className="text-gold-accent">{items.length}</strong> ASSETS
        </span>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5" role="list" aria-label="Comparison Developments">
        {items.map((item, idx) => {
          const isSubject = idx === 0 || (item.badge || "").toLowerCase().includes("subject");

          return (
            <div
              key={idx}
              role="listitem"
              className={`p-4 rounded-lg border flex flex-col justify-between ${
                isSubject
                  ? "bg-gold-accent/10 border-gold-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.06)]"
                  : "bg-black/35 border-surface-variant"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`font-mono text-[12px] px-2 py-0.5 rounded border uppercase ${
                      isSubject
                        ? "text-gold-accent border-gold-accent/40 bg-gold-accent/15 font-semibold"
                        : "text-text-tertiary border-surface-variant bg-surface"
                    }`}
                  >
                    {item.badge || (isSubject ? "SUBJECT PROPERTY" : "BENCHMARK")}
                  </span>
                  {item.yearBuilt ? (
                    <span className="font-mono text-[12px] text-text-tertiary">
                      {item.yearBuilt}
                    </span>
                  ) : null}
                </div>

                <h4 className="font-serif text-base text-text-primary m-0 mb-1 font-medium">
                  {item.name}
                </h4>

                {item.developer ? (
                  <span className="font-mono text-[12px] text-text-secondary block mb-3">
                    DEV: {item.developer}
                  </span>
                ) : null}

                {/* Metrics List */}
                <div className="space-y-2 border-t border-surface-variant/60 pt-3 mt-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-text-secondary">Indicative Rate:</span>
                    <strong className="text-gold-accent font-semibold">{item.ratePerSqm}</strong>
                  </div>

                  {item.efficiency ? (
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-text-secondary flex items-center gap-1">
                        <Layers className="w-3 h-3 text-text-tertiary" />
                        Efficiency:
                      </span>
                      <span className="text-text-primary">{item.efficiency}</span>
                    </div>
                  ) : null}

                  {item.power ? (
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-text-secondary flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-text-tertiary" />
                        Power Backup:
                      </span>
                      <span className="text-text-primary">{item.power}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {isSubject ? (
                <div className="mt-3 pt-2 border-t border-gold-accent/20 flex items-center gap-1.5 text-gold-accent font-mono text-[12px]">
                  <Sparkles className="w-3 h-3" />
                  <span>Targeted Architectural Highlight</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
