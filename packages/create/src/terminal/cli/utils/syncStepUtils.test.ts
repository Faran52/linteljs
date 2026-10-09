import { stdout } from 'node:process';

import { HOSTED_DEFAULTS } from '@mocks/hostedAnswers';
import { scripted } from '@mocks/scriptedPrompter';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  runnerSwitch,
  type SyncPlan,
  writeDependencies,
  writeLintConfig,
} from '@pipeline';

import { SYNC_NEEDS_YES } from '../constants';

import {
  type Asker,
  dependencySteps,
  isSettled,
  lintConfigStep,
  switchRefusal,
  type SyncedProject,
} from './syncStepUtils';

vi.mock('@pipeline', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@pipeline')>();
  const pipeline = {
    ...actual,
    runnerSwitch: vi.fn(),
    writeDependencies: vi.fn(),
    writeLintConfig: vi.fn(),
  };

  return pipeline;
});

const UPGRADE = {
  name: 'eslint',
  from: '^9.0.0',
  to: '^10.0.0',
};

const DRIFT = {
  upgrades: [UPGRADE],
  peers: [],
};

const askerOf = (answers: string[], overrides: Partial<Asker> = {}): Asker => {
  const asker: Asker = {
    isYes: false,
    prompter: scripted(answers).prompter,
    hasTerminal: true,
    ...overrides,
  };

  return asker;
};

const projectOf = (eslintConfig: SyncPlan['eslintConfig'], directory = 'apps/web'): SyncedProject => {
  const project: SyncedProject = {
    directory,
    answers: HOSTED_DEFAULTS,
    plan: {
      upgrades: [],
      peers: [],
      eslintConfig,
    },
  };

  return project;
};

let output: string[] = [];
let errors: string[] = [];

beforeEach(() => {
  output = [];
  errors = [];

  vi.spyOn(stdout, 'write')
    .mockImplementation((chunk) => {
      output.push(String(chunk));

      return true;
    });

  vi.spyOn(console, 'error')
    .mockImplementation((message: string) => {
      errors.push(message);
    });
});

afterEach(() => {
  vi.restoreAllMocks();

  vi.mocked(writeDependencies)
    .mockReset();

  vi.mocked(writeLintConfig)
    .mockReset();

  vi.mocked(runnerSwitch)
    .mockReset();
});

describe('isSettled', () => {
  it('holds only with no upgrade and no peer', () => {
    const settled = isSettled({
      upgrades: [],
      peers: [],
    });
    const behind = isSettled(DRIFT);
    const missingPeer = isSettled({
      upgrades: [],
      peers: [UPGRADE],
    });

    expect([
      settled,
      behind,
      missingPeer,
    ]).toEqual([
      true,
      false,
      false,
    ]);
  });
});

describe('dependencySteps', () => {
  it('asks nothing and writes nothing when nothing drifted', async () => {
    const drift = {
      upgrades: [],
      peers: [],
    };

    const blocked = await dependencySteps('/repo', askerOf([]), 'apps/web', drift, 'pnpm');

    expect(blocked).toEqual([false, false]);

    expect(writeDependencies).not.toHaveBeenCalled();
  });

  it('writes a project\'s manifest under its directory, every line prefixed with it', async () => {
    const asker = askerOf([], { isYes: true });

    const blocked = await dependencySteps('/repo', asker, 'apps/web', DRIFT, 'pnpm');
    const printed = output.join('');

    expect(blocked).toEqual([false, false]);

    expect(writeDependencies).toHaveBeenCalledWith('/repo/apps/web', [UPGRADE]);

    expect(printed).toContain('apps/web: @linteljs/* versions behind:');

    expect(printed).toContain('wrote apps/web/package.json\n');
  });

  it('leaves the root unprefixed and names the install for a peer', async () => {
    const asker = askerOf([], { isYes: true });
    const drift = {
      upgrades: [],
      peers: [UPGRADE],
    };

    await dependencySteps('/repo', asker, '.', drift, 'pnpm');
    const printed = output.join('');

    expect(writeDependencies).toHaveBeenCalledWith('/repo', [UPGRADE]);

    expect(printed).toMatch(/^Lint dependencies missing or behind:/v);

    expect(printed).toContain('wrote package.json. Install them:\n  pnpm install\n');
  });

  it('writes nothing when declined, and is not blocked', async () => {
    const blocked = await dependencySteps('/repo', askerOf(['no']), 'apps/web', DRIFT, 'pnpm');

    expect(blocked).toEqual([false, false]);

    expect(writeDependencies).not.toHaveBeenCalled();
  });

  it('is blocked with no terminal and no --yes', async () => {
    const asker = askerOf([], { hasTerminal: false });

    const blocked = await dependencySteps('/repo', asker, 'apps/web', DRIFT, 'pnpm');

    expect(blocked).toEqual([true, false]);

    expect(errors).toEqual([SYNC_NEEDS_YES]);

    expect(writeDependencies).not.toHaveBeenCalled();
  });
});

describe('lintConfigStep', () => {
  it('writes nothing for an unchanged config', async () => {
    const project = projectOf({ status: 'unchanged' });

    const isBlocked = await lintConfigStep('/repo', askerOf([]), project);

    expect(isBlocked).toBe(false);

    expect(writeLintConfig).not.toHaveBeenCalled();
  });

  it('writes a missing config in the project, without asking', async () => {
    const plan = { status: 'missing' } as const;
    const project = projectOf(plan);

    const isBlocked = await lintConfigStep('/repo', askerOf([]), project);
    const printed = output.join('');

    expect(isBlocked).toBe(false);

    expect(writeLintConfig).toHaveBeenCalledWith('/repo/apps/web', HOSTED_DEFAULTS, plan);

    expect(printed).toBe('wrote apps/web/eslint.config.ts\n');
  });

  it('moves a changed config aside when approved', async () => {
    const plan = {
      status: 'changed',
      path: 'eslint.config.js',
      backup: 'eslint.config.js.bak',
    } as const;
    const recorded = scripted(['yes']);
    const asker = askerOf([], { prompter: recorded.prompter });

    const isBlocked = await lintConfigStep('/repo', asker, projectOf(plan));
    const printed = output.join('');

    expect(isBlocked).toBe(false);

    const question = 'apps/web: Move it to apps/web/eslint.config.js.bak and write apps/web/eslint.config.ts?';

    expect(recorded.calls).toEqual([question]);

    expect(writeLintConfig).toHaveBeenCalledWith('/repo/apps/web', HOSTED_DEFAULTS, plan);

    expect(printed).toContain('moved apps/web/eslint.config.js to apps/web/eslint.config.js.bak');
  });

  it('is blocked on a changed config with no terminal', async () => {
    const plan = {
      status: 'changed',
      path: 'eslint.config.js',
      backup: 'eslint.config.js.bak',
    } as const;
    const asker = askerOf([], { hasTerminal: false });

    const isBlocked = await lintConfigStep('/repo', asker, projectOf(plan));

    expect(isBlocked).toBe(true);

    expect(writeLintConfig).not.toHaveBeenCalled();
  });
});

describe('switchRefusal', () => {
  it('is undefined when no project switches runner', async () => {
    vi.mocked(runnerSwitch)
      .mockResolvedValue(null);

    const project = projectOf({ status: 'unchanged' });

    const refusal = await switchRefusal('/repo', [project]);

    expect(refusal).toBeUndefined();
  });

  it('names the first project that switches, by its directory', async () => {
    const switched = {
      from: 'jest',
      to: 'vitest',
    } as const;

    vi.mocked(runnerSwitch)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(switched);

    const root = projectOf({ status: 'unchanged' }, '.');
    const web = projectOf({ status: 'unchanged' });

    const refusal = await switchRefusal('/repo', [root, web]);

    expect(refusal).toMatch(/^apps\/web: Nothing was written: [^.]+ on jest, [^.]+ on vitest\./v);

    expect(runnerSwitch).toHaveBeenLastCalledWith('/repo/apps/web', HOSTED_DEFAULTS);
  });

  it('leaves the root\'s refusal unprefixed', async () => {
    const switched = {
      from: 'jest',
      to: 'vitest',
    } as const;

    vi.mocked(runnerSwitch)
      .mockResolvedValue(switched);

    const root = projectOf({ status: 'unchanged' }, '.');

    const refusal = await switchRefusal('/repo', [root]);

    expect(refusal).toMatch(/^Nothing was written/v);
  });
});
