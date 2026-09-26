import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  EMPTY_PROJECT,
  MANAGER_FLOORS,
  NODE_ENGINE,
} from '@config/constants';

import { valuesOf } from '@utils/objectUtils';

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
} from '@answers';
import { targetFor } from '@targets';

import { VERSIONS } from './constants';
import {
  allowedBuildNames,
  buildDependencies,
  buildDevDependencies,
  type PackageJson,
  packageJsonEmitter,
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

  // The directory each dev server serves as it is, which is where a browser fetches the worker from.
  it.each<[TargetId, string]>([
    ['react', 'public'],
    ['next', 'public'],
    ['vue', 'public'],
    ['nuxt', 'public'],
    ['svelte', 'static'],
    ['solid', 'public'],
    ['angular', 'public'],
    ['astro', 'public'],
  ])('puts the %s worker in %s', (target, directory) => {
    expect(patchPackageJson({}, answersFor({
      target,
      mocking: 'msw',
    }))).toMatchObject({ msw: { workerDirectory: [directory] } });
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

  // What @linteljs/eslint-config replaces, and the two create-vue installs for a config and an environment it replaced.
  it('drops every package the standard supersedes from the tools a project declared', () => {
    const superseded = [
      'prettier',
      'eslint-config-prettier',
      'eslint-plugin-prettier',
      '@eslint/js',
      'globals',
      'typescript-eslint',
      'eslint-plugin-react-refresh',
      'oxlint',
      'vite-plugin-vue-devtools',
      'jsdom',
    ];
    const declared = Object.fromEntries(superseded.map((name) => {
      return [name, '^1.0.0'];
    }));
    const patched = patchPackageJson({ devDependencies: declared }, answersFor({}));

    expect(superseded.filter((name) => {
      return name in (patched.devDependencies ?? {});
    })).toEqual([]);
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
    // 22.18 is the first Node that strips types by default, which the shipped `scripts/*.ts` and hooks run on.
    expect(patched.engines).toEqual({
      node: '>=22.18',
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
  // Expo Router is the entry, where every other target's bundler finds its own.
  it('names the entry only for the target whose runtime reads it', () => {
    expect(patchPackageJson({}, answersFor({ target: 'react-native' }))).toHaveProperty('main', 'expo-router/entry');
    expect(patchPackageJson({}, answersFor({}))).not.toHaveProperty('main');
  });

  it('marks every generated project private', () => {
    expect(patchPackageJson({}, answersFor({})).private).toBe(true);
    expect(patchPackageJson({ private: false }, answersFor({})).private).toBe(true);
  });

  // Measured on bun 1.3.11: a `bunfig.toml` `allowBuilds` key is ignored and the postinstall stays blocked; only
  // `trustedDependencies` in package.json is read.
  it('names every approved build in trustedDependencies for bun and nothing for the other managers', () => {
    const bun = patchPackageJson({}, answersFor({
      target: 'react-native',
      packageManager: 'bun',
    }));

    expect(bun.trustedDependencies).toEqual(expect.arrayContaining(['sharp', 'unrs-resolver', 'esbuild']));
    expect(patchPackageJson({}, answersFor({ packageManager: 'pnpm' }))).not.toHaveProperty('trustedDependencies');
  });

  // npm 12 blocks unlisted install scripts and warns; `.npmrc` `allow-scripts` is ignored once package.json has it.
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

describe('buildDependencies', () => {
  /**
   * What each store brings: its own packages, and the one that binds it to the framework rendering it. The bindings
   * are why this is a table rather than a name on the target: TanStack ships one package per framework, Astro's
   * binding is the hosted framework's rather than Astro's, and a binding with no core beside it installs cleanly and
   * fails at the first import. Pinia is pinned since `create-vue` crossed over, with the devtools pinia 4 peers on.
   */
  it.each<[TargetId, HostedFramework | undefined, Store, string[]]>([
    ['react', undefined, 'zustand', ['zustand']],
    ['react', undefined, 'redux-toolkit', ['@reduxjs/toolkit', 'react-redux']],
    ['react', undefined, 'tanstack-store', ['@tanstack/react-store']],
    ['svelte', undefined, 'tanstack-store', ['@tanstack/svelte-store']],
    ['vue', undefined, 'tanstack-store', ['@tanstack/vue-store']],
    ['vue', undefined, 'pinia', ['pinia', '@vue/devtools-api']],
    ['nuxt', undefined, 'pinia', ['pinia', '@vue/devtools-api']],
    ['angular', undefined, 'ngrx-signals', ['@ngrx/signals']],
    ['angular', undefined, 'ngrx-store', ['@ngrx/store']],
    ['astro', 'react', 'nanostores', ['nanostores', '@nanostores/react']],
  ])('installs what %s needs for %s %s: %j', (target, hostedFramework, store, packages) => {
    expect(Object.keys(buildDependencies(answersFor({
      target,
      ...(hostedFramework === undefined ? {} : { hostedFramework }),
      store,
    })))).toEqual(expect.arrayContaining(packages));
  });

  it('installs no store where none was chosen', () => {
    expect(buildDependencies(answersFor({}))).not.toHaveProperty('zustand');
    expect(buildDependencies(answersFor({ target: 'vue' }))).not.toHaveProperty('@vue/devtools-api');
  });

  // Svelte reads a nanostores atom through its own store contract, so there is no binding package to install.
  it('installs no binding where the framework needs none', () => {
    expect(Object.keys(buildDependencies(answersFor({
      target: 'astro',
      hostedFramework: 'svelte',
      store: 'nanostores',
    }))).filter((name) => {
      return name.startsWith('@nanostores/');
    })).toEqual([]);
  });

  it.each<[TargetId, HostedFramework | undefined, string]>([
    ['vue', undefined, '@tanstack/vue-query'],
    ['astro', 'react', '@tanstack/react-query'],
  ])('binds tanstack query to %s %s: %s', (target, hostedFramework, binding) => {
    expect(buildDependencies(answersFor({
      target,
      ...(hostedFramework === undefined ? {} : { hostedFramework }),
      libraries: [],
      data: 'tanstack-query',
    }))).toHaveProperty(binding);
  });

  it('installs no TanStack binding for the one target that has none', () => {
    // `qs` alone, which `http.ts` reads and every project receives: no binding was added beside it.
    expect(Object.keys(buildDependencies(answersFor({
      target: 'webextension',
      libraries: [],
      data: 'tanstack-query',
    })))).toEqual(['qs']);
  });

  it('binds the form library per framework, and the zod resolver only beside zod', () => {
    const vue = buildDependencies(answersFor({
      target: 'vue',
      form: 'tanstack-form',
    }));
    const hookForm = buildDependencies(answersFor({ form: 'react-hook-form' }));
    const withZod = buildDependencies(answersFor({
      form: 'react-hook-form',
      libraries: ['zod'],
    }));

    expect(vue).toHaveProperty('@tanstack/vue-form');
    expect(hookForm).toHaveProperty('react-hook-form');
    expect(hookForm).not.toHaveProperty('@hookform/resolvers');
    expect(withZod).toHaveProperty('@hookform/resolvers');
  });

  it('gives Next its own t3-env package and every other target the core one', () => {
    expect(buildDependencies(answersFor({ libraries: ['t3-env'] }))).toHaveProperty('@t3-oss/env-core');
    expect(buildDependencies(answersFor({
      target: 'next',
      libraries: ['t3-env'],
    }))).toHaveProperty('@t3-oss/env-nextjs');
  });

  it('installs the three runtime libraries as plain dependencies', () => {
    const { dependencies, devDependencies } = patchPackageJson({}, answersFor({
      libraries: ['es-toolkit', 'ts-pattern', 'zod'],
    }));

    expect(dependencies).toHaveProperty('es-toolkit');
    expect(dependencies).toHaveProperty('ts-pattern');
    expect(dependencies).toHaveProperty('zod');
    expect(devDependencies).not.toHaveProperty('es-toolkit');
  });

  it('installs the StyleX runtime the styles call', () => {
    expect(buildDependencies(answersFor({ styling: 'stylex' }))).toHaveProperty('@stylexjs/stylex');
  });

  // RTK Query is `@reduxjs/toolkit`, which the Redux store it requires already installs.
  it('installs nothing for RTK Query beyond its store', () => {
    const redux = answersFor({ store: 'redux-toolkit' });
    const withQuery = answersFor({
      store: 'redux-toolkit',
      data: 'rtk-query',
    });

    expect(buildDependencies(withQuery)).toEqual(buildDependencies(redux));
    expect(buildDevDependencies(withQuery)).toEqual(buildDevDependencies(redux));
  });

  // expo-router's peers, which yarn reports missing, and the Reanimated `react-native-css` requires unannounced.
  it('installs Reanimated, its worklets and the gesture handler on every React Native project', () => {
    const native = buildDependencies(answersFor({ target: 'react-native' }));

    expect(native).toHaveProperty('react-native-reanimated');
    expect(native).toHaveProperty('react-native-worklets');
    expect(native).toHaveProperty('react-native-gesture-handler');
    expect(buildDependencies(answersFor({}))).not.toHaveProperty('react-native-reanimated');
  });

  // Expo SDK 57's template pins react exactly, where every other target takes the caret the table carries.
  it('pins react to what Expo SDK 57 ships, on React Native alone', () => {
    const native = answersFor({ target: 'react-native' });

    expect(buildDependencies(native)).toMatchObject({
      'react': '19.2.3',
      'react-dom': '19.2.3',
    });
    expect(buildDevDependencies(native)['@types/react']).toBe('~19.2.2');
    expect(buildDependencies(answersFor({}))['react']).toBe(VERSIONS['react']);
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
    expect(buildDependencies(answersFor({
      libraries: [],
      styling: 'tailwind',
    }))).not.toHaveProperty('nativewind');
  });
});

describe('buildDevDependencies', () => {
  // A project that declined tests installs no runner, since nothing it holds would run one.
  it('installs the test runner only where testing was answered', () => {
    expect(buildDevDependencies(answersFor({}))).toHaveProperty('vitest');
    expect(buildDevDependencies(answersFor({ testing: 'none' }))).not.toHaveProperty('vitest');
  });

  /*
   * The emitted vite config imports `@stylexjs/unplugin/vite`, so a project that answers StyleX and does not
   * install it fails its own lint on an unresolved import before it fails its build on uncompiled styles.
   */
  it('installs the stylex lint plugin, the build plugin and its peer', () => {
    const devDependencies = buildDevDependencies(answersFor({ styling: 'stylex' }));

    expect(devDependencies).toHaveProperty('@stylexjs/unplugin');
    expect(devDependencies).toHaveProperty('@stylexjs/eslint-plugin');
    expect(devDependencies).toHaveProperty('unplugin');
    expect(devDependencies).not.toHaveProperty('@stylexjs/babel-plugin');
  });

  /*
   * Next owns its build and has no vite config to plug into, so it compiles through Babel and PostCSS. The
   * unplugin is there too and is the test run's half: vitest never goes through Next's pipeline.
   */
  it('installs the babel and postcss halves where there is no vite config', () => {
    const devDependencies = buildDevDependencies(answersFor({
      target: 'next',
      styling: 'stylex',
    }));

    expect(devDependencies).toHaveProperty('@stylexjs/babel-plugin');
    expect(devDependencies).toHaveProperty('@stylexjs/eslint-plugin');
    expect(devDependencies).toHaveProperty('@stylexjs/postcss-plugin');
    expect(devDependencies).toHaveProperty('@stylexjs/unplugin');
  });

  // `postcss-html` is stylelint's syntax for an SFC `<style>` block, and it does not install its own peer.
  it('installs postcss beside its syntax for an SFC target', () => {
    const devDependencies = buildDevDependencies(answersFor({ target: 'vue' }));

    expect(devDependencies).toHaveProperty('postcss-html');
    expect(devDependencies).toHaveProperty('postcss');
    expect(buildDevDependencies(answersFor({ target: 'react' }))).not.toHaveProperty('postcss-html');
  });

  it('installs the class linter beside the tailwind toolchain', () => {
    const withTailwind = buildDevDependencies(answersFor({
      libraries: [],
      styling: 'tailwind',
    }));

    expect(withTailwind).toHaveProperty('eslint-plugin-better-tailwindcss');
    expect(withTailwind).toHaveProperty('tailwindcss');
    expect(buildDevDependencies(answersFor({ libraries: [] }))).not.toHaveProperty('eslint-plugin-better-tailwindcss');
  });

  // Astro calls the plugin from `astro.config.mjs` while owning no vite config; shipping both adapters once left
  // PostCSS installed with nothing to load it.
  it.each<[TargetId, string, string]>([
    ['astro', '@tailwindcss/vite', '@tailwindcss/postcss'],
    // Nuxt runs `postcss-import` ahead of its own PostCSS plugins, which cannot resolve `@import "tailwindcss"`.
    ['nuxt', '@tailwindcss/vite', '@tailwindcss/postcss'],
    ['next', '@tailwindcss/postcss', '@tailwindcss/vite'],
    ['angular', '@tailwindcss/postcss', '@tailwindcss/vite'],
    ['react-native', '@tailwindcss/postcss', '@tailwindcss/vite'],
  ])('gives %s the %s adapter alone', (target, adapter, other) => {
    const devDependencies = buildDevDependencies(answersFor({
      target,
      libraries: [],
      styling: 'tailwind',
    }));

    expect(devDependencies).toHaveProperty(adapter);
    expect(devDependencies).not.toHaveProperty(other);
  });

  it.each<[string, AnswerOverrides, boolean]>([
    ['react', { target: 'react' }, true],
    ['react in framework mode', {
      target: 'react',
      router: 'react-router-framework',
    }, false],
    ['next', { target: 'next' }, false],
    ['vue', { target: 'vue' }, true],
    ['nuxt', { target: 'nuxt' }, false],
    ['svelte', { target: 'svelte' }, true],
    ['solid', { target: 'solid' }, true],
    ['angular', { target: 'angular' }, false],
    ['astro', { target: 'astro' }, false],
    ['webextension', { target: 'webextension' }, true],
    ['react-native', { target: 'react-native' }, false],
  ])('installs the html plugins for %s only where the html layer is composed: %s', (_label, overrides, composed) => {
    expect(Object.hasOwn(buildDevDependencies(answersFor(overrides)), '@html-eslint/eslint-plugin')).toBe(composed);
  });

  it('installs the tanstack query lint plugin beside the query library', () => {
    expect(buildDevDependencies(answersFor({
      target: 'vue',
      libraries: [],
      data: 'tanstack-query',
    }))).toHaveProperty('@tanstack/eslint-plugin-query');
  });

  // React Native loads through an adapter; it is still vitest underneath, and naming jest would fail its gate.
  it('gives react native the adapter on top of the shared runner', () => {
    const devDependencies = buildDevDependencies(answersFor({ target: 'react-native' }));

    expect(devDependencies).toHaveProperty('@srsholmes/vitest-react-native');
    expect(devDependencies).toHaveProperty('vitest');
    expect(devDependencies).toHaveProperty('@vitest/coverage-v8');
    expect(devDependencies).not.toHaveProperty('jest');
    expect(devDependencies).not.toHaveProperty('jest-expo');
  });

  // A DOM accessibility plugin has nothing to fire on in React Native; the other two React plugins still apply.
  it('installs the react lint plugins on react native, less the accessibility one', () => {
    const devDependencies = buildDevDependencies(answersFor({ target: 'react-native' }));

    expect(devDependencies).toHaveProperty('@eslint-react/eslint-plugin');
    expect(devDependencies).toHaveProperty('eslint-plugin-react-hooks');
    expect(devDependencies).not.toHaveProperty('eslint-plugin-jsx-a11y-x');
  });

  // The cli plugin inside react-native peers its own release exactly; any other and every manager reports the clash.
  it('declares the metro-config of react-native\'s own release, on React Native alone', () => {
    expect(buildDevDependencies(answersFor({ target: 'react-native' }))['@react-native/metro-config'])
      .toBe(VERSIONS['react-native']);
    expect(buildDevDependencies(answersFor({}))).not.toHaveProperty('@react-native/metro-config');
  });

  // nuxt 4.5 peers rolldown outright, and its builder and devtools peer vite; only pnpm and bun install them unasked.
  // `@astrojs/react` brings its own React plugin, and the compiler rides its Babel passthrough.
  it('installs neither the React plugin nor its Rolldown preset for an Astro React island', () => {
    const devDependencies = buildDevDependencies(answersFor({
      target: 'astro',
      hostedFramework: 'react',
    }));

    expect(devDependencies).toHaveProperty('@astrojs/react');
    expect(devDependencies).not.toHaveProperty('@vitejs/plugin-react');
    expect(devDependencies).not.toHaveProperty('@rolldown/plugin-babel');
  });

  /*
   * The shared four, then what each toolchain's own tree runs on install, which pnpm otherwise refuses: Astro's and
   * Angular's builds pull esbuild, and Vue's query layer pulls vue-demi, hosted or not.
   */
  it.each<[string, AnswerOverrides, string[]]>([
    ['react', { target: 'react' }, []],
    ['next', { target: 'next' }, []],
    ['vue', { target: 'vue' }, ['vue-demi']],
    ['nuxt', { target: 'nuxt' }, ['better-sqlite3', 'esbuild', 'vue-demi']],
    ['svelte', { target: 'svelte' }, []],
    ['solid', { target: 'solid' }, []],
    ['angular', { target: 'angular' }, ['@parcel/watcher', 'esbuild', 'lmdb', 'msgpackr-extract']],
    ['astro', { target: 'astro' }, ['esbuild']],
    ['an Astro site hosting vue', {
      target: 'astro',
      hostedFramework: 'vue',
    }, ['esbuild', 'vue-demi']],
    ['webextension', { target: 'webextension' }, []],
    ['an extension hosting vue', {
      target: 'webextension',
      hostedFramework: 'vue',
    }, ['vue-demi']],
    ['react-native', { target: 'react-native' }, ['esbuild']],
  ])('allows the builds %s runs', (_label, overrides, own) => {
    expect(allowedBuildNames(answersFor(overrides))).toEqual([...own, '@swc/core', 'fsevents', 'sharp', 'unrs-resolver']
      .sort((left, right) => {
        return left.localeCompare(right, 'en');
      }));
  });

  it('names the peers nuxt asks the project for', () => {
    const nuxt = buildDevDependencies(answersFor({ target: 'nuxt' }));

    expect(nuxt).toHaveProperty('rolldown');
    expect(nuxt).toHaveProperty('vite');
    expect(buildDevDependencies(answersFor({ target: 'vue' }))).not.toHaveProperty('rolldown');
  });
});

// Framework mode's packages are the target record's, so the router tables add nothing for it. Tanstack takes its
// lint plugin and no build plugin: nothing generates a route tree, so there is nothing for one to generate.
describe('the router', () => {
  it.each<[Router, string, string[]]>([
    ['react-router', 'react-router', []],
    ['tanstack-router', '@tanstack/react-router', ['@tanstack/eslint-plugin-router']],
    ['react-router-framework', '@react-router/serve', ['@react-router/dev']],
  ])('installs %s as %s, with %j beside it', (router, dependency, tools) => {
    const { dependencies, devDependencies } = patchPackageJson({}, answersFor({ router }));

    expect(dependencies).toHaveProperty(dependency);
    expect(Object.keys(devDependencies ?? {})).toEqual(expect.arrayContaining(tools));
    expect(devDependencies).not.toHaveProperty('@tanstack/router-plugin');
  });
});

describe('packageJsonEmitter', () => {
  // With nothing on disk the file is born, and the project name is the one thing only the caller knows.
  it('names a package.json it writes from nothing after the project', () => {
    const [artifact] = packageJsonEmitter(DEFAULT_ANSWERS, EMPTY_PROJECT, 'demo-app');
    const born = parsePackageJson(
      artifact !== undefined && 'merge' in artifact.content ? artifact.content.merge(null) : '{}',
    );

    expect(born.name).toBe('demo-app');
  });

  it('leaves the dependencies and scripts it does not own intact in the file on disk', () => {
    const [artifact] = packageJsonEmitter(DEFAULT_ANSWERS, EMPTY_PROJECT, 'demo-app');
    // `date-fns` is a dependency this CLI neither pins nor supersedes, which is what a project's own looks like.
    const scaffolded = JSON.stringify({
      name: 'demo-app',
      dependencies: {
        'react': '^19.2.0',
        'date-fns': '^4.1.0',
      },
      devDependencies: { 'some-tool': '^1.0.0' },
      scripts: { dev: 'vite' },
    });
    const patched = parsePackageJson(
      artifact !== undefined && 'merge' in artifact.content ? artifact.content.merge(scaffolded) : '{}',
    );

    expect(patched.dependencies?.['date-fns']).toBe('^4.1.0');
    // A merge, not an overwrite, for the dev tools a project declared too.
    expect(patched.devDependencies?.['some-tool']).toBe('^1.0.0');
    // Owned since this target crossed over: nothing fetches React any more, so this CLI is what installs it.
    expect(patched.dependencies?.['react']).toBe(VERSIONS['react']);
    expect(patched.scripts?.['dev']).toBe('vite');
    expect(patched.scripts?.['lint']).toBe('eslint .');
  });
});

describe('parsePackageJson', () => {
  it('rejects anything that is not one', () => {
    expect(() => {
      return parsePackageJson('[]');
    }).toThrow('does not contain a JSON object');
  });
});

// Every entry pinned tighter than a caret, with the operator it takes; the table says why beside each one.
const PINNED_TIGHTER: Record<string, string> = {
  '@angular/build': '~',
  '@react-native/metro-config': '',
  'expo': '~',
  'expo-constants': '~',
  'expo-linking': '~',
  'expo-router': '~',
  'expo-status-bar': '~',
  'react-native': '',
  'react-native-css': '',
  'react-native-gesture-handler': '~',
  'react-native-reanimated': '',
  'react-native-safe-area-context': '~',
  'react-native-screens': '~',
  'react-native-web': '~',
  'react-native-worklets': '',
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

// The only range this repository can check without the network. `^0.1.0` once sat while the package reached 0.2.0:
// a caret on 0.x is minor-locked. Only @linteljs/eslint-config is written into a generated project.
describe('VERSIONS against the workspace', () => {
  it('pins the one package a generated project depends on to the version this workspace carries', () => {
    const { name, version } = siblingIn('eslint-config');

    expect(VERSIONS[name]).toBe(`^${version}`);
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

// Every entry VERSIONS ships older than the range it is held to, which is the empty list when nothing drifted.
const staleAgainst = (entries: [string, string][], source: string): string[] => {
  return entries.filter(([name, range]) => {
    const shipped = VERSIONS[name];

    return shipped !== undefined && !atLeast(shipped, range);
  }).map(([name, range]) => {
    return `${name}: VERSIONS has ${String(VERSIONS[name])}, ${source} has ${range}`;
  });
};

// A range older than what `@linteljs/eslint-config` declares hands a project a plugin its config never ran against;
// five had drifted before anything checked. `catalog:` entries answer in the block below.
const configDependencies = (): [string, string][] => {
  const path = join(import.meta.dirname, '..', '..', '..', '..', '..', 'eslint-config', 'package.json');
  const { devDependencies } = parsePackageJson(readFileSync(path, 'utf8'));

  return Object.entries(devDependencies ?? {}).filter(([, range]) => {
    return range !== 'catalog:';
  });
};

// Each list is checked non-empty first, so an unreadable source fails rather than passing vacuously.
describe('VERSIONS against what this workspace builds with', () => {
  it('ships nothing older than the version the layers were built against', () => {
    const dependencies = configDependencies();

    expect(dependencies.length).toBeGreaterThan(0);
    expect(staleAgainst(dependencies, 'eslint-config')).toEqual([]);
  });

  it('ships nothing older than the version this workspace installs', () => {
    const entries = catalogEntries();

    expect(entries.length).toBeGreaterThan(0);
    expect(staleAgainst(entries, 'catalog')).toEqual([]);
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
