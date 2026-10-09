import { posix } from 'node:path';

import { type AliasMap, type Answers } from '@config/types';

import {
  hasLibrary,
  hasTests,
  localesOf,
} from '@utils/answerUtils';

import {
  starterApplies,
  targetFor,
  type TargetRecord,
} from '@targets';

export type AliasLayers = Pick<TargetRecord, 'routeAlias' | 'hooksAlias' | 'extraAliases'>;

// The directories a project may not have, aliased only when it does.
export interface AliasedDirectories {
  apis: boolean;
  i18n: boolean;
  mocks: boolean;
}

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
export const standardAliases = (layers: AliasLayers, has: AliasedDirectories): AliasMap => {
  const aliases: AliasMap = {
    ...layers.routeAlias,
    '@components/*': './src/components/*',
    '@ui/*': './src/components/ui/*',
    '@features/*': './src/components/features/*',
    '@lib/*': './src/lib/*',
    '@store/*': './src/lib/store/*',
    ...layers.hooksAlias,
    '@utils/*': './src/lib/utils/*',
    '@services/*': './src/lib/services/*',
    ...(has.apis ? { '@apis/*': './src/lib/apis/*' } : {}),
    ...layers.extraAliases,
    '@styles/*': './src/styles/*',
    '@config/*': './src/config/*',
    ...(has.i18n ? { '@i18n/*': './src/i18n/*' } : {}),
    ...(has.mocks ? { '@mocks/*': './__mocks__/*' } : {}),
  };

  return aliases;
};

// An exact key beside a `/*` one only where the project writes that directory's barrel, so it imports as `@ui`.
export const withBarrels = (aliases: AliasMap, files: string[]): AliasMap => {
  const paired = Object.entries(aliases)
    .flatMap(([alias, directory]) => {
      const root = directory.slice(0, -WILDCARD.length);
      const hasBarrel = alias.endsWith(WILDCARD) && files.includes(posix.join(root, 'index.ts'));
      const pairs: [string, string][] = hasBarrel
        ? [[alias, directory], [alias.slice(0, -WILDCARD.length), root]]
        : [[alias, directory]];

      return pairs;
    });

  return Object.fromEntries(paired);
};

export const buildAliases = (answers: Answers): AliasMap => {
  const target = targetFor(answers);
  const starters = startersOf(answers);

  const standard = standardAliases(target, {
    apis: writesApis(answers, starters),
    i18n: localesOf(answers).length > 0,
    mocks: hasTests(answers) || answers.mocking === 'msw',
  });
  // A project's own last, so it can restate a standard one deliberately.
  const all: AliasMap = {
    ...standard,
    ...answers.aliases,
  };

  // Dropped at the end, to keep the order above intact.
  const kept = Object.entries(all)
    .filter(([alias]) => {
      return target.omitAliases?.includes(alias) !== true;
    });
  const present = Object.fromEntries(kept);

  return withBarrels(present, starters);
};
