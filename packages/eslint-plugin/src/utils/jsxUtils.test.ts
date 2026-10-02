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

describe('attributesOf', () => {
  it.each([
    ['a node carrying no attributes', { type: 'Identifier' }],
    ['attributes that are not a list', {
      type: 'JSXOpeningElement',
      attributes: 'accessible',
    }],
  ])('declines %s', (_label, value) => {
    const attributes = attributesOf(value);
    expect(attributes).toEqual([]);
  });

  it('answers the list on a real opening element', () => {
    const attributes = [{ type: 'JSXSpreadAttribute' } as const];
    const node = {
      type: 'JSXOpeningElement',
      attributes,
    };

    const nodeAttributes = attributesOf(node);
    expect(nodeAttributes).toBe(attributes);
  });
});

describe('asElement', () => {
  it('hands back a node that has an opening element', () => {
    const element = {
      type: 'JSXElement',
      openingElement: { type: 'JSXOpeningElement' },
    };

    const actual = asElement(element);
    expect(actual).toBe(element);
  });

  it('declines a node with no opening element', () => {
    const actual = asElement({ type: 'Identifier' });
    expect(actual).toEqual({});
  });
});

describe('openingOf', () => {
  it('reads an element with no opening element as an empty one', () => {
    const opening = openingOf({});
    expect(opening).toEqual({});
  });
});

describe('elementNameOf', () => {
  it('answers an empty string for a missing name', () => {
    const elementName = elementNameOf(undefined);
    expect(elementName).toBe('');
  });

  it('reads a plain identifier', () => {
    const elementName = elementNameOf({
      type: 'JSXIdentifier',
      name: 'Pressable',
    });

    expect(elementName).toBe('Pressable');
  });

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
    const prop = findProp([spread, accessible], ['accessible']);
    expect(prop).toBe(accessible);
  });

  it('answers undefined when no name matches', () => {
    const prop = findProp([spread, accessible], ['accessibilityLabel']);
    expect(prop).toBeUndefined();
    const actual = hasProp([spread, accessible], ['accessibilityLabel']);
    expect(actual).toBe(false);
  });

  it('never answers a spread, whatever the names asked for', () => {
    const prop = findProp([spread], ['']);
    expect(prop).toBeUndefined();
  });

  it('sees a spread', () => {
    const actual = hasSpread([accessible]);
    expect(actual).toBe(false);
    const actual2 = hasSpread([accessible, spread]);
    expect(actual2).toBe(true);
  });
});

describe('literalValueOf', () => {
  const named = {
    type: 'JSXIdentifier',
    name: 'accessible',
  } as const;

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
    const keyName = keyNameOf(property);
    expect(keyName).toBeUndefined();
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
  it.each([
    [
      'a bare aria-hidden',
      undefined,
      true,
    ],
    [
      'aria-hidden={false}',
      {
        type: 'JSXExpressionContainer',
        expression: {
          type: 'Literal',
          value: false,
        },
      },
      false,
    ],
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

describe('the array accessors', () => {
  it('reads an element with no opening element as having no attributes', () => {
    const elementAttributes = elementAttributesOf({ type: 'JSXElement' });
    expect(elementAttributes).toEqual([]);
  });

  it('reads an expression with no properties as having none', () => {
    const properties = propertiesOf({ type: 'Identifier' });
    expect(properties).toEqual([]);
  });

  it('reads an expression with no elements as having none', () => {
    const elements = elementsOf({ type: 'Identifier' });
    expect(elements).toEqual([]);
  });
});

describe('descendantElements', () => {
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

    const expected = [outer, inner];
    expect(descendants).toEqual(expected);
  });
});

describe('descendantElements through an expression', () => {
  it('follows the branches of a logical or conditional expression, and nothing else', () => {
    const left = { type: 'JSXElement' };
    const right = { type: 'JSXElement' };
    const consequent = { type: 'JSXElement' };
    const alternate = { type: 'JSXElement' };
    const logical = {
      type: 'LogicalExpression',
      left,
      right,
    };
    const conditional = {
      type: 'ConditionalExpression',
      consequent,
      alternate,
    };
    const call = { type: 'CallExpression' };

    const descendants = descendantElements({
      type: 'JSXElement',
      children: [
        logical,
        conditional,
        call,
      ]
        .map((expression) => {
          return {
            type: 'JSXExpressionContainer',
            expression,
          };
        }),
    });

    const expected = [
      left,
      right,
      consequent,
      alternate,
    ];
    expect(descendants).toEqual(expected);
  });

  it('lists the elements inside a fragment an expression renders, not the fragment', () => {
    const inner = { type: 'JSXElement' };
    const fragment = {
      type: 'JSXFragment',
      children: [{
        type: 'JSXText',
        value: 'label',
      }, inner],
    };

    const descendants = descendantElements({
      type: 'JSXElement',
      children: [{
        type: 'JSXExpressionContainer',
        expression: fragment,
      }],
    });

    const expected = [inner];
    expect(descendants).toEqual(expected);
  });
});

describe('isInteractive', () => {
  it('reads an element with neither a known name nor a handler as inert', () => {
    const actual = isInteractive({ type: 'JSXElement' }, ['Pressable']);
    expect(actual).toBe(false);
  });
});

describe('hasTextContent', () => {
  it('reads an element with no children as silent', () => {
    const actual = hasTextContent({ type: 'JSXElement' });
    expect(actual).toBe(false);
  });

  it('reads a text child carrying no text as silent', () => {
    const hasText = hasTextContent({
      type: 'JSXElement',
      children: [{ type: 'JSXText' }],
    });

    expect(hasText).toBe(false);
  });

  it.each([
    [
      'visible words',
      [{
        type: 'JSXText',
        value: 'Save',
      }],
      true,
    ],
    [
      'an expression',
      [{
        type: 'JSXExpressionContainer',
        expression: { type: 'Identifier' },
      }],
      true,
    ],
    [
      'an empty expression',
      [{
        type: 'JSXExpressionContainer',
        expression: { type: 'JSXEmptyExpression' },
      }],
      false,
    ],
    [
      'words inside a nested element',
      [{
        type: 'JSXElement',
        children: [{
          type: 'JSXText',
          value: 'Save',
        }],
      }],
      true,
    ],
  ])('reads %s', (_label, children, text) => {
    const hasText = hasTextContent({
      type: 'JSXElement',
      children,
    });

    expect(hasText).toBe(text);
  });
});
