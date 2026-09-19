# Design

Why linteljs exists, and the decisions that are not visible in the code.

Everything else lives with the thing it describes: the layers are documented in
`packages/eslint-config/README.md`, the pipeline in `packages/create/README.md`, and each
non-obvious mechanism in a comment beside the code that needed it. A design document that
restates code goes stale and then misleads.

## Contents

For a consumer deciding whether to use linteljs: The problem, The goal, Non-goals.
For a rule or target designer: One item per line, object literals included; Duplicate JSX props; Targets; Project structure; Libraries and routers; Package manager files; Comments.
For work on this workspace itself: One version per shared dependency; Two artifact lists; What a project owns; Renaming a generated agent file; React Native build; The end-to-end matrix; Releasing; Workspace lint exemptions.

## The problem

Lint, type, test and agent standards get copied by hand into each new project. The copies drift.

`compatlens/eslint.config.js` (166 lines) and `self-portfolio/eslint.config.js` (200 lines)
were roughly 85% identical: the same `@stylistic` overrides, the same five `import-x` rules,
the same `unused-imports` block, the same sort groups. Comments included, word for word.

They had already diverged in a way that silently disabled a rule:

| setting | self-portfolio | compatlens | `importX.flatConfigs.typescript` |
| --- | --- | --- | --- |
| `import-x/parsers` | absent, so `no-cycle` never fires | `.ts`, `.tsx` only | `.ts`, `.tsx`, `.cts`, `.mts` |
| `import-x/extensions` | absent | absent | 8 extensions |
| `import-x/external-module-folders` | absent | absent | present |

The comment explaining why `import-x/parsers` is required existed only in the repo that had it.
One repo was fixed and the other was not, and nothing could have told you which.

## The goal

One command produces a new project with the standard already applied. One command re-applies it
to a project that already exists. The shared rules live in a published package, so a fix reaches
every project on update instead of being re-copied into some of them.

## Non-goals

These are decisions, not omissions. Re-adding any of them needs an argument.

- **No forked framework templates.** Official scaffolders are shelled out to, never
  reimplemented, with the flags that make them non-interactive and match what later stages emit.
- **Latest version of each framework only.** No version matrix.
- **No JavaScript output.** `@linteljs/create` generates TypeScript, and there is no question about it.
  The standard it ships is a typed one end to end: `type-standards.md` is written against a
  compiler, `scripts/typecheckStaged.ts` is a gate on every commit, `tsc --noEmit` is a leg of
  `check`, and the `.d.ts` naming key exists because declarations do. A JavaScript answer switched
  all of that off and shipped a project holding itself to a lesser standard under the same name,
  which is the drift this repo exists to stop, not a second supported shape. What it cost was one
  spelling per scaffolder (`--template react-ts`, `--ts`, `--types ts`) and a language branch
  through the naming policy, the emitters, the prompts and the argv of four generators.

  A project that recorded `typescript: false` under an older version is refused, not converted:
  `parseLinteljsConfig` rejects a property it does not know, naming it, so both routes that plan from a
  recorded block (`sync`, and `create --skip-scaffold`) stop before writing. Converting silently would
  rewrite that project's `eslint.config.js`, `tsconfig.json` and scripts as TypeScript over source that
  is not, which is not recoverable without git.

  It is the parser that refuses, and deliberately not a second list in `run/cli`. That one rebuilt
  `Answers` field by field and dropped in silence any answer it did not name, which is how a
  devtools-panel project came to be replanned as a popup one. One list that throws beats two where
  the quieter one wins.
- **No Prettier.** `@stylistic/eslint-plugin` owns formatting as lint rules. One tool, one config,
  no argument about who owns whitespace.
- **No Stryker, no MSW** by default. Both are worth adding to a project that needs them, and
  neither earns its setup cost in an empty one.
- **No Emotion or styled-components.** That was one project's choice, never a standard.
- **No `*Utils` filename suffix in a generated project.** This workspace uses it and enforces it
  on its own `src/utils/` directories, and that stops at the workspace edge. `repo-structure.*.md`
  already puts every shared helper inside a folder named `utils/`, at `lib/utils/` or beside the
  one page that needs it, so the import site reads `./utils/format` and the suffix would make it
  `./utils/formatUtils` for no information gained. Every other entry in the emitted `naming` map
  answers a question the tooling asks: PascalCase for components, camelCase for modules, a spec
  matching the file it tests. This one answers a question of taste, and by the Emotion line above,
  one project's choice is not a standard.
- **A layer never weakens `base`.** Framework layers add rules for their framework. Every
  exemption that survives carries a measurement showing the tooling forced it: a plugin
  double-reporting one defect, a framework owning a filename. "It would be noisy otherwise" is
  not a reason.
- **No forked extension framework.** The `webextension` target is `create-vite --template
  vanilla-ts` plus a manifest, a background entry and `@crxjs/vite-plugin`, which reads the manifest
  and builds each surface the way the browser loads it. WXT and `vite-plugin-web-extension` both
  work, and both bring a project layout of their own that would sit on top of the one
  `repo-structure.webextension.md` describes. The manifest ships with empty `permissions` and
  `host_permissions`: those are the project's security surface, and a template guessing at them is
  how an extension ends up asking for more than it uses.
- **The extension target has three axes, and none is a second target.** A `browser`
  (`chrome`/`firefox`), a surface list, and an optional hosted UI framework move one record rather
  than forking it. All three were measured against the two reference projects, `compatlens` and
  `claude-firefox`.

  The browser decides the manifest shape and the ambient types, **not the bundler**: `crx` builds
  for both, and its own manifest type carries the `service_worker` and the `scripts` background
  forms plus `browser_specific_settings.gecko`, so the alternative (a hand-rolled multi-entry
  `build.rollupOptions.input`) buys nothing and costs hashed filenames the manifest cannot
  reference. Firefox additionally takes `web-ext`, which runs the build in a real Firefox, lints the
  manifest the way AMO will, and packages the upload; it is not a bundler, so `crx` still is.

  It also decides the background starter, which is the one place the axis reaches into shipped code.
  `@types/firefox-webext-browser` declares `browser.*` and no `chrome`, and its install-details type
  requires `temporary`, so the entry, its handler and the handler's test are per browser rather than
  shared. That is not a style preference between two spellings: Chrome's starter under Firefox's
  types lints as findings on an undeclared global, which is how the end-to-end suite found it.

  **The surfaces decide what the extension is.** `popup`, `background` and `devtools-panel`, and the
  answer drives four things at once: what the manifest names, which starter files exist, what the
  build needs an input for, and which entry shells coverage excludes. Absent means the popup and
  background pair, which is the only shape this CLI wrote before the answer existed, so a
  `linteljs.config.json` from then still describes its own project.

  It exists because `compatlens` could not be expressed without it. That extension is a devtools
  panel and nothing else: no background, no popup, `devtools_page` its only entry. The target assumed
  a background entry, wrote a starter for it, named it in the manifest and excluded it from coverage,
  so the closest available answer described a different extension. The alternative was to reshape the
  project to the tool, which is the wrong direction: a devtools-only extension is a normal extension,
  not a deviation from one.

  The manifest is therefore **emitted rather than copied from a template**. Two axes reach it and a
  file per combination would be twelve templates holding one shape between them. It stays birth-only:
  a real extension's manifest is its permissions, icons and store metadata within a week.

  A panel needs a Rollup input of its own, which is the one thing about this that is not obvious.
  `crx` derives its inputs from the manifest, and the manifest names the *devtools page*, not the
  panel: that page's only job is to call `devtools.panels.create` with the panel's URL at runtime.
  Confirmed against the crx documentation, which says an extra page goes in
  `build.rollupOptions.input`, and that is what the target's `viteInputs` emits.

  The hosted framework decides what a component is, which Vite plugin runs ahead of `crx`, and which
  layer lints it, leaving the manifest and the surface layout alone. It is composed from
  `targets/utils/frameworkUtils.ts` rather than read off the framework's own record, because those
  records are app-shaped: their `scaffold`, `routeUnit`, `typecheck` and aliases describe a
  standalone app. A host needs the narrow set that actually varies, which is what that file holds.
  Svelte's entry there is the bare `@sveltejs/vite-plugin-svelte`, not `sveltekit()`, since a host
  owns its own entry.

  This is also what makes `compatlens` expressible, which the "Targets" section below has always
  claimed it was: a Solid extension is `webextension` plus `hostedFramework: 'solid'`, and before
  the axis existed it was neither the `solid` target (a Vite SPA with no manifest) nor the
  `webextension` one (vanilla, with no framework layer).
- **No bespoke React Native ESLint layer.** The target composes `framework: 'react'`, because it
  is React. `eslint-plugin-react-native` peers at `eslint ^9` and would cap `@linteljs/eslint-config`,
  which peers `>=9` and develops on 10. `eslint-config-expo` bundles its own `@typescript-eslint`,
  `eslint-plugin-import`, `eslint-plugin-react` and `react-hooks`, every one colliding with a layer
  `base()` already registers, and undoing that is the surgery `next()` used to carry for the same
  reason. What is given up is the RN-only style rules (`no-inline-styles`, `no-raw-text`); what is
  kept is one ESLint major and no plugin fighting `base()`.
- **The plugin, not the framework's config.** `next()` registers `@next/eslint-plugin-next` rather
  than wrapping `eslint-config-next`, for the reason above read forwards: that config bundles
  `eslint-plugin-react`, `react-hooks`, `eslint-plugin-import` and `jsx-a11y` and enables a slice of
  each, and three of the four are ground the layers already cover with newer plugins. Wrapping it
  cost surgery on its flat entries and forty lines that read the installed React version off disk to
  pin `settings.react.version`, because its bundled `eslint-plugin-react` calls
  `context.getFilename()`, removed in ESLint 10, and every `react/*` rule threw at load without it.
  Taking the plugin alone keeps the 22 `@next/next` rules that are the point and deletes all of that.
  Three plugins left the dependency graph with it, and three peer allowances went with them.

  `next()` now carries Next and nothing else. A Next project gets what a React project gets by
  stacking on `react()`, and the only accessibility detail left here is that `next/image` renders an
  `img`, which `alt-text` has to be told.
- **What git ignores, ESLint ignores.** Flat config reads no `.gitignore`, so a build output had to
  be named twice: once for git and once in `ignores`. That is a copy, and copies drift, which is the
  argument this whole document opens with. Two misses came from it before `base()` started reading
  the file: an agent host's own directory, and a repo whose second output directory was being linted
  because only the first was guessed at. The conversion is `includeIgnoreFile` from `eslint/config`,
  not a hand-written glob, because gitignore semantics (negation, anchoring, directory-only patterns)
  are easy to get subtly wrong and are not this package's problem to own. The hardcoded entries stay:
  a project may not gitignore `dist/`, and `plugins/linteljs/` is committed on purpose.
- **Accessibility belongs to JSX, not to a framework.** `jsx-a11y-x` used to reach Next projects only,
  by accident, because `eslint-config-next` bundled it and enabled six of its rules at `warn`. An
  element with no accessible name is the same defect in a Vite React app, in a Solid app and in an
  extension, so `react()` and `solid()` enable the plugin's own `recommended` preset and every target
  composing them installs it. The preset is taken whole rather than hand-picked, the way every other
  preset in these layers arrives: six rules chosen by a framework's config is that framework's floor,
  not a standard. Measured before landing: 31 newly error-level rules against a real Next project,
  zero new findings.
- **The accessibility plugin is the `-x` fork, and that is a bun decision.** `eslint-plugin-jsx-a11y`
  last published in October 2024 with its `eslint` peer capped at 9. It runs fine on 10; the metadata
  is stale. npm waves it through with `legacy-peer-deps`, pnpm with `peerDependencyRules` and yarn
  with `logFilters`, but bun has no equivalent: measured against a real install, `.npmrc`
  `legacy-peer-deps`, `bunfig.toml` `logLevel = "error"`, `install.peer = false`, `--omit=peer`,
  `--silent`, a root `peerDependenciesMeta` and even a `bun patch` of the plugin's own range all
  still print `warn: incorrect peer dependency`, because bun reads the range from the registry
  manifest rather than from disk. So the layers take `eslint-plugin-jsx-a11y-x`, whose range admits
  10. The cost is the rule prefix: every id is `jsx-a11y-x/*`, which breaks a disable comment written
  against the old one. `eslint-plugin-astro` is the exception and keeps the original, because it
  loads it by literal name and prefixes that plugin's own ids with `astro/`; aliasing the fork in
  would emit `astro/jsx-a11y-x/*` ids it never registers, and ESLint would fail on every one. That is
  the single `eslint-plugin-jsx-a11y>eslint` allowance the emitted `pnpm-workspace.yaml` still names.
- **The template frameworks get the same floor, by three different mechanisms.** Vue, Svelte and
  Angular render templates rather than JSX, so `jsx-a11y-x` cannot see them. Each is covered now, and
  the mechanism differs per framework because what each ecosystem ships differs:

  | framework | mechanism | why not the others |
  | --- | --- | --- |
  | Vue | `eslint-plugin-vuejs-accessibility`, `flat/recommended`, 20 rules | `eslint-plugin-vue` carries no accessibility rule of its own |
  | Angular | `angular-eslint`'s `templateAccessibility`, 11 rules | `templateRecommended` is four rules and none of them is about accessibility |
  | Svelte | `svelte-check --fail-on-warnings` | `eslint-plugin-svelte` v3 ships **zero** a11y rules; the compiler owns them |

  Svelte is the one worth writing down, because the obvious answer is wrong. Its a11y rules moved
  out of the ESLint plugin and into the compiler, which reports them as *warnings*, and
  `svelte-check` exits 0 on a warning. Measured: an `<img>` with no `alt` printed
  `a11y_missing_attribute` and the gate passed, exit 0; with the flag, exit 1. So Svelte's
  accessibility gate is a typecheck flag rather than a lint rule, and a project that drops the flag
  silently loses the whole category.

  Vue's preset is ordered *ahead* of `@linteljs/vue`, not after it. The preset's own second entry
  sets `languageOptions.parser` for `**/*.vue`, and placed later it lands on the same glob and takes
  the `parserOptions` carrying `projectService` with it.
- **Vitest for React Native too.** One runner across all nine targets, so `testing` is a yes or
  no rather than a choice of runner. It ran on `jest-expo` first, and that reached 71% coverage
  and stopped: three of the template's modules exist only as `.web`, a native run never loads
  them, and jest-expo's own web project does not survive Reanimated's web build. Two vitest
  projects with different `resolve.extensions` do load both, and `babel-preset-expo` is out of the
  path, so `Platform.OS` and `process.env.EXPO_OS` stay runtime reads instead of literals baked in
  at transform time. That is the difference between 71% and 100%.

  The cost is `@srsholmes/vitest-react-native`, at 0.1.x and one maintainer, in the path of the
  gate. It is derived from work by a Vitest maintainer and has CI, and the alternative was a
  target that cannot meet the bar the other seven do. Revisit if it goes unmaintained: the way
  back is `jest-expo` and a lower ceiling, not a lower threshold.
- **No bundler choice for Next.** `create-next-app` made Turbopack unconditional and dropped the
  flag that declined it; `--rspack` is the one alternative. Neither is passed. A generated project
  takes the framework's default, which is the same position every other target is in.

## One item per line, object literals included

`@linteljs/eslint-plugin` shipped four newline-per-item rules and the config enabled none for
object literals, so a four-property literal stayed on one line while the identical destructuring
pattern was split by `destructuring-property-newline`. At 120 columns `max-len` never reached it
either, which is how `thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 }`
passed unchanged. A reader who has internalised one of the four rules expects the fifth case to
behave the same way, and the asymmetry read as an oversight because that is what it was.

`base` now enables `@stylistic/object-property-newline` with `allowAllPropertiesOnSameLine: false`,
paired with `@stylistic/object-curly-newline` scoped to `ObjectExpression`. The pairing is not
decoration: `object-property-newline` alone fixes to a hanging brace on the first and last property
lines, which is worse than the shape it replaced. The scope is what keeps it off imports, exports
and destructuring patterns, which the four `@linteljs` rules already own and would otherwise fight.

## Duplicate JSX props: this plugin's rule, not a dependency

A component with the same prop twice passes lint, typecheck and the type floor. React keeps the
last occurrence and drops the rest without a word, so two overlapping edits left `usage={null}
nowMs={0}` twice on eight call sites in one file with every gate green. Had the two values
differed, the first would have been discarded silently.

The config enables ten duplicate-related rules and none covers JSX attributes.
`@eslint-react/eslint-plugin` ships `no-duplicate-key` and no props equivalent: checked against
5.18.6, which is the latest published version, and none of its 140 rules is about duplicate
attributes. The rule that does catch it, `react/jsx-no-duplicate-props`, lives in
`eslint-plugin-react`, which this config does not install.

So `@linteljs/no-duplicate-jsx-props` is roughly sixty lines here rather than a dependency every
React consumer installs for one rule, and rather than the hundred-odd other rules that dependency
would arrive with and the config would then have to switch off. Two details in it are the ones
most likely to be questioned later:

- **Report-only, no fixer.** Deleting either occurrence guesses which value the author meant, and
  the two values usually differ. A fixer that guesses is worse than a report that does not.
- **A spread resets the count.** `{...props}` can override every explicit prop before it and be
  overridden by every explicit prop after it, which is the documented way to offer a default, so
  the same name on either side of a spread is deliberate rather than a repeat. Three occurrences
  with a spread between the first two still report the third.

It is not in `recommended`, because the plugin ships no JSX layer of its own. The React and Solid
layers of `@linteljs/eslint-config` turn it on, and those are the two that render JSX; Vue and
Svelte templates are not JSX and take nothing.

## Targets

Nine: React, Next.js, Vue, Svelte, Solid, Angular, Astro, React Native through Expo, and a
Manifest V3 browser extension, for which `compatlens` is the reference.

Two of the nine host a UI framework rather than being one. Astro renders `.astro` templates and
hydrates islands; the extension target renders whatever its surfaces are written in. Both take the
same `hostedFramework` answer, from the same `targets/utils/frameworkUtils.ts`, so adding a framework
to one adds it to both.

## Project structure

The shape every generated project gets, and the reasoning the per-target
`repo-structure.*.md` files do not carry.

```
src/
  config/                constants, envVars.ts
  typings/               ambient .d.ts only
  assets/  styles/
  components/
    ui/                  primitives
    features/            reusable domain features
  lib/
    store/               universal
    utils/               universal
    services/            domain logic, may never touch HTTP
    providers/           context / DI providers
    apis/                Zod only
    hooks/               conditional, framework-named
  <route unit>/          framework-owned
```

`partials/` is a private slot, allowed inside any page or feature folder, never nested.

`services/` and `apis/` are distinct: `apis/` holds endpoint definitions and Zod
request/response schemas, `services/` holds domain logic with no HTTP dependency.

`src/components/{ui,features}/` applies to every target including the extension, where a
component is a DOM-building module or a custom element rather than a framework component.

### Per framework

| target | route unit | hooks slot | notes |
| --- | --- | --- | --- |
| React | `src/pages/<kebab>/{Name}Page.tsx` | `lib/hooks/` `use*` | closest to the spine |
| Next.js | `src/app/` | `lib/hooks/` `use*` | adds `lib/server/` for `server-only` modules and `src/content/` for static data. No `src/pages/`, which is the dead Pages Router |
| Vue | `src/views/` | `lib/composables/` | with the store answer, `lib/store/` holds Pinia stores, overriding the `src/stores` convention |
| Svelte | `src/routes/` | `lib/hooks/` | `$lib` already points at `src/lib`. SvelteKit's reserved `src/hooks.server.ts` sits at `src/` root, so no clash. Components stay at `src/components/` |
| Solid | `src/pages/` | `lib/primitives/` `create*` | not hooks, because the `use` prefix is wrong in Solid |
| Angular | `src/app/` | `lib/services/`, DI replaces hooks | `src/config/` replaces `src/environments/` |
| React Native (Expo) | `src/app/`, owned by expo-router | `src/hooks/` `use*` | `starterRenames` moves the template's kebab-case components onto the shared convention. Vitest, per the non-goal above. There is CSS: `src/global.css` and one module |
| Web Extension (MV3) | `manifest.json`, which declares every surface | `lib/` directly | `index.html` is the popup; `src/background/` holds the service worker. `src/content-scripts/`, `src/devtools/`, `src/panel/` as surfaces are added; `lib/model/` for domain entities. No `lib/store/` or `lib/providers/`, so neither is aliased |

Extension entry HTML stays flat at the repo root, because the browser resolves `devtools_page` and
panel pages against the extension root, so a nested entry breaks the moment it moves.

### The state store answer

One yes/no question, default no: a fresh project earns a state library the day component state
stops being enough. It is asked only where a choice exists, carried as the `store` slot on the
target record, and a yes lands through one mechanism per target rather than a `switch` in an
emitter:

- **React, Next.js and React Native install Zustand** (`^5.0.14`), the React family's standalone
  store: 49.7M weekly downloads against `@reduxjs/toolkit`'s 26.2M, measured 2026-08-06.
- **Vue passes `--pinia` to `create-vue`**, which installs Pinia itself. The demo-store repair and
  its starter test both gate on the file existing, so a no leaves nothing behind, and the shipped
  `App.test.ts` touches no store so it serves both answers.
- **Angular installs `@ngrx/signals`**; the decision is measured below.
- **Solid and Svelte are not asked.** The store is the framework's own, `createStore` from
  `solid-js/store` and a `$state` rune in a `.svelte.ts` module (`svelte/store` remains for
  interop), so there is no dependency to choose and a question would change nothing. The
  repo-structure heads name the built-in instead.
- **The extension target is not asked** for one reason: an MV3 service worker is torn down between
  events, so in-memory store state dies with it and real state belongs in `chrome.storage`. Its
  layout has no `lib/store/` and never aliased `@store/*`.

The `@store/*` alias stays unconditional everywhere else, whatever the answer: like every alias in
the spine it names where cross-cutting state goes, and the directory appears with the first file
written into it.

#### Angular: `@ngrx/signals` over classic `@ngrx/store`

Measured 2026-08-06 to 2026-08-08:

- Both live in the NgRx monorepo on one release train (both published 21.1.1 the same day, both
  sit at 22.0.0-rc.0), so maintenance and Angular-major tracking separate nothing.
- npm activity: `@ngrx/store` at 981k weekly downloads, `@ngrx/signals` at 519k. The classic
  store's lead is a decade of installed base; SignalStore reached half of it in under three years.
- The model decides it. `ng new` on Angular 22 writes a standalone, signal-first app, and
  SignalStore is the NgRx API built for that model; the classic store's
  actions/reducers/effects/selectors is the RxJS-era shape, and ngrx.io's own signals guide is
  what positions SignalStore for signal-based apps.
- Version: NgRx stable (21.1.1) peers `@angular/core ^21.0.0` and does not admit the Angular 22
  that `@angular/cli@latest` scaffolds; `22.0.0-rc.0` peers `^22.0.0`. The shipped range is
  `^22.0.0-rc.0`, which resolves today and admits every stable 22.x the day it lands, so it
  self-heals on install. Both candidates sit in the same position here, so this chose the range,
  not the package.

### File naming

The policy is `packages/create/src/targets/naming.ts`, one entry per target. Every glob was
measured at authoring time against `micromatch@4.0.8`, which is what `check-file` matches with;
`naming.test.ts` pins the exact strings, and the end-to-end suite is what re-verifies match
behaviour against real scaffolds, so an edited glob needs a fresh probe before it lands. What
the globs cannot say for themselves:

- **A component file is anything but camelCase.** The rule is negative because the research came
  back empty: React, Solid and Svelte bind every naming rule to the identifier, never the file,
  so there is no upstream mandate to encode, and every file-based router owns spellings no
  positive convention accepts (`page`, `_layout`, `+page@(app)`, `[slug]`, `(tabs)`, `{-$id}`).
  A negative rule admits all of them without a router-sigil grammar, and still rejects the one
  thing the decision bans: a camelCase component.
- **Tests and specs carry no filename key; declarations carry their own.** A test mirrors its
  subject, the subject is already policed, and `check-file` applies every matching key rather
  than the most specific, so `App.test.ts` beside `App.vue` caught by the camelCase script rule
  could satisfy nothing. `.d.ts` files are excluded from the script key for the same
  double-keying reason (`src/**/*.ts` matches `vite-env.d.ts`) and get their own kebab-or-camel
  key instead.
- **A route directory is exempt from the script rule only.** `+page.server.ts` and
  `opengraph-image.ts` are the framework's names and not camelCase; the component rule needs no
  exemption anywhere because router spellings already pass it.
- **Angular is kebab-case, files and folders.** The 2025 style guide spells filenames with
  hyphens, it is the CLI default, and `ng generate` writes it: `UserProfile` lives in
  `user-profile.ts`. One key with no exclusions, because `app.spec.ts` and `app.config.ts`
  reduce to `app` under `ignoreMiddleExtensions`, which is already kebab-case.
- **Router folder segments are granted, not excluded by path**, and only where the framework
  family has a file-based router today or may adopt one: the React family and SvelteKit.
- The policy enumerates what exists and iterates when a framework moves. No grammar for
  hypothetical future routers.

### `lib/apis/`, when Zod is selected

```
lib/apis/
  shared/
    api.ts              base client
    schemas.ts          ErrorSchema, envelope
    entity-schemas.ts   reusable entity shapes
    fields.ts           reusable field primitives
    validations.ts      message builders
  <domain>/<entity>/
    api.ts              typed error variants via ErrorSchema.extend({ errorCode: z.literal })
    schemas.ts          separate request and response schemas per endpoint
    index.ts
```

Request and response are separate schemas per endpoint, never one shape serving both directions.

## Libraries and routers

Six libraries, a form library and two routers are answers rather than a starter kit, because each one changes what the
CLI emits: a dependency, a lint layer, a starter file, a coverage exclusion. Something that changes
nothing the CLI writes is a `pnpm add` and not a question.

- **The form library is its own answer, not a library.** TanStack Form and React Hook Form bind the same
  inputs, so at most one is ever installed. Until 1.7.0 both sat in `libraries`, a multi-select, and the
  exclusion was re-imposed afterwards by the parser; the prompt had always asked them as one radio. That
  left a single-select hiding inside a multi-select, and every consumer had to know: the end-to-end cases
  filtered `react-hook-form` out of `LIBRARIES` by hand, and `LIBRARIES` itself was not a legal value of
  `libraries`. `form` is now a field of its own, so the full library set is always legal and the type says
  what the rule was. React Hook Form is offered only where the target renders with React, which is Next and React
  Native as well as React itself, and an Astro or extension host with a React island. `rendersWithReact` is that
  question; asking `framework === 'react'` instead refused it on Next and React Native, which are their own
  `framework` values because each takes its own ESLint layer, while the TanStack binding map had always handed all
  three `@tanstack/react-form`.
- **A version-one config is migrated, never refused.** `schemaVersion: 1` is read, its form library lifted
  out of `libraries` into `form`, and the file reports v2 from then on. Silent, for the reason an absent
  `surfaces` still describes its own project: a config written before an answer existed is not broken.
  `lintel.config.v1.schema.json` stays published, because those files name it in `$schema` and an editor
  resolves it. Naming a form library in `libraries` now fails with the field to use rather than with
  "not a valid library".
- **Bindings follow the framework, not the target.** TanStack Query and Form install
  `@tanstack/<framework>-*` for `target.framework`, so an Astro site hosting React gets the React binding
  and a plain-TypeScript extension gets none. Before 1.6.0 the map was keyed by target and a hosted
  framework got the lint plugin with no runtime package behind it.
- **t3-env** is `@t3-oss/env-core` everywhere except Next, whose own package reads `process.env` the way
  the App Router exposes it.
- **React Native takes NativeWind for tailwind.** Metro has no Tailwind pipeline, so `@tailwindcss/postcss`
  alone installs and never runs. NativeWind 5 runs Tailwind 4 through PostCSS inside `withNativewind`, from
  `metro.config.js`; NativeWind 4 would have pinned React Native alone to Tailwind 3 against the
  latest-only non-goal. It is an rc at 1.6.0 and pinned `^5.0.0-rc.0`, which admits the stable release the
  day it lands. The style entry gets NativeWind's four imports in place of `@import "tailwindcss"`, and the
  merge recognises a subpath import so `sync` does not prepend a second block.
- **Two routers on React (Vite), and only there.** Next, SvelteKit, Expo and Astro route by file already;
  Vue's scaffolder installs its router; Solid and Angular are a `pnpm add`. React Router is emitted in its
  declarative form (a route table in `src/routes/router.tsx`, pages under `src/pages/`), because framework
  mode replaces Vite's entry and build, which is a different project. TanStack Router is file-based, since
  that is the form its type safety comes from; its Vite plugin runs ahead of React's so route files are
  rewritten before they are transformed. `src/routeTree.gen.ts` is written at birth and committed: the
  plugin regenerates it on every dev and build run, but `tsc --noEmit` runs before either in `check`, and a
  CI checkout without the file fails the typecheck. It is generated code with `as any` inside, so ESLint,
  coverage and the banned-pattern checker skip it by name. `src/routes/**` is out of coverage on both
  routers: a route table is configuration.
- **Answer flags** go through `parseLinteljsConfig`, so `--target wat` fails with the same message a bad
  `linteljs.config.json` does and there is one validator, not two.

## Package manager files

pnpm reads the approved install scripts from `allowBuilds` in `pnpm-workspace.yaml`; bun reads
`trustedDependencies` in `package.json` and nothing else. Measured on bun 1.3.11 with a local package
carrying a postinstall: an `allowBuilds` key in `bunfig.toml` left the script blocked exactly as no file
at all did, so 1.5.4's `bunfig.toml` shipped a key bun never read. Both managers now take the one list
`allowedBuildNames` builds.

`.npmrc` and `.yarnrc.yml` are both load-bearing, measured on React and Next with each file removed.
Without `legacy-peer-deps` npm refuses the install outright, where pnpm and yarn take their own
allowance. Its price is that npm then installs no peers at all, which is why `vite` is a named dev
dependency wherever vitest is. Without `nodeLinker: node-modules` yarn's PnP breaks the ESLint
TypeScript resolver and `check` fails with 46 errors.

`.yarnrc.yml` answers a peer with `packageExtensions` and never with `logFilters`. Measured by
emptying the filter list and running the yarn half of the suite. `@rolldown/plugin-babel` peering on
`rolldown`, `@vue/test-utils` on `@vue/compiler-dom` and `eslint-plugin-vuejs-accessibility` on
`globals` are requests the project has no business answering, each already supplied by a tree it does
not own, so each is marked optional on the package that asks. `postcss-html` on `postcss` is the one
answered by supplying it: stylelint 17 dropped its own postcss, so nothing in a generated project
declares one and `postcss-html` reaches whatever `postcss-safe-parser` happens to hoist. Marking that
optional leaves YN0002 printing, measured on a bare project at the versions pinned here, and resting
on a transitive's hoist is the thing the warning is about, so the extension gives `postcss-html` the
dependency instead. Declaring `postcss` in the generated project would answer it too, and is the
alternative if these ever need to agree across all four managers rather than yarn alone.

A blanket `YN0002`/`YN0060` discard used to cover all of them, which also meant the suite's
no-warnings assertion could never fire on yarn: with nothing printed, yarn never reports `Done with
warnings` and the check short-circuits. The only filter left is the one a target earns by declaring
`peerAllowances`, angular alone, where `@angular/build` requests a vitest the standard exceeds.
Yarn reports that as `YN0060` with a `YN0086` summary, so the allowance discards both.
`.npmrc`'s `allow-scripts` line prevented nothing measurable and `create astro` overrides it with
its own `allowScripts`, so it is gone. npm 12 reads that field from `package.json` instead, which
`patchPackageJson` writes, and `.yarnrc.yml` is emitted rather than copied so its `packageExtensions`
follow the dependencies a project actually installs.

## Comments

A comment states a why the code cannot: a measurement, an upstream issue, a constraint, a deliberate
deviation. One or two lines. What the next line does is not a comment; history is not a comment; a
decision worth a paragraph lives in this file and the comment points here. Exported API in the two
published packages keeps a one-sentence doc where the name alone does not say what a value means.
Tests keep a comment where a fixture's shape has a reason not on screen. This policy replaced a
codebase where seventeen percent of `@linteljs/create` and twenty-two percent of `@linteljs/eslint-config`
were comment lines.

## One version per shared dependency

The same argument The goal makes about rules reaching every project applies to this workspace's own versions.
Eight dependencies were declared in more than one `package.json`, and `@types/node` had already
drifted: `~24.13.3` at the root and in `eslint-config`, `^24.13.3` in `eslint-plugin`, with nothing
to say which was meant. They now read `catalog:`, and the version lives once in the `catalog:` block
of `pnpm-workspace.yaml`.

Being shared is necessary but not sufficient. A dependency is catalogued when more than one package
declares it **and all of them mean the same thing by it**. Three cases stay out:

- **One consumer.** It already has exactly one place to change; a catalog entry would add a hop for
  nothing.
- **Part of a published surface.** `eslint-config` pins every runtime dependency exactly, so the rule
  set it ships is reproducible. `eslint-plugin` declares two of those as well, but only to lint
  itself with them. Catalogued, the two stop being separable, and a bump that reads like dev-tooling
  maintenance edits what `eslint-config` publishes. That is the reason, and it does not depend on the
  two ranges looking different: whether `eslint-plugin` carets or pins is its own business, and
  either way its dev choice must not reach through a shared entry into a released dependency.
  `eslint-plugin-sonarjs` and `typescript-eslint` were briefly catalogued for exactly the wrong
  reason, which is that one package dev-uses what another ships.
- **Peer ranges.** Deliberately wider than what this workspace installs: `eslint` is `>=9` for a
  consumer and `catalog:` for development.

What is left is the six that are unambiguously shared dev tooling: `@types/node`,
`@vitest/coverage-v8`, `eslint`, `tsdown`, `typescript` and `vitest`.

`pnpm pack` rewrites the protocol, verified on `eslint-config`, whose runtime dependencies are the
ones that would ship it: the tarball carries `4.2.0` and `8.67.0`, and no `catalog:` survives. That
does mean releases go through pnpm; a bare `npm publish` would ship the protocol verbatim.

`@linteljs/create`'s `VERSIONS` table is deliberately **not** on the catalog. It names versions for
somebody else's project, not for this workspace, and the two move for different reasons. The one
coupling that does matter is that a generated project must not be handed something older than the
layers it installs were built against, and `versions.test.ts` gates exactly that against the
catalog rather than leaving it to a comment.

## What a project owns, and the four things three migrations changed

Everything below came from migrating three real repositories onto the standard rather than from a
test. Each is written here because the reasoning is not visible at the call site.

**The build configs are birth-only.** `vite.config.ts`, `vitest.config.ts` and `astro.config.mjs`
carry `preserve`, so `sync` installs them when missing and never touches them again. What this CLI
writes is a starting point every real project outgrows inside its first feature: one reference
extension builds an IIFE bundle per content script plus a native messaging host, another builds a
second mode for a preview page, and neither shape is reachable from any answer. The emitted vitest
excludes are the sharper half of the argument, because they name `src/background/index.ts` and
`src/typings/**`, which are this CLI's guesses at a layout, while a project excludes the entry
points it actually has. Re-emitting flattens that, and reporting it as `changed` invites a
`--force` that does the flattening.

`preserve` alone was not enough, and the first attempt was wrong in a way the pipeline tests caught:
a scaffolder writes its own `vite.config.ts` moments before stage 4 runs, so preserving at birth
handed a new project Vite's defaults instead of this standard's. `applyArtifact` therefore takes the
`fresh` flag the pipeline already computes, which is exactly the question "is this directory
scaffolder output". Nothing else changes behaviour, because no other preserved file exists yet at
birth.

**`.github/workflows/ci.yml` is emitted, and it is the opposite call.** Everything this CLI shipped
was a gate that nothing ran: a project got `check`, the hooks and the whole lint surface, and no
push ever exercised them. A reference repo renamed `check` and left its workflow calling the old
name; every push failed for two days while the project gated clean locally, and `sync` reported it
fully up to date because `.github/` was nobody's. So this file is owned outright, the command is
derived from `buildScripts` rather than written out (a workflow cannot name a script `package.json`
does not define), and a project with more to run adds `deploy.yml` beside it. That split is what
makes a drifting `ci.yml` a `sync` diff instead of a red build.

**`aliases` and `browsers` are recorded answers, not questions.** Both follow `resolveConditions`:
facts about a project rather than preferences, discovered after generation and edited into
`linteljs.config.json` by hand. `aliases` exists because `eslint.config.js` is emitted whole, so an
alias added there was gone on the next sync, and the reference repo carrying nine of them could not
adopt the standard at all. Recorded, one line reaches the ESLint config, the tsconfig paths and the
resolver together, which is the coupling `emitTsconfig.test.ts` already pins. `browsers` is separate
from `browser` because they are separate facts: `browser` decides the background shape, the ambient
types and the starter code, while `browsers` decides how many manifests come out. A project shipping
to both stores builds one bundle and swaps the manifest at package time, because the two differ only
in `browser_specific_settings`, which Chrome rejects and AMO requires.

Both were invisible until `answersIn` in `cli.ts` named them, which is the same failure `surfaces`
had: the parse accepts the field, everything downstream keeps working on the default, and only a
generated project shows it. That whitelist is deliberate and each addition is pinned by a test.

**`package.json` is a merged artifact, like `.gitignore` and `pnpm-workspace.yaml` before it.** It was reconciled
by the package stage, and `sync` writes artifacts rather than stages, so a dependency a release added to a layer
reached every new project and no existing one. Two of three reference migrations had to add plugins by hand that
their own recorded answers already implied: one needed `@next/eslint-plugin-next`, the other needed
the accessibility plugin, both `@html-eslint` packages and `@types/chrome`. The merge is `patchPackageJson`, which
already did the right thing for a `create` run and never ran for a `sync` one, so both routes now agree.

**The end-to-end suite retries one install error and no other.** A scaffolder pins the version it just saw, so a run
starting in the minutes around an upstream release asks the registry for something not yet propagated: `create astro`
wrote `astro: ^7.2.2` and the install failed 33 seconds before that version existed, taking a release with it.
`ERR_PNPM_NO_MATCHING_VERSION` is matched exactly, because every other install failure means the generated project is
genuinely broken, which is what the suite exists to catch. Retrying anything wider would hide that.

**`no-console` stands down under `scripts/`.** A build or packaging script reports to a terminal,
which is the one place stdout is the output rather than a leftover debug line. Firing there left
every project turning the rule off for a glob of its own, and each reached for `**/*.js`, which also
silences a genuine stray in any plain-JS source file. Granting the directory this standard already
puts scripts in is narrower than what a project writes when the standard declines to say.

**`sonarjs/code-eval` stands down under `__mocks__/`, and it is the only hotspot rule granted
anywhere.** The distinction is the reason: a defect rule has a clean state a rewrite can reach, and
a hotspot rule does not. `code-eval`'s message asks a human to confirm the execution is safe, so
every code path that executes a source string trips it forever. That is what makes it an override
generator, and the no-overrides rule cannot bite on a rule with nothing to fix.

The case is narrow enough to name exactly: `chrome.devtools.inspectedWindow.eval` hands the
inspected page a source text and answers its completion value, so a fake of it that does not execute
is not a fake of it. The reference repo had three rules off over one line, and two of them came back
on for free once the fixture stopped reaching for `new Function(`return ${expression}`)()` and used
`node:vm` instead, which is the API whose semantics actually match: the expression is an expression,
not a function body, and `runInThisContext` evaluates it as one. Only the hotspot survived that, and
only inside `__mocks__/`, which is where this standard already puts fakes. `no-implied-eval` stays on
everywhere including there, because `setTimeout('...')` is a defect and no fixture needs it.

## What `sync` may delete, and why the project holds the list

A project records what this CLI wrote in `plugins/linteljs/managed.json`, and `sync --force` deletes
what is in that record and no longer expected. It is written on every run that applies anything, and
it lives in linteljs's own tree rather than in `linteljs.config.json`, which is the project's to
reformat and which `sync` never rewrites.

The record exists because there is no other way to know. Answers change by hand editing the config,
so by the time `sync` reads it the previous answers are gone; nothing on disk says which files an
answer used to ask for. Three designs came before this one and each was a guess at the past. A
closed list of paths written out by hand drifted the moment a rule file was added. Deriving that
list by running every emitter over every combination of answers replaced thirty-eight paths to
remember with five answer axes to remember, which is the same bet one level up: an answer that gates
a file and has no axis leaves a file nobody can remove.

Renaming a recorded path is still two edits rather than one. The new path replaces the old, and the
old stays removable until every project that could hold it has synced, since a path that leaves the
record without being deleted first is a file this CLI wrote and then forgot. Renaming
`command-parser.js` to `commandParser.js` needed only the first, because it had never shipped.

A project written before the record existed has none, and reads as an empty one: `sync` adds what
the answers ask for and removes nothing until its own run writes the record. That is the safe
direction to be wrong in.

## React Native `build`: `expo export --platform web`, and why it took a layout rule

`buildScripts` ends `check` on `pnpm build` for every target, and `build` is a leg the scaffolder
normally writes. `create-expo-app` writes none, because an Expo app ships through `eas build`,
which needs an account and a remote builder. The React Native record is therefore the one that
carries its own: `expo export --platform web`, a real Metro bundle of the app, with static
rendering of every route on top. This section is the measurement behind it; it replaces the open
defect that stood here.

The blocker was never the export command. It was that **six starter suites lived under
`src/app/`, and everything under the route root is a route**: expo-router's context regex
collects every `.ts`/`.tsx` and ignores only `+api`, `+middleware`, `+html` and
`+native-intent`. `getRoutesCore` does accept an `ignore` list, but the runtime reads its options
from `expo.extra.router` in `app.json`, and those regexes cannot survive JSON, so no generated
project can reach it. Measured on expo-router 57.0.11, both failures from one cause:

- `expo export --platform web`: bundles, then dies at static render on `expect is not defined`,
  which is a test suite executing its module scope as a page.
- `expo export --platform ios`: dies earlier, bundling `@testing-library/react-native` and its
  node-only helpers into the app graph, pulled in through `@mocks/renderScreen`. This was the
  failure a previous measurement left undiagnosed.

With the six suites out of `src/app/`, both platforms export clean, and the exported route list
is exactly `/`, `/explore`, `/_sitemap`, `/+not-found`.

So the layout rule, which the route suites in `targets/reactNative.ts` also carry: **no
test file under `src/app/`, ever.** The route suites sit directly in `src/` beside the directory
they cover, named for the route with the path flattened, `app-index.test.tsx` for
`src/app/index.tsx`. A test for the route unit sits beside the route unit the way a test for a
file sits beside the file; a `__tests__/` directory remains out, per the testing standard. Web is
the exported platform because it is the one that also proves static rendering; ios export was
measured green too, and `eas` remains the real shipping path.

One cosmetic seam remains: `@srsholmes/vitest-react-native@0.1.5` passes `hostComponentNames` to
`@testing-library/react-native`, whose v14 dropped the option and warns with a stack trace per
suite. Measured harmless, tests and coverage pass; the fix belongs upstream, and pinning back a
major to silence a warning is the wrong trade.

Do not change the record's `build` or move a test back under `src/app/` without running
`pnpm --filter @linteljs/create test:e2e -t react-native`. That command is the only thing that sees
any of this.

### React Native lints as react without the accessibility preset

`Framework` carries a `react-native` member whose layer is `reactCore()`: everything `react()` has except the
`jsx-a11y-x` preset. Measured before the split, on one snippet written twice: as web markup it reports four findings,
`alt-text`, `anchor-is-valid`, `click-events-have-key-events` and `no-static-element-interactions`; as React Native
markup it reports none. Those rules key on lowercase DOM element names, and React Native renders `<Image>`, `<Text>`
and `<Pressable>`, which they read as unknown custom components and skip. So the preset was 34 rules that could not
fire, plus a dependency installed to hold them, and React Native no longer installs it.

In its place the layer composes `@linteljs/eslint-plugin`'s own `flat/accessibility`: five rules reading the props
React Native actually announces with. They are scoped to this layer and not shared, because `Button`, `Switch`,
`Image` and `TextInput` are ordinary names that mean something else on the web.

**Why the rules are ours rather than a dependency.** Two published packages were measured and both refused.
`eslint-plugin-react-native-a11y` last published 2024-11-04, caps its `eslint` peer at 8 and ships eslintrc configs
only, so installing it reintroduces on bun exactly the unfixable peer warning the `jsx-a11y-x` fork was adopted to
remove. `eslint-plugin-triple-rn-a11y` is the live alternative, flat config, no peers declared at all, published the
day this was written, but it is one agency's internal plugin at 179 weekly downloads whose rule ids carry a
`triple-rn-a11y/` vendor prefix a user would type into disable comments. All four packages, including this one, are
MIT, so the choice was never a licensing one.

**None of the five has a fixer, on purpose.** `eslint-plugin-react-native-a11y` inserts `accessibilityLabel="Text
input field"` for a missing name. That is an invented label: it silences the rule, reads as done, and ships a control
that announces the wrong thing. A name is a sentence only the author knows, a role guessed from `"img"` could be
`image` or `imagebutton` and those announce differently, and the two repairs for a nested touchable produce different
interfaces. Reporting is the honest answer for all five.

### React Native carries three upstream workarounds

None is a choice about the standard; each is a defect in somebody else's published package, and each has its
measurement here so it can be removed rather than inherited.

- **The scaffolder runs through npm.** `ScaffoldSpec.via` exists for this one target. `create-expo-app` shells out
  to `npm pack --dry-run --json` whatever launched it, so npm is the only launcher it is tested against. Launched
  through Yarn it dies before writing a file with `ERR_INVALID_ARG_TYPE`, passing a web `ReadableStream` where a
  Buffer is wanted, then passing that error's code to `process.exitCode`, which wants a number. Measured against
  the public registry as well as this suite's own, so the registry is not the cause.
- **npm is pinned to 11, for all nine targets.** Same scaffolder, same `npm pack --dry-run --json`: npm 12 answers
  with an object where npm 11 answered with an array, and `create-expo-app` cannot read it. expo/expo#48091 is
  merged in expo/expo#48392 and unpublished. The floor is 11 everywhere rather than 12 for the eight that could
  take it, because a project declaring a 12 floor warns `EBADENGINE` on every install under the npm 11 this one
  needs. Raise `PACKAGE_MANAGER_VERSIONS.npm`, and delete the CI step that installs npm 11, together.
- **One allowance the target declares.** `@react-native/community-cli-plugin@0.86.3` peers exactly one version of
  `@react-native/metro-config` while pnpm resolves a newer one, and nothing here declares either package.

  The deprecated `uuid@7` that `expo` reaches through `@expo/config-plugins` and `xcode` is deliberately *not*
  allowed away. See below.

### A deprecation notice is never muted

Nothing emitted here writes `allowedDeprecatedVersions`, and the end-to-end suite asserts on install warnings for
all four managers but never on a deprecation. A deprecation says a third-party package reached end of life. It is
true, the project it names belongs to somebody else, and no config a generated project carries changes the fact;
all such config does is hide it from the person who could act on it, or report it upstream.

One reaches a generated project today: React Native's `expo` pulls `uuid@7` through `@expo/config-plugins` and
`xcode`, which writes the native Xcode project. Nothing this CLI writes imports it, and it is fixed by its owner
upgrading, not by this repo. The Firefox extension's two, `eslint@9` and `whatwg-encoding@3` under
`addons-linter`, left with `web-ext` itself.

An earlier pass did carry a `DEPRECATED_SUBDEPENDENCIES` map and emitted the allowance. It is gone: the two cases
differed only in whether a scaffolder or this CLI installed the parent, which has no bearing on who can fix it.

### The extension target ships no browser runner

Measured on `web-ext@10.6.0`: 329 packages and 81 MB, wired to one script, `start`, running
`web-ext run --source-dir dist --no-reload`. Among what it drags in are a second ESLint, deprecated at that, and
`adbkit`, an Android Debug Bridge client. It also carried the only two deprecation notices a generated project
printed besides React Native's.

What it bought was the difference between a command and a few clicks, on one of the two browsers. Chrome
extensions never had an equivalent: a Chrome developer opens the extensions page and loads `dist/` unpacked, and a
Firefox developer does the same at `about:debugging` with "Load Temporary Add-on". Both browsers now cost the same
and neither carries a dev-time dependency for it.

`web-ext lint` and `web-ext sign` are the real reasons to reach for the tool, and both run under `npx` on the day
an extension is submitted to addons.mozilla.org, which is not a reason to install it in every project from birth.

## The end-to-end matrix: two families, not one cross product

Every answer this CLI can be given is covered, and it costs 98 cases rather than 1200. `cases.ts`
enumerates them; nothing is listed by hand. Two families get it to 327, and covering every *pair* of
answers rather than every combination gets it to 98.

The full cross product is 1200. Fixing the rule first, because an earlier count of 1328 assumed a
Vue project chooses a router and it does not: `create-vue` is called with `--router` unconditionally,
which is the whole of the 128 difference. A multi-select axis is never combined, it is always its
full value (`libraries`, `agents`, `plugins`, `surfaces`); the single-select axes combine
(`packageManager`, `testing`, `typeSafety`, `form`, `router`, `store`, `browser`, `hostedFramework`).
Per target that is 288 for React, 352 for the extension, 176 for Astro, 96 each for Next and React
Native, 64 each for Vue and Angular, 32 each for Svelte and Solid.

Measured, an install is around 60% of a case: 19.7 to 30.5 seconds of a 39 to 52 second one. So 1200
is about 15 hours of machine time, and sharding divides that rather than reducing it.

**Installing once per distinct dependency set does not fix it, which is why it was not built.**
`typeSafety` is the only axis that changes nothing installed, so it is a clean 2:1 and very nearly
the only one; every other axis moves at least one package, and the manager splits the install by
definition. Deduplicating gives 600 installs and still 1200 gates, about 10.5 hours. A 30% cut for a
tree-cloning mechanism is not a trade worth making, and at 327 cases the same mechanism would save
under an hour in five.

What cuts it is noticing that the manager axis and the option axes answer different questions:

- `managerCases`: every target on every manager, every multi-select at full value. 36 cases. This is
  the heaviest dependency set a target has, installed four ways, and it is the only thing that
  answers "does this library break the project" and "does this manager resolve the same manifest
  differently". It is also the only family that runs anything but pnpm.
- `optionCases`: every combination of the single-select axes, on pnpm alone. 300 cases. A package
  manager does not decide which config is emitted, so multiplying these by four bought four copies
  of one answer.

They overlap on exactly one case per target, which `ALL_CASES` drops: 327, all 327 labels distinct,
and every one of them legal under `refuseMisfit`.

The two halves are complementary rather than redundant. `managerCases` cannot catch a package the
emitted config needs but only installs when its answer is selected, because everything is always
selected there; `optionCases` is what catches it. `optionCases` cannot catch npm and bun resolving
the same manifest to different trees; `managerCases` is what catches that.

### Every pair of answers, not every combination

The cross product of the single-select axes is 348 on pnpm. `optionCases` covers every pair of
answer values instead, which is 98 cases with the manager family included.

The evidence is the suite's own record. Every defect it has found was a two-way interaction, and not
one needed a third axis pinned:

| defect | the two answers |
| --- | --- |
| `ERR_PNPM_IGNORED_BUILDS` on `vue-demi` | hosted framework Vue, with TanStack Query |
| floating promise in `src/devtools/index.ts` | the extension target, on Chrome |
| the generator's `app.spec.ts` left behind | Angular, with `testing: none` |
| `@mocks/renderScreen` importing what is not installed | React Native, with `testing: none` |
| `customTypes.d.ts` against KEBAB_CASE | Angular, with `typeSafety: relaxed` |

A pairwise set would have caught all five, and the 327-case run took 2h51m to report the same ones.

Greedy set cover over the legal enumeration rather than synthesised candidates: every case the
greedy can pick is one `refuseMisfit` already accepts, so nothing has to be checked for legality and
the pair universe is by construction the reachable one. It is deterministic, because the shard is a
stride over the result and a case that moved between runs would move between shards.

What this gives up is three-way interactions, the kind that only appear when a hosted framework, a
testing answer and a type floor coincide. `E2E_FULL=1` runs the cross product for a pre-release
sweep, which is one branch rather than a second generator. `cases.test.ts` pins both halves: that no
reachable pair is lost, and that the combination behind each defect above still appears.

### One registry on a fixed port, and the bun failure that made it necessary

The suite used to derive a registry port per shard so two shards could share a machine. Nothing ever
successfully did: `bunx` and `bun create` answered `ConnectionRefused` for the create package's own
tarball while `curl` got 200 on the same URL, reproducibly, with seven hypotheses falsified. It only
ever happened with several registries on several ports at once.

So the port is fixed and there is one registry per run. In `e2e.yml` every shard is its own machine,
so one per run is one per machine; locally, parallelism is `maxConcurrency` inside one process rather
than several processes against several ports. The configuration that reached the bun defect no longer
exists, which was a smaller change than an upstream fix.

Three things fell out of it. The publish lock is gone, because one process publishes once. The CI
cache key no longer carries a shard, because all four hold the same bytes. And Yarn's global metadata
cache, which stores tarball URLs including the port, is now valid between runs instead of pointing at
a dead host.

### Sharding is a stride over the cases, not vitest's `--shard`

Vitest splits by file. The nine files hold 11 to 91 cases each, so a file split cannot balance them.
`E2E_SHARD`/`E2E_SHARDS` take every Nth case from the ordered list instead, which hands each shard an
even share of every target: no shard is the one that drew React Native and Angular together. Measured
at four shards: 82, 82, 82, 81.

The ceiling is 11 shards, the smallest target's case count, below which a shard could draw no case
from a file at all and vitest would call the file empty.

### `run` spawns asynchronously so that concurrency is real

A case is an `it.concurrent`, and `spawnSync` blocks the event loop for the length of an install, so
the previous helper would have serialised a file however high `maxConcurrency` was set. `run` now
collects from a `spawn`, keeping stdout and stderr in separate buffers and joining them at the end
exactly as `spawnSync` handed them over: every matcher in `INSTALL_NOISE` is line-anchored, and
interleaving two streams by chunk can split a line across a switch between them.

Files stay serial and the cases inside a file run together. Only `managerCases` is not pnpm, and its
four cases sit at the head of one file, so at most one bun, one yarn and one npm install is ever in
flight. The managers whose caches are least happy about a second writer are serialised by the shape
of the suite rather than by a lock.

### bun's cache is pruned rather than deleted

Three of the four managers keep a persistent cache in `.e2e-cache`; bun's was pointed at the
directory wiped every run, so every bun case re-downloaded its whole tree every time. The reason was
real: bun offers no split between a cache of bytes and a cache of which versions exist, and this
suite publishes `@linteljs/*` under a version no run has used before, so a manifest cached last run
does not list it.

Only `@linteljs/*` is republished, so only `@linteljs/*` has to go. `pruneBunCache` deletes the
entries carrying that scope and the rest of the cache persists. Anything the prune misses fails
loudly rather than quietly, because `verifyLintOutput` asserts the resolved version is this run's.

## Two artifact lists, and why `sync` sees only one

Every file this CLI owns reaches disk as an `Artifact` through `applyArtifact`. There is no second
route: `pipeline.ts` holds no `writeProjectFile` call, which `pipeline.test.ts` pins by reading its
own source. Before this, the README, the manifest, the starter files, the starter tests and
`linteljs.config.json` were each written by hand inside a stage runner, so adding a file that needed a
condition meant editing the orchestrator: the coupling `switch (target)` is banned for in the
emitters, one level up.

The list is two, because `create` and `sync` do not own the same files.

- `buildArtifacts` is the toolchain linteljs maintains. Both commands write from it, which is what lets
  `sync` re-apply a changed standard to an existing project.
- `seedArtifacts` is what a `create` run plants and `sync` never touches: `linteljs.config.json`, the
  README, the manifest and the starter source.

That split is not new; it is what the stage runners were expressing by writing those files by hand,
now said once. It is load-bearing in both directions. `sync` reads `linteljs.config.json` rather than
writing it, so a project that reformatted its own config keeps those bytes through a `sync --force`,
and `cli.test.ts` pins exactly that. `pipeline.test.ts` pins the other half: the config is not in the
sync plan at all.

Two properties carry what the stage runners used to decide in code. `fresh: true` is birth only, for
the manifest and the starter source, which a project owns from its first run; `applyArtifact` already
received `fresh` for the `preserve` decision and now answers `false` outright. `requires` names a path
that has to exist, which is how a starter test is skipped when a rearranged starter moved the file it
covers. Both are data on the artifact rather than a branch in the pipeline, so a new one of either
costs no orchestrator change.

## Releasing

Push a branch named for the version. That is the whole ritual:

```
bump the three package versions, and the two constants that mirror them
git switch -c v1.2.0 && git push -u origin v1.2.0
```

`ci`, `e2e` and `release` all start from that one push. `release` waits for the first two, runs the
gates that are too slow for `ci`, publishes all three, and only then writes the `v1.2.0` tag and the
GitHub release. Nothing releases off `main`, because `main` is not a `v*` branch.

**One version across three packages.** They are one product with a one-way dependency, and
`@linteljs/create` writes a range for `@linteljs/eslint-config` into every project it generates. Three
independently drifting versions would mean a matrix of combinations nothing tests, so the branch
name is the single place the version is stated and the run refuses if any package disagrees with it.

**The branch is the trigger, not a tag.** A tag can be pushed onto any commit, so a tag alone never
says where a release came from: an earlier design triggered on the tag and needed a separate gate
asking which branches contained it. Triggering on the branch makes that gate tautological, and it
also ends the collision where a branch and a tag shared a name and `git push origin v1.1.1` had to
be spelled as a full ref.

**The tag is written after the publish, never before.** A tag then means all three are on npm rather
than that somebody intended to put them there, which is what makes it usable as the check that
refuses a second push to the same branch. The failure it prevents is real: without it, re-pushing a
released branch runs forty minutes of gates and dies in the publish step on a version conflict.

**The branch deletes itself once the tag holds the commit.** A release branch is a trigger, not a
line of development, and keeping one per version leaves a list nobody reads. The delete names
`refs/heads/` in full because the tag now shares the branch's name, and `git push origin --delete
v1.2.0` with both present answers `dst refspec matches more than one` and removes neither, failing
the run after all three packages are already published.

**`release` waits for `ci` and `e2e` rather than reading their conclusions.** They start from the
same push, so they are still running when it begins, and an in-progress run has no conclusion to
fail on. Reading without waiting passes vacuously while both are still going, which is the one thing
the gate exists to prevent. It was written that way, correctly, for a tag pushed after `ci` had
already finished, and became wrong the moment the trigger moved to the branch.

**No `NPM_TOKEN`.** Each package has a trusted publisher on npmjs.com naming this repository, this
workflow file and the `npm` environment, and pnpm exchanges the workflow's OIDC token for a
short-lived registry token. There is no long-lived secret to leak. The workflow filename is part of
that registration, so renaming `release.yml` breaks publishing until all three are re-registered.

**The first release went out by hand, once.** npm cannot register a trusted publisher for a package
that does not exist, so 1.1.0 was published locally to bootstrap the three names and 1.1.1 is the
same code released through the pipeline. That is the only reason two versions hold identical
artifacts, and it is not a step any later release repeats.

**Publish order is plugin, then config, then CLI.** It is the dependency order reversed, so a
consumer installing while a release is in flight resolves a complete tree at every point rather than
finding a config whose plugin is not there yet.

**A version bump touches five files, not three.** The three `package.json`s, plus
`packages/eslint-plugin/src/plugin.ts`, which hand-writes `meta.version` because ESLint reads it off
the plugin object, and `packages/create/src/emitters/always/package-json/constants.ts`, which pins
the range generated projects get for `@linteljs/eslint-config`. Both are held against `package.json`
by a test (`meta.test.ts`, `packageJsonEmitter.test.ts`), so a missed one fails `pnpm check` rather
than shipping wrong.
Neither is derived today, and nothing has been measured about whether it could be; the tests are why
that has stayed a papercut instead of a defect. Three `CHANGELOG.md` files change too, by hand.

## Workspace lint exemptions

The measurements behind every block in the root `eslint.config.ts`. They live here rather than
inline because each is a paragraph and the config is a list of decisions, not an essay. Each block
there names the heading below that holds its reasoning. An exemption whose measurement is missing
from this section is an exemption to delete.

### Ignores

`dist/`, `coverage/`, `.smoke/`, `.compat/` and `reports/` are tool output. `.smoke/` exists only
while `pnpm smoke` is in flight, `.compat/` only during `pnpm compat`, which installs six ESLint
majors into it, and `reports/` is where `pnpm mutation` writes Stryker's HTML.

`__mocks__/fixtures/` is deliberately defective input for `eslint-config`'s own tests: an import
cycle, an unawaited promise, and an SFC pair. Linting them at the workspace level reports the exact
defect each one exists to trigger, and the `.vue` and `.svelte` pair cannot parse at all without
the layers those tests compose and the workspace config does not.

`assets/mocks/setupTests.angular.ts`, `assets/mocks/setupTests.reactNative.ts`,
`assets/mocks/renderScreen.tsx` and `assets/starter/**` are shipped source, copied to disk by
the CLI and never imported here. Each imports the framework it is written for, and none of those is
installed in this workspace, so every import is unresolvable and every call through one untyped.
They are data here and code only in a generated project, where that project's own `eslint .` judges
them against the same standard. The end-to-end suite is what proves it.

### `'**/utils/*.ts': '*Utils'`

`check-file` takes a raw glob as the naming pattern, not only one of its named cases: the rule
validates the value with `is-glob` and then micromatches the extension-stripped basename against it
directly (`eslint-plugin-check-file@3.3.2`, `filename-naming-convention`). So `*Utils` is a pattern,
and it and the `CAMEL_CASE` entry above it both apply, which is what makes `layoutUtils` the only
shape satisfying the pair.

Proven to fire, not assumed: `src/utils/stray.ts` reports `The filename "stray.ts" does not match
the "*Utils" pattern`, and the same file as `strayUtils.ts` exits 0. `ignoreMiddleExtensions` is on,
so `layoutUtils.test.ts` is judged on `layoutUtils`.

### `resolver: { project: 'packages/*/tsconfig.json' }`

The one place the default resolver cannot work it out for itself. It reads a single tsconfig
discovered from the working directory, which in a workspace is the root, and the root has no
`paths`. Each package's `@mocks/*` lives in its own tsconfig.

`noWarnOnMultipleProjects` rides beside it. The resolver prints "Multiple projects found" twice per
run when `project` is a glob, and the advice it gives (one tsconfig with references) is the layout
this workspace deliberately does not have. Measured: the notice carries no finding, so silencing it
changes nothing in what `pnpm lint` reports.

### `@linteljs/workspace/create-rings`

`answers/` is what the user chose and `targets/` is what linteljs knows; neither reaches outward.
`emitters/` turns the two into file text and may read them. `terminal/`, `files/`, `process/` and
`pipeline/` are outside all three. The direction only ever points inward. That already held in the
import graph before the rule existed: the emitters reached into `answers`, `targets`, `aliases` and
`versions` twenty times and into `cli`, `pipeline`, `sync`, `prompts` and `rewrite` never. The rule
is what stops it quietly stopping.

Three folders where one ring used to be, because `model/` and `run/` were each several
responsibilities under one name. `model/` held data that flows through a run beside a knowledge base
that is the same on every run. `run/` held the terminal, the filesystem, subprocesses and the
sequence that drives them, which is four.

A route around it through the barrel is not a third zone: `src/index.ts` re-exports from `run/`, so
an inner ring importing it is a cycle, which `import-x/no-cycle` in `base` already reports.

It lives in the workspace config rather than a layer because the ring names are this package's, not
the standard's. It is scoped to source: a test arranges and asserts across rings by nature, and
policing its imports protects nothing.

### `@linteljs/workspace/create-worlds`

Which folder a module belongs to is read off its import lines rather than decided: `node:fs` means
`files/`, `node:child_process` means `process/`, `node:process` and `@clack/prompts` mean
`terminal/`. Nothing else may reach a world, so the only route to a disk is a function that can be
substituted, and `answers/`, `targets/` and `emitters/` are provably pure.

Measured, not asserted. At the time the rule went in, the non-test modules outside those three
folders reaching a builtin were exactly five: `pipeline.ts`, `sync.ts`, `rewrite.ts`, `repair.ts` and
`fixPass.ts`, all on `node:fs`. They call `files/utils/fsUtils` now, which re-exports the six
operations they need from one place. `fixPass.ts` lost its `existsSync` probe entirely: `spawnSync`
already reports an absent binary as ENOENT, so `process/localBinary.ts` answers `null` and the
separate check was a second way to ask the same question.

`node:path`, `node:os` and `node:url` are not restricted. Path arithmetic touches nothing, and the
other two are read only inside `files/`.

`process/` reaches `files/` for one thing: `isExecutableFile`, which is how `git.ts` resolves a
binary on `PATH`. Finding an executable is a filesystem question that only a spawner asks, and the
direction is one way, since nothing in `files/` spawns. Sync on purpose, because its answer feeds a
`spawnSync` that has no asynchronous point to wait at.

`pipeline/e2e/` is exempt. It is the harness rather than the package, and spawning real package
managers is the whole of what it does.

### `@linteljs/workspace/create-config-data`

`src/config/` is data and only data: the types, constants and tables no ring owns. A function that
builds one of them goes to a `utils/` at the level of its readers instead, which is the same rule
that decides where a helper sits anywhere else in the package.

Measured, not asserted. Before the rule went in, three of the five modules there carried behaviour
alongside their data, and every reader of that behaviour was in one ring. `artifact.ts` held
`emitted`, `copied` and `merged`, read by sixteen emitters across six groups and by nobody else;
`projectShape.ts` held `projectSpelling`, read by two emitters; `managed.ts` held `removableIn` and
`managedRecord`, read by `emitters/registry.ts`. All five moved to `emitters/utils/`, and the
constants they were sitting beside stayed: `Artifact` is read by three rings, `MANAGED_PATH` by
three, `RUN_PREFIX` by three, `NODE_ENGINE` by two. So the split is along the line that was already
there, between what every ring shares and what one ring does.

The gain is that `src/config/` now carries no suite at all. Its three test files moved with the
functions they covered, and what is left is tables: asserting one equals itself proves nothing, and
what is worth checking about a table is a fact about the code that reads it, which is where that
assertion already lives.

`ArrowFunctionExpression`, `FunctionDeclaration` and `FunctionExpression`, not `TSFunctionType`. A
function *type* is part of the vocabulary and stays: `Emitter`, `MergedText.merge` and
`CopiedAssets.transform` all describe a shape a ring implements rather than behaviour this folder
owns.

### `noInlineConfig`

`linterOptions: { noInlineConfig: true }` at the root, so no `eslint-disable` in this repo can
suppress anything. A directive becomes inert and is reported as having no effect, which
`--max-warnings 0` on the `lint` script turns into a failure; the rule the directive named fires
regardless, so an *effective* disable surfaces as the error it was hiding. Measured both ways: a
stray directive exits 1, and one over a real `console.log` reports the `no-console` error as well.

The repo had exactly one, on `execFileSync('pnpm', ...)` in `auditIgnores.js`. It is a named
exemption now rather than an inline comment, which is the whole point: this workspace keeps its
exemptions in one file with a measurement each, and an inline directive is neither.

Root rather than `base`, so it is not shipped. A generated project is already held to this by
`scripts/checkBannedPatterns.ts`, which refuses the directive at write time through the `PostToolUse`
hook and again on commit through lint-staged, so putting it in the layer would add nothing there and
would make every existing consumer's directives inert on upgrade. That is a breaking change to buy
enforcement the project already has.

### `@linteljs/workspace/scripts`

`auditIgnores.js` prints every coverage ignore with its stated reason and `smoke.js` narrates a
pack, so stdout is their output rather than a debugging leftover. `no-console` already allows `warn`
and `error` everywhere, which covers reporting a failure.

It is here rather than in `base()`, where it used to sit as `no-console: 'off'` for `**/*.js`.
Nothing `@linteljs/create` emits logs at all: the only `console` calls it ships are `console.error`,
which `no-console` permits, so that block bought a generated project nothing while handing its
`eslint.config.js`, `stylelint.config.js` and the two `*.config.js` files it copies a free
`console.log`. Neither package publishes `scripts/`.

`sonarjs/no-os-command-from-path` joins it for the same directory and the same reason. `auditIgnores.js`
runs `execFileSync('pnpm', ['exec', 'vitest', ...])`, and the rule wants an absolute path because a
writeable `PATH` entry could shadow the name. That is a real hazard for a program a user runs and not
for one a maintainer invokes by hand in this checkout, where resolving `pnpm` to an absolute path
would have to consult the same `PATH` to find it. It was an inline `eslint-disable` until
`noInlineConfig` above went on; converting it is what that entry is for.

### `@linteljs/workspace/old-node-runner`

`scripts/runRules.cjs` is the file the `oldest-runtime` CI job runs inside `node:12-alpine`, and it
has to parse there before it can prove anything. Node 12 has no ESM for a `.js` file in a package
that does not say so, and this one is copied out of the package into a bare container directory, so
`require` is the only module system available to it. Written as ESM it fails at parse and the job
reports a syntax error instead of a rule result.

Scoped to that one file. Every other script in the workspace is ESM and stays that way.

### `@linteljs/workspace/ast-identity`

`sonarjs/different-types-comparison` cannot read an AST identity check. ESLint brands every node it
hands a rule: `Rule.Node` is `(Program & { parent: null }) | (Exclude<ESTree.Node, ESTree.Program> &
NodeParentExtension)`. A node reached through a field (`parent.callee`, `parent.object`,
`outer.parent.body`) carries the plain ESTree type instead, and sonarjs reads the intersection and
the union member as disjoint. So it calls `parent.callee === fn` impossible when that is the whole
question the rule is asking.

Measured, not asserted. Removing the block reports exactly six comparisons, and replacing those six
with `false`, the value sonarjs says they already have, fails 38 tests across 6 files. Both halves
are re-measured rather than inherited: the count was 31 when the suite was smaller, so treat the
number as a reading of the day it was taken and re-take it rather than trusting it. If it ever
reaches zero, the reports are right and the block is wrong. The files are named one by one rather
than by directory, so a seventh site has to be added on purpose.

### `@linteljs/workspace/rule-tester`

`RuleTester.run()` registers its cases at module scope, and `sonarjs/no-empty-test-file` looks for a
literal `it` or `test` call in the file. It finds none and calls the file empty. Measured: wrapping
`tsRuleTester.run(...)` in an explicit `describe(...)` does not silence it either, so there is no
shape of the file the rule accepts. The suite it calls empty is most of the tests in this workspace.

Scoped to the RuleTester directory alone. Every other test file in the repo is held to the rule.

### `@linteljs/workspace/e2e-test`

Each `*.e2e.test.ts` under `pipeline/e2e/` is one `it.concurrent.each(casesFor(target))(label,
runE2eCase)`, and every assertion lives in `runE2eCase`. `vitest/expect-expect` reads the callback body
for `expect` calls and finds no body at all, since the helper is passed by reference. Measured:
`assertFunctionNames: ['runE2eCase']` does not help either, because the option matches calls inside the
body and there is no call. Off for that directory alone; every other test file is held to the rule.

### Coverage thresholds, in `vitest.config.ts`

A gate, not an aspiration. Without them `pnpm check` could not fail on coverage at all: the root
config carried none, and a package's own `vitest.config.ts` coverage block is ignored once the run
comes through `projects`.

One key per package rather than a single global block, because a glob key takes its files out of the
global thresholds, so a package dropped from the list would stop being gated without failing
anything. Named one by one, it has to be removed on purpose.
