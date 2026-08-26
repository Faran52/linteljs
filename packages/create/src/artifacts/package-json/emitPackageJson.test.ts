import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  DEFAULT_ANSWERS,
  type HostedFramework,
  LIBRARIES,
  type Library,
  type PackageManager,
  TARGET_IDS,
  type TargetId,
  type Testing,
} from '../../model/answers/answers';

import {
  buildDevDependencies,
  emitPackageJson,
  type PackageJson,
  parsePackageJson,
  patchPackageJson,
  versioned,
} from './emitPackageJson';
import { NODE_ENGINE, PACKAGE_MANAGER_VERSIONS } from './versions';

interface AnswerOverrides {
  target?: TargetId;
  hostedFramework?: HostedFramework;
  testing?: Testing;
  packageManager?: PackageManager;
  libraries?: Library[];
  store?: boolean;
}

const answersFor = (overrides: AnswerOverrides): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };
};

const SCAFFOLDED: PackageJson = {
  name: 'demo-app',
  version: '0.0.0',
  private: true,
  dependencies: { react: '^19.2.0' },
  devDependencies: {
    vite: '^7.2.0',
    prettier: '^3.6.0',
  },
  scripts: {
    dev: 'vite',
    build: 'vite build',
    lint: 'vite lint',
  },
};

// A silent skip on a missing VERSIONS entry is how @types/node and @vitest/eslint-plugin vanished from every generated
// project.
describe('versioned', () => {
  it('has a resolvable range for every dependency every target and library declares', () => {
    for (const target of TARGET_IDS) {
      for (const library of LIBRARIES) {
        expect(() => {
          // `store: true` so every target's store dependency is held to a VERSIONS entry too.
          return patchPackageJson({}, answersFor({
            target,
            libraries: [library],
            store: true,
          }));
        }).not.toThrow();
      }
    }
  });

  it('stops on a name it has no range for, rather than dropping it', () => {
    expect(() => {
      return versioned(['eslint', 'not-a-real-package']);
    }).toThrow('No version in VERSIONS for not-a-real-package');
  });

  // The empty string is how TANSTACK_QUERY_BINDINGS spells "this target has no binding", the one absence that must not
  // reach the lookup above.
  it('drops the empty name, sorts and de-duplicates what is left', () => {
    expect(Object.keys(versioned(['vitest', '', 'eslint', 'vitest']))).toEqual(['eslint', 'vitest']);
  });

  it('installs no TanStack binding for the one target that has none', () => {
    const patched = patchPackageJson(
      {},
      answersFor({
        target: 'webextension',
        libraries: ['tanstack-query'],
      }),
    );

    expect(patched.dependencies).toBeUndefined();
    expect(patched.devDependencies).toHaveProperty('@tanstack/eslint-plugin-query');
  });
});

describe('patchPackageJson', () => {
  it('removes recorded lintel metadata and preserves unrelated package properties', () => {
    const existing = {
      name: 'demo',
      description: 'kept',
      lintel: { target: DEFAULT_ANSWERS.target },
    };
    const patched = patchPackageJson(existing, DEFAULT_ANSWERS);

    expect(patched).not.toHaveProperty('lintel');
    expect(patched).toHaveProperty('description', 'kept');
  });

  it('never emits lintel metadata', () => {
    expect(JSON.parse(emitPackageJson({ name: 'demo' }, DEFAULT_ANSWERS)))
      .not.toHaveProperty('lintel');
  });

  it('keeps the scaffolder dependencies and its own scripts', () => {
    const patched = patchPackageJson(SCAFFOLDED, answersFor({}));

    expect(patched.dependencies?.['react']).toBe('^19.2.0');
    expect(patched.devDependencies?.['vite']).toBe('^7.2.0');
    expect(patched.scripts?.['dev']).toBe('vite');
    expect(patched.name).toBe('demo-app');
    expect(patched.private).toBe(true);
  });

  it('wins on the scripts lintel owns', () => {
    expect(patchPackageJson(SCAFFOLDED, answersFor({})).scripts?.['lint']).toBe('eslint .');
  });

  it('drops prettier, which @stylistic supersedes', () => {
    expect(patchPackageJson(SCAFFOLDED, answersFor({})).devDependencies).not.toHaveProperty(
      'prettier',
    );
  });

  /**
   * `create vite`'s React template declares the Babel plugin and the emitted `vite.config.ts` imports the SWC one, so
   * the inherited copy is dead weight. React Native declares the same package for its vitest transform, which is why
   * the filter runs on what the scaffolder left and not on the merged result.
   */
  it('drops an inherited plugin-react, and keeps the one a target asks for', () => {
    const scaffolded: PackageJson = {
      ...SCAFFOLDED,
      devDependencies: {
        ...SCAFFOLDED.devDependencies,
        '@vitejs/plugin-react': '^6.0.0',
      },
    };

    expect(patchPackageJson(scaffolded, answersFor({ target: 'react' })).devDependencies)
      .not.toHaveProperty('@vitejs/plugin-react');
    expect(patchPackageJson(scaffolded, answersFor({ target: 'react-native' })).devDependencies)
      .toHaveProperty('@vitejs/plugin-react');
  });

  // Reads the pin off the table rather than repeating it, so `versions.ts` stays the one file a bump touches.
  it('sets type, packageManager and engines', () => {
    const patched = patchPackageJson(SCAFFOLDED, answersFor({ packageManager: 'bun' }));
    const bun = PACKAGE_MANAGER_VERSIONS.bun;

    expect(patched.type).toBe('module');
    expect(patched.packageManager).toBe(`bun@${bun}`);
    expect(patched.engines).toEqual({
      node: NODE_ENGINE,
      bun: `>=${bun}`,
    });
  });

  // build is inherited from the scaffolder except React Native, whose eas build needs an account; expo export is the
  // local Metro bundle instead (measurements in DESIGN.md).
  it('preserves the scaffolder build script, and gates on it', () => {
    const patched = patchPackageJson(
      { scripts: { build: 'tsc -b && vite build' } },
      answersFor({ target: 'react' }),
    );

    expect(patched.scripts?.['build']).toBe('tsc -b && vite build');
    expect(patched.scripts?.['check']).toContain('pnpm build');
  });

  it('omits the test scripts and vitest when testing is declined', () => {
    const patched = patchPackageJson({}, answersFor({ testing: 'none' }));

    expect(patched.scripts).not.toHaveProperty('test');
    expect(patched.devDependencies).not.toHaveProperty('vitest');
  });

  it('installs the store dependency only on a yes', () => {
    const withStore = patchPackageJson({}, answersFor({ store: true }));
    const without = patchPackageJson({}, answersFor({}));
    const angular = patchPackageJson({}, answersFor({
      target: 'angular',
      store: true,
    }));

    expect(withStore.dependencies).toHaveProperty('zustand');
    expect(without.dependencies).toBeUndefined();
    expect(angular.dependencies).toHaveProperty('@ngrx/signals');
  });

  // Pinia arrives through create-vue's own --pinia flag, so a version pinned here would fight the scaffolder's.
  it('installs nothing for a store the scaffolder itself installs', () => {
    expect(patchPackageJson({}, answersFor({
      target: 'vue',
      store: true,
    })).dependencies)
      .toBeUndefined();
  });

  it('installs the framework binding for tanstack query, plus its lint plugin', () => {
    const vue = patchPackageJson({}, answersFor({
      target: 'vue',
      libraries: ['tanstack-query'],
    }));

    expect(vue.dependencies).toHaveProperty('@tanstack/vue-query');
    expect(vue.devDependencies).toHaveProperty('@tanstack/eslint-plugin-query');
  });

  it('installs the class linter beside the tailwind toolchain', () => {
    const withTailwind = patchPackageJson({}, answersFor({ libraries: ['tailwind'] }));
    const without = patchPackageJson({}, answersFor({}));

    expect(withTailwind.devDependencies).toHaveProperty('eslint-plugin-better-tailwindcss');
    expect(withTailwind.devDependencies).toHaveProperty('tailwindcss');
    expect(without.devDependencies).not.toHaveProperty('eslint-plugin-better-tailwindcss');
  });

  /**
   * The adapter follows whether the target calls `@tailwindcss/vite`, not whether it owns a vite.config.ts: Astro
   * calls the plugin from `astro.config.mjs`'s vite key while owning no config file, and shipping both adapters left
   * PostCSS installed with nothing to load it.
   */
  it('gives astro the vite adapter alone, and postcss to the targets with neither route', () => {
    const astro = patchPackageJson({}, answersFor({
      target: 'astro',
      libraries: ['tailwind'],
    }));

    expect(astro.devDependencies).toHaveProperty('@tailwindcss/vite');
    expect(astro.devDependencies).not.toHaveProperty('@tailwindcss/postcss');

    for (const target of ['next', 'angular', 'react-native'] as const) {
      const postcss = patchPackageJson({}, answersFor({
        target,
        libraries: ['tailwind'],
      }));

      expect(postcss.devDependencies).toHaveProperty('@tailwindcss/postcss');
      expect(postcss.devDependencies).not.toHaveProperty('@tailwindcss/vite');
    }
  });

  /**
   * The base template puts astro in dependencies, where the node adapter's runtime entry needs it; the record used
   * to add a second entry to devDependencies and the two ranges drifted. One declaration, in dependencies.
   */
  it('declares astro once for an astro project, hosted or not', () => {
    const plain = patchPackageJson({}, answersFor({ target: 'astro' }));
    const hosted = patchPackageJson({}, answersFor({
      target: 'astro',
      hostedFramework: 'react',
      libraries: ['tailwind', 'zod', 'tanstack-query'],
    }));

    for (const patched of [plain, hosted]) {
      expect(patched.dependencies).toHaveProperty('astro');
      expect(patched.devDependencies).not.toHaveProperty('astro');
    }
  });

  it('adds no runtime dependency for a library that has no binding on this target', () => {
    const plain = patchPackageJson(
      {},
      answersFor({
        target: 'webextension',
        libraries: ['tanstack-query'],
      }),
    );

    expect(plain.dependencies).toBeUndefined();
    expect(plain.devDependencies).toHaveProperty('@tanstack/eslint-plugin-query');
  });

  it('installs no html plugins where the html layer is not composed', () => {
    expect(patchPackageJson({}, answersFor({ target: 'angular' })).devDependencies)
      .not.toHaveProperty('@html-eslint/eslint-plugin');
    expect(patchPackageJson({}, answersFor({ target: 'next' })).devDependencies)
      .not.toHaveProperty('@html-eslint/eslint-plugin');
    expect(patchPackageJson({}, answersFor({ target: 'react' })).devDependencies)
      .toHaveProperty('@html-eslint/eslint-plugin');
  });

  it('always wires husky through prepare', () => {
    expect(patchPackageJson({}, answersFor({})).scripts?.['prepare']).toBe('husky');
  });

  // SvelteKit's own prepare writes .svelte-kit/tsconfig.json, which the emitted tsconfig extends; replacing it outright
  // breaks typecheck.
  it("keeps a target's own prepare ahead of husky rather than replacing it", () => {
    expect(patchPackageJson({}, answersFor({ target: 'svelte' })).scripts?.['prepare'])
      .toBe('svelte-kit sync && husky');
  });

  // Named by customSyntax in the emitted stylelint config; without it, lint:css can't load its own syntax on the two
  // targets that need one.
  it('installs the SFC stylelint syntax only where a component holds the styles', () => {
    expect(patchPackageJson({}, answersFor({ target: 'vue' })).devDependencies)
      .toHaveProperty('postcss-html');
    expect(patchPackageJson({}, answersFor({ target: 'svelte' })).devDependencies)
      .toHaveProperty('postcss-html');
    expect(patchPackageJson({}, answersFor({ target: 'react' })).devDependencies)
      .not.toHaveProperty('postcss-html');
  });

  it('names the rendering library the vue testing rule tells an agent to use', () => {
    expect(patchPackageJson({}, answersFor({ target: 'vue' })).devDependencies)
      .toHaveProperty('@vue/test-utils');
    expect(patchPackageJson({}, answersFor({
      target: 'vue',
      testing: 'none',
    })).devDependencies)
      .not.toHaveProperty('@vue/test-utils');
  });
});

describe('parsePackageJson', () => {
  it('reads an object', () => {
    expect(parsePackageJson('{"name":"x"}').name).toBe('x');
  });

  it('rejects anything that is not one', () => {
    expect(() => {
      return parsePackageJson('[]');
    }).toThrow('does not contain a JSON object');
  });
});

// The scripts must name the runner actually installed: naming vitest in a jest project is a check that fails on
// command-not-found.
describe('the test scripts', () => {
  it('installs no runner where tests were declined', () => {
    const devDependencies = buildDevDependencies(answersFor({ testing: 'none' }));

    expect(devDependencies).not.toHaveProperty('vitest');
    expect(devDependencies).not.toHaveProperty('jest');
  });

  // React Native loads through an adapter, not a preset of its own; it's still vitest underneath, so the runner and
  // coverage provider come from the shared list.
  it('gives react native the adapter on top of the shared runner', () => {
    const devDependencies = buildDevDependencies(answersFor({ target: 'react-native' }));

    expect(devDependencies).toHaveProperty('@srsholmes/vitest-react-native');
    expect(devDependencies).toHaveProperty('vitest');
    expect(devDependencies).toHaveProperty('@vitest/coverage-v8');
    expect(devDependencies).not.toHaveProperty('jest');
    expect(devDependencies).not.toHaveProperty('jest-expo');
  });
});
