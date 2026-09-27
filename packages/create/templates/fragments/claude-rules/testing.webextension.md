---
paths:
  - "**/*.{test,spec}.ts"
  - "__mocks__/**/*"
  - "vitest.config.ts"
---

# Testing Rules

Use these rules when touching tests, mocks, or test setup.

## Infrastructure

- Vitest with `happy-dom`. Tests colocate as `X.test.ts` beside their source.
- Vitest globals are available without import. Do not mix bare and imported styles in one file.
- `__mocks__/setupTests.ts` is the run's `setupFiles`, wired from `vitest.config.ts`. It ships
  empty, apart from `TEST_QUERY_OPTIONS` when the project answered `tanstack-query`: it is where a
  global stub is registered, and a project with no modules yet has nothing to stub.
- Global mocks belong beside the setup file under `__mocks__/`, registered from it, and exist
  for **determinism, not for gaps**.
  `happy-dom` supplies `matchMedia` and `requestAnimationFrame`, but its `matchMedia` answers every
  query `false` and its rAF runs on a real timer, so neither the reduced-motion branch nor anything
  frame-driven is reachable without taking control of them.
- There is no framework renderer. A component module builds DOM and is tested by appending its
  output to `document.body` and querying it back, the same assertions a rendering library would
  make, without the library.
- **`lib/` is testable without a browser.** Keep it free of `document` and `chrome`, and its tests
  need no environment at all.
- The extension APIs (`chrome.*` / `browser.*`) do not exist under Vitest. Mock the namespace
  globally in setup with the shape the code actually calls, and assert on the calls.
- A content script and a background worker never share a realm. Test the message contract between
  them as data (build the message, assert the handler's response), not by wiring them together.

