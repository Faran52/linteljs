import type {
  Framework,
  Layer,
  LayerKey,
  LinteljsOptions,
  WxtIsland,
} from '../types';

// Each layer, the option that asks for it and the value that does; composed in this order, after the frameworks.
export const LAYER_OPTIONS: [LayerKey, keyof LinteljsOptions, string | boolean][] = [
  [
    'tanstackQuery',
    'data',
    'tanstack-query',
  ],
  [
    'tanstackRouter',
    'router',
    'tanstack-router',
  ],
  [
    'tailwind',
    'styling',
    'tailwind',
  ],
  [
    'stylex',
    'styling',
    'stylex',
  ],
  [
    'vitest',
    'testing',
    'vitest',
  ],
  [
    'jest',
    'testing',
    'jest',
  ],
  [
    'playwright',
    'e2e',
    'playwright',
  ],
  [
    'storybook',
    'stories',
    'storybook',
  ],
  [
    'html',
    'html',
    true,
  ],
  [
    'astro',
    'framework',
    'astro',
  ],
  [
    'wxt',
    'framework',
    'wxt',
  ],
];

export const HOSTS: Framework[] = ['astro', 'wxt'];

// Expo's web export; a bare React Native app has no `dist`.
export const EXPO_LAYER: Layer = [
  {
    name: 'linteljs/expo/ignores',
    ignores: ['dist/*'],
  },
];

// WXT's build output and generated types.
export const WXT_LAYER: Layer = [
  {
    name: 'linteljs/wxt/ignores',
    ignores: ['.output/**', '.wxt/**'],
  },
];

// Every option, so a misspelt one is caught rather than ignored.
export const OPTION_NAMES: Record<keyof LinteljsOptions, true> = {
  root: true,
  tsconfig: true,
  gitignore: true,
  ignores: true,
  naming: true,
  folderNaming: true,
  resolver: true,
  aliasExempt: true,
  enforceRelativeImports: true,
  framework: true,
  islands: true,
  typescript: true,
  html: true,
  testing: true,
  e2e: true,
  stories: true,
  router: true,
  data: true,
  styling: true,
  tailwind: true,
};

// The values each enumerated option takes; for `islands`, each entry's.
export const OPTION_VALUES: Partial<Record<keyof LinteljsOptions, string[]>> = {
  framework: [
    'react',
    'vue',
    'solid',
    'angular',
    'svelte',
    'next',
    'nuxt',
    'sveltekit',
    'analog',
    'expo',
    'astro',
    'wxt',
  ],
  islands: [
    'react',
    'vue',
    'solid',
    'svelte',
    'angular',
  ],
  testing: ['vitest', 'jest'],
  e2e: ['playwright'],
  stories: ['storybook'],
  router: ['tanstack-router'],
  data: ['tanstack-query'],
  styling: ['tailwind', 'stylex'],
};

export const WXT_ISLANDS: WxtIsland[] = [
  'react',
  'vue',
  'solid',
  'svelte',
];

export const ERROR_PREFIX = '@linteljs/eslint-config:';

// The farthest a misspelling sits from the name it is told to try.
export const SUGGESTION_DISTANCE = 3;

export const MISSING_PACKAGE = /Cannot find package '([^']+)'/u;

export const NPM_INSTALL = 'npm install -D';

// Keyed by package manager name, as `packageManager` and `npm_config_user_agent` spell it.
export const INSTALL_COMMANDS: Record<string, string> = {
  npm: NPM_INSTALL,
  pnpm: 'pnpm add -D',
  yarn: 'yarn add -D',
  bun: 'bun add -d',
};

export const LOCKFILES: [string, string][] = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
  ['package-lock.json', 'npm'],
  ['npm-shrinkwrap.json', 'npm'],
];
