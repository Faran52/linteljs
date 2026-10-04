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
  // Unset by default; see `baseLayer.ts` for why reordering is not safe.
  conditionNames?: string[];
  noWarnOnMultipleProjects?: boolean;
}

export interface BaseOptions {
  ignores?: string[];
  naming?: NamingMap;
  folderNaming?: NamingMap;
  aliases?: AliasMap;
  frameworkGroup?: string[];
  resolver?: ResolverOptions;
  astro?: boolean;
}

export interface TypescriptOptions {
  // Globs from the tsconfig declaring `paths`: files where `@linteljs/prefer-alias` reports no alias to prefer.
  aliasExempt?: string[];
  // In an `aliasExempt` file, fix every alias import to a relative one.
  enforceRelativeImports?: boolean;
}

// `next` implies `react` beneath it and `nuxt` implies `vue`; `react-native` is `react` without the a11y preset.
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

// `frameworkGroup` is dropped: the composer reads it off the framework layer.
export interface ComposeConfigOptions extends Omit<BaseOptions, 'frameworkGroup'>, TypescriptOptions {
  framework?: Framework;
  typescript?: boolean;
  vitest?: boolean;
  jest?: boolean;
  html?: boolean;
  libraries?: LibraryLayer[];
  tailwindEntryPoint?: string;
}
