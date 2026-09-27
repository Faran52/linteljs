---
paths:
  - "**/*.tsx"
  - "src/lib/primitives/**/*.ts"
---

# Solid Reactivity Rules

Use this rule when adding state, deriving a value, or reaching for `createEffect`.

A Solid component function runs **once**. There is no re-render, so "you might not need an effect"
does not transfer, because the whole model is different. What updates is a signal read inside a tracked
scope. The question is: **is this a value, or is it a side effect?** A value is `createMemo` or a
plain function. Only a side effect is `createEffect`.

## Hierarchy

Use the first option that fits.

1. **A plain arrow function.** `const total = () => a() + b()` is already reactive at every call
   site. It costs nothing and needs no primitive.
2. **`createMemo`.** The same thing, cached. Reach for it when the computation is expensive or the
   result is read by many consumers and identity stability matters.
3. **`createEffect`.** A genuine side effect: an imperative API, a subscription, logging. Pair it
   with `onCleanup` for anything it starts.
4. **`createResource`.** Async data. Never fetch inside a `createEffect` and assign to a signal.

## Rules

- **Never destructure props.** `const { value } = props` reads once, at component setup, and never
  updates again: the component renders correctly the first time and then silently freezes. Read
  `props.value` at the point of use, or use `splitProps` / `mergeProps`.
- The same applies to a store: destructuring a `createStore` value severs tracking.
- **Never set a signal from a `createEffect` in order to derive it.** Use a memo. The effect version
  runs a tick late and shows the previous value in between.
- **`use` is the wrong prefix.** These are primitives, not hooks: `createFoo` for anything that owns
  reactive state, and they live in `lib/primitives/`.
- A primitive created outside a reactive root never disposes. Anything constructed outside a
  component, including in a test, is wrapped in `createRoot` and disposed.
- `<Show>` and `<For>` are not `&&` and `.map()`. A ternary in JSX re-creates the subtree on every
  change; `<Show>` keeps it. `.map()` re-creates every row when one item changes; `<For>` keeps
  identity.
- Control flow inside JSX must stay lazy. A signal read at the top of the component body is read
  once, outside any tracked scope, and will not update.

## Sources

- https://docs.solidjs.com/concepts/intro-to-reactivity
- https://docs.solidjs.com/concepts/components/props
