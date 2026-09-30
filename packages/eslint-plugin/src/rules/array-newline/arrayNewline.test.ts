import { jsRuleTester, tsRuleTester } from '@mocks/ruleTesters';

import { arrayNewline } from './arrayNewline.ts';

const errors = [{ messageId: 'elementsOnNewline' }];

jsRuleTester.run('array-newline', arrayNewline, {
  valid: [
    'const list = [];',
    'const list = [alpha];',
    'const list = [\n  alpha\n];',
    'const list = [{\n  alpha: 1\n}];',
    'const list = [,];',
    'const list = [alpha,];',
    'const list = [\n  alpha,\n  bravo\n];',
    'const list = [\n  alpha,\n  bravo,\n];',
    'const list = [\n  alpha, // trails alpha\n  bravo\n];',
    'const list = [\n  // heads alpha\n  alpha,\n\n  bravo\n];',
    'const list = [\n  ,\n  alpha\n];',
    'const list = [\n  (alpha),\n  bravo\n];',
    'const [alpha] = list;',
    'const [\n  alpha,\n  bravo\n] = list;',
  ],
  invalid: [
    {
      code: 'const list = [alpha, bravo];',
      output: 'const list = [\n  alpha,\n  bravo\n];',
      errors,
    },
    {
      code: 'const list = [alpha, bravo, charlie];',
      output: 'const list = [\n  alpha,\n  bravo,\n  charlie\n];',
      errors,
    },
    {
      // The trailing comma stays where it is; `comma-dangle` owns it.
      code: 'const list = [alpha, bravo,];',
      output: 'const list = [\n  alpha,\n  bravo,\n];',
      errors,
    },
    {
      code: 'const list = [\n  alpha, bravo\n];',
      output: 'const list = [\n  alpha,\n  bravo\n];',
      errors,
    },
    {
      code: 'const list = [alpha,\n  bravo];',
      output: 'const list = [\n  alpha,\n  bravo\n];',
      errors,
    },
    {
      code: 'const list = [\n  alpha,\n  bravo];',
      output: 'const list = [\n  alpha,\n  bravo\n];',
      errors,
    },
    {
      code: 'const list = [...head, tail];',
      output: 'const list = [\n  ...head,\n  tail\n];',
      errors,
    },
    {
      code: 'const list = [, , alpha];',
      output: 'const list = [\n  ,\n  ,\n  alpha\n];',
      errors,
    },
    {
      code: 'const list = [alpha, , bravo];',
      output: 'const list = [\n  alpha,\n  ,\n  bravo\n];',
      errors,
    },
    {
      // A hole last needs its comma, which stays on its line.
      code: 'const list = [alpha, ,];',
      output: 'const list = [\n  alpha,\n  ,\n];',
      errors,
    },
    {
      code: 'const list = [(alpha), (bravo)];',
      output: 'const list = [\n  (alpha),\n  (bravo)\n];',
      errors,
    },
    {
      code: 'const list = [/* heads */ alpha, bravo /* trails */];',
      output: 'const list = [\n  /* heads */ alpha,\n  bravo /* trails */\n];',
      errors,
    },
    {
      // A note after the comma belongs to the element before it.
      code: 'const list = [alpha, /* about alpha */ bravo];',
      output: 'const list = [\n  alpha, /* about alpha */\n  bravo\n];',
      errors,
    },
    {
      code: 'const list = [alpha, // about alpha\n  bravo];',
      output: 'const list = [\n  alpha, // about alpha\n  bravo\n];',
      errors,
    },
    {
      // A note on the next line heads the element under it.
      code: 'const list = [alpha,\n  /* heads bravo */ bravo];',
      output: 'const list = [\n  alpha,\n  /* heads bravo */ bravo\n];',
      errors,
    },
    {
      code: 'const list = [alpha, /* one */ /* two */ bravo];',
      output: 'const list = [\n  alpha, /* one */ /* two */\n  bravo\n];',
      errors,
    },
    {
      // The outer array goes first; the inner ones are left for the next pass.
      code: 'const grid = [[alpha, bravo], [charlie]];',
      output: 'const grid = [\n  [alpha, bravo],\n  [charlie]\n];',
      errors: [...errors, ...errors],
    },
    {
      code: 'if (ready) {\n    run([alpha, bravo]);\n}',
      output: 'if (ready) {\n    run([\n        alpha,\n        bravo\n    ]);\n}',
      errors,
    },
    {
      code: 'const list = [{\n  alpha: 1\n}, bravo];',
      output: 'const list = [\n  {\n  alpha: 1\n},\n  bravo\n];',
      errors,
    },
    {
      code: 'const [alpha, bravo] = list;',
      output: 'const [\n  alpha,\n  bravo\n] = list;',
      errors,
    },
    {
      code: 'const [, alpha = 1, ...rest] = list;',
      output: 'const [\n  ,\n  alpha = 1,\n  ...rest\n] = list;',
      errors,
    },
    {
      code: 'const [alpha,\n  bravo, charlie] = list;',
      output: 'const [\n  alpha,\n  bravo,\n  charlie\n] = list;',
      errors,
    },
    {
      code: 'for (const [key, value] of pairs) {\n  use(key, value);\n}',
      output: 'for (const [\n  key,\n  value\n] of pairs) {\n  use(key, value);\n}',
      errors,
    },
    {
      code: 'const list = [alpha, bravo];\r\n',
      output: 'const list = [\r\n  alpha,\r\n  bravo\r\n];\r\n',
      errors,
    },
  ],
});

tsRuleTester.run('array-newline', arrayNewline, {
  valid: [
    'const list = [\n  alpha,\n  bravo\n] as const;',
    'type Pair = [string, number];',
  ],
  invalid: [
    {
      // The annotation and the `?` belong to the pattern, after its bracket.
      code: 'declare function load([alpha, bravo]?: [string, number]): void;',
      output: 'declare function load([\n  alpha,\n  bravo\n]?: [string, number]): void;',
      errors,
    },
    {
      code: 'const list = [alpha as string, bravo!];',
      output: 'const list = [\n  alpha as string,\n  bravo!\n];',
      errors,
    },
  ],
});
