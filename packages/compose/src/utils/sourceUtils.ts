import ts from 'typescript';

import {
  BINARY_LEVELS,
  CALLED_FROM,
  COERCING_OPERATORS,
  COERCING_UNARY,
  INTRINSIC_TAG,
  LEVEL,
  LINE_BREAKS,
  LOOKING_OPERATORS,
  PATTERN_PARTS,
  PRIMITIVE_LITERALS,
  PURE_KEYWORDS,
  STRING_TOKENS,
  UNARY_OPERATORS,
  UPDATES,
  WHOLE_EXPRESSION,
  WRITTEN,
} from '../constants';

export interface Span {
  start: number;
  end: number;
}

export type ValueMember = ts.PropertyAssignment | ts.ShorthandPropertyAssignment;

export type MemberRead = ts.PropertyAccessExpression | ts.ElementAccessExpression;

export interface Fitting {
  before: string;
  after: string;
}

// What proves a value pure past names, literals and arrows: a member read plain, an operand a primitive.
export interface Purity {
  isPlain: (read: MemberRead) => boolean;
  isPrimitive: (operand: ts.Expression) => boolean;
}

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

// The whole lines to take out, without leaving two blank lines, or one at the top or the end of a block.
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
  const isClosing = lines.end === text.length || next
    .trimStart()
    .startsWith('}');
  const isBlankBefore = before === '' && previous < lines.start;
  const gone: Span = {
    start: isBlankBefore && isClosing ? previous : lines.start,
    end,
  };

  return gone;
};

const isStringToken = (node: ts.Node): node is ts.Node => {
  return STRING_TOKENS.has(node.kind);
};

// The lines, by index, that open inside a string or template written over lines: their text is its value.
const heldLines = (block: string): Set<number> => {
  const file = parse(block);
  const held = collect(file, isStringToken)
    .flatMap((token) => {
      const start = token.getStart();
      const end = token.getEnd();
      const breaks = block
        .slice(start, end)
        .matchAll(LINE_BREAKS);
      const found = Array.from(breaks);

      return found
        .map((lineBreak) => {
          const before = block.slice(0, start + lineBreak.index);

          return before.split('\n').length;
        });
    });

  return new Set(held);
};

// The lines, by index, that move from one indentation to another: every line after the first that opens with it, but
// a blank line, and one inside a string or a template written over lines, whose text is its value.
export const movedLines = (block: string, from: string): Set<number> => {
  const held = heldLines(block);
  const moved = block
    .split('\n')
    .entries()
    .filter(([index, line]) => {
      return index > 0 && !held.has(index) && line.trim() !== '' && line.startsWith(from);
    })
    .map(([index]) => {
      return index;
    });

  return new Set(moved);
};

export const reindent = (block: string, from: string, to: string): string => {
  const moved = movedLines(block, from);

  return block
    .split('\n')
    .map((line, index) => {
      return moved.has(index) ? to + line.slice(from.length) : line;
    })
    .join('\n');
};

export const isAsync = (node: ts.Node): boolean => {
  const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
  const found = modifiers
    ?.some((modifier) => {
      return modifier.kind === ts.SyntaxKind.AsyncKeyword;
    });

  return found === true;
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
export const unwrapped = (node: ts.Expression): ts.Expression => {
  const isWrapper = ts.isParenthesizedExpression(node)
    || ts.isAsExpression(node)
    || ts.isSatisfiesExpression(node)
    || ts.isNonNullExpression(node);

  return isWrapper ? unwrapped(node.expression) : node;
};

// The operands a node converts, or undefined when it converts none.
const coercedOf = (node: ts.Node): readonly ts.Expression[] | undefined => {
  if (ts.isBinaryExpression(node) && COERCING_OPERATORS.has(node.operatorToken.kind)) {
    const operands = [node.left, node.right];

    return operands;
  }

  if (ts.isPrefixUnaryExpression(node) && COERCING_UNARY.has(node.operator)) {
    const operands = [node.operand];

    return operands;
  }

  if (ts.isTemplateExpression(node)) {
    return node.templateSpans
      .map((span) => {
        return span.expression;
      });
  }

  if (ts.isElementAccessExpression(node)) {
    const key = [node.argumentExpression];

    return key;
  }

  if (ts.isComputedPropertyName(node) && !ts.isTypeElement(node.parent)) {
    const key = [node.expression];

    return key;
  }

  return undefined;
};

// Whether a node converts an operand not proven a primitive, which runs the operand's own code when it is an object.
export const isConverting = (node: ts.Node, isPrimitive: (operand: ts.Expression) => boolean): boolean => {
  const coerced = coercedOf(node);

  return coerced !== undefined && !coerced.every(isPrimitive);
};

// An operator that runs nothing of its operands but what converting them runs: `in` and `instanceof` look inside one.
export const isQuietOperator = (operator: ts.SyntaxKind): boolean => {
  return BINARY_LEVELS.has(operator) && !LOOKING_OPERATORS.has(operator);
};

// A literal a conversion takes as it is.
export const isPrimitiveLiteral = (operand: ts.Expression): boolean => {
  return PRIMITIVE_LITERALS.has(unwrapped(operand).kind);
};

const isUnproven = (): boolean => {
  return false;
};

const provenBy = (purity: Purity | undefined): Purity => {
  const none: Purity = {
    isPlain: isUnproven,
    isPrimitive: isPrimitiveLiteral,
  };

  return purity ?? none;
};

// Evaluating it twice, or not at all, changes nothing. A name is read with no effect; a member read or a conversion
// only when `purity` proves it, so with none no member read is, and only a conversion of literals.
export const isPure = (node: ts.Expression, purity: Purity | undefined): boolean => {
  const value = unwrapped(node);
  const { isPlain, isPrimitive } = provenBy(purity);

  const isPureIn = (inner: ts.Expression): boolean => {
    return isPure(inner, purity);
  };

  if (isConverting(value, isPrimitive)) {
    return false;
  }

  if (ts.isIdentifier(value) || ts.isLiteralExpression(value) || ts.isArrowFunction(value)) {
    return true;
  }

  if (PURE_KEYWORDS.has(value.kind)) {
    return true;
  }

  if (ts.isPropertyAccessExpression(value) || ts.isElementAccessExpression(value)) {
    const isRead = isPlain(value) && isPureIn(value.expression);

    return isRead && (ts.isPropertyAccessExpression(value) || isPureIn(value.argumentExpression));
  }

  if (ts.isPrefixUnaryExpression(value)) {
    return !UPDATES.has(value.operator) && isPureIn(value.operand);
  }

  if (ts.isConditionalExpression(value)) {
    return isPureIn(value.condition) && isPureIn(value.whenTrue) && isPureIn(value.whenFalse);
  }

  if (ts.isBinaryExpression(value)) {
    return isQuietOperator(value.operatorToken.kind) && isPureIn(value.left) && isPureIn(value.right);
  }

  if (ts.isTemplateExpression(value)) {
    return value.templateSpans
      .every((span) => {
        return isPureIn(span.expression);
      });
  }

  return ts.isObjectLiteralExpression(value) && value.properties
    .every((property) => {
      const isPlainValue = ts.isPropertyAssignment(property) && !ts.isComputedPropertyName(property.name);

      return ts.isShorthandPropertyAssignment(property) || (isPlainValue && isPureIn(property.initializer));
    });
};

// The target of an assignment, `for ... of` or `for ... in`, or a part of one a destructuring writes into.
const isTarget = (node: ts.Node): boolean => {
  const { parent } = node;

  if (ts.isBinaryExpression(parent)) {
    return parent.left === node && !BINARY_LEVELS.has(parent.operatorToken.kind);
  }

  if (ts.isForOfStatement(parent) || ts.isForInStatement(parent)) {
    return parent.initializer === node;
  }

  // A shorthand's default is read; a property's name is never a read, so its node here is the value.
  const isMember = ts.isShorthandPropertyAssignment(parent) ? parent.name === node : ts.isPropertyAssignment(parent);
  return (isMember || PATTERN_PARTS.has(parent.kind)) && isTarget(parent);
};

// Assigned to, destructured into, updated or deleted rather than read.
export const isWritten = (node: ts.Expression): boolean => {
  const { parent } = node;
  const isUpdate = ts.isPrefixUnaryExpression(parent) || ts.isPostfixUnaryExpression(parent);

  return isTarget(node) || ts.isDeleteExpression(parent) || (isUpdate && UPDATES.has(parent.operator));
};

// What a read, a non-null assertion or a tag continues: the chain before it.
const linkOf = (value: ts.Expression): ts.Expression | undefined => {
  const isRead = ts.isPropertyAccessExpression(value) || ts.isElementAccessExpression(value);
  const inner = isRead || ts.isNonNullExpression(value) ? value.expression : undefined;

  return ts.isTaggedTemplateExpression(value) ? value.tag : inner;
};

// How tightly an expression holds together; an operator this table does not name is an assignment.
const levelOf = (value: ts.Expression): number => {
  if (ts.isBinaryExpression(value)) {
    return BINARY_LEVELS.get(value.operatorToken.kind) ?? LEVEL.assignment;
  }

  if (ts.isConditionalExpression(value) || ts.isArrowFunction(value) || ts.isYieldExpression(value)) {
    return LEVEL.assignment;
  }

  if (ts.isPrefixUnaryExpression(value) || UNARY_OPERATORS.has(value.kind)) {
    return LEVEL.unary;
  }

  if (ts.isAsExpression(value) || ts.isSatisfiesExpression(value)) {
    return LEVEL.relational;
  }

  if (ts.isOptionalChain(value)) {
    return LEVEL.optional;
  }

  if (ts.isCallExpression(value)) {
    return LEVEL.call;
  }

  // A chain holds together as loosely as the loosest link in it.
  const link = linkOf(value);

  if (link !== undefined) {
    const linked = levelOf(link);

    return Math.min(LEVEL.member, linked);
  }

  const isBare = ts.isNewExpression(value) && value.arguments === undefined;
  const isOpen = ts.isFunctionExpression(value) || ts.isClassExpression(value) || ts.isObjectLiteralExpression(value);

  if (isBare || isOpen || ts.isPostfixUnaryExpression(value)) {
    return LEVEL.optional;
  }

  return ts.isNewExpression(value) ? LEVEL.member : LEVEL.primary;
};

// The loosest expression a binary operator takes on one side without parentheses.
const operandRoom = (parent: ts.BinaryExpression, replaced: ts.Node): number => {
  const { kind } = parent.operatorToken;
  const level = BINARY_LEVELS.get(kind);

  // An assignment takes any expression but a comma on its right.
  if (level === undefined) {
    return parent.right === replaced ? LEVEL.assignment : LEVEL.call;
  }

  // `??` takes neither `||` nor `&&` beside it without parentheses.
  if (kind === ts.SyntaxKind.QuestionQuestionToken) {
    return LEVEL.bitOr;
  }

  // `-1 ** 2` does not parse: the base of a power is never a unary expression.
  return kind === ts.SyntaxKind.AsteriskAsteriskToken && parent.left === replaced ? LEVEL.optional : level + 1;
};

// The loosest expression a position takes without parentheses.
const roomAt = (replaced: ts.Node): number => {
  const { parent } = replaced;
  const isArgument = (ts.isCallExpression(parent) || ts.isNewExpression(parent)) && parent.expression !== replaced;

  if (WHOLE_EXPRESSION.has(parent.kind) || isArgument) {
    return LEVEL.assignment;
  }

  if (ts.isConditionalExpression(parent)) {
    return parent.condition === replaced ? LEVEL.nullish : LEVEL.assignment;
  }

  if (ts.isBinaryExpression(parent)) {
    return operandRoom(parent, replaced);
  }

  // One above a unary operator's own level, so `-x` never becomes `--1`.
  if (ts.isPrefixUnaryExpression(parent)) {
    return LEVEL.unary + 1;
  }

  if (UNARY_OPERATORS.has(parent.kind)) {
    return LEVEL.unary;
  }

  // `class extends` takes a call, an optional chain or a bare `new`, as the left of an assignment does.
  if (ts.isExpressionWithTypeArguments(parent)) {
    return LEVEL.optional;
  }

  return CALLED_FROM.has(parent.kind) ? LEVEL.call : LEVEL.member;
};

// What an expression's text needs around it to stand in place of `replaced` without changing what either means.
export const fittingOf = (replaced: ts.Node, expression: ts.Expression): Fitting => {
  const { parent } = replaced;
  const wrapped: Fitting = {
    before: '(',
    after: ')',
  };
  const bare: Fitting = {
    before: '',
    after: '',
  };

  if (ts.isShorthandPropertyAssignment(parent)) {
    const named: Fitting = {
      before: `${textOf(replaced)}: `,
      after: '',
    };

    return named;
  }

  if (ts.isArrowFunction(parent) && parent.body === replaced) {
    const isWhole = !ts.isObjectLiteralExpression(expression) && levelOf(expression) >= LEVEL.assignment;

    return isWhole ? bare : wrapped;
  }

  // `4.toFixed()` does not parse.
  const isDotted = ts.isNumericLiteral(expression) && ts.isPropertyAccessExpression(parent);

  return levelOf(expression) >= roomAt(replaced) && !isDotted ? bare : wrapped;
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
