import { createRule } from '../../types.ts';
import {
  attributesOf,
  elementsOf,
  expressionOf,
  findProp,
  hasSpread,
  keyNameOf,
  propertiesOf,
} from '../../utils/jsxUtils.ts';

import type { JsxExpression } from '../../utils/jsxUtils.ts';
import type { RuleNode } from '../../utils/ruleUtils.ts';

// `AccessibilityActionName` from react-native 0.87.1. These six are announced by the platform under a name it
// already has words for; any other name is the app's own and is read out verbatim unless a label supplies better.
const STANDARD_ACTIONS = [
  'activate',
  'decrement',
  'escape',
  'increment',
  'longpress',
  'magicTap',
];

const ACTION_KEYS = ['name', 'label'];

export const reactNativeValidAccessibilityActions = createRule('react-native-valid-accessibility-actions', {
  meta: {
    type: 'problem',
    docs: {
      category: 'accessibility',
      language: 'universal',
      recommended: false,
      description: 'Require accessibilityActions and onAccessibilityAction to be declared together and well formed.',
    },
    messages: {
      actionsNeedHandler: 'accessibilityActions without onAccessibilityAction offers actions nothing can perform.',
      handlerNeedsActions: 'onAccessibilityAction without accessibilityActions is never called.',
      notAnArray: 'accessibilityActions takes an array of actions.',
      emptyActions: 'An empty accessibilityActions array offers no action. Remove it, or list one.',
      actionNeedsName: 'Every accessibilityActions entry needs a name, which is what the handler switches on.',
      customActionNeedsLabel:
        'The custom action {{name}} has no label, so a screen reader announces the raw name instead.',
      unknownActionKey: 'accessibilityActions entries take name and label only, so {{key}} is dropped.',
    },
    schema: [],
  },
  create: (context) => {
    const reportAction = (node: RuleNode, action: JsxExpression): void => {
      const properties = propertiesOf(action);
      const keys = properties.map(keyNameOf);
      const named = properties.find((property) => {
        return keyNameOf(property) === 'name';
      });

      for (const key of keys) {
        if (key !== undefined && !ACTION_KEYS.includes(key)) {
          context.report({
            node,
            messageId: 'unknownActionKey',
            data: { key },
          });
        }
      }

      if (!named) {
        context.report({
          node,
          messageId: 'actionNeedsName',
        });

        return;
      }

      // Only a name written down can be matched against the standard set; one computed at runtime may be either.
      if (named.value?.type !== 'Literal' || typeof named.value.value !== 'string') {
        return;
      }

      const { value } = named.value;

      if (!STANDARD_ACTIONS.includes(value) && !keys.includes('label')) {
        context.report({
          node,
          messageId: 'customActionNeedsLabel',
          data: { name: value },
        });
      }
    };

    return {
      JSXOpeningElement: (node: RuleNode) => {
        const attributes = attributesOf(node);
        const actions = findProp(attributes, ['accessibilityActions']);
        const handler = findProp(attributes, ['onAccessibilityAction']);

        // Either half may arrive through the spread, so an unpaired one here is not yet a missing one.
        if (!hasSpread(attributes) && Boolean(actions) !== Boolean(handler)) {
          context.report({
            node,
            messageId: actions ? 'actionsNeedHandler' : 'handlerNeedsActions',
          });

          return;
        }

        if (!actions) {
          return;
        }

        const expression = expressionOf(actions);

        // No expression container means a bare attribute or a string, and neither is an array.
        if (!expression || expression.type === 'Literal') {
          context.report({
            node,
            messageId: 'notAnArray',
          });

          return;
        }

        if (expression.type !== 'ArrayExpression') {
          return;
        }

        const elements = elementsOf(expression);

        if (elements.length === 0) {
          context.report({
            node,
            messageId: 'emptyActions',
          });

          return;
        }

        for (const element of elements) {
          // A hole or a spread carries no properties to judge.
          if (element?.type === 'ObjectExpression') {
            reportAction(node, element);
          }
        }
      },
    };
  },
});
