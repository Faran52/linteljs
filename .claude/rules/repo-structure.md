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

- **`create` is one folder per responsibility, and membership is decided rather than chosen.** The
  standard leaves the ring count open; this package has seven folders, and a lint rule rather than
  taste decides which one a module belongs to.

  ```
  answers/    what the user chose. Reaches nothing.
  targets/    what linteljs knows: the records, the registry, the naming policy. Reaches nothing.
  emitters/   answers + targets into file text. Reaches nothing.
  terminal/   argv and the terminal.
  files/      reading and writing files.
  process/    spawning.
  pipeline/   the stage machine, sync, and the passes over generator output.
  ```

  The outer three are named for the world they reach into, which is readable off an import line:
  `node:fs` means `files/`, `node:child_process` means `process/`, `node:process` and
  `@clack/prompts` mean `terminal/`. Nothing outside those three may reach a world, so the inner
  three are provably pure and substitutable without touching a disk. `no-restricted-imports` in the
  root `eslint.config.ts` enforces it, with `pipeline/e2e/` exempt because the harness spawns real
  package managers on purpose. `process/` reaches `files/` for `isExecutableFile` and never the
  reverse: finding a binary on `PATH` is a filesystem fact only a spawner asks for.

  Inside `emitters/` the path is `<group>/<subject>/<subjectEmitter>.ts` and each half is derived
  from the one before it. The subject directory is named for the file it writes, exactly as a rule
  directory in `eslint-plugin` is named for its rule id; the entry is named for the directory, so
  `meta.test.ts` computes it rather than probing for it; and the group is named for the answer that
  decides whether its emitters write anything, with `always/` for the files no answer gates.

  Every entry answers `Artifact[]` and owns its own condition, so `buildArtifacts` is a `flatMap`
  over `registry.ts` with no branch in it, which `meta.test.ts` asserts by reading its source. The
  registry is keyed by `<group>/<subject>`, which is the directory path, and held against the
  directory listing in both directions, so a directory nobody registered fails and a key with no
  directory fails. The key carrying the group is what lets `removableTargets` ask the registry which
  emitters an answer can deselect rather than being told.

  A subject directory holds its entry, its suites, a `constants.ts` for a table it alone reads, and
  a `utils/` for its private helpers. Nothing else, which `meta.test.ts` enforces: a second module
  loose beside the entry is either a helper, and `utils/` is where the `*Utils` suffix is enforced on
  it, or it is read from outside, and then it is not that subject's to hold.

  A module that writes no file is not an emitter. `registry.ts` holds the two lists and the reading
  of each, `removableTargets.ts` the third derivation of them, and `index.ts` is the barrel the outer
  rings take the ring through; nothing else sits at that root. The artifact kind and the project
  shape are every ring's, so they are in `src/config/` with the engines and the run prefixes.

  A helper sits at the level of its readers and no higher. One subject reads it, it is
  `<group>/<subject>/utils/` and `meta.test.ts` holds it private there. Several subjects in one
  group read it, it is `<group>/utils/`. There is no `emitters/utils/` and no `emitters/config/`,
  not because a ring-wide helper is forbidden but because none turned out to be one: every
  candidate was either a group's, or a subject's own table, or a fact no ring owns. The dependency
  ranges are `always/package-json/constants.ts`, and `src/config/` holds what `emitters/`,
  `terminal/`, `pipeline/` and `process/` all read: the engines a project declares, and how each
  manager is asked to run a script.

  Beyond the standard's direction rule, the emitters stay free of `switch (target)`: the per-target
  record carries the difference, which is why `record.ts` is the file that grows.

- **`eslint-plugin` groups by rule id, not by ring.** `src/rules/<kebab-rule-id>/` holds the rule
  file named for its single export, its test, and `README.md`. The directory name is the id, so the
  id is spelled once. `src/rules/index.ts` is the only `index` in the package. `meta.test.ts` asserts
  the directory listing equals the registry and that no `index.ts` survives in a rule directory, so a
  half-renamed directory fails rather than sitting unnoticed.

- **`eslint-config` is one file per layer, not a ring.** `base.ts` exports `base`, `typescript.ts`
  exports `typescript`; `frameworks/` and `libraries/` group the layers that come in sets.
  `defineConfig.ts` composes them and owns the ordering, which is load-bearing. Flat rather than
  foldered because each layer file is a tsdown entry backing a published `exports` subpath, which
  `scripts/smoke.js` resolves against the packed tarball. `config/globs.ts` holds the extension
  tables six of them read: a table several modules share is not a helper, so it is not in `utils/`.

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
