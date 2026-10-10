import type { FrameworkKey, LayerKey } from '../types';

export const FRAMEWORK_KEYS: FrameworkKey[] = [
  'react',
  'next',
  'expo',
  'vue',
  'nuxt',
  'svelte',
  'sveltekit',
  'solid',
  'angular',
];

// The keys whose layer already loads this one beneath its own.
export const IMPLIED_BY: Record<FrameworkKey, FrameworkKey[]> = {
  react: ['next', 'expo'],
  next: [],
  expo: [],
  vue: ['nuxt'],
  nuxt: [],
  svelte: ['sveltekit'],
  sveltekit: [],
  solid: [],
  angular: [],
};

// Composed in this order, after the frameworks.
export const LAYER_KEYS: LayerKey[] = [
  'tanstackQuery',
  'tanstackRouter',
  'tailwind',
  'stylex',
  'vitest',
  'jest',
  'playwright',
  'storybook',
  'html',
  'astro',
];

export const MISSING_PACKAGE = /Cannot find package '([^']+)'/u;

// Keyed by the name `npm_config_user_agent` starts with; npm when none matches.
export const INSTALL_COMMANDS: Record<string, string> = {
  pnpm: 'pnpm add -D',
  yarn: 'yarn add -D',
  bun: 'bun add -d',
};

export const NPM_INSTALL = 'npm install -D';
