import type { AgentStatus, On } from 'claude-code';
import {
  type Engine,
  expect,
  test,
} from 'claude-code/testing';

// Built at run time, so this suite never holds the text the guards refuse.
const MIRROR = `https://${['npm', 'mirror'].join('')}.com/`;
const IGNORE = `/* ${['istanbul', 'ignore'].join(' ')} next */`;
// The kit's types leave `agentId` off `$.tool.call`, yet the call carries it to the hooks as a subagent's would.
const SUBAGENT = { agentId: 'agent-1' };
const CONVENTIONAL = /^(?:feat|fix)(?:\([\w-]+\))?: \S/u;

interface Repo {
  staged: string[];
  diff: string;
  dirs: Record<string, string[]>;
  texts: Record<string, string>;
  refs: string;
  agents: [string, AgentStatus][];
}

interface Seen {
  lints: { cwd: string | undefined; stdin: string | undefined }[];
  prompts: string[];
}

const fakeRepo = (on: On, overrides: Partial<Repo> = {}): { repo: Repo; seen: Seen } => {
  const repo: Repo = {
    staged: ['a.ts'],
    diff: '',
    dirs: {},
    texts: {},
    refs: 'abc1234\nabc1234\n',
    agents: [],
    ...overrides,
  };
  const seen: Seen = { lints: [], prompts: [] };
  const answer = (exitCode: number, stdout: string): { value: { exitCode: number; stdout: string; stderr: string; isStdoutTruncated: boolean; isStderrTruncated: boolean } } => {
    return {
      value: {
        exitCode,
        stdout,
        stderr: '',
        isStdoutTruncated: false,
        isStderrTruncated: false,
      },
    };
  };

  on('session.root', () => {
    return { value: '/repo' };
  });
  on('session.cwd', () => {
    return { value: '/repo' };
  });
  on('agent.list', () => {
    return {
      value: repo.agents.map(([id, status]) => {
        return {
          id,
          description: id,
          type: 'general-purpose',
          status,
        };
      }),
    };
  });
  on('fs.list', (_, e) => {
    return {
      value: (repo.dirs[e.path] ?? []).map((name) => {
        return {
          name,
          kind: 'file' as const,
          size: 0,
          mtimeMs: 0,
          isLink: false,
        };
      }),
    };
  });
  on('fs.read', (_, e) => {
    const text = repo.texts[e.path];

    if (text === undefined) {
      throw new Error('ENOENT');
    }

    return { value: text };
  });
  on('process.run', (_, e) => {
    const command = e.argv.join(' ');

    if (command === 'pnpm exec commitlint') {
      seen.lints.push({ cwd: e.init?.cwd, stdin: e.init?.stdin });

      return CONVENTIONAL.test(e.init?.stdin ?? '') ? answer(0, '') : answer(1, '✖   subject may not be empty');
    }

    if (command.startsWith('git rev-parse')) {
      return answer(0, repo.refs);
    }

    return answer(0, command.includes('--name-only') ? repo.staged.join('\n') : repo.diff);
  });
  on('tool.call', (_, e) => {
    if (e.tool === 'Agent') {
      seen.prompts.push(e.prompt);
    }

    return { result: 'ran' };
  });

  return { repo, seen };
};

const bash = async ($: Engine, command: string, agentId?: string): Promise<string | undefined> => {
  const ran = await $.tool.call({ tool: 'Bash', command, ...(agentId === undefined ? {} : { agentId }) });

  return ran.deny;
};

const read = async ($: Engine, file_path: string): Promise<string | undefined> => {
  const ran = await $.tool.call({ tool: 'Read', file_path });

  return ran.deny;
};

test('refuses reading a lockfile, installed code, coverage, a transcript or a task output whole', async ($, on) => {
  fakeRepo(on);
  const paths = ['/repo/pnpm-lock.yaml', '/repo/node_modules/x/index.js', '/repo/coverage/lcov.info', '/t/s.jsonl', '/t/b.output'];
  const denied = await Promise.all(paths.map(async (path) => {
    return read($, path);
  }));
  const plain = await read($, '/repo/packages/create/pnpm-lock.yaml.md');

  expect(denied[0]).toContain('/repo/pnpm-lock.yaml is the lockfile');
  expect(denied[1]).toContain('installed package code');
  expect(denied[2]).toContain('coverage output');
  expect(denied[3]).toContain('a Claude transcript');
  expect(denied[4]).toContain('a task\'s output file');
  expect(plain).toBeUndefined();
});

test('refuses the same reads through a shell reader, and lets grep and other files through', async ($, on) => {
  fakeRepo(on);
  const cat = await bash($, 'cd /repo && cat pnpm-lock.yaml');
  const tail = await bash($, '/usr/bin/tail -n 5 coverage/lcov.info');
  const sed = await bash($, 'sed -n 1,5p a.ts; head x.jsonl');
  const grep = await bash($, 'grep version pnpm-lock.yaml');
  const other = await bash($, 'cat a.ts | head -3');

  expect(cat).toContain('pnpm-lock.yaml is the lockfile');
  expect(tail).toContain('coverage output');
  expect(sed).toContain('a Claude transcript');
  expect(grep).toBeUndefined();
  expect(other).toBeUndefined();
});

test('refuses a subagent\'s polling, and leaves the main session\'s alone', async ($, on) => {
  fakeRepo(on);
  const loop = 'until test -f done; do sleep 5; done';
  const agentLoop = await bash($, loop, 'agent-1');
  const agentWatch = await bash($, 'watch -n 5 ls', 'agent-1');
  const agentOnce = await bash($, 'ls; sleep 1', 'agent-1');
  const mainLoop = await bash($, loop);
  const agentMonitor = await $.tool.call({ tool: 'Monitor', description: 'd', timeout_ms: 1000, command: 'ls', ...SUBAGENT });
  const mainMonitor = await $.tool.call({ tool: 'Monitor', description: 'd', timeout_ms: 1000, command: 'ls' });

  expect(agentLoop).toContain('a subagent does not poll');
  expect(agentWatch).toContain('a subagent does not poll');
  expect(agentOnce).toBeUndefined();
  expect(mainLoop).toBeUndefined();
  expect(agentMonitor.deny).toContain('a subagent does not poll');
  expect(mainMonitor.deny).toBeUndefined();
});

test('runs commitlint on the message and refuses what it refuses', async ($, on) => {
  const { seen } = fakeRepo(on);
  const bad = await bash($, 'git commit -m "added stuff"');
  const good = await bash($, 'git add a.ts && git commit -m \'feat: add a\' -m \'Why it matters.\'');

  expect(bad).toContain('commitlint refuses this message:\n✖   subject may not be empty');
  expect(good).toBeUndefined();
  expect(seen.lints).toEqual([{ cwd: '/repo', stdin: 'added stuff' }, { cwd: '/repo', stdin: 'feat: add a\n\nWhy it matters.' }]);
});

test('reads the message from every way git takes one', async ($, on) => {
  const { seen } = fakeRepo(on, { texts: { '/repo/msg.txt': 'fix: from a file', '/abs/msg': 'fix: absolute' } });
  const commands = [
    'git commit -am "fix: cluster"',
    'git commit -mfix:attached',
    'git commit --message="fix: long form"',
    'git commit --message "fix: long, next word"',
    'git commit -F msg.txt',
    'git commit --file=/abs/msg',
    'git commit -F - <<\'EOF\'\nfix: heredoc\n\nBody.\nEOF',
    'git commit -m "$(cat <<\'EOF\'\nfix: substituted\nEOF\n)"',
  ];

  for (const command of commands) {
    await bash($, command);
  }

  const messages = seen.lints.map(({ stdin }) => {
    return stdin;
  });

  expect(messages).toEqual([
    'fix: cluster',
    'fix:attached',
    'fix: long form',
    'fix: long, next word',
    'fix: from a file',
    'fix: absolute',
    'fix: heredoc\n\nBody.',
    'fix: substituted',
  ]);
});

test('lints in the directory a leading cd or git -C names, and skips what it cannot read', async ($, on) => {
  const { seen } = fakeRepo(on);
  await bash($, 'cd packages/create && git commit -m "fix: a"');
  await bash($, 'git -C /elsewhere -c core.x=y commit -m "fix: b"');
  const unread = await bash($, 'git commit -m "$MESSAGE"');
  const noMessage = await bash($, 'git commit -F missing.txt');
  const notCommit = await bash($, 'git log -m "x"');

  expect(seen.lints).toEqual([{ cwd: '/repo/packages/create', stdin: 'fix: a' }, { cwd: '/elsewhere', stdin: 'fix: b' }]);
  expect(unread).toBeUndefined();
  expect(noMessage).toBeUndefined();
  expect(notCommit).toBeUndefined();
});

test('refuses a commit while a throwaway script is staged or sits at a root', async ($, on) => {
  const { repo, seen } = fakeRepo(on, { staged: ['scripts/probe.tmp.ts'] });
  const staged = await bash($, 'git commit -m "fix: a"');
  repo.staged = ['a.ts'];
  repo.dirs = { '/repo': ['root.tmp.ts'] };
  const atRoot = await bash($, 'git commit -m "fix: a"');
  repo.dirs = { '/repo/packages': ['create'], '/repo/packages/create': ['probe.tmp.ts', 'probe.ts'] };
  const atPackage = await bash($, 'git commit -m "fix: a"');
  repo.dirs = { '/repo': ['probe.ts'] };
  const clean = await bash($, 'git commit -m "fix: a"');

  expect(staged).toBe('linteljs: delete the throwaway script before committing: scripts/probe.tmp.ts.');
  expect(atRoot).toContain(': root.tmp.ts.');
  expect(atPackage).toContain(': packages/create/probe.tmp.ts.');
  expect(clean).toBeUndefined();
  expect(seen.lints).toHaveLength(1);
});

test('refuses staged lines adding a mirror or an ignore comment outside data files', async ($, on) => {
  const { repo } = fakeRepo(on);
  repo.diff = `+++ b/.npmrc\n+registry=${MIRROR}\n`;
  const mirror = await bash($, 'git commit -m "fix: a"');
  repo.diff = `+++ b/packages/create/src/a.ts\n+${IGNORE}\n`;
  const ignored = await bash($, 'git commit -m "fix: a"');
  repo.diff = `+++ b/packages/create/src/a.test.ts\n+${IGNORE}\n+++ b/.npmrc\n+registry=https://registry.npmjs.org/\n`;
  const allowed = await bash($, 'git commit -m "fix: a"');

  expect(mirror).toContain('.npmrc would gain a registry other than registry.npmjs.org (npmmirror.com)');
  expect(ignored).toContain('packages/create/src/a.ts would gain a coverage ignore or Stryker disable comment');
  expect(allowed).toBeUndefined();
});

test('refuses an Edit or Write that adds a mirror or an ignore comment, and allows one already there', async ($, on) => {
  fakeRepo(on, { texts: { '/repo/old.ts': `const r = '${MIRROR}';\n` } });
  const edit = async (file_path: string, old_string: string, new_string: string): Promise<string | undefined> => {
    const ran = await $.tool.call({ tool: 'Edit', file_path, old_string, new_string });

    return ran.deny;
  };
  const write = async (file_path: string, content: string): Promise<string | undefined> => {
    const ran = await $.tool.call({ tool: 'Write', file_path, content });

    return ran.deny;
  };
  const addedMirror = await edit('/repo/a.ts', 'x', `x ${MIRROR}`);
  const keptMirror = await edit('/repo/a.ts', `a ${MIRROR}`, `b ${MIRROR}`);
  const addedIgnore = await edit('/repo/packages/create/src/a.ts', 'x', `${IGNORE}\nx`);
  const ignoreInSuite = await edit('/repo/packages/create/src/a.test.ts', 'x', `${IGNORE}\nx`);
  const ignoreInDocs = await write('/repo/docs/a.md', IGNORE);
  const ignoreInTemplate = await write('/repo/packages/create/templates/a.ts', IGNORE);
  const newMirror = await write('/repo/new.ts', MIRROR);
  const rewritten = await write('/repo/old.ts', `const r = '${MIRROR}';\nexport { r };\n`);

  expect(addedMirror).toContain('/repo/a.ts would gain a registry other than registry.npmjs.org');
  expect(keptMirror).toBeUndefined();
  expect(addedIgnore).toContain('would gain a coverage ignore or Stryker disable comment');
  expect(ignoreInSuite).toBeUndefined();
  expect(ignoreInDocs).toBeUndefined();
  expect(ignoreInTemplate).toBeUndefined();
  expect(newMirror).toContain('/repo/new.ts would gain a registry other than');
  expect(rewritten).toBeUndefined();
});

const spawn = async ($: Engine, isolation?: 'worktree', agentId?: string): Promise<void> => {
  await $.tool.call({
    tool: 'Agent',
    description: 'd',
    prompt: 'Do the task.',
    ...(isolation === undefined ? {} : { isolation }),
    ...(agentId === undefined ? {} : { agentId }),
  });
};

// The kit's `$.session.append` from a plugin rejects (`no implementation for session.append`) before any test
// hook sees it, so the note's text is held in `utils/guardUtils.test.ts`; here, that a refused note stops nothing.
test('spawns a worktree agent with its base note when the leftover-worktree note is refused', async ($, on) => {
  const { seen } = fakeRepo(on, {
    refs: 'abc1234\ndef5678\n',
    agents: [['live', 'running']],
    dirs: { '/repo/.claude/worktrees': ['agent-live', 'agent-done'] },
  });
  await spawn($, 'worktree');

  expect(seen.prompts[0]).toMatch(/^Your worktree may start at origin's def5678[\s\S]*\n\nDo the task\.$/u);
});

test('tells a worktree agent to fast-forward when main is ahead of origin', async ($, on) => {
  const { repo, seen } = fakeRepo(on, { refs: 'abc1234\ndef5678\n' });
  await spawn($, 'worktree');
  repo.refs = 'abc1234\nabc1234\n';
  await spawn($, 'worktree');

  expect(seen.prompts[0]).toBe('Your worktree may start at origin\'s def5678 rather than abc1234, where the main '
    + 'session is. Before anything else, run `git merge --ff-only abc1234` in it and confirm `git log --oneline -1`.'
    + '\n\nDo the task.');
  expect(seen.prompts[1]).toBe('Do the task.');
});

test('leaves a spawn alone without a worktree, or from a subagent', async ($, on) => {
  const { seen } = fakeRepo(on, { refs: 'abc1234\ndef5678\n', dirs: { '/repo/.claude/worktrees': ['agent-old'] } });
  await spawn($);
  await spawn($, 'worktree', 'agent-1');
  expect(seen.prompts).toEqual(['Do the task.', 'Do the task.']);
});
