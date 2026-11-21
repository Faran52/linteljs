import ts from 'typescript';

import { JSX_STRING_ONLY } from '../constants';

import {
  arrowOf,
  captureCheck,
  effectCheck,
  kindOf,
  type Passed,
  returnedOf,
  substitutions,
} from './callUtils';
import {
  applied,
  type Edit,
  refusal,
} from './editUtils';
import {
  actsIn,
  type Proof,
  pureCheck,
} from './effectUtils';
import {
  declarationOf,
  referencesTo,
  resolvedAt,
} from './scopeUtils';
import {
  collect,
  expressionOf,
  indentAt,
  indentOf,
  isPlainElement,
  isReference,
  isWithin,
  leadingIndent,
  linesOf,
  ownsLines,
  patternOf,
  reindent,
  type Span,
  spanOf,
  splice,
  textOf,
  unparen,
} from './sourceUtils';
import { landedCheck } from './stepUtils';

import type { Sources } from './bindingUtils';

type JsxRoot = ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment;

type JsxHead = ts.JsxOpeningElement | ts.JsxSelfClosingElement;

// A text waiting to land on a placeholder, with the indentation it was written at.
interface Placed {
  token: string;
  text: string;
  origin: string;
}

// A rest binding of a parameter, and the spread that reads it at the site.
interface Rest {
  read: ts.Identifier;
  element: ts.BindingElement;
  pattern: ts.ObjectBindingPattern;
  owner: ts.SignatureDeclaration;
}

interface Site {
  head: JsxHead;
  element: ts.JsxElement | ts.JsxSelfClosingElement;
  given: Map<string, ts.Expression>;
  key: ts.JsxAttribute | undefined;
  rest: Rest | undefined;
  // Attributes the rest spread after them may override.
  overridden: Set<string>;
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

// The props a component reads, each a binding of its pattern.
const wantedOf = (arrow: ts.ArrowFunction): readonly ts.BindingElement[] => {
  const [parameter, ...more] = arrow.parameters;

  if (parameter === undefined) {
    return [];
  }

  const pattern = parameter.name;

  if (more.length > 0 || !ts.isObjectBindingPattern(pattern) || !pattern.elements.every(isPlainElement)) {
    throw refusal(arrow, 'A component inlined as an element must destructure plain props');
  }

  return pattern.elements;
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

  if (ts.isStringLiteral(initializer) && JSX_STRING_ONLY.test(initializer.text)) {
    throw refusal(attribute, 'An attribute string holding "&" or a line break means another text as a JS string');
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
const restOf = (checker: ts.TypeChecker, head: JsxHead): Rest | undefined => {
  const [spread, ...more] = head.attributes.properties.filter(ts.isJsxSpreadAttribute);

  if (spread === undefined) {
    return undefined;
  }

  if (more.length > 0) {
    throw refusal(head, 'One rest spread at most on an option component');
  }

  const { expression } = spread;
  const reason = 'Only a rest binding can be spread onto an option component, and one a parameter destructures';
  const read = ts.isIdentifier(expression) ? expression : undefined;
  const element = read === undefined ? undefined : declarationOf(checker, read);

  if (read === undefined || element === undefined || !ts.isBindingElement(element)) {
    throw refusal(spread, reason);
  }

  const pattern = element.parent;
  const parameter = pattern.parent;

  if (element.dotDotDotToken === undefined || !ts.isObjectBindingPattern(pattern) || !ts.isParameter(parameter)) {
    throw refusal(spread, reason);
  }

  const rest: Rest = {
    read,
    element,
    pattern,
    owner: parameter.parent,
  };

  return rest;
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

const siteOf = (checker: ts.TypeChecker, text: string, head: JsxHead): Site => {
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
  const spread = head.attributes.properties.find(ts.isJsxSpreadAttribute);
  const overridden = attributes
    .filter((attribute) => {
      return spread !== undefined && attribute.getStart() < spread.getStart();
    })
    .map((attribute) => {
      return textOf(attribute.name);
    });
  const site: Site = {
    head,
    element,
    given: new Map(pairs),
    key,
    rest: restOf(checker, head),
    overridden: new Set(overridden),
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
const placeProps = (
  checker: ts.TypeChecker,
  placement: Placement,
  root: JsxRoot,
  wanted: readonly ts.BindingElement[],
  site: Site,
): ts.Identifier[] => {
  const needs: ts.Identifier[] = [];

  for (const element of wanted) {
    const name = textOf(element.name);
    const argument = site.given.get(name);

    if (argument === undefined && site.rest === undefined && name !== 'children') {
      throw refusal(site.head, `The option's component needs "${name}", which the base does not pass`);
    }

    if (site.overridden.has(name)) {
      throw refusal(site.head, `"${name}" is written before the rest spread, which may give the component its own`);
    }

    if (argument !== undefined) {
      const origin = indentOf(argument.getSourceFile().text, argument);

      for (const edit of substitutions(checker, root, element, argument)) {
        placement.put(edit, edit.insert, origin);
      }
    }
    else if (name !== 'children' && ts.isIdentifier(element.name)) {
      needs.push(element.name);
    }
  }

  return needs;
};

// The base's children land in the slot, so no binding the option's code makes around it may take one of their reads.
const childrenCheck = (
  checker: ts.TypeChecker,
  root: JsxRoot,
  site: Site,
  slots: readonly ts.JsxExpression[],
): void => {
  const passed = ts.isJsxElement(site.element) ? site.element.children : [];
  const captured = passed
    .flatMap((child) => {
      return collect(child, ts.isIdentifier);
    })
    .filter(isReference)
    .find((read) => {
      return slots
        .some((slot) => {
          const found = resolvedAt(checker, read, slot);

          return found !== undefined && isWithin(found, root);
        });
    });

  if (captured !== undefined) {
    const reason = `"${captured.text}" is also bound around {children} in the option's code, which would capture it`;

    throw refusal(captured, reason);
  }
};

const placeChildren = (
  checker: ts.TypeChecker,
  placement: Placement,
  root: JsxRoot,
  wanted: readonly ts.BindingElement[],
  site: Site,
): void => {
  const children = wanted
    .find((element) => {
      return textOf(element.name) === 'children';
    });
  const reads = children === undefined ? [] : referencesTo(checker, children, root);
  const slots = reads
    .map((read) => {
      if (!ts.isJsxExpression(read.parent) || ts.isJsxAttribute(read.parent.parent)) {
        throw refusal(read, 'An option component can only render its children in place');
      }

      return read.parent;
    });
  const trimmed = site.children.trim();

  if (trimmed !== '' && slots.length !== 1) {
    throw refusal(site.head, 'The base passes children, so the option component must render {children} once');
  }

  childrenCheck(checker, root, site, slots);

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
  const isKeyed = head.attributes.properties
    .some((attribute) => {
      return ts.isJsxAttribute(attribute) && textOf(attribute.name) === 'key';
    });

  if (isKeyed) {
    throw refusal(site.head, 'The option component\'s root has a key of its own, so the base\'s key has no place');
  }

  const at = head.tagName.getEnd();
  const indent = indentOf(root.getSourceFile().text, root);
  const lead = textOf(head).includes('\n') ? `\n${indent}  ` : ' ';
  const span: Span = {
    start: at,
    end: at,
  };

  placement.put(span, textOf(site.key), '', lead);
};

const ignoredCheck = (proof: Proof, wanted: readonly ts.BindingElement[], site: Site): void => {
  const names = wanted
    .map((element) => {
      return textOf(element.name);
    });
  const dropped = [...site.given.entries()]
    .filter(([name]) => {
      return name !== 'key' && !names.includes(name);
    });

  for (const [name, value] of dropped) {
    pureCheck(proof, value, refusal(site.head, `The option's component ignores "${name}", whose value has an effect`));
  }
};

// Every read of a rest binding must be a spread onto an option component still to be filled.
const spreadOnlyCheck = (
  checker: ts.TypeChecker,
  sources: Sources,
  { read, element }: Rest,
): readonly ts.Identifier[] => {
  const reads = referencesTo(checker, element, read.getSourceFile());
  const other = reads
    .find((candidate) => {
      const head = ts.isJsxSpreadAttribute(candidate.parent) ? candidate.parent.parent.parent : undefined;
      const tag = head === undefined || !ts.isIdentifier(head.tagName) ? undefined : head.tagName;

      return tag === undefined || !sources.bindings.has(tag.text) || declarationOf(checker, tag) !== undefined;
    });

  if (other !== undefined) {
    throw refusal(other, `"${read.text}" is still read after composing; a rest binding is only for option components`);
  }

  return reads
    .filter((candidate) => {
      return candidate !== read;
    });
};

// A need read from the rest becomes a binding of the rest's pattern, which nothing else may bind or lose to it.
const needCheck = (checker: ts.TypeChecker, rest: Rest, need: ts.Identifier, landing: ts.Node): void => {
  const { pattern, owner } = rest;
  const found = resolvedAt(checker, need, landing);
  const isPattern = found?.parent === pattern && found !== rest.element;
  const reason = `The option's component reads "${need.text}" from "${rest.read.text}"`;

  if (isPattern) {
    return;
  }

  if (found !== undefined && isWithin(found, owner)) {
    throw refusal(landing, `${reason}, and the base binds that name too`);
  }

  const taken = collect(owner, ts.isIdentifier)
    .find((identifier) => {
      if (identifier.text !== need.text || !isReference(identifier)) {
        return false;
      }

      const declaration = declarationOf(checker, identifier);

      return declaration === undefined || !isWithin(declaration, owner);
    });

  if (taken !== undefined) {
    throw refusal(taken, `${reason}, which would capture this read`);
  }
};

// The rest's pattern names what the component reads from it, and loses the rest once no spread reads it.
const restEdit = (
  text: string,
  rest: Rest,
  needs: readonly ts.Identifier[],
  others: readonly ts.Identifier[],
): Edit => {
  const { pattern, element } = rest;
  const own = pattern.elements
    .filter((candidate) => {
      return candidate !== element;
    })
    .map(textOf);
  const added = needs
    .map((need) => {
      return need.text;
    })
    .filter((name) => {
      return !own.includes(name);
    });
  const names = [...new Set([...own, ...added])];

  if (others.length === 0) {
    const indent = indentOf(text, pattern);
    const whole: Edit = {
      ...spanOf(pattern),
      insert: patternOf(names, indent),
    };

    return whole;
  }

  const at = element.getStart();
  const isOwnLine = ownsLines(text, spanOf(element));
  const gap = isOwnLine ? `\n${indentOf(text, element)}` : ' ';
  const inserted = [...new Set(added)]
    .map((name) => {
      return `${name},${gap}`;
    });
  const before: Edit = {
    start: at,
    end: at,
    insert: inserted.join(''),
  };

  return before;
};

// What the component receives from the attributes, in the order the base writes them.
const passedOf = (proof: Proof, wanted: readonly ts.BindingElement[], site: Site): Passed[] => {
  const names = [...site.given.keys()];

  const placeOf = (each: Passed): number => {
    const name = textOf(each.declaration.name);

    return names.indexOf(name);
  };

  return wanted
    .flatMap((element): Passed[] => {
      const argument = site.given.get(textOf(element.name));

      if (argument === undefined) {
        return [];
      }

      const each: Passed[] = [
        {
          declaration: element,
          kind: kindOf(proof, argument),
          shown: argument,
        },
      ];

      return each;
    })
    .toSorted((left, right) => {
      const before = placeOf(left);
      const after = placeOf(right);

      return before - after;
    });
};

// The children run where the base renders the element, after its attributes: with an effect, they are one more
// argument, read at the {children} slot.
const childrenPassed = (proof: Proof, wanted: readonly ts.BindingElement[], site: Site): Passed[] => {
  const element = wanted
    .find((each) => {
      return textOf(each.name) === 'children';
    });
  const passed = ts.isJsxElement(site.element) ? site.element.children : [];
  const [acting] = passed
    .flatMap((child) => {
      return actsIn(proof, child);
    });

  if (element === undefined || acting === undefined) {
    return [];
  }

  const each: Passed[] = [
    {
      declaration: element,
      kind: 'effect',
      shown: acting,
    },
  ];

  return each;
};

// `<X ...>children</X>`: the option component's returned element replaces the element that renders it.
export const inlineElement = (
  text: string,
  sources: Sources,
  tag: ts.Identifier,
  head: JsxHead,
  checker: ts.TypeChecker,
): string => {
  const arrow = arrowOf(sources, tag);
  const root = rootOf(arrow);
  const wanted = wantedOf(arrow);
  const site = siteOf(checker, text, head);
  const pairs = wanted
    .flatMap((element) => {
      const argument = site.given.get(textOf(element.name));
      const pair: [ts.Declaration, ts.Expression][] = argument === undefined ? [] : [[element, argument]];

      return pair;
    });
  const given = new Map(pairs);
  const proof: Proof = {
    checker,
    sources,
    given,
  };

  ignoredCheck(proof, wanted, site);
  landedCheck(checker, sources, arrow, root, site.element);
  captureCheck(checker, root, given);
  const passed = passedOf(proof, wanted, site);
  const children = childrenPassed(proof, wanted, site);

  effectCheck(proof, root, [...passed, ...children]);

  const placement = new Placement(root);
  const needs = placeProps(checker, placement, root, wanted, site);

  placeChildren(checker, placement, root, wanted, site);
  placeKey(placement, root, site);

  const from = indentOf(root.getSourceFile().text, root);
  const to = indentOf(text, site.element);
  const edited = applied(textOf(root), placement.edits);
  const moved = reindent(edited, from, to);
  const body = withPlaced(moved, placement.placed);
  const inlined: Edit = {
    ...spanOf(site.element),
    insert: body,
  };
  const { rest } = site;

  if (rest === undefined) {
    return applied(text, [inlined]);
  }

  const others = spreadOnlyCheck(checker, sources, rest);

  for (const need of needs) {
    needCheck(checker, rest, need, site.element);
  }

  return applied(text, [inlined, restEdit(text, rest, needs, others)]);
};
