import { jsRuleTester, tsRuleTester } from '@mocks/ruleTesters';

import { importNewlines } from './importNewlines.ts';

const LONG = 'a'.repeat(130);

jsRuleTester.run('import-newlines', importNewlines, {
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

jsRuleTester.run('import-newlines (options)', importNewlines, {
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
      errors: [{ message: 'Imports must be broken into multiple lines if there are more than 1 elements.' }],
    },
    {
      code: "import { alpha, bravo, charlie, delta } from 'mod';",
      output: "import {\n  alpha,\n  bravo,\n  charlie,\n  delta\n} from 'mod';",
      options: [{ maxItems: 3 }],
      errors: [{ message: 'Imports must be broken into multiple lines if there are more than 3 elements.' }],
    },
    {
      code: "import { alpha, bravo,\n  charlie } from 'mod';",
      output: "import {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",
      options: [{ maxItems: 3 }],
      errors: [{ messageId: 'limitLineCount' }],
    },
  ],
});

tsRuleTester.run('import-newlines (typescript)', importNewlines, {
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
