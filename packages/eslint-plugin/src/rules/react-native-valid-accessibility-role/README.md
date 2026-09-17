# @linteljs/react-native-valid-accessibility-role

Require accessibilityRole and role values React Native understands.

- Category: `accessibility`
- Applies to: JavaScript and TypeScript
- Fixable: no
- In `recommended`: no, opt in explicitly

A role outside React Native's vocabulary is dropped without a word. Nothing warns, nothing throws,
and the element is announced as if the prop had never been written. A typo therefore costs the
whole role, and the only way to notice is to run a screen reader.

This rule checks both props against their own vocabulary.

`accessibilityRole` takes React Native's `AccessibilityRole`, which is 40 values. `role` takes
`Role`, which is 65 and is the ARIA spelling. **They are different sets, not one set with two
spellings.** `imagebutton` is an `accessibilityRole` and is not a `role`; `img`, `searchbox` and
`treeitem` are roles and are not accessibility roles. A rule sharing one list between them passes
half of these mistakes.

Both lists are read off `react-native@0.87.1`,
`Libraries/Components/View/ViewAccessibility.d.ts`, rather than off a documentation page. The
list published by the best-known third-party plugin is missing `dropdownlist`, `grid` and the
seven Android container roles, and carries three values (`img`, `img button`, `img link`) React
Native has never accepted for `accessibilityRole`.

## What it does not report

- A value computed at runtime. `accessibilityRole={role}` is unreadable here rather than wrong,
  and reporting it would be a guess.
- Whether a role is *right* for the element. `accessibilityRole="header"` on a button is valid
  and wrong, and no linter can tell.
- A missing role. An unnamed control is
  [`react-native-accessible-name`](../react-native-accessible-name); which role it should carry
  is a judgment this rule does not make.

It is not fixable. `"buton"` is probably `"button"`, but `"img"` could be `"image"` or
`"imagebutton"` and those announce differently, and a wrong role is harder to find later than a
missing one. Nearest-match repair of an accessibility annotation is a guess with a cost, so this
reports and stops.

## Examples of incorrect code for this rule

```tsx
// incorrect: a typo, silently dropped
<View accessibilityRole="buton" />

// incorrect: `img` is an ARIA role, never an accessibilityRole
<View accessibilityRole="img" />

// incorrect: and `imagebutton` is the other way round
<View role="imagebutton" />

// incorrect: a bare attribute is `={true}`, which is not a role
<View accessibilityRole />
```

## Examples of correct code for this rule

```tsx
// correct
<View accessibilityRole="button" />

// correct: in React Native's own type, and absent from the published third-party list
<View accessibilityRole="dropdownlist" />

// correct: the ARIA vocabulary, for the ARIA prop
<View role="searchbox" />

// correct: unreadable rather than wrong
<View accessibilityRole={role} />
```

## Options

None.

## Notes

This rule is not in `recommended`. Enable it through `flat/accessibility`, or by rule name in a
React Native config.
