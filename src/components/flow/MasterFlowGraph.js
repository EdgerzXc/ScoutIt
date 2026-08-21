"use client";

import React, {
  useState, useRef, useMemo, useCallback, useEffect, useLayoutEffect
} from "react";
import { useRouter } from "next/navigation";
import {
  Search, ZoomIn, ZoomOut, Crosshair, Eye, ArrowRight,
  ExternalLink, ChevronRight, ChevronLeft, X, Zap,
  AlertCircle, RotateCcw, CheckCircle2,
  Download, BookOpen, Layers, ShieldCheck, Compass, Sparkles,
  MapPin, Database, Sparkle, Link2, Shield, Lock, Activity, FileCode, Check
} from "lucide-react";
import { MASTER_FLOW_NODES, MASTER_FLOW_EDGES } from "@/data/masterFlowGraphData";
import {
  getRoleSubgraph,
  getWorkflowSubgraph,
  getLinearGuide,
  getRAGKnowledgeExport,
  getAtomicRAGChunks,
  exportSubgraphJSON,
  WORKFLOW_DEFINITIONS,
  LINEAR_GUIDE_DEFINITIONS
} from "@/lib/flow/subgraphExtractor";

// Enhanced card dimensions for maximum text readability and breathing room
const NODE_W = 320;
const NODE_H = 185;
const CULL_PAD = 340;

// High-contrast, polished category & type tokens (WCAG AAA compliant)
const TYPE_CONFIG = {
  ENTRY:     { color:"#F59E0B", bg:"rgba(245,158,11,0.16)", border:"rgba(245,158,11,0.70)", badgeBg:"rgba(245,158,11,0.25)", label:"Entrance",   icon:"🌐" },
  LAYER:     { color:"#F97316", bg:"rgba(249,115,22,0.16)", border:"rgba(249,115,22,0.70)", badgeBg:"rgba(249,115,22,0.25)", label:"Altitude",   icon:"🛰️" },
  PAGE:      { color:"#38BDF8", bg:"rgba(56,189,248,0.16)", border:"rgba(56,189,248,0.70)", badgeBg:"rgba(56,189,248,0.25)", label:"Page",       icon:"📄" },
  SECTION:   { color:"#818CF8", bg:"rgba(129,140,248,0.16)",border:"rgba(129,140,248,0.70)",badgeBg:"rgba(129,140,248,0.25)",label:"Section",    icon:"📑" },
  ACTION:    { color:"#10B981", bg:"rgba(16,185,129,0.16)", border:"rgba(16,185,129,0.70)", badgeBg:"rgba(16,185,129,0.25)", label:"Action",     icon:"⚡" },
  DECISION:  { color:"#C084FC", bg:"rgba(192,132,252,0.16)",border:"rgba(192,132,252,0.70)",badgeBg:"rgba(192,132,252,0.25)",label:"Decision",   icon:"⚖️" },
  GATE:      { color:"#EC4899", bg:"rgba(236,72,153,0.16)", border:"rgba(236,72,153,0.70)", badgeBg:"rgba(236,72,153,0.25)", label:"Gate",       icon:"🔒" },
  SYSTEM:    { color:"#60A5FA", bg:"rgba(96,165,250,0.16)", border:"rgba(96,165,250,0.70)", badgeBg:"rgba(96,165,250,0.25)", label:"System",     icon:"⚙️" },
  EXCEPTION: { color:"#FB923C", bg:"rgba(251,146,60,0.20)", border:"rgba(251,146,60,0.80)", badgeBg:"rgba(251,146,60,0.30)", label:"Exception",  icon:"⚠️" },
  RECOVERY:  { color:"#06B6D4", bg:"rgba(6,182,212,0.16)",  border:"rgba(6,182,212,0.70)",  badgeBg:"rgba(6,182,212,0.25)",  label:"Recovery",   icon:"🔄" },
  OUTCOME:   { color:"#F43F5E", bg:"rgba(244,63,94,0.16)",  border:"rgba(244,63,94,0.70)",  badgeBg:"rgba(244,63,94,0.25)",  label:"Outcome",    icon:"🏁" },
  TERMINAL:  { color:"#E11D48", bg:"rgba(225,29,72,0.20)",  border:"rgba(225,29,72,0.80)",  badgeBg:"rgba(225,29,72,0.30)",  label:"Terminal",   icon:"🛑" }
};

// Implementation Status token styling
const STATUS_CONFIG = {
  VERIFIED:     { color: "#10B981", bg: "rgba(16,185,129,0.18)", border: "rgba(16,185,129,0.60)", label: "Verified", icon: "🛡️" },
  PARTIAL:      { color: "#F59E0B", bg: "rgba(245,158,11,0.18)", border: "rgba(245,158,11,0.60)", label: "Partial", icon: "⚙️" },
  PLANNED:      { color: "#A855F7", bg: "rgba(168,85,247,0.18)", border: "rgba(168,85,247,0.60)", label: "Planned", icon: "⏳" },
  PROPOSED:     { color: "#818CF8", bg: "rgba(129,140,248,0.18)", border: "rgba(129,140,248,0.60)", label: "Proposed", icon: "💡" },
  CONTRADICTED: { color: "#EF4444", bg: "rgba(239,68,68,0.20)", border: "rgba(239,68,68,0.80)", label: "Conflict", icon: "⚠️" },
  DEPRECATED:   { color: "#64748B", bg: "rgba(100,116,139,0.20)", border: "rgba(100,116,139,0.60)", label: "Deprecated", icon: "📦" }
};

// High-contrast canvas edge colour tokens
const EC_DEFAULT   = "rgba(255,255,255,0.22)";
const EC_EXCEPTION = "rgba(251,146,60,0.65)";
const EC_HOVER     = "#818CF8";
const EC_SELECTED  = "#38BDF8";
const EC_FOCUS     = "#E8AE3C";
const EC_TRACE     = "#F59E0B";

// ── Memoized Node Card (Readable, High-Contrast Typography & Left Accent Border) ─
const MemoizedNodeCard = React.memo(function MemoizedNodeCard({
  node, pos, isSelected, isDimmed, isTraceActive, isFocusedBranch,
  onDragStart, onClick, onMouseEnter, onMouseLeave, onToggleFocus
}) {
  const tc = TYPE_CONFIG[node.nodeType || node.type] || TYPE_CONFIG.PAGE;
  const sc = STATUS_CONFIG[node.implementationStatus] || STATUS_CONFIG.VERIFIED;
  const isArch = node.category === "architecture";

  return (
    <div
      id={`node-${node.id}`}
      onPointerDown={(e) => onDragStart(e, node.id)}
      onClick={(e) => { e.stopPropagation(); onClick(node.id); }}
      onMouseEnter={() => onMouseEnter(node.id)}
      onMouseLeave={() => onMouseLeave(null)}
      className={`node-card absolute z-10 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all duration-150 select-none border-l-[5px] ${
        isSelected
          ? "ring-2 ring-[#E8AE3C] shadow-[0_0_35px_rgba(232,174,60,0.5)] z-20 bg-[#16162e] border-t border-r border-b border-[#E8AE3C]"
          : isTraceActive
          ? "ring-2 ring-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.45)] bg-[#15152a] border-t border-r border-b border-amber-400/80"
          : isDimmed
          ? "opacity-15 bg-[#090912] border-t border-r border-b border-white/5"
          : node.type === "EXCEPTION"
          ? "bg-[#1c131a] border-t border-r border-b border-orange-500/50 hover:border-orange-400 shadow-xl hover:shadow-orange-950/50"
          : "bg-[#111124] border-t border-r border-b border-white/20 hover:border-white/60 shadow-xl hover:shadow-black/80 hover:-translate-y-0.5"
      }`}
      style={{
        borderLeftColor: tc.color,
        transform: `translate3d(${pos.x}px,${pos.y}px,0)`,
        width: NODE_W,
        height: NODE_H,
        contain: "strict",
        willChange: "opacity, transform",
        boxShadow: isSelected
          ? "0 0 35px rgba(232,174,60,0.45), inset 0 1px 0 rgba(255,255,255,0.2)"
          : "0 10px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)"
      }}
    >
      {/* Incoming Connection Port */}
      {node.parents?.length > 0 && (
        <div
          className="absolute -left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-[#181832] border-2 border-white/50 text-[10.5px] font-mono font-bold text-white shadow-md"
          title={`${node.parents.length} incoming connections`}
        >
          {node.parents.length > 1 ? node.parents.length : "•"}
        </div>
      )}

      {/* Outgoing Connection Port */}
      {node.children?.length > 0 && (
        <div
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-[#181832] border-2 border-white/50 text-[10.5px] font-mono font-bold text-white shadow-md"
          title={`${node.children.length} outgoing paths`}
        >
          {node.children.length > 1 ? node.children.length : "•"}
        </div>
      )}

      {/* Header: Type Pill & Status Badge */}
      <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-white/10">
        <span
          className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border flex items-center gap-1.5 shadow-sm"
          style={{ color: tc.color, borderColor: tc.border, background: tc.badgeBg }}
        >
          <span>{tc.icon}</span>
          <span>{tc.label}</span>
        </span>
        <div className="flex items-center gap-1">
          <span
            className="text-[9.5px] font-mono uppercase px-1.5 py-0.5 rounded border flex items-center gap-1 font-semibold"
            style={{ color: sc.color, borderColor: sc.border, background: sc.bg }}
            title={`Implementation Status: ${sc.label}`}
          >
            <span>{sc.icon}</span>
            <span>{sc.label}</span>
          </span>
          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-white/80 font-semibold">
            {node.domain || (isArch ? "Arch" : "Flow")}
          </span>
        </div>
      </div>

      {/* Content: High-Legibility Title, Canonical ID & Description */}
      <div className="my-1 space-y-0.5 flex-1">
        <div className="flex items-center justify-between">
          <h4 className="text-[13px] font-bold text-white leading-snug line-clamp-1 tracking-tight">
            {node.name}
          </h4>
        </div>
        <span className="text-[9.5px] font-mono text-[#E8AE3C]/90 block truncate">
          {node.canonicalId || node.id}
        </span>
        <p className="text-[11px] text-white/85 leading-relaxed line-clamp-2 font-normal pt-0.5">
          {node.purpose || node.description}
        </p>
      </div>

      {/* Footer: Route indicator, Focus Button & In/Out Stats */}
      <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[10.5px] font-mono">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFocus(node.id); }}
          className={`px-2 py-0.5 rounded-md transition font-semibold text-[10.5px] ${
            isFocusedBranch
              ? "text-[#E8AE3C] font-bold bg-[#E8AE3C]/25 border border-[#E8AE3C]/60"
              : "text-white/70 hover:text-white hover:bg-white/15 border border-transparent"
          }`}
        >
          {isFocusedBranch ? "★ Focused" : "Focus Path"}
        </button>

        <div className="flex items-center gap-1.5 text-white/75 font-semibold">
          <span className="text-sky-300">{node.parents?.length || 0} in</span>
          <span>→</span>
          <span className="text-emerald-300">{node.children?.length || 0} out</span>
        </div>
      </div>
    </div>
  );
});

// ── Canvas Edge Drawing Hook ──────────────────────────────────────────────────
function useCanvasEdges({
  canvasEdgeRef, visibleEdges, nodeMap, positionsRef,
  hoveredNodeId, selectedNodeId, focusedNodeSet, tracePathSet
}) {
  const rafRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasEdgeRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let maxX = 5400, maxY = 5400;
    const pos = positionsRef.current;
    if (pos) {
      Object.values(pos).forEach(p => {
        if (p.x + NODE_W + 350 > maxX) maxX = p.x + NODE_W + 350;
        if (p.y + NODE_H + 350 > maxY) maxY = p.y + NODE_H + 350;
      });
    }

    if (canvas.width !== maxX || canvas.height !== maxY) {
      canvas.width  = maxX;
      canvas.height = maxY;
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    const hId  = hoveredNodeId;
    const sId  = selectedNodeId;
    const fSet = focusedNodeSet;
    const tSet = tracePathSet;

    const normal = [], highlight = [];
    for (let i = 0; i < visibleEdges.length; i++) {
      const e = visibleEdges[i];
      const isTrace = tSet && tSet.has(`${e.source}→${e.target}`);
      const isFocus = fSet && fSet.has(e.source) && fSet.has(e.target);
      const isSel   = (sId === e.source || sId === e.target);
      const isHov   = (hId === e.source || hId === e.target);
      if (isTrace || isFocus || isSel || isHov) highlight.push(e);
      else normal.push(e);
    }

    const drawEdge = (e, isHl) => {
      const sp = pos?.[e.source];
      const tp = pos?.[e.target];
      if (!sp || !tp) return;

      const sx = sp.x + NODE_W;
      const sy = sp.y + NODE_H / 2;
      const tx = tp.x;
      const ty = tp.y + NODE_H / 2;
      const dx = Math.abs(tx - sx) * 0.5;

      const isTrace = tSet && tSet.has(`${e.source}→${e.target}`);
      const isFocus = fSet && fSet.has(e.source) && fSet.has(e.target);
      const isSel   = (sId === e.source || sId === e.target);
      const isHov   = (hId === e.source || hId === e.target);

      let stroke = EC_DEFAULT, lw = 1.4, dash = false;
      if (isTrace)      { stroke = EC_TRACE;     lw = 3.4; }
      else if (isFocus) { stroke = EC_FOCUS;     lw = 2.8; }
      else if (isSel)   { stroke = EC_SELECTED;  lw = 2.4; }
      else if (isHov)   { stroke = EC_HOVER;     lw = 2.2; }
      else {
        // Semantic Edge Styling based on Edge Type
        if (e.type === "FAILURE" || e.type === "EXCEPTION") { stroke = EC_EXCEPTION; dash = true; lw = 1.6; }
        else if (e.type === "SUCCESS") { stroke = "#10B981"; lw = 1.8; }
        else if (e.type === "RECOVERY" || e.type === "RETRY") { stroke = "#06B6D4"; dash = true; lw = 1.8; }
        else if (e.type === "AUTH_GATE" || e.type === "PERMISSION_GATE") { stroke = "#F59E0B"; dash = true; lw = 1.8; }
        else if (e.type === "ACTION") { stroke = "#818CF8"; lw = 1.6; }
        else {
          const tn = nodeMap.get(e.target);
          if (tn?.type === "EXCEPTION") { stroke = EC_EXCEPTION; dash = true; lw = 1.6; }
        }
      }

      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = stroke;
      ctx.lineWidth   = lw;
      if (dash) ctx.setLineDash([5, 4]);
      ctx.moveTo(sx, sy);
      ctx.bezierCurveTo(sx + dx, sy, tx - dx, ty, tx, ty);
      ctx.stroke();

      if (isHl || isTrace || isFocus) {
        ctx.fillStyle = stroke;
        ctx.beginPath();
        ctx.arc(tx - 4, ty, isTrace ? 5.5 : 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    for (let i = 0; i < normal.length;    i++) drawEdge(normal[i], false);
    for (let i = 0; i < highlight.length; i++) drawEdge(highlight[i], true);
  }, [canvasEdgeRef, visibleEdges, nodeMap, positionsRef, hoveredNodeId, selectedNodeId, focusedNodeSet, tracePathSet]);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [draw]);
}

// ── Main Master Flow Component ────────────────────────────────────────────────
export default function MasterFlowGraph({ onNavigate }) {
  const router = useRouter();
  const containerRef   = useRef(null);
  const canvasLayerRef = useRef(null);
  const canvasEdgeRef  = useRef(null);

  // Position state with clean initial memory
  const initialPositions = useMemo(() => {
    const m = {};
    MASTER_FLOW_NODES.forEach(n => { m[n.id] = { x: n.x, y: n.y }; });
    return m;
  }, []);
  const positionsRef = useRef(initialPositions);
  const [positions, setPositions] = useState(initialPositions);

  // Viewport transformation
  const tRef = useRef({ x: 40, y: 40, scale: 0.65 });
  const [displayScale, setDisplayScale] = useState(0.65);
  const [viewportBounds, setViewportBounds] = useState({ left: -9999, top: -9999, right: 9999, bottom: 9999 });

  // Interaction refs
  const panningRef  = useRef(false);
  const panOrigin   = useRef({ x: 0, y: 0 });
  const dragNodeRef = useRef(null);
  const dragOff     = useRef({ x: 0, y: 0 });
  const rafPan      = useRef(null);
  const rafDrag     = useRef(null);

  // ── Slicing & Multi-Mode State ──────────────────────────────────────────────
  const [graphMode, setGraphMode] = useState("master"); // "master" | "role" | "workflow" | "guide"
  const [activeRole, setActiveRole] = useState("seeker");
  const [activeWorkflow, setActiveWorkflow] = useState("deal_room_lifecycle");
  const [activeGuideId, setActiveGuideId] = useState("buyer_guide");
  const [currentGuideStepIdx, setCurrentGuideStepIdx] = useState(0);

  // Filter State
  const [selectedNodeId,  setSelectedNodeId]  = useState("hero");
  const [hoveredNodeId,   setHoveredNodeId]   = useState(null);
  const [focusBranchId,   setFocusBranchId]   = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [categoryFilter,  setCategoryFilter]  = useState("all");
  const [statusFilter,    setStatusFilter]    = useState("all");
  const [domainFilter,    setDomainFilter]    = useState("all");
  const [searchQuery,     setSearchQuery]     = useState("");
  const [selectedRole,    setSelectedRole]    = useState("all");
  const [selectedType,    setSelectedType]    = useState("all");
  const [traceSourceId,   setTraceSourceId]   = useState("hero");
  const [traceTargetId,   setTraceTargetId]   = useState("terminal_handshake_success");
  const [activeTracePath, setActiveTracePath] = useState(null);
  const [exportNotice,    setExportNotice]    = useState(null);

  const nodeMap = useMemo(() => {
    const m = new Map();
    MASTER_FLOW_NODES.forEach(n => m.set(n.id, n));
    return m;
  }, []);
  const selectedNode = nodeMap.get(selectedNodeId) || MASTER_FLOW_NODES[0];

  // Memoize dropdown options
  const nodeOptions = useMemo(() =>
    MASTER_FLOW_NODES.map(n => <option key={n.id} value={n.id}>{n.name}</option>)
  , []);

  // Compute Active Subgraph based on graphMode
  const activeSlice = useMemo(() => {
    if (graphMode === "role") {
      return getRoleSubgraph(activeRole);
    }
    if (graphMode === "workflow") {
      return getWorkflowSubgraph(activeWorkflow);
    }
    if (graphMode === "guide") {
      const g = getLinearGuide(activeGuideId);
      const guideNodeIds = new Set(g.steps.map(s => s.nodeId));
      const gNodes = MASTER_FLOW_NODES.filter(n => guideNodeIds.has(n.id));
      const gEdges = MASTER_FLOW_EDGES.filter(e => guideNodeIds.has(e.source) && guideNodeIds.has(e.target));
      return { nodes: gNodes, edges: gEdges, guide: g };
    }
    return { nodes: MASTER_FLOW_NODES, edges: MASTER_FLOW_EDGES };
  }, [graphMode, activeRole, activeWorkflow, activeGuideId]);

  // Focus branch set
  const focusedNodeSet = useMemo(() => {
    if (!focusBranchId) return null;
    const s = new Set([focusBranchId]);
    const walk = (id, dir) => {
      const nd = nodeMap.get(id);
      if (!nd) return;
      (dir === "up" ? nd.parents : nd.children || []).forEach(pid => {
        if (!s.has(pid)) { s.add(pid); walk(pid, dir); }
      });
    };
    walk(focusBranchId, "up");
    walk(focusBranchId, "down");
    return s;
  }, [focusBranchId, nodeMap]);

  // Trace path set
  const tracePathSet = useMemo(() => {
    if (!activeTracePath || activeTracePath.length < 2) return null;
    const s = new Set();
    for (let i = 0; i < activeTracePath.length - 1; i++) {
      s.add(`${activeTracePath[i]}→${activeTracePath[i + 1]}`);
    }
    return s;
  }, [activeTracePath]);

  // BFS path tracer
  const runPathTracer = useCallback(() => {
    if (!traceSourceId || !traceTargetId || traceSourceId === traceTargetId) {
      setActiveTracePath(traceSourceId === traceTargetId ? [traceSourceId] : null);
      return;
    }
    const q = [[traceSourceId]], vis = new Set([traceSourceId]);
    while (q.length) {
      const path = q.shift();
      const cur  = path[path.length - 1];
      if (cur === traceTargetId) { setActiveTracePath(path); return; }
      (nodeMap.get(cur)?.children || []).forEach(cid => {
        if (!vis.has(cid)) { vis.add(cid); q.push([...path, cid]); }
      });
    }
    setActiveTracePath(null);
  }, [traceSourceId, traceTargetId, nodeMap]);

  // DOM-direct transform
  const applyDOM = useCallback(() => {
    const el = canvasLayerRef.current;
    if (!el) return;
    const { x, y, scale } = tRef.current;
    el.style.transform = `translate3d(${x}px,${y}px,0) scale(${scale})`;
  }, []);

  // Update viewport culling bounds
  const updateCull = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { x, y, scale } = tRef.current;
    setViewportBounds({
      left:   (-x - CULL_PAD) / scale,
      top:    (-y - CULL_PAD) / scale,
      right:  (-x + rect.width  + CULL_PAD) / scale,
      bottom: (-y + rect.height + CULL_PAD) / scale
    });
  }, []);

  useLayoutEffect(() => { applyDOM(); updateCull(); }, [applyDOM, updateCull]);

  // Pointer handlers
  const onPointerDown = useCallback((e) => {
    if (e.target.closest(".node-card,.graph-control-btn,select,input,button")) return;
    panningRef.current = true;
    panOrigin.current = { x: e.clientX - tRef.current.x, y: e.clientY - tRef.current.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    if (panningRef.current) {
      tRef.current = { ...tRef.current, x: e.clientX - panOrigin.current.x, y: e.clientY - panOrigin.current.y };
      if (!rafPan.current) {
        rafPan.current = requestAnimationFrame(() => { applyDOM(); rafPan.current = null; });
      }
    } else if (dragNodeRef.current) {
      const id = dragNodeRef.current, t = tRef.current;
      const nx = Math.round((e.clientX - t.x) / t.scale - dragOff.current.x);
      const ny = Math.round((e.clientY - t.y) / t.scale - dragOff.current.y);
      positionsRef.current = { ...positionsRef.current, [id]: { x: nx, y: ny } };
      if (!rafDrag.current) {
        rafDrag.current = requestAnimationFrame(() => {
          const card = document.getElementById(`node-${dragNodeRef.current}`);
          if (card) {
            const p = positionsRef.current[dragNodeRef.current];
            card.style.transform = `translate3d(${p.x}px,${p.y}px,0)`;
          }
          rafDrag.current = null;
        });
      }
    }
  }, [applyDOM]);

  const onPointerUp = useCallback((e) => {
    if (panningRef.current) {
      panningRef.current = false;
      setDisplayScale(tRef.current.scale);
      updateCull();
    }
    if (dragNodeRef.current) {
      dragNodeRef.current = null;
    }
  }, [updateCull]);

  // Wheel zoom
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    const newScale = Math.min(2.5, Math.max(0.15, tRef.current.scale * factor));
    const ratio = newScale / tRef.current.scale;
    tRef.current = {
      scale: newScale,
      x: mouseX - (mouseX - tRef.current.x) * ratio,
      y: mouseY - (mouseY - tRef.current.y) * ratio
    };
    applyDOM();
    setDisplayScale(newScale);
    updateCull();
  }, [applyDOM, updateCull]);

  const doZoom = useCallback((delta) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.width / 2, cy = rect.height / 2;
    const newScale = Math.min(2.5, Math.max(0.15, tRef.current.scale + delta));
    const ratio = newScale / tRef.current.scale;
    tRef.current = {
      scale: newScale,
      x: cx - (cx - tRef.current.x) * ratio,
      y: cy - (cy - tRef.current.y) * ratio
    };
    applyDOM();
    setDisplayScale(newScale);
    updateCull();
  }, [applyDOM, updateCull]);

  const resetView = useCallback(() => {
    tRef.current = { x: 40, y: 40, scale: 0.65 };
    applyDOM();
    setDisplayScale(0.65);
    updateCull();
  }, [applyDOM, updateCull]);

  const fitScreen = useCallback(() => {
    const nodes = activeSlice.nodes;
    if (!nodes.length) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(n => {
      const p = positionsRef.current[n.id] || { x: n.x, y: n.y };
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x + NODE_W > maxX) maxX = p.x + NODE_W;
      if (p.y + NODE_H > maxY) maxY = p.y + NODE_H;
    });
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const gw = maxX - minX + 160, gh = maxY - minY + 160;
    const s = Math.min(rect.width / gw, rect.height / gh, 1.2);
    tRef.current = { scale: s, x: (rect.width - gw * s) / 2 - minX * s + 80 * s, y: (rect.height - gh * s) / 2 - minY * s + 80 * s };
    applyDOM();
    setDisplayScale(s);
    updateCull();
  }, [activeSlice.nodes, applyDOM, updateCull]);

  const resetEntireLayout = useCallback(() => {
    const m = {};
    MASTER_FLOW_NODES.forEach(n => { m[n.id] = { x: n.x, y: n.y }; });
    positionsRef.current = m;
    setPositions(m);

    tRef.current = { x: 40, y: 40, scale: 0.65 };
    applyDOM();
    setDisplayScale(0.65);
    updateCull();

    setFocusBranchId(null);
    setActiveTracePath(null);
    setSearchQuery("");
    setSelectedRole("all");
    setSelectedType("all");
    setCategoryFilter("all");
    setStatusFilter("all");
    setDomainFilter("all");
    setSelectedNodeId("hero");

    setExportNotice("✨ All nodes & canvas reset to original placement");
    setTimeout(() => setExportNotice(null), 3000);
  }, [applyDOM, updateCull]);

  const centerOnNode = useCallback((nodeId) => {
    const p = positionsRef.current[nodeId];
    if (!p || !containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    const s = tRef.current.scale;
    tRef.current = { ...tRef.current, x: r.width / 2 - (p.x + NODE_W / 2) * s, y: r.height / 2 - (p.y + NODE_H / 2) * s };
    applyDOM(); setDisplayScale(s); updateCull(); setSelectedNodeId(nodeId);
  }, [applyDOM, updateCull]);

  const handleNodeDragStart = useCallback((e, nodeId) => {
    e.stopPropagation(); setSelectedNodeId(nodeId); dragNodeRef.current = nodeId;
    const p = positionsRef.current[nodeId]; if (!p) return;
    const t = tRef.current;
    dragOff.current = { x: (e.clientX - t.x) / t.scale - p.x, y: (e.clientY - t.y) / t.scale - p.y };
  }, []);

  const handleNodeClick   = useCallback(id => setSelectedNodeId(id), []);
  const handleToggleFocus = useCallback(id => setFocusBranchId(p => p === id ? null : id), []);
  const handleNavigate    = route => onNavigate ? onNavigate(route) : router.push(route);

  // Filter matching
  const isNodeMatch = useCallback((node) => {
    if (graphMode === "master") {
      if (categoryFilter !== "all" && node.category !== categoryFilter) return false;
      if (statusFilter   !== "all" && node.implementationStatus !== statusFilter) return false;
      if (domainFilter   !== "all" && node.domain !== domainFilter) return false;
      if (selectedRole   !== "all" && !node.roles.includes(selectedRole)) return false;
      if (selectedType   !== "all" && (node.nodeType || node.type) !== selectedType) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (![node.name, node.canonicalId, node.route, node.description, node.purpose, node.id]
        .some(f => (f || "").toLowerCase().includes(q))) return false;
    }
    return true;
  }, [graphMode, categoryFilter, statusFilter, domainFilter, selectedRole, selectedType, searchQuery]);

  const visibleNodes     = useMemo(() => activeSlice.nodes.filter(isNodeMatch), [activeSlice.nodes, isNodeMatch]);
  const visibleNodeIdSet = useMemo(() => new Set(visibleNodes.map(n => n.id)), [visibleNodes]);
  const visibleEdges     = useMemo(() =>
    activeSlice.edges.filter(e => visibleNodeIdSet.has(e.source) && visibleNodeIdSet.has(e.target))
  , [activeSlice.edges, visibleNodeIdSet]);

  // Viewport culling
  const culledNodes = useMemo(() => visibleNodes.filter(node => {
    const p = positions[node.id];
    if (!p) return true;
    return (
      p.x + NODE_W >= viewportBounds.left && p.x <= viewportBounds.right &&
      p.y + NODE_H >= viewportBounds.top  && p.y <= viewportBounds.bottom
    );
  }), [visibleNodes, positions, viewportBounds]);

  // Canvas edge drawing
  useCanvasEdges({
    canvasEdgeRef, visibleEdges, nodeMap, positionsRef,
    hoveredNodeId, selectedNodeId, focusedNodeSet, tracePathSet
  });

  // Linear Guide Walkthrough step handler
  const currentGuide = useMemo(() => {
    if (graphMode !== "guide") return null;
    return getLinearGuide(activeGuideId);
  }, [graphMode, activeGuideId]);

  const activeGuideStep = useMemo(() => {
    if (!currentGuide) return null;
    return currentGuide.steps[currentGuideStepIdx] || currentGuide.steps[0];
  }, [currentGuide, currentGuideStepIdx]);

  const jumpToGuideStep = useCallback((stepIdx) => {
    if (!currentGuide) return;
    const targetIdx = Math.max(0, Math.min(stepIdx, currentGuide.steps.length - 1));
    setCurrentGuideStepIdx(targetIdx);
    const targetStep = currentGuide.steps[targetIdx];
    if (targetStep) centerOnNode(targetStep.nodeId);
  }, [currentGuide, centerOnNode]);

  // Export handlers
  const handleExportJSON = useCallback(() => {
    const data = exportSubgraphJSON(activeSlice);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scoutit_${graphMode}_subgraph.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice("✨ Subgraph JSON downloaded successfully!");
    setTimeout(() => setExportNotice(null), 3000);
  }, [activeSlice, graphMode]);

  const handleExportRAG = useCallback(() => {
    const data = JSON.stringify(getAtomicRAGChunks(MASTER_FLOW_NODES, MASTER_FLOW_EDGES, { role: "admin", includePlanned: true }), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scoutit_rag_knowledge_base_v2.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice("🧠 Atomic RAG Knowledge Base downloaded!");
    setTimeout(() => setExportNotice(null), 3000);
  }, []);

  return (
    <div ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="relative w-full h-screen bg-[#07070e] select-none flex flex-col font-sans overflow-hidden">

      {/* ── TOP CONTROL TOOLBAR (High-Contrast & Distinct Navigation) ── */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Left: Mode Switcher & Slicing Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-[#0e0e1a]/95 backdrop-blur-xl px-3.5 py-2 rounded-2xl border border-white/25 shadow-2xl pointer-events-auto">
          
          {/* Main Mode Tabs */}
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/20 text-xs font-mono">
            <button
              onClick={() => { setGraphMode("master"); resetView(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-bold text-xs ${
                graphMode === "master"
                  ? "bg-[#E8AE3C] text-black shadow-md"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <Layers size={14} />
              <span>Master Graph ({MASTER_FLOW_NODES.length})</span>
            </button>
            <button
              onClick={() => { setGraphMode("role"); resetView(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-bold text-xs ${
                graphMode === "role"
                  ? "bg-[#E8AE3C] text-black shadow-md"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <Compass size={14} />
              <span>Role Journeys</span>
            </button>
            <button
              onClick={() => { setGraphMode("workflow"); resetView(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-bold text-xs ${
                graphMode === "workflow"
                  ? "bg-[#E8AE3C] text-black shadow-md"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <Zap size={14} />
              <span>Workflows</span>
            </button>
            <button
              onClick={() => { setGraphMode("guide"); resetView(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-bold text-xs ${
                graphMode === "guide"
                  ? "bg-[#E8AE3C] text-black shadow-md"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <BookOpen size={14} />
              <span>User Guides</span>
            </button>
          </div>

          {/* Role selector in Role Mode */}
          {graphMode === "role" && (
            <div className="flex items-center gap-1 bg-black/80 p-0.5 rounded-lg border border-white/20 text-xs font-mono">
              {[
                ["visitor", "Visitor"],
                ["seeker", "Seeker / Buyer"],
                ["owner", "Owner"],
                ["broker", "Broker"],
                ["provider", "Provider"],
                ["staff", "Staff"]
              ].map(([r, l]) => (
                <button
                  key={r}
                  onClick={() => setActiveRole(r)}
                  className={`px-2.5 py-1 rounded-md transition font-semibold text-xs ${
                    activeRole === r
                      ? "bg-[#E8AE3C] text-black font-bold"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          )}

          {/* Workflow selector in Workflow Mode */}
          {graphMode === "workflow" && (
            <select
              value={activeWorkflow}
              onChange={e => setActiveWorkflow(e.target.value)}
              className="bg-black/80 border border-[#E8AE3C]/60 rounded-lg px-3 py-1.5 text-xs text-[#E8AE3C] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#E8AE3C] max-w-[260px] truncate"
            >
              {Object.keys(WORKFLOW_DEFINITIONS).map(k => (
                <option key={k} value={k}>{WORKFLOW_DEFINITIONS[k].name}</option>
              ))}
            </select>
          )}

          {/* Guide selector in Guide Mode */}
          {graphMode === "guide" && (
            <select
              value={activeGuideId}
              onChange={e => { setActiveGuideId(e.target.value); setCurrentGuideStepIdx(0); }}
              className="bg-black/80 border border-[#E8AE3C]/60 rounded-lg px-3 py-1.5 text-xs text-[#E8AE3C] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#E8AE3C] max-w-[260px] truncate"
            >
              {Object.keys(LINEAR_GUIDE_DEFINITIONS).map(k => (
                <option key={k} value={k}>{LINEAR_GUIDE_DEFINITIONS[k].title}</option>
              ))}
            </select>
          )}

          {/* Quick Search */}
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 text-white/60" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search canonical ID, route..."
              className="bg-black/70 border border-white/25 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/55 focus:outline-none focus:border-[#E8AE3C] w-44 transition font-medium"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2 text-white/60 hover:text-white text-xs font-bold">×</button>
            )}
          </div>

          {/* Status Filter in Master Mode */}
          {graphMode === "master" && (
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-black/80 border border-white/25 rounded-lg px-2.5 py-1 text-xs text-white font-mono font-semibold focus:outline-none focus:border-[#E8AE3C]"
            >
              <option value="all">Status: All</option>
              <option value="VERIFIED">🛡️ Verified Only</option>
              <option value="PARTIAL">⚙️ Partial</option>
              <option value="PLANNED">⏳ Planned</option>
              <option value="PROPOSED">💡 Proposed</option>
            </select>
          )}

          {/* Domain Filter in Master Mode */}
          {graphMode === "master" && (
            <select
              value={domainFilter}
              onChange={e => setDomainFilter(e.target.value)}
              className="bg-black/80 border border-white/25 rounded-lg px-2.5 py-1 text-xs text-white font-mono font-semibold focus:outline-none focus:border-[#E8AE3C]"
            >
              <option value="all">Domain: All</option>
              <option value="property">Property</option>
              <option value="deal">Deal</option>
              <option value="auth">Auth</option>
              <option value="connects">Connects</option>
              <option value="owner">Owner</option>
              <option value="broker">Broker</option>
              <option value="sentinel">Sentinel</option>
              <option value="gis">GIS</option>
              <option value="admin">Admin</option>
            </select>
          )}

          {focusBranchId && (
            <button
              onClick={() => setFocusBranchId(null)}
              className="flex items-center gap-1.5 bg-[#E8AE3C]/25 border border-[#E8AE3C]/60 text-[#E8AE3C] px-2.5 py-1 rounded-lg text-xs hover:bg-[#E8AE3C]/35 transition font-mono font-bold"
            >
              <X size={13} /><span>Clear Focus</span>
            </button>
          )}
        </div>

        {/* Center: Path Tracer (Master Mode only) */}
        {graphMode === "master" && (
          <div className="hidden xl:flex items-center gap-2 bg-[#0e0e1a]/95 backdrop-blur-xl px-3.5 py-2 rounded-2xl border border-white/25 shadow-2xl pointer-events-auto">
            <span className="text-[10.5px] font-mono uppercase text-[#E8AE3C] font-bold tracking-wider">Path Tracer</span>
            <select
              value={traceSourceId}
              onChange={e => setTraceSourceId(e.target.value)}
              className="bg-black/80 border border-white/25 rounded-lg px-2.5 py-1 text-xs text-white max-w-[130px] truncate focus:outline-none"
            >
              {nodeOptions}
            </select>
            <ArrowRight size={13} className="text-white/60" />
            <select
              value={traceTargetId}
              onChange={e => setTraceTargetId(e.target.value)}
              className="bg-black/80 border border-white/25 rounded-lg px-2.5 py-1 text-xs text-white max-w-[130px] truncate focus:outline-none"
            >
              {nodeOptions}
            </select>
            <button
              onClick={runPathTracer}
              className="px-3 py-1 rounded-lg bg-[#E8AE3C] hover:bg-[#d69d2f] text-black font-bold text-xs transition shadow-sm"
            >
              Trace
            </button>
            {activeTracePath && (
              <button onClick={() => setActiveTracePath(null)} className="p-1 text-white/60 hover:text-white text-xs">
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {/* Right: Reset Layout, Exports & Zoom Controls */}
        <div className="flex items-center gap-2 bg-[#0e0e1a]/95 backdrop-blur-xl p-2 rounded-2xl border border-white/25 shadow-2xl pointer-events-auto">
          
          {/* Reset Layout */}
          <button
            onClick={resetEntireLayout}
            title="Reset canvas and restore all dragged nodes back to their original placement"
            className="graph-control-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 hover:text-amber-100 text-xs font-mono font-bold border border-amber-500/60 transition shadow-md"
          >
            <RotateCcw size={14} className="text-amber-400" />
            <span>Reset Layout</span>
          </button>

          <div className="h-5 w-px bg-white/20" />

          {/* Export JSON & RAG */}
          <button
            onClick={handleExportJSON}
            title="Export Subgraph JSON"
            className="graph-control-btn flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 hover:text-white text-xs font-mono font-semibold border border-white/20 transition"
          >
            <Download size={14} />
            <span className="hidden md:inline">JSON</span>
          </button>
          <button
            onClick={handleExportRAG}
            title="Export Atomic RAG Knowledge Base"
            className="graph-control-btn flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#E8AE3C]/20 hover:bg-[#E8AE3C]/35 text-[#E8AE3C] text-xs font-mono font-bold border border-[#E8AE3C]/50 transition"
          >
            <Sparkles size={14} />
            <span className="hidden md:inline">RAG V2</span>
          </button>

          <div className="h-5 w-px bg-white/20" />

          {/* Zoom controls */}
          <button onClick={() => doZoom(0.12)}  className="graph-control-btn p-1.5 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition" title="Zoom In"><ZoomIn size={16} /></button>
          <button onClick={() => doZoom(-0.12)} className="graph-control-btn p-1.5 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition" title="Zoom Out"><ZoomOut size={16} /></button>
          <button onClick={fitScreen}            className="graph-control-btn p-1.5 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition" title="Fit to Screen"><Crosshair size={16} /></button>
          <button
            onClick={resetView}
            title="Reset Zoom to 65%"
            className="graph-control-btn p-1.5 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition text-xs font-mono font-bold px-2"
          >
            {Math.round(displayScale * 100)}%
          </button>
          <div className="h-5 w-px bg-white/20" />
          <button
            onClick={() => setIsInspectorOpen(p => !p)}
            title="Toggle Node Inspector"
            className={`graph-control-btn p-1.5 rounded-lg transition ${
              isInspectorOpen ? "bg-white/25 text-[#E8AE3C] border border-[#E8AE3C]/50" : "hover:bg-white/20 text-white/80"
            }`}
          >
            <Eye size={16} />
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {exportNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#E8AE3C] text-black font-bold font-mono text-xs px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={18} />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* ── CANVAS ── */}
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden">
        {/* Subtle grid background */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="g-dot" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1.2" fill="rgba(255,255,255,.5)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#g-dot)" />
        </svg>

        {/* Transformable Canvas Layer */}
        <div ref={canvasLayerRef} className="absolute origin-top-left" style={{ willChange: "transform" }}>
          {/* Canvas for curved bezier connection lines */}
          <canvas ref={canvasEdgeRef} className="absolute top-0 left-0 pointer-events-none z-0" />
          
          {/* Viewport-culled memoized node cards */}
          {culledNodes.map(node => {
            const p = positions[node.id] || { x: 0, y: 0 };
            return (
              <MemoizedNodeCard
                key={node.id}
                node={node}
                pos={p}
                isSelected={selectedNodeId === node.id}
                isDimmed={!!focusedNodeSet && !focusedNodeSet.has(node.id) && selectedNodeId !== node.id}
                isTraceActive={!!(tracePathSet && activeTracePath?.includes(node.id))}
                isFocusedBranch={focusBranchId === node.id}
                onDragStart={handleNodeDragStart}
                onClick={handleNodeClick}
                onMouseEnter={setHoveredNodeId}
                onMouseLeave={setHoveredNodeId}
                onToggleFocus={handleToggleFocus}
              />
            );
          })}
        </div>
      </div>

      {/* ── INTERACTIVE GUIDE WALKTHROUGH PLAYER (Guide Mode) ── */}
      {graphMode === "guide" && activeGuideStep && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-2xl bg-[#0e0e1a]/95 backdrop-blur-2xl border-2 border-[#E8AE3C]/60 rounded-3xl p-5 shadow-[0_0_60px_rgba(0,0,0,0.9)] text-white">
          <div className="flex items-center justify-between pb-3 border-b border-white/20">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-[#E8AE3C] text-black font-mono font-bold text-xs shadow-md">
                Step {activeGuideStep.step} of {currentGuide?.steps.length}
              </span>
              <h3 className="font-bold text-[15px] text-white tracking-tight">{activeGuideStep.title}</h3>
            </div>
            <span className="text-[11px] font-mono text-white/70 uppercase font-bold bg-white/10 px-2.5 py-0.5 rounded-md">
              Role: {currentGuide?.role}
            </span>
          </div>

          <div className="py-3.5 space-y-2.5">
            <p className="text-[13px] text-white/95 leading-relaxed">
              <strong className="text-emerald-400 font-bold">What to do:</strong> {activeGuideStep.action}
            </p>
            <p className="text-[12px] text-[#E8AE3C] font-mono leading-relaxed bg-[#E8AE3C]/15 p-2.5 rounded-xl border border-[#E8AE3C]/30">
              💡 <strong>Helpful tip:</strong> {activeGuideStep.tip}
            </p>
          </div>

          <div className="pt-3 border-t border-white/20 flex items-center justify-between">
            <button
              onClick={() => jumpToGuideStep(currentGuideStepIdx - 1)}
              disabled={currentGuideStepIdx === 0}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-30 disabled:pointer-events-none text-xs font-mono font-bold transition"
            >
              <ChevronLeft size={16} /><span>Previous</span>
            </button>
            <div className="flex items-center gap-1.5">
              {currentGuide?.steps.map((s, idx) => (
                <button
                  key={s.step}
                  onClick={() => jumpToGuideStep(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition ${
                    idx === currentGuideStepIdx ? "bg-[#E8AE3C] w-6" : "bg-white/30 hover:bg-white/60"
                  }`}
                  title={`Jump to step ${s.step}`}
                />
              ))}
            </div>
            <button
              onClick={() => jumpToGuideStep(currentGuideStepIdx + 1)}
              disabled={currentGuideStepIdx === currentGuide.steps.length - 1}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#E8AE3C] text-black hover:bg-[#d69d2f] disabled:opacity-30 disabled:pointer-events-none text-xs font-mono font-bold transition shadow-md"
            >
              <span>Next</span><ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── AUTHORITATIVE SCHEMA V2 NODE INSPECTOR PANEL ── */}
      {isInspectorOpen && selectedNode && (
        <aside className="absolute right-3 top-16 bottom-3 z-30 w-[390px] bg-[#0c0c18]/95 backdrop-blur-2xl border border-white/25 rounded-3xl p-5 shadow-2xl flex flex-col justify-between overflow-y-auto text-white">
          <div className="space-y-4">
            
            {/* Header: Canonical ID & Badges */}
            <div className="pb-3 border-b border-white/15 space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className="text-[11px] font-mono uppercase px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5"
                  style={{
                    color: TYPE_CONFIG[selectedNode.nodeType || selectedNode.type]?.color,
                    borderColor: TYPE_CONFIG[selectedNode.nodeType || selectedNode.type]?.border,
                    background: TYPE_CONFIG[selectedNode.nodeType || selectedNode.type]?.bg
                  }}
                >
                  {TYPE_CONFIG[selectedNode.nodeType || selectedNode.type]?.icon} {TYPE_CONFIG[selectedNode.nodeType || selectedNode.type]?.label || selectedNode.type}
                </span>
                
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[10.5px] font-mono uppercase px-2 py-0.5 rounded border font-semibold flex items-center gap-1"
                    style={{
                      color: STATUS_CONFIG[selectedNode.implementationStatus]?.color,
                      borderColor: STATUS_CONFIG[selectedNode.implementationStatus]?.border,
                      background: STATUS_CONFIG[selectedNode.implementationStatus]?.bg
                    }}
                  >
                    <span>{STATUS_CONFIG[selectedNode.implementationStatus]?.icon}</span>
                    <span>{STATUS_CONFIG[selectedNode.implementationStatus]?.label}</span>
                  </span>
                  <button onClick={() => setIsInspectorOpen(false)} className="text-white/60 hover:text-white p-1">
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#E8AE3C] font-bold block truncate">
                  CANONICAL: {selectedNode.canonicalId || selectedNode.id}
                </span>
                <h3 className="text-[15px] font-bold text-white leading-snug tracking-tight mt-0.5">
                  {selectedNode.name}
                </h3>
              </div>

              <p className="text-[12px] text-white/90 leading-relaxed font-normal">
                {selectedNode.description || selectedNode.purpose}
              </p>
              
              <div className="pt-2 flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#E8AE3C] truncate max-w-[240px] font-semibold">{selectedNode.route}</span>
                {selectedNode.route?.startsWith("/") && (
                  <button
                    onClick={() => handleNavigate(selectedNode.route.replace("[id]","sample-space").replace("[slug]","sample-space"))}
                    className="flex items-center gap-1 text-[#E8AE3C] hover:underline font-bold"
                  >
                    <span>Visit Page</span>
                    <ExternalLink size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Codebase & Grounding Evidence Section */}
            {selectedNode.evidence && selectedNode.evidence.length > 0 && (
              <div className="space-y-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="font-mono text-[11px] uppercase text-emerald-400 font-bold flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  <span>Grounding Evidence ({selectedNode.evidence.length})</span>
                </span>
                <div className="space-y-1.5">
                  {selectedNode.evidence.map((ev, i) => (
                    <div key={i} className="text-[11px] font-mono bg-black/40 p-2 rounded-lg border border-white/10 space-y-0.5">
                      <div className="flex items-center justify-between text-emerald-300 font-bold text-[10px]">
                        <span>[{ev.kind}] {ev.symbol ? `· ${ev.symbol}` : ''}</span>
                        <span className="text-[9px] text-white/60">{ev.provenance}</span>
                      </div>
                      {ev.path && (
                        <div className="text-white/80 truncate text-[10px]" title={ev.path}>
                          {ev.path}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 1. Where did we come from? (Upstream steps) */}
            <div className="space-y-2">
              <span className="font-mono text-[11.5px] uppercase text-white/85 font-bold flex items-center gap-2">
                <MapPin size={14} className="text-sky-400" />
                <span>1. Where did we come from? ({selectedNode.parents?.length || 0})</span>
              </span>
              <div className="space-y-1.5">
                {selectedNode.parents?.length ? selectedNode.parents.map(pid => {
                  const pn = nodeMap.get(pid);
                  return (
                    <button
                      key={pid}
                      onClick={() => centerOnNode(pid)}
                      className="w-full text-left p-2.5 rounded-xl bg-[#141428] border border-white/20 hover:border-[#E8AE3C]/70 hover:bg-[#E8AE3C]/15 transition flex items-center justify-between group shadow-sm"
                    >
                      <div className="truncate pr-2">
                        <span className="text-white font-bold text-[12px] group-hover:text-white truncate block">{pn?.name || pid}</span>
                        <span className="text-[10px] font-mono text-white/60 block">{pn?.canonicalId || pn?.type}</span>
                      </div>
                      <ChevronLeft size={15} className="text-white/50 group-hover:text-[#E8AE3C] shrink-0" />
                    </button>
                  );
                }) : (
                  <p className="text-[11px] text-white/60 italic p-2.5 bg-black/40 rounded-xl border border-white/10">
                    Root starting point (No upstream steps)
                  </p>
                )}
              </div>
            </div>

            {/* 2. What can you do here? */}
            {selectedNode.actions?.length > 0 && (
              <div className="space-y-2">
                <span className="font-mono text-[11.5px] uppercase text-emerald-400 font-bold flex items-center gap-2">
                  <Zap size={14} />
                  <span>2. What can you do here?</span>
                </span>
                <ul className="space-y-1.5">
                  {selectedNode.actions.map((a, i) => (
                    <li key={i} className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-[11.5px] flex items-center gap-2 font-medium">
                      <Zap size={13} className="shrink-0 text-emerald-400" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 3. Where does this lead next? */}
            <div className="space-y-2">
              <span className="font-mono text-[11.5px] uppercase text-white/85 font-bold flex items-center gap-2">
                <ChevronRight size={15} className="text-emerald-400" />
                <span>3. Where does this lead next? ({selectedNode.children?.length || 0})</span>
              </span>
              <div className="space-y-1.5">
                {selectedNode.children?.length ? selectedNode.children.map(cid => {
                  const cn = nodeMap.get(cid);
                  return (
                    <button
                      key={cid}
                      onClick={() => centerOnNode(cid)}
                      className="w-full text-left p-2.5 rounded-xl bg-[#141428] border border-white/20 hover:border-[#E8AE3C]/70 hover:bg-[#E8AE3C]/15 transition flex items-center justify-between group shadow-sm"
                    >
                      <div className="truncate pr-2">
                        <span className="text-white font-bold text-[12px] group-hover:text-white truncate block">{cn?.name || cid}</span>
                        <span className="text-[10px] font-mono text-white/60 block">{cn?.canonicalId || cn?.type}</span>
                      </div>
                      <ChevronRight size={15} className="text-white/50 group-hover:text-[#E8AE3C] shrink-0" />
                    </button>
                  );
                }) : (
                  <p className="text-[11px] text-white/60 italic p-2.5 bg-black/40 rounded-xl border border-white/10">
                    Terminal milestone (Journey completes here)
                  </p>
                )}
              </div>
            </div>

            {/* 4. What if something goes wrong? (Exceptions) */}
            {selectedNode.exceptions?.length > 0 && (
              <div className="space-y-2">
                <span className="font-mono text-[11.5px] uppercase text-amber-400 font-bold flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>4. What if something goes wrong?</span>
                </span>
                <ul className="space-y-1.5">
                  {selectedNode.exceptions.map((exc, i) => (
                    <li key={i} className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-100 text-[11.5px] flex items-start gap-2">
                      <AlertCircle size={14} className="shrink-0 text-amber-400 mt-0.5" />
                      <span className="leading-relaxed">{exc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 5. How to fix it (Recovery) */}
            {selectedNode.recovery?.length > 0 && (
              <div className="space-y-2">
                <span className="font-mono text-[11.5px] uppercase text-sky-400 font-bold flex items-center gap-2">
                  <RotateCcw size={14} />
                  <span>5. How to recover & continue</span>
                </span>
                <ul className="space-y-1.5">
                  {selectedNode.recovery.map((rec, i) => (
                    <li key={i} className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-100 text-[11.5px] flex items-start gap-2">
                      <CheckCircle2 size={14} className="shrink-0 text-sky-400 mt-0.5" />
                      <span className="leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 6. Data & System Contract */}
            <div className="space-y-2">
              <span className="font-mono text-[11.5px] uppercase text-blue-400 font-bold flex items-center gap-2">
                <Database size={14} />
                <span>6. Data & System Contract</span>
              </span>
              <div className="p-3 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-100 text-[11.5px] space-y-1.5">
                <div><strong className="text-blue-200">Database:</strong> {selectedNode.database || "None"}</div>
                <div><strong className="text-blue-200">Auth Gate:</strong> {selectedNode.auth || "Public access"}</div>
                {selectedNode.telemetry && (
                  <div>
                    <strong className="text-blue-200">Telemetry:</strong>
                    <span className="font-mono text-[10.5px] text-amber-300 ml-1">
                      {selectedNode.telemetry.eventName}
                    </span>
                  </div>
                )}
                {selectedNode.systems && selectedNode.systems.length > 0 && (
                  <div>
                    <strong className="text-blue-200">Files & APIs:</strong>
                    <div className="mt-1 space-y-0.5">
                      {selectedNode.systems.map((sys, i) => (
                        <div key={i} className="font-mono text-[10.5px] text-white/90 truncate">• {sys}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </aside>
      )}

      {/* Stats Bar */}
      <div className="absolute bottom-3 left-3 z-30 flex items-center gap-3 bg-[#0e0e1a]/95 backdrop-blur-xl px-3.5 py-1.5 rounded-xl border border-white/20 text-[11px] font-mono text-white/80 pointer-events-none shadow-xl">
        <span>Mode: <strong className="text-[#E8AE3C] uppercase font-bold">{graphMode}</strong></span>
        <span>·</span>
        <span>{culledNodes.length}/{visibleNodes.length} nodes visible</span>
        <span>·</span>
        <span>{visibleEdges.length} connections</span>
        <span>·</span>
        <span>{Math.round(displayScale * 100)}% zoom</span>
      </div>
    </div>
  );
}
