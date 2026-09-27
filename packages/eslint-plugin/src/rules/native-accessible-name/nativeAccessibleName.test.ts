import { tsxRuleTester } from '@mocks/ruleTesters';

import { nativeAccessibleName } from './nativeAccessibleName.ts';

tsxRuleTester.run('native-accessible-name', nativeAccessibleName, {
  valid: [
    'const view = <Pressable accessibilityLabel="Save" />;',
    'const view = <Pressable aria-label="Save" />;',
    'const view = <TouchableOpacity accessibilityLabelledBy="heading" />;',
    'const view = <TouchableOpacity aria-labelledby="heading" />;',
    'const view = <Button title="Save" onPress={save} />;',
    'const view = <Pressable onPress={save}><Text>Save</Text></Pressable>;',
    'const view = <Pressable><View><Text>Save</Text></View></Pressable>;',
    'const view = <Pressable>Save</Pressable>;',
    'const view = <Pressable>{label}</Pressable>;',
    'const view = <Pressable {...props} />;',
    'const view = <Pressable aria-hidden />;',
    'const view = <Pressable accessibilityElementsHidden />;',
    'const view = <Pressable importantForAccessibility="no-hide-descendants" />;',
    'const view = <View />;',
    'const view = <View><Icon /></View>;',
    'const view = <CustomButton />;',
    'const view = <Pressable accessibilityLabel="Save" accessibilityHint="Saves the draft" />;',
    'const view = <View accessibilityHint="Opens settings" aria-label="Settings" />;',
    'const view = <Pressable accessibilityLabel={title} />;',
    {
      code: 'const view = <Pressable accessibilityLabel="Save" />;',
      options: [{ components: ['CustomButton'] }],
    },
  ],
  invalid: [
    {
      code: 'const view = <Pressable />;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'Pressable' },
      }],
    },
    {
      code: 'const view = <TouchableOpacity onPress={save}><Icon name="save" /></TouchableOpacity>;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'TouchableOpacity' },
      }],
    },
    {
      code: 'const view = <Pressable>\n  <Icon />\n</Pressable>;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'Pressable' },
      }],
    },
    {
      code: 'const view = <Pressable>{/* nothing yet */}</Pressable>;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'Pressable' },
      }],
    },
    {
      code: 'const view = <View onPress={go} />;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'View' },
      }],
    },
    {
      code: 'const view = <TextInput placeholder="Email" />;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'TextInput' },
      }],
    },
    {
      code: 'const view = <Animated.View onLongPress={go} />;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'View' },
      }],
    },
    {
      code: 'const view = <CustomButton />;',
      options: [{ components: ['CustomButton'] }],
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'CustomButton' },
      }],
    },
    {
      code: 'const view = <Pressable aria-hidden={false} />;',
      errors: [{ messageId: 'interactiveNeedsName' }],
    },
    {
      code: 'const view = <Pressable accessibilityLabel=""><Text>Save</Text></Pressable>;',
      errors: [{ messageId: 'emptyName' }],
    },
    {
      code: "const view = <Pressable accessibilityLabel={''} />;",
      errors: [{ messageId: 'emptyName' }],
    },
    {
      code: 'const view = <View accessibilityHint="Opens settings" />;',
      errors: [{ messageId: 'hintNeedsName' }],
    },
    {
      code: 'const view = <Pressable accessibilityHint="Saves the draft" />;',
      errors: [{ messageId: 'hintNeedsName' }],
    },
  ],
});
