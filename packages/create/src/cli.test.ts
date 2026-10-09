import {
  mkdir,
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { DRAWERS_ROOT } from '@mocks/drawersRoot';
import { CANCEL, scripted } from '@mocks/scriptedPrompter';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { filesUnder } from '@disk';
import { main as terminalMain, type Prompter } from '@terminal';

import { main, type Seams } from './cli';

vi.mock('@terminal', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@terminal')>();

  const mocked: typeof actual = {
    ...actual,
    main: vi.fn(),
  };

  return mocked;
});

const DELEGATED = 7;

const DEFAULTS: Prompter = {
  select: async (request) => {
    return await Promise.resolve(request.initialValue);
  },
  multiselect: async (request) => {
    return await Promise.resolve(request.initialValues);
  },
  text: async () => {
    return await Promise.resolve(CANCEL);
  },
  isCancel: (value): value is symbol => {
    return typeof value === 'symbol';
  },
};

// The recorded config refuses a `none` answer on these, so the fixture's react module is answered past them.
const ANSWERED = [
  '--target',
  'react',
  '--styling',
  'tailwind',
  '--form',
  'react-hook-form',
  '--store',
  'redux-toolkit',
  '--data',
  'tanstack-query',
  '--mocking',
  'msw',
];

describe('main', () => {
  let cwd = '';
  let seams: Seams = {};

  beforeEach(async () => {
    const prefix = join(tmpdir(), 'cli-');

    cwd = await mkdtemp(prefix);

    seams = {
      frameworks: ['react'],
      root: DRAWERS_ROOT,
      cwd,
    };

    vi.stubEnv('npm_config_user_agent', 'pnpm/12.5.1 npm/? node/? darwin arm64');

    vi.spyOn(console, 'warn')
      .mockReturnValue(undefined);

    vi.spyOn(console, 'error')
      .mockReturnValue(undefined);

    vi.mocked(terminalMain)
      .mockResolvedValue(DELEGATED);
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();

    vi.mocked(terminalMain)
      .mockReset();

    await rm(cwd, {
      recursive: true,
      force: true,
    });
  });

  it.each([
    [['--version']],
    [[
      'demo',
      '--target',
      'vue',
    ]],
    [['--target', 'react']],
    [[
      'sync',
      '--target',
      'react',
    ]],
    [[
      'demo',
      'extra',
      '--target',
      'react',
    ]],
    [[
      'demo',
      '--target',
      'react',
      '--help',
    ]],
    [[
      'demo',
      '--target',
      'react',
      '--yes=true',
    ]],
    [[
      'demo',
      '--target',
      'react',
      '--testing',
    ]],
  ])('hands %j to the old pipeline', async (argv) => {
    const code = await main(argv, DEFAULTS, seams);

    expect(code).toBe(DELEGATED);
    expect(terminalMain).toHaveBeenCalledWith(argv, DEFAULTS);
  });

  it('writes a framework module unasked under --yes', async () => {
    const argv = [
      'demo',
      ...ANSWERED,
      '--languages',
      'en,',
      '-y',
    ];

    const code = await main(argv, undefined, seams);
    const written = await filesUnder(join(cwd, 'demo'));

    expect(console.error).not.toHaveBeenCalled();
    expect(code).toBe(0);
    expect(terminalMain).not.toHaveBeenCalled();
    expect(written).toContain('package.json');
  });

  it('asks the open questions without --yes', async () => {
    const argv = ['@scope/demo', ...ANSWERED];

    const code = await main(argv, DEFAULTS, seams);
    const written = await filesUnder(join(cwd, 'demo'));

    expect(console.error).not.toHaveBeenCalled();
    expect(code).toBe(0);
    expect(written).toContain('package.json');
  });

  it('exits 130 on a cancelled prompt', async () => {
    const { prompter } = scripted([CANCEL]);

    const code = await main([
      'demo',
      '--target',
      'react',
    ], prompter, seams);

    expect(code).toBe(130);
    expect(console.warn).toHaveBeenCalledWith('Cancelled: nothing was written.');
  });

  it('exits 1 on a host it refuses', async () => {
    vi.stubEnv('npm_config_user_agent', 'pnpm/1.0.0 npm/? node/? darwin arm64');

    const code = await main([
      'demo',
      '--target',
      'react',
      '--yes',
    ], DEFAULTS, seams);

    expect(code).toBe(1);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('pnpm'));
  });

  it('exits 1 on a name npm refuses', async () => {
    const code = await main([
      'Not Valid',
      '--target',
      'react',
      '--yes',
    ], DEFAULTS, seams);

    expect(code).toBe(1);
    expect(console.error).toHaveBeenCalledWith('Not Valid is not a valid project name.');
  });

  it('exits 1 on a directory already holding files', async () => {
    await mkdir(join(cwd, 'demo'));
    await writeFile(join(cwd, 'demo', 'kept.txt'), '');

    const code = await main([
      'demo',
      '--target',
      'react',
      '--yes',
    ], DEFAULTS, seams);

    expect(code).toBe(1);
    expect(console.error).toHaveBeenCalledWith(`${join(cwd, 'demo')} is not empty: nothing was written.`);
  });

  it('exits 1 with the error itself on anything else', async () => {
    const { prompter } = scripted([]);

    const code = await main([
      'demo',
      '--target',
      'react',
    ], prompter, seams);

    expect(code).toBe(1);
    expect(console.error).toHaveBeenCalledWith(expect.stringMatching(/^Error: /u));
  });
});
