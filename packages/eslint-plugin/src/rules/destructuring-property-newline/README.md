# @linteljs/destructuring-property-newline

Keep destructuring patterns either compact or fully expanded, never half-split.

- Category: `layout`
- Applies to: JavaScript and TypeScript
- Fixable: yes (whitespace)
- In `recommended`: yes

A destructuring pattern is either entirely on one line or entirely one property per line. What this
rule objects to is the half-wrapped shape, where some properties share a line and others do not.
That shape hides a name in the middle of a line where nobody scanning the left margin will find it.
Object patterns and array patterns are both checked.

## Examples of incorrect code for this rule

```ts
const { alpha,
  bravo, charlie } = source;

const [first,
  second, third] = source;
```

## Examples of correct code for this rule

```ts
const { alpha, bravo, charlie } = source;

const {
  alpha,
  bravo,
  charlie
} = source;

const [
  first,
  second,
  third
] = source;
```

## What it declines to fix

A comment between a comma and the next property makes that gap unsafe to rewrite. The fix replaces
everything between the two, so it would take the comment with it. The rule reports and leaves the
line alone.

Array holes are skipped entirely. A hole has no tokens of its own, so a pair it takes part in
cannot be measured, and `const [alpha,\n  , bravo]` goes unreported.

## Options

None.

## Notes

The fix puts the moved property one indentation step in from the line the pattern starts on, and
the step is read off the file rather than assumed.
