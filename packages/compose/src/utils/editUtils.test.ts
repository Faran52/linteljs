import ts from 'typescript';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  applied,
  arrayOf,
  copied,
  copyOf,
  type Edit,
  editOf,
  editOver,
  fitted,
  joined,
  patternOf,
  plain,
  refusal,
  reindented,
  sliced,
  takenOut,
  type Written,
  writtenWith,
} from './editUtils';
import {
  collect,
  expressionOf,
  parse,
  referencesIn,
} from './sourceUtils';

const editAt = (start: number, end: number, insert: string): Edit => {
  const span = {
    start,
    end,
  };

  const written = plain(insert);

  return editOf(span, written);
};

// The runs of the edited text a written text carries, each as that text and as what holds it there.
const carriedIn = (text: string, written: Written): string[] => {
  return written.copies
    .map(({
      from,
      to,
      length,
    }) => {
      const source = text.slice(from, from + length);
      const held = written.insert.slice(to, to + length);

      return source === held ? source : `${source}!=${held}`;
    });
};

describe('applied', () => {
  it('applies every edit against the text as it was written', () => {
    const text = applied('abcdef', [editAt(0, 1, 'xx'), editAt(4, 6, 'y')]);

    expect(text).toBe('xxbcdy');
  });

  it('applies edits that only meet, and an insert where another edit ends', () => {
    const text = applied('abcdef', [
      editAt(4, 4, 'z'),
      editAt(0, 2, 'x'),
      editAt(2, 4, 'y'),
    ]);

    expect(text).toBe('xyzef');
  });

  it('writes an insert before the edit that starts where it stands', () => {
    const text = applied('abcdef', [editAt(2, 4, 'y'), editAt(2, 2, 'z')]);

    expect(text).toBe('abzyef');
  });

  it.each([
    [1, 3],
    [2, 2],
    [0, 6],
    [3, 5],
  ])('refuses an edit from %i to %i over another from 1 to 4', (start, end) => {
    const run = (): string => {
      return applied('abcdef', [editAt(1, 4, 'x'), editAt(start, end, 'y')]);
    };

    expect(run).toThrow('Two edits of one text overlap, so neither can be written as it was meant');
  });

  it('writes an insert at either end of the text', () => {
    const text = applied('abc', [editAt(0, 0, 'x'), editAt(3, 3, 'y')]);

    expect(text).toBe('xabcy');
  });

  it.each([
    [-1, 1],
    [2, 1],
    [2, 4],
    [Number.NaN, 1],
    [1, Number.NaN],
  ])('refuses an edit from %d to %d, which is not inside the text', (start, end) => {
    const run = (): string => {
      return applied('abc', [editAt(0, 1, 'x'), editAt(start, end, 'y')]);
    };

    expect(run).toThrow('An edit lies outside the text it edits, so it cannot be written');
  });
});

describe('copied, copyOf, joined and sliced', () => {
  it('carries a span, and a node, of the edited text', () => {
    const text = 'const ab = 1;';
    const [name] = collect(parse(text), ts.isIdentifier);
    const span = copied(text, {
      start: 6,
      end: 8,
    });
    const node = name === undefined ? plain('') : copyOf(name);

    expect(span).toStrictEqual(node);

    expect(span).toStrictEqual({
      insert: 'ab',
      copies: [{
        from: 6,
        to: 0,
        length: 2,
      }],
    });
  });

  it('joins written texts, each copy moved to where its part lands', () => {
    const text = 'abcdef';
    const whole = joined([
      plain('<'),
      copied(text, {
        start: 1,
        end: 3,
      }),
      plain('>'),
      copied(text, {
        start: 4,
        end: 5,
      }),
    ]);
    const runs = carriedIn(text, whole);

    expect(whole.insert).toBe('<bc>e');
    expect(runs).toStrictEqual(['bc', 'e']);
  });

  it('slices a written text, cutting each copy to the slice', () => {
    const text = 'abcdef';
    const whole = joined([
      plain('<'),
      copied(text, {
        start: 0,
        end: 4,
      }),
      copied(text, {
        start: 5,
        end: 6,
      }),
    ]);
    const part = sliced(whole, {
      start: 0,
      end: 3,
    });

    expect(part).toStrictEqual({
      insert: '<ab',
      copies: [{
        from: 0,
        to: 1,
        length: 2,
      }],
    });
  });

  it('slices inside a copy, cutting it at both ends of the slice', () => {
    const text = 'abcdef';
    const whole = copied(text, {
      start: 0,
      end: 6,
    });
    const part = sliced(whole, {
      start: 2,
      end: 4,
    });

    expect(part).toStrictEqual({
      insert: 'cd',
      copies: [{
        from: 2,
        to: 0,
        length: 2,
      }],
    });
  });

  it('slices where a copy ends, carrying none of it', () => {
    const text = 'abcdef';
    const whole = joined([
      copied(text, {
        start: 0,
        end: 4,
      }),
      copied(text, {
        start: 5,
        end: 6,
      }),
    ]);
    const part = sliced(whole, {
      start: 4,
      end: 5,
    });

    expect(part).toStrictEqual({
      insert: 'f',
      copies: [{
        from: 5,
        to: 0,
        length: 1,
      }],
    });
  });
});

describe('editOver and takenOut', () => {
  it('replaces a node of the edited text, and takes a span out', () => {
    const text = 'const ab = 1;';
    const [name] = collect(parse(text), ts.isIdentifier);
    const written = plain('c');
    const over = name === undefined ? [] : [editOver(name, written)];
    const span = {
      start: 10,
      end: 12,
    };
    const edits = [...over, takenOut(span)];
    const result = applied(text, edits);

    expect(result).toBe('const c =;');
  });
});

describe('writtenWith', () => {
  it('carries the copies of the text it edits and of each edit, cutting what an edit replaces', () => {
    const text = 'abcdefgh';
    const base = copied(text, {
      start: 0,
      end: 8,
    });
    const moved = editOf({
      start: 5,
      end: 7,
    }, joined([
      plain('['),
      copied(text, {
        start: 1,
        end: 2,
      }),
      plain(']'),
    ]));
    const written = writtenWith(base, [editAt(2, 4, 'X'), moved]);
    const runs = carriedIn(text, written);

    expect(written.insert).toBe('abXe[b]h');

    expect(runs).toStrictEqual([
      'ab',
      'e',
      'b',
      'h',
    ]);
  });
});

describe('reindented', () => {
  it('moves each line as reindent does, carrying its copies past the indentation it changes', () => {
    const text = 'f(\n    a,\n  b,\n    c);';
    const moved = reindented(copied(text, {
      start: 0,
      end: text.length,
    }), '    ', '  ');
    const runs = carriedIn(text, moved);

    expect(moved.insert).toBe('f(\n  a,\n  b,\n  c);');

    expect(runs).toStrictEqual([
      'f(',
      'a,',
      '  b,',
      'c);',
    ]);
  });
});

describe('fitted', () => {
  it('wraps an expression\'s own text in what its place needs', () => {
    const file = parse('x = A * 2;');
    const [replaced] = referencesIn(file, 'A');
    const expression = expressionOf('b + c');
    const own = copied('b + c', {
      start: 0,
      end: 5,
    });
    const written = replaced === undefined ? plain('') : fitted(replaced, expression, own);

    expect(written).toStrictEqual({
      insert: '(b + c)',
      copies: [{
        from: 0,
        to: 1,
        length: 5,
      }],
    });
  });
});

describe('patternOf', () => {
  it('writes no name as an empty pattern', () => {
    const pattern = patternOf([], '  ');

    expect(pattern.insert).toBe('{}');
  });

  it('keeps up to two names on one line, each carried', () => {
    const text = 'a b';
    const names = [copied(text, {
      start: 0,
      end: 1,
    }), copied(text, {
      start: 2,
      end: 3,
    })];
    const pattern = patternOf(names, '  ');
    const runs = carriedIn(text, pattern);

    expect(pattern.insert).toBe('{ a, b }');
    expect(runs).toStrictEqual(['a', 'b']);
  });

  it('breaks more than two, one per line', () => {
    const names = [
      plain('a'),
      plain('b'),
      plain('c'),
    ];
    const pattern = patternOf(names, '  ');

    expect(pattern.insert).toBe('{\n    a,\n    b,\n    c,\n  }');
  });
});

describe('refusal', () => {
  it('shows the start of the code it is about', () => {
    const long = `call(${'a'.repeat(100)});`;
    const [statement] = collect(parse(long), ts.isExpressionStatement);
    const { message } = refusal(statement ?? parse(''), 'Not allowed');

    expect(message).toBe(`Not allowed: call(${'a'.repeat(75)}`);
  });
});

// The elements of a text's first array, as `arrayOf` writes them.
const arrayIn = (text: string, indent: string): Written => {
  const file = parse(text);
  const [array] = collect(file, ts.isArrayLiteralExpression);

  if (array === undefined) {
    throw new Error(`No array in ${text}`);
  }

  return arrayOf(array.elements, indent);
};

describe('arrayOf', () => {
  it.each([
    ['y = [];', '[]'],
    ['y = [a];', '[a]'],
    ['y = [\n  a,\n  b,\n];', '[a, b]'],
    ['y = [a, b, c];', '[\n      a,\n      b,\n      c,\n    ]'],
    ['y = [\n  {\n    a: 1,\n  },\n];', '[{\n      a: 1,\n    }]'],
    [
      'y = [\n  {\n    a: 1,\n  },\n  b,\n  c,\n];',
      '[\n      {\n        a: 1,\n      },\n      b,\n      c,\n    ]',
    ],
  ])('writes the elements of %j', (text, expected) => {
    const { insert } = arrayIn(text, '    ');

    expect(insert).toBe(expected);
  });

  it('carries each element', () => {
    const text = 'y = [a, b, c];';
    const written = arrayIn(text, '');
    const carried = carriedIn(text, written);

    expect(carried).toStrictEqual([
      'a',
      'b',
      'c',
    ]);
  });
});
