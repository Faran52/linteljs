// A guard cannot vouch for what it cannot read, so an unreadable command is denied.
import {
  commandName,
  COMPUTED,
  type Dialect,
  parseCommand,
  type ParsedCommand,
  skipOptions,
} from './commandParserUtils.ts';

export const GIT_GLOBAL_VALUED = new Set([
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
      return argument === '--all' || (/^-[^-]/u.test(argument) && argument.includes('A'));
    });
};

const MESSAGE_VALUED = new Set<string | undefined>([
  '-m',
  '--message',
  '-F',
  '--file',
]);

// A substituted commit message is the one computed operand no banned flag can hide in.
const hasComputedOperand = (operands: string[]): boolean => {
  return operands
    .some((operand, index) => {
      return operand.includes(COMPUTED)
        && !MESSAGE_VALUED.has(operands[index - 1])
        && !/^(?:-m|--message=)/u.test(operand);
    });
};

const gitVerdict = ({ tokens, opaque }: ParsedCommand): string | undefined => {
  const name = commandName(tokens[0]);

  if (name.includes(COMPUTED)) {
    return UNREADABLE_REASON;
  }

  if (name !== 'git') {
    return undefined;
  }

  const index = opaque ? undefined : skipOptions(tokens, 1, GIT_GLOBAL_VALUED);

  if (index === undefined) {
    return UNREADABLE_REASON;
  }

  const subcommand = tokens[index]?.toLowerCase();
  const operands = tokens.slice(index + 1);
  const options = beforeSeparator(operands);

  if (subcommand === 'stash') {
    return STASH;
  }

  if (subcommand === 'reset') {
    return RESET;
  }

  if (subcommand?.includes(COMPUTED) === true || hasComputedOperand(operands)) {
    return UNREADABLE_REASON;
  }

  if (options.includes('--no-verify')) {
    return NO_VERIFY;
  }

  if (subcommand === 'commit' && options.includes('--amend')) {
    return AMEND;
  }

  if (subcommand === 'add' && addIsBanned(operands)) {
    return ADD_ALL;
  }

  return undefined;
};

export const gitSafetyReason = (command: string, dialect: Dialect): string | undefined => {
  const commands = parseCommand(command, dialect);

  if (commands === undefined) {
    return UNREADABLE_REASON;
  }

  let unreadable = false;

  for (const parsed of commands) {
    const verdict = gitVerdict(parsed);

    if (verdict === UNREADABLE_REASON) {
      unreadable = true;
    }
    else if (verdict !== undefined) {
      return `Blocked \`${parsed.tokens
        .join(' ')
        .replaceAll(COMPUTED, '$(...)')}\`. ${verdict}`;
    }
  }

  return unreadable ? UNREADABLE_REASON : undefined;
};
