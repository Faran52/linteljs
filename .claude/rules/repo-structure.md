---
paths:
  - "packages/**/*.ts"
  - "packages/**/*.js"
---

# Repository Structure

A pnpm workspace of three published packages. Every generated project gets a
`repo-structure.md` describing its own shape; this is that file for the workspace that emits
them, and the shape it describes is a library monorepo rather than an app.

The dependency direction across the three is one way and is the whole design:

```
eslint-plugin  <-  eslint-config  <-  create
   the rules        which layers        writes a config
                    enable them         naming the layers
```

`create` never imports `eslint-config` at runtime. It writes the package name into text and never
resolves it, which is why it can be built and tested before that package publishes. The two type
aliases it duplicates instead of importing carry a comment saying so.

## One folder per thing

The rule that placed every directory below: a folder exists when it holds more than one file
about one subject, and it is named for the subject rather than the mechanism.

### `packages/eslint-plugin/src/rules/<rule-id>/`

Folder per rule, named with the kebab-case rule id so the directory name is the id a user writes
in their config. Each holds `index.ts`, `index.test.ts` and `README.md`. Rules with a helper that
only they use keep it in the folder rather than in `src/utils/`, suffixed `*Utils`:
`prefer-arrow-functions/` carries `safetyUtils.ts` and `writeUtils.ts`.

`meta.test.ts` asserts the directory listing equals the registry in `rules/index.ts`, so a rule
folder the registry never imported fails rather than sitting unnoticed.

### `packages/eslint-config/src/`

One file per layer, named for its single export: `base.ts` exports `base`, `typescript.ts`
exports `typescript`. `frameworks/` and `libraries/` group the layers that come in sets.
`defineConfig.ts` composes them and owns the ordering, which is load-bearing and was previously
enforced only by a comment.

### `packages/create/src/` is three rings

```
model/      what the user chose. No fs, no process, no child_process.
artifacts/  answers to file text. Pure.
run/        everything touching disk, argv or a terminal.
```

`model/` reaches nothing outward, `artifacts/` may import `model/`, `run/` may import anything.
That is not a convention: `import-x/no-restricted-paths` in the workspace `eslint.config.ts`
enforces it, scoped to source because a test legitimately arranges across rings.

Inside them:

One shape for all three: a ring's root holds only kebab-case subject directories, plus its
`index.ts` barrel where one exists. Inside a directory, the implementation file is named for its
main export and its test sits beside it, the way `tsconfig/emitTsconfig.ts` always was. The
export names carry the job: an emitter is `emit*`, a merge is `merge*`, a builder is `build*`.

- `model/` is `answers/`, `naming/`, `stages/` and `targets/`; `targets/` is one file per target
  named for the target it exports, plus `record.ts` for the shape they share, `registry.ts`, and
  `utils/targetUtils.ts` for the kit that builds them.
- `artifacts/` is one directory per thing lintel puts on disk (`tsconfig/emitTsconfig.ts`,
  `gitignore/mergeGitignore.ts`, `pnpm-workspace/emitPnpmWorkspace.ts` beside
  `pnpm-workspace/mergePnpmWorkspace.ts`, the two copy-descriptor builders
  `claude-rules/ruleArtifacts.ts` and `banned-patterns/checkerArtifact.ts`; `package-json/`
  additionally holds `versions.ts`, the one data table, so a version bump is one file), plus one
  directory per piece of shared infrastructure: `artifact/` for the shape, `build-artifacts/` for
  the list, `build-aliases/` and `build-scripts/` for the two tables emitters, templates and the
  fix pass all read, and `template/` for the slot filler. `index.ts` at the root is a barrel and
  holds no implementation, which is why the list itself lives in `build-artifacts/`.
- `run/` is one directory per job: `cli/`, `prompts/`, `pipeline/`, `sync/`, `fix-pass/`, `git/`,
  `shipped-assets/`, and the split pair `rewrite/` (makes scaffolded source compile, ungated) and
  `repair/` (the `fresh`-gated starter repairs), which are different jobs under different gates.
  `utils/fsUtils.ts` holds the one shared filesystem judgment: only absence is data.

`assets/` sits outside `src/` and mirrors the artifact folder names. The shipped templates cannot
live under `src/`: twelve are TypeScript, one imports `@angular/*` this workspace does not
install, and eight are named `*.test.ts`, so tsconfig, vitest, coverage and eslint would each
need telling that source is not source.

## Naming

- Folders are kebab-case, files are camelCase. Both are enforced by `check-file` in the workspace
  config, so a violation is a lint error rather than a review comment.
- A file with one export is named for it. A file that is a cohesive module is named for its
  topic. `helpers.ts`, `assets.ts` and `fix.ts` were all renamed for failing this: a plural noun
  or bare verb that promised data or an action the file did not contain.
- Shared helpers live in a `utils/` directory and end in `*Utils`. The `'**/utils/*.ts': '*Utils'`
  entry in the naming map enforces the suffix, which is why the directory is not optional.
- `index.ts` is a barrel. A file holding an implementation is not one.

## Tests

Colocated beside their source, as `testing.standard.md` requires. No package has a `test/`
directory. Two kinds of file sit outside `src/`, and each is a stated exception rather than a
leftover:

- Shared helpers and fixture files live in `__mocks__/` at package root, aliased `@mocks/*`. They
  are not tests, and under `src/` they would count toward coverage.
  `eslint-config/__mocks__/fixtures/` holds the deliberately defective input its layer tests lint.
- `packages/create/assets/scripts/checkBannedPatterns.test.ts` and `typecheckStaged.test.ts` sit
  beside the scripts they spawn, which are shipped assets with no `src/` counterpart.
  `package.json` excludes them from the packed tarball so they do not land in a user's project.

Three files in `eslint-plugin` are named for what they cover rather than for one source file,
because what they cover is the plugin: `meta.test.ts` holds the whole published surface against
`__mocks__/ruleMetadata.json`, `ruleModules.test.ts` checks the registry against the directory
listing, and `fixerSafety.test.ts` runs the shared corpus through every rule at once. Splitting
any of them per rule would be fourteen copies of one assertion.

Coverage is gated at 100% on all four metrics for all three packages. A line that cannot be
reached is deleted rather than ignored; the one sanctioned exception is a `/* v8 ignore */` on a
defensive branch whose unreachability is argued in the comment beside it, audited by the
plugin's `audit:ignores`.
