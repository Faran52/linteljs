---
paths:
  - "**/*.ts"
---

# Type and Code Standards

`packages/create/templates/fragments/claude-rules/type-standards.md` is the standard. It is the file this
workspace publishes, so it is the file this workspace is held to: read it, not a copy of it. A
second copy here is the drift `DESIGN.md` exists to argue against.

What follows is only where this repository differs, and why.

## Deviations

- **Components.** The section on components describes an application. There are none here; these
  are three libraries. Everything else in that file applies unchanged.
- **`Partial<T>`.** A valid utility type, not gated by the mechanical floor. Use it where it is
  the real shape (`optionsOf<T>` returning options that are genuinely partial until schema
  defaults apply, a rule record ESLint itself types that way), not to paper over a type you have
  not built.
- **`node:fs/promises` over sync `node:fs`.** Preferred wherever the calling context is or can be
  async. Sync calls stay only where the contract is synchronous: a resolver feeding `spawnSync`,
  ESLint layer construction, and the small spawned gate scripts.
- **`unknown`.** Permitted where the standard permits it: the input of a narrowing type guard, the
  `JSON.parse` result that guard exists to narrow, and a dynamic `import()` namespace, which is the
  same boundary. `scripts/checkBannedPatterns.ts` recognises those three spellings and nothing else,
  which is narrower than the prose grant on purpose: see below for what it cannot enforce.
- **Casts.** Five survive in `eslint-plugin`, listed in that package's `CLAUDE.md`.
  Each narrows an ESLint node to the shape the traversal actually hands over. No new ones, and
  `utils/compatUtils.ts` deliberately needed none: it describes both ESLint shapes as one interface
  with every member optional, which a real context satisfies structurally.

- **`es-toolkit/compat` is banned**, in every package, enforced by `@linteljs/workspace/no-compat` in
  the root config. The strict entry or the standard library. `/compat` exists to ease a lodash
  migration this workspace never had, and its looser signatures are what a call reaches for when the
  honest answer is that es-toolkit does not cover the case. `DESIGN.md` carries the measurement.

## The mechanical floor

`scripts/checkBannedPatterns.ts` is this repository's own copy of the floor it publishes, and it
now runs here the same two ways it runs in a generated project: `lint-staged` on commit, and the
`PostToolUse(Edit|Write)` hook at write time. `packages/create/templates/project/scripts/` holds
the shipped original; the root copy governs this workspace, and its `PROJECT_SKIPPED` list is where
this repository's exemptions live.

It is a floor, not the standard. The rule file is the standard.

### Exempt files, and why

Every entry is a library implementing somebody else's interface, which is the case the standard
was not written for. In an application `unknown` is almost always the escape hatch; in a plugin
it is the upstream contract.

| file | reason |
| --- | --- |
| `eslint-config/src/utils/presetUtils.ts` | `Extract<PluginConfig, { rules?: unknown }>` is a type-level wildcard picking the flat arm out of a union. No value is typed `unknown`, so there is nothing to narrow. |
| `eslint-plugin/src/meta.test.ts` | `readJson` answers `Record<string, unknown>`, which is what a JSON file read back for comparison is, and `ruleIdsIn` narrows the `any` that `ESLint.calculateConfigForFile` returns. Both are the prose grant, and neither is a shape a regex can confirm. |
| `create/templates/project/scripts/checkBannedPatterns.test.ts` | Holds banned directives as fixture strings. Directive patterns are `raw: true` by design, so a fixture cannot be told from a violation. Covered by `BASE_SKIPPED`, not listed. |
| `create/templates/project/src/typings/`, `create/templates/fragments/test-setup/`, `create/templates/starter-source/` | Shipped template text, the same tree `eslint.config.ts` ignores. `typings/` is written against the relaxed floor on purpose; the React Native half is the tracked debt below. |

A whole-file skip is coarser than these cases deserve, and it is the only granularity the checker
offers. Adding a file here hides every future violation in it, so the list is worth re-reading
whenever one of these files grows.

### What the checker can and cannot enforce

The standard grants `unknown` at any boundary with no upstream type and names two spellings: a
narrowing guard's parameter, and the `JSON.parse` result it narrows. A dynamic `import()` namespace is
the same boundary under a third spelling, so `DYNAMIC_IMPORT` now grants it too, in both copies of the
checker and with a case in the shipped suite. That closed the one gap that really was a missing
pattern, and it took `ruleModules.test.ts` off the list above once its own `unknown` pipeline was
folded into a guard.

The rest is not a missing pattern and should not be written as one. What makes a value at such a
boundary legal is that it is *narrowed before use*, and no regex can see that. A helper that takes
`unknown` and answers `string[]` is either a careful extraction or an escape hatch, and only reading
it tells you which. Two conclusions follow:

- Where the narrowing can be spelled as a predicate, spell it that way. `next.ts` carried
  `versionOf(parsed: unknown): string | undefined` and now carries `isVersioned(parsed): parsed is
  { version: string }` over an annotated parse, which is both granted shapes and no exemption.
- Where it genuinely cannot, the file belongs in `PROJECT_SKIPPED` with the reason beside it.
  `meta.test.ts` is that case, and widening a pattern to cover it would grant the escape hatch
  everywhere to spare one file a line.

An earlier version of this section called all three shapes checker bugs. One was.

### The React Native starter assets, and why they are exempted rather than rewritten

`templates/fragments/test-setup/setupTests.reactNative.ts` and twelve files under `templates/starter-source/react-native/` carry
`: unknown` on a `ProxyHandler.get`, `Record<string, unknown>` on a `Platform.select` stand-in, and
casts the standard bans outright. They are not sloppy: `ReactTestInstance.props` is an index
signature of `any` and `Reflect.get` on a module namespace answers `any`, so those annotations are
what keeps `no-unsafe-assignment` and `no-unsafe-return` quiet. Every way round trades one gate for
the other, and the end-to-end suite already proves the current shape lints clean.

So the assets stand and the exemption is written where it belongs: `@linteljs/create` seeds
`PROJECT_SKIPPED` in the checker it copies, from `exemptsStarterTests` on the React Native record.
The file is `preserve: true`, so a project owns the list and an entry goes the day it replaces the
starter behind it. Without that, a project answering `typeSafety: strict` was blocked at its first
commit by twelve files it did not write.

`emitters/registry.test.ts` runs the emitted checker over the emitted starter code for every target,
which is the only thing anywhere that does: `pnpm check` never invokes the checker, and the
end-to-end suite never commits.
