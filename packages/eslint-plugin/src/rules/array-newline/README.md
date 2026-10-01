# @linteljs/array-newline

Put each element of an array or array pattern with three or more on its own line.

- Applies to: JavaScript and TypeScript
- Fixable: yes (whitespace)
- In `recommended`: yes

An array with three or more elements goes one element per line, with the opening and closing
brackets on lines of their own, and an array destructuring pattern is held to the same shape. It is
the threshold [`member-newline`](../member-newline) holds an object, an object pattern, an interface
and a type literal to, and [`import-newlines`](../import-newlines) an import: three or more items,
one per line.

An array of two or fewer may sit on one line or go one per line, so
`const [value, setValue] = useState(0)` stays as written. What it may not be is half-split, broken
in some places and not others: `[alpha,\n  bravo]` is fixed to the fully expanded form. This rule
only ever adds line breaks; it never joins lines.

## Examples of incorrect code for this rule

```ts
const triple = [alpha, bravo, charlie];

const list = [
  alpha, bravo,
];

run([alpha,
  bravo]);

const [first, second, third] = triple;
```

## Examples of correct code for this rule

```ts
const empty = [];

const single = [alpha];

const pair = [alpha, bravo];

const triple = [
  alpha,
  bravo,
  charlie
];

const one = [{
  delta: 1
}];

const [value, setValue] = useState(0);
```

## Options

None.

## Notes

- **Holes** are slots like any other, so `[, alpha, bravo]` puts the lone comma on a line of its own.
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
accepts `[alpha,\n  bravo]` with a hanging bracket. Neither setting says "three or more, one per line,
and leave the rest alone", which is the whole of this rule.

Measured on 2026-10-02 with this rule swapped for the pair, over all 60 combinations of
`array-bracket-newline` (`always`, `never`, `consistent`, `multiline`, `minItems: 3`, both) and
`array-element-newline` (the same, and `consistent` with each). The closest, brackets at
`{ multiline: true, minItems: 3 }` and elements at `{ consistent: true, minItems: 3 }`, gives this
rule's fixed output on 36 of its 48 suite cases. Over the workspace and every starter (1,086 files)
it rewrites 123 files (+2,021 -1,471) today and 121 in the tree before this rule landed, nearly all
by splitting a short list that holds one multi-line element, `['error', {\n  ...\n}]`.
