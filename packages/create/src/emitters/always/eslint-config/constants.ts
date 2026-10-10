import type {
  Framework,
  LinteljsFramework,
  TargetId,
} from '@config/types';

// Create's svelte target is SvelteKit.
export const FRAMEWORK_KEYS: Record<Framework, LinteljsFramework> = {
  'react': 'react',
  'next': 'next',
  'react-native': 'expo',
  'vue': 'vue',
  'nuxt': 'nuxt',
  'svelte': 'sveltekit',
  'solid': 'solid',
  'angular': 'angular',
};

// The targets that host their framework as an island.
export const HOST_FRAMEWORKS: Partial<Record<TargetId, LinteljsFramework>> = {
  astro: 'astro',
  webextension: 'wxt',
};

export const IDENTIFIER = /^[$A-Z_a-z][\w$]*$/u;

// `.agents/` is the codex half of `.claude/`, so both are ignored.
export const BASE_IGNORES = [
  'dist/**',
  'coverage/**',
  '.claude/**',
  '.agents/**',
  'plugins/linteljs/**',
];
