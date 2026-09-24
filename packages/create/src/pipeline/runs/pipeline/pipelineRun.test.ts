import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  readlink,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { HOSTED_DEFAULTS } from '@mocks/hostedAnswers';
import { plantBinary } from '@mocks/plantBinary';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { type Stage } from '@config/types';

import { valuesOf } from '@utils/objectUtils';

import {
  type Agent,
  ANSWERS,
  type Browser,
  CONFIG_PATH,
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
  type Data,
  type HostedAnswers,
  type Library,
  type PackageManager,
  type Plugin,
  type Router,
  type Store,
  type Styling,
  type TargetId,
  type Testing,
} from '@answers';
import {
  entryExists,
  exists,
  linteljsConfigReader,
} from '@disk';
import { emitLinteljsConfig } from '@emitters/always/linteljs-config/linteljsConfigEmitter';
import { VERSIONS } from '@emitters/always/package-json/constants';
import { parsePackageJson } from '@emitters/always/package-json/packageJsonEmitter';

import { applySync, planSync } from '../sync/syncRun';

import { pipelineRun } from './pipelineRun';

interface AnswerOverrides {
  target?: TargetId;
  testing?: Testing;
  packageManager?: PackageManager;
  libraries?: Library[];
  agents?: Agent[];
  plugins?: Plugin[];
  browsers?: Browser[];
  router?: Router;
  store?: Store;
  styling?: Styling;
  data?: Data;
}

const TARGET_IDS = valuesOf(ANSWERS.target.values);

const answersFor = (overrides: AnswerOverrides): HostedAnswers => {
  return {
    ...HOSTED_DEFAULTS,
    ...overrides,
  };
};

const SCAFFOLDED = JSON.stringify({
  name: 'demo-app',
  // `date-fns` is a dependency this CLI neither pins nor supersedes, which is what a project's own looks like.
  dependencies: {
    'react': '^19.2.0',
    'date-fns': '^4.1.0',
  },
  scripts: { dev: 'vite' },
}, null, 2);

let cwd = '';
let external = '';

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'linteljs-'));
  external = await mkdtemp(join(tmpdir(), 'linteljs-external-'));
  await writeFile(join(cwd, 'package.json'), SCAFFOLDED, 'utf8');
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
  await rm(external, {
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
    expect(written.filter((target) => {
      return target === 'CLAUDE.md';
    })).toHaveLength(1);

    expect(await linteljsConfigReader(cwd)).toEqual({
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      ...HOSTED_DEFAULTS,
    });
    expect(await readFile(join(cwd, CONFIG_PATH), 'utf8')).toBe(emitLinteljsConfig(HOSTED_DEFAULTS));

    // Same stage, config first, so the recorded answers and the dependencies they imply agree.
    expect(written.indexOf(CONFIG_PATH)).toBeLessThan(written.indexOf('package.json'));

    const packageJson = parsePackageJson(await readFile(join(cwd, 'package.json'), 'utf8'));

    expect(packageJson).not.toHaveProperty('linteljs');
  });

  // Both are linteljs's own output, so no generator ignores them.
  it('ignores what its own scripts produce, keeping what the generator listed', async () => {
    await writeFile(join(cwd, '.gitignore'), 'node_modules\n', 'utf8');
    await generate({});

    const ignored = await readFile(join(cwd, '.gitignore'), 'utf8');

    expect(ignored).toContain('node_modules');
    expect(ignored).toContain('coverage/');
    expect(ignored).toContain('*.tsbuildinfo');
  });

  // The scaffolder's README contradicts the project after later stages run.
  it("replaces the scaffolder's README with one that matches the project", async () => {
    await writeFile(join(cwd, 'README.md'), '# use npm, yarn or bun\n', 'utf8');
    await generate({});

    const readme = await readFile(join(cwd, 'README.md'), 'utf8');

    expect(readme).not.toContain('yarn');
    expect(readme).toContain('# demo-app');
    expect(readme).toContain('React (Vite)');
    expect(readme).toContain('`pnpm lint:css`');
    expect(readme).toContain('pnpm lint && pnpm lint:types && pnpm lint:css && pnpm typecheck');
  });

  it('leaves the dependencies and scripts it does not own intact', async () => {
    await generate({});

    const patched = parsePackageJson(await readFile(join(cwd, 'package.json'), 'utf8'));

    expect(patched.dependencies?.['date-fns']).toBe('^4.1.0');
    // Owned since this target crossed over: nothing fetches React any more, so this CLI is what installs it.
    expect(patched.dependencies?.['react']).toBe(VERSIONS['react']);
    expect(patched.scripts?.['dev']).toBe('vite');
    expect(patched.scripts?.['lint']).toBe('eslint .');
  });

  it('composes testing.md from the target head and the shared standard', async () => {
    await generate({ target: 'solid' });

    const testing = await readFile(
      join(cwd, 'plugins/linteljs/skills/linteljs/references/testing.md'),
      'utf8',
    );

    expect(testing).toContain('@solidjs/testing-library');
    expect(testing).toContain('## Standard');
    expect(testing.indexOf('## Infrastructure')).toBeLessThan(testing.indexOf('## Standard'));
  });
});

describe('selected agent setup', () => {
  it('writes both adapters and both host declarations when both agents are selected', async () => {
    const written = await generate({ agents: ['claude-code', 'codex'] });

    expect(written).toEqual(expect.arrayContaining([
      'CLAUDE.md',
      'AGENTS.md',
      '.claude/settings.json',
      '.agents/plugins/marketplace.json',
      'plugins/linteljs/.claude-plugin/plugin.json',
      'plugins/linteljs/.codex-plugin/plugin.json',
    ]));
    expect(written.filter((target) => {
      return target === 'CLAUDE.md';
    })).toHaveLength(1);
    expect(new Set(written).size).toBe(written.length);
  });

  it('does not overwrite project-owned adapters or test setup on rerun', async () => {
    const answers: AnswerOverrides = { agents: ['claude-code', 'codex'] };

    await generate(answers);
    await writeFile(join(cwd, 'CLAUDE.md'), '# project Claude instructions\n', 'utf8');
    await writeFile(join(cwd, 'AGENTS.md'), '# project Codex instructions\n', 'utf8');
    await writeFile(join(cwd, '__mocks__/setupTests.tsx'), '// project test setup\n', 'utf8');

    const written = await generate(answers);

    expect(written).not.toContain('CLAUDE.md');
    expect(written).not.toContain('AGENTS.md');
    expect(written).not.toContain('__mocks__/setupTests.tsx');
    await expect(readFile(join(cwd, 'CLAUDE.md'), 'utf8'))
      .resolves.toBe('# project Claude instructions\n');
    await expect(readFile(join(cwd, 'AGENTS.md'), 'utf8'))
      .resolves.toBe('# project Codex instructions\n');
    await expect(readFile(join(cwd, '__mocks__/setupTests.tsx'), 'utf8'))
      .resolves.toBe('// project test setup\n');
  });

  it('preserves live and dangling symbolic-link adapter entries without following them', async () => {
    const claudeTarget = join(external, 'CLAUDE.md');
    const codexTarget = join(external, 'AGENTS.md');

    await writeFile(claudeTarget, '# external Claude instructions\n', 'utf8');
    await symlink(claudeTarget, join(cwd, 'CLAUDE.md'));
    await symlink(codexTarget, join(cwd, 'AGENTS.md'));

    const written = await generate({ agents: ['claude-code', 'codex'] });

    expect(written).not.toContain('CLAUDE.md');
    expect(written).not.toContain('AGENTS.md');
    await expect(readlink(join(cwd, 'CLAUDE.md'))).resolves.toBe(claudeTarget);
    await expect(readlink(join(cwd, 'AGENTS.md'))).resolves.toBe(codexTarget);
    await expect(readFile(claudeTarget, 'utf8')).resolves.toBe('# external Claude instructions\n');
    await expect(entryExists(codexTarget)).resolves.toBe(false);
  });
});

describe('generated write safety', () => {
  it('keeps ordinary regular-file overwrite behavior', async () => {
    await writeFile(join(cwd, 'eslint.config.js'), '// old config\n', 'utf8');

    await generate({});

    await expect(readFile(join(cwd, 'eslint.config.js'), 'utf8'))
      .resolves.not.toBe('// old config\n');
  });
});

// Neither `--existing` nor `--seed`: the directory is the one `create` just made.
describe('a plain create run', () => {
  it('plants the starter a project is born with', async () => {
    const written: string[] = [];

    await pipelineRun({
      name: 'demo-app',
      cwd,
      answers: answersFor({}),
      skip: ['install', 'fix'],
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

// The 100% thresholds are measured over exactly the code somebody wrote.
describe('coverage surface', () => {
  // A birth run into a directory without one: `vitest.config.ts` is the project's once it exists.
  const vitestConfig = async (overrides: AnswerOverrides): Promise<string> => {
    await rm(join(cwd, 'vitest.config.ts'), { force: true });
    await pipelineRun({
      name: 'demo-app',
      cwd,
      answers: answersFor(overrides),
      existing: true,
      skip: ['install'],
      seed: true,
    });

    return await readFile(join(cwd, 'vitest.config.ts'), 'utf8');
  };

  it('never counts the bootstrap entry, whose only assertion is about the framework', async () => {
    expect(await vitestConfig({})).toContain("'src/{main,index}.{ts,tsx}'");
  });

  // `src/**` alone hands rolldown files it cannot parse, printing `RolldownError: Parse failed` on a clean check.
  it('measures only what v8 can instrument, plus the target component format', async () => {
    expect(await vitestConfig({ target: 'react' }))
      .toContain("include: ['src/**/*.{ts,tsx,mts,js,jsx,mjs}']");
    expect(await vitestConfig({ target: 'svelte' }))
      .toContain("include: ['src/**/*.{ts,tsx,mts,js,jsx,mjs,svelte}']");
    expect(await vitestConfig({ target: 'vue' }))
      .toContain("include: ['src/**/*.{ts,tsx,mts,js,jsx,mjs,vue}']");
  });

  it('adds the shells and declarations each target cannot execute', async () => {
    expect(await vitestConfig({ target: 'next' })).toContain("'src/app/layout.tsx'");
    expect(await vitestConfig({ target: 'angular' })).toContain("'src/app/app.routes.ts'");
    expect(await vitestConfig({ target: 'react' })).not.toContain('layout');
  });

  /*
   * `<svelte:head>` compiles to a hydration branch, which a suite that renders rather than hydrates cannot reach,
   * so the root layout sits at 50% branches against a 100% threshold. It keeps its suite; only the measurement
   * goes, the same trade Next's root layout already takes.
   */
  it('excludes the svelte root layout, whose head is a branch no suite reaches', async () => {
    expect(await vitestConfig({ target: 'svelte' })).toContain("'src/routes/+layout.svelte'");
  });

  it('keeps the thresholds at 100 for every target', async () => {
    const thresholds = /thresholds: \{\s*lines: 100,\s*branches: 100,\s*functions: 100,\s*statements: 100,\s*\}/;

    for (const target of TARGET_IDS) {
      expect([target, thresholds.test(await vitestConfig({ target }))]).toEqual([target, true]);
    }
  });

  // Both transforms leave one branch no test can reach in every component.
  it('keeps the build-time transforms out of the test run', async () => {
    const viteConfig = async (overrides: AnswerOverrides): Promise<string> => {
      await rm(join(cwd, 'vite.config.ts'), { force: true });
      await pipelineRun({
        name: 'demo-app',
        cwd,
        answers: answersFor(overrides),
        existing: true,
        skip: ['install'],
        seed: true,
      });

      return await readFile(join(cwd, 'vite.config.ts'), 'utf8');
    };

    expect(await viteConfig({}))
      .toContain('  ? [babel({ presets: [reactCompilerPreset()] }), react()]');
    expect(await viteConfig({ target: 'solid' }))
      .toContain('solid({ hot: process.env.VITEST === undefined })');
  });
});

// The build configs are the project's after the first write: both reference repos rewrote `vite.config.ts` wholesale.
describe('build configs a project already owns', () => {
  const OWN_VITE = '// hand-written: three IIFE bundles\nexport default {};\n';
  const OWN_VITEST = "// hand-written: excludes this project's own entry points\nexport default {};\n";

  it('leaves them alone when the run did not scaffold', async () => {
    await writeFile(join(cwd, 'vite.config.ts'), OWN_VITE, 'utf8');
    await writeFile(join(cwd, 'vitest.config.ts'), OWN_VITEST, 'utf8');

    const written = await generate({});

    expect(written).not.toContain('vite.config.ts');
    expect(written).not.toContain('vitest.config.ts');
    await expect(readFile(join(cwd, 'vite.config.ts'), 'utf8')).resolves.toBe(OWN_VITE);
    await expect(readFile(join(cwd, 'vitest.config.ts'), 'utf8')).resolves.toBe(OWN_VITEST);
  });

  // No scaffolder writes a default any more, so a config already there is the project's even on a birth run.
  it('leaves them alone on a birth run too', async () => {
    await writeFile(join(cwd, 'vite.config.ts'), OWN_VITE, 'utf8');

    await pipelineRun({
      name: 'demo-app',
      cwd,
      answers: answersFor({}),
      existing: true,
      skip: ['install'],
      seed: true,
    });

    await expect(readFile(join(cwd, 'vite.config.ts'), 'utf8')).resolves.toBe(OWN_VITE);
  });
});

// Stages 2 to 6 on a directory declared fresh, answering with the paths written.
const fresh = async (overrides: AnswerOverrides): Promise<string[]> => {
  const written: string[] = [];

  await pipelineRun({
    name: 'demo-app',
    cwd,
    answers: answersFor(overrides),
    existing: true,
    skip: ['install'],
    seed: true,
    onWrite: (path) => {
      written.push(path);
    },
  });

  return written;
};

describe('starter tests', () => {
  it('writes one beside the code the generator wrote', async () => {
    await mkdir(join(cwd, 'src'), { recursive: true });
    await writeFile(join(cwd, 'src/App.tsx'), 'export default () => null;\n', 'utf8');

    expect(await fresh({})).toContain('src/App.test.tsx');
  });

  /*
   * `requires` gates a suite on the file it covers. Every target writes its own source now, so what the gate is
   * for is the source an answer decides: with no store there is no counter, and its suite would cover nothing.
   */
  it('writes none when the file it would cover is absent', async () => {
    // The absent case first: a second run writes into the same directory, where the first run's source is still there.
    expect(await fresh({})).not.toContain('src/lib/store/counter.test.tsx');
    expect(await fresh({ store: 'zustand' })).toContain('src/lib/store/counter.test.tsx');
  });

  // Both land, since this repository writes both: the layout is the shell and the page is what it wraps.
  it('covers both the svelte page and its root layout', async () => {
    expect(await fresh({ target: 'svelte' }))
      .toEqual(expect.arrayContaining(['src/routes/page.test.ts', 'src/routes/layout.test.ts']));
  });

  // `--existing` without `--seed` points at a repository somebody has worked in.
  it('writes none into a repository the CLI did not scaffold', async () => {
    await mkdir(join(cwd, 'src'), { recursive: true });
    await writeFile(join(cwd, 'src/App.tsx'), 'export default () => null;\n', 'utf8');

    expect(await generate({})).not.toContain('src/App.test.tsx');
  });

  it('writes none when testing is declined', async () => {
    await mkdir(join(cwd, 'src'), { recursive: true });
    await writeFile(join(cwd, 'src/App.tsx'), 'export default () => null;\n', 'utf8');

    expect(await fresh({ testing: 'none' })).not.toContain('src/App.test.tsx');
  });
});

// The one target where linteljs writes source: a manifest naming a missing service worker will not load.
describe('the webextension surfaces', () => {
  const fresh = async (): Promise<string[]> => {
    const written: string[] = [];

    await pipelineRun({
      name: 'demo-app',
      cwd,
      answers: answersFor({ target: 'webextension' }),
      existing: true,
      skip: ['install'],
      seed: true,
      onWrite: (path) => {
        written.push(path);
      },
    });

    return written;
  };

  it('writes a manifest naming the project and the worker beside it', async () => {
    expect(await fresh()).toEqual(expect.arrayContaining([
      'manifest.json',
      'src/background/index.ts',
      'src/background/onInstalled.ts',
    ]));

    const manifest = await readFile(join(cwd, 'manifest.json'), 'utf8');

    expect(manifest).toContain('"name": "demo-app"');
    expect(manifest).toContain('"service_worker": "src/background/index.ts"');
    expect(manifest).not.toMatch(/\{\{/);
  });

  // Chrome rejects `browser_specific_settings` and AMO requires it, so a project shipping to both stores gets two.
  it('writes a second manifest for a project packaged for two stores', async () => {
    const written: string[] = [];

    await pipelineRun({
      name: 'demo-app',
      cwd,
      answers: answersFor({
        target: 'webextension',
        browsers: ['chrome', 'firefox'],
      }),
      existing: true,
      skip: ['install'],
      seed: true,
      onWrite: (path) => {
        written.push(path);
      },
    });

    expect(written).toContain('manifest.json');
    expect(written).toContain('manifest.firefox.json');

    const chrome = await readFile(join(cwd, 'manifest.json'), 'utf8');
    const firefox = await readFile(join(cwd, 'manifest.firefox.json'), 'utf8');

    expect(chrome).not.toContain('browser_specific_settings');
    expect(firefox).toContain('browser_specific_settings');
    expect(chrome).toContain('"service_worker"');
    expect(firefox).toContain('"scripts"');
  });

  it('names a service worker that the same run actually wrote', async () => {
    await fresh();

    const manifest = await readFile(join(cwd, 'manifest.json'), 'utf8');
    const worker = /"service_worker": "([^"]+)"/.exec(manifest)?.[1] ?? '';

    expect(await exists(join(cwd, worker))).toBe(true);
  });

  it('writes none of it into a repository the CLI did not scaffold', async () => {
    await generate({ target: 'webextension' });

    expect(await exists(join(cwd, 'manifest.json'))).toBe(false);
    expect(await exists(join(cwd, 'src/background/index.ts'))).toBe(false);
  });
});

// What `ng new` writes, whose rejection value plain TypeScript would leave implicitly `any`.
const ANGULAR_ENTRY = 'bootstrapApplication(App).catch((err) => log(err));\n';

describe('starter repairs', () => {
  it('repairs the starter code of a directory it was told is fresh output', async () => {
    await mkdir(join(cwd, 'src'), { recursive: true });
    await writeFile(join(cwd, 'src/main.ts'), ANGULAR_ENTRY, 'utf8');

    await pipelineRun({
      name: 'demo-app',
      cwd,
      answers: answersFor({ target: 'angular' }),
      existing: true,
      skip: ['install'],
      seed: true,
    });

    expect(await readFile(join(cwd, 'src/main.ts'), 'utf8')).toContain('(err: unknown) =>');
  });

  it('leaves that same starter code alone in a repository it did not scaffold', async () => {
    await mkdir(join(cwd, 'src'), { recursive: true });
    await writeFile(join(cwd, 'src/main.ts'), ANGULAR_ENTRY, 'utf8');

    await generate({ target: 'angular' });

    expect(await readFile(join(cwd, 'src/main.ts'), 'utf8')).toBe(ANGULAR_ENTRY);
  });
});

describe('pnpm-workspace.yaml', () => {
  it("drops create-next-app's build opt-out, which would fail the install outright", async () => {
    await writeFile(
      join(cwd, 'pnpm-workspace.yaml'),
      'ignoredBuiltDependencies:\n  - sharp\n  - unrs-resolver\n',
      'utf8',
    );

    await generate({ target: 'next' });

    const merged = await readFile(join(cwd, 'pnpm-workspace.yaml'), 'utf8');

    expect(merged).not.toContain('ignoredBuiltDependencies');
    expect(merged).toContain("'unrs-resolver': true");
  });

  it('keeps whatever else the file already carried', async () => {
    await writeFile(
      join(cwd, 'pnpm-workspace.yaml'),
      'overrides:\n  left-pad: 1.0.0\nminimumReleaseAge: 0\n',
      'utf8',
    );

    await generate({});

    const merged = await readFile(join(cwd, 'pnpm-workspace.yaml'), 'utf8');

    expect(merged).toContain('left-pad: 1.0.0');
    expect(merged).toContain('minimumReleaseAge: 0');
    expect(merged).toContain('allowBuilds:');
  });

  it('does not reassert its own names over a list the user already curated', async () => {
    await writeFile(join(cwd, 'pnpm-workspace.yaml'), "allowBuilds:\n  'esbuild': true\n", 'utf8');

    await generate({});

    const merged = await readFile(join(cwd, 'pnpm-workspace.yaml'), 'utf8');

    // The peer block is a separate decision, and this file had none.
    expect(merged.startsWith("allowBuilds:\n  'esbuild': true\n")).toBe(true);
    expect(merged).not.toContain('sharp');
  });
});

describe('.claude/settings.json', () => {
  interface MergedSettings {
    includeCoAuthoredBy?: boolean;
    hooks?: unknown;
    enabledPlugins: Record<string, boolean>;
  }

  const isMergedSettings = (value: unknown): value is MergedSettings => {
    return typeof value === 'object' && value !== null && 'enabledPlugins' in value;
  };

  const settingsAt = async (path: string): Promise<MergedSettings> => {
    const value: unknown = JSON.parse(await readFile(path, 'utf8'));

    if (!isMergedSettings(value)) {
      throw new Error('.claude/settings.json is not an object with enabledPlugins');
    }

    return value;
  };

  it('keeps the top-level keys and hooks a running project already holds', async () => {
    await mkdir(join(cwd, '.claude'), { recursive: true });
    await writeFile(
      join(cwd, '.claude/settings.json'),
      `${JSON.stringify({
        includeCoAuthoredBy: false,
        hooks: {
          PreToolUse: [{
            matcher: 'Bash',
            hooks: [{
              type: 'command',
              command: 'guard.sh',
            }],
          }],
        },
        enabledPlugins: { 'caveman@caveman': true },
      }, null, 2)}\n`,
      'utf8',
    );

    await generate({ agents: ['claude-code'] });

    const merged = await settingsAt(join(cwd, '.claude/settings.json'));

    expect(merged.includeCoAuthoredBy).toBe(false);
    expect(merged.hooks).toBeDefined();
    expect(merged.enabledPlugins['caveman@caveman']).toBe(true);
    expect(merged.enabledPlugins['linteljs@linteljs']).toBe(true);
  });

  it('writes the emitted file unchanged when there is nothing on disk yet', async () => {
    await generate({ agents: ['claude-code'] });

    const written = await settingsAt(join(cwd, '.claude/settings.json'));

    expect(written.enabledPlugins['linteljs@linteljs']).toBe(true);
  });
});

describe('sync', () => {
  it('reports a diff for a locally edited rule and does not overwrite it', async () => {
    await generate({});

    const path = join(cwd, 'plugins/linteljs/skills/linteljs/references/type-standards.md');
    await writeFile(path, '# local edit\n', 'utf8');

    const { pending } = await planSync(cwd, answersFor({}));

    expect(pending).toHaveLength(1);
    expect(pending[0]?.target).toBe('plugins/linteljs/skills/linteljs/references/type-standards.md');
    expect(pending[0]?.status).toBe('changed');
    expect(pending[0]?.diff).toContain('local edit');
    expect(await readFile(path, 'utf8')).toBe('# local edit\n');
  });

  it('reaches the configs it emitted, not only the files it copied', async () => {
    await generate({});
    await writeFile(join(cwd, 'eslint.config.js'), '// hand edited\n', 'utf8');
    await rm(join(cwd, 'tsconfig.json'));

    const { pending } = await planSync(cwd, answersFor({}));

    expect(pending.map((entry) => {
      return [entry.target, entry.status];
    })).toEqual([['eslint.config.js', 'changed'], ['tsconfig.json', 'missing']]);
    expect(pending[0]?.diff).toContain('hand edited');

    const { written } = await applySync(cwd, answersFor({}), ['eslint.config.js', 'tsconfig.json']);

    expect(written).toEqual(['eslint.config.js', 'tsconfig.json']);
    expect(await readFile(join(cwd, 'eslint.config.js'), 'utf8')).toContain('defineConfig');
    expect((await planSync(cwd, answersFor({}))).pending).toEqual([]);
  });

  // A machine with no git still needs to be told which files differ.
  it('reports a changed file without a diff when git cannot be spawned', async () => {
    await generate({});
    await writeFile(
      join(cwd, 'plugins/linteljs/skills/linteljs/references/type-standards.md'),
      '# local edit\n',
      'utf8',
    );

    vi.stubEnv('PATH', '');

    try {
      const { pending } = await planSync(cwd, answersFor({}));

      expect(pending).toHaveLength(1);
      expect(pending[0]?.status).toBe('changed');
      expect(pending[0]?.diff).toBe('');
    }
    finally {
      vi.unstubAllEnvs();
    }
  });

  // Merged rather than preserved: preserving froze the standard's half too.
  it('carries the project blocks of checkBannedPatterns over the shipped floor', async () => {
    await generate({});

    const path = join(cwd, 'scripts/checkBannedPatterns.ts');
    const ours = "const PROJECT_BANNED: BannedPattern[] = [\n  { name: 'ours', re: /ours/ },\n];";
    const edited = (await readFile(path, 'utf8'))
      .replace('const PROJECT_BANNED: BannedPattern[] = [];', ours);

    await writeFile(path, edited, 'utf8');
    await applySync(cwd, answersFor({}), ['scripts/checkBannedPatterns.ts']);

    const merged = await readFile(path, 'utf8');

    expect(merged).toContain("{ name: 'ours', re: /ours/ },");
    expect(merged).toContain('CAUGHT_VALUE');
  });
});

describe('root config', () => {
  it('records every selected answer in linteljs.config.json', async () => {
    const answers = answersFor({
      target: 'svelte',
      libraries: ['zod'],
      agents: ['codex'],
      plugins: ['context7'],
    });

    const written = await generate(answers);

    expect(await linteljsConfigReader(cwd)).toEqual({
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      ...answers,
    });
    expect(await readFile(join(cwd, CONFIG_PATH), 'utf8')).toBe(emitLinteljsConfig(answers));

    expect(written.indexOf(CONFIG_PATH)).toBeLessThan(written.indexOf('package.json'));
  });
});

// Both stages run a name off `PATH` with `shell: false`, so a stand-in earlier on `PATH` is the whole seam.
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
    expect(source).not.toMatch(/from 'node:fs/u);
  });

  // The two lists are what `create` writes and what `sync` re-applies; the pipeline writes both.
  it('writes the seeded artifacts as well as the built ones', async () => {
    const source = await readFile(join(import.meta.dirname, 'pipelineRun.ts'), 'utf8');

    expect(source).toContain('seedArtifacts(');
    expect(source).toContain('buildArtifacts(');
  });
});

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

  const realCwd = async (): Promise<string> => {
    return await realpath(cwd);
  };

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('installs with the package manager the answers named, inside the project', async () => {
    await planted('yarn', 0);

    const notices: string[] = [];

    await pipelineRun({
      name: 'demo-app',
      cwd,
      answers: answersFor({ packageManager: 'yarn' }),
      skip: ['lint', 'package', 'standard', 'fix'],
      onNotice: (message) => {
        notices.push(message);
      },
    });

    expect(await invocations()).toEqual([`${await realCwd()} install`]);
    expect(notices).toEqual(['installing with yarn']);
  });

  it('stops when the package manager is not installed at all', async () => {
    await planted('yarn', 0);

    await expect(pipelineRun({
      name: 'demo-app',
      cwd,
      answers: answersFor({ packageManager: 'bun' }),
      skip: ['lint', 'package', 'standard', 'fix'],
    })).rejects.toThrow('ENOENT');
  });

  // A target whose template this repository owns fetches nothing, and the stage makes the directory instead.
});

// Stage 4's repository notice has its own describe below.
const notAboutTheRepository = (notice: string): boolean => {
  return !notice.startsWith('git init:') && !notice.startsWith('no git repository');
};

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

    try {
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
    }
    finally {
      vi.unstubAllEnvs();
    }
  });
});

// The fix pass never takes a generated project down with it.
describe('the eslint --fix pass', () => {
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

    return notices.filter(notAboutTheRepository);
  };

  it('reports the install step when the project has no eslint yet', async () => {
    // Stage 3 only adds eslint to package.json, so this is what a fresh generate does.
    expect(await noticesFrom(['install'])).toEqual(['next: pnpm install && pnpm lint:fix']);
  });

  it('does not run when the lint stage was skipped', async () => {
    expect(await noticesFrom(['lint', 'install'])).toEqual([]);
  });

  // A stand-in eslint with `output` present exactly on files it rewrote.
  const plantedEslint = async (printed: string, exitCode: number): Promise<void> => {
    // In the project, not on PATH: the fix pass runs the binary by absolute path.
    const bin = join(cwd, 'node_modules', '.bin');

    await mkdir(bin, { recursive: true });
    await writeFile(
      join(bin, 'eslint'),
      [
        '#!/usr/bin/env node',
        `console.log(${JSON.stringify(printed)});`,
        `process.exit(${String(exitCode)});`,
      ].join('\n'),
      'utf8',
    );
    await chmod(join(bin, 'eslint'), 0o755);
  };

  // Unreadable formatter output counts as nothing fixed.
  it('survives JSON that is not a result list', async () => {
    await plantedEslint('{"results":[]}', 0);

    expect(await noticesFrom(['install'])).toEqual(['eslint --fix: nothing to fix']);
    expect(await exists(join(cwd, 'eslint.config.js'))).toBe(true);
  });
});

// Both routes read the directory the same way: `--existing` once wrote a second stylesheet nothing imports.
describe('what create and sync each discover about a project', () => {
  const plant = async (relative: string, text = ''): Promise<void> => {
    await mkdir(join(cwd, relative, '..'), { recursive: true });
    await writeFile(join(cwd, relative), text, 'utf8');
  };

  const generateWith = async (answers: HostedAnswers): Promise<string[]> => {
    const written: string[] = [];

    await pipelineRun({
      name: 'demo-app',
      cwd,
      answers,
      existing: true,
      skip: ['install'],
      onWrite: (path) => {
        written.push(path);
      },
    });

    return written;
  };

  // A React project generated before the setup file became `.tsx` keeps `.ts`.
  it("keeps the setup spelling the project already has, rather than its target's", async () => {
    await plant('__mocks__/setupTests.ts');

    await generateWith(answersFor({ target: 'react' }));

    expect(await exists(join(cwd, '__mocks__/setupTests.tsx'))).toBe(false);
    expect(await readFile(join(cwd, 'vitest.config.ts'), 'utf8'))
      .toContain('__mocks__/setupTests.ts');
  });
});

describe('starter files for a router', () => {
  // The entry is written either way; without a router it is the base copy, and no route table joins it.
  it('writes the base entry and no route table without a router', async () => {
    const written = await fresh({});

    expect(written).toContain('src/main.tsx');
    expect(written).not.toContain('src/routes/router.tsx');
    expect(written).not.toContain('src/routeTree.gen.ts');
  });

  it('writes the react-router table and entry, and nothing of tanstack', async () => {
    const written = await fresh({ router: 'react-router' });

    expect(written).toContain('src/App.tsx');
    expect(written).toContain('src/routes/router.tsx');
    expect(written).not.toContain('src/routeTree.gen.ts');
    // The entry is the same file whatever was answered; `App` is what the router replaces.
    expect(await readFile(join(cwd, 'src/App.tsx'), 'utf8')).toContain("from 'react-router'");
  });

  // No `routes/` directory and no generated tree: the tree is built from the one route list, in the entry.
  it('writes the tanstack entry and nothing generated beside it', async () => {
    const written = await fresh({ router: 'tanstack-router' });

    expect(written).toContain('src/App.tsx');
    expect(written).not.toContain('src/routes/router.tsx');
    expect(written).not.toContain('src/routeTree.gen.ts');
    expect(await readFile(join(cwd, 'src/App.tsx'), 'utf8')).toContain("from '@tanstack/react-router'");
  });

  // Both, not just the NativeWind one: Metro needs a config on this target whatever was answered about styling.
  it('writes a metro config for either styling answer on React Native', async () => {
    expect(await fresh({
      target: 'react-native',
      libraries: [],
      styling: 'tailwind',
    })).toContain('metro.config.js');
    expect(await fresh({
      target: 'react-native',
      libraries: [],
    })).toContain('metro.config.js');
  });
});
