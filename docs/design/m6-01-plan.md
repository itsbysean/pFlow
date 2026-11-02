# M6-01 implementation plan

Start: main afdb8f2. Research verifies optional opaque revision, existing M1 source/graph semantics, physical baseline validation and separate source Skills. There is no prior Git utility. No approved model or persistent impact schema is needed.

1. Add a separate impact-only Skill, narrowly routed from the main Skill. Require explicit Git comparison and independently established bundle/source baseline provenance. Do not assume HEAD~1 or regenerate artifacts.
2. Add a small native-Git collector with argument arrays, NUL paths, explicit commit/working-tree scopes, rename/hunk evidence, disabled external execution and unstable-read detection. Reject unsupported unsafe/incomplete scopes instead of hiding changes.
3. Add a read-only conservative draft helper: validate old docs/graph against retained baseline source, normalize source identities, map evidence, reverse hierarchical parent dependencies and revalidate both cross-flow contexts with finite traversal. Leave source-specific discovery/exclusions to targeted Skill review.
4. Test actual disposable Git repositories for source/config changes, shifts, moves/deletions, shared callers, cycles, unmapped/unrelated files, bad provenance and source/index/history preservation. Delegate blind plan evaluation and independent safety/correctness review, fix confirmed issues, then run full regression tests.
5. Report plans and limits only. Do not regenerate docs, rebuild HTML, edit target history/index/content or start M6-02. Tests create commits only in authored disposable fixtures; no project commit is made under the no-history-change request.
