# Shared output selection and bundle roots

Use the trusted [packaged runtime](runtime.md) select-output command or exported selectOutput helper before creating documentation. It selects directories and returns filesystem paths only; it does not infer ownership, write Markdown/JSON/evidence, migrate a bundle or run analysis.

Call with mode repository or prompt. Supply repositoryRoot for repository mode, cwd for prompt mode, and actual documentWorkspace/outputDirectory values when selected by the user. Use canonical absolute root paths. The selector rejects symlinks in selected paths; do not canonicalize a rejected child destination into a different approved root or fall back elsewhere.

```js
const { selectOutput } = await import('/installed/pflow/scripts/pflow.mjs');
const selection = selectOutput({
  mode: 'prompt', cwd: '/current/project',
  documentWorkspace: '/selected/documents', outputDirectory: 'architecture'
});
// Inspect existing content and resolve ownership before writing. Once safe:
const ready = selectOutput({
  mode: 'prompt', cwd: '/current/project',
  documentWorkspace: '/selected/documents', outputDirectory: 'architecture',
  create: true
});
```

These are placeholders. Pass paths as data, never interpolate untrusted text into shell code. An explicit workspace alone is the final bundle directory. If outputDirectory is also given, a relative path is inside that workspace; an absolute path must remain inside it. Do not choose the first registered folder. An explicit outputDirectory without a workspace is used as the final destination, with no extra architecture/ appended.

Without an override, the helper selects the analyzed project root in repository mode or current working directory in prompt mode. It prefers existing docs/, then existing doc/, otherwise new docs/, with architecture/ underneath. A selected file collision, symlink or unwritable directory fails; it never silently tries another folder. create defaults to false; create:true creates only checked directories, not content or HTML. Pass known source/evidence absolute paths as protectedPaths to detect output aliases/hardlinks before writes.

Use returned bundleRoot, graphPath, docsRoot and outputPath rather than reconstructing paths. New bundles are flat:

```text
<bundle>/index.md
<bundle>/flows/*.md
<bundle>/diagrams/architecture.json
<bundle>/evidence/request.md       # prompt input only, answers separately
<bundle>/architecture.html
```

Existing legacy architecture.json + docs/ bundles retain their layout. The shared builder/bundle-layout.mjs resolver is also used by preparation and M6; it rejects competing graphs/corpora instead of migrating or duplicating documents. A new output containing unowned index/HTML/corpus files is blocked for review; a recognized graph does not itself establish generated ownership. Preserve manual/unknown content and apply the selected mode's ownership rules.

Root roles:

- selectionRoot determines the default location; it is not necessarily the evidence base.
- containmentRoot bounds generated documentation and prompt evidence. With a designated workspace, it is that workspace. With only an explicit output directory, it is the final bundle itself. Defaults stay under the selection root.
- evidenceRoot is always the actual analyzed project in repository mode, even for external output. In prompt mode it is the selected document containment root. Pass it as the existing Builder --repository-root and validator sourceRoot. SourceReference.path stays relative to it.

JSON docs links remain relative to docsRoot, with unchanged canonical IDs. Recompute Markdown source definitions from the actual document path to actual evidence: flat flows/name.md typically cites ../evidence/request.md; legacy docs/flows/name.md cites ../../evidence/request.md. The corpus is index.md plus mapped entity documents, not every Markdown file beneath docsRoot. Raw evidence must not become a mapped canonical document or duplicate searchable prose.

M6 targeted regeneration remains repository/Git-only and requires a separate contained bundle, trusted baseline and no source evidence overlapping output. It resolves flat or legacy paths, preserves the existing layout and blocks a baseline/current layout mismatch. External full generation is supported; external repository bundles still cannot use targeted apply. Prompt incremental merging is unsupported. No resolver result authorizes overwrite of manual content, source files, conflicting roots or a different selected workspace.
