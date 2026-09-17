import { tsxRuleTester } from '@mocks/ruleTesters';

import { reactNativeNoNestedTouchables } from './reactNativeNoNestedTouchables.ts';

tsxRuleTester.run('react-native-no-nested-touchables', reactNativeNoNestedTouchables, {
  valid: [
    // Without `accessible`, the container is not a focus stop and each control keeps its own.
    'const view = <View><Pressable accessibilityLabel="Save" /></View>;',
    'const view = <View accessible={false}><Pressable accessibilityLabel="Save" /></View>;',
    // Grouping text is exactly what `accessible` is for.
    'const view = <View accessible><Text>Jane</Text><Text>Online</Text></View>;',
    'const view = <View accessible />;',
    'const view = <View accessible><Image source={photo} /></View>;',
    // Reporting needs certainty, and a value computed at runtime may well be false.
    'const view = <View accessible={isGrouped}><Pressable accessibilityLabel="Save" /></View>;',
    // The control is the focus stop itself, which is the correct shape.
    'const view = <Pressable accessible accessibilityLabel="Save"><Text>Save</Text></Pressable>;',
    // A custom control is invisible until the options name it.
    'const view = <View accessible><CustomButton /></View>;',
  ],
  invalid: [
    {
      code: 'const view = <View accessible><Pressable accessibilityLabel="Save" /></View>;',
      errors: [{
        messageId: 'nestedTouchable',
        data: { name: 'Pressable' },
      }],
    },
    {
      // Depth does not help: the container still collapses everything below it into one stop.
      code: 'const view = <View accessible={true}><View><TouchableOpacity accessibilityLabel="Save" /></View></View>;',
      errors: [{
        messageId: 'nestedTouchable',
        data: { name: 'TouchableOpacity' },
      }],
    },
    {
      // Found by its handler rather than by its tag.
      code: 'const view = <View accessible><View onPress={go} /></View>;',
      errors: [{
        messageId: 'nestedTouchable',
        data: { name: 'View' },
      }],
    },
    {
      // A touchable inside a touchable: the outer one swallows the inner.
      code: 'const view = <Pressable accessible accessibilityLabel="Card"><Button title="Save" '
        + 'onPress={save} /></Pressable>;',
      errors: [{
        messageId: 'nestedTouchable',
        data: { name: 'Button' },
      }],
    },
    {
      code: 'const view = <View accessible><CustomButton /></View>;',
      options: [{ components: ['CustomButton'] }],
      errors: [{
        messageId: 'nestedTouchable',
        data: { name: 'CustomButton' },
      }],
    },
    {
      // Text beside a control does not excuse the control being unreachable.
      code: 'const view = <View accessible><Text>Jane</Text><Pressable accessibilityLabel="Call" /></View>;',
      errors: [{
        messageId: 'nestedTouchable',
        data: { name: 'Pressable' },
      }],
    },
  ],
});
