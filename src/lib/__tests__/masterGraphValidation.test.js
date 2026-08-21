import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  MASTER_FLOW_NODES,
  MASTER_FLOW_EDGES,
  masterFlowGraph,
  publicRAGChunks,
  atomicRAGChunks
} from "@/data/flow";
import {
  validateGraphAgainstSchema,
  validateBrainReferences,
  validateMasterGraph,
  validateWorkflowTraversals,
  validateGuideSafety,
  validateRAGSecurity,
  calculateGraphCoverage,
  auditGraphAgainstCodebase,
  VALID_NODE_TYPES,
  VALID_EDGE_TYPES,
  VALID_DOMAINS,
  VALID_ROLES,
  VALID_SECURITY_CLASSIFICATIONS,
  VALID_RELEASE_STATUSES
} from "@/lib/flow/graphValidator";
import {
  resolveContextualGuide,
  getAtomicRAGChunks,
  getWorkflowSubgraph,
  LINEAR_GUIDE_DEFINITIONS,
  WORKFLOW_DEFINITIONS
} from "@/lib/flow/subgraphExtractor";

describe("ScoutIt Master Flow Graph Schema V2.2 — Deep Research Remediation Suite", () => {

  // 1. JSON Schema V2.2.0 Formal Validation
  it("strictly validates masterFlowGraph.json against schema.json with 0 errors", () => {
    const graphFilePath = path.resolve("src/data/flow/masterFlowGraph.json");
    if (fs.existsSync(graphFilePath)) {
      const graphJson = JSON.parse(fs.readFileSync(graphFilePath, "utf8"));
      const schemaReport = validateGraphAgainstSchema(graphJson);
      expect(schemaReport.valid, `Schema errors: ${JSON.stringify(schemaReport.errors)}`).toBe(true);
      expect(schemaReport.errorCount).toBe(0);
    }
  });

  // 2. Commit Binding & Provenance (G-01)
  it("verifies commit binding metadata (repo, brain, generator, dataRevision) in masterFlowGraph.json", () => {
    expect(masterFlowGraph.dataRevision).toBeDefined();
    expect(masterFlowGraph.repo).toBeDefined();
    expect(masterFlowGraph.repo.commitSha).toBeDefined();
    expect(masterFlowGraph.brain).toBeDefined();
    expect(masterFlowGraph.brain.commitSha).toBeDefined();
    expect(masterFlowGraph.generator).toBeDefined();
    expect(masterFlowGraph.generator.version).toBe("2.2.0");

    // All evidence items should carry commitSha
    const nodesWithEvidence = MASTER_FLOW_NODES.filter(n => n.evidence && n.evidence.length > 0);
    nodesWithEvidence.forEach(node => {
      node.evidence.forEach(ev => {
        expect(ev.commitSha).toBeDefined();
      });
    });
  });

  // 3. Real Brain Reference Resolution Proof (G-02)
  it("resolves every Brain reference that this repository actually carries", () => {
    /* Scoped to what git carries, deliberately. `.gitignore` line 74 excludes
       `_SCOUTIT_BRAIN/*` except 15_IMPLEMENTATION_RECORDS, so most Brain docs
       live on the author's machine and nowhere else. Asserting they exist on
       the filesystem made this pass on exactly one machine and fail in CI, in
       fresh clones and in every other worktree — it was testing the checkout,
       not the graph. */
    const brainReport = validateBrainReferences(MASTER_FLOW_NODES);
    expect(
      brainReport.valid,
      `Unresolved notes: ${JSON.stringify(brainReport.unresolved)}`
    ).toBe(true);
    expect(brainReport.unresolvedCount).toBe(0);
  });

  it("reports references into the private Brain without failing on them", () => {
    // These are a fact about the repo, not a defect. Kept visible so a
    // reference that silently disappears is still countable.
    const brainReport = validateBrainReferences(MASTER_FLOW_NODES);
    expect(typeof brainReport.unavailableCount).toBe("number");
    expect(brainReport.unavailable).toBeInstanceOf(Array);
    expect(brainReport.unavailable.length).toBe(brainReport.unavailableCount);
  });

  // 4. Four-Status Dimension Separation (G-08 & G-09)
  it("enforces productStatus, implementationStatus, evidenceStatus, and releaseStatus across nodes and RAG", () => {
    MASTER_FLOW_NODES.forEach(node => {
      expect(["PROPOSED", "PLANNED", "APPROVED", "DEPRECATED"]).toContain(node.productStatus);
      expect(["NOT_STARTED", "PARTIAL", "IMPLEMENTED", "VERIFIED", "UNVERIFIED", "CONTRADICTED", "DEPRECATED"]).toContain(node.implementationStatus);
      expect(["UNVERIFIED", "DOCUMENTED", "CODE_GROUNDED", "TEST_GROUNDED", "RUNTIME_GROUNDED"]).toContain(node.evidenceStatus);
      expect(VALID_RELEASE_STATUSES.has(node.releaseStatus), `Invalid releaseStatus "${node.releaseStatus}" on node "${node.id}"`).toBe(true);
    });

    // RAG chunks must preserve all 4 status dimensions
    atomicRAGChunks.forEach(chunk => {
      if (chunk.chunk_type === 'NODE_FACT') {
        expect(chunk.productStatus).toBeDefined();
        expect(chunk.implementationStatus).toBeDefined();
        expect(chunk.evidenceStatus).toBeDefined();
        expect(chunk.releaseStatus).toBeDefined();
      }
    });
  });

  // 5. Canonical Source Divergence
  it("ensures zero divergence between canonical masterFlowGraph.json and runtime export", () => {
    expect(MASTER_FLOW_NODES.length).toBe(masterFlowGraph.nodes.length);
    expect(MASTER_FLOW_EDGES.length).toBe(masterFlowGraph.edges.length);
    expect(MASTER_FLOW_NODES[0].id).toBe(masterFlowGraph.nodes[0].id);
  });

  // 6. Schema & Data Contract Structural Validation
  it("passes automated graph validation with 0 errors and complete canonical integrity", () => {
    const report = validateMasterGraph(MASTER_FLOW_NODES, MASTER_FLOW_EDGES);
    expect(report.valid).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.stats.totalNodes).toBe(128);
    expect(report.stats.totalEdges).toBeGreaterThanOrEqual(246);
    // Truth reconciliation lowered overstated nodes instead of preserving an artificial score.
    expect(report.stats.verifiedCount).toBeGreaterThanOrEqual(78);
    expect(report.stats.uniqueCanonicalIds).toBe(128);
  });

  // 7. Predicate Quality & Machine-Readable Conditions
  it("enforces domain predicates on gates/decisions and flags placeholder predicates", () => {
    const report = validateMasterGraph(MASTER_FLOW_NODES, MASTER_FLOW_EDGES);
    expect(report.placeholderPredicates.length).toBe(0);

    const inquiryFailureEdge = MASTER_FLOW_EDGES.find(
      e => e.source === "inquiry_modal" && (e.target === "exc_insufficient_connects" || e.target === "rec_topup_connects")
    );
    expect(inquiryFailureEdge).toBeDefined();
    expect(inquiryFailureEdge.type).toBe("FAILURE");
    expect(inquiryFailureEdge.predicate).toEqual({
      field: "connects.balance",
      operator: "<",
      value: 1,
      quality: "DOMAIN_DECISION"
    });
  });

  // 8. Reconciled Offer Assistance Semantics (G-03)
  it("labels offer assistance partial and never claims structured persistence", () => {
    const offerNode = MASTER_FLOW_NODES.find(n => n.id === "offer_modal");
    expect(offerNode).toBeDefined();
    expect(offerNode.implementationStatus).toBe("PARTIAL");
    expect(offerNode.releaseStatus).toBe("LIMITED_LIVE");
    expect(offerNode.description).toContain("does not yet persist an offer lifecycle");
    expect(offerNode.evidence.some(ev => ev.path.endsWith("ChatBox.js"))).toBe(true);
    expect(offerNode.evidence.some(ev => ev.path.endsWith("counter-offer/route.js"))).toBe(true);
    expect(offerNode.evidence.some(ev => ev.path.includes("DealRoom.js"))).toBe(false);
  });

  // 9. Actor-Aware Guide Traversal (G-04)
  it("verifies executable guides maintain unbroken actor continuity without traversing unauthorized subgraphs", () => {
    const safetyReport = validateGuideSafety(LINEAR_GUIDE_DEFINITIONS, MASTER_FLOW_NODES, MASTER_FLOW_EDGES);
    expect(safetyReport.safe, `Guide safety violations: ${JSON.stringify(safetyReport.violations)}`).toBe(true);
    expect(safetyReport.violations).toEqual([]);

    expect(LINEAR_GUIDE_DEFINITIONS.buyer_guide.type).toBe("EXECUTABLE_GUIDE");
    expect(LINEAR_GUIDE_DEFINITIONS.owner_guide.type).toBe("MACRO_GUIDE");
    expect(LINEAR_GUIDE_DEFINITIONS.broker_guide.type).toBe("MACRO_GUIDE");
  });

  // 10. Split RAG Security Audit & Zero Technical Leakage (G-10)
  it("evaluates access safety (100%) and content sanitization (100%) with zero internal leakages", () => {
    const publicChunksList = getAtomicRAGChunks(MASTER_FLOW_NODES, MASTER_FLOW_EDGES, { role: "public" });
    const ragReport = validateRAGSecurity(publicChunksList, MASTER_FLOW_NODES);

    expect(ragReport.secure).toBe(true);
    expect(ragReport.accessSafetyScore).toBe("100%");
    expect(ragReport.contentSanitizationScore).toBe("100%");
    expect(ragReport.overallRagSafetyScore).toBe("100%");
    expect(ragReport.trustEscalationViolations).toEqual([]);

    // Strict scan of public text
    publicChunksList.forEach(chunk => {
      const text = `${chunk.text || ''} ${chunk.title || ''} ${chunk.description || ''} ${chunk.purpose || ''}`;
      expect(text).not.toContain("connects_ledger");
      expect(text).not.toContain("user_profiles");
      expect(text).not.toContain("deal_handshakes");
      expect(text).not.toContain("src/");
      expect(text).not.toContain("/api/");
      expect(text).not.toContain("Supabase");
      expect(text).not.toContain("Airtable");
    });
  });

  // 11. Workflow Traversal with Ordered Milestones (G-05)
  it("resolves declarative workflows dynamically with verified ordered milestones", () => {
    const traversalReport = validateWorkflowTraversals(WORKFLOW_DEFINITIONS, MASTER_FLOW_NODES, MASTER_FLOW_EDGES);
    expect(traversalReport.allTraversable).toBe(true);

    Object.values(traversalReport.workflows).forEach(w => {
      expect(w.traversable).toBe(true);
      expect(w.milestonesValid).toBe(true);
    });
  });

  // 12. Checksums Manifest Integrity
  it("verifies checksums manifest covers index.js and README.md with dataRevision", () => {
    const checksumsPath = path.resolve("src/data/flow/checksums.json");
    expect(fs.existsSync(checksumsPath)).toBe(true);
    const checksumsData = JSON.parse(fs.readFileSync(checksumsPath, "utf8"));
    expect(checksumsData.dataRevision).toBeDefined();
    expect(checksumsData.checksums["index.js"]).toBeDefined();
    expect(checksumsData.checksums["README.md"]).toBeDefined();
  });

  // 13. Mathematical Coverage Formulas & Bounded Percentages
  it("calculates accurate lifecycle coverage metrics strictly bounded between 0% and 100%", () => {
    const coverage = calculateGraphCoverage(MASTER_FLOW_NODES, MASTER_FLOW_EDGES);
    
    Object.entries(coverage).forEach(([lcName, metrics]) => {
      expect(metrics.totalNodes).toBeGreaterThan(0);
      
      ['happyPathCoverage', 'failureCoverage', 'recoveryCoverage', 'guideCoverage', 'telemetryCoverage', 'evidenceCoverage'].forEach(metricKey => {
        const metric = metrics[metricKey];
        expect(metric).toBeDefined();
        expect(metric.numerator).toBeDefined();
        expect(metric.denominator).toBeDefined();
        expect(metric.formula).toBeDefined();
        
        const pctNum = parseInt(metric.percentage);
        expect(pctNum).toBeGreaterThanOrEqual(0);
        expect(pctNum).toBeLessThanOrEqual(100);
      });
    });
  });

  // 14. State Machine Transitions & Repository Fidelity Report
  it("calculates real state transitions and outputs repository fidelity report", () => {
    const audit = auditGraphAgainstCodebase(MASTER_FLOW_NODES, MASTER_FLOW_EDGES, publicRAGChunks);
    expect(audit.ghostNodes).toEqual([]);
    expect(audit.staleEvidenceItems).toEqual([]);
    expect(audit.stateMachineTransitions.implemented).toBe(13);
    expect(audit.stateMachineTransitions.registryMapped).toBe(13);
    expect(audit.stateMachineTransitions.visualEdgeMappings).toBe(13);
    expect(audit.stateMachineTransitions.plannedNotImplemented).toHaveLength(9);
    expect(audit.stateMachineTransitions.staleVisualTransitions).toEqual([]);
    expect(audit.stateMachineTransitions.missing).toEqual([]);
    expect(audit.repositoryFidelityReport.canonicalRoutes.length).toBeGreaterThan(0);
    expect(audit.repositoryFidelityReport.apiRoutesMapped.length).toBeGreaterThan(0);
    expect(audit.scores.overallTrustScore.penalties).toBeDefined();
    expect(audit.auditScore).toContain("TRUST GROUNDED");
  });
});
