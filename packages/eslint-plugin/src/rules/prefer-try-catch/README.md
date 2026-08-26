# @linteljs/prefer-try-catch

Prefer `try`/`catch` around an awaited rejection path instead of a promise callback.

- Category: `promises`
- Applies to: JavaScript and TypeScript
- Fixable: no
- In `recommended`: yes

Once a value is awaited, a rejection handler passed as a callback splits the error path away from
the code it belongs to. `try`/`catch` keeps them together, in the order they happen.

Only a rejection that a `try`/`catch` could actually take over is reported, which means the value
is awaited, or returned from an async function so the caller's `await` settles it. Everything else
belongs to [`@linteljs/prefer-await-to-then`](../prefer-await-to-then).

## Examples of incorrect code for this rule

```ts
// incorrect: awaited, so a try could wrap it
async function load() {
  const data = await fetch(url).catch(handle);

  return data;
}

// incorrect: a rejection handler as the second argument to then
async function read() {
  return await fetch(url).then(parse, handle);
}

// incorrect: the whole chain is considered, so a handler buried mid-chain counts
const midChain = async () => {
  return await fetch(url).catch(handle).then(parse);
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

// correct: fire and forget. Nothing awaits it, so there is no await for a try
// to wrap. prefer-await-to-then has the say on this one.
const start = async () => {
  queue.catch(report);
};

// correct: a per-item handler inside Promise.all, which stops one failure
// rejecting the whole batch. Wrapping the await instead would abandon the
// other results.
const batch = async (urls: string[]) => {
  return await Promise.all(urls.map((url) => {
    return fetch(url).catch(handle);
  }));
};

// correct: then with no rejection handler is a transform, not error handling
const transform = async () => {
  return await fetch(url).then(parse);
};
```

## Options

None.

## Why there is no autofix

Rewriting a callback into a `try` block restructures control flow, and the two forms are not
equivalent. In `then(a, b)` the handler `b` does not see anything `a` throws, and `a` does not run
at all when the promise rejects. Neither `then(a).catch(b)` nor `catch(b).then(a)` preserves both
of those.

This is not a theoretical worry. The rule this one replaced did offer that fix: it rewrote
`then(a, b)` into `catch(b).then(a)`, a different program, and on `then(a, b, extra)` it deleted
the middle argument outright. This rule reports the smell and leaves the rewrite to a human.

## Notes

A computed access is not a promise method. In `promise[then](a, b)` the property is an identifier
named `then`, but it is a variable holding whatever it holds, so nothing is reported.
