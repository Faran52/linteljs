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

export const measuredGlob = (sfcExtension?: string): string => {
  const extensions = sfcExtension === undefined ? MEASURABLE : [...MEASURABLE, sfcExtension];

  return `src/**/*.{${extensions.join(',')}}`;
};

export const coverageInclude = (answers: Answers): string => {
  return measuredGlob(targetFor(answers).sfcExtension);
};

export const excludedWith = (own: string[]): string[] => {
  const exclude = [...SHARED_COVERAGE_EXCLUDE, ...own];

  return exclude;
};

// React Router's route table is configuration; TanStack Router builds its tree in `App.tsx`.
export const coverageExclude = (answers: Answers): string[] => {
  const target = targetFor(answers);
  const exclude = excludedWith([
    ...target.coverageExclude ?? [],
    ...answers.mocking === 'msw' && target.workerEntry !== undefined ? [target.workerEntry] : [],
    ...(answers.router === undefined || answers.router === 'tanstack-router' ? [] : ['src/routes/**']),
  ]);

  return exclude;
};
