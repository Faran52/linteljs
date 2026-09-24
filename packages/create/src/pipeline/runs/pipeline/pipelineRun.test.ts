import {
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
  CONFIG_PATH,
  type HostedAnswers,
  type Library,
  type PackageManager,
  type Plugin,
  type TargetId,
} from '#answers';
import { type Stage } from '#config/types';
import { exists } from '#disk';
import { emitLinteljsConfig } from '#emitters/always/linteljs-config/linteljsConfigEmitter';

import { planSync } from '../sync/syncRun';

import { pipelineRun } from './pipelineRun';

import { HOSTED_DEFAULTS } from '#mocks/hostedAnswers';
import { plantBinary } from '#mocks/plantBinary';

interface AnswerOverrides {
  target?: TargetId;
  packageManager?: PackageManager;
  libraries?: Library[];
  agents?: Agent[];
  plugins?: Plugin[];
}

const answersFor = (overrides: AnswerOverrides): HostedAnswers => {
  return {
    ...HOSTED_DEFAULTS,
    ...overrides,
  };
};

let cwd = '';

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'linteljs-'));
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
    answers: answersFor(overrides),
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
      'eslint.config.js',
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
      'plugins/linteljs/hooks/git-safety-guard.sh',
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
    // A seed, and this run was not told the directory is being born.
    expect(written).not.toContain('src/App.tsx');
    // The README is seeded on every run, and the name it carries is the one the run was given.
    expect(await readFile(join(cwd, 'README.md'), 'utf8')).toContain('# demo-app');
  });

  // Seeded first, in the same stage, so the recorded answers and the dependencies they imply agree.
  it('records the answers it was given before the package.json they imply', async () => {
    const answers = answersFor({
      target: 'svelte',
      libraries: ['zod'],
      agents: ['codex'],
      plugins: ['context7'],
    });

    const written = await generate(answers);

    expect(await readFile(join(cwd, CONFIG_PATH), 'utf8')).toBe(emitLinteljsConfig(answers));
    expect(written.indexOf(CONFIG_PATH)).toBeLessThan(written.indexOf('package.json'));
  });
});

// A plain `create` makes the directory, and `--existing --seed` asks for the same in one that exists.
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
      answers: answersFor({}),
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
  it('reports each stage by the time it took rather than a clock reading', async () => {
    const took: number[] = [];
    const started = performance.now();

    await pipelineRun({
      name: 'demo-app',
      cwd,
      answers: answersFor({}),
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

/**
 * One route to disk. Every file this CLI owns is an `Artifact` and reaches the project through `artifactWriter`,
 * which is what lets `sync` see the same set and what stops this file growing a branch per artifact. `rewrite` and
 * `repair` still write directly, and are a different operation: they edit source a scaffolder already wrote.
 */
describe('the pipeline as a writer', () => {
  it('puts every file it owns on disk through artifactWriter and nothing else', async () => {
    const source = await readFile(join(import.meta.dirname, 'pipelineRun.ts'), 'utf8');

    expect(source).toContain('artifactWriter(');
    expect(source).not.toContain('projectFileWriter(');
  });
});

// Both stages run a name off `PATH` with `shell: false`, so a stand-in earlier on `PATH` is the whole seam.
describe('the stages that shell out', () => {
  const MARKER = 'invocation.txt';

  const planted = async (name: string, exitCode: number): Promise<void> => {
    await plantBinary(join(cwd, 'fake-bin'), name, [
      "const { appendFileSync } = require('node:fs');",
      `appendFileSync(${JSON.stringify(join(cwd, MARKER))}, `
      + '`${process.cwd()} ${process.argv.slice(2).join(" ")}\\n`);',
      `process.exit(${String(exitCode)});`,
    ]);
  };

  // The child reports its cwd with symlinks resolved, and macOS puts the temp directory behind one.
  const invocations = async (): Promise<string[]> => {
    return (await readFile(join(cwd, MARKER), 'utf8')).trimEnd().split('\n');
  };

  const installNotices = async (packageManager: PackageManager): Promise<string[]> => {
    const notices: string[] = [];

    await pipelineRun({
      name: 'demo-app',
      cwd,
      answers: answersFor({ packageManager }),
      skip: ['lint', 'package', 'standard', 'fix'],
      onNotice: (message) => {
        notices.push(message);
      },
    });

    return notices;
  };

  it('installs with the package manager the answers named, inside the project', async () => {
    await planted('yarn', 0);

    expect(await installNotices('yarn')).toEqual(['installing with yarn']);
    expect(await invocations()).toEqual([`${await realpath(cwd)} install`]);
  });

  it('names yarn 1 by the command it runs', async () => {
    await planted('yarn', 0);

    expect(await installNotices('yarn-classic')).toEqual(['installing with yarn']);
  });

  it('stops when the package manager is not installed at all', async () => {
    await planted('yarn', 0);

    await expect(installNotices('bun')).rejects.toThrow('ENOENT');
  });
});

// husky's `prepare` exits 0 even when `.git` cannot be found, so a project can ship hooks that never run.
describe('the repository the hooks install into', () => {
  const noticesFromAgent = async (): Promise<string[]> => {
    const notices: string[] = [];

    await pipelineRun({
      name: 'demo-app',
      cwd,
      answers: answersFor({}),
      skip: ['lint', 'package', 'install', 'fix'],
      onNotice: (message) => {
        notices.push(message);
      },
    });

    return notices;
  };

  it('initialises one where the scaffolder left none, and says so', async () => {
    expect(await noticesFromAgent()).toEqual([
      'git init: the husky hooks install on the next install',
    ]);
    expect(await exists(join(cwd, '.git'))).toBe(true);
  });

  // A subdirectory of somebody's repository has no `.git` of its own; nesting one there is not done quietly.
  it('says nothing where the directory is already inside a work tree', async () => {
    await noticesFromAgent();

    expect(await noticesFromAgent()).toEqual([]);
  });

  it('says the hooks will not install when it cannot make one', async () => {
    // A `.git` that is a file: `rev-parse` and `init` both fail, ordinary writes still work.
    await writeFile(join(cwd, '.git'), 'not a gitfile\n', 'utf8');

    expect(await noticesFromAgent()).toEqual([
      'no git repository here, so the husky hooks will not install until there is one',
    ]);
  });

  // No git at all is not a failed `git init`: nothing is attempted, and the reason is the spawn's own.
  it('skips the repository and says why when git is not on PATH, with a listener or without', async () => {
    vi.stubEnv('PATH', '');

    const notices = await noticesFromAgent();

    expect(notices).toHaveLength(1);
    expect(notices[0]).toContain('git was not found on PATH');
    expect(await exists(join(cwd, '.git'))).toBe(false);

    await expect(pipelineRun({
      name: 'demo-app',
      cwd,
      answers: answersFor({}),
      skip: ['lint', 'package', 'install', 'fix'],
    })).resolves.toBeUndefined();
  });
});

// What the pass reports is the pass's own suite; which runs reach it is this one.
describe('the fix stage', () => {
  // Stage 4's repository notice is the describe above.
  const noticesFrom = async (skip: Stage[]): Promise<string[]> => {
    const notices: string[] = [];

    await pipelineRun({
      name: 'demo-app',
      cwd,
      answers: answersFor({}),
      skip,
      onNotice: (message) => {
        notices.push(message);
      },
    });

    return notices.filter((notice) => {
      return !notice.startsWith('git init:') && !notice.startsWith('no git repository');
    });
  };

  // The stages only add eslint to package.json, so a run with no install has no binary to fix with.
  it('runs after the others and reports the install step it is waiting on', async () => {
    expect(await noticesFrom(['install'])).toEqual(['next: pnpm install && pnpm lint:fix']);
  });

  // `--skip lint` means somebody else's rules, and fixing against those is an unasked-for edit.
  it('does not run when the lint stage was skipped', async () => {
    expect(await noticesFrom(['lint', 'install'])).toEqual([]);
  });
});

// Both routes read the directory the same way: `--existing` once wrote a second stylesheet nothing imports.
describe('what create and sync each discover about a project', () => {
  // A React project generated before the setup file became `.tsx` keeps `.ts`.
  it("keeps the setup spelling the project already has, rather than its target's", async () => {
    await mkdir(join(cwd, '__mocks__'), { recursive: true });
    await writeFile(join(cwd, '__mocks__/setupTests.ts'), '', 'utf8');

    await generate({ target: 'react' });

    expect(await exists(join(cwd, '__mocks__/setupTests.tsx'))).toBe(false);
    expect(await readFile(join(cwd, 'vitest.config.ts'), 'utf8'))
      .toContain('__mocks__/setupTests.ts');
  });

  it('leaves sync nothing to report on a project it has just written', async () => {
    await generate({});

    expect((await planSync(cwd, answersFor({}))).pending).toEqual([]);
  });
});
