# @linteljs/member-newline

Put each member of an object pattern, interface, or type literal with two or more on its own line.

- Applies to: JavaScript and TypeScript
- Fixable: yes (code)
- In `recommended`: yes

Two or more members go one per line, with the braces on lines of their own. That is the threshold
`@stylistic/object-property-newline` holds an object literal to and
[`@linteljs/array-newline`](../array-newline) holds an array to, so the declaration of an object,
the object itself and the destructuring of it all read the same way. A rest element counts like
any other member.

## Examples of incorrect code for this rule

```ts
const { alpha, bravo } = source;

const { charlie, ...rest } = source;

const { delta, echo,
  foxtrot } = source;

interface Wide { golf: string; hotel: number }

interface Half {
  india: string; juliet: number;
  kilo: boolean;
}
```

## Examples of correct code for this rule

```ts
const { alpha } = source;

const {
  bravo,
  charlie
} = source;

const {
  delta,
  ...rest
} = other;

interface Wide {
  echo: string;
  foxtrot: number;
}
```

An optional parameter stays optional, and its type annotation comes back with it:

```ts
// correct: the `?` and the `: Options` belong to the pattern and are preserved
declare function load({
  mike,
  november
}?: Options): void;
```

## Options

```jsonc
{
  "@linteljs/member-newline": ["error", {
    "maxProperties": 1,
    "maxLineLength": 120
  }]
}
```

- `maxProperties`: integer, `1` by default. More than this and the pattern, interface or type
  literal splits one member per line. Raise it and a split pattern at or under the count is
  collapsed back onto one line.
- `maxLineLength`: integer, `120` by default, and the same figure `import-newlines` uses. Only
  read when `maxProperties` is raised: a split pattern under the count is only collapsed when the
  one line it would become fits inside this. Everything on that line counts, not just the pattern,
  so `const ` in front of it and ` = source;` behind it are measured too.

## What it declines to fix

- A property that itself spans lines while the others sit on the opening line is reported with no
  fix at all. The rebuild works property by property and has no way to express that shape, so it
  says what is wrong and leaves the decision to you.
- A comment between the last member and the closing brace is reported without a fix. The split
  rewrites that gap to move the brace down, which would take the comment with it.
- A destructuring pattern with a comment anywhere inside it is reported without a fix. The pattern
  is rebuilt from the text of its members, which would drop the comment.
- With `maxProperties` raised, a split pattern whose collapsed form would run past
  `maxLineLength` is left split and not reported. Collapsing it would trade this rule's report for
  a `max-len` one that no fixer here can answer.

## Notes

A doc comment above a member counts as part of that member, so the space it occupies is not read as
a blank line. That was a real bug: every documented interface reported forever, with no edit that
could satisfy the rule. A genuine blank line between two members is reported, doc comments or not,
once the block is over `maxProperties`.

A note written beside a member, as `meta?: string; // describes meta`, belongs to that member. It
does not count towards where the next one starts, and a split puts the newline after it rather than
in front of it. Both halves were wrong in 1.0.1: an interface already one member per line reported,
and the fix moved every note down onto the field below, so each described the wrong thing.

Rebuilt blocks keep the column they came from, indented one step further in.
