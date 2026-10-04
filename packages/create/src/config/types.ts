// Here because `targets/` and `answers/` read each other's vocabulary; both take it from below.
export type TargetId
  = 'react'
    | 'next'
    | 'vue'
    | 'nuxt'
    | 'svelte'
    | 'solid'
    | 'angular'
    | 'astro'
    | 'webextension'
    | 'react-native';

export type Browser = 'chrome' | 'firefox';

export type Surface = 'popup' | 'background' | 'devtools-panel';

export type HostedFramework = 'react' | 'vue' | 'svelte' | 'solid';

export type Testing = 'vitest' | 'none';

// The runner a target's suites run on: `testing` asks whether, the target decides which.
export type TestRunner = 'vitest' | 'jest';

export interface TestRunnerParts {
  devDependencies: string[];
  // Yarn installs no peers.
  yarnPeers: string[];
  test: string;
  coverage: string;
  // The tsconfig `types` entry that declares the globals.
  types: string;
  // The msw setup fragment: Jest's CommonJS cannot run Vitest's top-level `await import`.
  mswSetup: string;
}

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

export type Library = 'zod' | 'es-toolkit' | 'ts-pattern' | 't3-env';

export type Styling = 'tailwind' | 'stylex';

export type Form = 'tanstack-form' | 'react-hook-form';

export type Router = 'react-router' | 'react-router-framework' | 'tanstack-router';

export type Store
  = 'zustand'
    | 'redux-toolkit'
    | 'tanstack-store'
    | 'pinia'
    | 'ngrx-signals'
    | 'nanostores';

export type Data = 'tanstack-query' | 'rtk-query';

export type Mocking = 'msw';

export type Language = 'en' | 'ar' | 'ja' | 'ko' | 'zh-CN' | 'zh-TW';

export type TypeSafety = 'strict' | 'relaxed';

export type Agent = 'claude-code' | 'codex' | 'copilot' | 'cursor';

export type Plugin = 'ponytail' | 'context7' | 'frontend-design';

// A record's value reads `Answers` (`plugins.askedWhen`), so this is written out, not derived.
export interface Answers {
  target: TargetId;
  browser: Browser;
  // Absent means `popup` and `background`, the only shape written before the answer existed.
  surfaces?: Surface[];
  // Absent means the host's own plain-TypeScript shape.
  hostedFramework?: HostedFramework;
  testing: Testing;
  packageManager: PackageManager;
  // Absent in a config written before they were recorded.
  packageManagerVersion?: string;
  nodeVersion?: string;
  libraries: Library[];
  // Absent is plain CSS.
  styling?: Styling;
  form?: Form;
  router?: Router;
  // Absent is the framework's own state.
  store?: Store;
  // `rtk-query` is legal only with the Redux store that ships it.
  data?: Data;
  // Absent is an api layer that answers locally.
  mocking?: Mocking;
  // Absent is no i18n. English ships with any choice, as the fallback.
  languages?: Language[];
  typeSafety: TypeSafety;
  agents: Agent[];
  plugins: Plugin[];
  resolveConditions?: string[];
  // A value ending in `/*` names a directory, otherwise a barrel.
  aliases?: AliasMap;
  // One manifest each: Chrome rejects `browser_specific_settings` and AMO requires it.
  browsers?: Browser[];
  // For a generated file the project commits; build outputs are in `.gitignore`.
  ignores?: string[];
}

// `create` records the host's Node and `sync` fills it, so it is always there by write time.
export type HostedAnswers = Answers & Required<Pick<Answers, 'nodeVersion'>>;

export type Stage
  = 'lint'
    | 'package'
    | 'standard'
    | 'install'
    | 'fix';

export type RunOutput = 'capture' | 'inherit';

interface EmittedText {
  text: string;
}

interface CopiedAssets {
  sources: string[];
  transform?: (source: string, current: string | null) => string;
}

interface MergedText {
  merge: (current: string | null) => string;
  // What `sync` writes over a file the project already has, where the project owns more of it than `merge` leaves.
  resync?: (current: string) => string;
}

export type ArtifactContent = CopiedAssets | EmittedText | MergedText;

export interface Artifact {
  stage: Stage;
  target: string;
  content: ArtifactContent;
  executable?: boolean;
  // Installed when missing, never overwritten.
  preserve?: true;
  // Planted only when a project is born; the project owns it from then on.
  seed?: true;
  // A starter test covering source the scaffolder may not have written.
  requires?: string[];
  // A merge `sync` may still delete, because the whole file exists only for the answer that asked for it.
  removable?: true;
}

// One record, so `sync` and `create --existing` discover the same files.
export interface ProjectShape {
  setupTests: readonly string[];
  styleEntries: readonly string[];
}

// Every emitter answers a list, so `buildArtifacts` holds no branch.
export type Emitter = (answers: HostedAnswers, project: ProjectShape, name: string) => Artifact[];

export type AliasMap = Record<string, string>;

type NamingConvention
  = 'PASCAL_CASE'
    | 'CAMEL_CASE'
    | 'KEBAB_CASE';

// `check-file` micromatches the basename, so a folder rule can admit `[slug]`.
type NamingRule = NamingConvention | (string & {});

export type NamingMap = Record<string, NamingRule>;

export type Framework
  = 'react'
    | 'next'
    | 'react-native'
    | 'vue'
    | 'nuxt'
    | 'svelte'
    | 'solid'
    | 'angular';

export type LibraryLayer = 'tanstack-query' | 'tanstack-router' | 'tailwind' | 'stylex';

interface ResolverOptions {
  project?: string;
  conditionNames?: string[];
  noWarnOnMultipleProjects?: boolean;
}

export interface ComposeConfigOptions {
  framework?: Framework;
  typescript?: boolean;
  vitest?: boolean;
  jest?: boolean;
  html?: boolean;
  astro?: boolean;
  libraries?: LibraryLayer[];
  tailwindEntryPoint?: string;
  ignores?: string[];
  naming?: NamingMap;
  folderNaming?: NamingMap;
  aliases?: AliasMap;
  resolver?: ResolverOptions;
  aliasExempt?: string[];
  enforceRelativeImports?: boolean;
}

// Redeclared, not imported: this package installs before eslint-config publishes. `src/types.test.ts` pins them equal.
