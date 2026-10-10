import { jsRuleTester, tsRuleTester } from '@mocks/ruleTesters';

import { preferAsyncAwait } from './preferAsyncAwaitRule.ts';

jsRuleTester.run('prefer-async-await (promise chains)', preferAsyncAwait, {
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
    'function* walk() {\n  yield promise.then(parse);\n}',

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
      // One report per call: the rejection handler, not the chain as well.
      code: 'async function load() {\n  return await promise.catch(handle);\n}',
      options: [{ strict: true }],
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'async function load() {\n  return await promise.then(parse, handle);\n}',
      options: [{ strict: true }],
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'async function load() {\n  return await promise.catch();\n}',
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

tsRuleTester.run('prefer-async-await (promise chains, typescript)', preferAsyncAwait, {
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

jsRuleTester.run('prefer-async-await (rejection handlers)', preferAsyncAwait, {
  valid: [
    'async function load() {\n  return await wrap(queue.catch(report));\n}',
    'async function load() {\n  return await [queue.catch(report)].length;\n}',

    'queue.catch(report);',

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

    'class Holder {\n  #catch = null;\n\n  async run() {\n    return await this.#catch(log);\n  }\n}',

    'const load = async () => {\n  return await items.reduce(step, seed);\n};',

    'async function load() {\n  return await runCatch(handle);\n}',
    "async function load() {\n  return await fetch(url)['catch'](handle);\n}",
    'const c = key;\nasync function load() {\n  return await fetch(url)[c](handle);\n}',

    `async function load() {
  const [first, second] = await Promise.all([
    fetch(one).catch(handle),
    fetch(two)
  ]);
  return [first, second];
}`,
    'async function load() {\n  return await Promise.allSettled([fetch(one).catch(handle)]);\n}',

    'async function* stream() {\n  yield queue.catch(report);\n}',
    'async function load() {\n  return await (0, fetch(url).catch(handle));\n}',
    // One spread argument may hold only the fulfilment handler, so it is left alone.
    'async function load() {\n  return await fetch(url).then(...handlers);\n}',
  ],
  invalid: [
    // A rejection handler on a value nothing awaits is a promise chain, not a try/catch candidate.
    {
      code: 'function schedule() {\n  const done = queue.catch(report).settled;\n\n  return done;\n}',
      errors: [{ messageId: 'preferAwait' }],
    },
    {
      code: 'const load = function () {\n  return fetch(url).catch(handle);\n};',
      errors: [{ messageId: 'preferAwait' }],
    },
    {
      code: 'const load = () => {\n  return fetch(url).catch(handle);\n};',
      errors: [{ messageId: 'preferAwait' }],
    },
    {
      code: 'const load = async (fallback = queue.catch(report)) => {\n  return fallback;\n};',
      errors: [{ messageId: 'preferAwait' }],
    },
    {
      code: 'function schedule() {\n  task().catch(report);\n}',
      errors: [{ messageId: 'preferAwait' }],
    },
    {
      code: 'const cleanup = () => {\n  close().catch(report);\n};',
      errors: [{ messageId: 'preferAwait' }],
    },
    {
      code: 'const load = () => fetch(url).catch(handle);',
      errors: [{ messageId: 'preferAwait' }],
    },
    {
      code: 'async function load() {\n  items.forEach(function (item) {\n    item.catch(handle);\n  });\n}',
      errors: [{ messageId: 'preferAwait' }],
    },
    {
      code: 'const load = async () => items.map((item) => item.catch(handle));',
      errors: [{ messageId: 'preferAwait' }],
    },
    {
      code: 'async function load() {\n  return await fetch(url).catch(handle).then(parse).finally(done);\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'async function load() {\n  return await wrap(fetch(url)).catch(handle);\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'async function load() {\n  return (await fetch(url).catch(handle)).body;\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },

    {
      code: 'async function load() {\n  const data = await fetch(url).catch(handle);\n  return data;\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'async function load() {\n  return await fetch(url).catch(handle);\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'async function load() {\n  return fetch(url).catch(handle);\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'const load = async () => fetch(url).catch(handle);',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'const load = async () => {\n  return fetch(url).catch(handle);\n};',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'async function load() {\n  return api?.fetch(url).catch(handle);\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'async function load() {\n  await api?.fetch(url).catch(handle);\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'async function load() {\n  return await fetch(url).then(parse, handle);\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'async function load() {\n  return fetch(url).then(parse, handle);\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'async function load() {\n  return await fetch(url).then(null, handle);\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'class Loader {\n  async load() {\n    return await fetch(url).catch(handle);\n  }\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'const loader = {\n  async load() {\n    return fetch(url).catch(handle);\n  }\n};',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'async function load() {\n  return await fetch(url).catch(first).catch(second);\n}',
      errors: [
        { messageId: 'preferTryCatch' },
        { messageId: 'preferTryCatch' },
      ],
    },
    {
      code: 'const data = await fetch(url).catch(handle);',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'function outer() {\n  return async () => fetch(url).catch(handle);\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'async function load() {\n  return await fetch(url).catch(handle).then(parse);\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'async function load() {\n  return await fetch(url).then(parse).catch(handle);\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'async function load() {\n  return await fetch(url).catch(...handlers);\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'async function load() {\n  return await fetch(url).then(parse, ...rest);\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'async function load() {\n  return await fetch(url).then(parse, handle, extra);\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'async function load() {\n  return await fetch(url)?.catch(handle);\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'async function load() {\n  return await (api?.fetch(url)).catch(handle);\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: [
        'async function load() {',
        '  return await fetch(url) // fetch first',
        '    /* then recover */ .catch(/* log */ handle);',
        '}',
      ].join('\n'),
      errors: [
        {
          messageId: 'preferTryCatch',
          line: 3,
          column: 25,
        },
      ],
    },
  ],
});

tsRuleTester.run('prefer-async-await (rejection handlers, typescript)', preferAsyncAwait, {
  valid: [],
  invalid: [
    {
      code: 'function load() {\n  return fetch(url).catch(handle) as Promise<Data>;\n}',
      errors: [{ messageId: 'preferAwait' }],
    },
    {
      code: 'async function load() {\n  const pending = fetch(url).catch(handle) as Promise<Data>;\n\n'
        + '  return pending;\n}',
      errors: [{ messageId: 'preferAwait' }],
    },
    {
      code: 'async function load() {\n  return await (fetch(url).catch(handle) as Promise<Data>);\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'async function load() {\n  return await fetch(url).catch(handle)!;\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'async function load() {\n  return await (fetch(url).then(parse, handle) satisfies Promise<Data>);\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'async function load() {\n  return await <Promise<Data>>fetch(url).catch(handle);\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'async function load() {\n  return fetch(url).catch(handle) as Promise<Data>;\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'const load = async () => fetch(url).catch(handle) as Promise<Data>;',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'async function load() {\n  return await (fetch(url) as Promise<Response>).catch(handle);\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
    {
      code: 'async function load() {\n  return await api?.fetch(url).catch(handle)!;\n}',
      errors: [{ messageId: 'preferTryCatch' }],
    },
  ],
});
