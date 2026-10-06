import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import {
  basename,
  dirname,
  join,
} from 'node:path';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  checkState,
  commitGateReason,
  finishCheck,
  managerOf,
  projectOf,
  startCheck,
  treeOf,
} from './checkGateUtils.ts';

let root = '';

const git = (...arguments_: string[]): string => {
  const output = execFileSync('/usr/bin/git', arguments_, {
    cwd: root,
    encoding: 'utf8',
    stdio: [
      'ignore',
      'pipe',
      'ignore',
    ],
  });

  return output.trim();
};

const writeManifest = (manifest: object): void => {
  writeFileSync(join(root, 'package.json'), JSON.stringify(manifest));
};

const shell = (command: string, event = 'PreToolUse', tool = 'Bash'): object => {
  const payload = {
    cwd: root,
    hook_event_name: event,
    tool_name: tool,
    tool_input: { command },
  };

  return payload;
};

const runCheck = (command: string, event = 'PostToolUse'): void => {
  startCheck(shell(command));
  finishCheck(shell(command, event));
};

const scratchDirectory = (name: string): string => {
  const prefix = join(tmpdir(), `linteljs-${name}-`);
  const directory = mkdtempSync(prefix);

  return realpathSync(directory);
};

const statePath = (): string => {
  const directory = git('rev-parse', '--path-format=absolute', '--git-path', 'linteljs');
  return join(directory, 'check.json');
};

beforeEach(() => {
  const prefix = join(tmpdir(), 'linteljs-check-gate-');
  const directory = mkdtempSync(prefix);
  root = realpathSync(directory);
  git('init', '--quiet');

  writeManifest({
    packageManager: 'pnpm@11.0.0',
    scripts: { check: 'true' },
  });
});

afterEach(() => {
  vi.unstubAllEnvs();

  rmSync(root, {
    force: true,
    recursive: true,
  });
});

describe('managerOf', () => {
  it.each([
    [{ devEngines: { packageManager: { name: 'bun' } } }, 'bun'],
    [{ packageManager: 'yarn@4.1.0' }, 'yarn'],
    [{ packageManager: 'pnpm' }, 'pnpm'],
    [{ devEngines: { packageManager: 'pnpm' } }, 'npm'],
    [{}, 'npm'],
    [undefined, 'npm'],
  ])('reads %j as %s', (manifest, expected) => {
    const manager = managerOf(manifest);
    expect(manager).toBe(expected);
  });
});

describe('projectOf', () => {
  it('reads the root, the state directory, the index and the manager', () => {
    const project = projectOf(root);

    expect(project).toEqual({
      root,
      directory: join(root, '.git/linteljs'),
      index: join(root, '.git/index'),
      manager: 'pnpm',
    });
  });

  it.each([
    ['a PATH of relative entries only', 'bin:.'],
    ['no PATH', undefined],
  ])('answers nothing with %s, so no git in the working directory runs', (_label, path) => {
    vi.stubEnv('PATH', path);
    const project = projectOf(root);
    expect(project).toBeUndefined();
  });

  it('answers nothing for a project with no check script, or outside a repository', () => {
    writeManifest({ scripts: { test: 'true' } });
    const unchecked = projectOf(root);

    rmSync(join(root, '.git'), {
      force: true,
      recursive: true,
    });

    writeManifest({ scripts: { check: 'true' } });
    const outside = projectOf(root);

    expect(unchecked).toBeUndefined();
    expect(outside).toBeUndefined();
  });
});

describe('treeOf', () => {
  it('counts untracked files, leaves ignored ones out, and never touches the real index', () => {
    writeFileSync(join(root, '.gitignore'), 'ignored.txt\n');
    git('add', '.gitignore');
    const staged = git('diff', '--cached', '--name-only');
    const project = projectOf(root);
    const first = project === undefined ? undefined : treeOf(project);
    writeFileSync(join(root, 'ignored.txt'), 'x');
    const ignored = project === undefined ? undefined : treeOf(project);
    writeFileSync(join(root, 'new.ts'), 'x');
    const untracked = project === undefined ? undefined : treeOf(project);
    const stagedAfter = git('diff', '--cached', '--name-only');

    expect(first).toMatch(/^[\da-f]{40}$/u);
    expect(ignored).toBe(first);
    expect(untracked).not.toBe(first);
    expect(stagedAfter).toBe(staged);
  });

  it('builds a tree before the repository has an index', () => {
    const project = projectOf(root);
    const tree = project === undefined ? undefined : treeOf(project);
    expect(tree).toMatch(/^[\da-f]{40}$/u);
  });

  it('answers nothing when git refuses', () => {
    const project = projectOf(root);
    const tree = project === undefined
      ? 'no project'
      : treeOf({
          ...project,
          root: join(root, 'missing'),
        });

    expect(tree).toBeUndefined();
  });
});

describe('checkState', () => {
  it('walks from none through running to passed, and goes stale when a file changes', () => {
    const before = checkState(root);
    startCheck(shell('pnpm check'));
    const running = checkState(root);
    finishCheck(shell('pnpm check', 'PostToolUse'));
    const passed = checkState(root);
    writeFileSync(join(root, 'changed.ts'), 'x');
    const stale = checkState(root);

    expect([
      before,
      running,
      passed,
      stale,
    ]).toEqual([
      'none',
      'running',
      'passed',
      'stale',
    ]);
  });

  it('reads a failed run as failed', () => {
    runCheck('pnpm check', 'PostToolUseFailure');
    const state = checkState(root);
    expect(state).toBe('failed');
  });

  it('answers nothing outside a checked project', () => {
    writeManifest({});
    const state = checkState(root);
    expect(state).toBeUndefined();
  });

  it.each([
    '{"tree":"abc","result":"done"}',
    '{"result":"passed"}',
    '{',
  ])('reads a state file it cannot trust, %s, as none', (text) => {
    runCheck('pnpm check');
    writeFileSync(statePath(), text);
    const state = checkState(root);

    expect(state).toBe('none');
  });
});

describe('startCheck and finishCheck', () => {
  it.each([
    'pnpm check',
    'pnpm run check',
    'pnpm check > /tmp/check.log 2>&1',
    'pnpm check >/tmp/check.log',
    'pnpm check &> /tmp/check.log',
    'pnpm check 2> /tmp/errors.log',
    'pnpm check >& /tmp/check.log',
    'cd . && pnpm check',
    'cd . && pnpm check > /tmp/check.log 2>&1',
    'CI=1 pnpm check',
    "CI='a b' pnpm check",
    'FOO=a BAR=b pnpm run check > /tmp/x.log 2>&1',
    'cd . && CI=1 pnpm check > /tmp/check.log 2>&1',
  ])('counts `%s`', (command) => {
    runCheck(command);
    const state = checkState(root);
    expect(state).toBe('passed');
  });

  it.each([
    'pnpm check | tail',
    'pnpm check 2>&1 | tail -5',
    'pnpm check && echo done',
    'pnpm check; echo $?',
    'cd .; pnpm check',
    'cd . || pnpm check',
    'cd . && pnpm check | tail',
    'cd . && pnpm check && echo done',
    'cd . && cd . && pnpm check',
    'cd "a && b" && pnpm check',
    'echo . && pnpm check',
    'cd && pnpm check',
    'cd . extra && pnpm check',
    'pnpm check --fix',
    'pnpm check > $(mktemp)',
    'CI=$(true) pnpm check',
    'CI="$(true)" pnpm check',
    'CI="$()" pnpm check',
    'CI=`true` pnpm check',
    'CI=1 pnpm check | tail',
    'CI=1 pnpm check && echo done',
    'CI=1; pnpm check',
    'CI=1',
    'env CI=1 pnpm check',
    'time pnpm check',
    'sudo pnpm check',
    "bash -c 'pnpm check'",
    "sh -c 'pnpm check'",
    'npm run check',
    'pnpm lint',
    'git status',
  ])('does not count `%s`', (command) => {
    runCheck(command);
    const state = checkState(root);
    expect(state).toBe('none');
  });

  it('records a `cd <dir> &&` check, from anywhere, against <dir>', () => {
    const elsewhere = scratchDirectory('elsewhere');
    const payload = {
      ...shell(`cd ${root} && pnpm check > /tmp/check.log 2>&1`),
      cwd: elsewhere,
    };
    startCheck(payload);

    finishCheck({
      ...payload,
      hook_event_name: 'PostToolUse',
    });

    const state = checkState(root);
    rmSync(elsewhere, { recursive: true });

    expect(state).toBe('passed');
  });

  it('counts `npm run check` for an npm project, whose bare `npm check` is no script', () => {
    writeManifest({ scripts: { check: 'true' } });
    runCheck('npm check');
    const bare = checkState(root);
    runCheck('npm run check');
    const run = checkState(root);

    expect(bare).toBe('none');
    expect(run).toBe('passed');
  });

  it('reads a PowerShell check, and ignores a host other than Claude Code', () => {
    startCheck({
      cursor_version: '2.4.0',
      cwd: root,
      hook_event_name: 'beforeShellExecution',
      command: 'pnpm check',
    });

    const cursor = checkState(root);
    startCheck(shell('pnpm check', 'PreToolUse', 'PowerShell'));
    const powershell = checkState(root);

    expect(cursor).toBe('none');
    expect(powershell).toBe('running');
  });

  it('finishes only a run it saw start, and leaves a finished one as it was', () => {
    finishCheck(shell('pnpm check', 'PostToolUse'));
    const unstarted = checkState(root);
    runCheck('pnpm check', 'PostToolUseFailure');
    finishCheck(shell('pnpm check', 'PostToolUse'));
    const finished = checkState(root);

    expect(unstarted).toBe('none');
    expect(finished).toBe('failed');
  });

  it('records the tree taken as the check started', () => {
    startCheck(shell('pnpm check'));
    writeFileSync(join(root, 'during.ts'), 'x');
    finishCheck(shell('pnpm check', 'PostToolUse'));
    const state = checkState(root);
    const text = readFileSync(statePath(), 'utf8');
    const record: unknown = JSON.parse(text);

    expect(state).toBe('stale');
    expect(record).toMatchObject({ result: 'passed' });
  });

  it('records nothing when no tree can be built', () => {
    writeFileSync(join(root, '.git/linteljs'), 'a file where the directory goes');
    startCheck(shell('pnpm check'));
    const state = readFileSync(join(root, '.git/linteljs'), 'utf8');
    expect(state).toBe('a file where the directory goes');
  });
});

describe('commitGateReason', () => {
  it.each([
    ['git commit -m x', 'not run on these files'],
    ['git -C . commit -m x', 'not run on these files'],
    ['git add a.ts && git commit', 'not run on these files'],
  ])('holds `%s` until the check passes', (command, why) => {
    const reason = commitGateReason(shell(command));

    expect(reason).toContain(why);
    expect(reason).toContain('`pnpm check > /tmp/check.log 2>&1`');
  });

  it.each([
    'git -C {root} commit -m x',
    'git -c a.b=c -C / -C {root} commit',
    'cd {root} && git commit',
    'cd {root} && git add a.ts && git commit',
    'cd / && git -C {root} commit',
    'Set-Location {root} && git commit',
  ])('judges `%s` on the project it commits in, not the session\'s', (template) => {
    const elsewhere = scratchDirectory('elsewhere');
    const command = template.replaceAll('{root}', root);
    const payload = {
      ...shell(command),
      cwd: elsewhere,
    };
    const held = commitGateReason(payload);
    runCheck('pnpm check');
    const passed = commitGateReason(payload);
    rmSync(elsewhere, { recursive: true });

    expect(held).toContain('not run on these files');
    expect(passed).toBeUndefined();
  });

  it('reads a `-C` given as another option\'s value as that value', () => {
    const reason = commitGateReason({
      ...shell(`git --namespace -C -C ${basename(root)} commit`),
      cwd: dirname(root),
    });
    expect(reason).toContain('not run on these files');
  });

  it('reads `~` in a moved directory as the home directory', () => {
    vi.stubEnv('HOME', root);
    const reason = commitGateReason({
      ...shell('cd ~ && git commit'),
      cwd: '/',
    });
    expect(reason).toContain('not run on these files');
  });

  it('holds a call whose second commit is in a project not yet checked', () => {
    runCheck('pnpm check');
    const other = scratchDirectory('other');

    execFileSync('/usr/bin/git', [
      'init',
      '--quiet',
      other,
    ]);

    writeFileSync(join(other, 'package.json'), '{"scripts":{"check":"true"}}');
    const reason = commitGateReason(shell(`git commit && git -C ${other} commit`));
    rmSync(other, { recursive: true });

    expect(reason).toMatch(/^Commit held: `npm run check`/u);
  });

  it('names a failed run', () => {
    runCheck('pnpm check', 'PostToolUseFailure');
    const reason = commitGateReason(shell('git commit'));
    expect(reason).toContain('it failed when it last ran');
  });

  it('names a run still going, and a pass the files have moved past', () => {
    startCheck(shell('pnpm check'));
    const running = commitGateReason(shell('git commit'));
    finishCheck(shell('pnpm check', 'PostToolUse'));
    writeFileSync(join(root, 'later.ts'), 'x');
    const stale = commitGateReason(shell('git commit'));

    expect(running).toContain('it has not finished, or was stopped');
    expect(stale).toContain('files changed since it passed');
  });

  it('lets a commit through once the check passed on the same files', () => {
    runCheck('pnpm check');
    const reason = commitGateReason(shell('git commit -m x'));
    expect(reason).toBeUndefined();
  });

  it('names `npm run check` for an npm project', () => {
    writeManifest({ scripts: { check: 'true' } });
    const reason = commitGateReason(shell('git commit'));
    expect(reason).toMatch(/^Commit held: `npm run check` has not passed/u);
  });

  it.each([
    'git status',
    'git log --grep commit',
    'echo git commit',
    'git -C',
    'git commit -m "open',
  ])('passes `%s`, which commits nothing', (command) => {
    const reason = commitGateReason(shell(command));
    expect(reason).toBeUndefined();
  });

  it('passes a commit outside a checked project, and one from another host', () => {
    const copilot = commitGateReason({
      cwd: root,
      toolName: 'bash',
      toolArgs: '{"command":"git commit"}',
    });
    writeManifest({});
    const unchecked = commitGateReason(shell('git commit'));

    expect(copilot).toBeUndefined();
    expect(unchecked).toBeUndefined();
  });

  it('reads the working directory from the process when the payload names none', () => {
    const reason = commitGateReason({ tool_input: { command: 'git commit' } });
    const named = commitGateReason({
      cwd: process.cwd(),
      tool_input: { command: 'git commit' },
    });

    expect(reason).toBe(named);
  });
});
