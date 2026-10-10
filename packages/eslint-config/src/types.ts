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

// Each brings its UI rules: next brings react, nuxt vue, sveltekit svelte, analog angular, expo reactNative alone.
export type Framework
  = 'react'
    | 'vue'
    | 'solid'
    | 'angular'
    | 'svelte'
    | 'next'
    | 'nuxt'
    | 'sveltekit'
    | 'analog'
    | 'expo'
    | 'astro'
    | 'wxt';

// The UI frameworks an `astro` or `wxt` project hosts.
export type Island = 'react' | 'vue' | 'solid' | 'svelte' | 'angular';

// The frameworks with UI rules of their own; `astro` and `wxt` bring theirs through `islands`.
export type UiFramework = Exclude<Framework, 'astro' | 'wxt'>;

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
    | 'astro'
    | 'wxt';

export interface TailwindOptions {
  entryPoint?: string;
}

// WXT has no angular module.
export type WxtIsland = Exclude<Island, 'angular'>;

interface AnswerOptions
  extends Omit<BaseOptions, 'frameworkGroup' | 'astro'>,
  TypescriptOptions {
  typescript?: boolean;
  html?: boolean;
  testing?: 'vitest' | 'jest';
  e2e?: 'playwright';
  stories?: 'storybook';
  router?: 'tanstack-router';
  data?: 'tanstack-query';
  styling?: 'tailwind' | 'stylex';
  tailwind?: TailwindOptions;
}

interface FrameworkOptions {
  framework?: Exclude<Framework, 'wxt'>;
  // Several under `astro`; any framework but `astro` and `wxt` throws.
  islands?: Island[];
}

interface WxtOptions {
  framework: 'wxt';
  // One at most.
  islands?: WxtIsland[];
}

// Named after the answers `@linteljs/create` asks.
export type LinteljsOptions = AnswerOptions & (FrameworkOptions | WxtOptions);
