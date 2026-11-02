# M5-05 plan

Start: main aa14768. Research verifies four existing source Skills, M1 validators/Markdown profile and current M4 CLI. Builder requires architecture.json with sibling docs/ and does not merge envelopes. Adopt docs/architecture/{architecture.json,docs/index.md,docs/flows/*.md,architecture.html}; no schema or Builder change.

1. Add one main source Skill that explicitly sequences the existing four capabilities, final canonical artifact generation, shared validation and trusted Builder execution. Use progressive references; keep source/tool/output roots separate and restrict writes.
2. Reuse prior raw fixtures in a compact end-to-end target covering registered consumers, owned detail, conditions/errors, HTTP/database/messaging, configuration and an unresolved dynamic call. A fresh agent starts from raw source, without earlier oracles/tests, and produces Markdown/JSON plus HTML through the actual Builder.
3. Independently review evidence, graph/docs semantics and output isolation. Preserve reviewed generated artifacts as non-build-named snapshots, with tests materializing them in temporary compatible bundles.
4. Test actual artifacts, invalid references and deterministic Builder integration. Open relocated HTML offline and verify navigation, expansion, selection, Markdown/source/search. Run existing tests, Skill validator and default Builder regression. Commit locally on main; stop before M6.
