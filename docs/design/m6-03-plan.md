# M6-03 plan

Working state: main afdb8f2 with uncommitted M6-01/M6-02. Preserve those changes and history. Research confirms prepareBuild already validates every discovered envelope and its mapped corpus; IDs are envelope-scoped and no cross-envelope resolver exists. Do not duplicate validation or rendering.

1. Add a small whole-set inspect/rebuild integration and source Skill, using existing M4 prepare/writer/output protections. Recheck discovery/corpus/evidence/assets and prior output before atomic publication; skip equal bytes.
2. Preserve the approved index representation. Existing M1 assigns plain entry/trigger prose to review; require that completed review bound to the exact current inventory rather than guessing stale entry labels or introducing markers. Rejected/missing/stale review prevents publication.
3. Connect M6-01 → M6-02 apply → complete current-set validation/review → M4 generation → safe HTML replacement. A failed rebuild retains prior HTML and successful regenerated docs. No new analysis/Viewer/Builder/schema pipeline.
4. Test untouched invalid envelopes, envelope-scoped repeated IDs, invalid local/cross-flow/hierarchy/async/doc references, stale entry prose review, input/output freshness, real missing-asset failure, idempotence and offline HTML after actual regeneration. Independently review and fix confirmed issues. No real-repository E2E, project commit or M6-04.
