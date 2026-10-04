// Warns, never blocks: one run with `--fix` still reports the rest, so a bare run only costs a second.
import {
  commandName,
  type Dialect,
  parseCommand,
  type ParsedCommand,
  skipOptions,
} from './commandParserUtils.ts';

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

  const eslintArguments = tokens.slice(index + 1);

  return isEslint(tokens[index] ?? '') ? fixVerdict(eslintArguments) : 'clear';
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

  const eslintArguments = tokens.slice(index + 1);

  return isEslint(tokens[index] ?? '') ? fixVerdict(eslintArguments) : 'clear';
};

const npmVerdict = (tokens: string[], start: number): Verdict => {
  let index = skipOptions(tokens, start, new Set(['--prefix', '--workspace']));

  if (index === undefined) {
    return 'unreadable';
  }

  const runCommands = [
    'exec',
    'x',
    'run',
  ];

  if (!runCommands.includes(tokens[index] ?? '')) {
    return 'clear';
  }

  index = skipOptions(tokens, index + 1, new Set([
    '--package',
    '-w',
    '--workspace',
  ]));

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

const eslintVerdict = (tokens: ParsedCommand['tokens']): Verdict => {
  const executable = commandName(tokens[0]);

  if (executable === 'eslint') {
    const eslintArguments = tokens.slice(1);

    return fixVerdict(eslintArguments);
  }

  if (executable === 'npx' || executable === 'bunx') {
    return directRunnerVerdict(tokens, 1);
  }

  if (executable === 'pnpm') {
    const globalValued = new Set([
      '-C',
      '--dir',
      '--filter',
    ]);
    const runCommands = [
      'exec',
      'dlx',
      'run',
    ];
    const commandValued = new Set(['--package']);

    return scriptRunnerVerdict(tokens, 1, globalValued, runCommands, commandValued);
  }

  if (executable === 'npm') {
    return npmVerdict(tokens, 1);
  }

  if (executable === 'yarn') {
    const globalValued = new Set(['--cwd']);
    const runCommands = [
      'exec',
      'dlx',
      'run',
    ];

    return scriptRunnerVerdict(tokens, 1, globalValued, runCommands, NO_OPTIONS);
  }

  if (executable === 'bun') {
    const globalValued = new Set(['--cwd']);
    const runCommands = ['x', 'run'];

    return scriptRunnerVerdict(tokens, 1, globalValued, runCommands, NO_OPTIONS);
  }

  return 'clear';
};

export const eslintFixReason = (command: string, dialect: Dialect): string | undefined => {
  const commands = parseCommand(command, dialect);

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
