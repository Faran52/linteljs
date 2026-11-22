import ts from 'typescript';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { FUNCTION_KINDS } from '../constants';

import { sourcesOf } from './bindingUtils';
import { editOf, plain } from './editUtils';
import { Follower } from './followUtils';
import { prunedOnce, trackRead } from './pruneUtils';
import { scopeOf } from './scopeUtils';
import {
  collect,
  parse,
  type Span,
} from './sourceUtils';
import { settled } from './stepUtils';

// What pruning leaves of a body once a stand-in for filling has written `to` over the last `from`.
const prunedAfter = (base: string, from: string, to: string, options: Record<string, string> = {}): string => {
  const sources = sourcesOf(base, options, {}, {
    plainData: [],
    pureCalls: [],
  });
  const start = parse(sources.body);
  const checker = scopeOf(start, sources.modules, sources.held);
  const follower = new Follower();

  trackRead(start, checker, follower);

  const at = start.text.lastIndexOf(from);
  const span: Span = {
    start: at,
    end: at + from.length,
  };
  let isFilled = false;
  const filled = settled(start, () => {
    const written = plain(to);
    const edits = isFilled ? undefined : [editOf(span, written)];

    isFilled = true;

    return edits;
  }, follower.follow);
  const pruned = settled(filled, prunedOnce(follower, sources), follower.follow);

  return pruned.text;
};

const PICK = 'export const f = () => ({ a: 1 });\n';

describe('prunedOnce, on destructured parameters', () => {
  it.each([
    [
      'function f({ a, b }) {\n  return use(a, b);\n}\n',
      'b)',
      '1)',
      'function f({ a }) {\n  return use(a, 1);\n}\n',
    ],
    [
      'class C {\n  m({ a, b }) {\n    return use(a, b);\n  }\n}\n',
      'b)',
      '1)',
      'class C {\n  m({ a }) {\n    return use(a, 1);\n  }\n}\n',
    ],
    [
      'const g = function ({ a, b }) {\n  return use(a, b);\n};\n',
      'b)',
      '1)',
      'const g = function ({ a }) {\n  return use(a, 1);\n};\n',
    ],
    [
      'const g = ({ a: { b, c } }) => use(b, c);\n',
      'c)',
      '1)',
      'const g = ({ a: { b } }) => use(b, 1);\n',
    ],
    [
      'const g = ({ a: { b }, d }) => use(b, d);\n',
      'b,',
      '1,',
      'const g = ({ d }) => use(1, d);\n',
    ],
    [
      'const g = ({ a: { b } = {} }) => use(b);\n',
      'b)',
      '1)',
      'const g = ({}) => use(1);\n',
    ],
    [
      'const g = ({ a: x, b }) => use(x, b);\n',
      'x,',
      '1,',
      'const g = ({ b }) => use(1, b);\n',
    ],
    [
      'const g = ({ a = 1, b }) => use(a, b);\n',
      'a,',
      '1,',
      'const g = ({ b }) => use(1, b);\n',
    ],
    [
      'const g = ({ \'a\': x, 1: y }) => use(x, y);\n',
      'x,',
      '1,',
      'const g = ({ 1: y }) => use(1, y);\n',
    ],
    [
      'const g = ({ 1: y, b }) => use(y, b);\n',
      'y,',
      '1,',
      'const g = ({ b }) => use(1, b);\n',
    ],
    [
      'const g = ({ a, b }, c) => use(a, b, c);\n',
      'a,',
      '1,',
      'const g = ({ b }, c) => use(1, b, c);\n',
    ],
    [
      'const g = ({ a }, c) => use(a, c);\n',
      'a,',
      '1,',
      'const g = ({}, c) => use(1, c);\n',
    ],
    [
      'class C {\n  set v({ a }) {\n    use(a);\n  }\n}\n',
      'a)',
      '1)',
      'class C {\n  set v({}) {\n    use(1);\n  }\n}\n',
    ],
  ])('drops what filling made unread in %j', (base, from, to, expected) => {
    const pruned = prunedAfter(base, from, to);

    expect(pruned).toBe(expected);
  });

  it.each([
    [
      'const g = ({ a, b }) => use(b);\n',
      'b)',
      'const g = ({ a }) => use(1);\n',
    ],
    [
      'const g = ({ a, ...r }) => use(a, r);\n',
      'a,',
      'const g = ({ a, ...r }) => use(1, r);\n',
    ],
    [
      'const g = ({ a = f() }, x) => use(a, x);\n',
      'a,',
      'const g = ({ a = f() }, x) => use(1, x);\n',
    ],
    [
      'const g = ({ [k]: a, b }) => use(a, b);\n',
      'a,',
      'const g = ({ [k]: a, b }) => use(1, b);\n',
    ],
    [
      'const g = ({ a: { b } = f() }) => use(b);\n',
      'b)',
      'const g = ({ a: {} = f() }) => use(1);\n',
    ],
    [
      'const g = ({ a } = f()) => use(a);\n',
      'a)',
      'const g = ({} = f()) => use(1);\n',
    ],
    [
      'const g = ([a, b]) => use(a, b);\n',
      'b)',
      'const g = ([a, b]) => use(a, 1);\n',
    ],
  ])('keeps what is unread in the base, or not proven, in %j', (base, from, expected) => {
    const pruned = prunedAfter(base, from, from.replace(/^\w+/u, '1'));

    expect(pruned).toBe(expected);
  });
});

// How many parameters the first function in a text declares, its `length` when none has a default or a rest.
const arityOf = (text: string): number | undefined => {
  const owners = collect(parse(text), (node): node is ts.FunctionLikeDeclaration => {
    return FUNCTION_KINDS.has(node.kind);
  });

  return owners.at(0)?.parameters.length;
};

describe('prunedOnce, on whole parameters', () => {
  it.each([
    [
      'const g = (a, b) => use(a, b);\n',
      'use(a, b)',
      'use(a, 1)',
    ],
    [
      'const g = (a, b) => use(a, b);\n',
      'use(a, b)',
      'use(1, b)',
    ],
    [
      'const g = (a, b = 1) => use(a, b);\n',
      'use(a, b)',
      'use(a, 1)',
    ],
    [
      'const g = (a, b = f()) => use(a, b);\n',
      'use(a, b)',
      'use(a, 1)',
    ],
    [
      'const g = (a, ...b) => use(a, b);\n',
      'use(a, b)',
      'use(a, 1)',
    ],
    [
      'function f(a: number): void;\nfunction f(a: number) {\n  use(a);\n}\n',
      'use(a)',
      'use(1)',
    ],
    [
      'class C {\n  constructor(private b) {\n    use(b);\n  }\n}\n',
      'use(b)',
      'use(1)',
    ],
    [
      'class C {\n  set v(b) {\n    use(b);\n  }\n}\n',
      'use(b)',
      'use(1)',
    ],
  ])('keeps every one filling made unread, in %j', (base, from, to) => {
    const pruned = prunedAfter(base, from, to);
    const expected = base.replace(from, to);

    expect(pruned).toBe(expected);
  });

  it.each([
    [
      'function f(a) {\n  use(a);\n}\n',
      'function f(a) {\n  use(1);\n}\n',
    ],
    [
      'function f({ a }) {\n  use(a);\n}\n',
      'function f({}) {\n  use(1);\n}\n',
    ],
    [
      'class C {\n  m(a) {\n    use(a);\n  }\n}\n',
      'class C {\n  m(a) {\n    use(1);\n  }\n}\n',
    ],
    [
      'class C {\n  m({ a }) {\n    use(a);\n  }\n}\n',
      'class C {\n  m({}) {\n    use(1);\n  }\n}\n',
    ],
    [
      'const g = a => use(a);\n',
      'const g = a => use(1);\n',
    ],
    [
      'const g = ({ a }) => use(a);\n',
      'const g = ({}) => use(1);\n',
    ],
    [
      'const g = async a => use(a);\n',
      'const g = async a => use(1);\n',
    ],
    [
      'const g = async ({ a }) => use(a);\n',
      'const g = async ({}) => use(1);\n',
    ],
  ])('keeps the arity of %j', (base, expected) => {
    const pruned = prunedAfter(base, 'a)', '1)');
    const arity = arityOf(pruned);

    expect(pruned).toBe(expected);
    expect(arity).toBe(1);
  });

  it('keeps one the base leaves unread', () => {
    const pruned = prunedAfter('const g = (a) => use(x);\n', 'x', '1');

    expect(pruned).toBe('const g = (a) => use(1);\n');
  });
});

describe('prunedOnce, on const and let declarations', () => {
  it.each([
    [
      'const y = 1;\nuse(y);\n',
      'y)',
      'use(1);\n',
    ],
    [
      'let y = { a: 1 };\nuse(y);\n',
      'y)',
      'use(1);\n',
    ],
    [
      'const a = 1, y = 2;\nuse(a, y);\n',
      'y)',
      'const a = 1;\nuse(a, 1);\n',
    ],
    [
      'const y = 1, b = 2;\nuse(y, b);\n',
      'y,',
      'const b = 2;\nuse(1, b);\n',
    ],
    [
      'switch (k) {\n  case 1:\n    const y = 1;\n    use(y);\n}\n',
      'y)',
      'switch (k) {\n  case 1:\n    use(1);\n}\n',
    ],
    [
      'f(() => {\n  const y = k;\n  use(y);\n});\n',
      'y)',
      'f(() => {\n  use(1);\n});\n',
    ],
  ])('drops one filling made unread whose value is pure, in %j', (base, from, expected) => {
    const pruned = prunedAfter(base, from, from.replace('y', '1'));

    expect(pruned).toBe(expected);
  });

  it.each([
    ['const y = f();\nuse(y);\n', 'const y = f();\nuse(1);\n'],
    ['export const y = 1;\nuse(y);\n', 'export const y = 1;\nuse(1);\n'],
    ['var y = 1;\nuse(y);\n', 'var y = 1;\nuse(1);\n'],
    ['{\n  using y = r;\n  use(y);\n}\n', '{\n  using y = r;\n  use(1);\n}\n'],
    ['// why\nconst y = 1;\nuse(y);\n', '// why\nconst y = 1;\nuse(1);\n'],
    ['let y = 1;\ny = 2;\nuse(y);\n', 'let y = 1;\ny = 2;\nuse(1);\n'],
    ['const y = 1; use(y);\n', 'const y = 1; use(1);\n'],
    [
      'switch (k) {\n  case 1:\n    use(y);\n    break;\n  case 2:\n    const y = 1;\n    use(y);\n}\n',
      'switch (k) {\n  case 1:\n    use(y);\n    break;\n  case 2:\n    const y = 1;\n    use(1);\n}\n',
    ],
    ['const z = 2;\nconst y = 1;\nuse(y);\n', 'const z = 2;\nuse(1);\n'],
  ])('keeps one not proven pure, exported, var or using, under a comment, written, on a shared line or unread: %j', (
    base,
    expected,
  ) => {
    const pruned = prunedAfter(base, 'use(y)', 'use(1)');

    expect(pruned).toBe(expected);
  });

  it('drops a value only another dropped one read', () => {
    const pruned = prunedAfter('const t = { a: 1 };\nconst { a } = t;\nuse(a);\n', 'a)', '1)');

    expect(pruned).toBe('use(1);\n');
  });
});

describe('prunedOnce, on destructured declarations', () => {
  it.each([
    [
      'const t = { a: 1, b: 2 };\nconst { a, b } = t;\nuse(a, b);\n',
      'b)',
      'const t = { a: 1, b: 2 };\nconst { a } = t;\nuse(a, 1);\n',
    ],
    [
      'const t = { a: { b: 1, c: 2 } };\nconst { a: { b, c } } = t;\nuse(b, c);\n',
      'c)',
      'const t = { a: { b: 1, c: 2 } };\nconst { a: { b } } = t;\nuse(b, 1);\n',
    ],
  ])('drops a member proven a plain property, in %j', (base, from, expected) => {
    const pruned = prunedAfter(base, from, '1)');

    expect(pruned).toBe(expected);
  });

  it.each([
    'const { a, b } = u;\nuse(a, b);\n',
    'const t = { a: { b: 1 } };\nconst { a: { b } = {} } = t;\nuse(a, b);\n',
    'const [a, b] = t;\nuse(a, b);\n',
    'const t = { a: u };\nconst { a: { a, b } } = t;\nuse(a, b);\n',
    'const { [k]: a, b } = t;\nuse(a, b);\n',
  ])('keeps a member not proven a plain property, in %j', (base) => {
    const pruned = prunedAfter(base, 'b)', '1)');
    const expected = base.replace('use(a, b)', 'use(a, 1)');

    expect(pruned).toBe(expected);
  });

  it('keeps a pattern whole when pruning would empty it and its value is not pure', () => {
    const base = 'import { f } from \'./p\';\n\nconst { a } = f();\nuse(a);\n';
    const pruned = prunedAfter(base, 'a)', '1)', { './p': PICK });

    expect(pruned).toBe('const { a } = f();\nuse(1);\n');
  });
});
