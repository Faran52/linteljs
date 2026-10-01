import { jsRuleTester, tsRuleTester } from '@mocks/ruleTesters';

import { exportSpecifierNewline } from './exportSpecifierNewline.ts';

const declare = 'const alpha = 1, bravo = 2, charlie = 3;\n';
const declareTypes = 'type Alpha = string;\ntype Bravo = number;\ntype Charlie = boolean;\n';
const errors = [{ messageId: 'specifiersOnNewline' }];

jsRuleTester.run('export-specifier-newline', exportSpecifierNewline, {
  valid: [
    'export {};',
    `${declare}export { alpha };`,
    `${declare}export {\n  alpha };`,
    'export const alpha = 1;',
    'const alpha = 1;\nexport default alpha;',
    "export * from 'mod';",
    "export * as namespace from 'mod';",
    `${declare}export { alpha, bravo };`,
    "export { alpha, bravo } from 'mod';",
    `${declare}export { alpha as first, bravo as second };`,
    `${declare}export {\n  alpha,\n  bravo\n};`,
    `${declare}export {\n  alpha,\n  bravo,\n  charlie\n};`,
    "export {\n  alpha,\n  bravo,\n  charlie,\n} from 'mod';",
  ],
  invalid: [
    {
      code: `${declare}export { alpha, bravo, charlie };`,
      output: `${declare}export {\n  alpha,\n  bravo,\n  charlie\n};`,
      errors,
    },
    {
      code: "export { alpha, bravo, charlie, } from 'mod';",
      output: "export {\n  alpha,\n  bravo,\n  charlie,\n} from 'mod';",
      errors,
    },
    {
      code: `${declare}export { alpha as first, bravo as second, charlie };`,
      output: `${declare}export {\n  alpha as first,\n  bravo as second,\n  charlie\n};`,
      errors,
    },
    {
      // A half-split pair goes fully one per line, never back onto one.
      code: "export {\n  alpha, bravo } from 'mod';",
      output: "export {\n  alpha,\n  bravo\n} from 'mod';",
      errors,
    },
    {
      code: "export { alpha,\n  bravo\n} from 'mod';",
      output: "export {\n  alpha,\n  bravo\n} from 'mod';",
      errors,
    },
    {
      code: "export { alpha,\n  bravo, charlie } from 'mod';",
      output: "export {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",
      errors,
    },
    {
      code: "const pad = {\n  a: 1,\n};\nexport {\n      alpha, bravo, charlie } from 'mod';",
      output: "const pad = {\n  a: 1,\n};\nexport {\n      alpha,\n  bravo,\n  charlie\n} from 'mod';",
      errors,
    },
    {
      code: "if (ready) {\n  module.exports = 1;\n}\nexport { alpha, bravo, charlie } from 'mod';",
      output: "if (ready) {\n  module.exports = 1;\n}\nexport {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",
      errors,
    },
    {
      code: "export { /* head */ alpha, /* keep */ bravo, charlie /* tail */ } from 'mod';",
      output: "export {\n  /* head */ alpha, /* keep */\n  bravo,\n  charlie /* tail */\n} from 'mod';",
      errors,
    },
    {
      code: "export { alpha, // keep\n  bravo } from 'mod';",
      output: "export {\n  alpha, // keep\n  bravo\n} from 'mod';",
      errors,
    },
    {
      code: "export { alpha, bravo, charlie } from 'mod';\r\n",
      output: "export {\r\n  alpha,\r\n  bravo,\r\n  charlie\r\n} from 'mod';\r\n",
      errors,
    },
    {
      code: "export { alpha as 'first-name', 'bravo', charlie } from 'mod';",
      output: "export {\n  alpha as 'first-name',\n  'bravo',\n  charlie\n} from 'mod';",
      errors,
    },
    {
      code: "export { alpha, bravo, charlie } from './data.json' with { type: 'json' };",
      output: "export {\n  alpha,\n  bravo,\n  charlie\n} from './data.json' with { type: 'json' };",
      errors,
    },
  ],
});

tsRuleTester.run('export-specifier-newline (typescript)', exportSpecifierNewline, {
  valid: [
    'type Alpha = string;\ntype Bravo = number;\nexport type { Alpha, Bravo };',
    'type Alpha = string;\nexport type { Alpha };',
  ],
  invalid: [
    {
      code: `${declareTypes}export type { Alpha, Bravo, Charlie };`,
      output: `${declareTypes}export type {\n  Alpha,\n  Bravo,\n  Charlie\n};`,
      errors,
    },
    {
      code: "export { type Alpha, type Bravo, type Charlie } from 'mod';",
      output: "export {\n  type Alpha,\n  type Bravo,\n  type Charlie\n} from 'mod';",
      errors,
    },
    {
      code: 'type Alpha = string;\ntype Bravo = number;\nexport type { Alpha,\n  Bravo };',
      output: 'type Alpha = string;\ntype Bravo = number;\nexport type {\n  Alpha,\n  Bravo\n};',
      errors,
    },
    {
      code: "declare module 'mod' {\n\texport { Alpha, Bravo, Charlie } from 'other';\n}",
      output: "declare module 'mod' {\n\texport {\n\t\tAlpha,\n\t\tBravo,\n\t\tCharlie\n\t} from 'other';\n}",
      errors,
    },
  ],
});
