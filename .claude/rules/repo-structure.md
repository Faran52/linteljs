---
paths:
  - "packages/**/*"
  - "scripts/**/*"
  - "docs/**/*"
  - ".claude/skills/**/*"
  - "*.{ts,js,json,yaml}"
---

# Repository Structure

`packages/create/templates/fragments/claude-rules/repo-structure.library.md` is the standard: read it there, not
in a copy. The per-target files describe applications and do not apply. Below is where this workspace differs,
and where each fact is caught. Each package has its own rule on top: `create-structure.md`,
`eslint-config-structure.md`, and `packages/eslint-plugin/CLAUDE.md`.

## Three packages, one direction

```
eslint-plugin  <-  eslint-config  <-  create
   the rules        which layers        writes a config
                    enable them         naming the layers
```

`create` never imports `eslint-config` at runtime: it writes the package name into text, so it builds and tests
before that package publishes. The types it redeclares are held equal by `packages/create/src/types.test.ts`.

## Files, everywhere

- **A subject is a kebab-case directory** holding one entry named for it in camelCase, its suite, a
  `constants.ts` for a table it alone reads, and a `utils/` for helpers only it reads. No loose files at a
  ring or group root beyond the barrel, `registry.ts` and `constants.ts`. Caught by each package's
  `src/meta.test.ts`.
- **One code file, one test file beside it.** A data-only `constants.ts` and a pure re-export barrel have none.
  Caught by `pnpm test:isolated`, which also fails a `constants.ts` with a function or branch.
- **`constants.ts` holds data only**, never a function. A table of functions goes in a `utils/` module.
- **A helper sits at the level of its readers and no higher**: the subject's `utils/` for one reader, the
  group's or ring's `utils/` for several, `packages/create/src/utils/` for several rings.
- **`*Utils.ts` on every file in a `utils/` directory** (`ruleUtils.ts`, not `ruleApi.ts`). Caught by the
  `naming` map in the root `eslint.config.ts` (`**/utils/*.ts` to `*Utils`). Generated projects follow it too.
- **Size**, counted in lines of code with blanks and comments free: a function at most 350, a code file 500, a
  component file (`.tsx`, `.jsx`, `.vue`, `.svelte`, `.astro`) 350, a file under `utils/` 800. Tests, `__mocks__/`
  and e2e are exempt. Caught by `max-lines` and `max-lines-per-function` in the `base` layer, the same limits a
  generated project gets; `docs/DESIGN.md` carries the measurement.
- **Coverage is 100% on all four metrics** in all three packages, with no ignore comment. Delete an unreachable
  line rather than ignore it. Caught by `scripts/checkBannedPatterns.ts`, which bans every `v8`, `c8` and
  `istanbul` ignore in `packages/*/src`.

## Scripts

Each script is `scripts/<group>/<kebab>/<camel><Group>.ts` with its own `utils/*Utils.ts` and `constants.ts`
(`packages/eslint-plugin/scripts/audit/real-code/realCodeAudit.ts`). A `scripts/` with no groups suffixes
`Script` (`scripts/lint-starters/lintStartersScript.ts`). Root scripts carry no suites; what one decides that
needs a test lives in a package (`lint:starters` reads its cases from `packages/create/e2e/starter-cover/`).
Helpers several scripts read go in the nearest shared `utils/`, the root `scripts/utils/` for all packages.
Every script reports through the shipped `packages/create/templates/project/scripts/utils/loggerUtils.ts`
(`@linteljs/workspace/scripts-logger`) and runs as `tsx <path>`, which resolves the `@` aliases from the tsconfig
in the working directory.
`scripts/checkBannedPatterns.ts` stays flat and on plain `node`: the banned-pattern hook looks for it at the path
a generated project has, and it runs the shipped checker less this workspace's `SKIPPED` list.

## `packages/create/templates/`

Outside `src/`, laid out as the destination: `project/` is the tree a project receives, `starter-source/` the
per-target starters, `fragments/` the pieces joined into one file (kept as an explicit list, since they have no
destination), `schemas/` the mirror of the root `schemas/` published by raw URL
(`answers/utils/schemaUtils.test.ts` holds them equal). It cannot live under `src/`: it holds TypeScript for
frameworks this workspace does not install and files named `*.test.ts`.

## `__mocks__/` and suites with no source

- `__mocks__/` sits at each package root, aliased `@mocks/*` in that package's tsconfig.
  `packages/eslint-config/__mocks__/fixtures/` holds the defective input the layer tests lint.
- The shipped scripts' suites (`checkBannedPatterns.test.ts`, `typecheckStaged.test.ts`, and each of their
  `utils/`) and the hook suites sit beside what they test under `templates/project/`, one per shipped file,
  excluded from the tarball by `package.json`. The hook suites share `packages/create/__mocks__/runHook.ts`.
- Suites named for what they cover rather than one file: `meta.test.ts` in each package (the tree, and in the
  plugin the published surface against `__mocks__/ruleMetadata.json`), the plugin's `ruleModules.test.ts` and
  `fixerSafety.test.ts`, `create/src/types.test.ts`, and `hooks.test.ts`. `pnpm test:isolated` skips exactly
  these, listed in `scripts/isolated-coverage/constants.ts`.

## The repo mod

`.claude/skills/linteljs/` is this repo's own Claude Code mod. The engine finds the plugin folder there with no
`settings.json` entry; `hooks/hooks.json` names one module, `register.tsx`, which registers the three below. It is
named `linteljs` because the check band's atom belongs to plugin `linteljs`. Its gate is
`claude plugin validate .claude/skills/linteljs` and `claude plugin test .claude/skills/linteljs`, plus `pnpm typecheck`
and `pnpm lint`:
each mod folder (this one and the shipped plugin) carries a `tsconfig.json`
extending the engine's `.claude-plugin/types/tsconfig.json`, then the root `tsconfig.mod.json`'s strict flags.
`pnpm mod-types` has the engine write those types (gitignored, never packed); `scripts/typecheck-mods/` runs
`tsc` on both, failing without them locally and skipping in CI. `hooks/checkStatusHook.ts` is a classic hook
command, checked as Node code by `tsconfig.root.json`. The root `eslint.config.ts` lints the files each mod's
tsconfig checks, and ignores them where the types are missing, as in CI. `.fallowrc.json` ignores `.claude/**`
(`docs/DESIGN.md`).

- **Check band**: `checkBand.tsx` and `checkBand.test.tsx` are byte copies of the shipped pair under
  `packages/create/templates/project/plugins/linteljs/hooks/`. An `it.each` in that folder's `hooks.test.ts` holds
  each copy equal to its source; change the shipped file, then copy it. `checkStatusHook.ts` runs the shipped script.
  `register.tsx` takes only its refresh (`registerCheckRefresh`): the CI band draws the check state on its line.
  This copy is where the band's suite runs: `claude plugin test` runs every `*.test.ts(x)` under the folder it is
  given and cannot select files, so on the shipped folder it also runs the Node hook suites, which fail there.
  The band's gate is `claude plugin test .claude/skills/linteljs`, never the shipped folder.
- **CI band** (`ciBand.tsx`): main's latest `ci`, `e2e` and `audit` runs from `gh run list` and the GitHub
  Actions component from githubstatus, refreshed on `classic.SessionStart` and `classic.Stop` at most every 3
  minutes. One line, `◐ check stale  │  main  ci ✓  e2e ✗  audit ✗  │  actions ✓`: each glyph coloured (✓ green,
  ✗ red, ◐ yellow, ○ gray) from the shipped band's `MARKS`, a segment with nothing read left out.
- **Repo guards** (`repoGuards.ts`, deciding through `utils/guardUtils.ts` and `utils/shellUtils.ts`):
  - read guard: a `Read` or shell read of a file too large or noisy to take whole is denied with the targeted tool;
  - no polling in subagents: `Monitor`, sleep loops and `watch` from a subagent are denied;
  - banned text: an `Edit`, `Write` or staged diff adding a registry mirror URL, a coverage ignore or a Stryker
    disable comment is denied, outside the files that hold them as data;
  - at `git commit`: a `*.tmp.ts` staged or at a root, banned text in the staged diff, and a message commitlint
    refuses each deny the commit;
  - at a worktree agent's spawn: leftover worktrees no live agent owns are a warning, and a HEAD that differs
    from `origin/HEAD` prepends an `ff-only` note to the agent's prompt.

## `docs/` and the root

- `docs/DESIGN.md` holds decisions the code cannot show, the non-goals, and "Workspace lint exemptions"; every
  block in the root `eslint.config.ts` names its section there. `docs/CONTRIBUTING.md` is for people.
- Root config: `eslint.config.ts` (the workspace's own lint, built from the layers' source), `vitest.config.ts`
  (one project per package, the coverage thresholds), `tsconfig.json` and `tsconfig.root.json`,
  `pnpm-workspace.yaml` (the `catalog:` versions), `lint-staged.config.js`, `commitlint.config.js`, `.husky/`,
  `.claude/settings.json` (the shipped hooks, run from `templates/project/plugins/linteljs/hooks/`),
  `stryker.parts.mjs` (what the three `stryker.config.mjs` share: the runner, the reports, the `STRYKER_PART` split),
  `.fallowrc.json` (for `npx fallow`: the entry points no import reaches, the template text, fixtures and repo
  mod left out, and the dependencies loaded by name rather than imported; `health.coverage` reads `pnpm test:coverage`'s
  `coverage/coverage-final.json`, so CRAP scores use measured coverage, not Fallow's estimate).
