// The repo's own guards: reads too large to take whole, polling subagents, banned text on its way into the
// repo, the commit message commitlint would refuse, and stale worktrees at an agent's spawn.
import {
  addedBans,
  addedLines,
  bansReason,
  type CommitCommand,
  commitMessage,
  commitsIn,
  isTmpScript,
  leftoverNote,
  POLL_REASON,
  pollReason,
  readReason,
  resolvedPath,
  shellReadReason,
} from './utils/guardUtils.ts';
import { shellCommands } from './utils/shellUtils.ts';

import type { EngineInterface, On } from 'claude-code';

// A command's stdout, or nothing when it fails or cannot run.
const run = async ($: EngineInterface, argv: string[], cwd: string): Promise<string> => {
  try {
    const ran = await $.process.run(argv, { cwd });

    return ran.exitCode === 0 ? ran.stdout : '';
  }
  catch {
    return '';
  }
};

const textOf = async ($: EngineInterface, path: string): Promise<string> => {
  try {
    const text = await $.fs.read(path);

    return typeof text === 'string' ? text : '';
  }
  catch {
    return '';
  }
};

const namesIn = async ($: EngineInterface, dir: string): Promise<string[]> => {
  try {
    const entries = await $.fs.list(dir);

    return entries
      .map(({ name }) => {
        return name;
      });
  }
  catch {
    return [];
  }
};

// A throwaway script staged, or left at the repo root or a package root.
const tmpReason = async ($: EngineInterface, { dir }: CommitCommand): Promise<string | undefined> => {
  const stagedNames = await run($, [
    'git',
    'diff',
    '--cached',
    '--name-only',
  ], dir);
  const packages = await namesIn($, `${dir}/packages`);
  const roots = await Promise.all(packages
    .map(async (name) => {
      const names = await namesIn($, `${dir}/packages/${name}`);

      return names
        .map((file) => {
          return `packages/${name}/${file}`;
        });
    }));
  const atRoot = await namesIn($, dir);
  const found = [
    ...stagedNames.split('\n'),
    ...atRoot,
    ...roots.flat(),
  ].filter(isTmpScript);
  const listed = [...new Set(found)].join(', ');

  return found.length === 0
    ? undefined
    : `linteljs: delete the throwaway script before committing: ${listed}.`;
};

const stagedReason = async ($: EngineInterface, { dir }: CommitCommand): Promise<string | undefined> => {
  const diff = await run($, [
    'git',
    'diff',
    '--cached',
    '-U0',
    '--no-color',
    '--no-ext-diff',
  ], dir);
  const added = [...addedLines(diff)];

  return added
    .map(([path, lines]) => {
      const bans = addedBans(path, '', lines);

      return bansReason(path, bans);
    })
    .find((reason) => {
      return reason !== undefined;
    });
};

const lintReason = async ($: EngineInterface, commit: CommitCommand): Promise<string | undefined> => {
  const { text, file } = commitMessage(commit.args);
  const fromPath = file === undefined || file === '' || file === '-'
    ? undefined
    : await textOf($, resolvedPath(commit.dir, file));
  const fromFile = file === '-' ? commit.stdin : fromPath;
  const message = text ?? fromFile;

  if (message === undefined || message === '') {
    return undefined;
  }

  try {
    const ran = await $.process.run([
      'pnpm',
      'exec',
      'commitlint',
    ], { cwd: commit.dir, stdin: message });
    const output = `${ran.stdout}\n${ran.stderr}`.trim();

    return ran.exitCode === 0 ? undefined : `linteljs: commitlint refuses this message:\n${output}`;
  }
  catch {
    return undefined;
  }
};

// Each check runs only when the one before found nothing.
const commitCheckReason = async ($: EngineInterface, commit: CommitCommand): Promise<string | undefined> => {
  const tmp = await tmpReason($, commit);

  if (tmp !== undefined) {
    return tmp;
  }

  const staged = await stagedReason($, commit);

  if (staged !== undefined) {
    return staged;
  }

  return lintReason($, commit);
};

const commitReason = async ($: EngineInterface, command: string): Promise<string | undefined> => {
  const cwd = await $.session.cwd();
  const commits = commitsIn(shellCommands(command) ?? [], cwd);

  for (const commit of commits) {
    const reason = await commitCheckReason($, commit);

    if (reason !== undefined) {
      return reason;
    }
  }

  return undefined;
};

// New worktrees start at origin's default branch, so a main ahead of it hands the agent an old tree.
const baseNote = async ($: EngineInterface, root: string): Promise<string | undefined> => {
  const refs = await run($, [
    'git',
    'rev-parse',
    '--short',
    'HEAD',
    'refs/remotes/origin/HEAD',
  ], root);
  const [head, origin] = refs
    .trim()
    .split('\n');

  return head === undefined || origin === undefined || head === origin
    ? undefined
    : `Your worktree may start at origin's ${origin} rather than ${head}, where the main session is. `
      + `Before anything else, run \`git merge --ff-only ${head}\` in it and confirm \`git log --oneline -1\`.`;
};

const POLL_DENIAL = { deny: POLL_REASON };

export const registerGuards = (on: On): void => {
  on('tool.call', { tool: 'Read' }, async ($, e, next) => {
    const reason = readReason(e.file_path);

    if (reason === undefined) {
      return next(e);
    }

    const denied = { deny: reason };

    return denied;
  });

  on('tool.call', { tool: 'Monitor' }, async ($, e, next) => {
    return e.agentId === undefined ? next(e) : POLL_DENIAL;
  });

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const polls = e.agentId === undefined ? undefined : pollReason(e.command);
    const reads = shellReadReason(shellCommands(e.command) ?? []);
    const reason = polls ?? reads ?? await commitReason($, e.command);

    if (reason === undefined) {
      return next(e);
    }

    const denied = { deny: reason };

    return denied;
  });

  on('tool.call', { tool: 'Edit' }, async ($, e, next) => {
    const bans = addedBans(e.file_path, e.old_string, e.new_string);
    const reason = bansReason(e.file_path, bans);

    if (reason === undefined) {
      return next(e);
    }

    const denied = { deny: reason };

    return denied;
  });

  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    const before = await textOf($, e.file_path);
    const bans = addedBans(e.file_path, before, e.content);
    const reason = bansReason(e.file_path, bans);

    if (reason === undefined) {
      return next(e);
    }

    const denied = { deny: reason };

    return denied;
  });

  on('tool.call', { tool: 'Agent' }, async ($, e, next) => {
    if (e.agentId !== undefined || e.isolation !== 'worktree') {
      return next(e);
    }

    const root = await $.session.root();
    const worktrees = await namesIn($, `${root}/.claude/worktrees`);
    const agents = await $.agent.list();
    const leftover = leftoverNote(worktrees, agents);
    const note = await baseNote($, root);

    if (leftover !== undefined) {
      try {
        await $.session.append({ message: { type: 'user', content: [{ type: 'text', text: leftover }] } });
      }
      catch {
        // A warning only: a refused note leaves the spawn and its base note standing.
      }
    }

    const spawned = note === undefined ? e : { ...e, prompt: `${note}\n\n${e.prompt}` };

    return next(spawned);
  });
};
