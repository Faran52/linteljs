import {
  attributesOf,
  expressionOf,
  findProp,
  type JsxProperty,
  keyNameOf,
  propertiesOf,
} from '../../utils/jsxUtils.ts';
import {
  createRule,
  mustFind,
  type RuleNode,
} from '../../utils/ruleUtils.ts';

// `AccessibilityState` from react-native 0.87.1, `Libraries/Components/View/ViewAccessibility.d.ts`. A key outside
// this set is dropped silently, so the state never reaches VoiceOver or TalkBack.
const STATE_KEYS = [
  'busy',
  'checked',
  'disabled',
  'expanded',
  'selected',
];

// The two forms that are a state value but not an object, so the mistake is legible rather than merely wrong.
const NOT_OBJECT_TYPES = ['Literal', 'ArrayExpression'];

export const nativeValidAccessibilityState = createRule('native-valid-accessibility-state', {
  meta: {
    type: 'problem',
    docs: {
      language: 'universal',
      recommended: false,
      description: 'Require accessibilityState to be an object of the keys React Native reads.',
    },
    messages: {
      notAnObject: 'accessibilityState takes an object, so this value is dropped.',
      unknownStateKey: 'accessibilityState has no {{key}} key, so this entry is dropped.',
      badStateValue: 'accessibilityState.{{key}} takes a boolean.',
      badCheckedValue: "accessibilityState.checked takes a boolean or the string 'mixed'.",
    },
    schema: [],
  },
  create: (context) => {
    const reportProperty = (node: RuleNode, property: JsxProperty): void => {
      const key = keyNameOf(property);

      // A spread or a computed key names nothing that can be checked here.
      if (key === undefined) {
        return;
      }

      if (!STATE_KEYS.includes(key)) {
        context.report({
          node,
          messageId: 'unknownStateKey',
          data: { key },
        });

        return;
      }

      // Only a value written down can be judged; one computed at runtime is the caller's to get right. A property
      // always has a value.
      const written = mustFind(property.value, 'the value of an accessibilityState property');

      if (written.type !== 'Literal') {
        return;
      }

      const { value } = written;

      if (key === 'checked') {
        if (typeof value !== 'boolean' && value !== 'mixed') {
          context.report({
            node,
            messageId: 'badCheckedValue',
          });
        }

        return;
      }

      if (typeof value !== 'boolean') {
        context.report({
          node,
          messageId: 'badStateValue',
          data: { key },
        });
      }
    };

    return {
      JSXOpeningElement: (node: RuleNode) => {
        const attribute = findProp(attributesOf(node), ['accessibilityState']);

        if (!attribute) {
          return;
        }

        const expression = expressionOf(attribute);

        // No expression container means a bare attribute or a string, and neither is an object.
        if (!expression || NOT_OBJECT_TYPES.includes(expression.type)) {
          context.report({
            node,
            messageId: 'notAnObject',
          });

          return;
        }

        for (const property of propertiesOf(expression)) {
          reportProperty(node, property);
        }
      },
    };
  },
});
