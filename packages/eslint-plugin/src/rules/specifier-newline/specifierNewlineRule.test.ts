import { jsRuleTester, tsRuleTester } from '@mocks/ruleTesters';

import { specifierNewline } from './specifierNewlineRule.ts';

const LONG = 'a'.repeat(130);

jsRuleTester.run('specifier-newline (imports)', specifierNewline, {
  valid: [
    "import alpha from 'mod';",
    "import { alpha } from 'mod';",
    "import { alpha, bravo } from 'mod';",
    "import * as namespace from 'mod';",
    "import alpha, { bravo } from 'mod';",
    "import 'mod';",
    "import {} from 'mod';",
    "import alpha, * as namespace from 'mod';",
    "import alpha, { bravo, charlie } from 'mod';",

    `import {\n  ${LONG},\n  bravo\n} from 'mod';`,
    `import { alpha, ${LONG} } from 'mod';`,

    `import defaultExport, * as namespace from '${LONG}';`,
    `import defaultExport from '${LONG}';`,
    `import * as namespace from '${LONG}';`,
    "import {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",
    "import defaultExport, {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",

    "import {\n  alpha,\n  bravo,\n  charlie\n} from 'mod'; // trailing",

    "import {\n  alpha, // why\n  bravo\n} from 'mod';",

    // A split pair stays split: nothing joins lines.
    "import {\n  alpha,\n  bravo\n} from 'mod';",
    "  import {\n    alpha,\n    bravo\n  } from 'mod';",
    "import {\n  alpha\n} from 'mod';",
    "import { alpha\n} from 'mod';",
    "import defaultExport,\n  * as namespace from 'mod';",
    "import defaultExport,\n\n  * as namespace from 'mod';",
  ],
  invalid: [
    {
      code: "import { alpha, bravo, charlie } from 'mod';",
      output: "import {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",
      errors: [{ messageId: 'mustSplitMany' }],
    },
    {
      code: "function load() {\n  import('x');\n}\nimport { alpha, bravo, charlie } from 'mod';",
      output: "function load() {\n  import('x');\n}\nimport {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",
      errors: [{ messageId: 'mustSplitMany' }],
    },
    {
      code: "import { alpha,\n  bravo, charlie } from 'mod';",
      output: "import {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",
      errors: [{ messageId: 'limitLineCount' }],
    },
    {
      code: "import {\n  alpha, bravo } from 'mod';",
      output: "import {\n  alpha,\n  bravo\n} from 'mod';",
      errors: [{ messageId: 'limitLineCount' }],
    },
    {
      code: "import { alpha,\n  bravo } from 'mod';",
      output: "import {\n  alpha,\n  bravo\n} from 'mod';",
      errors: [{ messageId: 'limitLineCount' }],
    },
    {
      code: "  import { alpha,\n    bravo } from 'mod';",
      output: "  import {\n    alpha,\n    bravo\n  } from 'mod';",
      errors: [{ messageId: 'limitLineCount' }],
    },
    {
      code: "import defaultExport, { alpha,\n  bravo } from 'mod';",
      output: "import defaultExport, {\n  alpha,\n  bravo\n} from 'mod';",
      errors: [{ messageId: 'limitLineCount' }],
    },
    {
      code: `import {\n  alpha, ${LONG} } from 'mod';`,
      output: `import {\n  alpha,\n  ${LONG}\n} from 'mod';`,
      errors: [{ messageId: 'limitLineCount' }],
    },
    {
      code: "import {\n  alpha, /* keep */ bravo } from 'mod';",
      output: "import {\n  alpha, /* keep */\n  bravo\n} from 'mod';",
      errors: [{ messageId: 'limitLineCount' }],
    },
    {
      code: "import {\n  alpha,\n\n  bravo,\n  charlie\n} from 'mod';",
      output: "import {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",
      errors: [{ messageId: 'noBlankBetween' }],
    },
    {
      code: "import {\n\n  alpha,\n  bravo\n} from 'mod';",
      output: "import {\n  alpha,\n  bravo\n} from 'mod';",
      errors: [{ messageId: 'noBlankBetween' }],
    },
    {
      code: "import { alpha,\n\n  bravo, charlie } from 'mod';",
      // One pass settles both: each report carries the whole fix.
      output: "import {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",
      errors: [{ messageId: 'noBlankBetween' }, { messageId: 'limitLineCount' }],
    },
    {
      code: "import defaultExport, { alpha, bravo, charlie } from 'mod';",
      output: "import defaultExport, {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",
      errors: [{ messageId: 'mustSplitMany' }],
    },
    {
      code: "import { alpha as first, bravo as second, charlie } from 'mod';",
      output: "import {\n  alpha as first,\n  bravo as second,\n  charlie\n} from 'mod';",
      errors: [{ messageId: 'mustSplitMany' }],
    },
    {
      code: "import { alpha as alpha, bravo, charlie, } from 'mod';",
      output: "import {\n  alpha as alpha,\n  bravo,\n  charlie,\n} from 'mod';",
      errors: [{ messageId: 'mustSplitMany' }],
    },
    {
      code: "import { alpha, bravo, charlie } from 'mod' with { type: 'json' };",
      output: "import {\n  alpha,\n  bravo,\n  charlie\n} from 'mod' with { type: 'json' };",
      errors: [{ messageId: 'mustSplitMany' }],
    },
    {
      code: "import { alpha, /* keep */ bravo, charlie } from 'mod';",
      output: "import {\n  alpha, /* keep */\n  bravo,\n  charlie\n} from 'mod';",
      errors: [{ messageId: 'mustSplitMany' }],
    },
    {
      code: "import defaultExport,\n\n  { alpha, bravo, charlie } from 'mod';",
      output: "import defaultExport,\n\n  {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",
      errors: [{ messageId: 'mustSplitMany' }],
    },
    {
      code: "import { alpha, bravo, charlie } from 'mod';\r\n",
      output: "import {\r\n  alpha,\r\n  bravo,\r\n  charlie\r\n} from 'mod';\r\n",
      errors: [{ messageId: 'mustSplitMany' }],
    },
    {
      code: "import { 'first-name' as first, alpha, bravo } from 'mod';",
      output: "import {\n  'first-name' as first,\n  alpha,\n  bravo\n} from 'mod';",
      errors: [{ messageId: 'mustSplitMany' }],
    },
    {
      // The comment heading a specifier stays with it; only the blank line goes.
      code: "import {\n  alpha,\n\n  // heads bravo\n  bravo\n} from 'mod';",
      output: "import {\n  alpha,\n  // heads bravo\n  bravo\n} from 'mod';",
      errors: [{ messageId: 'noBlankBetween' }],
    },
  ],
});

jsRuleTester.run('specifier-newline (imports, options)', specifierNewline, {
  valid: [
    {
      code: "import { alpha, bravo, charlie } from 'mod';",
      options: [{ maxItems: 3 }],
    },
    {
      code: "import { alpha, bravo, charlie, delta } from 'mod';",
      options: [{ maxItems: 4 }],
    },
    {
      code: "import { alpha } from 'mod';",
      options: [{ maxItems: 0 }],
    },
  ],
  invalid: [
    {
      code: "import { alpha, bravo } from 'mod';",
      output: "import {\n  alpha,\n  bravo\n} from 'mod';",
      options: [{ maxItems: 1 }],
      errors: [{ message: 'Put each specifier on its own line when there are more than 1.' }],
    },
    {
      code: "import { alpha, bravo, charlie, delta } from 'mod';",
      output: "import {\n  alpha,\n  bravo,\n  charlie,\n  delta\n} from 'mod';",
      options: [{ maxItems: 3 }],
      errors: [{ message: 'Put each specifier on its own line when there are more than 3.' }],
    },
    {
      code: "import { alpha, bravo,\n  charlie } from 'mod';",
      output: "import {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",
      options: [{ maxItems: 3 }],
      errors: [{ messageId: 'limitLineCount' }],
    },
  ],
});

tsRuleTester.run('specifier-newline (imports, typescript)', specifierNewline, {
  valid: [
    "import type { Alpha, Bravo } from 'mod';",
    "import type {\n  Alpha,\n  Bravo,\n  Charlie\n} from 'mod';",
    "import type {\n  Alpha,\n  Bravo\n} from 'mod';",
  ],
  invalid: [
    {
      code: "import type { Alpha, Bravo, Charlie } from 'mod';",
      output: "import type {\n  Alpha,\n  Bravo,\n  Charlie\n} from 'mod';",
      errors: [{ messageId: 'mustSplitMany' }],
    },
    {
      code: "import { type Alpha, type Bravo, Charlie } from 'mod';",
      output: "import {\n  type Alpha,\n  type Bravo,\n  Charlie\n} from 'mod';",
      errors: [{ messageId: 'mustSplitMany' }],
    },
    {
      code: "import { type Alpha,\n  Bravo } from 'mod';",
      output: "import {\n  type Alpha,\n  Bravo\n} from 'mod';",
      errors: [{ messageId: 'limitLineCount' }],
    },
  ],
});

const declare = 'const alpha = 1, bravo = 2, charlie = 3;\n';
const declareTypes = 'type Alpha = string;\ntype Bravo = number;\ntype Charlie = boolean;\n';
const splitMany = [{ messageId: 'mustSplitMany' }];
const limitLine = [{ messageId: 'limitLineCount' }];

jsRuleTester.run('specifier-newline (exports)', specifierNewline, {
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
      errors: splitMany,
    },
    {
      code: "export { alpha, bravo, charlie, } from 'mod';",
      output: "export {\n  alpha,\n  bravo,\n  charlie,\n} from 'mod';",
      errors: splitMany,
    },
    {
      code: `${declare}export { alpha as first, bravo as second, charlie };`,
      output: `${declare}export {\n  alpha as first,\n  bravo as second,\n  charlie\n};`,
      errors: splitMany,
    },
    {
      // A half-split pair goes fully one per line, never back onto one.
      code: "export {\n  alpha, bravo } from 'mod';",
      output: "export {\n  alpha,\n  bravo\n} from 'mod';",
      errors: limitLine,
    },
    {
      code: "export { alpha,\n  bravo\n} from 'mod';",
      output: "export {\n  alpha,\n  bravo\n} from 'mod';",
      errors: limitLine,
    },
    {
      code: "export { alpha,\n  bravo, charlie } from 'mod';",
      output: "export {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",
      errors: limitLine,
    },
    {
      code: "const pad = {\n  a: 1,\n};\nexport {\n      alpha, bravo, charlie } from 'mod';",
      output: "const pad = {\n  a: 1,\n};\nexport {\n      alpha,\n  bravo,\n  charlie\n} from 'mod';",
      errors: limitLine,
    },
    {
      code: "if (ready) {\n  module.exports = 1;\n}\nexport { alpha, bravo, charlie } from 'mod';",
      output: "if (ready) {\n  module.exports = 1;\n}\nexport {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",
      errors: splitMany,
    },
    {
      code: "export { /* head */ alpha, /* keep */ bravo, charlie /* tail */ } from 'mod';",
      output: "export {\n  /* head */ alpha, /* keep */\n  bravo,\n  charlie /* tail */\n} from 'mod';",
      errors: splitMany,
    },
    {
      code: "export { alpha, // keep\n  bravo } from 'mod';",
      output: "export {\n  alpha, // keep\n  bravo\n} from 'mod';",
      errors: limitLine,
    },
    {
      code: "export { alpha, bravo, charlie } from 'mod';\r\n",
      output: "export {\r\n  alpha,\r\n  bravo,\r\n  charlie\r\n} from 'mod';\r\n",
      errors: splitMany,
    },
    {
      code: "export { alpha as 'first-name', 'bravo', charlie } from 'mod';",
      output: "export {\n  alpha as 'first-name',\n  'bravo',\n  charlie\n} from 'mod';",
      errors: splitMany,
    },
    {
      code: "export { alpha, bravo, charlie } from './data.json' with { type: 'json' };",
      output: "export {\n  alpha,\n  bravo,\n  charlie\n} from './data.json' with { type: 'json' };",
      errors: splitMany,
    },
    {
      code: "export {\n  alpha,\n\n  bravo\n} from 'mod';",
      output: "export {\n  alpha,\n  bravo\n} from 'mod';",
      errors: [{ messageId: 'noBlankBetween' }],
    },
  ],
});

jsRuleTester.run('specifier-newline (exports, options)', specifierNewline, {
  valid: [
    {
      code: "export { alpha, bravo, charlie } from 'mod';",
      options: [{ maxItems: 3 }],
    },
  ],
  invalid: [
    {
      code: "export { alpha, bravo } from 'mod';",
      output: "export {\n  alpha,\n  bravo\n} from 'mod';",
      options: [{ maxItems: 1 }],
      errors: [{ message: 'Put each specifier on its own line when there are more than 1.' }],
    },
  ],
});

tsRuleTester.run('specifier-newline (exports, typescript)', specifierNewline, {
  valid: [
    'type Alpha = string;\ntype Bravo = number;\nexport type { Alpha, Bravo };',
    'type Alpha = string;\nexport type { Alpha };',
  ],
  invalid: [
    {
      code: `${declareTypes}export type { Alpha, Bravo, Charlie };`,
      output: `${declareTypes}export type {\n  Alpha,\n  Bravo,\n  Charlie\n};`,
      errors: splitMany,
    },
    {
      code: "export { type Alpha, type Bravo, type Charlie } from 'mod';",
      output: "export {\n  type Alpha,\n  type Bravo,\n  type Charlie\n} from 'mod';",
      errors: splitMany,
    },
    {
      code: 'type Alpha = string;\ntype Bravo = number;\nexport type { Alpha,\n  Bravo };',
      output: 'type Alpha = string;\ntype Bravo = number;\nexport type {\n  Alpha,\n  Bravo\n};',
      errors: limitLine,
    },
    {
      code: "declare module 'mod' {\n\texport { Alpha, Bravo, Charlie } from 'other';\n}",
      output: "declare module 'mod' {\n\texport {\n\t\tAlpha,\n\t\tBravo,\n\t\tCharlie\n\t} from 'other';\n}",
      errors: splitMany,
    },
  ],
});
