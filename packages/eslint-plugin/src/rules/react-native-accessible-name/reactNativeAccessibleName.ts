import { createRule } from '../../types.ts';
import {
  asElement,
  elementAttributesOf,
  elementNameOf,
  findProp,
  hasProp,
  hasSpread,
  hasTextContent,
  HINT_PROPS,
  isHidden,
  isInteractive,
  LABEL_PROPS,
  LABELLED_BY_PROPS,
  literalValueOf,
  openingOf,
  TOUCHABLE_COMPONENTS,
} from '../../utils/jsxUtils.ts';
import { optionsOf } from '../../utils/ruleUtils.ts';

import type { RuleNode } from '../../utils/ruleUtils.ts';

interface Options {
  components: string[];
}

// React Native's `Button` builds its label from `title`, so a titled button is named even with no label prop.
const NAME_PROPS = [...LABEL_PROPS, ...LABELLED_BY_PROPS, 'title'] as const;

export const reactNativeAccessibleName = createRule('react-native-accessible-name', {
  meta: {
    type: 'problem',
    docs: {
      category: 'accessibility',
      language: 'universal',
      recommended: false,
      description: 'Require an accessible name on React Native elements that are announced.',
    },
    messages: {
      interactiveNeedsName:
        '{{name}} can be operated but is announced with no name. Add an accessibilityLabel, or text inside it.',
      hintNeedsName:
        'accessibilityHint has no name to follow. A hint is read after the label, not instead of one.',
      emptyName:
        'An empty accessibilityLabel clears this name rather than setting one. Remove it, or give it text.',
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
        const opening = openingOf(element);
        const attributes = elementAttributesOf(element);

        // The name may arrive through the spread, so nothing here can be called missing.
        if (hasSpread(attributes) || isHidden(attributes)) {
          return;
        }

        const label = findProp(attributes, LABEL_PROPS);

        if (label && literalValueOf(label) === '') {
          context.report({
            node,
            messageId: 'emptyName',
          });

          return;
        }

        if (hasProp(attributes, NAME_PROPS)) {
          return;
        }

        if (hasProp(attributes, HINT_PROPS)) {
          context.report({
            node,
            messageId: 'hintNeedsName',
          });

          return;
        }

        // Text below the element is a name already: React Native builds a missing label by accumulating the Text
        // nodes underneath, which is what makes `<Pressable><Text>Save</Text></Pressable>` correct as written.
        if (!isInteractive(element, touchables) || hasTextContent(element)) {
          return;
        }

        context.report({
          node,
          messageId: 'interactiveNeedsName',
          data: { name: elementNameOf(opening.name) },
        });
      },
    };
  },
});
