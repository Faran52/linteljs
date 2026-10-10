# @linteljs/specifier-newline

Put each specifier of an import or export list with three or more on its own line.

- Applies to: JavaScript and TypeScript
- Fixable: yes (whitespace)
- In `recommended`: yes

Three or more specifiers in an import or export list go one per line, with the braces on lines of their own,
the same count `array-newline` and `member-newline` hold their lists to. Two or fewer sit on one line or go
fully one per line; a pair broken in one place and not the other is fixed to one per line. A blank line inside
the braces is removed. The rule never joins lines.

Only the braced list counts. A default import and a namespace import sit outside it, are never counted and
are never moved, so `import React, { useEffect, useState } from 'react'` stays on one line and
`import alpha, * as namespace from 'mod'` has nothing to split. `export * from 'mod'` and an inline
declaration such as `export const alpha = 1` have no list either.

## Examples of incorrect code for this rule

```ts
import { alpha, bravo, charlie } from 'mod';

import { delta,
  echo } from 'one';

import {
  foxtrot,

  golf
} from 'two';

export { alpha, bravo, charlie };

export { delta, echo, foxtrot } from 'mod';
```

## Examples of correct code for this rule

```ts
import { alpha, bravo } from 'mod';

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

export { alpha, bravo };

export type {
  Alpha,
  Bravo
};

export {
  charlie,
  delta,
  echo
} from 'mod';

export * from 'other';
```

## Options

```jsonc
{
  "@linteljs/specifier-newline": ["error", { "maxItems": 2 }]
}
```

- `maxItems`: integer, `2` by default. More specifiers than this on one line and the list splits one per
  line, for imports and exports alike. A single specifier is never reported, whatever the count.

## Notes

The fix only rewrites whitespace between tokens, so a comment inside the braces stays where it is and a
trailing comma is left on the last specifier's line for `comma-dangle`. A comment on the same line after a
comma stays with the specifier before it. Members land at the statement's own column plus one indentation
step, inferred from the file. Exact widths are still an indent rule's job.
