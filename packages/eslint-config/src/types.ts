import type { Linter } from 'eslint';
import type { RuleOptions } from './typegen';

// Frozen contract with `@linteljs/create`, which mirrors these types without resolving this package.

export type Layer = Linter.Config[];

// Every rule a `linteljs()` layer can load, with its options, open to the rules of plugins added after it.
export type Rules = RuleOptions & Linter.RulesRecord;

export type NamingConvention = 'PASCAL_CASE' | 'CAMEL_CASE' | 'KEBAB_CASE';

// A case name or a raw glob; `& {}` keeps the case names as completions.
export type NamingRule = NamingConvention | (string & {});

export type NamingMap = Record<string, NamingRule>;

export interface ResolverOptions {
  project?: string;
  // Unset by default: `import` ahead of `types` sends `react-native` to its Flow `index.js`.
  conditionNames?: string[];
  noWarnOnMultipleProjects?: boolean;
}

export interface BaseOptions {
  // The project directory: its `.gitignore` is ignored and its tsconfig `paths` name the alias import groups.
  root?: string;
  gitignore?: boolean;
  ignores?: string[];
  naming?: NamingMap;
  folderNaming?: NamingMap;
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

export type FrameworkKey
  = 'react'
    | 'next'
    | 'expo'
    | 'vue'
    | 'nuxt'
    | 'svelte'
    | 'sveltekit'
    | 'solid'
    | 'angular';

export type LayerKey
  = 'tanstackQuery'
    | 'tanstackRouter'
    | 'tailwind'
    | 'stylex'
    | 'vitest'
    | 'jest'
    | 'playwright'
    | 'storybook'
    | 'html'
    | 'astro';

export interface TailwindOptions {
  entryPoint?: string;
}

// One key per layer; `next` and `expo` imply `react`, `nuxt` implies `vue`, `sveltekit` implies `svelte`.
export interface LinteljsOptions
  extends Omit<BaseOptions, 'frameworkGroup'>,
  TypescriptOptions,
  Partial<Record<FrameworkKey | Exclude<LayerKey, 'tailwind'>, boolean>> {
  typescript?: boolean;
  tailwind?: boolean | TailwindOptions;
}
