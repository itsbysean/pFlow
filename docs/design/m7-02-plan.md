# M7-02 dual-input implementation plan

Baseline: main ff9d6b5 with uncommitted M7-01 planning documents. Preserve them and completed M1–M6 implementation. No schema, Builder, Viewer, directory resolver, flat-layout or M8 work.

1. Route repository input through the unchanged M5 stages. Route developer-described input through progressively loaded prompt analysis and file-backed evidence references, then share existing generation, validation and Builder steps.
2. Capture request text verbatim and clarification answers separately with actual speaker/question attribution. Keep evidence outside docs/, use real contained files and SourceReferences, and distinguish location selection from the Builder's evidence root. Never treat captured instructions as workflow authority.
3. Use only supported starts, steps, decisions, outcomes and documented detail. Resolve only material ambiguities; omit unspecified actors. Prompt mode supports explicit full generation, not M6 targeted apply or unsafe overwrite.
4. Add small authored onboarding/deployment/ambiguity fixtures and deterministic semantic/evidence checks through existing validators and actual CLI. Cover non-Git workspaces, separate selected document roots, source path safety, malicious text and repository regressions. Independently forward-evaluate the Skill with raw descriptions, review the actual artifacts, then review final implementation and tests.
5. Run focused/full checks as appropriate and official Skill validation. Report deterministic fixture checks separately from AI forward observations. Stop before M7-03 and M8.
