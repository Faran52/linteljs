import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  asElement,
  attributesOf,
  elementAttributesOf,
  elementNameOf,
  elementsOf,
  expressionOf,
  findProp,
  hasProp,
  hasSpread,
  hasTextContent,
  isHidden,
  isInteractive,
  keyNameOf,
  literalValueOf,
  openingOf,
  propertiesOf,
} from './jsxUtils.ts';

// A lint run only ever hands these a real parsed node, so the declining arms below are reachable from a direct call
// alone. The rule suites cover everything a parse can produce.

describe('attributesOf', () => {
  it.each([
    ['a node carrying no attributes', { type: 'Identifier' }],
    ['attributes that are not a list', {
      type: 'JSXOpeningElement',
      attributes: 'accessible',
    }],
  ])('declines %s', (_label, value) => {
    expect(attributesOf(value)).toEqual([]);
  });

  it('answers the list on a real opening element', () => {
    const attributes = [{ type: 'JSXSpreadAttribute' } as const];
    // Bound first rather than passed inline: `attributesOf` takes the two-field node every rule narrows from,
    // and a fresh literal carrying `attributes` trips the excess-property check.
    const node = {
      type: 'JSXOpeningElement',
      attributes,
    };

    expect(attributesOf(node)).toBe(attributes);
  });
});

describe('asElement', () => {
  it('declines a node with no opening element', () => {
    expect(asElement({ type: 'Identifier' })).toEqual({});
  });
});

describe('openingOf', () => {
  it('reads an element with no opening element as an empty one', () => {
    expect(openingOf({})).toEqual({});
  });
});

describe('elementNameOf', () => {
  it('answers an empty string for a missing name', () => {
    expect(elementNameOf(undefined)).toBe('');
  });

  it('reads a plain identifier', () => {
    expect(elementNameOf({
      type: 'JSXIdentifier',
      name: 'Pressable',
    })).toBe('Pressable');
  });

  // The last part, so `Animated.Image` is checked as an `Image`.
  it('reads the last part of a qualified name', () => {
    expect(elementNameOf({
      type: 'JSXMemberExpression',
      property: {
        type: 'JSXIdentifier',
        name: 'Image',
      },
    })).toBe('Image');
  });

  it('reads the local half of a namespaced name', () => {
    expect(elementNameOf({
      type: 'JSXNamespacedName',
      name: {
        type: 'JSXIdentifier',
        name: 'rect',
      },
    })).toBe('rect');
  });
});

describe('findProp', () => {
  const spread = { type: 'JSXSpreadAttribute' } as const;
  const accessible = {
    type: 'JSXAttribute',
    name: {
      type: 'JSXIdentifier',
      name: 'accessible',
    },
  } as const;

  it('skips a spread when looking for a named prop', () => {
    expect(findProp([spread, accessible], ['accessible'])).toBe(accessible);
  });

  it('answers undefined when no name matches', () => {
    expect(findProp([spread, accessible], ['accessibilityLabel'])).toBeUndefined();
    expect(hasProp([spread, accessible], ['accessibilityLabel'])).toBe(false);
  });

  it('sees a spread', () => {
    expect(hasSpread([accessible])).toBe(false);
    expect(hasSpread([accessible, spread])).toBe(true);
  });
});

describe('literalValueOf', () => {
  const named = {
    type: 'JSXIdentifier',
    name: 'accessible',
  } as const;

  // `<View accessible />` is `accessible={true}`, which is the shape most of these rules key on.
  it('reads a bare attribute as true', () => {
    expect(literalValueOf({
      type: 'JSXAttribute',
      name: named,
    })).toBe(true);
  });

  it('reads a string attribute', () => {
    expect(literalValueOf({
      type: 'JSXAttribute',
      name: named,
      value: {
        type: 'Literal',
        value: 'yes',
      },
    })).toBe('yes');
  });

  it('reads a literal inside braces', () => {
    expect(literalValueOf({
      type: 'JSXAttribute',
      name: named,
      value: {
        type: 'JSXExpressionContainer',
        expression: {
          type: 'Literal',
          value: false,
        },
      },
    })).toBe(false);
  });

  // Unreadable rather than absent: a value computed at runtime is the caller's to get right.
  it('answers undefined for a value computed at runtime', () => {
    expect(literalValueOf({
      type: 'JSXAttribute',
      name: named,
      value: {
        type: 'JSXExpressionContainer',
        expression: {
          type: 'Identifier',
          name: 'flag',
        },
      },
    })).toBeUndefined();
  });
});

describe('expressionOf', () => {
  it('answers undefined when the value is not in braces', () => {
    expect(expressionOf({
      type: 'JSXAttribute',
      name: {
        type: 'JSXIdentifier',
        name: 'accessibilityState',
      },
      value: {
        type: 'Literal',
        value: 'disabled',
      },
    })).toBeUndefined();
  });
});

describe('keyNameOf', () => {
  it.each([
    ['a spread with no key', { type: 'SpreadElement' }],
    ['a computed key', {
      type: 'Property',
      computed: true,
      key: {
        type: 'Identifier',
        name: 'disabled',
      },
    }],
    ['a key that is not a string', {
      type: 'Property',
      key: {
        type: 'Literal',
        value: 1,
      },
    }],
  ])('names nothing for %s', (_label, property) => {
    expect(keyNameOf(property)).toBeUndefined();
  });

  it('reads a string-literal key', () => {
    expect(keyNameOf({
      type: 'Property',
      key: {
        type: 'Literal',
        value: 'disabled',
      },
    })).toBe('disabled');
  });
});

describe('isHidden', () => {
  it('reads importantForAccessibility=no-hide-descendants as hidden', () => {
    expect(isHidden([{
      type: 'JSXAttribute',
      name: {
        type: 'JSXIdentifier',
        name: 'importantForAccessibility',
      },
      value: {
        type: 'Literal',
        value: 'no-hide-descendants',
      },
    }])).toBe(true);
  });

  // The other three values leave the element reachable, so they are not this rule's business.
  it('leaves the other importantForAccessibility values alone', () => {
    expect(isHidden([{
      type: 'JSXAttribute',
      name: {
        type: 'JSXIdentifier',
        name: 'importantForAccessibility',
      },
      value: {
        type: 'Literal',
        value: 'yes',
      },
    }])).toBe(false);
  });
});

// A parse always fills these three in, so only a direct call reaches the empty answer. They exist so that
// assumption sits in one tested place instead of as a `?? []` in each rule.
describe('the array accessors', () => {
  it('reads an element with no opening element as having no attributes', () => {
    expect(elementAttributesOf({ type: 'JSXElement' })).toEqual([]);
  });

  it('reads an expression with no properties as having none', () => {
    expect(propertiesOf({ type: 'Identifier' })).toEqual([]);
  });

  it('reads an expression with no elements as having none', () => {
    expect(elementsOf({ type: 'Identifier' })).toEqual([]);
  });
});

describe('isInteractive', () => {
  it('reads an element with neither a known name nor a handler as inert', () => {
    expect(isInteractive({ type: 'JSXElement' }, ['Pressable'])).toBe(false);
  });
});

describe('hasTextContent', () => {
  it('reads an element with no children as silent', () => {
    expect(hasTextContent({ type: 'JSXElement' })).toBe(false);
  });

  // A parsed `JSXText` always carries its text, so the empty-string fallback is reachable from here alone.
  it('reads a text child carrying no text as silent', () => {
    expect(hasTextContent({
      type: 'JSXElement',
      children: [{ type: 'JSXText' }],
    })).toBe(false);
  });
});
