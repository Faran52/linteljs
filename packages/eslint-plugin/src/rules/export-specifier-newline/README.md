# @linteljs/export-specifier-newline

Put each export specifier on its own line.

- Category: `layout`
- Applies to: JavaScript and TypeScript
- Fixable: yes (whitespace)
- In `recommended`: yes

The export list is the public surface of a file, and it changes more often than anything else in
it. One name per line means adding or removing one is a one-line diff instead of a rewritten line
that has to be read word by word. A list of one is already on one line, so nothing is asked of it.

## Examples of incorrect code for this rule

```ts
// incorrect: two specifiers sharing a line
export { alpha, bravo };

// incorrect: the re-export form, same problem
export { charlie, delta } from 'mod';

// incorrect: type exports are held to the same shape
export type { Alpha, Bravo };
```

## Examples of correct code for this rule

```ts
// correct: one specifier, nothing to split
export { alpha };

// correct: one per line
export {
  bravo,
  charlie
} from 'mod';

// correct: type exports, one per line
export type {
  Alpha,
  Bravo
};

// correct: a star re-export has no specifier list at all
export * from 'other';

// correct: an inline declaration is not a specifier list either
export const delta = 1;
```

## What it declines to fix

A comment anywhere inside the statement means the rule reports and moves nothing. The fix splices
the whole gap on each side of the braces, so a comment written in one of those gaps would be
deleted rather than carried across.

## Options

None.

## Notes

The fix puts the braces on their own lines and indents members one step in from the statement.
Splitting on the commas alone would leave `export { alpha,\nbravo };`, which is neither the input
nor anything a formatter would produce.
