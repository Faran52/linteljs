---
paths:
  - "**/*.ts"
---

# Type and Code Standards

`packages/create/templates/fragments/claude-rules/type-standards.md` is the standard: read it there, not in a
copy. Below is only where this workspace differs.

## Deviations

- **Components.** That section describes an application; these are three libraries. The rest applies unchanged.
- **`node:fs/promises` over sync `node:fs`** wherever the caller is or can be async. Sync stays only where the
  contract is synchronous: a resolver feeding `spawnSync`, ESLint layer construction, the spawned gate scripts.
- **`unknown`** only where the standard grants it: a narrowing guard's input (and the guard type a helper such as
  `parsedAs` takes), the `JSON.parse` result it narrows, a dynamic `import()` namespace. Where the narrowing can
  be a predicate, write it as one (`isFixReport` in `fixPass.ts`, handed to `parsedAs` in
  `packages/create/src/utils/objectUtils.ts`).
- **Casts.** Three survive in `eslint-plugin`, listed in that package's `CLAUDE.md`. Add none.
- **Node 26 built-ins.** Every package runs on Node 26 and the shipped code is transpiled, so use its methods
  (`RegExp.escape`, `Error.isError`, `Iterator` helpers, `Set` methods, `Object.groupBy`) over a loop or helper
  that redoes them.
- **`es-toolkit` wherever it simplifies**: every package depends on it. A Node 26 built-in comes first; its strict
  entry over a hand-rolled helper; `es-toolkit/compat` stays banned (below).
- **Fix what you touch.** A change fixes the papered types, folder-shape breaks and dead code it finds in the
  files it touches; no repo-wide sweep unasked.
- **`es-toolkit/compat` is banned** everywhere, enforced by the `base` layer. Use the strict entry or the
  standard library.

## The mechanical floor

`scripts/checkBannedPatterns.ts` runs the shipped `packages/create/templates/project/scripts/checkBannedPatterns.ts`
over this workspace less its `SKIPPED` list, from the same three places a generated project runs it: lint-staged,
the `bannedPatternGuardHook.ts` hook, and `lint:types` in `check`. It is a floor; the rule file is the standard.

### Exempt files

Each implements somebody else's interface, where `unknown` is the upstream contract rather than an escape hatch.

| file | reason |
| --- | --- |
| `eslint-config/src/typegen.d.ts` | Generated from the rule schemas by `eslint-typegen`; a schema that allows any value becomes `unknown`, and the gate rewrites the file on every run. |
| `eslint-config/src/utils/presetUtils.ts` | `Extract<PluginConfig, { rules?: unknown }>` is a type-level wildcard; no value is typed `unknown`. |
| `eslint-plugin/src/meta.test.ts` | `readJson` answers `Record<string, unknown>` and `ruleIdsIn` narrows the `any` from `ESLint.calculateConfigForFile`. Both are granted in prose; no regex can confirm them. |
| `create/templates/project/src/typings/` | Shipped template text, written against the relaxed floor on purpose. |

The shipped checker's own `BASE_SKIPPED` drops every file under a `scripts/`, which covers
`create/templates/project/scripts/utils/bannedPatternsUtils.test.ts` and the banned directives it holds as
fixtures. Both floors ban every `v8`, `c8` and `istanbul` ignore comment, here and in a generated project.

A whole-file skip hides every future violation in that file, so do not add one where a predicate would do, and
re-read the list when a listed file grows.
