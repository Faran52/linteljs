import { tsxRuleTester } from '@mocks/ruleTesters';

import { reactNativeValidAccessibilityRole } from './reactNativeValidAccessibilityRole.ts';

tsxRuleTester.run('react-native-valid-accessibility-role', reactNativeValidAccessibilityRole, {
  valid: [
    'const view = <View accessibilityRole="button" />;',
    'const view = <View accessibilityRole="none" />;',
    // In React Native's own type and absent from the published third-party list, which is why the list here
    // is read off the package rather than off a doc page.
    'const view = <View accessibilityRole="dropdownlist" />;',
    'const view = <View accessibilityRole="viewgroup" />;',
    'const view = <View role="searchbox" />;',
    'const view = <View role="none" />;',
    'const view = <View accessibilityRole="button" role="button" />;',
    // A value computed at runtime is unreadable rather than wrong.
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
