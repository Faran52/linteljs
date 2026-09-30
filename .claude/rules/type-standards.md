---
paths:
  - "**/*.ts"
---

# Type and Code Standards

`packages/create/templates/fragments/claude-rules/type-standards.md` is the standard: read it there, not in a
copy. Below is only where this workspace differs.

## Deviations

- **Components.** That section describes an application; these are three libraries. The rest applies unchanged.
- **`Partial<T>`** is fine where it is the real shape (`optionsOf<T>` before schema defaults apply, a rule record
  ESLint types that way), never to paper over a type you have not built.
- **`node:fs/promises` over sync `node:fs`** wherever the caller is or can be async. Sync stays only where the
  contract is synchronous: a resolver feeding `spawnSync`, ESLint layer construction, the spawned gate scripts.
- **`unknown`** only where the standard grants it: a narrowing guard's input (and the guard type a helper such as
  `parsedAs` takes), the `JSON.parse` result it narrows, a dynamic `import()` namespace. Where the narrowing can
  be a predicate, write it as one (`isFixReport` in `fixPass.ts`, handed to `parsedAs` in
  `packages/create/src/utils/objectUtils.ts`).
- **Casts.** Three survive in `eslint-plugin`, listed in that package's `CLAUDE.md`. Add none.
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
| `eslint-config/src/utils/presetUtils.ts` | `Extract<PluginConfig, { rules?: unknown }>` is a type-level wildcard; no value is typed `unknown`. |
| `eslint-plugin/src/meta.test.ts` | `readJson` answers `Record<string, unknown>` and `ruleIdsIn` narrows the `any` from `ESLint.calculateConfigForFile`. Both are granted in prose; no regex can confirm them. |
| `create/templates/project/src/typings/` | Shipped template text, written against the relaxed floor on purpose. |

`create/templates/project/scripts/checkBannedPatterns.test.ts` holds banned directives as fixtures and is skipped
by the shipped checker's own `BASE_SKIPPED`. A whole-file skip hides every future violation in that file, so do
not add one where a predicate would do, and re-read the list when a listed file grows.
