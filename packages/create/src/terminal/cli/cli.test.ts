import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  chdir,
  cwd as processCwd,
  stdout,
  versions,
} from 'node:process';
import { runInNewContext } from 'node:vm';

import { plantBinary } from '@mocks/plantBinary';
import {
  CANCEL,
  type Recorded,
  scripted,
} from '@mocks/scriptedPrompter';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  CONFIG_PATH,
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
  DEFAULT_ANSWERS,
  parseLinteljsConfig,
} from '@answers';
import { exists } from '@disk';
import { parsePackageJson } from '@emitters';
import { emitLinteljsConfig } from '@emitters/always/linteljs-config/linteljsConfigEmitter';

import packageJson from '../../../package.json' with { type: 'json' };
import { RUN_CANCELLED_MESSAGE } from '../prompts/constants';

import { main } from './cli';
import { parseCliArgs } from './utils/argvUtils';

import type { Answers } from '@config/types';

interface Run {
  code: number;
  printed: string;
  errors: string[];
}

vi.mock('./utils/argvUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./utils/argvUtils')>();

  return {
    ...actual,
    parseCliArgs: vi.fn(actual.parseCliArgs),
  };
});

const RULE = 'plugins/linteljs/skills/linteljs/references/type-standards.md';

let project = '';
let entered = '';

beforeEach(async () => {
  vi.stubEnv('npm_config_user_agent', 'pnpm/12.5.1 npm/? node/? darwin arm64');
  entered = processCwd();
  project = await mkdtemp(join(tmpdir(), 'linteljs-cli-'));
  chdir(project);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  chdir(entered);
  await rm(project, {
    recursive: true,
    force: true,
  });
});

const runMain = async (argv: string[], recorded?: Recorded): Promise<Run> => {
  const chunks: string[] = [];
  const errors: string[] = [];
  const printing = vi.spyOn(stdout, 'write')
    .mockImplementation((chunk) => {
      chunks.push(String(chunk));

      return true;
    });
  const reporting = vi.spyOn(console, 'error')
    .mockImplementation((message: string) => {
      errors.push(message);
    });

  try {
    const code = await main(argv, recorded?.prompter);

    return {
      code,
      printed: chunks.join(''),
      errors,
    };
  }
  finally {
    printing.mockRestore();
    reporting.mockRestore();
  }
};

const generated = async (): Promise<Run> => {
  return await runMain([
    '--existing',
    '--no-install',
    '--yes',
  ]);
};

const plantScaffolder = async (): Promise<void> => {
  await plantBinary(join(project, 'fake-bin'), 'pnpm', [
    "require('node:fs').mkdirSync(process.argv[4], { recursive: true });",
  ]);
};

const configAt = async (directory = project): Promise<ReturnType<typeof parseLinteljsConfig>> => {
  return parseLinteljsConfig(await readFile(join(directory, CONFIG_PATH), 'utf8'));
};

const nameAt = async (directory: string): Promise<string | undefined> => {
  return parsePackageJson(await readFile(join(directory, 'package.json'), 'utf8')).name;
};

const writeConfig = async (answers: Answers): Promise<void> => {
  await writeFile(join(project, CONFIG_PATH), emitLinteljsConfig(answers), 'utf8');
};

describe('main: what it prints and what it returns', () => {
  it('prints the usage to stdout and succeeds', async () => {
    const { code, printed } = await runMain(['--help']);

    expect(code).toBe(0);
    expect(printed).toContain('--existing');
  });

  it.each<[string, string[], string, string?]>([
    [
      'an invalid project name',
      [
        'My-App',
        '--existing',
        '--no-install',
        '--yes',
      ],
      'Project name must be',
    ],
    [
      'an unknown stage',
      [
        '--existing',
        '--no-install',
        '--yes',
        '--skip',
        'lnt',
      ],
      'Not a stage: lnt',
    ],
    [
      'an unknown option',
      ['--wat'],
      "Unknown option '--wat'",
    ],
    [
      'a manager below its floor',
      [
        '--existing',
        '--no-install',
        '--yes',
      ],
      'needs pnpm 10.26.0',
      'pnpm/10.25.0',
    ],
  ])('fails on %s with one line, before writing anything', async (_case, argv, message, agent) => {
    if (agent !== undefined) {
      vi.stubEnv('npm_config_user_agent', `${agent} npm/? node/? darwin arm64`);
    }

    const { code, errors } = await runMain(argv);

    expect(code).toBe(1);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain(message);
    expect(await exists(join(project, 'eslint.config.js'))).toBe(false);
  });

  it('fails with one line when the directory it stands in is gone', async () => {
    const gone = join(project, 'gone');

    await mkdir(gone);
    chdir(gone);
    await rm(gone, { recursive: true });

    const { code, errors } = await runMain(['my-app']);

    expect(code).toBe(1);
    expect(errors).toEqual([expect.stringContaining('ENOENT')]);
  });

  it('scaffolds into the directory it stands in when --yes gave no name', async () => {
    const named = join(project, 'demo-app');

    await mkdir(named);
    chdir(named);
    await plantScaffolder();

    const { code } = await runMain(['--no-install', '--yes']);

    expect(code).toBe(0);
    expect(await nameAt(named)).toBe('demo-app');
  });

  it('asks for a missing name rather than requiring it, and still refuses with no terminal', async () => {
    const { code, errors } = await runMain([]);

    expect(code).toBe(1);
    expect(errors.join('\n')).not.toContain('A project name is required');
    expect(errors).toEqual([expect.stringContaining('answer every question')]);
  });
});

describe('main: cancelled mid-questionnaire', () => {
  it('prints a calm message and exits 130, with nothing written and nothing on stderr', async () => {
    const {
      code,
      printed,
      errors,
    } = await runMain(
      ['--existing', '--no-install'],
      scripted([CANCEL]),
    );

    expect(code).toBe(130);
    expect(printed).toContain(RUN_CANCELLED_MESSAGE);
    expect(printed).not.toContain('answer every question');
    expect(errors).toEqual([]);
    expect(await exists(join(project, 'eslint.config.js'))).toBe(false);
  });
});

describe('main: create', () => {
  it('names the project after the directory when no name was given', async () => {
    await generated();

    expect(await nameAt(project)).toContain('linteljs-cli-');
  });

  it('runs the questionnaire when --yes was not passed, and records what it answered with the host', async () => {
    const { printed } = await runMain(
      ['--existing', '--no-install'],
      scripted([
        'svelte',
        undefined,
        ['zod'],
        undefined,
        undefined,
        'tanstack-store',
        undefined,
        undefined,
        [],
        undefined,
        ['claude-code', 'codex'],
        [],
      ]),
    );

    expect(await configAt()).toEqual({
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      ...DEFAULT_ANSWERS,
      packageManagerVersion: '12.5.1',
      nodeVersion: versions.node,
      target: 'svelte',
      libraries: ['zod'],
      store: 'tanstack-store',
      agents: ['claude-code', 'codex'],
      plugins: [],
    });
    expect(printed).toContain('wrote AGENTS.md');
  });

  it('scaffolds into the name the questionnaire gave when no argument did', async () => {
    await plantScaffolder();

    const asked = scripted([
      'asked-app',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    const { code } = await runMain(['--no-install'], asked);

    expect(code).toBe(0);
    expect(asked.calls[0]).toContain('Project name');
    expect(await nameAt(join(project, 'asked-app'))).toBe('asked-app');
  });

  it('patches the directory the scaffolder made, not the one it was run from', async () => {
    await plantScaffolder();

    const { code } = await runMain([
      'demo-app',
      '--no-install',
      '--yes',
    ]);

    expect(code).toBe(0);
    expect(await exists(join(project, 'demo-app', 'eslint.config.js'))).toBe(true);
    expect(await exists(join(project, 'eslint.config.js'))).toBe(false);
    expect(await nameAt(join(project, 'demo-app'))).toBe('demo-app');
  });

  it('names the project after the argument even where no scaffolder ran', async () => {
    await runMain([
      'demo-app',
      '--existing',
      '--no-install',
      '--yes',
    ]);

    expect(await nameAt(project)).toBe('demo-app');
  });
});

describe('main: patching a project that already exists', () => {
  it('plans from the config it recorded under --yes, and fills only what the host can say about it', async () => {
    await writeConfig({
      ...DEFAULT_ANSWERS,
      target: 'svelte',
      packageManager: 'npm',
    });

    const { code } = await runMain([
      '--existing',
      '--no-install',
      '--yes',
    ]);
    const written = await configAt();

    expect(code).toBe(0);
    expect(written).toMatchObject({
      target: 'svelte',
      packageManager: 'npm',
      nodeVersion: versions.node,
    });
    expect(written).not.toHaveProperty('packageManagerVersion');
  });
});

describe('main: sync', () => {
  it('reports nothing to do for a project it just generated', async () => {
    await generated();

    const asked = scripted([]);
    const { code, printed } = await runMain(['sync', '--yes'], asked);

    expect(code).toBe(0);
    expect(asked.calls).toEqual([]);
    expect(printed).toContain('Everything is already up to date.');
  });

  it('shows the diff and writes nothing without --force', async () => {
    await generated();
    await writeFile(join(project, RULE), '# local edit\n', 'utf8');

    const { printed } = await runMain(['sync', '--yes']);

    expect(printed).toContain(`${RULE}: changed`);
    expect(printed).toContain('local edit');
    expect(printed).toContain('Re-run with --force');
    expect(printed).not.toContain('Steps:');
    expect(await readFile(join(project, RULE), 'utf8')).toBe('# local edit\n');
  });

  it('counts the files it would change, in the singular for one', async () => {
    await generated();

    const references = join(project, 'plugins/linteljs/skills/linteljs/references');
    const [first = '', second = ''] = (await readdir(references))
      .toSorted((left, right) => {
        return left.localeCompare(right, 'en');
      });

    await writeFile(join(references, first), '# local edit\n', 'utf8');

    expect((await runMain(['sync', '--yes'])).printed).toMatch(/\b1 file\b/u);

    await writeFile(join(references, second), '# local edit\n', 'utf8');

    expect((await runMain(['sync', '--yes'])).printed).toMatch(/\b2 files\b/u);
  });

  it('prints no empty diff where git could not make one', async () => {
    await generated();
    await writeFile(join(project, RULE), '# local edit\n', 'utf8');
    vi.stubEnv('PATH', '');

    const { printed } = await runMain(['sync', '--yes']);

    expect(printed).toContain(`${RULE}: changed\n`);
    expect(printed).not.toContain(`${RULE}: changed\n\n\n`);
  });

  it('overwrites with --force and says so', async () => {
    await generated();
    await writeFile(join(project, RULE), '# local edit\n', 'utf8');

    const { printed } = await runMain([
      'sync',
      '--yes',
      '--force',
    ]);

    expect(printed).toContain(`wrote ${RULE}`);
    expect(await readFile(join(project, RULE), 'utf8')).not.toBe('# local edit\n');
  });

  it('says what it removed once the config stops selecting a host', async () => {
    await generated();
    await writeConfig({
      ...DEFAULT_ANSWERS,
      agents: ['codex'],
    });

    const { printed } = await runMain(['sync', '--force'], scripted([]));

    expect(printed).toContain('.claude/settings.json: obsolete');
    expect(printed).toContain('removed .claude/settings.json');
    expect(printed).toContain('wrote AGENTS.md');
  });

  it('refuses to sync a config that is absent, and writes nothing', async () => {
    const asked = scripted([]);

    await writeFile(join(project, 'package.json'), '{"name":"kept"}\n', 'utf8');

    const {
      code,
      errors,
      printed,
    } = await runMain(['sync', '--force'], asked);

    expect(code).toBe(1);
    expect(errors.join('\n')).toContain('linteljs.config.json was not found; this is not a LintelJS-managed project');
    expect(asked.calls).toEqual([]);
    expect(printed).toBe('');
    expect(await exists(join(project, 'eslint.config.js'))).toBe(false);
    expect(await exists(join(project, CONFIG_PATH))).toBe(false);
  });

  it('plans an extension from the browser and framework the config recorded', async () => {
    await writeConfig({
      ...DEFAULT_ANSWERS,
      target: 'webextension',
      browser: 'firefox',
      hostedFramework: 'solid',
    });

    const asked = scripted([]);
    const { printed } = await runMain(['sync'], asked);

    expect(asked.calls).toEqual([]);
    expect(printed).toContain('plugins/linteljs/skills/linteljs/references/solid-reactivity.md: missing');
  });
});

describe('main: answers given as flags', () => {
  it('takes every flag, asks nothing, and records the answers', async () => {
    vi.stubEnv('npm_config_user_agent', 'bun/1.3.14 npm/? node/v24.3.0 darwin arm64');

    const asked = scripted([]);
    const { code } = await runMain([
      '--existing',
      '--no-install',
      '--target',
      'svelte',
      '--libraries',
      'zod,es-toolkit',
      '--styling',
      'tailwind',
      '--testing',
      'none',
      '--type-safety',
      'relaxed',
      '--agents',
      'codex',
    ], asked);

    expect(code).toBe(0);
    expect(asked.calls).toEqual([]);
    expect(await configAt()).toMatchObject({
      target: 'svelte',
      packageManager: 'bun',
      libraries: ['zod', 'es-toolkit'],
      styling: 'tailwind',
      testing: 'none',
      typeSafety: 'relaxed',
      agents: ['codex'],
      plugins: [...DEFAULT_ANSWERS.plugins],
    });
  });
});

describe('main: what a run reports', () => {
  it('prints the version and nothing else', async () => {
    const { code, printed } = await runMain(['--version']);

    expect(code).toBe(0);
    expect(printed.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('opens a create run with the release it is, and a sync with nothing', async () => {
    const created = await runMain([
      '--existing',
      '--no-install',
      '--yes',
    ]);
    const synced = await runMain(['sync', '--yes']);

    expect(created.printed.startsWith(`@linteljs/create ${packageJson.version}\n`)).toBe(true);
    expect(synced.printed).not.toContain('@linteljs/create');
  });

  it('closes a named create by entering the directory it made, then the steps it skipped', async () => {
    await plantScaffolder();

    const { code, printed } = await runMain([
      'demo-app',
      '--no-install',
      '--yes',
    ]);

    expect(code).toBe(0);
    expect(printed.endsWith('\n\nDone. Next:\n  cd demo-app\n  pnpm install\n  pnpm lint:fix\n  pnpm check\n'))
      .toBe(true);
  });
});

describe('main, when argument parsing throws', () => {
  it('rethrows what is not an Error of this realm, having no message it can trust', async () => {
    vi.mocked(parseCliArgs)
      .mockImplementationOnce(() => {
        throw runInNewContext('new Error("from another realm")');
      });

    await expect(main(['--help'])).rejects.toThrow('from another realm');
  });
});
