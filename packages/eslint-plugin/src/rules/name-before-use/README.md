# @linteljs/name-before-use

Name an await, a call that takes a call, or an inline array or object in a const before using it.

- Applies to: JavaScript and TypeScript
- Fixable: no
- In `recommended`: no

A value with a name says what it is, and an expression that waits, nests calls or builds a literal in
the middle of a condition, an argument or a `return` makes the reader work that out. This rule lets
those three stand only where they get a name or stand alone:

- the right side of a `const`, `let` or `var`, an assignment, a default value or a class field;
- a bare statement, such as `await run();` or `log(format(value));`;
- `export default`;
- the operand of an `await`, which is judged itself.

Everywhere else (conditions, `for` headers, ternaries, call arguments, `expect`, `return`, an arrow's
body, templates, spreads, operands, JSX attributes) it reports. A literal nested in a literal is part
of the outer one's value and is judged there. `as`, `satisfies`, `!`, an angle-bracket assertion and optional chaining pass the
position through.

## Examples of incorrect code for this rule

```ts
// incorrect: an await in a condition
if (await settles(fetch(origin))) {
  report();
}
```

```ts
// incorrect: an inline array as an argument
runPm('npm', ['ls', '--all'], project);
```

```ts
// incorrect: a call that takes a call, inside expect
expect(parse(text)).toBe(expected);
```

```ts
// incorrect: a literal returned
const read = () => {
  return { alpha, bravo };
};
```

## Examples of correct code for this rule

```ts
const isUp = await settles(fetch(origin));

if (isUp) {
  report();
}
```

```ts
const lsArgs = ['ls', '--all'];

runPm('npm', lsArgs, project);
```

```ts
const parsed = parse(text);

expect(parsed).toBe(expected);
```

```ts
// correct: a bare statement and a plain value need no name
log(format(value));
items.filter((item) => {
  return item.isActive;
});
```

## Options

```json
{
  "@linteljs/name-before-use": ["error", {
    "ignoreEmptyLiterals": false,
    "ignoreLiteralArguments": false
  }]
}
```

- `ignoreEmptyLiterals` (default `false`): allow `[]` and `{}` anywhere, as in `source ?? []`.
- `ignoreLiteralArguments` (default `false`): allow a literal passed straight to a call, as in
  `new Set([alpha, bravo])` or `defineConfig({ ... })`.

## Why there is no autofix

A good name needs judgement, and a name the fixer made up (`value1`) is worse than the inline
expression. So it reports and you pick the name.
