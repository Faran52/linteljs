import { createRule } from '../../types.ts';
import {
  attributesOf,
  findProp,
  literalValueOf,
} from '../../utils/jsxUtils.ts';

import type { RuleNode } from '../../utils/ruleUtils.ts';

/**
 * `AccessibilityRole` from react-native 0.87.1, `Libraries/Components/View/ViewAccessibility.d.ts`. Read off the
 * package rather than from a doc page: the published list here was missing `dropdownlist`, `grid` and the seven
 * Android container roles, and carried three (`img`, `img button`, `img link`) React Native has never accepted.
 */
const ACCESSIBILITY_ROLES = [
  'adjustable', 'alert', 'button', 'checkbox', 'combobox', 'drawerlayout', 'dropdownlist', 'grid', 'header',
  'horizontalscrollview', 'iconmenu', 'image', 'imagebutton', 'keyboardkey', 'link', 'list', 'menu', 'menubar',
  'menuitem', 'none', 'pager', 'progressbar', 'radio', 'radiogroup', 'scrollbar', 'scrollview', 'search',
  'slidingdrawer', 'spinbutton', 'summary', 'switch', 'tab', 'tabbar', 'tablist', 'text', 'timer', 'togglebutton',
  'toolbar', 'viewgroup', 'webview',
];

// `Role` from the same file. The ARIA spelling is a different and larger vocabulary than `accessibilityRole`, so the
// two cannot share one list: `searchbox` is a role and not an accessibilityRole, `imagebutton` the other way round.
const ARIA_ROLES = [
  'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell', 'checkbox', 'columnheader',
  'combobox', 'complementary', 'contentinfo', 'definition', 'dialog', 'directory', 'document', 'feed', 'figure',
  'form', 'grid', 'group', 'heading', 'img', 'link', 'list', 'listitem', 'log', 'main', 'marquee', 'math', 'menu',
  'menubar', 'menuitem', 'meter', 'navigation', 'none', 'note', 'option', 'presentation', 'progressbar', 'radio',
  'radiogroup', 'region', 'row', 'rowgroup', 'rowheader', 'scrollbar', 'searchbox', 'separator', 'slider',
  'spinbutton', 'status', 'summary', 'switch', 'tab', 'table', 'tablist', 'tabpanel', 'term', 'timer', 'toolbar',
  'tooltip', 'tree', 'treegrid', 'treeitem',
];

const ROLE_PROPS: [string, string[]][] = [
  ['accessibilityRole', ACCESSIBILITY_ROLES],
  ['role', ARIA_ROLES],
];

export const reactNativeValidAccessibilityRole = createRule('react-native-valid-accessibility-role', {
  meta: {
    type: 'problem',
    docs: {
      category: 'accessibility',
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

          // A value computed at runtime is unreadable rather than wrong, so only a written-down one is judged.
          if (value === undefined) {
            continue;
          }

          if (typeof value !== 'string' || !valid.includes(value)) {
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
