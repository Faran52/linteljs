import { tsxRuleTester } from '@mocks/ruleTesters';

import { reactNativeAccessibleName } from './reactNativeAccessibleName.ts';

tsxRuleTester.run('react-native-accessible-name', reactNativeAccessibleName, {
  valid: [
    'const view = <Pressable accessibilityLabel="Save" />;',
    // The ARIA alias reaches the same native behaviour, so a rule that knew only the legacy spelling would
    // report a component that is already accessible.
    'const view = <Pressable aria-label="Save" />;',
    'const view = <TouchableOpacity accessibilityLabelledBy="heading" />;',
    'const view = <TouchableOpacity aria-labelledby="heading" />;',
    // React Native's Button builds its label from `title`.
    'const view = <Button title="Save" onPress={save} />;',
    // The commonest correct pattern in the language: React Native accumulates the Text below an element
    // into the name when no label is set.
    'const view = <Pressable onPress={save}><Text>Save</Text></Pressable>;',
    'const view = <Pressable><View><Text>Save</Text></View></Pressable>;',
    'const view = <Pressable>Save</Pressable>;',
    // An expression renders something this rule cannot read, and assuming it renders text costs a missed
    // report where assuming it does not costs a false one.
    'const view = <Pressable>{label}</Pressable>;',
    // The label may arrive through the spread.
    'const view = <Pressable {...props} />;',
    'const view = <Pressable aria-hidden />;',
    'const view = <Pressable accessibilityElementsHidden />;',
    'const view = <Pressable importantForAccessibility="no-hide-descendants" />;',
    // Not a control: a plain View handles no touch and is announced as nothing.
    'const view = <View />;',
    'const view = <View><Icon /></View>;',
    // A custom name is invisible until the options name it.
    'const view = <CustomButton />;',
    // A hint is fine once there is a name for it to follow.
    'const view = <Pressable accessibilityLabel="Save" accessibilityHint="Saves the draft" />;',
    'const view = <View accessibilityHint="Opens settings" aria-label="Settings" />;',
    // A label computed at runtime is still a label.
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
      // The icon-only button, which is the case this rule exists for.
      code: 'const view = <TouchableOpacity onPress={save}><Icon name="save" /></TouchableOpacity>;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'TouchableOpacity' },
      }],
    },
    {
      // Whitespace between the tags is not text.
      code: 'const view = <Pressable>\n  <Icon />\n</Pressable>;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'Pressable' },
      }],
    },
    {
      // A comment renders nothing, so the container is still silent.
      code: 'const view = <Pressable>{/* nothing yet */}</Pressable>;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'Pressable' },
      }],
    },
    {
      // Named by its handler rather than by its tag, so a wrapper is caught with no configuration.
      code: 'const view = <View onPress={go} />;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'View' },
      }],
    },
    {
      // A placeholder is not a label: it disappears the moment the field has content.
      code: 'const view = <TextInput placeholder="Email" />;',
      errors: [{
        messageId: 'interactiveNeedsName',
        data: { name: 'TextInput' },
      }],
    },
    {
      // A qualified name resolves to its last part.
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
      // `aria-hidden={false}` un-hides, so the element is announced and still has no name.
      code: 'const view = <Pressable aria-hidden={false} />;',
      errors: [{ messageId: 'interactiveNeedsName' }],
    },
    {
      // An empty label overrides the Text below it, so the button announces as nothing at all.
      code: 'const view = <Pressable accessibilityLabel=""><Text>Save</Text></Pressable>;',
      errors: [{ messageId: 'emptyName' }],
    },
    {
      code: "const view = <Pressable accessibilityLabel={''} />;",
      errors: [{ messageId: 'emptyName' }],
    },
    {
      // A hint is read after the name, so with no name there is nothing for it to qualify.
      code: 'const view = <View accessibilityHint="Opens settings" />;',
      errors: [{ messageId: 'hintNeedsName' }],
    },
    {
      // Reported on the hint rather than on the missing name: the hint is the prop that does nothing here.
      code: 'const view = <Pressable accessibilityHint="Saves the draft" />;',
      errors: [{ messageId: 'hintNeedsName' }],
    },
  ],
});
