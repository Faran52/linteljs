import { uniq } from 'es-toolkit';

import {
  type Answers,
  type Data,
  type Form,
  type Framework,
  type Library,
  type PackageManager,
  type Styling,
} from '@config/types';

import {
  hasLibrary,
  hasTests,
  localesOf,
} from '@utils/answerUtils';
import { isJsonObject } from '@utils/objectUtils';

import {
  type ScopedOverride,
  targetFor,
  type TargetRecord,
} from '@targets';

import {
  ALLOWED_BUILDS,
  HTML_DEV_DEPENDENCIES,
  ROUTER_DEPENDENCIES,
  ROUTER_DEV_DEPENDENCIES,
  RUNNER_DEV_DEPENDENCIES,
  SHARED_DEV_DEPENDENCIES,
  STORE_BINDINGS,
  STORE_DEPENDENCIES,
  TANSTACK_FORM_BINDINGS,
  TANSTACK_QUERY_BINDINGS,
  VERSIONS,
} from '../constants';

type Overrides = Record<string, string | Record<string, string>>;

export interface DevEngine {
  name: string;
  version?: string;
  onFail?: string;
}

export interface PackageJson {
  name?: string;
  version?: string;
  private?: boolean;
  main?: string;
  type?: string;
  packageManager?: string;
  engines?: Record<string, string>;
  devEngines?: Record<string, DevEngine>;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  overrides?: Overrides;
  resolutions?: Record<string, string>;
  trustedDependencies?: string[];
  allowScripts?: Record<string, boolean | string>;
}

interface Pin {
  parent: string;
  name: string;
  version: string;
}

// Nuxt takes the Vite plugin: its `postcss-import` reads `@import "tailwindcss"` off disk and fails.
const usesTailwindVitePlugin = (target: TargetRecord): boolean => {
  return target.vitePlugin !== undefined || target.astro === true || target.nuxtProject === true;
};

const tailwindDevDependencies = (target: TargetRecord): string[] => {
  return [
    usesTailwindVitePlugin(target) ? '@tailwindcss/vite' : '@tailwindcss/postcss',
    'stylelint-config-tailwindcss',
    'tailwindcss',
    ...target.tailwind?.devDependencies ?? [],
  ];
};

const libraryDependencies = (answers: Answers, target: TargetRecord): string[] => {
  const { framework } = target;

  const bound = (bindings: Record<Framework, string>): string[] => {
    return framework === undefined ? [] : [bindings[framework]];
  };

  const runtime: Record<Library, string[]> = {
    'zod': ['zod'],
    'es-toolkit': ['es-toolkit'],
    'ts-pattern': ['ts-pattern'],
    't3-env': [answers.target === 'next' ? '@t3-oss/env-nextjs' : '@t3-oss/env-core'],
  };
  const styling: Record<Styling, string[]> = {
    tailwind: target.tailwind?.dependencies ?? [],
    stylex: ['@stylexjs/stylex'],
  };
  // `rtk-query` is `@reduxjs/toolkit`, which the store it requires already brings.
  const data: Record<Data, string[]> = {
    'tanstack-query': bound(TANSTACK_QUERY_BINDINGS),
    'rtk-query': [],
  };
  const forms: Record<Form, string[]> = {
    'tanstack-form': bound(TANSTACK_FORM_BINDINGS),
    'react-hook-form': ['react-hook-form', ...(hasLibrary(answers, 'zod') ? ['@hookform/resolvers'] : [])],
  };

  return [
    // `http.ts` ships on every project and `qs` is what it builds a querystring with.
    'qs',
    ...answers.libraries
      .flatMap((library) => {
        return runtime[library];
      }),
    ...(answers.styling === undefined ? [] : styling[answers.styling]),
    ...(answers.data === undefined ? [] : data[answers.data]),
    ...(answers.form === undefined ? [] : forms[answers.form]),
    ...(localesOf(answers).length === 0 ? [] : target.i18n?.dependencies ?? []),
  ];
};

const isPackageJson = (value: unknown): value is PackageJson => {
  return isJsonObject(value);
};

export const parsePackageJson = (text: string): PackageJson => {
  const parsed: unknown = JSON.parse(text);

  if (!isPackageJson(parsed)) {
    throw new Error('package.json does not contain a JSON object');
  }

  return parsed;
};

// Throws on a missing entry rather than silently dropping it.
export const versioned = (names: string[], pins: Record<string, string> = {}): Record<string, string> => {
  const result: Record<string, string> = {};

  const sorted = uniq(names)
    .sort((left, right) => {
      return left.localeCompare(right, 'en');
    });

  for (const name of sorted) {
    const version = pins[name] ?? VERSIONS[name];

    if (version === undefined) {
      throw new Error(`No version in VERSIONS for ${name}; add one to src/emitters/constants.ts`);
    }

    result[name] = version;
  }

  return result;
};

// bun reads a scoped override from 1.4 only, below the 1.2 floor, so its pin stays global.
const SCOPED_KEYS: Record<Exclude<PackageManager, 'npm'>, (parent: string, name: string) => string> = {
  pnpm: (parent, name) => {
    return `${parent}>${name}`;
  },
  yarn: (parent, name) => {
    return `${parent}/${name}`;
  },
  bun: (_parent, name) => {
    return name;
  },
};

export const pinned = (overrides: ScopedOverride[], versions: Record<string, string>): Pin[] => {
  return Object.entries(versions)
    .flatMap(([name, version]) => {
      return overrides
        .filter((override) => {
          return override.name === name;
        })
        .map(({ parent }) => {
          return {
            parent,
            name,
            version,
          };
        });
    });
};

const pinsFor = (answers: Answers): Pin[] => {
  const scoped = answers.styling === 'tailwind' ? targetFor(answers).tailwind?.overrides ?? [] : [];

  return pinned(scoped, versioned(scoped
    .map(({ name }) => {
      return name;
    })));
};

export const flatOverrides = (answers: Answers, pm: Exclude<PackageManager, 'npm'>): Record<string, string> => {
  const keyFor = SCOPED_KEYS[pm];

  return Object.fromEntries(pinsFor(answers)
    .map(({
      parent,
      name,
      version,
    }) => {
      return [keyFor(parent, name), version];
    }));
};

export const buildOverrides = (answers: Answers): Overrides => {
  const pm = answers.packageManager;

  if (pm !== 'npm') {
    return flatOverrides(answers, pm);
  }

  const nested: Record<string, Record<string, string>> = {};

  for (const {
    parent,
    name,
    version,
  } of pinsFor(answers)) {
    nested[parent] = {
      ...nested[parent],
      [name]: version,
    };
  }

  return nested;
};

export const buildDependencies = (answers: Answers): Record<string, string> => {
  const target = targetFor(answers);
  const names = [
    ...libraryDependencies(answers, target),
    ...(answers.router === undefined ? [] : ROUTER_DEPENDENCIES[answers.router]),
  ];

  // A hosted framework is not installed by the host's scaffolder.
  names.push(...target.dependencies ?? []);

  const { store } = answers;

  if (store !== undefined) {
    const binding = target.framework && STORE_BINDINGS[store]?.[target.framework];

    names.push(...STORE_DEPENDENCIES[store], ...binding === undefined ? [] : [binding]);
  }

  return versioned(names, target.versions);
};

export const buildDevDependencies = (answers: Answers): Record<string, string> => {
  const target = targetFor(answers);

  const stylingDev: Record<Styling, string[]> = {
    tailwind: ['eslint-plugin-better-tailwindcss', ...tailwindDevDependencies(target)],
    // Without the build plugin the emitted config imports a module never installed; `unplugin` is a real peer.
    stylex: [
      '@stylexjs/eslint-plugin',
      ...target.stylexBuild ?? ['@stylexjs/unplugin', 'unplugin'],
    ],
  };
  const dataDev: Record<Data, string[]> = {
    'tanstack-query': ['@tanstack/eslint-plugin-query'],
    'rtk-query': [],
  };

  return versioned([
    ...SHARED_DEV_DEPENDENCIES,
    ...(target.sfcExtension === undefined ? [] : ['postcss-html', 'postcss']),
    ...target.devDependencies,
    ...(target.html ? HTML_DEV_DEPENDENCIES : []),
    'typescript',
    ...(hasTests(answers)
      // Yarn installs no peers, and vitest needs `vite`; npm installs it itself.
      ? [
          ...RUNNER_DEV_DEPENDENCIES,
          ...answers.packageManager === 'yarn' ? ['vite'] : [],
          ...target.testDevDependencies ?? [],
        ]
      : []),
    ...(answers.styling === undefined ? [] : stylingDev[answers.styling]),
    ...(answers.data === undefined ? [] : dataDev[answers.data]),
    ...(answers.router === undefined ? [] : ROUTER_DEV_DEPENDENCIES[answers.router]),
    ...(answers.mocking === 'msw' ? ['msw'] : []),
    ...(localesOf(answers).length === 0 ? [] : target.i18n?.compiler?.devDependencies ?? []),
    // `qs` ships no types of its own.
    '@types/qs',
  ], target.versions);
};

export const allowedBuildNames = (answers: Answers): string[] => {
  // MSW's install script copies `mockServiceWorker.js`; without this the install stops and asks.
  const mocking = answers.mocking === 'msw' ? ['msw'] : [];

  return uniq([
    ...ALLOWED_BUILDS,
    ...mocking,
    ...targetFor(answers).allowBuilds,
  ])
    .sort((left, right) => {
      return left.localeCompare(right, 'en');
    });
};
