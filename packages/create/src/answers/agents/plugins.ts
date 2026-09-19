import type { AnswerRecord } from '../types';

export type Plugin = keyof typeof plugins.values;

export const plugins = {
  key: 'plugins',
  flag: 'plugins',
  prompt: 'AI plugins',
  askedWhen: (answered) => {
    return answered.agents.length > 0;
  },
  kind: 'multi',
  values: {
    'ponytail': {
      label: 'Ponytail',
      hint: 'Keeps changes small and questions bloat',
    },
    'context7': {
      label: 'Context7',
      hint: 'Pulls current library docs into context',
    },
    'frontend-design': {
      label: 'Frontend Design',
      hint: 'Guidance on visual and UX choices',
    },
  },
  default: ['ponytail', 'context7', 'frontend-design'],
} as const satisfies AnswerRecord;
