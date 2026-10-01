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
    'const view = <View accessibilityState={{ checked: false }} />;',
    'const view = <View accessibilityState={{ busy: !loaded }} />;',
    'const view = <View accessibilityState={{ checked: undefined }} />;',
    'const view = <View accessibilityState={{ disabled: `yes` }} />;',
    'const view = <View accessibilityState={{ disabled }} />;',
    'const view = <View accessibilityState={{ pressed: true } as State} />;',
    "const view = <View accessibilityState={{ disabled: 'no' as unknown as boolean }} />;",
    'const view = <View accessibilityState={{ /* busy while saving */ busy: true }} />;',
    'const view = <View {...props} accessibilityState={{ selected: true }} />;',
    'const view = <Animated.View accessibilityState={{ expanded: false }} />;',
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
    ...[
      '{null}',
      '{5}',
      "{'disabled'}",
      '{[]}',
    ]
      .map((written) => {
        return {
          code: `const view = <View accessibilityState=${written} />;`,
          errors: [{ messageId: 'notAnObject' as const }],
        };
      }),
    ...[
      'null',
      "'Mixed'",
      '0',
      "'true'",
    ]
      .map((written) => {
        return {
          code: `const view = <View accessibilityState={{ checked: ${written} }} />;`,
          errors: [{ messageId: 'badCheckedValue' as const }],
        };
      }),
    ...[
      'busy',
      'disabled',
      'expanded',
      'selected',
    ]
      .map((key) => {
        return {
          code: `const view = <View accessibilityState={{ ${key}: 'mixed' }} />;`,
          errors: [{
            messageId: 'badStateValue' as const,
            data: { key },
          }],
        };
      }),
    {
      code: 'const view = <View accessibilityState={{ busy: null }} />;',
      errors: [{
        messageId: 'badStateValue',
        data: { key: 'busy' },
      }],
    },
    {
      code: "const view = <View accessibilityState={{ ...base, Disabled: true, busy: 'yes' }} />;",
      errors: [
        {
          messageId: 'unknownStateKey',
          data: { key: 'Disabled' },
        },
        {
          messageId: 'badStateValue',
          data: { key: 'busy' },
        },
      ],
    },
    {
      code: 'const view = <View {...props} accessibilityState={{ pressed: true }} />;',
      errors: [{
        messageId: 'unknownStateKey',
        data: { key: 'pressed' },
      }],
    },
    {
      code: 'const view = <Animated.View accessibilityState={{ checked: 1, selected: 1 }}>'
        + '<Text>Go</Text></Animated.View>;',
      errors: [
        {
          messageId: 'badCheckedValue',
          column: 14,
        },
        {
          messageId: 'badStateValue',
          data: { key: 'selected' },
          column: 14,
        },
      ],
    },
  ],
});
