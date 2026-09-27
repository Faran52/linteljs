import { jsRuleTester } from '@mocks/ruleTesters';

import { preferTryCatch } from './preferTryCatch.ts';

jsRuleTester.run('prefer-try-catch', preferTryCatch, {
  valid: [
    'async function load() {\n  return await wrap(queue.catch(report));\n}',
    'async function load() {\n  return await [queue.catch(report)].length;\n}',

    'function schedule() {\n  const done = queue.catch(report).settled;\n\n  return done;\n}',

    'const load = function () {\n  return fetch(url).catch(handle);\n};',
    'const load = () => {\n  return fetch(url).catch(handle);\n};',

    'const load = async (fallback = queue.catch(report)) => {\n  return fallback;\n};',

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

    'class Holder {\n  #catch = null;\n\n  async run() {\n    return await this.#catch(log);\n  }\n}',

    'const load = async () => {\n  return await items.reduce(step, seed);\n};',

    'function load() {\n  return fetch(url).catch(handle);\n}',
    'const load = () => fetch(url).catch(handle);',

    'async function load() {\n  return await runCatch(handle);\n}',
    "async function load() {\n  return await fetch(url)['catch'](handle);\n}",
    'const c = key;\nasync function load() {\n  return await fetch(url)[c](handle);\n}',

    'async function load() {\n  items.forEach(function (item) {\n    item.catch(handle);\n  });\n}',

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
      code: 'async function load() {\n  return await fetch(url).catch(handle).then(parse).finally(done);\n}',
      errors: [{ messageId: 'preferTryCatchOverCatch' }],
    },
    {
      code: 'async function load() {\n  return await wrap(fetch(url)).catch(handle);\n}',
      errors: [{ messageId: 'preferTryCatchOverCatch' }],
    },
    {
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
      code: 'function outer() {\n  return async () => fetch(url).catch(handle);\n}',
      errors: [{ messageId: 'preferTryCatchOverCatch' }],
    },
    {
      code: 'async function load() {\n  return await fetch(url).catch(handle).then(parse);\n}',
      errors: [{ messageId: 'preferTryCatchOverCatch' }],
    },
    {
      code: 'async function load() {\n  return await fetch(url).then(parse).catch(handle);\n}',
      errors: [{ messageId: 'preferTryCatchOverCatch' }],
    },
  ],
});
