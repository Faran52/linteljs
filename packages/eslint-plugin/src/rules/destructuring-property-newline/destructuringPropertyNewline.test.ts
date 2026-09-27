import { jsRuleTester, tsRuleTester } from '@mocks/ruleTesters';

import { destructuringPropertyNewline } from './destructuringPropertyNewline.ts';

jsRuleTester.run('destructuring-property-newline', destructuringPropertyNewline, {
  valid: [
    'const {} = source;',
    'const { alpha } = source;',
    'const [] = source;',
    'const [alpha] = source;',

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

    'const [alpha, , charlie] = source;',
    'const [\n  alpha,\n  ,\n  charlie\n] = source;',

    'const [alpha,\n  , bravo] = source;',

    'const [, alpha,\n  bravo] = source;',

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
      code: 'const { alpha,\n  bravo, /* keep */ charlie } = source;',
      output: null,
      errors: [{ messageId: 'propertiesOnNewline' }],
    },
    {
      code: 'const run = () => {\n  const { alpha,\n    bravo, charlie } = source;\n};',
      output: 'const run = () => {\n  const { alpha,\n    bravo,\n    charlie } = source;\n};',
      errors: [{ messageId: 'propertiesOnNewline' }],
    },
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
