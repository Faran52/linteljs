import ts from 'typescript';

import {
  localsOf,
  resolved,
  type Sources,
} from './bindingUtils';
import {
  applied,
  type Edit,
  refusal,
} from './editUtils';
import {
  declarationOf,
  resolvedAt,
  scopeOf,
} from './scopeUtils';
import {
  collect,
  isReference,
  isWithin,
  ownsLines,
  parse,
  spanOf,
  textOf,
} from './sourceUtils';

// A rewrite answers the edits it makes of the text, so what each one carries or writes is known, never guessed.
export type Step = (text: string, file: ts.SourceFile) => readonly Edit[] | undefined;

export type Watch = (text: string, edits: readonly Edit[]) => void;

// One rewrite a pass may make: where it is, whether it may change what another statement reads, and its edits.
export interface Candidate {
  node: ts.Node;
  isAlone: () => boolean;
  edits: () => readonly Edit[] | undefined;
}

const MARKER = '@lintel:';
const STEP_LIMIT = 10_000;

// Until a rewrite answers undefined, each rewrite shown to `watch`; a module that never settles is refused rather than
// looped on.
export const settled = (start: ts.SourceFile, once: Step, watch?: Watch): ts.SourceFile => {
  let file = start;

  for (let steps = 0; steps < STEP_LIMIT; steps += 1) {
    const edits = once(file.text, file);

    if (edits === undefined) {
      return file;
    }

    const next = applied(file.text, edits);

    if (next === file.text) {
      throw new Error('A step of the composition left the module as it was, so it would never settle');
    }

    watch?.(file.text, edits);
    file = parse(next);
  }

  throw new Error('The composition did not settle; an option module refers back to itself.');
};

const statementOf = (node: ts.Node): ts.Node => {
  return ts.isSourceFile(node.parent) ? node : statementOf(node.parent);
};

const isInside = (edits: readonly Edit[], statement: ts.Node): boolean => {
  return edits
    .every(({ start, end }) => {
      return start >= statement.getStart() && end <= statement.getEnd();
    });
};

// The first edits joined by those of each later candidate whose statement is not taken and owns its lines.
const joinedTo = (text: string, first: readonly Edit[], statement: ts.Node, others: readonly Candidate[]): Edit[] => {
  const taken = new Set([statement]);
  const edits = [...first];

  for (const candidate of others) {
    const own = statementOf(candidate.node);

    if (taken.has(own)) {
      continue;
    }

    const span = spanOf(own);

    if (!ownsLines(text, span)) {
      continue;
    }

    // A candidate that may change what others read keeps its statement for a later pass.
    if (candidate.isAlone()) {
      taken.add(own);
      continue;
    }

    const answer = candidate.edits();

    if (answer !== undefined) {
      taken.add(own);
    }

    if (answer !== undefined && isInside(answer, own)) {
      edits.push(...answer);
    }
  }

  return edits;
};

/**
 * The first candidate's edits, and with them the first of each other top-level statement on lines of its own, when
 * every one stays inside its statement and none may change what another reads: such statements answer the same
 * whichever is rewritten first, so one pass reaches what one rewrite at a time would.
 */
export const batched = (text: string, candidates: readonly Candidate[]): readonly Edit[] | undefined => {
  for (const [index, candidate] of candidates.entries()) {
    const first = candidate.edits();

    if (first !== undefined) {
      const statement = statementOf(candidate.node);
      const isOpen = !candidate.isAlone() && isInside(first, statement);
      const others = candidates.slice(index + 1);

      return isOpen ? joinedTo(text, first, statement, others) : first;
    }
  }

  return undefined;
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
    const from = sources.spliced.get(read.text);
    const module = read.getSourceFile();
    const file = landing.getSourceFile();
    const isOther = from !== undefined && from !== module && found === resolvedAt(checker, read, file);

    return isOther
      ? `"${read.text}" would read what another option's case declares, where the option's code lands`
      : `"${read.text}" would read the base's own binding of that name where the option's code lands`;
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

// The reads in moved option code of a name declared outside `owner`: a global, an import or an export the base binds.
export const outsideReads = (checker: ts.TypeChecker, owner: ts.Node, moved: ts.Node): ts.Identifier[] => {
  return collect(moved, ts.isIdentifier)
    .filter((read) => {
      const origin = declarationOf(checker, read);

      return isReference(read) && (origin === undefined || !isWithin(origin, owner));
    });
};

// Option code moved to a landing site must read there what `reads`, its reads from outside it, read in its own module:
// nothing at the landing site may bind them.
export const readsCheck = (
  checker: ts.TypeChecker,
  sources: Sources,
  moved: ts.Node,
  reads: readonly ts.Identifier[],
  landing: ts.Node,
): void => {
  const [context] = collect(moved, isContextRead);

  if (context !== undefined) {
    throw refusal(landing, `The option's code reads "${textOf(context)}", which names another thing where it lands`);
  }

  const imported = new Set(sources.imports.flatMap(localsOf));
  const [fault] = reads
    .map((read) => {
      return faultOf(checker, sources, imported, read, landing);
    })
    .filter((found) => {
      return found !== undefined;
    });

  if (fault !== undefined) {
    throw refusal(landing, fault);
  }
};

// Option code moved to a landing site must read there what it read in its own module.
export const landedCheck = (
  checker: ts.TypeChecker,
  sources: Sources,
  owner: ts.Node,
  moved: ts.Node,
  landing: ts.Node,
): void => {
  const reads = outsideReads(checker, owner, moved);

  readsCheck(checker, sources, moved, reads, landing);
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
export const checked = (file: ts.SourceFile, sources: Sources): ts.SourceFile => {
  const { text } = file;
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
    fileName: 'module.tsx',
  });
  const [fault] = diagnostics;

  if (fault !== undefined) {
    const reason = ts.flattenDiagnosticMessageText(fault.messageText, ' ');

    throw new Error(`The composed module does not parse: ${reason}`);
  }

  return text;
};
