# @linteljs/member-newline

Put each member of an object, object pattern, interface, or type literal with three or more on its own line.

- Applies to: JavaScript and TypeScript
- Fixable: yes (whitespace)
- In `recommended`: yes

Three or more members go one per line, with the braces on lines of their own. Two or fewer may sit
on one line, or go one per line; what they may not be is half-split, broken in some places and not
others, so `const { alpha,\n  bravo } = source` is fixed to the fully expanded form. That is the
threshold [`@linteljs/array-newline`](../array-newline) holds an array to and
[`@linteljs/import-newlines`](../import-newlines) an import, so the declaration of an object, the
object itself and the destructuring of it all read the same way. A rest or spread element counts
like any other member.

The rule never joins lines. It only adds breaks, and removes a blank line between the members of a
pattern, interface or type literal over the count.

## Examples of incorrect code for this rule

```ts
const { alpha, bravo, charlie } = source;

const { delta,
  echo } = source;

const point = { x: 1, y: 2, z: 3 };

interface Wide { golf: string; hotel: number; india: boolean }

interface Half {
  juliet: string; kilo: number;
}
```

## Examples of correct code for this rule

```ts
const { alpha, bravo } = source;

const {
  charlie,
  delta,
  ...rest
} = other;

const point = { x: 1, y: 2 };

interface Wide {
  echo: string;
  foxtrot: number;
  golf: boolean;
}
```

## Options

```jsonc
{
  "@linteljs/member-newline": ["error", { "maxProperties": 2 }]
}
```

- `maxProperties`: integer, `2` by default. More than this and the list splits one member per line.

## Notes

- **Blank lines** in an object literal are left alone, since they group properties on purpose. In a
  pattern, an interface or a type literal over the count they are removed.
- **Comments** are never moved across a separator or deleted. A comment on the same line after a
  member or its comma describes that member, so the break goes after the comment:
  `meta?: string; // describes meta` keeps its note beside `meta`.
- **A trailing comma** stays on the last member's line. Whether there is one is
  `@stylistic/comma-dangle`'s decision, not this rule's.
- **A multi-line member** does not make an object literal split: `{ x: 1, draw: () => {...} }` has
  two members and every break between them is on one line, so it stays as written. An object pattern
  does split: `const { alpha = {\n  first\n}, bravo } = source` goes one member per line, since a
  default buried mid-line hides the names it binds. Each line of that member moves one step in with it.
  The fix is withheld, and the pattern only reported, when a comment sits inside it or a token spans
  lines (a template, JSX text, a continued string), since an added indent would change what it holds.
  A split pattern is never joined back.
- **Indentation**: members go one step in from the line the list starts on, with the step read off
  the file. A member that spans lines keeps its inner lines where they were, for `@stylistic/indent`
  to settle.
- **An optional pattern parameter** keeps its `?` and type annotation, which sit after its brace.

## Why not `@stylistic`

`@stylistic/object-curly-newline` at `{ minProperties: 3, consistent: true }` on all four node types,
with `object-property-newline` at `allowAllPropertiesOnSameLine: true`, gives this rule's output
over the workspace and every starter (1,086 files): no file differs. The cases differ: it matches this
rule's fixed output on 34 of the 68 suite cases. It passes a half-split pair (`{ alpha,\n  bravo }`), `{\n  alpha, bravo, charlie }`, and an
interface or type literal of three members on one line, since `object-property-newline` reads
object literals and patterns only. With `allowAllPropertiesOnSameLine: false` it splits every pair
instead: 15 files, +94 -46. Measured on 2026-10-02 over every combination of `multiline`,
`minProperties: 3`, `consistent`, `always` and `never`, with `object-property-newline` in both modes
and off.
