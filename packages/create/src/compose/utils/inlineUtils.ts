import ts from 'typescript';

import { inlineMember, inlineValue } from './callUtils';
import { inlineElement } from './elementUtils';
import { declarationOf, scopeOf } from './scopeUtils';
import { collect, isReference } from './sourceUtils';
import { flattenHeritage, spliceStatements } from './statementUtils';

import type { Sources } from './bindingUtils';

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
    return ts.isVariableDeclaration(parent.parent) ? RANK.statement : RANK.expression;
  }

  return ts.isExpressionWithTypeArguments(parent) || ts.isTypeReferenceNode(parent) ? RANK.type : RANK.value;
};

// One read of a parameter binding replaced by what its option module gives.
const filled = (text: string, sources: Sources, local: ts.Identifier, checker: ts.TypeChecker): string => {
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

// The next read of a parameter binding, filled; undefined once none is left. The body holds no imports, so a read
// that resolves to nothing there reads the parameter, and one that resolves to a binding of its name reads that.
export const filledOnce = (text: string, file: ts.SourceFile, sources: Sources): string | undefined => {
  const { bindings } = sources;
  const checker = scopeOf(file, sources.modules);
  const [next] = collect(file, ts.isIdentifier)
    .filter((identifier) => {
      const isClosing = ts.isJsxClosingElement(identifier.parent);
      const isRead = bindings.has(identifier.text) && isReference(identifier) && !isClosing;

      return isRead && declarationOf(checker, identifier) === undefined;
    })
    .toSorted((left, right) => {
      return rankOf(left) - rankOf(right);
    });

  return next === undefined ? undefined : filled(text, sources, next, checker);
};
