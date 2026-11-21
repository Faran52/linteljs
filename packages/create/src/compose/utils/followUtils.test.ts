import ts from 'typescript';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { Follower } from './followUtils';
import { collect, parse } from './sourceUtils';

// Follows each token of `before` holding a `$` mark through the rewrite to `after`, and answers where each landed.
const landed = (before: string, after: string): (number | undefined)[] => {
  const marks = [...before.matchAll(/\$\w+/gu)];
  const first = parse(before);
  const follower = new Follower(first);

  for (const { index } of marks) {
    follower.track(index);
  }

  follower.follow(first, parse(after));

  return marks
    .map(({ 0: mark }) => {
      const at = after.indexOf(mark);

      return follower.has(at) ? at : undefined;
    });
};

// Every position of a rewritten text still followed.
const followedIn = (before: string, after: string): number[] => {
  const first = parse(before);
  const follower = new Follower(first);

  for (const { index } of before.matchAll(/\$\w+/gu)) {
    follower.track(index);
  }

  follower.follow(first, parse(after));

  const positions = Array.from({ length: after.length }, (_unused, position) => {
    return position;
  });

  return positions
    .filter((position) => {
      return follower.has(position);
    });
};

describe('Follower', () => {
  it('follows nothing it was not asked to', () => {
    const first = parse('a;');
    const follower = new Follower(first);

    follower.follow(first, parse('a;'));

    const isFollowed = follower.has(0);

    expect(isFollowed).toBe(false);
  });

  it.each([
    [
      'in a text left as it was',
      'f($a, b);',
      'f($a, b);',
    ],
    [
      'as the first token',
      '$a(1);',
      '$a(2);',
    ],
    [
      'moved by an insertion before it',
      'f($a);',
      'g(1, 2); f($a);',
    ],
    [
      'moved by a deletion before it',
      'g(1, 2); f($a);',
      'f($a);',
    ],
    [
      'reindented',
      'if (x) {\n  f($a);\n}',
      'if (x) {\n        f($a);\n}',
    ],
    [
      'with edits on both sides',
      'x = 1; f($a); y = 2;',
      'x = [1, 3]; f($a); z = 2;',
    ],
    [
      'between two far edits of one rewrite',
      'f(1); g($a); h(2);',
      'f(10); g($a); h(20);',
    ],
    [
      'when a copy of it is written after it',
      'f($a);',
      'f($a); f(b);',
    ],
    [
      'when tokens like it are dropped round it',
      'f(a, $a, a);',
      'f($a);',
    ],
    [
      'in JSX, before a rewritten element',
      'y = ({ $a }) => <X a={a} />;',
      'y = ({ $a }) => <li />;',
    ],
  ])('keeps a token %s', (_name, before, after) => {
    const found = landed(before, after);
    const expected = [after.indexOf('$a')];

    expect(found).toStrictEqual(expected);
  });

  it.each([
    [
      'rewritten',
      'f($a);',
      'f($b);',
    ],
    [
      'dropped',
      'f($a, b);',
      'f(b);',
    ],
    [
      'rewritten as the first token',
      '$a;',
      'b;',
    ],
  ])('stops following a token %s', (_name, before, after) => {
    const found = followedIn(before, after);

    expect(found).toStrictEqual([]);
  });

  it('follows several tokens through one rewrite, dropping only the one it changed', () => {
    const found = landed('f($a, $b, $c);', 'f($a, $x, $c, d);');
    const expected = [
      2,
      undefined,
      10,
    ];

    expect(found).toStrictEqual(expected);
  });

  it('follows a token through two rewrites in turn', () => {
    const first = parse('f($a);');
    const follower = new Follower(first);
    const middle = parse('g(1); f($a);');

    follower.track(2);
    follower.follow(first, middle);
    follower.follow(middle, parse('f($a);'));

    const isFollowed = follower.has(2);

    expect(isFollowed).toBe(true);
  });
});

// Whether rewriting `before` to `after` touched the first node of `after` whose text is `node`.
const touched = (before: string, after: string, node: string): boolean => {
  const first = parse(before);
  const next = parse(after);
  const follower = new Follower(first);

  follower.follow(first, next);

  const at = after.indexOf(node);
  const [found] = collect(next, isNode)
    .filter((candidate) => {
      return candidate.getStart() === at && candidate.getText() === node;
    });

  return found !== undefined && follower.isTouched(next, found);
};

const isNode = (node: ts.Node): node is ts.Node => {
  return node.kind !== ts.SyntaxKind.Unknown;
};

describe('Follower.isTouched', () => {
  it.each([
    [
      'a node a rewrite wrote',
      'f(a);',
      'f(b);',
      'b',
    ],
    [
      'a node a rewrite wrote inside',
      'f([a, b]);',
      'f([a, c]);',
      '[a, c]',
    ],
    [
      'a node a rewrite dropped a token from between',
      'f([a, b, c]);',
      'f([a, c]);',
      '[a, c]',
    ],
    [
      'a node holding a token a rewrite wrote',
      'f(a);',
      'f(b);',
      'f(b)',
    ],
  ])('answers yes for %s', (_name, before, after, node) => {
    const isTouched = touched(before, after, node);

    expect(isTouched).toBe(true);
  });

  it.each([
    [
      'a node left as it was',
      'f([a, b]); g(1);',
      'f([a, b]); g(2);',
      '[a, b]',
    ],
    [
      'a node a token was dropped beside, not inside',
      'f([a, b], c);',
      'f([a, b]);',
      '[a, b]',
    ],
    [
      'a node a token was written beside',
      'f([a, b]);',
      'f([a, b], c);',
      '[a, b]',
    ],
  ])('answers no for %s', (_name, before, after, node) => {
    const isTouched = touched(before, after, node);

    expect(isTouched).toBe(false);
  });

  it('answers for each node of one text, read once', () => {
    const first = parse('f(a); g(b);');
    const next = parse('f(a); g(c);');
    const follower = new Follower(first);

    follower.follow(first, next);

    const [left, right] = collect(next, ts.isCallExpression);
    const answers = [left, right]
      .map((call) => {
        return call !== undefined && follower.isTouched(next, call);
      });

    expect(answers).toStrictEqual([false, true]);
  });
});
