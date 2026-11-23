import ts from 'typescript';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  exportOf,
  exportsOf,
  resolved,
  type Sources,
  sourcesOf,
  type Trust,
} from './bindingUtils';
import { parse } from './sourceUtils';

const NO_TRUST: Trust = {
  plainData: [],
  pureCalls: [],
};

const MODULE = [
  'log();',
  'const hidden = 1;',
  'export function made() {}',
  'export const shown = 1;',
  'export interface Shape {}',
  'export type Alias = number;',
  'export class Made {}',
  'export default class Whole {}',
  'class Own {}',
  '',
].join('\n');

describe('exportOf', () => {
  it.each([
    ['shown', true],
    ['Shape', true],
    ['Alias', true],
    ['Made', true],
    ['Whole', false],
    ['Own', false],
    ['hidden', false],
    ['made', false],
    ['absent', false],
  ])('answers whether %s is an export it can fill from', (name, expected) => {
    const module = parse(MODULE);
    const found = exportOf(module, name);

    expect(found !== undefined).toBe(expected);
  });
});

describe('exportsOf', () => {
  it('answers every value, type and class a module exports by name, in order', () => {
    const module = parse(MODULE);
    const names = exportsOf(module)
      .map((declaration) => {
        return declaration.name.getText();
      });

    expect(names).toStrictEqual([
      'shown',
      'Shape',
      'Alias',
      'Made',
    ]);
  });
});

describe('sourcesOf', () => {
  it('keeps a base with no imports whole', () => {
    const { body, imports } = sourcesOf('export const a = 1;\n', {}, {}, NO_TRUST);

    expect(body).toBe('export const a = 1;\n');
    expect(imports).toStrictEqual([]);
  });

  it('binds a parameter module\'s names and keeps the other imports', () => {
    const base = 'import def, * as all from \'pkg\';\nimport { x as y } from \'./p\';\n\nexport const a = y;\n';
    const { bindings, imports } = sourcesOf(base, { './p': 'export const x = 1;\n' }, {}, NO_TRUST);
    const [entry] = imports;

    const bound = bindings.get('y');

    expect(bound).toStrictEqual({
      specifier: './p',
      exported: 'x',
    });

    expect(entry?.defaultName).toBe('def');
    expect(entry?.namespaceName).toBe('all');
  });

  it('keeps an import\'s attributes as written, and none for an import without them', () => {
    const base = 'import data from \'./data.json\' with { type: \'json\' };\nimport { a } from \'pkg\';\n';
    const { imports } = sourcesOf(base, {}, {}, NO_TRUST);
    const attributes = imports
      .map((entry) => {
        return entry.attributes;
      });

    expect(attributes).toStrictEqual(['with { type: \'json\' }', undefined]);
  });

  it.each([
    ['import * as p from \'./p\';\n'],
    ['import p from \'./p\';\n'],
  ])('refuses %s of a parameter module', (base) => {
    const run = (): Sources => {
      return sourcesOf(base, { './p': 'export const x = 1;\n' }, {}, NO_TRUST);
    };

    expect(run).toThrow(/import its exports by name/u);
  });
});

describe('sourcesOf, on side-effect imports', () => {
  it('takes a bare import of a parameter module from the base, which binds nothing and is not printed', () => {
    const option = 'import \'./side.css\';\n';
    const { bindings, imports } = sourcesOf('import \'./p\';\n\nlog();\n', { './p': option }, {}, NO_TRUST);
    const specifiers = imports
      .map((entry) => {
        return entry.specifier;
      });

    expect(bindings.size).toBe(0);
    expect(specifiers).toStrictEqual(['./side.css']);
  });

  it('refuses a bare import of a parameter module from an option', () => {
    const options = {
      './p': 'import \'./q\';\n',
      './q': '',
    };

    const run = (): Sources => {
      return sourcesOf('import \'./p\';\n', options, {}, NO_TRUST);
    };

    expect(run).toThrow('./q is a parameter module; import its exports by name.');
  });

  it.each([
    ['// Why.\nimport \'./side.css\';\n', '// Why.'],
    ['import \'./side.css\';\n', undefined],
    ['import \'./side.css\'; // Not above.\n', undefined],
    ['import { a } from \'pkg\'; // Its own.\n// Why.\n/* And. */\nimport \'./side.css\';\n', '// Why.\n/* And. */'],
    ['// Why.\nimport { a } from \'./side.css\';\n', undefined],
  ])('keeps the comment above a side-effect import of the option %j', (option, expected) => {
    const { imports } = sourcesOf('import \'./p\';\n', { './p': option }, {}, NO_TRUST);
    const entry = imports.at(-1);

    expect(entry?.specifier).toBe('./side.css');
    expect(entry?.comment).toBe(expected);
  });

  it('takes a comment above a base\'s side-effect import as the header alone', () => {
    const { header, imports } = sourcesOf('// Why.\nimport \'./side.css\';\n', {}, {}, NO_TRUST);
    const [entry] = imports;

    expect(header).toBe('// Why.\n');
    expect(entry?.comment).toBeUndefined();
  });
});

const RINGS: [string, Record<string, string>, string][] = [
  [
    'two modules that import each other',
    {
      './p': 'import { b } from \'./q\';\nexport const a = { x: b, y: b };\n',
      './q': 'import { a } from \'./p\';\nexport const b = { x: a, y: a };\n',
    },
    './p -> ./q -> ./p',
  ],
  [
    'a module that imports itself',
    { './p': 'import { a } from \'./p\';\nexport const b = a;\nexport const a = 1;\n' },
    './p -> ./p',
  ],
  [
    'a ring that does not pass the first module',
    {
      './p': 'import { b } from \'./q\';\nexport const a = b;\n',
      './q': 'import { c } from \'./r\';\nexport const b = c;\n',
      './r': 'import type { T } from \'./q\';\nexport const c: T = 1;\n',
    },
    './q -> ./r -> ./q',
  ],
];

const CHAINS: [string, Record<string, string>][] = [
  [
    'a chain to a shared module',
    {
      './router': 'import { sx } from \'./styling\';\nexport const r = sx;\n',
      './styling': 'import type { Sx } from \'./ports\';\nexport const sx: Sx = 1;\n',
    },
  ],
  [
    'two chains that meet',
    {
      './p': 'import { b } from \'./q\';\nimport { c } from \'./r\';\nexport const a = b + c;\n',
      './q': 'import { c } from \'./r\';\nexport const b = c;\n',
      './r': 'import { d } from \'lib\';\nexport const c = d;\n',
    },
  ],
];

describe('sourcesOf, on option modules that import each other', () => {
  it.each(RINGS)('refuses %s, naming the ring', (_name, options, ring) => {
    const run = (): Sources => {
      return sourcesOf('import { a } from \'./p\';\n\nexport const x = a;\n', options, {}, NO_TRUST);
    };

    expect(run).toThrow(`Option modules import each other in a ring, so filling them never ends: ${ring}`);
  });

  it.each(CHAINS)('takes %s', (_name, options) => {
    const { modules } = sourcesOf('export const x = 1;\n', options, {}, NO_TRUST);
    const taken = [...modules.keys()];
    const given = Object.keys(options);

    expect(taken).toStrictEqual(given);
  });
});

describe('sourcesOf, on where an option module sits', () => {
  it.each([
    ['../shared/styling'],
    ['./sub/styling'],
    ['@styles/styling'],
    ['styling'],
    ['./'],
    ['./.'],
    ['./..'],
  ])('refuses an option module imported as %s', (specifier) => {
    const run = (): Sources => {
      return sourcesOf('export const x = 1;\n', { [specifier]: 'export const a = 1;\n' }, {}, NO_TRUST);
    };

    expect(run).toThrow(`An option module must sit in the base's own directory, imported as ./<name>: ${specifier}`);
  });

  it('takes option modules beside the base, and modules held for proof from anywhere', () => {
    const options = {
      './styling': 'export const a = 1;\n',
      './HomePage.styles': 'export const b = 1;\n',
    };
    const held = { '../tokens/tokens.stylex': 'export const c = 1;\n' };
    const { modules, held: kept } = sourcesOf('export const x = 1;\n', options, held, NO_TRUST);
    const taken = [...modules.keys(), ...kept.keys()];

    expect(taken).toStrictEqual([
      './styling',
      './HomePage.styles',
      '../tokens/tokens.stylex',
    ]);
  });
});

describe('sourcesOf, on what a base opens with', () => {
  it('keeps the comments and directives before the imports as the header', () => {
    const base = '// Why.\n\'use client\';\n\nimport { a } from \'pkg\';\n\nexport const b = a;\n';
    const { header, body } = sourcesOf(base, {}, {}, NO_TRUST);

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
      return sourcesOf(base, {}, {}, NO_TRUST);
    };

    expect(run).toThrow(/Only comments and directives may come before a base's imports/u);
  });

  it('notes the names a value import takes as types', () => {
    const { imports } = sourcesOf('import { type A, b, type C as D } from \'pkg\';\n', {}, {}, NO_TRUST);
    const [entry] = imports;
    const typed = entry === undefined ? [] : [...entry.typeNames];

    expect(typed).toStrictEqual(['A', 'D']);
    expect(entry?.isType).toBe(false);
  });

  it('tells a type import and a side-effect import apart', () => {
    const { imports } = sourcesOf('import type { A } from \'pkg\';\nimport \'./side.css\';\n', {}, {}, NO_TRUST);
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
    const same = sourcesOf(base, { './p': option }, {}, NO_TRUST);

    const run = (): Sources => {
      return sourcesOf('import join from \'other\';\nimport { x } from \'./p\';\n', { './p': option }, {}, NO_TRUST);
    };

    expect(same.imports).toHaveLength(2);
    expect(run).toThrow('"join" is imported from other#join and from node:path#join; one name must have one source.');
  });

  it('refuses a module given both as a parameter module and as one held for proof', () => {
    const run = (): Sources => {
      return sourcesOf('import { x } from \'./p\';\n', { './p': '' }, { './p': '' }, NO_TRUST);
    };

    expect(run).toThrow('./p is given both as a parameter module and as a module held for proof.');
  });

  it('holds a module for proof apart from the parameter modules, binding none of its imports', () => {
    const trust: Trust = {
      plainData: ['./*.styles'],
      pureCalls: [],
    };
    const sources = sourcesOf('export const y = 1;\n', {}, { './h': 'import { a } from \'b\';\n' }, trust);
    const held = [...sources.held.keys()];

    expect(held).toStrictEqual(['./h']);
    expect(sources.imports).toHaveLength(0);
    expect(sources.plainData).toStrictEqual(['./*.styles']);
  });

  it('refuses a default import of a parameter module', () => {
    const run = (): Sources => {
      return sourcesOf('import p from \'./p\';\n', { './p': '' }, {}, NO_TRUST);
    };

    expect(run).toThrow(/import its exports by name/u);
  });
});

describe('resolved, on a parameter binding', () => {
  it('answers the export a binding names', () => {
    const sources = sourcesOf('import { x as y } from \'./p\';\n', { './p': 'export const x = 1;\n' }, {}, NO_TRUST);
    const found = resolved(sources, 'y');
    const isValue = ts.isVariableDeclaration(found);

    expect(isValue).toBe(true);
  });

  it('refuses a binding whose option module lacks the export', () => {
    const sources = sourcesOf('import { x } from \'./p\';\n', { './p': 'export const other = 1;\n' }, {}, NO_TRUST);

    const run = (): ts.Node => {
      return resolved(sources, 'x');
    };

    expect(run).toThrow('"x" has no export in its option module (./p).');
  });
});

describe('resolved', () => {
  it('refuses a name that is no parameter binding', () => {
    const sources = sourcesOf('export const a = 1;\n', {}, {}, NO_TRUST);

    const run = (): ts.Node => {
      return resolved(sources, 'a');
    };

    expect(run).toThrow(/"a" has no export in its option module \(no parameter module\)/u);
  });
});
