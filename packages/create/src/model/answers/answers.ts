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

// Which runner a project gets, and `none` for no suite at all. One runner, every target.
export type Testing = 'vitest' | 'none';

// Which floor `scripts/checkBannedPatterns.ts` runs: `strict` bans casts, `unknown` outside a narrowing guard,
// index signatures and suppression directives; `relaxed` keeps only what the compiler can't catch, plus `CustomTypes`.
export type TypeSafety = 'strict' | 'relaxed';

export type Library
  = 'zod'
    | 'tanstack-query'
    | 'tailwind';

// Which browser an extension targets. `@crxjs/vite-plugin` builds for both, so this decides the manifest shape (a
// service worker against an event page), the ambient types, and whether `web-ext` comes along to run and package it.
export type Browser = 'chrome' | 'firefox';

// The UI frameworks a host target can render with. Angular brings its own builder and Next is a framework rather than
// a library, so neither is hostable; these four are the ones with both a Vite plugin and an Astro integration.
export type HostedFramework
  = 'react'
    | 'vue'
    | 'svelte'
    | 'solid';

/**
 * The places an extension puts UI or code. A surface decides three things at once: what the manifest names, what
 * starter files exist, and what the build has to have an entry for. `devtools-panel` is two pages rather than one,
 * because a devtools page's only job is to register the panel the user actually sees.
 */
export type Surface
  = 'popup'
    | 'background'
    | 'devtools-panel';

export type Agent = 'claude-code' | 'codex';

export type Plugin = 'ponytail' | 'context7' | 'frontend-design';

export interface Answers {
  target: TargetId;
  // Asked only for the extension target; `chrome` everywhere else, where nothing reads it.
  browser: Browser;
  // The UI framework a host target renders with, where it hosts one: the extension target and Astro both do, and both
  // work without one. Absent means the host's own plain-TypeScript shape.
  hostedFramework?: HostedFramework;
  // Asked only for the extension target. Absent means `popup` and `background`, which is the only shape this CLI wrote
  // before the answer existed, so a `lintel.config.json` written then still describes its own project.
  surfaces?: Surface[];
  testing: Testing;
  packageManager: PackageManager;
  libraries: Library[];
  // Always false on a target with no `store` slot, where the question is never asked.
  store: boolean;
  typeSafety: TypeSafety;
  agents: Agent[];
  plugins: Plugin[];
  /**
   * Export-map conditions for the import resolver, in the order it tries them. Never asked: it is not a preference but
   * a fact about a project's dependencies, discovered the first time one of them publishes subpaths through a wildcard
   * `exports` map the `types` condition cannot satisfy. Edited into `lintel.config.json` by hand when that happens, and
   * carried from there into the emitted config, so needing it costs a recorded line rather than an override block.
   */
  resolveConditions?: string[];
  /**
   * Aliases this project has beyond the standard set, merged in after it. Never asked, for the same reason
   * `resolveConditions` is not: it is a fact about a layout rather than a preference, and the ones that exist are the
   * directories a project grew that no target record could predict.
   *
   * It has to be recorded rather than hand-edited into the config, because `eslint.config.js` is emitted in full: a
   * project that added an alias there lost it on the next `sync`, and the reference repo carrying nine of them could
   * not adopt the standard without that happening. One line here reaches all three consumers at once, which is the
   * coupling `emitTsconfig.test.ts` already pins.
   *
   * A value ending in `/*` names a directory; one ending in a file names a barrel imported bare, which is what
   * `'@engine': './src/lib/engine/index.ts'` is. Both are real, so neither shape is enforced here.
   */
  aliases?: AliasMap;
  /**
   * The browsers this extension is *packaged* for, where that is more than the one its code targets. Absent means
   * just `browser`, which is every project that ships to one store.
   *
   * A separate answer from `browser` because they are separate facts, which a reference repo shipping to both stores
   * is the proof of: it builds one bundle and swaps the manifest at package time, because the two differ only in
   * `browser_specific_settings`, which Chrome rejects and AMO requires. So `browser` still decides the background
   * shape, the ambient types and the starter code, and this decides how many manifests come out.
   */
  browsers?: Browser[];
  /**
   * Paths this project lints nothing in, beyond the standard list. Recorded for the same reason `aliases` is: the
   * emitted `eslint.config.js` is whole, so an entry added there is gone on the next sync.
   *
   * Deliberately not the place to name a build output. `base()` already ignores whatever `.gitignore` does, which
   * covers every generated directory a project has by definition. What is left is the case that file cannot express:
   * a generated file that is *committed*, which a reference repo has as a compat-data registry its CI regenerates and
   * diffs. Nothing in `.gitignore` can name it, because the point of it is to be in git.
   */
  ignores?: string[];
}

export type AliasMap = Record<string, string>;

export type NamingConvention
  = 'PASCAL_CASE'
    | 'CAMEL_CASE'
    | 'KEBAB_CASE';

// A case name or a raw glob: `check-file` micromatches against the basename, which is what lets a folder rule permit a
// router segment like `[slug]` alongside kebab-case.
export type NamingRule = NamingConvention | (string & {});

export type NamingMap = Record<string, NamingRule>;

// The framework layers the composer knows, by the name its subpath already uses.
export type Framework
  = 'react'
    | 'next'
    | 'vue'
    | 'svelte'
    | 'solid'
    | 'angular';

// The subset of `Library` that has a layer behind it. Zod brings no ESLint rules.
export type LibraryLayer = 'tanstack-query' | 'tailwind';

export interface ResolverOptions {
  project?: string;
  conditionNames?: string[];
}

// What `defineConfig` takes, which is what `artifacts/eslint-config` writes into the call.
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

// Emit order for the `libraries` option, so the written config is stable across runs.
export const LIBRARY_LAYERS: LibraryLayer[] = ['tanstack-query', 'tailwind'];

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
];

export const BROWSERS: Browser[] = ['chrome', 'firefox'];

export const SURFACES: Surface[] = ['popup', 'background', 'devtools-panel'];

// What the target had before the answer existed, and so what an older config means by saying nothing.
const DEFAULT_SURFACES: Surface[] = ['popup', 'background'];

export const HOSTED_FRAMEWORKS: HostedFramework[] = [
  'react',
  'vue',
  'svelte',
  'solid',
];

export const AGENTS: Agent[] = ['claude-code', 'codex'];

export const PLUGINS: Plugin[] = ['ponytail', 'context7', 'frontend-design'];

export const DEFAULT_ANSWERS: Answers = {
  target: 'react',
  browser: 'chrome',
  testing: 'vitest',
  packageManager: 'pnpm',
  libraries: [],
  // No store by default: a fresh project earns a state library the day component state stops being enough.
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

// The browsers a manifest comes out for. `browser` first, so the primary one keeps writing `manifest.json`.
export const browsersOf = (answers: Answers): Browser[] => {
  const extra = (answers.browsers ?? []).filter((browser) => {
    return browser !== answers.browser;
  });

  return [answers.browser, ...extra];
};

// Whether the project has a suite at all; a site that is genuinely vitest-specific keeps the literal instead.
export const hasTests = (answers: Answers): boolean => {
  return answers.testing !== 'none';
};

export const TESTING_CHOICES: Testing[] = ['vitest', 'none'];

export const TYPE_SAFETY_CHOICES: TypeSafety[] = ['strict', 'relaxed'];

// What a project name has to satisfy to be safe both as a directory and as an unscoped npm package name: npm's own
// floor (lowercase, no leading `.`/`_`, URL-safe) is also the strictest of the two, so meeting it meets both.
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
