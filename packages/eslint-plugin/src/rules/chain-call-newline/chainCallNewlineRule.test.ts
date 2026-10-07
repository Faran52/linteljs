import {
  jsRuleTester,
  tsRuleTester,
  tsxRuleTester,
} from '@mocks/ruleTesters';
import { Linter } from 'eslint';

import { chainCallNewline } from './chainCallNewlineRule.ts';

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
    'let items;\nitems.map((item) => item.name);',
    'JSON.parse(text).map(fn);',
    "import { DateTime } from 'luxon';\nDateTime.fromISO(text).toFormat(pattern);",
    "import { apiV2 } from 'mod';\napiV2.users(id).fetch();",
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
      errors: [
        error,
        error,
        error,
      ],
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
    {
      code: 'let a, b;\nrun(a.map(f).filter(g), b.map(f).filter(g));',
      output: 'let a, b;\nrun(a\n  .map(f)\n  .filter(g), b\n    .map(f)\n    .filter(g));',
      errors: [error, error],
    },
    {
      code: 'let a, b, c;\nrun(a.map(f).filter(g), b.map(f).filter(g), c.map(f).filter(g));',
      output: [
        'let a, b, c;',
        'run(a',
        '  .map(f)',
        '  .filter(g), b',
        '    .map(f)',
        '    .filter(g), c',
        '      .map(f)',
        '      .filter(g));',
      ].join('\n'),
      errors: [
        error,
        error,
        error,
      ],
    },
    {
      code: 'let a, b;\nrun(a.map(f).filter(gggggggggggggggggggg), b.map(f).filter(g));',
      output: 'let a, b;\nrun(a.map(f).filter(gggggggggggggggggggg), b\n  .map(f)\n  .filter(g));',
      options: [{ maxLineLength: 20 }],
      errors: [error, error],
    },
    {
      code: 'a.b(a.b(x).c(y)).c(y);\nvar a;',
      output: 'a\n  .b(a\n    .b(x)\n    .c(y))\n  .c(y);\nvar a;',
      errors: [error, error],
    },
    {
      code: 'let a, c, e, k;\na.b(c.d(e.f(x).g(y)).h(z), k.l(m).n(o)).p(q);',
      output: [
        'let a, c, e, k;',
        'a',
        '  .b(c',
        '    .d(e',
        '      .f(x)',
        '      .g(y))',
        '    .h(z), k',
        '      .l(m)',
        '      .n(o))',
        '  .p(q);',
      ].join('\n'),
      errors: [
        error,
        error,
        error,
        error,
      ],
    },
    {
      code: 'let items;\nitems.map((a) => {\n  use(a);\n  \n  return a;\n});',
      output: 'let items;\nitems\n  .map((a) => {\n    use(a);\n  \n    return a;\n  });',
      errors: [error],
    },
    {
      code: 'let a, c;\na.b(c.d(x).e(yyyyyyyyyyyyy)).i(w);',
      output: 'let a, c;\na\n  .b(c\n    .d(x)\n    .e(yyyyyyyyyyyyy))\n  .i(w);',
      options: [{ maxLineLength: 22 }],
      errors: [error, error],
    },
    {
      code: 'let items;\r\nconst out = items.map(first).filter(second);\r\n',
      output: 'let items;\r\nconst out = items\r\n  .map(first)\r\n  .filter(second);\r\n',
      options: [{ maxLineLength: 18 }],
      errors: [error],
    },
    {
      code: 'let items;\nconst someVeryLongVariableName = items.map(f).filter(g);',
      output: 'let items;\nconst someVeryLongVariableName = items\n  .map(f)\n  .filter(g);',
      options: [{ maxLineLength: 14 }],
      errors: [error],
    },
    {
      code: 'let items;\nitems.map(fn).filter(keep).length;',
      output: 'let items;\nitems\n  .map(fn)\n  .filter(keep).length;',
      errors: [error],
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
      code: 'const run = async (items: Item[]) => {\n  return await items.map(fn).filter(keep);\n};',
      output: 'const run = async (items: Item[]) => {\n  return await items\n    .map(fn)\n    .filter(keep);\n};',
      errors: [error],
    },
    {
      // A computed read ends the run; an undeclared head reads as a namespace and keeps its first call.
      code: "items.map(fn)['0'].trim().run();",
      output: "items.map(fn)['0']\n  .trim()\n  .run();",
      errors: [error],
    },
    {
      code: 'items.find(fn)!.map(fn).filter(keep);',
      output: 'items.find(fn)!\n  .map(fn)\n  .filter(keep);',
      errors: [error],
    },
    {
      code: "import { helper } from 'mod';\nfunction helper() {}\nhelper.make(value).run(other);",
      output: "import { helper } from 'mod';\nfunction helper() {}\nhelper\n  .make(value)\n  .run(other);",
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

describe('the fix of a chain', () => {
  const messagesFor = (code: string) => {
    return new Linter().verify(code, [{
      plugins: { linteljs: { rules: { 'chain-call-newline': chainCallNewline } } },
      rules: { 'linteljs/chain-call-newline': 'error' },
    }]);
  };

  it('stays inside its own chain when a later chain sits on a line it leaves alone', () => {
    const code = 'let a, b;\nrun(a.map(f).filter(g));\nb.map(f).filter(g);\n';
    const [first] = messagesFor(code);

    expect(first?.fix?.range[1]).toBeLessThan(code.indexOf('\nb.'));
  });

  it('leaves a chain in its head to that chain\'s own fix', () => {
    const code = 'let a;\nrun(a.map(f).filter(g)).then(h).catch(k);\n';
    const outer = messagesFor(code)
      .find(({ column }) => {
        return column === 'run(a.map(f).filter(g))'.length + 1;
      });

    expect(outer?.fix?.range[0]).toBeGreaterThan(code.indexOf('.filter'));
  });
});
