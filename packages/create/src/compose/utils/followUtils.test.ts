import {
  describe,
  expect,
  it,
} from 'vitest';

import { Follower } from './followUtils';
import { parse } from './sourceUtils';

// Follows each token of `before` holding a `$` mark through the rewrite to `after`, and answers where each landed.
const landed = (before: string, after: string): (number | undefined)[] => {
  const marks = [...before.matchAll(/\$\w+/gu)];
  const follower = new Follower();

  for (const { index } of marks) {
    follower.track(index);
  }

  follower.follow(parse(before), parse(after));

  return marks
    .map(({ 0: mark }) => {
      const at = after.indexOf(mark);

      return follower.has(at) ? at : undefined;
    });
};

// Every position of a rewritten text still followed.
const followedIn = (before: string, after: string): number[] => {
  const follower = new Follower();

  for (const { index } of before.matchAll(/\$\w+/gu)) {
    follower.track(index);
  }

  follower.follow(parse(before), parse(after));

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
    const follower = new Follower();

    follower.follow(parse('a;'), parse('a;'));

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
    const follower = new Follower();
    const middle = parse('g(1); f($a);');

    follower.track(2);
    follower.follow(parse('f($a);'), middle);
    follower.follow(middle, parse('f($a);'));

    const isFollowed = follower.has(2);

    expect(isFollowed).toBe(true);
  });
});
