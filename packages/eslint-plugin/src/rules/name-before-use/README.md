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
- the operand of an `await`, which is judged itself;
- for an await alone, a `return` it fills, as in `return await load(id);`.

Everywhere else (conditions, `for` headers, a ternary's test, call arguments, `expect`, any other
`return`, an arrow's body, templates, spreads, operands, JSX attributes) it reports. A literal nested in a literal is part
of the outer one's value and is judged there, including one reached through a spread or a branch, as in
`{ ...(exact && { exact }) }`. `as`, `satisfies`, `!`, an angle-bracket assertion and optional chaining pass the
position through.

A ternary's two branches and the right side of `&&`, `||` and `??` stand where the whole expression
does, so `const rules = withVitest ? await loadVitest() : [];` is named. The test and the left side
are conditions and stay judged. `ignoreLiteralArguments` counts only a literal passed straight to a
call, so `run(source ?? [alpha])` still reports.

A literal that a chain of calls starts from stands where the chain does, so
`const code = [alpha, bravo].join('\n');` is named, while `return [alpha, bravo].join(' ');` reports.

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
// incorrect: an await as a ternary's test
const label = (await isReady()) ? 'ready' : 'waiting';
```

```ts
// incorrect: a call chain on a literal, returned
const label = () => {
  return [first, last].join(' ');
};
```

```ts
// incorrect: a literal spread into a call
run(...[alpha, bravo]);
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
// correct: the const names both branches and the right side
const rules = withVitest ? await loadVitest() : [];
const config = source ?? await loadConfig();
```

```ts
// correct: the return names the await it holds whole
const read = async (id) => {
  return await load(id);
};
```

```ts
// correct: the const names the call chain the literal starts
const code = [header, body].join('\n');
```

```ts
// correct: a conditional spread is part of the named literal
const options = { ...(flag ? { alpha } : {}), size };
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
