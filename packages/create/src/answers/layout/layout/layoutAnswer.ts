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
      hint: 'Workspaces: the apps in apps/, packages in packages/',
    },
  },
  default: 'single',
} as const satisfies ChoiceRecord<Layout>;
