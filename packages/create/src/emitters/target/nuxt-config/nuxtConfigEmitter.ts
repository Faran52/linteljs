import {
  type Answers,
  type Artifact,
  type Emitter,
} from '@config/types';

import { targetFor } from '@targets';

import { buildAliases } from '../../utils/aliasUtils';
import { emitted } from '../../utils/artifactUtils';
import { sortedImports } from '../../utils/importUtils';
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

      return [
        `    '${prefix}': join(import.meta.dirname, '${root}'),`,
        `    '${prefix}/*': join(import.meta.dirname, '${root}/*'),`,
      ];
    });

  const styling = stylingPlugin(answers.styling);

  return [
    "import { join } from 'node:path';",
    '',
    sortedImports([...styling.imports, "import { defineNuxtConfig } from 'nuxt/config';"]),
    '',
    ...styling.declarations
      .flatMap((line) => {
        return [line, ''];
      }),
    'export default defineNuxtConfig({',
    "  compatibilityDate: '2025-07-15',",
    "  // `src/`, not Nuxt 4's own `app/`: one source root, the same as every other target this CLI writes.",
    "  srcDir: 'src/',",
    '  devtools: { enabled: false },',
    `  css: ['~/${styleEntry.replace('src/', '')}'],`,
    '  // Merged into the paths Nuxt generates, which is what keeps its own `#` aliases resolving alongside these.',
    '  alias: {',
    ...aliases,
    '  },',
    // The Vite plugin: Nuxt's `postcss-import` reads `@import "tailwindcss"` off disk and fails.
    ...(styling.calls.length === 0
      ? []
      : [
          '  vite: {',
          `    plugins: [${styling.calls.join(', ')}],`,
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
