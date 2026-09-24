import {
  chmod,
  mkdir,
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { execPath, versions } from 'node:process';

import { plantBinary } from '@mocks/plantBinary';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { NODE_FLOOR } from '@config/constants';

import { DEFAULT_ANSWERS } from '@answers';

import {
  filled,
  type Host,
  hosted,
  hostOf,
} from './host';

const HOST: Host = {
  packageManager: 'pnpm',
  packageManagerVersion: '12.5.1',
  nodeVersion: '26.9.0',
};

let cwd = '';

// The agent is stubbed rather than inherited, so what the suite runs under decides nothing.
beforeEach(async () => {
  vi.stubEnv('npm_config_user_agent', 'pnpm/12.5.1 npm/? node/? darwin arm64');
  cwd = await mkdtemp(join(tmpdir(), 'linteljs-host-'));
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

describe('hostOf: the manager that ran it', () => {
  it('reads the manager and its version off the user agent', async () => {
    expect(await hostOf(cwd)).toEqual({
      packageManager: 'pnpm',
      packageManagerVersion: '12.5.1',
      nodeVersion: versions.node,
    });
  });

  // `--existing` and `sync` run in a directory somebody already has, and a lockfile there is the same answer.
  it.each([
    ['pnpm-lock.yaml', 'pnpm-lock.yaml', '', 'pnpm', '12.5.1', 'pnpm'],
    ['a classic yarn.lock', 'yarn.lock', '# yarn lockfile v1\n', 'yarn', '1.22.22', 'yarn-classic'],
    ['a berry yarn.lock', 'yarn.lock', '__metadata:\n', 'yarn', '4.18.0', 'yarn'],
    ['bun.lock', 'bun.lock', '', 'bun', '1.3.14', 'bun'],
    ['bun.lockb', 'bun.lockb', '', 'bun', '1.3.14', 'bun'],
  ])('reads %s as the manager that wrote it where no agent set one', async (
    _case,
    lockfile,
    text,
    binary,
    version,
    manager,
  ) => {
    vi.stubEnv('npm_config_user_agent', '');
    await writeFile(join(cwd, lockfile), text, 'utf8');
    await plantBinary(join(cwd, 'fake-bin'), binary, [`console.log('${version}');`]);

    expect(await hostOf(cwd)).toMatchObject({
      packageManager: manager,
      packageManagerVersion: version,
    });
  });

  it('falls back to npm where there is neither', async () => {
    vi.stubEnv('npm_config_user_agent', '');
    await plantBinary(join(cwd, 'fake-bin'), 'npm', ["console.log('11.19.1');"]);

    expect(await hostOf(cwd)).toMatchObject({ packageManager: 'npm' });
  });

  it('refuses a manager below the floor a generated project needs', async () => {
    vi.stubEnv('npm_config_user_agent', 'pnpm/10.25.0 npm/? node/? darwin arm64');

    expect(await hostOf(cwd)).toContain('needs pnpm 10.26.0 or newer');
  });

  // Refused before the floor is read, since there is no version to hold to one.
  it('refuses a manager that will not say its version', async () => {
    vi.stubEnv('npm_config_user_agent', 'pnpm/? npm/? node/? darwin arm64');
    await plantBinary(join(cwd, 'fake-bin'), 'pnpm', ['process.exit(1);']);

    expect(await hostOf(cwd)).toContain('pnpm --version');
  });
});

// bun bundles a Node of its own, so under bun the Node a project will run on is asked of `PATH` instead.
describe('hostOf: the Node a project records', () => {
  // A shell script rather than `plantBinary`: a stand-in named `node` would answer its own `env node` shebang.
  const plantNode = async (version: string): Promise<void> => {
    const bin = join(cwd, 'fake-bin');

    await mkdir(bin, { recursive: true });
    await writeFile(join(bin, 'node'), `#!/bin/sh\necho ${version}\n`, 'utf8');
    await chmod(join(bin, 'node'), 0o755);
    vi.stubEnv('PATH', `${bin}:${dirname(execPath)}`);
  };

  const asBun = (): void => {
    Object.defineProperty(versions, 'bun', {
      value: '1.3.14',
      configurable: true,
    });
  };

  afterEach(() => {
    Reflect.deleteProperty(versions, 'bun');
  });

  it('records the Node running it under node, not the first one on PATH', async () => {
    await plantNode('v24.99.0');

    expect(await hostOf(cwd)).toMatchObject({ nodeVersion: versions.node });
  });

  it('records the Node on PATH under bun', async () => {
    await plantNode('v24.99.0');
    asBun();

    expect(await hostOf(cwd)).toMatchObject({ nodeVersion: '24.99.0' });
  });

  it('refuses under bun with no Node on PATH, and names the floor to install', async () => {
    vi.stubEnv('PATH', '');
    asBun();

    const refusal = await hostOf(cwd);

    expect(refusal).toContain('bun ran this');
    expect(refusal).toContain(NODE_FLOOR);
  });
});

describe('hosted', () => {
  // The manager question is gone, so whatever the answers carried is replaced rather than kept.
  it('records the host over whatever manager the answers carried', () => {
    expect(hosted({
      ...DEFAULT_ANSWERS,
      packageManager: 'npm',
    }, HOST)).toMatchObject(HOST);
  });
});

// A config written before the versions existed: its manager is the project's, and the run fills what it lacks.
describe('filled', () => {
  it('keeps the manager a config recorded and fills only what it lacks', () => {
    expect(filled(DEFAULT_ANSWERS, HOST)).toMatchObject(HOST);
  });

  // Node is not a manager, so it fills either way.
  it('fills no version where the machine runs a different manager than the config records', () => {
    const answers = filled({
      ...DEFAULT_ANSWERS,
      packageManager: 'npm',
    }, HOST);

    expect(answers).toMatchObject({
      packageManager: 'npm',
      nodeVersion: HOST.nodeVersion,
    });
    expect(answers).not.toHaveProperty('packageManagerVersion');
  });

  it("keeps the versions a config already recorded rather than the machine's", () => {
    expect(filled({
      ...DEFAULT_ANSWERS,
      packageManagerVersion: '10.30.0',
      nodeVersion: '24.11.0',
    }, HOST)).toMatchObject({
      packageManagerVersion: '10.30.0',
      nodeVersion: '24.11.0',
    });
  });
});
