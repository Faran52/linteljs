import {
  describe,
  expect,
  it,
} from 'vitest';

import { sourcesOf, type Trust } from './bindingUtils';
import { importBlock } from './importUtils';

const NO_TRUST: Trust = {
  plainData: [],
  pureCalls: [],
};

const GROUPS = [
  ['^node:'],
  [String.raw`^@?\w`],
  ['^@app(?:/|$)', '^@lib(?:/|$)'],
  ['^@ui(?:/|$)'],
  [String.raw`^\.\.(?!/?$)`, String.raw`^\.\./?$`],
  [String.raw`^\./`],
  [String.raw`^(?!.*[.](?:css|json)$)[^.].*\u0000$`, String.raw`^[.].*\u0000$`],
  [String.raw`^.+\.s?css$`],
];

const TYPE_THING = 'import type { Thing } from \'lib\';';

const VALUE_THING = 'import { Thing } from \'lib\';';

const INLINE_THING = 'import { type Thing, other } from \'lib\';';

// The block for the imports a text holds, as if the body read the given names.
const blockOf = (imports: readonly string[], read: readonly string[]): string => {
  const { imports: entries } = sourcesOf(`${imports.join('\n')}\n`, {}, {}, NO_TRUST);

  const names = new Set(read);

  return importBlock(entries, names, GROUPS);
};

describe('importBlock', () => {
  it('answers nothing when nothing is read', () => {
    const block = blockOf(['import fs, * as all from \'node:fs\';', 'import { a } from \'pkg\';'], []);

    expect(block).toBe('');
  });

  it('places each import in the group whose pattern matches most of it, and orders a group as the sort does', () => {
    const block = blockOf([
      'import \'./polyfill\';',
      'import \'./side.css\';',
      'import type { T } from \'./types\';',
      'import type { R } from \'react\';',
      'import { s } from \'./sibling\';',
      'import { p } from \'../parent\';',
      'import { u } from \'@ui\';',
      'import { uc } from \'@ui/code\';',
      'import { l } from \'@lib/l\';',
      'import { al } from \'@app/alias\';',
      'import { sc } from \'@scope/pkg\';',
      'import { vp } from \'vite-plugin\';',
      'import { v } from \'vite\';',
      'import { B } from \'Bee\';',
      'import { n } from \'node:fs\';',
    ], [
      'T',
      'R',
      's',
      'p',
      'u',
      'uc',
      'l',
      'al',
      'sc',
      'vp',
      'v',
      'B',
      'n',
    ]);
    const expected = [
      'import { n } from \'node:fs\';',
      '',
      'import { sc } from \'@scope/pkg\';',
      'import { B } from \'Bee\';',
      'import { v } from \'vite\';',
      'import { vp } from \'vite-plugin\';',
      '',
      'import { al } from \'@app/alias\';',
      'import { l } from \'@lib/l\';',
      '',
      'import { u } from \'@ui\';',
      'import { uc } from \'@ui/code\';',
      '',
      'import { p } from \'../parent\';',
      '',
      'import { s } from \'./sibling\';',
      '',
      'import type { R } from \'react\';',
      'import type { T } from \'./types\';',
      '',
      'import \'./side.css\';',
      '',
      'import \'./polyfill\';',
    ].join('\n');

    expect(block).toBe(expected);
  });

  it('writes every import as one group when no group is given', () => {
    const { imports } = sourcesOf('import { b } from \'bee\';\nimport { a } from \'./a\';\n', {}, {}, NO_TRUST);
    const block = importBlock(imports, new Set(['a', 'b']), []);

    expect(block).toBe('import { a } from \'./a\';\nimport { b } from \'bee\';');
  });

  it('joins the names two lines take from one module, sorted, and drops what is not read', () => {
    const block = blockOf(['import { b, gone } from \'pkg\';', 'import { c as a } from \'pkg\';'], ['a', 'b']);

    expect(block).toBe('import { c as a, b } from \'pkg\';');
  });

  it('breaks more than two names, one per line, and keeps a name\'s type mark', () => {
    const block = blockOf(['import { c, type B, a, type Gone } from \'pkg\';'], [
      'a',
      'B',
      'c',
    ]);

    expect(block).toBe('import {\n  a,\n  type B,\n  c,\n} from \'pkg\';');
  });

  it('writes a default and a namespace import, each only when read', () => {
    const lines = ['import fs, * as all from \'node:fs\';', 'import def, { a } from \'pkg\';'];
    const both = blockOf(lines, [
      'fs',
      'all',
      'def',
      'a',
    ]);
    const one = blockOf(lines, ['all', 'a']);

    expect(both).toBe('import fs, * as all from \'node:fs\';\n\nimport def, { a } from \'pkg\';');
    expect(one).toBe('import * as all from \'node:fs\';\n\nimport { a } from \'pkg\';');
  });

  it('keeps a namespace import apart from the names taken from the same module', () => {
    const block = blockOf(['import * as all from \'pkg\';', 'import { a } from \'pkg\';'], ['all', 'a']);

    expect(block).toBe('import * as all from \'pkg\';\nimport { a } from \'pkg\';');
  });

  it('keeps a type import apart from a value import of the same module', () => {
    const block = blockOf(['import { a } from \'pkg\';', 'import type { T } from \'pkg\';'], ['a', 'T']);

    expect(block).toBe('import { a } from \'pkg\';\n\nimport type { T } from \'pkg\';');
  });

  it.each([
    [
      'default',
      'import React from \'react\';',
      'import R from \'react\';',
    ],
    [
      'namespace',
      'import * as React from \'react\';',
      'import * as R from \'react\';',
    ],
  ])('refuses a module imported whole, as a %s, under two names the body reads', (_kind, base, option) => {
    const run = (): string => {
      return blockOf([base, option], ['React', 'R']);
    };

    expect(run).toThrow('react is imported whole as "React" and as "R"; import it under one name.');
  });

  it.each([
    [
      'numbers by their value',
      ['./a10', './a9'],
      ['./a9', './a10'],
    ],
    [
      '`.` and `/` before `_` and `-`',
      [
        'lib-a',
        'lib/a',
        'lib_a',
        'lib.a',
      ],
      [
        'lib.a',
        'lib/a',
        'lib_a',
        'lib-a',
      ],
    ],
    [
      'a capital before the same letter small, when it comes first',
      ['./A', './a'],
      ['./A', './a'],
    ],
  ])('orders %s, as the sort does', (_order, specifiers, expected) => {
    const lines = specifiers
      .map((specifier, index) => {
        return `import { n${String(index)} } from '${specifier}';`;
      });
    const block = blockOf(lines, [
      'n0',
      'n1',
      'n2',
      'n3',
    ]);
    const order = block
      .split('\n')
      .map((line) => {
        const from = line.indexOf('\'') + 1;
        const to = line.lastIndexOf('\'');

        return line.slice(from, to);
      });

    expect(order).toStrictEqual(expected);
  });

  it('writes a module imported whole under one name by two files once, beside a type import of it', () => {
    const block = blockOf([
      'import * as stylex from \'@stylexjs/stylex\';',
      'import * as stylex from \'@stylexjs/stylex\';',
      'import type { StyleXStyles } from \'@stylexjs/stylex\';',
    ], ['stylex', 'StyleXStyles']);

    const expected = [
      'import * as stylex from \'@stylexjs/stylex\';',
      '',
      'import type { StyleXStyles } from \'@stylexjs/stylex\';',
    ].join('\n');

    expect(block).toBe(expected);
  });

  it.each([
    ['a type import and a value import', [TYPE_THING, VALUE_THING]],
    ['a value import and a type import', [VALUE_THING, TYPE_THING]],
    ['an inline type and a value import', [INLINE_THING, VALUE_THING]],
    ['a value import and an inline type', [VALUE_THING, INLINE_THING]],
  ])('writes a name that %s both bind as a value only', (_name, lines) => {
    const block = blockOf(lines, ['Thing', 'other']);
    const expected = lines
      .some((line) => {
        return line.includes('other');
      })
      ? 'import { other, Thing } from \'lib\';'
      : 'import { Thing } from \'lib\';';

    expect(block).toBe(expected);
  });

  it('writes a default a type import and a value import both bind as a value only', () => {
    const block = blockOf(['import type Thing from \'lib\';', 'import Thing from \'lib\';'], ['Thing']);

    expect(block).toBe('import Thing from \'lib\';');
  });

  it('writes a name a type import and an inline type both bind in the type import only', () => {
    const block = blockOf(['import { type Thing, other } from \'lib\';', 'import type { Thing } from \'lib\';'], [
      'Thing',
      'other',
    ]);

    expect(block).toBe('import { other } from \'lib\';\n\nimport type { Thing } from \'lib\';');
  });

  it('keeps an import\'s attributes, apart from an import of the same module without them', () => {
    const block = blockOf([
      'import data from \'./data.json\' with { type: \'json\' };',
      'import { raw } from \'./data.json\';',
      'import \'./side.css\' with { type: \'css\' };',
    ], ['data', 'raw']);
    const expected = [
      'import data from \'./data.json\' with { type: \'json\' };',
      'import { raw } from \'./data.json\';',
      '',
      'import \'./side.css\' with { type: \'css\' };',
    ].join('\n');

    expect(block).toBe(expected);
  });
});
