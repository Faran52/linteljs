---
paths:
  - "**/*.{test,spec}.ts"
  - "__mocks__/**/*"
  - "vitest.config.ts"
---

# Testing Rules

Use these rules when touching tests, mocks, or test setup.

## Infrastructure

- Vitest with `happy-dom` and `@vue/test-utils`. Tests colocate as `X.test.ts` beside the `.vue`
  file they cover.
- Vitest globals are available without import. Do not mix bare and imported styles in one file.
- `__mocks__/setupTests.ts` is the run's `setupFiles`, wired from `vitest.config.ts`. It ships
  empty, apart from `TEST_QUERY_OPTIONS` when the project answered `tanstack-query`: it is where a
  global stub is registered, and a project with no modules yet has nothing to stub.
- Global mocks belong beside the setup file under `__mocks__/`, registered from it, and exist
  for **determinism, not for gaps**.
  `happy-dom` supplies `matchMedia` and `requestAnimationFrame`, but its `matchMedia` answers every
  query `false` and its rAF runs on a real timer, so neither the reduced-motion branch nor anything
  frame-driven is reachable without taking control of them.
- **Reactivity is asynchronous.** A change to a ref or a prop does not reach the DOM until the next
  tick. Use `await nextTick()`, or `await wrapper.setProps(...)`, which awaits for you, before every
  assertion that follows a state change. A test that reads the DOM synchronously after a mutation
  is asserting the previous render.
- A component using a Pinia store is mounted with a **real** store from `createTestingPinia({
  stubActions: false })` seeded with real state. Stubbing the store tests the stub.
- Mount with the plugins the tree actually reads, and no others. A component that reads no store
  takes no Pinia, which also keeps its test working in a project that declined the store answer.
- Mount, do not shallow-mount. `shallowMount` stubs the children, which is where the behaviour
  usually is.

