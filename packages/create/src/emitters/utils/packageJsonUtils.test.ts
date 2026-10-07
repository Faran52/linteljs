import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { MANAGER_FLOORS } from '@config/constants';

import { keysOf } from '@utils/objectUtils';

import { ANSWERS, DEFAULT_ANSWERS } from '@answers';
import { targetFor } from '@targets';

import { ESLINT_CONFIG_PEERS, VERSIONS } from '../constants';

import {
  allowedBuildNames,
  buildDependencies,
  buildDevDependencies,
  buildOverrides,
  dependencyDrift,
  parsePackageJson,
  pinned,
  serializedPackageJson,
  upgradedPackageJson,
  versioned,
} from './packageJsonUtils';

import type {
  Answers,
  Data,
  Form,
  HostedFramework,
  Library,
  Mocking,
  PackageManager,
  Router,
  Store,
  Styling,
  TargetId,
  Testing,
} from '@config/types';

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

const FORMS = keysOf(ANSWERS.form.values);
const LIBRARIES = keysOf(ANSWERS.libraries.values);
const TARGET_IDS = keysOf(ANSWERS.target.values);

const hostedFor = (hostedFramework: HostedFramework | undefined): Partial<Answers> => {
  if (hostedFramework === undefined) {
    return {};
  }

  const hosted = { hostedFramework };
  return hosted;
};

const storeFor = (target: TargetId): Partial<Answers> => {
  const [store] = targetFor({
    ...DEFAULT_ANSWERS,
    target,
  }).stores ?? [];

  if (store === undefined) {
    return {};
  }

  const answered = { store };
  return answered;
};

describe('versioned', () => {
  it('has a resolvable range for every dependency every target and library declares', () => {
    for (const target of TARGET_IDS) {
      for (const library of LIBRARIES) {
        const answers = answersFor({
          target,
          libraries: [library],
          ...storeFor(target),
        });

        expect(() => {
          buildDependencies(answers);
          buildDevDependencies(answers);
        }).not.toThrow();
      }

      for (const form of FORMS) {
        const answers = answersFor({
          target,
          form,
          ...storeFor(target),
        });

        expect(() => {
          buildDependencies(answers);
          buildDevDependencies(answers);
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
    const actual = Object.keys(versioned([
      'vitest',
      'eslint',
      'vitest',
    ]));
    const expected = ['eslint', 'vitest'];
    expect(actual).toEqual(expected);
  });
});

describe('the mocking answer', () => {
  it('installs msw as a dev dependency, and only when it was answered', () => {
    const devDependencies = buildDevDependencies(answersFor({ mocking: 'msw' }));
    expect(devDependencies).toHaveProperty('msw');
    const unmocked = buildDevDependencies(answersFor({}));
    expect(unmocked).not.toHaveProperty('msw');
  });

  it('allows the install script that copies the worker', () => {
    const actual = allowedBuildNames(answersFor({ mocking: 'msw' }));
    expect(actual).toContain('msw');
    const unmocked = allowedBuildNames(answersFor({}));
    expect(unmocked).not.toContain('msw');
  });
});

describe('pinned', () => {
  it('pins each scoped override to its own package\'s version', () => {
    const actual = pinned([
      {
        parent: 'metro',
        name: 'lightningcss',
      },
      {
        parent: 'babel',
        name: 'semver',
      },
    ], {
      lightningcss: '1.30.1',
      semver: '7.7.2',
    });
    const expected = [
      {
        parent: 'metro',
        name: 'lightningcss',
        version: '1.30.1',
      },
      {
        parent: 'babel',
        name: 'semver',
        version: '7.7.2',
      },
    ];
    expect(actual).toEqual(expected);
  });
});

describe('buildOverrides', () => {
  it.each([
    ['pnpm', ['@expo/metro-config>lightningcss', 'react-native-css>lightningcss']],
    ['yarn', ['@expo/metro-config/lightningcss', 'react-native-css/lightningcss']],
    ['bun', ['lightningcss']],
  ] as const)('pins lightningcss where NativeWind reads it for %s as %j', (packageManager, keys) => {
    const overrides = buildOverrides(answersFor({
      target: 'react-native',
      styling: 'tailwind',
      packageManager,
    }));
    const expected = Object.fromEntries(keys
      .map((key) => {
        const pin: [string, string | undefined] = [key, VERSIONS['lightningcss']];
        return pin;
      }));

    expect(overrides).toEqual(expected);
  });

  it.each([
    ['npm', { '@astrojs/react': { '@vitejs/plugin-react': '6.1.1' } }],
    ['pnpm', { '@astrojs/react>@vitejs/plugin-react': '6.1.1' }],
    ['yarn', { '@astrojs/react/@vitejs/plugin-react': '6.1.1' }],
    ['bun', { '@vitejs/plugin-react': '6.1.1' }],
  ] as const)('holds the react plugin under `@astrojs/react` for %s', (packageManager, expected) => {
    const overrides = buildOverrides(answersFor({
      target: 'astro',
      hostedFramework: 'react',
      packageManager,
    }));

    expect(overrides).toEqual(expected);
  });

  it('nests the npm pin under each parent', () => {
    const overrides = buildOverrides(answersFor({
      target: 'react-native',
      styling: 'tailwind',
      packageManager: 'npm',
    }));
    const pin = { lightningcss: VERSIONS['lightningcss'] };

    const expected = {
      '@expo/metro-config': pin,
      'react-native-css': pin,
    };
    expect(overrides).toEqual(expected);
  });

  it('pins nothing for Tailwind on the web or for React Native without it', () => {
    const web = buildOverrides(answersFor({ styling: 'tailwind' }));
    const plain = buildOverrides(answersFor({ target: 'react-native' }));

    expect(web).toEqual({});
    expect(plain).toEqual({});
  });
});

describe('buildDependencies', () => {
  it.each<[TargetId, HostedFramework | undefined, Store, string[]]>([
    [
      'react',
      undefined,
      'zustand',
      ['zustand'],
    ],
    [
      'react',
      undefined,
      'redux-toolkit',
      ['@reduxjs/toolkit', 'react-redux'],
    ],
    [
      'react',
      undefined,
      'tanstack-store',
      ['@tanstack/react-store'],
    ],
    [
      'svelte',
      undefined,
      'tanstack-store',
      ['@tanstack/svelte-store'],
    ],
    [
      'vue',
      undefined,
      'tanstack-store',
      ['@tanstack/vue-store'],
    ],
    [
      'vue',
      undefined,
      'pinia',
      ['pinia', '@vue/devtools-api'],
    ],
    [
      'nuxt',
      undefined,
      'tanstack-store',
      ['@tanstack/vue-store'],
    ],
    [
      'nuxt',
      undefined,
      'pinia',
      ['pinia', '@vue/devtools-api'],
    ],
    [
      'angular',
      undefined,
      'ngrx-signals',
      ['@ngrx/signals'],
    ],
    [
      'astro',
      'react',
      'nanostores',
      ['nanostores', '@nanostores/react'],
    ],
  ])('installs what %s needs for %s %s: %j', (target, hostedFramework, store, packages) => {
    const dependencies = buildDependencies(answersFor({
      target,
      ...hostedFor(hostedFramework),
      store,
    }));
    const dependencyNames = Object.keys(dependencies);

    expect(dependencyNames).toEqual(expect.arrayContaining(packages));
  });

  it('installs a package for every store each target offers', () => {
    const bare = TARGET_IDS
      .flatMap((target) => {
        const plain = answersFor({ target });
        const plainDependencies = buildDependencies(plain);
        const without = Object.keys(plainDependencies);
        const offered = targetFor(plain).stores ?? [];

        return offered
          .filter((store) => {
            const dependencies = buildDependencies(answersFor({
              target,
              store,
            }));
            const names = Object.keys(dependencies);

            return names.length === without.length;
          })
          .map((store) => {
            return `${target} ${store}`;
          });
      });

    expect(bare).toEqual([]);
  });

  it('installs no store where none was chosen', () => {
    const dependencies = buildDependencies(answersFor({}));
    expect(dependencies).not.toHaveProperty('zustand');
    const vueDependencies = buildDependencies(answersFor({ target: 'vue' }));
    expect(vueDependencies).not.toHaveProperty('@vue/devtools-api');
  });

  it('installs no binding where the framework needs none', () => {
    const dependencies = buildDependencies(answersFor({
      target: 'astro',
      hostedFramework: 'svelte',
      store: 'nanostores',
    }));
    const nanostores = Object.keys(dependencies)
      .filter((name) => {
        return name.startsWith('@nanostores/');
      });

    expect(nanostores).toEqual([]);
  });

  it.each<[TargetId, HostedFramework | undefined, string]>([
    [
      'vue',
      undefined,
      '@tanstack/vue-query',
    ],
    [
      'astro',
      'react',
      '@tanstack/react-query',
    ],
  ])('binds tanstack query to %s %s: %s', (target, hostedFramework, binding) => {
    const dependencies = buildDependencies(answersFor({
      target,
      ...hostedFor(hostedFramework),
      libraries: [],
      data: 'tanstack-query',
    }));

    expect(dependencies).toHaveProperty(binding);
  });

  it('installs no TanStack binding for the one target that has none', () => {
    const dependencies = buildDependencies(answersFor({
      target: 'webextension',
      libraries: [],
      data: 'tanstack-query',
    }));
    const dependencyNames = Object.keys(dependencies);

    const expected = ['qs'];
    expect(dependencyNames).toEqual(expected);
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
    const coreEnv = buildDependencies(answersFor({ libraries: ['t3-env'] }));
    expect(coreEnv).toHaveProperty('@t3-oss/env-core');

    const dependencies = buildDependencies(answersFor({
      target: 'next',
      libraries: ['t3-env'],
    }));

    expect(dependencies).toHaveProperty('@t3-oss/env-nextjs');
  });

  it('installs the three runtime libraries as plain dependencies', () => {
    const answers = answersFor({ libraries: [
      'es-toolkit',
      'ts-pattern',
      'zod',
    ] });
    const dependencies = buildDependencies(answers);
    const devDependencies = buildDevDependencies(answers);

    expect(dependencies).toHaveProperty('es-toolkit');
    expect(dependencies).toHaveProperty('ts-pattern');
    expect(dependencies).toHaveProperty('zod');
    expect(devDependencies).not.toHaveProperty('es-toolkit');
  });

  it('installs the StyleX runtime the styles call', () => {
    const dependencies = buildDependencies(answersFor({ styling: 'stylex' }));
    expect(dependencies).toHaveProperty('@stylexjs/stylex');
  });

  it('installs nothing for RTK Query beyond its store', () => {
    const redux = answersFor({ store: 'redux-toolkit' });
    const withQuery = answersFor({
      store: 'redux-toolkit',
      data: 'rtk-query',
    });

    const dependencies = buildDependencies(withQuery);
    expect(dependencies).toEqual(buildDependencies(redux));
    const devDependencies = buildDevDependencies(withQuery);
    expect(devDependencies).toEqual(buildDevDependencies(redux));
  });

  it('installs Reanimated, its worklets and the gesture handler on every React Native project', () => {
    const native = buildDependencies(answersFor({ target: 'react-native' }));

    expect(native).toHaveProperty('react-native-reanimated');
    expect(native).toHaveProperty('react-native-worklets');
    expect(native).toHaveProperty('react-native-gesture-handler');
    const dependencies = buildDependencies(answersFor({}));
    expect(dependencies).not.toHaveProperty('react-native-reanimated');
  });

  it('pins react to what Expo SDK 57 ships, on React Native alone', () => {
    const native = answersFor({ target: 'react-native' });

    const dependencies = buildDependencies(native);
    const expected = {
      'react': '19.2.3',
      'react-dom': '19.2.3',
    };
    expect(dependencies).toMatchObject(expected);

    const nativeDevDependencies = buildDevDependencies(native);
    const webDependencies = buildDependencies(answersFor({}));
    expect(nativeDevDependencies['@types/react']).toBe('~19.2.2');
    expect(webDependencies['react']).toBe(VERSIONS['react']);
  });

  it('takes NativeWind on React Native, where Metro has no Tailwind pipeline', () => {
    const native = answersFor({
      target: 'react-native',
      libraries: [],
      styling: 'tailwind',
    });

    const nativeDependencies = buildDependencies(native);
    expect(nativeDependencies).toHaveProperty('nativewind');
    expect(nativeDependencies).toHaveProperty('react-native-css');
    const devDependencies = buildDevDependencies(native);
    expect(devDependencies).toHaveProperty('postcss');

    const dependencies = buildDependencies(answersFor({
      libraries: [],
      styling: 'tailwind',
    }));

    expect(dependencies).not.toHaveProperty('nativewind');
  });
});

describe('buildDevDependencies', () => {
  it('installs the test runner only where testing was answered', () => {
    const devDependencies = buildDevDependencies(answersFor({}));
    expect(devDependencies).toHaveProperty('vitest');
    const untested = buildDevDependencies(answersFor({ testing: 'none' }));
    expect(untested).not.toHaveProperty('vitest');
  });

  it('names vite beside vitest for yarn only, since yarn installs no peers', () => {
    const next = { target: 'next' } as const;

    const yarn = buildDevDependencies(answersFor({ ...next, packageManager: 'yarn' }));
    expect(yarn).toHaveProperty('vite');
    const npm = buildDevDependencies(answersFor({ ...next, packageManager: 'npm' }));
    expect(npm).not.toHaveProperty('vite');
    const pnpm = buildDevDependencies(answersFor({ ...next, packageManager: 'pnpm' }));
    expect(pnpm).not.toHaveProperty('vite');
    const bun = buildDevDependencies(answersFor({ ...next, packageManager: 'bun' }));
    expect(bun).not.toHaveProperty('vite');
  });

  it('installs the stylex lint plugin, the build plugin and its peer', () => {
    const devDependencies = buildDevDependencies(answersFor({ styling: 'stylex' }));

    expect(devDependencies).toHaveProperty('@stylexjs/unplugin');
    expect(devDependencies).toHaveProperty('@stylexjs/eslint-plugin');
    expect(devDependencies).toHaveProperty('unplugin');
    expect(devDependencies).not.toHaveProperty('@stylexjs/babel-plugin');
  });

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

  it('installs postcss beside its syntax for an SFC target', () => {
    const devDependencies = buildDevDependencies(answersFor({ target: 'vue' }));

    expect(devDependencies).toHaveProperty('postcss-html');
    expect(devDependencies).toHaveProperty('postcss');
    const reactDevDependencies = buildDevDependencies(answersFor({ target: 'react' }));
    expect(reactDevDependencies).not.toHaveProperty('postcss-html');
  });

  it('installs the class linter beside the tailwind toolchain', () => {
    const withTailwind = buildDevDependencies(answersFor({
      libraries: [],
      styling: 'tailwind',
    }));

    expect(withTailwind).toHaveProperty('eslint-plugin-better-tailwindcss');
    expect(withTailwind).toHaveProperty('tailwindcss');
    const devDependencies = buildDevDependencies(answersFor({ libraries: [] }));
    expect(devDependencies).not.toHaveProperty('eslint-plugin-better-tailwindcss');
  });

  it.each<[TargetId, string, string]>([
    [
      'astro',
      '@tailwindcss/vite',
      '@tailwindcss/postcss',
    ],
    [
      'nuxt',
      '@tailwindcss/vite',
      '@tailwindcss/postcss',
    ],
    [
      'next',
      '@tailwindcss/postcss',
      '@tailwindcss/vite',
    ],
    [
      'angular',
      '@tailwindcss/postcss',
      '@tailwindcss/vite',
    ],
    [
      'react-native',
      '@tailwindcss/postcss',
      '@tailwindcss/vite',
    ],
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
    [
      'react',
      { target: 'react' },
      true,
    ],
    [
      'react in framework mode',
      {
        target: 'react',
        router: 'react-router-framework',
      },
      false,
    ],
    [
      'next',
      { target: 'next' },
      false,
    ],
    [
      'vue',
      { target: 'vue' },
      true,
    ],
    [
      'nuxt',
      { target: 'nuxt' },
      false,
    ],
    [
      'svelte',
      { target: 'svelte' },
      true,
    ],
    [
      'solid',
      { target: 'solid' },
      true,
    ],
    [
      'angular',
      { target: 'angular' },
      false,
    ],
    [
      'astro',
      { target: 'astro' },
      false,
    ],
    [
      'webextension',
      { target: 'webextension' },
      true,
    ],
    [
      'react-native',
      { target: 'react-native' },
      false,
    ],
  ])('installs the html plugins for %s only where the html layer is composed: %s', (_label, overrides, composed) => {
    const devDependencies = buildDevDependencies(answersFor(overrides));
    const actual = Object.hasOwn(devDependencies, '@html-eslint/eslint-plugin');
    expect(actual).toBe(composed);
  });

  it('installs the tanstack query lint plugin beside the query library', () => {
    const devDependencies = buildDevDependencies(answersFor({
      target: 'vue',
      libraries: [],
      data: 'tanstack-query',
    }));

    expect(devDependencies).toHaveProperty('@tanstack/eslint-plugin-query');
  });

  it('runs react native on jest-expo, with no vitest left', () => {
    const devDependencies = buildDevDependencies(answersFor({ target: 'react-native' }));
    const expected = {
      '@react-native/jest-preset': VERSIONS['react-native'],
      '@types/jest': '^29.5.14',
      'eslint-plugin-jest': '^29.16.6',
      'jest': '^29.7.0',
      'jest-expo': '~57.0.5',
    };
    expect(devDependencies).toMatchObject(expected);
    const names = Object.keys(devDependencies);
    const vitestNames = names
      .filter((name) => {
        return name.includes('vite') || name === 'happy-dom';
      });
    expect(vitestNames).toEqual([]);
  });

  it('names no vite for yarn on jest, whose runner peers none', () => {
    const devDependencies = buildDevDependencies(answersFor({
      target: 'react-native',
      packageManager: 'yarn',
    }));
    expect(devDependencies).not.toHaveProperty('vite');
  });

  it('installs the react lint plugins on react native, less the accessibility one', () => {
    const devDependencies = buildDevDependencies(answersFor({ target: 'react-native' }));

    expect(devDependencies).toHaveProperty('@eslint-react/eslint-plugin');
    expect(devDependencies).toHaveProperty('eslint-plugin-react-hooks');
    expect(devDependencies).not.toHaveProperty('eslint-plugin-jsx-a11y-x');
  });

  it('declares the metro-config of react-native\'s own release, on React Native alone', () => {
    const nativeDevDependencies = buildDevDependencies(answersFor({ target: 'react-native' }));
    expect(nativeDevDependencies['@react-native/metro-config']).toBe(VERSIONS['react-native']);

    const devDependencies = buildDevDependencies(answersFor({}));
    expect(devDependencies).not.toHaveProperty('@react-native/metro-config');
  });

  it('leaves the React plugin and its Rolldown preset to `@astrojs/react` for an Astro React island', () => {
    const devDependencies = buildDevDependencies(answersFor({
      target: 'astro',
      hostedFramework: 'react',
    }));

    expect(devDependencies).toHaveProperty('@astrojs/react');
    expect(devDependencies).not.toHaveProperty('@vitejs/plugin-react');
    expect(devDependencies).not.toHaveProperty('@rolldown/plugin-babel');
  });

  it.each<[string, AnswerOverrides, string[]]>([
    [
      'react',
      { target: 'react' },
      [],
    ],
    [
      'next',
      { target: 'next' },
      ['@parcel/watcher'],
    ],
    [
      'vue',
      { target: 'vue' },
      ['vue-demi'],
    ],
    [
      'nuxt',
      { target: 'nuxt' },
      [
        'better-sqlite3',
        'esbuild',
        'vue-demi',
      ],
    ],
    [
      'svelte',
      { target: 'svelte' },
      [],
    ],
    [
      'solid',
      { target: 'solid' },
      [],
    ],
    [
      'angular',
      { target: 'angular' },
      [
        '@parcel/watcher',
        'esbuild',
        'lmdb',
        'msgpackr-extract',
      ],
    ],
    [
      'astro',
      { target: 'astro' },
      ['esbuild'],
    ],
    [
      'an Astro site hosting vue',
      {
        target: 'astro',
        hostedFramework: 'vue',
      },
      ['esbuild', 'vue-demi'],
    ],
    [
      'webextension',
      { target: 'webextension' },
      [],
    ],
    [
      'an extension hosting vue',
      {
        target: 'webextension',
        hostedFramework: 'vue',
      },
      ['vue-demi'],
    ],
    [
      'react-native',
      { target: 'react-native' },
      [],
    ],
  ])('allows the builds %s runs', (_label, overrides, own) => {
    const builds = [
      ...own,
      '@swc/core',
      'fsevents',
      'sharp',
      'unrs-resolver',
    ];
    const expected = builds
      .toSorted((left, right) => {
        return left.localeCompare(right, 'en');
      });

    const actual = allowedBuildNames(answersFor(overrides));
    expect(actual).toEqual(expected);
  });

  it('names the peers nuxt asks the project for', () => {
    const nuxt = buildDevDependencies(answersFor({ target: 'nuxt' }));

    expect(nuxt).toHaveProperty('rolldown');
    expect(nuxt).toHaveProperty('vite');
    const devDependencies = buildDevDependencies(answersFor({ target: 'vue' }));
    expect(devDependencies).not.toHaveProperty('rolldown');
  });
});

describe('a library', () => {
  it('installs no querystring package, which only an app\'s http.ts uses', () => {
    const app = buildDependencies(answersFor({}));
    const library = buildDependencies(answersFor({ target: 'typescript' }));

    expect(app).toHaveProperty('qs');
    expect(library).not.toHaveProperty('qs');
  });

  it('installs no DOM for its suites and no querystring types', () => {
    const app = buildDevDependencies(answersFor({}));
    const library = buildDevDependencies(answersFor({ target: 'typescript' }));

    expect(app).toHaveProperty('happy-dom');
    expect(app).toHaveProperty('@types/qs');
    expect(library).toHaveProperty('vitest');
    expect(library).not.toHaveProperty('happy-dom');
    expect(library).not.toHaveProperty('@types/qs');
  });
});

describe('the router', () => {
  it.each<[Router, string, string[]]>([
    [
      'react-router',
      'react-router',
      [],
    ],
    [
      'tanstack-router',
      '@tanstack/react-router',
      ['@tanstack/eslint-plugin-router'],
    ],
    [
      'react-router-framework',
      '@react-router/serve',
      ['@react-router/dev'],
    ],
  ])('installs %s as %s, with %j beside it', (router, dependency, tools) => {
    const answers = answersFor({ router });
    const dependencies = buildDependencies(answers);
    const devDependencies = buildDevDependencies(answers);

    expect(dependencies).toHaveProperty(dependency);
    const actual = Object.keys(devDependencies);
    expect(actual).toEqual(expect.arrayContaining(tools));
    expect(devDependencies).not.toHaveProperty('@tanstack/router-plugin');
  });
});

describe('parsePackageJson', () => {
  it('rejects anything that is not one', () => {
    expect(() => {
      return parsePackageJson('[]');
    }).toThrow('does not contain a JSON object');
  });
});

const PINNED_TIGHTER: Record<string, string> = {
  '@angular/build': '~',
  '@react-native-async-storage/async-storage': '',
  '@react-native/jest-preset': '',
  '@react-native/metro-config': '',
  '@vitejs/plugin-react': '',
  'expo': '~',
  'expo-build-properties': '~',
  'expo-constants': '~',
  'expo-linking': '~',
  'expo-localization': '~',
  'expo-router': '~',
  'expo-splash-screen': '~',
  'expo-status-bar': '~',
  'jest-expo': '~',
  'lightningcss': '',
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

      const leading = range.slice(0, operator.length);
      expect(leading, name).toBe(operator);
      const version = range.slice(operator.length);
      expect(version, name).toMatch(/^\d+\.\d+\.\d+(?:-[\da-z.]+)?$/u);
    }
  });
});

const siblingIn = (directory: string): Sibling => {
  const path = join(import.meta.dirname, '..', '..', '..', '..', directory, 'package.json');
  const { name, version } = parsePackageJson(readFileSync(path, 'utf8'));

  if (name === undefined || version === undefined) {
    throw new Error(`${path} declares no name or version`);
  }

  const sibling: Sibling = {
    name,
    version,
  };
  return sibling;
};

describe('VERSIONS against the workspace', () => {
  it('pins the one package a generated project depends on to the version this workspace carries', () => {
    const { name, version } = siblingIn('eslint-config');

    expect(VERSIONS[name]).toBe(`^${version}`);
  });
});

const catalogEntries = (): [string, string][] => {
  const workspaceRoot = join(import.meta.dirname, '..', '..', '..', '..', '..');
  const yaml = readFileSync(join(workspaceRoot, 'pnpm-workspace.yaml'), 'utf8');
  const lines = yaml.split('\n');
  const start = lines.indexOf('catalog:');

  if (start === -1) {
    throw new Error('pnpm-workspace.yaml declares no catalog');
  }

  const entries: [string, string][] = [];

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

    const name = trimmed
      .slice(0, separator)
      .replaceAll("'", '');

    const range = trimmed
      .slice(separator + 1)
      .trim();

    entries.push([name, range]);
  }

  return entries;
};

const floorOf = (range: string): number[] => {
  return range
    .replace(/^[\^~]/, '')
    .replace(/-rc\.\d+/, '')
    .split('.')
    .map(Number);
};

const atLeast = (range: string, minimum: string): boolean => {
  const left = floorOf(range);
  const right = floorOf(minimum);

  return left
    .every((part, index) => {
      const other = right[index] ?? 0;

      return part === other || part > other || left
        .slice(0, index)
        .some((earlier, at) => {
          return earlier > (right[at] ?? 0);
        });
    });
};

const staleAgainst = (entries: [string, string][], source: string): string[] => {
  return entries
    .filter(([name, range]) => {
      const shipped = VERSIONS[name];

      return shipped !== undefined && !atLeast(shipped, range);
    })
    .map(([name, range]) => {
      return `${name}: VERSIONS has ${String(VERSIONS[name])}, ${source} has ${range}`;
    });
};

const configDependencies = (): [string, string][] => {
  const path = join(import.meta.dirname, '..', '..', '..', '..', 'eslint-config', 'package.json');
  const { devDependencies } = parsePackageJson(readFileSync(path, 'utf8'));

  return Object.entries(devDependencies ?? {})
    .filter(([, range]) => {
      return range !== 'catalog:';
    });
};

describe('VERSIONS against what this workspace builds with', () => {
  it('ships nothing older than the version the layers were built against', () => {
    const dependencies = configDependencies();

    expect(dependencies.length).toBeGreaterThan(0);
    const actual = staleAgainst(dependencies, 'eslint-config');
    expect(actual).toEqual([]);
  });

  it('ships nothing older than the version this workspace installs', () => {
    const entries = catalogEntries();

    expect(entries.length).toBeGreaterThan(0);
    const actual = staleAgainst(entries, 'catalog');
    expect(actual).toEqual([]);
  });
});

describe('MANAGER_FLOORS against the workspace', () => {
  it('floors pnpm no higher than the one this workspace runs', () => {
    const path = join(import.meta.dirname, '..', '..', '..', '..', '..', 'package.json');
    const { packageManager } = parsePackageJson(readFileSync(path, 'utf8'));
    const running = String(packageManager).replace('pnpm@', '');

    const actual = atLeast(running, MANAGER_FLOORS.pnpm);
    expect(actual).toBe(true);
  });
});

describe('buildDependencies with languages', () => {
  it('adds the target\'s i18n libraries only once a language is chosen on a target that translates', () => {
    const translated = buildDependencies(answersFor({ languages: ['ja'] }));
    const english = buildDependencies(answersFor({}));
    const vue = buildDependencies(answersFor({
      target: 'vue',
      languages: ['ja'],
    }));
    const solid = buildDependencies(answersFor({
      target: 'solid',
      languages: ['ja'],
    }));
    const webextension = buildDependencies(answersFor({
      target: 'webextension',
      languages: ['ja'],
    }));
    // No popup, so no i18n parts: a language that slipped past the answers adds nothing.
    const background = buildDependencies(answersFor({
      target: 'webextension',
      surfaces: ['background'],
      languages: ['ja'],
    }));
    const backgroundInEnglish = buildDependencies(answersFor({
      target: 'webextension',
      surfaces: ['background'],
    }));

    const actual = Object.keys(translated);

    expect(actual).toEqual(expect.arrayContaining([
      'i18next',
      'react-i18next',
    ]));

    expect(english).not.toHaveProperty('i18next');
    expect(vue).toHaveProperty('vue-i18n');
    expect(vue).not.toHaveProperty('i18next');
    expect(solid).toHaveProperty('@solid-primitives/i18n');
    expect(webextension).not.toHaveProperty('i18next');
    expect(webextension).not.toHaveProperty('@solid-primitives/i18n');
    expect(background).toEqual(backgroundInEnglish);
  });

  it('adds the target\'s i18n compiler as a dev dependency only once a language is chosen', () => {
    const translated = buildDevDependencies(answersFor({
      target: 'svelte',
      languages: ['ja'],
    }));
    const english = buildDevDependencies(answersFor({ target: 'svelte' }));
    const react = buildDevDependencies(answersFor({ languages: ['ja'] }));
    const webextension = buildDevDependencies(answersFor({
      target: 'webextension',
      languages: ['ja'],
    }));
    const background = buildDevDependencies(answersFor({
      target: 'webextension',
      surfaces: ['background'],
      languages: ['ja'],
    }));
    const backgroundInEnglish = buildDevDependencies(answersFor({
      target: 'webextension',
      surfaces: ['background'],
    }));

    expect(background).toEqual(backgroundInEnglish);
    expect(translated).toHaveProperty('@inlang/paraglide-js');
    expect(translated).toHaveProperty('@inlang/plugin-message-format');
    expect(english).not.toHaveProperty('@inlang/paraglide-js');
    expect(react).not.toHaveProperty('@inlang/paraglide-js');
    expect(webextension).not.toHaveProperty('@inlang/paraglide-js');
  });
});

describe('dependencyDrift', () => {
  it('names an old or absent @linteljs/* package an upgrade, and an old or absent lint peer a peer', () => {
    const drift = dependencyDrift({
      dependencies: { react: '^99.0.0' },
      devDependencies: {
        '@linteljs/eslint-config': '^1.5.0',
        'eslint': '^8.0.0',
        'typescript': '^99.0.0',
      },
    }, DEFAULT_ANSWERS);
    const fresh = dependencyDrift({}, DEFAULT_ANSWERS);

    const expected = [{
      name: '@linteljs/eslint-config',
      from: '^1.5.0',
      to: VERSIONS['@linteljs/eslint-config'],
    }];
    expect(drift.upgrades).toEqual(expected);

    const peerNames = drift.peers
      .map(({ name }) => {
        return name;
      });
    const expectedPeers = [
      '@eslint-react/eslint-plugin',
      '@html-eslint/eslint-plugin',
      '@html-eslint/parser',
      '@vitest/eslint-plugin',
      'eslint',
      'eslint-plugin-jsx-a11y-x',
      'eslint-plugin-react-hooks',
      'jiti',
    ];
    expect(peerNames).toEqual(expectedPeers);
    const eslintPeer = {
      name: 'eslint',
      from: '^8.0.0',
      to: VERSIONS['eslint'],
    };
    expect(drift.peers).toContainEqual(eslintPeer);
    const freshTypescript = {
      name: 'typescript',
      to: VERSIONS['typescript'],
    };
    expect(fresh.peers).toContainEqual(freshTypescript);

    const upgrades = [{
      name: '@linteljs/eslint-config',
      to: VERSIONS['@linteljs/eslint-config'],
    }];
    expect(fresh.upgrades).toStrictEqual(upgrades);
  });

  it('reads an exact version and any operator prefix as the version behind it', () => {
    const exact = dependencyDrift({ devDependencies: { '@linteljs/eslint-config': '1.5.0' } }, DEFAULT_ANSWERS);
    const atLeast = dependencyDrift({ devDependencies: { '@linteljs/eslint-config': '>=1.5.0' } }, DEFAULT_ANSWERS);

    const fromExact = exact.upgrades
      .map(({ from }) => {
        return from;
      });
    const fromAtLeast = atLeast.upgrades
      .map(({ from }) => {
        return from;
      });
    expect(fromExact).toEqual(['1.5.0']);
    expect(fromAtLeast).toEqual(['>=1.5.0']);
  });

  it('never moves a newer range, or one that is not a version', () => {
    const newer = dependencyDrift({ devDependencies: { '@linteljs/eslint-config': '^9.0.0' } }, DEFAULT_ANSWERS);
    const linkedConfig = { devDependencies: { '@linteljs/eslint-config': 'link:../config' } };
    const linked = dependencyDrift(linkedConfig, DEFAULT_ANSWERS);

    expect(newer.upgrades).toEqual([]);
    expect(linked.upgrades).toEqual([]);
  });
});

describe('ESLINT_CONFIG_PEERS', () => {
  it('names exactly the peers @linteljs/eslint-config declares', () => {
    const path = join(import.meta.dirname, '..', '..', '..', '..', 'eslint-config', 'package.json');
    const { peerDependencies = {} } = parsePackageJson(readFileSync(path, 'utf8'));

    const declared = Object.keys(peerDependencies)
      .toSorted((left, right) => {
        return left.localeCompare(right, 'en');
      });
    expect(ESLINT_CONFIG_PEERS).toEqual(declared);
  });
});

describe('upgradedPackageJson', () => {
  it('moves each version in the field the project keeps it in, and adds an absent one as a dev dependency', () => {
    const upgraded = upgradedPackageJson({
      name: 'kept',
      dependencies: { '@linteljs/eslint-config': '^1.0.0' },
    }, [
      {
        name: '@linteljs/eslint-config',
        from: '^1.0.0',
        to: '^2.0.0',
      },
      {
        name: '@linteljs/eslint-plugin',
        to: '^2.0.0',
      },
    ]);
    const bare = upgradedPackageJson({}, []);

    const expected = {
      name: 'kept',
      dependencies: { '@linteljs/eslint-config': '^2.0.0' },
      devDependencies: { '@linteljs/eslint-plugin': '^2.0.0' },
    };
    expect(upgraded).toEqual(expected);

    const emptied = { devDependencies: {} };
    expect(bare).toEqual(emptied);
  });

  it('moves a present dev dependency in place, adds an absent one in sorted place, and keeps the order', () => {
    const upgraded = upgradedPackageJson({
      devDependencies: {
        eslint: '^10.0.0',
        vitest: '^5.0.0',
        astro: '^5.0.0',
      },
    }, [
      {
        name: 'eslint-plugin-react-hooks',
        to: '^7.1.1',
      },
      {
        name: 'zod',
        to: '^4.0.0',
      },
      {
        name: 'vitest',
        from: '^5.0.0',
        to: '^6.0.0',
      },
    ]);
    const devDependencies = upgraded.devDependencies ?? {};
    const names = Object.keys(devDependencies);

    const expected = [
      'eslint',
      'eslint-plugin-react-hooks',
      'vitest',
      'astro',
      'zod',
    ];
    expect(names).toEqual(expected);
    expect(devDependencies).toHaveProperty('vitest', '^6.0.0');
  });
});

describe('serializedPackageJson', () => {
  it('writes two-space JSON with a final newline', () => {
    const text = serializedPackageJson({ name: 'demo' });

    expect(text).toBe('{\n  "name": "demo"\n}\n');
  });
});
