import { MASTER_FLOW_NODES } from "@/data/masterFlowGraphData";
import { calculateBlastRadius, INCIDENT_SCENARIOS, getNodeHealthStatus } from "./incidentSimulator";
import { resolveFlowNode } from "./flowNodeResolver";

const STORAGE_KEY = "scoutit_flow_incident_signals";
const MAX_STORED_SIGNALS = 20;

/**
 * In-memory active signals list and subscriber set
 */
let activeSignals = [];
const subscribers = new Set();
let isInitialized = false;

/**
 * Creates a normalized signal object
 *
 * @param {object} params
 * @returns {object} Formatted incident signal
 */
export function createSignal({
  nodeId,
  error = "Unexpected system fault",
  severity = "HIGH",
  source = "runtime",
  route = null,
  triageFile = null,
  recoveryPlaybook = null
}) {
  const node = MASTER_FLOW_NODES.find(n => n.id === nodeId);
  const now = new Date();

  return {
    id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    nodeId: nodeId || "unknown_node",
    nodeName: node ? node.name : (nodeId || "Unknown Node"),
    canonicalId: node?.canonicalId || null,
    domain: node?.domain || "core",
    route: route || node?.route || "N/A",
    error: String(error).slice(0, 500),
    severity: ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(severity) ? severity : "HIGH",
    source,
    timestamp: now.toISOString(),
    formattedTime: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    triageFile: triageFile || node?.evidence?.[0]?.path || node?.systems?.[0] || null,
    recoveryPlaybook: recoveryPlaybook || node?.recovery?.[0] || "Review related route logs and restore nominal state.",
    acknowledged: false
  };
}

/**
 * Reads persisted signals from localStorage safely (browser-only)
 */
function loadPersistedSignals() {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves signals to localStorage safely
 */
function savePersistedSignals(signals) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const trimmed = signals.slice(0, MAX_STORED_SIGNALS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage quota or disabled errors
  }
}

/**
 * Notifies all active listeners of signal state changes
 */
function notifySubscribers() {
  const current = [...activeSignals];
  subscribers.forEach(cb => {
    try {
      cb(current);
    } catch (err) {
      console.error("[incidentSignalHub] listener error:", err);
    }
  });
}

/**
 * Initializes listeners for client-side error dispatches
 */
export function initIncidentSignalHub() {
  if (isInitialized || typeof window === "undefined") return;
  isInitialized = true;

  activeSignals = loadPersistedSignals();

  // Listen for scoutit:flow-error events dispatched by reportError or tests
  window.addEventListener("scoutit:flow-error", (e) => {
    const detail = e.detail || {};
    const signal = createSignal({
      nodeId: detail.nodeId,
      error: detail.message || detail.error || "System error reported",
      severity: detail.severity || "HIGH",
      source: "client_event",
      route: detail.route,
      triageFile: detail.triageFile,
      recoveryPlaybook: detail.recoveryPlaybook
    });
    recordSignal(signal);
  });
}

/**
 * Adds an incident signal, stores it, and triggers notifications
 *
 * @param {object} signal
 * @returns {object} The added signal
 */
export function recordSignal(signal) {
  const normalized = signal.id ? signal : createSignal(signal);
  // Avoid immediate duplicate within 3 seconds for same node and error
  const isDuplicate = activeSignals.some(
    s => s.nodeId === normalized.nodeId && s.error === normalized.error &&
    Math.abs(new Date(s.timestamp).getTime() - new Date(normalized.timestamp).getTime()) < 3000
  );

  if (!isDuplicate) {
    activeSignals = [normalized, ...activeSignals].slice(0, MAX_STORED_SIGNALS);
    savePersistedSignals(activeSignals);
    notifySubscribers();
  }

  return normalized;
}

/**
 * Acknowledges or dismisses a specific signal
 *
 * @param {string} signalId
 */
export function acknowledgeSignal(signalId) {
  activeSignals = activeSignals.map(s => s.id === signalId ? { ...s, acknowledged: true } : s);
  savePersistedSignals(activeSignals);
  notifySubscribers();
}

/**
 * Removes a signal from active list
 *
 * @param {string} signalId
 */
export function removeSignal(signalId) {
  activeSignals = activeSignals.filter(s => s.id !== signalId);
  savePersistedSignals(activeSignals);
  notifySubscribers();
}

/**
 * Clears all active signals
 */
export function clearAllSignals() {
  activeSignals = [];
  savePersistedSignals([]);
  notifySubscribers();
}

/**
 * Returns currently active signals
 */
export function getActiveSignals() {
  return [...activeSignals];
}

/**
 * Subscribes a React component or callback to signal changes
 *
 * @param {Function} callback
 * @returns {Function} unsubscribe function
 */
export function subscribeToSignals(callback) {
  subscribers.add(callback);
  callback([...activeSignals]);
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Parses URL query parameters for on-call triage deep linking
 * e.g. /admin/flow?node=owner_publish&mode=incident
 *
 * @param {string} search - e.g. "?node=owner_publish&mode=incident"
 * @returns {object} Extracted parameters
 */
export function parseUrlIncidentParams(search = "") {
  if (!search) return { hasParams: false };

  const params = new URLSearchParams(search);
  const node = params.get("node") || params.get("nodeId");
  const mode = params.get("mode");
  const reason = params.get("reason") || params.get("error");
  const scenario = params.get("scenario");

  const hasParams = Boolean(node || mode === "incident" || scenario);

  return {
    hasParams,
    nodeId: node ? node.trim() : null,
    isIncidentMode: mode === "incident" || mode === "health" || Boolean(node),
    scenarioId: scenario ? scenario.trim() : null,
    reason: reason ? decodeURIComponent(reason) : null
  };
}

/**
 * Computes live operational summary from active signals and node definitions
 *
 * @param {Array<object>} signals
 * @param {Map<string, object>} nodeMap
 * @returns {object} Operational status summary
 */
export function computeSignalHealthSummary(signals, nodeMap) {
  const map = nodeMap || new Map(MASTER_FLOW_NODES.map(n => [n.id, n]));
  const unacknowledged = (signals || []).filter(s => !s.acknowledged);

  if (unacknowledged.length === 0) {
    return {
      status: "NOMINAL",
      activeCount: 0,
      faultedNodeIds: [],
      affectedTotalCount: 0,
      criticalSignal: null,
      message: "All 131 nodes and connections are running smoothly. No active alerts."
    };
  }

  const faultedNodeIds = Array.from(new Set(unacknowledged.map(s => s.nodeId).filter(id => map.has(id))));
  const blast = calculateBlastRadius(faultedNodeIds, map);
  const criticalSignal = unacknowledged.find(s => s.severity === "CRITICAL") || unacknowledged[0];

  return {
    status: unacknowledged.some(s => s.severity === "CRITICAL") ? "CRITICAL" : "DEGRADED",
    activeCount: unacknowledged.length,
    faultedNodeIds,
    blastRadius: blast,
    affectedTotalCount: blast.totalAffectedCount,
    criticalSignal,
    message: `Active Alert on ${criticalSignal.nodeName}: ${criticalSignal.error}`
  };
}
