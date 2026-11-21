import ts from 'typescript';

import {
  arrowOf,
  captureCheck,
  orderCheck,
  returnedOf,
  substitutions,
} from './callUtils';
import {
  applied,
  type Edit,
  refusal,
} from './editUtils';
import {
  collect,
  expressionOf,
  indentAt,
  indentOf,
  isPlainElement,
  isPure,
  leadingIndent,
  linesOf,
  ownsLines,
  referencesIn,
  reindent,
  type Span,
  spanOf,
  splice,
  swapped,
  textOf,
  unparen,
} from './sourceUtils';

import type { Sources } from './bindingUtils';

type JsxRoot = ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment;

type JsxHead = ts.JsxOpeningElement | ts.JsxSelfClosingElement;

// A text waiting to land on a placeholder, with the indentation it was written at.
interface Placed {
  token: string;
  text: string;
  origin: string;
}

interface Site {
  head: JsxHead;
  element: ts.JsxElement | ts.JsxSelfClosingElement;
  given: Map<string, ts.Expression>;
  key: ts.JsxAttribute | undefined;
  rest: string | undefined;
  children: string;
}

const MARK = '\u0000';

const rootOf = (arrow: ts.ArrowFunction): JsxRoot => {
  const root = unparen(returnedOf(arrow));

  if (!ts.isJsxElement(root) && !ts.isJsxSelfClosingElement(root) && !ts.isJsxFragment(root)) {
    throw refusal(arrow, 'A component inlined as an element must return one element');
  }

  return root;
};

// The props a component reads, by name.
const wantedOf = (arrow: ts.ArrowFunction): string[] => {
  const [parameter, ...more] = arrow.parameters;

  if (parameter === undefined) {
    return [];
  }

  const pattern = parameter.name;

  if (more.length > 0 || !ts.isObjectBindingPattern(pattern) || !pattern.elements.every(isPlainElement)) {
    throw refusal(arrow, 'A component inlined as an element must destructure plain props');
  }

  return pattern.elements
    .map((element) => {
      return textOf(element.name);
    });
};

const quoted = (text: string): string => {
  const escaped = text
    .replaceAll('\\', '\\\\')
    .replaceAll('\'', '\\\'');

  return `'${escaped}'`;
};

// An attribute's value as an expression: bare is `true`, a string is its literal.
const attributeValue = (attribute: ts.JsxAttribute): ts.Expression => {
  const { initializer } = attribute;

  if (initializer === undefined) {
    return expressionOf('true');
  }

  if (ts.isStringLiteral(initializer)) {
    const literal = quoted(initializer.text);

    return expressionOf(literal);
  }

  const value = ts.isJsxExpression(initializer) ? initializer.expression : undefined;

  if (value === undefined) {
    throw refusal(attribute, 'An attribute passed to an option component must be a string or an expression');
  }

  return value;
};

// The rest binding a spread reads, the one thing an option component may be spread.
const restOf = (head: JsxHead): string | undefined => {
  const [spread, ...more] = head.attributes.properties.filter(ts.isJsxSpreadAttribute);

  if (spread === undefined) {
    return undefined;
  }

  if (more.length > 0) {
    throw refusal(head, 'One rest spread at most on an option component');
  }

  const { expression } = spread;
  const name = ts.isIdentifier(expression) ? expression.text : undefined;
  const file = head.getSourceFile();
  const bound = collect(file, ts.isBindingElement)
    .find((element) => {
      return element.dotDotDotToken !== undefined && textOf(element.name) === name;
    });

  if (name === undefined || bound === undefined) {
    throw refusal(spread, 'Only a rest binding can be spread onto an option component');
  }

  return name;
};

// Each placeholder takes its text, moved to the indentation of the line it lands on.
const withPlaced = (body: string, placed: readonly Placed[]): string => {
  return placed
    .reduce((current, {
      token,
      text,
      origin,
    }) => {
      const at = current.indexOf(token);
      const span: Span = {
        start: at,
        end: at + token.length,
      };

      if (text === '' && ownsLines(current, span)) {
        const lines = linesOf(current, span);

        return splice(current, lines, '');
      }

      const indent = indentAt(current, at);
      const moved = reindent(text, origin, indent);

      return splice(current, span, moved);
    }, body);
};

const siteOf = (text: string, head: JsxHead): Site => {
  const element = ts.isJsxOpeningElement(head) ? head.parent : head;
  const attributes = head.attributes.properties.filter(ts.isJsxAttribute);
  const pairs = attributes
    .map((attribute) => {
      const pair: [string, ts.Expression] = [textOf(attribute.name), attributeValue(attribute)];

      return pair;
    });
  const names = pairs
    .map(([name]) => {
      return name;
    });
  const key = attributes
    .find((attribute) => {
      return textOf(attribute.name) === 'key';
    });

  if (new Set(names).size < names.length || names.includes('children')) {
    throw refusal(head, 'An option component takes each attribute once, and its children between its tags');
  }

  const children = ts.isJsxElement(element)
    ? text.slice(element.openingElement.getEnd(), element.closingElement.getStart())
    : '';
  const site: Site = {
    head,
    element,
    given: new Map(pairs),
    key,
    rest: restOf(head),
    children,
  };

  return site;
};

// The edits a component's root takes, each landing through a placeholder so indentation is settled once.
class Placement {
  public readonly placed: Placed[] = [];

  public readonly edits: Edit[] = [];

  private readonly offset: number;

  public constructor(root: ts.Node) {
    this.offset = root.getStart();
  }

  public put(span: Span, text: string, origin: string, lead = ''): void {
    const token = `${MARK}${String(this.placed.length)}${MARK}`;

    this.placed.push({
      token,
      text,
      origin,
    });

    this.edits.push({
      start: span.start - this.offset,
      end: span.end - this.offset,
      insert: lead + token,
    });
  }
}

// Each prop the component reads takes the base's attribute; one the base leaves to its rest binding is noted.
const placeProps = (placement: Placement, root: JsxRoot, wanted: readonly string[], site: Site): string[] => {
  const needs: string[] = [];
  const props = wanted
    .filter((name) => {
      return name !== 'children';
    });

  for (const name of props) {
    const argument = site.given.get(name);

    if (argument === undefined && site.rest === undefined) {
      throw refusal(site.head, `The option's component needs "${name}", which the base does not pass`);
    }

    if (argument === undefined) {
      needs.push(name);
    }
    else {
      const origin = indentOf(argument.getSourceFile().text, argument);

      for (const edit of substitutions(root, name, argument)) {
        placement.put(edit, edit.insert, origin);
      }
    }
  }

  return needs;
};

const placeChildren = (placement: Placement, root: JsxRoot, site: Site): void => {
  const slots = referencesIn(root, 'children')
    .map((read) => {
      if (!ts.isJsxExpression(read.parent)) {
        throw refusal(read, 'An option component can only render its children in place');
      }

      return read.parent;
    });
  const trimmed = site.children.trim();

  if (trimmed !== '' && slots.length !== 1) {
    throw refusal(site.head, 'The base passes children, so the option component must render {children} once');
  }

  const origin = leadingIndent(site.children);

  for (const slot of slots) {
    placement.put(spanOf(slot), trimmed, origin);
  }
};

// A key belongs to the element the list holds, so it moves to the component's root.
const placeKey = (placement: Placement, root: JsxRoot, site: Site): void => {
  if (site.key === undefined) {
    return;
  }

  if (ts.isJsxFragment(root)) {
    throw refusal(site.head, 'A key needs an element, and the option component returns a fragment');
  }

  const head = ts.isJsxElement(root) ? root.openingElement : root;
  const at = head.tagName.getEnd();
  const indent = indentOf(root.getSourceFile().text, root);
  const lead = textOf(head).includes('\n') ? `\n${indent}  ` : ' ';
  const span: Span = {
    start: at,
    end: at,
  };

  placement.put(span, textOf(site.key), '', lead);
};

const ignoredCheck = (wanted: readonly string[], site: Site): void => {
  const ignored = [...site.given.entries()]
    .find(([name, value]) => {
      return name !== 'key' && !wanted.includes(name) && !isPure(value);
    });

  if (ignored !== undefined) {
    throw refusal(site.head, `The option's component ignores "${ignored[0]}", whose value has an effect`);
  }
};

// `<X ...>children</X>`: the option component's returned element replaces the element that renders it.
export const inlineElement = (text: string, sources: Sources, tag: ts.Identifier, head: JsxHead): string => {
  const arrow = arrowOf(sources, tag);
  const root = rootOf(arrow);
  const wanted = wantedOf(arrow);
  const site = siteOf(text, head);
  const given = [...site.given.values()];

  ignoredCheck(wanted, site);
  captureCheck(root, given);
  orderCheck(root, site.given);

  const placement = new Placement(root);
  const needs = placeProps(placement, root, wanted, site);

  placeChildren(placement, root, site);
  placeKey(placement, root, site);

  if (site.rest !== undefined) {
    const known = sources.rests.get(site.rest) ?? [];
    const names = new Set([...known, ...needs]);

    sources.rests.set(site.rest, [...names]);
  }

  const from = indentOf(root.getSourceFile().text, root);
  const to = indentOf(text, site.element);
  const edited = applied(textOf(root), placement.edits);
  const moved = reindent(edited, from, to);
  const body = withPlaced(moved, placement.placed);

  return swapped(text, site.element, body);
};
