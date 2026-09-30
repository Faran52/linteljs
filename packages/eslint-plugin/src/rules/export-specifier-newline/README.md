# @linteljs/export-specifier-newline

Put each specifier of an export list with three or more on its own line.

- Applies to: JavaScript and TypeScript
- Fixable: yes (whitespace)
- In `recommended`: yes

Three or more specifiers go one per line, with the braces on lines of their own, the same count
`array-newline`, `member-newline` and `import-newlines` hold their lists to. Two or fewer sit on one
line or go fully one per line; a pair broken in one place and not the other is fixed to one per line.
The rule never joins lines.

## Examples of incorrect code for this rule

```ts
// incorrect: three specifiers sharing a line
export { alpha, bravo, charlie };

// incorrect: the re-export form, same problem
export { delta, echo, foxtrot } from 'mod';

// incorrect: a half-split pair
export { alpha,
  bravo };
```

## Examples of correct code for this rule

```ts
// correct: two specifiers may share a line
export { alpha, bravo };

// correct: one per line
export {
  charlie,
  delta,
  echo
} from 'mod';

// correct: a pair fully split is left as written
export type {
  Alpha,
  Bravo
};

// correct: a star re-export has no specifier list at all
export * from 'other';

// correct: an inline declaration is not a specifier list either
export const foxtrot = 1;
```

## Options

None.

## Notes

The fix only replaces whitespace: it breaks the line after the opening brace, after each comma and
before the closing brace, and indents members one step in from the statement. A comment inside the
braces stays where it is, and one trailing a comma on the same line stays with the specifier before
it. A trailing comma stays on the last specifier's line.
