# @linteljs/react-native-valid-accessibility-actions

Require accessibilityActions and onAccessibilityAction to be declared together and well formed.

- Category: `accessibility`
- Applies to: JavaScript and TypeScript
- Fixable: no
- In `recommended`: no, opt in explicitly

Custom accessibility actions are how a screen reader user reaches something a sighted user gets
from a swipe or a long press: archive, mute, delete. They come in two halves. `accessibilityActions`
declares the menu, `onAccessibilityAction` performs what the user picked, and the handler switches
on the action's name. Either half alone does nothing: a declared action with no handler offers a
menu entry that silently fails, and a handler with no declared action is never called.

This rule reports:

- one half without the other
- a value that is not an array
- an empty array, which offers a menu with nothing in it
- an entry with no `name`, which is the string the handler switches on
- a custom action with no `label`, so the raw name is read aloud
- a key other than `name` or `label`, which React Native drops

The six names the platform already has words for are `activate`, `increment`, `decrement`,
`longpress`, `magicTap` and `escape`, read off `react-native@0.87.1`,
`Libraries/Components/View/ViewAccessibility.d.ts`. Any other name is the app's own and needs a
label, or a screen reader announces the identifier: "mute" is tolerable, "archive_thread_v2" is
not.

## What it does not report

- An element with a spread. `{...props}` may carry either half, so an unpaired one is not yet a
  missing one.
- An array or a name computed at runtime. `accessibilityActions={actions}` and
  `{ name: chosen }` cannot be read here.
- A spread inside the array. `[...base]` carries entries this rule cannot enumerate.
- Whether the handler actually handles each declared name. That needs following the function to
  its definition and reading a `switch`, which is a different kind of analysis.
- Anything else about the array once the two halves are unpaired: the pairing is reported on its
  own, since with no handler nothing inside the array can run either way.

It is not fixable. The missing half is a function body only the author can write, and the missing
label is a phrase a screen reader will read out.

## Examples of incorrect code for this rule

```tsx
// incorrect: a menu entry that silently fails
<View accessibilityActions={[{ name: 'activate' }]} />

// incorrect: never called
<View onAccessibilityAction={handle} />

// incorrect: a menu with nothing in it
<View accessibilityActions={[]} onAccessibilityAction={handle} />

// incorrect: the handler switches on a name this entry does not have
<View accessibilityActions={[{ label: 'Mute' }]} onAccessibilityAction={handle} />

// incorrect: a custom name read out raw
<View accessibilityActions={[{ name: 'mute' }]} onAccessibilityAction={handle} />

// incorrect: `hint` is not a key an action takes, so it is dropped
<View accessibilityActions={[{ name: 'activate', hint: 'x' }]} onAccessibilityAction={handle} />
```

## Examples of correct code for this rule

```tsx
// correct: a standard name needs no label
<View accessibilityActions={[{ name: 'activate' }]} onAccessibilityAction={handle} />

// correct: a custom name with words for it
<View accessibilityActions={[{ name: 'mute', label: 'Mute' }]} onAccessibilityAction={handle} />

// correct: computed at runtime, so unreadable here
<View accessibilityActions={actions} onAccessibilityAction={handle} />
```

## Options

None.

## Notes

This rule is not in `recommended`. Enable it through `flat/accessibility`, or by rule name in a
React Native config.
