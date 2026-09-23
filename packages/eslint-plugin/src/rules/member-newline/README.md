# @linteljs/member-newline

Keep crowded destructuring patterns, interfaces, and type literals on separate lines.

- Applies to: JavaScript and TypeScript
- Fixable: yes (code)
- In `recommended`: yes

More than two properties go one per line. A pattern containing a rest element drops that threshold
to one, because `...rest` at the end of a crowded line is the easiest thing in a file to miss.
Interfaces and type literals are held to the same shape, so the declaration of an object and the
destructuring of it read the same way.

## Examples of incorrect code for this rule

```ts
const { alpha, bravo, charlie } = source;

const { delta, ...rest } = source;

interface Wide { echo: string; foxtrot: number; golf: boolean }

interface Half {
  hotel: string; india: number;
  juliet: boolean;
}
```

The last one is the half-split shape, and this rule reports it in an interface or a type literal
only. In a destructuring pattern it belongs to
[`@linteljs/destructuring-property-newline`](../destructuring-property-newline).

## Examples of correct code for this rule

```ts
const { alpha, bravo } = source;

const {
  charlie,
  delta,
  echo
} = source;

const {
  foxtrot,
  ...rest
} = other;

interface Wide {
  golf: string;
  hotel: number;
  india: boolean;
}
```

An optional parameter stays optional, and its type annotation comes back with it:

```ts
// correct: the `?` and the `: Options` belong to the pattern and are preserved
declare function load({
  mike,
  november,
  oscar
}?: Options): void;
```

## Options

```jsonc
{
  "@linteljs/member-newline": ["error", {
    "maxProperties": 2,
    "maxPropertiesWithRest": 1,
    "maxLineLength": 120
  }]
}
```

- `maxProperties`: integer, `2` by default. More than this and the pattern, interface or type
  literal splits one member per line.
- `maxPropertiesWithRest`: integer, `1` by default. Applies instead of `maxProperties` when the
  pattern carries a rest element. The rest element counts towards the total, so at the default any
  named property beside it already puts the pattern over and it splits. Patterns only: neither an
  interface nor a type literal can hold a rest, so this never applies to them. The message names
  whichever of the two thresholds actually fired.
- `maxLineLength`: integer, `120` by default, and the same figure `import-newlines` uses. A split
  pattern under the property count is only collapsed when the one line it would become fits inside
  this. Everything on that line counts, not just the pattern, so `const ` in front of it and
  ` = source;` behind it are measured too.

## What it declines to fix

- A property that itself spans lines while the others sit on the opening line is reported with no
  fix at all. The rebuild works property by property and has no way to express that shape, so it
  says what is wrong and leaves the decision to you.
- A comment between the last member and the closing brace is reported without a fix. The split
  rewrites that gap to move the brace down, which would take the comment with it.
- A split pattern whose collapsed form would run past `maxLineLength` is left split and not
  reported. Collapsing it would trade this rule's report for a `max-len` one that no fixer here can
  answer.

## What it leaves to another rule

A half-split pattern, where some properties share a line and others do not, belongs to
[`@linteljs/destructuring-property-newline`](../destructuring-property-newline). That rule reports
the shape wherever it appears rather than only over the threshold, and moves one property at a time
instead of rebuilding the pattern. Both used to report it, which put two messages and two fixers on
one shape, so this rule now says nothing about a pattern for that reason alone. An interface or a
type literal is a different matter: the sibling rule does not visit either, so the half-split
complaint still applies there.

## Notes

A doc comment above a member counts as part of that member, so the space it occupies is not read as
a blank line. That was a real bug: every documented interface reported forever, with no edit that
could satisfy the rule. A genuine blank line between two members is reported, doc comments or not,
but only once the block is over the threshold: two members with a blank line between them are under
it and stay as they were written.

A note written beside a member, as `meta?: string; // describes meta`, belongs to that member. It
does not count towards where the next one starts, and a split puts the newline after it rather than
in front of it. Both halves were wrong in 1.0.1: an interface already one member per line reported,
and the fix moved every note down onto the field below, so each described the wrong thing.

Rebuilt blocks keep the column they came from, indented one step further in.
