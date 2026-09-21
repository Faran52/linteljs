import { compact, uniq } from 'es-toolkit';

import {
  MANAGER_BINARIES,
  MANAGER_FLOORS,
  NODE_ENGINE,
} from '@config/constants';
import {
  type Artifact,
  type Framework,
  type ProjectShape,
} from '@config/types';

import { isJsonObject } from '@utils/objectUtils';

import {
  type Answers,
  type Form,
  hasLibrary,
  hasTests,
  type Library,
} from '@answers';
import { targetFor } from '@targets';

import { merged } from '../../utils/artifactUtils';
import { buildScripts } from '../utils/scriptUtils';

import {
  ALLOWED_BUILDS,
  HTML_DEV_DEPENDENCIES,
  ROUTER_DEPENDENCIES,
  ROUTER_DEV_DEPENDENCIES,
  RUNNER_DEV_DEPENDENCIES,
  SHARED_DEV_DEPENDENCIES,
  STORE_BINDINGS,
  STORE_DEPENDENCIES,
  SUPERSEDED,
  TANSTACK_FORM_BINDINGS,
  TANSTACK_QUERY_BINDINGS,
  VERSIONS,
} from './constants';

import type { TargetRecord } from '@targets/types';

// Patches rather than writes: the scaffolder's dependencies, name and scripts survive.

// npm's `devEngines` entry: `runtime` is the one a scaffolder writes, `packageManager` the one written here.
export interface DevEngine {
  name: string;
  version?: string;
  onFail?: string;
}

export interface PackageJson {
  name?: string;
  version?: string;
  private?: boolean;
  type?: string;
  packageManager?: string;
  engines?: Record<string, string>;
  devEngines?: Record<string, DevEngine>;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  overrides?: Record<string, string>;
  resolutions?: Record<string, string>;
  trustedDependencies?: string[];
  allowScripts?: Record<string, boolean | string>;
}

// Astro calls `@tailwindcss/vite` from `astro.config.mjs` while owning no vite config, so this reads the record
// rather than `vite`. Next, Angular and React Native take PostCSS.
const usesTailwindVitePlugin = (target: TargetRecord): boolean => {
  return target.vite || target.astro === true;
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
    'tanstack-query': bound(TANSTACK_QUERY_BINDINGS),
    'tailwind': target.tailwind?.dependencies ?? [],
    'es-toolkit': ['es-toolkit'],
    'ts-pattern': ['ts-pattern'],
    't3-env': [answers.target === 'next' ? '@t3-oss/env-nextjs' : '@t3-oss/env-core'],
  };
  const forms: Record<Form, string[]> = {
    'tanstack-form': bound(TANSTACK_FORM_BINDINGS),
    'react-hook-form': ['react-hook-form', ...(hasLibrary(answers, 'zod') ? ['@hookform/resolvers'] : [])],
  };

  return [
    ...answers.libraries.flatMap((library) => {
      return runtime[library];
    }),
    ...(answers.form === undefined ? [] : forms[answers.form]),
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

// Sorted and de-duped like a package manager writes back. Throws on a missing entry: a silent skip is how
// @types/node vanished before.
export const versioned = (names: string[]): Record<string, string> => {
  const result: Record<string, string> = {};

  const sorted = uniq(compact(names)).sort((left, right) => {
    return left.localeCompare(right, 'en');
  });

  for (const name of sorted) {
    const version = VERSIONS[name];

    if (version === undefined) {
      throw new Error(`No version in VERSIONS for ${name}; add one to src/emitters/always/package-json/constants.ts`);
    }

    result[name] = version;
  }

  return result;
};

export const buildDependencies = (answers: Answers): Record<string, string> => {
  const target = targetFor(answers);
  const names = [
    ...libraryDependencies(answers, target),
    ...(answers.router === undefined ? [] : ROUTER_DEPENDENCIES[answers.router]),
  ];

  // A hosted framework is not installed by the host's scaffolder.
  names.push(...target.dependencies ?? []);

  // The chosen store's own packages, and the one that binds it to the framework rendering it where there is one.
  const { store } = answers;

  if (store !== undefined) {
    const binding = target.framework === undefined ? undefined : STORE_BINDINGS[store]?.[target.framework];

    names.push(...STORE_DEPENDENCIES[store], ...binding === undefined ? [] : [binding]);
  }

  return versioned(names);
};

export const buildDevDependencies = (answers: Answers): Record<string, string> => {
  const target = targetFor(answers);

  const optional: Partial<Record<Library, string[]>> = {
    'tanstack-query': ['@tanstack/eslint-plugin-query'],
    'tailwind': ['eslint-plugin-better-tailwindcss', ...tailwindDevDependencies(target)],
  };

  return versioned([
    ...SHARED_DEV_DEPENDENCIES,
    // Stylelint's syntax for an SFC `<style>` block.
    ...(target.sfcExtension === undefined ? [] : ['postcss-html']),
    ...target.devDependencies,
    ...(target.html ? HTML_DEV_DEPENDENCIES : []),
    'typescript',
    ...(hasTests(answers)
      ? [...RUNNER_DEV_DEPENDENCIES, ...target.testDevDependencies ?? []]
      : []),
    ...answers.libraries.flatMap((library) => {
      return optional[library] ?? [];
    }),
    ...(answers.router === undefined ? [] : ROUTER_DEV_DEPENDENCIES[answers.router]),
  ]);
};

const withoutSuperseded = (dependencies: Record<string, string>): Record<string, string> => {
  return Object.fromEntries(
    Object.entries(dependencies).filter(([name]) => {
      return !SUPERSEDED.includes(name);
    }),
  );
};

export const allowedBuildNames = (answers: Answers): string[] => {
  return uniq([...ALLOWED_BUILDS, ...targetFor(answers).allowBuilds]).sort((left, right) => {
    return left.localeCompare(right, 'en');
  });
};

export const patchPackageJson = (existing: PackageJson, answers: Answers): PackageJson => {
  const packageJson = { ...existing };

  Reflect.deleteProperty(packageJson, 'linteljs');

  const dependencies = {
    ...existing.dependencies,
    ...buildDependencies(answers),
  };
  // Filtered before the merge: a package this target names is not one the scaffolder left behind.
  const devDependencies = {
    ...withoutSuperseded(existing.devDependencies ?? {}),
    ...buildDevDependencies(answers),
  };
  const pm = answers.packageManager;
  // What a project installs with is the command, not the id: `yarn-classic` is yarn 1 and declares itself `yarn`.
  const binary = MANAGER_BINARIES[pm];
  // The manager that invoked the CLI, or the floor where a config predates the recording of it.
  const version = answers.packageManagerVersion ?? MANAGER_FLOORS[pm];

  return {
    ...packageJson,
    type: 'module',
    // No bun field: neither corepack nor pnpm's switch knows bun, and `engines.bun` says what this would have.
    ...(pm === 'bun' ? {} : { packageManager: `${binary}@${version}` }),
    engines: {
      node: NODE_ENGINE,
      // The floor rather than the executor's version: the exact one is in `packageManager`, and the floor is what
      // was tested.
      [binary]: `>=${MANAGER_FLOORS[pm]}`,
    },
    devEngines: {
      // Spread first, so a scaffolder's own `runtime` entry survives.
      ...existing.devEngines,
      packageManager: {
        name: binary,
        onFail: 'error',
      },
    },
    scripts: {
      ...existing.scripts,
      ...buildScripts(answers),
    },
    ...(Object.keys(dependencies).length > 0 ? { dependencies } : {}),
    devDependencies,
    // bun blocks every install script it has not been told about, and reads the list from here rather than bunfig.
    ...(answers.packageManager === 'bun' ? { trustedDependencies: allowedBuildNames(answers) } : {}),
    // npm 12 blocks every install script it has not been told about and reads the list from here, not `.npmrc`.
    ...(answers.packageManager === 'npm'
      ? {
          allowScripts: {
            ...existing.allowScripts,
            ...Object.fromEntries(allowedBuildNames(answers).map((name) => {
              return [name, true];
            })),
          },
        }
      : {}),
  };
};

export const emitPackageJson = (existing: PackageJson, answers: Answers): string => {
  return `${JSON.stringify(patchPackageJson(existing, answers), null, 2)}\n`;
};

/**
 * Reached through the artifact list so `sync` runs it too; `name` is consulted only when there is no `package.json`.
 * Merged for the same reason `.gitignore` is: two of three migrations had to add dependencies by hand that their
 * answers already implied.
 */
export const packageJsonEmitter = (answers: Answers, _project: ProjectShape, name: string): Artifact[] => {
  return [merged('package', 'package.json', (current) => {
    return emitPackageJson(current === null ? { name } : parsePackageJson(current), answers);
  })];
};
