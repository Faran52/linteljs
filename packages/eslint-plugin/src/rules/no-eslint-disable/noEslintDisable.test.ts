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
    '/* eslint no-console: 2 */\nexport const value = 1;\n',
    '/* eslint no-console: "warn" */\nexport const value = 1;\n',
    '/* eslint no-console: 01 */\nexport const value = 1;\n',
    '/* eslint */\nexport const value = 1;\n',
    '/*eslint*/\nexport const value = 1;\n',
    '/* eslint no-restricted-imports: ["error", { "paths": ["a", "b"] }], eqeqeq: [2] */\nexport const value = 1;\n',
    '// eslint-disable-linefoo no-console\nexport const value = 1;\n',
    '// eslint-disable-next-line-x no-console\nexport const value = 1;\n',
    /**
     * A limit, not valid code: ESLint honours a bare disable before any rule runs, so it turns this rule off too. A
     * directive naming this rule would as well, but `RuleTester` registers it as `no-eslint-disable`, so that case
     * cannot be shown. `linterOptions: { noInlineConfig: true }` closes both.
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
    {
      code: '// eslint-disable-next-line\tno-console\nconsole.log(1);\n',
      errors: [{ messageId: 'noDisable' }],
    },
    {
      code: '/* eslint-disable-line no-console */ console.log(1);\n',
      errors: [{ messageId: 'noDisable' }],
    },
    {
      code: 'export const view = (\n  <div>\n    {/* eslint-disable-next-line no-console */}\n  </div>\n);\n',
      errors: [{
        messageId: 'noDisable',
        line: 3,
        column: 6,
        endLine: 3,
        endColumn: 47,
      }],
    },
    {
      code: '/* eslint no-console: "off" -- why */\nconsole.log(1);\n',
      errors: [{ messageId: 'noDisable' }],
    },
    {
      code: '/* eslint no-console: "OFF" */\nconsole.log(1);\n',
      // ESLint 10 refuses the severity; ESLint 8 and older honour it.
      errors: [{ message: /^Inline configuration for rule "no-console" is invalid/u }, { messageId: 'noDisable' }],
    },
    {
      code: '/* eslint no-console: ["Off", "x"] */\nconsole.log(1);\n',
      // ESLint 10 refuses the severity; ESLint 8 and older honour it.
      errors: [{ message: /^Inline configuration for rule "no-console" is invalid/u }, { messageId: 'noDisable' }],
    },
    {
      code: '/* eslint\n  eqeqeq: "error",\n  no-console: "off",\n*/\nconsole.log(1);\n',
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
    {
      code: '// eslint-disable-next-line\tno-console\nconsole.log(1);\n',
      options: [{ allowRules: ['no-console'] }],
    },
    {
      code: '/* eslint-disable\n  no-console,\n  no-alert\n*/\nexport const value = 1;\n',
      options: [{ allowRules: ['no-alert', 'no-console'] }],
    },
    {
      code: "/* eslint 'no-console': 'off', \"no-alert\": 0 */\nconsole.log(1);\n",
      options: [{ allowRules: ['no-alert', 'no-console'] }],
    },
    {
      // Only the entries that turn a rule off are weighed.
      code: '/* eslint no-console: "off", eqeqeq: "error" -- measured */\nconsole.log(1);\n',
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
    {
      code: '/* eslint no-console: "off", no-alert: "off" */\nconsole.log(1);\n',
      options: [{ allowRules: ['no-console'] }],
      errors: [{ messageId: 'noDisable' }],
    },
    {
      code: '// eslint-disable-next-line no-console\nconsole.log(1);\n',
      options: [{ allowRules: [] }],
      errors: [{ messageId: 'noDisable' }],
    },
    {
      code: '// eslint-disable-next-line no-console\nconsole.log(1);\n',
      options: [{}],
      errors: [{ messageId: 'noDisable' }],
    },
  ],
});
