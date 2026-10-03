import {
  type Answers,
  type Artifact,
  type Emitter,
} from '@config/types';

import { targetFor } from '@targets';

import { buildAliases } from '../../utils/aliasUtils';
import { emitted } from '../../utils/artifactUtils';
import { sortedImports } from '../../utils/importUtils';
import { quote } from '../../utils/quoteUtils';
import { stylingPlugin } from '../../utils/stylingUtils';

import { STYLEX_DEV_HEAD } from './constants';

// `alias`, not tsconfig `paths`, which would replace Nuxt's own `#shared` and `#server` set.
export const emitNuxtConfig = (answers: Answers, name: string): string => {
  const { styleEntry, framework } = targetFor(answers);
  // Both spellings: Vite resolves by prefix, TypeScript by pattern.
  // Absolute: Nuxt reads the generated paths relative to `.nuxt/`.
  const aliasDirectories = buildAliases(answers);
  const aliases = Object.entries(aliasDirectories)
    .flatMap(([alias, directory]) => {
      const prefix = alias.replace('/*', '');
      const root = directory
        .replace('/*', '')
        .replace('./', '');

      const wildcard = quote(`${prefix}/*`);
      const wildcardRoot = quote(`${root}/*`);

      const lines = [
        `    ${quote(prefix)}: join(import.meta.dirname, ${quote(root)}),`,
        `    ${wildcard}: join(import.meta.dirname, ${wildcardRoot}),`,
      ];

      return lines;
    });

  const styling = stylingPlugin(answers.styling, true, "join(import.meta.dirname, 'src/styles/*')");

  const config = [
    "import { join } from 'node:path';",
    '',
    sortedImports([...styling.imports, "import { defineNuxtConfig } from 'nuxt/config';"], framework),
    '',
    ...styling.declarations.length === 0 ? [] : [...styling.declarations, ''],
    'export default defineNuxtConfig({',
    "  compatibilityDate: '2025-07-15',",
    "  srcDir: 'src/',",
    '  devtools: { enabled: false },',
    '  app: {',
    '    head: {',
    // The i18n plugin's `useHead` replaces it with the reader's language.
    "      htmlAttrs: { lang: 'en' },",
    `      title: ${quote(name)},`,
    '      link: [{',
    "        rel: 'icon',",
    "        type: 'image/svg+xml',",
    "        href: '/favicon.svg',",
    '      }],',
    '    },',
    '  },',
    ...(answers.styling === 'stylex' ? STYLEX_DEV_HEAD : []),
    `  css: ['~/${styleEntry.replace('src/', '')}'],`,
    '  // Merged into the paths Nuxt generates, which is what keeps its own `#` aliases resolving alongside these.',
    '  alias: {',
    // An exact key writes the same two lines as the `/*` key beside it.
    ...new Set(aliases),
    '  },',
    // The Vite plugin: Nuxt's `postcss-import` reads `@import "tailwindcss"` off disk and fails.
    ...(styling.call === undefined
      ? []
      : [
          '  vite: {',
          `    plugins: [${styling.call}],`,
          '  },',
        ]),
    '});',
    '',
  ].join('\n');

  return config;
};

export const nuxtConfigEmitter: Emitter = (answers, _project, name): Artifact[] => {
  const { nuxtProject } = targetFor(answers);

  if (nuxtProject !== true) {
    return [];
  }

  const config = emitNuxtConfig(answers, name);
  const artifacts = [emitted('package', 'nuxt.config.ts', config)];

  return artifacts;
};
