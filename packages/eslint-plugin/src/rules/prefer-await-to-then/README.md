# @linteljs/prefer-await-to-then

Prefer `await` to `.then()`, `.catch()`, and `.finally()` when reading Promise values.

- Category: `promises`
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

With `strict: true`, the exemptions below are dropped and the same code reports where it otherwise
would not:

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

// correct: returned from an async function, so the caller's await settles it.
// prefer-try-catch takes this one.
const handover = async () => {
  return promise.catch(handle);
};
```

## Options

```jsonc
{
  "@linteljs/prefer-await-to-then": ["error", { "strict": false }]
}
```

- `strict`: boolean, `false` by default. When `true`, every exemption listed below is dropped,
  including the handover to `prefer-try-catch`, so the two rules deliberately overlap.

## Why there is no autofix

Turning a `.then()` chain into an `await` means the enclosing function has to become `async`, which
changes its return type from `T` to `Promise<T>` and so changes every call site. That is a
refactor, not a fix.

## Notes

Exempt at the default setting:

- top level of a module, where a call has to start somewhere
- inside a `yield` or `await`, which is already the shape being asked for
- inside a constructor, which cannot be async
- a value returned from an async function, so the caller's `await` settles it

The last two are where `prefer-try-catch` picks up. With the default options the two rules never
report the same line. Under `strict: true` they do, which is the point of the option.

A computed access is not a promise method. In `promise[then](parse)` the property is an identifier
named `then`, but it is a variable holding whatever it holds, so nothing is reported.
