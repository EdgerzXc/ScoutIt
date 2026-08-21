/**
 * ══════════════════════════════════════════════════════════════════════════════
 * SCOUTIT FLOW KNOWLEDGE BACKBONE & EXPORT BUNDLE
 * ══════════════════════════════════════════════════════════════════════════════
 * Canonical bundle providing static JSON exports, schema definitions,
 * atomic RAG retrieval chunks, and active JavaScript data references.
 */

import masterFlowGraphData from './masterFlowGraph.json' with { type: 'json' };
import masterFlowLayoutData from './masterFlowLayout.json' with { type: 'json' };
import atomicRAGChunksData from './atomicRAGChunks.json' with { type: 'json' };
import publicRAGChunksData from './publicRAGChunks.json' with { type: 'json' };
import workflowsData from './workflows.json' with { type: 'json' };
import linearGuidesData from './linearGuides.json' with { type: 'json' };
import coverageReportData from './coverageReport.json' with { type: 'json' };
import auditReportData from './auditReport.json' with { type: 'json' };
import schemaData from './schema.json' with { type: 'json' };

// Canonical behavioral nodes and edges from generated masterFlowGraph.json
export const MASTER_FLOW_NODES = masterFlowGraphData.nodes;
export const MASTER_FLOW_EDGES = masterFlowGraphData.edges;
export {
  getRoleSubgraph,
  getWorkflowSubgraph,
  getLinearGuide,
  resolveContextualGuide,
  getRAGKnowledgeExport,
  getAtomicRAGChunks,
  exportSubgraphJSON,
  WORKFLOW_DEFINITIONS,
  LINEAR_GUIDE_DEFINITIONS
} from '../../lib/flow/subgraphExtractor.js';
export {
  validateMasterGraph,
  validateGuideSafety,
  validateRAGSecurity,
  calculateGraphCoverage,
  auditGraphAgainstCodebase
} from '../../lib/flow/graphValidator.js';

// Static JSON exports for Supabase ingestion, AI tools, and external services
export const masterFlowGraph = masterFlowGraphData;
export const masterFlowLayout = masterFlowLayoutData;
export const atomicRAGChunks = atomicRAGChunksData;
export const publicRAGChunks = publicRAGChunksData;
export const workflows = workflowsData;
export const linearGuides = linearGuidesData;
export const coverageReport = coverageReportData;
export const auditReport = auditReportData;
export const flowSchema = schemaData;

const flowBundle = {
  masterFlowGraph,
  masterFlowLayout,
  atomicRAGChunks,
  publicRAGChunks,
  workflows,
  linearGuides,
  coverageReport,
  auditReport,
  flowSchema
};

export default flowBundle;
