import ts from 'typescript';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  aliasedOf,
  declarationOf,
  declaredBy,
  referencesTo,
  resolvedAt,
  scopeOf,
} from './scopeUtils';
import { collect, parse } from './sourceUtils';

interface Scoped {
  checker: ts.TypeChecker;
  base: ts.SourceFile;
  option: ts.SourceFile;
}

const scopedOf = (base: string, option: string): Scoped => {
  const baseFile = parse(base);
  const optionFile = parse(option);
  const checker = scopeOf(baseFile, new Map([['./p', optionFile]]), new Map());
  const scoped: Scoped = {
    checker,
    base: baseFile,
    option: optionFile,
  };

  return scoped;
};

const nameAt = (file: ts.SourceFile, name: string, index: number): ts.Identifier => {
  const found = collect(file, ts.isIdentifier)
    .filter((identifier) => {
      return identifier.text === name;
    })
    .at(index);

  if (found === undefined) {
    throw new Error(`No ${name} at ${String(index)}`);
  }

  return found;
};

const textOfDeclaration = (declaration: ts.Declaration | undefined): string | undefined => {
  return declaration?.getText();
};

describe('aliasedOf', () => {
  it.each([
    [
      'an import of an option module',
      'p',
      'p = { a: 1 }',
    ],
    [
      'an import of a module held for proof',
      'h',
      'h = { b: 2 }',
    ],
    [
      'an import of a module the program lacks',
      'q',
      undefined,
    ],
    [
      'a local name',
      'l',
      undefined,
    ],
    [
      'a name that resolves to nothing',
      'g',
      undefined,
    ],
  ])('answers for %s', (_name, read, expected) => {
    const text = [
      'import { p } from \'./p\';',
      'import { h } from \'./h\';',
      'import { q } from \'./q\';',
      'const l = 1;',
      'export const y = [p, h, q, l, g];',
      '',
    ].join('\n');
    const base = parse(text);
    const option = parse('export const p = { a: 1 };\n');
    const held = parse('export const h = { b: 2 };\n');
    const checker = scopeOf(base, new Map([['./p', option]]), new Map([['./h', held]]));
    const name = nameAt(base, read, -1);
    const found = aliasedOf(checker, name);
    const shown = textOfDeclaration(found);

    expect(shown).toBe(expected);
  });
});

describe('declarationOf', () => {
  it('resolves a parameter that shadows an outer name to the parameter, and the outer read to the outer', () => {
    const text = [
      'const v = 1;',
      'export const f = (v: number) => v;',
      'export const g = () => v;',
      '',
    ].join('\n');
    const { checker, base } = scopedOf(text, '');
    const inner = declarationOf(checker, nameAt(base, 'v', 2));
    const outer = declarationOf(checker, nameAt(base, 'v', 3));

    const innerText = textOfDeclaration(inner);
    expect(innerText).toBe('v: number');
    const outerText = textOfDeclaration(outer);
    expect(outerText).toBe('v = 1');
  });

  it('resolves a read inside a catch clause to the catch variable', () => {
    const { checker, base } = scopedOf('const e = 1;\ntry {\n  run();\n}\ncatch (e) {\n  log(e);\n}\nlog(e);\n', '');
    const caught = declarationOf(checker, nameAt(base, 'e', 2));
    const outer = declarationOf(checker, nameAt(base, 'e', 3));
    const isCatch = caught !== undefined && ts.isCatchClause(caught.parent);

    expect(isCatch).toBe(true);
    const outerText = textOfDeclaration(outer);
    expect(outerText).toBe('e = 1');
  });

  it('resolves a read inside a for loop to the loop binding', () => {
    const text = [
      "const i = 'out';",
      'for (let i = 0; i < 2; i += 1) {',
      '  log(i);',
      '}',
      'log(i);',
      '',
    ].join('\n');
    const { checker, base } = scopedOf(text, '');
    const looped = declarationOf(checker, nameAt(base, 'i', 4));
    const outer = declarationOf(checker, nameAt(base, 'i', 5));

    const loopedText = textOfDeclaration(looped);
    expect(loopedText).toBe('i = 0');
    const outerText = textOfDeclaration(outer);
    expect(outerText).toBe("i = 'out'");
  });

  it('does not take a class member for a binding', () => {
    const text = [
      'const size = 1;',
      'class Box {',
      '  size = 2;',
      '  area() {',
      '    return size * this.size;',
      '  }',
      '}',
      '',
    ].join('\n');
    const { checker, base } = scopedOf(text, '');
    const read = declarationOf(checker, nameAt(base, 'size', 2));

    const readText = textOfDeclaration(read);
    expect(readText).toBe('size = 1');
  });

  it('resolves a type read and a value read of one name in one scope to the type and to the value', () => {
    const { checker, base } = scopedOf("type Id = string;\nconst Id = 'id';\nexport const f = (x: Id) => Id;\n", '');
    const typeRead = declarationOf(checker, nameAt(base, 'Id', 2));
    const valueRead = declarationOf(checker, nameAt(base, 'Id', 3));

    const typeReadText = textOfDeclaration(typeRead);
    expect(typeReadText).toBe('type Id = string;');
    const valueReadText = textOfDeclaration(valueRead);
    expect(valueReadText).toBe("Id = 'id'");
  });

  it('resolves a name in an implements clause as a type, and the class it extends as a value', () => {
    const text = 'const Shape = 1;\ninterface Shape {}\nclass Base {}\nclass C extends Base implements Shape {}\n';
    const { checker, base } = scopedOf(text, '');
    const implemented = declarationOf(checker, nameAt(base, 'Shape', 2));
    const extended = declarationOf(checker, nameAt(base, 'Base', 1));
    const isInterface = implemented !== undefined && ts.isInterfaceDeclaration(implemented);
    const isClass = extended !== undefined && ts.isClassDeclaration(extended);

    expect(isInterface).toBe(true);
    expect(isClass).toBe(true);
  });

  it('resolves a type read and a value read of one name to the type and to the value in their own scopes', () => {
    const text = [
      'type T = number;',
      'export const f = (T: string) => {',
      '  const x: T = 1;',
      '',
      '  return T;',
      '};',
      '',
    ].join('\n');
    const { checker, base } = scopedOf(text, '');
    const typeRead = declarationOf(checker, nameAt(base, 'T', 2));
    const valueRead = declarationOf(checker, nameAt(base, 'T', 3));

    const typeReadText = textOfDeclaration(typeRead);
    expect(typeReadText).toBe('type T = number;');
    const valueReadText = textOfDeclaration(valueRead);
    expect(valueReadText).toBe('T: string');
  });

  it('resolves a local over an import of the same name, and the import elsewhere', () => {
    const base = [
      "import { v } from './p';",
      'export const f = () => {',
      '  const v = 2;',
      '',
      '  return v;',
      '};',
      'export const g = () => v;',
      '',
    ].join('\n');
    const { checker, base: file } = scopedOf(base, 'export const v = 1;\n');
    const local = declarationOf(checker, nameAt(file, 'v', 2));
    const imported = declarationOf(checker, nameAt(file, 'v', 3));
    const isImport = imported !== undefined && ts.isImportSpecifier(imported);

    const localText = textOfDeclaration(local);
    expect(localText).toBe('v = 2');
    expect(isImport).toBe(true);
  });

  it('resolves a global such as location to nothing', () => {
    const { checker, option } = scopedOf('', 'export const path = () => location.pathname;\n');
    const global = declarationOf(checker, nameAt(option, 'location', 0));

    expect(global).toBeUndefined();
  });

  it('resolves a shorthand member to the value it names', () => {
    const { checker, base } = scopedOf('const k = 1;\nexport const o = { k };\n', '');
    const read = declarationOf(checker, nameAt(base, 'k', 1));

    const readText = textOfDeclaration(read);
    expect(readText).toBe('k = 1');
  });
});

describe('referencesTo', () => {
  it('finds the reads of one declaration and not those of another binding of its name', () => {
    const base = "import { v } from 'lib';\nexport const f = (v: number) => v;\nexport const g = () => v + v.k;\n";
    const { checker, base: file } = scopedOf(base, '');
    const declaration = declarationOf(checker, nameAt(file, 'v', 0));
    const found = declaration === undefined ? [] : referencesTo(checker, declaration, file);
    const starts = found
      .map((read) => {
        return read.getStart();
      });

    const expected = [
      nameAt(file, 'v', 3).getStart(),
      nameAt(file, 'v', 4).getStart(),
    ];

    expect(starts).toStrictEqual(expected);
  });

  it('finds the value reads of a const that shares its name with an interface declared before it', () => {
    const base = 'interface Id {\n  a: 1;\n}\nconst Id = { a: 1 };\nexport const f = (x: Id) => Id;\n';
    const { checker, base: file } = scopedOf(base, '');
    const constant = nameAt(file, 'Id', 1).parent;
    const found = ts.isVariableDeclaration(constant) ? referencesTo(checker, constant, file) : [];
    const starts = found
      .map((read) => {
        return read.getStart();
      });

    const expected = [nameAt(file, 'Id', 3).getStart()];

    expect(starts).toStrictEqual(expected);
  });

  it('finds nothing for a declaration that is not named by an identifier', () => {
    const { checker, base } = scopedOf('const { a } = { a: 1 };\nlog(a);\n', '');
    const [statement] = base.statements;
    const declaration = statement !== undefined && ts.isVariableStatement(statement)
      ? statement.declarationList.declarations[0]
      : undefined;
    const found = declaration === undefined ? undefined : referencesTo(checker, declaration, base);

    expect(found).toStrictEqual([]);
  });
});

describe('resolvedAt', () => {
  it('says a global read in an option would land on a base parameter of its name', () => {
    const base = [
      "import { path } from './p';",
      '',
      'export const f = (location: string) => {',
      '  return path() + location;',
      '};',
      '',
    ].join('\n');
    const {
      checker,
      base: file,
      option,
    } = scopedOf(base, 'export const path = () => location.pathname;\n');
    const read = nameAt(option, 'location', 0);
    const inside = resolvedAt(checker, read, nameAt(file, 'path', 1));
    const outside = resolvedAt(checker, read, nameAt(file, 'f', 0));

    const insideText = textOfDeclaration(inside);
    expect(insideText).toBe('location: string');
    expect(outside).toBeUndefined();
  });

  it('answers an import at module level and a local where one binds the name', () => {
    const base = "import { v } from './p';\nexport const f = () => {\n  const v = 2;\n\n  return v;\n};\n";
    const {
      checker,
      base: file,
      option,
    } = scopedOf(base, 'export const v = 1;\nexport const w = v;\n');
    const read = nameAt(option, 'v', 1);
    const local = resolvedAt(checker, read, nameAt(file, 'v', 2));
    const top = resolvedAt(checker, read, nameAt(file, 'f', 0));
    const isImport = top !== undefined && ts.isImportSpecifier(top);

    const localText = textOfDeclaration(local);
    expect(localText).toBe('v = 2');
    expect(isImport).toBe(true);
  });

  it('answers, of a type and a value merged at the landing site, the one a read means', () => {
    const base = 'interface Id {\n  a: 1;\n}\nconst Id = { a: 1 };\nexport const f = Id;\n';
    const option = 'export type Uses = Id;\nexport const w = Id;\n';
    const {
      checker,
      base: file,
      option: optionFile,
    } = scopedOf(base, option);
    const at = nameAt(file, 'f', 0);
    const typed = resolvedAt(checker, nameAt(optionFile, 'Id', 0), at);
    const valued = resolvedAt(checker, nameAt(optionFile, 'Id', 1), at);
    const isInterface = typed !== undefined && ts.isInterfaceDeclaration(typed);

    expect(isInterface).toBe(true);
    const valuedText = textOfDeclaration(valued);
    expect(valuedText).toBe('Id = { a: 1 }');
  });

  it('looks a type read up among types only', () => {
    const base = 'const Id = 1;\ninterface Base {\n  a: 1;\n}\nexport const f = Id;\n';
    const option = [
      'export type Id = number;',
      'export type Uses = Id;',
      'export interface Wide extends Base {',
      '  b: 2;',
      '}',
      '',
    ].join('\n');
    const {
      checker,
      base: file,
      option: optionFile,
    } = scopedOf(base, option);
    const at = nameAt(file, 'f', 0);
    const typed = resolvedAt(checker, nameAt(optionFile, 'Id', 1), at);
    const inherited = resolvedAt(checker, nameAt(optionFile, 'Base', 0), at);
    const isInterface = inherited !== undefined && ts.isInterfaceDeclaration(inherited);

    expect(typed).toBeUndefined();
    expect(isInterface).toBe(true);
  });
});

describe('declaredBy', () => {
  it('names what statements declare in their own scope, every var they hold, and nothing nested deeper', () => {
    const text = [
      "import L, { M as N } from 'm';",
      "import * as O from 'o';",
      "import 'bare';",
      'const a = 1;',
      'let [b, , c] = list;',
      'var { d } = record;',
      'function e() {',
      '  var hidden = 1;',
      '}',
      'export default function () {}',
      'class F {',
      '  m() {',
      '    var member = 1;',
      '  }',
      '}',
      'interface G {}',
      'type H = 1;',
      'enum I {}',
      'namespace P {',
      '  var inner = 1;',
      '}',
      "declare module 'q' {}",
      'module R.S {}',
      'if (x) {',
      '  var j = 1;',
      '  let block = 2;',
      '}',
      'for (var k of list) {}',
      'log(a);',
      '',
    ].join('\n');
    const file = parse(text);
    const names = declaredBy(file.statements);

    const sorted = [...names]
      .toSorted((left, right) => {
        return left.localeCompare(right);
      });

    expect(sorted).toStrictEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
      'F',
      'G',
      'H',
      'I',
      'j',
      'k',
      'L',
      'N',
      'O',
      'P',
      'R',
    ]);
  });
});
