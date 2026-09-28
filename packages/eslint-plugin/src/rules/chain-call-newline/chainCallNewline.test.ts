import {
  jsRuleTester,
  tsRuleTester,
  tsxRuleTester,
} from '@mocks/ruleTesters';

import { chainCallNewline } from './chainCallNewline.ts';

const error = { messageId: 'callOnNewline' };

const locals = 'let items, rows, list, client, values, source;\n';

jsRuleTester.run('chain-call-newline', chainCallNewline, {
  valid: [
    'expect(value).toBe(other);',
    'items.map(fn);',
    'Object.keys(record);',
    'Object.keys(record).map(fn);',
    'a.b.c();',
    'items.map((item) => item.name);',
    'items.map(fn).length;',
    'new Store().load();',
    'load().then(done);',
    'rows[0]().run();',
    'handlers[name](event);',
    'let handlers;\nhandlers[first](a)[second](b);',
    'items\n  .map(fn)\n  .filter(keep);',
    'items // first\n  .map(fn)\n  .filter(keep);',
    'items\n  .map((item) => {\n    return item;\n  });',
    'Object.keys(record)\n  .map((key) => {\n    return key;\n  });',
    "it.each(rows)('runs %s', (row) => {\n  run(row);\n});",
    "describe.each(rows)('%s', () => {\n  run();\n});",
    'vi.fn().mockReturnValue(1);',
    "import * as ns from 'mod';\nns.make(value).run(other);",
    "import codec from 'mod';\ncodec.make(value).run(other);",
    "import { helper } from 'mod';\nhelper.make(value).run(other);",
    'run(items.map(fn), rows.filter(keep));',
    'lookup[items.map(fn)];',
  ],
  invalid: [
    {
      code: `${locals}items.map(fn).filter(keep);`,
      output: `${locals}items\n  .map(fn)\n  .filter(keep);`,
      errors: [
        {
          ...error,
          line: 2,
          column: 6,
        },
      ],
    },
    {
      code: `${locals}const out = items.map((item) => {\n  return item;\n});`,
      output: `${locals}const out = items\n  .map((item) => {\n    return item;\n  });`,
      errors: [error],
    },
    {
      code: `${locals}items.map((a) => {\n  return a;\n}).filter((b) => {\n  return b;\n});`,
      output: `${locals}items\n  .map((a) => {\n    return a;\n  })\n  .filter((b) => {\n    return b;\n  });`,
      options: [{ maxLineLength: 18 }],
      errors: [error],
    },
    {
      code: `${locals}items\n  .map(fn).filter((b) => {\n    return b;\n  });`,
      output: `${locals}items\n  .map(fn)\n  .filter((b) => {\n    return b;\n  });`,
      errors: [error],
    },
    {
      code: `${locals}items.map((a) => {\n  use(a);\n\n  return \`x\ny\`;\n}).join();`,
      output: `${locals}items\n  .map((a) => {\n    use(a);\n\n    return \`x\ny\`;\n  })\n  .join();`,
      errors: [error],
    },
    {
      code: `${locals}items.map((a) => {\n  /* one */\n  return a;\n});`,
      output: `${locals}items\n  .map((a) => {\n    /* one */\n    return a;\n  });`,
      errors: [error],
    },
    {
      code: `${locals}items.map((a) => {\n  /* one\n     two */\n  return a;\n});`,
      output: null,
      errors: [error],
    },
    {
      code: 'make(\n  1,\n).map((x) => {\n  return x;\n});',
      output: 'make(\n  1,\n)\n  .map((x) => {\n    return x;\n  });',
      errors: [error],
    },
    {
      code: `${locals}items.forEach(function (item) {\n  use(item);\n});`,
      output: `${locals}items\n  .forEach(function (item) {\n    use(item);\n  });`,
      errors: [error],
    },
    {
      code: `${locals}function run() {\n  return items.map(fn).filter(keep);\n}`,
      output: `${locals}function run() {\n  return items\n    .map(fn)\n    .filter(keep);\n}`,
      errors: [error],
    },
    {
      code: `${locals}items\n  .map(fn).filter(keep);`,
      output: `${locals}items\n  .map(fn)\n  .filter(keep);`,
      errors: [
        {
          ...error,
          line: 3,
          column: 11,
        },
      ],
    },
    {
      code: 'Object.keys(record).map(fn).filter(keep);',
      output: 'Object.keys(record)\n  .map(fn)\n  .filter(keep);',
      errors: [error],
    },
    {
      code: 'vi.spyOn(console, "error").mockImplementation(() => {\n  return 1;\n});',
      output: 'vi.spyOn(console, "error")\n  .mockImplementation(() => {\n    return 1;\n  });',
      errors: [error],
    },
    {
      code: 'load().then(done).catch(fail);',
      output: 'load()\n  .then(done)\n  .catch(fail);',
      errors: [error],
    },
    {
      code: 'recordFor().starterFiles.filter(keep).map(fn);',
      output: 'recordFor().starterFiles\n  .filter(keep)\n  .map(fn);',
      errors: [error],
    },
    {
      code: 'const local = make();\nlocal.build(value).run(other);',
      output: 'const local = make();\nlocal\n  .build(value)\n  .run(other);',
      errors: [error],
    },
    {
      code: "import { ROUTES } from 'routes';\nROUTES.map(fn).filter(keep);",
      output: "import { ROUTES } from 'routes';\nROUTES\n  .map(fn)\n  .filter(keep);",
      errors: [error],
    },
    {
      code: 'this.load().run();',
      output: 'this\n  .load()\n  .run();',
      errors: [error],
    },
    {
      code: `${locals}rows.find(fn).name.trim();`,
      output: `${locals}rows\n  .find(fn)\n  .name.trim();`,
      errors: [error],
    },
    {
      code: `${locals}list?.map(fn).filter(keep);`,
      output: `${locals}list\n  ?.map(fn)\n  .filter(keep);`,
      errors: [error],
    },
    {
      code: `${locals}rows.map(fn)[0].filter(keep).join();`,
      output: `${locals}rows\n  .map(fn)[0]\n  .filter(keep)\n  .join();`,
      errors: [error],
    },
    {
      code: 'const text = (await read()).trim().split(sep);',
      output: 'const text = (await read())\n  .trim()\n  .split(sep);',
      errors: [error],
    },
    {
      code: `${locals}await client.get(url).json();`,
      output: `${locals}await client\n  .get(url)\n  .json();`,
      errors: [error],
    },
    {
      code: `${locals}const inline = \`[\${values.map(quote).join(', ')}]\`;`,
      output: `${locals}const inline = \`[\${values\n  .map(quote)\n  .join(', ')}]\`;`,
      errors: [error],
    },
    {
      code: `${locals}run(items.map(fn).filter(keep));`,
      output: `${locals}run(items\n  .map(fn)\n  .filter(keep));`,
      errors: [error],
    },
    {
      code: `${locals}lookup[items.map(fn).filter(keep)];`,
      output: `${locals}lookup[items\n  .map(fn)\n  .filter(keep)];`,
      errors: [error],
    },
    {
      code: `${locals}items.map(/* keep */ fn).filter(keep);`,
      output: `${locals}items\n  .map(/* keep */ fn)\n  .filter(keep);`,
      errors: [error],
    },
    {
      code: `${locals}items /* keep */.map(fn).filter(keep);`,
      output: null,
      errors: [error],
    },
    {
      code: `${locals}items.map(fn) /* keep */ .filter(keep);`,
      output: null,
      errors: [error],
    },
    {
      code: 'let items;\r\nitems.map(fn).filter(keep);\r\n',
      output: 'let items;\r\nitems\r\n  .map(fn)\r\n  .filter(keep);\r\n',
      errors: [error],
    },
    {
      code: 'let items;\r\nlet other;\nitems.map(fn).filter(keep);\n',
      output: 'let items;\r\nlet other;\nitems\n  .map(fn)\n  .filter(keep);\n',
      errors: [error],
    },
    {
      code: `${locals}function run() {\n\treturn items.map(fn).filter(keep);\n}`,
      output: `${locals}function run() {\n\treturn items\n\t\t.map(fn)\n\t\t.filter(keep);\n}`,
      errors: [error],
    },
    {
      code: `${locals}const out = items.map(first).filter(second);`,
      output: `${locals}const out = items\n  .map(first)\n  .filter(second);`,
      options: [{ maxLineLength: 18 }],
      errors: [error],
    },
    {
      code: `${locals}const out = items.map(first).filter(second);`,
      output: null,
      options: [{ maxLineLength: 17 }],
      errors: [error],
    },
    {
      code: `${locals}items.map((item) => {\n  return item + 12345;\n});`,
      output: null,
      options: [{ maxLineLength: 23 }],
      errors: [error],
    },
    {
      code: `${locals}items.map((item) => {\n  return item + 1234;\n});`,
      output: `${locals}items\n  .map((item) => {\n    return item + 1234;\n  });`,
      options: [{ maxLineLength: 23 }],
      errors: [error],
    },
    {
      code: 'let a, x, y;\na.b(a.b(a.b(x).c(y)).c(y)).c(y);',
      output: 'let a, x, y;\na\n  .b(a\n    .b(a\n      .b(x)\n      .c(y))\n    .c(y))\n  .c(y);',
      errors: [error, error, error],
    },
    {
      code: 'let a, b, f, g;\na.map(f).filter((x) => {\n  return b.map(g).filter((y) => {\n    return y;\n  });\n});',
      output: [
        'let a, b, f, g;',
        'a',
        '  .map(f)',
        '  .filter((x) => {',
        '    return b',
        '      .map(g)',
        '      .filter((y) => {',
        '        return y;',
        '      });',
        '  });',
      ].join('\n'),
      errors: [error, error],
    },
    {
      code: 'let a, b, f, g;\na.map(f).filter((x) => {\n\treturn b.map(g).join();\n});',
      output: 'let a, b, f, g;\na\n\t.map(f)\n\t.filter((x) => {\n\t\treturn b\n\t\t\t.map(g)\n\t\t\t.join();\n\t});',
      errors: [error, error],
    },
    {
      code: 'let a, b, f, g;\nrun(b.map(f).join()).map(f).filter(g);',
      output: 'let a, b, f, g;\nrun(b\n  .map(f)\n  .join())\n  .map(f)\n  .filter(g);',
      errors: [error, error],
    },
    {
      code: 'let a, b, f, g;\na.map(f).filter((x) => {\n  return b /* c */.map(g).join();\n});',
      output: 'let a, b, f, g;\na\n  .map(f)\n  .filter((x) => {\n    return b /* c */.map(g).join();\n  });',
      errors: [error, error],
    },
    {
      code: 'let a, b, f;\na.map(f).concat(\n  b.map((y) => {\n    return y;\n  }),\n);',
      output: 'let a, b, f;\na\n  .map(f)\n  .concat(\n    b.map((y) => {\n      return y;\n    }),\n  );',
      options: [{ maxLineLength: 18 }],
      errors: [error, error],
    },
    {
      code: 'let a, b, f, y, z;\na.map(f).forEach((x) => {\n  b.c(x).d(y).e(z);\n});',
      output: [
        'let a, b, f, y, z;',
        'a',
        '  .map(f)',
        '  .forEach((x) => {',
        '    b',
        '      .c(x)',
        '      .d(y)',
        '      .e(z);',
        '  });',
      ].join('\n'),
      options: [{ maxLineLength: 20 }],
      errors: [error, error],
    },
  ],
});

tsRuleTester.run('chain-call-newline', chainCallNewline, {
  valid: ['value!.load().run;'],
  invalid: [
    {
      code: "([\n  'a',\n] as const).map(fn).filter(keep);",
      output: "([\n  'a',\n] as const)\n  .map(fn)\n  .filter(keep);",
      errors: [error],
    },
    {
      code: 'items.find(fn)!.map(fn).filter(keep);',
      output: 'items.find(fn)!\n  .map(fn)\n  .filter(keep);',
      errors: [error],
    },
  ],
});

tsxRuleTester.run('chain-call-newline', chainCallNewline, {
  valid: ['const view = <List items={rows.map(fn)} />;'],
  invalid: [
    {
      code: 'let rows;\nconst view = <List items={rows.map(fn).filter(keep)} />;',
      output: 'let rows;\nconst view = <List items={rows\n  .map(fn)\n  .filter(keep)} />;',
      errors: [error],
    },
  ],
});
