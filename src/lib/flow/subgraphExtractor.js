import { MASTER_FLOW_NODES, MASTER_FLOW_EDGES } from '../../data/masterFlowGraphData.js';
import * as logic from './subgraphLogic.js';

export * from './subgraphLogic.js';

export function getRoleSubgraph(role, nodes = MASTER_FLOW_NODES, edges = MASTER_FLOW_EDGES) {
  return logic.getRoleSubgraph(role, nodes, edges);
}

export function getWorkflowSubgraph(workflowKey, nodes = MASTER_FLOW_NODES, edges = MASTER_FLOW_EDGES) {
  return logic.getWorkflowSubgraph(workflowKey, nodes, edges);
}

export function getRAGKnowledgeExport(nodes = MASTER_FLOW_NODES, edges = MASTER_FLOW_EDGES) {
  return logic.getRAGKnowledgeExport(nodes, edges);
}

export function getAtomicRAGChunks(nodes = MASTER_FLOW_NODES, edges = MASTER_FLOW_EDGES, options) {
  return logic.getAtomicRAGChunks(nodes, edges, options);
}
