import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  globalNamespaceTags,
  type JsxElementNode,
  type JsxTagName,
} from './elementUtils.ts';

import type { TypedNode } from '../../../utils/ruleUtils.ts';

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
    const tags = globalNamespaceTags(element({
      openingElement: tag('React', 'Fragment'),
      closingElement: tag('React', 'Fragment'),
    }), 'React');

    expect(tags).toHaveLength(2);
  });

  it('answers the opening tag alone where the element is self-closing', () => {
    const actual = globalNamespaceTags(element({ openingElement: tag('React', 'Fragment') }), 'React');
    expect(actual).toHaveLength(1);
  });

  it('answers nothing for a tag reaching another namespace', () => {
    const actual = globalNamespaceTags(element({ openingElement: tag('Other', 'Thing') }), 'React');
    expect(actual).toEqual([]);
  });

  it('answers nothing for a node that is not an element', () => {
    const actual = globalNamespaceTags({ type: 'Literal' }, 'React');
    expect(actual).toEqual([]);
  });
});
