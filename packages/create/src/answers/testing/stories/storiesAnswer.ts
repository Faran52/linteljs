import type { Framework, Stories } from '@config/types';
import type { OptionalChoiceRecord } from '../../types';

const STORYBOOK_FRAMEWORKS: ReadonlySet<Framework | undefined> = new Set<Framework>([
  'react',
  'next',
  'vue',
  'nuxt',
  'svelte',
  'angular',
]);

export const storiesAnswer = {
  key: 'stories',
  flag: 'stories',
  prompt: 'Component stories',
  note: 'not on solid, react-native, webextension, typescript or a plain or solid astro',
  // Astro takes its hosted framework, so a plain or Solid Astro has none.
  slot: (target) => {
    return target.id !== 'webextension' && STORYBOOK_FRAMEWORKS.has(target.framework);
  },
  kind: 'optionalChoice',
  none: {
    label: 'None',
    hint: 'No component workshop',
  },
  values: {
    storybook: {
      label: 'Storybook',
      hint: 'Components rendered and tested in isolation',
    },
  },
} as const satisfies OptionalChoiceRecord<Stories>;
