---
paths:
  - "**/*.{test,spec}.ts"
  - "**/__mocks__/**/*"
  - "**/vitest.config.ts"
---

# Testing Rules

`packages/create/templates/fragments/claude-rules/testing.standard.md` is the standard: read it there, not in
a copy. The per-target `testing.*.md` heads do not apply, since nothing here renders. Below is only where this
workspace differs.

## Deviations

- **Comments are minimal.** A short why, or none, where the reason is not on the screen. Never narrate.
- **No DOM, no jest-dom, no RTL.** A test asserts what a rule reports, what a fixer emits, and what an
  emitter writes.
- **A suite builds its subject inside `it` or `beforeEach`**, never at file top level, in a `describe` body or
  in a `beforeAll`. Stryker counts code that runs outside a test as static and runs every test for each such
  mutant. An `it.each` table holds data, not a call into `src`; a `src` module-level constant is data, not a call.
- **Coverage is 100** on statements, branches, functions and lines in all three packages, set in the root
  `vitest.config.ts`. Never lower a threshold. A branch a type demands and reality cannot reach is dead code:
  delete it rather than cover it.

## Infrastructure

- Vitest, one project per package, globals on. Tests sit beside their source as `src/**/X.test.ts`; shared
  helpers and fixtures live in the package's `__mocks__/`. No `test/` directory.
- Rules are tested through `RuleTester` (`packages/eslint-plugin/__mocks__/ruleTesters.ts`). Layers are tested
  by linting real text through a real `ESLint` (`packages/eslint-config/__mocks__/lintText.ts`), never by
  reading the config object back.
- `packages/eslint-plugin/__mocks__/fixerSamples.ts` runs against every rule. A fixer defect goes there as well
  as in the rule's own suite.
- The end-to-end suite has its own rule, `e2e.md`.
