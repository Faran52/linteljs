import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  asElement,
  attributesOf,
  descendantElements,
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

// Driven with hand-built nodes of the shapes a parse hands over, so every arm is reached here rather than through a
// rule's suite; the declining arms are reachable from a direct call alone.

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
  it('hands back a node that has an opening element', () => {
    const element = {
      type: 'JSXElement',
      openingElement: { type: 'JSXOpeningElement' },
    };

    expect(asElement(element)).toBe(element);
  });

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
    const elementName = elementNameOf({
      type: 'JSXIdentifier',
      name: 'Pressable',
    });

    expect(elementName).toBe('Pressable');
  });

  // The last part, so `Animated.Image` is checked as an `Image`.
  it('reads the last part of a qualified name', () => {
    const elementName = elementNameOf({
      type: 'JSXMemberExpression',
      property: {
        type: 'JSXIdentifier',
        name: 'Image',
      },
    });

    expect(elementName).toBe('Image');
  });

  it('reads the local half of a namespaced name', () => {
    const elementName = elementNameOf({
      type: 'JSXNamespacedName',
      name: {
        type: 'JSXIdentifier',
        name: 'rect',
      },
    });

    expect(elementName).toBe('rect');
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
    const literal = literalValueOf({
      type: 'JSXAttribute',
      name: named,
    });

    expect(literal).toBe(true);
  });

  it('reads a string attribute', () => {
    const literal = literalValueOf({
      type: 'JSXAttribute',
      name: named,
      value: {
        type: 'Literal',
        value: 'yes',
      },
    });

    expect(literal).toBe('yes');
  });

  it('reads a literal inside braces', () => {
    const literal = literalValueOf({
      type: 'JSXAttribute',
      name: named,
      value: {
        type: 'JSXExpressionContainer',
        expression: {
          type: 'Literal',
          value: false,
        },
      },
    });

    expect(literal).toBe(false);
  });

  // Unreadable rather than absent: a value computed at runtime is the caller's to get right.
  it('answers undefined for a value computed at runtime', () => {
    const literal = literalValueOf({
      type: 'JSXAttribute',
      name: named,
      value: {
        type: 'JSXExpressionContainer',
        expression: {
          type: 'Identifier',
          name: 'flag',
        },
      },
    });

    expect(literal).toBeUndefined();
  });
});

describe('expressionOf', () => {
  it('answers the expression inside the braces', () => {
    const expression = { type: 'ObjectExpression' };

    const found = expressionOf({
      type: 'JSXAttribute',
      name: {
        type: 'JSXIdentifier',
        name: 'accessibilityState',
      },
      value: {
        type: 'JSXExpressionContainer',
        expression,
      },
    });

    expect(found).toBe(expression);
  });

  it('answers undefined when the value is not in braces', () => {
    const expression = expressionOf({
      type: 'JSXAttribute',
      name: {
        type: 'JSXIdentifier',
        name: 'accessibilityState',
      },
      value: {
        type: 'Literal',
        value: 'disabled',
      },
    });

    expect(expression).toBeUndefined();
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

  it('reads an identifier key', () => {
    const keyName = keyNameOf({
      type: 'Property',
      key: {
        type: 'Identifier',
        name: 'disabled',
      },
    });

    expect(keyName).toBe('disabled');
  });

  it('reads a string-literal key', () => {
    const keyName = keyNameOf({
      type: 'Property',
      key: {
        type: 'Literal',
        value: 'disabled',
      },
    });

    expect(keyName).toBe('disabled');
  });
});

describe('isHidden', () => {
  // A bare `aria-hidden` is `true`; only a literal `false` leaves the element reachable.
  it.each([
    ['a bare aria-hidden', undefined, true],
    ['aria-hidden={false}', {
      type: 'JSXExpressionContainer',
      expression: {
        type: 'Literal',
        value: false,
      },
    }, false],
  ])('reads %s', (_label, value, hidden) => {
    const answered = isHidden([{
      type: 'JSXAttribute',
      name: {
        type: 'JSXIdentifier',
        name: 'aria-hidden',
      },
      ...value === undefined ? {} : { value },
    }]);

    expect(answered).toBe(hidden);
  });

  it('reads importantForAccessibility=no-hide-descendants as hidden', () => {
    const hidden = isHidden([{
      type: 'JSXAttribute',
      name: {
        type: 'JSXIdentifier',
        name: 'importantForAccessibility',
      },
      value: {
        type: 'Literal',
        value: 'no-hide-descendants',
      },
    }]);

    expect(hidden).toBe(true);
  });

  // The other three values leave the element reachable, so they are not this rule's business.
  it('leaves the other importantForAccessibility values alone', () => {
    const hidden = isHidden([{
      type: 'JSXAttribute',
      name: {
        type: 'JSXIdentifier',
        name: 'importantForAccessibility',
      },
      value: {
        type: 'Literal',
        value: 'yes',
      },
    }]);

    expect(hidden).toBe(false);
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

describe('descendantElements', () => {
  // Text and containers are walked through rather than listed: only an element can be a control.
  it('lists the elements at every depth and nothing else', () => {
    const inner = { type: 'JSXElement' };
    const outer = {
      type: 'JSXElement',
      children: [{
        type: 'JSXText',
        value: 'label',
      }, inner],
    };
    const fragment = {
      type: 'JSXFragment',
      children: [{ type: 'JSXExpressionContainer' }, outer],
    };

    const descendants = descendantElements({
      type: 'JSXElement',
      children: [fragment],
    });

    expect(descendants).toEqual([outer, inner]);
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
    const hasText = hasTextContent({
      type: 'JSXElement',
      children: [{ type: 'JSXText' }],
    });

    expect(hasText).toBe(false);
  });

  // A container holds a value this cannot read, so it counts as text unless it is the empty `{}`.
  it.each([
    ['visible words', [{
      type: 'JSXText',
      value: 'Save',
    }], true],
    ['an expression', [{
      type: 'JSXExpressionContainer',
      expression: { type: 'Identifier' },
    }], true],
    ['an empty expression', [{
      type: 'JSXExpressionContainer',
      expression: { type: 'JSXEmptyExpression' },
    }], false],
    ['words inside a nested element', [{
      type: 'JSXElement',
      children: [{
        type: 'JSXText',
        value: 'Save',
      }],
    }], true],
  ])('reads %s', (_label, children, text) => {
    const hasText = hasTextContent({
      type: 'JSXElement',
      children,
    });

    expect(hasText).toBe(text);
  });
});
