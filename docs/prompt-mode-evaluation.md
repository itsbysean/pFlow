# M7-02 prompt-mode evaluation

M7-02 extends the existing pFlow Skill, not the public graph, Builder or Viewer. Repository mode still uses M5 discovery, execution, boundary and async analysis. Prompt mode loads [prompt analysis](../src/skills/pflow/references/prompt-analysis.md), captures [real evidence files](../src/skills/pflow/references/prompt-evidence.md) and joins the existing generation/validation/build stages.

## Current invocation and roots

Use the Skill with a repository scope or a natural-language process and intended document location. Prompt input does not require a Git repository or manually prepared evidence. A separately selected document workspace is the containment root; the order of registered folders is irrelevant. The agent inspects and states the concrete bundle before writes. Default prompt selection follows current-directory docs/, else doc/, else new docs/, with architecture/ beneath it. This is instruction-level agent selection only; there is no new automatic directory resolver. The flat layout is not implemented.

For example, with document workspace /documents and bundle /documents/architecture:

```text
/documents/architecture/
  architecture.json
  docs/index.md
  docs/flows/process.md
  evidence/request.md
  evidence/clarification-001.md   # only after an actual answer
  architecture.html
```

The JSON request path is architecture/evidence/request.md. Pass /documents as the existing Builder --repository-root, and /documents/architecture as --input. Canonical JSON docs paths remain flows/process.md. A Flow document's source definition resolves ../../evidence/request.md. Existing schema/root/symlink validation remains active. An explicit bundle used as its own complete document workspace instead has evidence/request.md relative to that root.

The original request file is the exact UTF-8 description without an added header/newline or normalized line endings. Separate clarification files label the actual agent question and developer answer. Answer ranges support clarified facts; the question alone does not. Raw evidence stays outside the canonical docs/ corpus and is not indexed as a generated document. It may appear in the existing bounded evidence-snippet view. Generated prose never proves itself.

## Deterministic evaluations

Command: node --test test/prompt-mode.test.mjs. Result: **18/18 passed**, zero failures/skips.

Fixtures under test/fixtures/prompt-mode are small authored review examples, not an NLP parser or a record of autonomous AI generation:

| Case | Behavior checked |
|---|---|
| Onboarding in a non-Git workspace | Existing schema and canonical Markdown accept 2 Flows, a real condition, documented account/link substeps and supported starts; no actor is invented |
| Deployment | Explicit pass publishes; fail aborts. Exact outgoing endpoints and steps exclude extra approval, rollback, retry or unspecified responsibility |
| Hierarchy | A prepare-access occurrence opens documented substeps; caller continuation remains local; no fabricated cross-flow execution edges |
| Essential missing detail | Stopping an incomplete attempt requires the developer answer. Substituting a source that only says “ask for missing details” remains structurally valid but fails the semantic evidence witness |
| Exact capture and attribution | Request bytes match raw input, including Unicode; CRLF input remains CRLF. Clarification question/answer text and labels match their separate raw inputs; the numbered snippet is the exact developer answer |
| Question is not an answer | A structurally valid range pointing at the agent's question fails the answer-evidence witness |
| Missing/invalid evidence | Missing file, prompt:// URI, parent traversal, symlink escape and out-of-range lines fail actual CLI builds without replacing valid HTML |
| Explicit document workspace | All generated files remain in the selected documents folder; a first-registered application sentinel remains unchanged; repeated HTML generation is byte-identical |
| Instruction-like evidence | Original appendix is retained but does not create filesystem/network steps. Literal HTML/script-like message text remains inert in rendered Markdown, embedded data and source evidence |
| Existing repository input | An existing M5 generated fixture still uses real boot/config evidence and code snippets through the same prepareBuild, with no new prompt evidence requirement |

The semantic counterexamples demonstrate a review boundary: validators check shape, links, files and ranges; they cannot establish that a phrase proves a responsibility or branch continuation. No test claims to parse arbitrary natural language or prove general Skill correctness. Existing files/AST/runtime code are not executed to analyze prompt input.

## Offline browser check

The focused suite generates onboarding HTML with the existing CLI, relocates it and deletes the input document workspace. Chrome opens the file with networking disabled. Keyboard selection preserves the Flow; explicit expansion opens the access detail and Back returns. The source panel shows the exact clarification answer at its real line. Search finds and highlights sign-in documentation. A second malicious-text output executes no injected script and triggers no asset/network requests. Only the two opened file:// HTML requests occur, with no page errors.

This is a Chrome check of authored fixture artifacts, not browser verification of every AI-generated output or a cross-browser guarantee. Software-oriented labels remain intentionally unchanged until the presentation task.

## Independent forward evaluation

An independent agent received only the revised Skill and a deployment description before reading these fixtures or their expected outputs. The description specified release coordination, package build/checksum substeps, staging checks and pass/fail outcomes. It used an explicitly selected non-Git documents workspace beside another registered application folder.

Observed output: 1 EntryPoint, 2 Flows, 10 Nodes, 8 Edges. Original evidence bytes were exact. Existing validateDocumentation returned no diagnostics. Two actual Builder CLI runs exited 0, with no warnings, and produced identical 142805-byte HTML. All relationship modes remained unknown where waiting semantics were unstated; detail navigation added no parent/detail execution edges. The neighboring application sentinel was unchanged.

For a separate ambiguous description (“A request is checked; if unacceptable, handle it. Otherwise continue.”), the agent asked what each outcome means and where it proceeds. It fabricated no reply or completed graph. No question about an unspecified actor was needed.

Private forward artifacts and results: /private/tmp/pflow-m7-02-forward/documents/architecture and /private/tmp/pflow-m7-02-forward/forward-results.json. These are local evaluation evidence, not test dependencies or distributed product samples. One blind run does not establish general prompt-analysis accuracy. Additional independent literal-text/ownership review scenarios are reported separately from that blind run.

## Safety and limits

Existing manuals/unknown content are not authorized for overwrite by a prompt full-generation request. A safe ownership/baseline decision is required first. The Skill stops for approval when missing; it does not invoke M6 targeted regeneration or relax provenance/source-output overlap guards. Full prompt incremental merging is unsupported.

Location selection and capture are performed by the Coding Agent following instructions; this milestone does not introduce a runtime capture API, automatic resolver or new enforcement engine. The existing validators and Builder enforce actual evidence/file containment once supplied. A selected output that cannot fit those roots must be clarified rather than bypassed.

Current architecture.json + sibling docs/ layout remains required. M7-03 path/layout refactoring, generic UI wording, structured participant models and all M8 findings/review/report features remain outside this task. M1–M6 code and public contracts are unchanged; later prompt requests still need evidence review, not just a successful build.

## Final review and regression results

Full npm test: **507/507 passed**, zero failures/skips. The official skill-creator quick validator passed for src/skills/pflow. An independent reviewer also reran all 18 focused tests, including offline Chrome, and verified the full-suite log.

Independent additional checks (after exposure to the authored tests, so not blind): a literal-message prompt retained exact evidence and produced only the described display/finish steps. Its actual CLI build passed without warnings, producing 137077-byte HTML; parsed output contained no active injected markup. No outside file or network action occurred. In a separate copy containing a manual note, a changed prompt request stopped before replacement for a baseline/ownership decision. Every prior bundle byte and the previous HTML were retained, and M6 was not invoked.

These extra observations are recorded at /private/tmp/pflow-m7-02-forward/extra-results.json and the final independent audit at /private/tmp/pflow-m7-02-forward/review.md. The literal forward output was inspected structurally; browser script-execution checks belong to the authored offline test described above. Review found no unresolved critical issue. Early wording about evidence/ applying to repository input was clarified to prompt-only, and stale README usage text was updated. No public contract or runtime integration change was needed.
