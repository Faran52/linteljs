# @linteljs/react-native-valid-accessibility-state

Require accessibilityState to be an object of the keys React Native reads.

- Category: `accessibility`
- Applies to: JavaScript and TypeScript
- Fixable: no
- In `recommended`: no, opt in explicitly

`accessibilityState` is how a checkbox says it is checked and a button says it is disabled. React
Native reads five keys off it and drops everything else in silence, so a state written under the
wrong name never reaches VoiceOver or TalkBack and the control announces as if it had no state at
all.

The five keys are `disabled`, `selected`, `checked`, `busy` and `expanded`, read off
`react-native@0.87.1`, `Libraries/Components/View/ViewAccessibility.d.ts`. All take a boolean,
except `checked`, which also takes the string `'mixed'` for a tri-state checkbox.

This rule reports four things:

- a value that is not an object at all, which is usually the shape the removed `accessibilityStates`
  prop took, an array of strings
- a key outside the five
- a non-boolean value on any key but `checked`
- a value on `checked` that is neither a boolean nor `'mixed'`

`pressed` is the common wrong key. It is an ARIA state with no React Native equivalent, and a
button written with it announces as an ordinary button forever.

## What it does not report

- A state computed at runtime. `accessibilityState={state}` and `{{ disabled: isDisabled }}` are
  the caller's to get right; only a value written down is judged.
- A key behind a spread or a computed name. `{{ ...base }}` and `{{ [key]: true }}` name nothing
  this rule can check.
- Whether the state is *true*. Saying `disabled` when the control is enabled is a bug this rule
  cannot see.

It is not fixable. `'true'` is presumably `true`, but a string is also what someone reaches for
when the value came from a form or an API, and rewriting it would change what the program does
rather than how it is annotated.

## Examples of incorrect code for this rule

```tsx
// incorrect: the shape the removed accessibilityStates prop took
<View accessibilityState={['disabled']} />

// incorrect: a string where a boolean belongs
<View accessibilityState={{ disabled: 'true' }} />

// incorrect: `pressed` is ARIA, and React Native has no key for it
<View accessibilityState={{ pressed: true }} />

// incorrect: `checked` takes a boolean or 'mixed', and nothing else
<View accessibilityState={{ checked: 'yes' }} />
```

## Examples of correct code for this rule

```tsx
// correct
<View accessibilityState={{ disabled: true }} />

// correct: the tri-state checkbox
<View accessibilityState={{ checked: 'mixed' }} />

// correct: computed at runtime, so not this rule's business
<View accessibilityState={{ disabled: isDisabled }} />
```

## Options

None.

## Notes

The `aria-*` aliases (`aria-disabled`, `aria-checked` and the rest) set the same state through
separate props and are typed individually by React Native, so they need no checking here.

This rule is not in `recommended`. Enable it through `flat/accessibility`, or by rule name in a
React Native config.
