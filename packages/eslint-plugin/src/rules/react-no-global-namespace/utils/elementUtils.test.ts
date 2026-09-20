import {
  describe,
  expect,
  it,
} from 'vitest';

import { globalNamespaceTags } from './elementUtils.ts';

import type { TypedNode } from '../../../utils/ruleUtils.ts';
import type { JsxElementNode, JsxTagName } from './elementUtils.ts';

// The one field a fixture tag carries, named because the plugin's own rule wants it named.
interface NamedTag {
  name: JsxTagName;
}

const element = (parts: JsxElementNode): TypedNode & JsxElementNode => {
  return {
    type: 'JSXElement',
    ...parts,
  };
};

const tag = (object: string, property: string): NamedTag => {
  return {
    name: {
      type: 'JSXMemberExpression',
      object: {
        type: 'JSXIdentifier',
        name: object,
      },
      property: {
        type: 'JSXIdentifier',
        name: property,
      },
    },
  };
};

describe('globalNamespaceTags', () => {
  it('answers both tags where the element has a closing one', () => {
    expect(globalNamespaceTags(element({
      openingElement: tag('React', 'Fragment'),
      closingElement: tag('React', 'Fragment'),
    }), 'React')).toHaveLength(2);
  });

  it('answers the opening tag alone where the element is self-closing', () => {
    expect(globalNamespaceTags(element({ openingElement: tag('React', 'Fragment') }), 'React')).toHaveLength(1);
  });

  it('answers nothing for a tag reaching another namespace', () => {
    expect(globalNamespaceTags(element({ openingElement: tag('Other', 'Thing') }), 'React')).toEqual([]);
  });

  // No opening tag at all, and a node that is not an element: neither reaches here through the rule.
  it('answers nothing for a node that is not an element', () => {
    expect(globalNamespaceTags({ type: 'Literal' }, 'React')).toEqual([]);
  });
});
