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
import {
  delimiter,
  isAbsolute,
  join,
} from 'node:path';

import {
  commandName,
  parseCommand,
  type ParsedCommand,
  skipOptions,
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

// Claude Code's own calls only: Cursor runs a copy of these hooks, and no other host is given them.
const claudeCommandOf = (payload: object): ParsedCommand[] | undefined => {
  const input = hostOf(payload) === 'claude' ? readCommand(payload, 'beforeShellExecution') : undefined;
  return input === undefined ? undefined : parseCommand(input.command, input.dialect);
};

const isCommit = ({ tokens }: ParsedCommand): boolean => {
  const index = skipOptions(tokens, 1, GIT_GLOBAL_VALUED);

  return commandName(tokens[0]) === 'git' && tokens[index ?? tokens.length] === 'commit';
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

// The check alone counts, its output redirected or not: a pipe hides its exit status, and a chain adds to it.
const checkProjectOf = (payload: object): Project | undefined => {
  const commands = claudeCommandOf(payload) ?? [];
  const project = projectOf(cwdOf(payload));
  const [only] = commands;

  if (project === undefined || only === undefined || commands.length > 1 || only.opaque) {
    return undefined;
  }

  const command = withoutRedirects(only.tokens).join(' ');
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

export const commitGateReason = (payload: object): string | undefined => {
  const commits = claudeCommandOf(payload)?.some(isCommit) === true;
  const project = commits ? projectOf(cwdOf(payload)) : undefined;
  const state = project === undefined ? 'passed' : stateOf(project);

  if (project === undefined || state === 'passed') {
    return undefined;
  }

  const check = checkOf(project);

  return `Commit held: \`${check}\` has not passed on these files (${WHY[state]}). Run \`${check}\` on its own, `
    + `or with its output redirected to a file outside the work tree (\`${check} > /tmp/check.log 2>&1\`), and `
    + 'commit once it passes. A run piped into another command or chained with one is not counted: its exit status '
    + 'is not the check\'s.';
};
