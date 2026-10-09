import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rename,
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
  DEFAULT_ANSWERS,
  LEGACY_CONFIG_PATH,
  parseLinteljsConfig,
  projectAnswersOf,
} from '@answers';
import { exists } from '@disk';
import { parsePackageJson } from '@emitters';
import { emitLinteljsConfig } from '@emitters/always/linteljs-config/linteljsConfigEmitter';
import { runSpawn } from '@spawns';

import packageJson from '../../../package.json' with { type: 'json' };
import { RUN_CANCELLED_MESSAGE } from '../prompts/constants';

import { main } from './cli';
import {
  ADD_APP_NEEDS_ANSWERS,
  ADD_NEEDS_MONOREPO,
  EXISTING_MONOREPO,
} from './constants';
import { parseCliArgs } from './utils/argvUtils';

import type { Answers } from '@config/types';

interface Run {
  code: number;
  printed: string;
  errors: string[];
}

vi.mock('@spawns', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@spawns')>();

  const spawns = {
    ...actual,
    runSpawn: vi.fn(actual.runSpawn),
  };
  return spawns;
});

vi.mock('./utils/argvUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./utils/argvUtils')>();

  const argvUtils = {
    ...actual,
    parseCliArgs: vi.fn(actual.parseCliArgs),
  };
  return argvUtils;
});

// The real prompter waits on stdin, so a run that reaches it fails at once rather than hanging.
vi.mock('../prompts/prompts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../prompts/prompts')>();

  const reached = (): Promise<never> => {
    const error = new Error('the inquirer prompter was reached');

    return Promise.reject(error);
  };

  const prompts = {
    ...actual,
    inquirerPrompter: {
      ...actual.inquirerPrompter,
      select: reached,
      multiselect: reached,
      text: reached,
    },
  };
  return prompts;
});

const RULE = 'plugins/linteljs/skills/linteljs/references/type-standards.md';

let project = '';
let entered = '';

beforeEach(async () => {
  vi.stubEnv('npm_config_user_agent', 'pnpm/12.5.1 npm/? node/? darwin arm64');
  entered = processCwd();
  const prefix = join(tmpdir(), 'linteljs-cli-');
  project = await mkdtemp(prefix);
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

    const run: Run = {
      code,
      printed: chunks.join(''),
      errors,
    };
    return run;
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

const configAt = async (directory = project): Promise<Answers> => {
  const configText = await readFile(join(directory, CONFIG_PATH), 'utf8');
  const config = parseLinteljsConfig(configText);

  return projectAnswersOf(config, config.projects[0]);
};

const nameAt = async (directory: string): Promise<string | undefined> => {
  const manifestText = await readFile(join(directory, 'package.json'), 'utf8');
  return parsePackageJson(manifestText).name;
};

const writeConfig = async (answers: Answers): Promise<void> => {
  await writeFile(join(project, CONFIG_PATH), emitLinteljsConfig(answers, 'demo-app'), 'utf8');
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
      'a monorepo over an existing project',
      [
        '--existing',
        '--no-install',
        '--yes',
        '--layout',
        'monorepo',
      ],
      '--existing runs in a single repo',
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
    const eslintConfigJsExists = await exists(join(project, 'eslint.config.ts'));
    expect(eslintConfigJsExists).toBe(false);
  });

  it('fails with one line when the directory it stands in is gone', async () => {
    const gone = join(project, 'gone');

    await mkdir(gone);
    chdir(gone);
    await rm(gone, { recursive: true });

    const { code, errors } = await runMain(['my-app']);

    expect(code).toBe(1);
    const expected = [expect.stringContaining('ENOENT')];
    expect(errors).toEqual(expected);
  });

  it('scaffolds into the directory it stands in when --yes gave no name', async () => {
    const named = join(project, 'demo-app');

    await mkdir(named);
    chdir(named);
    await plantScaffolder();

    const { code } = await runMain(['--no-install', '--yes']);

    expect(code).toBe(0);
    const name = await nameAt(named);
    expect(name).toBe('demo-app');
  });

  it('asks for a missing name rather than requiring it, and still refuses with no terminal', async () => {
    const { code, errors } = await runMain([]);

    expect(code).toBe(1);
    const joined = errors.join('\n');
    expect(joined).not.toContain('A project name is required');
    const expected = [expect.stringContaining('answer every question')];
    expect(errors).toEqual(expected);
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
    const eslintConfigJsExists = await exists(join(project, 'eslint.config.ts'));
    expect(eslintConfigJsExists).toBe(false);
  });
});

describe('main: create', () => {
  it('names the project after the directory when no name was given', async () => {
    await generated();

    const name = await nameAt(project);
    expect(name).toContain('linteljs-cli-');
  });

  it('runs the questionnaire when --yes was not passed, and records what it answered with the host', async () => {
    const asked = scripted([
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
    ]);
    const { printed } = await runMain(['--existing', '--no-install'], asked);

    const config = await configAt();
    const expected = {
      ...DEFAULT_ANSWERS,
      packageManagerVersion: '12.5.1',
      nodeVersion: versions.node,
      target: 'svelte',
      libraries: ['zod'],
      store: 'tanstack-store',
      agents: ['claude-code', 'codex'],
      plugins: [],
    };
    expect(config).toEqual(expected);
    expect(asked.calls).not.toContain('Repository layout');

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
      undefined,
    ]);
    const { code } = await runMain(['--no-install'], asked);

    expect(code).toBe(0);
    expect(asked.calls[0]).toContain('Project name');
    const name = await nameAt(join(project, 'asked-app'));
    expect(name).toBe('asked-app');
  });

  it('patches the directory the scaffolder made, not the one it was run from', async () => {
    await plantScaffolder();

    const { code } = await runMain([
      'demo-app',
      '--no-install',
      '--yes',
    ]);

    expect(code).toBe(0);
    const nestedConfigExists = await exists(join(project, 'demo-app', 'eslint.config.ts'));
    expect(nestedConfigExists).toBe(true);
    const rootConfigExists = await exists(join(project, 'eslint.config.ts'));
    expect(rootConfigExists).toBe(false);
    const name = await nameAt(join(project, 'demo-app'));
    expect(name).toBe('demo-app');
  });

  it('names the project after the argument even where no scaffolder ran', async () => {
    await runMain([
      'demo-app',
      '--existing',
      '--no-install',
      '--yes',
    ]);

    const name = await nameAt(project);
    expect(name).toBe('demo-app');
  });

  it('keeps a scope to package.json, and names the directory and the page after what follows it', async () => {
    const { printed } = await runMain([
      '@acme/demo-app',
      '--no-install',
      '--yes',
    ]);

    const directory = join(project, 'demo-app');
    const name = await nameAt(directory);
    expect(name).toBe('@acme/demo-app');
    const page = await readFile(join(directory, 'index.html'), 'utf8');
    expect(page).toContain('<title>demo-app</title>');
    const record = await readFile(join(directory, 'src/config/linteljs.ts'), 'utf8');
    expect(record).toContain("export const NAME = 'demo-app';");
    expect(printed).toContain('cd demo-app\n');
  });

  it.each([
    [
      'the unscoped part of the name package.json records',
      '@acme/demo-app',
      'demo-app',
    ],
    [
      'its directory when package.json records no valid name',
      'Not A Name',
      'directory',
    ],
  ])('names an existing project\'s page after %s', async (_case, recorded, expected) => {
    const manifest = JSON.stringify({ name: recorded });
    const directory = join(project, 'directory');
    await mkdir(directory);
    await writeFile(join(directory, 'package.json'), manifest, 'utf8');
    chdir(directory);

    await generated();

    const name = await nameAt(directory);
    expect(name).toBe(recorded);
    const page = await readFile(join(directory, 'index.html'), 'utf8');
    expect(page).toContain(`<title>${expected}</title>`);
  });

  it('names an existing project with no package.json after its directory', async () => {
    const directory = join(project, 'directory');
    await mkdir(directory);
    chdir(directory);

    await generated();

    const page = await readFile(join(directory, 'index.html'), 'utf8');
    expect(page).toContain('<title>directory</title>');
  });
});

describe('main: patching a project that already exists', () => {
  it('refuses a recorded monorepo, before writing anything', async () => {
    await writeConfig({
      ...DEFAULT_ANSWERS,
      layout: 'monorepo',
    });

    const { code, errors } = await runMain([
      '--existing',
      '--no-install',
      '--yes',
    ]);
    const eslintConfigExists = await exists(join(project, 'eslint.config.ts'));

    expect(code).toBe(1);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain(EXISTING_MONOREPO);
    expect(eslintConfigExists).toBe(false);
  });

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

    const expected = {
      target: 'svelte',
      packageManager: 'npm',
      nodeVersion: versions.node,
    };
    expect(written).toMatchObject(expected);

    expect(written).not.toHaveProperty('packageManagerVersion');
  });

  it('keeps the answers a 1.x project recorded, under the new name, and removes the old one', async () => {
    const legacyPath = join(project, LEGACY_CONFIG_PATH);
    const legacyConfig = emitLinteljsConfig({
      ...DEFAULT_ANSWERS,
      target: 'svelte',
    }, 'demo-app');

    await writeFile(legacyPath, legacyConfig, 'utf8');

    const { code } = await generated();
    const written = await configAt();
    const legacyExists = await exists(legacyPath);

    expect(code).toBe(0);
    expect(written).toMatchObject({ target: 'svelte' });
    expect(legacyExists).toBe(false);
  });
});

describe('main: sync', () => {
  const NEEDS_YES = 'Skipped: sync asks before this step writes. Run it in a terminal, or pass --yes.';
  const VERSIONS_QUESTION = 'Update them in package.json?';
  const ESLINT_QUESTION = 'Move it to eslint.config.ts.bak and write eslint.config.ts?';
  const ESLINT_DIFFERS = 'eslint.config.ts differs from the config linteljs writes.\n';

  const manifestText = async (): Promise<string> => {
    return await readFile(join(project, 'package.json'), 'utf8');
  };

  const devDependencies = async (): Promise<Record<string, string>> => {
    const text = await manifestText();

    return parsePackageJson(text).devDependencies ?? {};
  };

  const editDevDependencies = async (edit: (entries: Record<string, string>) => void): Promise<void> => {
    const text = await manifestText();
    const manifest = parsePackageJson(text);
    const entries = { ...manifest.devDependencies };

    edit(entries);
    const edited = {
      ...manifest,
      devDependencies: entries,
    };

    await writeFile(join(project, 'package.json'), `${JSON.stringify(edited, null, 2)}\n`, 'utf8');
  };

  const withOldConfigVersion = async (): Promise<void> => {
    await generated();

    await editDevDependencies((entries) => {
      entries['@linteljs/eslint-config'] = '^1.5.0';
    });
  };

  it('reports nothing to do for a project it just generated', async () => {
    await generated();

    const asked = scripted([]);
    const { code, printed } = await runMain(['sync', '--yes'], asked);

    expect(code).toBe(0);
    expect(asked.calls).toEqual([]);
    expect(printed).toBe('Everything is already up to date.\n');
  });

  it('rewrites an edited plugin file without asking, even with no terminal', async () => {
    await generated();
    await writeFile(join(project, RULE), '# local edit\n', 'utf8');

    const {
      code,
      printed,
      errors,
    } = await runMain(['sync']);

    expect(code).toBe(0);
    expect(errors).toEqual([]);
    expect(printed).toBe(`wrote ${RULE}\n`);
    const file = await readFile(join(project, RULE), 'utf8');
    expect(file).not.toBe('# local edit\n');
  });

  it('lists an old @linteljs/* version, asks, and leaves package.json alone when declined', async () => {
    await withOldConfigVersion();
    const before = await manifestText();

    const asked = scripted(['no']);
    const { code, printed } = await runMain(['sync'], asked);

    expect(code).toBe(0);
    expect(asked.calls).toEqual([VERSIONS_QUESTION]);
    expect(printed).toMatch(/^@linteljs\/\* versions behind:\n {2}@linteljs\/eslint-config {2}\^1\.5\.0 -> /u);
    const after = await manifestText();
    expect(after).toBe(before);
  });

  it('bumps the version once the question is answered yes', async () => {
    await withOldConfigVersion();

    const { code, printed } = await runMain(['sync'], scripted(['yes']));

    expect(code).toBe(0);
    expect(printed).toContain('wrote package.json');
    const entries = await devDependencies();
    expect(entries['@linteljs/eslint-config']).not.toBe('^1.5.0');
  });

  it('writes nothing for a step with no terminal and no --yes, says so, and fails', async () => {
    await withOldConfigVersion();
    const before = await manifestText();

    const { code, errors } = await runMain(['sync']);

    expect(code).toBe(1);
    expect(errors).toEqual([NEEDS_YES]);
    const after = await manifestText();
    expect(after).toBe(before);
  });

  it('adds a missing eslint-config peer and prints the install, and adds nothing else', async () => {
    await generated();

    await editDevDependencies((entries) => {
      Reflect.deleteProperty(entries, 'eslint');
      Reflect.deleteProperty(entries, 'husky');
    });

    const asked = scripted([]);
    const { code, printed } = await runMain(['sync', '--yes'], asked);

    expect(code).toBe(0);
    expect(asked.calls).toEqual([]);
    expect(printed).toMatch(/^Lint dependencies missing or behind:\n {2}eslint {2}none -> /u);
    expect(printed).toContain('wrote package.json. Install them:\n  pnpm install\n');
    const entries = await devDependencies();
    expect(entries).toHaveProperty('eslint');
    expect(entries).not.toHaveProperty('husky');
  });

  it('writes a missing eslint config without asking', async () => {
    await generated();
    await rm(join(project, 'eslint.config.ts'));

    const { code, printed } = await runMain(['sync']);

    expect(code).toBe(0);
    expect(printed).toBe('wrote eslint.config.ts\n');
  });

  it('reports a rule copy no project needs as stale and keeps it', async () => {
    await generated();
    const rules = join(project, '.agents/rules');
    const stale = join(rules, 'svelte-reactivity.md');
    await mkdir(rules, { recursive: true });
    await writeFile(stale, 'x\n', 'utf8');
    await writeFile(join(rules, 'mine.md'), 'x\n', 'utf8');

    const { code, printed } = await runMain(['sync']);
    const kept = await exists(stale);
    const expected = [
      'stale .agents/rules/svelte-reactivity.md: no project needs it now, so remove it unless it is yours',
      'Everything is already up to date.',
      '',
    ].join('\n');

    expect(code).toBe(0);

    expect(printed).toBe(expected);

    expect(kept).toBe(true);
  });

  it.each<[string, string[], string]>([
    [
      'keeps',
      ['no'],
      '// ours\n',
    ],
    [
      'backs up',
      ['yes'],
      '',
    ],
  ])('%s an edited eslint config as answered', async (_, answers, expected) => {
    await generated();
    await writeFile(join(project, 'eslint.config.ts'), '// ours\n', 'utf8');

    const asked = scripted(answers);
    const { code, printed } = await runMain(['sync'], asked);

    expect(code).toBe(0);
    expect(asked.calls).toEqual([ESLINT_QUESTION]);
    expect(printed).toMatch(new RegExp(`^${ESLINT_DIFFERS}`, 'u'));
    const file = await readFile(join(project, 'eslint.config.ts'), 'utf8');
    const kept = file === '// ours\n' ? file : '';
    expect(kept).toBe(expected);
  });

  it('keeps an edited eslint config with no terminal and no --yes, says so, and fails', async () => {
    await generated();
    await writeFile(join(project, 'eslint.config.ts'), '// ours\n', 'utf8');

    const {
      code,
      printed,
      errors,
    } = await runMain(['sync']);

    expect(code).toBe(1);
    expect(printed).toBe(ESLINT_DIFFERS);
    expect(errors).toEqual([NEEDS_YES]);
    const file = await readFile(join(project, 'eslint.config.ts'), 'utf8');
    expect(file).toBe('// ours\n');
  });

  it('asks before adding a missing eslint-config peer', async () => {
    await generated();

    await editDevDependencies((entries) => {
      Reflect.deleteProperty(entries, 'eslint');
    });

    const asked = scripted(['no']);
    const { code } = await runMain(['sync'], asked);

    expect(code).toBe(0);
    expect(asked.calls).toEqual(['Add or update them in package.json?']);
  });

  it('moves an edited eslint config past an earlier backup under --yes', async () => {
    await generated();
    await writeFile(join(project, 'eslint.config.ts'), '// ours\n', 'utf8');
    await writeFile(join(project, 'eslint.config.ts.bak'), '// earlier\n', 'utf8');

    const { printed } = await runMain(['sync', '--yes']);

    expect(printed).toContain('moved eslint.config.ts to eslint.config.ts.bak.1, wrote eslint.config.ts');
    const earlier = await readFile(join(project, 'eslint.config.ts.bak'), 'utf8');
    expect(earlier).toBe('// earlier\n');
    const backup = await readFile(join(project, 'eslint.config.ts.bak.1'), 'utf8');
    expect(backup).toBe('// ours\n');
  });

  it('refuses --force as an unknown flag', async () => {
    await generated();

    const { code, errors } = await runMain(['sync', '--force']);

    expect(code).toBe(1);
    const joined = errors.join('\n');
    expect(joined).toContain("Unknown option '--force'");
  });

  it('writes nothing and fails where the target now runs another runner than the project installed', async () => {
    await generated();

    await writeConfig({
      ...DEFAULT_ANSWERS,
      target: 'react-native',
      testing: 'jest',
    });

    const before = await readFile(join(project, 'tsconfig.json'), 'utf8');

    const { code, errors } = await runMain(['sync', '--yes']);
    const after = await readFile(join(project, 'tsconfig.json'), 'utf8');
    const hasJestConfig = await exists(join(project, 'jest.config.js'));

    expect(code).toBe(1);
    const joined = errors.join('\n');
    const message = [
      'Nothing was written: this project runs its suites on vitest, and linteljs now runs them on jest.',
      'sync changes no runner, since the suites, setup and test scripts are the project\'s.',
      'Port them to jest, swap the dependencies, and run sync again.',
    ].join(' ');
    expect(joined).toBe(message);
    expect(after).toBe(before);
    expect(hasJestConfig).toBe(false);
  });

  it('syncs a monorepo\'s package in packages/, under any root directory name', async () => {
    await runMain([
      'demo',
      '--target',
      'typescript',
      '--layout',
      'monorepo',
      '--no-install',
      '--yes',
    ]);

    const root = join(project, 'clone');
    await rename(join(project, 'demo'), root);
    chdir(root);

    const current = await runMain(['sync', '--yes'], scripted([]));

    expect(current.printed).toBe('Everything is already up to date.\n');

    const app = join(root, 'packages', 'demo');
    await writeFile(join(app, 'eslint.config.ts'), 'export default [];\n', 'utf8');

    const { code, printed } = await runMain(['sync', '--yes'], scripted([]));

    expect(code).toBe(0);
    expect(printed).toContain('moved packages/demo/eslint.config.ts to packages/demo/eslint.config.ts.bak');
    const backup = await readFile(join(app, 'eslint.config.ts.bak'), 'utf8');
    expect(backup).toBe('export default [];\n');
    const hasRootBackup = await exists(join(root, 'eslint.config.ts.bak'));
    expect(hasRootBackup).toBe(false);
  });

  it('asks for each project in config order, naming its directory, then for the root once', async () => {
    await runMain([
      'acme',
      '--project',
      'web',
      '--target',
      'react',
      '--project',
      'shared',
      '--kind',
      'package',
      '--no-install',
      '--yes',
    ]);

    const root = join(project, 'acme');
    chdir(root);

    const directories = [
      'apps/web',
      'packages/shared',
      '.',
    ];

    for (const directory of directories) {
      const path = join(root, directory, 'package.json');
      const text = await readFile(path, 'utf8');
      const manifest = parsePackageJson(text);
      const devDependencies = { ...manifest.devDependencies };
      delete devDependencies['eslint'];

      await writeFile(path, JSON.stringify({
        ...manifest,
        devDependencies,
      }), 'utf8');
    }

    await writeFile(join(root, 'apps/web/eslint.config.ts'), 'export default [];\n', 'utf8');

    const asked = scripted([
      'yes',
      'yes',
      'yes',
      'yes',
    ]);
    const { code, printed } = await runMain(['sync'], asked);

    expect(code).toBe(0);
    const questions = [
      'apps/web: Add or update them in package.json?',
      'apps/web: Move it to apps/web/eslint.config.ts.bak and write apps/web/eslint.config.ts?',
      'packages/shared: Add or update them in package.json?',
      'Add or update them in package.json?',
    ];
    expect(asked.calls).toEqual(questions);
    expect(printed).toContain('wrote apps/web/package.json.');
    expect(printed).toContain('wrote packages/shared/package.json.');
    const again = await runMain(['sync'], scripted([]));
    expect(again.printed).toBe('Everything is already up to date.\n');
  });

  const monorepo = async (): Promise<string> => {
    await runMain([
      'demo',
      '--target',
      'react',
      '--layout',
      'monorepo',
      '--no-install',
      '--yes',
    ]);

    const root = join(project, 'demo');
    chdir(root);

    return root;
  };

  const projectNames = async (root: string): Promise<(string | undefined)[]> => {
    const configText = await readFile(join(root, CONFIG_PATH), 'utf8');

    return parseLinteljsConfig(configText).projects
      .map(({ name }) => {
        return name;
      });
  };

  it('adds a package under packages/ in a monorepo, records it, and leaves a sync with nothing to do', async () => {
    const root = await monorepo();

    const { code, printed } = await runMain([
      'sync',
      '--add',
      'lib',
      '--no-install',
    ], scripted([]));

    expect(code).toBe(0);
    expect(printed).toContain('wrote packages/lib/package.json\n');
    expect(printed).toContain('wrote packages/lib/src/index.ts\n');
    expect(printed).toContain(`wrote ${CONFIG_PATH}\n`);
    expect(printed).toContain('Install it:\n  pnpm install\n');
    const manifestText = await readFile(join(root, 'packages/lib/package.json'), 'utf8');
    const manifest = parsePackageJson(manifestText);
    expect(manifest.name).toBe('lib');
    const names = await projectNames(root);
    expect(names).toEqual(['demo', 'lib']);
    const again = await runMain(['sync'], scripted([]));
    expect(again.printed).toBe('Everything is already up to date.\n');
  });

  it('adds an app from its answer flags under apps/', async () => {
    const root = await monorepo();

    const { code, printed } = await runMain([
      'sync',
      '--add',
      'admin',
      '--kind',
      'app',
      '--target',
      'vue',
      '--no-install',
    ]);

    expect(code).toBe(0);
    expect(printed).toContain('wrote apps/admin/package.json\n');
    const names = await projectNames(root);
    expect(names).toEqual(['demo', 'admin']);
    const config = await configAt(root);
    expect(config.target).toBe('react');
  });

  it('asks the App questions for an app added in a terminal', async () => {
    const root = await monorepo();
    const asked = scripted([
      'vue',
      ...Array.from({ length: 20 }, () => {
        return undefined;
      }),
    ]);

    const { code } = await runMain([
      'sync',
      '--add',
      'admin',
      '--kind',
      'app',
      '--no-install',
    ], asked);

    expect(code).toBe(0);
    const appText = await readFile(join(root, 'apps/admin/package.json'), 'utf8');
    expect(appText).toContain('"vue"');
  });

  it('refuses an app with nothing to answer it and no terminal, and writes nothing', async () => {
    const root = await monorepo();

    const { code, errors } = await runMain([
      'sync',
      '--add',
      'admin',
      '--kind',
      'app',
    ]);

    expect(code).toBe(1);
    expect(errors).toEqual([`Error: ${ADD_APP_NEEDS_ANSWERS}`]);
    const hasApp = await exists(join(root, 'apps/admin'));
    expect(hasApp).toBe(false);
  });

  it('refuses a name the config already records, and writes nothing', async () => {
    const root = await monorepo();

    await rm(join(root, 'apps/demo'), {
      recursive: true,
      force: true,
    });

    const { code, errors } = await runMain([
      'sync',
      '--add',
      'demo',
    ], scripted([]));

    expect(code).toBe(1);
    expect(errors).toEqual(['demo is a project already: sync --add writes a new one.']);
    const hasPackage = await exists(join(root, 'packages/demo'));
    expect(hasPackage).toBe(false);
  });

  it('installs after adding a package, so the lockfile takes it', async () => {
    await monorepo();
    const root = processCwd();

    vi.mocked(runSpawn)
      .mockResolvedValueOnce();

    const { code, printed } = await runMain([
      'sync',
      '--add',
      'lib',
    ], scripted([]));

    expect(code).toBe(0);
    expect(printed).toContain('installing with pnpm\n');
    expect(printed).not.toContain('Install it:');
    expect(runSpawn).toHaveBeenCalledWith('pnpm', ['install'], root);
  });

  it.each([
    ['a package directory', 'packages/lib'],
    ['an app directory', 'apps/lib'],
  ])('refuses to add a package over %s, and writes nothing', async (_case, taken) => {
    const root = await monorepo();
    await mkdir(join(root, taken), { recursive: true });

    const {
      code,
      errors,
      printed,
    } = await runMain([
      'sync',
      '--add',
      'lib',
    ], scripted([]));

    expect(code).toBe(1);
    expect(errors).toEqual([`${taken} exists: sync --add writes a new project.`]);
    expect(printed).toBe('');
    const entries = await readdir(join(root, taken));
    expect(entries).toEqual([]);
  });

  it('refuses to add a package to a single repo, and writes nothing', async () => {
    await generated();

    const {
      code,
      errors,
      printed,
    } = await runMain([
      'sync',
      '--add',
      'lib',
    ], scripted([]));

    expect(code).toBe(1);
    expect(errors).toEqual([ADD_NEEDS_MONOREPO]);
    expect(printed).toBe('');
    const hasPackages = await exists(join(project, 'packages'));
    expect(hasPackages).toBe(false);
  });

  it('removes what a dropped host owned in the plugin folder, and nothing outside it', async () => {
    await generated();

    await writeConfig({
      ...DEFAULT_ANSWERS,
      agents: ['codex'],
    });

    const { printed } = await runMain(['sync', '--yes'], scripted([]));

    expect(printed).toContain('removed plugins/linteljs/.claude-plugin/plugin.json');
    const hasClaudeSettings = await exists(join(project, '.claude/settings.json'));
    expect(hasClaudeSettings).toBe(true);
    const hasAgents = await exists(join(project, 'AGENTS.md'));
    expect(hasAgents).toBe(false);
  });

  it('refuses to sync a config that is absent, and writes nothing', async () => {
    const asked = scripted([]);

    await writeFile(join(project, 'package.json'), '{"name":"kept"}\n', 'utf8');

    const {
      code,
      errors,
      printed,
    } = await runMain(['sync', '--yes'], asked);

    expect(code).toBe(1);
    const joined = errors.join('\n');
    expect(joined).toContain('linteljs.config.json was not found; this is not a LintelJS-managed project');
    expect(asked.calls).toEqual([]);
    expect(printed).toBe('');
    const eslintConfigJsExists = await exists(join(project, 'eslint.config.ts'));
    expect(eslintConfigJsExists).toBe(false);
    const configPathExists = await exists(join(project, CONFIG_PATH));
    expect(configPathExists).toBe(false);
  });

  it('writes the plugin files an extension\'s recorded framework needs', async () => {
    await writeConfig({
      ...DEFAULT_ANSWERS,
      target: 'webextension',
      browser: 'firefox',
      hostedFramework: 'solid',
    });

    const asked = scripted([]);
    const { printed } = await runMain(['sync'], asked);

    expect(asked.calls).toEqual([]);
    expect(printed).toContain('wrote plugins/linteljs/skills/linteljs/references/solid-reactivity.md\n');
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

    const config = await configAt();
    const expected = {
      target: 'svelte',
      packageManager: 'bun',
      libraries: ['zod', 'es-toolkit'],
      styling: 'tailwind',
      testing: 'none',
      typeSafety: 'relaxed',
      agents: ['codex'],
      plugins: [...DEFAULT_ANSWERS.plugins],
    };
    expect(config).toMatchObject(expected);
  });

  it.each([
    [[], ['ponytail', 'context7']],
    [['--plugins', 'frontend-design'], ['frontend-design']],
  ])('records a library\'s plugins from %j as %j', async (flags, plugins) => {
    await runMain([
      '--existing',
      '--no-install',
      '--yes',
      '--target',
      'typescript',
      ...flags,
    ]);

    const config = await configAt();
    expect(config.plugins).toStrictEqual(plugins);
  });

  it.each([
    [
      'react-native',
      [],
      'jest',
    ],
    [
      'react-native',
      ['--testing', 'none'],
      'none',
    ],
    [
      'svelte',
      [],
      'vitest',
    ],
  ])('records testing on %s from %j as %s', async (target, flags, testing) => {
    await runMain([
      '--existing',
      '--no-install',
      '--yes',
      '--target',
      target,
      ...flags,
    ]);

    const config = await configAt();
    expect(config.testing).toBe(testing);
  });

  it('refuses vitest on react-native', async () => {
    const { code, errors } = await runMain([
      '--existing',
      '--no-install',
      '--yes',
      '--target',
      'react-native',
      '--testing',
      'vitest',
    ]);

    expect(code).toBe(1);
    const joined = errors.join('\n');
    expect(joined).toContain('vitest is not an answer for react-native');
  });

  const projectsAt = async (root: string): Promise<string[][]> => {
    const configText = await readFile(join(root, CONFIG_PATH), 'utf8');
    const config = parseLinteljsConfig(configText);

    return config.projects
      .map((entry) => {
        const { target } = projectAnswersOf(config, entry);

        const row = [entry.name ?? '', target];

        return row;
      });
  };

  it('writes each --project in its directory, an app under apps/ and a package under packages/', async () => {
    const { code } = await runMain([
      'acme',
      '--project',
      'web',
      '--target',
      'react',
      '--project',
      'admin',
      '--target',
      'vue',
      '--project',
      'shared',
      '--kind',
      'package',
      '--no-install',
      '--yes',
    ]);

    const root = join(project, 'acme');
    const directories = [
      'apps/web',
      'apps/admin',
      'packages/shared',
    ];
    const names = await Promise.all(directories
      .map(async (directory) => {
        return await nameAt(join(root, directory));
      }));
    const expectedProjects = [
      ['web', 'react'],
      ['admin', 'vue'],
      ['shared', 'typescript'],
    ];
    expect(code).toBe(0);

    expect(names).toEqual([
      'web',
      'admin',
      'shared',
    ]);

    const projects = await projectsAt(root);
    expect(projects).toEqual(expectedProjects);
  });

  it.each([
    [[], ['ponytail', 'context7']],
    [['--plugins', 'ponytail'], ['ponytail']],
  ])('records the plugins of a monorepo of packages, flagged %j', async (flags, expected) => {
    await runMain([
      'acme',
      '--project',
      'shared',
      '--kind',
      'package',
      ...flags,
      '--no-install',
      '--yes',
    ]);

    const { plugins } = await configAt(join(project, 'acme'));
    expect(plugins).toEqual(expected);
  });

  it('writes the projects a monorepo questionnaire named', async () => {
    const asked = scripted([
      'monorepo',
      '2',
      'shared',
      'package',
      'web',
      'app',
      'vue',
      ...Array.from({ length: 16 }, () => {
        return undefined;
      }),
    ]);

    const { code } = await runMain(['acme', '--no-install'], asked);

    const expected = [
      ['shared', 'typescript'],
      ['web', 'vue'],
    ];
    expect(code).toBe(0);
    const projects = await projectsAt(join(project, 'acme'));
    expect(projects).toEqual(expected);
  });
});

describe('main: what a run reports', () => {
  it('prints the version and nothing else', async () => {
    const { code, printed } = await runMain(['--version']);

    expect(code).toBe(0);
    const trimmed = printed.trim();
    expect(trimmed).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('opens a create run with the release it is, and a sync with nothing', async () => {
    const created = await runMain([
      '--existing',
      '--no-install',
      '--yes',
    ]);
    const synced = await runMain(['sync', '--yes']);

    const actual = created.printed.startsWith(`@linteljs/create ${packageJson.version}\n`);
    expect(actual).toBe(true);
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

    const actual = printed.endsWith('\n\nDone. Next:\n  cd demo-app\n  pnpm install\n  pnpm lint:fix\n  pnpm check\n');

    expect(actual)
      .toBe(true);
  });
});

describe('main, when argument parsing throws', () => {
  it('rethrows what is not an Error of this realm, having no message it can trust', async () => {
    vi.mocked(parseCliArgs)
      .mockImplementationOnce(() => {
        throw runInNewContext('new Error("from another realm")');
      });

    const promise = main(['--help']);
    await expect(promise).rejects.toThrow('from another realm');
  });
});
