import ts from 'typescript';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  exportOf,
  resolved,
  type Sources,
  sourcesOf,
} from './bindingUtils';
import { parse } from './sourceUtils';

const MODULE = [
  'log();',
  'const hidden = 1;',
  'export function made() {}',
  'export const shown = 1;',
  'export interface Shape {}',
  'export type Alias = number;',
  '',
].join('\n');

describe('exportOf', () => {
  it.each([
    ['shown', true],
    ['Shape', true],
    ['Alias', true],
    ['hidden', false],
    ['made', false],
    ['absent', false],
  ])('answers whether %s is an export it can fill from', (name, expected) => {
    const module = parse(MODULE);
    const found = exportOf(module, name);

    expect(found !== undefined).toBe(expected);
  });
});

describe('sourcesOf', () => {
  it('keeps a base with no imports whole', () => {
    const { body, imports } = sourcesOf('export const a = 1;\n', {}, {}, []);

    expect(body).toBe('export const a = 1;\n');
    expect(imports).toStrictEqual([]);
  });

  it('binds a parameter module\'s names and keeps the other imports', () => {
    const base = 'import def, * as all from \'pkg\';\nimport { x as y } from \'./p\';\n\nexport const a = y;\n';
    const { bindings, imports } = sourcesOf(base, { './p': 'export const x = 1;\n' }, {}, []);
    const [entry] = imports;

    const bound = bindings.get('y');

    expect(bound).toStrictEqual({
      specifier: './p',
      exported: 'x',
    });

    expect(entry?.defaultName).toBe('def');
    expect(entry?.namespaceName).toBe('all');
  });

  it.each([
    ['import * as p from \'./p\';\n'],
    ['import \'./p\';\n'],
  ])('refuses %s of a parameter module', (base) => {
    const run = (): Sources => {
      return sourcesOf(base, { './p': 'export const x = 1;\n' }, {}, []);
    };

    expect(run).toThrow(/import its exports by name/u);
  });
});

describe('sourcesOf, on what a base opens with', () => {
  it('keeps the comments and directives before the imports as the header', () => {
    const base = '// Why.\n\'use client\';\n\nimport { a } from \'pkg\';\n\nexport const b = a;\n';
    const { header, body } = sourcesOf(base, {}, {}, []);

    expect(header).toBe('// Why.\n\'use client\';\n\n');
    expect(body).toBe('export const b = a;\n');
  });

  it.each([
    ['import { a } from \'pkg\';\n// Lost otherwise.\nimport { b } from \'other\';\n'],
    ['import { a } from \'pkg\';\nlog();\nimport { b } from \'other\';\n'],
    ['log();\nimport { a } from \'pkg\';\n'],
    ['const early = 1;\nimport { a } from \'pkg\';\n'],
  ])('refuses %j, which holds more than imports before its last import', (base) => {
    const run = (): Sources => {
      return sourcesOf(base, {}, {}, []);
    };

    expect(run).toThrow(/Only comments and directives may come before a base's imports/u);
  });

  it('notes the names a value import takes as types', () => {
    const { imports } = sourcesOf('import { type A, b, type C as D } from \'pkg\';\n', {}, {}, []);
    const [entry] = imports;
    const typed = entry === undefined ? [] : [...entry.typeNames];

    expect(typed).toStrictEqual(['A', 'D']);
    expect(entry?.isType).toBe(false);
  });

  it('tells a type import and a side-effect import apart', () => {
    const { imports } = sourcesOf('import type { A } from \'pkg\';\nimport \'./side.css\';\n', {}, {}, []);
    const kinds = imports
      .map((entry) => {
        const kind = [entry.isType, entry.isBare];

        return kind;
      });

    expect(kinds).toStrictEqual([[true, false], [false, true]]);
  });

  it('takes one name from one source twice, and refuses it from two', () => {
    const option = 'import { join } from \'node:path\';\n\nexport const x = join;\n';
    const base = 'import { join } from \'node:path\';\nimport { x } from \'./p\';\n';
    const same = sourcesOf(base, { './p': option }, {}, []);

    const run = (): Sources => {
      return sourcesOf('import join from \'other\';\nimport { x } from \'./p\';\n', { './p': option }, {}, []);
    };

    expect(same.imports).toHaveLength(2);
    expect(run).toThrow('"join" is imported from other#join and from node:path#join; one name must have one source.');
  });

  it('refuses a module given both as a parameter module and as one held for proof', () => {
    const run = (): Sources => {
      return sourcesOf('import { x } from \'./p\';\n', { './p': '' }, { './p': '' }, []);
    };

    expect(run).toThrow('./p is given both as a parameter module and as a module held for proof.');
  });

  it('holds a module for proof apart from the parameter modules, binding none of its imports', () => {
    const sources = sourcesOf('export const y = 1;\n', {}, { './h': 'import { a } from \'b\';\n' }, ['./*.styles']);
    const held = [...sources.held.keys()];

    expect(held).toStrictEqual(['./h']);
    expect(sources.imports).toHaveLength(0);
    expect(sources.plainData).toStrictEqual(['./*.styles']);
  });

  it('refuses a default import of a parameter module', () => {
    const run = (): Sources => {
      return sourcesOf('import p from \'./p\';\n', { './p': '' }, {}, []);
    };

    expect(run).toThrow(/import its exports by name/u);
  });
});

describe('resolved, on a parameter binding', () => {
  it('answers the export a binding names', () => {
    const sources = sourcesOf('import { x as y } from \'./p\';\n', { './p': 'export const x = 1;\n' }, {}, []);
    const found = resolved(sources, 'y');
    const isValue = ts.isVariableDeclaration(found);

    expect(isValue).toBe(true);
  });

  it('refuses a binding whose option module lacks the export', () => {
    const sources = sourcesOf('import { x } from \'./p\';\n', { './p': 'export const other = 1;\n' }, {}, []);

    const run = (): ts.Node => {
      return resolved(sources, 'x');
    };

    expect(run).toThrow('"x" has no export in its option module (./p).');
  });
});

describe('resolved', () => {
  it('refuses a name that is no parameter binding', () => {
    const sources = sourcesOf('export const a = 1;\n', {}, {}, []);

    const run = (): ts.Node => {
      return resolved(sources, 'a');
    };

    expect(run).toThrow(/"a" has no export in its option module \(no parameter module\)/u);
  });
});
