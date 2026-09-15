import checkFile from 'eslint-plugin-check-file';

import type { Linter } from 'eslint';
import type { NamingMap } from '../types';

// A folder glob matches no file alone, so it gains a `*`.
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

  if (naming) {
    // `useThing.test.ts` is judged on `useThing`.
    rules['check-file/filename-naming-convention'] = ['error', naming, { ignoreMiddleExtensions: true }];
  }

  if (folderNaming) {
    rules['check-file/folder-naming-convention'] = ['error', folderNaming];
  }

  // Registered again: the folder glob reaches `.css`/`.html`, which the script blocks never match.
  return [{
    name: '@linteljs/base/naming',
    files,
    plugins: { 'check-file': checkFile },
    rules,
  }];
};
