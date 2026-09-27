---
paths:
  - "**/*.{test,spec}.{ts,tsx}"
  - "__mocks__/**/*"
  - "vitest.config.ts"
---

# Testing Rules

Use these rules when touching tests, mocks, or test setup.

## Infrastructure

- Vitest with `happy-dom` and React Testing Library. Tests colocate as `X.test.tsx` beside their
  source.
- Vitest globals are available without import. Do not mix bare and imported styles in one file.
- `__mocks__/setupTests.ts` is the run's `setupFiles`, wired from `vitest.config.ts`. It ships the
  router mocks, so `navigateMock` is what a navigation assertion reads, and `TEST_QUERY_OPTIONS`
  when the project answered `tanstack-query`. Every other global stub is registered here.
- Global mocks belong beside the setup file under `__mocks__/`, registered from it, and exist
  for **determinism, not for gaps**.
  `happy-dom` supplies `matchMedia` and `requestAnimationFrame`, but its `matchMedia` answers every
  query `false` and its rAF runs on a real timer, so neither the reduced-motion branch nor anything
  frame-driven is reachable without taking control of them.
- Never inline a mock that belongs in setup.
- A component reading from a provider is rendered inside the real provider, seeded with real data.
  Stubbing the hook the provider exposes tests the stub.

