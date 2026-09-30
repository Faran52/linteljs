import { tsxRuleTester } from '@mocks/ruleTesters';

import { nativeNoNestedTouchables } from './nativeNoNestedTouchables.ts';

tsxRuleTester.run('native-no-nested-touchables', nativeNoNestedTouchables, {
  valid: [
    'const view = <View accessible>{show && <Text>Jane</Text>}</View>;',
    'const view = <View accessible>{show ? <Text>a</Text> : null}</View>;',
    'const view = <View accessible>{show && renderButton()}</View>;',
    'const view = <View accessible>{show && <><Text>a</Text></>}</View>;',
    'const view = <View><Pressable accessibilityLabel="Save" /></View>;',
    'const view = <View accessible={false}><Pressable accessibilityLabel="Save" /></View>;',
    'const view = <View accessible><Text>Jane</Text><Text>Online</Text></View>;',
    'const view = <View accessible />;',
    'const view = <View accessible><Image source={photo} /></View>;',
    'const view = <View accessible={isGrouped}><Pressable accessibilityLabel="Save" /></View>;',
    'const view = <Pressable accessible accessibilityLabel="Save"><Text>Save</Text></Pressable>;',
    'const view = <View accessible><CustomButton /></View>;',
  ],
  invalid: [
    ...[
      '{show && <Pressable accessibilityLabel="Save" />}',
      '{show ? <Text>a</Text> : <Pressable accessibilityLabel="Save" />}',
      '{show ? <Pressable accessibilityLabel="Save" /> : null}',
      '{show || <Pressable accessibilityLabel="Save" />}',
      '{show && (a ? <View><Pressable accessibilityLabel="Save" /></View> : null)}',
      '{show && <><Pressable accessibilityLabel="Save" /></>}',
      '{<Pressable accessibilityLabel="Save" /> ?? null}',
    ]
      .map((child) => {
        return {
          code: `const view = <View accessible>${child}</View>;`,
          errors: [{
            messageId: 'nestedTouchable' as const,
            data: { name: 'Pressable' },
          }],
        };
      }),
    {
      code: 'const view = <View accessible><Pressable accessibilityLabel="Save" /></View>;',
      errors: [{
        messageId: 'nestedTouchable',
        data: { name: 'Pressable' },
      }],
    },
    {
      code: 'const view = <View accessible={true}><View><TouchableOpacity accessibilityLabel="Save" /></View></View>;',
      errors: [{
        messageId: 'nestedTouchable',
        data: { name: 'TouchableOpacity' },
      }],
    },
    {
      code: 'const view = <View accessible><View onPress={go} /></View>;',
      errors: [{
        messageId: 'nestedTouchable',
        data: { name: 'View' },
      }],
    },
    {
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
      code: 'const view = <View accessible><Text>Jane</Text><Pressable accessibilityLabel="Call" /></View>;',
      errors: [{
        messageId: 'nestedTouchable',
        data: { name: 'Pressable' },
      }],
    },
  ],
});
