import { createRule } from '../../types.ts';
import {
  asElement,
  descendantElements,
  elementAttributesOf,
  elementNameOf,
  findProp,
  isInteractive,
  literalValueOf,
  openingOf,
  TOUCHABLE_COMPONENTS,
} from '../../utils/jsxUtils.ts';
import { optionsOf } from '../../utils/ruleUtils.ts';

import type { RuleNode } from '../../utils/ruleUtils.ts';

interface Options {
  components: string[];
}

export const reactNativeNoNestedTouchables = createRule('react-native-no-nested-touchables', {
  meta: {
    type: 'problem',
    docs: {
      category: 'accessibility',
      language: 'universal',
      recommended: false,
      description: 'Disallow controls inside a container marked accessible.',
    },
    messages: {
      nestedTouchable:
        'This container is one focus stop, so the {{name}} inside it cannot be reached. Move accessible onto it, '
        + 'or drop it from the container.',
    },
    schema: [{
      type: 'object',
      properties: {
        components: {
          type: 'array',
          items: { type: 'string' },
          default: [],
        },
      },
      additionalProperties: false,
    }],
  },
  create: (context) => {
    const { components = [] } = optionsOf<Options>(context);
    const touchables = [...TOUCHABLE_COMPONENTS, ...components];

    return {
      JSXElement: (node: RuleNode) => {
        const element = asElement(node);
        const accessible = findProp(elementAttributesOf(element), ['accessible']);

        // Only `accessible={true}` collapses the subtree. A value computed at runtime may be false, and reporting
        // needs the certainty that it is not.
        if (!accessible || literalValueOf(accessible) !== true) {
          return;
        }

        const nested = descendantElements(element).find((descendant) => {
          return isInteractive(descendant, touchables);
        });

        if (nested) {
          context.report({
            node,
            messageId: 'nestedTouchable',
            data: { name: elementNameOf(openingOf(nested).name) },
          });
        }
      },
    };
  },
});
