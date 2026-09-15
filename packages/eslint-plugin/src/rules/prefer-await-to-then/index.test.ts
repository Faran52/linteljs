import { jsRuleTester } from '@mocks/ruleTesters';

import { preferAwaitToThen } from './index.ts';

jsRuleTester.run('prefer-await-to-then', preferAwaitToThen, {
  valid: [
    'promise.then(parse);',
    'promise.catch(handle);',
    'promise.finally(cleanup);',
    'load().then(parse).catch(handle);',

    // Already awaited, which is what the rule wants; handling the rejection here is `prefer-try-catch`'s business.
    'async function load() {\n  return await promise.then(parse);\n}',
    'async function load() {\n  return await promise.catch(handle);\n}',
    'function* walk() {\n  yield promise.then(parse);\n}',

    // Returned from an async function, so the caller awaits it. Same handover.
    'async function load() {\n  return promise.catch(handle);\n}',
    'const load = async () => promise.then(parse, handle);',

    // An optional chain sits inside a `ChainExpression`, where the handover reads position from;
    // missing that hands this rule a line that belongs to `prefer-try-catch`.
    'async function load() {\n  return api?.fetch(url).catch(handle);\n}',
    'async function load() {\n  return api?.fetch(url).then(parse);\n}',

    // A constructor cannot be async, so there is no await to reach for.
    'class Service {\n  constructor() {\n    load().then(parse);\n  }\n}',

    'function run() {\n  list.map(parse);\n}',
    'function run() {\n  emitter.on(handle);\n}',
    "function run() {\n  promise['then'](parse);\n}",

    // A computed property is whatever the variable holds, so `promise[then]` is not a `.then` call.
    'const then = key;\nfunction load() {\n  return promise[then](parse);\n}',
    'function run() {\n  then(parse);\n}',

    // Inside an await, but not the awaited value, so the ancestor walk must see the `await` directly above the chain.
    'async function load() {\n  return await wrap(promise.then(parse));\n}',

    // The same for a yield, which is the other half of that ancestor test.
    'function* walk() {\n  yield wrap(promise.then(parse));\n}',

    // A private field is not an Identifier, so `this.#then()` is not a promise-method call.
    'class Holder {\n  #then = null;\n\n  run() {\n    return this.#then();\n  }\n}',
  ],
  invalid: [
    {
      // Nested inside an async function; the walk must stop at the nearest function, not the outermost.
      code: `async function outer() {
  function inner() {
    return promise.then(parse);
  }

  return inner();
}`,
      errors: [{ messageId: 'preferAwait' }],
    },

    {
      code: 'function load() {\n  return promise.then(parse);\n}',
      errors: [{ messageId: 'preferAwait' }],
    },
    {
      code: 'function load() {\n  return promise.catch(handle);\n}',
      errors: [{ messageId: 'preferAwait' }],
    },
    {
      code: 'function load() {\n  return promise.finally(cleanup);\n}',
      errors: [{ messageId: 'preferAwait' }],
    },
    {
      // Fire and forget inside an async function; nothing awaits it, so this rule owns it, not `prefer-try-catch`.
      code: 'async function load() {\n  queue.catch(report);\n  return 1;\n}',
      errors: [{ messageId: 'preferAwait' }],
    },
    {
      code: 'const load = () => {\n  return promise.then(parse);\n};',
      errors: [{ messageId: 'preferAwait' }],
    },
    {
      code: 'function load() {\n  return promise.then(parse).catch(handle);\n}',
      errors: [
        { messageId: 'preferAwait' },
        { messageId: 'preferAwait' },
      ],
    },
    {
      code: 'class Service {\n  load() {\n    return promise.then(parse);\n  }\n}',
      errors: [{ messageId: 'preferAwait' }],
    },
    {
      // Strict turns off every exemption, including the await handover, so it deliberately overlaps `prefer-try-catch`.
      code: 'async function load() {\n  return await promise.then(parse);\n}',
      options: [{ strict: true }],
      errors: [{ messageId: 'preferAwait' }],
    },
    {
      code: 'async function load() {\n  return await promise.catch(handle);\n}',
      options: [{ strict: true }],
      errors: [{ messageId: 'preferAwait' }],
    },
    {
      code: 'class Service {\n  constructor() {\n    load().then(parse);\n  }\n}',
      options: [{ strict: true }],
      errors: [{ messageId: 'preferAwait' }],
    },
    {
      code: 'function* walk() {\n  yield promise.then(parse);\n}',
      options: [{ strict: true }],
      errors: [{ messageId: 'preferAwait' }],
    },
  ],
});
