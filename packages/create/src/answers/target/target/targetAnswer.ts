import type { TargetId } from '@config/types';
import type { ChoiceRecord } from '../../types';

export const targetAnswer = {
  key: 'target',
  flag: 'target',
  prompt: 'Framework',
  kind: 'choice',
  values: {
    'react': { label: 'React (Vite)' },
    'next': { label: 'Next.js' },
    'vue': { label: 'Vue' },
    'nuxt': { label: 'Nuxt' },
    'svelte': { label: 'Svelte' },
    'solid': { label: 'Solid' },
    'angular': { label: 'Angular' },
    'astro': { label: 'Astro' },
    'webextension': { label: 'Web Extension (MV3)' },
    'react-native': { label: 'React Native (Expo)' },
  },
  default: 'react',
} as const satisfies ChoiceRecord<TargetId>;
