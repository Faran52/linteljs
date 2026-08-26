import {
  type AliasMap,
  type Answers,
  hasLibrary,
  hasTests,
} from '../../model/answers/answers';
import { targetFor } from '../../model/targets';

// Read by tsconfig.paths, base({ aliases }) for import-sort buckets, and the tsconfig resolver.
// Order is the spine's dependency direction, so a sorted import block reads top-down as the architecture.
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
    // Zod owns lib/apis/ (endpoint definitions and schemas); without it the folder has nothing to alias.
    ...(hasLibrary(answers, 'zod') ? { '@apis/*': './src/lib/apis/*' } : {}),
    // What one target alone has: Next's lib/server/ and src/content/, SvelteKit's $lib, the extension's lib/model/,
    // Expo's own `@/*` and `@/assets/*`.
    ...target.extraAliases,
    '@config/*': './src/config/*',
    ...(hasTests(answers) ? { '@mocks/*': './__mocks__/*' } : {}),
    // A project's own, last so the standard set reads first and a project can restate one of them deliberately.
    ...answers.aliases,
  };

  // Filtered at the end, not spread conditionally, to keep the order above intact.
  return Object.fromEntries(
    Object.entries(all).filter(([alias]) => {
      return !omitted.includes(alias);
    }),
  );
};
