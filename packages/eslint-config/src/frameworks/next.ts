import nextPlugin from '@next/eslint-plugin-next';

import { SCRIPT_EXTENSIONS } from '../utils/globUtils';

import { reactGroup } from './react';

import type { Layer } from '../types';

/**
 * Next.js. Stacks on `react()`: the one framework layer that is not exclusive.
 *
 * `@next/eslint-plugin-next`, not `eslint-config-next`. The config bundles `eslint-plugin-react`,
 * `eslint-plugin-react-hooks`, `eslint-plugin-import` and `eslint-plugin-jsx-a11y` and enables a slice of each, and
 * three of those four are ground `base()` and `react()` already cover with newer plugins: `@eslint-react` for the 22
 * `react/*` rules, `eslint-plugin-react-hooks` v7 for the 16 `react-hooks/*` ones, and `import-x` for the single
 * `import/*` one. Taking the plugin alone keeps the 22 `@next/next` rules that are the actual Next-specific value and
 * drops the rest of the tree.
 *
 * What that removed, all of it workaround: surgery on the upstream flat entries (its `next` entry claimed every script
 * extension for a pre-ESLint-10 parser, and its `next/typescript` entry re-registered `@typescript-eslint` that
 * `typescript()` had already registered), and forty lines that resolved the installed React version from disk to pin
 * `settings.react.version`, because the bundled `eslint-plugin-react` reads `context.getFilename()`, gone in ESLint 10,
 * and every `react/*` rule threw at load without it. None of that is needed when those plugins are not in the tree.
 *
 * What is left here is Next and nothing else. A Next project gets what a React project gets, because it stacks on
 * `react()`, plus the 22 rules below. Accessibility is not Next-specific and lives in `react()`; the one Next-specific
 * thing about it is that `next/image` renders an `img`, which the option below tells `alt-text`.
 */

// React's bucket plus Next itself, composed rather than restated so the two cannot disagree.
export const nextGroup: string[] = [...reactGroup, '^next$', '^next/'];

const REACT_FILES = [`**/*.{${SCRIPT_EXTENSIONS}}`];

export const next = (): Layer => {
  return [
    {
      name: '@linteljs/next',
      files: REACT_FILES,
      plugins: { '@next/next': nextPlugin },
      rules: {
        ...nextPlugin.configs['core-web-vitals'].rules,

        // `next/image` renders an `img`, so without this every `<Image>` reads as missing alt text. The rule itself is
        // enabled by `react()`, at the severity that layer sets; this adds the mapping and nothing else.
        'jsx-a11y/alt-text': ['error', {
          elements: ['img'],
          img: ['Image'],
        }],
      },
    },
  ];
};

export default next;
