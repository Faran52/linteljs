import { jsRuleTester, tsRuleTester } from '@mocks/ruleTesters';

import { preferAwaitToThen } from './preferAwaitToThen.ts';

jsRuleTester.run('prefer-await-to-then', preferAwaitToThen, {
  valid: [
    'promise.then(parse);',
    'promise.catch(handle);',
    'promise.finally(cleanup);',
    'load().then(parse).catch(handle);',
    'if (ready) {\n  promise.then(parse);\n}',
    'for (const item of items) {\n  item.load().catch(handle);\n}',
    {
      // Strict drops the hand-offs, not the top level: there is no function to make async.
      code: 'if (ready) {\n  promise.then(parse);\n}',
      options: [{ strict: true }],
    },
    'function run() {\n  return promise.then;\n}',
    'function run() {\n  return promise.then.call(promise, parse);\n}',
    'const load = async () => {\n  if (ready) {\n    return promise.then(parse);\n  }\n\n  return null;\n};',

    'async function load() {\n  return await promise.then(parse);\n}',
    'async function load() {\n  return await promise.catch(handle);\n}',
    'function* walk() {\n  yield promise.then(parse);\n}',

    'async function load() {\n  return promise.catch(handle);\n}',
    'const load = async () => promise.then(parse, handle);',

    'async function load() {\n  return api?.fetch(url).catch(handle);\n}',
    'async function load() {\n  return api?.fetch(url).then(parse);\n}',

    {
      code: 'return promise.then(parse);',
      languageOptions: { sourceType: 'commonjs' },
    },

    'class Service {\n  constructor() {\n    load().then(parse);\n  }\n}',

    'function run() {\n  list.map(parse);\n}',
    'function run() {\n  emitter.on(handle);\n}',
    "function run() {\n  promise['then'](parse);\n}",

    'const then = key;\nfunction load() {\n  return promise[then](parse);\n}',
    'function run() {\n  then(parse);\n}',

    'async function load() {\n  return await wrap(promise.then(parse));\n}',

    'async function load(items) {\n  return await Promise.all(items.map((item) => item.load().then(parse)));\n}',

    'function* walk() {\n  yield wrap(promise.then(parse));\n}',

    'class Holder {\n  #then = null;\n\n  run() {\n    return this.#then();\n  }\n}',
  ],
  invalid: [
    {
      code: 'function run() {\n  if (ready) {\n    promise.then(parse);\n  }\n}',
      errors: [{ messageId: 'preferAwait' }],
    },
    {
      // A static block runs once, but in its own scope, not the file's.
      code: 'class Registry {\n  static {\n    promise.then(parse);\n  }\n}',
      errors: [{ messageId: 'preferAwait' }],
    },
    {
      code: 'class Service {\n  load = () => promise.finally(cleanup);\n}',
      errors: [{ messageId: 'preferAwait' }],
    },
    {
      code: 'const load = () => promise.then(parse);',
      errors: [{ messageId: 'preferAwait' }],
    },
    {
      code: 'function load() {\n  return promise?.then(parse);\n}',
      errors: [{
        messageId: 'preferAwait',
        line: 2,
        column: 19,
      }],
    },
    {
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
    {
      code: 'async function load(items) {\n'
        + '  return await Promise.all(items.map((item) => item.load().then(parse)));\n}',
      options: [{ strict: true }],
      errors: [{ messageId: 'preferAwait' }],
    },
  ],
});

tsRuleTester.run('prefer-await-to-then (typescript)', preferAwaitToThen, {
  valid: [
    '(promise as Promise<number>).then(parse);',
    'async function load(): Promise<number> {\n  return promise.then(parse) as Promise<number>;\n}',
    'async function load(): Promise<number> {\n  return promise.then(parse)!;\n}',
  ],
  invalid: [
    {
      code: 'function load(): Promise<number> {\n  return (promise as Promise<number>).then(parse);\n}',
      errors: [{ messageId: 'preferAwait' }],
    },
    {
      code: 'function load(): Promise<number> {\n  return promise!.catch(handle);\n}',
      errors: [{ messageId: 'preferAwait' }],
    },
  ],
});
