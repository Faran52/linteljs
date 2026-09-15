import { jsRuleTester } from '@mocks/ruleTesters';

import { preferTryCatch } from './index.ts';

jsRuleTester.run('prefer-try-catch', preferTryCatch, {
  valid: [
    // The call is an argument, not the object of the member access, so the walk must not climb out to find the await.
    'async function load() {\n  return await wrap(queue.catch(report));\n}',
    'async function load() {\n  return await [queue.catch(report)].length;\n}',

    // A member access on the result is not a further call, so the chain ends there, outside the awaited expression.
    'function schedule() {\n  const done = queue.catch(report).settled;\n\n  return done;\n}',

    // `async` is present and false on these nodes, which is not the same as the property being absent.
    'const load = function () {\n  return fetch(url).catch(handle);\n};',
    'const load = () => {\n  return fetch(url).catch(handle);\n};',

    // An async arrow's parameter default is not its body, so a handler there is not the value the caller awaits.
    'const load = async (fallback = queue.catch(report)) => {\n  return fallback;\n};',

    // Fire and forget: nothing awaits the result, so there is no await for a `try` to wrap.
    'queue.catch(report);',
    'function schedule() {\n  task().catch(report);\n}',
    'const cleanup = () => {\n  close().catch(report);\n};',

    `async function load() {
  try {
    return await fetch(url);
  } catch (error) {
    return handle(error);
  }
}`,

    'async function load() {\n  return await fetch(url);\n}',
    'async function load() {\n  return await fetch(url).then(parse);\n}',
    'async function load() {\n  return await fetch(url).finally(cleanup);\n}',

    'async function load() {\n  return await fetch(url).catch();\n}',

    // A private field is not an Identifier, so this calls a field named `catch`, not the promise method.
    'class Holder {\n  #catch = null;\n\n  async run() {\n    return await this.#catch(log);\n  }\n}',

    // Two arguments, but the method is not `then`, so there is no rejection handler to hand to a `catch` block.
    'const load = async () => {\n  return await items.reduce(step, seed);\n};',

    // Returned from a function that is not async, so there is no await to wrap.
    'function load() {\n  return fetch(url).catch(handle);\n}',
    'const load = () => fetch(url).catch(handle);',

    // Not a member call, and a computed member the rule cannot read.
    'async function load() {\n  return await runCatch(handle);\n}',
    "async function load() {\n  return await fetch(url)['catch'](handle);\n}",
    'const c = key;\nasync function load() {\n  return await fetch(url)[c](handle);\n}',

    'async function load() {\n  items.forEach(function (item) {\n    item.catch(handle);\n  });\n}',

    // A per-item handler in Promise.all stops one failure from rejecting the whole batch;
    // wrapping the await instead would abandon the other results.
    `async function load() {
  const [first, second] = await Promise.all([
    fetch(one).catch(handle),
    fetch(two)
  ]);
  return [first, second];
}`,
    'async function load() {\n  return await Promise.allSettled([fetch(one).catch(handle)]);\n}',
  ],
  invalid: [
    {
      // The handler is the object of a further member call, so the walk has to climb past it to find the await.
      code: 'async function load() {\n  return await fetch(url).catch(handle).then(parse).finally(done);\n}',
      errors: [{ messageId: 'preferTryCatchOverCatch' }],
    },
    {
      // Chain climbing must stop at a call that is an argument, not a callee.
      code: 'async function load() {\n  return await wrap(fetch(url)).catch(handle);\n}',
      errors: [{ messageId: 'preferTryCatchOverCatch' }],
    },
    {
      // Awaited through a member access on the result rather than the call.
      code: 'async function load() {\n  return (await fetch(url).catch(handle)).body;\n}',
      errors: [{ messageId: 'preferTryCatchOverCatch' }],
    },

    {
      code: 'async function load() {\n  const data = await fetch(url).catch(handle);\n  return data;\n}',
      errors: [{ messageId: 'preferTryCatchOverCatch' }],
    },
    {
      code: 'async function load() {\n  return await fetch(url).catch(handle);\n}',
      errors: [{ messageId: 'preferTryCatchOverCatch' }],
    },
    {
      // Returned from an async function, so the caller's await is the one a `try` would wrap.
      code: 'async function load() {\n  return fetch(url).catch(handle);\n}',
      errors: [{ messageId: 'preferTryCatchOverCatch' }],
    },
    {
      code: 'const load = async () => fetch(url).catch(handle);',
      errors: [{ messageId: 'preferTryCatchOverCatch' }],
    },
    {
      code: 'const load = async () => {\n  return fetch(url).catch(handle);\n};',
      errors: [{ messageId: 'preferTryCatchOverCatch' }],
    },
    {
      // An optional chain wraps the outermost call in a `ChainExpression`, so the await sits one node further out.
      code: 'async function load() {\n  return api?.fetch(url).catch(handle);\n}',
      errors: [{ messageId: 'preferTryCatchOverCatch' }],
    },
    {
      code: 'async function load() {\n  await api?.fetch(url).catch(handle);\n}',
      errors: [{ messageId: 'preferTryCatchOverCatch' }],
    },
    {
      code: 'async function load() {\n  return await fetch(url).then(parse, handle);\n}',
      errors: [{ messageId: 'preferTryCatchOverThenHandler' }],
    },
    {
      code: 'async function load() {\n  return fetch(url).then(parse, handle);\n}',
      errors: [{ messageId: 'preferTryCatchOverThenHandler' }],
    },
    {
      code: 'async function load() {\n  return await fetch(url).then(null, handle);\n}',
      errors: [{ messageId: 'preferTryCatchOverThenHandler' }],
    },
    {
      code: 'class Loader {\n  async load() {\n    return await fetch(url).catch(handle);\n  }\n}',
      errors: [{ messageId: 'preferTryCatchOverCatch' }],
    },
    {
      code: 'const loader = {\n  async load() {\n    return fetch(url).catch(handle);\n  }\n};',
      errors: [{ messageId: 'preferTryCatchOverCatch' }],
    },
    {
      // Every handler in an awaited chain reports, so a two-step recovery does not hide behind the outermost call.
      code: 'async function load() {\n  return await fetch(url).catch(first).catch(second);\n}',
      errors: [
        { messageId: 'preferTryCatchOverCatch' },
        { messageId: 'preferTryCatchOverCatch' },
      ],
    },
    {
      code: 'const data = await fetch(url).catch(handle);',
      errors: [{ messageId: 'preferTryCatchOverCatch' }],
    },
    {
      // An async arrow nested inside a sync function still qualifies on its own terms.
      code: 'function outer() {\n  return async () => fetch(url).catch(handle);\n}',
      errors: [{ messageId: 'preferTryCatchOverCatch' }],
    },
    {
      // The whole fluent chain is awaited, so a handler buried mid-chain is still one a try/catch could take over.
      code: 'async function load() {\n  return await fetch(url).catch(handle).then(parse);\n}',
      errors: [{ messageId: 'preferTryCatchOverCatch' }],
    },
    {
      code: 'async function load() {\n  return await fetch(url).then(parse).catch(handle);\n}',
      errors: [{ messageId: 'preferTryCatchOverCatch' }],
    },
  ],
});
