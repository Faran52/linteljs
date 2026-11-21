import ts from 'typescript';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { sourcesOf } from './bindingUtils';
import {
  arrowOf,
  captureCheck,
  exportedValue,
  inlineCall,
  inlineMember,
  inlineValue,
  orderCheck,
  returnedOf,
  substitutions,
} from './callUtils';
import {
  expressionOf,
  parse,
  referencesIn,
} from './sourceUtils';

// The first read of `x` in a body filled from an option module, by the rule its position asks for.
const inlined = (body: string, option: string): string => {
  const sources = sourcesOf(`import { x } from './p';\n\n${body}`, { './p': option });
  const [local] = referencesIn(parse(sources.body), 'x');

  if (local === undefined) {
    throw new Error(`No x in ${body}`);
  }

  const { parent } = local;

  if (ts.isPropertyAccessExpression(parent)) {
    return inlineMember(sources.body, sources, local, parent);
  }

  return ts.isCallExpression(parent)
    ? inlineCall(sources.body, sources, local, parent)
    : inlineValue(sources.body, sources, local);
};

const table = (members: string): string => {
  return `export const x = { ${members} };\n`;
};

describe('inlineMember', () => {
  it.each([
    [
      'y = x.size;',
      table('size: 4'),
      'y = 4;',
    ],
    [
      'y = x.size;',
      'export const x = ({ size: 4 }) satisfies T;\n',
      'y = 4;',
    ],
    [
      'y = x.size;',
      table('size'),
      'y = size;',
    ],
    [
      'y = x.size;',
      table('size: 1, size: 2'),
      'y = 2;',
    ],
    [
      'y = x.size * 2;',
      table('size: 1 + 2'),
      'y = (1 + 2) * 2;',
    ],
    [
      'y = x.double(a + 1);',
      table('double: (n: number) => n * 2'),
      'y = (a + 1) * 2;',
    ],
    [
      'y = x.double(a);',
      table('double: (n: number) => {\n  return n * 2;\n}'),
      'y = a * 2;',
    ],
    [
      'y = x.same(n);',
      table('same: (n: number) => n'),
      'y = n;',
    ],
    [
      'y = x.zero(a);',
      table('zero: () => 0'),
      'y = 0;',
    ],
    [
      'y = x.make();',
      table('make: () => ({ a: 1 })'),
      'y = { a: 1 };',
    ],
    [
      'y = x.wrap(f());',
      table('wrap: (n: number) => [n]'),
      'y = [f()];',
    ],
    [
      'run = () => {\n    return x.table;\n};',
      'export const x = {\n  table: {\n    a: 1,\n  },\n};\n',
      'run = () => {\n    return {\n      a: 1,\n    };\n};',
    ],
    [
      'y = x.make(b);',
      'export const x = {\n  make: (n: number) => ({\n    a: n,\n  }),\n};\n',
      'y = {\n  a: b,\n};',
    ],
    [
      'y = x.same(f());',
      table('same: (n: number) => n'),
      'y = f();',
    ],
    [
      'y = x.pick(f());',
      table('pick: (n: number) => (n ? 1 : 2)'),
      'y = f() ? 1 : 2;',
    ],
    [
      'y = x.both(f());',
      table('both: (n: number) => n && a'),
      'y = f() && a;',
    ],
    [
      'y = x.pair(f(), g());',
      table('pair: (a: number, b: number) => [a, b]'),
      'y = [f(), g()];',
    ],
    [
      'y = x.pair(f(), a);',
      table('pair: (m: number, n: number) => [n, n, m]'),
      'y = [a, a, f()];',
    ],
  ])('fills %s from %j', (body, option, expected) => {
    const written = inlined(body, option);

    expect(written).toBe(expected);
  });

  it.each([
    [
      'y = x.size;',
      'export const x = 4;\n',
      /must be an object literal/u,
    ],
    [
      'y = x.size;',
      'export interface x {}\n',
      /must be an object literal/u,
    ],
    [
      'y = x.gone;',
      table('size: 4'),
      /The option's "x" has no member "gone"/u,
    ],
    [
      'y = x.size;',
      table('size() {}'),
      /has no member "size"/u,
    ],
    [
      'y = x.size;',
      table('\'size\': 1'),
      /has no member "size"/u,
    ],
    [
      'y = x.size();',
      table('size: 4'),
      /A member called here must be an arrow function/u,
    ],
    [
      'y = x.now;',
      table('now: Date.now()'),
      /A member read as a value must have no effect/u,
    ],
    [
      'x.size = 1;',
      table('size: 4'),
      /can be read, never written: x\.size = 1/u,
    ],
    [
      'y = x.twice();',
      table('twice: (n: number) => n + n'),
      /plain name with an argument/u,
    ],
    [
      'y = x.twice(a);',
      table('twice: (n = 1) => n + n'),
      /plain name with an argument/u,
    ],
    [
      'y = x.twice(a);',
      table('twice: (...n: number[]) => n'),
      /plain name with an argument/u,
    ],
    [
      'y = x.twice(a);',
      table('twice: ({ n }: P) => n'),
      /plain name with an argument/u,
    ],
    [
      'y = x.zero(f());',
      table('zero: () => 0'),
      /takes no parameter for must have no effect/u,
    ],
    [
      'y = x.same(...a);',
      table('same: (n: number) => n'),
      /none may be spread/u,
    ],
    [
      'y = x.twice(inner);',
      table('twice: (n: number) => [n].map((inner) => inner + n)'),
      /would capture it/u,
    ],
    [
      'y = x.twice(f());',
      table('twice: (n: number) => n + n'),
      /must be read once, and "n" is read 2 times/u,
    ],
    [
      'y = x.none(f());',
      table('none: (n: number) => 0'),
      /must be read once, and "n" is read 0 times/u,
    ],
    [
      'y = x.later(f());',
      table('later: (n: number) => () => n'),
      /"n" is read later/u,
    ],
    [
      'y = x.later(f());',
      table('later: (n: number) => [() => [n]]'),
      /"n" is read later/u,
    ],
    [
      'y = x.maybe(f());',
      table('maybe: (n: number) => (a ? n : 0)'),
      /"n" is read later/u,
    ],
    [
      'y = x.maybe(f());',
      table('maybe: (n: number) => (a ? 0 : n)'),
      /"n" is read later/u,
    ],
    [
      'y = x.maybe(f());',
      table('maybe: (n: number) => a && n'),
      /"n" is read later/u,
    ],
    [
      'y = x.maybe(f());',
      table('maybe: (n: number) => a || n'),
      /"n" is read later/u,
    ],
    [
      'y = x.maybe(f());',
      table('maybe: (n: number) => a ?? n'),
      /"n" is read later/u,
    ],
    [
      'y = x.pair(f(), g());',
      table('pair: (a: number, b: number) => [b, a]'),
      /read in another order/u,
    ],
    [
      'y = x.again(a);',
      table('again: (n: number) => [1].map((n) => n)'),
      /"n" is bound again inside the option's code/u,
    ],
    [
      'y = x.make();',
      table('make: () => {\n  const a = 1;\n\n  return a;\n}'),
      /must only return one/u,
    ],
    [
      'y = x.make();',
      table('make: () => {\n  return;\n}'),
      /must only return one/u,
    ],
    [
      'y = x.make();',
      table('make: () => {\n}'),
      /must only return one/u,
    ],
  ])('refuses %s from %j', (body, option, message) => {
    const run = (): string => {
      return inlined(body, option);
    };

    expect(run).toThrow(message);
  });
});

describe('inlineCall', () => {
  it('puts the returned expression in place of the call', () => {
    const written = inlined('y = x(1) * 2;', 'export const x = (n: number) => n + 1;\n');

    expect(written).toBe('y = (1 + 1) * 2;');
  });

  it.each([
    ['export const x = 4;\n'],
    ['export const x = function () {\n  return 1;\n};\n'],
    ['export type x = number;\n'],
  ])('refuses %j, which is not an arrow function', (option) => {
    const run = (): string => {
      return inlined('y = x(1);', option);
    };

    expect(run).toThrow(/An option export called or rendered here must be an arrow function: x/u);
  });
});

describe('inlineValue', () => {
  it.each([
    [
      'y = x * 2;',
      'export const x = 1 + 2;\n',
      'y = (1 + 2) * 2;',
    ],
    [
      'y = { x };',
      'export const x = 4;\n',
      'y = { x: 4 };',
    ],
    [
      '{\n    y = x;\n}',
      'export const x = {\n  a: 1,\n};\n',
      '{\n    y = {\n      a: 1,\n    };\n}',
    ],
    [
      'y = x;',
      'export const x = (4 satisfies number);\n',
      'y = 4;',
    ],
  ])('fills %s from %j', (body, option, expected) => {
    const written = inlined(body, option);

    expect(written).toBe(expected);
  });

  it.each([
    ['y = x;', 'export const x = Date.now();\n'],
    ['y = x;', 'export let x: number;\n'],
    ['y = x;', 'export interface x {}\n'],
    ['x = 2;', 'export const x = 1;\n'],
    ['x += 2;', 'export const x = 1;\n'],
  ])('refuses %s from %j', (body, option) => {
    const run = (): string => {
      return inlined(body, option);
    };

    expect(run).toThrow(/must be a constant with no effect, never written/u);
  });
});

describe('exportedValue, arrowOf and returnedOf', () => {
  it('answers no value for a name with no export', () => {
    const sources = sourcesOf('import { x } from \'./p\';\n', { './p': 'export interface x {}\n' });
    const value = exportedValue(sources, 'x');

    expect(value).toBeUndefined();
  });

  it('answers the arrow an export holds, and what it returns', () => {
    const option = 'export const x = () => {\n  return 4;\n};\n';
    const sources = sourcesOf('import { x } from \'./p\';\n\ny = x();\n', { './p': option });
    const [local] = referencesIn(parse(sources.body), 'x');
    const returned = local === undefined ? undefined : returnedOf(arrowOf(sources, local));

    expect(returned?.getText()).toBe('4');
  });
});

describe('captureCheck, orderCheck and substitutions', () => {
  it('lets an argument through that reads nothing the option code binds', () => {
    const inner = expressionOf('[n].map((each) => each + n)');

    const run = (): void => {
      captureCheck(inner, [expressionOf('other.each')]);
    };

    expect(run).not.toThrow();
  });

  it('lets arguments with no effect be read in any order', () => {
    const inner = expressionOf('[b, a]');
    const given = new Map([['a', expressionOf('c')], ['b', expressionOf('d')]]);

    const run = (): void => {
      orderCheck(inner, given);
    };

    expect(run).not.toThrow();
  });

  it('answers one edit per read, each over the read\'s own span', () => {
    const inner = expressionOf('n + n');
    const edits = substitutions(inner, 'n', expressionOf('a * 2'));

    expect(edits).toStrictEqual([
      {
        start: 1,
        end: 2,
        insert: 'a * 2',
      },
      {
        start: 5,
        end: 6,
        insert: 'a * 2',
      },
    ]);
  });
});
