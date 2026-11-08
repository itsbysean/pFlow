# Documentation lifecycle implementation and evaluation

## Research and decisions

The existing graph already records Entry Points, Flow-owned Nodes/Edges, branches, detail references, SourceReferences and Markdown associations. These remain authoritative; model 1.0.0 is unchanged. Coverage states, analyzed scope and a VCS-independent generated baseline were missing. Existing M6 planning requires retained Git provenance, while the Builder, bundle-layout resolver and safe-update transaction do not require Git.

Implementation reuses:

- `builder/output-policy.mjs` and `builder/bundle-layout.mjs` for output selection, containment and flat/legacy resolution.
- `builder/pipeline.mjs`, shared validators and `builder/html.mjs` for full candidate validation, safe Markdown, bounded snippets and standalone Viewer generation.
- `src/skills/pflow-regenerate/scripts/safe-update.mjs` fingerprintBundle/applyBundle for freshness, recoverable publication and rollback. Its Git-based mergeDocument is not used by the common lifecycle.
- The canonical Flow-block reader from regeneration, extended with an optional entity prefix to protect unaffected Entry Point prose too. Existing M6 callers retain default behavior.
- `packaging/cli.mjs` and the existing bundle build for one installed runtime.

The main agent recorded this plan before implementation: retain public contracts, add one versioned lifecycle sidecar for missing coverage facts, derive dependencies/artifact mappings from the graph, use file hashes instead of revision IDs, accept reviewed AI candidates rather than create a second analysis engine, and publish all artifacts through the existing transaction.

## Changed components

| Component | Change |
| --- | --- |
| lifecycle/documentation.mjs | Detection, Snapshot validation, scoped inventories, impact closure, staged create/update/full recovery |
| packaging/cli.mjs | lifecycle-detect, lifecycle-plan, lifecycle-publish and matching exported APIs |
| src/skills/pflow/SKILL.md | Create/update routing, mixed evidence and common lifecycle integration |
| src/skills/pflow/references/lifecycle.md | Snapshot 1.0.0 profile, ownership, scope, evidence, analysis and publication workflow |
| src/skills/pflow/references/runtime.md | CLI request/API contract |
| src/skills/pflow/references/{prompt-analysis,prompt-evidence,generation,build}.md | Prompt amendments, coverage baseline and shared publication guidance |
| src/skills/pflow-regenerate/scripts/regenerate.mjs | Reusable section-reader export; no M6 safety changes |
| README.md, builder/README.md | Current lifecycle usage and limitations |
| website/index.html | Four requested example prompts, Korean equivalents, copy controls and current update guidance |
| test/documentation-lifecycle.test.mjs | 30 behavior tests, including isolated installed-runtime/offline checks |
| test/homepage-prompts.test.mjs | Actual browser copy and language-switch behavior |
| test/skill-packaging.test.mjs | Required-reference assertions replace obsolete fixed reference count |

## Observable lifecycle behavior

Detection is confined to the selected workspace. Explicit update selects the identified bundle, explicit new requires a fresh destination, ambiguity or multiple matches returns clarification. No matching bundle allows creation. Normal output scaffolding works through selectOutput(create:true).

Snapshot 1.0.0 stores a retained doc_ identity, derived evidence kind, scoped file SHA-256 inventory, source-origin mapping, one explicit coverage state/reason per Node, limitations and canonical artifact fingerprints. Starts, steps, branches, symbols, dependencies and artifact associations remain in the existing graph. No duplicated public graph or VCS schema is introduced.

Planning compares current bytes, including uncommitted changes. Direct evidence and declared scope dependencies identify affected Flows. Reusable details propagate to parents; cross-flow dependencies propagate to both contexts; visited sets terminate cycles. New unmapped paths trigger full reanalysis. Renames are conservatively additions/deletions; no identity is guessed from content equality.

Candidate graph and Markdown come from AI reanalysis. Unaffected graph entities, Flow/Entry sections and coverage are protected. Dropped owned documents require explicit deletion; unowned files are preserved. Changed relationship endpoints/kind/mode require new edge IDs. Original natural-language statements are immutable and amendments are captured separately. Contradictions or materially missing details require clarification. No source-kind precedence is invented.

The publisher validates and builds a private stage preserving real relative citation topology. Evidence, Markdown, graph, Snapshot and HTML are published together. Evidence/bundle/stage changes invalidate a stage, including an unchanged plan. Failed validation cannot replace output; publication failure restores the prior bundle when rollback succeeds. This is a recoverable two-rename transaction, not power-loss-atomic publication. An unchanged update leaves bytes and mtimes intact.

## Executed automated verification

Environment: local Node 26.13.0 and installed headless Google Chrome. Supported runtime minimum remains Node 24; this run does not claim a new Node 24 platform matrix.

- `node --test test/documentation-lifecycle.test.mjs test/homepage-prompts.test.mjs`: **31 passed, 0 failed**.
- Final stabilization checks: `node --test test/documentation-lifecycle.test.mjs test/skill-packaging.test.mjs test/homepage-prompts.test.mjs`: **41 passed, 0 failed** after preserving omitted limitations and tightening capture/scope validation. The final CLI help wording change was also included in the rebuilt ZIP.
- `npm test`: **675 passed, 0 failed, 0 skipped** (49.45 seconds), including existing M1–M6, layout, Viewer, search, output containment, rendering, release and package regressions.
- `npm run build:release`: generated ignored `dist/pflow/`, pflow.zip and checksum. One runtime, no new runtime file/dependency. Package version remains 1.0.2; no release was published or version bumped.
- Skill quick_validate: passed in a temporary PyYAML environment. The system Python lacks PyYAML; nothing was added to project dependencies.
- `git diff --check`: passed.

| Requested scenario | Actual test/evaluation |
| --- | --- |
| Initial code / natural-language / mixed creation | Published real graph, Markdown, Snapshot and HTML; ran existing Builder preparation |
| Existing / explicit update / explicit new / ambiguous / multiple target | Workspace detection results asserted; overwrite attempts rejected |
| Ordinary directory / Git with uncommitted content / non-Git environment | Current-byte planning in each; .svn marker directory confirms no VCS assumption, not an SVN client integration |
| Added and removed calls | Reanalyzed authored candidate graph applied; stale call removed and unrelated Markdown bytes retained |
| Shared component | Shared evidence change affects both documented starts through detail references |
| Prompt insertion and branch modification | Separate exact amendment evidence; original statements retained; supported graph changes published |
| Missing critical prompt details | Unreviewed candidate blocked and original complete bundle fingerprint retained |
| Mixed update | Code changed while unrelated natural-language evidence/provenance and manual file remained |
| No changes | No writes or mtime changes; a late source edit invalidates the prepared no-op |
| Missing/incompatible Snapshot | Full reanalysis/ownership guidance, no automatic overwrite |
| Damaged/missing/incompatible graph | Explicitly approved full recovery succeeds and preserves unrelated files |
| Graph/Markdown consistency | Existing semantic and Markdown validators applied to exact staged artifacts |
| Failed validation/publication | Original complete bundle retained; injected rename failure exercises actual rollback |
| Traversal/symlink safety | Unsafe references rejected; existing containment suites also pass |
| Cyclic/async dependencies | Deterministic bounded impact traversal; both relationship contexts revalidated |
| Flat/legacy compatibility | Approved legacy baseline adoption and subsequent update without migration |
| Packaged execution | Isolated runtime with empty PATH creates and updates; no Git, SVN, development files or node_modules required |
| Standalone Viewer | Inputs and installation removed before file:// Chrome navigation; SVG renders, no page errors, only the HTML request |
| Homepage prompts | Exact four English examples copied through browser controls; Korean switch hides English and copies Korean text |

These tests exercise deterministic tooling with authored evidence-backed candidate artifacts. They do not prove arbitrary AI analysis accuracy, arbitrary language coverage, an SVN revision collector, or production behavior.

## Independent forward evaluation

A separate agent followed the actual Skill in an isolated temporary workspace, with no Git/network/target scripts. Input: an employee submits a purchase request, Finance reviews it, purchasing places the order, then the process ends. It captured the exact supplied statement, produced four supported Nodes, two canonical Markdown documents, graph, Snapshot and HTML, and ran the actual validate CLI: one graph, two documents, zero diagnostics.

Installed Chrome opened the resulting file:// HTML: four SVG Nodes, zero page errors and only the HTML request. A subsequent description added manager approval for requests above $10,000. The agent obtained a targeted impact plan, identified an unspecified non-approval outcome, recorded an unanswered focused question and preserved the existing graph/evidence/HTML. It did not fabricate a rejection path or claim amended-process publication. This independently verifies creation, planning and safe clarification; successful amendment publication is covered by deterministic fixtures, not this forward evaluation. It is not a human usability study.

Temporary evaluation evidence was retained under `/private/tmp/pflow-forward-lifecycle/` during the session; it is not a repository artifact or a distributed dependency.

## Review and stabilization

The independent first review identified four concrete defects. All were corrected and exercised by regression tests:

1. Approved empty output scaffolding was rejected by creation. Creation now accepts only the expected empty flows/diagrams/evidence scaffolding, and the actual selectOutput default path is tested.
2. Approved full recovery tried to parse a damaged old graph. Recovery now resolves retained layout without requiring valid old graph content; missing JSON, malformed JSON and unsupported model versions are tested.
3. Removed owned Markdown could survive as an untracked stale document. Dropped owned paths now require explicit deletion review; removal is tested.
4. A prepared unchanged result bypassed freshness checks. Its apply path now compares a freshly computed plan token; a late edit is tested.

The main agent additionally protected unaffected Entry Point prose, normalized source paths for impact matching, checked Snapshot evidence-kind integrity and portable artifact paths, and removed contradictory prompt-update guidance. A fresh independent second-pass reviewer could not start because the agent service reached its usage limit. No successful final independent re-review is claimed. The original independent findings are resolved by executed regressions; final stabilization was reviewed by the main agent.

## Limitations and delivery boundary

- Analysis remains AI-driven, language-independent and evidence-based; runtime review flags do not prove evidence semantics or grant authorization.
- Correct scope selection is essential. The runtime cannot discover ignored source areas or infer a hidden dependency. Unmapped changes force broader review rather than silently skipping them.
- Whole-file fingerprints are conservative; line shifts and formatting-only edits can require range/context review. File permission-only changes are not source-content changes in this profile.
- Inventory limits: 8 MiB per file, 128 MiB per run and 10,000 files. VCS metadata and node_modules are excluded; manifests/configuration/discovery roots must be explicitly covered.
- Missing legacy baselines, manual canonical edits, uncertain identity or material scope changes require an ownership/authorization decision before full replacement. Original prompt statements must be restored if changed, then amended separately.
- Shared-document protected sections can force conservative review if global Markdown structure/evidence definitions change. The workflow does not perform automatic manual-text merges.
- Mixed evidence needs one explicitly confirmed containment root that can resolve both code and captured statements. No root is widened silently.
- Creation uses a dedicated absent/empty destination with an existing parent created by the shared output selector. Replacing cwd or an ancestor remains prohibited.
- No database, daemon, new graph schema, Viewer redesign, VCS requirement or potential-bug analysis was added. Existing M6 Git provenance rules remain unchanged.
- Homepage changes and the rebuilt ZIP are local only. No commit, push, PR, website deployment or release was performed.
