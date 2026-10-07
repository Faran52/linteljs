import { targetFor } from '@targets';

import type { Answers } from '@config/types';

// Root of `src/` only, so a `src/lib/index.ts` barrel still counts.
const SHARED_COVERAGE_EXCLUDE = [
  '**/*.test.*',
  '**/*.d.ts',
  'src/typings/**',
  'src/{main,index}.{ts,tsx}',
  // Compiled to CSS by the bundler, so nothing of it is left at runtime.
  '**/*.stylex.{ts,tsx}',
];

// A bare `src/**` hands rolldown `src/app.html`, printing a parse failure while the gate passes.
const MEASURABLE = [
  'ts',
  'tsx',
  'mts',
  'js',
  'jsx',
  'mjs',
];

export const coverageInclude = (answers: Answers): string => {
  const { sfcExtension } = targetFor(answers);
  const extensions = sfcExtension === undefined ? MEASURABLE : [...MEASURABLE, sfcExtension];

  return `src/**/*.{${extensions.join(',')}}`;
};

// React Router's route table is configuration; TanStack Router builds its tree in `App.tsx`.
export const coverageExclude = (answers: Answers): string[] => {
  const exclude = [
    ...SHARED_COVERAGE_EXCLUDE,
    ...targetFor(answers).coverageExclude ?? [],
    ...(answers.router === undefined || answers.router === 'tanstack-router' ? [] : ['src/routes/**']),
  ];

  return exclude;
};
