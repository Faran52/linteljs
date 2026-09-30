# @linteljs/import-newlines

Put each named import of an import with three or more on its own line.

- Applies to: JavaScript and TypeScript
- Fixable: yes (whitespace)
- In `recommended`: yes

Three or more named imports go one per line, with the braces on lines of their own, the same count
`array-newline`, `member-newline` and `export-specifier-newline` hold their lists to. Two or fewer sit
on one line or go fully one per line; a pair broken in one place and not the other is fixed to one per
line. A blank line inside the braces is removed. The rule never joins lines.

Only the braced list counts. A default import and a namespace import sit outside it, are never
counted and are never moved, so `import React, { useEffect, useState } from 'react'` stays on one line
and `import alpha, * as namespace from 'mod'` has nothing to split.

## Examples of incorrect code for this rule

```ts
import { alpha, bravo, charlie } from 'mod';

import { delta,
  echo } from 'one';

import {
  foxtrot,

  golf
} from 'two';
```

## Examples of correct code for this rule

```ts
import { alpha, bravo } from 'mod';

import {
  alpha,
  bravo
} from 'mod';

import {
  charlie,
  delta,
  echo
} from 'one';

import defaultExport, {
  foxtrot,
  golf,
  hotel
} from 'two';

import 'side-effects-only';
```

## Options

```jsonc
{
  "@linteljs/import-newlines": ["error", { "maxItems": 2 }]
}
```

- `maxItems`: integer, `2` by default. More named imports than this on one line and the statement
  splits one per line. A single named import is never reported, whatever the count.

## Notes

The fix only rewrites whitespace between tokens, so a comment inside the braces stays where it is and
a trailing comma is left for `comma-dangle`. A comment on the same line after a comma stays with the
import before it. Members land at the statement's own column plus one indentation step, inferred from
the file. Exact widths are still an indent rule's job.
