---
paths:
  - "packages/**/*.ts"
  - "packages/**/*.js"
---

# Repository Structure

`packages/create/assets/claude-rules/repo-structure.library.md` is the standard. It is the file this
workspace publishes, so it is the file this workspace is held to: read it, not a copy of it. A second
copy here is the drift `DESIGN.md` exists to argue against.

The nine per-target rule files describe applications and do not apply. This is not one of the nine
targets, and `pages/` has nothing to hold in a package of ESLint rules.

What follows is only where this repository differs, and why.

## Three packages, one direction

```
eslint-plugin  <-  eslint-config  <-  create
   the rules        which layers        writes a config
                    enable them         naming the layers
```

`create` never imports `eslint-config` at runtime. It writes the package name into text and never
resolves it, which is why it can be built and tested before that package publishes. The two type
aliases it duplicates instead of importing carry a comment saying so.

## Deviations

- **`*Utils` on every file in a `utils/` directory.** `ruleUtils.ts` and `checkFileUtils.ts` rather
  than `ruleApi.ts` and `checkFile.ts`. The `naming` map in the root `eslint.config.ts` maps
  `**/utils/*.ts` to the `*Utils` glob, so a helper under any other name fails `pnpm lint`. This is
  the workspace's own convention and `@linteljs/create` deliberately does not ship it; `DESIGN.md`
  carries that as a non-goal, which is why it is absent from the published standard.

- **`create`'s rings are fixed at three and named.** The standard leaves the count open.

  ```
  model/      what the user chose. No fs, no process, no child_process.
  artifacts/  answers to file text. Pure.
  run/        everything touching disk, argv or a terminal.
  ```

  `model/` is `answers/`, `config/`, `naming/`, `stages/` and `targets/`; `targets/` is one file per
  target plus `record.ts` for the shape they share. `artifacts/` is one directory per thing lintel
  puts on disk, and `package-json/versions.ts` is the one data table, so a version bump is one file.
  `run/` is one directory per job, including the split pair `rewrite/` (makes scaffolded source
  compile, ungated) and `repair/` (the `fresh`-gated starter repairs).

  Beyond the standard's direction rule, the emitters stay free of `switch (target)`: the per-target
  record carries the difference, which is why `record.ts` is the file that grows.

- **`eslint-plugin` groups by rule id, not by ring.** `src/rules/<kebab-rule-id>/` holds the rule
  file named for its single export, its test, and `README.md`. The directory name is the id, so the
  id is spelled once. `src/rules/index.ts` is the only `index` in the package. `meta.test.ts` asserts
  the directory listing equals the registry and that no `index.ts` survives in a rule directory, so a
  half-renamed directory fails rather than sitting unnoticed.

- **`eslint-config` is one file per layer, not a ring.** `base.ts` exports `base`, `typescript.ts`
  exports `typescript`; `frameworks/` and `libraries/` group the layers that come in sets.
  `defineConfig.ts` composes them and owns the ordering, which is load-bearing.

- **`create/assets/` sits outside `src/`** and mirrors the artifact folder names. The standard puts
  only `typings/` outside. The shipped templates cannot live under `src/`: twelve are TypeScript, one
  imports `@angular/*` this workspace does not install, and eight are named `*.test.ts`, so tsconfig,
  vitest, coverage and eslint would each need telling that source is not source.

- **Coverage is gated at 100% on all four metrics for all three packages.** A line that cannot be
  reached is deleted rather than ignored; the one sanctioned exception is a `/* v8 ignore */` on a
  defensive branch whose unreachability is argued in the comment beside it, audited by the plugin's
  `audit:ignores`.

## The colocation exceptions, named

Both are the standard's own stated exceptions; these are the files that take them.

- `__mocks__/` at package root, aliased `@mocks/*`. `eslint-config/__mocks__/fixtures/` holds the
  deliberately defective input its layer tests lint.
- `packages/create/assets/scripts/checkBannedPatterns.test.ts` and `typecheckStaged.test.ts` sit
  beside the scripts they spawn. `package.json` excludes them from the packed tarball.

Three files in `eslint-plugin` are named for what they cover rather than for one source file, which
the standard permits because what they cover is the package: `meta.test.ts` holds the whole published
surface against `__mocks__/ruleMetadata.json`, `ruleModules.test.ts` checks the registry against the
directory listing, and `fixerSafety.test.ts` runs the shared corpus through every rule at once.
