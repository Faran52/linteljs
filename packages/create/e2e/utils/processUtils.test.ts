import { spawn } from 'node:child_process';
import { execPath } from 'node:process';

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  launcherFreeEnv,
  oneAtATime,
  outcome,
  registry,
  run,
  runPm,
  type RunResult,
} from './processUtils';

vi.mock('node:child_process', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:child_process')>();

  const mocked = {
    ...original,
    spawn: vi.fn(original.spawn),
  };

  return mocked;
});

const OK: RunResult = {
  status: 0,
  output: '',
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.mocked(spawn).mockClear();
});

describe('launcherFreeEnv', () => {
  it('drops what the launcher set and keeps the rest', () => {
    vi.stubEnv('npm_config_user_agent', 'pnpm/12.0.0');
    vi.stubEnv('npm_package_name', 'linteljs');
    vi.stubEnv('npm_lifecycle_event', 'test');
    vi.stubEnv('VITEST_POOL_ID', '1');
    vi.stubEnv('E2E_KEPT', 'yes');

    const actual = launcherFreeEnv();
    expect(actual).not.toHaveProperty('npm_config_user_agent');
    expect(actual).not.toHaveProperty('npm_package_name');
    expect(actual).not.toHaveProperty('npm_lifecycle_event');
    expect(actual).not.toHaveProperty('VITEST_POOL_ID');
    expect(actual).toHaveProperty('E2E_KEPT', 'yes');
  });
});

describe('run', () => {
  it('answers the exit code and stdout before stderr, through the registry, as the agent', async () => {
    const script = [
      'process.stderr.write("err ")',
      'process.stdout.write(process.env.npm_config_registry + " " + process.env.npm_config_user_agent)',
      'process.exit(3)',
    ].join(';');

    const actual = await run(execPath, ['-e', script], '.', 'yarn/4.0.0');

    expect(actual).toEqual({
      status: 3,
      output: `${registry.url} yarn/4.0.0err `,
    });
  });

  it('strips colour from the output', async () => {
    const actual = await run(execPath, ['-e', 'process.stdout.write("\\u001B[31mred\\u001B[0m")'], '.');

    expect(actual).toEqual({
      status: 0,
      output: 'red',
    });
  });

  it('reports a missing binary as a failure', async () => {
    const actual = await run('linteljs-no-such-binary', [], '.');
    expect(actual.status).toBe(1);
    expect(actual.output).toContain('ENOENT');
  });
});

describe('oneAtATime', () => {
  it('runs pnpm at once and every other manager after the last one queued', async () => {
    const order: string[] = [];
    const { promise, resolve } = Promise.withResolvers<RunResult>();
    const held = oneAtATime('yarn', () => {
      order.push('first');

      return promise;
    });
    const queued = oneAtATime('yarn', () => {
      order.push('second');

      return Promise.resolve(OK);
    });
    const pnpm = oneAtATime('pnpm', () => {
      order.push('pnpm');

      return Promise.resolve(OK);
    });
    expect(order).toEqual(['pnpm']);

    await vi.waitFor(() => {
      expect(order).toEqual(['pnpm', 'first']);
    });

    resolve(OK);
    const settled = await Promise.all([
      held,
      queued,
      pnpm,
    ]);

    expect(settled).toEqual([
      OK,
      OK,
      OK,
    ]);

    expect(order).toEqual([
      'pnpm',
      'first',
      'second',
    ]);
  });
});

describe('outcome', () => {
  it('folds a failure\'s output into the label', () => {
    const passed = outcome(OK, 'install');
    expect(passed).toBe('install: ok');
    const failed = outcome({
      status: 2,
      output: 'boom',
    }, 'install');
    expect(failed).toBe('install: exit 2\nboom');
  });
});

describe('runPm', () => {
  it('spells each argument the way the manager does', async () => {
    await runPm('npm', ['why', 'eslint'], '.');
    const [command, args] = vi.mocked(spawn).mock.calls[0] ?? [];
    expect(command).toBe('npm');
    expect(args).toEqual(['ls', 'eslint']);
  });
});
