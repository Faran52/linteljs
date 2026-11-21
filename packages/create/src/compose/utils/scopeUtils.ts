import ts from 'typescript';

import { TYPE_ONLY_DECLARATIONS, VALUE_ONLY_DECLARATIONS } from '../constants';

import { isReference } from './sourceUtils';

/**
 * No lib is loaded, so a global such as `location` resolves to nothing, as does an import of a module that is neither
 * an option nor held for proof. The body asked about has no imports, so a name the base imports resolves to nothing
 * too: the engine tells it from a global by the base's import list.
 */

interface ModuleFile {
  specifier: string;
  name: string;
  file: ts.SourceFile;
}

const BASE_FILE = '/base.tsx';

const COMPILER_OPTIONS: ts.CompilerOptions = {
  jsx: ts.JsxEmit.Preserve,
  noEmit: true,
  noLib: true,
  types: [],
};

// The checker over the base, its option modules and the modules held for proof, keyed by the specifier each is
// imported by.
export const scopeOf = (
  base: ts.SourceFile,
  options: ReadonlyMap<string, ts.SourceFile>,
  held: ReadonlyMap<string, ts.SourceFile>,
): ts.TypeChecker => {
  const named = [...options.entries(), ...held.entries()]
    .map(([specifier, file], index) => {
      const entry: ModuleFile = {
        specifier,
        name: `/module-${String(index)}.tsx`,
        file,
      };

      return entry;
    });
  const files = new Map(named
    .map(({ name, file }) => {
      const pair: [string, ts.SourceFile] = [name, file];

      return pair;
    }));
  const targets = new Map(named
    .map(({ specifier, name }) => {
      const pair: [string, string] = [specifier, name];

      return pair;
    }));

  files.set(BASE_FILE, base);

  const host: ts.CompilerHost = {
    ...ts.createCompilerHost(COMPILER_OPTIONS),
    getSourceFile: (name) => {
      return files.get(name);
    },
    resolveModuleNameLiterals: (literals) => {
      return literals
        .map((literal) => {
          const resolvedFileName = targets.get(literal.text);
          const resolution: ts.ResolvedModuleWithFailedLookupLocations = {
            resolvedModule: resolvedFileName === undefined
              ? undefined
              : {
                  resolvedFileName,
                  extension: ts.Extension.Tsx,
                },
          };

          return resolution;
        });
    },
  };
  const program = ts.createProgram({
    rootNames: [...files.keys()],
    options: COMPILER_OPTIONS,
    host,
  });

  return program.getTypeChecker();
};

const meaningOf = (read: ts.Identifier): ts.SymbolFlags => {
  const { parent } = read;
  const clause = ts.isExpressionWithTypeArguments(parent) ? parent.parent : undefined;
  const isHeritage = clause !== undefined && ts.isHeritageClause(clause);
  const isTypeClause = isHeritage
    && (ts.isInterfaceDeclaration(clause.parent) || clause.token === ts.SyntaxKind.ImplementsKeyword);

  return ts.isTypeReferenceNode(parent) || isTypeClause ? ts.SymbolFlags.Type : ts.SymbolFlags.Value;
};

// Of a type and a value merged under one name, the declaration that gives the name the meaning its read takes.
const meantOf = (symbol: ts.Symbol | undefined, read: ts.Identifier): ts.Declaration | undefined => {
  const excluded = meaningOf(read) === ts.SymbolFlags.Type ? VALUE_ONLY_DECLARATIONS : TYPE_ONLY_DECLARATIONS;

  return symbol?.declarations
    ?.find((declaration) => {
      return !excluded.has(declaration.kind);
    });
};

// The declaration a name resolves to where it is written; a shorthand member is read as the value it names.
export const declarationOf = (checker: ts.TypeChecker, identifier: ts.Identifier): ts.Declaration | undefined => {
  const { parent } = identifier;
  const symbol = ts.isShorthandPropertyAssignment(parent)
    ? checker.getShorthandAssignmentValueSymbol(parent)
    : checker.getSymbolAtLocation(identifier);

  return meantOf(symbol, identifier);
};

// What an imported name stands for in the module the program holds for it; undefined for any other name.
export const aliasedOf = (checker: ts.TypeChecker, identifier: ts.Identifier): ts.Declaration | undefined => {
  const symbol = checker.getSymbolAtLocation(identifier);
  const isAlias = symbol !== undefined && (symbol.flags & ts.SymbolFlags.Alias) !== 0;

  return isAlias ? checker.getAliasedSymbol(symbol).valueDeclaration : undefined;
};

// Every read of one declaration within a node; another binding of the same name is not one.
export const referencesTo = (
  checker: ts.TypeChecker,
  declaration: ts.Declaration,
  within: ts.Node,
): ts.Identifier[] => {
  const name = ts.getNameOfDeclaration(declaration);
  const text = name !== undefined && ts.isIdentifier(name) ? name.text : undefined;
  const found: ts.Identifier[] = [];

  const visit = (node: ts.Node): void => {
    const isRead = ts.isIdentifier(node) && node.text === text && isReference(node);

    if (isRead && declarationOf(checker, node) === declaration) {
      found.push(node);
    }

    node.forEachChild(visit);
  };

  visit(within);

  return found;
};

// The declaration a read's name, in the read's meaning, would resolve to if it were written at another node.
export const resolvedAt = (checker: ts.TypeChecker, read: ts.Identifier, at: ts.Node): ts.Declaration | undefined => {
  const meaning = meaningOf(read);
  const symbol = checker.resolveName(read.text, at, meaning, false);

  return meantOf(symbol, read);
};

// The names a binding binds: itself, or each member of its pattern.
export const bindingNamesOf = (name: ts.BindingName): string[] => {
  if (ts.isIdentifier(name)) {
    const own = [name.text];

    return own;
  }

  const elements: readonly ts.ArrayBindingElement[] = name.elements;

  return elements
    .filter(ts.isBindingElement)
    .flatMap((element) => {
      return bindingNamesOf(element.name);
    });
};

// A `var` belongs to the function or namespace around it, so it leaves every block on the way there.
const hoistedIn = (node: ts.Node): string[] => {
  const found: string[] = [];

  if (ts.isFunctionLike(node) || ts.isClassLike(node) || ts.isModuleDeclaration(node)) {
    return found;
  }

  if (ts.isVariableDeclarationList(node) && (node.flags & ts.NodeFlags.BlockScoped) === 0) {
    for (const declaration of node.declarations) {
      found.push(...bindingNamesOf(declaration.name));
    }
  }

  node
    .forEachChild((child) => {
      found.push(...hoistedIn(child));
    });

  return found;
};

const importedOf = (statement: ts.ImportDeclaration): (ts.Identifier | undefined)[] => {
  const clause = statement.importClause;
  const bindings = clause?.namedBindings;

  if (bindings !== undefined && ts.isNamedImports(bindings)) {
    const named = bindings.elements
      .map((element) => {
        return element.name;
      });
    const all = [clause?.name, ...named];

    return all;
  }

  const whole = [clause?.name, bindings?.name];

  return whole;
};

const ownNameOf = (statement: ts.Statement): ts.Identifier | undefined => {
  if (ts.isModuleDeclaration(statement)) {
    return ts.isIdentifier(statement.name) ? statement.name : undefined;
  }

  const isValue = ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement);
  const isType = ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement);

  return isValue || isType || ts.isEnumDeclaration(statement) ? statement.name : undefined;
};

const ownNamesOf = (statement: ts.Statement): string[] => {
  if (ts.isVariableStatement(statement)) {
    return statement.declarationList.declarations
      .flatMap((declaration) => {
        return bindingNamesOf(declaration.name);
      });
  }

  const names = ts.isImportDeclaration(statement) ? importedOf(statement) : [ownNameOf(statement)];

  return names
    .filter((name) => {
      return name !== undefined;
    })
    .map((name) => {
      return name.text;
    });
};

// The names statements declare in their own scope, values and types alike, with every `var` they hold.
export const declaredBy = (statements: readonly ts.Statement[]): Set<string> => {
  const names = statements
    .flatMap((statement) => {
      const own = ownNamesOf(statement);
      const hoisted = hoistedIn(statement);

      return own.concat(hoisted);
    });

  return new Set(names);
};
