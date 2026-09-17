import { tsxRuleTester } from '@mocks/ruleTesters';

import { reactNativeValidAccessibilityState } from './reactNativeValidAccessibilityState.ts';

tsxRuleTester.run('react-native-valid-accessibility-state', reactNativeValidAccessibilityState, {
  valid: [
    'const view = <View accessibilityState={{ disabled: true }} />;',
    'const view = <View accessibilityState={{ busy: false, expanded: true, selected: false }} />;',
    // `checked` is the one key that takes a third value.
    "const view = <View accessibilityState={{ checked: 'mixed' }} />;",
    'const view = <View accessibilityState={{ checked: true }} />;',
    // Computed at runtime, so neither the object nor the value can be judged here.
    'const view = <View accessibilityState={state} />;',
    'const view = <View accessibilityState={{ disabled: isDisabled }} />;',
    'const view = <View accessibilityState={buildState()} />;',
    // A spread carries keys this rule cannot enumerate.
    'const view = <View accessibilityState={{ ...base }} />;',
    'const view = <View accessibilityState={{ [key]: true }} />;',
    'const view = <View accessibilityState={{}} />;',
    'const view = <View />;',
  ],
  invalid: [
    {
      code: 'const view = <View accessibilityState="disabled" />;',
      errors: [{ messageId: 'notAnObject' }],
    },
    {
      // A bare attribute is `={true}`, which is not an object.
      code: 'const view = <View accessibilityState />;',
      errors: [{ messageId: 'notAnObject' }],
    },
    {
      code: 'const view = <View accessibilityState={true} />;',
      errors: [{ messageId: 'notAnObject' }],
    },
    {
      // The shape the long-deprecated `accessibilityStates` took, which is the mistake this arm exists for.
      code: "const view = <View accessibilityState={['disabled']} />;",
      errors: [{ messageId: 'notAnObject' }],
    },
    {
      code: "const view = <View accessibilityState={{ disabled: 'true' }} />;",
      errors: [{
        messageId: 'badStateValue',
        data: { key: 'disabled' },
      }],
    },
    {
      code: 'const view = <View accessibilityState={{ selected: 1 }} />;',
      errors: [{
        messageId: 'badStateValue',
        data: { key: 'selected' },
      }],
    },
    {
      code: "const view = <View accessibilityState={{ checked: 'yes' }} />;",
      errors: [{ messageId: 'badCheckedValue' }],
    },
    {
      // `pressed` is an ARIA state React Native has no key for, so it is dropped in silence.
      code: 'const view = <View accessibilityState={{ pressed: true }} />;',
      errors: [{
        messageId: 'unknownStateKey',
        data: { key: 'pressed' },
      }],
    },
    {
      // A quoted key names the same thing as a bare one.
      code: "const view = <View accessibilityState={{ 'disabled': 'no' }} />;",
      errors: [{
        messageId: 'badStateValue',
        data: { key: 'disabled' },
      }],
    },
    {
      code: 'const view = <View accessibilityState={{ pressed: true, disabled: 1 }} />;',
      errors: [
        {
          messageId: 'unknownStateKey',
          data: { key: 'pressed' },
        },
        {
          messageId: 'badStateValue',
          data: { key: 'disabled' },
        },
      ],
    },
  ],
});
