#!/usr/bin/env node
import metadata from '../package.json' with { type: 'json' };
import { help, parseArguments } from './arguments.mjs';
import { BuildError, prepareBuild } from './pipeline.mjs';
import { writeStandaloneHTML } from './html.mjs';

const safe = text => String(text).replace(/[\u0000-\u001f\u007f-\u009f]/g, char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`);
try {
  const options = parseArguments(process.argv.slice(2));
  if (options.command === 'help') process.stdout.write(help);
  else if (options.command === 'version') process.stdout.write(`pFlow ${metadata.version}\n`);
  else {
    const prepared = prepareBuild(options);
    const generated = writeStandaloneHTML(prepared);
    for (const issue of prepared.diagnostics) process.stderr.write(`${safe(issue.artifact)} [warning:${issue.phase}] ${safe(issue.path)}: ${safe(issue.message)}\n`);
    const count = prepared.artifacts.reduce((sum, artifact) => sum + artifact.documents.length, 0);
    const snippets = prepared.artifacts.reduce((sum, artifact) => sum + artifact.snippets.length, 0);
    process.stdout.write(`Validated and prepared ${prepared.artifacts.length} architecture artifacts and ${count} Markdown documents.\nEmbedded ${snippets} source snippets. Wrote ${generated.bytes} bytes to ${safe(generated.outputPath)}\n`);
  }
} catch (error) {
  if (error instanceof BuildError) for (const diagnostic of error.diagnostics) process.stderr.write(`${safe(diagnostic.artifact)} [${diagnostic.phase}] ${safe(diagnostic.path)}: ${safe(diagnostic.message)}\n`);
  else process.stderr.write(`archdoc: ${safe(error.message)}\nUse --help for usage.\n`);
  process.exitCode = 1;
}
