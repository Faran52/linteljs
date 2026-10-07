import type { Layout } from '@config/types';
import type { ChoiceRecord } from '../../types';

export const layoutAnswer = {
  key: 'layout',
  flag: 'layout',
  prompt: 'Repository layout',
  kind: 'choice',
  values: {
    single: {
      label: 'Single repo',
      hint: 'One package at the root',
    },
    monorepo: {
      label: 'Monorepo',
      hint: 'Workspaces: the app in apps/, shared code in packages/',
    },
  },
  default: 'single',
} as const satisfies ChoiceRecord<Layout>;
