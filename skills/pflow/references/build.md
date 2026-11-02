# Validate, build and verify

Use the trusted installed [packaged runtime](runtime.md), not the target project's scripts. Node.js 24+ is required; Skill users do not install npm dependencies. The final HTML needs neither Node nor the installed Skill or original inputs.

Before building, run `scripts/pflow.mjs validate --input <bundle> --repository-root <selected-evidence-root>` through the trusted runtime. This includes the existing Draft 2020-12 schema, semantic and Markdown association checks. Resolve every error; report blocked conflicts instead of silently skipping a graph/document. Select the actual project root for repository mode, or the confirmed document containment root from [prompt evidence](prompt-evidence.md) for prompt mode; pass that same root as --repository-root. A non-Git document workspace is valid. Review described steps/order/clarification evidence in prompt mode and invocation, dispatch, configuration and transfer meaning in repository mode separately: valid IDs/ranges cannot prove those claims. Check evidence associations, not just inspected files: repository library metadata needs the package-to-factory binding, and resolved configuration needs the active loader plus selected values. Prompt claims need their actual developer statement/answer, not a generated summary or the agent's question. Include that chain in the owning node/edge references and canonical citations.

Use [shared output selection](output.md) and the layout resolver for actual graph/Markdown paths; never guess sibling docs/. Invoke the existing CLI using argument arrays or safely quoted absolute paths:

```sh
node /installed/pflow/scripts/pflow.mjs build \
  --input /target/docs/architecture \
  --repository-root /target \
  --output /target/docs/architecture/architecture.html
```

These are placeholders: resolve actual paths and quote spaces. The output parent must already exist. Explicit --repository-root is essential when input is a documentation subdirectory. Do not run target build/start/install scripts. Do not add a server, network fetch, runtime CDN, custom packaging script or a second Markdown renderer.

The Builder repeats validation, renders safe Markdown with existing Viewer code, extracts bounded referenced source snippets and embeds graph/docs/snippets/Viewer/search in the single HTML. A nonzero exit blocks success. Preserve existing successful HTML on failure; the Builder commits output atomically after successful validation/packaging. Report warnings: file-level evidence and safety-limit skips may provide locations without snippets. Do not invent missing source or suppress diagnostics. Artifact validation is distinct from code execution and deployment verification.

Where browser tooling is available, open the generated file through file:// with network access disabled. Verify entry switching, detail expansion, node/edge inspector selection, document-section navigation, a source snippet and Markdown body search. Async remote stubs do not automatically expand into consumers. Confirm only the HTML is requested; move it away from input files when practical. If browser verification is unavailable, report that boundary instead of claiming offline interaction success. Repeated builds of unchanged artifacts should be byte-identical.

Report output paths, counts/coverage, unresolved limitations, validation/build/warning status and exactly which offline interactions were verified. Do not claim automated AI semantic correctness or complete repository coverage. Stop after the requested generation. Supported repository incremental operations require their explicit scope and baseline review; potential findings remain deferred to M9.
