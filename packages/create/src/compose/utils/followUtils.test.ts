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
