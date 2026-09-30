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

// `alias`, not tsconfig `paths`, which would replace Nuxt's own `#shared` and `#server` set.
export const emitNuxtConfig = (answers: Answers): string => {
  const { styleEntry } = targetFor(answers);
  // Both spellings: Vite resolves by prefix, TypeScript by pattern.
  // Absolute: Nuxt reads the generated paths relative to `.nuxt/`.
  const aliases = Object.entries(buildAliases(answers))
    .flatMap(([alias, directory]) => {
      const prefix = alias.replace('/*', '');
      const root = directory
        .replace('/*', '')
        .replace('./', '');

      const wildcard = quote(`${prefix}/*`);
      const wildcardRoot = quote(`${root}/*`);

      return [
        `    ${quote(prefix)}: join(import.meta.dirname, ${quote(root)}),`,
        `    ${wildcard}: join(import.meta.dirname, ${wildcardRoot}),`,
      ];
    });

  const styling = stylingPlugin(answers.styling);

  return [
    "import { join } from 'node:path';",
    '',
    sortedImports([...styling.imports, "import { defineNuxtConfig } from 'nuxt/config';"]),
    '',
    ...styling.declaration === undefined ? [] : [styling.declaration, ''],
    'export default defineNuxtConfig({',
    "  compatibilityDate: '2025-07-15',",
    "  srcDir: 'src/',",
    '  devtools: { enabled: false },',
    `  css: ['~/${styleEntry.replace('src/', '')}'],`,
    '  // Merged into the paths Nuxt generates, which is what keeps its own `#` aliases resolving alongside these.',
    '  alias: {',
    ...aliases,
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
};

export const nuxtConfigEmitter: Emitter = (answers): Artifact[] => {
  const { nuxtProject } = targetFor(answers);

  return nuxtProject === true ? [emitted('package', 'nuxt.config.ts', emitNuxtConfig(answers))] : [];
};
