import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  readlink,
  realpath,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { plantBinary } from '@mocks/plantBinary';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { parsePackageJson } from '../../artifacts/package-json/emitPackageJson';
import { STYLE_ENTRY_CANDIDATES } from '../../artifacts/style-entry/styleEntryPath';
import {
  type Agent,
  type Answers,
  type Browser,
  DEFAULT_ANSWERS,
  type Library,
  type PackageManager,
  type Plugin,
  type Router,
  TARGET_IDS,
  type TargetId,
  type Testing,
} from '../../model/answers/answers';
import {
  CONFIG_PATH,
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
  emitLintelConfig,
  readLintelConfig,
} from '../../model/config/lintelConfig';
import { type Stage } from '../../model/stages/stages';
import { targetFor } from '../../model/targets';
import { applySync, planSync } from '../sync/sync';
import {
  entryExists,
  exists,
  readIfPresent,
} from '../utils/fsUtils';

import { runPipeline, scaffoldCommand } from './pipeline';

interface AnswerOverrides {
  target?: TargetId;
  testing?: Testing;
  packageManager?: PackageManager;
  libraries?: Library[];
  agents?: Agent[];
  plugins?: Plugin[];
  browsers?: Browser[];
  router?: Router;
}

const answersFor = (overrides: AnswerOverrides): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };
};

const SCAFFOLDED = JSON.stringify({
  name: 'demo-app',
  dependencies: { react: '^19.2.0' },
  scripts: { dev: 'vite' },
}, null, 2);

let cwd = '';
let external = '';

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'lintel-'));
  external = await mkdtemp(join(tmpdir(), 'lintel-external-'));
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

  await runPipeline({
    name: 'demo-app',
    cwd,
    answers: answersFor(overrides),
    skip: ['scaffold', 'install'],
    onWrite: (path) => {
      written.push(path);
    },
  });

  return written;
};

describe('runPipeline with --skip-scaffold', () => {
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

    expect(await readLintelConfig(cwd)).toEqual({
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      ...DEFAULT_ANSWERS,
    });
    expect(await readFile(join(cwd, CONFIG_PATH), 'utf8')).toBe(emitLintelConfig(DEFAULT_ANSWERS));

    // Same stage, config first, so the recorded answers and the dependencies they imply agree.
    expect(written.indexOf(CONFIG_PATH)).toBeLessThan(written.indexOf('package.json'));

    const packageJson = parsePackageJson(await readFile(join(cwd, 'package.json'), 'utf8'));

    expect(packageJson).not.toHaveProperty('lintel');
  });

  // Both are lintel's own output, so no generator ignores them.
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

  it('leaves the fixture dependencies and scripts intact', async () => {
    await generate({});

    const patched = parsePackageJson(await readFile(join(cwd, 'package.json'), 'utf8'));

    expect(patched.dependencies?.['react']).toBe('^19.2.0');
    expect(patched.scripts?.['dev']).toBe('vite');
    expect(patched.scripts?.['lint']).toBe('eslint .');
  });

  it('writes the shell hooks executable', async () => {
    await generate({});

    const mode = (await stat(join(cwd, 'plugins/linteljs/hooks/git-safety-guard.sh'))).mode;

    expect(mode & 0o111).toBe(0o111);
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

  it('writes no vite config for a target that does not use vite', async () => {
    expect(await generate({ target: 'next' })).not.toContain('vite.config.ts');
    expect(await generate({ target: 'angular' })).not.toContain('vite.config.ts');
  });

  it('writes a tsconfig for every target, since every project is a TypeScript one', async () => {
    expect(await generate({})).toContain('tsconfig.json');
    expect(await generate({ target: 'angular' })).toContain('tsconfig.json');
  });
});

describe('selected agent setup', () => {
  it('writes only the Codex adapter and host declaration when Codex is selected', async () => {
    const written = await generate({
      agents: ['codex'],
      plugins: ['context7'],
    });

    expect(written).toEqual(expect.arrayContaining([
      CONFIG_PATH,
      'AGENTS.md',
      '.agents/plugins/marketplace.json',
      'plugins/linteljs/.codex-plugin/plugin.json',
      'plugins/linteljs/skills/linteljs/SKILL.md',
    ]));
    expect(written).not.toContain('CLAUDE.md');
    expect(written).not.toContain('.claude/settings.json');
    expect(written).not.toContain('plugins/linteljs/.claude-plugin/plugin.json');
  });

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
  it.each([
    ['live', '// external config\n'],
    ['dangling', null],
  ])('rejects an existing %s symbolic-link target without touching its destination', async (_case, original) => {
    const externalTarget = join(external, 'eslint.config.js');
    const generatedTarget = join(cwd, 'eslint.config.js');

    if (original !== null) {
      await writeFile(externalTarget, original, 'utf8');
    }

    await symlink(externalTarget, generatedTarget);

    await expect(generate({}))
      .rejects.toThrow('Refusing to write eslint.config.js: target is a symbolic link');
    await expect(readlink(generatedTarget)).resolves.toBe(externalTarget);
    await expect(readIfPresent(externalTarget)).resolves.toBe(original);
  });

  // Only ELOOP is translated; a symlink message would send the reader looking for a link that is not there.
  it('surfaces a write failure that is not a symbolic link as itself', async () => {
    await mkdir(join(cwd, 'eslint.config.js'), { recursive: true });

    await expect(generate({})).rejects.toThrow(/EISDIR/);
  });

  it('keeps ordinary regular-file overwrite behavior', async () => {
    await writeFile(join(cwd, 'eslint.config.js'), '// old config\n', 'utf8');

    await generate({});

    await expect(readFile(join(cwd, 'eslint.config.js'), 'utf8'))
      .resolves.not.toBe('// old config\n');
  });
});

// The 100% thresholds are measured over exactly the code somebody wrote.
describe('coverage surface', () => {
  // A birth run: `vitest.config.ts` is the project's once it exists.
  const vitestConfig = async (overrides: AnswerOverrides): Promise<string> => {
    await runPipeline({
      name: 'demo-app',
      cwd,
      answers: answersFor(overrides),
      skip: ['scaffold', 'install'],
      fresh: true,
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

  // Extensionless, vite warns every run; `.ts` is TS5097; `.js` resolves to the `.ts` under `bundler`.
  it('names the vite config with the extension both vite and tsc accept', async () => {
    expect(await vitestConfig({})).toContain("import viteConfig from './vite.config.js';");
  });

  it('adds the shells and declarations each target cannot execute', async () => {
    expect(await vitestConfig({ target: 'next' })).toContain("'src/app/layout.tsx'");
    expect(await vitestConfig({ target: 'angular' })).toContain("'src/app/app.routes.ts'");
    expect(await vitestConfig({ target: 'react' })).not.toContain('layout');
  });

  // Excluding the layout leaves `--template minimal` at `100% (0/0)`, asserting nothing.
  it('measures the svelte root layout rather than excluding it', async () => {
    expect(await vitestConfig({ target: 'svelte' })).not.toContain('+layout.svelte');
  });

  it('keeps the thresholds at 100 for every target', async () => {
    const thresholds = 'thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 }';

    for (const target of TARGET_IDS) {
      expect([target, await vitestConfig({ target })])
        .toEqual([target, expect.stringContaining(thresholds)]);
    }
  });

  // Without the browser condition vitest resolves Svelte's server build and `render()` throws.
  it('gives svelte the browser resolve condition its renderer needs', async () => {
    expect(await vitestConfig({ target: 'svelte' })).toContain("resolve: { conditions: ['browser'] }");
    expect(await vitestConfig({ target: 'vue' })).not.toContain('conditions');
  });

  // Both transforms leave one branch no test can reach in every component.
  it('keeps the build-time transforms out of the test run', async () => {
    const viteConfig = async (overrides: AnswerOverrides): Promise<string> => {
      await runPipeline({
        name: 'demo-app',
        cwd,
        answers: answersFor(overrides),
        skip: ['scaffold', 'install'],
        fresh: true,
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

  // At birth the file on disk is the scaffolder's default, so this standard's version has to land over it.
  it('replaces the scaffolder default on a birth run', async () => {
    await writeFile(join(cwd, 'vite.config.ts'), '// vite scaffolder default\n', 'utf8');

    await runPipeline({
      name: 'demo-app',
      cwd,
      answers: answersFor({}),
      skip: ['scaffold', 'install'],
      fresh: true,
    });

    await expect(readFile(join(cwd, 'vite.config.ts'), 'utf8'))
      .resolves.toContain('defineConfig');
  });

  it('installs them when the project has neither', async () => {
    const written = await generate({});

    expect(written).toContain('vite.config.ts');
    expect(written).toContain('vitest.config.ts');
  });
});

// Stages 2 to 6 on a directory declared fresh, answering with the paths written.
const fresh = async (overrides: AnswerOverrides): Promise<string[]> => {
  const written: string[] = [];

  await runPipeline({
    name: 'demo-app',
    cwd,
    answers: answersFor(overrides),
    skip: ['scaffold', 'install'],
    fresh: true,
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

  it('writes none when the file it would cover is absent', async () => {
    expect(await fresh({})).not.toContain('src/App.test.tsx');
  });

  // The layout is the only executable code `--template minimal` writes, so both tests have to land.
  it('covers both the svelte page and its root layout', async () => {
    await mkdir(join(cwd, 'src/routes'), { recursive: true });
    await writeFile(join(cwd, 'src/routes/+page.svelte'), '<h1>SvelteKit</h1>\n', 'utf8');
    await writeFile(join(cwd, 'src/routes/+layout.svelte'), '{@render children()}\n', 'utf8');

    expect(await fresh({ target: 'svelte' }))
      .toEqual(expect.arrayContaining(['src/routes/page.test.ts', 'src/routes/layout.test.ts']));
  });

  // `--skip-scaffold` without `--fresh` points at a repository somebody has worked in.
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

// The one target where lintel writes source: a manifest naming a missing service worker will not load.
describe('the webextension surfaces', () => {
  const fresh = async (): Promise<string[]> => {
    const written: string[] = [];

    await runPipeline({
      name: 'demo-app',
      cwd,
      answers: answersFor({ target: 'webextension' }),
      skip: ['scaffold', 'install'],
      fresh: true,
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

    await runPipeline({
      name: 'demo-app',
      cwd,
      answers: answersFor({
        target: 'webextension',
        browsers: ['chrome', 'firefox'],
      }),
      skip: ['scaffold', 'install'],
      fresh: true,
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

  it('writes one manifest when the project ships to one store', async () => {
    expect(await fresh()).not.toContain('manifest.firefox.json');
  });

  it('names a service worker that the same run actually wrote', async () => {
    await fresh();

    const manifest = await readFile(join(cwd, 'manifest.json'), 'utf8');
    const worker = /"service_worker": "([^"]+)"/.exec(manifest)?.[1] ?? '';

    expect(await exists(join(cwd, worker))).toBe(true);
  });

  it('writes the worker whether or not the project took a test runner', async () => {
    await runPipeline({
      name: 'demo-app',
      cwd,
      answers: answersFor({
        target: 'webextension',
        testing: 'none',
      }),
      skip: ['scaffold', 'install'],
      fresh: true,
    });

    expect(await exists(join(cwd, 'src/background/index.ts'))).toBe(true);
    expect(await exists(join(cwd, 'src/background/onInstalled.test.ts'))).toBe(false);
  });

  it('writes none of it into a repository the CLI did not scaffold', async () => {
    await generate({ target: 'webextension' });

    expect(await exists(join(cwd, 'manifest.json'))).toBe(false);
    expect(await exists(join(cwd, 'src/background/index.ts'))).toBe(false);
  });

  it('leaves the manifest to targets that have one', async () => {
    await runPipeline({
      name: 'demo-app',
      cwd,
      answers: answersFor({ target: 'react' }),
      skip: ['scaffold', 'install'],
      fresh: true,
    });

    expect(await exists(join(cwd, 'manifest.json'))).toBe(false);
  });
});

const SVELTE_DOCUMENT = '<html lang="en">\n\t<head>\n\t\t%sveltekit.head%\n\t</head>\n</html>\n';

describe('starter repairs', () => {
  it('repairs the starter code of a directory it was told is fresh output', async () => {
    await mkdir(join(cwd, 'src'), { recursive: true });
    await writeFile(join(cwd, 'src/app.html'), SVELTE_DOCUMENT, 'utf8');

    await runPipeline({
      name: 'demo-app',
      cwd,
      answers: answersFor({ target: 'svelte' }),
      skip: ['scaffold', 'install'],
      fresh: true,
    });

    const app = await readFile(join(cwd, 'src/app.html'), 'utf8');

    expect(app).toContain('<title>App</title>');
    expect(app).not.toContain('\t');
  });

  it('leaves that same starter code alone in a repository it did not scaffold', async () => {
    await mkdir(join(cwd, 'src'), { recursive: true });
    await writeFile(join(cwd, 'src/app.html'), SVELTE_DOCUMENT, 'utf8');

    await generate({ target: 'svelte' });

    expect(await readFile(join(cwd, 'src/app.html'), 'utf8')).toBe(SVELTE_DOCUMENT);
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
    expect(merged).toContain("'sharp': true");
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

const scaffoldFor = (overrides: AnswerOverrides): string[] => {
  const answers = answersFor(overrides);

  return scaffoldCommand(
    answers.packageManager,
    targetFor(answers).scaffold('demo-app', answers),
  );
};

describe('scaffoldCommand', () => {
  it('spells create and dlx per package manager', () => {
    const answers = answersFor({ target: 'svelte' });
    const svelte = targetFor(answers).scaffold('demo-app', answers);

    expect(scaffoldFor({})).toEqual([
      'pnpm', 'create', 'vite', 'demo-app',
      '--template', 'react-ts', '--eslint', '--no-interactive', '--no-immediate',
    ]);
    expect(scaffoldCommand('npm', svelte)[0]).toBe('npx');
    expect(scaffoldCommand('bun', svelte)[0]).toBe('bunx');
  });

  it('inserts -- separator for npm create to forward flags', () => {
    const react = targetFor(answersFor({ target: 'react' })).scaffold('demo-app', answersFor({ target: 'react' }));
    const npm = scaffoldCommand('npm', react);

    expect(npm).toEqual([
      'npm', 'create', 'vite', 'demo-app', '--',
      '--template', 'react-ts', '--eslint', '--no-interactive', '--no-immediate',
    ]);
  });

  it('does not insert -- separator for pnpm, yarn, and bun create', () => {
    const react = targetFor(answersFor({ target: 'react' })).scaffold('demo-app', answersFor({ target: 'react' }));

    expect(scaffoldCommand('pnpm', react)).not.toContain('--');
    expect(scaffoldCommand('yarn', react)).not.toContain('--');
    expect(scaffoldCommand('bun', react)).not.toContain('--');
  });

  // Next wires Tailwind at generate time, so this is the one scaffolder flag that follows the answer.
  it('passes the tailwind answer through to the one generator that acts on it', () => {
    expect(scaffoldFor({
      target: 'next',
      libraries: ['tailwind'],
    })).toContain('--tailwind');
    expect(scaffoldFor({
      target: 'next',
      libraries: ['tailwind'],
    })).not.toContain('--no-tailwind');
    expect(scaffoldFor({
      target: 'next',
      libraries: [],
    })).toContain('--no-tailwind');
  });

  // Three spellings of "TypeScript"; omitting one scaffolds JavaScript under a tsconfig that checks nothing.
  it('asks each generator for TypeScript in its own spelling', () => {
    expect(scaffoldFor({})).toContain('react-ts');
    expect(scaffoldFor({ target: 'next' })).toContain('--ts');
    expect(scaffoldFor({ target: 'vue' })).toContain('--ts');
    expect(scaffoldFor({ target: 'svelte' })).toEqual(expect.arrayContaining(['--types', 'ts']));
  });

  it('leaves --vitest off the vue scaffold when testing is declined', () => {
    expect(scaffoldFor({ target: 'vue' })).toContain('--vitest');
    expect(scaffoldFor({
      target: 'vue',
      testing: 'none',
    })).not.toContain('--vitest');
  });

  // `--yes` promises the tool asks nothing, though four generators ask plenty when handed only a name.
  it('passes each generator its own non-interactive flag', () => {
    const suppressors = [
      '--yes',
      '--defaults',
      '--no-interactive',
      // create-vue skips every prompt once one feature flag is present; --router is the one every answer set passes.
      '--router',
      '--no-add-ons',
    ];

    for (const target of TARGET_IDS) {
      expect([target, scaffoldFor({ target }).some((argument) => {
        return suppressors.includes(argument);
      })]).toEqual([target, true]);
    }
  });

  it('follows the package manager answer where the generator takes one', () => {
    expect(scaffoldFor({
      target: 'next',
      packageManager: 'bun',
    })).toContain('--use-bun');
    expect(scaffoldFor({
      target: 'angular',
      packageManager: 'yarn',
    })).toContain('yarn');
  });
});

describe('sync', () => {
  it('reports nothing pending on a freshly generated project', async () => {
    await generate({});

    expect((await planSync(cwd, answersFor({}))).pending).toEqual([]);
  });

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

  it('reports a missing file and restores it only when applied', async () => {
    await generate({});

    const path = join(cwd, 'plugins/linteljs/hooks/git-safety-guard.sh');
    await rm(path);

    const { pending } = await planSync(cwd, answersFor({}));

    expect(pending[0]?.status).toBe('missing');

    const { written } = await applySync(cwd, answersFor({}), [pending[0]?.target ?? '']);

    expect(written).toEqual(['plugins/linteljs/hooks/git-safety-guard.sh']);
    expect((await stat(path)).mode & 0o111).toBe(0o111);
    expect((await planSync(cwd, answersFor({}))).pending).toEqual([]);
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

  it('restores checkBannedPatterns when it is missing entirely', async () => {
    await generate({});

    const path = join(cwd, 'scripts/checkBannedPatterns.ts');
    await rm(path);

    expect((await applySync(cwd, answersFor({}), ['scripts/checkBannedPatterns.ts'])).written)
      .toEqual(['scripts/checkBannedPatterns.ts']);
    expect(await exists(path)).toBe(true);
  });
});

describe('root config', () => {
  it('records every selected answer in lintel.config.json', async () => {
    const answers = answersFor({
      target: 'svelte',
      libraries: ['zod'],
      agents: ['codex'],
      plugins: ['context7'],
    });

    const written = await generate(answers);

    expect(await readLintelConfig(cwd)).toEqual({
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      ...answers,
    });
    expect(await readFile(join(cwd, CONFIG_PATH), 'utf8')).toBe(emitLintelConfig(answers));

    expect(written.indexOf(CONFIG_PATH)).toBeLessThan(written.indexOf('package.json'));
  });

  it('is not part of the sync artifact plan', async () => {
    await generate({});

    const { entries, pending } = await planSync(cwd, DEFAULT_ANSWERS);

    expect(entries.map((entry) => {
      return entry.target;
    })).not.toContain(CONFIG_PATH);
    expect(pending).toEqual([]);
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

  const realCwd = async (): Promise<string> => {
    return await realpath(cwd);
  };

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('installs with the package manager the answers named, inside the project', async () => {
    await planted('yarn', 0);

    const notices: string[] = [];

    await runPipeline({
      name: 'demo-app',
      cwd,
      answers: answersFor({ packageManager: 'yarn' }),
      skip: ['scaffold', 'lint', 'package', 'standard', 'fix'],
      onNotice: (message) => {
        notices.push(message);
      },
    });

    expect(await invocations()).toEqual([`${await realCwd()} install`]);
    expect(notices).toEqual(['installing with yarn']);
  });

  // Fatal on purpose: every later step reads `node_modules`.
  it('stops on a failed install rather than carrying on to the fix pass', async () => {
    await planted('yarn', 3);

    await expect(runPipeline({
      name: 'demo-app',
      cwd,
      answers: answersFor({ packageManager: 'yarn' }),
      skip: ['scaffold', 'lint', 'package', 'standard'],
    })).rejects.toThrow('yarn install exited with 3');
  });

  it('stops when the package manager is not installed at all', async () => {
    await planted('yarn', 0);

    await expect(runPipeline({
      name: 'demo-app',
      cwd,
      answers: answersFor({ packageManager: 'bun' }),
      skip: ['scaffold', 'lint', 'package', 'standard', 'fix'],
    })).rejects.toThrow('ENOENT');
  });

  // The scaffolder creates `<name>/` itself; wrong, the project nests inside itself.
  it('runs the scaffolder one directory above the project it is creating', async () => {
    await planted('pnpm', 0);

    const project = join(cwd, 'demo-app');

    await runPipeline({
      name: 'demo-app',
      cwd: project,
      answers: answersFor({}),
      skip: ['lint', 'package', 'standard', 'install', 'fix'],
    });

    expect(await invocations()).toEqual([
      `${await realCwd()} create vite demo-app `
      + '--template react-ts --eslint --no-interactive --no-immediate',
    ]);
  });
});

// Stage 4's repository notice has its own describe below.
const notAboutTheRepository = (notice: string): boolean => {
  return !notice.startsWith('git init:') && !notice.startsWith('no git repository');
};

// husky's `prepare` exits 0 even when `.git` cannot be found, so a project can ship hooks that never run.
describe('the repository the hooks install into', () => {
  const noticesFromAgent = async (): Promise<string[]> => {
    const notices: string[] = [];

    await runPipeline({
      name: 'demo-app',
      cwd,
      answers: answersFor({}),
      skip: ['scaffold', 'lint', 'package', 'install', 'fix'],
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
});

// The fix pass never takes a generated project down with it.
describe('the eslint --fix pass', () => {
  const noticesFrom = async (skip: Stage[]): Promise<string[]> => {
    const notices: string[] = [];

    await runPipeline({
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
    expect(await noticesFrom(['scaffold', 'install'])).toEqual(['next: pnpm install && pnpm lint:fix']);
  });

  it('installs with the package manager from the answers, not a hardcoded pnpm', async () => {
    // The notice, since a real install takes minutes and reaches the network.
    const notices: string[] = [];

    await runPipeline({
      name: 'demo-app',
      cwd,
      answers: {
        ...answersFor({}),
        packageManager: 'bun',
      },
      skip: ['scaffold', 'install', 'fix'],
      onNotice: (message) => {
        notices.push(message);
      },
    });

    expect(notices.filter(notAboutTheRepository)).toEqual(['next: bun install && bun run lint:fix']);
  });

  it('does not run when the lint stage was skipped', async () => {
    expect(await noticesFrom(['scaffold', 'lint', 'install'])).toEqual([]);
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

  it('runs eslint and reports the files it changed', async () => {
    await plantedEslint(
      '[{"filePath":"a.ts","output":"fixed"},{"filePath":"b.ts"}]',
      // Exit 1 means findings remain, the normal outcome.
      1,
    );

    expect(await noticesFrom(['scaffold', 'install'])).toEqual(['eslint --fix: 1 file changed']);
  });

  it('counts more than one, and says so in the plural', async () => {
    await plantedEslint('[{"output":"a"},{"output":"b"},{"filePath":"c.ts"}]', 1);

    expect(await noticesFrom(['scaffold', 'install'])).toEqual(['eslint --fix: 2 files changed']);
  });

  it('reports a clean pass rather than zero files', async () => {
    await plantedEslint('[{"filePath":"a.ts"}]', 0);

    expect(await noticesFrom(['scaffold', 'install'])).toEqual(['eslint --fix: nothing to fix']);
  });

  // Unreadable formatter output counts as nothing fixed.
  it.each([
    ['output that is not JSON at all', 'Oops! Something went wrong.'],
    ['JSON that is not a result list', '{"results":[]}'],
  ])('survives %s', async (_case, printed) => {
    await plantedEslint(printed, 0);

    expect(await noticesFrom(['scaffold', 'install'])).toEqual(['eslint --fix: nothing to fix']);
    expect(await exists(join(cwd, 'eslint.config.js'))).toBe(true);
  });

  it('degrades to a warning when eslint cannot run', async () => {
    const bin = join(cwd, 'node_modules', '.bin');

    await mkdir(bin, { recursive: true });
    // Exit 2 is a configuration failure.
    await writeFile(join(bin, 'eslint'), '#!/usr/bin/env node\nprocess.exit(2);\n', 'utf8');
    await chmod(join(bin, 'eslint'), 0o755);

    const notices = await noticesFrom(['scaffold', 'install']);

    expect(notices).toEqual(['eslint --fix could not run; run it yourself once dependencies are installed']);
    expect(await exists(join(cwd, 'eslint.config.js'))).toBe(true);
  });

  // Measured: 261 stylelint findings across the three Vite templates before this pass.
  const plantedStylelint = async (): Promise<void> => {
    const bin = join(cwd, 'node_modules', '.bin');

    await mkdir(bin, { recursive: true });
    await writeFile(
      join(bin, 'eslint'),
      '#!/usr/bin/env node\nconsole.log("[]");\nprocess.exit(0);\n',
      'utf8',
    );
    await writeFile(
      join(bin, 'stylelint'),
      [
        '#!/usr/bin/env node',
        "require('node:fs').writeFileSync('stylelint-argv', process.argv.slice(2).join(' '));",
      ].join('\n'),
      'utf8',
    );
    await chmod(join(bin, 'eslint'), 0o755);
    await chmod(join(bin, 'stylelint'), 0o755);
  };

  const stylelintArgv = async (): Promise<string> => {
    return await readFile(join(cwd, 'stylelint-argv'), 'utf8');
  };

  it('fixes the stylesheets over the same glob lint:css gates', async () => {
    await plantedStylelint();
    await noticesFrom(['scaffold', 'install']);

    expect(await stylelintArgv()).toBe('src/**/*.css --fix --allow-empty-input');
  });

  it('names the SFC extension on a target whose styles live in its components', async () => {
    await plantedStylelint();

    await runPipeline({
      name: 'demo-app',
      cwd,
      answers: answersFor({ target: 'vue' }),
      skip: ['scaffold', 'install'],
    });

    expect(await stylelintArgv()).toBe('src/**/*.{css,vue} --fix --allow-empty-input');
  });

  it('warns rather than failing a generate when stylelint cannot spawn', async () => {
    const bin = join(cwd, 'node_modules', '.bin');

    await mkdir(bin, { recursive: true });
    await writeFile(
      join(bin, 'eslint'),
      '#!/usr/bin/env node\nconsole.log("[]");\nprocess.exit(0);\n',
      'utf8',
    );
    await chmod(join(bin, 'eslint'), 0o755);
    // Present but not executable: the one shape where `spawnSync` reports an error rather than an exit code.
    await writeFile(join(bin, 'stylelint'), 'not a program\n', 'utf8');
    await chmod(join(bin, 'stylelint'), 0o644);

    expect(await noticesFrom(['scaffold', 'install'])).toEqual([
      'eslint --fix: nothing to fix',
      'stylelint --fix could not run; run it yourself once dependencies are installed',
    ]);
    expect(await exists(join(cwd, 'eslint.config.js'))).toBe(true);
  });
});

// Both routes read the directory the same way: `--skip-scaffold` once wrote a second stylesheet nothing imports.
describe('what create and sync each discover about a project', () => {
  const withTailwind = (): Answers => {
    return answersFor({ libraries: ['tailwind'] });
  };

  const plant = async (relative: string, text = ''): Promise<void> => {
    await mkdir(join(cwd, relative, '..'), { recursive: true });
    await writeFile(join(cwd, relative), text, 'utf8');
  };

  const styleEntriesIn = (targets: string[]): string[] => {
    return targets.filter((target) => {
      return STYLE_ENTRY_CANDIDATES.includes(target);
    });
  };

  const generateWith = async (answers: Answers): Promise<string[]> => {
    const written: string[] = [];

    await runPipeline({
      name: 'demo-app',
      cwd,
      answers,
      skip: ['scaffold', 'install'],
      onWrite: (path) => {
        written.push(path);
      },
    });

    return written;
  };

  it("merges tailwind into the project's own stylesheet rather than writing a second one", async () => {
    await plant('src/styles/tailwind.css');

    const written = await generateWith(withTailwind());

    expect(styleEntriesIn(written)).toEqual(['src/styles/tailwind.css']);
    expect(await exists(join(cwd, 'src/index.css'))).toBe(false);
  });

  // `sync` is asked before anything is written, so this compares what each made of the same directory.
  it('plans the same stylesheet as sync does, from the same directory', async () => {
    await plant('src/styles/tailwind.css');

    const planned = (await planSync(cwd, withTailwind())).entries.map((entry) => {
      return entry.target;
    });

    expect(styleEntriesIn(await generateWith(withTailwind())))
      .toEqual(styleEntriesIn(planned));
  });

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
  it('writes none without a router', async () => {
    const written = await fresh({});

    expect(written).not.toContain('src/main.tsx');
    expect(written).not.toContain('src/routes/router.tsx');
  });

  it('writes the react-router table and entry, and nothing of tanstack', async () => {
    const written = await fresh({ router: 'react-router' });

    expect(written).toContain('src/main.tsx');
    expect(written).toContain('src/routes/router.tsx');
    expect(written).not.toContain('src/routeTree.gen.ts');
    expect(await readFile(join(cwd, 'src/main.tsx'), 'utf8')).toContain("from 'react-router'");
  });

  it('writes the tanstack routes, entry and committed tree', async () => {
    const written = await fresh({ router: 'tanstack-router' });

    expect(written).toEqual(expect.arrayContaining([
      'src/main.tsx',
      'src/routes/__root.tsx',
      'src/routes/index.tsx',
      'src/routeTree.gen.ts',
    ]));
    expect(written).not.toContain('src/routes/router.tsx');
  });

  it('writes the NativeWind metro config only when tailwind was chosen on React Native', async () => {
    expect(await fresh({
      target: 'react-native',
      libraries: ['tailwind'],
    })).toContain('metro.config.js');
    expect(await fresh({
      target: 'react-native',
      libraries: [],
    })).not.toContain('metro.config.js');
  });
});
