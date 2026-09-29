// JSX is absent from ESLint's ESTree types; structural, so a test can hand these a plain object.

import { NO_CHILDREN } from '../constants.ts';

import {
  mustFind,
  type NodeLocation,
  type TypedNode,
} from './ruleUtils.ts';

export interface JsxName {
  type: string;
  name?: string | JsxName | undefined;
  namespace?: JsxName | undefined;
  property?: JsxName | undefined;
}

export type LiteralValue = string | number | boolean | null | undefined;

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

export interface JsxAttributeValue {
  type: string;
  value?: LiteralValue;
  expression?: JsxExpression | undefined;
}

export interface JsxAttribute {
  type: 'JSXAttribute';
  name: JsxName;
  value?: JsxAttributeValue | null | undefined;
  loc?: NodeLocation | undefined;
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

interface Attributed {
  attributes: JsxAttributeLike[];
}

// React Native maps the ARIA alias onto the legacy name, so a rule must know both.
export const LABEL_PROPS = ['accessibilityLabel', 'aria-label'] as const;

export const LABELLED_BY_PROPS = ['accessibilityLabelledBy', 'aria-labelledby'] as const;

export const HINT_PROPS = ['accessibilityHint'] as const;

const TOUCH_HANDLER_PROPS = [
  'onPress',
  'onPressIn',
  'onPressOut',
  'onLongPress',
  'onAccessibilityTap',
] as const;

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

// Not `accessible={false}`: it drops the focus stop and leaves children reachable, which is not hidden.
const HIDDEN_PROPS = ['aria-hidden', 'accessibilityElementsHidden'] as const;

const isElementList = (node: TypedNode): node is TypedNode & Attributed => {
  return 'attributes' in node && Array.isArray(node.attributes);
};

// A lint run never hands over anything else, so only a direct call reaches the declining arm.
export const attributesOf = (node: TypedNode): JsxAttributeLike[] => {
  return isElementList(node) ? node.attributes : [];
};

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
  return attributes
    .some((attribute) => {
      return attribute.type === 'JSXSpreadAttribute';
    });
};

export const findProp = (
  attributes: JsxAttributeLike[],
  names: readonly string[],
): JsxAttribute | undefined => {
  return attributes
    .find((attribute): attribute is JsxAttribute => {
      return attribute.type === 'JSXAttribute' && names.includes(elementNameOf(attribute.name));
    });
};

export const hasProp = (attributes: JsxAttributeLike[], names: readonly string[]): boolean => {
  return findProp(attributes, names) !== undefined;
};

const BARE_ATTRIBUTE: JsxAttributeValue = {
  type: 'Literal',
  value: true,
};

// `undefined` where the source does not state it: a runtime value is unreadable rather than absent.
export const literalValueOf = (attribute: JsxAttribute): LiteralValue => {
  const value = attribute.value ?? BARE_ATTRIBUTE;
  const literal = value.type === 'Literal' ? value : value.expression;

  return literal?.type === 'Literal' ? literal.value : undefined;
};

export const expressionOf = (attribute: JsxAttribute): JsxExpression | undefined => {
  return attribute.value?.type === 'JSXExpressionContainer' ? attribute.value.expression : undefined;
};

export const keyNameOf = (property: JsxProperty): string | undefined => {
  if (property.computed || !property.key) {
    return undefined;
  }

  if (property.key.type === 'Identifier') {
    return property.key.name;
  }

  // A key that is neither computed nor an identifier is a literal, and only a string one names a key.
  return typeof property.key.value === 'string' ? property.key.value : undefined;
};

// A runtime value counts as hidden: staying quiet beats reporting an element that is hidden.
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

// Only a direct call reaches the empty arm.
export const asElement = (node: TypedNode): JsxElement => {
  return isElementNode(node) ? node : {};
};

export const openingOf = (node: JsxChild | JsxElement): JsxOpeningElement => {
  return node.openingElement ?? {};
};

// A parse always hands over an array here; written down once rather than as an unreachable `?? []` per rule.
export const elementAttributesOf = (element: JsxChild | JsxElement): JsxAttributeLike[] => {
  return openingOf(element).attributes ?? [];
};

export const propertiesOf = (expression: JsxExpression): JsxProperty[] => {
  return expression.properties ?? [];
};

export const elementsOf = (expression: JsxExpression): (JsxExpression | null)[] => {
  return expression.elements ?? [];
};

export const isInteractive = (
  element: JsxChild | JsxElement,
  components: readonly string[],
): boolean => {
  return components.includes(elementNameOf(openingOf(element).name))
    || hasProp(elementAttributesOf(element), TOUCH_HANDLER_PROPS);
};

export const descendantElements = (node: JsxChild | JsxElement): JsxChild[] => {
  return (node.children ?? NO_CHILDREN)
    .flatMap((child) => {
      return child.type === 'JSXElement'
        ? [child, ...descendantElements(child)]
        : descendantElements(child);
    });
};

// Generous on purpose: assuming an expression renders text costs a missed report, not a false one.
export const hasTextContent = (node: JsxChild | JsxElement): boolean => {
  return (node.children ?? NO_CHILDREN)
    .some((child) => {
      if (child.type === 'JSXText') {
        return (child.value ?? '').trim() !== '';
      }

      // A container always holds an expression, `{}` included as JSXEmptyExpression.
      if (child.type === 'JSXExpressionContainer') {
        return mustFind(child.expression).type !== 'JSXEmptyExpression';
      }

      return hasTextContent(child);
    });
};
