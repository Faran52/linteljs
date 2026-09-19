import {
  type Answers,
  type Form,
  type Framework,
  hasLibrary,
  hasTests,
  type Library,
  type Router,
} from '../../../answers/answers';
import { NODE_ENGINE, PACKAGE_MANAGER_VERSIONS } from '../../../config/engines';
import { targetFor } from '../../../targets';
import { type Artifact, merged } from '../../artifact';
import { VERSIONS } from '../../config/versions';
import { buildScripts } from '../../utils/scriptUtils';

import type { TargetRecord } from '../../../targets/record';
import type { ProjectShape } from '../../projectShape';

// Patches rather than writes: the scaffolder's dependencies, name and scripts survive.

export interface PackageJson {
  name?: string;
  version?: string;
  private?: boolean;
  type?: string;
  packageManager?: string;
  engines?: Record<string, string>;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  overrides?: Record<string, string>;
  resolutions?: Record<string, string>;
  trustedDependencies?: string[];
  allowScripts?: Record<string, boolean | string>;
}

// Superseded by @linteljs/eslint-config.
const SUPERSEDED = [
  'prettier',
  'eslint-config-prettier',
  'eslint-plugin-prettier',
  '@eslint/js',
  'globals',
  'typescript-eslint',
  'eslint-plugin-react-refresh',
  'oxlint',
  // create-vue's two: one is only called from the replaced vite.config.ts, jsdom is not the chosen environment.
  'vite-plugin-vue-devtools',
  'jsdom',
];

const SHARED_DEV_DEPENDENCIES = [
  '@commitlint/cli',
  '@commitlint/config-conventional',
  // Declared: a scaffolder without its own copy fails tsc on "Cannot find type definition file for 'node'".
  '@types/node',
  'eslint',
  '@linteljs/eslint-config',
  'husky',
  'lint-staged',
  'stylelint',
  'stylelint-config-recess-order',
  'stylelint-config-standard',
  'stylelint-order',
];

// Omitting @vitest/eslint-plugin fails the first `eslint .`, not the install.
// `vite` is vitest's required peer; npm under `legacy-peer-deps` installs no peers, so it is named outright.
const RUNNER_DEV_DEPENDENCIES = [
  '@vitest/coverage-v8',
  '@vitest/eslint-plugin',
  'happy-dom',
  'vite',
  'vitest',
];

const HTML_DEV_DEPENDENCIES = ['@html-eslint/eslint-plugin', '@html-eslint/parser'];

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

// A host with no framework installs nothing at runtime.
const TANSTACK_QUERY_BINDINGS: Record<Framework, string> = {
  'react': '@tanstack/react-query',
  'next': '@tanstack/react-query',
  'react-native': '@tanstack/react-query',
  'vue': '@tanstack/vue-query',
  'svelte': '@tanstack/svelte-query',
  'solid': '@tanstack/solid-query',
  'angular': '@tanstack/angular-query-experimental',
};

const TANSTACK_FORM_BINDINGS: Record<Framework, string> = {
  'react': '@tanstack/react-form',
  'next': '@tanstack/react-form',
  'react-native': '@tanstack/react-form',
  'vue': '@tanstack/vue-form',
  'svelte': '@tanstack/svelte-form',
  'solid': '@tanstack/solid-form',
  'angular': '@tanstack/angular-form',
};

const ROUTER_DEPENDENCIES: Record<Router, string[]> = {
  'react-router': ['react-router'],
  'tanstack-router': ['@tanstack/react-router'],
};

const ROUTER_DEV_DEPENDENCIES: Record<Router, string[]> = {
  'react-router': [],
  'tanstack-router': ['@tanstack/router-plugin', '@tanstack/eslint-plugin-router'],
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
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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

  const sorted = [...new Set(names.filter(Boolean))].sort((left, right) => {
    return left.localeCompare(right, 'en');
  });

  for (const name of sorted) {
    const version = VERSIONS[name];

    if (version === undefined) {
      throw new Error(`No version in VERSIONS for ${name}; add one to src/emitters/config/versions.ts`);
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

  // Vue's slot has no dependency: create-vue installs Pinia itself.
  const store = target.store;

  if (answers.store && store?.dependency !== undefined) {
    names.push(store.dependency);
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

/**
 * Install scripts every project approves; pnpm writes them to `pnpm-workspace.yaml`, bun reads `trustedDependencies`,
 * npm reads `allowScripts`. Yarn is absent because it runs install scripts by default and has nothing to approve.
 *
 * One list for all three, not a shared pair plus an npm-only pair. Measured with
 * `pnpm --filter @linteljs/create collect:builds`, which installs the maximal dependency set of all seventeen target
 * and hosted-framework combinations against pnpm and npm and reports what each would refuse to build:
 *
 * - `unrs-resolver` every target reaches, through `eslint-import-resolver-typescript`.
 * - `fsevents` npm 12 refuses on eleven of the seventeen, as an optional dependency of the watchers in each tree.
 *   npm 11 only warns, so it reports nothing and this entry looks dead on the version a project declares.
 * - `sharp` and `@swc/core` no combination reaches, on either manager, and both stay. Measured: an allowance for a
 *   package that is not installed is silent on pnpm and on npm 12, down to a name no registry has, so each costs a
 *   line. Without them, the day something pulls one, a user's first install stops; with them, the next
 *   `collect:builds` reports the change and nobody is interrupted. `create-next-app` writes
 *   `ignoredBuiltDependencies: - sharp` into its own scaffold, which is the ecosystem saying a Next tree meets it.
 *
 * Add a name because that script reported it, or because it is obviously of this kind. Removing one buys nothing.
 */
const ALLOWED_BUILDS = ['@swc/core', 'fsevents', 'sharp', 'unrs-resolver'];

export const allowedBuildNames = (answers: Answers): string[] => {
  return [...new Set([...ALLOWED_BUILDS, ...targetFor(answers).allowBuilds])].sort((left, right) => {
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
  const managerVersion = PACKAGE_MANAGER_VERSIONS[answers.packageManager];

  return {
    ...packageJson,
    type: 'module',
    packageManager: `${answers.packageManager}@${managerVersion}`,
    engines: {
      node: NODE_ENGINE,
      [answers.packageManager]: `>=${managerVersion}`,
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
