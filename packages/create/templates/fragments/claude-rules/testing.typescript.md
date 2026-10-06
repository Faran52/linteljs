---
paths:
  - "**/*.{test,spec}.ts"
  - "__mocks__/**/*"
  - "vitest.config.ts"
---

# Testing Rules

Use these rules when touching tests, mocks, or test setup.

## Infrastructure

- Vitest in the `node` environment. There is no DOM: `document`, `window` and `localStorage` do not
  exist, and a module that needs them belongs in an application, not here. Tests colocate as
  `X.test.ts` beside their source.
- Vitest globals are available without import. Do not mix bare and imported styles in one file.
- `__mocks__/setupTests.ts` is the run's `setupFiles`, wired from `vitest.config.ts`. It ships empty:
  it is where a global stub is registered, and a library with no modules yet has nothing to stub.
- Global mocks belong beside the setup file under `__mocks__/`, registered from it, and exist
  for **determinism, not for gaps**: a fixed clock with `vi.useFakeTimers()`, a seeded random source.
- Test through the public entry where you can. `src/index.ts` is what a consumer imports, so a
  suite that reaches past it pins a path nobody else can see.
- A function that takes input from a consumer is tested at its edges: the empty value, the boundary,
  the value one past it, and the input its type admits but its contract refuses.
