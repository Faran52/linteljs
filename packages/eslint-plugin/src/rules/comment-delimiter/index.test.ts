import { tsxRuleTester } from '@mocks/ruleTesters';

import { commentDelimiter } from './index.ts';

tsxRuleTester.run('comment-delimiter', commentDelimiter, {
  valid: [
    // One and two whole-line `//` comments are the standard's own form.
    '// one line\nexport const value = 1;\n',
    '// first line\n// second line\nexport const value = 1;\n',
    // Three content lines is JSDoc already.
    '/**\n * alpha\n * bravo\n * charlie\n */\nexport const value = 1;\n',
    // A paragraph break counts as a line.
    '/**\n * alpha\n *\n * bravo\n */\nexport const value = 1;\n',
    // Two runs split by a blank line never reach three.
    '// alpha\n// bravo\n\n// charlie\n// delta\n',
    // Code between two pairs splits the count.
    'const first = 1; // why first\nconst second = 2; // why second\nconst third = 3;\n',
    // Trailing and inline comments are not this rule's business, whichever delimiter they use.
    'const value = 1; // why it is one\n',
    'const value = /* measured */ 1;\n',
    'const value = /** measured */ 1;\n',
    // A plain block that is not JSDoc stays as written.
    '/* v8 ignore next 3 -- a parsed node always carries a location */\nexport const value = 1;\n',
    // Directives are machine-addressed; rewriting any of them breaks what points at them.
    '#!/usr/bin/env node\nexport const value = 1;\n',
    '/// <reference lib="dom" />\nexport const value = 1;\n',
    '// eslint-disable-next-line no-console\nconsole.warn(1);\n',
    '// eslint-disable no-console\n// eslint-enable no-console\nexport const value = 1;\n',
    '// prettier-ignore\nconst matrix = [[1]];\n',
    '// @ts-ignore\nexport const value = notDefined;\n',
    '// v8 ignore next\nexport const value = 1;\n',
    '// c8 ignore next\nexport const value = 1;\n',
    '// istanbul ignore next\nexport const value = 1;\n',
    // A directive breaks a run instead of joining it, so neither side reaches three.
    '// alpha\n// bravo\n// prettier-ignore\n// charlie\n// delta\n',
    // An empty JSDoc block has no body to move into `//` lines.
    '/** */\nexport const value = 1;\n',
    {
      // Test files carry no comments under the shipped standard; their shape is another rule's business.
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
    // A short block with code after it on the same line is a trailing note, and moving it would move the code.
    '/** short */ const value = 1;',
    // Merged into a block, this line's `*/` would close it early and spill the rest as code.
    '// alpha\n// bravo `*/` charlie\n// delta\nexport const value = 1;\n',
  ],
  invalid: [
    {
      code: '/** Shared expo-out curve; every surface enters and exits on this single easing. */\n'
        + 'export const EASE = 1;',
      output: '// Shared expo-out curve; every surface enters and exits on this single easing.\nexport const EASE = 1;',
      errors: [{ messageId: 'useSlashes' }],
    },
    {
      // Two content lines move together.
      code: '/**\n * Adds two numbers.\n * Returns a number.\n */\nexport const add = 1;',
      output: '// Adds two numbers.\n// Returns a number.\nexport const add = 1;',
      errors: [{ messageId: 'useSlashes' }],
    },
    {
      // The block keeps its indent, whatever sits around it.
      code: 'export const run = () => {\n  /**\n   * Guards against zero.\n   * Throws otherwise.\n   */\n'
        + '  return 1;\n};',
      output: 'export const run = () => {\n  // Guards against zero.\n  // Throws otherwise.\n  return 1;\n};',
      errors: [{ messageId: 'useSlashes' }],
    },
    {
      // Column 0 is an indent too.
      code: '/**\n * First.\n * Second.\n */',
      output: '// First.\n// Second.',
      errors: [{ messageId: 'useSlashes' }],
    },
    {
      // The closing delimiter sharing the last content line changes nothing.
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
      // Four merge as four.
      code: '// alpha\n// bravo\n// charlie\n// delta\nexport const value = 1;',
      output: '/**\n * alpha\n * bravo\n * charlie\n * delta\n */\nexport const value = 1;',
      errors: [{ messageId: 'useJsdoc' }],
    },
    {
      // A run keeps the indent it was found at.
      code: 'export const run = () => {\n  // alpha\n  // bravo\n  // charlie\n  return 1;\n};',
      output: 'export const run = () => {\n  /**\n   * alpha\n   * bravo\n   * charlie\n   */\n  return 1;\n};',
      errors: [{ messageId: 'useJsdoc' }],
    },
    {
      // A blank-free marker style still reads as content.
      code: '//alpha\n//bravo\n//charlie\nexport const value = 1;',
      output: '/**\n * alpha\n * bravo\n * charlie\n */\nexport const value = 1;',
      errors: [{ messageId: 'useJsdoc' }],
    },
    {
      // Two violations report twice in one pass.
      code: '/** one short */\nconst first = 1;\n\n// alpha\n// bravo\n// charlie\nconst second = 2;',
      output: '// one short\nconst first = 1;\n\n/**\n * alpha\n * bravo\n * charlie\n */\nconst second = 2;',
      errors: [{ messageId: 'useSlashes' }, { messageId: 'useJsdoc' }],
    },
    {
      // Runs separated by a trailing comment are reported one at a time.
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
  ],
});
