---
paths:
  - "**/*.vue"
  - "src/lib/composables/**/*.ts"
---

# Vue Reactivity Rules

Use this rule when adding state, deriving a value, or reaching for `watch`.

Vue tracks dependencies rather than re-running the component, so the React question "does this
need an effect" is the wrong one here. The question is: **is this a value, or is it a side
effect?** A value is `computed`. Only a side effect is a watcher.

## Hierarchy

Use the first option that fits.

1. **`computed`.** Anything derivable from other reactive state. It caches, it re-evaluates lazily,
   and it cannot go stale. This covers most of what a `watch` is reached for.
2. **`watchEffect`.** A genuine side effect whose dependencies are obvious from its own body:
   syncing to `localStorage`, driving an imperative library.
3. **`watch`** with an explicit source. Use when you need the previous value, `{ immediate: false }`
   semantics, or a dependency the body does not otherwise read.

## Rules

- **Never write reactive state from inside a `watch` in order to derive it.** That is a `computed`
  wearing a disguise: it renders once with the stale value, then again with the right one, and the
  two-step is visible.
- **Never destructure a reactive object.** `const { a } = props` and `const { a } = store` both read
  once and sever tracking. Use `toRefs`, or keep the object and read `props.a` at the point of use.
- Props are readonly. A prop that needs local editing becomes a `computed` with a getter and a
  setter over `defineModel`, never a `ref` initialised from the prop and then diverging.
- **Reactivity is asynchronous.** The DOM updates on the next tick. Anything that must read the
  updated DOM goes in `await nextTick()` or `onUpdated`, never straight after the mutation.
- A `watch` on a deep object without `{ deep: true }` fires on replacement only. If you meant deep,
  say so; if you meant a specific field, watch a getter for that field instead.
- Every `watch` and `watchEffect` created outside `setup` must be stopped. Inside `setup` the
  component scope owns it; in a composable called from elsewhere, return the stop handle or use
  `effectScope`.
- Composables start with `use`, take refs or getters, and return refs, never a plain value read
  once at call time, which severs tracking for every caller.
