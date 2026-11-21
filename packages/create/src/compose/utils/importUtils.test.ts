import {
  describe,
  expect,
  it,
} from 'vitest';

import { sourcesOf } from './bindingUtils';
import { importBlock } from './importUtils';

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

// The block for the imports a text holds, as if the body read the given names.
const blockOf = (imports: readonly string[], read: readonly string[]): string => {
  const { imports: entries } = sourcesOf(`${imports.join('\n')}\n`, {});

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
    const { imports } = sourcesOf('import { b } from \'bee\';\nimport { a } from \'./a\';\n', {});
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
});
