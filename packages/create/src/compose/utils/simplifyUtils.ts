import ts from 'typescript';

import {
  ATTRIBUTE_NAME,
  PLAIN_STRING,
  TRAILING_COMMA,
} from '../constants';

import {
  collect,
  fitted,
  indentAt,
  isPure,
  isWritten,
  leadingIndent,
  linesOf,
  ownsLines,
  type Span,
  spanOf,
  splice,
  swapped,
  textOf,
  unparen,
  withoutLines,
} from './sourceUtils';

type Rule = (text: string, node: ts.Node) => string | undefined;

const literalOf = (node: ts.Expression): ts.ObjectLiteralExpression | undefined => {
  const value = unparen(node);

  return ts.isObjectLiteralExpression(value) ? value : undefined;
};

// A node's text gone: its lines too when it stood alone on them, else the space that led to it.
const removed = (text: string, node: ts.Node): string => {
  const span = spanOf(node);
  const isLed = text.charAt(span.start - 1) === ' ';
  const inline: Span = {
    start: isLed ? span.start - 1 : span.start,
    end: span.end,
  };
  const whole = ownsLines(text, span) ? linesOf(text, span) : inline;

  return splice(text, whole, '');
};

const nameOf = (property: ts.ObjectLiteralElementLike): string | undefined => {
  return property.name === undefined ? undefined : textOf(property.name);
};

// `__proto__` in a literal sets what the object inherits from, so its members are not all written there.
const isPrototype = (property: ts.ObjectLiteralElementLike): boolean => {
  return nameOf(property) === '__proto__';
};

// `({ a: 1 }).a` is `1`, and a member the literal lacks is `undefined` unless every object inherits it.
const memberRule: Rule = (text, node) => {
  const table = ts.isPropertyAccessExpression(node) ? literalOf(node.expression) : undefined;

  if (!ts.isPropertyAccessExpression(node) || table === undefined || !isPure(table) || isWritten(node)) {
    return undefined;
  }

  // The last of two members with one name is the one an object keeps.
  const member = table.properties
    .findLast((property) => {
      return nameOf(property) === node.name.text;
    });
  const isInherited = Reflect.has(Object.prototype, node.name.text) || table.properties.some(isPrototype);

  if (member === undefined) {
    return isInherited ? undefined : swapped(text, node, 'undefined');
  }

  const value = ts.isPropertyAssignment(member) ? fitted(node, member.initializer) : node.name.text;

  return swapped(text, node, value);
};

// `true ? a : b` is `a`.
const conditionRule: Rule = (text, node) => {
  if (!ts.isConditionalExpression(node)) {
    return undefined;
  }

  const { kind } = unparen(node.condition);

  if (kind !== ts.SyntaxKind.TrueKeyword && kind !== ts.SyntaxKind.FalseKeyword) {
    return undefined;
  }

  const branch = kind === ts.SyntaxKind.TrueKeyword ? node.whenTrue : node.whenFalse;
  const value = fitted(node, branch);

  return swapped(text, node, value);
};

const attributeOf = (property: ts.ObjectLiteralElementLike): string | undefined => {
  if (ts.isShorthandPropertyAssignment(property)) {
    return `${property.name.text}={${property.name.text}}`;
  }

  if (!ts.isPropertyAssignment(property)) {
    return undefined;
  }

  const name = ts.isStringLiteral(property.name) ? property.name.text : textOf(property.name);
  const value = property.initializer;
  const isQuotable = ts.isStringLiteral(value) && PLAIN_STRING.test(value.text);

  if (!ATTRIBUTE_NAME.test(name)) {
    return undefined;
  }

  return isQuotable ? `${name}="${value.text}"` : `${name}={${textOf(value)}}`;
};

// `{...{ a: 1 }}` is `a={1}`: the same attributes, in the same place and order.
const spreadAttributeRule: Rule = (text, node) => {
  const table = ts.isJsxSpreadAttribute(node) ? literalOf(node.expression) : undefined;
  const attributes = table?.properties.map(attributeOf);
  const written = attributes
    ?.filter((attribute) => {
      return attribute !== undefined;
    });

  if (attributes === undefined || written?.length !== attributes.length) {
    return undefined;
  }

  if (written.length === 0) {
    return removed(text, node);
  }

  const span = spanOf(node);
  const gap = ownsLines(text, span) ? `\n${indentAt(text, span.start)}` : ' ';
  const joined = written.join(gap);

  return splice(text, span, joined);
};

// An absent attribute and one that is `undefined` read the same, unless an earlier one would show through.
const undefinedAttributeRule: Rule = (text, node) => {
  if (!ts.isJsxAttribute(node) || node.initializer === undefined || !ts.isJsxExpression(node.initializer)) {
    return undefined;
  }

  const value = node.initializer.expression;
  const siblings = node.parent.properties;
  const earlier = siblings.slice(0, siblings.indexOf(node));
  const isShadowing = earlier
    .some((sibling) => {
      return ts.isJsxSpreadAttribute(sibling) || textOf(sibling.name) === textOf(node.name);
    });
  const isUndefined = value !== undefined && ts.isIdentifier(value) && value.text === 'undefined';

  return isUndefined && !isShadowing ? removed(text, node) : undefined;
};

// A property with the comma that follows it.
const withComma = (text: string, node: ts.Node): Span => {
  const end = node.getEnd();
  const span: Span = {
    start: node.getStart(),
    end: text.charAt(end) === ',' ? end + 1 : end,
  };

  return span;
};

// A property gone from its literal, with the comma that set it apart.
const withoutProperty = (text: string, node: ts.SpreadAssignment): string => {
  const end = node.getEnd();
  const span = withComma(text, node);
  const isFollowed = span.end > end;

  if (node.parent.properties.length === 1) {
    return swapped(text, node.parent, '{}');
  }

  if (ownsLines(text, span)) {
    return withoutLines(text, span);
  }

  const inline: Span = isFollowed
    ? {
        start: span.start,
        end: text.charAt(span.end) === ' ' ? span.end + 1 : span.end,
      }
    : {
        start: text.lastIndexOf(',', span.start),
        end,
      };

  return splice(text, inline, '');
};

// `{ ...{ a: 1 } }` is `{ a: 1 }`, and `...{}` is nothing.
const spreadPropertyRule: Rule = (text, node) => {
  const table = ts.isSpreadAssignment(node) ? literalOf(node.expression) : undefined;
  const isCopyable = table?.properties
    .every((property) => {
      const isValue = ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property);

      return (isValue || ts.isSpreadAssignment(property)) && !isPrototype(property);
    });

  if (!ts.isSpreadAssignment(node) || table === undefined || isCopyable !== true) {
    return undefined;
  }

  if (table.properties.length === 0) {
    return withoutProperty(text, node);
  }

  const span = withComma(text, node);
  const inner = text.slice(table.getStart() + 1, table.getEnd() - 1);

  // Alone on its lines, a literal written over several lines keeps them, comments and blank lines too.
  if (ownsLines(text, span) && inner.startsWith('\n')) {
    const to = indentAt(text, span.start);
    const from = leadingIndent(inner);
    const moved = inner
      .trimEnd()
      .replace(TRAILING_COMMA, '')
      .split('\n')
      .slice(1)
      .map((line) => {
        return line.startsWith(from) ? to + line.slice(from.length) : line;
      });
    const comma = span.end > node.getEnd() ? ',' : '';
    const lines = linesOf(text, span);

    return splice(text, lines, `${moved.join('\n')}${comma}\n`);
  }

  const properties = table.properties
    .map(textOf)
    .join(', ');

  return swapped(text, node, properties);
};

// A fragment among an element's children is its own children, in place and at the fragment's indentation.
const fragmentRule: Rule = (text, node) => {
  const isChild = ts.isJsxFragment(node) && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent));

  if (!ts.isJsxFragment(node) || !isChild) {
    return undefined;
  }

  const span = spanOf(node);
  const inner = text.slice(node.openingFragment.getEnd(), node.closingFragment.getStart());

  if (!ownsLines(text, span)) {
    return splice(text, span, inner);
  }

  const lines = linesOf(text, span);

  if (!inner.includes('\n')) {
    return inner === '' ? splice(text, lines, '') : splice(text, span, inner);
  }

  const to = indentAt(text, span.start);
  const from = leadingIndent(inner);
  const moved = inner
    .split('\n')
    .slice(1, -1)
    .map((line) => {
      return line.startsWith(from) ? to + line.slice(from.length) : line;
    })
    .map((line) => {
      return `${line}\n`;
    })
    .join('');

  return splice(text, lines, moved);
};

const RULES: readonly Rule[] = [
  memberRule,
  conditionRule,
  spreadAttributeRule,
  undefinedAttributeRule,
  spreadPropertyRule,
  fragmentRule,
];

const isNode = (node: ts.Node): node is ts.Node => {
  return node.kind !== ts.SyntaxKind.Unknown;
};

// One rewrite, innermost first; undefined once nothing applies.
export const simplifiedOnce = (text: string, file: ts.SourceFile): string | undefined => {
  const nodes = collect(file, isNode).toReversed();

  for (const node of nodes) {
    for (const rule of RULES) {
      const next = rule(text, node);

      if (next !== undefined) {
        return next;
      }
    }
  }

  return undefined;
};
