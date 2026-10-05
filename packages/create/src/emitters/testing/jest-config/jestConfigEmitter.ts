import {
  type Answers,
  type Artifact,
  type ProjectShape,
} from '@config/types';

import { emitted } from '../../utils/artifactUtils';
import { testRunnerOf } from '../../utils/runnerUtils';
import { setupTestsPath } from '../../utils/shapeUtils';
import { coverageExclude, coverageInclude } from '../utils/coverageUtils';

import {
  MSW_ESM_ONLY,
  MSW_OPTIONS,
  PRESET_IMPORT,
  REDUX_ESM_ONLY,
  UNIGNORE_OPTION,
} from './constants';

// One entry per line: `max-len` has no fixer.
const globList = (globs: string[]): string => {
  return globs
    .map((glob) => {
      return `\n    '${glob}',`;
    })
    .join('');
};

/**
 * The default `jest-expo` preset needs no babel config; its `jest-expo/<platform>` presets do.
 * No worklets resolver: under pnpm it strips native extensions from any path naming worklets, peer-hashed
 * `.pnpm` directories included, so expo-modules-core loads its throwing web adapter.
 * Jest reads no tsconfig, so the aliases map from its `paths`.
 */
export const emitJestConfig = (answers: Answers, setup: string): string => {
  const exclude = coverageExclude(answers)
    .map((glob) => {
      return `!${glob}`;
    });
  const hasMsw = answers.mocking === 'msw';
  const esmOnly = [
    ...hasMsw ? MSW_ESM_ONLY : [],
    ...answers.store === 'redux-toolkit' ? REDUX_ESM_ONLY : [],
  ];
  const unignores = esmOnly.length > 0;
  const unignoreParts = unignores
    ? `\nconst [modules, ...ignored] = expo.transformIgnorePatterns;\nconst esmOnly = '|${esmOnly.join('|')}';\n`
    : '';

  return `${unignores ? PRESET_IMPORT : ''}import tsconfig from './tsconfig.json' with { type: 'json' };

const moduleNameMapper = Object.fromEntries(
  Object.entries(tsconfig.compilerOptions.paths)
    .map(([alias, [location]]) => {
      const pattern = \`^\${alias.replace('*', '(.*)')}$\`;
      const target = location
        .replace('.', '<rootDir>')
        .replace('*', '$1');
      const entry = [pattern, target];

      return entry;
    }),
);
${unignoreParts}
const config = {
  preset: 'jest-expo',
  moduleNameMapper,${hasMsw ? MSW_OPTIONS : ''}${unignores ? UNIGNORE_OPTION : ''}
  setupFilesAfterEnv: ['<rootDir>/${setup}'],
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
  // A file's first render transforms React Native lazily, past Jest's 5s default on a shared CI runner.
  testTimeout: 15_000,
  collectCoverageFrom: [${globList([coverageInclude(answers), ...exclude])}
  ],
  coverageThreshold: {
    global: {
      lines: 100,
      branches: 100,
      functions: 100,
      statements: 100,
    },
  },
};

export default config;
`;
};

// Birth only: the excludes are layout guesses a project replaces with its own.
export const jestConfigEmitter = (answers: Answers, project: ProjectShape): Artifact[] => {
  if (testRunnerOf(answers) !== 'jest') {
    return [];
  }

  const config = emitJestConfig(answers, setupTestsPath(answers, project.setupTests));

  const artifacts: Artifact[] = [{
    ...emitted('standard', 'jest.config.js', config),
    preserve: true,
  }];

  return artifacts;
};
