import { tsxRuleTester } from '@mocks/ruleTesters';

import { reactNativeValidAccessibilityActions } from './reactNativeValidAccessibilityActions.ts';

tsxRuleTester.run('react-native-valid-accessibility-actions', reactNativeValidAccessibilityActions, {
  valid: [
    "const view = <View accessibilityActions={[{ name: 'activate' }]} onAccessibilityAction={handle} />;",
    "const view = <View accessibilityActions={[{ name: 'magicTap' }]} onAccessibilityAction={handle} />;",
    // A name the platform has no words for needs a label, and this one has it.
    "const view = <View accessibilityActions={[{ name: 'mute', label: 'Mute' }]} onAccessibilityAction={handle} />;",
    // Computed at runtime, so the array cannot be read.
    'const view = <View accessibilityActions={actions} onAccessibilityAction={handle} />;',
    'const view = <View accessibilityActions={[{ name: chosen }]} onAccessibilityAction={handle} />;',
    'const view = <View accessibilityActions={[...base]} onAccessibilityAction={handle} />;',
    // Either half may arrive through the spread, so an unpaired one here is not yet a missing one.
    "const view = <View {...props} accessibilityActions={[{ name: 'activate' }]} />;",
    'const view = <View {...props} onAccessibilityAction={handle} />;',
    'const view = <View />;',
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
      // A bare attribute is `={true}`, which is not an array.
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
      // The handler switches on the name, so an entry without one can never be dispatched.
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
      // A standard name needs no label, so only the stray key reports.
      code: "const view = <View accessibilityActions={[{ name: 'activate', hint: 'x' }]} "
        + 'onAccessibilityAction={handle} />;',
      errors: [{
        messageId: 'unknownActionKey',
        data: { key: 'hint' },
      }],
    },
    {
      // Every entry is read, not just the first.
      code: "const view = <View accessibilityActions={[{ name: 'activate' }, { name: 'mute' }]} "
        + 'onAccessibilityAction={handle} />;',
      errors: [{
        messageId: 'customActionNeedsLabel',
        data: { name: 'mute' },
      }],
    },
    {
      // The pairing is reported on its own: with no handler, nothing inside the array can run either way.
      code: 'const view = <View accessibilityActions={[]} />;',
      errors: [{ messageId: 'actionsNeedHandler' }],
    },
  ],
});
