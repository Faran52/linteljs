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
  only what an answer brings: i18n installed on every mount when the project has locales,
  `TEST_QUERY_OPTIONS` when it answered `tanstack-query`, and the MSW server when it answered
  `msw`. It is where a global stub is registered.
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
- **Vitest runs outside Nuxt's build, so nothing auto-imported exists.** Import what a component
  uses: `useRoute` comes from `vue-router` rather than from Nuxt, and a suite that relies on an
  auto-import passes under `nuxt dev` and fails here. Nuxt's own components have no module to
  import from, so `NuxtLink` and `NuxtPage` are stubbed in `global.stubs` instead.
- A page file renders a view and nothing else, so its suite asserts that the view is what mounted.
  What the page does is tested where the view is tested.

