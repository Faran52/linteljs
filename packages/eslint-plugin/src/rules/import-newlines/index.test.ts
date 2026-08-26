import { jsRuleTester, tsRuleTester } from '@mocks/ruleTesters';

import { importNewlines } from './index.ts';

const LONG = 'a'.repeat(130);

jsRuleTester.run('import-newlines', importNewlines, {
  valid: [
    "import alpha from 'mod';",
    "import { alpha } from 'mod';",
    "import { alpha, bravo } from 'mod';",
    "import * as namespace from 'mod';",
    "import alpha, { bravo } from 'mod';",
    "import 'mod';",
    "import alpha, * as namespace from 'mod';",

    // Under the split threshold, but collapsing would run past the line limit, so the fix is not offered.
    `import {\n  ${LONG},\n  bravo\n} from 'mod';`,

    // A default or namespace import cannot be broken onto separate lines, so the rule stays quiet.
    `import defaultExport, * as namespace from '${LONG}';`,
    `import defaultExport from '${LONG}';`,
    `import * as namespace from '${LONG}';`,
    "import {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",
    "import defaultExport, {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",

    // A trailing line comment does not prevent this from being read as already split.
    "import {\n  alpha,\n  bravo,\n  charlie\n} from 'mod'; // trailing",

    // Exactly at the limit is allowed; the message requires the length to be exceeded.
    {
      code: "import { alpha, bravo } from 'mod';",
      options: [{ maxLineLength: 35 }],
    },

    // A comment on a specifier's own line reaches the collapse check with nothing to collapse to.
    "import {\n  alpha, // why\n  bravo\n} from 'mod';",

    // Collapsing would put the line at 37 characters once the indent is counted, so it stays split.
    {
      code: "  import {\n    alpha,\n    bravo\n  } from 'mod';",
      options: [{ maxLineLength: 36 }],
    },
  ],
  invalid: [
    {
      code: "import { alpha, bravo, charlie } from 'mod';",
      output: "import {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",
      errors: [{ messageId: 'mustSplitMany' }],
    },
    {
      // The indent column counts towards the length: 35 characters starting at column 2 runs to 37.
      code: "  import { alpha, bravo } from 'mod';",
      output: "  import {\n    alpha,\n    bravo\n  } from 'mod';",
      options: [{ maxLineLength: 36 }],
      errors: [{ messageId: 'mustSplitLong' }],
    },
    {
      // A default import cannot be split, but the named ones can, so this still has something to split.
      code: "import alpha, { bravo } from 'mod';",
      output: "import alpha, {\n  bravo\n} from 'mod';",
      options: [{ maxLineLength: 30 }],
      errors: [{ messageId: 'mustSplitLong' }],
    },
    {
      code: "import {\n  alpha,\n  bravo\n} from 'mod';",
      output: "import { alpha, bravo } from 'mod';",
      options: [{ maxLineLength: 35 }],
      errors: [{ messageId: 'mustNotSplit' }],
    },
    {
      // Members land at the statement's own column plus one step, not at column 0.
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
      errors: [{ messageId: 'mustNotSplit' }],
    },
    {
      code: "import { alpha,\n  bravo, charlie } from 'mod';",
      output: "import {\n  alpha,\n  bravo,\n  charlie\n} from 'mod';",
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
      // Import attributes must survive the rebuild or the statement stops resolving.
      code: "import { alpha, bravo, charlie } from 'mod' with { type: 'json' };",
      output: "import {\n  alpha,\n  bravo,\n  charlie\n} from 'mod' with { type: 'json' };",
      errors: [{ messageId: 'mustSplitMany' }],
    },
    {
      // A comment inside the braces cannot be carried across, so the rule reports with no fix.
      code: "import { alpha, /* keep */ bravo, charlie } from 'mod';",
      output: null,
      errors: [{ messageId: 'mustSplitMany' }],
    },
    {
      // A blank line is the one route by which a namespace import reaches the rebuild.
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
      options: [{ maxLineLength: 400 }],
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
      // The message carries the configured value, not the default.
      code: "import { alpha, bravo, charlie, delta } from 'mod';",
      output: "import {\n  alpha,\n  bravo,\n  charlie,\n  delta\n} from 'mod';",
      options: [{ maxItems: 3 }],
      errors: [{ message: 'Imports must be broken into multiple lines if there are more than 3 elements.' }],
    },
    {
      code: "import { alpha, bravo } from 'a-fairly-long-module-path';",
      output: "import {\n  alpha,\n  bravo\n} from 'a-fairly-long-module-path';",
      options: [{ maxLineLength: 20 }],
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
    "import type { Alpha, Bravo } from 'mod';",
    "import type {\n  Alpha,\n  Bravo,\n  Charlie\n} from 'mod';",
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
  ],
});
