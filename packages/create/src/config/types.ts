import type { HostedAnswers } from '@answers/registry';

/**
 * The vocabulary every ring shares: `emitters/` builds an artifact, `files/` applies it, `pipeline/` sequences
 * them by stage and `terminal/` names a stage on `--skip`. No ring owns any of it, so it sits below all of them
 * rather than inside the one that happens to construct it most often.
 */

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

// The three with a layer behind them; `emitters/always/eslint-config/constants.ts` holds the emit-order table.
export type LibraryLayer = 'tanstack-query' | 'tanstack-router' | 'tailwind';

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
