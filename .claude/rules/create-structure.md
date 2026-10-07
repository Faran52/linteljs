---
paths:
  - "packages/create/**/*"
---

# `@linteljs/create` structure

`packages/create/src/rings.ts` is the one list of the nine rings and their direction. The root
`eslint.config.ts` builds its zones from it (`@linteljs/workspace/create-rings`, `-rings-tests`, `-worlds`,
`-config-data`) and `src/meta.test.ts` holds the tree to it, so a misplaced module fails `pnpm lint` or
`pnpm test`.

## The rings

```
answers/    what the user chose. Reads targets/ for the slot check.
targets/    what linteljs knows: one record builder per target, the registry, the naming policy. Reads utils/, config/.
utils/      what more than one ring reads. Reads config/'s types.
config/     data only: the types, constants and tables no ring owns. Reads nothing.
emitters/   answers + targets into file text. Reaches inward only.
terminal/   argv and the terminal.
disk/       reading and writing files.
spawns/     running a binary and waiting. Reads disk/ for isExecutableFile, never the reverse.
pipeline/   the stage machine, sync, and the passes over written source.
```

- **Membership is the world a module reaches**, readable off its imports: `node:fs` means `disk/`,
  `node:child_process` means `spawns/`, `node:process` and `@inquirer/*` mean `terminal/`. Nothing else may
  reach a world, so the inner rings stay pure. Caught by `no-restricted-imports`
  (`@linteljs/workspace/create-worlds`). The e2e harness, which spawns real package managers, lives outside
  `src/` in `packages/create/e2e/`.
- **The inner four point one way**: `answers/` to `targets/` to `utils/` to `config/`. That is why the answer
  unions and `Answers` live in `config/types.ts`, with each record `satisfies` its own union.
  `answers/registry.test.ts` holds `Answers` to one field per record.
- **The emitters hold no `switch (target)`**: the target record carries the difference, so
  `targets/<id>/<id>Target.ts` is the file that grows.
- **A target is a builder**, `(answers: Answers) => TargetRecord`, that builds its record on each call, never a
  module-level record: `targets/registry.ts` maps each id to it and emitters read it through `targetFor`. Its
  suite calls it inside each `it`. `docs/DESIGN.md` (Targets) carries why.

## One shape for every ring

- A subject is a kebab-case directory holding one entry named for it in camelCase, its suite, a
  `constants.ts` for a table it alone reads and a `utils/` for helpers only it reads.
- The entry takes the singular of what names the kind: the ring where it has one kind
  (`targets/react/reactTarget.ts`, `spawns/git/gitSpawn.ts`), the group where a group changes it
  (`disk/read/project-shape/projectShapeReader.ts`, `pipeline/passes/fix/fixPass.ts`), and nothing where a
  ring has no one kind (`terminal/cli/cli.ts`, `terminal/prompts/prompts.ts`).
- Every ring but `config/` and `utils/` has an `index.ts` barrel and outer rings import it, never a file inside.
  `config/` and `utils/` have none by design, and are imported by file. `src/meta.test.ts` fails
  an export nothing outside the ring takes, and carries one row per ring; a ring with a registry names it there
  and the suite holds the two against each other both ways.
- A helper sits at the level of its readers: `<subject>/utils/` (held private there by the suite) for one,
  the group's or ring's `utils/` for several (`spawns/utils/binaryUtils.ts`, `terminal/utils/nameUtils.ts`),
  `src/utils/` for several rings.

## `emitters/`

- `<group>/<subject>/<subjectEmitter>.ts`: the subject directory is named for the file it writes, the group for
  the answer that decides whether it writes anything (`agents/`, `manager/`, `target/`, `testing/`,
  `libraries/`, `typesafety/`, and `always/` for none).
- Every entry answers `Artifact[]` and owns its own condition, so `buildArtifacts` is a branchless `flatMap`
  over `registry.ts`. `meta.test.ts` reads its source to hold that, and holds the registry's `<group>/<subject>`
  keys against the directory listing both ways.
- The root holds only `registry.ts` (the two lists), `index.ts` and `constants.ts` (tables several subjects
  read, `VERSIONS` among them). A module that writes no file is not an emitter.
- `buildArtifacts` is what `create` writes, and `sync` writes only its `plugins/linteljs/` entries;
  `seedArtifacts` is what only `create` plants (the recorded config, the README, the manifest, the starter
  source). `buildArtifacts` appends the record `plugins/linteljs/managed.json` carries. Every file reaches disk
  through `artifactWriter`; `pipeline/passes/` is the one exception, editing source already written.
- `emitters/utils/`: `artifactUtils.ts` (the content shapes), `managedUtils.ts` (the managed record),
  `shapeUtils.ts` (a project's own spelling of a file), `importUtils.ts` (import order), `stylingUtils.ts`,
  `aliasUtils.ts`, `layoutUtils.ts` (`inLayout`, a monorepo's move of every non-root artifact under `apps/<name>/`), `frontmatterUtils.ts` (a rule's `paths:` frontmatter), `quoteUtils.ts` (a string as a source
  literal), `packageJsonUtils.ts` (dependencies, read by `package-json/`, `yarnrc/` and `pnpm-workspace/`),
  `runnerUtils.ts` (`testRunnerOf`, the runner a project's suites run on, from the record's `testRunner`, read by
  every subject that writes a runner's config, scripts, types or lint layer, and by `sync`'s runner-switch guard).
  What only `package-json/` reads, `SUPERSEDED`, stays in that subject's `constants.ts`.
- `testing/` writes one runner's config: `vitest-config/` or `jest-config/` (`jest.config.js`, for a record whose
  `testRunner` is `jest`; its `constants.ts` holds the msw and redux-toolkit ES-module fixes), each emitting
  nothing for the other runner. `testing/utils/coverageUtils.ts` holds the coverage include and exclude both read.
- `target/starter-source/utils/jestDialectUtils.ts` (`inJestDialect`) rewrites a shared suite written for Vitest
  into Jest's dialect when the runner is `jest`: the `vitest` import dropped, `vi.` to `jest.`, and the global
  stubs to `jest.spyOn` and `jest.restoreAllMocks`.

## `config/` and `utils/`

- `config/types.ts` is the shared vocabulary (answer unions, `Answers`, the artifact and its stages, the
  emitter signature, a project on disk); `config/constants.ts` is every shared value. Data only, so no suite:
  a function goes to a `utils/` at its readers' level. Caught by `@linteljs/workspace/create-config-data`.
- `src/utils/` is the innermost code ring: `objectUtils.ts` (`isJsonObject`, `keysOf`, `parsedAs`),
  `answerUtils.ts` (`hasLibrary`, `hasSurface` and the other predicates over `Answers`), `versionUtils.ts`.

## `answers/`

- An answer is `<group>/<kebab>/<key>Answer.ts` with its suite. The group is the emitter group it gates
  (`browsers`, `router` and `store` sit under `target/`); `recorded/` holds the six no prompt asks
  (`resolveConditions`, `aliases`, `ignores`, `packageManager`, `packageManagerVersion`, `nodeVersion`).
- A record is one of seven kinds: `choice`, `optionalChoice`, `multi`, `optionalMulti`, `list`, `map`, `text`.
  Legality lives on it: `slot` (does this target ask), `only` (does this target offer a value), `askedWhen`
  (do the answers so far still ask). Labels live in `values`.
- `registry.ts` holds `ANSWERS` in ask order and what derives from it (`AnswerKey`, `LinteljsConfig`,
  `DEFAULT_ANSWERS`). `meta.test.ts` holds one file per key, exporting a const named for itself, whose `key`
  names the same file.
- `answers/utils/`: `readUtils.ts` (parsed JSON to typed, per kind), `migrationUtils.ts` (v1 to v2),
  `recordUtils.ts` (`onlyFor`, `refusedValue`), `configUtils.ts` (`parseLinteljsConfig`), `schemaUtils.ts` (the
  published JSON schema, generated from the records).
