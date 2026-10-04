import {
  type Answers,
  type Artifact,
  type ProjectShape,
} from '@config/types';

import { emitted } from '../../utils/artifactUtils';
import { testRunnerOf } from '../../utils/runnerUtils';
import { setupTestsPath } from '../../utils/shapeUtils';
import { coverageExclude, coverageInclude } from '../utils/coverageUtils';

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
 * The worklets resolver lets Reanimated run for real, so a suite mocks only what it asserts on.
 * Jest reads no tsconfig, so the aliases map from its `paths`.
 */
export const emitJestConfig = (answers: Answers, setup: string): string => {
  const exclude = coverageExclude(answers)
    .map((glob) => {
      return `!${glob}`;
    });

  return `import tsconfig from './tsconfig.json' with { type: 'json' };

const moduleNameMapper = Object.fromEntries(
  Object.entries(tsconfig.compilerOptions.paths).map(([alias, [location]]) => {
    return [\`^\${alias.replace('*', '(.*)')}$\`, location.replace('.', '<rootDir>').replace('*', '$1')];
  }),
);

export default {
  preset: 'jest-expo',
  resolver: 'react-native-worklets/jest/resolver.js',
  moduleNameMapper,
  setupFilesAfterEnv: ['<rootDir>/${setup}'],
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
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
