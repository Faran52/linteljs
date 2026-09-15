import { hasTests } from '../../model/answers/answers';
import { targetFor } from '../../model/targets';
import { type Artifact } from '../artifact/artifact';
import { projectSpelling } from '../project-shape/projectShape';

import { mergeChecker } from './mergeChecker';

import type { Answers } from '../../model/answers/answers';

// `.tsx` on the React family, where a rendering setup needs JSX (read off `jsx`, since Solid and Vue set `preserve`).
// Newest first: `run/` asks which one a project already holds.
export const SETUP_TESTS_CANDIDATES = ['__mocks__/setupTests.tsx', '__mocks__/setupTests.ts'];

export const setupTestsPath = (answers: Answers, present: readonly string[] = []): string => {
  const own = targetFor(answers).tsconfig.jsx === 'react-jsx'
    ? '__mocks__/setupTests.tsx'
    : '__mocks__/setupTests.ts';

  return projectSpelling(own, present);
};

// Throws: a silent miss on a drifted anchor would ship the strict floor to a relaxed project.
const replaceAnchored = (source: string, anchor: string, replacement: string): string => {
  if (!source.includes(anchor)) {
    throw new Error(`checkBannedPatterns.ts no longer contains the anchor: ${anchor}`);
  }

  return source.replace(anchor, replacement);
};

const withTypeSafety = (source: string, answers: Answers): string => {
  return answers.typeSafety === 'relaxed'
    ? replaceAnchored(
        source,
        "const TYPE_SAFETY: TypeSafety = 'strict';",
        "const TYPE_SAFETY: TypeSafety = 'relaxed';",
      )
    : source;
};

// Derived from starterTests, so a stale exemption cannot outlive the file it names.
const starterSkips = (answers: Answers): string[] => {
  const target = targetFor(answers);
  const tests = target.exemptsStarterTests === true ? target.starterTests : undefined;
  // TanStack's generated tree carries `as any` and `@ts-nocheck` by design.
  const generated = answers.router === 'tanstack-router' ? ['src/routeTree.gen.ts'] : [];

  if (tests === undefined || !hasTests(answers)) {
    return generated;
  }

  return [
    setupTestsPath(answers),
    ...tests.map((test) => {
      return test.target;
    }),
    ...generated,
  ];
};

// Included in the emitted file, so the reason travels with the list.
const SKIP_REASON = [
  '  /*',
  '   * The starter suite `@linteljs/create` wrote, and the setup file behind it. These stand in for',
  '   * native modules whose published types are `any`, so the annotations that keep the',
  '   * `no-unsafe-*` rules quiet are the ones this floor bans, and every way round it trades one',
  '   * gate for the other. Delete an entry the day you replace the starter behind it.',
  '   */',
].join('\n');

const withStarterSkips = (source: string, answers: Answers): string => {
  const skips = starterSkips(answers);

  if (skips.length === 0) {
    return source;
  }

  const entries = skips.map((path) => {
    return `  '${path}',`;
  }).join('\n');

  return replaceAnchored(
    source,
    'const PROJECT_SKIPPED: string[] = [];',
    `const PROJECT_SKIPPED: string[] = [\n${SKIP_REASON}\n${entries}\n];`,
  );
};

export const checkerArtifact = (answers: Answers): Artifact => {
  return {
    stage: 'standard',
    target: 'scripts/checkBannedPatterns.ts',
    content: {
      sources: ['scripts/checkBannedPatterns.ts'],
      transform: (source, current) => {
        return mergeChecker(withStarterSkips(withTypeSafety(source, answers), answers), current);
      },
    },
  };
};
