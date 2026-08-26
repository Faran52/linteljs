# @linteljs/prefer-arrow-functions

Prefer arrow functions when the conversion keeps behaviour the same.

- Category: `functions`
- Applies to: JavaScript and TypeScript
- Fixable: yes (code), except the hoisted case
- In `recommended`: yes

Two things, both about one file reading the same way throughout. A `function` becomes an arrow
wherever an arrow means the same thing, and an arrow whose body is a bare expression gets an
explicit `return`.

The second half of the title is the important half. A conversion that would change what the program
does is not offered, and the list of those cases is long and specific. Read
[What it declines to convert](#what-it-declines-to-convert) before wondering why a particular
function was left alone.

## Examples of incorrect code for this rule

```ts
function greet(name: string) {
  return name;
}

const service = {
  send: function () {
    return 1;
  }
};

const total = () => 3;

notify();

function notify() {
  return 4;
}
```

## Examples of correct code for this rule

```ts
const greet = (name: string) => {
  return name;
};

const service = {
  send: () => {
    return 1;
  }
};

const total = () => { return 3; };

const notify = () => {
  return 4;
};

notify();
```

## Options

```jsonc
{
  "@linteljs/prefer-arrow-functions": ["error", { "forceHoisted": false }]
}
```

- `forceHoisted`: boolean, `false` by default. When `true`, a function used above its own
  declaration is converted anyway, under the ordinary message and with the ordinary fix. The output
  can throw `ReferenceError`, which is the whole reason it is off by default. Read
  [Hoisting](#hoisting) before turning it on.

## What it declines to convert

A `function` is left alone whenever an arrow would not mean the same thing. Every entry below is
about that conversion; none of them holds back the explicit-return half, which turns an arrow into
an arrow and so cannot move `this`, `super`, `arguments` or `new.target`. None of the following
report at all:

```ts
// `this` in an arrow is the enclosing scope's, not the object's
const counter = {
  total: 0,
  add: function () {
    this.total += 1;
  }
};

// an arrow has no `arguments` of its own. The word alone is not enough: `node.arguments` is a
// property and converts, and so does `node?.arguments`. Anything else spelling `arguments`
// declines, shorthand `{ arguments }` included, because a missed report costs a rewrite nobody
// asked for where a wrong one costs a working program
function collect() {
  return arguments.length;
}

// an arrow cannot be a generator
function* ids() {
  yield 1;
}

// an explicit `this` parameter
function render(this: HTMLElement) {
  return this.id;
}

// an assertion signature
function assertString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError('not a string');
  }
}

// a named function expression that calls itself. The name is scoped to the
// function, so an arrow assigned to a `const` of the same name is a different
// binding and the recursion would break
const walk = function step(depth: number): number {
  return depth === 0 ? 0 : step(depth - 1);
};
```

```ts
// only the `function` keyword parses in these positions, so an arrow here
// would not compile
const kind = typeof function () {};

const made = new function () {};

// an arrow with a block body cannot be invoked without parentheses of its own
const value = function () {
  return 1;
}();

// a class field holding a function keeps the function's own dynamic `this`,
// where an arrow would bind `this` to the instance
class Row {
  render = function () {
    return this;
  };
}

// something is done to the binding that only a `function` supports: called with
// `new`, assigned a `prototype`, or reassigned
function Widget() {}

const widget = new Widget();
```

Also left alone, for the same reason in each case:

- a getter or setter
- a declaration whose name is bound twice, which includes an overload implementation. In a function
  body or a script, `function x() {}` is var-scoped and may be declared again. Two `const x` in one
  scope is a syntax error, so neither declaration converts.
- `(function () {}())`, Crockford's spelling, where the parentheses wrap the call rather than the
  function. `(function () {})()` puts them around the function, so the arrow inherits them and that
  spelling does convert.
- a function repeating a parameter name, as `function pick(first, _, _) {}` does. A non-strict
  `function` with a simple parameter list is allowed to, and placeholder parameters are how it
  turns up in real code. An arrow never is, in any mode, so the converted file would not parse.
  Only a non-strict script reaches this: a module and a `.ts` file are both strict, where the input
  is already a syntax error.

A statement carrying a comment inside the range the fix would rewrite is reported without a fix,
since the rebuilt arrow has nowhere to put it.

## Notes

### Hoisting

A `function` declaration is initialised before any statement runs, so calling it earlier in the
file is legal. `const fn = () => {}` is not: the binding sits in its temporal dead zone until the
assignment executes, and the same call throws `ReferenceError`. That is the `notify()` example in
the incorrect list above.

Converting it would turn working code into a crash, so the rule reports it under a separate message
and offers no fix. Move the call below the declaration and the ordinary fix applies.

A reference from inside another function that only runs later is safe in practice, but nothing in a
lint rule can prove when that function is called, so a textual reference above the declaration is
enough to decline.

That defect is why this rule exists in its current shape. The version this was ported from
converted such a function and turned working code into a `ReferenceError`.

### TSX

In a `.tsx` file a single type parameter reads as a JSX tag, so the fix writes `<T,>` to
disambiguate:

```tsx
function identity<T>(value: T) {
  return value;
}
```

becomes:

```tsx
const identity = <T,>(value: T) => {
  return value;
};
```

Two or more parameters are already unambiguous and are left as they are.
