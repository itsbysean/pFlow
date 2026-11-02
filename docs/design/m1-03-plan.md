# M1-03 implementation plan

Research: `main` is clean at `ff3c825`. M1-01 is approved. M1-02 contains schema 1.0.0, three sample bundles, and 92 Node/Ajv tests. Existing links use literal anchors but lack reverse ownership and duplicate-anchor checks.

1. Define a documentation profile over the existing model. Use `index.md`, entity-ID anchors, concise execution sections, and source-ID reference links. Preserve optional model fields and schema 1.0.0.
2. Add index and execution templates. Update sample Markdown and only the JSON `docs` associations needed to match it. Preserve graph IDs, evidence, and execution relationships.
3. Add a test-only Markdown contract checker after existing artifact validation. Check canonical Flow/Node mappings, section IDs and owners, index coverage, local navigation, and source-link consistency. Use a small line scanner, not a Markdown framework.
4. Test valid bundles and mutations that break each convention. Retain the M1-02 checks and add positive cases for title changes, file-level evidence, and optional Node documentation.
5. Review the final artifacts against M1-01/M1-02, run the tests, record limits, and commit on `main` as requested. Do not start M2.

No schema fields or execution semantics change. This profile defines how documented bundles use the existing `docs.path`, `docs.anchor`, and entity IDs.
