import { tsxRuleTester } from '@mocks/ruleTesters';

import { noEslintDisable } from './noEslintDisable.ts';

tsxRuleTester.run('no-eslint-disable', noEslintDisable, {
  valid: [
    'export const value = 1;\n',
    // An ordinary comment that happens to mention the word is not a directive and never was.
    '// we do not reach for eslint-disable here\nexport const value = 1;\n',
    '/**\n * A doc block about eslint-disable, which ESLint reads as prose.\n */\nexport const value = 1;\n',
    // ESLint reads the first token; neither of these is one it honours, so neither suppresses anything.
    '// eslint-disabled no-console\nexport const value = 1;\n',
    '// eslint-disable-nextline no-console\nexport const value = 1;\n',
    // Other tooling's directives belong to other tools. This rule is named for one family.
    '// prettier-ignore\nconst matrix = [[1]];\n',
    '// @ts-expect-error\nexport const value = 1;\n',
    '// v8 ignore next\nexport const value = 1;\n',
    // `eslint-enable` suppresses nothing on its own, and the rule is named for what does.
    '/* eslint-enable no-console */\nexport const value = 1;\n',
    // Inline configuration is a different directive with a different argument shape.
    '/* eslint no-console: "off" */\nexport const value = 1;\n',
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
    // A description after `--` changes nothing: ESLint honours the directive either way.
    {
      code: '// eslint-disable-next-line no-console -- measured, never shipped\nconsole.log(1);\n',
      errors: [{ messageId: 'noDisable' }],
    },
    // Reported per directive, so a file that reaches for two hears about both.
    {
      code: '/* eslint-disable no-console */\nconsole.log(1);\n// eslint-disable-next-line no-alert\nalert(1);\n',
      errors: [{ messageId: 'noDisable' }, { messageId: 'noDisable' }],
    },
    // Whatever whitespace the author left between the delimiter and the keyword.
    {
      code: '//   eslint-disable-next-line no-console\nconsole.log(1);\n',
      errors: [{ messageId: 'noDisable' }],
    },
  ],
});

tsxRuleTester.run('no-eslint-disable: allowRules', noEslintDisable, {
  valid: [
    {
      code: '// eslint-disable-next-line no-console\nconsole.log(1);\n',
      options: [{ allowRules: ['no-console'] }],
    },
    // Every rule it names, in any order, with the spacing the author used.
    {
      code: '/* eslint-disable no-console,no-alert */\nexport const value = 1;\n',
      options: [{ allowRules: ['no-alert', 'no-console'] }],
    },
    // The description after `--` is prose, not a fourth rule name.
    {
      code: '// eslint-disable-next-line no-console -- measured\nconsole.log(1);\n',
      options: [{ allowRules: ['no-console'] }],
    },
  ],
  invalid: [
    // One allowed name does not carry the other: the directive suppresses both.
    {
      code: '/* eslint-disable no-console, no-alert */\nexport const value = 1;\n',
      options: [{ allowRules: ['no-console'] }],
      errors: [{ messageId: 'noDisable' }],
    },
    /**
     * A bare directive names nothing, so an allowlist can never cover it. `-next-line` rather than the block form
     * on purpose: a bare block disables this rule as well and `RuleTester` would see no report at all, where a bare
     * `-next-line` silences only the line below and leaves the report on the comment's own line standing.
     */
    {
      code: '// eslint-disable-next-line\nexport const value = 1;\n',
      options: [{ allowRules: ['no-console'] }],
      errors: [{ messageId: 'noDisable' }],
    },
    // A directive carrying only a description names nothing either.
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
