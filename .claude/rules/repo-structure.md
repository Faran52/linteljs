---
paths:
  - "packages/**/*.ts"
  - "packages/**/*.js"
---

# Repository Structure

`packages/create/templates/fragments/claude-rules/repo-structure.library.md` is the standard. It is the file this
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
  standard leaves the ring count open; this package has nine folders, and a lint rule rather than
  taste decides which one a module belongs to.

  ```
  answers/    what the user chose. Reaches targets/ for the slot check.
  targets/    what linteljs knows: the records, the registry, the naming policy. Reaches nothing.
  config/     data and only data: the types, constants and tables no ring owns.
  utils/      what every ring hand-rolled otherwise. Reaches nothing.
  emitters/   answers + targets into file text. Reaches nothing.
  terminal/   argv and the terminal.
  disk/       reading and writing files.
  spawns/     running a binary and waiting.
  pipeline/   the stage machine, sync, and the passes over generator output.
  ```

  The outer three are named for the world they reach into, which is readable off an import line:
  `node:fs` means `disk/`, `node:child_process` means `spawns/`, `node:process` and
  `@inquirer/prompts` mean `terminal/`. Nothing outside those three may reach a world, so the inner
  ones are provably pure and substitutable without touching a disk. `no-restricted-imports` in the
  root `eslint.config.ts` enforces it, with `pipeline/e2e/` exempt because the harness spawns real
  package managers on purpose. `spawns/` reaches `disk/` for `isExecutableFile` and never the
  reverse: finding a binary on `PATH` is a filesystem fact only a spawner asks for.
  `packages/create/src/rings.ts` is the one list of the rings and their direction; the root
  `eslint.config.ts` builds its zones from it and `src/meta.test.ts` holds the tree to it.

- **Every ring has the same shape, and one suite holds it.** `src/meta.test.ts` carries a row per ring
  and states the rule once, so a tenth ring is one entry; a ring with a registry names that registry
  in its row and the suite holds the two against each other, in both directions.

  A ring is named for what its members are, or for the world it reaches where the world is the
  membership test. A subject is a kebab-case directory holding one entry named for it in camelCase,
  its suite, a `constants.ts` for a table it alone reads, and a `utils/` for helpers only it reads.

  The entry takes the singular of whatever names the kind. Where the ring has one kind that is the
  ring: `targets/react/reactTarget.ts`, `spawns/git/gitSpawn.ts`. Where a group changes the kind it
  is the group: `disk/read/project-shape/projectShapeReader.ts`,
  `pipeline/passes/fix/fixPass.ts`. Where a ring genuinely has no one kind there is nothing to
  suffix, and the entry is named for its directory alone, which is the `eslint-plugin/src/rules/`
  spelling: `terminal/cli/cli.ts` and `terminal/prompts/prompts.ts`.

  This is derived rather than invented, and two names in the tree predate the rule and agree with
  it: `fixPass.ts` and `localBinary.ts` were already spelled that way.

  Every ring carries an `index.ts` and the rings outside it take that rather than a file inside.
  The same suite refuses an export nothing outside the ring takes, which caught four leftovers the
  hour it was written, `TARGETS` among them: it sat in a barrel while its one reader went in by path.

  A helper sits at the level of its readers and no higher, in every ring. One subject reads it, it
  is `<subject>/utils/` and the suite holds it private there. Several subjects read it, it is the
  group's or the ring's `utils/`: `pipeline/utils/sourceUtils.ts` is there because both the rewrite
  and the repair pass walk the same tree, and `terminal/utils/nameUtils.ts` because `cli/` and
  `prompts/` both validate a project name.

  Inside `emitters/` the group is the answer that decides whether its emitters write anything, with
  `always/` for the files no answer gates, and the subject directory is named for the file it
  writes. The ring is `emitters/`, so the entry is `<subject>Emitter.ts`, which is the general rule
  above at its two-group depth.

  Every entry answers `Artifact[]` and owns its own condition, so `buildArtifacts` is a `flatMap`
  over `registry.ts` with no branch in it, which `meta.test.ts` asserts by reading its source. The
  registry is keyed by `<group>/<subject>`, which is the directory path, and held against the
  directory listing in both directions, so a directory nobody registered fails and a key with no
  directory fails.

  A module that writes no file is not an emitter. `registry.ts` holds the two lists and the reading
  of each, and `index.ts` is the barrel the outer rings take the ring through; nothing else sits at
  that root. `buildArtifacts` appends one artifact of its own, the record of what it owns that
  `plugins/linteljs/managed.json` carries, because that is a fact about the list rather than a
  member of it and an emitter would have to leave itself out of its own input.

  `emitters/utils/` is what every subject in that ring reads: `artifactUtils.ts` builds the three
  content shapes, `managedUtils.ts` derives the record `registry.ts` appends, and `shapeUtils.ts`
  picks a project's own spelling of a file. The dependency ranges are
  `always/package-json/constants.ts`, a table one subject owns.

  `src/config/` is data, and only data, in two files: `types.ts` is the vocabulary every ring
  shares, being the artifact and its stages, the emitter signature and the shape of a project on
  disk; `constants.ts` is every value, being the stage order, the empty project, the managed path,
  the engines a project declares and how each manager is asked to run a script. A function goes to a `utils/` at the level of its readers rather than sitting
  beside the type it builds, so nothing in `src/config/` carries a suite: a table asserted equal to
  itself proves nothing, and what is worth checking about one is a fact about the code that reads
  it.

  `src/utils/` is the innermost ring and holds only what more than one ring reads. `jsonUtils.ts`'s
  `isJsonObject` is five guards in four rings that had each written it out; each still declares its
  own narrowed shape, since a `package.json` and a manifest are not the same thing, and what they
  share is the question of whether a parsed value is an object at all. `objectUtils.ts`'s `valuesOf`
  is the same story: a record's own `values` needed it first, and it carries nothing record-shaped,
  so every ring that reads a `Record`'s keys as a typed union reaches for it now instead of writing
  its own `Object.keys(...) as V[]`.

  Beyond the standard's direction rule, the emitters stay free of `switch (target)`: the per-target
  record carries the difference, which is why `targets/<id>/<id>Target.ts` is the file that grows.

  Inside `answers/` an answer is a subject like anywhere else: `<group>/<kebab>/<key>Answer.ts`, with
  its own suite beside it. A group is named for the emitter group it gates rather than the other way
  round: `browsers`, `router` and `store` sit under `target/` because a target's own slot decides each
  one, and `recorded/` holds the six answers no prompt ever asks, `resolveConditions`, `aliases`,
  `ignores`, and the `packageManager`, `packageManagerVersion` and `nodeVersion` the run records off
  the machine that started it.

  Every record is one of seven kinds, `types.ts`'s own union: `choice`, `optionalChoice`, `multi`,
  `optionalMulti`, `list`, `map` and `text`. Legality lives on the record rather than in a reader:
  `slot` says whether a target asks the question at all, `only` on a value says whether this target
  offers it, and `askedWhen` says whether the answers so far still ask it, which is what lets
  `plugins` skip itself when `agents` comes back empty. Display text lives there too, in `values`,
  since a label is data the prompt and the schema both read rather than a terminal concern.

  `registry.ts` holds `ANSWERS`, one line per record in ask order, and only what derives from the
  list itself: `AnswerKey`, `Answers`, `LinteljsConfig` and `DEFAULT_ANSWERS`, the same shape
  `538fa34` gave `targets/registry.ts`. `constants.ts` holds the schema URLs and the config path, and
  `index.ts` is the barrel the outer rings take the ring through. `meta.test.ts` holds the files to
  the registry in both directions: every key has exactly one file across the groups, that file
  exports a const named for itself, and the record's own `key` field names the same file, so a
  renamed file or a typo'd key fails rather than silently shadowing another answer's flag.

  `utils/` is where the ring's shared readers live: `readUtils.ts` turns a parsed JSON value into a
  typed one, one function per kind, and carries the v1-to-v2 migration; `recordUtils.ts` is
  `onlyFor`, `registry.ts`'s one reader that needs a record's own `values` rather than a parsed one;
  `configUtils.ts` is `parseLinteljsConfig` and everything under it, kept out of `registry.ts` so the
  list and the parsing of a whole file stay two files rather than one that does both;
  `schemaUtils.ts` generates the published JSON schema from the records themselves, so the schema
  cannot drift from what a config actually accepts; `answerUtils.ts` is the small predicates more
  than one emitter reads, `hasLibrary`, `hasSurface` and the rest.

  `answers/utils/configUtils.ts` value-imports `targetFor` from `targets/` for the `slot` and `only`
  checks its parser needs, which is the one edge `create-rings` allows: both are inner rings, and the
  rule only stops an inner ring reaching an outer one.

- **`eslint-plugin` groups by rule id, not by ring.** `src/rules/<kebab-rule-id>/` holds the rule
  file named for its single export, its test, and `README.md`. The directory name is the id, so the
  id is spelled once. `src/rules/index.ts` is the only `index` in the package. `meta.test.ts` asserts
  the directory listing equals the registry and that no `index.ts` survives in a rule directory, so a
  half-renamed directory fails rather than sitting unnoticed.

- **`eslint-config` is one file per layer, not a ring.** `base.ts` exports `base`, `typescript.ts`
  exports `typescript`; `frameworks/` and `libraries/` group the layers that come in sets.
  `defineConfig.ts` composes them and owns the ordering, which is load-bearing. Flat rather than
  foldered because each layer file is a tsdown entry backing a published `exports` subpath, which
  `scripts/smoke.ts` resolves against the packed tarball. `config/globs.ts` holds the extension
  tables six of them read: a table several modules share is not a helper, so it is not in `utils/`.

- **`create/templates/` sits outside `src/`** and is laid out as the project it lands in:
  `project/` is the tree a generated project receives, `starter-source/` the per-target starters,
  `fragments/` the pieces joined into one file, and `schemas/` the published mirror of the
  repository's own. The standard puts only `typings/` outside. The shipped templates cannot live under `src/`: twelve are TypeScript, one
  imports `@angular/*` this workspace does not install, and eight are named `*.test.ts`, so tsconfig,
  vitest, coverage and eslint would each need telling that source is not source.

- **Coverage is gated at 100% on all four metrics for all three packages.** A line that cannot be
  reached is deleted rather than ignored; the one sanctioned exception is a `/* v8 ignore */` on a
  defensive branch whose unreachability is argued in the comment beside it, audited by the root
  `audit:ignores` across every package.

## The colocation exceptions, named

Both are the standard's own stated exceptions; these are the files that take them.

- `__mocks__/` at package root, aliased `@mocks/*`. `eslint-config/__mocks__/fixtures/` holds the
  deliberately defective input its layer tests lint.
- `packages/create/templates/project/scripts/checkBannedPatterns.test.ts` and `typecheckStaged.test.ts` sit
  beside the scripts they spawn. `package.json` excludes them from the packed tarball.

Three files in `eslint-plugin` are named for what they cover rather than for one source file, which
the standard permits because what they cover is the package: `meta.test.ts` holds the whole published
surface against `__mocks__/ruleMetadata.json`, `ruleModules.test.ts` checks the registry against the
directory listing, and `fixerSafety.test.ts` runs the shared corpus through every rule at once.
