import { tsxRuleTester } from '@mocks/ruleTesters';

import { nativeValidAccessibilityRole } from './nativeValidAccessibilityRole.ts';

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
    ...ACCESSIBILITY_ROLES
      .map((role) => {
        return `const view = <View accessibilityRole="${role}" />;`;
      }),
    ...ARIA_ROLES
      .map((role) => {
        return `const view = <View role="${role}" />;`;
      }),
    'const view = <View accessibilityRole="button" role="button" />;',
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
