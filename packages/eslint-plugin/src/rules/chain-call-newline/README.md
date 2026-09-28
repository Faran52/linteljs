# @linteljs/chain-call-newline

Put each call on its own line once a chain has two calls or a callback with a body.

- Applies to: JavaScript and TypeScript
- Fixable: yes (whitespace)
- In `recommended`: yes

A chain reads top to bottom when every step starts a line: what it starts from, then one call per
line. A single short call does not need that, so `expect(x).toBe(y)` and `items.map(fn)` stay on
one line. The shape kicks in once there is a second call to find, or a callback body that already
spans lines.

How a chain is read:

- The **head** is what the chain hangs off: a name, `this`, a call like `expect(x)` or `load()`, a
  literal, a parenthesised expression, `await` included. Property reads before the first link stay
  with it, so `this.items`, `expect(x).not` and `recordFor().starterFiles` are heads.
- A call into a **namespace** stays in the head too: `Object.keys(x)`, `JSON.parse(text)`,
  `z.string()`. A namespace is a global, or an imported binding not named like a constant.
  `ROUTES.map(fn)` is a call on a value, since `ROUTES` is a constant, and so is anything declared
  in the file.
- A **link** is a call through `.name` or `?.name`. After the first, a link starts at the first
  property read past the call before it, so `rows.find(fn).name.trim()` breaks before `.name`.
- A chain **qualifies** with two or more links, or with one link whose arguments include a function
  with a block body.

A computed read (`[0]`), a call of a call (`it.each(rows)('name', fn)`) and a property read after
the last call stay attached to what comes before them, and a non-null assertion (`!`) ends the head
it follows. Chains inside a template literal's `${}`, a JSX attribute or a Svelte template are held
to the same shape; only code is ever broken, never string content.

## Examples of incorrect code for this rule

```ts
// incorrect: two calls on one line
const names = users.filter(isActive).map(nameOf);

// incorrect: a callback body behind the call
const doubled = values.map((value) => {
  return value * 2;
});

// incorrect: half split
const words = text
  .trim().split(' ');
```

## Examples of correct code for this rule

```ts
// correct: one call on the head
expect(result).toBe(3);
const ids = items.map(idOf);

// correct: a namespace call is part of the head
const keys = Object.keys(record)
  .filter(isPublic)
  .map(format);

// correct: one call per line
const names = users
  .filter(isActive)
  .map(nameOf);

const doubled = values
  .map((value) => {
    return value * 2;
  });
```

## What it declines to fix

The fix replaces the whitespace in front of each `.` or `?.` it breaks at with a newline and the
chain's indent plus one step, and moves the lines a callback spans one step right with its call.
It reports and moves nothing when:

- A comment sits between the end of one link and the `.` of the next.
- A block comment spanning lines sits inside a callback that would move, since shifting its inner
  lines would rewrite the comment.
- A new line, or a line that would move, would end up longer than `maxLineLength`.

Lines inside a template literal and blank lines never move.

A chain nested in another chain's arguments is broken by the same fix, at the indent the outer
chain's break leaves it on. Separate fixes would overlap, ESLint applies one of them a pass, and
its ten passes stop before a nest more than ten deep is done. A nested chain that fails one of the
checks above is left, with every chain inside it, to the next pass.

A chain that starts on a line another chain's fix breaks goes in that fix too, indented from where
the break leaves it: `run(a.map(f).filter(g), b.map(f).filter(g))` puts `b`'s calls one step past
the line `.filter(g), b`.

## Options

```jsonc
{
  "@linteljs/chain-call-newline": ["error", { "maxLineLength": 120 }]
}
```

- `maxLineLength`: integer, `120` by default. Set it to the width your line-length rule enforces,
  so the fix never writes a line that rule would report.

## Notes

The rule breaks lines and never joins them: a chain already split further than it needs to be is
left alone. It does not check the indent of a link already on its own line either; that is
`@stylistic/indent`'s job. The fix writes one step in from the line the chain starts on, which is
what that rule asks for everywhere but inside a multi-line ternary, where it settles the rest.

`@stylistic/newline-per-chained-call` counts differently: it counts the head's own call, so at depth
one it splits every `expect(x).toBe(y)`, at depth two it misses a two-call chain, and its fix leaves
a chain half split.
