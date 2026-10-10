import type { Framework, FrameworkKey } from '@config/types';

export const FRAMEWORK_KEYS: Record<Framework, FrameworkKey> = {
  'react': 'react',
  'next': 'next',
  'react-native': 'expo',
  'vue': 'vue',
  'nuxt': 'nuxt',
  'svelte': 'svelte',
  'solid': 'solid',
  'angular': 'angular',
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
