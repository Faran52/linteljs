// The repo's own guards: reads too large to take whole, polling subagents, banned text on its way into the
// repo, the commit message commitlint would refuse, and stale worktrees at an agent's spawn.
import type { EngineInterface, On } from 'claude-code';

import {
  addedBans,
  addedLines,
  bansReason,
  type CommitCommand,
  commitMessage,
  commitsIn,
  isTmpScript,
  POLL_REASON,
  pollReason,
  readReason,
  resolvedPath,
  shellReadReason,
} from './utils/guardUtils.ts';
import { shellCommands } from './utils/shellUtils.ts';

const LIVE = new Set(['pending', 'running', 'waiting']);

const run = async ($: EngineInterface, argv: string[], cwd: string, stdin?: string): Promise<string | undefined> => {
  const ran = await $.process.run(argv, { cwd, ...(stdin === undefined ? {} : { stdin }) })
    .catch(() => {
      return undefined;
    });

  return ran?.exitCode === 0 ? ran.stdout : undefined;
};

const textOf = async ($: EngineInterface, path: string): Promise<string> => {
  return $.fs.read(path)
    .then((text) => {
      return typeof text === 'string' ? text : '';
    })
    .catch(() => {
      return '';
    });
};

const namesIn = async ($: EngineInterface, dir: string): Promise<string[]> => {
  const entries = await $.fs.list(dir)
    .catch(() => {
      return [];
    });

  return entries.map(({ name }) => {
    return name;
  });
};

// A throwaway script staged, or left at the repo root or a package root.
const tmpReason = async ($: EngineInterface, dir: string): Promise<string | undefined> => {
  const staged = (await run($, ['git', 'diff', '--cached', '--name-only'], dir) ?? '').split('\n');
  const packages = await namesIn($, `${dir}/packages`);
  const roots = await Promise.all(packages.map(async (name) => {
    const names = await namesIn($, `${dir}/packages/${name}`);

    return names.map((file) => {
      return `packages/${name}/${file}`;
    });
  }));
  const found = [...staged, ...await namesIn($, dir), ...roots.flat()].filter(isTmpScript);

  return found.length === 0
    ? undefined
    : `linteljs: delete the throwaway script before committing: ${[...new Set(found)].join(', ')}.`;
};

const stagedReason = async ($: EngineInterface, dir: string): Promise<string | undefined> => {
  const diff = await run($, ['git', 'diff', '--cached', '-U0', '--no-color', '--no-ext-diff'], dir) ?? '';

  return [...addedLines(diff)]
    .map(([path, added]) => {
      return bansReason(path, addedBans(path, '', added));
    })
    .find((reason) => {
      return reason !== undefined;
    });
};

const lintReason = async ($: EngineInterface, commit: CommitCommand): Promise<string | undefined> => {
  const { text, file } = commitMessage(commit.args);
  const fromFile = file === '-' ? commit.stdin : file && await textOf($, resolvedPath(commit.dir, file));
  const message = text ?? fromFile;

  if (message === undefined || message === '') {
    return undefined;
  }

  const ran = await $.process.run(['pnpm', 'exec', 'commitlint'], { cwd: commit.dir, stdin: message })
    .catch(() => {
      return undefined;
    });

  return ran === undefined || ran.exitCode === 0
    ? undefined
    : `linteljs: commitlint refuses this message:\n${`${ran.stdout}\n${ran.stderr}`.trim()}`;
};

const commitReason = async ($: EngineInterface, command: string): Promise<string | undefined> => {
  const commits = commitsIn(shellCommands(command) ?? [], await $.session.cwd());

  for (const commit of commits) {
    const reason = await tmpReason($, commit.dir) ?? await stagedReason($, commit.dir) ?? await lintReason($, commit);

    if (reason !== undefined) {
      return reason;
    }
  }

  return undefined;
};

// Worktrees no live agent of this session owns; the harness names each `agent-<id>`.
const leftoverWorktrees = async ($: EngineInterface, root: string): Promise<string[]> => {
  const agents = await $.agent.list();
  const live = new Set(agents
    .filter(({ status }) => {
      return LIVE.has(status);
    })
    .map(({ id }) => {
      return `agent-${id}`;
    }));
  const names = await namesIn($, `${root}/.claude/worktrees`);

  return names.filter((name) => {
    return !live.has(name);
  });
};

// New worktrees start at origin's default branch, so a main ahead of it hands the agent an old tree.
const baseNote = async ($: EngineInterface, root: string): Promise<string | undefined> => {
  const [head, origin] = (await run($, ['git', 'rev-parse', '--short', 'HEAD', 'refs/remotes/origin/HEAD'], root) ?? '')
    .trim()
    .split('\n');

  return head === undefined || origin === undefined || head === origin
    ? undefined
    : `Your worktree may start at origin's ${origin} rather than ${head}, where the main session is. `
      + `Before anything else, run \`git merge --ff-only ${head}\` in it and confirm \`git log --oneline -1\`.`;
};

export const registerGuards = (on: On): void => {
  on('tool.call', { tool: 'Read' }, async ($, e, next) => {
    const reason = readReason(e.file_path);

    return reason === undefined ? next(e) : { deny: reason };
  });

  on('tool.call', { tool: 'Monitor' }, async ($, e, next) => {
    return e.agentId === undefined ? next(e) : { deny: POLL_REASON };
  });

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const polls = e.agentId === undefined ? undefined : pollReason(e.command);
    const reads = shellReadReason(shellCommands(e.command) ?? []);
    const reason = polls ?? reads ?? await commitReason($, e.command);

    return reason === undefined ? next(e) : { deny: reason };
  });

  on('tool.call', { tool: 'Edit' }, async ($, e, next) => {
    const reason = bansReason(e.file_path, addedBans(e.file_path, e.old_string, e.new_string));

    return reason === undefined ? next(e) : { deny: reason };
  });

  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    const before = await textOf($, e.file_path);
    const reason = bansReason(e.file_path, addedBans(e.file_path, before, e.content));

    return reason === undefined ? next(e) : { deny: reason };
  });

  on('tool.call', { tool: 'Agent' }, async ($, e, next) => {
    if (e.agentId !== undefined || e.isolation !== 'worktree') {
      return next(e);
    }

    const root = await $.session.root();
    const leftover = await leftoverWorktrees($, root);
    const note = await baseNote($, root);

    if (leftover.length > 0) {
      await $.session.append({
        message: {
          type: 'user',
          content: [{
            type: 'text',
            text: `linteljs: worktrees no running agent owns sit under .claude/worktrees: ${leftover.join(', ')}. `
              + 'Merge or drop what each holds, then `git worktree remove` it.',
          }],
        },
      });
    }

    return next(note === undefined ? e : { ...e, prompt: `${note}\n\n${e.prompt}` });
  });
};
