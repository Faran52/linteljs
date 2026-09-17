# @linteljs/react-native-no-nested-touchables

Disallow controls inside a container marked accessible.

- Category: `accessibility`
- Applies to: JavaScript and TypeScript
- Fixable: no
- In `recommended`: no, opt in explicitly

`accessible={true}` collapses everything below an element into a single focus stop. That is
exactly what it is for: a name and a status that belong together should be read as one thing
rather than swiped through separately. The cost is that nothing inside it can be focused any
more, so a button in there becomes unreachable to a screen reader while staying perfectly
tappable for everyone else.

It is a quiet failure. The button still works, still looks right, and still passes every test that
renders it. The only symptom is that a swipe-navigating user can never reach it.

An element counts as a control when it is one of React Native's touchables (`Pressable`, the
`Touchable*` family, `Button`, `Switch`, `TextInput`), when it carries a touch handler (`onPress`,
`onPressIn`, `onPressOut`, `onLongPress`, `onAccessibilityTap`) whatever it is called, or when the
`components` option names it.

The fix is usually one of two things: move `accessible` onto the control itself so the control is
the focus stop, or drop it from the container and let each child keep its own.

## What it does not report

- A container with no `accessible` prop. Without it, nothing is collapsed.
- `accessible={false}`, which is the default for a `View` anyway.
- A value computed at runtime. `accessible={isGrouped}` may well be false, and reporting needs the
  certainty that it is not.
- A container whose children are text and images. Grouping those is the intended use.
- A control that *is* the accessible element. `<Pressable accessible>` is correct: the focus stop
  and the control are the same node.

It is not fixable. The two repairs are opposites and produce different interfaces: hoisting
`accessible` onto the control merges the surrounding text into the button's name, dropping it
leaves the text and the button as separate stops. Which one is right depends on whether the card
is one thing or several, and only the author knows.

## Examples of incorrect code for this rule

```tsx
// incorrect: the button cannot be focused
<View accessible>
  <Pressable accessibilityLabel="Save" />
</View>

// incorrect: depth does not help
<View accessible={true}>
  <View><TouchableOpacity accessibilityLabel="Save" /></View>
</View>

// incorrect: a control by its handler rather than its tag
<View accessible>
  <View onPress={go} />
</View>
```

## Examples of correct code for this rule

```tsx
// correct: grouping text is what accessible is for
<View accessible>
  <Text>Jane</Text>
  <Text>Online</Text>
</View>

// correct: the control is the focus stop
<Pressable accessible accessibilityLabel="Save">
  <Text>Save</Text>
</Pressable>

// correct: no grouping, so each control keeps its own stop
<View>
  <Pressable accessibilityLabel="Save" />
</View>
```

## Options

`components` is an array of extra element names to treat as controls, for a component library
whose buttons are not named after a React Native primitive.

```js
{
  '@linteljs/react-native-no-nested-touchables': ['error', {
    components: ['IconButton', 'Pill', 'SegmentControl'],
  }],
}
```

## Notes

This rule is not in `recommended`. Enable it through `flat/accessibility`, or by rule name in a
React Native config.
