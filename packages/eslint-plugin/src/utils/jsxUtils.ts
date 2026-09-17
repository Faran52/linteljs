// JSX is absent from ESLint's ESTree types, so the accessibility rules describe the nodes they read as structural
// interfaces. Structural rather than nominal so a test can hand these a plain object, and so no rule needs a cast.

// A JSX name in all three spellings: `View`, `Animated.Image`, `svg:path`. `name` is a string on a `JSXIdentifier`
// and a nested name on a `JSXNamespacedName`, which is why it carries both.
export interface JsxName {
  type: string;
  name?: string | JsxName | undefined;
  property?: JsxName | undefined;
}

// What a `Literal` node can hold. Named rather than spelled out at each of its three sites.
export type LiteralValue = string | number | boolean | null | undefined;

// The expression fields these rules read. A `Literal` carries `value`, an `Identifier` carries `name`, and the two
// collection forms carry their members; everything else is left unread and reported as "not statically known".
export interface JsxExpression {
  type: string;
  value?: LiteralValue;
  name?: string | undefined;
  properties?: JsxProperty[] | undefined;
  elements?: (JsxExpression | null)[] | undefined;
}

export interface JsxProperty {
  type: string;
  computed?: boolean | undefined;
  key?: JsxExpression | undefined;
  value?: JsxExpression | undefined;
}

// A string attribute parses as a `Literal` directly; anything in braces arrives inside a `JSXExpressionContainer`.
export interface JsxAttributeValue {
  type: string;
  value?: LiteralValue;
  expression?: JsxExpression | undefined;
}

export interface JsxAttribute {
  type: 'JSXAttribute';
  name: JsxName;
  value?: JsxAttributeValue | null | undefined;
}

export interface JsxSpreadAttribute {
  type: 'JSXSpreadAttribute';
}

export type JsxAttributeLike = JsxAttribute | JsxSpreadAttribute;

export interface JsxOpeningElement {
  type?: string | undefined;
  name?: JsxName | undefined;
  attributes?: JsxAttributeLike[] | undefined;
}

// A child is text, an expression container, or another element; only the fields the walk below reads are named.
export interface JsxChild {
  type: string;
  value?: string | undefined;
  expression?: JsxExpression | undefined;
  openingElement?: JsxOpeningElement | undefined;
  children?: JsxChild[] | undefined;
}

export interface JsxElement {
  type?: string | undefined;
  openingElement?: JsxOpeningElement | undefined;
  children?: JsxChild[] | undefined;
}

// The one property every ESLint node carries, and all these helpers ask for before narrowing.
export interface TypedNode {
  type: string;
}

// Both spellings of every prop that carries the same meaning: React Native maps the ARIA alias onto the legacy name,
// so a rule that knows only one of the two reports a component that is already accessible.
export const LABEL_PROPS = ['accessibilityLabel', 'aria-label'] as const;

export const LABELLED_BY_PROPS = ['accessibilityLabelledBy', 'aria-labelledby'] as const;

export const HINT_PROPS = ['accessibilityHint'] as const;

export const ROLE_PROPS = ['accessibilityRole', 'role'] as const;

// Props through which an element handles a touch itself, so it is operated whatever it is named.
export const TOUCH_HANDLER_PROPS = [
  'onPress',
  'onPressIn',
  'onPressOut',
  'onLongPress',
  'onAccessibilityTap',
] as const;

// React Native's own touchables plus the two controls that render no children to read a name from.
export const TOUCHABLE_COMPONENTS = [
  'Button',
  'Pressable',
  'Switch',
  'TextInput',
  'Touchable',
  'TouchableBounce',
  'TouchableHighlight',
  'TouchableNativeFeedback',
  'TouchableOpacity',
  'TouchableWithoutFeedback',
] as const;

// Props that hide an element from assistive technology. `accessible={false}` is deliberately not here: it drops the
// element as a focus stop and leaves its children reachable, which is a different thing from being hidden.
const HIDDEN_PROPS = ['aria-hidden', 'accessibilityElementsHidden'] as const;

const isElementList = (node: TypedNode): node is TypedNode & { attributes: JsxAttributeLike[] } => {
  return 'attributes' in node && Array.isArray(node.attributes);
};

// An empty list rather than a visitor guard: a lint run never hands over anything else, so only a direct call
// reaches the declining arm.
export const attributesOf = (node: TypedNode): JsxAttributeLike[] => {
  return isElementList(node) ? node.attributes : [];
};

// The last part of a qualified name, so `Animated.Image` is checked as an `Image` and `svg:path` as a `path`.
export const elementNameOf = (name: JsxName | undefined): string => {
  if (!name) {
    return '';
  }

  if (typeof name.name === 'string') {
    return name.name;
  }

  if (name.property) {
    return elementNameOf(name.property);
  }

  return elementNameOf(name.name);
};

export const hasSpread = (attributes: JsxAttributeLike[]): boolean => {
  return attributes.some((attribute) => {
    return attribute.type === 'JSXSpreadAttribute';
  });
};

export const findProp = (
  attributes: JsxAttributeLike[],
  names: readonly string[],
): JsxAttribute | undefined => {
  return attributes.find((attribute): attribute is JsxAttribute => {
    return attribute.type === 'JSXAttribute' && names.includes(elementNameOf(attribute.name));
  });
};

export const hasProp = (attributes: JsxAttributeLike[], names: readonly string[]): boolean => {
  return findProp(attributes, names) !== undefined;
};

// What JSX gives a bare `<View accessible />`, standing in so the read below has one shape and one return.
const BARE_ATTRIBUTE: JsxAttributeValue = {
  type: 'Literal',
  value: true,
};

// The value where the source states it outright, and `undefined` where it does not: a value computed at runtime is
// unreadable rather than absent, and every caller treats the two differently.
export const literalValueOf = (attribute: JsxAttribute): LiteralValue => {
  const value = attribute.value ?? BARE_ATTRIBUTE;
  const literal = value.type === 'Literal' ? value : value.expression;

  return literal?.type === 'Literal' ? literal.value : undefined;
};

// The expression behind a prop, for the two rules that read an object or an array out of one.
export const expressionOf = (attribute: JsxAttribute): JsxExpression | undefined => {
  return attribute.value?.type === 'JSXExpressionContainer' ? attribute.value.expression : undefined;
};

// An object property's key where it is written down: a computed key is a runtime value and names nothing here.
export const keyNameOf = (property: JsxProperty): string | undefined => {
  if (property.computed || !property.key) {
    return undefined;
  }

  if (property.key.type === 'Identifier') {
    return property.key.name;
  }

  return property.key.type === 'Literal' && typeof property.key.value === 'string'
    ? property.key.value
    : undefined;
};

/**
 * Decorative content is hidden from assistive technology rather than labelled, so a rule asking for a name skips it.
 * A value computed at runtime counts as hidden: staying quiet about an element that may be hidden beats reporting one
 * that is.
 */
export const isHidden = (attributes: JsxAttributeLike[]): boolean => {
  const hidden = findProp(attributes, HIDDEN_PROPS);

  if (hidden && literalValueOf(hidden) !== false) {
    return true;
  }

  const important = findProp(attributes, ['importantForAccessibility']);

  return important !== undefined && literalValueOf(important) === 'no-hide-descendants';
};

const isElementNode = (node: TypedNode): node is TypedNode & JsxElement => {
  return 'openingElement' in node;
};

/**
 * A lint run only ever hands a `JSXElement` listener a real element, so the empty arm is reachable from a direct
 * call alone. An empty element then reads as one with no name, no attributes and no children, which every caller
 * already handles.
 */
export const asElement = (node: TypedNode): JsxElement => {
  return isElementNode(node) ? node : {};
};

export const openingOf = (node: JsxChild | JsxElement): JsxOpeningElement => {
  return node.openingElement ?? {};
};

/**
 * The three reads where a parse always hands over an array and the type cannot say so, because the same interfaces
 * describe the empty stand-ins above. Kept here so the assumption is written down and tested once, rather than as a
 * `?? []` in each rule that no fixture can reach.
 */
export const elementAttributesOf = (element: JsxChild | JsxElement): JsxAttributeLike[] => {
  return openingOf(element).attributes ?? [];
};

export const propertiesOf = (expression: JsxExpression): JsxProperty[] => {
  return expression.properties ?? [];
};

export const elementsOf = (expression: JsxExpression): (JsxExpression | null)[] => {
  return expression.elements ?? [];
};

// Whether the user can operate this element: it is one of React Native's touchables, it was named as one in the
// rule's options, or it handles a touch through a prop whatever it is called.
export const isInteractive = (
  element: JsxChild | JsxElement,
  components: readonly string[],
): boolean => {
  const opening = openingOf(element);
  const attributes = opening.attributes ?? [];

  return components.includes(elementNameOf(opening.name))
    || hasProp(attributes, TOUCH_HANDLER_PROPS);
};

// Depth-first over every element below `node`, so a control nested inside layout views is still found.
export const descendantElements = (node: JsxChild | JsxElement): JsxChild[] => {
  return (node.children ?? []).flatMap((child) => {
    return child.type === 'JSXElement'
      ? [child, ...descendantElements(child)]
      : descendantElements(child);
  });
};

/**
 * Whether anything below this element would be read aloud. React Native builds a missing label by accumulating the
 * Text nodes under an element, so a control wrapping visible words already has a name.
 *
 * Generous on purpose: an expression container holds a value this rule cannot read, and assuming it renders text
 * costs a missed report, while assuming it does not costs a false one on the commonest pattern in the language.
 */
export const hasTextContent = (node: JsxChild | JsxElement): boolean => {
  return (node.children ?? []).some((child) => {
    if (child.type === 'JSXText') {
      return (child.value ?? '').trim() !== '';
    }

    if (child.type === 'JSXExpressionContainer') {
      return child.expression?.type !== 'JSXEmptyExpression';
    }

    return hasTextContent(child);
  });
};
