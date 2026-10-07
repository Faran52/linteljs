import { jsRuleTester, tsRuleTester } from '@mocks/ruleTesters';

import { arrayNewline } from './arrayNewlineRule.ts';

const errors = [{ messageId: 'elementsOnNewline' }];

jsRuleTester.run('array-newline', arrayNewline, {
  valid: [
    'const list = [];',
    'const list = [alpha];',
    'const list = [\n  alpha\n];',
    // One element is never touched, even with a bracket hanging.
    'const list = [\n  alpha];',
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
    'const list = [alpha, bravo];',
    'const list = [alpha, bravo,];',
    'const list = [{\n  alpha: 1\n}, bravo];',
    'const [alpha, bravo] = list;',
    'const [value, setValue] = useState(0);',
    'for (const [key, value] of Object.entries(record)) {\n  use(key, value);\n}',
    'const [\n  alpha,\n  bravo\n] = list;',
  ],
  invalid: [
    {
      code: 'const list = [alpha, bravo, charlie];',
      output: 'const list = [\n  alpha,\n  bravo,\n  charlie\n];',
      errors,
    },
    {
      // The trailing comma stays where it is; `comma-dangle` owns it.
      code: 'const list = [alpha, bravo, charlie,];',
      output: 'const list = [\n  alpha,\n  bravo,\n  charlie,\n];',
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
      code: 'const list = [...head, middle, tail];',
      output: 'const list = [\n  ...head,\n  middle,\n  tail\n];',
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
      code: 'const list = [alpha, bravo, ,];',
      output: 'const list = [\n  alpha,\n  bravo,\n  ,\n];',
      errors,
    },
    {
      code: 'const list = [(alpha), (bravo), charlie];',
      output: 'const list = [\n  (alpha),\n  (bravo),\n  charlie\n];',
      errors,
    },
    {
      code: 'const list = [/* heads */ alpha, bravo, charlie /* trails */];',
      output: 'const list = [\n  /* heads */ alpha,\n  bravo,\n  charlie /* trails */\n];',
      errors,
    },
    {
      // A note after the comma belongs to the element before it.
      code: 'const list = [alpha, /* about alpha */ bravo, charlie];',
      output: 'const list = [\n  alpha, /* about alpha */\n  bravo,\n  charlie\n];',
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
      code: 'const list = [alpha, /* one */ /* two */ bravo, charlie];',
      output: 'const list = [\n  alpha, /* one */ /* two */\n  bravo,\n  charlie\n];',
      errors,
    },
    {
      // The outer array goes first; the inner ones are left for the next pass.
      code: 'const grid = [[alpha, bravo, charlie], [delta], [echo]];',
      output: 'const grid = [\n  [alpha, bravo, charlie],\n  [delta],\n  [echo]\n];',
      errors: [...errors, ...errors],
    },
    {
      code: 'if (ready) {\n    run([alpha, bravo, charlie]);\n}',
      output: 'if (ready) {\n    run([\n        alpha,\n        bravo,\n        charlie\n    ]);\n}',
      errors,
    },
    {
      code: 'const list = [{\n  alpha: 1\n}, bravo, charlie];',
      output: 'const list = [\n  {\n  alpha: 1\n},\n  bravo,\n  charlie\n];',
      errors,
    },
    {
      code: 'const [alpha,\n  bravo] = list;',
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
      // A default or a nested pattern gets no exemption: three or more split.
      code: 'const [alpha = 1, [bravo], charlie] = list;',
      output: 'const [\n  alpha = 1,\n  [bravo],\n  charlie\n] = list;',
      errors,
    },
    {
      code: 'const list = [alpha, bravo, charlie];\r\n',
      output: 'const list = [\r\n  alpha,\r\n  bravo,\r\n  charlie\r\n];\r\n',
      errors,
    },
    {
      // One CRLF line elsewhere does not make the file CRLF.
      code: 'const first = 1;\r\nconst second = 2;\nconst list = [alpha, bravo, charlie];\n',
      output: 'const first = 1;\r\nconst second = 2;\nconst list = [\n  alpha,\n  bravo,\n  charlie\n];\n',
      errors,
    },
    {
      code: 'if (ready) {\n\trun([alpha, bravo, charlie]);\n}',
      output: 'if (ready) {\n\trun([\n\t\talpha,\n\t\tbravo,\n\t\tcharlie\n\t]);\n}',
      errors,
    },
    {
      // A template spanning lines moves whole; its inside is text, not layout.
      code: 'const list = [`alpha\n  bravo`, charlie, delta];',
      output: 'const list = [\n  `alpha\n  bravo`,\n  charlie,\n  delta\n];',
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
      code: 'declare function load([alpha, bravo, charlie]?: [string, number, boolean]): void;',
      output: 'declare function load([\n  alpha,\n  bravo,\n  charlie\n]?: [string, number, boolean]): void;',
      errors,
    },
    {
      code: 'const list = [alpha as string, bravo!, charlie];',
      output: 'const list = [\n  alpha as string,\n  bravo!,\n  charlie\n];',
      errors,
    },
    {
      code: 'const view = [<Alpha />, <Bravo />, <Charlie />];',
      output: 'const view = [\n  <Alpha />,\n  <Bravo />,\n  <Charlie />\n];',
      errors,
      filename: 'view.tsx',
    },
  ],
});
