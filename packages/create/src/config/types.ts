/**
 * The vocabulary every ring shares: `emitters/` builds an artifact, `disk/` writes it, `pipeline/` sequences
 * them by stage and `terminal/` names a stage on `--skip`. No ring owns any of it, so it sits below all of them
 * rather than inside the one that happens to construct it most often.
 */

/*
 * The answer vocabulary, one union per record under `answers/`, each record `satisfies` its own so the two cannot
 * drift. Here rather than beside the records because `targets/` reads answers and `answers/` reads targets: both
 * take these from below, and the direction between the two rings stays one way.
 */
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

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'yarn-classic' | 'bun';

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
    | 'ngrx-store'
    | 'nanostores';

export type Data = 'tanstack-query' | 'rtk-query';

export type Mocking = 'msw';

export type TypeSafety = 'strict' | 'relaxed';

export type Agent = 'claude-code' | 'codex' | 'copilot' | 'cursor';

export type Plugin = 'ponytail' | 'context7' | 'frontend-design';

// One field per record in `answers/registry.ts`, whose suite holds the two key sets equal. A record's own value reads
// `Answers` (`plugins.askedWhen`), so the shape is written out here rather than derived from `typeof ANSWERS`.
export interface Answers {
  target: TargetId;
  // Asked only for the extension target.
  browser: Browser;
  // Absent means `popup` and `background`, the only shape written before the answer existed.
  surfaces?: Surface[];
  // Absent means the host's own plain-TypeScript shape.
  hostedFramework?: HostedFramework;
  testing: Testing;
  packageManager: PackageManager;
  // Both recorded from the host that ran `create`; absent in a config written before they were.
  packageManagerVersion?: string;
  nodeVersion?: string;
  libraries: Library[];
  // Absent is plain CSS: the tokens and the starter stylesheet, with no utility system.
  styling?: Styling;
  // Absent is no form library.
  form?: Form;
  // Asked only where the target has a `routers` slot; absent is no router.
  router?: Router;
  // Asked only where the target has a `stores` slot; absent is the framework's own state and nothing installed.
  store?: Store;
  // Absent is calling the api layer directly. `rtk-query` is legal only with the Redux store that ships it.
  data?: Data;
  // Absent is an api layer that answers locally, with no request for a handler to intercept.
  mocking?: Mocking;
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

// What a run hands the stages: `create` records the host's Node and `sync` fills it where a config predates it, so
// by the time anything is written it is always there.
export type HostedAnswers = Answers & Required<Pick<Answers, 'nodeVersion'>>;

// A stage is a property of an artifact, so it is declared beside one. Stage 4, `standard`, also
// writes the hooks, the checker, the test setup and the build configs.
export type Stage
  = 'lint'
    | 'package'
    | 'standard'
    | 'install'
    | 'fix';

// What a spawned binary does with its output: write to this terminal, or hand it back so a failure can carry it.
export type RunOutput = 'capture' | 'inherit';

interface EmittedText {
  text: string;
}

// Files under `templates/`, concatenated in order.
interface CopiedAssets {
  sources: string[];
  // Depends on answers, not the file, and takes the project's own text (or `null`) for the checker.
  transform?: (source: string, current: string | null) => string;
}

// Half this CLI's, half the project's: `merge` takes what is on disk, or `null`, and answers the whole file.
interface MergedText {
  merge: (current: string | null) => string;
}

export type ArtifactContent = CopiedAssets | EmittedText | MergedText;

export interface Artifact {
  // The stage that writes it.
  stage: Stage;
  target: string;
  content: ArtifactContent;
  executable?: boolean;
  // Installed when missing, never overwritten, not even under --force.
  preserve?: true;
  // Planted only when a project is born (`create`, or `--existing --seed`). It owns these from then on.
  seed?: true;
  // Written only when this path is already there: a starter test covering source the scaffolder may not have written.
  requires?: string[];
  /**
   * A merge `sync` may still delete, because the whole file exists only for the answer that asked for it.
   * `.claude/settings.json` and `.cursor/hooks.json` are the case: each carries the project's own keys, and
   * deselecting the host leaves a file with no reason to be there. A merge without this stays, since
   * `pnpm-workspace.yaml` and a tailwind style entry are the project's file with linteljs's lines folded in, not the
   * other way round.
   */
  removable?: true;
}

// What a project already holds, per file this CLI has more than one spelling of; one record, so `sync` and
// `create --existing` discover the same files.
export interface ProjectShape {
  setupTests: readonly string[];
  styleEntries: readonly string[];
}

/**
 * One per directory under `emitters/`, named for that directory, which is itself named for the file it writes.
 * Every emitter answers a list rather than a file, so the condition that decides whether it writes anything is
 * the emitter's own: a target that has no vite config answers `[]` and `buildArtifacts` holds no branch about it.
 * Fewer parameters is fine, since most emitters read only the answers.
 */
export type Emitter = (answers: HostedAnswers, project: ProjectShape, name: string) => Artifact[];

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
    | 'nuxt'
    | 'svelte'
    | 'solid'
    | 'angular';

// The four with a layer behind them; `emitters/always/eslint-config/constants.ts` holds the emit-order table.
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

// Redeclared, not imported: this package installs before eslint-config publishes. `src/types.test.ts` pins them equal.
