# ScoutIt Flow Knowledge Backbone & Export Bundle

Authoritative export and knowledge bundle representing the complete behavioral and architectural graph of **ScoutIt** (Schema V2.2.0).
Commit Bound: `7e6e09a024d576c7d40d13f90dd0311da20b5a79`

---

## 🏛️ Core Separation of Truth

| Layer | Role | Representation |
|---|---|---|
| **Master Flow Graph** | **WHAT** should happen | Product behavior, state machines, business workflows |
| **Codebase & Evidence** | **HOW** it is implemented | Routes, UI components, Next.js API endpoints, Database tables |
| **_SCOUTIT_BRAIN** | **WHY** it exists | Product intent, SOPs, legal policies, architectural specs |
| **Atomic RAG Chunks** | **RETRIEVAL** representation | Role-governed, sanitized knowledge retrieval units |

---

## 📦 Bundle Manifest

- **`schema.json`**: Strict JSON Schema Draft-07 defining Schema V2.2.0.
- **`masterFlowGraph.json`**: Pure behavioral graph containing 117 nodes and 233 semantic edges.
- **`masterFlowLayout.json`**: Decoupled visual canvas coordinates for UI rendering.
- **`atomicRAGChunks.json`**: Complete internal retrieval corpus (603 chunks) for Admin & Staff.
- **`publicRAGChunks.json`**: Strictly sanitized public retrieval corpus (192 chunks) with zero technical leakages.
- **`workflows.json`**: 5 end-to-end user and system workflows with ordered milestone validation.
- **`linearGuides.json`**: 3 interactive guides (1 Executable Buyer Guide + 2 Macro Guides).
- **`coverageReport.json`**: Mathematical domain coverage metrics across 9 key lifecycles.
- **`auditReport.json`**: Codebase alignment audit, state transition matrix, repository fidelity report, and overall trust score.
- **`checksums.json`**: SHA-256 integrity verification hashes covering the entire release manifest.
- **`index.js`**: Canonical JavaScript entrypoint exporting directly from `masterFlowGraph.json`.

---

## 🔍 Validation Status
- **JSON Schema:** Validated with Ajv Strict Mode.
- **Commit Binding:** `7e6e09a024d576c7d40d13f90dd0311da20b5a79`
- **Public Isolation:** Zero internal endpoint or database table leakage.
