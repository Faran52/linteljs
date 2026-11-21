import { isEqual } from 'es-toolkit';
import ts from 'typescript';

import {
  ATTRIBUTE_NAME,
  JSX_LEADING_SPACES,
  JSX_LINE_BREAK,
  PLAIN_STRING,
  TRAILING_COMMA,
  WRITTEN,
} from '../constants';

import { refusal } from './editUtils';
import {
  collect,
  fitted,
  indentAt,
  isPrototype,
  isPure,
  isValueMember,
  isWritten,
  keyOf,
  leadingIndent,
  linesGone,
  linesOf,
  memberIn,
  ownsLines,
  parse,
  type Span,
  spanOf,
  splice,
  swapped,
  textOf,
  unparen,
  type ValueMember,
} from './sourceUtils';

type Rule = (text: string, node: ts.Node) => string | undefined;

type Shown = string | ts.SyntaxKind;

type JsxParent = ts.JsxElement | ts.JsxFragment;

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

// Called, a member runs with the literal as `this`, which only an arrow function does not read.
const isThisFree = (node: ts.PropertyAccessExpression, member: ValueMember): boolean => {
  const { parent } = node;
  const isCallee = (ts.isCallExpression(parent) && parent.expression === node)
    || (ts.isTaggedTemplateExpression(parent) && parent.tag === node);

  const isArrow = ts.isPropertyAssignment(member) && ts.isArrowFunction(unparen(member.initializer));

  return !isCallee || isArrow;
};

// `({ a: 1 }).a` is `1`, and a member the literal lacks is `undefined` unless every object inherits it.
const memberRule: Rule = (text, node) => {
  const table = ts.isPropertyAccessExpression(node) ? literalOf(node.expression) : undefined;

  if (!ts.isPropertyAccessExpression(node) || table === undefined || !isPure(table) || isWritten(node)) {
    return undefined;
  }

  const name = node.name.text;
  const member = memberIn(table, name);
  const isInherited = Reflect.has(Object.prototype, name) || table.properties.some(isPrototype);

  if (member === undefined) {
    return isInherited ? undefined : swapped(text, node, 'undefined');
  }

  if (!isValueMember(member) || keyOf(member) !== name || !isThisFree(node, member)) {
    return undefined;
  }

  const value = ts.isPropertyAssignment(member) ? fitted(node, member.initializer) : name;

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

// An absent attribute and one that is `undefined` read the same, unless an earlier one would show through. After a
// spread it decides which value wins, so it is refused rather than kept or dropped.
const undefinedAttributeRule: Rule = (text, node) => {
  if (!ts.isJsxAttribute(node) || node.initializer === undefined || !ts.isJsxExpression(node.initializer)) {
    return undefined;
  }

  const value = node.initializer.expression;
  const siblings = node.parent.properties;
  const earlier = siblings.slice(0, siblings.indexOf(node));
  const isUndefined = value !== undefined && ts.isIdentifier(value) && value.text === 'undefined';

  if (isUndefined && earlier.some(ts.isJsxSpreadAttribute)) {
    const reason = 'An attribute set to undefined after a spread overrides the spread, so it cannot be removed';

    throw refusal(node, reason);
  }

  const isShadowing = earlier
    .some((sibling) => {
      return ts.isJsxAttribute(sibling) && textOf(sibling.name) === textOf(node.name);
    });

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
    const gone = linesGone(text, span);

    return splice(text, gone, '');
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

const isJsxParent = (node: ts.Node): node is JsxParent => {
  return ts.isJsxElement(node) || ts.isJsxFragment(node);
};

// What a JSX text renders: each line trimmed where it meets another, blank lines dropped, the rest joined by a space.
const shownText = (raw: string): string => {
  const lines = raw.split(JSX_LINE_BREAK);
  const last = lines.length - 1;

  return lines
    .map((line, index) => {
      const opened = index === 0 ? line : line.replace(JSX_LEADING_SPACES, '');
      const end = opened
        .split('')
        .findLastIndex((character) => {
          return WRITTEN.test(character);
        });

      return index === last ? opened : opened.slice(0, end + 1);
    })
    .filter((line) => {
      return line !== '';
    })
    .join(' ');
};

// What children render, fragments opened: the text they show, and every other child by its kind.
const shownOf = (children: readonly ts.JsxChild[]): Shown[] => {
  const parts = children
    .flatMap((child): Shown[] => {
      if (ts.isJsxFragment(child)) {
        return shownOf(child.children);
      }

      const shown = ts.isJsxText(child) ? shownText(child.text) : child.kind;
      const kept: Shown[] = shown === '' ? [] : [shown];

      return kept;
    });

  // Two texts side by side render as one.
  return parts
    .reduce<Shown[]>((all, part) => {
      const previous = all.at(-1);

      if (typeof part === 'string' && typeof previous === 'string') {
        return all.with(-1, previous + part);
      }

      return all.concat(part);
    }, []);
};

// A fragment's children in its place; alone on its lines, each line it held moves to the fragment's indentation.
const unwrapped = (text: string, node: ts.JsxFragment): string => {
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
  const pieces = inner.split('\n');
  const from = leadingIndent(pieces
    .slice(1)
    .join('\n'));
  const written = pieces
    .map((line, index) => {
      if (index === 0) {
        return to + line.trimStart();
      }

      return line.startsWith(from) ? to + line.slice(from.length) : line;
    })
    .filter((line, index) => {
      const isTag = index === 0 || index === pieces.length - 1;

      return !isTag || line.trim() !== '';
    })
    .map((line) => {
      return `${line}\n`;
    })
    .join('');

  return splice(text, lines, written);
};

// A fragment among an element's children is its own children, kept where that would change what they render.
const fragmentRule: Rule = (text, node) => {
  const { parent } = node;

  if (!ts.isJsxFragment(node) || !isJsxParent(parent)) {
    return undefined;
  }

  const next = unwrapped(text, node);
  const before = shownOf(parent.children);
  const start = parent.getStart();
  const file = parse(next);
  const after = collect(file, isJsxParent)
    .filter((candidate) => {
      return candidate.getStart() === start;
    })
    .map((candidate) => {
      return shownOf(candidate.children);
    });

  return isEqual(after, [before]) ? next : undefined;
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
