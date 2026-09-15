import {
  type AliasMap,
  type Answers,
  hasLibrary,
  hasTests,
} from '../../model/answers/answers';
import { targetFor } from '../../model/targets';

// Read by tsconfig `paths`, `base({ aliases })` and the resolver; the order is the dependency direction, so a
// sorted import block reads as the architecture.
export const buildAliases = (answers: Answers): AliasMap => {
  const target = targetFor(answers);
  const omitted = target.omitAliases ?? [];

  const all: AliasMap = {
    '@components/*': './src/components/*',
    '@ui/*': './src/components/ui/*',
    '@features/*': './src/components/features/*',
    '@lib/*': './src/lib/*',
    '@store/*': './src/lib/store/*',
    ...target.hooksAlias,
    '@utils/*': './src/lib/utils/*',
    '@services/*': './src/lib/services/*',
    // Zod owns lib/apis/.
    ...(hasLibrary(answers, 'zod') ? { '@apis/*': './src/lib/apis/*' } : {}),
    // What one target alone has.
    ...target.extraAliases,
    '@config/*': './src/config/*',
    ...(hasTests(answers) ? { '@mocks/*': './__mocks__/*' } : {}),
    // A project's own last, so it can restate a standard one deliberately.
    ...answers.aliases,
  };

  // Filtered at the end, to keep the order above intact.
  return Object.fromEntries(
    Object.entries(all).filter(([alias]) => {
      return !omitted.includes(alias);
    }),
  );
};
