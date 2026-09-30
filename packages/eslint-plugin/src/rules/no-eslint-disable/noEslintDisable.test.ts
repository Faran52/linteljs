import { tsxRuleTester } from '@mocks/ruleTesters';

import { noEslintDisable } from './noEslintDisable.ts';

tsxRuleTester.run('no-eslint-disable', noEslintDisable, {
  valid: [
    'export const value = 1;\n',
    '// we do not reach for eslint-disable here\nexport const value = 1;\n',
    '/**\n * A doc block about eslint-disable, which ESLint reads as prose.\n */\nexport const value = 1;\n',
    '// eslint-disabled no-console\nexport const value = 1;\n',
    '// eslint-disable-nextline no-console\nexport const value = 1;\n',
    '// prettier-ignore\nconst matrix = [[1]];\n',
    '// @ts-expect-error\nexport const value = 1;\n',
    '// v8 ignore next\nexport const value = 1;\n',
    // `eslint-enable` suppresses nothing on its own, and the rule is named for what does.
    '/* eslint-enable no-console */\nexport const value = 1;\n',
    '/* note eslint no-console: "off" */\nexport const value = 1;\n',
    '/* eslint complexity: ["error", 0] */\nexport const value = 1;\n',
    '/* eslint no-console: "error" */\nexport const value = 1;\n',
    '/* eslint complexity: ["error", { "max": 0 }] */\nexport const value = 1;\n',
    '// eslint no-console: "off"\nexport const value = 1;\n',
    '/* eslint eqeqeq: [1, "always"] */\nexport const value = 1;\n',
    /**
     * Not valid code: a limit of what any rule can see. ESLint honours a bare disable before a rule runs, and a bare
     * one names no rules, so it turns this rule off too. A directive naming this rule does the same, though that one
     * cannot be shown here: under `RuleTester` the rule is registered as `no-eslint-disable`, so a directive naming
     * `@linteljs/no-eslint-disable` matches nothing and earns an unknown-rule error instead of suppressing.
     *
     * Here to pin the limit rather than to bless the input. `linterOptions: { noInlineConfig: true }` is what closes
     * it, and the README says so.
     */
    '/* eslint-disable */\nexport const value = 1;\n',
  ],
  invalid: [
    {
      code: '/*eslint no-console:"off"*/\nconsole.log(1);\n',
      errors: [{ messageId: 'noDisable' }],
    },
    {
      code: '/*   eslint no-console: [ "off" ] */\nconsole.log(1);\n',
      errors: [{ messageId: 'noDisable' }],
    },
    {
      code: '/* eslint eqeqeq: ["error", "always", { "null": "ignore" }], no-console: "off" */\nconsole.log(1);\n',
      errors: [{ messageId: 'noDisable' }],
    },
    {
      code: '/* eslint eqeqeq: ["error", "always"], no-console: ["off"], no-alert: 0 */\nconsole.log(1);\n',
      errors: [{ messageId: 'noDisable' }],
    },
    {
      code: '/* eslint no-console: "off" */\nconsole.log(1);\n',
      errors: [{ messageId: 'noDisable' }],
    },
    {
      code: '/* eslint no-console: 0 */\nconsole.log(1);\n',
      errors: [{ messageId: 'noDisable' }],
    },
    {
      code: '/* eslint "no-console": ["off"], eqeqeq: ["error", "always"] */\nconsole.log(1);\n',
      errors: [{ messageId: 'noDisable' }],
    },
    {
      code: '/* eslint no-restricted-syntax: ["error", { "selector": "X", "message": "a, b: 0" }],'
        + " no-alert: 'off' -- why */\nalert(1);\n",
      errors: [{ messageId: 'noDisable' }],
    },
    {
      code: '// eslint-disable-next-line no-console\nconsole.log(1);\n',
      errors: [{ messageId: 'noDisable' }],
    },
    {
      code: '/* eslint-disable no-console */\nexport const value = 1;\n',
      errors: [{ messageId: 'noDisable' }],
    },
    {
      code: 'console.log(1); // eslint-disable-line no-console\n',
      errors: [{ messageId: 'noDisable' }],
    },
    {
      code: '// eslint-disable-next-line no-console -- measured, never shipped\nconsole.log(1);\n',
      errors: [{ messageId: 'noDisable' }],
    },
    {
      code: '/* eslint-disable no-console */\nconsole.log(1);\n// eslint-disable-next-line no-alert\nalert(1);\n',
      errors: [{ messageId: 'noDisable' }, { messageId: 'noDisable' }],
    },
    {
      code: '//   eslint-disable-next-line no-console\nconsole.log(1);\n',
      errors: [{ messageId: 'noDisable' }],
    },
  ],
});

tsxRuleTester.run('no-eslint-disable: allowRules', noEslintDisable, {
  valid: [
    {
      code: '/* eslint "no-console": "off" */\nconsole.log(1);\n',
      options: [{ allowRules: ['no-console'] }],
    },
    {
      code: '// eslint-disable-next-line no-console\nconsole.log(1);\n',
      options: [{ allowRules: ['no-console'] }],
    },
    {
      code: '/* eslint-disable no-console,no-alert */\nexport const value = 1;\n',
      options: [{ allowRules: ['no-alert', 'no-console'] }],
    },
    {
      code: '// eslint-disable-next-line no-console -- measured\nconsole.log(1);\n',
      options: [{ allowRules: ['no-console'] }],
    },
    {
      code: '/* eslint-disable no-console,, no-alert, */\nexport const value = 1;\n',
      options: [{ allowRules: ['no-alert', 'no-console'] }],
    },
    {
      code: '// eslint-disable-next-line no-console -- measured, never shipped\nconsole.log(1);\n',
      options: [{ allowRules: ['no-console'] }],
    },
  ],
  invalid: [
    {
      code: '/* eslint-disable no-console, no-alert */\nexport const value = 1;\n',
      options: [{ allowRules: ['no-console'] }],
      errors: [{ messageId: 'noDisable' }],
    },
    {
      code: '// eslint-disable-next-line\nexport const value = 1;\n',
      options: [{ allowRules: ['no-console'] }],
      errors: [{ messageId: 'noDisable' }],
    },
    {
      code: '// eslint-disable-next-line -- measured\nexport const value = 1;\n',
      options: [{ allowRules: ['no-console'] }],
      errors: [{ messageId: 'noDisable' }],
    },
    {
      code: '// eslint-disable-next-line no-alert\nalert(1);\n',
      options: [{ allowRules: ['no-console'] }],
      errors: [{ messageId: 'noDisable' }],
    },
  ],
});
