import {
  type Answers,
  hasLibrary,
  hasTests,
  type Library,
  type TargetId,
} from '../../model/answers/answers';
import { targetFor } from '../../model/targets';
import { buildScripts } from '../build-scripts/buildScripts';

import {
  NODE_ENGINE,
  PACKAGE_MANAGER_VERSIONS,
  VERSIONS,
} from './versions';

import type { TargetRecord } from '../../model/targets/record';

// Patches `package.json` rather than writing it: the scaffolder's dependencies, name and unset scripts survive.

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
}

// Dropped from the patched `package.json`: @linteljs/eslint-config supersedes every one, the first three as @stylistic.
const SUPERSEDED = [
  'prettier',
  'eslint-config-prettier',
  'eslint-plugin-prettier',
  '@eslint/js',
  'globals',
  'typescript-eslint',
  'eslint-plugin-react-refresh',
  'oxlint',
  // create-vue's two: the devtools plugin is only called from the vite.config.ts this replaces, and jsdom is not the
  // environment the emitted vitest.config.ts picks (happy-dom is).
  'vite-plugin-vue-devtools',
  'jsdom',
  /**
   * `create vite`'s React template declares the Babel plugin; the emitted `vite.config.ts` imports the SWC one
   * instead. React Native keeps its own copy, which is why this filters what a scaffolder brought and not what a
   * target asked for.
   */
  '@vitejs/plugin-react',
];

const SHARED_DEV_DEPENDENCIES = [
  '@commitlint/cli',
  '@commitlint/config-conventional',
  // Declared, not inherited: relying on a scaffolder's own copy makes tsc --noEmit fail on "Cannot find type definition
  // file for 'node'" when it has none.
  '@types/node',
  'eslint',
  '@linteljs/eslint-config',
  'husky',
  'lint-staged',
  'stylelint',
  'stylelint-config-recess-order',
  'stylelint-config-standard',
];

// Optional peer: omitting @vitest/eslint-plugin fails the first `eslint .` on ERR_MODULE_NOT_FOUND, not install.
const RUNNER_DEV_DEPENDENCIES = [
  '@vitest/coverage-v8',
  '@vitest/eslint-plugin',
  'happy-dom',
  'vitest',
];

const HTML_DEV_DEPENDENCIES = ['@html-eslint/eslint-plugin', '@html-eslint/parser'];

/**
 * Whether the target calls `@tailwindcss/vite` from a build config it owns: a `vite.config.ts` for most, the `vite`
 * key of `astro.config.mjs` for Astro, which owns no config file at all. Ownership of a Vite config is the wrong
 * question for exactly that case, so it is read off the record rather than off `vite`. Next, Angular and React Native
 * have neither route and take PostCSS.
 */
const usesTailwindVitePlugin = (target: TargetRecord): boolean => {
  return target.vite || target.astro === true;
};

const tailwindDevDependencies = (target: TargetRecord): string[] => {
  return [
    usesTailwindVitePlugin(target) ? '@tailwindcss/vite' : '@tailwindcss/postcss',
    'stylelint-config-tailwindcss',
    'tailwindcss',
  ];
};

// One binding package per framework; plain TypeScript has none, so nothing is installed at runtime there.
const TANSTACK_QUERY_BINDINGS: Record<TargetId, string> = {
  'react': '@tanstack/react-query',
  'next': '@tanstack/react-query',
  'vue': '@tanstack/vue-query',
  'svelte': '@tanstack/svelte-query',
  'solid': '@tanstack/solid-query',
  'angular': '@tanstack/angular-query-experimental',
  // Whatever framework the site hosts brings its own binding; an Astro island is that framework's component.
  'astro': '',
  'webextension': '',
  'react-native': '@tanstack/react-query',
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

// Sorted and de-duped to match what a package manager writes back, `en` pinned since the output is committed.
// Throws on a missing VERSIONS entry instead of skipping it: a silent skip is how @types/node vanished before.
export const versioned = (names: string[]): Record<string, string> => {
  const result: Record<string, string> = {};

  const sorted = [...new Set(names.filter(Boolean))].sort((left, right) => {
    return left.localeCompare(right, 'en');
  });

  for (const name of sorted) {
    const version = VERSIONS[name];

    if (version === undefined) {
      throw new Error(`No version in VERSIONS for ${name}; add one to src/artifacts/package-json/versions.ts`);
    }

    result[name] = version;
  }

  return result;
};

export const buildDependencies = (answers: Answers): Record<string, string> => {
  const names: string[] = [];

  if (hasLibrary(answers, 'zod')) {
    names.push('zod');
  }

  if (hasLibrary(answers, 'tanstack-query')) {
    names.push(TANSTACK_QUERY_BINDINGS[answers.target]);
  }

  const target = targetFor(answers);

  // A hosted framework is not installed by the host's scaffolder, so the record brings it.
  names.push(...target.dependencies ?? []);

  // Vue's slot has no dependency: its scaffold flag has create-vue install Pinia itself.
  const store = target.store;

  if (answers.store && store?.dependency !== undefined) {
    names.push(store.dependency);
  }

  return versioned(names);
};

export const buildDevDependencies = (answers: Answers): Record<string, string> => {
  const target = targetFor(answers);

  const optional: Record<Library, string[]> = {
    'zod': [],
    'tanstack-query': ['@tanstack/eslint-plugin-query'],
    'tailwind': ['eslint-plugin-better-tailwindcss', ...tailwindDevDependencies(target)],
  };

  return versioned([
    ...SHARED_DEV_DEPENDENCIES,
    // The stylelint syntax for an SFC `<style>` block, named by the config emitted alongside.
    ...(target.sfcExtension === undefined ? [] : ['postcss-html']),
    ...target.devDependencies,
    ...(target.html ? HTML_DEV_DEPENDENCIES : []),
    'typescript',
    ...(hasTests(answers)
      ? [...RUNNER_DEV_DEPENDENCIES, ...target.testDevDependencies ?? []]
      : []),
    ...answers.libraries.flatMap((library) => {
      return optional[library];
    }),
  ]);
};

const withoutSuperseded = (dependencies: Record<string, string>): Record<string, string> => {
  return Object.fromEntries(
    Object.entries(dependencies).filter(([name]) => {
      return !SUPERSEDED.includes(name);
    }),
  );
};

export const patchPackageJson = (existing: PackageJson, answers: Answers): PackageJson => {
  const packageJson = { ...existing };

  Reflect.deleteProperty(packageJson, 'lintel');

  const dependencies = {
    ...existing.dependencies,
    ...buildDependencies(answers),
  };
  // Filtered before the merge, not after: a package this target names for itself is not one the scaffolder left behind.
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
  };
};

export const emitPackageJson = (existing: PackageJson, answers: Answers): string => {
  return `${JSON.stringify(patchPackageJson(existing, answers), null, 2)}\n`;
};
