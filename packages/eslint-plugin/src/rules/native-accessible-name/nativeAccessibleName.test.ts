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
    'const view = <Pressable title="Save" />;',
    'const view = <Pressable aria-hidden={hidden} />;',
    'const view = <Pressable aria-hidden={true} />;',
    'const view = <Pressable aria-hidden accessibilityLabel="" />;',
    'const view = <View aria-hidden accessibilityHint="Opens settings" />;',
    'const view = <Pressable {...props} accessibilityLabel="" />;',
    'const view = <Pressable accessibilityLabel="" {...props} />;',
    'const view = <Pressable accessibilityLabel={`Save`} />;',
    'const view = <Pressable accessibilityLabel />;',
    'const view = <Pressable accessibilityLabelledBy="heading" accessibilityHint="Saves the draft" />;',
    'const view = <Button title="Save" accessibilityHint="Saves the draft" />;',
    'const view = <Pressable><>Save</></Pressable>;',
    'const view = <Pressable>{/* icon */}<Text>Save</Text></Pressable>;',
    'const view = <Pressable>{ready && <Text>Save</Text>}</Pressable>;',
    'const view = <Pressable /* named below */ accessibilityLabel="Save" />;',
    'const view = <Pressable<Props> accessibilityLabel="Save" />;',
    'const view = <Pressable importantForAccessibility={mode} accessibilityLabel="Save" />;',
    'const view = <Card />;',
    'const view = <Text>Save</Text>;',
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
    {
      code: 'const view = <Card accessibilityHint="Opens the card" onPress={open} />;',
      errors: [{ messageId: 'hintNeedsName' }],
    },
    {
      code: 'const view = <Pressable accessibilityHint="Saves the draft"><Text>Save</Text></Pressable>;',
      errors: [{ messageId: 'hintNeedsName' }],
    },
    {
      code: 'const view = <Pressable aria-label="" />;',
      errors: [{ messageId: 'emptyName' }],
    },
    {
      code: 'const view = <View accessibilityLabel="" />;',
      errors: [{ messageId: 'emptyName' }],
    },
    {
      code: 'const view = <Pressable accessibilityLabel="" accessibilityHint="Saves the draft" />;',
      errors: [{ messageId: 'emptyName' }],
    },
    {
      code: 'const view = <Pressable accessibilityLabel="" title="Save" />;',
      errors: [{ messageId: 'emptyName' }],
    },
    {
      code: 'const view = <Pressable />;',
      options: [{ components: ['CustomButton'] }],
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'Pressable' },
      }],
    },
    {
      code: 'const view = <Pressable />;',
      options: [{ components: [] }],
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'Pressable' },
      }],
    },
    {
      code: 'const view = <Pressable />;',
      options: [{}],
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'Pressable' },
      }],
    },
    {
      code: 'const view = <Button onPress={save} />;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'Button' },
      }],
    },
    {
      code: 'const view = <Switch value={on} />;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'Switch' },
      }],
    },
    {
      code: 'const view = <Card onPressIn={go} />;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'Card' },
      }],
    },
    {
      code: 'const view = <Card onPressOut={go} />;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'Card' },
      }],
    },
    {
      code: 'const view = <Card onAccessibilityTap={go} />;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'Card' },
      }],
    },
    {
      code: 'const view = <UI.Buttons.Pressable />;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'Pressable' },
      }],
    },
    {
      code: 'const view = <svg:rect onPress={go} />;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'rect' },
      }],
    },
    {
      code: 'const view = <Pressable<Props> onPress={go} />;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'Pressable' },
      }],
    },
    {
      code: 'const view = <Pressable /* no name */ onPress={go} />;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'Pressable' },
      }],
    },
    {
      code: 'const view = <Pressable>   </Pressable>;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'Pressable' },
      }],
    },
    {
      code: 'const view = <Pressable><></></Pressable>;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'Pressable' },
      }],
    },
    {
      code: 'const view = <Pressable importantForAccessibility="no" />;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'Pressable' },
      }],
    },
    {
      code: 'const view = <Pressable accessibilityElementsHidden={false} />;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'Pressable' },
      }],
    },
    {
      code: 'const view = <Pressable><Pressable accessibilityLabel="Save" /></Pressable>;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'Pressable' },
        column: 14,
      }],
    },
    {
      code: 'const view = <Pressable><TouchableOpacity /></Pressable>;',
      errors: [
        {
          messageId: 'interactiveNeedsName',
          data: { name: 'Pressable' },
          column: 14,
        },
        {
          messageId: 'interactiveNeedsName',
          data: { name: 'TouchableOpacity' },
          column: 25,
        },
      ],
    },
  ],
});
