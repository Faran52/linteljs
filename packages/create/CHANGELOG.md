# Changelog

All three packages share one version and release together. An entry here describes this package;
when a version's change lives in a sibling it is described there instead:

- [`@linteljs/eslint-config`](../eslint-config/CHANGELOG.md)
- [`@linteljs/eslint-plugin`](../eslint-plugin/CHANGELOG.md)

## 2.0.0

### Breaking

- **No official scaffolder runs.** Every target writes linteljs's own starter tree, and the `scaffold` stage is
  gone: `--skip` takes `lint`, `package`, `standard`, `install` and `fix`.
- **`--skip-scaffold` is now `--existing`, and `--fresh` is now `--seed`.** `--existing` runs in the directory that
  already exists rather than making `<name>/`; `--seed` plants the starter and seed files a new project gets.
- **The package manager is no longer asked.** The manager that runs `create` is the project's, read from
  `npm_config_user_agent`, else a lockfile in the directory, else npm, and recorded with its exact version. One
  below its floor is refused, never upgraded: pnpm 10.26, npm 9.6.5, Yarn 4, Bun 1.2. Yarn 1 is refused too.
- **The recorded answers are `linteljs.config.json`, schema version 2.** A `lintel.config.json` is still read by
  `create --existing` and `sync`, which write its answers under the new name and then remove the old one. A v1 file
  is migrated on read: the form library, `tailwind` and `tanstack-query` move out of `libraries` into `form`,
  `styling` and `data`, and `store: true` becomes the target's first store.
- **The generated `eslint.config.js` imports `composeConfig` from `@linteljs/eslint-config/compose-config`.**
  `sync` rewrites the file.
- **The agent hooks are TypeScript run by `node`.** `plugins/linteljs/hooks/` holds `hooks.json` and the `*Hook.ts`
  scripts; the `.sh` hooks and `commandParser.js` are gone and `sync` removes them. Reinstall the plugin in Codex
  after a `sync` that changes `plugins/linteljs/`, since Codex runs a cached copy.
- **`sync` changes only what linteljs owns, and asks once.** It shows one table of the files to add, update or
  delete and the `@linteljs/*` versions to upgrade, then asks; `--yes` applies without asking, and without a
  terminal and without `--yes` it writes nothing and exits 1. `--force` is gone, and `sync` no longer prints a
  diff per file.
  - In `package.json` it moves only the `@linteljs/*` versions, and only when they are behind. Any other
    dependency the project lacks is printed as an install command, never written.
  - `.github/workflows/ci.yml` is written only when a project is created, or by `sync` when it is missing.
  - It keeps `ignoredBuiltDependencies` in `pnpm-workspace.yaml`. Only `create` drops it.

### Added

- Nuxt is a target.
- A scoped project name is accepted: `create @acme/app` writes `app/`, records `@acme/app` in `package.json`, and
  titles the page `app`. `--existing` titles it after the name `package.json` records, else after the directory.
- Every answer is a flag, and one makes the run non-interactive: `--target`, `--browser`, `--surfaces`, `--hosted`,
  `--store`, `--router`, `--testing`, `--type-safety`, `--libraries`, `--styling`, `--data`, `--form`, `--mocking`,
  `--languages`, `--agents`, `--plugins`. An empty list, such as `--libraries ''`, answers none. `--version`
  prints the version.
- New answers:

  | Answer | Choices |
  | --- | --- |
  | `styling` | Tailwind (NativeWind 5 on React Native), or StyleX outside Angular and React Native, linted by the `stylex` layer and built through `@stylexjs/unplugin/vite` |
  | `data` | TanStack Query, bound to the framework, or RTK Query beside Redux Toolkit |
  | `form` | TanStack Form, or React Hook Form where the target renders with React |
  | `mocking` | MSW |
  | `router` | on React (Vite): React Router or TanStack Router, both declared in code, or React Router's framework mode, with its own build, route modules and generated types |
  | `store` | Zustand, Redux Toolkit or TanStack Store on React, Next and React Native; Pinia or TanStack Store on Vue and Nuxt; TanStack Store on Svelte and Solid; NgRx Signals on Angular; Nano Stores on Astro |
  | `libraries` | es-toolkit (the default), ts-pattern and t3-env beside Zod |

- **Languages.** `--languages` takes any of `en`, `ar`, `ja`, `ko`, `zh-CN`, `zh-TW`, off by default, with English
  always shipped as the fallback. Every target reads one `common.json` per language from `src/i18n/`, which the
  `@i18n` alias reaches, and a suite holds every locale to the same keys. The header gains a language picker, and
  the header and every starter page are translated. The stored choice wins, then the browser
  language, which is never stored; Arabic sets `dir="rtl"`. The server-rendered starters (Nuxt, Next, SvelteKit,
  React Router's framework mode) keep the choice in a `language` cookie and render it, `lang` and `dir` included,
  from the first byte, falling back to the request's `Accept-Language`; the Vue, React and Astro starters keep it
  in the same cookie.

  | Target | Through |
  | --- | --- |
  | React, every router mode | i18next |
  | Next | next-intl on the client: no plugin, no locale in the URL |
  | Vue, Nuxt | vue-i18n |
  | SvelteKit | Paraglide JS, compiled at `prepare` and `typecheck` and by its Vite plugin |
  | Solid | @solid-primitives/i18n |
  | Angular | a signal, with no library; `@angular/localize` cannot switch at runtime |
  | Astro | a client script, with no library; Astro's i18n routing cannot switch at runtime |
  | React Native | i18next, with the choice kept in `@react-native-async-storage/async-storage`; Arabic turns a native app right to left from its next launch |
  | Web extension popup | a resolver, with no library; `chrome.i18n` cannot switch at runtime. An extension without a popup is not asked |

- **The starter.** Every target but the extension has a header with a "LintelJS Starter" label and tabs, Home,
  About and Version pages; React, Next, Vue, Svelte and Solid add Contact with a form library. Angular renders it under every
  answer, through Reactive Forms or TanStack Form's `injectForm`, and lazy-loads it. A Contact field shows its
  error once it is left or a send is tried, and clears it as soon as the value passes. About lists every script
  `check` chains, with what each runs and the manager's own prefix. The page title is the project's name, and the
  header wraps a name too long for its row rather than cutting it off.
- **Accessibility and SEO.** Every starter document sets `lang` on `<html>` and carries a description meta, the
  extension popup holds its content in a `<main>` landmark, and every target that serves a public directory ships
  a `robots.txt`, so a single-page app does not answer `/robots.txt` with its HTML shell.
- **Status pages.** Every starter but the extension ships 403, 404 and 500 pages over one `StatusPage` per
  framework, read from `src/config/statuses.ts`. A crash shows the 500 page with "Try again", through the
  framework's own boundary, and a path nothing routes the 404. A `ForbiddenError`, the class
  `src/lib/utils/statusUtils.ts` ships, shows the 403 with no retry, as does a loader or server refusal on React
  Router, Nuxt and SvelteKit. Astro, rendered at build, writes its three pages over one `StatusLayout.astro`.
- **The starter follows the system colour scheme.** Each colour token is `light-dark()` under
  `color-scheme: light dark`, a `.light` or `.dark` class pins either, and Tailwind's `dark:` variant matches the
  same condition. React Native reads the same token values through `useColorScheme`. Every text token meets
  WCAG AA in both schemes, 4.5:1 on the page, a card and a muted surface, and a field's border 3:1.
- Every web target ships the Mark as its favicon, an SVG in the primary colour of each scheme. React Native's mark
  animates like the web one, through Reanimated, and holds still under reduced motion.
- **Aliases.** Each `/*` alias gains an exact key onto its directory (`"@ui": ["./src/components/ui"]` beside
  `"@ui/*"`), so a directory index imports as `@ui`. Every target gains `@styles` onto `src/styles/`, which StyleX
  is told about as well; `@apis` comes with `src/lib/apis/` and `@i18n` with a language. The route unit gets one
  too, first in `paths`: `@pages` on React and Solid, with `@routes` before it under React Router in code, `@views`
  on Vue and Nuxt, `@layouts` on Astro. With
  `react-router-framework`, `eslint.config.js` sets `aliasExempt: ['src/routes.ts']` and
  `enforceRelativeImports: true` for `@linteljs/prefer-alias`, since the route typegen reads that file without
  the aliases.
- `sync` removes what a deselected answer left behind, from the record in `plugins/linteljs/managed.json`.
- Cursor and Copilot run the agent hooks: `.cursor/hooks.json` (merged with a project's own) and
  `.github/hooks/linteljs.json`, both removed by `sync` when the agent is dropped. The command guards read
  PowerShell as well as Bash, and `--no-verify` is denied on any git subcommand.
- Claude Code projects watch their context: a hook warns once when a session passes 150K tokens, and
  `.claude/settings.json` sets a `statusLine` and a `subagentStatusLine` that show `[CTX nK]`, green, amber past
  130K, red past 150K. A project's own status lines are kept on a `sync`.
- A generated project declares its manager in `packageManager`, `engines` and `devEngines.packageManager` with
  `onFail: "error"`; Bun gets `engines.bun` only. CI runs the Node major that ran `create`.
- New releases wait two days before they install, so a half-published version is not picked up the minute it
  appears. `@linteljs/*` is exempt, so a linteljs release installs the day it ships.

  | Manager | Setting |
  | --- | --- |
  | pnpm | `minimumReleaseAge: 2880` in `pnpm-workspace.yaml`; a project's own value is left alone |
  | Bun | `install.minimumReleaseAge = 172800` in `bunfig.toml`, honoured from Bun 1.3.0 |
  | Yarn | `npmMinimalAgeGate: 2880` in `.yarnrc.yml`, written only from Yarn 4.10.1, since an older Yarn 4 refuses it |

- Generated projects get `scripts/utils/loggerUtils.ts`, and `lint:types` is
  `node scripts/checkBannedPatterns.ts src`, which runs on every platform. The tsconfig sets
  `allowImportingTsExtensions` (Angular: `rewriteRelativeImportExtensions`).
- The package also provides a `create` binary, which `yarn create @linteljs` looks for.
- The React Compiler runs natively through `@vitejs/plugin-react`'s `compiler` and `oxc-transform-react`, with no
  Babel pass; Expo's `app.json` sets `experiments.reactCompiler`. `eslint-plugin-react-compiler` is gone, since
  `eslint-plugin-react-hooks` 7 carries its rules.
- The questionnaire is one line per question over `@inquirer/prompts`, shows every option, and skips the AI plugins
  question when no agent is chosen. A run on a terminal is one line per stage, spinning while it works; behind a
  pipe it prints a line per file and per stage as before.

### Changed

- **A new project passes its own `check` with nothing from the fix stage.** Every emitted file lands as
  `eslint --fix` and `stylelint --fix` would leave it, under the layers' layout rules: one call per line in a chain,
  one item per line in a list of three or more, imports grouped by framework and by the project's own aliases, one
  import per module with an inline `type`, and values named before use. The starter imports across directories
  through the most specific alias and within one relatively, the shape `@linteljs/prefer-alias` asks for. Its file
  names pass the target's own `naming` map. The fix stage stays, to bring an existing project into line.
- The fix stage reports per tool: `eslint --fix: 3 files changed` or `eslint --fix: nothing to fix`, and the same for
  `stylelint --fix`, which said nothing unless it could not run.
- Node `>=22.18.0`, down from `>=26.8.1`, for both the CLI and the project it writes: the first 22.x release that
  strips types by default, so the project's TypeScript scripts and hooks run with plain `node`.
- Dependencies move to current releases, and a project carries only the peer overrides still refused upstream.
  React Native follows Expo SDK 57's own pins (expo 57.0.26, expo-router 57.0.24, react-native 0.86.3) and declares
  `@react-native/metro-config`. A web extension takes `@crxjs/vite-plugin` 3, which ships ESM only; the
  `crx({ manifest })` call is unchanged. Angular's `pnpm-workspace.yaml` loses its `peerDependencyRules` block,
  since `@angular/build` 22.2 admits vitest 5, and no target discards a peer warning any more.
- The emitted agent instructions say each thing once: `CLAUDE.md`, `AGENTS.md`, Copilot's and Cursor's always-on
  file carry the gate and the git rules, and the plugin `SKILL.md` only routes a change to its reference. The rule
  files drop their "shipped verbatim" note.
- The emitted structure rule describes the folders the answers write, and only those: a router's route table, a
  store, the query wrappers, RTK Query's `lib/apis/` and the MSW handlers. A shared section covers every target:
  files under 500 lines, one subject directory per module holding one entry named for it, helpers in a `utils/`
  at the level of their readers with names ending in `Utils`, `constants.ts` as data only, and what `typings/`,
  `lib/providers/`, `lib/services/` and `lib/apis/` hold. The emitted `naming` map holds every file under a
  `utils/` folder to the suffix: `'**/utils/*.ts'` to `*Utils`, and `'src/**/utils/*.ts'` to `*-utils` on Angular.
- The emitted type standard tells an agent that comments are minimal: a short why, or none, and none in tests.

### Fixed

- The starter's Version page lists only the answers its target asks: every target showed the web extension's
  Browser answer, since each holds its default.
- `scripts/checkBannedPatterns.ts` reports a directive written as a block comment, such as
  `/* eslint-disable */`. It blanked every block comment before matching, so only the `//` form was caught, and a
  `/*` inside a template literal could blank the lines after it. Its logic now lives in
  `scripts/utils/bannedPatternsUtils.ts`, and `typecheckStaged.ts`'s in `scripts/utils/typecheckStagedUtils.ts`;
  the entries keep the lines `sync` writes and carries over. A carried-over `PROJECT_BANNED` that calls
  `directive()` gets the import from the util.
- The git safety hook reads heredocs, command substitutions, subshells and compound commands in bash. A heredoc
  body was read as shell, so one apostrophe in it denied the command as unreadable, and `$(git stash)`, a
  backtick, `(git stash)` or `do git stash` slipped past it. A commit message from `"$(cat <<'EOF' ...)"` is
  cleared; any other substituted git operand is denied as unreadable.
- An Angular project's `tsconfig.json` sets `erasableSyntaxOnly` like every other target's. Its starter injects
  with `inject()`, and `typescript()` already refuses the parameter properties the flag was dropped for.
- `create` run from a git hook, an alias or a linked worktree's `rebase --exec` works on its own directory: every
  git and install it spawns drops the repository variables git exports, so `git init` no longer reinitialises the
  caller's repository as bare and husky sets its hooks path on the project.
- A file the standard installs but never overwrites, such as `CLAUDE.md`, `AGENTS.md` or the test setup, is left
  alone on every run.
- A Next project sets `agentRules: false`, so `next dev` no longer rewrites the `CLAUDE.md` and `AGENTS.md` the
  project owns.
- Copilot `applyTo` and Cursor `globs` expand brace groups, since both tools split the value on commas and
  `src/**/*.{ts,tsx}` was read as two broken globs.
- On Yarn, the first install in CI writes its lockfile, which Yarn 4's immutable CI installs refused. Husky and a
  target's own setup (`svelte-kit sync`) run from `postinstall`, since Yarn 2+ never runs `prepare`.
- `stylelint-order` is an explicit dev dependency, since `stylelint-config-recess-order` peers on it.
- An Astro project gets `dev` and `preview` scripts, like every other target. Angular's `preview` serves the
  production build through `vite preview`, where `ng serve` stays a dev server, and `ng build` writes straight
  into `dist/`.
- An extension without the popup surface writes no `index.html`, `src/main.ts`, `src/popup/` or `src/lib/mark/`,
  since its manifest names no popup; one with no page at all gets no html layer.
- Emitted files stay within `max-len` and still parse on unusual values: a long project name, a long gate command
  and a recorded `resolveConditions` wrap, and an ignore or alias path ending in a backslash or holding a newline
  no longer breaks `eslint.config.js` or `nuxt.config.ts`.
- The emitted `checkBannedPatterns.ts` accepts a type guard's own type, `(value: unknown) => value is T`, as a
  parameter or an alias, so a parse helper that takes its guard as an argument passes the floor.
- A config whose single choice names an inherited property, such as `"target": "toString"`, is refused, and an
  answer that fails its pattern says it must match the pattern, not that it must be a string.
- The generated CI workflow pins `oven-sh/setup-bun` to a commit, as it already does `pnpm/action-setup`.
- The README spells the `minimumReleaseAge` override the way pnpm's CLI takes it.

## 1.5.3

The emitted `vitest.config.ts` passes `execArgv: ['--no-experimental-webstorage']`. Node 25+ exposes
a native `localStorage` that throws without `--localstorage-file`, and happy-dom no longer replaces
it, so a storage-backed component test read `undefined` on every generated project. React Native is
unaffected: its platform projects run `environment: 'node'`.
See [capricorn86/happy-dom#1950](https://github.com/capricorn86/happy-dom/issues/1950).

## 1.5.2

No rule changes. The three versions move together, so this carries generated-project floors moving
with the workspace: pnpm 12.1.0, Node >=26.8.1, and `@types/node` 26.4.0.

## 1.5.1

Twelve findings from a report against a scaffolded Astro workspace, plus four the end-to-end suite
found while they were being fixed.

- Astro wires the React Compiler it was already installing, as plain Babel options through
  `@astrojs/react`. The preset form fails that path outright.
- Non-Astro React builds move to `@vitejs/plugin-react-swc`, with the compiler running ahead of it.
  Astro keeps the Babel passthrough, and `@swc/core` is approved so the first install does not abort.
- Astro takes the Tailwind Vite adapter alone. The choice now asks whether a target calls the Vite
  plugin rather than whether it owns a `vite.config.ts`, which is the one case where those differ.
- `astro` is a runtime dependency, declared once, rather than drifting between two sections.
- The generated `check` runs the type floor as `lint:types`, so the documented gate is the gate the
  commit runs, and `lint:css:fix` exists so the CSS half of "run lint:fix" is followable.
- The stale `@providers/*` alias is gone, and the agent rules state the commit trailer policy.
- The banned-pattern checker grants `unknown` on a promise chain's catch, which a scaffolded
  Angular project's own `main.ts` needs, and no longer reports a directive written inside a string.
- `VERSIONS` is gated against the config's own dependencies, not the catalog alone. Six pins had
  drifted behind the layers they install beside.

## 1.4.6

### Fixed

- **The write-time guard finds the checker from any directory.** `banned-pattern-guard.sh` resolved
  `scripts/checkBannedPatterns.ts` against the payload's `cwd`, which is wherever the agent is standing
  rather than the project root. An agent working in a subdirectory got a path that does not exist, and
  since node exits non-zero for a missing file exactly as it does for a violation, the hook reported
  `decision: block` with `Cannot find module` as the reason: every edit refused, for nothing the code
  did. Found in a reference project by an agent working from `dist/`.

  It searches upward now, from the root the host names where there is one, because Claude Code exports
  `CLAUDE_PROJECT_DIR` and Codex does not, so neither half alone covers both. Both are held by tests.
  A project with no checker anywhere above the file is silent rather than blocking, which is the other
  half of the same confusion: nothing to enforce is not a violation to report.

  This workspace's own copy of the hook already anchored on the project root, and the copy it ships did
  not. The two are separate implementations that drifted, which is why the gate here never saw it.

## 1.4.5

### Changed

- **A project name argument is checked before the run.** A name that npm could not carry was written into
  `package.json` and only failed later; it is refused at argv now, npm's two reserved names, `node_modules` and
  `favicon.ico`, among them. The argument only: a run without one takes the directory's name, and a directory
  is not chosen as a package name and often cannot be one, so `create --yes` inside a directory you already
  made still scaffolds into it under its own name.
- **A positional argument past the name is refused.** `create my-app extra` used to drop `extra` in silence,
  which reads as accepted. Both it and an unknown option now stop the run with a message and exit 1; the
  unknown option previously escaped as an unhandled `TypeError` and a Node stack trace.

### Fixed

- **Every write is confined to the project.** `writeProjectFile`, `applyArtifact`, `applySync`'s removals and
  the three starter repairs joined `cwd` to a target path and used the result. They resolve it now and refuse
  anything that leaves the directory: an absolute path, a `..` at any position, the project root itself, and a
  parent that is a symbolic link, walked segment by segment. The last one is the case a join cannot see, since
  the resulting path is inside the project and the filesystem still follows it out. A symbolic link as the file
  itself was already refused by the `O_NOFOLLOW` on the write.
- **A starter repair no longer reads a failure as a moved file.** It caught every error from reading a file it
  was about to fix and continued, so a permission error or a directory in that file's place looked exactly like
  a generator having moved it, and the repair was skipped in silence. Only absence continues now.

- **The type floor is merged, not frozen.** `scripts/checkBannedPatterns.ts` was `preserve: true`, and it
  holds two things: the pattern list, which is the standard, and `PROJECT_SKIPPED` and `PROJECT_BANNED`,
  which are the project's. Preserving froze both, so 1.4.4's caught-value grant reached every new project
  and no existing one; a reference repo was still running the 1.4.1 patterns. It is carried over now: the
  shipped file supplies the patterns and the project's own blocks are lifted back over them. `applyArtifact`
  read the current file only for a merge, so a copied transform always saw `null`; it reads for either.

  A block is free-form text with the reasons written beside its entries, so the carry-over reads it as text a
  person wrote rather than as anything else. It ends on a `];` that is a line of its own, because a reason
  quoting code (`arr[0];`) carries that pair as a substring and ended the block mid-comment, leaving the array
  open. And it is carried by a function rather than a string replacement, because `$&` or `$'` in one reads as
  the match and everything after it, which spliced the rest of the file into the block.

- **A project's own stylesheet, rather than a second one beside it.** The Tailwind entry was a fixed path
  per target, so a project keeping its entry elsewhere was handed a file nothing imported and the merge
  meant to guarantee Tailwind was wired guaranteed nothing. The path is discovered now, and where a project
  holds more than one candidate the target's own wins rather than whichever sorts earliest.

- **Both routes read a project the same way.** `sync` looked up the setup file and the style entry;
  `runPipeline` looked up the setup file alone, so the discovery above did not reach `--skip-scaffold`.
  The cause was `buildArtifacts` taking its discoveries as loose positional arguments, which let a caller
  skip one and the compiler agree. They are one `ProjectShape` from one `readProjectShape`, so the next
  discovered file reaches both routes by construction.

- **`mergeStyleEntry` recognises the `url()` import.** A real entry read `@import url("tailwindcss")
  source(none)`, which the check missed, so a second unrestricted import went in above it and silently
  undid the scan restriction the project had chosen.

- **stylelint's `nesting-selector-no-missing-scoping-root` stands down for a Tailwind project.**
  `@custom-variant` defines a variant as a bare `&` rule with the at-rule as its scoping root, which is
  correct Tailwind 4. `stylelint-config-tailwindcss` teaches `at-rule-no-unknown` about it and stops there.

- **Every recorded answer reaches the plan.** A second list in `run/cli` rebuilt `Answers` from a parsed
  config field by field, and dropped in silence any answer it had not been taught about: `surfaces` shipped
  that way, and a devtools-panel project came back replanned as a popup-and-background one. `LintelConfig
  extends Answers`, so the conversion is gone and `parseLintelConfig` is the one list. It refuses an
  unknown property by name, which is what the "No JavaScript output" guard always rested on.

## 1.4.4

### Added

- **`unknown` is granted for a caught value.** `catch` binds `unknown` by language rule under
  `useUnknownInCatchVariables`, so a single-argument helper turning a throw into something readable,
  `(error: unknown): string`, has no other parameter type available. The floor blocked it, which left
  a project holding one exempting the whole file and hiding every other violation in it along with it.

  Held to the tightest reading that still covers the case: the whole parameter list must be one
  argument named for a throw (`error`, `cause`, `reason`). A second parameter means the function is
  doing something else and its `unknown` is load-bearing, which the tests pin. This is the only
  carve-out keyed on a name rather than a shape, because TypeScript gives a caught value no type of
  its own to key on, and `type-standards.md` says so where it grants it.

  An implicit `catch (error)` was never affected: it carries no annotation, so there is nothing to match.

## 1.4.3

### Fixed

- **`sync` reconciles dependencies.** `package.json` is a merged artifact now, for the reason `.gitignore` and
  `pnpm-workspace.yaml` were converted in 1.3.2: it was written by a pipeline stage, `sync` writes artifacts, so a
  dependency a release added to a layer reached every new project and no existing one. Two of three reference
  migrations had to add plugins by hand that their own recorded answers already implied. The merge is
  `patchPackageJson`, unchanged, so nothing a project declared is dropped and both routes write the same file.
- **The end-to-end suite retries `ERR_PNPM_NO_MATCHING_VERSION`, and nothing else.** A scaffolder pins the version it
  just saw, so a run starting around an upstream release asks for something not yet propagated: `create astro` wrote
  `astro: ^7.2.2` and the install failed 33 seconds before that version existed, failing the 1.4.1 release for a
  reason that had nothing to do with the code. Every other install failure still fails the suite, because a broken
  generated project is what it is there to find.

## 1.4.2

### Fixed

- **A hosted extension gets its framework's JSX settings.** `webextension` with `hostedFramework`
  wired the Vite plugin and the dependencies and then never told TypeScript what the templates were,
  so the emitted `tsconfig.json` carried no `jsx` and no `jsxImportSource` and every `.tsx` file in
  the project failed to compile. Migrating a real Solid extension hit 213 `TS17004` and 245
  `TS7026`, and the 237 `no-unsafe-*` findings behind those were all downstream of it: with no JSX
  types every expression degrades to `error`.

  `FrameworkParts` gains `jsx`, which is `react-jsx` for React and `preserve` for Solid and absent
  for the two single-file-component frameworks, since they have no JSX to describe. A host with no
  framework still has none, so this is an addition rather than an override. Astro is untouched: it
  extends `astro/tsconfigs/strict` and needs the base's own `preserve` whichever framework it hosts.

## 1.4.1

### Added

- **`ignores` in `lintel.config.json`.** The other half of the gap `aliases` closed in 1.4.0, found by
  migrating the third reference repo an hour later: `eslint.config.js` is emitted whole, so an ignore
  added there is gone on the next sync too.

  Deliberately not the place to name a build output. `base()` already ignores whatever `.gitignore`
  does, which covers every generated *directory* a project has by definition, and the migration
  confirmed that handled all but one entry. What is left is the case `.gitignore` cannot express: a
  generated file that is **committed**, which the repo in question has as a compat-data registry its
  CI regenerates and diffs. Nothing in `.gitignore` can name it, because the point of it is to be in
  git.

## 1.4.0

Four gaps three real migrations found, closed together rather than one per release.

### Added

- **`.github/workflows/ci.yml` is emitted.** Everything this CLI shipped was a gate that nothing ran:
  a project got `check`, the hooks and the whole lint surface, and no push exercised them. A
  reference repo renamed `check` and left its workflow calling the old name, so every push failed
  for two days while the project gated clean locally, and `sync` called it up to date because
  `.github/` was nobody's. The run command is derived from `buildScripts`, so the workflow cannot
  name a script `package.json` does not define. A project with more to run adds `deploy.yml` beside
  it; this file stays owned, which is what makes drift a `sync` diff instead of a red build.
- **`aliases` in `lintel.config.json`.** A project's own aliases, merged in after the standard set
  and reaching the ESLint config, the tsconfig paths and the import resolver together. `eslint.config.js`
  is emitted whole, so an alias added there was gone on the next sync, and a reference repo carrying
  nine of them could not adopt the standard at all.
- **`browsers` in `lintel.config.json`.** The stores a project packages for, which is more than one
  only where it ships to both. A second manifest is emitted per extra browser, named for it, because
  Chrome rejects `browser_specific_settings` and AMO requires the gecko id: the build makes one
  bundle and the packaging step swaps the manifest into it. Separate from `browser`, which still
  decides the background shape, the ambient types and the starter code.
- `workers/` is named in the extension's `repo-structure.md`, as the fourth realm beside the
  background, the content script and the page.

### Changed

- **`vite.config.ts`, `vitest.config.ts` and `astro.config.mjs` are birth-only.** What this CLI
  writes is a starting point every real project outgrows inside its first feature: one reference
  extension builds an IIFE bundle per content script plus a native messaging host, another builds a
  second mode for a preview page, and no answer reaches either shape. The emitted vitest excludes are
  the sharper half of it, naming `src/background/index.ts` and `src/typings/**`, which are this CLI's
  guesses at a layout rather than the entry points a project has.

  `preserve` alone was not enough, and the first attempt was wrong in a way the pipeline tests
  caught: a scaffolder writes its own `vite.config.ts` moments before stage 4, so preserving at birth
  handed a new project Vite's defaults instead of this standard's. `applyArtifact` now takes the
  freshness the pipeline already computes, which is exactly the question "is this directory
  scaffolder output". Nothing else changes, because no other preserved file exists yet at birth.

## 1.3.2

### Changed

- Three floors in `versions.ts` moved to what this workspace now installs: `@commitlint/cli` and
  `@commitlint/config-conventional` to `^21.2.2`, and `@eslint-react/eslint-plugin` to `^5.18.6`.
  The carets already admitted all three, so no generated project resolved differently; what changes
  is that the emitted `package.json` names the version the gate was actually run against. Nothing
  else in the table is behind: every other entry is either inside its own caret or held back on
  purpose, which is `typescript` at `~6.0.3` under the `typescript-eslint` peer ceiling,
  `@ngrx/signals` on the rc that peers Angular 22, and `@types/node` tracking the Node major in
  `engines`.

### Fixed

- **`sync` now applies the two merges, so a project that already exists gains what a release adds to
  them.** `.gitignore` and `pnpm-workspace.yaml` were written by a `create` pipeline stage rather than
  being artifacts, and `sync` only writes artifacts. The `peerDependencyRules` allowance shipped in
  1.2.0 therefore reached every new project and no existing one, despite that entry describing it as
  merged "so a project generated before this gains the block". Both are `merged` artifacts now, which
  is the shape `mergeStyleEntry` already used, so the two routes write the same set.

  Found by migrating a real project rather than by a test, and the test that codified the old
  behaviour is why it survived: it asserted neither file was an artifact, reading "a merge is the
  project's" from a list that already held a merge. It now asserts the opposite, and fails when either
  merge leaves the list.

## 1.3.1

### Changed

- The shipped agent rules carry what seventeen starter tests were carrying in comments. The
  `type-standards.md` this CLI ships says "No comments in test files. The test name carries the
  meaning", and its own starter tests did not hold to it. Four techniques became rules in
  `testing.react-native.md`, which is where they belonged: why `react-native` is proxied rather than
  spread, why a project's own re-export is the mock target, why `Platform.select` needs
  `resetModules` per platform, and why a `useSyncExternalStore` hook needs all three of its
  callbacks driven. That file also gains the test renderer's limits, and `testing.vue.md` gains the
  mount rule the Vue starter was demonstrating. A rule reaches every test a project writes; a
  comment reached one file.

  The rest folded into test names, which is what the standard asks for. No shipped starter test
  carries a comment now.
- `scripts/checkBannedPatterns.ts`, which every generated project receives, iterates with `for-of`
  rather than `forEach`. Same behaviour: the one place the callback used `return` to skip a line is
  now `continue`, which is what it always meant.

## 1.3.0

### Added

- The `webextension` target takes a **surfaces** answer, `popup`, `background` and `devtools-panel`,
  recorded as `surfaces`. It is the third axis on that one record, and it drives four things at once:
  what `manifest.json` names, which starter files exist, what the build needs a Rollup input for, and
  which entry shells the coverage gate excludes. Absent means the popup and background pair, which is
  the only shape this CLI wrote before the answer existed, so a `lintel.config.json` from then still
  describes its own project.

  It exists because a devtools-panel extension could not be expressed at all. The target assumed a
  background entry, wrote a starter for it, named it in the manifest and excluded it from coverage, so
  an extension that is only a devtools panel had no answer that described it.

  `manifest.json` is now emitted rather than copied from a template, since two axes reach it and a
  file per combination would be twelve templates holding one shape between them. It is still written
  at birth only and never re-synced. The two template files are gone, and so is the record's
  `birthTemplate` field, which nothing else used.

  The panel gets a Rollup input of its own, which is the part that is not obvious: `crx` derives its
  inputs from the manifest, and the manifest names the devtools *page*, whose only job is to call
  `devtools.panels.create` with the panel's URL at runtime. Checked against the crx documentation
  rather than assumed, and covered by an end-to-end case that builds both pages for real.

### Fixed

- A recorded answer that this CLI's own argv path did not know was dropped when replanning. `answersIn`
  rebuilds `Answers` field by field, deliberately, so an answer an older config carries cannot survive
  into a plan; the cost is that a new answer has to be listed there too, and `surfaces` was not, so
  `sync` on a devtools-panel project replanned it as a popup-and-background one. Only the end-to-end
  suite saw it. Now pinned by a test that reads the emitted `vite.config.ts` back.

## 1.2.0

### Added

- An **Astro** target, the ninth, scaffolded with `create astro --template minimal`. It hosts a UI framework through the
  same `hostedFramework` answer the extension target takes, from the same shared parts, so an island is React, Vue,
  Svelte or Solid and the integration (`@astrojs/react` and friends) comes with it. `astro.config.mjs` is emitted rather
  than `vite.config.ts`, because that file is where an Astro project's Vite options are read from, and Tailwind arrives
  through its `vite` key rather than as an integration, `@astrojs/tailwind` having been for Tailwind 3.

  Four things about it were found by running the scaffolder rather than by reading about it, and each is recorded beside
  the code: `esbuild` needs an `allowBuilds` entry or the first `pnpm install` aborts; the vitest config has to go
  through `getViteConfig` from `astro/config`, since there is no `vite.config.ts` to merge; that config needs a bare
  `import 'vitest/config'` for the type augmentation that makes `test` a legal key, without which `astro check` rejects
  it; and the minimal starter is one `.astro` page, so a fresh project had no measurable source and failed the coverage
  gate on `0/0` until a `lib/utils/` pair was shipped with it. That pair is also the smallest demonstration of the rule
  a template cannot teach: `.astro` files are not unit-testable, so logic belongs in `lib/`.

- The `webextension` target takes a **browser**, `chrome` or `firefox`, asked only for that target and
  recorded as `browser` in `lintel.config.json`. Firefox gets an event-page manifest with
  `browser_specific_settings.gecko`, `@types/firefox-webext-browser`, and `web-ext` with a `start`
  script that runs the build in a real Firefox. `crx` stays the bundler for both: its own manifest
  type carries both background forms, so the axis changes the manifest and the types and nothing
  else. A config written before this field defaults to `chrome`, which is what the target assumed.
  The background starter and its test come from the browser too: those types declare `browser.*` and
  no `chrome`, and Firefox's install-details type requires `temporary`, so neither file could be
  shared. An end-to-end run caught it, a Firefox project having shipped Chrome's entry and linted as
  three findings on a global its own types never declared.
- The `webextension` target optionally **hosts a UI framework**, `react`, `vue`, `svelte` or `solid`,
  recorded as `hostedFramework`. The framework's Vite plugin runs ahead of `crx`, its ESLint layer
  lints it, its component extension marks a component in place of the directory rule, and its runtime
  package and testing library are installed, since a vanilla scaffold has none of them. Absent means
  the plain-TypeScript extension that was the only shape before. This is what makes a Solid
  extension expressible; DESIGN.md carries the reasoning.
- `targets/utils/frameworkUtils.ts` holds what a UI framework contributes to a target that hosts one
  rather than is one, so the next host composes the same four frameworks without a second copy.
- The emitted `eslint.config.js` names `tailwindEntryPoint` when the tailwind library is answered, read from a new
  `styleEntry` on the target record: the stylesheet that target's own scaffolder writes and already wires. Verified
  against each published template rather than assumed, which is why Svelte has none: `sv create --template minimal`
  ships no stylesheet, so there is no path to name. See the `@linteljs/eslint-config` entry for what the setting buys.
- The emitted `pnpm-workspace.yaml` carries a `peerDependencyRules.allowedVersions` block for the plugins whose own
  `eslint` peer range closes before the major this CLI installs, so a generated project does not meet four warnings on
  its first install. Four qualify, checked against the installed ranges rather than assumed: `eslint-config-next`
  bundles `eslint-plugin-react`, `eslint-plugin-jsx-a11y` and `eslint-plugin-import`, all capped at 9 and all
  registered by the next layer, and the solid layer loads `eslint-plugin-solid`, capped the same way. A plugin stating
  an open range (`>=8.57.0`, `>=9.0.0`) needs nothing and is absent. Read off the dependencies a project installs, so
  an extension or Astro site hosting Solid is covered without naming the combination. Scoped with `>` so the allowance
  reaches only the dependent named, and merged rather than emitted, so a project generated before this gains the block
  while keeping its own `allowBuilds` list and any rule it widened by hand.

### Changed

- A Next project installs `@next/eslint-plugin-next` instead of `eslint-config-next`, following the layer that no longer
  wraps it, and `eslint-plugin-jsx-a11y` is installed by every target whose layers load it rather than by Next alone:
  React, Next and React Native through `react()`, Solid through `solid()`, and an extension hosting either. See the
  `@linteljs/eslint-config` entry. The emitted `peerDependencyRules` block changes with it: `eslint-plugin-react` and
  `eslint-plugin-import` are no longer in a generated project's tree, and the accessibility allowance now appears
  wherever that plugin does.
- A glob carrying a backslash is emitted as `String.raw`, so the folder-naming pattern in `eslint.config.js` reads as
  the pattern it is instead of a doubled copy of it. The escaping was correct either way; this stops the reader
  counting backslashes to work out which.
- `VERSIONS` moves forward to the current release of every entry that had one: `@analogjs/vite-plugin-angular`,
  `@eslint-react/eslint-plugin`, `@vitest/eslint-plugin`, `eslint`, `happy-dom`, `stylelint-config-recess-order` and
  `svelte-check`, plus the manager pins for pnpm, npm, yarn and bun. Four entries deliberately did not move, because
  the `latest` tag is the wrong answer for each: `@ngrx/signals` stays on the 22 rc, since stable 21 peers Angular 21
  while `ng new` writes 22; `@types/node` stays on 24, the LTS `engines.node` already requires; `yarn` stays on the 4
  line, since the `yarn` package's `latest` is still classic 1.x; and `typescript` stays on 6.0, below.
- `typescript` is `~6.0.3`, not `^6.0.3`. `typescript-eslint` peers `>=4.8.4 <6.1.0`, so a caret admits a 6.1 the
  type-aware layer would refuse the moment one publishes. `@linteljs/eslint-config` already pins the tilde in its own
  devDependencies, so this only makes a generated project agree with the layer it installs. The 6.x line ends at
  6.0.3 today (`latest` is already on 7), so it costs a project nothing now.

### Fixed

- **A site or extension hosting Vue could not be generated at all.** `@vitejs/plugin-vue` is on the hosted-Vue
  dependency list and had no entry in the version table, so `astro` and `webextension` hosting Vue threw before writing
  a file. No case reached that combination: the framework axis was exercised with Solid. The table has the entry, the
  composition test now runs over every combination of the browser and hosted-framework answers rather than the
  defaults, and the end-to-end suite has an `astro hosting vue` case.
- Svelte projects gate on accessibility. `svelte-check` now runs with `--fail-on-warnings`, because Svelte reports
  accessibility from the compiler as a warning and `svelte-check` exits 0 on warnings: an `<img>` with no `alt` printed
  `a11y_missing_attribute` and `pnpm check` passed. `eslint-plugin-svelte` v3 carries no accessibility rule to catch it
  instead, so without the flag the category was ungated. The flag also makes every other compiler warning count.
- Vue projects install `eslint-plugin-vuejs-accessibility`, which the `vue()` layer now loads. Without it the first
  `eslint .` in a generated Vue project would die on `ERR_MODULE_NOT_FOUND`.
- The `tailwind` answer now actually wires Tailwind. Installing `tailwindcss`, calling the Vite plugin,
  extending stylelint and enabling the ESLint layer generates nothing on its own: a utility class only
  exists because some CSS file imported the framework, and only `create-next-app --tailwind` wrote that
  line, so on the other seven targets Tailwind was configured and inert. Each target now names the
  stylesheet its own scaffolder writes and wires, verified against every published template, and the
  Tailwind import is merged into it. Svelte is the one that ships no stylesheet at all, so there
  `src/app.css` is created and imported from `src/routes/+layout.svelte`, SvelteKit having no
  convention that loads it.
- `vitest.config.ts` declares `resolve: { tsconfigPaths: true }` on the targets that have no
  `vite.config.ts` to merge, which is Next and Angular. The merge branch inherited it from the vite
  config and React Native's platform projects declare their own, so only the standalone branch went
  without, and every alias this CLI writes into `tsconfig.json` was unresolvable from a test there.
  A generated Next project could not import `@mocks/*` from a test at all, which is the alias the
  shipped test setup exists for. Measured on a real project: 27 of 36 suites failed on the import
  line, and all 36 pass after.
- `.agents/**` is ignored by the emitted `eslint.config.js`, the same as `.claude/**`. This CLI
  writes `.agents/plugins/marketplace.json` itself when the codex agent is answered, so the
  directory is one it knows about; ignoring the claude half and not the codex half failed a real
  project's `pnpm lint` on 82 findings in agent skill files that are not project source.

## 1.1.4

### Fixed

- `.claude/settings.json` is merged rather than emitted. A project keeps its own hooks, its own
  plugins and top-level keys this CLI has never heard of, while the plugins answer still decides
  `enabledPlugins` and `extraKnownMarketplaces`. A real project lost `includeCoAuthoredBy`, a
  PreToolUse hook and two unrelated plugins to one sync before this.
- `sync --force` and the repair pass wrote a generated file straight through `writeFile`, so a
  project with a symbolic link sitting where a generated file belongs got overwritten through it,
  silently taking out whatever the link pointed at. Only `create`'s own pipeline refused this,
  with `O_NOFOLLOW`. `sync`, `repair` and `rewrite` now share that same write, so every path that
  puts a generated file on disk refuses a symlink target the same way.
- `@types/node` is `^24.13.3`, the LTS the `engines` field already requires, rather than `^26`.
- `scripts/typecheckStaged.ts` reads its override by destructuring. Under the version above,
  `env['TYPECHECK_COMMAND']` reads as index-signature access to `dot-notation`, and the dot form it
  asks for is refused by a tsconfig setting `noPropertyAccessFromIndexSignature`.

### Changed

- The test setup is `__mocks__/setupTests.tsx` on React, Next and React Native, where a setup that
  renders anything needs JSX. Vue, Svelte, Angular, Solid and the extension target keep `.ts`. A
  project that already holds one spelling keeps it, config included: the emitted `vitest.config.ts`
  points at the file that is there rather than the one this version would write.
- The README leads with how to run the thing on any runner. It read as pnpm-only, because the
  first line was a bare `pnpm create` and the table of alternatives sat far below it. The target
  table now also says what it never did: each scaffolder is invoked through the package manager
  you answered with, so an npm project scaffolds through `npm create`.

## 1.1.3

No change to this package. The three versions move together, so this carries the import-sort fix in
`@linteljs/eslint-config`.

## 1.1.2

### Changed

- The README documents every way to launch the CLI rather than one, with both the `create`
  shorthand and the `dlx` form for pnpm, npm, Yarn 2+ and Bun. Yarn 1 is called out as the one that
  does not work: its `yarn create @scope` looks for a binary named `create`, and this package's is
  `create-linteljs`, so it installs and then fails to launch. Use `npx` there.

No change to the CLI itself.

## 1.1.1

The same code as 1.1.0. That version was published by hand to bootstrap npm trusted publishing,
which cannot be registered for a package that does not exist yet; this is the first release to go
out through the pipeline that will publish every version after it. Nothing in the package changed,
and the 1.1.0 entry below is the one to read.

## 1.1.0

### Added

- Answers are recorded in `lintel.config.json` at the project root, under a versioned schema, and
  are what `sync` and a second `--skip-scaffold` run read. It replaces the `lintel` field in
  `package.json`, which is no longer written.
- A `sync` command: re-emits what the recorded answers imply and reports each file as unchanged,
  changed, missing or obsolete, writing nothing until `--force`. A file that a changed answer made
  obsolete is removed rather than left behind.
- Two questions about coding agents: which ones the project is for (Claude Code, Codex, at least
  one) and which plugins to declare. Both hosts read one `plugins/linteljs/`, with a manifest each.
- A project name question, asked first and validated as npm would validate it. It is skipped when
  the name came in as an argument, and with `--skip-scaffold`, where the directory is already named.
- A state store answer, resolved per target: Zustand for React, Next.js and React Native,
  `@ngrx/signals` for Angular, and Pinia for Vue, whose `--pinia` flag now follows the answer
  instead of always being passed. Solid and Svelte are never asked: their stores ship inside the
  framework, and the repo-structure rules now say so.
- A Tailwind answer now also wires class linting: `eslint-plugin-better-tailwindcss` joins the
  toolchain and the emitted config loads the `tailwind` layer.
- The shipped test setup grew real content: TanStack Query test defaults when that library is
  chosen, and inert `useNavigate` stand-ins for react-router and TanStack Router on the targets
  that could adopt them. The file is preserved on sync, since projects add their own mocks to it.
- React Native projects get a real `build`: `expo export --platform web`, made possible by moving
  the route-directory starter tests out of `src/app/`, where expo-router treated them as routes.

### Changed

- The questionnaire is asked over `@clack/prompts`, this package's first runtime dependency: arrow
  keys and checkboxes rather than typed text, a hint on every option, and each product spelled the
  way its own documentation spells it. The state store question is a radio over the target's store
  plus None, and the agents question is a checkbox list requiring at least one.
- Ctrl+C during the questionnaire exits 130 having written nothing, and says so plainly. A run with
  no terminal at all is still refused, separately, with advice to pass `--yes`.
- TypeScript only. The language question is gone, every scaffolder is invoked with its TypeScript
  flags, and running against a project that recorded `typescript: false` refuses with a clear
  message rather than silently converting it.
- The filename policy was rebuilt per framework: components may be anything but camelCase, tests
  and specs follow the file they cover instead of carrying a rule of their own, declaration files
  take kebab-case or camelCase, Angular is kebab-case throughout, and router-owned directories
  are exempt from the script rule.
- The pre-commit hook pins its lint-staged config, so a nested config file can no longer hijack
  staged files in a monorepo.

## 1.0.4

First published release.

### Added

- Scaffold any of eight targets with the framework's own official generator, then apply the
  shared standard on top: ESLint config, tsconfig, stylelint, git hooks, test setup and agent
  rules. Targets: React, Next.js, Vue, Svelte, Solid, Angular, React Native through Expo, and
  Manifest V3 browser extensions.
- `@linteljs/create sync` re-applies the files that cannot arrive through an npm update. It shows a
  diff first and never overwrites a file you edited.
- A `typeSafety` answer that picks the banned-pattern floor: `strict` bans every escape hatch,
  while `relaxed` allows a double cast and `eslint-disable` and ships a `CustomTypes` helper for
  common payload shapes.
