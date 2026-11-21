import ts from 'typescript';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { sourcesOf } from './bindingUtils';
import {
  type Fault,
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
}: Given): Subject => {
  const sources = sourcesOf(base, options, held, plainData);
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
    },
    value: assigned.right,
  };

  return subject;
};

const NONE: Given = {
  options: {},
  held: {},
  plainData: [],
};

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
    },
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

describe('spreadFault', () => {
  it.each([
    ['const t = { a: 1, b, \'c\': 2 };\ny = t;', undefined],
    ['const t = { a: 1, get b() { return 1; } };\ny = t;', faultOf('every member', '"t"', false)],
    ['const t = { __proto__: p };\ny = t;', faultOf('every member', '"t"', false)],
    ['const t = { [k]: 1 };\ny = t;', faultOf('every member', '"t"', false)],
    ['y = t;', faultOf('every member', '"t"', false)],
  ])('answers for %s', (base, expected) => {
    const { proof, value } = subjectOf(base, NONE);
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

describe('pureCheck', () => {
  it('passes a value that is pure on proof', () => {
    const { proof, value } = subjectOf('const t = { a: 1 };\ny = t.a + 1;', NONE);

    const run = (): void => {
      pureCheck(proof, value, new Error('refused'));
    };

    expect(run).not.toThrow();
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
