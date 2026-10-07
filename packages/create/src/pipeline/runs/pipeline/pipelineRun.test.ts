import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { hostedAnswersFor } from '@mocks/answersFor';
import { plantBinary } from '@mocks/plantBinary';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  type Agent,
  type Layout,
  type Library,
  type PackageManager,
  type Plugin,
  type Stage,
  type TargetId,
} from '@config/types';

import { CONFIG_PATH, LEGACY_CONFIG_PATH } from '@answers';
import { exists } from '@disk';
import { emitLinteljsConfig } from '@emitters/always/linteljs-config/linteljsConfigEmitter';

import { planSync, syncPlugin } from '../sync/syncRun';

import { pipelineRun } from './pipelineRun';

interface AnswerOverrides {
  target?: TargetId;
  packageManager?: PackageManager;
  libraries?: Library[];
  agents?: Agent[];
  plugins?: Plugin[];
  layout?: Layout;
}

let cwd = '';

beforeEach(async () => {
  const prefix = join(tmpdir(), 'linteljs-');
  cwd = await mkdtemp(prefix);
  await writeFile(join(cwd, 'package.json'), `${JSON.stringify({ name: 'demo-app' }, null, 2)}\n`, 'utf8');
});

afterEach(async () => {
  vi.unstubAllEnvs();

  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

const generate = async (overrides: AnswerOverrides): Promise<string[]> => {
  const written: string[] = [];

  await pipelineRun({
    name: 'demo-app',
    cwd,
    answers: hostedAnswersFor(overrides),
    existing: true,
    skip: ['install'],
    onWrite: (path) => {
      written.push(path);
    },
  });

  return written;
};

describe('runPipeline against a directory that already exists', () => {
  it('writes the expected file list', async () => {
    const written = await generate({});

    expect(written).toEqual(expect.arrayContaining([
      'eslint.config.ts',
      'stylelint.config.js',
      'package.json',
      CONFIG_PATH,
      'tsconfig.json',
      'pnpm-workspace.yaml',
      '.claude/settings.json',
      'plugins/linteljs/skills/linteljs/SKILL.md',
      'plugins/linteljs/skills/linteljs/references/type-standards.md',
      'plugins/linteljs/skills/linteljs/references/repo-structure.md',
      'plugins/linteljs/skills/linteljs/references/testing.md',
      'plugins/linteljs/skills/linteljs/references/react-state.md',
      'plugins/linteljs/hooks/gitSafetyGuardHook.ts',
      'scripts/checkBannedPatterns.ts',
      'scripts/typecheckStaged.ts',
      'scripts/utils/loggerUtils.ts',
      '.husky/pre-commit',
      'lint-staged.config.js',
      'commitlint.config.js',
      'CLAUDE.md',
      'README.md',
      '.gitignore',
      'vite.config.ts',
      'vitest.config.ts',
    ]));

    expect(written).not.toContain('AGENTS.md');
    expect(written).not.toContain('.agents/plugins/marketplace.json');
    expect(written).not.toContain('src/App.tsx');
    const file = await readFile(join(cwd, 'README.md'), 'utf8');
    expect(file).toContain('# demo-app');
  });

  it('keeps a 1.x config while the stage that writes the current name is skipped', async () => {
    const legacyPath = join(cwd, LEGACY_CONFIG_PATH);

    await writeFile(legacyPath, '{}\n', 'utf8');

    await pipelineRun({
      name: 'demo-app',
      cwd,
      answers: hostedAnswersFor({}),
      existing: true,
      skip: [
        'package',
        'install',
      ],
    });

    const legacyExists = await exists(legacyPath);
    expect(legacyExists).toBe(true);
  });

  it('removes a 1.x config once the current name is written', async () => {
    const legacyPath = join(cwd, LEGACY_CONFIG_PATH);

    await writeFile(legacyPath, '{}\n', 'utf8');

    await pipelineRun({
      name: 'demo-app',
      cwd,
      answers: hostedAnswersFor({}),
      existing: true,
      skip: ['install'],
    });

    const legacyExists = await exists(legacyPath);
    expect(legacyExists).toBe(false);
  });

  it('writes nothing of a stage it was told to skip', async () => {
    const written: string[] = [];

    await pipelineRun({
      name: 'demo-app',
      cwd,
      answers: hostedAnswersFor({}),
      existing: true,
      skip: [
        'lint',
        'install',
        'fix',
      ],
      onWrite: (path) => {
        written.push(path);
      },
    });

    expect(written).toContain('package.json');
    expect(written).not.toContain('eslint.config.ts');
    const eslintConfigJsExists = await exists(join(cwd, 'eslint.config.ts'));
    expect(eslintConfigJsExists).toBe(false);
  });

  it('records the answers it was given before the package.json they imply', async () => {
    const answers = hostedAnswersFor({
      target: 'svelte',
      libraries: ['zod'],
      agents: ['codex'],
      plugins: ['context7'],
    });

    const written = await generate(answers);

    const file = await readFile(join(cwd, CONFIG_PATH), 'utf8');
    expect(file).toBe(emitLinteljsConfig(answers));
    const index = written.indexOf(CONFIG_PATH);
    expect(index).toBeLessThan(written.indexOf('package.json'));
  });
});

describe('a project being born', () => {
  it.each([
    ['a plain create run', {}],
    ['--existing --seed', {
      existing: true,
      seed: true,
    }],
  ])('plants the starter on %s', async (_run, born) => {
    const written: string[] = [];

    await pipelineRun({
      name: 'demo-app',
      cwd,
      answers: hostedAnswersFor({}),
      skip: ['install', 'fix'],
      ...born,
      onWrite: (path) => {
        written.push(path);
      },
    });

    expect(written).toContain('src/App.tsx');
  });
});

describe('stage timing', () => {
  it('numbers each stage it runs by its place among all of them', async () => {
    const started: [Stage, number, number][] = [];

    await pipelineRun({
      name: 'demo-app',
      cwd,
      answers: hostedAnswersFor({}),
      existing: true,
      skip: [
        'package',
        'install',
        'fix',
      ],
      onStage: (stage, index, total) => {
        started.push([
          stage,
          index,
          total,
        ]);
      },
    });

    const expected = [[
      'lint',
      1,
      5,
    ], [
      'standard',
      3,
      5,
    ]];
    expect(started).toEqual(expected);
  });

  it('reports each stage by the time it took rather than a clock reading', async () => {
    const took: number[] = [];
    const started = performance.now();

    await pipelineRun({
      name: 'demo-app',
      cwd,
      answers: hostedAnswersFor({}),
      existing: true,
      skip: ['install', 'fix'],
      onStageDone: (_stage, milliseconds) => {
        took.push(milliseconds);
      },
    });

    const elapsed = performance.now() - started;

    expect(took).toHaveLength(3);

    for (const milliseconds of took) {
      expect(milliseconds).toBeGreaterThanOrEqual(0);
      expect(milliseconds).toBeLessThanOrEqual(elapsed);
    }
  });
});

describe('the pipeline as a writer', () => {
  it('puts every file it owns on disk through artifactWriter and nothing else', async () => {
    const source = await readFile(join(import.meta.dirname, 'pipelineRun.ts'), 'utf8');

    expect(source).toContain('artifactWriter(');
    expect(source).not.toContain('projectFileWriter(');
  });
});

describe('the stages that shell out', () => {
  const MARKER = 'invocation.txt';

  const planted = async (name: string, exitCode: number): Promise<void> => {
    const markerPath = JSON.stringify(join(cwd, MARKER));

    await plantBinary(join(cwd, 'fake-bin'), name, [
      "const { appendFileSync } = require('node:fs');",
      `appendFileSync(${markerPath}, `
      + '`${process.cwd()} ${process.argv.slice(2).join(" ")}\\n`);',
      `process.exit(${String(exitCode)});`,
    ]);
  };

  const invocations = async (): Promise<string[]> => {
    const log = await readFile(join(cwd, MARKER), 'utf8');

    return log
      .trimEnd()
      .split('\n');
  };

  const installNotices = async (packageManager: PackageManager): Promise<string[]> => {
    const notices: string[] = [];

    await pipelineRun({
      name: 'demo-app',
      cwd,
      answers: hostedAnswersFor({ packageManager }),
      skip: [
        'lint',
        'package',
        'standard',
        'fix',
      ],
      onNotice: (message) => {
        notices.push(message);
      },
    });

    return notices;
  };

  it('installs with the manager the answers named, inside the project, with a listener or without', async () => {
    await planted('yarn', 0);

    const actual = await installNotices('yarn');
    const expected = ['installing with yarn'];
    expect(actual).toEqual(expected);
    const invoked = await invocations();
    const realCwd = await realpath(cwd);
    const expectedInvoked = [`${realCwd} install`];
    expect(invoked).toEqual(expectedInvoked);

    await pipelineRun({
      name: 'demo-app',
      cwd,
      answers: hostedAnswersFor({ packageManager: 'yarn' }),
      skip: [
        'lint',
        'package',
        'standard',
        'fix',
      ],
    });

    const invokedTwice = await invocations();
    expect(invokedTwice).toHaveLength(2);
  });

  it('stops when the package manager is not installed at all', async () => {
    await planted('yarn', 0);

    const promise = installNotices('bun');
    await expect(promise).rejects.toThrow('ENOENT');
  });
});

describe('the repository the hooks install into', () => {
  const noticesFromAgent = async (): Promise<string[]> => {
    const notices: string[] = [];

    await pipelineRun({
      name: 'demo-app',
      cwd,
      answers: hostedAnswersFor({}),
      skip: [
        'lint',
        'package',
        'install',
        'fix',
      ],
      onNotice: (message) => {
        notices.push(message);
      },
    });

    return notices;
  };

  it('initialises one where the scaffolder left none, and says so', async () => {
    const actual = await noticesFromAgent();
    const expected = [
      'git init: the husky hooks install on the next install',
    ];
    expect(actual).toEqual(expected);

    const gitExists = await exists(join(cwd, '.git'));
    expect(gitExists).toBe(true);
  });

  it('initialises one in its own directory when the caller exports another repository', async () => {
    const outerPrefix = join(tmpdir(), 'linteljs-outer-');
    const outer = await mkdtemp(outerPrefix);

    try {
      await mkdir(join(outer, '.git'));
      vi.stubEnv('GIT_DIR', join(outer, '.git'));

      const notices = await noticesFromAgent();

      const expected = ['git init: the husky hooks install on the next install'];
      expect(notices).toEqual(expected);
      const gitExists = await exists(join(cwd, '.git'));
      expect(gitExists).toBe(true);
    }
    finally {
      await rm(outer, {
        recursive: true,
        force: true,
      });
    }
  });

  it('says nothing where the directory is already inside a work tree', async () => {
    await noticesFromAgent();

    const actual = await noticesFromAgent();
    expect(actual).toEqual([]);
  });

  it('says the hooks will not install when it cannot make one', async () => {
    await writeFile(join(cwd, '.git'), 'not a gitfile\n', 'utf8');

    const actual = await noticesFromAgent();
    const expected = [
      'no git repository here, so the husky hooks will not install until there is one',
    ];
    expect(actual).toEqual(expected);
  });

  it('skips the repository and says why when git is not on PATH, with a listener or without', async () => {
    vi.stubEnv('PATH', '');

    const notices = await noticesFromAgent();

    expect(notices).toHaveLength(1);
    expect(notices[0]).toContain('git was not found on PATH');
    const gitExists = await exists(join(cwd, '.git'));
    expect(gitExists).toBe(false);

    const run = pipelineRun({
      name: 'demo-app',
      cwd,
      answers: hostedAnswersFor({}),
      skip: [
        'lint',
        'package',
        'install',
        'fix',
      ],
    });

    await expect(run).resolves.toBeUndefined();
  });
});

describe('the fix stage', () => {
  const noticesFrom = async (skip: Stage[]): Promise<string[]> => {
    const notices: string[] = [];

    await pipelineRun({
      name: 'demo-app',
      cwd,
      answers: hostedAnswersFor({}),
      skip,
      onNotice: (message) => {
        notices.push(message);
      },
    });

    return notices
      .filter((notice) => {
        return !notice.startsWith('git init:') && !notice.startsWith('no git repository');
      });
  };

  it('runs after the others and reports the install step it is waiting on', async () => {
    const notices = await noticesFrom(['install']);
    const expected = ['next: pnpm install && pnpm lint:fix'];
    expect(notices).toEqual(expected);
  });

  it('does not run when the lint stage was skipped', async () => {
    const notices = await noticesFrom(['lint', 'install']);
    expect(notices).toEqual([]);
  });

  it("fixes a monorepo's app inside its directory with the binaries at the root", async () => {
    const bin = join(cwd, 'node_modules', '.bin');
    await mkdir(bin, { recursive: true });
    await writeFile(join(bin, 'eslint'), "#!/bin/sh\npwd > eslint-cwd\necho '[]'\n", 'utf8');
    await chmod(join(bin, 'eslint'), 0o755);

    await pipelineRun({
      name: 'demo-app',
      cwd,
      answers: hostedAnswersFor({ layout: 'monorepo' }),
      skip: ['install'],
    });

    const app = await realpath(join(cwd, 'apps', 'demo-app'));
    const eslintCwd = await readFile(join(app, 'eslint-cwd'), 'utf8');
    expect(eslintCwd).toBe(`${app}\n`);
  });
});

describe('what create and sync each discover about a project', () => {
  it("keeps the setup spelling the project already has, rather than its target's", async () => {
    await mkdir(join(cwd, '__mocks__'), { recursive: true });
    await writeFile(join(cwd, '__mocks__/setupTests.ts'), '', 'utf8');

    await generate({ target: 'react' });

    const actual = await exists(join(cwd, '__mocks__/setupTests.tsx'));
    expect(actual).toBe(false);

    const file = await readFile(join(cwd, 'vitest.config.ts'), 'utf8');

    expect(file)
      .toContain('__mocks__/setupTests.ts');
  });

  it("reads a monorepo's setup spelling from its app directory", async () => {
    const app = join(cwd, 'apps', 'demo-app');
    await mkdir(join(app, '__mocks__'), { recursive: true });
    await writeFile(join(app, '__mocks__/setupTests.ts'), '', 'utf8');

    await generate({
      target: 'react',
      layout: 'monorepo',
    });

    const actual = await exists(join(app, '__mocks__/setupTests.tsx'));
    expect(actual).toBe(false);
  });

  it('leaves sync nothing to change on a project it has just written', async () => {
    await generate({});

    const answers = hostedAnswersFor({});
    const synced = await syncPlugin(cwd, answers);
    const plan = await planSync(cwd, answers);

    const nothingSynced = {
      written: [],
      removed: [],
    };
    expect(synced).toEqual(nothingSynced);
    const nothingPlanned = {
      upgrades: [],
      peers: [],
      eslintConfig: { status: 'unchanged' },
    };
    expect(plan).toEqual(nothingPlanned);
  });
});
