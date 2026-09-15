import type { Linter } from 'eslint';

// Frozen contract with `@linteljs/create`, which calls these signatures without resolving this
// package; a change here changes generated output there.

export type Layer = Linter.Config[];

export type AliasMap = Record<string, string>;

export type NamingConvention = 'PASCAL_CASE' | 'CAMEL_CASE' | 'KEBAB_CASE';

// A case name or a raw glob: `check-file` micromatches either against the basename. `& {}` keeps
// the case names as completions without closing the type to them.
export type NamingRule = NamingConvention | (string & {});

export type NamingMap = Record<string, NamingRule>;

export interface ResolverOptions {
  project?: string;
  /**
   * Export-map conditions, in the order the resolver tries them. Left unset by default: see `base.ts` for why putting
   * `import` ahead of `types` is not a safe default. Set it where a dependency publishes subpaths through a wildcard
   * `exports` map that the `types` condition cannot satisfy.
   */
  conditionNames?: string[];
}

export interface BaseOptions {
  ignores?: string[];
  naming?: NamingMap;
  folderNaming?: NamingMap;
  aliases?: AliasMap;
  frameworkGroup?: string[];
  resolver?: ResolverOptions;
}

// `next` implies `react` beneath it.
export type Framework
  = 'react'
    | 'next'
    | 'vue'
    | 'svelte'
    | 'solid'
    | 'angular';

export type LibraryLayer = 'tanstack-query' | 'tanstack-router' | 'tailwind';

// `frameworkGroup` is dropped: the composer reads it off the framework layer, not a caller. Every flag defaults off.
export interface DefineConfigOptions extends Omit<BaseOptions, 'frameworkGroup'> {
  framework?: Framework;
  typescript?: boolean;
  vitest?: boolean;
  html?: boolean;
  // `.astro` templates. A file type rather than a framework, so it stacks with one instead of replacing it.
  astro?: boolean;
  libraries?: LibraryLayer[];
  // The CSS file holding `@import "tailwindcss"`, so the tailwind layer can read the project's own theme. Ignored
  // unless `libraries` includes `tailwind`.
  tailwindEntryPoint?: string;
}
