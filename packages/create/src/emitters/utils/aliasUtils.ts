import { omit } from 'es-toolkit';

import { type AliasMap, type Answers } from '@config/types';

import { hasLibrary, hasTests } from '@utils/answerUtils';

import { targetFor } from '@targets';

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
    ...(hasLibrary(answers, 'zod') ? { '@apis/*': './src/lib/apis/*' } : {}),
    ...target.extraAliases,
    '@config/*': './src/config/*',
    ...(hasTests(answers) ? { '@mocks/*': './__mocks__/*' } : {}),
    // A project's own last, so it can restate a standard one deliberately.
    ...answers.aliases,
  };

  // Dropped at the end, to keep the order above intact.
  return omit(all, [...omitted]);
};
