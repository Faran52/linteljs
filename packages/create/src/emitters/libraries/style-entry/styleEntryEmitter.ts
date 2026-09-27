import {
  type Answers,
  type Artifact,
  type ProjectShape,
} from '@config/types';

import { targetFor } from '@targets';

import { merged } from '../../utils/artifactUtils';
import { projectSpelling } from '../../utils/shapeUtils';

import {
  IMPORTS_TAILWIND,
  STYLEX_AT_RULE,
  TAILWIND_IMPORT,
} from './constants';

/**
 * Each import is added only where the file does not already have it, so a `sync` adds what is missing and repeats
 * nothing. Tailwind is matched by pattern rather than by string because a project may have written it in any of
 * four spellings; a stylesheet of its own is matched by its specifier, which is the only spelling this CLI writes.
 */
const alreadyImported = (current: string, line: string): boolean => {
  if (IMPORTS_TAILWIND.test(line)) {
    return IMPORTS_TAILWIND.test(current);
  }

  const specifier = /@import\s+["']([^"']+)["']/.exec(line)?.[1];

  return specifier !== undefined && new RegExp(`@import\\s+["']${specifier}["']`).test(current);
};

export const mergeStyleEntry = (
  current: string | null,
  imports: string[] = [TAILWIND_IMPORT],
  suffix?: string,
): string => {
  const appended = (body: string): string => {
    return suffix === undefined || body.includes(suffix) ? body : `${body.trimEnd()}\n\n${suffix}\n`;
  };

  // Svelte's case: there is no stylesheet on disk, so every import is missing and this is the whole file.
  if (current === null) {
    return appended(`${imports.join('\n')}\n`);
  }

  const missing = imports.filter((line) => {
    return !alreadyImported(current, line);
  });

  // Prepended: `no-invalid-position-at-import-rule` reports an `@import` after a rule.
  return appended(missing.length === 0 ? current : `${missing.join('\n')}\n\n${current}`);
};

/**
 * The style entry is the one file that knows every stylesheet a project has, so it is where each is imported from
 * rather than from a component. Angular scopes through `ViewEncapsulation`, Svelte scopes a `<style>` block and Vue
 * has `<style scoped>`, so a colocated stylesheet only reaches its element when the import is global.
 */
export const styleEntryEmitter = (answers: Answers, project: ProjectShape): Artifact[] => {
  const target = targetFor(answers);
  // The target's own where present, the project's otherwise, and the target's default at birth.
  const entry = projectSpelling(target.styleEntry, project.styleEntries);
  const tailwind = answers.styling === 'tailwind';
  const stylex = answers.styling === 'stylex';
  const imports = [
    ...(tailwind ? target.tailwind?.imports ?? [TAILWIND_IMPORT] : []),
    /*
     * A component's stylesheet is dropped under StyleX, where the same rules are a `styles.ts` beside it and are
     * compiled to atomic classes rather than shipped as a file. The tokens and the page styles stay: StyleX's own
     * documentation asks for one CSS asset for resets and globals, and injects what it compiles into it.
     */
    ...(target.starterStyles ?? []).filter((style) => {
      return typeof style === 'string' || style.when(answers);
    }).map((style) => {
      return typeof style === 'string' ? style : style.path;
    }).filter((path) => {
      return !(stylex && path.includes('/components/'));
    }).map((path) => {
      return `@import "${path}";`;
    }),
    // Last: its `@theme` points at the tokens, so those have to be in scope by the time it is read.
    ...(tailwind && target.tailwindTheme !== undefined ? [`@import "${target.tailwindTheme}";`] : []),
  ];

  if (imports.length === 0) {
    return [];
  }

  const suffix = stylex && target.stylexAtRule === true ? STYLEX_AT_RULE : undefined;

  return [merged('standard', entry, (current) => {
    return mergeStyleEntry(current, imports, suffix);
  })];
};
