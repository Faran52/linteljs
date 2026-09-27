---
paths:
  - "**/*.{test,spec}.{ts,tsx}"
  - "__mocks__/**/*"
  - "vitest.config.ts"
---

# Testing Rules

Use these rules when touching tests, mocks, or test setup.

## Infrastructure

- Vitest with `happy-dom` and `@solidjs/testing-library`. Tests colocate as `X.test.tsx` beside
  their source.
- Vitest globals are available without import. Do not mix bare and imported styles in one file.
- `__mocks__/setupTests.ts` is the run's `setupFiles`, wired from `vitest.config.ts`. It ships the
  router mocks, so `navigateMock` is what a navigation assertion reads, and `TEST_QUERY_OPTIONS`
  when the project answered `tanstack-query`. Every other global stub is registered here.
- Global mocks belong beside the setup file under `__mocks__/`, registered from it, and exist
  for **determinism, not for gaps**.
  `happy-dom` supplies `matchMedia` and `requestAnimationFrame`, but its `matchMedia` answers every
  query `false` and its rAF runs on a real timer, so neither the reduced-motion branch nor anything
  frame-driven is reachable without taking control of them.
- **A primitive tested outside a reactive root leaks its effects and never disposes.** Test one
  with `createRoot((dispose) => { ... dispose(); })`, or `renderHook` from the testing library,
  which owns the root for you.
- Solid batches updates: after a setter, `await Promise.resolve()` (or use `fireEvent`, which
  flushes) before asserting on the DOM.
- **Never destructure props in a Solid component and never destructure a store.** Doing so reads
  the value once and severs the tracking, so the test passes on first render and never updates.
  This is a source bug the test should surface, not work around.

