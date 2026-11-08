# Impact algorithm and refinement

Use SourceReference.path against both old and new Git paths. Normalize valid relative paths and contained baseline symlink aliases for comparison without rewriting stored references. Node and Edge sourceIds imply their owning Flow; EntryPoint sourceIds imply its root Flow and activation-review scope. Flow itself has no sourceIds. File-level evidence depends on the entire file. For ranged evidence, old-side hunks locate changes relative to the baseline, not current line-number equality. Edits, offsets before a reference and context changes outside its range all require review. Do not equate unchanged cited text with unchanged imports, wrappers, factories or configuration.

The draft helper conservatively maps every reference in a changed file, with hunk-based reasons. It intentionally does not prove semantic independence of methods in one file. Targeted inspection can narrow that scope only with a documented reason. Unrelated files should not invalidate graph components when their lack of execution/configuration impact is established; filename extensions alone are not that evidence.

Build a finite dependency review graph:

1. A detail Flow points back to each parent Flow with a node.expandFlowId referencing it. This is hierarchical documentation context, not a new call edge.
2. For each cross-flow execution Edge, connect both source and target contexts for revalidation. A changed consumer may invalidate an incoming producer relationship; a producer/routing change may alter eligibility of receiving contexts. Use actual kind/mode and source ownership. Do not infer new message recipients during planning.
3. Seed all directly changed Flow contexts, then traverse dependents with a visited set. Preserve each existing Flow once, record reasons/relationship IDs, and expose affected EntryPoints whose root is in the closure. Cycles and reusable detail do not cause recursive copying.

The helper returns this conservative closure and every affected cross-flow relationship. It leaves independent graph components unchanged. A shared service can therefore affect several entry roots; unrelated entry roots need not join that closure.

Discovery review is separate from existing-graph closure. Changed activation references require entry rediscovery. Added/unmapped files, changed injection/configuration/loader/registration mechanisms or new module boundaries can introduce paths absent from the graph. For deleted/moved modules, inspect unchanged import/loader dependents too: a broken shared bootstrap import can affect otherwise independent entries not connected by old Flow links. Consult the M5-01 coverage ledger and trace the relevant registration mechanism. Do not use a closed list of REST/scheduler/broker names or assume all config changes are harmless. If a config/registration role is only evident from source rather than graph fields, state the targeted inspection result explicitly. There is no approved per-reference role field to invent.

The helper surfaces unmapped paths rather than claiming no impact. Resolve them through targeted file/ownership review: unrelated with reason, scoped rediscovery with affected mechanism/entries, or unresolved/broader analysis. Whole-tree restructuring, missing/inconsistent references, dynamic registration without established targets and unstable baselines require broader discovery. A helper targeted result is only an evidence-based draft, not permission to skip this review.

Plan format: scope and provenance; changed paths/status/rename pairs; direct and transitive Flow IDs with reasons; affected versus rediscover EntryPoint IDs; cross-flow/async Edge IDs to revalidate; exclusions and unresolved areas; targeted versus broader/full recommendation. Keep this as a transient response or explicitly requested human-readable report, not a new versioned JSON artifact. Do not regenerate docs/JSON or build HTML.

For explicitly requested regeneration, pass the reviewed plan, original change evidence and trusted generated baseline to [pflow-regenerate](../../pflow-regenerate/SKILL.md). Impact planning alone still authorizes no updates.
