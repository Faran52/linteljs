---
paths:
  - "**/*.{test,spec}.ts"
  - "__mocks__/**/*"
  - "vitest.config.ts"
---

# Testing Rules

Use these rules when touching tests, mocks, or test setup.

## Infrastructure

- Vitest with `happy-dom`, `@analogjs/vite-plugin-angular` for the compiler, and Angular's own
  `TestBed` from `@angular/core/testing`. Tests colocate as `X.spec.ts` beside their source.
- Vitest globals are available without import. Do not mix bare and imported styles in one file.
- `__mocks__/setupTests.ts` is the run's `setupFiles`, wired from `vitest.config.ts`. It installs
  the Angular testing platform once, before the first spec, and is where a global stub is
  registered.
- Global mocks belong beside the setup file under `__mocks__/`, registered from it, and exist
  for **determinism, not for gaps**.
  `happy-dom` supplies `matchMedia` and `requestAnimationFrame`, but its `matchMedia` answers every
  query `false` and its rAF runs on a real timer, so neither the reduced-motion branch nor anything
  frame-driven is reachable without taking control of them.
- **Configure TestBed with the real component and real providers.** Replace only what crosses a
  boundary: HTTP through `provideHttpClientTesting`, the router through `provideRouter([])`. A
  service replaced by a stub is a service that is no longer under test.
- **Change detection is explicit.** Call `fixture.detectChanges()` after every state change before
  asserting on the DOM. A signal set without a following detect asserts the previous render.
- An `async` pipe or an effect settles on the microtask queue: `await fixture.whenStable()` before
  asserting, rather than adding a timeout.
- A service with no template is tested by calling it directly through `TestBed.inject`, not through
  a host component.

