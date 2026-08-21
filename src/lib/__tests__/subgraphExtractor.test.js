import { describe, it, expect } from 'vitest';
import {
  getRoleSubgraph,
  getWorkflowSubgraph,
  getLinearGuide,
  getRAGKnowledgeExport,
  exportSubgraphJSON,
  WORKFLOW_DEFINITIONS,
  LINEAR_GUIDE_DEFINITIONS
} from '../flow/subgraphExtractor';
import { MASTER_FLOW_NODES, MASTER_FLOW_EDGES } from '@/data/masterFlowGraphData';

describe('ScoutIt Sub-Graph Extraction & Multi-Use Case Framework', () => {

  describe('1. Role-Based Sub-Graph Slicing (getRoleSubgraph)', () => {
    const roles = ['visitor', 'seeker', 'owner', 'broker', 'provider', 'staff'];

    roles.forEach(role => {
      it(`extracts a clean, connected sub-graph for role "${role}"`, () => {
        const slice = getRoleSubgraph(role);
        expect(slice).toBeDefined();
        expect(slice.role).toBe(role);
        expect(slice.nodes.length).toBeGreaterThan(0);
        expect(slice.edges.length).toBeGreaterThan(0);
        expect(slice.nodeCount).toBe(slice.nodes.length);
        expect(slice.edgeCount).toBe(slice.edges.length);

        const nodeIds = new Set(slice.nodes.map(n => n.id));

        // Every node in the slice must have the requested role
        slice.nodes.forEach(node => {
          expect(node.roles.map(r => r.toLowerCase())).toContain(role);
        });

        // Every edge must have both source and target present in the node slice
        slice.edges.forEach(edge => {
          expect(nodeIds.has(edge.source)).toBe(true);
          expect(nodeIds.has(edge.target)).toBe(true);
        });

        // Verify localized reciprocity
        slice.nodes.forEach(node => {
          node.children.forEach(childId => {
            const childNode = slice.nodes.find(n => n.id === childId);
            expect(childNode).toBeDefined();
            expect(childNode.parents).toContain(node.id);
          });
        });
      });
    });

    it('verifies Public Visitor slice includes no private staff/admin endpoints', () => {
      const visitorSlice = getRoleSubgraph('visitor');
      const visitorNodeIds = new Set(visitorSlice.nodes.map(n => n.id));

      expect(visitorNodeIds.has('mission_control')).toBe(false);
      expect(visitorNodeIds.has('scenario_pii_erasure')).toBe(false);
      expect(visitorNodeIds.has('hero')).toBe(true);
      expect(visitorNodeIds.has('pep')).toBe(true);
      expect(visitorNodeIds.has('discover_directory')).toBe(true);
    });

    it('verifies Seeker slice includes complete inquiry and deal room journey', () => {
      const seekerSlice = getRoleSubgraph('seeker');
      const seekerNodeIds = new Set(seekerSlice.nodes.map(n => n.id));

      expect(seekerNodeIds.has('dashboard_buyer')).toBe(true);
      expect(seekerNodeIds.has('inquiry_modal')).toBe(true);
      expect(seekerNodeIds.has('booking_modal')).toBe(true);
      expect(seekerNodeIds.has('deal_room')).toBe(true);
      expect(seekerNodeIds.has('terminal_handshake_success')).toBe(true);
    });
  });

  describe('2. Workflow & State Machine Slicing (getWorkflowSubgraph)', () => {
    const workflowKeys = Object.keys(WORKFLOW_DEFINITIONS);

    workflowKeys.forEach(wfId => {
      it(`correctly isolates state machine for "${wfId}"`, () => {
        const wf = getWorkflowSubgraph(wfId);
        expect(wf).toBeDefined();
        expect(wf.id).toBe(wfId);
        expect(wf.name).toBe(WORKFLOW_DEFINITIONS[wfId].name);
        expect(wf.description).toBe(WORKFLOW_DEFINITIONS[wfId].description);
        expect(wf.nodes.length).toBe(WORKFLOW_DEFINITIONS[wfId].nodeIds.length);
        expect(wf.edges.length).toBeGreaterThan(0);

        const nodeIds = new Set(wf.nodes.map(n => n.id));

        // Ensure all edges stay inside the state machine boundaries
        wf.edges.forEach(edge => {
          expect(nodeIds.has(edge.source)).toBe(true);
          expect(nodeIds.has(edge.target)).toBe(true);
        });

        // Ensure localized parent/child integrity
        wf.nodes.forEach(node => {
          node.children.forEach(childId => {
            const childNode = wf.nodes.find(n => n.id === childId);
            expect(childNode).toBeDefined();
            expect(childNode.parents).toContain(node.id);
          });
        });
      });
    });

    it('throws a descriptive error when an unknown workflow ID is requested', () => {
      expect(() => getWorkflowSubgraph('unknown_flow')).toThrow(
        /Unknown workflow ID: "unknown_flow"/
      );
    });
  });

  describe('3. Step-by-Step User Guides (getLinearGuide)', () => {
    const guideKeys = Object.keys(LINEAR_GUIDE_DEFINITIONS);

    guideKeys.forEach(guideId => {
      it(`generates sequential walkthrough guide for "${guideId}"`, () => {
        const guide = getLinearGuide(guideId);
        expect(guide).toBeDefined();
        expect(guide.title).toBeDefined();
        expect(guide.role).toBeDefined();
        expect(guide.steps.length).toBeGreaterThanOrEqual(5);

        // Verify steps are strictly ordered 1..N
        guide.steps.forEach((step, idx) => {
          expect(step.step).toBe(idx + 1);
          expect(step.nodeId).toBeDefined();
          expect(step.title).toBeDefined();
          expect(step.action).toBeDefined();
          expect(step.tip).toBeDefined();

          // Ensure the node referenced by the step exists in the Master Graph
          const masterNode = MASTER_FLOW_NODES.find(n => n.id === step.nodeId);
          expect(masterNode).toBeDefined();
        });
      });
    });

    it('throws a descriptive error when an unknown guide ID is requested', () => {
      expect(() => getLinearGuide('invalid_guide')).toThrow(
        /Unknown guide ID: "invalid_guide"/
      );
    });
  });

  describe('4. RAG Knowledge Graph Retrieval (getRAGKnowledgeExport)', () => {
    it('serializes all master nodes into structured AI retrieval chunks', () => {
      const chunks = getRAGKnowledgeExport();
      expect(chunks.length).toBe(MASTER_FLOW_NODES.length);

      chunks.forEach(chunk => {
        expect(chunk.chunk_id).toMatch(/^scoutit_graph_node_/);
        expect(chunk.title).toBeDefined();
        expect(chunk.category).toBeDefined();
        expect(chunk.layer).toBeDefined();
        expect(chunk.route).toBeDefined();
        expect(Array.isArray(chunk.roles)).toBe(true);
        expect(chunk.purpose).toBeDefined();
        expect(chunk.description).toBeDefined();
        expect(Array.isArray(chunk.available_actions)).toBe(true);
        expect(Array.isArray(chunk.entry_conditions)).toBe(true);
        expect(Array.isArray(chunk.underlying_systems)).toBe(true);
        expect(chunk.database_tables).toBeDefined();
        expect(chunk.auth_requirement).toBeDefined();
        expect(Array.isArray(chunk.exceptions_and_edge_cases)).toBe(true);
        expect(Array.isArray(chunk.recovery_mechanisms)).toBe(true);
        expect(Array.isArray(chunk.connected_downstream_targets)).toBe(true);
        expect(Array.isArray(chunk.connected_upstream_sources)).toBe(true);
        expect(chunk.statutory_compliance).toEqual(
          expect.arrayContaining([
            expect.stringContaining("RESA Law"),
            expect.stringContaining("Data Privacy Act"),
            expect.stringContaining("NPC Circular 2024-03"),
            expect.stringContaining("Consumer Act")
          ])
        );
      });
    });
  });

  describe('5. JSON Serialization (exportSubgraphJSON)', () => {
    it('formats a subgraph into valid JSON string', () => {
      const slice = getRoleSubgraph('broker');
      const json = exportSubgraphJSON(slice);
      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed.role).toBe('broker');
      expect(parsed.nodeCount).toBe(slice.nodes.length);
    });
  });
});
