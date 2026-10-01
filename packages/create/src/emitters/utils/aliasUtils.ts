import { omit } from 'es-toolkit';

import { type AliasMap, type Answers } from '@config/types';

import {
  hasLibrary,
  hasTests,
  localesOf,
} from '@utils/answerUtils';

import { targetFor } from '@targets';

// Zod's schemas go there; otherwise read off the starter, so the alias names a directory the project has.
const writesApis = (answers: Answers): boolean => {
  return hasLibrary(answers, 'zod') || targetFor(answers).starterFiles
    .some((file) => {
      return file.target.startsWith('src/lib/apis/') && (file.when === undefined || file.when(answers));
    });
};

// The order is the dependency direction, so a sorted import block reads as the architecture.
export const buildAliases = (answers: Answers): AliasMap => {
  const target = targetFor(answers);
  const omitted = new Set(target.omitAliases);

  const all: AliasMap = {
    '@components/*': './src/components/*',
    '@ui/*': './src/components/ui/*',
    '@features/*': './src/components/features/*',
    '@lib/*': './src/lib/*',
    '@store/*': './src/lib/store/*',
    ...target.hooksAlias,
    '@utils/*': './src/lib/utils/*',
    '@services/*': './src/lib/services/*',
    ...(writesApis(answers) ? { '@apis/*': './src/lib/apis/*' } : {}),
    ...target.extraAliases,
    '@styles/*': './src/styles/*',
    '@config/*': './src/config/*',
    ...(localesOf(answers).length > 0 ? { '@i18n/*': './src/i18n/*' } : {}),
    ...(hasTests(answers) ? { '@mocks/*': './__mocks__/*' } : {}),
    // A project's own last, so it can restate a standard one deliberately.
    ...answers.aliases,
  };

  // Dropped at the end, to keep the order above intact.
  const kept: [string, string][] = Object.entries(omit(all, [...omitted]));

  // Each `/*` key beside an exact one onto its directory, so a directory index imports as `@ui`.
  return Object.fromEntries(kept
    .flatMap(([alias, directory]) => {
      return alias.endsWith('/*') && directory.endsWith('/*')
        ? [[alias, directory], [alias.slice(0, -2), directory.slice(0, -2)]]
        : [[alias, directory]];
    }));
};
