import { jsRuleTester, tsRuleTester } from '@mocks/ruleTesters';

import { importNewlines } from './importNewlines.ts';

const LONG = 'a'.repeat(130);

jsRuleTester.run('import-newlines', importNewlines, {
  valid: [
    "import alpha from 'mod';",
    "import { alpha } from 'mod';",
    "import {\n  alpha,\n  bravo\n} from 'mod';",
    "import * as namespace from 'mod';",
    "import alpha, { bravo } from 'mod';",
    "import 'mod';",
    "import alpha, * as namespace from 'mod';",

    `import {\n  ${LONG},\n  bravo\n} from 'mod';`,
    // Collapsing it would run past `maxLineLength`.
    `import {\n  ${LONG}\n} from 'mod';`,

    `import defaultExport, * as namespace from '${LONG}';`,
    `import defaultExport from '${LONG}';`,
    `import * as namespace from '${LONG}';`,
    "import {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",
    "import defaultExport, {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",

    "import {\n  alpha,\n  bravo,\n  charlie\n} from 'mod'; // trailing",

    {
      code: "import { alpha, bravo } from 'mod';",
      options: [{
        maxItems: 2,
        maxLineLength: 35,
      }],
    },

    "import {\n  alpha, // why\n  bravo\n} from 'mod';",

    {
      code: "  import {\n    alpha,\n    bravo\n  } from 'mod';",
      options: [{ maxLineLength: 36 }],
    },
  ],
  invalid: [
    {
      code: "import { alpha, bravo } from 'mod';",
      output: "import {\n  alpha,\n  bravo\n} from 'mod';",
      errors: [{ message: 'Imports must be broken into multiple lines if there are more than 1 elements.' }],
    },
    {
      code: "import { alpha, bravo, charlie } from 'mod';",
      output: "import {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",
      errors: [{ messageId: 'mustSplitMany' }],
    },
    {
      code: "  import { alpha, bravo } from 'mod';",
      output: "  import {\n    alpha,\n    bravo\n  } from 'mod';",
      options: [{ maxLineLength: 36 }],
      errors: [{ messageId: 'mustSplitLong' }],
    },
    {
      code: "import alpha, { bravo } from 'mod';",
      output: "import alpha, {\n  bravo\n} from 'mod';",
      options: [{ maxLineLength: 30 }],
      errors: [{ messageId: 'mustSplitLong' }],
    },
    {
      code: "import {\n  alpha,\n  bravo\n} from 'mod';",
      output: "import { alpha, bravo } from 'mod';",
      options: [{
        maxItems: 2,
        maxLineLength: 35,
      }],
      errors: [{ messageId: 'mustNotSplit' }],
    },
    {
      code: "function load() {\n  import('x');\n}\nimport { alpha, bravo, charlie } from 'mod';",
      output: "function load() {\n  import('x');\n}\nimport {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",
      errors: [{ messageId: 'mustSplitMany' }],
    },
    {
      code: `import { alpha, ${LONG} } from 'mod';`,
      output: `import {\n  alpha,\n  ${LONG}\n} from 'mod';`,
      errors: [{ messageId: 'mustSplitLong' }],
    },
    {
      code: "import {\n  alpha\n} from 'mod';",
      output: "import { alpha } from 'mod';",
      errors: [{ messageId: 'mustNotSplit' }],
    },
    {
      code: "import {\n  alpha,\n  bravo\n} from 'mod';",
      output: "import { alpha, bravo } from 'mod';",
      options: [{ maxItems: 2 }],
      errors: [{ messageId: 'mustNotSplit' }],
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
      code: "import {\n  alpha, bravo } from 'mod';",
      output: "import { alpha, bravo } from 'mod';",
      options: [{ maxItems: 2 }],
      errors: [{ messageId: 'limitLineCount' }],
    },
    {
      code: `import {\n  alpha, ${LONG} } from 'mod';`,
      output: `import {\n  alpha,\n  ${LONG}\n} from 'mod';`,
      errors: [{ messageId: 'limitLineCount' }],
    },
    {
      code: "import {\n  alpha, /* keep */ bravo } from 'mod';",
      output: null,
      errors: [{ messageId: 'limitLineCount' }],
    },
    {
      code: "import {\n  alpha,\n\n  bravo,\n  charlie\n} from 'mod';",
      output: "import {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",
      errors: [{ messageId: 'noBlankBetween' }],
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
      code: "import { alpha, bravo, charlie } from 'mod' with { type: 'json' };",
      output: "import {\n  alpha,\n  bravo,\n  charlie\n} from 'mod' with { type: 'json' };",
      errors: [{ messageId: 'mustSplitMany' }],
    },
    {
      code: "import { alpha, /* keep */ bravo, charlie } from 'mod';",
      output: null,
      errors: [{ messageId: 'mustSplitMany' }],
    },
    {
      code: "import defaultExport,\n\n  * as namespace from 'mod';",
      output: "import defaultExport, * as namespace from 'mod';",
      errors: [{ messageId: 'noBlankBetween' }],
    },
    {
      code: "import defaultExport,\n\n  { alpha, bravo, charlie } from 'mod';",
      output: "import defaultExport, {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",
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
      code: `import { alpha, ${LONG} } from 'mod';`,
      options: [{
        maxItems: 2,
        maxLineLength: 400,
      }],
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
      code: "import { alpha, bravo } from 'a-fairly-long-module-path';",
      output: "import {\n  alpha,\n  bravo\n} from 'a-fairly-long-module-path';",
      options: [{
        maxItems: 2,
        maxLineLength: 20,
      }],
      errors: [{ message: 'Imports must be broken into multiple lines if the line length exceeds 20 characters.' }],
    },
    {
      code: "import { alpha } from 'mod';",
      output: "import {\n  alpha\n} from 'mod';",
      options: [{ maxItems: 0 }],
      errors: [{ messageId: 'mustSplitMany' }],
    },
  ],
});

tsRuleTester.run('import-newlines (typescript)', importNewlines, {
  valid: [
    "import type { Alpha } from 'mod';",
    "import type {\n  Alpha,\n  Bravo,\n  Charlie\n} from 'mod';",
  ],
  invalid: [
    {
      code: "import type { Alpha, Bravo } from 'mod';",
      output: "import type {\n  Alpha,\n  Bravo\n} from 'mod';",
      errors: [{ messageId: 'mustSplitMany' }],
    },
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
  ],
});
