# Impact review

Check explicit baseline provenance and actual commit/working-tree scope before trusting a diff. Validate old artifacts against baseline files; a valid current path/range can still cite the wrong shifted code. Verify deletions/renames/binary/type/untracked changes and ignored/submodule limits are not silently discarded.

For changed references, review entry evidence separately from node/edge ownership. Check shared detail parents, incoming and outgoing cross-flow relationships, async routing/configuration and finite reverse closure. Being in the impact plan means review may be needed, not that delivery or runtime reachability was proven. Inspect changed mechanism/configuration areas outside the old graph before claiming targeted analysis is sufficient.

Use real temporary Git repositories and retained baseline source bundles for evaluation. Assert exact direct/transitive/excluded scopes and reasons, plus conservative fallback. Include source shifts, rename/move, deleted evidence, unknown registration, cyclic relationships and unrelated changes. Compare target files/index/history before and after planning. Test collector hooks/filters without allowing them to execute. Blind evaluations must exclude intended test/oracle outputs.

No target execution, history/worktree edits, new graph fields, regenerated documents, HTML build or findings are permitted. Report review limits and stop before M6-02.
