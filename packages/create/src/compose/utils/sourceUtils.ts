import ts from 'typescript';

import {
  BINARY_LEVELS,
  INTRINSIC_TAG,
  LEVEL,
  PURE_KEYWORDS,
  UPDATES,
  WHOLE_EXPRESSION,
  WRITTEN,
} from '../constants';

export interface Span {
  start: number;
  end: number;
}

export type ValueMember = ts.PropertyAssignment | ts.ShorthandPropertyAssignment;

// TSX for every module, so one parser reads a base and its option modules alike.
export const parse = (text: string): ts.SourceFile => {
  return ts.createSourceFile('module.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
};

export const spanOf = (node: ts.Node): Span => {
  const span: Span = {
    start: node.getStart(),
    end: node.getEnd(),
  };

  return span;
};

export const textOf = (node: ts.Node): string => {
  const { text } = node.getSourceFile();
  const { start, end } = spanOf(node);

  return text.slice(start, end);
};

export const splice = (text: string, span: Span, insert: string): string => {
  return text.slice(0, span.start) + insert + text.slice(span.end);
};

// A node's text replaced, the rest left as written.
export const swapped = (text: string, node: ts.Node, insert: string): string => {
  const span = spanOf(node);

  return splice(text, span, insert);
};

export const lineStart = (text: string, position: number): number => {
  return text.lastIndexOf('\n', position - 1) + 1;
};

export const lineEnd = (text: string, position: number): number => {
  const end = text.indexOf('\n', position);

  return end === -1 ? text.length : end;
};

export const indentAt = (text: string, position: number): string => {
  const line = text.slice(lineStart(text, position), position);

  const at = line.search(WRITTEN);

  return at === -1 ? line : line.slice(0, at);
};

export const indentOf = (text: string, node: ts.Node): string => {
  const start = node.getStart();

  return indentAt(text, start);
};

// The whitespace a text opens with, past any blank lines.
export const leadingIndent = (text: string): string => {
  const at = text.length - text.trimStart().length;

  return indentAt(text, at);
};

// Alone on its lines: only whitespace before it and after it.
export const ownsLines = (text: string, span: Span): boolean => {
  const before = text.slice(lineStart(text, span.start), span.start);
  const after = text.slice(span.end, lineEnd(text, span.end));

  return before.trim() === '' && after.trim() === '';
};

// The whole lines a span sits on, with their line break.
export const linesOf = (text: string, span: Span): Span => {
  const lines: Span = {
    start: lineStart(text, span.start),
    end: Math.min(lineEnd(text, span.end) + 1, text.length),
  };

  return lines;
};

// The whole lines to take out, without leaving two blank lines, or one at the top of a block.
export const linesGone = (text: string, span: Span): Span => {
  const lines = linesOf(text, span);
  const previous = lineStart(text, lines.start - 1);
  const before = text
    .slice(previous, lines.start)
    .trim();
  const nextEnd = lineEnd(text, lines.end);
  const next = text.slice(lines.end, nextEnd);
  const isOpen = before === '' || before.endsWith('{');
  const end = isOpen && next.trim() === '' ? Math.min(nextEnd + 1, text.length) : lines.end;
  const gone: Span = {
    start: lines.start,
    end,
  };

  return gone;
};

// Every line after the first moves from one indentation to another; a blank line stays blank.
export const reindent = (block: string, from: string, to: string): string => {
  const [first = '', ...rest] = block.split('\n');
  const moved = rest
    .map((line) => {
      if (line.trim() === '') {
        return line;
      }

      return line.startsWith(from) ? to + line.slice(from.length) : line;
    });

  const lines = [first, ...moved];

  return lines.join('\n');
};

export const unparen = (node: ts.Expression): ts.Expression => {
  return ts.isParenthesizedExpression(node) ? unparen(node.expression) : node;
};

// Through `satisfies` and parentheses to the value an export holds.
export const valueOf = (node: ts.Expression): ts.Expression => {
  if (ts.isParenthesizedExpression(node) || ts.isSatisfiesExpression(node)) {
    return valueOf(node.expression);
  }

  return node;
};

export const walk = (node: ts.Node, visit: (node: ts.Node) => void): void => {
  visit(node);

  node
    .forEachChild((child) => {
      walk(child, visit);
    });
};

export const collect = <TNode extends ts.Node>(root: ts.Node, test: (node: ts.Node) => node is TNode): TNode[] => {
  const found: TNode[] = [];

  walk(root, (node) => {
    if (test(node)) {
      found.push(node);
    }
  });

  return found;
};

const isTagName = (node: ts.Identifier): boolean => {
  const { parent } = node;
  const isTag = ts.isJsxOpeningElement(parent) || ts.isJsxSelfClosingElement(parent) || ts.isJsxClosingElement(parent);

  return isTag && parent.tagName === node;
};

// An identifier that reads a value or names a type, not one that only spells a member, a key or an HTML tag.
export const isReference = (node: ts.Identifier): boolean => {
  const { parent } = node;

  if (ts.isPropertyAccessExpression(parent) || ts.isQualifiedName(parent)) {
    return parent.getChildAt(0) === node;
  }

  if (isTagName(node)) {
    return !INTRINSIC_TAG.test(node.text);
  }

  if (ts.isShorthandPropertyAssignment(parent)) {
    return true;
  }

  if (ts.isExportSpecifier(parent)) {
    return (parent.propertyName ?? parent.name) === node;
  }

  const isLabel = ts.isLabeledStatement(parent) || ts.isBreakOrContinueStatement(parent);

  if (isLabel || (ts.isBindingElement(parent) && parent.propertyName === node)) {
    return false;
  }

  // Whatever a declaration, a member or an attribute is named by is its name, not a read.
  return !('name' in parent) || parent.name !== node;
};

export const referencesIn = (root: ts.Node, name: string): ts.Identifier[] => {
  return collect(root, ts.isIdentifier)
    .filter((identifier) => {
      return identifier.text === name && isReference(identifier);
    });
};

// Whether a node sits inside another, in the same file.
export const isWithin = (node: ts.Node, outer: ts.Node): boolean => {
  const isSameFile = node.getSourceFile() === outer.getSourceFile();

  return isSameFile && node.getStart() >= outer.getStart() && node.getEnd() <= outer.getEnd();
};

export const isValueMember = (property: ts.ObjectLiteralElementLike): property is ValueMember => {
  return ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property);
};

const isKeyLiteral = (key: ts.Node): key is ts.StringLiteral | ts.NumericLiteral | ts.NoSubstitutionTemplateLiteral => {
  return ts.isStringLiteral(key) || ts.isNumericLiteral(key) || ts.isNoSubstitutionTemplateLiteral(key);
};

// The name a member's key gives it, undefined for a spread or a key only known when the code runs.
export const keyOf = (property: ts.ObjectLiteralElementLike): string | undefined => {
  const { name } = property;

  if (name !== undefined && ts.isIdentifier(name)) {
    return name.text;
  }

  const key = name !== undefined && ts.isComputedPropertyName(name) ? name.expression : name;

  return key !== undefined && isKeyLiteral(key) ? key.text : undefined;
};

// The last member that is, or may be, the literal's member of that name; undefined when none can be.
export const memberIn = (table: ts.ObjectLiteralExpression, name: string): ts.ObjectLiteralElementLike | undefined => {
  return table.properties
    .findLast((property) => {
      const key = keyOf(property);

      return key === undefined || key === name;
    });
};

// `__proto__: p` sets what the object inherits from; written computed or shorthand, it is an own member.
export const isPrototype = (property: ts.ObjectLiteralElementLike): boolean => {
  const isSetter = ts.isPropertyAssignment(property) && !ts.isComputedPropertyName(property.name);

  return isSetter && keyOf(property) === '__proto__';
};

// Through the wrappers that only speak to the type checker.
const unwrapped = (node: ts.Expression): ts.Expression => {
  const isWrapper = ts.isParenthesizedExpression(node)
    || ts.isAsExpression(node)
    || ts.isSatisfiesExpression(node)
    || ts.isNonNullExpression(node);

  return isWrapper ? unwrapped(node.expression) : node;
};

const isPureProperty = (property: ts.ObjectLiteralElementLike): boolean => {
  if (ts.isShorthandPropertyAssignment(property)) {
    return true;
  }

  const isPlain = ts.isPropertyAssignment(property) && !ts.isComputedPropertyName(property.name);

  return isPlain && isPure(property.initializer);
};

// Evaluating it twice, or not at all, changes nothing. Reading a name or a member is taken to have no effect.
export const isPure = (node: ts.Expression): boolean => {
  const value = unwrapped(node);

  if (ts.isIdentifier(value) || ts.isLiteralExpression(value) || ts.isArrowFunction(value)) {
    return true;
  }

  if (PURE_KEYWORDS.has(value.kind)) {
    return true;
  }

  if (ts.isPropertyAccessExpression(value)) {
    return isPure(value.expression);
  }

  if (ts.isElementAccessExpression(value)) {
    return isPure(value.expression) && isPure(value.argumentExpression);
  }

  if (ts.isPrefixUnaryExpression(value)) {
    return !UPDATES.has(value.operator) && isPure(value.operand);
  }

  if (ts.isConditionalExpression(value)) {
    return isPure(value.condition) && isPure(value.whenTrue) && isPure(value.whenFalse);
  }

  if (ts.isBinaryExpression(value)) {
    return BINARY_LEVELS.has(value.operatorToken.kind) && isPure(value.left) && isPure(value.right);
  }

  if (ts.isTemplateExpression(value)) {
    return value.templateSpans
      .every((span) => {
        return isPure(span.expression);
      });
  }

  return ts.isObjectLiteralExpression(value) && value.properties.every(isPureProperty);
};

// Assigned to, updated or deleted rather than read.
export const isWritten = (node: ts.Expression): boolean => {
  const { parent } = node;

  if (ts.isBinaryExpression(parent)) {
    return parent.left === node && !BINARY_LEVELS.has(parent.operatorToken.kind);
  }

  const isUpdate = ts.isPrefixUnaryExpression(parent) || ts.isPostfixUnaryExpression(parent);

  return ts.isDeleteExpression(parent) || (isUpdate && UPDATES.has(parent.operator));
};

// How tightly an expression holds together; an operator this table does not name is an assignment.
const levelOf = (value: ts.Expression): number => {
  if (ts.isBinaryExpression(value)) {
    return BINARY_LEVELS.get(value.operatorToken.kind) ?? LEVEL.assignment;
  }

  if (ts.isConditionalExpression(value) || ts.isArrowFunction(value) || ts.isYieldExpression(value)) {
    return LEVEL.assignment;
  }

  const isKeyworded = ts.isTypeOfExpression(value) || ts.isAwaitExpression(value) || ts.isVoidExpression(value);

  if (ts.isPrefixUnaryExpression(value) || isKeyworded) {
    return LEVEL.unary;
  }

  if (ts.isAsExpression(value) || ts.isSatisfiesExpression(value)) {
    return LEVEL.relational;
  }

  if (ts.isPropertyAccessExpression(value) || ts.isElementAccessExpression(value) || ts.isCallExpression(value)) {
    return LEVEL.member;
  }

  return ts.isFunctionExpression(value) || ts.isObjectLiteralExpression(value) ? LEVEL.member - 1 : LEVEL.primary;
};

// The loosest expression a position takes without parentheses.
const roomAt = (replaced: ts.Node): number => {
  const { parent } = replaced;

  if (WHOLE_EXPRESSION.has(parent.kind)) {
    return LEVEL.assignment;
  }

  if (ts.isCallExpression(parent) && parent.expression !== replaced) {
    return LEVEL.assignment;
  }

  if (ts.isConditionalExpression(parent)) {
    return parent.condition === replaced ? LEVEL.nullish : LEVEL.assignment;
  }

  // `??` takes neither `||` nor `&&` beside it without parentheses.
  if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) {
    return LEVEL.bitOr;
  }

  const level = ts.isBinaryExpression(parent) ? BINARY_LEVELS.get(parent.operatorToken.kind) : undefined;

  // An assignment takes any expression but a comma on its right.
  if (ts.isBinaryExpression(parent) && level === undefined) {
    return parent.right === replaced ? LEVEL.assignment : LEVEL.member;
  }

  if (level !== undefined) {
    return level + 1;
  }

  // One above a unary operator's own level, so `-x` never becomes `--1`.
  return ts.isPrefixUnaryExpression(parent) ? LEVEL.unary + 1 : LEVEL.member;
};

// An expression's text as it can stand in place of `replaced` without changing what either means.
export const fitted = (replaced: ts.Node, expression: ts.Expression): string => {
  const text = textOf(expression);
  const { parent } = replaced;

  if (ts.isShorthandPropertyAssignment(parent)) {
    return `${textOf(replaced)}: ${text}`;
  }

  if (ts.isArrowFunction(parent) && parent.body === replaced) {
    const isWhole = !ts.isObjectLiteralExpression(expression) && levelOf(expression) >= LEVEL.assignment;

    return isWhole ? text : `(${text})`;
  }

  // `4.toFixed()` does not parse.
  const isDotted = ts.isNumericLiteral(expression) && ts.isPropertyAccessExpression(parent);

  return levelOf(expression) >= roomAt(replaced) && !isDotted ? text : `(${text})`;
};

// The same expression parsed alone, for the cases where a text has to become a node again.
export const expressionOf = (text: string): ts.Expression => {
  const file = parse(`(${text});`);
  const written = text.trim();
  const whole = collect(file, ts.isParenthesizedExpression)
    .map((wrapped) => {
      return wrapped.expression;
    })
    .find((inner) => {
      return textOf(inner) === written;
    });

  if (whole === undefined || written === '') {
    throw new Error(`Not an expression: ${text}`);
  }

  return whole;
};

// A pattern member that is a name and nothing more: not renamed, not a rest, no default.
export const isPlainElement = (element: ts.BindingElement): boolean => {
  const isRenamed = element.propertyName !== undefined || element.dotDotDotToken !== undefined;

  return !isRenamed && element.initializer === undefined && ts.isIdentifier(element.name);
};

// Up to two names on one line, more than two broken, one per line.
export const patternOf = (names: readonly string[], indent: string): string => {
  if (names.length === 0) {
    return '{}';
  }

  if (names.length <= 2) {
    return `{ ${names.join(', ')} }`;
  }

  const lines = names
    .map((name) => {
      return `${indent}  ${name},`;
    });

  return `{\n${lines.join('\n')}\n${indent}}`;
};
