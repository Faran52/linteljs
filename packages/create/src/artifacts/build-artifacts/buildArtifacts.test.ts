import { spawnSync } from 'node:child_process';
import {
  access,
  constants,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { execPath } from 'node:process';

import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  DEFAULT_ANSWERS,
  type Library,
  type PackageManager,
  TARGET_IDS,
  type TargetId,
  type Testing,
  type TypeSafety,
} from '../../model/answers/answers';
import { targetFor } from '../../model/targets';
import { ASSETS_ROOT, contentOf } from '../../run/shipped-assets/shippedAssets';
import { type Artifact } from '../artifact/artifact';
import { setupTestsPath } from '../banned-patterns/checkerArtifact';

import { buildArtifacts } from './buildArtifacts';

interface AnswerOverrides {
  target?: TargetId;
  testing?: Testing;
  libraries?: Library[];
  typeSafety?: TypeSafety;
  packageManager?: PackageManager;
}

const answersFor = (overrides: AnswerOverrides): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };
};

const targetsOf = (overrides: AnswerOverrides): string[] => {
  return buildArtifacts(answersFor(overrides)).map((artifact) => {
    return artifact.target;
  });
};

const artifactFor = (overrides: AnswerOverrides, target: string): Artifact | undefined => {
  return buildArtifacts(answersFor(overrides)).find((artifact) => {
    return artifact.target === target;
  });
};

// Composed text, or the empty string where the answers emit no such artifact, which every caller asserts against.
const textFor = async (overrides: AnswerOverrides, target: string): Promise<string> => {
  const artifact = artifactFor(overrides, target);

  if (artifact === undefined) {
    return '';
  }

  return await contentOf(artifact.content);
};

describe('buildArtifacts', () => {
  it('gives React the react state rules and no other framework rules', () => {
    const targets = targetsOf({ target: 'react' });

    expect(targets).toContain('plugins/linteljs/skills/linteljs/references/react-state.md');
    expect(targets).toContain('plugins/linteljs/skills/linteljs/references/hooks-order.md');
    expect(targets).not.toContain('plugins/linteljs/skills/linteljs/references/solid-reactivity.md');
    expect(targets).not.toContain('plugins/linteljs/skills/linteljs/references/vue-reactivity.md');
  });

  it('gives each signal framework its own reactivity rule and no react-state', () => {
    const references = 'plugins/linteljs/skills/linteljs/references';

    expect(targetsOf({ target: 'solid' })).toContain(`${references}/solid-reactivity.md`);
    expect(targetsOf({ target: 'solid' })).not.toContain(`${references}/react-state.md`);
    expect(targetsOf({ target: 'vue' })).toContain(`${references}/vue-reactivity.md`);
    expect(targetsOf({ target: 'svelte' })).toContain(`${references}/svelte-reactivity.md`);
  });

  it('emits the zod rule only with zod', () => {
    const target = 'plugins/linteljs/skills/linteljs/references/type-standards-zod.md';

    expect(targetsOf({})).not.toContain(target);
    expect(targetsOf({ libraries: ['zod'] })).toContain(target);
  });

  it('drops the testing rule when there is nothing to govern', () => {
    expect(targetsOf({ testing: 'none' }))
      .not.toContain('plugins/linteljs/skills/linteljs/references/testing.md');
  });

  // Every project is a TypeScript project, so neither follows an answer any more.
  it('always ships the tsconfig and the staged typecheck', () => {
    expect(targetsOf({ testing: 'none' })).toEqual(
      expect.arrayContaining(['tsconfig.json', 'scripts/typecheckStaged.ts']),
    );
  });

  it('ships the shared plugin, checker, git hooks, and selected Claude declaration', () => {
    const targets = targetsOf({});

    expect(targets).toEqual(expect.arrayContaining([
      'CLAUDE.md',
      'plugins/linteljs/.claude-plugin/plugin.json',
      'plugins/linteljs/.claude-plugin/marketplace.json',
      'plugins/linteljs/skills/linteljs/SKILL.md',
      '.claude/settings.json',
      'scripts/checkBannedPatterns.ts',
      '.husky/pre-commit',
      '.husky/commit-msg',
      'lint-staged.config.js',
      'commitlint.config.js',
    ]));
    expect(targets.some((target) => {
      return target.startsWith('.claude/rules/') || target.startsWith('.claude/hooks/');
    })).toBe(false);
  });

  it('carries the emitted configs, tagged with the stage that writes each', () => {
    expect(artifactFor({}, 'eslint.config.js')?.stage).toBe('lint');
    expect(artifactFor({}, 'stylelint.config.js')?.stage).toBe('lint');
    expect(artifactFor({}, 'tsconfig.json')?.stage).toBe('package');
    expect(artifactFor({}, 'vite.config.ts')?.stage).toBe('standard');
    expect(artifactFor({}, 'vitest.config.ts')?.stage).toBe('standard');
  });

  it('leaves out the config a target or an answer does not have', () => {
    expect(targetsOf({ target: 'next' })).not.toContain('vite.config.ts');
    expect(targetsOf({ testing: 'none' })).not.toContain('vitest.config.ts');
  });

  /**
   * Birth-only, so a project that grew a real build keeps it. Both extension migrations rewrote `vite.config.ts`
   * wholesale, one for per-content-script IIFE bundles and a native host, the other for a second build mode, and the
   * emitted vitest excludes name entry points this CLI guessed rather than the ones a project has. Emitting either on
   * every sync flattens that, and `preserve` is also what keeps `--force` from doing it.
   */
  it('hands the build configs to the project after the first write', () => {
    expect(artifactFor({}, 'vite.config.ts')?.preserve).toBe(true);
    expect(artifactFor({}, 'vitest.config.ts')?.preserve).toBe(true);
    expect(artifactFor({ target: 'astro' }, 'astro.config.mjs')?.preserve).toBe(true);
  });

  // The lint and package configs are the opposite case: they carry the standard itself, so a release has to reach them.
  it('keeps emitting the configs that carry the standard', () => {
    expect(artifactFor({}, 'eslint.config.js')?.preserve).toBeUndefined();
    expect(artifactFor({}, 'stylelint.config.js')?.preserve).toBeUndefined();
    expect(artifactFor({}, 'tsconfig.json')?.preserve).toBeUndefined();
  });

  /**
   * `package.json` and `README.md` stay out: the first is reconciled by the package stage against what a project
   * already declares, and the second is a project's own the moment anyone edits it.
   *
   * A merge is not in that category, and treating it as one was a defect. `.gitignore` and `pnpm-workspace.yaml` are
   * merged artifacts, so `sync` applies them to a project that already exists; while they were written by a pipeline
   * stage instead, the `peerDependencyRules` allowance added in 1.2.0 reached new projects and no old one.
   */
  it('claims the merges it owns half of, and not the files a project owns', () => {
    const targets = targetsOf({});

    expect(targets).toContain('.gitignore');
    expect(targets).toContain('pnpm-workspace.yaml');
    /**
     * `package.json` joins them for the same reason they were converted in 1.3.2. It was reconciled by the package
     * stage, and `sync` writes artifacts rather than stages, so a dependency a release added reached every new
     * project and no existing one. Two of three reference migrations had to add plugins by hand that their own
     * answers already implied.
     */
    expect(targets).toContain('package.json');
    expect(targets).not.toContain('README.md');
    expect(artifactFor({}, 'CLAUDE.md')?.preserve).toBe(true);
  });

  // Nothing to merge into for the three managers with no workspace file of this shape.
  it('owns the workspace file only under pnpm', () => {
    expect(targetsOf({ packageManager: 'pnpm' })).toContain('pnpm-workspace.yaml');
    expect(targetsOf({ packageManager: 'npm' })).not.toContain('pnpm-workspace.yaml');
  });

  it('ships shared references without Claude path frontmatter', async () => {
    const target = 'plugins/linteljs/skills/linteljs/references/type-standards.md';

    expect(await textFor({ target: 'react' }, target)).not.toContain('paths:');
    expect(await textFor({ target: 'vue' }, target)).not.toContain('paths:');
  });

  it('marks every shell script and git hook executable', () => {
    for (const artifact of buildArtifacts(answersFor({}))) {
      const isScript = artifact.target.endsWith('.sh') || artifact.target.startsWith('.husky/');
      expect(artifact.executable === true).toBe(isScript);
    }
  });

  for (const target of TARGET_IDS) {
    it(`resolves every artifact for ${target}`, async () => {
      const artifacts = buildArtifacts(answersFor({
        target,
        libraries: ['zod'],
      }));

      await Promise.all(artifacts.flatMap((artifact) => {
        // Only a copied artifact names files on disk; emitted and merged both build their text.
        return 'sources' in artifact.content
          ? artifact.content.sources.map((source) => {
              return access(join(ASSETS_ROOT, source), constants.R_OK);
            })
          : [];
      }));

      expect(artifacts.length).toBeGreaterThan(0);
    });
  }
});

// typeSafety reaches three places that must agree: the checker's constant, the rule file's deviations section, and the
// relaxed vocabulary; disagreement is worse than either alone.
describe('typeSafety', () => {
  const contentAt = async (target: string, overrides: AnswerOverrides): Promise<string> => {
    return await textFor(overrides, target);
  };

  it('leaves the shipped checker on the strict floor by default', async () => {
    expect(await contentAt('scripts/checkBannedPatterns.ts', {}))
      .toContain("const TYPE_SAFETY: TypeSafety = 'strict';");
  });

  it('writes the relaxed floor into the checker when it was chosen', async () => {
    expect(await contentAt('scripts/checkBannedPatterns.ts', { typeSafety: 'relaxed' }))
      .toContain("const TYPE_SAFETY: TypeSafety = 'relaxed';");
  });

  it('appends the deviations section to the rule file only when relaxed', async () => {
    const target = 'plugins/linteljs/skills/linteljs/references/type-standards.md';

    expect(await contentAt(target, {}))
      .not.toContain('## Relaxed type safety');
    expect(await contentAt(target, { typeSafety: 'relaxed' }))
      .toContain('## Relaxed type safety');
  });

  it('keeps the standard itself in the rule file at either setting', async () => {
    expect(await contentAt(
      'plugins/linteljs/skills/linteljs/references/type-standards.md',
      { typeSafety: 'relaxed' },
    ))
      .toContain('## Types');
  });

  it('ships the named shapes only where the relaxed floor points at them', () => {
    expect(targetsOf({})).not.toContain('src/typings/customTypes.d.ts');
    expect(targetsOf({ typeSafety: 'relaxed' })).toContain('src/typings/customTypes.d.ts');
  });
});

// Nothing else runs the checker against starter code: `pnpm check` never invokes it, and the
// end-to-end suite never commits. React Native has twelve starter files that fail a strict floor.
describe('the emitted checker against the emitted starter code', () => {
  const CHECKER = 'scripts/checkBannedPatterns.ts';

  // Everything the pipeline puts on disk that the checker would be handed, at its own path and as its own text: an
  // artifact composed from several sources is only scannable once it has been composed.
  const scannedFor = async (target: TargetId): Promise<{ target: string;
    text: string; }[]> => {
    const record = targetFor(answersFor({ target }));

    const files = [
      ...buildArtifacts(answersFor({
        target,
        libraries: ['tanstack-query'],
      })).flatMap((artifact) => {
        return 'text' in artifact.content || artifact.target === CHECKER
          ? []
          : [{
              target: artifact.target,
              read: async () => {
                return await contentOf(artifact.content);
              },
            }];
      }),
      ...[...record.starterFiles ?? [], ...record.starterTests ?? []].map(({ source, target: path }) => {
        return {
          target: path,
          read: async () => {
            return await readFile(join(ASSETS_ROOT, source), 'utf8');
          },
        };
      }),
    ].filter(({ target: path }) => {
      return /\.[cm]?tsx?$/.test(path);
    });

    return await Promise.all(files.map(async ({ target: path, read }) => {
      return {
        target: path,
        text: await read(),
      };
    }));
  };

  it.each(TARGET_IDS)('passes on everything %s is generated with', async (target) => {
    const cwd = await mkdtemp(join(tmpdir(), 'lintel-floor-'));

    try {
      const checker = await textFor({ target }, CHECKER);
      const scanned = await scannedFor(target);

      await mkdir(join(cwd, dirname(CHECKER)), { recursive: true });
      await writeFile(join(cwd, CHECKER), checker, 'utf8');

      for (const file of scanned) {
        await mkdir(dirname(join(cwd, file.target)), { recursive: true });
        await writeFile(join(cwd, file.target), file.text, 'utf8');
      }

      // Relative paths, because that is what lint-staged hands it and what the skip list matches.
      const { status, stderr } = spawnSync(
        execPath,
        [CHECKER, ...scanned.map(({ target: path }) => {
          return path;
        })],
        {
          cwd,
          encoding: 'utf8',
        },
      );

      expect(`${String(status)}\n${stderr}`).toBe('0\n');
    }
    finally {
      await rm(cwd, {
        recursive: true,
        force: true,
      });
    }
  });
});

// The setup is one file built from a target source plus per-answer fragments, so what a project ends up with is only
// visible in the composed text.
describe('the shipped test setup', () => {
  const FRAGMENTS = ['mocks/setupTests.router.ts', 'mocks/setupTests.tanstackQuery.ts'];

  // `.tsx` on the React family, `.ts` elsewhere, so the lookup follows the same rule the emitter does.
  const setupFor = async (overrides: AnswerOverrides): Promise<string> => {
    return await textFor(overrides, setupTestsPath({
      ...DEFAULT_ANSWERS,
      ...overrides,
    }));
  };

  it('ships the router mocks to every target with a binding they could stand in for', async () => {
    expect(await setupFor({ target: 'react' })).toContain('export const navigateMock');
    expect(await setupFor({ target: 'next' })).toContain('export const navigateMock');
    expect(await setupFor({ target: 'solid' })).toContain('export const navigateMock');
    expect(await setupFor({ target: 'react-native' })).toContain('export const navigateMock');
  });

  it('ships them to no target whose framework has none of the three', async () => {
    expect(await setupFor({ target: 'vue' })).not.toContain('navigateMock');
    expect(await setupFor({ target: 'svelte' })).not.toContain('navigateMock');
    expect(await setupFor({ target: 'angular' })).not.toContain('navigateMock');
    expect(await setupFor({ target: 'webextension' })).not.toContain('navigateMock');
  });

  // Measured: the factory runs only on import, so a mock of a package the project never installed costs nothing.
  it('mocks all three bindings at once, since lintel installs none of them', async () => {
    const setup = await setupFor({ target: 'react' });

    expect(setup).toContain("vi.mock('react-router'");
    expect(setup).toContain("vi.mock('@tanstack/react-router'");
    expect(setup).toContain("vi.mock('@tanstack/solid-router'");
  });

  it('appends the query defaults only when tanstack-query was chosen', async () => {
    expect(await setupFor({})).not.toContain('TEST_QUERY_OPTIONS');
    expect(await setupFor({ libraries: ['zod', 'tailwind'] })).not.toContain('TEST_QUERY_OPTIONS');
    expect(await setupFor({ libraries: ['tanstack-query'] })).toContain('TEST_QUERY_OPTIONS');
  });

  it('appends them on every target, including the one whose setup is not the shared file', async () => {
    expect(await setupFor({
      target: 'angular',
      libraries: ['tanstack-query'],
    })).toContain('TEST_QUERY_OPTIONS');
    expect(await setupFor({
      target: 'react-native',
      libraries: ['tanstack-query'],
    })).toContain('TEST_QUERY_OPTIONS');
  });

  it('keeps the target own setup ahead of both fragments', async () => {
    const setup = await setupFor({
      target: 'react-native',
      libraries: ['tanstack-query'],
    });

    expect(setup.indexOf("vi.mock('expo-device'")).toBeLessThan(setup.indexOf('navigateMock'));
    expect(setup.indexOf('navigateMock')).toBeLessThan(setup.indexOf('TEST_QUERY_OPTIONS'));
  });

  // The invariant behind that order: an import in a fragment lands after the statements of the setup it follows.
  it.each(FRAGMENTS)('keeps %s import-free', async (fragment) => {
    const text = await readFile(join(ASSETS_ROOT, fragment), 'utf8');

    expect(text).not.toMatch(/^import\s/mu);
  });

  it('ships no setup, and so no fragment, to a project that declined tests', () => {
    expect(targetsOf({
      testing: 'none',
      libraries: ['tanstack-query'],
    })).not.toContain('__mocks__/setupTests.tsx');
  });

  // The project adds its own mocks to this file, so a sync must install it when missing and never overwrite it.
  /**
   * A React project generated before the setup file became `.tsx` still holds `.ts`, and it is
   * preserved, so the emitted vitest config has to point at the file that is actually there rather
   * than at the one this version would write.
   */
  it('keeps the setup spelling a project already has, config included', () => {
    const artifacts = buildArtifacts(
      answersFor({ target: 'react' }),
      {
        setupTests: ['__mocks__/setupTests.ts'],
        styleEntries: [],
      },
    );

    const targets = artifacts.map((artifact) => {
      return artifact.target;
    });

    expect(targets).toContain('__mocks__/setupTests.ts');
    expect(targets).not.toContain('__mocks__/setupTests.tsx');

    const vitest = artifacts.find((artifact) => {
      return artifact.target === 'vitest.config.ts';
    });

    expect(vitest?.content).toHaveProperty('text');
    expect(JSON.stringify(vitest?.content)).toContain('./__mocks__/setupTests.ts');
  });

  it('preserves the setup once the project owns it', () => {
    expect(artifactFor({}, '__mocks__/setupTests.tsx')?.preserve).toBe(true);
  });
});

// One runner, every target. A project either has a vitest config or has no suite.
describe('the test runner', () => {
  it('gives every target with a suite the same vitest config', () => {
    expect(targetsOf({ target: 'react' })).toContain('vitest.config.ts');
    expect(targetsOf({ target: 'react-native' })).toContain('vitest.config.ts');
  });

  it('gives a project that declined tests none at all', () => {
    expect(targetsOf({
      target: 'react-native',
      testing: 'none',
    })).not.toContain('vitest.config.ts');
  });

  it('writes no jest config for anything', () => {
    for (const target of TARGET_IDS) {
      expect(targetsOf({ target })).not.toContain('jest.config.js');
    }
  });
});
