"use client";

import React, { useState } from "react";
import {
  ArrowDown, ChevronRight, Zap, Shield, CheckCircle2,
  AlertCircle, RotateCcw, ExternalLink, HelpCircle, Code,
  Eye, Info, Sparkles, Database, FileText, LogIn, Cpu
} from "lucide-react";
import { buildNodeLogicStages, humanizeNode } from "@/lib/flow/flowHumanizer";

function getStageIcon(kind, size = 13) {
  switch (kind) {
    case "trigger":
      return <LogIn size={size} className="text-sky-400 shrink-0" />;
    case "rules":
      return <Shield size={size} className="text-purple-400 shrink-0" />;
    case "execution":
      return <Cpu size={size} className="text-emerald-400 shrink-0" />;
    case "output":
      return <ArrowDown size={size} className="text-amber-400 shrink-0" />;
    case "recovery":
      return <AlertCircle size={size} className="text-rose-400 shrink-0" />;
    default:
      return <Code size={size} className="text-white/60 shrink-0" />;
  }
}

/**
 * NodeLogicDiagram
 *
 * Interactive visual logic diagram rendered for any selected node in the Master Flow Graph.
 * Visualizes the 5 logic stages:
 *  1. Trigger / Incoming Input
 *  2. Permissions & Rules Gate
 *  3. Core Action & Systems Execution
 *  4. Success Output & Next Steps
 *  5. Exception Handling & Recovery Playbook
 *
 * Explains how each node works in detailed, simple words with interactive stage selection.
 */
export default function NodeLogicDiagram({
  node,
  nodeMap,
  onNavigateToNode,
  onSimulateFault,
  isFaulted = false,
  isBlastRadius = false
}) {
  const [selectedStageId, setSelectedStageId] = useState("execution");
  const [viewMode, setViewMode] = useState("simple"); // "simple" (humanized) | "technical" (dev blueprint)

  if (!node) return null;

  const humanDossier = humanizeNode(node, nodeMap);
  const stages = buildNodeLogicStages(node, nodeMap);
  const activeStage = stages.find(s => s.id === selectedStageId) || stages[2] || stages[0];

  return (
    <div className="rounded-2xl border border-white/15 bg-[#10101c]/90 p-3.5 space-y-3.5 backdrop-blur-md shadow-xl text-white">
      {/* Header & Mode Switcher */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <Zap size={14} className="text-[var(--accent)] shrink-0" />
          <div>
            <h4 className="text-xs font-mono uppercase font-bold tracking-wider text-[var(--accent)]">
              Logic Blueprint
            </h4>
            <span className="text-[12px] text-white/60 block">
              Step-by-step logic breakdown for this node
            </span>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center p-0.5 rounded-lg bg-black/60 border border-white/15 text-[12px] font-mono">
          <button
            onClick={() => setViewMode("simple")}
            className={`px-2 py-1 rounded transition flex items-center gap-1 font-semibold ${
              viewMode === "simple"
                ? "bg-[var(--accent)] text-black font-bold shadow-sm"
                : "text-white/70 hover:text-white"
            }`}
          >
            <Eye size={12} />
            <span>Simple</span>
          </button>
          <button
            onClick={() => setViewMode("technical")}
            className={`px-2 py-1 rounded transition flex items-center gap-1 font-semibold ${
              viewMode === "technical"
                ? "bg-[var(--accent)] text-black font-bold shadow-sm"
                : "text-white/70 hover:text-white"
            }`}
          >
            <Code size={12} />
            <span>Blueprint</span>
          </button>
        </div>
      </div>

      {/* Humanized Plain English Summary */}
      <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
        <div className="flex items-center gap-1.5 text-[12px] font-mono uppercase text-[var(--accent)] font-bold">
          <Sparkles size={13} />
          <span>In Plain Words:</span>
        </div>
        <p className="text-[12px] text-white/90 leading-relaxed font-normal">
          {humanDossier.plainSummary}
        </p>
        <p className="text-[12px] text-white/60 leading-normal italic pt-0.5">
          Why it matters: {humanDossier.whyItMatters}
        </p>
      </div>

      {/* Interactive Visual Logic Flow Pipeline */}
      <div className="space-y-1.5">
        <span className="text-[12px] font-mono uppercase text-white/70 font-bold block">
          Interactive Logic Flow (Click any stage below to inspect):
        </span>

        <div className="grid grid-cols-1 gap-1.5">
          {stages.map((stage) => {
            const isSelected = stage.id === selectedStageId;
            const isFailureStage = stage.id === "recovery";

            let stageBadgeBg = "bg-white/10 text-white/80 border-white/20";
            if (stage.id === "trigger") stageBadgeBg = "bg-sky-500/20 text-sky-200 border-sky-500/40";
            if (stage.id === "rules") stageBadgeBg = "bg-purple-500/20 text-purple-200 border-purple-500/40";
            if (stage.id === "execution") stageBadgeBg = "bg-emerald-500/20 text-emerald-200 border-emerald-500/40";
            if (stage.id === "output") stageBadgeBg = "bg-amber-500/20 text-amber-200 border-amber-500/40";
            if (stage.id === "recovery") stageBadgeBg = "bg-rose-500/20 text-rose-200 border-rose-500/40";

            return (
              <button
                key={stage.id}
                onClick={() => setSelectedStageId(stage.id)}
                className={`w-full text-left p-2 rounded-xl border transition flex items-center justify-between text-[12px] ${
                  isSelected
                    ? "bg-[var(--accent)]/15 border-[var(--accent)] shadow-[0_0_15px_rgba(232,174,60,0.2)]"
                    : "bg-black/30 border-white/10 hover:border-white/30 hover:bg-black/50"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getStageIcon(stage.iconKind, 14)}
                  <div className="min-w-0">
                    <span className="font-mono text-[12px] font-bold text-white block truncate">
                      {stage.stepNumber}. {stage.title}
                    </span>
                    <span className="text-[12px] text-white/60 truncate block">
                      {stage.simpleExplanation.slice(0, 48)}...
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className={`px-1.5 py-0.5 rounded text-[12px] font-mono border ${stageBadgeBg}`}>
                    {stage.badge}
                  </span>
                  <ChevronRight size={13} className={isSelected ? "text-[var(--accent)]" : "text-white/70"} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expanded Active Stage Detail Inspector */}
      {activeStage && (
        <div className="p-3 rounded-xl bg-black/60 border border-[var(--accent)]/40 space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              {getStageIcon(activeStage.iconKind, 14)}
              <strong className="text-xs font-mono font-bold uppercase text-[var(--accent)]">
                Stage {activeStage.stepNumber}: {activeStage.title}
              </strong>
            </div>
            <span className="text-[12px] font-mono text-white/60">
              {activeStage.badge}
            </span>
          </div>

          {/* Simple View vs Technical Blueprint */}
          {viewMode === "simple" ? (
            <div className="space-y-2 text-[12px]">
              <p className="text-white/90 leading-relaxed font-normal">
                {activeStage.simpleExplanation}
              </p>

              {/* Navigation links to upstream/downstream nodes */}
              {activeStage.id === "trigger" && activeStage.technicalDetails.parentNodes.length > 0 && (
                <div className="pt-1 space-y-1">
                  <span className="text-[12px] font-mono text-sky-300 uppercase block font-semibold">
                    Jump to Previous Step:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {activeStage.technicalDetails.parentNodes.map(p => (
                      <button
                        key={p.id}
                        onClick={() => onNavigateToNode && onNavigateToNode(p.id)}
                        className="px-2 py-0.5 rounded bg-sky-950/60 border border-sky-500/40 hover:border-sky-300 text-sky-200 text-[12px] font-mono transition"
                      >
                        [Upstream] {p.name || p.id}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeStage.id === "output" && activeStage.technicalDetails.childNodes.length > 0 && (
                <div className="pt-1 space-y-1">
                  <span className="text-[12px] font-mono text-emerald-300 uppercase block font-semibold">
                    Jump to Next Step:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {activeStage.technicalDetails.childNodes.map(c => (
                      <button
                        key={c.id}
                        onClick={() => onNavigateToNode && onNavigateToNode(c.id)}
                        className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 hover:border-emerald-300 text-emerald-200 text-[12px] font-mono transition"
                      >
                        [Downstream] {c.name || c.id}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recovery Action Button */}
              {activeStage.id === "recovery" && onSimulateFault && (
                <div className="pt-1">
                  <button
                    onClick={() => onSimulateFault(node.id)}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/60 text-red-200 font-mono text-[12px] font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <AlertCircle size={13} />
                    <span>{isFaulted ? "Clear Injected Fault Signal" : "Test Fault Signal On This Node"}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Technical Blueprint View */
            <div className="space-y-1.5 text-[12px] font-mono">
              <div className="bg-black/50 p-2 rounded-lg border border-white/10 space-y-1 text-white/80">
                <div>
                  <span className="text-white/70">Node ID:</span> <span className="text-[var(--accent)]">{node.id}</span>
                </div>
                <div>
                  <span className="text-white/70">Route:</span> <span className="text-white">{node.route || "N/A"}</span>
                </div>
                <div>
                  <span className="text-white/70">Database:</span> <span className="text-white">{node.database || "None"}</span>
                </div>
                <div>
                  <span className="text-white/70">Auth Gate:</span> <span className="text-white">{node.auth || "Public"}</span>
                </div>
                {node.systems?.length > 0 && (
                  <div>
                    <span className="text-white/70">Systems:</span>
                    <div className="text-[12px] text-white/80 pl-2">
                      {node.systems.map((s, i) => <div key={i}>• {s}</div>)}
                    </div>
                  </div>
                )}
                <div className="pt-1 text-[12px] text-white/60">
                  Data boundary: {humanDossier.dataSafety}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
