import { posix } from 'node:path';

import { type AliasMap, type Answers } from '@config/types';

import {
  hasLibrary,
  hasTests,
  localesOf,
} from '@utils/answerUtils';

import { starterApplies, targetFor } from '@targets';

const WILDCARD = '/*';

const startersOf = (answers: Answers): string[] => {
  return targetFor(answers).starterFiles
    .filter((file) => {
      return starterApplies(file, answers);
    })
    .map((file) => {
      return file.target;
    });
};

// Zod's schemas go there; otherwise read off the starter, so the alias names a directory the project has.
const writesApis = (answers: Answers, starters: string[]): boolean => {
  return hasLibrary(answers, 'zod') || starters
    .some((file) => {
      return file.startsWith('src/lib/apis/');
    });
};

// The order is the dependency direction, so a sorted import block reads as the architecture.
export const buildAliases = (answers: Answers): AliasMap => {
  const target = targetFor(answers);
  const starters = startersOf(answers);

  const all: AliasMap = {
    ...target.routeAlias,
    '@components/*': './src/components/*',
    '@ui/*': './src/components/ui/*',
    '@features/*': './src/components/features/*',
    '@lib/*': './src/lib/*',
    '@store/*': './src/lib/store/*',
    ...target.hooksAlias,
    '@utils/*': './src/lib/utils/*',
    '@services/*': './src/lib/services/*',
    ...(writesApis(answers, starters) ? { '@apis/*': './src/lib/apis/*' } : {}),
    ...target.extraAliases,
    '@styles/*': './src/styles/*',
    '@config/*': './src/config/*',
    ...(localesOf(answers).length > 0 ? { '@i18n/*': './src/i18n/*' } : {}),
    ...(hasTests(answers) || answers.mocking === 'msw' ? { '@mocks/*': './__mocks__/*' } : {}),
    // A project's own last, so it can restate a standard one deliberately.
    ...answers.aliases,
  };

  // Dropped at the end, to keep the order above intact.
  const kept: [string, string][] = Object.entries(all)
    .filter(([alias]) => {
      return target.omitAliases?.includes(alias) !== true;
    });

  // An exact key beside a `/*` one only where the starter writes that directory's barrel, so it imports as `@ui`.
  const withIndexes = kept
    .flatMap(([alias, directory]) => {
      const root = directory.slice(0, -WILDCARD.length);
      const hasBarrel = alias.endsWith(WILDCARD) && starters.includes(posix.join(root, 'index.ts'));
      const pairs: [string, string][] = hasBarrel
        ? [[alias, directory], [alias.slice(0, -WILDCARD.length), root]]
        : [[alias, directory]];

      return pairs;
    });

  return Object.fromEntries(withIndexes);
};
