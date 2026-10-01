import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { MANAGER_FLOORS } from '@config/constants';

import { valuesOf } from '@utils/objectUtils';

import { ANSWERS, DEFAULT_ANSWERS } from '@answers';
import { targetFor } from '@targets';

import { VERSIONS } from '../constants';

import {
  allowedBuildNames,
  buildDependencies,
  buildDevDependencies,
  buildOverrides,
  parsePackageJson,
  pinned,
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

const FORMS = valuesOf(ANSWERS.form.values);
const LIBRARIES = valuesOf(ANSWERS.libraries.values);
const TARGET_IDS = valuesOf(ANSWERS.target.values);

const storeFor = (target: TargetId): Partial<Answers> => {
  const [store] = targetFor({
    ...DEFAULT_ANSWERS,
    target,
  }).stores ?? [];

  return store === undefined ? {} : { store };
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
          return [buildDependencies(answers), buildDevDependencies(answers)];
        }).not.toThrow();
      }

      for (const form of FORMS) {
        const answers = answersFor({
          target,
          form,
          ...storeFor(target),
        });

        expect(() => {
          return [buildDependencies(answers), buildDevDependencies(answers)];
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
    expect(Object.keys(versioned([
      'vitest',
      'eslint',
      'vitest',
    ]))).toEqual(['eslint', 'vitest']);
  });
});

describe('the mocking answer', () => {
  it('installs msw as a dev dependency, and only when it was answered', () => {
    expect(buildDevDependencies(answersFor({ mocking: 'msw' }))).toHaveProperty('msw');
    expect(buildDevDependencies(answersFor({}))).not.toHaveProperty('msw');
  });

  it('allows the install script that copies the worker', () => {
    expect(allowedBuildNames(answersFor({ mocking: 'msw' }))).toContain('msw');
    expect(allowedBuildNames(answersFor({}))).not.toContain('msw');
  });
});

describe('pinned', () => {
  it('pins each scoped override to its own package\'s version', () => {
    expect(pinned([
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
    })).toEqual([
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
    ]);
  });
});

describe('buildOverrides', () => {
  it.each([
    ['pnpm', ['@expo/metro-config>lightningcss', 'react-native-css>lightningcss']],
    ['yarn', ['@expo/metro-config/lightningcss', 'react-native-css/lightningcss']],
    ['yarn-classic', ['**/@expo/metro-config/lightningcss', '**/react-native-css/lightningcss']],
    ['bun', ['lightningcss']],
  ] as const)('pins lightningcss where NativeWind reads it for %s as %j', (packageManager, keys) => {
    const overrides = buildOverrides(answersFor({
      target: 'react-native',
      styling: 'tailwind',
      packageManager,
    }));
    const expected = Object.fromEntries(keys
      .map((key) => {
        return [key, VERSIONS['lightningcss']];
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

    expect(overrides).toEqual({
      '@expo/metro-config': pin,
      'react-native-css': pin,
    });
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
      'angular',
      undefined,
      'ngrx-store',
      ['@ngrx/store'],
    ],
    [
      'astro',
      'react',
      'nanostores',
      ['nanostores', '@nanostores/react'],
    ],
  ])('installs what %s needs for %s %s: %j', (target, hostedFramework, store, packages) => {
    const dependencyNames = Object.keys(buildDependencies(answersFor({
      target,
      ...(hostedFramework === undefined ? {} : { hostedFramework }),
      store,
    })));

    expect(dependencyNames).toEqual(expect.arrayContaining(packages));
  });

  it('installs no store where none was chosen', () => {
    expect(buildDependencies(answersFor({}))).not.toHaveProperty('zustand');
    expect(buildDependencies(answersFor({ target: 'vue' }))).not.toHaveProperty('@vue/devtools-api');
  });

  it('installs no binding where the framework needs none', () => {
    const nanostores = Object.keys(buildDependencies(answersFor({
      target: 'astro',
      hostedFramework: 'svelte',
      store: 'nanostores',
    })))
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
      ...(hostedFramework === undefined ? {} : { hostedFramework }),
      libraries: [],
      data: 'tanstack-query',
    }));

    expect(dependencies).toHaveProperty(binding);
  });

  it('installs no TanStack binding for the one target that has none', () => {
    const dependencyNames = Object.keys(buildDependencies(answersFor({
      target: 'webextension',
      libraries: [],
      data: 'tanstack-query',
    })));

    expect(dependencyNames).toEqual(['qs']);
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
    expect(buildDependencies(answersFor({ styling: 'stylex' }))).toHaveProperty('@stylexjs/stylex');
  });

  it('installs nothing for RTK Query beyond its store', () => {
    const redux = answersFor({ store: 'redux-toolkit' });
    const withQuery = answersFor({
      store: 'redux-toolkit',
      data: 'rtk-query',
    });

    expect(buildDependencies(withQuery)).toEqual(buildDependencies(redux));
    expect(buildDevDependencies(withQuery)).toEqual(buildDevDependencies(redux));
  });

  it('installs Reanimated, its worklets and the gesture handler on every React Native project', () => {
    const native = buildDependencies(answersFor({ target: 'react-native' }));

    expect(native).toHaveProperty('react-native-reanimated');
    expect(native).toHaveProperty('react-native-worklets');
    expect(native).toHaveProperty('react-native-gesture-handler');
    expect(buildDependencies(answersFor({}))).not.toHaveProperty('react-native-reanimated');
  });

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
    const native = answersFor({
      target: 'react-native',
      libraries: [],
      styling: 'tailwind',
    });

    expect(buildDependencies(native)).toHaveProperty('nativewind');
    expect(buildDependencies(native)).toHaveProperty('react-native-css');
    expect(buildDevDependencies(native)).toHaveProperty('postcss');

    const dependencies = buildDependencies(answersFor({
      libraries: [],
      styling: 'tailwind',
    }));

    expect(dependencies).not.toHaveProperty('nativewind');
  });
});

describe('buildDevDependencies', () => {
  it('installs the test runner only where testing was answered', () => {
    expect(buildDevDependencies(answersFor({}))).toHaveProperty('vitest');
    expect(buildDevDependencies(answersFor({ testing: 'none' }))).not.toHaveProperty('vitest');
  });

  it('installs the stylex lint plugin, the build plugin and its peer', () => {
    const devDependencies = buildDevDependencies(answersFor({ styling: 'stylex' }));

    expect(devDependencies).toHaveProperty('@stylexjs/unplugin');
    expect(devDependencies).toHaveProperty('@stylexjs/eslint-plugin');
    expect(devDependencies).toHaveProperty('unplugin');
    expect(devDependencies).not.toHaveProperty('@stylexjs/babel-plugin');
  });

  it('names the css tokenizer major stylelint reads beside stylex, on every build route', () => {
    const vite = buildDevDependencies(answersFor({ styling: 'stylex' }));
    const next = buildDevDependencies(answersFor({
      target: 'next',
      styling: 'stylex',
    }));
    const plain = buildDevDependencies(answersFor({}));

    expect(vite['@csstools/css-tokenizer']).toMatch(/^\^4\./);
    expect(next['@csstools/css-tokenizer']).toMatch(/^\^4\./);
    expect(plain).not.toHaveProperty('@csstools/css-tokenizer');
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
    expect(Object.hasOwn(buildDevDependencies(answersFor(overrides)), '@html-eslint/eslint-plugin')).toBe(composed);
  });

  it('installs the tanstack query lint plugin beside the query library', () => {
    const devDependencies = buildDevDependencies(answersFor({
      target: 'vue',
      libraries: [],
      data: 'tanstack-query',
    }));

    expect(devDependencies).toHaveProperty('@tanstack/eslint-plugin-query');
  });

  it('gives react native the adapter on top of the shared runner', () => {
    const devDependencies = buildDevDependencies(answersFor({ target: 'react-native' }));

    expect(devDependencies).toHaveProperty('@srsholmes/vitest-react-native');
    expect(devDependencies).toHaveProperty('vitest');
    expect(devDependencies).toHaveProperty('@vitest/coverage-v8');
    expect(devDependencies).not.toHaveProperty('jest');
    expect(devDependencies).not.toHaveProperty('jest-expo');
  });

  it('installs the react lint plugins on react native, less the accessibility one', () => {
    const devDependencies = buildDevDependencies(answersFor({ target: 'react-native' }));

    expect(devDependencies).toHaveProperty('@eslint-react/eslint-plugin');
    expect(devDependencies).toHaveProperty('eslint-plugin-react-hooks');
    expect(devDependencies).not.toHaveProperty('eslint-plugin-jsx-a11y-x');
  });

  it('declares the metro-config of react-native\'s own release, on React Native alone', () => {
    expect(buildDevDependencies(answersFor({ target: 'react-native' }))['@react-native/metro-config'])
      .toBe(VERSIONS['react-native']);
    expect(buildDevDependencies(answersFor({}))).not.toHaveProperty('@react-native/metro-config');
  });

  it('installs neither the React plugin nor its Rolldown preset for an Astro React island', () => {
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
      ['esbuild'],
    ],
  ])('allows the builds %s runs', (_label, overrides, own) => {
    const expected = [
      ...own,
      '@swc/core',
      'fsevents',
      'sharp',
      'unrs-resolver',
    ]
      .sort((left, right) => {
        return left.localeCompare(right, 'en');
      });

    expect(allowedBuildNames(answersFor(overrides))).toEqual(expected);
  });

  it('names the peers nuxt asks the project for', () => {
    const nuxt = buildDevDependencies(answersFor({ target: 'nuxt' }));

    expect(nuxt).toHaveProperty('rolldown');
    expect(nuxt).toHaveProperty('vite');
    expect(buildDevDependencies(answersFor({ target: 'vue' }))).not.toHaveProperty('rolldown');
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
    expect(Object.keys(devDependencies)).toEqual(expect.arrayContaining(tools));
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
  '@react-native/metro-config': '',
  'expo': '~',
  'expo-constants': '~',
  'expo-linking': '~',
  'expo-router': '~',
  'expo-status-bar': '~',
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

      expect(range.slice(0, operator.length), name).toBe(operator);
      expect(range.slice(operator.length), name).toMatch(/^\d+\.\d+\.\d+(?:-[\da-z.]+)?$/u);
    }
  });
});

const siblingIn = (directory: string): Sibling => {
  const path = join(import.meta.dirname, '..', '..', '..', '..', directory, 'package.json');
  const { name, version } = parsePackageJson(readFileSync(path, 'utf8'));

  if (name === undefined || version === undefined) {
    throw new Error(`${path} declares no name or version`);
  }

  return {
    name,
    version,
  };
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
    expect(staleAgainst(dependencies, 'eslint-config')).toEqual([]);
  });

  it('ships nothing older than the version this workspace installs', () => {
    const entries = catalogEntries();

    expect(entries.length).toBeGreaterThan(0);
    expect(staleAgainst(entries, 'catalog')).toEqual([]);
  });
});

describe('MANAGER_FLOORS against the workspace', () => {
  it('floors pnpm no higher than the one this workspace runs', () => {
    const path = join(import.meta.dirname, '..', '..', '..', '..', '..', 'package.json');
    const { packageManager } = parsePackageJson(readFileSync(path, 'utf8'));
    const running = String(packageManager).replace('pnpm@', '');

    expect(atLeast(running, MANAGER_FLOORS.pnpm)).toBe(true);
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
    const svelte = buildDependencies(answersFor({
      target: 'svelte',
      languages: ['ja'],
    }));

    expect(Object.keys(translated)).toEqual(expect.arrayContaining([
      'i18next',
      'i18next-browser-languagedetector',
      'react-i18next',
    ]));
    expect(english).not.toHaveProperty('i18next');
    expect(vue).toHaveProperty('vue-i18n');
    expect(vue).not.toHaveProperty('i18next');
    expect(svelte).not.toHaveProperty('i18next');
  });
});
