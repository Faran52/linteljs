---
paths:
  - "**/*.{test,spec}.ts"
  - "__mocks__/**/*"
  - "vitest.config.ts"
---

# Testing Rules

Use these rules when touching tests, mocks, or test setup.

## Infrastructure

- Vitest with `happy-dom` and `@testing-library/svelte`. Tests colocate as `X.test.ts` beside the
  `.svelte` file they cover.
- Vitest globals are available without import. Do not mix bare and imported styles in one file.
- `__mocks__/setupTests.ts` is the run's `setupFiles`, wired from `vitest.config.ts`. It ships
  empty, apart from `TEST_QUERY_OPTIONS` when the project answered `tanstack-query`: it is where a
  global stub is registered, and a project with no modules yet has nothing to stub.
- Global mocks belong beside the setup file under `__mocks__/`, registered from it, and exist
  for **determinism, not for gaps**.
  `happy-dom` supplies `matchMedia` and `requestAnimationFrame`, but its `matchMedia` answers every
  query `false` and its rAF runs on a real timer, so neither the reduced-motion branch nor anything
  frame-driven is reachable without taking control of them.
- **Effects are batched to a microtask.** After changing state, `await tick()` before asserting on
  the DOM. Testing Library's `fireEvent` returns a promise that already does this, so await it.
- `$app/stores`, `$app/navigation` and `$env/*` are SvelteKit-provided virtual modules with no
  implementation under Vitest. Mock them globally in setup, never per test.
- A component driven by a store is rendered with a **real** store, set to the state under test.
  Stubbing the store tests the stub.
- A `+page.server.ts` `load` is a plain function. Test it directly, not through a rendered page.

