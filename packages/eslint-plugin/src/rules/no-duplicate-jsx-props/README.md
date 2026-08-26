# @linteljs/no-duplicate-jsx-props

Report duplicate JSX props on the same element.

- Category: `functions`
- Applies to: JavaScript and TypeScript
- Fixable: no
- In `recommended`: no, opt in explicitly

React keeps the last occurrence of a duplicated prop and silently drops the rest, so the first
value disappears without a word from the compiler, the type checker or any other rule. Two
overlapping edits left `usage={null} nowMs={0}` twice on eight call sites in one file with every
gate green. This rule reports the second and later occurrences.

It is not fixable. Deleting one of the two is a guess at which value the author meant, and the
two values usually differ.

A spread resets the count. `{...props}` can override every explicit prop before it and be
overridden by every explicit prop after it, so this is the documented way to offer a default:

```tsx
const view = <span className="default" {...props} className="override" />;
```

Neither occurrence reports there. The same two names with no spread between them do.

## Examples of incorrect code for this rule

```tsx
// incorrect: React renders className="b" and "a" is gone
<span className="a" className="b" />

// incorrect: a shorthand duplicates its spelled-out twin
<button disabled disabled />

// incorrect: a third occurrence after a spread reports again
<span a={1} {...props} a={2} a={3} />
```

## Examples of correct code for this rule

```tsx
// correct: distinct names
<span className="a" id="b" />

// correct: a spread sits between the pair
<span className="a" {...props} className="b" />

// correct: namespaced names compare whole
<use xlink:href="#a" xlink:title="b" />

// correct: each element starts fresh
const view = <><span a={1} /><span a={2} /></>;
```

## Options

None.

## Notes

The plugin ships no JSX layer of its own, so this rule is not in `recommended`: it turns on in
the React and Solid layers of `@linteljs/eslint-config`, the two that render JSX. Vue and Svelte
templates are not JSX and take nothing.
