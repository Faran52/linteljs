export type TargetId = (typeof TARGET_IDS)[number];

export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

export type Testing = (typeof TESTING_CHOICES)[number];

export type TypeSafety = (typeof TYPE_SAFETY_CHOICES)[number];

export type Library = (typeof LIBRARIES)[number];

export type Form = (typeof FORMS)[number];

export type Router = (typeof ROUTERS)[number];

export type Browser = (typeof BROWSERS)[number];

export type HostedFramework = (typeof HOSTED_FRAMEWORKS)[number];

export type Surface = (typeof SURFACES)[number];

export type Agent = (typeof AGENTS)[number];

export type Plugin = (typeof PLUGINS)[number];

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
  // Never asked: a fact about a project's dependencies, edited into `linteljs.config.json` by hand when one needs it.
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

type NamingConvention
  = 'PASCAL_CASE'
    | 'CAMEL_CASE'
    | 'KEBAB_CASE';

// A case name or a raw glob; `check-file` micromatches the basename, so a folder rule can admit `[slug]`.
type NamingRule = NamingConvention | (string & {});

export type NamingMap = Record<string, NamingRule>;

export type Framework
  = 'react'
    | 'next'
    | 'react-native'
    | 'vue'
    | 'svelte'
    | 'solid'
    | 'angular';

type LibraryLayer = (typeof LIBRARY_LAYERS)[number];

interface ResolverOptions {
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

// `AliasMap`, `NamingMap`, `Framework`, `LibraryLayer`, `ResolverOptions` and `DefineConfigOptions` mirror
// `@linteljs/eslint-config/src/types.ts`, redeclared not imported so `@linteljs/create` installs before it.

// Every answer is a list and the type of its members, in that order: the list is what `prompts/` enumerates and what
// the parser checks against, and spelling the members twice is how the two drift.

export const TARGET_IDS = [
  'react',
  'next',
  'vue',
  'svelte',
  'solid',
  'angular',
  'astro',
  'webextension',
  'react-native',
] as const;

export const PACKAGE_MANAGERS = [
  'pnpm',
  'npm',
  'yarn',
  'bun',
] as const;

export const TESTING_CHOICES = ['vitest', 'none'] as const;

// `strict` bans casts, `unknown` outside a guard, index signatures and suppression directives.
export const TYPE_SAFETY_CHOICES = ['strict', 'relaxed'] as const;

export const LIBRARIES = [
  'zod',
  'tanstack-query',
  'tailwind',
  'es-toolkit',
  'ts-pattern',
  't3-env',
] as const;

// One choice, not two libraries: a project binds one form library or none. `react-hook-form` binds React only.
export const FORMS = ['tanstack-form', 'react-hook-form'] as const;

export const ROUTERS = ['react-router', 'tanstack-router'] as const;

// Decides the manifest shape and the ambient types; `crx` builds for both.
export const BROWSERS = ['chrome', 'firefox'] as const;

// The four with both a Vite plugin and an Astro integration; Angular and Next are not hostable.
export const HOSTED_FRAMEWORKS = [
  'react',
  'vue',
  'svelte',
  'solid',
] as const;

// A surface decides what the manifest names, which starter files exist, and what the build needs an entry for.
export const SURFACES = ['popup', 'background', 'devtools-panel'] as const;

export const AGENTS = ['claude-code', 'codex', 'copilot', 'cursor'] as const;

export const PLUGINS = ['ponytail', 'context7', 'frontend-design'] as const;

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

// What an older config means by saying nothing.
const DEFAULT_SURFACES: Surface[] = ['popup', 'background'];

// The libraries and routers with a layer behind them, in emit order so the written config is stable; the rest bring
// no ESLint rules.
export const LIBRARY_LAYERS = ['tanstack-query', 'tanstack-router', 'tailwind'] as const;

/**
 * Next and React Native render with React, so a React-only answer belongs on all three. `framework` keeps them apart
 * because each takes its own ESLint layer; asking `=== 'react'` instead refused React Hook Form on the two of them,
 * while the TanStack binding map in `emitPackageJson` had always handed all three `@tanstack/react-form`.
 */
export const rendersWithReact = (framework: Framework | undefined): boolean => {
  return framework === 'react' || framework === 'next' || framework === 'react-native';
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
