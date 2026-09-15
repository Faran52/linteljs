import type { Linter } from 'eslint';

// Frozen contract with `@linteljs/create`, which mirrors these types without resolving this package.

export type Layer = Linter.Config[];

export type AliasMap = Record<string, string>;

export type NamingConvention = 'PASCAL_CASE' | 'CAMEL_CASE' | 'KEBAB_CASE';

// A case name or a raw glob; `& {}` keeps the case names as completions.
export type NamingRule = NamingConvention | (string & {});

export type NamingMap = Record<string, NamingRule>;

export interface ResolverOptions {
  project?: string;
  // Export-map conditions in resolution order; unset by default, see `base.ts` for why reordering is not safe.
  conditionNames?: string[];
  // Silences the resolver's notice on a `project` glob.
  noWarnOnMultipleProjects?: boolean;
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

// `frameworkGroup` is dropped: the composer reads it off the framework layer.
export interface DefineConfigOptions extends Omit<BaseOptions, 'frameworkGroup'> {
  framework?: Framework;
  typescript?: boolean;
  vitest?: boolean;
  html?: boolean;
  // A file type rather than a framework, so it stacks with one.
  astro?: boolean;
  libraries?: LibraryLayer[];
  // The CSS file holding `@import "tailwindcss"`, so the tailwind layer reads the project's own theme.
  tailwindEntryPoint?: string;
}
