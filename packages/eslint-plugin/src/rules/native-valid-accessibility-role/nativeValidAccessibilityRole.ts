import {
  attributesOf,
  findProp,
  literalValueOf,
} from '../../utils/jsxUtils.ts';
import { createRule, type RuleNode } from '../../utils/ruleUtils.ts';

// Read off react-native 0.87.1's `ViewAccessibility.d.ts`: the published doc list was wrong.
const ACCESSIBILITY_ROLES = [
  'adjustable',
  'alert',
  'button',
  'checkbox',
  'combobox',
  'drawerlayout',
  'dropdownlist',
  'grid',
  'header',
  'horizontalscrollview',
  'iconmenu',
  'image',
  'imagebutton',
  'keyboardkey',
  'link',
  'list',
  'menu',
  'menubar',
  'menuitem',
  'none',
  'pager',
  'progressbar',
  'radio',
  'radiogroup',
  'scrollbar',
  'scrollview',
  'search',
  'slidingdrawer',
  'spinbutton',
  'summary',
  'switch',
  'tab',
  'tabbar',
  'tablist',
  'text',
  'timer',
  'togglebutton',
  'toolbar',
  'viewgroup',
  'webview',
];

// The ARIA spelling is a different, larger vocabulary than `accessibilityRole`.
const ARIA_ROLES = [
  'alert',
  'alertdialog',
  'application',
  'article',
  'banner',
  'button',
  'cell',
  'checkbox',
  'columnheader',
  'combobox',
  'complementary',
  'contentinfo',
  'definition',
  'dialog',
  'directory',
  'document',
  'feed',
  'figure',
  'form',
  'grid',
  'group',
  'heading',
  'img',
  'link',
  'list',
  'listitem',
  'log',
  'main',
  'marquee',
  'math',
  'menu',
  'menubar',
  'menuitem',
  'meter',
  'navigation',
  'none',
  'note',
  'option',
  'presentation',
  'progressbar',
  'radio',
  'radiogroup',
  'region',
  'row',
  'rowgroup',
  'rowheader',
  'scrollbar',
  'searchbox',
  'separator',
  'slider',
  'spinbutton',
  'status',
  'summary',
  'switch',
  'tab',
  'table',
  'tablist',
  'tabpanel',
  'term',
  'timer',
  'toolbar',
  'tooltip',
  'tree',
  'treegrid',
  'treeitem',
];

const ROLE_PROPS: [string, string[]][] = [
  ['accessibilityRole', ACCESSIBILITY_ROLES],
  ['role', ARIA_ROLES],
];

export const nativeValidAccessibilityRole = createRule('native-valid-accessibility-role', {
  meta: {
    type: 'problem',
    docs: {
      language: 'universal',
      recommended: false,
      description: 'Require accessibilityRole and role values React Native understands.',
    },
    messages: {
      invalidRole: '{{value}} is not a value {{prop}} accepts. React Native ignores it and announces nothing.',
    },
    schema: [],
  },
  create: (context) => {
    return {
      JSXOpeningElement: (node: RuleNode) => {
        const attributes = attributesOf(node);

        for (const [prop, valid] of ROLE_PROPS) {
          const attribute = findProp(attributes, [prop]);

          if (!attribute) {
            continue;
          }

          const value = literalValueOf(attribute);

          // A value computed at runtime is unreadable rather than wrong.
          if (value === undefined) {
            continue;
          }

          // Compared rather than looked up, so a non-string literal matches nothing.
          if (!valid
            .some((role) => {
              return role === value;
            })) {
            context.report({
              node,
              messageId: 'invalidRole',
              data: {
                prop,
                value: String(value),
              },
            });
          }
        }
      },
    };
  },
});
