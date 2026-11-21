import ts from 'typescript';

import { inlineMember, inlineValue } from './callUtils';
import { inlineElement } from './elementUtils';
import { declarationOf, scopeOf } from './scopeUtils';
import { collect, isReference } from './sourceUtils';
import {
  caseOf,
  flattenHeritage,
  spliceStatements,
} from './statementUtils';
import { batched, type Candidate } from './stepUtils';

import type { Sources } from './bindingUtils';
import type { Edit } from './editUtils';

// How early a read must be filled: an element passes values along that the later kinds then find in place.
const RANK = {
  element: 0,
  expression: 1,
  statement: 2,
  type: 3,
  value: 4,
};

const rankOf = (local: ts.Identifier): number => {
  const { parent } = local;

  if (ts.isJsxOpeningElement(parent) || ts.isJsxSelfClosingElement(parent)) {
    return RANK.element;
  }

  if (ts.isPropertyAccessExpression(parent)) {
    return RANK.expression;
  }

  if (ts.isCallExpression(parent) && parent.expression === local) {
    const isStatement = ts.isVariableDeclaration(parent.parent) || caseOf(parent) !== undefined;

    return isStatement ? RANK.statement : RANK.expression;
  }

  return ts.isExpressionWithTypeArguments(parent) || ts.isTypeReferenceNode(parent) ? RANK.type : RANK.value;
};

// One read of a parameter binding replaced by what its option module gives.
const filled = (text: string, sources: Sources, local: ts.Identifier, checker: ts.TypeChecker): Edit[] => {
  const { parent } = local;

  if (ts.isJsxOpeningElement(parent) || ts.isJsxSelfClosingElement(parent)) {
    return inlineElement(text, sources, local, parent, checker);
  }

  if (ts.isPropertyAccessExpression(parent)) {
    return inlineMember(text, sources, local, parent, checker);
  }

  if (ts.isCallExpression(parent) && parent.expression === local) {
    return spliceStatements(text, sources, local, parent, checker);
  }

  if (ts.isExpressionWithTypeArguments(parent) || ts.isTypeReferenceNode(parent)) {
    return flattenHeritage(text, sources, local, checker);
  }

  return inlineValue(text, sources, local, checker);
};

// A type's members merge with every declaration of its name, and a case spliced at the top level may declare one, so
// what another statement reads may change.
const isAlone = (local: ts.Identifier): boolean => {
  const { parent } = local;
  const isCall = ts.isCallExpression(parent) && parent.expression === local;
  const landing = isCall ? caseOf(parent) : undefined;
  const isTopLevel = landing !== undefined && ts.isSourceFile(landing.container);

  return isTopLevel || rankOf(local) === RANK.type;
};

// The next reads of parameter bindings, filled; undefined once none is left. The body holds no imports, so a read
// that resolves to nothing there reads the parameter, and one that resolves to a binding of its name reads that.
export const filledOnce = (text: string, file: ts.SourceFile, sources: Sources): readonly Edit[] | undefined => {
  const { bindings } = sources;
  const checker = scopeOf(file, sources.modules, sources.held);
  const candidates = collect(file, ts.isIdentifier)
    .filter((identifier) => {
      const isRead = bindings.has(identifier.text) && isReference(identifier);

      return isRead && declarationOf(checker, identifier) === undefined;
    })
    .toSorted((left, right) => {
      return rankOf(left) - rankOf(right);
    })
    .map((next) => {
      const candidate: Candidate = {
        node: next,
        isAlone: () => {
          return isAlone(next);
        },
        edits: () => {
          return filled(text, sources, next, checker);
        },
      };

      return candidate;
    });

  return batched(text, candidates);
};
