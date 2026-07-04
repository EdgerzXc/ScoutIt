"use client";

import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";

export default function GeoPricingGauge({ location, category, price }) {
  const [debouncedLocation] = useDebounce(location, 1500);
  const [debouncedPrice] = useDebounce(price, 1500);
  
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!debouncedLocation || !debouncedPrice || !category) {
      setInsight(null);
      return;
    }

    const fetchInsight = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/geo-pricing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: debouncedLocation,
            category: category,
            price: debouncedPrice
          }),
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch pricing insight");
        }

        setInsight(data);
      } catch (err) {
        console.error("GeoPricing error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, [debouncedLocation, debouncedPrice, category]);

  if (!debouncedLocation || !debouncedPrice || !category) {
    return null;
  }

  return (
    <div className="geo-pricing-gauge">
      <div className="gauge-header">
        <span className="scoutit-badge">SCOUTIT INTELLIGENCE</span>
        {loading && <span className="loading-pulse">Analyzing Market...</span>}
      </div>
      
      {!loading && error && (
        <div className="insight-content error">
          <p>⚠️ {error}</p>
        </div>
      )}

      {!loading && !error && insight && (
        <div className="insight-content">
          {insight.compsFound === 0 ? (
            <p>No similar properties found within 1.5km to compare.</p>
          ) : (
            <>
              <div className="insight-metrics">
                <div className="metric-box">
                  <span className="metric-label">Comps within 1.5km</span>
                  <span className="metric-value tabular-nums">{insight.compsFound}</span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Market Avg</span>
                  <span className="metric-value tabular-nums">₱{Math.round(insight.averagePrice).toLocaleString()}</span>
                </div>
              </div>

              <div className={`verdict-banner ${getVerdictClass(insight.percentageDiff)}`}>
                {getVerdictMessage(insight.percentageDiff)}
              </div>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        .geo-pricing-gauge {
          background: rgba(18, 18, 18, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(232, 174, 60, 0.2);
          border-radius: 8px;
          padding: 16px;
          margin-top: 12px;
          margin-bottom: 24px;
          color: #fff;
          font-family: var(--font-sans, sans-serif);
          transition: all 0.3s ease;
        }

        .gauge-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .scoutit-badge {
          font-family: var(--font-mono, monospace);
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          color: var(--accent, #E8AE3C);
          text-transform: uppercase;
          border: 1px solid var(--accent-muted, #6E531A);
          padding: 4px 8px;
          border-radius: 4px;
        }

        .loading-pulse {
          font-size: 0.8rem;
          color: #aaa;
          animation: pulse 1.5s infinite ease-in-out;
        }

        .insight-metrics {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
        }

        .metric-box {
          display: flex;
          flex-direction: column;
        }

        .metric-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          color: #888;
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 1.1rem;
          font-weight: 600;
          color: #fff;
        }

        .verdict-banner {
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .verdict-green {
          background: rgba(46, 204, 113, 0.1);
          color: #2ecc71;
          border-left: 3px solid #2ecc71;
        }

        .verdict-yellow {
          background: rgba(247, 198, 78, 0.1);
          color: var(--accent-bright, #F7C64E);
          border-left: 3px solid var(--accent, #E8AE3C);
        }

        .verdict-red {
          background: rgba(231, 76, 60, 0.1);
          color: #e74c3c;
          border-left: 3px solid #e74c3c;
        }

        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

function getVerdictClass(diff) {
  if (diff < -5) return "verdict-green";
  if (diff > 5) return "verdict-red";
  return "verdict-yellow";
}

function getVerdictMessage(diff) {
  const absDiff = Math.abs(Math.round(diff));
  if (diff < -5) {
    return `Highly Competitive — Priced ${absDiff}% below local market average.`;
  }
  if (diff > 5) {
    return `Premium Pricing — Priced ${absDiff}% above local market average.`;
  }
  return `At Market Average — Within ${absDiff}% of similar local properties.`;
}
