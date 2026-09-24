import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  ANSWERS,
  type Answers,
  type Data,
  DEFAULT_ANSWERS,
  type Form,
  type HostedFramework,
  type Library,
  type Mocking,
  type PackageManager,
  type Router,
  type Store,
  type Styling,
  type TargetId,
  type Testing,
} from '#answers';
import { MANAGER_FLOORS, NODE_ENGINE } from '#config/constants';
import { targetFor } from '#targets';
import { valuesOf } from '#utils/objectUtils';

import { VERSIONS } from './constants';
import {
  allowedBuildNames,
  buildDependencies,
  buildDevDependencies,
  type PackageJson,
  parsePackageJson,
  patchPackageJson,
  versioned,
} from './packageJsonEmitter';

interface AnswerOverrides {
  target?: TargetId;
  hostedFramework?: HostedFramework;
  testing?: Testing;
  packageManager?: PackageManager;
  packageManagerVersion?: string;
  libraries?: Library[];
  form?: Form;
  store?: Store;
  router?: Router;
  styling?: Styling;
  data?: Data;
  mocking?: Mocking;
}

interface Sibling {
  name: string;
  version: string;
}

const FORMS = valuesOf(ANSWERS.form.values);
const LIBRARIES = valuesOf(ANSWERS.libraries.values);
const TARGET_IDS = valuesOf(ANSWERS.target.values);

// Whatever the target offers, so a sweep over every target asks each for a store it actually has.
const storeFor = (target: TargetId): Partial<Answers> => {
  const [store] = targetFor({
    ...DEFAULT_ANSWERS,
    target,
  }).stores ?? [];

  return store === undefined ? {} : { store };
};

const answersFor = (overrides: AnswerOverrides): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };
};

// What a scaffolder leaves on disk before this package edits it.
const SCAFFOLDED: PackageJson = {
  name: 'demo-app',
  version: '0.0.0',
  private: true,
  dependencies: {
    'react': '^19.2.0',
    // A dependency this CLI neither pins nor supersedes, which is what a project's own looks like.
    'date-fns': '^4.1.0',
  },
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

// A silent skip on a missing VERSIONS entry is how @types/node vanished from every generated project.
describe('versioned', () => {
  it('has a resolvable range for every dependency every target and library declares', () => {
    for (const target of TARGET_IDS) {
      for (const library of LIBRARIES) {
        expect(() => {
          return patchPackageJson({}, answersFor({
            target,
            libraries: [library],
            ...storeFor(target),
          }));
        }).not.toThrow();
      }

      for (const form of FORMS) {
        expect(() => {
          return patchPackageJson({}, answersFor({
            target,
            form,
            ...storeFor(target),
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

  it('sorts and de-duplicates the names', () => {
    expect(Object.keys(versioned(['vitest', 'eslint', 'vitest']))).toEqual(['eslint', 'vitest']);
  });

  it('installs no TanStack binding for the one target that has none', () => {
    const patched = patchPackageJson(
      {},
      answersFor({
        target: 'webextension',
        libraries: [],
        data: 'tanstack-query',
      }),
    );

    // `qs` alone, which `http.ts` reads and every project receives: no binding was added beside it.
    expect(Object.keys(patched.dependencies ?? {})).toEqual(['qs']);
    expect(patched.devDependencies).toHaveProperty('@tanstack/eslint-plugin-query');
  });
});

/*
 * The mocking answer reaches the manifest in three places, and two of them are easy to forget: the install script
 * that copies the worker has to be allowed, or the install stops and asks, and the key naming where it goes has to
 * be there, or MSW copies it nowhere.
 */
describe('the mocking answer', () => {
  it('installs msw as a dev dependency, and only when it was answered', () => {
    expect(buildDevDependencies(answersFor({ mocking: 'msw' }))).toHaveProperty('msw');
    expect(buildDevDependencies(answersFor({}))).not.toHaveProperty('msw');
  });

  it('allows the install script that copies the worker', () => {
    expect(allowedBuildNames(answersFor({ mocking: 'msw' }))).toContain('msw');
    expect(allowedBuildNames(answersFor({}))).not.toContain('msw');
  });

  // The served directory, which is where a browser fetches the worker from and differs per target.
  it('names the worker directory for a target that serves one, and omits the key otherwise', () => {
    expect(patchPackageJson({}, answersFor({
      target: 'react',
      mocking: 'msw',
    })))
      .toMatchObject({ msw: { workerDirectory: ['public'] } });
    expect(patchPackageJson({}, answersFor({ target: 'react' }))).not.toHaveProperty('msw');
    expect(patchPackageJson({}, answersFor({
      target: 'react-native',
      mocking: 'msw',
    })))
      .not.toHaveProperty('msw');
  });
});

describe('patchPackageJson', () => {
  it('removes recorded linteljs metadata and preserves unrelated package properties', () => {
    const existing = {
      name: 'demo',
      description: 'kept',
      linteljs: { target: DEFAULT_ANSWERS.target },
    };
    const patched = patchPackageJson(existing, DEFAULT_ANSWERS);

    expect(patched).not.toHaveProperty('linteljs');
    expect(patched).toHaveProperty('description', 'kept');
  });

  it('drops prettier, which @stylistic supersedes', () => {
    expect(patchPackageJson(SCAFFOLDED, answersFor({})).devDependencies).not.toHaveProperty(
      'prettier',
    );
  });

  // Three declarations of one fact: the exact version corepack and pnpm switch to, the floor that was tested, and
  // the field npm and pnpm refuse the install over.
  it('sets type, and declares the recorded manager version three ways', () => {
    const patched = patchPackageJson(SCAFFOLDED, answersFor({
      packageManager: 'pnpm',
      packageManagerVersion: '12.5.1',
    }));

    expect(patched.type).toBe('module');
    expect(patched.packageManager).toBe('pnpm@12.5.1');
    expect(patched.engines).toEqual({
      node: NODE_ENGINE,
      pnpm: `>=${MANAGER_FLOORS.pnpm}`,
    });
    expect(patched.devEngines).toEqual({
      packageManager: {
        name: 'pnpm',
        onFail: 'error',
      },
    });
  });

  // A `packageManager: bun@x` is a field corepack would act on and cannot, so bun is told through `engines` alone.
  it('writes no packageManager field for bun', () => {
    const patched = patchPackageJson(SCAFFOLDED, answersFor({
      packageManager: 'bun',
      packageManagerVersion: '1.3.4',
    }));

    expect(patched).not.toHaveProperty('packageManager');
    expect(patched.engines).toEqual({
      node: NODE_ENGINE,
      bun: `>=${MANAGER_FLOORS.bun}`,
    });
    expect(patched.devEngines?.['packageManager']).toEqual({
      name: 'bun',
      onFail: 'error',
    });
  });

  /*
   * Declared rather than inherited, since nothing writes a manifest for most targets any more. Without it yarn 1
   * warns about a missing license on every install and refuses to enable workspaces.
   */
  it('marks every generated project private', () => {
    expect(patchPackageJson({}, answersFor({})).private).toBe(true);
    expect(patchPackageJson({ private: false }, answersFor({})).private).toBe(true);
  });

  /*
   * The emitted vite config imports `@stylexjs/unplugin/vite`, so a project that answers StyleX and does not
   * install it fails its own lint on an unresolved import before it fails its build on uncompiled styles.
   */
  it('installs the stylex build plugin and its peer', () => {
    const { devDependencies } = patchPackageJson({}, answersFor({ styling: 'stylex' }));

    expect(devDependencies).toHaveProperty('@stylexjs/unplugin');
    expect(devDependencies).toHaveProperty('unplugin');
    expect(devDependencies).not.toHaveProperty('@stylexjs/babel-plugin');
  });

  /*
   * Next owns its build and has no vite config to plug into, so it compiles through Babel and PostCSS. The
   * unplugin is there too and is the test run's half: vitest never goes through Next's pipeline.
   */
  it('installs the babel and postcss halves where there is no vite config', () => {
    const { devDependencies } = patchPackageJson({}, answersFor({
      target: 'next',
      styling: 'stylex',
    }));

    expect(devDependencies).toHaveProperty('@stylexjs/babel-plugin');
    expect(devDependencies).toHaveProperty('@stylexjs/postcss-plugin');
    expect(devDependencies).toHaveProperty('@stylexjs/unplugin');
  });

  // `postcss-html` is stylelint's syntax for an SFC `<style>` block, and it does not install its own peer.
  it('installs postcss beside its syntax for an SFC target', () => {
    const { devDependencies } = patchPackageJson({}, answersFor({ target: 'vue' }));

    expect(devDependencies).toHaveProperty('postcss-html');
    expect(devDependencies).toHaveProperty('postcss');
    expect(patchPackageJson({}, answersFor({ target: 'react' })).devDependencies)
      .not.toHaveProperty('postcss-html');
  });

  it('installs a store only where one was chosen', () => {
    const withStore = patchPackageJson({}, answersFor({ store: 'zustand' }));
    const without = patchPackageJson({}, answersFor({}));
    const angular = patchPackageJson({}, answersFor({
      target: 'angular',
      store: 'ngrx-signals',
    }));

    expect(withStore.dependencies).toHaveProperty('zustand');
    expect(without.dependencies ?? {}).not.toHaveProperty('zustand');
    expect(angular.dependencies).toHaveProperty('@ngrx/signals');
  });

  /**
   * What each store brings: its own packages, and the one that binds it to the framework rendering it. The bindings
   * are why this is a table rather than a name on the target: TanStack ships one package per framework, and Astro's
   * binding is the hosted framework's rather than Astro's.
   */
  it('installs what the chosen store needs, and its framework binding where it has one', () => {
    const dependenciesOf = (overrides: AnswerOverrides): Record<string, string> => {
      return patchPackageJson({}, answersFor(overrides)).dependencies ?? {};
    };

    expect(Object.keys(dependenciesOf({ store: 'redux-toolkit' })))
      .toEqual(expect.arrayContaining(['@reduxjs/toolkit', 'react-redux']));
    expect(dependenciesOf({ store: 'tanstack-store' })).toHaveProperty('@tanstack/react-store');
    expect(dependenciesOf({
      target: 'svelte',
      store: 'tanstack-store',
    })).toHaveProperty('@tanstack/svelte-store');
    expect(dependenciesOf({
      target: 'astro',
      hostedFramework: 'react',
      store: 'nanostores',
    })).toHaveProperty('@nanostores/react');
    // Svelte reads a nanostores atom through its own store contract, so there is no binding package to install.
    expect(Object.keys(dependenciesOf({
      target: 'astro',
      hostedFramework: 'svelte',
      store: 'nanostores',
    })).filter((name) => {
      return name.startsWith('@nanostores/');
    })).toEqual([]);
  });

  // A binding with no core beside it installs cleanly and fails at the first import.
  it('installs the core package of a store beside its binding', () => {
    expect(patchPackageJson({}, answersFor({
      target: 'angular',
      store: 'ngrx-store',
    })).dependencies).toHaveProperty('@ngrx/store');
    expect(patchPackageJson({}, answersFor({
      target: 'astro',
      hostedFramework: 'react',
      store: 'nanostores',
    })).dependencies).toHaveProperty('nanostores');
  });

  // Pinned here since `create-vue` crossed over: nothing installs it from a `--pinia` flag any more.
  it('installs the store a target offers, and the binding that renders it', () => {
    const { dependencies } = patchPackageJson({}, answersFor({
      target: 'vue',
      store: 'pinia',
    }));

    expect(dependencies).toHaveProperty('pinia');
    expect(patchPackageJson({}, answersFor({
      target: 'vue',
      store: 'tanstack-store',
    })).dependencies).toHaveProperty('@tanstack/vue-store');
  });

  it('installs the framework binding for tanstack query, plus its lint plugin', () => {
    const vue = patchPackageJson({}, answersFor({
      target: 'vue',
      libraries: [],
      data: 'tanstack-query',
    }));

    expect(vue.dependencies).toHaveProperty('@tanstack/vue-query');
    expect(vue.devDependencies).toHaveProperty('@tanstack/eslint-plugin-query');
  });

  it('installs the class linter beside the tailwind toolchain', () => {
    const withTailwind = patchPackageJson({}, answersFor({
      libraries: [],
      styling: 'tailwind',
    }));
    const without = patchPackageJson({}, answersFor({ libraries: [] }));

    expect(withTailwind.devDependencies).toHaveProperty('eslint-plugin-better-tailwindcss');
    expect(withTailwind.devDependencies).toHaveProperty('tailwindcss');
    expect(without.devDependencies).not.toHaveProperty('eslint-plugin-better-tailwindcss');
  });

  // Astro calls the plugin from `astro.config.mjs` while owning no vite config; shipping both adapters once left
  // PostCSS installed with nothing to load it.
  it('gives astro the vite adapter alone, and postcss to the targets with neither route', () => {
    const astro = patchPackageJson({}, answersFor({
      target: 'astro',
      libraries: [],
      styling: 'tailwind',
    }));

    expect(astro.devDependencies).toHaveProperty('@tailwindcss/vite');
    expect(astro.devDependencies).not.toHaveProperty('@tailwindcss/postcss');

    for (const target of ['next', 'angular', 'react-native'] as const) {
      const postcss = patchPackageJson({}, answersFor({
        target,
        libraries: [],
        styling: 'tailwind',
      }));

      expect(postcss.devDependencies).toHaveProperty('@tailwindcss/postcss');
      expect(postcss.devDependencies).not.toHaveProperty('@tailwindcss/vite');
    }
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

  // Replacing SvelteKit's own prepare breaks typecheck.
  it('wires husky and the target step through postinstall on yarn, which runs no prepare', () => {
    const { scripts } = patchPackageJson({}, answersFor({
      target: 'svelte',
      packageManager: 'yarn',
    }));

    expect(scripts?.['postinstall']).toBe('svelte-kit sync && husky');
    expect(scripts).not.toHaveProperty('prepare');
  });
});

describe('parsePackageJson', () => {
  it('rejects anything that is not one', () => {
    expect(() => {
      return parsePackageJson('[]');
    }).toThrow('does not contain a JSON object');
  });
});

// Naming vitest in a jest project is a check that fails on command-not-found.
describe('the test scripts', () => {
  // React Native loads through an adapter; it is still vitest underneath.
  it('gives react native the adapter on top of the shared runner', () => {
    const devDependencies = buildDevDependencies(answersFor({ target: 'react-native' }));

    expect(devDependencies).toHaveProperty('@srsholmes/vitest-react-native');
    expect(devDependencies).toHaveProperty('vitest');
    expect(devDependencies).toHaveProperty('@vitest/coverage-v8');
    expect(devDependencies).not.toHaveProperty('jest');
    expect(devDependencies).not.toHaveProperty('jest-expo');
  });
});

describe('the libraries added in 1.6.0', () => {
  it('binds the form library per framework, and the zod resolver only beside zod', () => {
    const vue = patchPackageJson({}, answersFor({
      target: 'vue',
      form: 'tanstack-form',
    }));
    const hookForm = patchPackageJson({}, answersFor({ form: 'react-hook-form' }));
    const withZod = patchPackageJson({}, answersFor({
      form: 'react-hook-form',
      libraries: ['zod'],
    }));

    expect(vue.dependencies).toHaveProperty('@tanstack/vue-form');
    expect(hookForm.dependencies).toHaveProperty('react-hook-form');
    expect(hookForm.dependencies).not.toHaveProperty('@hookform/resolvers');
    expect(withZod.dependencies).toHaveProperty('@hookform/resolvers');
  });

  it('gives Next its own t3-env package and every other target the core one', () => {
    expect(patchPackageJson({}, answersFor({ libraries: ['t3-env'] })).dependencies)
      .toHaveProperty('@t3-oss/env-core');
    expect(patchPackageJson({}, answersFor({
      target: 'next',
      libraries: ['t3-env'],
    })).dependencies).toHaveProperty('@t3-oss/env-nextjs');
  });

  it('installs the two runtime-only libraries as plain dependencies', () => {
    const { dependencies, devDependencies } = patchPackageJson({}, answersFor({
      libraries: ['es-toolkit', 'ts-pattern'],
    }));

    expect(dependencies).toHaveProperty('es-toolkit');
    expect(dependencies).toHaveProperty('ts-pattern');
    expect(devDependencies).not.toHaveProperty('es-toolkit');
  });

  it('binds tanstack query to the framework a host renders with', () => {
    const hosted = patchPackageJson({}, answersFor({
      target: 'astro',
      hostedFramework: 'react',
      libraries: [],
      data: 'tanstack-query',
    }));

    expect(hosted.dependencies).toHaveProperty('@tanstack/react-query');
  });

  // expo-router's peers, which yarn reports missing, and the Reanimated `react-native-css` requires unannounced.
  it('installs Reanimated, its worklets and the gesture handler on every React Native project', () => {
    const native = buildDependencies(answersFor({ target: 'react-native' }));

    expect(native).toHaveProperty('react-native-reanimated');
    expect(native).toHaveProperty('react-native-worklets');
    expect(native).toHaveProperty('react-native-gesture-handler');
    expect(buildDependencies(answersFor({}))).not.toHaveProperty('react-native-reanimated');
  });

  // nuxt 4.5 peers rolldown outright, and its builder and devtools peer vite; only pnpm and bun install them unasked.
  it('names the peers nuxt asks the project for', () => {
    const nuxt = buildDevDependencies(answersFor({ target: 'nuxt' }));

    expect(nuxt).toHaveProperty('rolldown');
    expect(nuxt).toHaveProperty('vite');
    expect(buildDevDependencies(answersFor({ target: 'vue' }))).not.toHaveProperty('rolldown');
  });

  it('installs the devtools pinia 4 peers on, wherever pinia goes', () => {
    for (const target of ['vue', 'nuxt'] as const) {
      expect(buildDependencies(answersFor({
        target,
        store: 'pinia',
      }))).toHaveProperty('@vue/devtools-api');
    }

    expect(buildDependencies(answersFor({ target: 'vue' }))).not.toHaveProperty('@vue/devtools-api');
  });

  it('takes NativeWind on React Native, where Metro has no Tailwind pipeline', () => {
    const native = patchPackageJson({}, answersFor({
      target: 'react-native',
      libraries: [],
      styling: 'tailwind',
    }));

    expect(native.dependencies).toHaveProperty('nativewind');
    expect(native.dependencies).toHaveProperty('react-native-css');
    expect(native.devDependencies).toHaveProperty('postcss');
    expect(patchPackageJson({}, answersFor({
      libraries: [],
      styling: 'tailwind',
    })).dependencies ?? {})
      .not.toHaveProperty('nativewind');
  });
});

describe('the router', () => {
  it('installs react-router alone', () => {
    const { dependencies, devDependencies } = patchPackageJson({}, answersFor({ router: 'react-router' }));

    expect(dependencies).toHaveProperty('react-router');
    expect(devDependencies).not.toHaveProperty('@tanstack/router-plugin');
  });

  // The lint plugin and no build plugin: nothing generates a route tree, so there is nothing for one to generate.
  it('installs tanstack router with its lint plugin', () => {
    const { dependencies, devDependencies } = patchPackageJson({}, answersFor({ router: 'tanstack-router' }));

    expect(dependencies).toHaveProperty('@tanstack/react-router');
    expect(devDependencies).toHaveProperty('@tanstack/eslint-plugin-router');
    expect(devDependencies).not.toHaveProperty('@tanstack/router-plugin');
  });

  // Framework mode's packages are the target record's, so the router tables add nothing for it.
  it('installs framework mode with its server and its build plugin', () => {
    const { dependencies, devDependencies } = patchPackageJson({}, answersFor({ router: 'react-router-framework' }));

    expect(dependencies).toHaveProperty('@react-router/serve');
    expect(devDependencies).toHaveProperty('@react-router/dev');
  });
});

// Measured on bun 1.3.11: a `bunfig.toml` `allowBuilds` key is ignored and the postinstall stays blocked; only
// `trustedDependencies` in package.json is read.
describe('trustedDependencies', () => {
  it('names every approved build for bun and nothing for the other managers', () => {
    const bun = patchPackageJson({}, answersFor({
      target: 'react-native',
      packageManager: 'bun',
    }));

    expect(bun.trustedDependencies).toEqual(expect.arrayContaining(['sharp', 'unrs-resolver', 'esbuild']));
    expect(patchPackageJson({}, answersFor({ packageManager: 'pnpm' }))).not.toHaveProperty('trustedDependencies');
  });
});

// npm 12 blocks unlisted install scripts and warns; `.npmrc` `allow-scripts` is ignored once package.json has it.
describe('allowScripts', () => {
  it('approves every build for npm, keeps what the scaffolder approved, and writes nothing elsewhere', () => {
    const npm = patchPackageJson({ allowScripts: { 'some-native': true } }, answersFor({
      target: 'angular',
      packageManager: 'npm',
    }));

    expect(npm.allowScripts).toMatchObject({
      'some-native': true,
      'esbuild': true,
      'lmdb': true,
      'fsevents': true,
      'unrs-resolver': true,
    });
    expect(patchPackageJson({}, answersFor({ packageManager: 'pnpm' }))).not.toHaveProperty('allowScripts');
  });
});

// The only ranges this repository can check without the network. `^0.1.0` once sat while the package reached 0.2.0:
// a caret on 0.x is minor-locked.
const WORKSPACE_PACKAGES = ['eslint-config', 'eslint-plugin'];

const siblingIn = (directory: string): Sibling => {
  const path = join(import.meta.dirname, '..', '..', '..', '..', '..', directory, 'package.json');
  const { name, version } = parsePackageJson(readFileSync(path, 'utf8'));

  if (name === undefined || version === undefined) {
    throw new Error(`${path} declares no name or version`);
  }

  return {
    name,
    version,
  };
};

// Every entry pinned tighter than a caret, with the operator it takes; the table says why beside each one.
const PINNED_TIGHTER: Record<string, string> = {
  '@angular/build': '~',
  '@react-native/js-polyfills': '~',
  'expo': '~',
  'expo-constants': '~',
  'expo-linking': '~',
  'expo-router': '~',
  'expo-status-bar': '~',
  'react-native': '~',
  'react-native-css': '',
  'react-native-gesture-handler': '~',
  'react-native-reanimated': '~',
  'react-native-safe-area-context': '~',
  'react-native-screens': '~',
  'react-native-web': '~',
  'react-native-worklets': '~',
  'rolldown': '~',
  'rxjs': '~',
  'test-renderer': '~',
  'typescript': '~',
};

describe('VERSIONS', () => {
  it('holds every range to a caret, save the entries pinned tighter for a stated reason', () => {
    for (const [name, range] of Object.entries(VERSIONS)) {
      const operator = PINNED_TIGHTER[name] ?? '^';

      expect(range.slice(0, operator.length), name).toBe(operator);
      expect(range.slice(operator.length), name).toMatch(/^\d+\.\d+\.\d+(?:-[\da-z.]+)?$/u);
    }
  });
});

describe('VERSIONS against the workspace', () => {
  it.each(WORKSPACE_PACKAGES)('carries no stale range for %s', (directory) => {
    const { name, version } = siblingIn(directory);
    const range = VERSIONS[name];

    // Only @linteljs/eslint-config is written into a generated project.
    expect(range === undefined || range === `^${version}`).toBe(true);
  });

  it('names the one package a generated project depends on', () => {
    expect(VERSIONS[siblingIn('eslint-config').name]).toBeDefined();
  });
});

// An entry in both places must not ship something older than the layers were built against. A line match, not a
// YAML parser, for a flat block.
const catalogEntries = (): [string, string][] => {
  const workspaceRoot = join(import.meta.dirname, '..', '..', '..', '..', '..', '..');
  const yaml = readFileSync(join(workspaceRoot, 'pnpm-workspace.yaml'), 'utf8');
  const lines = yaml.split('\n');
  const start = lines.indexOf('catalog:');

  if (start === -1) {
    throw new Error('pnpm-workspace.yaml declares no catalog');
  }

  const entries: [string, string][] = [];

  // Line by line: a regex spanning a block is the shape `sonarjs/slow-regex` reports.
  for (const line of lines.slice(start + 1)) {
    const indented = line.startsWith(' ') || line.startsWith('\t');

    if (!indented && line.trim() !== '') {
      break;
    }

    const trimmed = line.trim();
    const separator = trimmed.indexOf(':');

    if (trimmed.startsWith('#') || separator === -1) {
      continue;
    }

    const name = trimmed.slice(0, separator).replaceAll("'", '');

    entries.push([name, trimmed.slice(separator + 1).trim()]);
  }

  return entries;
};

// So `^10.8.1` and `~10.8.1` compare as numbers.
const floorOf = (range: string): number[] => {
  return range.replace(/^[\^~]/, '').replace(/-rc\.\d+/, '').split('.').map(Number);
};

const atLeast = (range: string, minimum: string): boolean => {
  const left = floorOf(range);
  const right = floorOf(minimum);

  return left.every((part, index) => {
    const other = right[index] ?? 0;

    return part === other || part > other || left.slice(0, index).some((earlier, at) => {
      return earlier > (right[at] ?? 0);
    });
  });
};

// A range older than what `@linteljs/eslint-config` declares hands a project a plugin its config never ran against;
// five had drifted before anything checked. `catalog:` entries answer in the block above.
const configDependencies = (): [string, string][] => {
  const path = join(import.meta.dirname, '..', '..', '..', '..', '..', 'eslint-config', 'package.json');
  const { devDependencies } = parsePackageJson(readFileSync(path, 'utf8'));

  return Object.entries(devDependencies ?? {}).filter(([, range]) => {
    return range !== 'catalog:';
  });
};

describe('VERSIONS against the config it installs beside', () => {
  it('reads dependencies off the config, so the assertion below is not vacuous', () => {
    expect(configDependencies().length).toBeGreaterThan(0);
  });

  it('ships nothing older than the version the layers were built against', () => {
    const stale = configDependencies()
      .filter(([name, range]) => {
        const shipped = VERSIONS[name];

        return shipped !== undefined && !atLeast(shipped, range);
      })
      .map(([name, range]) => {
        return `${name}: VERSIONS has ${String(VERSIONS[name])}, eslint-config has ${range}`;
      });

    expect(stale).toEqual([]);
  });
});

describe('VERSIONS against the workspace catalog', () => {
  it('reads a catalog with entries in it, so the assertion below is not vacuous', () => {
    expect(catalogEntries().length).toBeGreaterThan(0);
  });

  it('ships nothing older than the version this workspace installs', () => {
    const stale = catalogEntries()
      .filter(([name, range]) => {
        const shipped = VERSIONS[name];

        return shipped !== undefined && !atLeast(shipped, range);
      })
      .map(([name, range]) => {
        return `${name}: VERSIONS has ${String(VERSIONS[name])}, catalog has ${range}`;
      });

    expect(stale).toEqual([]);
  });
});

describe('MANAGER_FLOORS against the workspace', () => {
  /**
   * The direction the floor reads: a project is refused below this and pinned to its own executor's version above
   * it, so what matters is that the floor is one this repository has run. A floor above the pnpm this workspace
   * develops on would be a floor nothing here has ever gated at.
   */
  it('floors pnpm no higher than the one this workspace runs', () => {
    const path = join(import.meta.dirname, '..', '..', '..', '..', '..', '..', 'package.json');
    const { packageManager } = parsePackageJson(readFileSync(path, 'utf8'));
    const running = String(packageManager).replace('pnpm@', '');

    expect(atLeast(running, MANAGER_FLOORS.pnpm)).toBe(true);
  });
});
