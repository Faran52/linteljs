---
paths:
  - "**/*.svelte"
  - "**/*.svelte.ts"
  - "src/lib/hooks/**/*.ts"
---

# Svelte Reactivity Rules

Use this rule when adding state, deriving a value, or reaching for `$effect`.

Runes track reads at the point of use, so a component never re-runs: only the reactions that read
what changed. The React framing does not transfer. The question is: **is this a value, or is it a
side effect?** A value is `$derived`. Only a side effect is `$effect`.

## Hierarchy

Use the first option that fits.

1. **`$derived`** (or `$derived.by` for a multi-statement body). Anything computable from other
   state. It is lazy, cached, and cannot go stale.
2. **`$effect`.** A genuine side effect: an imperative API, a subscription, a canvas draw, syncing
   to storage. Its cleanup return is not optional: anything it starts, it stops.
3. **`$effect.pre`.** Only when the work must happen before the DOM updates, such as capturing a
   scroll position about to change.

## Rules

- **Never assign state inside an `$effect` to derive it.** That is `$derived` with extra steps and
  an extra frame. Svelte will warn about the cycle; the warning is right.
- `$state` is deeply reactive through a proxy, so mutating a nested field works, but only through
  the proxy. A value pulled out into a local variable is a snapshot. Read it where you use it.
- **Destructuring `$props()` is fine and idiomatic**, because the compiler rewrites the accesses. This is
  the opposite of Vue and Solid; do not carry that habit across.
- An effect tracks exactly what it reads **synchronously**. State read after an `await`, or inside
  a `setTimeout` callback, is not a dependency. If it must be one, read it at the top.
- A `$state` that a parent should also see is passed down as a getter or bound with `bind:`, never
  copied into a child's own `$state` and then diverging.
- Shared state lives in a `.svelte.ts` module and is exported as functions or an object with
  getters. A bare exported `$state` variable is copied by value on import and stops updating.
- **Never put state in a module scope on the server.** SvelteKit shares the module across requests,
  so a module-level store is a cross-user data leak. Per-request state goes in `event.locals` or a
  context set during rendering.

## Sources

- https://svelte.dev/docs/svelte/$derived
- https://svelte.dev/docs/svelte/$effect
