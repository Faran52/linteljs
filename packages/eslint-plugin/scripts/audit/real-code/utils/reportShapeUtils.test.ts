import { Linter } from 'eslint';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { parse } from '../../utils/astUtils.ts';

import {
  atReport,
  AUDIT_RULES,
  hoistedProbe,
  judge,
  shapesOf,
} from './reportShapeUtils.ts';

const FIX: Linter.LintMessage['fix'] = { range: [0, 0], text: '' };

const reportAt = (ruleId: string | null, line: number, column: number, extra: Partial<Linter.LintMessage> = {}) => {
  const report: Linter.LintMessage = {
    ruleId,
    line,
    column,
    message: '',
    severity: 2,
    ...extra,
  };

  return report;
};

const conversionAt = (column: number): Linter.LintMessage => {
  const report = reportAt('@linteljs/prefer-arrow-functions', 1, column, { messageId: 'preferArrow', fix: FIX });

  return report;
};

const probe = (code: string): string[] => {
  const config: Linter.Config = {
    plugins: { audit: { rules: { hoisted: hoistedProbe } } },
    rules: { 'audit/hoisted': 'error' },
  };
  const messages = new Linter({ configType: 'flat' }).verify(code, config, 'a.js');

  return messages
    .map((message) => {
      return `${String(message.line)}:${message.message}`;
    });
};

describe('AUDIT_RULES', () => {
  it('names the four rules the audit runs', () => {
    expect(AUDIT_RULES).toEqual([
      'no-import-namespace-destructure',
      'prefer-arrow-functions',
      'prefer-await-to-then',
      'prefer-try-catch',
    ]);
  });
});

describe('hoistedProbe', () => {
  it.each([
    [
      'a call above the declaration',
      'a();\nfunction a() {}\n',
      ['2:called above its own declaration'],
    ],
    [
      'a call below the declaration',
      'function a() {}\na();\n',
      [],
    ],
    [
      'a call from inside another function',
      'const b = () => a();\nfunction a() {}\n',
      [],
    ],
    [
      'a declaration never called',
      'function a() {}\n',
      [],
    ],
    [
      'an anonymous default export',
      'export default function () {}\n',
      [],
    ],
    [
      'a nested call above it',
      'f(() => { a(); });\nfunction a() {}\n',
      [],
    ],
  ])('judges %s', (_label, code, expected) => {
    const reports = probe(code);

    expect(reports).toEqual(expected);
  });
});

describe('atReport', () => {
  it('turns a one-based ESLint column into a zero-based loc column', () => {
    const spot = atReport(reportAt('x', 3, 5));

    expect(spot).toBe('3:4');
  });
});

describe('shapesOf', () => {
  it('collects functions, plain promise method calls and namespace destructures by position', () => {
    const code = [
      'import * as ns from "m";',
      'import { a } from "m";',
      'const { x } = ns;',
      'const { y } = a;',
      'const [z] = ns;',
      'p.then(f).catch(g);',
      'p[then](f);',
      'p.other(f);',
      'then(f);',
      'function d() {}',
      'const e = function () {};',
      'const g = () => {};',
    ].join('\n');

    const shapes = shapesOf(parse(code, 'file.js'));

    const found = [
      [...shapes.functions.keys()],
      [...shapes.promiseCalls],
      [...shapes.namespaceDestructures],
    ];

    expect(found).toEqual([
      [
        '10:0',
        '11:10',
        '12:10',
      ],
      ['6:10', '6:2'],
      ['3:6'],
    ]);
  });
});

describe('judge', () => {
  const shapesFor = (code: string): ReturnType<typeof shapesOf> => {
    const shapes = shapesOf(parse(code, 'file.ts'));

    return shapes;
  };

  it.each([
    [
      '@linteljs/prefer-await-to-then',
      1,
      3,
      undefined,
    ],
    [
      '@linteljs/prefer-try-catch',
      1,
      3,
      undefined,
    ],
    [
      '@linteljs/prefer-await-to-then',
      1,
      1,
      '1:0',
    ],
    [
      '@linteljs/no-import-namespace-destructure',
      2,
      7,
      undefined,
    ],
    [
      '@linteljs/no-import-namespace-destructure',
      1,
      3,
      '1:2',
    ],
  ])('holds %s at %i:%i to its shape', (ruleId, line, column, wrongAt) => {
    const shapes = shapesFor('p.then(f);\nconst { x } = ns;\nimport * as ns from "m";\n');

    const result = judge(reportAt(ruleId, line, column), shapes, new Set());

    const expected = wrongAt === undefined
      ? undefined
      : {
          category: 'report shape',
          detail: `report at ${wrongAt} is not the shape the rule claims`,
          rules: [ruleId.replace('@linteljs/', '')],
        };
    expect(result).toEqual(expected);
  });

  it.each([
    [
      'no fix',
      '@linteljs/prefer-arrow-functions',
      { messageId: 'preferArrow' },
    ],
    [
      'another message',
      '@linteljs/prefer-arrow-functions',
      { messageId: 'preferExplicit', fix: FIX },
    ],
    [
      'no rule id',
      null,
      {},
    ],
  ])('passes a report with %s', (_label, ruleId, extra) => {
    const shapes = shapesFor('const a = function () { return this; };\n');

    const result = judge(reportAt(ruleId, 1, 11, extra), shapes, new Set());

    expect(result).toBeUndefined();
  });

  it('flags a conversion reported where no function starts', () => {
    const shapes = shapesFor('a;\n');

    const result = judge(conversionAt(1), shapes, new Set());

    expect(result).toEqual({
      category: 'report shape',
      detail: 'conversion reported at 1:0, which is not a function',
      rules: ['prefer-arrow-functions'],
    });
  });

  it.each([
    ['this', 'function () { return this; }'],
    ['super', 'function () { return super.x; }'],
    ['new.target', 'function () { return new.target; }'],
    ['arguments', 'function () { return arguments; }'],
    ['this', 'function (a = this) { return a; }'],
    ['arguments', 'function () { return () => arguments; }'],
    ['arguments', 'function () { return x[arguments]; }'],
    ['arguments', 'function () { return { [arguments]: 1 }; }'],
  ])('flags a converted function whose body uses %s', (hazard, fn) => {
    const shapes = shapesFor(`const a = ${fn};\n`);

    const result = judge(conversionAt(11), shapes, new Set());

    expect(result).toEqual({
      category: 'CRITICAL: guard leaked',
      detail: `converted a function whose own body uses \`${hazard}\`, which an arrow rebinds`,
      rules: ['prefer-arrow-functions'],
    });
  });

  it.each([
    ['a nested function', 'function () { return function () { return this; }; }'],
    ['a class', 'function () { return class { m() { return this; } }; }'],
    ['a member named arguments', 'function () { return x.arguments; }'],
    ['a key named arguments', 'function () { return { arguments: 1 }; }'],
    ['import.meta', 'function () { return import.meta; }'],
    ['an expression body', 'function () {}'],
  ])('passes a converted function with %s', (_label, fn) => {
    const shapes = shapesFor(`const a = ${fn};\n`);

    const result = judge(conversionAt(11), shapes, new Set());

    expect(result).toBeUndefined();
  });

  it('passes an arrow with an expression body', () => {
    const shapes = shapesFor('const a = () => 1;\n');

    const result = judge(conversionAt(11), shapes, new Set());

    expect(result).toBeUndefined();
  });

  it.each([
    [
      'a declaration the probe flagged',
      'function a() {}\n',
      new Set(['1:0']),
      true,
    ],
    [
      'a declaration the probe passed',
      'function a() {}\n',
      new Set<string>(),
      false,
    ],
    [
      'an expression at a flagged spot',
      'x = function () {};\n',
      new Set(['1:4']),
      false,
    ],
  ])('judges %s', (_label, code, probed, flagged) => {
    const shapes = shapesFor(code);
    const column = code.startsWith('x') ? 5 : 1;

    const result = judge(conversionAt(column), shapes, probed);

    const expected = flagged
      ? {
          category: 'CRITICAL: guard leaked',
          detail: 'converted a declaration called above itself, which a `const` cannot support',
          rules: ['prefer-arrow-functions'],
        }
      : undefined;
    expect(result).toEqual(expected);
  });
});
