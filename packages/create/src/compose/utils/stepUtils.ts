import ts from 'typescript';

import {
  localsOf,
  resolved,
  type Sources,
} from './bindingUtils';
import { refusal } from './editUtils';
import {
  declarationOf,
  resolvedAt,
  scopeOf,
} from './scopeUtils';
import {
  collect,
  isReference,
  isWithin,
  parse,
  textOf,
} from './sourceUtils';

export type Step = (text: string, file: ts.SourceFile) => string | undefined;

const MARKER = '@lintel:';
const STEP_LIMIT = 10_000;

// Until a rewrite answers undefined; a module that never settles is refused rather than looped on.
export const settled = (text: string, once: Step): string => {
  let current = text;

  for (let steps = 0; steps < STEP_LIMIT; steps += 1) {
    const file = parse(current);
    const next = once(current, file);

    if (next === undefined) {
      return current;
    }

    current = next;
  }

  throw new Error('The composition did not settle; an option module refers back to itself.');
};

const isImport = (declaration: ts.Declaration): boolean => {
  return ts.isImportSpecifier(declaration) || ts.isImportClause(declaration) || ts.isNamespaceImport(declaration);
};

// What is wrong with one read of moved option code where it lands, or undefined when it reads the same thing there.
const faultOf = (
  checker: ts.TypeChecker,
  sources: Sources,
  imported: ReadonlySet<string>,
  read: ts.Identifier,
  landing: ts.Node,
): string | undefined => {
  const origin = declarationOf(checker, read);
  const found = resolvedAt(checker, read, landing);

  if (found !== undefined) {
    return `"${read.text}" would read the base's own binding of that name where the option's code lands`;
  }

  if (origin === undefined) {
    const isTaken = imported.has(read.text) || sources.bindings.has(read.text);

    return isTaken ? `"${read.text}" is a global in the option module, and the base imports that name` : undefined;
  }

  const isExport = sources.bindings.has(read.text) && resolved(sources, read.text) === origin;
  const isBound = isImport(origin) || isExport;

  return isBound ? undefined : `"${read.text}" is declared in an option module and read by code that left it behind`;
};

// `this`, `arguments`, `super`, `new.target` and `import.meta` name what surrounds code, so they change as it moves.
const isContextRead = (node: ts.Node): node is ts.Node => {
  const isNamed = ts.isIdentifier(node) && node.text === 'arguments' && isReference(node);
  const isKeyword = node.kind === ts.SyntaxKind.ThisKeyword || node.kind === ts.SyntaxKind.SuperKeyword;

  return isNamed || isKeyword || ts.isMetaProperty(node);
};

// Option code moved to a landing site must read there what it read in its own module. A name declared outside
// `owner` may be a global, an import or an export the base binds, and nothing at the landing site may bind it.
export const landedCheck = (
  checker: ts.TypeChecker,
  sources: Sources,
  owner: ts.Node,
  moved: ts.Node,
  landing: ts.Node,
): void => {
  const [context] = collect(moved, isContextRead);

  if (context !== undefined) {
    throw refusal(landing, `The option's code reads "${textOf(context)}", which names another thing where it lands`);
  }

  const imported = new Set(sources.imports.flatMap(localsOf));
  const faults = collect(moved, ts.isIdentifier)
    .filter((read) => {
      const origin = declarationOf(checker, read);

      return isReference(read) && (origin === undefined || !isWithin(origin, owner));
    })
    .map((read) => {
      return faultOf(checker, sources, imported, read, landing);
    });
  const [fault] = faults
    .filter((found) => {
      return found !== undefined;
    });

  if (fault !== undefined) {
    throw refusal(landing, fault);
  }
};

// What names a module outside the import block: `import()`, `typeof import()`, a re-export or `import x = require()`.
const namerOf = (literal: ts.StringLiteral): ts.Node | undefined => {
  const { parent } = literal;
  const isDynamic = ts.isCallExpression(parent) && parent.expression.kind === ts.SyntaxKind.ImportKeyword;
  const isNamer = isDynamic || ts.isExportDeclaration(parent) || ts.isExternalModuleReference(parent);

  if (ts.isLiteralTypeNode(parent) && ts.isImportTypeNode(parent.parent)) {
    return parent.parent;
  }

  return isNamer ? parent : undefined;
};

// Nothing of the parameters may be left: no read of a parameter binding the base does not bind itself, no directive,
// and no parameter module named where nothing fills it.
export const checked = (text: string, sources: Sources): ts.SourceFile => {
  const file = parse(text);
  const [named] = collect(file, ts.isStringLiteral)
    .filter((literal) => {
      return sources.modules.has(literal.text);
    })
    .map(namerOf)
    .filter((namer) => {
      return namer !== undefined;
    });

  if (named !== undefined) {
    throw refusal(named, 'A parameter module is named where nothing fills it, so its option would be lost');
  }

  const checker = scopeOf(file, sources.modules, sources.held);
  const left = collect(file, ts.isIdentifier)
    .find((identifier) => {
      const isParameter = sources.bindings.has(identifier.text) && isReference(identifier);

      return isParameter && declarationOf(checker, identifier) === undefined;
    });
  const what = left === undefined ? MARKER : left.text;

  if (left !== undefined || text.includes(MARKER)) {
    throw new Error(`Something of the parameters is left after composing: ${what}`);
  }

  return file;
};

// What is written must still be a module.
export const wellFormed = (text: string): string => {
  const { diagnostics = [] } = ts.transpileModule(text, {
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.Preserve },
    fileName: 'module.tsx',
  });
  const [fault] = diagnostics;

  if (fault !== undefined) {
    const reason = ts.flattenDiagnosticMessageText(fault.messageText, ' ');

    throw new Error(`The composed module does not parse: ${reason}`);
  }

  return text;
};
