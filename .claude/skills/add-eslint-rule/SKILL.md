---
name: add-eslint-rule
description: Steps to add a rule to @linteljs/eslint-plugin, from the rule directory to the golden metadata and the README table. Use when creating, renaming or registering a rule in packages/eslint-plugin.
---

# Add a rule to `@linteljs/eslint-plugin`

Read `packages/eslint-plugin/CLAUDE.md` first; its hard rules (safe fixes, the Node 14 and ESLint 5 floors, no
casts) apply to every step.

1. `src/rules/<kebab-id>/<camelCaseExport>.ts`, built with `createRule('<kebab-id>', { ... })` from
   `src/utils/ruleUtils.ts`. `language` and `recommended` are required. `fixShape` is only for a rule with a
   fixer: it says what the fixer may do to the token stream, and `fixerSafety.test.ts` holds it to that.
2. One line in the `rules` object in `src/rules/index.ts`.
3. `src/rules/<kebab-id>/<camelCaseExport>.test.ts`, through `__mocks__/ruleTesters.ts`. Break the rule and
   watch it go red before you trust it. A fixer defect also gets an entry in `__mocks__/fixerSamples.ts`.
4. `src/rules/<kebab-id>/README.md`. `meta.docs.url` points at the directory, and `pnpm build` flattens the
   file into `docs/rules/<id>.md` for the tarball.
5. An entry in `__mocks__/ruleMetadata.json`, the golden file of every rule's public surface (messages,
   schema, type, fixable, the `docs` fields).
6. A row in the package README's rule table, by hand: `meta.test.ts` checks only that the rows name every id
   once, in id order.
7. Run `pnpm lint`, `pnpm typecheck`, `pnpm test:coverage` and `pnpm build` from the root, then `--fix` on this
   repo if the rule fixes.

`src/meta.test.ts` and `src/rules/index.test.ts` fail on a missed step, a stray file or half a rename; the
presets derive from the registry, so do not edit them.
