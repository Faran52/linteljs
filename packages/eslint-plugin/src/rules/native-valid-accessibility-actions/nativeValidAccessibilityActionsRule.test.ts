import { tsxRuleTester } from '@mocks/ruleTesters';

import { nativeValidAccessibilityActions } from './nativeValidAccessibilityActionsRule.ts';

tsxRuleTester.run('native-valid-accessibility-actions', nativeValidAccessibilityActions, {
  valid: [
    "const view = <View accessibilityActions={[{ name: 'activate' }]} onAccessibilityAction={handle} />;",
    "const view = <View accessibilityActions={[{ name: 'magicTap' }]} onAccessibilityAction={handle} />;",
    "const view = <View accessibilityActions={[{ name: 'decrement' }, { name: 'escape' }, { name: 'increment' }, "
    + "{ name: 'longpress' }]} onAccessibilityAction={handle} />;",
    'const view = <View accessibilityActions={[{ name: 5 }]} onAccessibilityAction={handle} />;',
    "const view = <View accessibilityActions={[{ name: 'activate', [key]: 'x' }]} onAccessibilityAction={handle} />;",
    "const view = <View accessibilityActions={[, { name: 'activate' }]} onAccessibilityAction={handle} />;",
    "const view = <View accessibilityActions={[{ name: 'mute', label: 'Mute' }]} onAccessibilityAction={handle} />;",
    'const view = <View accessibilityActions={actions} onAccessibilityAction={handle} />;',
    'const view = <View accessibilityActions={[{ name: chosen }]} onAccessibilityAction={handle} />;',
    'const view = <View accessibilityActions={[...base]} onAccessibilityAction={handle} />;',
    "const view = <View {...props} accessibilityActions={[{ name: 'activate' }]} />;",
    'const view = <View {...props} onAccessibilityAction={handle} />;',
    'const view = <View />;',
    'const view = <View accessibilityActions={[{ ...base }]} onAccessibilityAction={handle} />;',
    "const view = <View accessibilityActions={[{ name: 'mute', ...labels }]} onAccessibilityAction={handle} />;",
    "const view = <View accessibilityActions={[{ [key]: 'mute' }]} onAccessibilityAction={handle} />;",
    "const view = <View accessibilityActions={[{ 'name': 'activate' }]} onAccessibilityAction={handle} />;",
    "const view = <View accessibilityActions={[{ name: 'mute', 'label': 'Mute' }]} onAccessibilityAction={handle} />;",
    'const view = <View accessibilityActions={[{ name: `mute` }]} onAccessibilityAction={handle} />;',
    'const view = <View accessibilityActions={[{ name }]} onAccessibilityAction={handle} />;',
    "const view = <View accessibilityActions={[{ name: 'mute' } as Action]} onAccessibilityAction={handle} />;",
    "const view = <View accessibilityActions={[{ name: 'mute' as const }]} onAccessibilityAction={handle} />;",
    'const view = <View accessibilityActions={[] as Action[]} onAccessibilityAction={handle} />;',
    "const view = <View accessibilityActions={[/* first */ { name: 'activate' }]} onAccessibilityAction={handle} />;",
    "const view = <Animated.View accessibilityActions={[{ name: 'activate' }]} onAccessibilityAction={handle} />;",
    "const view = <View onAccessibilityAction={handle} accessibilityActions={[{ name: 'activate' }]} />;",
  ],
  invalid: [
    {
      code: "const view = <View accessibilityActions={[{ name: 'activate' }]} />;",
      errors: [{ messageId: 'actionsNeedHandler' }],
    },
    {
      code: 'const view = <View onAccessibilityAction={handle} />;',
      errors: [{ messageId: 'handlerNeedsActions' }],
    },
    {
      code: 'const view = <View accessibilityActions="activate" onAccessibilityAction={handle} />;',
      errors: [{ messageId: 'notAnArray' }],
    },
    {
      code: 'const view = <View accessibilityActions onAccessibilityAction={handle} />;',
      errors: [{ messageId: 'notAnArray' }],
    },
    {
      code: 'const view = <View accessibilityActions={5} onAccessibilityAction={handle} />;',
      errors: [{ messageId: 'notAnArray' }],
    },
    {
      code: 'const view = <View accessibilityActions={[]} onAccessibilityAction={handle} />;',
      errors: [{ messageId: 'emptyActions' }],
    },
    {
      code: "const view = <View accessibilityActions={[{ label: 'Do it' }]} onAccessibilityAction={handle} />;",
      errors: [{ messageId: 'actionNeedsName' }],
    },
    {
      code: "const view = <View accessibilityActions={[{ name: 'mute' }]} onAccessibilityAction={handle} />;",
      errors: [{
        messageId: 'customActionNeedsLabel',
        data: { name: 'mute' },
      }],
    },
    {
      code: "const view = <View accessibilityActions={[{ name: 'activate', hint: 'x' }]} "
        + 'onAccessibilityAction={handle} />;',
      errors: [{
        messageId: 'unknownActionKey',
        data: { key: 'hint' },
      }],
    },
    {
      code: "const view = <View accessibilityActions={[{ name: 'activate' }, { name: 'mute' }]} "
        + 'onAccessibilityAction={handle} />;',
      errors: [{
        messageId: 'customActionNeedsLabel',
        data: { name: 'mute' },
      }],
    },
    {
      code: 'const view = <View accessibilityActions={[]} />;',
      errors: [{ messageId: 'actionsNeedHandler' }],
    },
    {
      code: "const view = <View accessibilityActions={{ name: 'activate' }} onAccessibilityAction={handle} />;",
      errors: [{ messageId: 'notAnArray' }],
    },
    {
      code: 'const view = <View {...props} accessibilityActions={[]} />;',
      errors: [{ messageId: 'emptyActions' }],
    },
    {
      code: 'const view = <View {...props} accessibilityActions="activate" onAccessibilityAction={handle} />;',
      errors: [{ messageId: 'notAnArray' }],
    },
    {
      code: 'const view = <View accessibilityActions={[{ label }]} onAccessibilityAction={handle} />;',
      errors: [{ messageId: 'actionNeedsName' }],
    },
    {
      code: "const view = <View accessibilityActions={[{ hint: 'x', role: 'y' }]} onAccessibilityAction={handle} />;",
      errors: [
        {
          messageId: 'unknownActionKey',
          data: { key: 'hint' },
        },
        {
          messageId: 'unknownActionKey',
          data: { key: 'role' },
        },
        { messageId: 'actionNeedsName' },
      ],
    },
    {
      code: "const view = <View accessibilityActions={[{ name: 'mute', hint: 'x' }]} "
        + 'onAccessibilityAction={handle} />;',
      errors: [
        {
          messageId: 'unknownActionKey',
          data: { key: 'hint' },
        },
        {
          messageId: 'customActionNeedsLabel',
          data: { name: 'mute' },
        },
      ],
    },
    {
      code: "const view = <View accessibilityActions={[{ ...base, hint: 'x' }]} onAccessibilityAction={handle} />;",
      errors: [{
        messageId: 'unknownActionKey',
        data: { key: 'hint' },
      }],
    },
    {
      code: "const view = <View accessibilityActions={[{ name: 'mute' }, { name: 'archive' }]} "
        + 'onAccessibilityAction={handle} />;',
      errors: [
        {
          messageId: 'customActionNeedsLabel',
          data: { name: 'mute' },
        },
        {
          messageId: 'customActionNeedsLabel',
          data: { name: 'archive' },
        },
      ],
    },
    {
      code: "const view = <View accessibilityActions={[{ name: 'Activate' }]} onAccessibilityAction={handle} />;",
      errors: [{
        messageId: 'customActionNeedsLabel',
        data: { name: 'Activate' },
      }],
    },
    {
      code: "const view = <View accessibilityActions={[{ name: 'mute', label: 'Mute' }]} "
        + '/* handled above */ />;',
      errors: [{ messageId: 'actionsNeedHandler' }],
    },
    {
      code: 'const view = <Animated.View onAccessibilityAction={handle} accessible />;',
      errors: [{ messageId: 'handlerNeedsActions' }],
    },
  ],
});
