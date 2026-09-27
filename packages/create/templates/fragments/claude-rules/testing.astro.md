---
paths:
  - "**/*.{test,spec}.{ts,tsx}"
  - "__mocks__/**/*"
  - "vitest.config.ts"
---

# Testing Rules

Use these rules when touching tests, mocks, or test setup.

## Infrastructure

- Vitest with `happy-dom`. Tests colocate as `X.test.ts` beside their source.
- Vitest globals are available without import. Do not mix bare and imported styles in one file.
- `vitest.config.ts` wraps its options in `getViteConfig` from `astro/config`. That is not a style
  choice: an Astro project has no `vite.config.ts`, its Vite options live in `astro.config.mjs`, and
  `getViteConfig` is what hands the resolved config to the test run. Aliases and plugins are therefore
  configured once, in the Astro config.
- `__mocks__/setupTests.ts` is the run's `setupFiles`, wired from `vitest.config.ts`. Global stubs are
  registered there and nowhere else.
- Global mocks belong beside the setup file under `__mocks__/`, registered from it, and exist
  for **determinism, not for gaps**.
  `happy-dom` supplies `matchMedia` and `requestAnimationFrame`, but its `matchMedia` answers every
  query `false` and its rAF runs on a real timer, so neither the reduced-motion branch nor anything
  frame-driven is reachable without taking control of them.

## What a test can reach

- **A `.astro` component is not unit-testable, and that is the point.** It runs during the build, has
  no client runtime, and there is no renderer to mount it with. Do not reach for one.
- Test what a template *computes*, not the template. A page that filters, sorts, formats or derives
  anything should hand that work to a function in `lib/`, which a test can call directly. If a
  template holds logic a test would want, the logic is in the wrong place.
- **Islands are testable, because they are that framework's components.** A React, Vue, Svelte or
  Solid island is tested with that framework's testing library, exactly as the framework's own
  `testing.*.md` describes.
- Content collections are data plus a schema. Test the schema by parsing a fixture through it, and
  test the code that reads a collection by passing it entries; do not reach for `getCollection` in a
  unit test, which needs the build's content layer.
- End-to-end coverage of a rendered page belongs to a browser runner over `astro build` output, not
  to Vitest. This standard ships no such runner; a project that needs one adds it deliberately.

## Coverage

- The gate is 100% on statements, branches, functions and lines, and it measures `src/**` scripts.
- `.astro` files are not measured: there is no instrumented runtime for them, so a threshold over
  them would be a number with nothing behind it. That is the reason logic belongs in `lib/`, where the
  gate can see it.
- A line that cannot be reached is deleted rather than ignored.
