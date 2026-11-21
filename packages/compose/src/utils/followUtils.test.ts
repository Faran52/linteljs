import ts from 'typescript';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  applied,
  copied,
  type Edit,
  editOf,
  joined,
  plain,
} from './editUtils';
import { Follower } from './followUtils';
import { collect, parse } from './sourceUtils';

// An edit of `text` over the first `old` from `from`, writing `insert`.
const swap = (text: string, old: string, insert: string, from = 0): Edit => {
  const start = text.indexOf(old, from);
  const span = {
    start,
    end: start + old.length,
  };

  const written = plain(insert);

  return editOf(span, written);
};

// An edit of `text` over the first `old`, writing it back between `before` and `after`, carried.
const wrap = (text: string, old: string, before: string, after: string): Edit => {
  const start = text.indexOf(old);
  const span = {
    start,
    end: start + old.length,
  };
  const written = joined([
    plain(before),
    copied(text, span),
    plain(after),
  ]);

  return editOf(span, written);
};

// An edit of `text` from `start` to `end`, writing each part: a string as written, a pair as that span copied.
const rewritten = (text: string, start: number, end: number, parts: readonly (string | [number, number])[]): Edit => {
  const written = parts
    .map((part) => {
      if (typeof part === 'string') {
        return plain(part);
      }

      const [from, to] = part;

      return copied(text, {
        start: from,
        end: to,
      });
    });
  const span = {
    start,
    end,
  };

  const whole = joined(written);

  return editOf(span, whole);
};

const isNode = (node: ts.Node): node is ts.Node => {
  return node.kind !== ts.SyntaxKind.Unknown && node.kind !== ts.SyntaxKind.SourceFile;
};

// The first node of a file whose text is `shown`, from `from` on.
const nodeAt = (file: ts.SourceFile, shown: string, from = 0): ts.Node => {
  const at = file.text.indexOf(shown, from);
  const [found] = collect(file, isNode)
    .filter((candidate) => {
      return candidate.getStart() === at && candidate.getText() === shown;
    });

  if (found === undefined) {
    throw new Error(`No ${shown} at ${String(at)}`);
  }

  return found;
};

// Each identifier from `$` tracked, one edit list applied, and where each tracked one is still followed.
const followed = (before: string, edits: readonly Edit[]): number[] => {
  const follower = new Follower();

  const identifiers = collect(parse(before), ts.isIdentifier);

  for (const identifier of identifiers) {
    if (identifier.text.startsWith('$')) {
      follower.track(identifier);
    }
  }

  follower.follow(before, edits);

  const after = parse(applied(before, edits));

  return collect(after, ts.isIdentifier)
    .filter((identifier) => {
      return follower.has(identifier);
    })
    .map((identifier) => {
      return identifier.getStart();
    });
};

describe('Follower', () => {
  it('follows nothing it was not asked to', () => {
    const follower = new Follower();
    const file = parse('a;');

    follower.follow('a;', []);

    const isFollowed = follower.has(nodeAt(file, 'a'));

    expect(isFollowed).toBe(false);
  });

  it.each([
    [
      'in a text left as it was',
      'f($a, b);',
      [],
      [2],
    ],
    [
      'moved by an insertion before it',
      'f($a);',
      [swap('f($a);', '', 'g(1, 2); ')],
      [11],
    ],
    [
      'moved by a deletion before it',
      'g(1, 2); f($a);',
      [swap('g(1, 2); f($a);', 'g(1, 2); ', '')],
      [2],
    ],
    [
      'reindented',
      'if (x) {\n  f($a);\n}',
      [swap('if (x) {\n  f($a);\n}', '  ', '        ')],
      [19],
    ],
    [
      'with edits right against it on both sides',
      'f(1, $a, 2);',
      [swap('f(1, $a, 2);', '1, ', '3, 4, '), swap('f(1, $a, 2);', ', 2', ', 5')],
      [8],
    ],
    [
      'carried inside an edit that writes round it',
      'f($a);',
      [wrap('f($a);', 'f($a)', 'g(', ', 1)')],
      [4],
    ],
  ])('keeps a token %s', (_name, before, edits, expected) => {
    const found = followed(before, edits);

    expect(found).toStrictEqual(expected);
  });

  it.each([
    [
      'rewritten',
      'f($a);',
      [swap('f($a);', '$a', '$b')],
    ],
    [
      'dropped',
      'f($a, b);',
      [swap('f($a, b);', '$a, ', '')],
    ],
    [
      'written again by the edit over it',
      'f($a);',
      [swap('f($a);', 'f($a)', 'f($a)')],
    ],
    [
      'split by text written inside it',
      'f($ab);',
      [swap('f($ab);', '', ' + ', 4)],
    ],
    [
      'grown by text written right after it',
      'f($a);',
      [swap('f($a);', '', 'b', 4)],
    ],
  ])('stops following a token %s', (_name, before, edits) => {
    const found = followed(before, edits);

    expect(found).toStrictEqual([]);
  });

  it('follows the token itself, never another of its name a diff would pair it with', () => {
    const text = 'f($a); f($a);';
    const follower = new Follower();
    const file = parse(text);
    const [first] = collect(file, ts.isIdentifier)
      .filter((identifier) => {
        return identifier.text === '$a';
      });

    if (first !== undefined) {
      follower.track(first);
    }

    follower.follow(text, [swap(text, 'f($a); ', '')]);

    const after = parse('f($a);');
    const left = nodeAt(after, '$a');
    const isFollowed = follower.has(left);

    expect(isFollowed).toBe(false);
  });

  it('follows a token through two edit lists in turn', () => {
    const first = 'f($a);';
    const middle = 'g(1); f($a);';
    const follower = new Follower();

    const tracked = nodeAt(parse(first), '$a');

    follower.track(tracked);
    follower.follow(first, [swap(first, '', 'g(1); ')]);
    follower.follow(middle, [swap(middle, 'g(1); ', '')]);

    const landed = nodeAt(parse(first), '$a');
    const isFollowed = follower.has(landed);

    expect(isFollowed).toBe(true);
  });
});

// Whether an edit list touched the first node of the text it makes that reads `node`.
const touched = (before: string, edits: readonly Edit[], node: string): boolean => {
  const follower = new Follower();

  follower.follow(before, edits);

  const after = parse(applied(before, edits));

  const found = nodeAt(after, node);

  return follower.isTouched(found);
};

describe('Follower.isTouched', () => {
  it.each([
    [
      'a node an edit wrote',
      'f(a);',
      [swap('f(a);', 'a', 'b')],
      'b',
    ],
    [
      'a node an edit wrote inside',
      'f([a, b]);',
      [swap('f([a, b]);', 'b', 'c')],
      '[a, c]',
    ],
    [
      'a node an edit took a token out of',
      'f([a, b, c]);',
      [swap('f([a, b, c]);', ', b', '')],
      '[a, c]',
    ],
    [
      'a node two edits from one place wrote',
      'f(a);',
      [swap('f(a);', '', 'g', 2), swap('f(a);', 'a', 'b')],
      'gb',
    ],
    [
      'a node holding what an edit wrote',
      'f(a);',
      [swap('f(a);', 'a', 'b')],
      'f(b)',
    ],
    [
      'a node holding a carried one an edit wrote round',
      'x = f(a);',
      [wrap('x = f(a);', 'f(a)', 'g(', ')')],
      'g(f(a))',
    ],
    [
      'a node an edit wrote, listed before an insert where it starts',
      'f(a);',
      [swap('f(a);', 'a', 'b'), swap('f(a);', '', 'g + ', 2)],
      'b',
    ],
    [
      'a node an edit wrote after one that shortened the text',
      'f(ab, c);',
      [swap('f(ab, c);', 'ab', 'x'), swap('f(ab, c);', 'c', 'y')],
      'y',
    ],
    [
      'a node holding the run carried before what an edit took out',
      'f(a, b, c + d);',
      [rewritten('f(a, b, c + d);', 2, 9, [
        [8, 9],
        ', ',
        [2, 3],
      ])],
      'a + d',
    ],
    [
      'a node an edit took a token out of between two runs it carries',
      'f(a, b.c);',
      [rewritten('f(a, b.c);', 2, 8, [[2, 3], [6, 8]])],
      'a.c',
    ],
  ])('answers yes for %s', (_name, before, edits, node) => {
    const isTouched = touched(before, edits, node);

    expect(isTouched).toBe(true);
  });

  it.each([
    [
      'a node left as it was',
      'f([a, b]); g(1);',
      [swap('f([a, b]); g(1);', '1', '2')],
      '[a, b]',
    ],
    [
      'a node a token was taken out beside, not inside',
      'f([a, b], c);',
      [swap('f([a, b], c);', ', c', '')],
      '[a, b]',
    ],
    [
      'a node a token was written beside',
      'f([a, b]);',
      [swap('f([a, b]);', '', ', c', 8)],
      '[a, b]',
    ],
    [
      'a node an edit only reindented inside',
      'f([\n  a,\n]);',
      [swap('f([\n  a,\n]);', '  ', '    ')],
      '[\n    a,\n]',
    ],
    [
      'a node an edit carried whole, writing round it',
      'x = f(a);',
      [wrap('x = f(a);', 'f(a)', 'g(', ')')],
      'f(a)',
    ],
    [
      'a node a token was taken out right before',
      'f(c, [a, b]);',
      [swap('f(c, [a, b]);', 'c, ', '')],
      '[a, b]',
    ],
    [
      'a node made of runs an edit carries twice, one inside the other',
      'f(abc);',
      [rewritten('f(abc);', 2, 5, [[3, 4], [2, 5]])],
      'babc',
    ],
  ])('answers no for %s', (_name, before, edits, node) => {
    const isTouched = touched(before, edits, node);

    expect(isTouched).toBe(false);
  });

  it('marks only what an edit writes and takes out between the runs it carries, in any order', () => {
    const text = 'f(a, b, c);';
    const swapped = joined([
      copied(text, {
        start: 8,
        end: 9,
      }),
      plain(', '),
      copied(text, {
        start: 2,
        end: 3,
      }),
    ]);
    const edit = editOf({
      start: 2,
      end: 9,
    }, swapped);
    const edits = [edit];
    const answers = [
      'c',
      'a',
      'f(c, a)',
    ]
      .map((node) => {
        return touched(text, edits, node);
      });

    expect(answers).toStrictEqual([
      false,
      false,
      true,
    ]);
  });

  it('keeps what an edit wrote touched as later edits move it, carry it, or write round it', () => {
    const first = 'x = a; y = 1;';
    const second = 'x = f(b); y = 1;';
    const third = 'z = 0; x = g(f(b)); y = 1;';
    const follower = new Follower();

    follower.follow(first, [swap(first, 'a', 'f(b)')]);
    follower.follow(second, [swap(second, '', 'z = 0; '), wrap(second, 'f(b)', 'g(', ')')]);

    const file = parse(third);
    const answers = [
      nodeAt(file, 'f(b)'),
      nodeAt(file, 'b'),
      nodeAt(file, 'y = 1;'),
    ]
      .map((node) => {
        return follower.isTouched(node);
      });

    expect(answers).toStrictEqual([
      true,
      true,
      false,
    ]);
  });

  it('keeps where an edit took something out as later edits move it, carry it, or replace round it', () => {
    const first = 'x = [a, b, c];';
    const second = 'x = [a, c];';
    const third = 'q; x = [a, c];';
    const fourth = 'q; x = ([a, c]);';
    const fifth = 'q; x = ([d, c]);';
    const follower = new Follower();

    follower.follow(first, [swap(first, ', b', '')]);
    follower.follow(second, [swap(second, '', 'q; ')]);

    const movedNode = nodeAt(parse(third), '[a, c]');
    const moved = follower.isTouched(movedNode);

    follower.follow(third, [wrap(third, '[a, c]', '(', ')')]);

    const carriedNode = nodeAt(parse(fourth), '[a, c]');
    const carried = follower.isTouched(carriedNode);

    follower.follow(fourth, [swap(fourth, 'a, ', 'd, ')]);

    const replacedNode = nodeAt(parse(fifth), '[d, c]');
    const replaced = follower.isTouched(replacedNode);

    expect([
      moved,
      carried,
      replaced,
    ]).toStrictEqual([
      true,
      true,
      true,
    ]);
  });
});

// Where something was taken out of `before`, then where that lands as `next` is rewritten from `start` to `end`.
const landedOf = (before: string, taken: string, start: number, end: number, parts: [number, number][]): Follower => {
  const follower = new Follower();
  const next = applied(before, [swap(before, taken, '')]);

  follower.follow(before, [swap(before, taken, '')]);
  follower.follow(next, [rewritten(next, start, end, parts)]);

  return follower;
};

// The whitespace an edit writes beside `c`, and the runs a later edit carries to put it inside `d .e`.
const SPACED: [string, string, [number, number][]][] = [
  [
    'after',
    'c ',
    [
      [6, 7],
      [3, 4],
      [7, 9],
      [4, 6],
      [2, 3],
    ],
  ],
  [
    'before',
    ' c',
    [
      [6, 7],
      [2, 3],
      [7, 9],
      [4, 6],
      [3, 4],
    ],
  ],
];

describe('Follower.isTouched, where an edit that carries runs moves a place something was taken out', () => {
  it.each([
    [
      'where one run starts',
      'q(mz.n);',
      true,
    ],
    [
      'where the edit starts',
      'q(zm.n);',
      false,
    ],
    [
      'where the edit ends',
      'q(m.nz);',
      false,
    ],
  ])('keeps it %s inside what it rewrote, or at its edge', (_name, before, expected) => {
    const follower = landedOf(before, 'z', 2, 5, [
      [4, 5],
      [3, 4],
      [2, 3],
    ]);
    const node = nodeAt(parse('q(n.m);'), 'n.m');
    const isTouched = follower.isTouched(node);

    expect(isTouched).toBe(expected);
  });

  it('keeps it with the run that ends there before the run that starts there', () => {
    const follower = landedOf('q(mz.n[k]);', 'z', 2, 8, [
      [2, 3],
      [5, 8],
      [3, 5],
    ]);
    const node = nodeAt(parse('q(m[k].n);'), 'm[k]');
    const isTouched = follower.isTouched(node);

    expect(isTouched).toBe(true);
  });

  it.each(SPACED)('marks none of the whitespace an edit wrote %s what it wrote, wherever a later edit carries it', (
    _side,
    insert,
    parts,
  ) => {
    const first = 'f(a, d.e);';
    const follower = new Follower();
    const second = applied(first, [swap(first, 'a', insert)]);
    const end = second.indexOf(')');

    follower.follow(first, [swap(first, 'a', insert)]);
    follower.follow(second, [rewritten(second, 2, end, parts)]);

    const node = nodeAt(parse('f(d .e, c);'), 'd .e');
    const isTouched = follower.isTouched(node);

    expect(isTouched).toBe(false);
  });

  it('carries no part of what an edit wrote that no run holds', () => {
    const first = 'q(v.n, k);';
    const second = 'q(w.n, k);';
    const follower = new Follower();

    follower.follow(first, [swap(first, 'v', 'w')]);

    follower.follow(second, [rewritten(second, 2, 8, [
      [7, 8],
      [3, 5],
      [5, 7],
      [2, 3],
    ])]);

    const node = nodeAt(parse('q(k.n, w);'), 'k.n');
    const isTouched = follower.isTouched(node);

    expect(isTouched).toBe(false);
  });
});
