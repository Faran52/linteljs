# @linteljs/import-newlines

Split import lists when they get crowded or too long.

- Applies to: JavaScript and TypeScript
- Fixable: yes (code)
- In `recommended`: yes

An import with two or more named members, or one that runs past 120 characters, goes one member
per line. A single named member collapses back onto one line. Two or more is the threshold every
list layout in this plugin uses, from `array-newline` to `member-newline`, so an import reads like
the object and the array beside it.

Fixable as `code` rather than `whitespace`, because the rebuild also drops a redundant `as alpha`
and a trailing comma, which is more than spacing.

## Examples of incorrect code for this rule

```ts
import { alpha, bravo } from 'mod';

import { createConfiguration, resolveConfiguration } from '../../infrastructure/configuration/environmentAwareConfigLoader';

import {
  delta
} from 'one';
```

## Examples of correct code for this rule

```ts
import { alpha } from 'mod';

import {
  bravo,
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
  "@linteljs/import-newlines": ["error", { "maxItems": 1, "maxLineLength": 120 }]
}
```

- `maxItems`: integer, `1` by default. More named members than this and the statement splits one
  per line. Fewer, and a statement already split collapses back onto one line, provided the result
  fits inside `maxLineLength`. A half-split statement under the count collapses in that one pass
  rather than being split first and collapsed on the next.
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
