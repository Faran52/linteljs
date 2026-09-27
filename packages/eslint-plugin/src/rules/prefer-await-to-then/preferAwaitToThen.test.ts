import { jsRuleTester } from '@mocks/ruleTesters';

import { preferAwaitToThen } from './preferAwaitToThen.ts';

jsRuleTester.run('prefer-await-to-then', preferAwaitToThen, {
  valid: [
    'promise.then(parse);',
    'promise.catch(handle);',
    'promise.finally(cleanup);',
    'load().then(parse).catch(handle);',

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
