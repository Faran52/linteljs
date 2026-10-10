# @linteljs/prefer-async-await

Prefer `await` to `.then()`/`.catch()`/`.finally()`, and `try`/`catch` to a rejection handler.

- Applies to: JavaScript and TypeScript
- Fixable: no
- In `recommended`: yes

A `.then()` chain reads bottom up and puts every intermediate value inside a callback. `await` puts
it in a variable on the line that produced it. Once a value is awaited, a rejection handler passed as
a callback splits the error path away from the code it belongs to, and `try`/`catch` keeps them
together, in the order they happen.

The rule reports in two ways, one per message:

- `preferAwait`: a promise method called on a value nothing awaits.
- `preferTryCatch`: a rejection handler on a value that is awaited, or returned from an async function
  so the caller's `await` settles it. Only `.catch(handler)` and `.then(onFulfilled, onRejected)` hand a
  rejection to a callback.

A call gets one report at most: a rejection handler on an awaited chain reports `preferTryCatch` alone.

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

// incorrect: awaited, so a try could wrap it
async function read() {
  const data = await fetch(url).catch(handle);

  return data;
}

// incorrect: a rejection handler as the second argument to then
async function parseAll() {
  return await fetch(url).then(parse, handle);
}

// incorrect: the whole chain is considered, so a handler buried mid-chain counts
const midChain = async () => {
  return await fetch(url).catch(handle).then(parse);
};
```

With `strict: true`, every exemption below but the top level is dropped, and the same code reports
where it otherwise would not:

```ts
/* eslint @linteljs/prefer-async-await: ["error", { "strict": true }] */

// incorrect under strict: returned from an async function, so exempt at the default
const handover = async () => {
  return promise.then(parse);
};
```

## Examples of correct code for this rule

```ts
// correct: the error path sits next to the code it belongs to
async function load() {
  try {
    return await fetch(url);
  }
  catch (error) {
    return handle(error);
  }
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

// correct: then with no rejection handler, awaited, is a transform, not error handling
const transform = async () => {
  return await fetch(url).then(parse);
};

// correct: a per-item handler inside Promise.all, which stops one failure
// rejecting the whole batch. Wrapping the await instead would abandon the
// other results.
const batch = async (urls: string[]) => {
  return await Promise.all(urls.map((url) => {
    return fetch(url).catch(handle);
  }));
};
```

## Options

### `strict`

Whether the exemptions in the Notes are dropped, all but the top level. Defaults to `false`. When
`true`, an awaited or async-returned chain is reported with `preferAwait` too, unless the call passes
a rejection handler, which keeps its one `preferTryCatch` report.

```js
{
  rules: {
    '@linteljs/prefer-async-await': ['error', { strict: true }],
  },
}
```

## Why there is no autofix

Turning a `.then()` chain into an `await` means the enclosing function has to become `async`, which
changes its return type from `T` to `Promise<T>` and so changes every call site. That is a
refactor, not a fix.

Rewriting a callback into a `try` block restructures control flow, and the two forms are not
equivalent. In `then(a, b)` the handler `b` does not see anything `a` throws, and `a` does not run
at all when the promise rejects. Neither `then(a).catch(b)` nor `catch(b).then(a)` preserves both
of those.

## Notes

`preferAwait` is exempt at the default setting, and the first under `strict: true` too:

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

A rejection handler is reported only on an awaited or async-returned chain, at any setting. These do not
hand a rejection to a callback, so even awaited they pass: `.finally(cleanup)`, which runs on both
paths and handles neither, `.catch()` with no argument, and `.then(parse)` with no rejection handler.

A computed access is not a promise method. In `promise[then](parse)` the property is an identifier
named `then`, but it is a variable holding whatever it holds, so nothing is reported. The string
form, `promise['then'](parse)`, is computed too and is not reported either.

A type wrapper is seen through. `await (fetch(url).catch(handle) as Promise<Data>)` and
`await fetch(url).catch(handle)!` are reported like the bare chain.
