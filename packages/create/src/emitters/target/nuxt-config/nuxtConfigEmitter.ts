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

/**
 * Nuxt reads its whole build from here, and two of these lines are why this target works at all.
 *
 * `srcDir` moves the source root off Nuxt 4's `app/` default onto the `src/` every other target uses, so no glob
 * this CLI writes learns a second answer. `alias` is how a project's own aliases reach the paths Nuxt generates:
 * it merges them in beside its own `#shared` and `#server`, where declaring `paths` in `tsconfig.json` would
 * replace that whole set with half of it. The emitted `tsconfig.json` then extends Nuxt's and inherits both.
 */
export const emitNuxtConfig = (answers: Answers): string => {
  const { styleEntry } = targetFor(answers);
  /*
   * Both spellings of each alias, because two readers want different ones. Vite resolves by prefix, so it wants
   * the directory form; TypeScript resolves by pattern, so it wants the wildcard, and Nuxt copies whatever is here
   * straight into the paths it generates. With only the directory form, `@utils/fetchExtended` resolves for the
   * bundler and not for the compiler, which is an unresolved import on every accessor.
   *
   * Absolute, through `join`, because the paths Nuxt generates sit in `.nuxt/` and are read relative to it. Nuxt
   * rewrites its own aliases to `../src` on the way in and passes anything already relative through untouched, so
   * a literal `./src/lib/utils` here lands as `.nuxt/src/lib/utils`, which is a directory no project has.
   */
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
    /*
     * Nuxt owns Vite, and passes this key through to it. The Vite plugin rather than the PostCSS one: Nuxt runs
     * `postcss-import` ahead of anything named in its own `postcss` key, and that reads `@import "tailwindcss"`
     * off disk and fails, where Tailwind 4 resolves that import itself.
     */
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
