import nextPlugin from '@next/eslint-plugin-next';

import { SCRIPT_FILES } from '../../config/constants';
import { reactGroup } from '../react/reactFramework';

import type { Layer } from '../../types';

// Stacks on `react()`. `@next/eslint-plugin-next`, not `eslint-config-next`: the config bundles three plugins that
// `base()` and `react()` already cover with newer ones, and its bundled `eslint-plugin-react` throws on ESLint 10.

export const nextGroup: string[] = [...reactGroup, '^next$', '^next/'];

export const next = (): Layer => {
  return [
    {
      name: '@linteljs/next',
      files: SCRIPT_FILES,
      plugins: { '@next/next': nextPlugin },
      rules: {
        ...nextPlugin.configs['core-web-vitals'].rules,

        // `next/image` renders an `img`; `react()` enables the rule, this only adds the mapping.
        'jsx-a11y-x/alt-text': ['error', {
          elements: ['img'],
          img: ['Image'],
        }],
      },
    },
  ];
};

export default next;
