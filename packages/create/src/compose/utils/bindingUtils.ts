import ts from 'typescript';

import { parse, textOf } from './sourceUtils';

// A local name that stands for one export of a parameter module.
export interface Binding {
  specifier: string;
  exported: string;
}

// One import line as the output will print it.
export interface ImportEntry {
  specifier: string;
  isType: boolean;
  isBare: boolean;
  defaultName?: string;
  namespaceName?: string;
  // A local name to the export it stands for.
  names: Map<string, string>;
  // The local names imported as `type X` inside a value import.
  typeNames: Set<string>;
}

export interface Sources {
  // What the base opens with before its imports: comments and directives such as 'use client'.
  header: string;
  body: string;
  modules: Map<string, ts.SourceFile>;
  bindings: Map<string, Binding>;
  imports: ImportEntry[];
}

export type Exported = ts.VariableDeclaration | ts.InterfaceDeclaration | ts.TypeAliasDeclaration;

type Parts = Pick<Sources, 'body' | 'header'>;

const isExported = (statement: ts.Statement): boolean => {
  const modifiers = ts.canHaveModifiers(statement) ? ts.getModifiers(statement) : undefined;
  const isMarked = modifiers
    ?.some((modifier) => {
      return modifier.kind === ts.SyntaxKind.ExportKeyword;
    });

  return isMarked === true;
};

const declarationsOf = (statement: ts.Statement): Exported[] => {
  if (ts.isVariableStatement(statement)) {
    const declarations: Exported[] = [...statement.declarationList.declarations];

    return declarations;
  }

  const isType = ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement);

  const own: Exported[] = isType ? [statement] : [];

  return own;
};

// An option module's export by name, or undefined: an optional export is the option's to leave out.
export const exportOf = (module: ts.SourceFile, name: string): Exported | undefined => {
  return module.statements
    .filter(isExported)
    .flatMap(declarationsOf)
    .find((declaration) => {
      return ts.isIdentifier(declaration.name) && declaration.name.text === name;
    });
};

const entryOf = (declaration: ts.ImportDeclaration): ImportEntry => {
  const clause = declaration.importClause;
  const bindings = clause?.namedBindings;
  const named = bindings !== undefined && ts.isNamedImports(bindings) ? bindings.elements : [];
  const pairs = named
    .map((element) => {
      const exported = element.propertyName ?? element.name;
      const pair: [string, string] = [element.name.text, exported.text];

      return pair;
    });
  const typed = named
    .filter((element) => {
      return element.isTypeOnly;
    })
    .map((element) => {
      return element.name.text;
    });
  const { moduleSpecifier } = declaration;
  const entry: ImportEntry = {
    specifier: textOf(moduleSpecifier).slice(1, -1),
    isType: clause?.phaseModifier === ts.SyntaxKind.TypeKeyword,
    isBare: clause === undefined,
    names: new Map(pairs),
    typeNames: new Set(typed),
  };

  if (clause?.name !== undefined) {
    entry.defaultName = clause.name.text;
  }

  if (bindings !== undefined && ts.isNamespaceImport(bindings)) {
    entry.namespaceName = bindings.name.text;
  }

  return entry;
};

// Every local name an import line binds.
export const localsOf = (entry: ImportEntry): string[] => {
  const single = [entry.defaultName, entry.namespaceName]
    .filter((name) => {
      return name !== undefined;
    });

  const locals = [...single, ...entry.names.keys()];

  return locals;
};

// One local name must mean one thing across the base and every option module.
const claim = (owners: Map<string, string>, entry: ImportEntry, local: string): void => {
  const exported = entry.names.get(local) ?? local;
  const source = `${entry.specifier}#${exported}`;
  const owner = owners.get(local);

  if (owner !== undefined && owner !== source) {
    throw new Error(`"${local}" is imported from ${owner} and from ${source}; one name must have one source.`);
  }

  owners.set(local, source);
};

// A parameter module's exports are taken by name, so each one can be found and filled.
const bind = (bindings: Map<string, Binding>, entry: ImportEntry): void => {
  const isWhole = entry.defaultName !== undefined || entry.namespaceName !== undefined || entry.isBare;

  if (isWhole) {
    throw new Error(`${entry.specifier} is a parameter module; import its exports by name.`);
  }

  for (const [local, exported] of entry.names) {
    bindings.set(local, {
      specifier: entry.specifier,
      exported,
    });
  }
};

const isDirective = (statement: ts.Statement): boolean => {
  return ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression);
};

// The base around its imports: what it opens with, and everything after the last import.
const partsOf = (base: string, file: ts.SourceFile): Parts => {
  const imports = file.statements.filter(ts.isImportDeclaration);
  const first = imports.at(0);
  const last = imports.at(-1);

  if (first === undefined || last === undefined) {
    const whole: Parts = {
      header: '',
      body: base,
    };

    return whole;
  }

  const start = first.getStart();
  const end = last.getEnd();
  const block = base.slice(start, end);
  const between = imports
    .map(textOf)
    .reduce((text, written) => {
      return text.replace(written, '');
    }, block);
  const early = file.statements
    .find((statement) => {
      return statement.getStart() < start && !isDirective(statement);
    });

  if (between.trim() !== '' || early !== undefined) {
    throw new Error('Only comments and directives may come before a base\'s imports, and nothing between them.');
  }

  const parts: Parts = {
    header: base.slice(0, start),
    body: base
      .slice(end)
      .trimStart(),
  };

  return parts;
};

// The base without its imports, each option module parsed, and what every import stands for.
export const sourcesOf = (base: string, options: Readonly<Record<string, string>>): Sources => {
  const baseFile = parse(base);
  const parsed = Object.entries(options)
    .map(([specifier, source]) => {
      const pair: [string, ts.SourceFile] = [specifier, parse(source)];

      return pair;
    });
  const modules = new Map(parsed);
  const bindings = new Map<string, Binding>();
  const imports: ImportEntry[] = [];
  const owners = new Map<string, string>();
  const entries = [baseFile, ...modules.values()]
    .flatMap((file) => {
      return file.statements.filter(ts.isImportDeclaration);
    })
    .map(entryOf);

  for (const entry of entries) {
    for (const local of localsOf(entry)) {
      claim(owners, entry, local);
    }

    if (modules.has(entry.specifier)) {
      bind(bindings, entry);
    }
    else {
      imports.push(entry);
    }
  }

  const { header, body } = partsOf(base, baseFile);
  const sources: Sources = {
    header,
    body,
    modules,
    bindings,
    imports,
  };

  return sources;
};

// The export a binding names, or a refusal that says which option module lacks it.
export const resolved = (sources: Sources, local: string): Exported => {
  const binding = sources.bindings.get(local);
  const specifier = binding === undefined ? 'no parameter module' : binding.specifier;
  const module = sources.modules.get(specifier);
  const found = binding === undefined || module === undefined ? undefined : exportOf(module, binding.exported);

  if (found === undefined) {
    throw new Error(`"${local}" has no export in its option module (${specifier}).`);
  }

  return found;
};
