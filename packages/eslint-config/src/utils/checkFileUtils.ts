import checkFile from 'eslint-plugin-check-file';

import type { Linter } from 'eslint';
import type { NamingMap } from '../types';

// The naming maps already carry the globs the project cares about, so `files` is derived from
// them rather than restating `src/**`. A folder glob matches no file alone, so it gains a `*`.
export const buildNaming = (naming?: NamingMap, folderNaming?: NamingMap): Linter.Config[] => {
  const files = [
    ...Object.keys(naming ?? {}),
    ...Object.keys(folderNaming ?? {}).map((glob) => {
      return `${glob}*`;
    }),
  ];

  if (files.length === 0) {
    return [];
  }

  const rules: Linter.RulesRecord = {};

  // `check-file` applies **every** matching glob, not the most specific, so a file caught by two rules can never
  // satisfy either; the broader must exclude what the specific claims, hence `src/**\/!(*.test|*.spec).ts` negations.
  if (naming) {
    // `ignoreMiddleExtensions` so `useThing.test.ts` is judged on `useThing`, not `useThing.test`.
    rules['check-file/filename-naming-convention'] = ['error', naming, { ignoreMiddleExtensions: true }];
  }

  if (folderNaming) {
    rules['check-file/folder-naming-convention'] = ['error', folderNaming];
  }

  // Registered here as well as in `@linteljs/base`: the folder glob reaches `.css`/`.html`, which the
  // script blocks never match; the same imported plugin object twice is not a redefinition.
  return [{
    name: '@linteljs/base/naming',
    files,
    plugins: { 'check-file': checkFile },
    rules,
  }];
};
