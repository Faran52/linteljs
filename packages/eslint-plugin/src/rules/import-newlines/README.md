# @linteljs/import-newlines

Split import lists when they get crowded or too long.

- Category: `layout`
- Applies to: JavaScript and TypeScript
- Fixable: yes (code)
- In `recommended`: yes

An import with more than two named members, or one that runs past 120 characters, goes one member
per line. Anything shorter collapses back onto a single line. The point is that the import block at
the top of a file stays scannable: short imports do not each cost four lines, and long ones do not
run off the side of the screen.

Fixable as `code` rather than `whitespace`, because the rebuild also drops a redundant `as alpha`
and a trailing comma, which is more than spacing.

## Examples of incorrect code for this rule

```ts
import { alpha, bravo, charlie } from 'mod';

import { createConfiguration, resolveConfiguration } from '../../infrastructure/configuration/environmentAwareConfigLoader';

import {
  delta
} from 'one';
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
```

## Options

```jsonc
{
  "@linteljs/import-newlines": ["error", { "maxItems": 2, "maxLineLength": 120 }]
}
```

- `maxItems`: integer, `2` by default. More named members than this and the statement splits one
  per line. Fewer, and a statement already split collapses back onto one line, provided the result
  fits inside `maxLineLength`.
- `maxLineLength`: integer, `120` by default. A statement longer than this splits even when it is
  under the member count. It only applies when there is a named member to break onto a line of its
  own: a default or namespace import has nothing to split, so it is left alone however long it
  runs.

## What it declines to fix

The fix rebuilds the statement from its specifiers, so a comment anywhere inside it means the rule
reports and offers no fix. Reflowing over the comment would delete it silently.

Import attributes survive the rebuild. Everything from the module specifier onwards is copied
verbatim, so `import data from './x.json' with { type: 'json' }` keeps its `with` clause. That was
a real bug: rebuilding from `source.raw` dropped the clause and the import stopped resolving.

## Notes

Members land at the statement's own column plus one indentation step, inferred from the file. Exact
widths are still an indent rule's job.
