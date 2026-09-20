import type { AnswerRecord } from '../../types';

export type HostedFramework = keyof typeof hostedFrameworkAnswer.values;

export const hostedFrameworkAnswer = {
  key: 'hostedFramework',
  flag: 'hosted',
  prompt: 'UI framework',
  note: 'webextension and astro only',
  slot: (target) => {
    return target.hostsFramework === true;
  },
  kind: 'optionalChoice',
  none: {
    label: 'None',
    hint: 'Plain TypeScript and the DOM',
  },
  values: {
    react: {
      label: 'React',
      hint: 'With the React Compiler',
    },
    vue: {
      label: 'Vue',
      hint: 'Single-file components',
    },
    svelte: {
      label: 'Svelte',
      hint: 'Svelte 5 runes',
    },
    solid: {
      label: 'Solid',
      hint: 'Fine-grained signals',
    },
  },
} as const satisfies AnswerRecord;
