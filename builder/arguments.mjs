export const help = `Usage: node builder/cli.mjs build --input <artifact-root> --output <file.html>

Commands:
  build       Validate artifacts and write standalone offline HTML.

Options:
  --input     Artifact root used for discovery.
  --repository-root  Source repository root (defaults to --input).
  --output    HTML destination; its parent directory must exist.
  -h, --help  Show help.
  -v, --version  Show the tool version.

The generated HTML opens directly through file:// without a web server.
`;

export function parseArguments(args) {
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) return { command: 'help' };
  if (args.length === 1 && ['--version', '-v'].includes(args[0])) return { command: 'version' };
  if (args[0] !== 'build') throw new Error('Expected build, --help, or --version.');
  if (args.length === 2 && ['--help', '-h'].includes(args[1])) return { command: 'help' };
  const result = { command: 'build' };
  for (let i = 1; i < args.length; i += 2) {
    const name = args[i], key = name === '--input' ? 'input' : name === '--output' ? 'output' : name === '--repository-root' ? 'repositoryRoot' : undefined;
    if (!key) throw new Error(`Unknown option: ${name}.`);
    if (result[key] !== undefined) throw new Error(`Duplicate option: ${name}.`);
    const value = args[i + 1];
    if (!value?.trim() || value.startsWith('-') || value.includes('\0')) throw new Error(`Missing or invalid value for ${name}.`);
    result[key] = value;
  }
  if (!result.input || !result.output) throw new Error('build requires --input and --output.');
  return result;
}
