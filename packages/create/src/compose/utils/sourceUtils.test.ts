import ts from 'typescript';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { applied, takenOut } from './editUtils';
import {
  collect,
  expressionOf,
  fittingOf,
  indentAt,
  indentOf,
  isConverting,
  isPlainElement,
  isPrimitiveLiteral,
  isPrototype,
  isPure,
  isQuietOperator,
  isReference,
  isValueMember,
  isWithin,
  isWritten,
  keyOf,
  leadingIndent,
  lineEnd,
  linesGone,
  linesOf,
  lineStart,
  memberIn,
  ownsLines,
  parse,
  type Purity,
  referencesIn,
  reindent,
  spanOf,
  textOf,
  unparen,
  valueOf,
  walk,
} from './sourceUtils';

// The node of a host that spells `spelled`, standing in for what a rewrite replaces.
const nodeIn = (host: string, spelled: string): ts.Node => {
  const file = parse(host);
  const [found] = collect(file, ts.isIdentifier)
    .filter((identifier) => {
      return identifier.text === spelled;
    });

  if (found === undefined) {
    throw new Error(`No ${spelled} in ${host}`);
  }

  return found;
};

describe('spanOf and textOf', () => {
  it('answers a node\'s span and text without the space before it', () => {
    const node = nodeIn('  const a = 1;', 'a');

    const span = spanOf(node);
    const text = textOf(node);

    expect(span).toStrictEqual({
      start: 8,
      end: 9,
    });

    expect(text).toBe('a');
  });
});

describe('lineStart and lineEnd', () => {
  it.each([
    [0, 0],
    [4, 3],
    [3, 3],
  ])('answers where the line of position %i starts', (position, expected) => {
    const start = lineStart('ab\ncd', position);

    expect(start).toBe(expected);
  });

  it('answers the end of a line, and of a text with no line break', () => {
    const broken = lineEnd('ab\ncd', 0);
    const whole = lineEnd('ab', 0);

    expect(broken).toBe(2);
    expect(whole).toBe(2);
  });
});

describe('indentAt, indentOf and leadingIndent', () => {
  it.each([
    [
      'a\n  x',
      4,
      '  ',
    ],
    [
      'a\n\t x',
      4,
      '\t ',
    ],
    [
      'a\n  x = y',
      8,
      '  ',
    ],
    [
      'x',
      0,
      '',
    ],
  ])('answers the whitespace the line of %j opens with at %i', (text, position, expected) => {
    const indent = indentAt(text, position);

    expect(indent).toBe(expected);
  });

  it('answers the indentation of a node\'s line', () => {
    const text = '{\n    a;\n}';
    const indent = indentOf(text, nodeIn(text, 'a'));

    expect(indent).toBe('    ');
  });

  it('skips blank lines to the first written one', () => {
    const indent = leadingIndent('\n\n   x');

    expect(indent).toBe('   ');
  });
});

describe('ownsLines and linesOf', () => {
  it.each([
    [
      'a\n  bc  \nd',
      4,
      6,
      true,
    ],
    [
      'a\n  bc; e\nd',
      4,
      6,
      false,
    ],
    [
      'a\nx bc\nd',
      4,
      6,
      false,
    ],
  ])('answers for %j from %i to %i whether the span stands alone', (text, start, end, expected) => {
    const owns = ownsLines(text, {
      start,
      end,
    });

    expect(owns).toBe(expected);
  });

  it('answers whole lines with their break, and stops at the end of the text', () => {
    const middle = linesOf('a\n  bc\nd', {
      start: 4,
      end: 6,
    });
    const last = linesOf('a\nbc', {
      start: 2,
      end: 4,
    });

    expect(middle).toStrictEqual({
      start: 2,
      end: 7,
    });

    expect(last).toStrictEqual({
      start: 2,
      end: 4,
    });
  });
});

describe('linesGone', () => {
  it.each([
    ['a\nb\nc', 'a\nc'],
    ['a\nb\n\nc', 'a\n\nc'],
    ['a\n\nb\n\nc', 'a\n\nc'],
    ['a\n\nb\nc', 'a\n\nc'],
    ['{\n  b\n\nc', '{\nc'],
    ['b\n\nc', 'c'],
    ['a\nb', 'a\n'],
    ['{\nb', '{\n'],
  ])('takes the line of b out of %j, leaving no blank line doubled or first in a block', (text, expected) => {
    const start = text.indexOf('b');
    const gone = linesGone(text, {
      start,
      end: start + 1,
    });
    const written = applied(text, [takenOut(gone)]);

    expect(written).toBe(expected);
  });
});

describe('reindent', () => {
  it('moves each later line, leaving a blank line and one indented otherwise as they are', () => {
    const moved = reindent('a\n\n    b\n c', '    ', '  ');

    expect(moved).toBe('a\n\n  b\n c');
  });

  it('answers an empty text as it is', () => {
    const moved = reindent('', '  ', '');

    expect(moved).toBe('');
  });

  it.each([
    [
      'a template over lines',
      'x = [\n    `a\n    b ${c}\n      d`,\n    e,\n];',
      'x = [\n  `a\n    b ${c}\n      d`,\n  e,\n];',
    ],
    [
      'a template whose later part runs over lines',
      'x = `${a}\n    b ${c}\n    d`\n    + e;',
      'x = `${a}\n    b ${c}\n    d`\n  + e;',
    ],
    [
      'a string continued over lines',
      'x = [\n    \'a\\\n    b\',\n];',
      'x = [\n  \'a\\\n    b\',\n];',
    ],
    [
      'a JSX attribute string over lines',
      '<p\n    title="a\n    b"\n/>',
      '<p\n  title="a\n    b"\n/>',
    ],
  ])('keeps the lines inside %s as written', (_name, block, expected) => {
    const moved = reindent(block, '    ', '  ');

    expect(moved).toBe(expected);
  });
});

describe('unparen and valueOf', () => {
  it('sees through parentheses only', () => {
    const wrapped = expressionOf('((a satisfies T))');
    const inner = unparen(wrapped).getText();

    expect(inner).toBe('a satisfies T');
  });

  it('sees through parentheses and satisfies to the value', () => {
    const wrapped = expressionOf('(({ a: 1 }) satisfies T)');
    const inner = valueOf(wrapped).getText();

    expect(inner).toBe('{ a: 1 }');
  });
});

describe('walk and collect', () => {
  it('visits a node and everything under it, outermost first', () => {
    const kinds: string[] = [];

    walk(expressionOf('a.b'), (node) => {
      kinds.push(textOf(node));
    });

    expect(kinds).toStrictEqual([
      'a.b',
      'a',
      'b',
    ]);
  });
});

describe('isReference and referencesIn', () => {
  it.each([
    ['const { a: b } = c;', ['c']],
    ['x = a.b.c;', ['x', 'a']],
    ['type T = N.M;', ['N']],
    ['x = { a, b: c };', [
      'x',
      'a',
      'c',
    ]],
    ['export { a as b, c };', ['a', 'c']],
    ['x = <label title={title}>{label}</label>;', [
      'x',
      'title',
      'label',
    ]],
    ['x = <Item><br /></Item>;', [
      'x',
      'Item',
      'Item',
    ]],
    ['const f = (p: T): U => p;', [
      'T',
      'U',
      'p',
    ]],
    ['interface I { m: T }', ['T']],
    ['v: for (;;) { if (a) { break v; } continue v; }', ['a']],
  ])('lists the reads of %s', (source, expected) => {
    const file = parse(source);
    const reads = collect(file, ts.isIdentifier)
      .filter(isReference)
      .map(textOf);

    expect(reads).toStrictEqual(expected);
  });

  it('lists the reads of one name', () => {
    const file = parse('const a = b; x = { b: 1, c: b };');
    const reads = referencesIn(file, 'b');

    expect(reads).toHaveLength(2);
  });
});

describe('keyOf, memberIn and isPrototype', () => {
  it.each([
    ['{ a: 1 }', 'a'],
    ['{ \'a\': 1 }', 'a'],
    ['{ 1e3: 1 }', '1000'],
    ['{ [\'a\']: 1 }', 'a'],
    ['{ [`a`]: 1 }', 'a'],
    ['{ [k]: 1 }', undefined],
    ['{ 1n: 1 }', undefined],
    ['{ ...k }', undefined],
    ['{ get a() { return 1; } }', 'a'],
  ])('names the member of %s', (source, expected) => {
    const table = expressionOf(source);
    const [property] = ts.isObjectLiteralExpression(table) ? table.properties : [];
    const key = property === undefined ? 'none' : keyOf(property);

    expect(key).toBe(expected);
  });

  it.each([
    ['{ a: 1, b: 2 }', 'a: 1'],
    ['{ a: 1, a: 2 }', 'a: 2'],
    ['{ a: 1, ...b }', '...b'],
    ['{ a: 1, [k]: 2, b: 3 }', '[k]: 2'],
    ['{ ...b, a: 1, c: 2 }', 'a: 1'],
    ['{ b: 1, \'c\': 2 }', undefined],
  ])('finds what may be the member a of %s', (source, expected) => {
    const table = expressionOf(source);
    const member = ts.isObjectLiteralExpression(table) ? memberIn(table, 'a') : undefined;
    const found = member === undefined ? undefined : textOf(member);

    expect(found).toBe(expected);
  });

  it.each([
    ['{ a: 1 }', true],
    ['{ a }', true],
    ['{ a() {} }', false],
    ['{ ...a }', false],
  ])('tells whether %s holds a value member', (source, expected) => {
    const table = expressionOf(source);
    const [property] = ts.isObjectLiteralExpression(table) ? table.properties : [];
    const isValue = property !== undefined && isValueMember(property);

    expect(isValue).toBe(expected);
  });

  it.each([
    ['{ __proto__: p }', true],
    ['{ \'__proto__\': p }', true],
    ['{ [\'__proto__\']: p }', false],
    ['{ __proto__ }', false],
    ['{ a: p }', false],
  ])('tells whether %s sets the prototype', (source, expected) => {
    const table = expressionOf(source);
    const [property] = ts.isObjectLiteralExpression(table) ? table.properties : [];
    const isSet = property !== undefined && isPrototype(property);

    expect(isSet).toBe(expected);
  });
});

describe('isWithin', () => {
  it('holds a node inside another of its file, and not one of another file', () => {
    const file = parse('const a = [b];\n');
    const other = parse('const a = [b];\n');
    const [inner] = collect(file, ts.isArrayLiteralExpression);
    const [statement] = file.statements;
    const [elsewhere] = other.statements;
    const isInside = inner !== undefined && statement !== undefined && isWithin(inner, statement);
    const isOutside = statement !== undefined && inner !== undefined && isWithin(statement, inner);
    const isForeign = inner !== undefined && elsewhere !== undefined && isWithin(inner, elsewhere);
    const found = [
      isInside,
      isOutside,
      isForeign,
    ];

    expect(found).toStrictEqual([
      true,
      false,
      false,
    ]);
  });
});

const isProven = (): boolean => {
  return true;
};

const isNever = (): boolean => {
  return false;
};

describe('isConverting', () => {
  it.each([
    ['a + b', true],
    ['a == b', true],
    ['a ** b', true],
    ['a && b', false],
    ['a === b', false],
    ['-a', true],
    ['~a', true],
    ['!a', false],
    ['`a${b}`', true],
    ['`a`', false],
    ['a[k]', true],
    ['a.k', false],
  ])('answers for %s with no operand proven', (source, expected) => {
    const expression = expressionOf(source);
    const converting = isConverting(expression, isNever);

    expect(converting).toBe(expected);
  });

  it('answers false for a node whose every converted operand is proven', () => {
    const expression = expressionOf('`${a}${b}`');
    const converting = isConverting(expression, isProven);

    expect(converting).toBe(false);
  });

  it.each([
    ['x = { [k]: 1 };', true],
    ['type T = { [k]: 1 };', false],
  ])('answers for the computed name in %s', (source, expected) => {
    const file = parse(source);
    const names = collect(file, ts.isComputedPropertyName);
    const converting = names
      .some((name) => {
        return isConverting(name, isNever);
      });

    expect(converting).toBe(expected);
  });
});

describe('isPrimitiveLiteral', () => {
  it.each([
    ['1', true],
    ['\'a\'', true],
    ['(true)', true],
    ['null', true],
    ['`a`', true],
    ['1n', false],
    ['a', false],
    ['{}', false],
  ])('answers for %s', (source, expected) => {
    const expression = expressionOf(source);
    const literal = isPrimitiveLiteral(expression);

    expect(literal).toBe(expected);
  });

  it.each([
    '-1',
    '`${1}`',
    '\'a\' + 1',
  ])('takes %s, a conversion of literals, as pure with no proof', (source) => {
    const expression = expressionOf(source);
    const pure = isPure(expression, undefined);

    expect(pure).toBe(true);
  });
});

describe('isQuietOperator', () => {
  it.each([
    [ts.SyntaxKind.PlusToken, true],
    [ts.SyntaxKind.LessThanToken, true],
    [ts.SyntaxKind.InKeyword, false],
    [ts.SyntaxKind.InstanceOfKeyword, false],
    [ts.SyntaxKind.EqualsToken, false],
  ])('answers for operator %i', (operator, expected) => {
    const quiet = isQuietOperator(operator);

    expect(quiet).toBe(expected);
  });
});

describe('isPure', () => {
  it.each([
    ['a.b', true],
    ['c ? 1 : 2', true],
    ['true', true],
    ['false', true],
    ['null', true],
    ['{ a, b: 1 }', true],
    ['a + 1', true],
    ['(a, b)', true],
    ['-a', true],
    ['!a', true],
    ['a[0]', true],
    ['`a${b}c`', true],
    ['`a`', true],
    ['() => f()', true],
    ['(a as T)!', true],
    ['a satisfies T', true],
    ['f()', false],
    ['f().a', false],
    ['a[f()]', false],
    ['f()[0]', false],
    ['`a${f()}`', false],
    ['f() ? 1 : 2', false],
    ['a ? f() : 2', false],
    ['a ? 1 : f()', false],
    ['f() + 1', false],
    ['1 + f()', false],
    ['a = 1', false],
    ['a += 1', false],
    ['++a', false],
    ['--a', false],
    ['-f()', false],
    ['{ [k]: 1 }', false],
    ['{ a() {} }', false],
    ['{ a: f() }', false],
    ['{ ...a }', false],
    ['[a]', false],
    ['a++', false],
    ['a in b', false],
    ['a instanceof B', false],
  ])('answers for %s, every member read and converted operand proven', (source, expected) => {
    const expression = expressionOf(source);
    const purity: Purity = {
      isPlain: isProven,
      isPrimitive: isProven,
    };
    const pure = isPure(expression, purity);

    expect(pure).toBe(expected);
  });

  it.each([
    [
      'a + 1',
      'a 1',
      true,
    ],
    [
      'a + 1',
      '1',
      false,
    ],
    [
      'a < b',
      'a b',
      true,
    ],
    [
      'a < b',
      'a',
      false,
    ],
    [
      '-a',
      'a',
      true,
    ],
    [
      '~a',
      '',
      false,
    ],
    [
      '+a',
      '',
      false,
    ],
    [
      '!a',
      '',
      true,
    ],
    [
      '`a${b}c`',
      'b',
      true,
    ],
    [
      '`a${b}c`',
      '',
      false,
    ],
    [
      'a[k]',
      'k',
      true,
    ],
    [
      'a[k]',
      '',
      false,
    ],
    [
      'a && b',
      '',
      true,
    ],
  ])('takes %s as pure only when each operand it converts is proven, here %j', (source, proven, expected) => {
    const expression = expressionOf(source);
    const primitives = proven.split(' ');
    const purity: Purity = {
      isPlain: isProven,
      isPrimitive: (operand) => {
        const shown = textOf(operand);

        return primitives.includes(shown);
      },
    };
    const pure = isPure(expression, purity);

    expect(pure).toBe(expected);
  });

  it.each([
    [
      'a.b',
      'a.b',
      true,
    ],
    [
      'a.b.c',
      'a.b.c',
      false,
    ],
    [
      'a[0]',
      'a[0]',
      true,
    ],
    [
      'a.b',
      'a.c',
      false,
    ],
  ])('takes %s as pure only when the test proves each member read, here %s', (source, proven, expected) => {
    const expression = expressionOf(source);
    const purity: Purity = {
      isPlain: (read) => {
        return textOf(read) === proven;
      },
      isPrimitive: isProven,
    };
    const pure = isPure(expression, purity);

    expect(pure).toBe(expected);
  });

  it.each([
    'a.b',
    'a[0]',
    'a + 1',
    '`${a}`',
  ])('takes no member read or conversion of a name in %s as pure with no proof', (source) => {
    const expression = expressionOf(source);
    const pure = isPure(expression, undefined);

    expect(pure).toBe(false);
  });
});

describe('isWritten', () => {
  it.each([
    ['A = 1;', true],
    ['A += 1;', true],
    ['A++;', true],
    ['--A;', true],
    ['delete A;', true],
    ['x = A;', false],
    ['x = A + 1;', false],
    ['x = -A;', false],
    ['x = A!;', false],
    ['f(A);', false],
    ['[A] = [2];', true],
    ['({ A } = { A: 3 });', true],
    ['({ a: A } = o);', true],
    ['({ ...A } = o);', true],
    ['[...A] = xs;', true],
    ['[[A]] = xs;', true],
    ['[(A)] = xs;', true],
    ['[A = 1] = xs;', true],
    ['for (A of xs) {}', true],
    ['for (A in o) {}', true],
    ['for ([A] of xs) {}', true],
    ['x = [A];', false],
    ['x = { A };', false],
    ['({ a = A } = o);', false],
    ['({ [A]: a } = o);', false],
    ['[x[A]] = xs;', false],
    ['for (x of A) {}', false],
    ['[A] + [2];', false],
    ['f([A]);', false],
  ])('answers for A in %s', (host, expected) => {
    const node = nodeIn(host, 'A');
    const written = ts.isIdentifier(node) && isWritten(node);

    expect(written).toBe(expected);
  });
});

// An expression's text with what it needs around it to stand in place of `replaced`.
const fittedText = (replaced: ts.Node, expression: ts.Expression): string => {
  const { before, after } = fittingOf(replaced, expression);

  return `${before}${expression.getText()}${after}`;
};

describe('fittingOf', () => {
  it.each([
    [
      'x = !A;',
      'typeof b',
      '(typeof b)',
    ],
    [
      'x = -A;',
      '-1',
      '(-1)',
    ],
    [
      'x = !A;',
      'b.c',
      'b.c',
    ],
    [
      'x = A ?? 1;',
      'b || c',
      '(b || c)',
    ],
    [
      'x = A ?? 1;',
      'b | c',
      'b | c',
    ],
    [
      'x = 1 || A;',
      'b ?? c',
      '(b ?? c)',
    ],
    [
      'x = A.toFixed();',
      '4',
      '(4)',
    ],
    [
      'x = [A];',
      '4',
      '4',
    ],
    [
      'x = A ? 1 : 2;',
      'b ?? c',
      'b ?? c',
    ],
    [
      'x = { A };',
      'b + c',
      'A: b + c',
    ],
    [
      'x = () => A;',
      '{ y: 1 }',
      '({ y: 1 })',
    ],
    [
      'x = () => A;',
      'b ? c : d',
      'b ? c : d',
    ],
    [
      'x = 1 - A;',
      'b - c',
      '(b - c)',
    ],
    [
      'x = A;',
      'function () {}',
      'function () {}',
    ],
    [
      'A;',
      '{}',
      '({})',
    ],
    [
      'x = A;',
      'b ? c : d',
      'b ? c : d',
    ],
    [
      'x = A;',
      'b, c',
      '(b, c)',
    ],
    [
      'x = A.y;',
      'b[0]',
      'b[0]',
    ],
    [
      'x = A satisfies T;',
      'b satisfies U',
      '(b satisfies U)',
    ],
    [
      'x = !A;',
      'b + c',
      '(b + c)',
    ],
    [
      'x = A ? 1 : 2;',
      'b as c',
      'b as c',
    ],
    [
      'x = A ? 1 : 2;',
      'b = c',
      '(b = c)',
    ],
    [
      'x = c ? A : 2;',
      'd ? 1 : 2',
      'd ? 1 : 2',
    ],
    [
      'A = 1;',
      'b ? c : d',
      '(b ? c : d)',
    ],
    [
      'x = A + 1;',
      'b * c',
      'b * c',
    ],
    [
      'x = A * 1;',
      'b + c',
      '(b + c)',
    ],
    [
      'x = A.y;',
      '{ y: 1 }',
      '({ y: 1 })',
    ],
    [
      'x = [A];',
      'b, c',
      '(b, c)',
    ],
    [
      'x = f(A);',
      'b ? c : d',
      'b ? c : d',
    ],
    [
      'x = A(1);',
      '() => 1',
      '(() => 1)',
    ],
    [
      'x = () => A;',
      'b, c',
      '(b, c)',
    ],
    [
      'x = A;',
      'await b',
      'await b',
    ],
    [
      'x = new A();',
      'pick()',
      '(pick())',
    ],
    [
      'x = new A();',
      'a().b',
      '(a().b)',
    ],
    [
      'x = new A();',
      'a.b[0]',
      'a.b[0]',
    ],
    [
      'x = new A();',
      'new B()',
      'new B()',
    ],
    [
      'x = new A();',
      'a?.b',
      '(a?.b)',
    ],
    [
      'x = new B(A);',
      'b + c',
      'b + c',
    ],
    [
      'x = A`t`;',
      'f()',
      'f()',
    ],
    [
      'x = A`t`;',
      'a?.b',
      '(a?.b)',
    ],
    [
      'x = A`t`;',
      'new B',
      '(new B)',
    ],
    [
      'x = A.c;',
      'a?.b',
      '(a?.b)',
    ],
    [
      'x = A();',
      'a?.b()',
      '(a?.b())',
    ],
    [
      'x = A[0];',
      'a?.[0]',
      '(a?.[0])',
    ],
    [
      'x = A!;',
      'a?.b',
      '(a?.b)',
    ],
    [
      'x = A.y;',
      'a++',
      '(a++)',
    ],
    [
      'x = A.y;',
      'new B',
      '(new B)',
    ],
    [
      'x = A.y;',
      'f().g',
      'f().g',
    ],
    [
      'x = A.y;',
      'f()!',
      'f()!',
    ],
    [
      'x = A.y;',
      'b`t`',
      'b`t`',
    ],
    [
      'x = async () => await A;',
      'b + c',
      '(b + c)',
    ],
    [
      'x = async () => await A;',
      '-b',
      '-b',
    ],
    [
      'x = typeof A;',
      'b + c',
      '(b + c)',
    ],
    [
      'x = typeof A;',
      '-b',
      '-b',
    ],
    [
      'x = void A;',
      'b.c',
      'b.c',
    ],
    [
      'x = delete A;',
      'b.c',
      'b.c',
    ],
    [
      'x = delete A;',
      'b ? c : d',
      '(b ? c : d)',
    ],
    [
      'x = [...A];',
      'b, c',
      '(b, c)',
    ],
    [
      'x = [...A];',
      'b ? c : d',
      'b ? c : d',
    ],
    [
      'x = A ** 2;',
      '-1',
      '(-1)',
    ],
    [
      'x = A ** 2;',
      'typeof b',
      '(typeof b)',
    ],
    [
      'x = A ** 2;',
      'a++',
      'a++',
    ],
    [
      'x = A ** 2;',
      'b ** c',
      '(b ** c)',
    ],
    [
      'x = 2 ** A;',
      '-1',
      '-1',
    ],
    [
      'x = `${A}`;',
      'b, c',
      '(b, c)',
    ],
    [
      'x = `${A}`;',
      'b ? c : d',
      'b ? c : d',
    ],
    [
      'class C extends A {}',
      'f()',
      'f()',
    ],
    [
      'class C extends A {}',
      'a?.b',
      'a?.b',
    ],
    [
      'class C extends A {}',
      'b ? c : d',
      '(b ? c : d)',
    ],
    [
      'class C extends A {}',
      '() => 1',
      '(() => 1)',
    ],
  ])('puts %s with %s in place as %s', (host, source, expected) => {
    const replaced = nodeIn(host, 'A');
    const expression = expressionOf(source);
    const written = fittedText(replaced, expression);

    expect(written).toBe(expected);
  });
});

describe('fittingOf, for a yield', () => {
  it('keeps a yield in parentheses where a member is read from it', () => {
    const file = parse('function* g() { x = A.y; yield b; }');
    const [expression] = collect(file, ts.isYieldExpression);
    const [replaced] = referencesIn(file, 'A');
    const written = expression !== undefined && replaced !== undefined && fittedText(replaced, expression);

    expect(written).toBe('(yield b)');
  });

  it.each([
    ['b, c', '(b, c)'],
    ['b ? c : d', 'b ? c : d'],
  ])('puts %s in place of what a yield gives as %s', (source, expected) => {
    const replaced = nodeIn('function* g() { yield A; }', 'A');
    const expression = expressionOf(source);
    const written = fittedText(replaced, expression);

    expect(written).toBe(expected);
  });
});

describe('expressionOf', () => {
  it('answers the expression a text spells', () => {
    const expression = expressionOf(' a + 1 ').getText();

    expect(expression).toBe('a + 1');
  });

  it.each([
    '}',
    'a; b',
    '',
  ])('refuses %j, which is not one expression', (text) => {
    const run = (): ts.Expression => {
      return expressionOf(text);
    };

    expect(run).toThrow(/Not an expression/u);
  });
});

describe('isPlainElement', () => {
  it.each([
    ['a', true],
    ['a: b', false],
    ['...a', false],
    ['a = 1', false],
    ['a: { b }', false],
  ])('answers for the pattern member %s', (member, expected) => {
    const file = parse(`const { ${member} } = x;`);
    const [element] = collect(file, ts.isBindingElement);
    const plain = element !== undefined && isPlainElement(element);

    expect(plain).toBe(expected);
  });
});
