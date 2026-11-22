import ts from 'typescript';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { sourcesOf } from './bindingUtils';
import {
  actsIn,
  type Fault,
  isProvenPure,
  pathFault,
  plainCheck,
  type Proof,
  pureCheck,
  readFault,
  spreadFault,
} from './effectUtils';
import { scopeOf } from './scopeUtils';
import { collect, parse } from './sourceUtils';

interface Given {
  options: Record<string, string>;
  held: Record<string, string>;
  plainData: string[];
  pureCalls: string[];
}

interface Subject {
  proof: Proof;
  value: ts.Expression;
}

// The value a base assigns to `y`, with what proves its reads.
const subjectOf = (base: string, {
  options,
  held,
  plainData,
  pureCalls,
}: Given): Subject => {
  const sources = sourcesOf(base, options, held, {
    plainData,
    pureCalls,
  });
  const file = parse(sources.body);
  const checker = scopeOf(file, sources.modules, sources.held);
  const [assigned] = collect(file, ts.isBinaryExpression)
    .filter((binary) => {
      return binary.left.getText() === 'y';
    });

  if (assigned === undefined) {
    throw new Error(`No y in ${base}`);
  }

  const subject: Subject = {
    proof: {
      checker,
      sources,
      given: new Map(),
    },
    value: assigned.right,
  };

  return subject;
};

const NONE: Given = {
  options: {},
  held: {},
  plainData: [],
  pureCalls: [],
};

const STYLES: Given = {
  ...NONE,
  plainData: ['./*.styles'],
  pureCalls: ['./*.styles'],
};

const STYLES_PURE: Given = {
  ...NONE,
  pureCalls: ['./*.styles'],
};

const STYLES_PLAIN: Given = {
  ...NONE,
  plainData: ['./*.styles'],
};

const optionOf = (option: string): Given => {
  const given: Given = {
    ...NONE,
    options: { './p': option },
  };

  return given;
};

const RETURNS = 'export const f = (c: boolean) => {\n  const l = [1].map((n) => {\n    return n;\n  });\n'
  + '  if (c) {\n    return { a: l };\n  }\n  return { a: 2 };\n};\n';

const EITHER = 'export const g = (c: boolean) => {\n  if (c) {\n    return () => ({ a: 1 });\n  }\n\n'
  + '  return () => ({ a: 2 });\n};\n';

const GETTER_RETURNED = 'export const f = (c: boolean) => {\n  if (c) {\n    return { a: 1 };\n  }\n\n'
  + '  return { get b() { return 1; } };\n};\n';

const CALLED = 'import { f } from \'./p\';\n\ny = f().a;';

const STYLED = 'import { s } from \'./t.styles\';\n\ny = s.tab(1).a;';

const faultOf = (member: string, shown: string, isModule: boolean): Fault => {
  const fault: Fault = {
    member,
    origin: {
      shown,
      isModule,
    },
  };

  return fault;
};

const PROVEN: [string, string, Given][] = [
  [
    'a plain property of a literal',
    'const t = { a: 1 };\ny = t.a;',
    NONE,
  ],
  [
    'a property two deep',
    'const t = { a: { b: 1 } };\ny = t.a.b;',
    NONE,
  ],
  [
    'a property through a shorthand member',
    'const b = { c: 1 };\nconst t = { b };\ny = t.b.c;',
    NONE,
  ],
  [
    'a literal key',
    'const t = { a: 1 };\ny = t[\'a\'];',
    NONE,
  ],
  [
    'a numeric key',
    'const t = { 0: 1 };\ny = t[0];',
    NONE,
  ],
  [
    'a literal behind `as const`',
    'const t = { a: 1 } as const;\ny = t.a;',
    NONE,
  ],
  [
    'an import of the base declared plain data',
    'import { t } from \'./t.styles\';\n\ny = t.a.b;',
    {
      ...NONE,
      plainData: ['./*.styles'],
      pureCalls: [],
    },
  ],
  [
    'an import of the base from a module held for proof',
    'import { t } from \'./t\';\n\ny = t.a;',
    {
      ...NONE,
      held: { './t': 'export const t = { a: 1 };\n' },
    },
  ],
  [
    'a parameter binding\'s literal',
    'import { x } from \'./p\';\n\ny = x.a;',
    {
      ...NONE,
      options: { './p': 'export const x = { a: 1 };\n' },
    },
  ],
  [
    'an option\'s import of a module held for proof',
    'import { x } from \'./p\';\n\ny = x.m.a;',
    {
      ...NONE,
      options: { './p': 'import { t } from \'./t\';\n\nexport const x = { m: t };\n' },
      held: { './t': 'export const t = { a: 1 };\n' },
    },
  ],
  [
    'an option\'s import of a module declared plain data, matched exactly',
    'import { x } from \'./p\';\n\ny = x.m.a;',
    {
      ...NONE,
      options: { './p': 'import { t } from \'./t\';\n\nexport const x = { m: t };\n' },
      plainData: ['./t'],
      pureCalls: [],
    },
  ],
  [
    'what an option call answers',
    CALLED,
    optionOf('export const f = () => ({ a: 1 });\n'),
  ],
  [
    'what every return of an option call answers, a nested function\'s aside',
    'import { f } from \'./p\';\n\ny = f(true).a;',
    optionOf(RETURNS),
  ],
  [
    'a parameter followed to its argument',
    'import { f } from \'./p\';\n\ny = f({ a: 1 }).a;',
    optionOf('export const f = (o: O) => o;\n'),
  ],
  [
    'what a call answers, its module declared both pure calls and plain data',
    STYLED,
    STYLES,
  ],
];

const UNPROVEN: [string, string, Given, Fault][] = [
  [
    'a getter',
    'const t = { get a() { return 1; } };\ny = t.a;',
    NONE,
    faultOf('"a"', '"t"', false),
  ],
  [
    'a method',
    'const t = { a() {} };\ny = t.a;',
    NONE,
    faultOf('"a"', '"t"', false),
  ],
  [
    'a member the literal lacks',
    'const t = {};\ny = t.toString;',
    NONE,
    faultOf('"toString"', '"t"', false),
  ],
  [
    'a member of a module whose specifier only begins as one declared plain data',
    'import { s } from \'./t.styles.ts\';\n\ny = s.a;',
    STYLES_PLAIN,
    faultOf('"a"', './t.styles.ts', true),
  ],
  [
    'a member of a literal an `await using` holds',
    'await using t = { a: 1 };\ny = t.a;',
    NONE,
    faultOf('"a"', '"t"', false),
  ],
  [
    'a member of a parameter read where its call has returned',
    'import { f } from \'./p\';\n\nconst t = { a: 1 };\ny = f(t)().a;',
    optionOf('export const f = (p: O) => () => p;\n'),
    faultOf('"a"', '"p"', false),
  ],
  [
    'a member a spread may give',
    'const t = { ...s };\ny = t.a;',
    NONE,
    faultOf('"a"', '"t"', false),
  ],
  [
    'a member a computed key may give',
    'const t = { [k]: 1 };\ny = t.a;',
    NONE,
    faultOf('"a"', '"t"', false),
  ],
  [
    'the prototype',
    'const t = { __proto__: p };\ny = t.__proto__;',
    NONE,
    faultOf('"__proto__"', '"t"', false),
  ],
  [
    'a key known only as the code runs',
    'const t = { a: 1 };\ny = t[k];',
    NONE,
    faultOf('[k]', '"t"', false),
  ],
  [
    'a member of a value that is no object literal',
    'const t = 1;\ny = t.a;',
    NONE,
    faultOf('"a"', '"t"', false),
  ],
  [
    'a let',
    'let t = { a: 1 };\ny = t.a;',
    NONE,
    faultOf('"a"', '"t"', false),
  ],
  [
    'a parameter',
    'function f(t) {\n  y = t.a;\n}',
    NONE,
    faultOf('"a"', '"t"', false),
  ],
  [
    'a constant with no initializer',
    'for (const t of l) {\n  y = t.a;\n}',
    NONE,
    faultOf('"a"', '"t"', false),
  ],
  [
    'a global',
    'y = location.href;',
    NONE,
    faultOf('"href"', '"location"', false),
  ],
  [
    'what a call answers',
    'const t = f();\ny = t.a;',
    NONE,
    faultOf('"a"', '"t"', false),
  ],
  [
    'literals that read each other',
    'const a = { b: c.d };\nconst c = { d: a.b };\ny = a.b.x;',
    NONE,
    faultOf(
      '"b"',
      '"a"',
      false,
    ),
  ],
  [
    'an import of a module neither held nor declared',
    'import { t } from \'./t\';\n\ny = t.a;',
    NONE,
    faultOf(
      '"a"',
      './t',
      true,
    ),
  ],
  [
    'an import the pattern does not match',
    'import { t } from \'./a/t.styles\';\n\ny = t.a;',
    {
      ...NONE,
      plainData: ['./*.styles'],
      pureCalls: [],
    },
    faultOf('"a"', './a/t.styles', true),
  ],
  [
    'a default import of a held module',
    'import t from \'./t\';\n\ny = t.a;',
    {
      ...NONE,
      held: { './t': 'export default { a: 1 };\n' },
    },
    faultOf('"a"', './t', true),
  ],
  [
    'a name a held module does not export',
    'import { t } from \'./t\';\n\ny = t.a;',
    {
      ...NONE,
      held: { './t': 'export const u = { a: 1 };\n' },
    },
    faultOf('"a"', './t', true),
  ],
  [
    'a getter of a parameter binding\'s literal',
    'import { x } from \'./p\';\n\ny = x.a;',
    {
      ...NONE,
      options: { './p': 'export const x = { get a() { return 1; } };\n' },
    },
    faultOf('"a"', './p', true),
  ],
  [
    'an option\'s import of a module the engine lacks',
    'import { x } from \'./p\';\n\ny = x.m.a;',
    {
      ...NONE,
      options: { './p': 'import { t } from \'./t\';\n\nexport const x = { m: t };\n' },
    },
    faultOf('"a"', './t', true),
  ],
  [
    'what a call answers, its module declared pure calls only',
    STYLED,
    STYLES_PURE,
    faultOf('"a"', '"s.tab(1)"', false),
  ],
  [
    'what a call answers, its module declared plain data only',
    STYLED,
    STYLES_PLAIN,
    faultOf('"a"', '"s.tab(1)"', false),
  ],
  [
    'what an option call answers with a bare return',
    CALLED,
    optionOf('export const f = () => {\n  return;\n};\n'),
    faultOf('"a"', '"f()"', false),
  ],
  [
    'what an option call answers beside a bare return',
    'import { f } from \'./p\';\n\ny = f(true).a;',
    optionOf('export const f = (c: boolean) => {\n  if (c) {\n    return;\n  }\n\n  return { a: 1 };\n};\n'),
    faultOf('"a"', '"f(true)"', false),
  ],
  [
    'what an option call answers only from a nested function',
    CALLED,
    optionOf('export const f = () => {\n  [1].map(() => {\n    return { a: 1 };\n  });\n};\n'),
    faultOf('"a"', '"f()"', false),
  ],
  [
    'what a function of the base answers',
    'const f = () => ({ a: 1 });\ny = f().a;',
    NONE,
    faultOf('"a"', '"f()"', false),
  ],
  [
    'what an async option function answers',
    CALLED,
    optionOf('export const f = async () => ({ a: 1 });\n'),
    faultOf('"a"', '"f()"', false),
  ],
  [
    'a parameter with a default',
    CALLED,
    optionOf('export const f = (o = { a: 1 }) => o;\n'),
    faultOf('"a"', '"f()"', false),
  ],
  [
    'a parameter with no argument',
    CALLED,
    optionOf('export const f = (o: O) => o;\n'),
    faultOf('"a"', '"f()"', false),
  ],
  [
    'a parameter past a spread argument',
    'import { f } from \'./p\';\n\ny = f(...l, { a: 1 }).a;',
    optionOf('export const f = (n: N, o: O) => o;\n'),
    faultOf('"a"', '"f(...l, { a: 1 })"', false),
  ],
  [
    'an option function that answers its own call',
    CALLED,
    optionOf('export const f = (): O => f();\n'),
    faultOf('"a"', '"f()"', false),
  ],
  [
    'a callee that may be either of two functions',
    'import { g } from \'./p\';\n\ny = g(true)().a;',
    optionOf(EITHER),
    faultOf('"a"', '"g(true)()"', false),
  ],
  [
    'a callee that is no function',
    CALLED,
    optionOf('export const f = 1;\n'),
    faultOf('"a"', '"f()"', false),
  ],
];

describe('readFault', () => {
  it.each(PROVEN)('proves %s', (_name, base, given) => {
    const { proof, value } = subjectOf(base, given);

    if (!ts.isPropertyAccessExpression(value) && !ts.isElementAccessExpression(value)) {
      throw new Error(`No member read in ${base}`);
    }

    const fault = readFault(proof, value);

    expect(fault).toBeUndefined();
  });

  it.each(UNPROVEN)('does not prove %s', (_name, base, given, expected) => {
    const { proof, value } = subjectOf(base, given);

    if (!ts.isPropertyAccessExpression(value) && !ts.isElementAccessExpression(value)) {
      throw new Error(`No member read in ${base}`);
    }

    const fault = readFault(proof, value);

    expect(fault).toStrictEqual(expected);
  });
});

const SPREAD_TAB = 'import { s } from \'./t.styles\';\n\ny = s.tab(1);';

describe('spreadFault', () => {
  it.each([
    [
      'const t = { a: 1, b, \'c\': 2 };\ny = t;',
      NONE,
      undefined,
    ],
    [
      'const t = { a: 1, get b() { return 1; } };\ny = t;',
      NONE,
      faultOf('every member', '"t"', false),
    ],
    [
      'const t = { __proto__: p };\ny = t;',
      NONE,
      faultOf('every member', '"t"', false),
    ],
    [
      'const t = { [k]: 1 };\ny = t;',
      NONE,
      faultOf('every member', '"t"', false),
    ],
    [
      'y = t;',
      NONE,
      faultOf('every member', '"t"', false),
    ],
    [
      'const t = [1];\ny = t;',
      NONE,
      faultOf('every member', '"t"', false),
    ],
    [
      'import { f } from \'./p\';\n\ny = f();',
      optionOf('export const f = () => ({ a: 1 });\n'),
      undefined,
    ],
    [
      SPREAD_TAB,
      STYLES,
      undefined,
    ],
    [
      SPREAD_TAB,
      STYLES_PURE,
      faultOf('every member', '"s.tab(1)"', false),
    ],
    [
      SPREAD_TAB,
      STYLES_PLAIN,
      faultOf('every member', '"s.tab(1)"', false),
    ],
    [
      'import { f } from \'./p\';\n\ny = f();',
      optionOf('const x = g();\nexport const f = () => x;\n'),
      faultOf('every member', '"f()"', false),
    ],
    [
      'import { f } from \'./p\';\n\ny = f(true);',
      optionOf(GETTER_RETURNED),
      faultOf('every member', '"f(true)"', false),
    ],
  ])('answers for %s with %j', (base, given, expected) => {
    const { proof, value } = subjectOf(base, given);
    const fault = spreadFault(proof, value);

    expect(fault).toStrictEqual(expected);
  });
});

describe('plainCheck', () => {
  it('passes proven reads, and reads in a function or written to', () => {
    const { proof, value } = subjectOf('const t = { a: 1 };\ny = [t.a, () => u.b, (v.c = 1)];', NONE);

    const run = (): void => {
      plainCheck(proof, value);
    };

    expect(run).not.toThrow();
  });

  it('refuses the first read it cannot prove, inner first, naming the name it is read from', () => {
    const { proof, value } = subjectOf('const t = { a: 1 };\ny = [t.a, u.b.c];', NONE);

    const run = (): void => {
      plainCheck(proof, value);
    };

    expect(run).toThrow('"b" of "u" is not shown to be a plain property of an object literal, so reading it may run '
      + 'code: u.b');
  });

  it('refuses a read of a module, naming the module', () => {
    const { proof, value } = subjectOf('import { t } from \'./t\';\n\ny = t.a;', NONE);

    const run = (): void => {
      plainCheck(proof, value);
    };

    expect(run).toThrow('"a" of ./t is not shown to be a plain property, so reading it may run code: give the engine '
      + 'that module, or declare it plain data: t.a');
  });
});

const TABLE = 'const t = { a: 1 };\n';

describe('pureCheck', () => {
  it('passes a value that is pure on proof', () => {
    const { proof, value } = subjectOf('const t = { a: 1 };\ny = t.a + 1;', NONE);

    const run = (): void => {
      pureCheck(proof, value, new Error('refused'));
    };

    expect(run).not.toThrow();
  });

  it.each([
    ['const o = { a: 1 };\ny = o + 1;'],
    ['y = `${o}`;'],
    ['y = -o;'],
    ['y = a in b;'],
  ])('throws the caller\'s refusal for %j, which may run an operand\'s code converting it', (base) => {
    const { proof, value } = subjectOf(base, NONE);

    const run = (): void => {
      pureCheck(proof, value, new Error('refused'));
    };

    expect(run).toThrow('refused');
  });

  it.each(['const n = 1;\ny = n + 1;', 'const n = 1;\ny = `${n}`;'])('passes %j, which converts primitives', (base) => {
    const { proof, value } = subjectOf(base, NONE);

    const run = (): void => {
      pureCheck(proof, value, new Error('refused'));
    };

    expect(run).not.toThrow();
  });

  it('says which read stands in the way of a look when only reads do', () => {
    const { proof, value } = subjectOf(`${TABLE}y = u.b in t;`, NONE);

    const run = (): void => {
      pureCheck(proof, value, new Error('refused'));
    };

    expect(run).toThrow('"b" of "u"');
  });

  it('says which read stands in the way when only reads do', () => {
    const { proof, value } = subjectOf('y = u.b + 1;', NONE);

    const run = (): void => {
      pureCheck(proof, value, new Error('refused'));
    };

    expect(run).toThrow('"b" of "u"');
  });

  it.each(['y = f();', 'y = f(u.b);'])('throws the caller\'s refusal for %s, which acts on its own', (base) => {
    const { proof, value } = subjectOf(base, NONE);

    const run = (): void => {
      pureCheck(proof, value, new Error('refused'));
    };

    expect(run).toThrow('refused');
  });
});

const CALLING = 'import { f } from \'./p\';\n\ny = f(1);';

const TAB = 'import { s } from \'./t.styles\';\n\ny = s.tab(k);';

describe('actsIn', () => {
  it.each([
    [
      'y = [1, c ? d : e, () => g(), <a b={c} />, a === b, a !== b, a && b, a || b, a ?? b, !a, typeof a, (a, b)];',
      NONE,
      [],
    ],
    [
      'y = [a + b, a - b, a * b, a < b, a == b, a | b, a << b, +a, -a, ~a, `t${f}`, { [a]: 1 }];',
      NONE,
      [
        'a + b',
        'a - b',
        'a * b',
        'a < b',
        'a == b',
        'a | b',
        'a << b',
        '+a',
        '-a',
        '~a',
        '`t${f}`',
        '[a]',
      ],
    ],
    [
      'y = [a ^ b, a & b, a != b, a <= b, a > b, a >= b, a >> b, a >>> b, a / b, a % b, a ** b];',
      NONE,
      [
        'a ^ b',
        'a & b',
        'a != b',
        'a <= b',
        'a > b',
        'a >= b',
        'a >> b',
        'a >>> b',
        'a / b',
        'a % b',
        'a ** b',
      ],
    ],
    [
      'y = [(a === b) | 0, (a instanceof B) | 0];',
      NONE,
      ['a instanceof B'],
    ],
    [
      'import { s } from \'./t.styles\';\n\ny = s.a + 1;',
      STYLES_PLAIN,
      ['s.a + 1'],
    ],
    [
      'y = [f`t`, class {}];',
      NONE,
      ['f`t`', 'class {}'],
    ],
    [
      'function* g() {\n  y = yield 1;\n}',
      NONE,
      ['yield 1'],
    ],
    [
      CALLING,
      optionOf('export const f = (...n: number[]) => n;\n'),
      ['f(1)'],
    ],
    [
      [
        'const k = 1;',
        'const t = { a: \'s\' };',
        'y = [k + 2, `t${t.a}`, -k, ~k, k < 2, k == null, { [k]: true }, t[\'a\'] + `${false}`];',
      ].join('\n'),
      NONE,
      [],
    ],
    [
      'const k = 1;\ny = [k + a, a + k, `${k}${a}`];',
      NONE,
      [
        'k + a',
        'a + k',
        '`${k}${a}`',
      ],
    ],
    [
      'const k = \'a\';\nconst t = { a: 1 };\ny = [k in t, t instanceof k];',
      NONE,
      ['t instanceof k'],
    ],
    [
      'const a = b + 1;\nconst b = a + 1;\ny = `${a}`;',
      NONE,
      ['`${a}`'],
    ],
    [
      'const a = 1 + 2;\nconst b = a * 3;\ny = `${b}${(a < b) + 1}`;',
      NONE,
      [],
    ],
    [
      'y = [1n + 2, -1n];',
      NONE,
      ['1n + 2', '-1n'],
    ],
    [
      'const k = c ? 1 : u;\ny = k + 1;',
      NONE,
      ['k + 1'],
    ],
    [
      'y = x as { [k]: number };',
      NONE,
      [],
    ],
    [
      'import { s } from \'./t.styles\';\n\ny = [s[k], s[\'a\']];',
      STYLES_PLAIN,
      ['s[k]'],
    ],
    [
      'import { s } from \'./t.styles\';\n\ny = [s[k](1), s[\'tab\'](1)];',
      STYLES_PURE,
      ['s[k]'],
    ],
    [
      CALLING,
      optionOf('export const f = (n: number) => `${n}` + !n + (n < 2) + -1 + +n + void n;\n'),
      [],
    ],
    [
      CALLING,
      optionOf('export const f = (n: number) => 1 + -n;\n'),
      ['f(1)'],
    ],
    [
      'y = f(u.b);',
      NONE,
      ['f(u.b)', 'u.b'],
    ],
    [
      'class C {}\ny = C.p;',
      NONE,
      ['C.p'],
    ],
    [
      'y = (a = 1);',
      NONE,
      ['a = 1'],
    ],
    [
      'y = [++i, i--, new C(), delete o.k];',
      NONE,
      [
        '++i',
        'i--',
        'new C()',
        'delete o.k',
        'o.k',
      ],
    ],
    [
      'const t = { a: 1 };\ny = { ...t, ...u };',
      NONE,
      ['...u'],
    ],
    [
      CALLING,
      optionOf('export const f = (n: number) => n + 1;\n'),
      [],
    ],
    [
      CALLING,
      optionOf('export const f = (n: number) => {\n  return n;\n};\n'),
      [],
    ],
    [
      CALLING,
      optionOf('export const f = (n: number) => g(n);\n'),
      ['f(1)'],
    ],
    [
      'import { f } from \'./p\';\n\ny = f(u);',
      optionOf('export const f = (n = g()) => 1;\n'),
      ['f(u)'],
    ],
    [
      'import { f } from \'./p\';\n\ny = f();',
      optionOf('export const f = (): O => f();\n'),
      ['f()'],
    ],
    [
      CALLING,
      optionOf('export const f = (n: number) => {\n  return;\n};\n'),
      ['f(1)'],
    ],
    [
      CALLING,
      optionOf('export const f = (n: number) => {\n  const m = n;\n\n  return m;\n};\n'),
      ['f(1)'],
    ],
    [
      'import { f } from \'./p\';\n\ny = f({ a: 1 });',
      optionOf('export const f = (o: O) => o.a;\n'),
      [],
    ],
    [
      'import { f } from \'./p\';\n\ny = f(u);',
      optionOf('export const f = (o: O) => o.a;\n'),
      ['f(u)'],
    ],
    [
      TAB,
      STYLES_PURE,
      [],
    ],
    [
      TAB,
      STYLES_PLAIN,
      ['s.tab(k)'],
    ],
    [
      TAB,
      NONE,
      ['s.tab(k)', 's.tab'],
    ],
    [
      'import { s } from \'./t.styles\';\n\ny = s[g()](h());',
      STYLES_PURE,
      [
        's[g()]',
        'g()',
        'h()',
      ],
    ],
    [
      'import { s } from \'./t.styles\';\n\ny = [s.tab(1)(2), s.tab(1).fn(2), s.tab(1).a];',
      STYLES,
      ['s.tab(1)(2)', 's.tab(1).fn(2)'],
    ],
    [
      'import { s } from \'./t.styles\';\n\nconst f = s.tab(1);\ny = f(2);',
      STYLES,
      ['f(2)'],
    ],
    [
      'import { pick } from \'./p\';\n\ny = pick()(1);',
      {
        ...STYLES,
        options: { './p': 'import { s } from \'./t.styles\';\n\nexport const pick = () => s.tab;\n' },
      },
      [],
    ],
    [
      'import { g } from \'./p\';\n\ny = g().tab(1);',
      {
        ...STYLES_PURE,
        options: { './p': 'import { s } from \'./t.styles\';\n\nexport const g = () => s;\n' },
      },
      [],
    ],
  ])('finds what may act in %s with %j', (base, given, expected) => {
    const { proof, value } = subjectOf(base, given);
    const acting = actsIn(proof, value)
      .map((node) => {
        return node.getText();
      });

    expect(acting).toStrictEqual(expected);
  });
});

const HELD: Given = {
  ...NONE,
  held: { './q': 'export const t = { a: 1 };\n' },
};

const PICKED = 'import { f } from \'./p\';\n\ny = f({ a: 1 });';

const TABLES = 'export const g = (c: boolean) => {\n  if (c) {\n    return { a: 1 };\n  }\n\n  return { b: 2 };\n};\n';

const LOOKED = 'import { g } from \'./p\';\n\ny = \'a\' in g(c);';

// Each `in` or `instanceof` the base assigns to `y`, and whether its look is proven to run nothing.
const LOOKS: [string, Given, boolean][] = [
  [
    `${TABLE}const k = 'a';\ny = k in t;`,
    NONE,
    true,
  ],
  [
    'y = \'a\' in { a: 1, \'d\': 2, 1: 4, q };',
    NONE,
    true,
  ],
  [
    'const t = { [\'e\']: 3, [\'__proto__\']: p };\ny = \'e\' in t;',
    NONE,
    true,
  ],
  [
    'const t = { b() {}, get c() {\n  return 1;\n} };\ny = \'b\' in t;',
    NONE,
    true,
  ],
  [
    `${TABLE}y = \`\${1}\` in t;`,
    NONE,
    true,
  ],
  [
    `${TABLE}y = -1 in t;`,
    NONE,
    true,
  ],
  [
    `${TABLE}y = 1 + 2 in t;`,
    NONE,
    true,
  ],
  [
    `${TABLE}y = \`a\` in t;`,
    NONE,
    true,
  ],
  [
    'import { t } from \'./p\';\n\ny = \'a\' in t;',
    optionOf('export const t = { a: 1 };\n'),
    true,
  ],
  [
    'import { t } from \'./q\';\n\ny = \'a\' in t;',
    HELD,
    true,
  ],
  [
    `${TABLE}y = k in t;`,
    NONE,
    false,
  ],
  [
    `${TABLE}y = true in t;`,
    NONE,
    false,
  ],
  [
    `${TABLE}y = null in t;`,
    NONE,
    false,
  ],
  [
    `${TABLE}y = void 0 in t;`,
    NONE,
    false,
  ],
  [
    `${TABLE}y = !a in t;`,
    NONE,
    false,
  ],
  [
    `${TABLE}y = (a === b) in t;`,
    NONE,
    false,
  ],
  [
    `${TABLE}y = 1n in t;`,
    NONE,
    false,
  ],
  [
    'const t = { ...u };\ny = \'a\' in t;',
    NONE,
    false,
  ],
  [
    'const t = { [k]: 1 };\ny = \'a\' in t;',
    NONE,
    false,
  ],
  [
    'y = \'a\' in { __proto__: p };',
    NONE,
    false,
  ],
  [
    'y = \'a\' in u;',
    NONE,
    false,
  ],
  [
    'y = \'a\' in \'b\';',
    NONE,
    false,
  ],
  [
    'y = \'a\' in [1];',
    NONE,
    false,
  ],
  [
    'let t = { a: 1 };\ny = \'a\' in t;',
    NONE,
    false,
  ],
  [
    'import { s } from \'./t.styles\';\n\ny = \'a\' in s;',
    STYLES_PLAIN,
    false,
  ],
  [
    'class C {}\nconst o = {};\ny = o instanceof C;',
    NONE,
    true,
  ],
  [
    'class B {}\nclass C extends B {\n  m() {}\n  static s = 1;\n}\nconst o = {};\ny = o instanceof C;',
    NONE,
    true,
  ],
  [
    'const C = class {};\nconst o = {};\ny = o instanceof C;',
    NONE,
    true,
  ],
  [
    'import { C } from \'./p\';\n\nconst o = {};\ny = o instanceof C;',
    optionOf('export class C {}\n'),
    true,
  ],
  [
    'import { C } from \'./q\';\n\nconst o = {};\ny = o instanceof C;',
    {
      ...NONE,
      held: { './q': 'export class C {}\n' },
    },
    true,
  ],
  [
    'class C {\n  static [Symbol.hasInstance]() {\n    return true;\n  }\n}\nconst o = {};\ny = o instanceof C;',
    NONE,
    false,
  ],
  [
    'class C {\n  [k]() {}\n}\nconst o = {};\ny = o instanceof C;',
    NONE,
    false,
  ],
  [
    'class C {\n  static {}\n}\nconst o = {};\ny = o instanceof C;',
    NONE,
    false,
  ],
  [
    '@d\nclass C {}\nconst o = {};\ny = o instanceof C;',
    NONE,
    false,
  ],
  [
    'declare class C {}\nconst o = {};\ny = o instanceof C;',
    NONE,
    false,
  ],
  [
    'class C extends u {}\nconst o = {};\ny = o instanceof C;',
    NONE,
    false,
  ],
  [
    'class B {\n  static [k] = 1;\n}\nclass C extends B {}\nconst o = {};\ny = o instanceof C;',
    NONE,
    false,
  ],
  [
    'class A extends B {}\nclass B extends A {}\nconst o = {};\ny = o instanceof A;',
    NONE,
    false,
  ],
  [
    'let C = class {};\nconst o = {};\ny = o instanceof C;',
    NONE,
    false,
  ],
  [
    'const C = () => 1;\nconst o = {};\ny = o instanceof C;',
    NONE,
    false,
  ],
  [
    'import { C } from \'./q\';\n\nconst o = {};\ny = o instanceof C;',
    HELD,
    false,
  ],
  [
    'import { C } from \'./q\';\n\nconst o = {};\ny = o instanceof C;',
    {
      ...NONE,
      held: { './q': 'class C {}\nexport const D = 1;\n' },
    },
    false,
  ],
  [
    'class C implements I {}\nconst o = {};\ny = o instanceof C;',
    NONE,
    true,
  ],
  [
    `${TABLE}y = 'a' instanceof t;`,
    NONE,
    false,
  ],
  [
    'const o = {};\ny = o instanceof u;',
    NONE,
    false,
  ],
  [
    'class C {}\ny = 1 instanceof C;',
    NONE,
    true,
  ],
  [
    'class C {}\ny = \'s\' instanceof C;',
    NONE,
    true,
  ],
  [
    'class C {}\ny = {} instanceof C;',
    NONE,
    true,
  ],
  [
    'class C {}\nconst o = [1];\ny = o instanceof C;',
    NONE,
    true,
  ],
  [
    'class C {}\ny = (() => 1) instanceof C;',
    NONE,
    true,
  ],
  [
    'class C {}\nconst o = function () {};\ny = o instanceof C;',
    NONE,
    true,
  ],
  [
    'class C {}\nclass D {}\ny = D instanceof C;',
    NONE,
    true,
  ],
  [
    'class C {}\nconst D = class extends C {};\ny = D instanceof C;',
    NONE,
    true,
  ],
  [
    'class C {}\ny = a instanceof C;',
    NONE,
    false,
  ],
  [
    'class C {}\ny = { __proto__: p } instanceof C;',
    NONE,
    false,
  ],
  [
    'class C {}\nlet o = {};\ny = o instanceof C;',
    NONE,
    false,
  ],
  [
    'class C {}\nconst o = u;\ny = o instanceof C;',
    NONE,
    false,
  ],
  [
    'class C {}\nclass D extends u {}\ny = D instanceof C;',
    NONE,
    false,
  ],
  [
    'class C {}\nconst o = 1n;\ny = o instanceof C;',
    NONE,
    false,
  ],
  [
    'class C {}\nconst g = (o: object) => {\n  y = o instanceof C;\n};',
    NONE,
    false,
  ],
];

const PROVEN_LOOKS = LOOKS
  .filter(([
    ,
    ,
    isProven,
  ]) => {
    return isProven;
  });

const REFUSED_LOOKS = LOOKS
  .filter(([
    ,
    ,
    isProven,
  ]) => {
    return !isProven;
  });

const actedOf = (base: string, given: Given): string[] => {
  const { proof, value } = subjectOf(base, given);

  return actsIn(proof, value)
    .map((node) => {
      return node.getText();
    });
};

const pureRun = (base: string, given: Given): () => void => {
  const { proof, value } = subjectOf(base, given);

  return () => {
    pureCheck(proof, value, new Error('refused'));
  };
};

describe('actsIn and pureCheck, on in and instanceof', () => {
  it.each(PROVEN_LOOKS)('take %s with %j as running nothing', (base, given) => {
    const acting = actedOf(base, given);
    const run = pureRun(base, given);

    expect(acting).toStrictEqual([]);
    expect(run).not.toThrow();
  });

  it.each(REFUSED_LOOKS)('take %s with %j as acting', (base, given) => {
    const acting = actedOf(base, given);
    const run = pureRun(base, given);
    const start = base.lastIndexOf('y = ') + 4;
    const look = base.slice(start, base.indexOf(';', start));

    expect(acting).toStrictEqual([look]);
    expect(run).toThrow('refused');
  });

  it.each([
    [optionOf('export const f = (t: object) => \'a\' in t;\n'), []],
    [optionOf('export const f = (c: boolean) => typeof u in t;\nconst t = { a: 1 };\n'), []],
  ])('follow the right operand of an option arrow\'s look, with %j', (given, expected) => {
    const acting = actedOf(PICKED, given);

    expect(acting).toStrictEqual(expected);
  });

  it.each([
    [TABLES, ['g(c)']],
    [TABLES.replace('{ b: 2 }', 'u'), ['\'a\' in g(c)', 'g(c)']],
  ])('take a look into what an option call answers as proven when every answer is, from %j', (option, expected) => {
    const given = optionOf(option);
    const acting = actedOf(LOOKED, given);

    expect(acting).toStrictEqual(expected);
  });
});

describe('isProvenPure', () => {
  it.each([
    [`${TABLE}y = t.a + 1;`, true],
    ['y = u.a;', false],
    ['y = f();', false],
  ])('answers for %j', (base, expected) => {
    const { proof, value } = subjectOf(base, NONE);
    const pure = isProvenPure(proof, value);

    expect(pure).toBe(expected);
  });
});

describe('pathFault', () => {
  it.each([
    [['a'], undefined],
    [['a', 'b'], undefined],
    [['a', 'c'], faultOf('"c"', '"t"', false)],
    [['d'], faultOf('"d"', '"t"', false)],
  ])('answers for the path %j of a literal', (names, expected) => {
    const { proof, value } = subjectOf('const t = { a: { b: 1 } };\ny = t;', NONE);
    const fault = pathFault(proof, value, names);

    expect(fault).toStrictEqual(expected);
  });
});
