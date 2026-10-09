"use client";

import React, { useState, useEffect } from "react";
import {
  Flame, Radio, ShieldCheck, AlertCircle, ChevronDown, ChevronUp,
  RotateCcw, Target, X, Bell, Zap, Play, CheckCircle2, Activity
} from "lucide-react";
import {
  getActiveSignals, subscribeToSignals, recordSignal,
  acknowledgeSignal, removeSignal, clearAllSignals,
  computeSignalHealthSummary, createSignal
} from "@/lib/flow/incidentSignalHub";
import { INCIDENT_SCENARIOS } from "@/lib/flow/incidentSimulator";

/**
 * IncidentSignalBanner
 *
 * Real-time operational incident signal bar and dispatcher mounted atop the Master Flow Graph.
 * Ensures operators are immediately alerted whenever any part of ScoutIt is broken,
 * highlighting the exact faulted node, route, blast radius, and recovery playbook.
 */
export default function IncidentSignalBanner({
  nodeMap,
  activeFaultedNodeIds = [],
  onFocusNode,
  onTriggerScenario,
  onInjectCustomFault
}) {
  const [signals, setSignals] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [testNodeInput, setTestNodeInput] = useState("api_publish_listing");

  // Subscribe to real-time incident signals
  useEffect(() => {
    const unsubscribe = subscribeToSignals((updated) => {
      setSignals(updated);
    });
    return unsubscribe;
  }, []);

  const health = computeSignalHealthSummary(signals, nodeMap);
  const hasActiveSignals = health.activeCount > 0;
  const hasInjectedFaults = activeFaultedNodeIds.length > 0;
  const isAlarmActive = hasActiveSignals || hasInjectedFaults;

  const currentCriticalSignal = health.criticalSignal;

  const handleFireTestSignal = (targetId) => {
    const node = nodeMap.get(targetId);
    const newSig = createSignal({
      nodeId: targetId,
      error: `Simulated runtime failure on ${node?.name || targetId}`,
      severity: "CRITICAL",
      source: "manual_probe"
    });
    recordSignal(newSig);
    if (onInjectCustomFault) {
      onInjectCustomFault(targetId);
    }
    if (onFocusNode) {
      onFocusNode(targetId);
    }
  };

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 w-[96%] max-w-4xl transition-all duration-200">
      {/* Banner Strip */}
      <div
        className={`rounded-2xl border backdrop-blur-xl px-4 py-2.5 shadow-2xl flex items-center justify-between transition-all ${
          isAlarmActive
            ? "bg-[#20080d]/95 border-red-500/80 shadow-[0_0_35px_rgba(239,68,68,0.4)] text-white"
            : "bg-[#0c0c16]/90 border-white/20 text-white/90 hover:border-white/30"
        }`}
      >
        {/* Left: Status Indicator & Core Message */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 flex items-center">
            {isAlarmActive ? (
              <div className="relative">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping absolute" />
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center text-[12px] font-bold text-white relative">
                  !
                </span>
              </div>
            ) : (
              <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-[12px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                  isAlarmActive
                    ? "bg-red-500/25 border-red-500/60 text-red-200"
                    : "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                }`}
              >
                {isAlarmActive ? `SIGNAL ALERT (${signals.length || activeFaultedNodeIds.length} ACTIVE)` : "ALL SIGNALS NOMINAL"}
              </span>

              {isAlarmActive && currentCriticalSignal && (
                <span className="text-[12px] font-mono text-red-300 truncate font-semibold">
                  [{currentCriticalSignal.nodeName}]
                </span>
              )}
            </div>

            <p className="text-[12px] text-white/80 truncate mt-0.5">
              {isAlarmActive
                ? currentCriticalSignal
                  ? `${currentCriticalSignal.error} • ${health.affectedTotalCount} downstream steps severed`
                  : `${activeFaultedNodeIds.length} nodes currently faulted in topology`
                : "Continuous topology telemetry active across all 131 nodes and 252 connections."}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {/* Quick Focus Button if alarm is active */}
          {isAlarmActive && (currentCriticalSignal?.nodeId || activeFaultedNodeIds[0]) && (
            <button
              onClick={() => {
                const target = currentCriticalSignal?.nodeId || activeFaultedNodeIds[0];
                if (target && onFocusNode) onFocusNode(target);
              }}
              className="px-2.5 py-1 rounded-xl bg-red-500/30 hover:bg-red-500/50 border border-red-500 text-red-100 text-[12px] font-mono font-bold flex items-center gap-1.5 transition"
              title="Center camera on faulted node"
            >
              <Target size={13} className="text-red-300" />
              <span>Locate Fault</span>
            </button>
          )}

          {/* Toggle Panel Button */}
          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[12px] font-mono font-semibold flex items-center gap-1.5 transition"
          >
            <Activity size={13} className="text-[var(--accent)]" />
            <span>{isExpanded ? "Hide Controls" : "Signal Controls"}</span>
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Expanded Signal Dispatcher Drawer */}
      {isExpanded && (
        <div className="mt-2 rounded-2xl bg-[#0c0c16]/95 border border-white/20 backdrop-blur-2xl p-4 shadow-2xl text-white space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-white/15">
            <div className="flex items-center gap-2">
              <Radio size={15} className="text-[var(--accent)]" />
              <h4 className="text-xs font-mono uppercase font-bold text-white tracking-wider">
                Topological Signal Dispatcher & Outage Simulator
              </h4>
            </div>

            <div className="flex items-center gap-2">
              {signals.length > 0 && (
                <button
                  onClick={() => clearAllSignals()}
                  className="text-[12px] font-mono text-white/60 hover:text-white px-2 py-0.5 rounded border border-white/15 transition flex items-center gap-1"
                >
                  <RotateCcw size={11} />
                  <span>Clear All Signals</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Signals List */}
          {signals.length > 0 ? (
            <div className="space-y-2">
              <span className="text-[12px] font-mono uppercase text-red-300 font-bold block">
                Active Received Signals ({signals.length}):
              </span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {signals.map((sig) => (
                  <div
                    key={sig.id}
                    className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 flex items-start justify-between gap-2 text-[12px]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <strong className="text-white font-mono">{sig.nodeName}</strong>
                        <span className="text-[12px] font-mono text-red-300 bg-red-500/20 px-1.5 py-0.2 rounded border border-red-500/30">
                          {sig.severity}
                        </span>
                        <span className="text-[12px] text-white/70">{sig.formattedTime}</span>
                      </div>
                      <p className="text-white/80 mt-0.5">{sig.error}</p>
                      {sig.triageFile && (
                        <div className="text-[12px] font-mono text-amber-200/90 mt-1 truncate">
                          Triage: {sig.triageFile}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onFocusNode && onFocusNode(sig.nodeId)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[12px] flex items-center gap-1 border border-white/20"
                        title="Center node on graph"
                      >
                        <Target size={12} />
                        <span>Focus</span>
                      </button>
                      <button
                        onClick={() => removeSignal(sig.id)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-200 border border-white/10"
                        title="Dismiss signal"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-2 text-[12px] text-emerald-200">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              <span>No active error signals received. System health is nominal.</span>
            </div>
          )}

          {/* Outage Simulation & Test Trigger */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <span className="text-[12px] font-mono uppercase text-[var(--accent)] font-bold block">
              Test Outage Signals (Verify Instant Graph Localization):
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => {
                  if (onTriggerScenario) onTriggerScenario("CMS_BRIDGE_OUTAGE");
                  handleFireTestSignal("api_publish_listing");
                }}
                className="p-2 rounded-xl bg-black/50 border border-white/15 hover:border-red-500/60 hover:bg-red-950/30 text-left transition"
              >
                <strong className="block text-[12px] text-white">Dual-CMS Airtable 429</strong>
                <span className="text-[12px] text-white/60 block mt-0.5">Tests publish pipeline blockage</span>
              </button>

              <button
                onClick={() => {
                  if (onTriggerScenario) onTriggerScenario("AUTH_SESSION_QUARANTINE");
                  handleFireTestSignal("exc_bot_quarantine");
                }}
                className="p-2 rounded-xl bg-black/50 border border-white/15 hover:border-amber-500/60 hover:bg-amber-950/30 text-left transition"
              >
                <strong className="block text-[12px] text-white">Sentinel Bot Quarantine</strong>
                <span className="text-[12px] text-white/60 block mt-0.5">Tests edge traffic blocking</span>
              </button>

              <button
                onClick={() => {
                  if (onTriggerScenario) onTriggerScenario("CONNECTS_DEPLETED");
                  handleFireTestSignal("exc_insufficient_connects");
                }}
                className="p-2 rounded-xl bg-black/50 border border-white/15 hover:border-yellow-500/60 hover:bg-yellow-950/30 text-left transition"
              >
                <strong className="block text-[12px] text-white">Connects Wallet Empty</strong>
                <span className="text-[12px] text-white/60 block mt-0.5">Tests private deal room blocker</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
