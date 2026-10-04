import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { EMPTY_PROJECT } from '@config/constants';

import { emitJestConfig, jestConfigEmitter } from './jestConfigEmitter';

import type { Answers } from '@config/types';

const NATIVE = `import tsconfig from './tsconfig.json' with { type: 'json' };

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

const config = {
  preset: 'jest-expo',
  moduleNameMapper,
  setupFilesAfterEnv: ['<rootDir>/__mocks__/setupTests.tsx'],
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,mts,js,jsx,mjs}',
    '!**/*.test.*',
    '!**/*.d.ts',
    '!src/typings/**',
    '!src/{main,index}.{ts,tsx}',
    '!**/*.stylex.{ts,tsx}',
    '!**/components/**/styles.{ts,tsx}',
    '!src/app/_layout.tsx',
    '!src/config/routes.ts',
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

describe('jestConfigEmitter', () => {
  it('hands React Native its jest config after the first write', () => {
    const answers = answersFor({ target: 'react-native' });
    const artifacts = jestConfigEmitter(answers, EMPTY_PROJECT);
    const expected = [{
      stage: 'standard',
      target: 'jest.config.js',
      content: { text: NATIVE },
      preserve: true,
    }];
    expect(artifacts).toEqual(expected);
  });

  it('resolves msw on Node and transforms its ES-module dependencies', () => {
    const answers = answersFor({ target: 'react-native', mocking: 'msw' });
    const text = emitJestConfig(answers, '__mocks__/setupTests.tsx');

    const opensWithPreset = text.startsWith("import expo from 'jest-expo/jest-preset.js';\n\nimport tsconfig");
    expect(opensWithPreset).toBe(true);
    expect(text).toContain("customExportConditions: [\n    'node',\n    'require',\n    'react-native',\n  ] },");
    expect(text).toContain("const esmOnly = '|msw|rettime|until-async|@open-draft';");
    expect(text).toContain('transformIgnorePatterns: [modules.replace(/\\)\\)$/u, `${esmOnly}))`), ...ignored],');
  });

  it('names the setup file the project already has', () => {
    const answers = answersFor({ target: 'react-native' });
    const project = {
      ...EMPTY_PROJECT,
      setupTests: ['__mocks__/setupTests.ts'],
    };
    const artifacts = jestConfigEmitter(answers, project);
    const expected = [expect.objectContaining({
      content: { text: emitJestConfig(answers, '__mocks__/setupTests.ts') },
    })];
    expect(artifacts).toEqual(expected);
  });

  it('un-ignores immer and react-redux for redux-toolkit, with no msw conditions', () => {
    const answers = answersFor({ target: 'react-native', store: 'redux-toolkit' });
    const text = emitJestConfig(answers, '__mocks__/setupTests.tsx');

    const opensWithPreset = text.startsWith("import expo from 'jest-expo/jest-preset.js';\n\nimport tsconfig");
    expect(opensWithPreset).toBe(true);
    expect(text).toContain("const esmOnly = '|immer|react-redux';");
    expect(text).toContain('transformIgnorePatterns: [modules.replace(/\\)\\)$/u, `${esmOnly}))`), ...ignored],');
    expect(text).not.toContain('customExportConditions');
  });

  it('un-ignores both lists when msw meets redux-toolkit', () => {
    const answers = answersFor({
      target: 'react-native',
      store: 'redux-toolkit',
      mocking: 'msw',
    });
    const text = emitJestConfig(answers, '__mocks__/setupTests.tsx');

    expect(text).toContain("const esmOnly = '|msw|rettime|until-async|@open-draft|immer|react-redux';");
  });

  it.each<[string, Partial<Answers>]>([
    ['a target whose suites run on vitest', { target: 'react' }],
    [
      'a project that declined a suite',
      {
        target: 'react-native',
        testing: 'none',
      },
    ],
  ])('writes nothing for %s', (_label, overrides) => {
    const answers = answersFor(overrides);
    const artifacts = jestConfigEmitter(answers, EMPTY_PROJECT);
    expect(artifacts).toEqual([]);
  });
});
