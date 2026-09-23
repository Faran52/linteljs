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

import { MANAGED_PATH } from '@config/constants';
import { type Artifact } from '@config/types';

import { valuesOf } from '@utils/objectUtils';

import {
  type Agent,
  ANSWERS,
  type Answers,
  CONFIG_PATH,
  type Data,
  DEFAULT_ANSWERS,
  type Library,
  type PackageManager,
  type Styling,
  type TargetId,
  type Testing,
  type TypeSafety,
} from '@answers';
import {
  managedPathsReader,
  shippedAssetsReader,
  TEMPLATES_ROOT,
} from '@disk';

import { setupTestsPath } from './always/banned-patterns/bannedPatternsEmitter';
import { buildArtifacts, seedArtifacts } from './registry';

interface AnswerOverrides {
  agents?: Agent[];
  target?: TargetId;
  testing?: Testing;
  libraries?: Library[];
  typeSafety?: TypeSafety;
  packageManager?: PackageManager;
  styling?: Styling;
  data?: Data;
}

// Only the path and the text are read back off a composed artifact.
interface ScannedArtifact {
  target: string;
  text: string;
}

const TARGET_IDS = valuesOf(ANSWERS.target.values);

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

// The empty string where the answers emit no such artifact.
const textFor = async (overrides: AnswerOverrides, target: string): Promise<string> => {
  const artifact = artifactFor(overrides, target);

  if (artifact === undefined) {
    return '';
  }

  return await shippedAssetsReader(artifact.content);
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

  // Birth-only: both extension migrations rewrote `vite.config.ts` wholesale, and `preserve` keeps `--force` off it.
  it('hands the build configs to the project after the first write', () => {
    expect(artifactFor({}, 'vite.config.ts')?.preserve).toBe(true);
    expect(artifactFor({}, 'vitest.config.ts')?.preserve).toBe(true);
    expect(artifactFor({ target: 'astro' }, 'astro.config.mjs')?.preserve).toBe(true);
  });

  // The lint and package configs carry the standard itself, so a release has to reach them.
  it('keeps emitting the configs that carry the standard', () => {
    expect(artifactFor({}, 'eslint.config.js')?.preserve).toBeUndefined();
    expect(artifactFor({}, 'stylelint.config.js')?.preserve).toBeUndefined();
    expect(artifactFor({}, 'tsconfig.json')?.preserve).toBeUndefined();
  });

  // `package.json` and `README.md` stay out. `.gitignore` and `pnpm-workspace.yaml` are merged artifacts: as stage
  // writes, the 1.2.0 `peerDependencyRules` allowance reached no existing project.
  it('claims the merges it owns half of, and not the files a project owns', () => {
    const targets = targetsOf({});

    expect(targets).toContain('.gitignore');
    expect(targets).toContain('pnpm-workspace.yaml');
    // `package.json` joined them in 1.3.2, after two migrations added plugins by hand their answers already implied.
    expect(targets).toContain('package.json');
    expect(targets).not.toContain('README.md');
    expect(artifactFor({}, 'CLAUDE.md')?.preserve).toBe(true);
  });

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
        // Only a copied artifact names files on disk.
        return 'sources' in artifact.content
          ? artifact.content.sources.map((source) => {
              return access(join(TEMPLATES_ROOT, source), constants.R_OK);
            })
          : [];
      }));

      expect(artifacts.length).toBeGreaterThan(0);
    });

    /**
     * What replaced the `source` a record used to carry beside each `target`: the asset is derived from the
     * destination now, so the derivation is what has to be held against disk. Every answer that opens a starter file
     * is asked for, since a browser and a router each pick a different asset for one destination.
     */
    it(`resolves every seeded starter for ${target}`, async () => {
      const cases: Answers[] = [
        answersFor({ target }),
        {
          ...answersFor({ target }),
          browser: 'firefox',
        },
        {
          ...answersFor({ target }),
          router: 'react-router',
        },
        {
          ...answersFor({ target }),
          router: 'tanstack-router',
        },
        {
          ...answersFor({
            target,
            libraries: [],
            styling: 'tailwind',
          }),
          surfaces: ['popup', 'background', 'devtools-panel'],
        },
      ];

      const sources = cases.flatMap((answers) => {
        return seedArtifacts(answers, 'demo-app').flatMap((artifact) => {
          return 'sources' in artifact.content ? artifact.content.sources : [];
        });
      });

      await Promise.all([...new Set(sources)].map(async (source) => {
        await access(join(TEMPLATES_ROOT, source), constants.R_OK);
      }));

      expect(sources.length).toBeGreaterThan(0);
    });
  }
});

// typeSafety reaches three places that must agree: the checker's constant, the rule file, and the relaxed vocabulary.
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

// Nothing else runs the checker against starter code: `pnpm check` never invokes it and e2e never commits.
describe('the emitted checker against the emitted starter code', () => {
  const CHECKER = 'scripts/checkBannedPatterns.ts';

  // A composed artifact is only scannable once composed.
  const scannedFor = async (target: TargetId): Promise<ScannedArtifact[]> => {
    const files = [
      ...buildArtifacts(answersFor({
        target,
        libraries: [],
        data: 'tanstack-query',
      })).flatMap((artifact) => {
        return 'text' in artifact.content || artifact.target === CHECKER
          ? []
          : [{
              target: artifact.target,
              read: async () => {
                return await shippedAssetsReader(artifact.content);
              },
            }];
      }),
      // Through `seedArtifacts` rather than off the record: the record names the destination and the emitter derives
      // the asset from it, so reading the record directly would scan a path nothing writes.
      ...seedArtifacts(answersFor({ target }), 'demo-app').flatMap((artifact) => {
        return 'sources' in artifact.content
          ? artifact.content.sources.map((source) => {
              return {
                target: artifact.target,
                read: async () => {
                  return await readFile(join(TEMPLATES_ROOT, source), 'utf8');
                },
              };
            })
          : [];
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
    const cwd = await mkdtemp(join(tmpdir(), 'linteljs-floor-'));

    try {
      const checker = await textFor({ target }, CHECKER);
      const scanned = await scannedFor(target);

      await mkdir(join(cwd, dirname(CHECKER)), { recursive: true });
      await writeFile(join(cwd, CHECKER), checker, 'utf8');

      for (const file of scanned) {
        await mkdir(dirname(join(cwd, file.target)), { recursive: true });
        await writeFile(join(cwd, file.target), file.text, 'utf8');
      }

      /*
       * A checker spawned with no files exits 0, so the assertion below says nothing until the list is real. Both
       * arms of `scannedFor` have to land: the generated scripts and the starter tree. This is `lint:starters`
       * reporting zero findings over files it never read, in miniature, and it passed with `scanned` emptied.
       */
      expect([
        scanned.some(({ target: path }) => {
          return path === 'scripts/typecheckStaged.ts';
        }),
        scanned.filter(({ target: path }) => {
          return path.startsWith('src/');
        }).length > 1,
      ]).toEqual([true, true]);

      // Relative paths, which is what lint-staged hands it.
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

// The setup is composed from a target source plus per-answer fragments.
describe('the shipped test setup', () => {
  const FRAGMENTS = ['fragments/test-setup/setupTests.router.ts', 'fragments/test-setup/setupTests.tanstackQuery.ts'];

  const setupFor = async (overrides: AnswerOverrides): Promise<string> => {
    return await textFor(overrides, setupTestsPath({
      ...DEFAULT_ANSWERS,
      ...overrides,
    }));
  };

  it('ships the router mocks to every target with a binding they could stand in for', async () => {
    expect(await setupFor({ target: 'react' })).toContain('export const navigateMock');
    expect(await setupFor({ target: 'solid' })).toContain('export const navigateMock');
    expect(await setupFor({ target: 'react-native' })).toContain('export const navigateMock');
  });

  /*
   * Next's router is not a binding a project installs, it is the framework, and what its header reads is
   * `usePathname`. So it stands a different thing in, which is why the record names a fragment rather than
   * setting a flag.
   */
  it('stands in for what next reads instead, which is the pathname', async () => {
    const setup = await setupFor({ target: 'next' });

    expect(setup).toContain('export const pathnameMock');
    expect(setup).toContain("vi.mock('next/navigation'");
    expect(setup).not.toContain('navigateMock');
  });

  it('ships them to no target whose framework has none of the three', async () => {
    expect(await setupFor({ target: 'vue' })).not.toContain('navigateMock');
    expect(await setupFor({ target: 'svelte' })).not.toContain('navigateMock');
    expect(await setupFor({ target: 'angular' })).not.toContain('navigateMock');
    expect(await setupFor({ target: 'webextension' })).not.toContain('navigateMock');
  });

  // A mock of a package the project never installed costs nothing: the factory runs only on import.
  it('mocks all three bindings at once, since linteljs installs none of them', async () => {
    const setup = await setupFor({ target: 'react' });

    expect(setup).toContain("vi.mock('react-router'");
    expect(setup).toContain("vi.mock('@tanstack/react-router'");
    expect(setup).toContain("vi.mock('@tanstack/solid-router'");
  });

  it('appends the query defaults only when tanstack-query was chosen', async () => {
    expect(await setupFor({})).not.toContain('TEST_QUERY_OPTIONS');
    expect(await setupFor({
      libraries: ['zod'],
      styling: 'tailwind',
    })).not.toContain('TEST_QUERY_OPTIONS');
    expect(await setupFor({
      libraries: [],
      data: 'tanstack-query',
    })).toContain('TEST_QUERY_OPTIONS');
  });

  it('appends them on every target, including the one whose setup is not the shared file', async () => {
    expect(await setupFor({
      target: 'angular',
      libraries: [],
      data: 'tanstack-query',
    })).toContain('TEST_QUERY_OPTIONS');
    expect(await setupFor({
      target: 'react-native',
      libraries: [],
      data: 'tanstack-query',
    })).toContain('TEST_QUERY_OPTIONS');
  });

  it('keeps the target own setup ahead of both fragments', async () => {
    const setup = await setupFor({
      target: 'react-native',
      libraries: [],
      data: 'tanstack-query',
    });

    expect(setup.indexOf("vi.mock('expo-device'")).toBeLessThan(setup.indexOf('navigateMock'));
    expect(setup.indexOf('navigateMock')).toBeLessThan(setup.indexOf('TEST_QUERY_OPTIONS'));
  });

  // An import in a fragment lands after the statements of the setup it follows.
  it.each(FRAGMENTS)('keeps %s import-free', async (fragment) => {
    const text = await readFile(join(TEMPLATES_ROOT, fragment), 'utf8');

    expect(text).not.toMatch(/^import\s/mu);
  });

  it('ships no setup, and so no fragment, to a project that declined tests', () => {
    expect(targetsOf({
      testing: 'none',
      libraries: [],
      data: 'tanstack-query',
    })).not.toContain('__mocks__/setupTests.tsx');
  });

  // The project adds its own mocks here, so a sync installs it when missing and never overwrites it.
  // A React project generated before the setup became `.tsx` still holds `.ts`, preserved.
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

// What a `create` run plants and `sync` never touches, kept in this file because the two lists come out of the
// same registry and a reader comparing them should not have to open a second one.
const seedFor = (overrides: Partial<Answers> = {}): Artifact[] => {
  return seedArtifacts({
    ...DEFAULT_ANSWERS,
    ...overrides,
  }, 'demo-app');
};

const targetsIn = (artifacts: Artifact[]): string[] => {
  return artifacts.map((artifact) => {
    return artifact.target;
  });
};

const seedTargetsFor = (overrides: Partial<Answers> = {}): string[] => {
  return seedFor(overrides).map((artifact) => {
    return artifact.target;
  });
};

const find = (artifacts: Artifact[], target: string): Artifact => {
  const found = artifacts.find((artifact) => {
    return artifact.target === target;
  });

  if (found === undefined) {
    throw new Error(`no artifact for ${target}`);
  }

  return found;
};

describe('the recorded config', () => {
  // A run that dies between the two leaves the answers recorded rather than the dependencies they imply.
  it('comes first, in the package stage', () => {
    const seeded = seedFor();

    expect(seeded[0]?.target).toBe(CONFIG_PATH);
    expect(seeded[0]?.stage).toBe('package');
  });

  // `sync` reads this file rather than writing it, so it is seeded rather than built.
  it('is rewritten on any run rather than at birth alone', () => {
    expect(find(seedFor(), CONFIG_PATH).fresh).toBeUndefined();
  });
});

describe('the README', () => {
  it('is filled from the shipped template rather than emitted whole', () => {
    const readme = find(seedFor(), 'README.md');

    expect(readme.content).toHaveProperty('sources', ['fragments/readme/template.md']);
  });

  // `--skip-scaffold` adopts a project whose README describes the toolchain the later stages replaced.
  it('is rewritten on any run rather than at birth alone', () => {
    expect(find(seedFor(), 'README.md').fresh).toBeUndefined();
  });

  it('names the project and the toolchain the stages leave behind', () => {
    const readme = find(seedFor(), 'README.md');

    if (!('transform' in readme.content)) {
      throw new Error('README.md carries no transform');
    }

    const filled = readme.content.transform(
      '# {{PROJECT_NAME}}\n\n{{TARGET_LABEL}}\n\n{{RUN}} lint\n\n{{CHECK_CHAIN}}\n\n{{TEST_ROWS}}\n',
      null,
    );

    expect(filled).toContain('demo-app');
    expect(filled).toContain('React (Vite)');
    expect(filled).not.toContain('{{');
  });
});

describe('the manifest', () => {
  it('is absent for a target that has none', () => {
    expect(seedTargetsFor()).not.toContain('manifest.json');
  });

  // Birth only: a manifest's permissions and store metadata are the project's to keep.
  it('is written once for the packaged browser and never again', () => {
    const seeded = seedFor({ target: 'webextension' });

    expect(find(seeded, 'manifest.json').fresh).toBe(true);
  });

  // Chrome rejects `browser_specific_settings` and AMO requires it, so the second is named for its browser.
  it('names the second browser in its own filename', () => {
    const seeded = seedFor({
      target: 'webextension',
      browser: 'chrome',
      browsers: ['chrome', 'firefox'],
    });

    expect(targetsIn(seeded)).toContain('manifest.json');
    expect(targetsIn(seeded)).toContain('manifest.firefox.json');
  });
});

describe('the starter source', () => {
  // A router replaces the scaffolder's own entry; without one the scaffolder's stands.
  it('is birth only, so a later run leaves the project its own', () => {
    const entry = find(seedFor({ router: 'react-router' }), 'src/main.tsx');

    expect(entry.fresh).toBe(true);
  });

  it('takes the file the chosen router needs and leaves the others', () => {
    const reactRouter = seedTargetsFor({ router: 'react-router' });

    expect(reactRouter).toContain('src/routes/router.tsx');
    expect(reactRouter).not.toContain('src/routes/__root.tsx');
  });

  // A test helper is a test artifact, and `testing: none` is declining it.
  it('declines a starter test when the testing answer declined one', () => {
    const covered = seedFor({ target: 'webextension' });
    const none = seedFor({
      target: 'webextension',
      testing: 'none',
    });

    expect(targetsIn(covered)).toContain('src/counter.test.ts');
    expect(targetsIn(none)).not.toContain('src/counter.test.ts');
  });

  // Skipped rather than failed: a rearranged starter costs the example, not a broken import.
  it('names the file a starter test covers, so an absent one is skipped', () => {
    const test = find(seedFor({ target: 'webextension' }), 'src/counter.test.ts');

    expect(test.requires).toEqual(['src/counter.ts']);
  });

  // A button is what a store or a form gives the page to press; neither, and nothing presses anything.
  it('writes the button for a store or a form, and for neither writes none', () => {
    expect(seedTargetsFor({})).not.toContain('src/components/ui/button/Button.tsx');
    expect(seedTargetsFor({ store: 'zustand' })).toContain('src/components/ui/button/Button.tsx');
    expect(seedTargetsFor({ form: 'tanstack-form' })).toContain('src/components/ui/button/Button.tsx');
  });

  it('writes the contact page, its control and its api only with a form', () => {
    const withForm = seedTargetsFor({ form: 'react-hook-form' });

    expect(withForm).toContain('src/pages/contact/ContactPage.tsx');
    expect(withForm).toContain('src/components/ui/text-input/TextInput.tsx');
    expect(withForm).toContain('src/lib/apis/contact/api.ts');
    expect(seedTargetsFor({})).not.toContain('src/pages/contact/ContactPage.tsx');
  });

  /*
   * One file per answer rather than one per combination: the page and its hook are the same in every data layer,
   * and the api is what varies. Asserting the asset rather than the destination is what says which spelling won.
   */
  it('takes the api spelling the data answer asks for', () => {
    const sourceOf = (overrides: Parameters<typeof seedFor>[0], target: string): string => {
      const { content } = find(seedFor(overrides), target);

      return 'sources' in content ? content.sources.join() : '';
    };

    expect(sourceOf({ form: 'tanstack-form' }, 'src/lib/apis/contact/api.ts'))
      .toBe('starter-source/react/src/lib/apis/contact/api.ts');
    expect(sourceOf({
      form: 'tanstack-form',
      data: 'tanstack-query',
    }, 'src/lib/apis/contact/api.ts'))
      .toBe('starter-source/react/tanstack-query/src/lib/apis/contact/api.ts');
    expect(sourceOf({
      form: 'tanstack-form',
      store: 'redux-toolkit',
      data: 'rtk-query',
    }, 'src/lib/apis/contact/api.ts'))
      .toBe('starter-source/react/rtk-query/src/lib/apis/contact/api.ts');
  });

  /*
   * The same shape on the three targets that ported it, because the gates are per record rather than shared: each
   * offers one form library and one data layer, and each spells its pages and its control its own way.
   */
  describe.each([
    {
      target: 'solid' as const,
      page: 'src/pages/contact/ContactPage.tsx',
      binding: 'src/pages/contact/useContactForm.ts',
      control: 'src/components/ui/text-input/TextInput.tsx',
      button: 'src/components/ui/button/Button.tsx',
      routes: 'src/pages/routes.tsx',
      barrel: 'src/components/ui/index.ts',
    },
    {
      target: 'vue' as const,
      page: 'src/views/ContactView.vue',
      binding: 'src/views/useContactForm.ts',
      control: 'src/components/ui/text-input/TextInput.vue',
      button: 'src/components/ui/app-button/AppButton.vue',
      routes: 'src/views/routes.ts',
      barrel: 'src/lib/apis/contact/index.ts',
    },
    {
      target: 'svelte' as const,
      page: 'src/routes/contact/+page.svelte',
      binding: 'src/routes/contact/useContactForm.ts',
      control: 'src/components/ui/text-input/TextInput.svelte',
      button: 'src/components/ui/button/Button.svelte',
      routes: 'src/config/routes.ts',
      barrel: 'src/lib/apis/contact/index.ts',
    },
  ])('the contact demo on $target', ({
    target,
    page,
    binding,
    control,
    button,
    routes,
    barrel,
  }) => {
    const sourceOf = (overrides: Partial<Answers>, wanted: string): string => {
      const { content } = find(seedFor({
        target,
        form: 'tanstack-form',
        ...overrides,
      }), wanted);

      return 'sources' in content ? content.sources.join() : '';
    };

    it('writes the page, its binding, its control and the button only with a form', () => {
      const withForm = seedTargetsFor({
        target,
        form: 'tanstack-form',
      });

      expect(withForm).toContain(page);
      expect(withForm).toContain(binding);
      expect(withForm).toContain(control);
      expect(withForm).toContain(button);
      expect(withForm).toContain(barrel);
      expect(seedTargetsFor({ target })).not.toContain(page);
    });

    // One route list, in the spelling the form answer asks for, so the header and the router follow it together.
    it('adds contact to the one route list', () => {
      expect(sourceOf({}, routes)).toBe(`starter-source/${target}/with-form/${routes}`);

      const { content } = find(seedFor({ target }), routes);

      expect('sources' in content ? content.sources.join() : '')
        .toBe(`starter-source/${target}/${routes}`);
    });

    // Zod replaces the rule set, and nothing else: the form that binds it and the api that refuses on it both stay.
    it('takes the zod spelling of the rules', () => {
      expect(sourceOf({ libraries: [] }, 'src/lib/apis/contact/schemas.ts'))
        .toBe('starter-source/shared/src/lib/apis/contact/schemas.ts');
      expect(sourceOf({ libraries: ['zod'] }, 'src/lib/apis/contact/schemas.ts'))
        .toBe('starter-source/shared/zod/src/lib/apis/contact/schemas.ts');
    });

    it('takes the api spelling the data answer asks for', () => {
      expect(sourceOf({}, 'src/lib/apis/contact/api.ts'))
        .toBe(`starter-source/${target}/src/lib/apis/contact/api.ts`);
      expect(sourceOf({ data: 'tanstack-query' }, 'src/lib/apis/contact/api.ts'))
        .toBe(`starter-source/${target}/tanstack-query/src/lib/apis/contact/api.ts`);
    });
  });

  /*
   * SvelteKit's data slot is a component rather than a plugin or a JSX element, so a suite that needs it around
   * its subject needs one of its own. It is a test helper, so a project that declined tests receives none.
   */
  it('writes the svelte data wrapper only for a form with a suite', () => {
    expect(seedTargetsFor({
      target: 'svelte',
      form: 'tanstack-form',
    })).toContain('__mocks__/WithData.svelte');
    expect(seedTargetsFor({
      target: 'svelte',
      form: 'tanstack-form',
      testing: 'none',
    })).not.toContain('__mocks__/WithData.svelte');
    expect(seedTargetsFor({ target: 'svelte' })).not.toContain('__mocks__/WithData.svelte');
  });

  /*
   * Next's own block rather than a row in the table above, because what varies is not only the destination but
   * which tree each file comes from: the document and the routing are Next's, the primitives and the store are
   * React's to the byte, and the rule tables have no framework in them at all.
   */
  describe('the contact demo on next', () => {
    const sourceOf = (overrides: Partial<Answers>, wanted: string): string => {
      const { content } = find(seedFor({
        target: 'next',
        form: 'tanstack-form',
        ...overrides,
      }), wanted);

      return 'sources' in content ? content.sources.join() : '';
    };

    it('writes the route, its binding, its control and the button only with a form', () => {
      const withForm = seedTargetsFor({
        target: 'next',
        form: 'tanstack-form',
      });

      expect(withForm).toContain('src/app/contact/page.tsx');
      expect(withForm).toContain('src/app/contact/useContactForm.ts');
      expect(withForm).toContain('src/components/ui/text-input/TextInput.tsx');
      expect(withForm).toContain('src/components/ui/button/Button.tsx');
      expect(seedTargetsFor({ target: 'next' })).not.toContain('src/app/contact/page.tsx');
    });

    it('takes the binding the form answer asks for', () => {
      expect(sourceOf({}, 'src/app/contact/useContactForm.ts'))
        .toBe('starter-source/next/tanstack-form/src/app/contact/useContactForm.ts');
      expect(sourceOf({ form: 'react-hook-form' }, 'src/app/contact/useContactForm.ts'))
        .toBe('starter-source/next/react-hook-form/src/app/contact/useContactForm.ts');
    });

    // The nav list has no framework in it, so it is the shared copy in both spellings.
    it('adds contact to the one page list', () => {
      expect(sourceOf({}, 'src/config/routes.ts'))
        .toBe('starter-source/shared/with-form/src/config/routes.ts');

      const { content } = find(seedFor({ target: 'next' }), 'src/config/routes.ts');

      expect('sources' in content ? content.sources.join() : '')
        .toBe('starter-source/shared/src/config/routes.ts');
    });

    it('takes react\'s api in the spelling the data answer asks for', () => {
      expect(sourceOf({}, 'src/lib/apis/contact/api.ts'))
        .toBe('starter-source/react/src/lib/apis/contact/api.ts');
      expect(sourceOf({ data: 'tanstack-query' }, 'src/lib/apis/contact/api.ts'))
        .toBe('starter-source/react/tanstack-query/src/lib/apis/contact/api.ts');
      expect(sourceOf({
        store: 'redux-toolkit',
        data: 'rtk-query',
      }, 'src/lib/apis/contact/api.ts'))
        .toBe('starter-source/react/rtk-query/src/lib/apis/contact/api.ts');
    });

    it('takes react\'s store, and the redux one that registers the query api', () => {
      expect(sourceOf({ store: 'zustand' }, 'src/lib/store/counter.ts'))
        .toBe('starter-source/react/zustand/src/lib/store/counter.ts');
      expect(sourceOf({ store: 'tanstack-store' }, 'src/lib/store/counter.ts'))
        .toBe('starter-source/react/tanstack-store/src/lib/store/counter.ts');
      expect(sourceOf({ store: 'redux-toolkit' }, 'src/lib/store/counter.ts'))
        .toBe('starter-source/react/redux-toolkit/src/lib/store/counter.ts');
      expect(sourceOf({
        store: 'redux-toolkit',
        data: 'rtk-query',
      }, 'src/lib/store/counter.ts'))
        .toBe('starter-source/react/rtk-query/src/lib/store/counter.ts');
    });

    // Both slots are Next's own, because the directive on them is what makes them the client boundary.
    it('keeps both client slots in its own tree', () => {
      expect(sourceOf({}, 'src/lib/providers/StoreProvider.tsx'))
        .toBe('starter-source/next/src/lib/providers/StoreProvider.tsx');
      expect(sourceOf({ store: 'redux-toolkit' }, 'src/lib/providers/StoreProvider.tsx'))
        .toBe('starter-source/next/redux-toolkit/src/lib/providers/StoreProvider.tsx');
      expect(sourceOf({}, 'src/lib/providers/DataProvider.tsx'))
        .toBe('starter-source/next/src/lib/providers/DataProvider.tsx');
      expect(sourceOf({ data: 'tanstack-query' }, 'src/lib/providers/DataProvider.tsx'))
        .toBe('starter-source/next/tanstack-query/src/lib/providers/DataProvider.tsx');
    });

    it('takes react\'s barrel in the spelling the answers reach', () => {
      const barrel = 'src/components/ui/index.ts';

      expect(sourceOf({}, barrel)).toBe('starter-source/react/with-form/src/components/ui/index.ts');

      const bare = find(seedFor({ target: 'next' }), barrel).content;
      const stored = find(seedFor({
        target: 'next',
        store: 'zustand',
      }), barrel).content;

      expect('sources' in bare ? bare.sources.join() : '')
        .toBe('starter-source/react/src/components/ui/index.ts');
      expect('sources' in stored ? stored.sources.join() : '')
        .toBe('starter-source/react/with-store/src/components/ui/index.ts');
    });

    // A store makes the home route a client component, which is a different file rather than a directive added.
    it('takes the home route the store answer asks for', () => {
      const withStore = find(seedFor({
        target: 'next',
        store: 'zustand',
      }), 'src/app/page.tsx').content;

      expect('sources' in withStore ? withStore.sources.join() : '')
        .toBe('starter-source/next/with-store/src/app/page.tsx');
      expect(sourceOf({}, 'src/app/page.tsx')).toBe('starter-source/next/src/app/page.tsx');
    });

    it('takes the styling answer\'s own token spelling', () => {
      expect(sourceOf({ styling: 'tailwind' }, 'src/styles/theme.css'))
        .toBe('starter-source/shared/tailwind/src/styles/theme.css');
      expect(sourceOf({ styling: 'stylex' }, 'src/styles/tokens.stylex.ts'))
        .toBe('starter-source/shared/stylex/src/styles/tokens.stylex.ts');
    });

    it('takes the zod spelling of the rules', () => {
      expect(sourceOf({ libraries: [] }, 'src/lib/apis/contact/schemas.ts'))
        .toBe('starter-source/shared/src/lib/apis/contact/schemas.ts');
      expect(sourceOf({ libraries: ['zod'] }, 'src/lib/apis/contact/schemas.ts'))
        .toBe('starter-source/shared/zod/src/lib/apis/contact/schemas.ts');
    });
  });

  // The barrel a form and a store each add to, on the target whose barrel is a component list.
  it('takes the solid barrel the answers ask for', () => {
    const sourceOf = (overrides: Partial<Answers>): string => {
      const { content } = find(seedFor({
        target: 'solid',
        ...overrides,
      }), 'src/components/ui/index.ts');

      return 'sources' in content ? content.sources.join() : '';
    };

    expect(sourceOf({})).toBe('starter-source/solid/src/components/ui/index.ts');
    expect(sourceOf({ store: 'tanstack-store' })).toBe('starter-source/solid/with-store/src/components/ui/index.ts');
    expect(sourceOf({ form: 'tanstack-form' })).toBe('starter-source/solid/with-form/src/components/ui/index.ts');
  });

  // RTK Query's middleware is what gives an endpoint its cache, so the store it rides has to register it.
  it('takes the redux store that registers the query api when both were chosen', () => {
    const { content } = find(seedFor({
      form: 'tanstack-form',
      store: 'redux-toolkit',
      data: 'rtk-query',
    }), 'src/lib/store/counter.ts');

    expect('sources' in content ? content.sources.join() : '')
      .toBe('starter-source/react/rtk-query/src/lib/store/counter.ts');
  });

  // The rules are one file, read by the form that binds them and the api that refuses on them.
  it('takes the zod schema where zod was chosen and the plain one otherwise', () => {
    const sourceOf = (libraries: Library[]): string => {
      const { content } = find(seedFor({
        form: 'tanstack-form',
        libraries,
      }), 'src/lib/apis/contact/schemas.ts');

      return 'sources' in content ? content.sources.join() : '';
    };

    expect(sourceOf(['zod'])).toBe('starter-source/shared/zod/src/lib/apis/contact/schemas.ts');
    expect(sourceOf([])).toBe('starter-source/shared/src/lib/apis/contact/schemas.ts');
  });
});

/*
 * A generated project keeps `managed.json` in version control, so the order of its entries is part of what this CLI
 * emits: move the comparator and every consumer's next `sync` is a diff of pure churn. Pinned as the ordering
 * property rather than as a snapshot of the file, so a new emitter costs nothing and a moved comparator costs a
 * red test. Read back through the reader `sync` itself uses, which is the order that actually matters.
 */
describe('the managed record', () => {
  const removableOf = async (overrides: AnswerOverrides): Promise<string[]> => {
    const cwd = await mkdtemp(join(tmpdir(), 'linteljs-managed-'));
    const written = join(cwd, MANAGED_PATH);

    await mkdir(dirname(written), { recursive: true });
    await writeFile(written, await textFor(overrides, MANAGED_PATH), 'utf8');

    const removable = await managedPathsReader(cwd);

    await rm(cwd, {
      recursive: true,
      force: true,
    });

    return removable;
  };

  // What a bare `.sort()` would give, spelled out because the lint layer rightly refuses to let a test write one.
  const byCodeUnit = (left: string, right: string): number => {
    return left < right ? -1 : Number(left > right);
  };

  // One case per group that contributes paths of its own: the agent files, the manager files and the rules.
  it.each<[string, AnswerOverrides]>([
    ['the defaults', {}],
    ['every agent, zod and npm', {
      agents: [
        'claude-code',
        'codex',
        'copilot',
        'cursor',
      ],
      libraries: ['zod'],
      packageManager: 'npm',
    }],
    ['no agent and no suite', {
      agents: [],
      testing: 'none',
    }],
    ['yarn', { packageManager: 'yarn' }],
  ])('orders %s by locale rather than by code unit', async (_case, overrides) => {
    const removable = await removableOf(overrides);

    expect(removable).toEqual([...removable].toSorted((left, right) => {
      return left.localeCompare(right, 'en');
    }));
    /*
     * Otherwise the assertion above holds vacuously. Only a mixed-case pair tells the two comparators apart, and
     * `SKILL.md` beside the `references/` in the same directory is the pair a bare `.sort()` reorders. A set that
     * loses its last such pair fails here rather than going quietly toothless.
     */
    expect(removable).not.toEqual([...removable].toSorted(byCodeUnit));
  });
});
