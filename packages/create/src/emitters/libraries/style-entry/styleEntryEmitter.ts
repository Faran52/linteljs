import {
  type Answers,
  type Artifact,
  type ProjectShape,
} from '@config/types';

import { targetFor } from '@targets';

import { merged } from '../../utils/artifactUtils';
import { projectSpelling } from '../../utils/shapeUtils';

import {
  IMPORT_SPECIFIER,
  IMPORTS_TAILWIND,
  STYLEX_AT_RULE,
  TAILWIND_IMPORT,
} from './constants';

const specifiersIn = (text: string): (string | undefined)[] => {
  return [...text.matchAll(IMPORT_SPECIFIER)]
    .map(([, specifier]) => {
      return specifier;
    });
};

// Tailwind by pattern: a project may have written it in any of four spellings.
const alreadyImported = (current: string, line: string): boolean => {
  if (IMPORTS_TAILWIND.test(line)) {
    return IMPORTS_TAILWIND.test(current);
  }

  const [specifier] = specifiersIn(line);

  return specifiersIn(current).includes(specifier);
};

export const mergeStyleEntry = (
  current: string | null,
  imports: string[] = [TAILWIND_IMPORT],
  suffix?: string,
): string => {
  const appended = (body: string): string => {
    return suffix === undefined || body.includes(suffix) ? body : `${body.trimEnd()}\n\n${suffix}\n`;
  };

  // Svelte has no stylesheet on disk, so this is the whole file.
  if (current === null) {
    return appended(`${imports.join('\n')}\n`);
  }

  const missing = imports
    .filter((line) => {
      return !alreadyImported(current, line);
    });

  // Prepended: `no-invalid-position-at-import-rule` reports an `@import` after a rule.
  return appended(missing.length === 0 ? current : `${missing.join('\n')}\n\n${current}`);
};

// From the entry: a scoped framework's colocated stylesheet only reaches its element when imported globally.
export const styleEntryEmitter = (answers: Answers, project: ProjectShape): Artifact[] => {
  const target = targetFor(answers);
  const entry = projectSpelling(target.styleEntry, project.styleEntries);
  const tailwind = answers.styling === 'tailwind';
  const stylex = answers.styling === 'stylex';
  const imports = [
    ...(tailwind ? target.tailwind?.imports ?? [TAILWIND_IMPORT] : []),
    // A component's stylesheet is a `styles.ts` under StyleX; the tokens and page styles stay, as StyleX asks.
    ...(target.starterStyles ?? [])
      .filter((style) => {
        return typeof style === 'string' || style.when(answers);
      })
      .map((style) => {
        return typeof style === 'string' ? style : style.path;
      })
      .filter((path) => {
        return !(stylex && path.includes('/components/'));
      })
      .map((path) => {
        return `@import "${path}";`;
      }),
    // Last: its `@theme` points at the tokens, so those have to be in scope first.
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
