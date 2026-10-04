# @linteljs/prefer-await-to-then

Prefer `await` to `.then()`, `.catch()`, and `.finally()` when reading Promise values.

- Applies to: JavaScript and TypeScript
- Fixable: no
- In `recommended`: yes

A `.then()` chain reads bottom up and puts every intermediate value inside a callback. `await` puts
it in a variable on the line that produced it.

This rule is about not awaiting at all. Once a value is awaited, it hands over to
[`@linteljs/prefer-try-catch`](../prefer-try-catch), which is the rule with something to say about the
error path.

## Examples of incorrect code for this rule

```ts
// incorrect: a chain read in a function that could have been async
function load() {
  return promise.then(parse);
}

// incorrect: fire and forget, so nothing awaits the failure
async function start() {
  queue.catch(report);

  return 1;
}
```

With `strict: true`, every exemption below but the top level is dropped, and the same code reports
where it otherwise would not:

```ts
/* eslint @linteljs/prefer-await-to-then: ["error", { "strict": true }] */

// incorrect under strict: returned from an async function, so at the default
// setting this belongs to prefer-try-catch rather than to this rule
const handover = async () => {
  return promise.catch(handle);
};
```

## Examples of correct code for this rule

```ts
// correct: awaited
async function load() {
  return await promise;
}

// correct: top level of a module, where a call has to start somewhere
promise.then(parse);

// correct: a block at the top level is still outside every function
if (ready) {
  promise.then(parse);
}

// correct: a constructor cannot be async
class Loader {
  constructor() {
    queue.catch(report);
  }
}

// correct: already inside an await, which is the shape being asked for
const inner = async () => {
  return await promise.then(parse);
};

// correct: anywhere under that await counts, callback included, so this chain is exempt too
const all = async (items) => {
  return await Promise.all(items.map((item) => item.load().then(parse)));
};

// correct: returned from an async function, so the caller's await settles it.
// prefer-try-catch takes this one.
const handover = async () => {
  return promise.catch(handle);
};
```

## Options

### `strict`

Whether the exemptions in the Notes are dropped, all but the top level. Defaults to `false`. When
`true`, the handover to `prefer-try-catch` goes too, so the two rules deliberately overlap.

```js
{
  rules: {
    '@linteljs/prefer-await-to-then': ['error', { strict: true }],
  },
}
```

## Why there is no autofix

Turning a `.then()` chain into an `await` means the enclosing function has to become `async`, which
changes its return type from `T` to `Promise<T>` and so changes every call site. That is a
refactor, not a fix.

## Notes

Exempt at the default setting, and the first under `strict: true` too:

- top level of a module, where a call has to start somewhere, blocks included; a class static block
  is a scope of its own and reports
- anywhere under a `yield` or an `await`, which is already the shape being asked for
- inside a constructor, which cannot be async
- a value returned from an async function, so the caller's `await` settles it; an async arrow's
  expression body, `async () => promise.then(parse)`, counts as returned

The second is the whole subtree, not the awaited value alone. In
`await Promise.all(items.map((item) => item.load().then(parse)))` the chain is two callbacks down
from the `await` and is still exempt, because the expression it belongs to is awaited and the
function around it is already async. `strict: true` reports it.

An `await` and an async return are where `prefer-try-catch` picks up. With the default options the two rules never
report the same line. Under `strict: true` they do, which is the point of the option.

A computed access is not a promise method. In `promise[then](parse)` the property is an identifier
named `then`, but it is a variable holding whatever it holds, so nothing is reported. The string
form, `promise['then'](parse)`, is computed too and is not reported either.
