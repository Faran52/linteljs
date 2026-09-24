// PreToolUse(Bash|PowerShell): warns, never blocks, when eslint runs without `--fix`. One run with `--fix` fixes what
// it can and still reports the rest, so a bare run only costs a second one. Stdout is the decision JSON or nothing.
import {
  commandName,
  parseCommand,
  readCommandInput,
  skipOptions,
} from './utils/commandParserUtils.ts';

type Verdict = 'clear' | 'unfixed' | 'unreadable';

const UNFIXED = 'eslint was called without --fix. Run `eslint <files> --fix` instead: it fixes what it can and still '
  + 'reports the rest, so one run is enough.';
const UNREADABLE = 'This command could not be read, so the eslint check cannot tell whether it runs eslint without '
  + '--fix. If it does, run `eslint <files> --fix` instead.';

const isEslint = (token: string): boolean => {
  return commandName(token) === 'eslint';
};

// Only an exact `--fix` before `--` counts: `--fix-dry-run` and `--fix-type` fix nothing.
const fixVerdict = (arguments_: string[]): Verdict => {
  const separator = arguments_.indexOf('--');
  const options = separator === -1 ? arguments_ : arguments_.slice(0, separator);
  return options.includes('--fix') ? 'clear' : 'unfixed';
};

const directRunnerVerdict = (tokens: string[], start: number): Verdict => {
  const index = skipOptions(tokens, start, new Set(['-p', '--package']));
  if (index === undefined) {
    return 'unreadable';
  }
  return isEslint(tokens[index] ?? '') ? fixVerdict(tokens.slice(index + 1)) : 'clear';
};

const scriptRunnerVerdict = (
  tokens: string[],
  start: number,
  before: Set<string>,
  commands: string[],
  after: Set<string>,
): Verdict => {
  let index = skipOptions(tokens, start, before);
  if (index === undefined) {
    return 'unreadable';
  }
  if (commands.includes(tokens[index] ?? '')) {
    index += 1;
  }
  index = skipOptions(tokens, index, after);
  if (index === undefined) {
    return 'unreadable';
  }
  return isEslint(tokens[index] ?? '') ? fixVerdict(tokens.slice(index + 1)) : 'clear';
};

const npmVerdict = (tokens: string[], start: number): Verdict => {
  let index = skipOptions(tokens, start, new Set(['--prefix', '--workspace']));
  if (index === undefined) {
    return 'unreadable';
  }
  if (!['exec', 'x', 'run'].includes(tokens[index] ?? '')) {
    return 'clear';
  }
  index = skipOptions(tokens, index + 1, new Set(['--package', '-w', '--workspace']));
  if (index === undefined) {
    return 'unreadable';
  }
  if (!isEslint(tokens[index] ?? '')) {
    return 'clear';
  }
  const arguments_ = tokens.slice(index + 1);
  return fixVerdict(arguments_[0] === '--' ? arguments_.slice(1) : arguments_);
};

const NO_OPTIONS = new Set<string>();

const eslintVerdict = (tokens: string[]): Verdict => {
  const executable = commandName(tokens[0] ?? '');
  if (executable === 'eslint') {
    return fixVerdict(tokens.slice(1));
  }
  if (executable === 'npx' || executable === 'bunx') {
    return directRunnerVerdict(tokens, 1);
  }
  if (executable === 'pnpm') {
    return scriptRunnerVerdict(
      tokens,
      1,
      new Set(['-C', '--dir', '--filter']),
      ['exec', 'dlx', 'run'],
      new Set(['--package']),
    );
  }
  if (executable === 'npm') {
    return npmVerdict(tokens, 1);
  }
  if (executable === 'yarn') {
    return scriptRunnerVerdict(tokens, 1, new Set(['--cwd']), ['exec', 'dlx', 'run'], NO_OPTIONS);
  }
  if (executable === 'bun') {
    return scriptRunnerVerdict(tokens, 1, new Set(['--cwd']), ['x', 'run'], NO_OPTIONS);
  }
  return 'clear';
};

const decide = (): string | undefined => {
  const input = readCommandInput();
  if (input === undefined) {
    return undefined;
  }
  const commands = parseCommand(input.command, input.dialect);
  if (commands === undefined) {
    return UNREADABLE;
  }
  let unreadable = false;
  for (const { tokens } of commands) {
    const verdict = eslintVerdict(tokens);
    if (verdict === 'unfixed') {
      return UNFIXED;
    }
    unreadable ||= verdict === 'unreadable';
  }
  return unreadable ? UNREADABLE : undefined;
};

const context = decide();

if (context !== undefined) {
  process.stdout.write(`${JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext: context,
    },
  })}\n`);
}
