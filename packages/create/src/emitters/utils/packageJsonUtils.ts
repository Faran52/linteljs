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
  localesOf,
} from '@utils/answerUtils';
import { isJsonObject } from '@utils/objectUtils';
import { rankOf } from '@utils/versionUtils';

import {
  type ScopedOverride,
  targetFor,
  type TargetRecord,
} from '@targets';

import {
  ALLOWED_BUILDS,
  ESLINT_CONFIG_PEERS,
  HTML_DEV_DEPENDENCIES,
  ROUTER_DEPENDENCIES,
  ROUTER_DEV_DEPENDENCIES,
  SHARED_DEV_DEPENDENCIES,
  STORE_BINDINGS,
  STORE_DEPENDENCIES,
  TANSTACK_FORM_BINDINGS,
  TANSTACK_QUERY_BINDINGS,
  TEST_RUNNERS,
  VERSIONS,
} from '../constants';

import { testRunnerOf } from './runnerUtils';

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
  types?: string;
  exports?: Record<string, string | Record<string, string>>;
  files?: string[];
  imports?: Record<string, string>;
  type?: string;
  workspaces?: string[];
  packageManager?: string;
  engines?: Record<string, string>;
  devEngines?: Record<string, DevEngine>;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
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

export interface Upgrade {
  name: string;
  from?: string;
  to: string;
}

export interface DependencyDrift {
  upgrades: Upgrade[];
  peers: Upgrade[];
}

const LINTELJS_SCOPE = '@linteljs/';

// Nuxt takes the Vite plugin: its `postcss-import` reads `@import "tailwindcss"` off disk and fails.
const usesTailwindVitePlugin = (target: TargetRecord): boolean => {
  return target.vitePlugin !== undefined || target.astro === true || target.nuxtProject === true;
};

const tailwindDevDependencies = (target: TargetRecord): string[] => {
  const devDependencies: string[] = [
    usesTailwindVitePlugin(target) ? '@tailwindcss/vite' : '@tailwindcss/postcss',
    'stylelint-config-tailwindcss',
    'tailwindcss',
    ...target.tailwind?.devDependencies ?? [],
  ];

  return devDependencies;
};

const libraryDependencies = (answers: Answers, target: TargetRecord): string[] => {
  const { framework } = target;

  const bound = (bindings: Record<Framework, string>): string[] => {
    const names = framework === undefined ? [] : [bindings[framework]];

    return names;
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

  const dependencies: string[] = [
    // `qs` builds the querystring in `http.ts`, which every app ships.
    ...(target.libraryProject === true ? [] : ['qs']),
    ...answers.libraries
      .flatMap((library) => {
        return runtime[library];
      }),
    ...(answers.styling === undefined ? [] : styling[answers.styling]),
    ...(answers.data === undefined ? [] : data[answers.data]),
    ...(answers.form === undefined ? [] : forms[answers.form]),
    ...(localesOf(answers).length === 0 ? [] : target.i18n?.dependencies ?? []),
  ];

  return dependencies;
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

// bun reads a scoped override from 1.4 only, above the 1.2 floor, so its pin stays global.
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
          const pin: Pin = {
            parent,
            name,
            version,
          };

          return pin;
        });
    });
};

const pinsFor = (answers: Answers): Pin[] => {
  const target = targetFor(answers);
  const scoped = [
    ...target.overrides ?? [],
    ...(answers.styling === 'tailwind' ? target.tailwind?.overrides ?? [] : []),
  ];

  const scopedNames = scoped
    .map(({ name }) => {
      return name;
    });
  const versions = versioned(scopedNames);

  return pinned(scoped, versions);
};

export const flatOverrides = (answers: Answers, pm: Exclude<PackageManager, 'npm'>): Record<string, string> => {
  const keyFor = SCOPED_KEYS[pm];

  const overrideEntries = pinsFor(answers)
    .map(({
      parent,
      name,
      version,
    }) => {
      const overrideEntry: [string, string] = [keyFor(parent, name), version];

      return overrideEntry;
    });

  return Object.fromEntries(overrideEntries);
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

    names.push(...STORE_DEPENDENCIES[store]);

    if (binding !== undefined) {
      names.push(binding);
    }
  }

  return versioned(names, target.versions);
};

export const buildDevDependencies = (answers: Answers): Record<string, string> => {
  const target = targetFor(answers);
  const runner = testRunnerOf(answers);
  const domDevDependencies = runner === undefined || target.libraryProject === true
    ? []
    : TEST_RUNNERS[runner].domDevDependencies;

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
    ...domDevDependencies,
    ...(runner === undefined
      ? []
      : [
          ...TEST_RUNNERS[runner].devDependencies,
          ...answers.packageManager === 'yarn' ? TEST_RUNNERS[runner].yarnPeers : [],
          ...target.testDevDependencies ?? [],
        ]),
    ...(answers.styling === undefined ? [] : stylingDev[answers.styling]),
    ...(answers.data === undefined ? [] : dataDev[answers.data]),
    ...(answers.router === undefined ? [] : ROUTER_DEV_DEPENDENCIES[answers.router]),
    ...(answers.mocking === 'msw' ? ['msw'] : []),
    ...(localesOf(answers).length === 0 ? [] : target.i18n?.compiler?.devDependencies ?? []),
    // `qs` ships no types of its own.
    ...(target.libraryProject === true ? [] : ['@types/qs']),
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

const rankOfRange = (range: string): number => {
  const version = range.replace(/^\D+/, '');

  return rankOf(version);
};

// A range that is not a version (`workspace:*`, `link:`) ranks NaN and is never moved.
const isBehind = (from: string | undefined, to: string): boolean => {
  return from === undefined || rankOfRange(from) < rankOfRange(to);
};

// What `sync` may change in a project's dependencies: its own packages, and the peers its lint config needs.
export const dependencyDrift = (existing: PackageJson, answers: Answers): DependencyDrift => {
  const installed = {
    ...existing.devDependencies,
    ...existing.dependencies,
  };
  const upgrades: Upgrade[] = [];
  const peers: Upgrade[] = [];
  const wanted = buildDevDependencies(answers);

  for (const [name, to] of Object.entries(wanted)) {
    const from = installed[name];

    if (!isBehind(from, to)) {
      continue;
    }

    const upgrade: Upgrade = {
      name,
      ...(from === undefined ? {} : { from }),
      to,
    };

    if (name.startsWith(LINTELJS_SCOPE)) {
      upgrades.push(upgrade);
    }

    // ESLint cannot load the `eslint.config.ts` sync writes without `jiti`.
    if (ESLINT_CONFIG_PEERS.includes(name) || name === 'jiti') {
      peers.push(upgrade);
    }
  }

  const drift: DependencyDrift = {
    upgrades,
    peers,
  };

  return drift;
};

export const serializedPackageJson = (packageJson: PackageJson): string => {
  return `${JSON.stringify(packageJson, null, 2)}\n`;
};

// Before the first name that sorts after it, so a sorted list stays sorted and an unsorted one keeps its order.
// A name already there keeps its place, since `fromEntries` overwrites a repeated key where it first stood.
const withRange = (record: Record<string, string>, name: string, range: string): Record<string, string> => {
  const entries = Object.entries(record);
  const after = entries
    .findIndex(([key]) => {
      return key.localeCompare(name, 'en') > 0;
    });
  const at = after === -1 ? entries.length : after;

  const added = entries.toSpliced(at, 0, [name, range]);

  return Object.fromEntries(added);
};

// Only the named entries move, each in the field the project keeps it in.
export const upgradedPackageJson = (existing: PackageJson, upgrades: Upgrade[]): PackageJson => {
  const dependencies = { ...existing.dependencies };
  let devDependencies = { ...existing.devDependencies };

  for (const { name, to } of upgrades) {
    if (name in dependencies) {
      dependencies[name] = to;
    }
    else {
      devDependencies = withRange(devDependencies, name, to);
    }
  }

  const upgraded: PackageJson = {
    ...existing,
    ...(existing.dependencies === undefined ? {} : { dependencies }),
    devDependencies,
  };

  return upgraded;
};
