#!/usr/bin/env node
// One additive command surface over the existing tools. No analysis engine.
import { readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import metadata from '../package.json' with { type: 'json' };
import schema from '../schema/architecture-1.0.0.schema.json' with { type: 'json' };
import { parseArguments } from '../builder/arguments.mjs';
import { BuildError, prepareBuild } from '../builder/pipeline.mjs';
import { writeStandaloneHTML } from '../builder/html.mjs';
import { selectOutput } from '../builder/output-policy.mjs';
import { resolveBundleRoot } from '../builder/bundle-layout.mjs';
import { validateDocumentation } from '../validation/validate-documentation.mjs';
import { collectGitChanges } from '../src/skills/pflow-impact/scripts/git-changes.mjs';
import { planImpact } from '../src/skills/pflow-impact/scripts/impact.mjs';
import { prepareRegeneration } from '../src/skills/pflow-regenerate/scripts/regenerate.mjs';
import { inspectArchitectureSet, rebuildArchitectureSet } from '../src/skills/pflow-rebuild/scripts/rebuild.mjs';
export { schema, prepareBuild, writeStandaloneHTML, selectOutput, resolveBundleRoot, validateDocumentation, collectGitChanges, planImpact, prepareRegeneration, inspectArchitectureSet, rebuildArchitectureSet };
import { detectDocumentation, planLifecycle, prepareLifecycle, snapshotVersion } from '../lifecycle/documentation.mjs';
export { detectDocumentation, planLifecycle, prepareLifecycle, snapshotVersion };
import {findingsSchema,architectureHash,captureFindingEvidence,inspectFindings,reconcileFindings} from '../findings/validate.mjs';
import {inspectFindingBundle,prepareFindingsPublication} from '../findings/publish.mjs';
export {findingsSchema,architectureHash,captureFindingEvidence,inspectFindings,reconcileFindings,inspectFindingBundle,prepareFindingsPublication};
const safe = text => String(text).replace(/[\u0000-\u001f\u007f-\u009f]/g, char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`);
const help = `Usage: node <skill>/scripts/pflow.mjs <command> [options]

build       --input <root> --repository-root <evidence-root> --output <file.html>
validate    --input <root> --repository-root <evidence-root> [--output <file.html>]
inspect     --input <root> --repository-root <evidence-root> --output <file.html>
findings-inspect --request <options.json>
findings-publish --request <options.json> [--apply]
findings-schema Print the optional findings JSON Schema.
lifecycle-detect --request <options.json>
lifecycle-plan --request <options.json>
lifecycle-publish --request <options.json> [--apply]
select-output --request <options.json>
impact      --request <options.json>
regenerate  --request <options.json> [--apply]
rebuild     --request <options.json>
schema      Print the approved JSON Schema.
-h, --help  Show help.  -v, --version  Show version.

Node.js 24+ is required. Git is required only for the optional impact/regenerate commands.
Request files are transient tool arguments; see references/runtime.md.
No npm install, development checkout, server or network is needed at runtime.
`;
function request(args, keys) {
  if (args.length !== 2 || args[0] !== '--request' || !args[1]?.trim()) throw new Error('Expected --request <options.json>.');
  const value = JSON.parse(readFileSync(args[1], 'utf8'));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Request must be a JSON object.');
  for (const key of Object.keys(value)) if (!keys.includes(key)) throw new Error(`Unsupported request field: ${key}.`);
  for (const key of ['create','generatedBaselineConfirmed']) if (Object.hasOwn(value,key) && typeof value[key] !== 'boolean') throw new Error(`${key} must be a boolean.`);
  return value;
}
const buildKeys = ['input','repositoryRoot','output'];
export async function runCLI(args) {
  const [command, ...rest] = args;
  if (args.length === 1 && ['--help','-h'].includes(command) || rest.length === 1 && ['--help','-h'].includes(rest[0]) && ['build','validate','inspect','select-output','impact','regenerate','rebuild','schema','lifecycle-detect','lifecycle-plan','lifecycle-publish','findings-inspect','findings-publish','findings-schema'].includes(command)) return process.stdout.write(help);
  if (args.length === 1 && ['--version','-v'].includes(command)) return process.stdout.write(`pFlow ${metadata.version}\n`);
  const json = value => process.stdout.write(JSON.stringify(value, null, 2) + '\n');
  if(command==='findings-schema'&&!rest.length)return json(findingsSchema);
  if (command === 'schema' && !rest.length) return json(schema);
  if (['build','validate','inspect'].includes(command)) {
    const tail = [...rest];
    if (command === 'validate' && !tail.includes('--output')) tail.push('--output',path.resolve(tail[tail.indexOf('--input')+1] || '.', 'architecture.html'));
    const options = parseArguments(['build', ...tail]);
    if (command === 'inspect') {
      const { digest,indexInventory,prepared } = await inspectArchitectureSet(options);
      return json({digest,indexInventory,diagnostics:prepared.diagnostics});
    }
    const prepared = prepareBuild(options);
    if (command === 'validate') return json({valid:true,artifacts:prepared.artifacts.length,documents:prepared.artifacts.reduce((n,a)=>n+a.documents.length,0),diagnostics:prepared.diagnostics});
    const generated = writeStandaloneHTML(prepared);
    for (const issue of prepared.diagnostics) process.stderr.write(`${safe(issue.artifact)} [warning:${issue.phase}] ${safe(issue.path)}: ${safe(issue.message)}\n`);
    process.stdout.write(`Validated and prepared ${prepared.artifacts.length} architecture artifacts and ${prepared.artifacts.reduce((n,a)=>n+a.documents.length,0)} Markdown documents.\nEmbedded ${prepared.artifacts.reduce((n,a)=>n+a.snippets.length,0)} source snippets. Wrote ${generated.bytes} bytes to ${safe(generated.outputPath)}\n`);
    return;
  }
  if(command==='findings-inspect')return json(inspectFindingBundle(request(rest,['bundleRoot','repositoryRoot'])));
  if(command==='findings-publish') {
    const apply=rest.at(-1)==='--apply';
    const input=request(apply?rest.slice(0,-1):rest,['bundleRoot','repositoryRoot','candidate','previousDigest','reviewChanges']);
    const stage=await prepareFindingsPublication(input);
    try{return json(apply?{applied:true,...await stage.apply()}:{applied:false,diagnostics:stage.diagnostics});}finally{stage.dispose();}
  }
  if (command === 'lifecycle-detect') return json(detectDocumentation(request(rest,['workspace','intent','target'])));
  if (command === 'lifecycle-plan') return json(await planLifecycle(request(rest,['bundleRoot','evidenceRoot','evidenceUpdates'])));
  if (command === 'lifecycle-publish') {
    const apply = rest.at(-1) === '--apply';
    const input = request(apply ? rest.slice(0,-1) : rest,['bundleRoot','evidenceRoot','operation','planToken','candidateGraph','candidateDocuments','evidenceUpdates','documentationId','scopes','coverage','limitations','reviewedFlowIds','fullReplacementApproved']);
    const stage = await prepareLifecycle(input);
    try { return json(apply ? {applied:true,...await stage.apply()} : {applied:false,unchanged:stage.unchanged||false,diagnostics:stage.diagnostics||[],message:'Validated only. Review analysis and candidates before --apply.'}); }
    finally { stage.dispose(); }
  }
  if (command === 'select-output') return json(selectOutput(request(rest,['mode','repositoryRoot','cwd','documentWorkspace','outputDirectory','create','protectedPaths'])));
  if (command === 'impact') {
    const input = request(rest,['repositoryRoot','baseline','scope','target','baselineBundleRoot','baselineSourceRoot','snapshotCommit']);
    const changeSet = collectGitChanges(input),layout = resolveBundleRoot(input.baselineBundleRoot);
    const architecture = JSON.parse(readFileSync(layout.graphPath,'utf8'));
    return json({changeSet,impactPlan:planImpact({...input,architecture,docsRoot:layout.docsRoot,changeSet})});
  }
  if (command === 'regenerate') {
    const apply = rest.at(-1) === '--apply';
    const input = request(apply?rest.slice(0,-1):rest,['repositoryRoot','bundleRoot','baselineSourceRoot','baselineBundleRoot','snapshotCommit','generatedBaselineConfirmed','impactPlan','changeSet','candidateGraph','candidateDocuments']);
    const staged = await prepareRegeneration(input);
    try { return json(apply ? {applied:true,...await staged.apply()} : {applied:false,message:'Candidate validated; no files changed. Review candidates before --apply. Use the exported prepareRegeneration API for staged diff inspection.'}); }
    finally { staged.dispose(); }
  }
  if (command === 'rebuild') return json(await rebuildArchitectureSet(request(rest,[...buildKeys,'indexReview'])));
  throw new Error('Expected a supported command, --help, or --version.');
}
// Imports expose the same maintained APIs without running a command.
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  try { await runCLI(process.argv.slice(2)); }
  catch (error) {
    if (error instanceof BuildError) for (const d of error.diagnostics) process.stderr.write(`${safe(d.artifact)} [${d.phase}] ${safe(d.path)}: ${safe(d.message)}${d.suggestion?` Suggested action: ${safe(d.suggestion)}`:''}\n`);
    else process.stderr.write(`pflow: ${safe(error.message)}\nUse --help for usage.\n`);
    process.exitCode = 1;
  }
}
