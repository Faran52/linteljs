import { jsRuleTester, tsRuleTester } from '@mocks/ruleTesters';

import { exportSpecifierNewline } from './exportSpecifierNewline.ts';

const declare = 'const alpha = 1, bravo = 2, charlie = 3;\n';

jsRuleTester.run('export-specifier-newline', exportSpecifierNewline, {
  valid: [
    // Brace placement is an indent rule's business, not this one's.
    "export { alpha,\n  bravo\n} from 'mod';",
    'export {};',
    `${declare}export { alpha };`,
    'export const alpha = 1;',
    'const alpha = 1;\nexport default alpha;',
    "export * from 'mod';",
    "export * as namespace from 'mod';",
    `${declare}export {\n  alpha,\n  bravo\n};`,
    `${declare}export {\n  alpha,\n  bravo,\n  charlie\n};`,
    "export {\n  alpha,\n  bravo\n} from 'mod';",
    `${declare}export {\n  alpha as first,\n  bravo as second\n};`,
  ],
  invalid: [
    {
      code: "export {\n  alpha, bravo } from 'mod';",
      output: "export {\n  alpha,\n  bravo\n} from 'mod';",
      errors: [{ messageId: 'specifiersOnNewline' }],
    },
    {
      // An existing break wider than this file's step is left as written.
      code: "const pad = {\n  a: 1,\n};\nexport {\n      alpha, bravo } from 'mod';",
      output: "const pad = {\n  a: 1,\n};\nexport {\n      alpha,\n  bravo\n} from 'mod';",
      errors: [{ messageId: 'specifiersOnNewline' }],
    },
    {
      code: `${declare}export { alpha, bravo };`,
      output: `${declare}export {\n  alpha,\n  bravo\n};`,
      errors: [{ messageId: 'specifiersOnNewline' }],
    },
    {
      code: `${declare}export { alpha, bravo, charlie };`,
      output: `${declare}export {\n  alpha,\n  bravo,\n  charlie\n};`,
      errors: [
        { messageId: 'specifiersOnNewline' },
        { messageId: 'specifiersOnNewline' },
      ],
    },
    {
      code: "export { alpha, bravo } from 'mod';",
      output: "export {\n  alpha,\n  bravo\n} from 'mod';",
      errors: [{ messageId: 'specifiersOnNewline' }],
    },
    {
      // The open-brace splice belongs to the first report, not to specifier index 1.
      code: "export { alpha,\n  bravo, charlie } from 'mod';",
      output: "export {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",
      errors: [{ messageId: 'specifiersOnNewline' }],
    },
    {
      code: `${declare}export { alpha as first, bravo as second };`,
      output: `${declare}export {\n  alpha as first,\n  bravo as second\n};`,
      errors: [{ messageId: 'specifiersOnNewline' }],
    },
    {
      code: "if (ready) {\n  module.exports = 1;\n}\nexport { alpha, bravo } from 'mod';",
      output: "if (ready) {\n  module.exports = 1;\n}\nexport {\n  alpha,\n  bravo\n} from 'mod';",
      errors: [{ messageId: 'specifiersOnNewline' }],
    },
    {
      // A comment anywhere inside makes the brace gaps unsafe to splice, so no fix.
      code: "export { alpha, /* keep */ bravo } from 'mod';",
      output: null,
      errors: [{ messageId: 'specifiersOnNewline' }],
    },
    {
      code: "export { /* head */ alpha, bravo } from 'mod';",
      output: null,
      errors: [{ messageId: 'specifiersOnNewline' }],
    },
    {
      code: "export { alpha, bravo /* tail */ } from 'mod';",
      output: null,
      errors: [{ messageId: 'specifiersOnNewline' }],
    },
  ],
});

tsRuleTester.run('export-specifier-newline (typescript)', exportSpecifierNewline, {
  valid: [
    'type Alpha = string;\ntype Bravo = number;\nexport type {\n  Alpha,\n  Bravo\n};',
    'type Alpha = string;\nexport type { Alpha };',
  ],
  invalid: [
    {
      code: 'type Alpha = string;\ntype Bravo = number;\nexport type { Alpha, Bravo };',
      output: 'type Alpha = string;\ntype Bravo = number;\nexport type {\n  Alpha,\n  Bravo\n};',
      errors: [{ messageId: 'specifiersOnNewline' }],
    },
    {
      code: "export { type Alpha, type Bravo } from 'mod';",
      output: "export {\n  type Alpha,\n  type Bravo\n} from 'mod';",
      errors: [{ messageId: 'specifiersOnNewline' }],
    },
  ],
});
