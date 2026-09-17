import { jsRuleTester, tsRuleTester } from '@mocks/ruleTesters';

import { destructuringPropertyNewline } from './destructuringPropertyNewline.ts';

jsRuleTester.run('destructuring-property-newline', destructuringPropertyNewline, {
  valid: [
    'const {} = source;',
    'const { alpha } = source;',
    'const [] = source;',
    'const [alpha] = source;',

    // All on one line is explicitly allowed; this rule only objects to a pattern that is partly wrapped.
    'const { alpha, bravo } = source;',
    'const { alpha, bravo, charlie } = source;',
    'const [alpha, bravo, charlie] = source;',
    'const { alpha, ...rest } = source;',

    'const {\n  alpha,\n  bravo\n} = source;',
    'const [\n  alpha,\n  bravo\n] = source;',
    'const {\n  alpha,\n  bravo,\n  charlie\n} = source;',

    'const fn = ({ alpha, bravo }) => alpha + bravo;',
    'const fn = ({\n  alpha,\n  bravo\n}) => alpha + bravo;',
    'for (const { alpha, bravo } of source) { use(alpha, bravo); }',
    'const { alpha: { bravo, charlie } } = source;',

    // Array holes are skipped rather than crashing the pair walk.
    'const [alpha, , charlie] = source;',
    'const [\n  alpha,\n  ,\n  charlie\n] = source;',

    // Known limitation: a hole has no tokens of its own, so a same-line neighbour goes unreported.
    'const [alpha,\n  , bravo] = source;',

    // A hole in first position leaves nothing to measure the pattern's span against, so it is left alone.
    'const [, alpha,\n  bravo] = source;',

    // A trailing comma adds no element, so the walk finds no pair sharing a line.
    'const [alpha,\n  bravo, ] = source;',

    'const { alpha = 1, bravo = 2 } = source;',
  ],
  invalid: [
    {
      code: 'const { alpha,\n  bravo, charlie } = source;',
      output: 'const { alpha,\n  bravo,\n  charlie } = source;',
      errors: [{ messageId: 'propertiesOnNewline' }],
    },
    {
      code: 'const { alpha, bravo,\n  charlie } = source;',
      output: 'const { alpha,\n  bravo,\n  charlie } = source;',
      errors: [{ messageId: 'propertiesOnNewline' }],
    },
    {
      code: 'const [alpha,\n  bravo, charlie] = source;',
      output: 'const [alpha,\n  bravo,\n  charlie] = source;',
      errors: [{ messageId: 'propertiesOnNewline' }],
    },
    {
      code: 'const { alpha, bravo, charlie,\n  delta } = source;',
      output: 'const { alpha,\n  bravo,\n  charlie,\n  delta } = source;',
      errors: [
        { messageId: 'propertiesOnNewline' },
        { messageId: 'propertiesOnNewline' },
      ],
    },
    {
      code: 'const { alpha,\n  bravo, ...rest } = source;',
      output: 'const { alpha,\n  bravo,\n  ...rest } = source;',
      errors: [{ messageId: 'propertiesOnNewline' }],
    },
    {
      // A comment sits between the comma and the next property, so the range is not safe to replace.
      code: 'const { alpha,\n  bravo, /* keep */ charlie } = source;',
      output: null,
      errors: [{ messageId: 'propertiesOnNewline' }],
    },
    // The moved member follows the pattern's own indent, not the left margin.
    {
      code: 'const run = () => {\n  const { alpha,\n    bravo, charlie } = source;\n};',
      output: 'const run = () => {\n  const { alpha,\n    bravo,\n    charlie } = source;\n};',
      errors: [{ messageId: 'propertiesOnNewline' }],
    },
    // And the step comes off the file rather than being assumed to be two.
    {
      code: 'const run = () => {\n    const { alpha,\n        bravo, charlie } = source;\n};',
      output: 'const run = () => {\n    const { alpha,\n        bravo,\n        charlie } = source;\n};',
      errors: [{ messageId: 'propertiesOnNewline' }],
    },
    {
      code: 'const fn = ({ alpha,\n  bravo, charlie }) => alpha;',
      output: 'const fn = ({ alpha,\n  bravo,\n  charlie }) => alpha;',
      errors: [{ messageId: 'propertiesOnNewline' }],
    },
  ],
});

tsRuleTester.run('destructuring-property-newline (typescript)', destructuringPropertyNewline, {
  valid: [
    'const { alpha, bravo }: Source = source;',
    'const {\n  alpha,\n  bravo\n}: Source = source;',
  ],
  invalid: [
    {
      code: 'const { alpha,\n  bravo, charlie }: Source = source;',
      output: 'const { alpha,\n  bravo,\n  charlie }: Source = source;',
      errors: [{ messageId: 'propertiesOnNewline' }],
    },
  ],
});
