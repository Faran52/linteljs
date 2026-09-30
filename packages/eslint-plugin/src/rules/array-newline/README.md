# @linteljs/array-newline

Put each element of an array or array pattern with two or more on its own line.

- Applies to: JavaScript and TypeScript
- Fixable: yes (whitespace)
- In `recommended`: yes

An array with two or more elements goes one element per line, with the opening and closing brackets
on lines of their own, and an array destructuring pattern is held to the same shape. It is the
threshold `@stylistic/object-property-newline` holds an object literal to,
[`member-newline`](../member-newline) an object pattern, an interface and a type literal, and
[`import-newlines`](../import-newlines) an import: two or more items, one per line.

An array of none or one is left exactly as written. This rule only ever adds line breaks; it never
joins lines.

## Examples of incorrect code for this rule

```ts
const pair = [alpha, bravo];

const list = [
  alpha, bravo,
];

run([alpha,
  bravo]);

const [first, second] = pair;
```

## Examples of correct code for this rule

```ts
const empty = [];

const single = [alpha];

const pair = [
  alpha,
  bravo
];

const one = [{
  charlie: 1
}];

const [
  first,
  second
] = pair;
```

## Options

None.

## Notes

- **Holes** are slots like any other, so `[, alpha]` puts the lone comma on a line of its own.
- **A trailing comma** stays on the last element's line. Whether there is one is
  `@stylistic/comma-dangle`'s decision, not this rule's.
- **Comments** are never moved across a comma or deleted. A comment on the same line after a comma
  describes the element before it, so the break goes after the comment: `[alpha, // first` keeps
  `// first` beside `alpha`.
- **Nested arrays** are fixed from the outside in. The outer array splits on the first pass and each
  inner one on the next, since the two fixes touch overlapping text.
- **Indentation**: the elements go one step in from the line the array starts on, with the step read
  off the file. An element that spans lines keeps its inner lines where they were, for
  `@stylistic/indent` to settle.

## Why not `@stylistic`

`@stylistic/array-bracket-newline` in `multiline` or `minItems` mode joins a one-element array whose
element is a single token back onto one line, past `max-len` if it has to. In `consistent` mode it
accepts `[alpha,\n  bravo]` with a hanging bracket. Neither setting says "two or more, one per line,
and leave the rest alone", which is the whole of this rule.
