import {
  describe,
  expect,
  it,
} from 'vitest';

import { simplifiedOnce } from './simplifyUtils';
import { settled } from './stepUtils';

const simplified = (text: string): string => {
  return settled(text, simplifiedOnce);
};

describe('simplifiedOnce', () => {
  it.each([
    [
      'a member of an object literal',
      'x = ({ a: 1, b: 2 }).b;',
      'x = 2;',
    ],
    [
      'a shorthand member',
      'x = ({ a }).a;',
      'x = a;',
    ],
    [
      'a member the literal lacks',
      'x = ({ a: 1 }).b;',
      'x = undefined;',
    ],
    [
      'a member beside one with an effect, left alone',
      'x = ({ a: f(), b: 2 }).b;',
      'x = ({ a: f(), b: 2 }).b;',
    ],
    [
      'a condition that is true',
      'x = true ? a : b;',
      'x = a;',
    ],
    [
      'a condition that is false',
      'x = (false) ? a : b;',
      'x = b;',
    ],
    [
      'a condition not yet known, left alone',
      'x = c ? a : b;',
      'x = c ? a : b;',
    ],
    [
      'a spread of attributes',
      'x = <a {...{ b: 1, c: \'d\' }} />;',
      'x = <a b={1} c="d" />;',
    ],
    [
      'a shorthand attribute',
      'x = <a {...{ b }} />;',
      'x = <a b={b} />;',
    ],
    [
      'an attribute named by a string',
      'x = <a {...{ \'data-x\': 1 }} />;',
      'x = <a data-x={1} />;',
    ],
    [
      'a string a quoted attribute cannot hold',
      'x = <a {...{ t: \'a"b\' }} />;',
      'x = <a t={\'a"b\'} />;',
    ],
    [
      'a key that is no attribute name, left alone',
      'x = <a {...{ \'1a\': 1 }} />;',
      'x = <a {...{ \'1a\': 1 }} />;',
    ],
    [
      'a method among the members, left alone',
      'x = <a {...{ m() {} }} />;',
      'x = <a {...{ m() {} }} />;',
    ],
    [
      'a spread of nothing',
      'x = <a {...{}} />;',
      'x = <a />;',
    ],
    [
      'a spread of nothing on its own line',
      'x = (\n  <a\n    {...{}}\n  />\n);',
      'x = (\n  <a\n  />\n);',
    ],
    [
      'an attribute that is undefined',
      'x = <a b={undefined} c />;',
      'x = <a c />;',
    ],
    [
      'an undefined attribute over an earlier one, left alone',
      'x = <a b="1" b={undefined} />;',
      'x = <a b="1" b={undefined} />;',
    ],
    [
      'an undefined attribute after a spread, left alone',
      'x = <a {...r} b={undefined} />;',
      'x = <a {...r} b={undefined} />;',
    ],
    [
      'an attribute with no value in braces, left alone',
      'x = <a b={} />;',
      'x = <a b={} />;',
    ],
    [
      'a spread of properties',
      'x = { ...{ a: f(), b }, c };',
      'x = { a: f(), b, c };',
    ],
    [
      'a spread of no properties, the only member',
      'x = { ...{} };',
      'x = {};',
    ],
    [
      'a spread of no properties before another member',
      'x = { ...{}, a: 1 };',
      'x = { a: 1 };',
    ],
    [
      'a spread of no properties before another member, unspaced',
      'x = {...{},a: 1};',
      'x = {a: 1};',
    ],
    [
      'a spread of no properties after another member',
      'x = { a: 1, ...{} };',
      'x = { a: 1 };',
    ],
    [
      'a spread of no properties on its own line',
      'x = {\n  a: 1,\n  ...{},\n  b: 2,\n};',
      'x = {\n  a: 1,\n  b: 2,\n};',
    ],
    [
      'a spread of a literal with a getter, left alone',
      'x = { ...{ get a() { return 1; } } };',
      'x = { ...{ get a() { return 1; } } };',
    ],
    [
      'a spread of a literal that sets its prototype, left alone',
      'x = { ...{ __proto__: p } };',
      'x = { ...{ __proto__: p } };',
    ],
    [
      'a spread of a literal holding a spread',
      'x = { ...{ ...a, b: 1 } };',
      'x = { ...a, b: 1 };',
    ],
    [
      'the last of two members with one name',
      'x = ({ a: 1, a: 2 }).a;',
      'x = 2;',
    ],
    [
      'a missing member every object inherits, left alone',
      'x = ({ a: 1 }).toString;',
      'x = ({ a: 1 }).toString;',
    ],
    [
      'a missing member of a literal that sets its prototype, left alone',
      'x = ({ __proto__: p }).b;',
      'x = ({ __proto__: p }).b;',
    ],
    [
      'a member that is assigned to, left alone',
      '({ a: 1 }).a = 2;',
      '({ a: 1 }).a = 2;',
    ],
    [
      'an attribute spread on its own line, one attribute per line',
      'x = <a\n  {...{ b: 1, c: 2 }}\n/>;',
      'x = <a\n  b={1}\n  c={2}\n/>;',
    ],
    [
      'a fragment among children on one line',
      'x = <ul><><a /><b /></></ul>;',
      'x = <ul><a /><b /></ul>;',
    ],
    [
      'a fragment inside a fragment',
      'x = <><>a</></>;',
      'x = <>a</>;',
    ],
    [
      'a fragment that is not a child, left alone',
      'x = <><a /></>;',
      'x = <><a /></>;',
    ],
    [
      'an empty fragment on its own line',
      'x = (\n  <ul>\n    <></>\n  </ul>\n);',
      'x = (\n  <ul>\n  </ul>\n);',
    ],
    [
      'a one-line fragment on its own line',
      'x = (\n  <ul>\n    <><a /></>\n  </ul>\n);',
      'x = (\n  <ul>\n    <a />\n  </ul>\n);',
    ],
    [
      'a fragment over several lines, its children moved out one level, blank lines kept',
      'x = (\n  <ul>\n    <>\n\n      {/* c */}\n      <a>\n        b\n      </a>\n\n    </>\n  </ul>\n);',
      'x = (\n  <ul>\n\n    {/* c */}\n    <a>\n      b\n    </a>\n\n  </ul>\n);',
    ],
    [
      'a fragment over several lines with nothing in it',
      'x = (\n  <ul>\n    <>\n    </>\n  </ul>\n);',
      'x = (\n  <ul>\n  </ul>\n);',
    ],
    [
      'a fragment that starts on a line it shares',
      'x = <ul><>\n  <a />\n</></ul>;',
      'x = <ul>\n  <a />\n</ul>;',
    ],
    [
      'a spread alone on its line, of a literal over several lines, comments and blank lines kept',
      'x = {\n  a: 1,\n\n  ...{\n    b: {\n      c: 2,\n    },\n\n    // why\n    d: 3,\n  },\n\n  e: 4,\n};',
      'x = {\n  a: 1,\n\n  b: {\n    c: 2,\n  },\n\n  // why\n  d: 3,\n\n  e: 4,\n};',
    ],
    [
      'a spread alone on its line with no comma, of a literal that ends with none',
      'x = {\n  ...{\n    b: 1\n  }\n};',
      'x = {\n  b: 1\n};',
    ],
    [
      'a spread alone on its line with no comma, of a literal that ends with one',
      'x = {\n  ...{\n    b: 1,\n  }\n};',
      'x = {\n  b: 1\n};',
    ],
    [
      'a spread alone on its line, of a literal written on one line',
      'x = {\n  ...{ b: 1, c: 2 },\n};',
      'x = {\n  b: 1, c: 2,\n};',
    ],
    [
      'a spread of no properties between two blank lines',
      'x = {\n  a: 1,\n\n  ...{},\n\n  e: 4,\n};',
      'x = {\n  a: 1,\n\n  e: 4,\n};',
    ],
    [
      'an attribute spread with nothing before it on its line',
      'x = <a\n{...{}} b />;',
      'x = <a\n b />;',
    ],
  ])('rewrites %s', (_name, text, expected) => {
    const written = simplified(text);

    expect(written).toBe(expected);
  });
});
