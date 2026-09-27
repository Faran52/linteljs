import { tsxRuleTester } from '@mocks/ruleTesters';

import { commentDelimiter } from './commentDelimiter.ts';

tsxRuleTester.run('comment-delimiter', commentDelimiter, {
  valid: [
    '// one line\nexport const value = 1;\n',
    '// first line\n// second line\nexport const value = 1;\n',
    '/**\n * alpha\n * bravo\n * charlie\n */\nexport const value = 1;\n',
    '/**\n * alpha\n *\n * bravo\n */\nexport const value = 1;\n',
    '// alpha\n// bravo\n\n// charlie\n// delta\n',
    'const first = 1; // why first\nconst second = 2; // why second\nconst third = 3;\n',
    'const value = 1; // why it is one\n',
    'const value = /* measured */ 1;\n',
    'const value = /** measured */ 1;\n',
    '/* v8 ignore next 3 -- a parsed node always carries a location */\nexport const value = 1;\n',
    '#!/usr/bin/env node\nexport const value = 1;\n',
    '/// <reference lib="dom" />\nexport const value = 1;\n',
    '// eslint-disable-next-line no-console\nconsole.warn(1);\n',
    '// eslint-disable no-console\n// eslint-enable no-console\nexport const value = 1;\n',
    '// prettier-ignore\nconst matrix = [[1]];\n',
    '// @ts-ignore\nexport const value = notDefined;\n',
    '// v8 ignore next\nexport const value = 1;\n',
    '// c8 ignore next\nexport const value = 1;\n',
    '// istanbul ignore next\nexport const value = 1;\n',
    ...[
      '// prettier-ignore',
      '//prettier-ignore',
      '// eslint-disable-next-line no-console',
      '// eslint-x',
      '// @ts-expect-error',
      '// @ts-x',
      '// ts-ignore',
      '// v8 ignore next',
      '// c8 ignore next',
      '// istanbul ignore next',
      '/// <reference lib="dom" />',
      '///<reference lib="dom" />',
      '///   <reference lib="dom" />',
    ]
      .map((directive) => {
        return `// alpha\n// bravo\n${directive}\n// charlie\n// delta\n`;
      }),
    '/** */\nexport const value = 1;\n',
    {
      code: '/** short doc */\n// alpha\n// bravo\n// charlie\nexport const value = 1;\n',
      filename: 'src/lib/utils/sample.test.ts',
    },
    {
      code: '/** short doc */\nexport const value = 1;\n',
      filename: 'src/lib/utils/sample.spec.tsx',
    },
    {
      code: '// alpha\n// bravo\n// charlie\nexport const value = 1;\n',
      filename: '__tests__/sample.ts',
    },
    ...[
      'test.ts',
      'src/sample.test.cts',
      'src/sample.spec.mts',
      'src\\sample.test.js',
      'src/__tests__',
    ]
      .map((filename) => {
        return {
          code: '// alpha\n// bravo\n// charlie\nexport const value = 1;\n',
          filename,
        };
      }),
    '/** short */ const value = 1;',
    '/** short */ a',
    '// alpha\n// bravo `*/` charlie\n// delta\nexport const value = 1;\n',
    "/** @type {import('tailwindcss').Config} */\nexport default {};\n",
    '/** @jsxImportSource @emotion/react */\nexport const value = 1;\n',
    '/** @deprecated use `other` instead */\nexport const old = 1;\n',
    '/**\n * Adds two numbers.\n * @returns the sum\n */\nexport const add = 1;\n',
  ],
  invalid: [
    ...[
      '// bravo #! here',
      '// bravo /// <reference lib="dom" />',
      '// bravo // eslint-disable',
    ]
      .map((line) => {
        return {
          code: `// alpha\n${line}\n// charlie\nexport const value = 1;`,
          output: `/**\n * alpha\n * ${line.slice(3)}\n * charlie\n */\nexport const value = 1;`,
          errors: [{ messageId: 'useJsdoc' as const }],
        };
      }),
    ...[
      'src/contest.ts',
      'src/sample.test.ts.snap',
      'src/my__tests__/sample.ts',
      'src/__tests__x/sample.ts',
    ]
      .map((filename) => {
        return {
          code: '// alpha\n// bravo\n// charlie\nexport const value = 1;',
          filename,
          output: '/**\n * alpha\n * bravo\n * charlie\n */\nexport const value = 1;',
          errors: [{ messageId: 'useJsdoc' as const }],
        };
      }),
    {
      code: '/**\n First.\n * Second.\n */\nexport const value = 1;',
      output: '// First.\n// Second.\nexport const value = 1;',
      errors: [{ messageId: 'useSlashes' }],
    },
    {
      code: '/** short doc */  \nexport const value = 1;',
      output: '// short doc  \nexport const value = 1;',
      errors: [{ messageId: 'useSlashes' }],
    },
    {
      code: '/** Shared expo-out curve; every surface enters and exits on this single easing. */\n'
        + 'export const EASE = 1;',
      output: '// Shared expo-out curve; every surface enters and exits on this single easing.\nexport const EASE = 1;',
      errors: [{ messageId: 'useSlashes' }],
    },
    {
      code: '/**\n * Adds two numbers.\n * Returns a number.\n */\nexport const add = 1;',
      output: '// Adds two numbers.\n// Returns a number.\nexport const add = 1;',
      errors: [{ messageId: 'useSlashes' }],
    },
    {
      code: 'export const run = () => {\n  /**\n   * Guards against zero.\n   * Throws otherwise.\n   */\n'
        + '  return 1;\n};',
      output: 'export const run = () => {\n  // Guards against zero.\n  // Throws otherwise.\n  return 1;\n};',
      errors: [{ messageId: 'useSlashes' }],
    },
    {
      code: '/**\n * First.\n * Second.\n */',
      output: '// First.\n// Second.',
      errors: [{ messageId: 'useSlashes' }],
    },
    {
      code: '/**\n * First.\n * Second. */\nexport const value = 1;',
      output: '// First.\n// Second.\nexport const value = 1;',
      errors: [{ messageId: 'useSlashes' }],
    },
    {
      code: '// alpha\n// bravo\n// charlie\nexport const value = 1;',
      output: '/**\n * alpha\n * bravo\n * charlie\n */\nexport const value = 1;',
      errors: [{ messageId: 'useJsdoc' }],
    },
    {
      code: '// alpha\n// bravo\n// charlie\n// delta\nexport const value = 1;',
      output: '/**\n * alpha\n * bravo\n * charlie\n * delta\n */\nexport const value = 1;',
      errors: [{ messageId: 'useJsdoc' }],
    },
    {
      code: 'export const run = () => {\n  // alpha\n  // bravo\n  // charlie\n  return 1;\n};',
      output: 'export const run = () => {\n  /**\n   * alpha\n   * bravo\n   * charlie\n   */\n  return 1;\n};',
      errors: [{ messageId: 'useJsdoc' }],
    },
    {
      code: '//alpha\n//bravo\n//charlie\nexport const value = 1;',
      output: '/**\n * alpha\n * bravo\n * charlie\n */\nexport const value = 1;',
      errors: [{ messageId: 'useJsdoc' }],
    },
    {
      code: '/** one short */\nconst first = 1;\n\n// alpha\n// bravo\n// charlie\nconst second = 2;',
      output: '// one short\nconst first = 1;\n\n/**\n * alpha\n * bravo\n * charlie\n */\nconst second = 2;',
      errors: [{ messageId: 'useSlashes' }, { messageId: 'useJsdoc' }],
    },
    {
      code: '// alpha\n// bravo\n// charlie\nconst value = 1; // trailing\n// delta\n// echo\n// foxtrot\n'
        + 'const other = 2;',
      output: '/**\n * alpha\n * bravo\n * charlie\n */\nconst value = 1; // trailing\n/**\n * delta\n * echo\n'
        + ' * foxtrot\n */\nconst other = 2;',
      errors: [{ messageId: 'useJsdoc' }, { messageId: 'useJsdoc' }],
    },
    {
      code: '/** short doc */\nexport const value = 1;',
      filename: 'src/lib/utils/sample.ts',
      output: '// short doc\nexport const value = 1;',
      errors: [{ messageId: 'useSlashes' }],
    },
    {
      code: '/** ask faran@example.com first */\nexport const value = 1;',
      output: '// ask faran@example.com first\nexport const value = 1;',
      errors: [{ messageId: 'useSlashes' }],
    },
  ],
});
