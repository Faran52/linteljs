import { tsxRuleTester } from '@mocks/ruleTesters';

import { nativeValidAccessibilityState } from './nativeValidAccessibilityState.ts';

tsxRuleTester.run('native-valid-accessibility-state', nativeValidAccessibilityState, {
  valid: [
    'const view = <View accessibilityState={{ disabled: true }} />;',
    'const view = <View accessibilityState={{ busy: false, expanded: true, selected: false }} />;',
    "const view = <View accessibilityState={{ checked: 'mixed' }} />;",
    'const view = <View accessibilityState={{ checked: true }} />;',
    'const view = <View accessibilityState={state} />;',
    'const view = <View accessibilityState={{ disabled: isDisabled }} />;',
    'const view = <View accessibilityState={buildState()} />;',
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
      code: 'const view = <View accessibilityState />;',
      errors: [{ messageId: 'notAnObject' }],
    },
    {
      code: 'const view = <View accessibilityState={true} />;',
      errors: [{ messageId: 'notAnObject' }],
    },
    {
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
      code: 'const view = <View accessibilityState={{ pressed: true }} />;',
      errors: [{
        messageId: 'unknownStateKey',
        data: { key: 'pressed' },
      }],
    },
    {
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
