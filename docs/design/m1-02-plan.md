# M1-02 implementation plan

Source of truth: the approved M1-01 design. Approval was recorded on 29 October 2026.

Research: the workspace contains only M1-01. There is no package setup or test convention. Node.js and npm are available. A Git repository was initialized on `feat/m1-02-data-contract` before implementation.

1. Define model version `1.0.0` with JSON Schema Draft 2020-12. Use only approved fields and enums. Keep structural constraints in the schema.
2. Add three small sample bundles: synchronous execution, evidenced messaging, and custom XML task dispatch. Include concise Markdown and illustrative source/configuration fixtures so references can be checked.
3. Use Node's test runner and Ajv's Draft 2020-12 validator. Add a test-only semantic helper for IDs, reference types, ownership, hierarchy links, source ranges, document targets, and local reachability. Do not build a CLI or general validation framework.
4. Test valid bundles and mutated contract violations. Include positive cases for reusable flows, recursive expansion, execution cycles, and unresolved boundaries.
5. Review the schema and samples against M1-01 in a separate review pass. Fix verified defects, document validation commands and limitations, and report results. Stop after M1-02.

The schema version and test tooling are M1-02 implementation choices. No graph fields or execution semantics are added.
