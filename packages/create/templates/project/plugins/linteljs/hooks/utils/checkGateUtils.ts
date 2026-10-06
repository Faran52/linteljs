// A commit waits for the project's `check` to pass on the files it would commit.
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import {
  delimiter,
  isAbsolute,
  join,
  resolve,
} from 'node:path';

import {
  commandName,
  COMPUTED,
  type Dialect,
  isAssignment,
  parseCommand,
  type ParsedCommand,
  skipOptions,
  wordsOf,
} from './commandParserUtils.ts';
import { GIT_GLOBAL_VALUED } from './gitSafetyUtils.ts';
import {
  fieldAt,
  hostOf,
  type Json,
  jsonObjectOf,
  readCommand,
  stringAt,
} from './hostUtils.ts';

export type CheckState = 'failed' | 'none' | 'passed' | 'running' | 'stale';

type Result = 'failed' | 'passed' | 'running';

interface Project {
  root: string;
  // Where the state lives: inside the git directory, so per worktree and never committed.
  directory: string;
  index: string;
  manager: string;
}

interface CheckRecord {
  tree: string;
  result: Result;
}

interface Located {
  commands: ParsedCommand[];
  cwd: string;
  words: string[] | undefined;
}

const RESULTS = new Set<Json | undefined>([
  'failed',
  'passed',
  'running',
]);

const isResult = (value: Json | undefined): value is Result => {
  return RESULTS.has(value);
};

const GIT_NAMES = ['git', 'git.exe'];

// From an absolute PATH entry, so a `git` planted in the working directory is never the one run.
const gitBinary = (): string => {
  const directories = (process.env['PATH'] ?? '')
    .split(delimiter)
    .filter((directory) => {
      return isAbsolute(directory);
    });
  const binary = directories
    .flatMap((directory) => {
      return GIT_NAMES
        .map((name) => {
          return join(directory, name);
        });
    })
    .find((candidate) => {
      return existsSync(candidate);
    });

  if (binary === undefined) {
    throw new Error('git is not on PATH');
  }

  return binary;
};

const git = (cwd: string, arguments_: string[], index?: string): string => {
  const environment = index === undefined
    ? process.env
    : {
        ...process.env,
        GIT_INDEX_FILE: index,
      };

  const binary = gitBinary();
  const output = execFileSync(binary, arguments_, {
    cwd,
    encoding: 'utf8',
    env: environment,
    stdio: [
      'ignore',
      'pipe',
      'ignore',
    ],
  });

  return output.trim();
};

const attempt = (read: () => string): string | undefined => {
  try {
    return read();
  }
  catch {
    // Not a repository, or git refused: there is no tree to vouch for.
  }

  return undefined;
};

const textAt = (value: Json | undefined, key: string): string | undefined => {
  const field = fieldAt(value, key);
  return typeof field === 'string' ? field : undefined;
};

// `devEngines` names the manager on every manager, bun included; `packageManager` is the older field.
export const managerOf = (packageJson: object | undefined): string => {
  const devEngines = fieldAt(fieldAt(packageJson, 'devEngines'), 'packageManager');
  const named = textAt(devEngines, 'name');
  const pinned = textAt(packageJson, 'packageManager');

  if (named !== undefined) {
    return named;
  }

  return pinned === undefined ? 'npm' : pinned.replace(/@.*/u, '');
};

// npm alone needs `run` for a script of its own.
const checkOf = (project: Project): string => {
  return project.manager === 'npm' ? 'npm run check' : `${project.manager} check`;
};

export const projectOf = (cwd: string): Project | undefined => {
  const paths = attempt(() => {
    return git(cwd, [
      'rev-parse',
      '--path-format=absolute',
      '--show-toplevel',
      '--git-path',
      'linteljs',
      '--git-path',
      'index',
    ]);
  });

  const [
    root = '',
    directory = '',
    index = '',
  ] = paths?.split('\n') ?? [];
  const packageJson = jsonObjectOf(() => {
    const path = join(root, 'package.json');
    return readFileSync(path, 'utf8');
  });

  const scripts = fieldAt(packageJson, 'scripts');
  const check = textAt(scripts, 'check');

  if (paths === undefined || check === undefined) {
    return undefined;
  }

  const project: Project = {
    root,
    directory,
    index,
    manager: managerOf(packageJson),
  };

  return project;
};

// The work tree as a tree object, untracked files included and ignored ones not, built in a scratch index so
// the real one is never touched. A copy of the real index lets git skip rehashing unchanged files.
export const treeOf = (project: Project): string | undefined => {
  const scratch = join(project.directory, 'index');

  return attempt(() => {
    mkdirSync(project.directory, { recursive: true });
    rmSync(scratch, { force: true });

    if (existsSync(project.index)) {
      copyFileSync(project.index, scratch);
    }

    git(project.root, [
      'add',
      '--all',
    ], scratch);

    return git(project.root, ['write-tree'], scratch);
  });
};

const statePath = (project: Project): string => {
  return join(project.directory, 'check.json');
};

const readRecord = (project: Project): CheckRecord | undefined => {
  const state = jsonObjectOf(() => {
    const path = statePath(project);
    return readFileSync(path, 'utf8');
  });
  const tree = textAt(state, 'tree');
  const result = fieldAt(state, 'result');

  if (tree === undefined || !isResult(result)) {
    return undefined;
  }

  const checkRecord: CheckRecord = {
    tree,
    result,
  };

  return checkRecord;
};

const writeRecord = (project: Project, checkRecord: CheckRecord): void => {
  writeFileSync(statePath(project), `${JSON.stringify(checkRecord)}\n`);
};

const cwdOf = (payload: object): string => {
  return stringAt(payload, 'cwd') ?? process.cwd();
};

const CD_NAMES = new Set(['cd', 'set-location']);

const HOME = /^~(?=$|[/\\])/u;

const directoryOf = (cwd: string, directory: string): string => {
  const home = homedir();
  const expanded = directory.replace(HOME, home);

  return resolve(cwd, expanded);
};

// Where a `cd <dir>` alone moves to.
const movedTo = (move: ParsedCommand | undefined): string | undefined => {
  const [
    name = '',
    directory,
    ...rest
  ] = move?.tokens ?? [];
  const named = commandName(name);

  return move?.opaque === false && rest.length === 0 && CD_NAMES.has(named) ? directory : undefined;
};

// A leading `cd <dir> &&` runs the rest in <dir>, and only when the move worked, so its exit is the rest's.
const locate = (cwd: string, command: string, dialect: Dialect): Located => {
  const and = command.indexOf('&&');
  const head = command.slice(0, Math.max(and, 0));
  const [move] = parseCommand(head, dialect) ?? [];
  const target = movedTo(move);
  const rest = target === undefined ? command : command.slice(and + 2);
  // An unreadable line commits nothing here: the git guard denies it.
  const located: Located = {
    commands: parseCommand(rest, dialect) ?? [],
    cwd: target === undefined ? cwd : directoryOf(cwd, target),
    words: wordsOf(rest, dialect),
  };

  return located;
};

// Claude Code's own calls only: Cursor runs a copy of these hooks, and no other host is given them.
const claudeCommandOf = (payload: object): Located | undefined => {
  const input = hostOf(payload) === 'claude' ? readCommand(payload, 'beforeShellExecution') : undefined;
  const cwd = cwdOf(payload);

  return input === undefined ? undefined : locate(cwd, input.command, input.dialect);
};

// The git options before `commit`, or nothing when the command is no commit.
const commitOptionsOf = ({ tokens }: ParsedCommand): string[] | undefined => {
  const index = skipOptions(tokens, 1, GIT_GLOBAL_VALUED) ?? 0;
  const commits = commandName(tokens[0]) === 'git' && tokens[index] === 'commit';

  return commits ? tokens.slice(1, index) : undefined;
};

// Each `git -C <dir>` moves git on from the last; `--git-dir` and `--work-tree` are not followed.
const gitCwdOf = (options: string[], cwd: string): string => {
  let directory = cwd;
  let option = '';

  for (const token of options) {
    directory = option === '-C' ? directoryOf(directory, token) : directory;
    option = option === '' && GIT_GLOBAL_VALUED.has(token) ? token : '';
  }

  return directory;
};

// `2>&1` and `>out.log` carry their file; `>`, `2>`, `&>` and `<` alone take the next word as theirs.
const REDIRECT = /^\d*(?:&>>?|>>?&?|<&?)/u;

const withoutRedirects = (tokens: string[]): string[] => {
  const words: string[] = [];
  let target = false;

  for (const token of tokens) {
    const redirect = REDIRECT.exec(token)?.[0];

    if (!target && redirect === undefined) {
      words.push(token);
    }

    target = !target && redirect === token;
  }

  return words;
};

// A leading `NAME=value` only sets the check's environment, unless its value is computed.
const isPlainAssignment = (word: string): boolean => {
  return isAssignment(word) && !word.includes(COMPUTED);
};

// The check alone counts, its output redirected or not, after leading environment assignments and a leading
// `cd <dir> &&`, or none: a pipe hides its exit status, and any other chain adds to it.
const checkProjectOf = (payload: object): Project | undefined => {
  const located = claudeCommandOf(payload);
  const words = located?.words ?? [];
  const project = located === undefined ? undefined : projectOf(located.cwd);
  const start = words
    .findIndex((word) => {
      return !isPlainAssignment(word);
    });

  if (project === undefined || start === -1) {
    return undefined;
  }

  const run = withoutRedirects(words.slice(start));
  const command = run.join(' ');
  const ran = command === checkOf(project) || command === `${project.manager} run check`;

  return ran ? project : undefined;
};

const stateOf = (project: Project): CheckState => {
  const checkRecord = readRecord(project);

  if (checkRecord?.result !== 'passed') {
    return checkRecord?.result ?? 'none';
  }

  return treeOf(project) === checkRecord.tree ? 'passed' : 'stale';
};

export const checkState = (cwd: string): CheckState | undefined => {
  const project = projectOf(cwd);
  return project === undefined ? undefined : stateOf(project);
};

// The tree is taken as the check starts, so a file changed while it runs leaves the pass stale.
export const startCheck = (payload: object): void => {
  const project = checkProjectOf(payload);
  const tree = project === undefined ? undefined : treeOf(project);

  if (project !== undefined && tree !== undefined) {
    writeRecord(project, {
      tree,
      result: 'running',
    });
  }
};

// Claude Code sends `PostToolUse` for a command that exited 0 and `PostToolUseFailure` for one that did not.
export const finishCheck = (payload: object): void => {
  const project = checkProjectOf(payload);
  const checkRecord = project === undefined ? undefined : readRecord(project);

  if (project === undefined || checkRecord?.result !== 'running') {
    return;
  }

  writeRecord(project, {
    tree: checkRecord.tree,
    result: stringAt(payload, 'hook_event_name') === 'PostToolUse' ? 'passed' : 'failed',
  });
};

const WHY: Record<Exclude<CheckState, 'passed'>, string> = {
  none: 'it has not run on these files',
  running: 'it has not finished, or was stopped',
  failed: 'it failed when it last ran',
  stale: 'files changed since it passed',
};

const heldReason = (project: Project, state: Exclude<CheckState, 'passed'>): string => {
  const check = checkOf(project);

  return `Commit held: \`${check}\` has not passed on these files (${WHY[state]}). Run \`${check}\` on its own, `
    + `or with its output redirected to a file outside the work tree (\`${check} > /tmp/check.log 2>&1\`), and `
    + 'commit once it passes, from the work tree or after `cd <dir> &&`, with leading `NAME=value` assignments '
    + 'or none. A run piped into another command or chained '
    + 'with one is not counted: its exit status is not the check\'s.';
};

export const commitGateReason = (payload: object): string | undefined => {
  const { commands = [], cwd = '' } = claudeCommandOf(payload) ?? {};

  for (const options of commands.map(commitOptionsOf)) {
    const project = options === undefined ? undefined : projectOf(gitCwdOf(options, cwd));
    const state = project === undefined ? 'passed' : stateOf(project);

    if (project !== undefined && state !== 'passed') {
      return heldReason(project, state);
    }
  }

  return undefined;
};
