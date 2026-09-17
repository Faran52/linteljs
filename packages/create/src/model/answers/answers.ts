// `AliasMap`, `NamingMap`, `Framework`, `LibraryLayer`, `ResolverOptions` and `DefineConfigOptions` mirror
// `@linteljs/eslint-config/src/types.ts`, redeclared not imported so `@linteljs/create` installs before it.

export type TargetId
  = 'react'
    | 'next'
    | 'vue'
    | 'svelte'
    | 'solid'
    | 'angular'
    | 'astro'
    | 'webextension'
    | 'react-native';

export type PackageManager
  = 'pnpm'
    | 'npm'
    | 'yarn'
    | 'bun';

export type Testing = 'vitest' | 'none';

// `strict` bans casts, `unknown` outside a guard, index signatures and suppression directives.
export type TypeSafety = 'strict' | 'relaxed';

export type Library
  = 'zod'
    | 'tanstack-query'
    | 'tailwind'
    | 'es-toolkit'
    | 'ts-pattern'
    | 't3-env';

// One choice, not two libraries: a project binds one form library or none. `react-hook-form` binds React only.
export type Form = 'tanstack-form' | 'react-hook-form';

export type Router = 'react-router' | 'tanstack-router';

// Decides the manifest shape and the ambient types; `crx` builds for both.
export type Browser = 'chrome' | 'firefox';

// The four with both a Vite plugin and an Astro integration; Angular and Next are not hostable.
export type HostedFramework
  = 'react'
    | 'vue'
    | 'svelte'
    | 'solid';

// A surface decides what the manifest names, which starter files exist, and what the build needs an entry for.
export type Surface
  = 'popup'
    | 'background'
    | 'devtools-panel';

export type Agent = 'claude-code' | 'codex' | 'copilot' | 'cursor';

export type Plugin = 'ponytail' | 'context7' | 'frontend-design';

export interface Answers {
  target: TargetId;
  // Asked only for the extension target.
  browser: Browser;
  // Absent means the host's own plain-TypeScript shape.
  hostedFramework?: HostedFramework;
  // Absent means `popup` and `background`, the only shape written before the answer existed.
  surfaces?: Surface[];
  testing: Testing;
  packageManager: PackageManager;
  libraries: Library[];
  // Absent is no form library.
  form?: Form;
  // Asked only where the target has a `routers` slot; absent is no router.
  router?: Router;
  // Always false on a target with no `store` slot, where the question is never asked.
  store: boolean;
  typeSafety: TypeSafety;
  agents: Agent[];
  plugins: Plugin[];
  // Never asked: a fact about a project's dependencies, edited into `lintel.config.json` by hand when one needs it.
  resolveConditions?: string[];
  // Never asked: the directories a project grew. Recorded here because `eslint.config.js` is emitted whole, so an
  // alias added there was lost on the next `sync`. A value ending in `/*` names a directory, otherwise a barrel.
  aliases?: AliasMap;
  // The browsers the extension is packaged for; one bundle, one manifest each, since Chrome rejects
  // `browser_specific_settings` and AMO requires it. Absent means just `browser`.
  browsers?: Browser[];
  // Paths this project lints nothing in. Not for build outputs, which `.gitignore` already covers: for a generated
  // file the project commits.
  ignores?: string[];
}

export type AliasMap = Record<string, string>;

export type NamingConvention
  = 'PASCAL_CASE'
    | 'CAMEL_CASE'
    | 'KEBAB_CASE';

// A case name or a raw glob; `check-file` micromatches the basename, so a folder rule can admit `[slug]`.
export type NamingRule = NamingConvention | (string & {});

export type NamingMap = Record<string, NamingRule>;

export type Framework
  = 'react'
    | 'next'
    | 'react-native'
    | 'vue'
    | 'svelte'
    | 'solid'
    | 'angular';

// The libraries and routers with a layer behind them; the rest bring no ESLint rules.
export type LibraryLayer = 'tanstack-query' | 'tailwind' | 'tanstack-router';

export interface ResolverOptions {
  project?: string;
  conditionNames?: string[];
  noWarnOnMultipleProjects?: boolean;
}

export interface DefineConfigOptions {
  framework?: Framework;
  typescript?: boolean;
  vitest?: boolean;
  html?: boolean;
  astro?: boolean;
  libraries?: LibraryLayer[];
  tailwindEntryPoint?: string;
  ignores?: string[];
  naming?: NamingMap;
  folderNaming?: NamingMap;
  aliases?: AliasMap;
  resolver?: ResolverOptions;
}

/**
 * Next and React Native render with React, so a React-only answer belongs on all three. `framework` keeps them apart
 * because each takes its own ESLint layer; asking `=== 'react'` instead refused React Hook Form on the two of them,
 * while the TanStack binding map in `emitPackageJson` had always handed all three `@tanstack/react-form`.
 */
export const rendersWithReact = (framework: Framework | undefined): boolean => {
  return framework === 'react' || framework === 'next' || framework === 'react-native';
};

// Emit order, so the written config is stable.
export const LIBRARY_LAYERS: LibraryLayer[] = ['tanstack-query', 'tanstack-router', 'tailwind'];

export const TARGET_IDS: TargetId[] = [
  'react',
  'next',
  'vue',
  'svelte',
  'solid',
  'angular',
  'astro',
  'webextension',
  'react-native',
];

export const PACKAGE_MANAGERS: PackageManager[] = [
  'pnpm',
  'npm',
  'yarn',
  'bun',
];

export const LIBRARIES: Library[] = [
  'zod',
  'tanstack-query',
  'tailwind',
  'es-toolkit',
  'ts-pattern',
  't3-env',
];

export const FORMS: Form[] = ['tanstack-form', 'react-hook-form'];

export const ROUTERS: Router[] = ['react-router', 'tanstack-router'];

export const BROWSERS: Browser[] = ['chrome', 'firefox'];

export const SURFACES: Surface[] = ['popup', 'background', 'devtools-panel'];

// What an older config means by saying nothing.
const DEFAULT_SURFACES: Surface[] = ['popup', 'background'];

export const HOSTED_FRAMEWORKS: HostedFramework[] = [
  'react',
  'vue',
  'svelte',
  'solid',
];

export const AGENTS: Agent[] = ['claude-code', 'codex', 'copilot', 'cursor'];

export const PLUGINS: Plugin[] = ['ponytail', 'context7', 'frontend-design'];

export const DEFAULT_ANSWERS: Answers = {
  target: 'react',
  browser: 'chrome',
  testing: 'vitest',
  packageManager: 'pnpm',
  libraries: ['tailwind'],
  store: false,
  typeSafety: 'strict',
  agents: ['claude-code'],
  plugins: [...PLUGINS],
};

export const hasLibrary = (answers: Answers, library: Library): boolean => {
  return answers.libraries.includes(library);
};

export const surfacesOf = (answers: Answers): Surface[] => {
  return answers.surfaces ?? DEFAULT_SURFACES;
};

export const hasSurface = (answers: Answers, surface: Surface): boolean => {
  return surfacesOf(answers).includes(surface);
};

// `browser` first, so the primary one keeps writing `manifest.json`.
export const browsersOf = (answers: Answers): Browser[] => {
  const extra = (answers.browsers ?? []).filter((browser) => {
    return browser !== answers.browser;
  });

  return [answers.browser, ...extra];
};

export const hasTests = (answers: Answers): boolean => {
  return answers.testing !== 'none';
};

export const TESTING_CHOICES: Testing[] = ['vitest', 'none'];

export const TYPE_SAFETY_CHOICES: TypeSafety[] = ['strict', 'relaxed'];

// npm's own floor is the stricter of directory name and package name, so meeting it meets both.
export const PROJECT_NAME_RULE
  = "a valid npm package name: lowercase letters, digits, '.', '-' and '_' only, starting with a letter or digit, "
    + 'at most 214 characters, and not a reserved npm name';

const PROJECT_NAME_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;
const RESERVED_PROJECT_NAMES = new Set(['favicon.ico', 'node_modules']);

export const isValidProjectName = (name: string): boolean => {
  return name.length <= 214
    && PROJECT_NAME_PATTERN.test(name)
    && !RESERVED_PROJECT_NAMES.has(name);
};
