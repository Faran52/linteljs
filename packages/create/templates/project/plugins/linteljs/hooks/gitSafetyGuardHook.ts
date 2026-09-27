// A guard cannot vouch for what it cannot read, so an unreadable command is denied.
import {
  commandName,
  parseCommand,
  type ParsedCommand,
  skipOptions,
} from './utils/commandParserUtils.ts';
import {
  type CommandInput,
  readCommand,
  readPayload,
  writeDecision,
} from './utils/hostUtils.ts';

const GLOBAL_VALUED = new Set([
  '-C',
  '-c',
  '--git-dir',
  '--work-tree',
  '--namespace',
  '--exec-path',
  '--super-prefix',
  '--config-env',
]);

const STASH = '`git stash` is banned: a concurrent session\'s lint-staged backup stash can take your changes with it. '
  + 'Stage explicit paths instead, and for a baseline check use a throwaway `git worktree add` at HEAD.';
const RESET = '`git reset` is banned: it rewrites the index or the working tree wholesale. Unstage a file with '
  + '`git restore --staged <path>`, and for a baseline check use a throwaway `git worktree add` at HEAD.';
const NO_VERIFY = '`--no-verify` is banned: it skips the hooks that gate every commit and push. Fix what the hook '
  + 'reports and run the command again without it.';
const AMEND = '`git commit --amend` is banned: it rewrites the last commit rather than '
  + 'recording a new one. Make a new commit instead.';
const ADD_ALL = '`git add -A`, `--all` and `.` are banned: they stage files that are not yours. Stage explicit '
  + 'paths: `git add <path>...`.';
const UNREADABLE_REASON = 'The git safety guard could not read this command, so it cannot rule out a banned git '
  + 'operation (stash, reset, --no-verify, --amend, add -A). Run git on its own line, without unbalanced quotes, '
  + 'shells nested deeper than eight, or PowerShell subexpressions, script blocks and Start-Process around it.';

const beforeSeparator = (arguments_: string[]): string[] => {
  const separator = arguments_.indexOf('--');
  return separator === -1 ? arguments_ : arguments_.slice(0, separator);
};

const addIsBanned = (arguments_: string[]): boolean => {
  const options = beforeSeparator(arguments_);
  return arguments_.includes('.') || options
    .some((argument) => {
      return argument === '-A' || argument === '--all' || (/^-[^-]/u.test(argument) && argument
        .slice(1)
        .includes('A'));
    });
};

const gitVerdict = ({ tokens, opaque }: ParsedCommand): string | undefined => {
  if (commandName(tokens[0] ?? '') !== 'git') {
    return undefined;
  }
  const index = opaque ? undefined : skipOptions(tokens, 1, GLOBAL_VALUED);
  if (index === undefined) {
    return UNREADABLE_REASON;
  }
  const subcommand = tokens[index]?.toLowerCase();
  const options = beforeSeparator(tokens.slice(index + 1));

  if (subcommand === 'stash') {
    return STASH;
  }
  if (subcommand === 'reset') {
    return RESET;
  }
  if (options.includes('--no-verify')) {
    return NO_VERIFY;
  }
  if (subcommand === 'commit' && options.includes('--amend')) {
    return AMEND;
  }
  if (subcommand === 'add' && addIsBanned(tokens.slice(index + 1))) {
    return ADD_ALL;
  }
  return undefined;
};

const decide = (input: CommandInput): string | undefined => {
  const commands = parseCommand(input.command, input.dialect);
  if (commands === undefined) {
    return UNREADABLE_REASON;
  }
  let unreadable = false;
  for (const command of commands) {
    const verdict = gitVerdict(command);
    if (verdict === UNREADABLE_REASON) {
      unreadable = true;
    }
    else if (verdict !== undefined) {
      return `Blocked \`${command.tokens.join(' ')}\`. ${verdict}`;
    }
  }
  return unreadable ? UNREADABLE_REASON : undefined;
};

const payload = readPayload();
const input = payload === undefined ? undefined : readCommand(payload, 'beforeShellExecution');

if (input !== undefined) {
  writeDecision(input.host, 'deny', decide(input));
}
