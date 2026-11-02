# M6-04 real repository evaluation plan

Preserve all uncommitted M6-01–M6-03 work and project history. Originals are read-only. No downloads, target scripts, dependency installs, live infrastructure or M7 analysis.

## Selected real scopes

1. Tidefolk API, local main db0b85fd4541b4841e1be9546e882ebfe2bb30cb. Copy complete production src/ plus tracked safe build/Worker metadata and SQL migrations into an isolated plain-file target. Discover the actual registration inventory; trace bounded POST /auth/guest, GET /health and Google callback integration paths. Explicitly report other untraced routes. This covers modern TypeScript, custom composition, branches/errors, HTTP and D1/library boundaries.
2. Dotal microservices, local feat/redis-scheduler-lock 3ce56327529d358cbc70c2fa482d62c80385f5e6. Copy selected logging/common/web plus their member/notification/auth core source closure and non-secret build/config templates. Trace logging consumer and controller/storage paths, configuration-driven registration and scheduler factory evidence. Verify the candidate LoggingAspect producer reachability rather than assuming it. Research currently finds it outside the logging application's component scan; leave its async connection unresolved unless further source proves activation.

Copies preserve source-relative paths and byte provenance; exclude .git, dependencies/build output, environment/secret files and unrelated user data. Record allowlist hashes plus original HEAD/index before evaluation and compare afterward. Only disposable evaluation copies get Git setup/controlled commits for baseline/incremental tests.

## Observable acceptance before execution

- Source-checkout Skill invocation succeeds with the trusted pFlow Node dependencies and no install/parser/build tool in targets. No prebuilt distribution currently exists: report installation limitation instead of inventing packaging.
- At least one real source copy produces a schema/semantic/Markdown-valid bundle and standalone HTML. Use the approved architecture.json + sibling docs/ layout, not the request's incompatible illustrative flat diagrams layout.
- Independently check representative activation, owned bindings, branch/exit, external metadata and source locations; validator success is not semantic proof.
- Open relocated HTML offline with only one file request and verify entry/drill-down/node/edge/docs/snippet/search/keyboard interactions.
- On the Tidefolk copy, capture a trusted generated baseline/source snapshot and hashes, then make controlled semantic branch, route-registration and call-removal changes in separate rounds. Collect/refine impact, regenerate/apply, validate/rebuild, retain proven IDs/manual notes and unchanged artifacts when justified.
- Exercise bad baseline, missing/broken artifact, Builder packaging failure and partial apply failure against disposable copies. Prior valid output must remain. Existing realistic async/cycle fixtures cover scenarios not proven in real scope and are labeled fixture-only.
- Fix only reproduced in-scope defects, add regressions, run full tests and independent review. Report supported/unsupported/analysis/usability findings. No new architecture or deployment capability and no M7.
