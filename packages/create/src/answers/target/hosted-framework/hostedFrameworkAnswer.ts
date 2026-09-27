import type { HostedFramework } from '@config/types';
import type { OptionalChoiceRecord } from '../../types';

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
} as const satisfies OptionalChoiceRecord<HostedFramework>;
