# @linteljs/react-native-accessible-name

Require an accessible name on React Native elements that are announced.

- Category: `accessibility`
- Applies to: JavaScript and TypeScript
- Fixable: no
- In `recommended`: no, opt in explicitly

A control with no name is announced by VoiceOver and TalkBack as "button" and nothing else, which
tells a screen reader user that something is there and not what it does. The icon-only button is
the usual case: it reads perfectly on screen and is silent to everyone who cannot see it.

This rule reports three separate mistakes.

**An operable element with no name.** An element counts as operable when it is one of React
Native's touchables (`Pressable`, the `Touchable*` family, `Button`, `Switch`, `TextInput`), when
it carries a touch handler (`onPress`, `onPressIn`, `onPressOut`, `onLongPress`,
`onAccessibilityTap`) whatever it is called, or when the `components` option names it. A handler
is enough on its own, so a wrapper around a touchable is caught with no configuration.

**A hint with no name.** `accessibilityHint` is read *after* the name, to say what activating the
element will do. With no name there is nothing for it to qualify, and the hint alone is not a
substitute. This is the opposite of the better-known rule that asks for a hint on every labelled
element: a hint is for the case where the result is not obvious from the label, so demanding one
everywhere produces noise and teaches people to write the label twice.

**An empty label.** `accessibilityLabel=""` does not leave the name alone, it clears it. A label
overrides the text below the element, so an empty one silences a button that would otherwise have
announced its own contents.

## What it does not report

- An element with a spread. `{...props}` may carry the label, so nothing here can be called
  missing.
- An element hidden from assistive technology with `aria-hidden`, `accessibilityElementsHidden`
  or `importantForAccessibility="no-hide-descendants"`. Decorative content is hidden rather than
  labelled, and giving it a name is the wrong fix.
- An element with text below it. React Native builds a missing label by accumulating the `Text`
  nodes underneath, so `<Pressable><Text>Save</Text></Pressable>` is correct as written.
- An element whose children include an expression. `{label}` renders something this rule cannot
  read, and assuming it renders text costs a missed report where assuming it does not costs a
  false one on the commonest pattern in the language.
- A name computed at runtime. `accessibilityLabel={title}` is a label whatever `title` holds.
- A `Button` with a `title`, which is where React Native gets that component's label from.

Both spellings count as a name: `accessibilityLabel` and `aria-label`, `accessibilityLabelledBy`
and `aria-labelledby`. React Native maps the ARIA alias onto the legacy prop, so a rule that knew
only one of the two would report components that are already accessible.

It is not fixable, and deliberately so. A label is a sentence about what the control does, which
only the author knows. A fixer would have to invent one, and an invented label is worse than no
label: it silences this rule, reads as done, and ships a button that announces the wrong thing.

## Examples of incorrect code for this rule

```tsx
// incorrect: announced as "button", with no way to know what it does
<TouchableOpacity onPress={save}><Icon name="save" /></TouchableOpacity>

// incorrect: a wrapper is a control too, by its handler
<View onPress={go} />

// incorrect: a placeholder disappears as soon as the field has content
<TextInput placeholder="Email" />

// incorrect: the hint has no name to follow
<View accessibilityHint="Opens settings" />

// incorrect: the empty label overrides the text below it
<Pressable accessibilityLabel=""><Text>Save</Text></Pressable>
```

## Examples of correct code for this rule

```tsx
// correct: named outright
<Pressable accessibilityLabel="Save draft" />

// correct: the ARIA alias reaches the same native behaviour
<Pressable aria-label="Save draft" />

// correct: React Native builds the name from the Text below
<Pressable onPress={save}><Text>Save</Text></Pressable>

// correct: a hint once there is a name for it to qualify
<Pressable accessibilityLabel="Save" accessibilityHint="Saves the draft" />

// correct: decorative content is hidden, not labelled
<Pressable aria-hidden />
```

## Options

`components` is an array of extra element names to treat as controls. An atomic component library
is the normal case: `IconButton`, `Pill` and `SegmentControl` are invisible to this rule until
they are named, unless they happen to carry one of the touch handlers above.

```js
{
  '@linteljs/react-native-accessible-name': ['error', {
    components: ['IconButton', 'Pill', 'SegmentControl'],
  }],
}
```

## Notes

Element names are matched as written, not resolved to where they were imported from. A qualified
name resolves to its last part, so `Animated.View` is checked as a `View`.

This rule is not in `recommended`, and nothing outside React Native should turn it on: `Button`,
`Switch` and `Image` are ordinary names that mean something else on the web. Enable it through
`flat/accessibility`, or by rule name in a React Native config.
