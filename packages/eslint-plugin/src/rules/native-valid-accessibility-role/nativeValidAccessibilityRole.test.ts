import { nativeValidAccessibilityRole } from './nativeValidAccessibilityRole.ts';

import { tsxRuleTester } from '#mocks/ruleTesters';

// Written out again rather than imported, so a name dropped from the rule's list fails here instead of vanishing
// from both at once.
const ACCESSIBILITY_ROLES = [
  'adjustable', 'alert', 'button', 'checkbox', 'combobox', 'drawerlayout', 'dropdownlist', 'grid', 'header',
  'horizontalscrollview', 'iconmenu', 'image', 'imagebutton', 'keyboardkey', 'link', 'list', 'menu', 'menubar',
  'menuitem', 'none', 'pager', 'progressbar', 'radio', 'radiogroup', 'scrollbar', 'scrollview', 'search',
  'slidingdrawer', 'spinbutton', 'summary', 'switch', 'tab', 'tabbar', 'tablist', 'text', 'timer', 'togglebutton',
  'toolbar', 'viewgroup', 'webview',
];

const ARIA_ROLES = [
  'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell', 'checkbox', 'columnheader',
  'combobox', 'complementary', 'contentinfo', 'definition', 'dialog', 'directory', 'document', 'feed', 'figure',
  'form', 'grid', 'group', 'heading', 'img', 'link', 'list', 'listitem', 'log', 'main', 'marquee', 'math', 'menu',
  'menubar', 'menuitem', 'meter', 'navigation', 'none', 'note', 'option', 'presentation', 'progressbar', 'radio',
  'radiogroup', 'region', 'row', 'rowgroup', 'rowheader', 'scrollbar', 'searchbox', 'separator', 'slider',
  'spinbutton', 'status', 'summary', 'switch', 'tab', 'table', 'tablist', 'tabpanel', 'term', 'timer', 'toolbar',
  'tooltip', 'tree', 'treegrid', 'treeitem',
];

tsxRuleTester.run('native-valid-accessibility-role', nativeValidAccessibilityRole, {
  valid: [
    ...ACCESSIBILITY_ROLES.map((role) => {
      return `const view = <View accessibilityRole="${role}" />;`;
    }),
    ...ARIA_ROLES.map((role) => {
      return `const view = <View role="${role}" />;`;
    }),
    'const view = <View accessibilityRole="button" role="button" />;',
    // A value computed at runtime is unreadable rather than wrong, and so is an element standing in for one.
    'const view = <View accessibilityRole=<Role /> />;',
    'const view = <View accessibilityRole={role} />;',
    'const view = <View role={role} />;',
    'const view = <View />;',
  ],
  invalid: [
    {
      code: 'const view = <View accessibilityRole="buton" />;',
      errors: [{
        messageId: 'invalidRole',
        data: {
          prop: 'accessibilityRole',
          value: 'buton',
        },
      }],
    },
    {
      // The two vocabularies are different sets, not one with two spellings: `img` is a role and never an
      // accessibilityRole, so a rule sharing one list would pass this.
      code: 'const view = <View accessibilityRole="img" />;',
      errors: [{
        messageId: 'invalidRole',
        data: {
          prop: 'accessibilityRole',
          value: 'img',
        },
      }],
    },
    {
      // And the other way round.
      code: 'const view = <View role="imagebutton" />;',
      errors: [{
        messageId: 'invalidRole',
        data: {
          prop: 'role',
          value: 'imagebutton',
        },
      }],
    },
    {
      code: 'const view = <View accessibilityRole={true} />;',
      errors: [{
        messageId: 'invalidRole',
        data: {
          prop: 'accessibilityRole',
          value: 'true',
        },
      }],
    },
    {
      // A bare attribute is `={true}`, which is not a role either.
      code: 'const view = <View accessibilityRole />;',
      errors: [{
        messageId: 'invalidRole',
        data: {
          prop: 'accessibilityRole',
          value: 'true',
        },
      }],
    },
    {
      // Both props are checked on one element, each against its own list.
      code: 'const view = <View accessibilityRole="btn" role="btn" />;',
      errors: [
        {
          messageId: 'invalidRole',
          data: {
            prop: 'accessibilityRole',
            value: 'btn',
          },
        },
        {
          messageId: 'invalidRole',
          data: {
            prop: 'role',
            value: 'btn',
          },
        },
      ],
    },
    {
      code: 'const view = <View accessibilityRole="button" role="buton" />;',
      errors: [{
        messageId: 'invalidRole',
        data: {
          prop: 'role',
          value: 'buton',
        },
      }],
    },
  ],
});
