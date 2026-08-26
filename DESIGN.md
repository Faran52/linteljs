# Design

Why lintel exists, and the decisions that are not visible in the code.

Everything else lives with the thing it describes: the layers are documented in
`packages/eslint-config/README.md`, the pipeline in `packages/create/README.md`, and each
non-obvious mechanism in a comment beside the code that needed it. A design document that
restates code goes stale and then misleads.

## Contents

For a consumer deciding whether to use lintel: The problem, The goal, Non-goals.
For a rule or target designer: One item per line, object literals included; Duplicate JSX props; Targets; Project structure.
For work on this workspace itself: One version per shared dependency; What a project owns; Renaming a generated agent file; React Native build; Releasing; Workspace lint exemptions.

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
  `parseLintelConfig` rejects a property it does not know, naming it, so both routes that plan from a
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
  `lintel.config.json` from then still describes its own project.

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
- **Accessibility belongs to JSX, not to a framework.** `jsx-a11y` used to reach Next projects only,
  by accident, because `eslint-config-next` bundled it and enabled six of its rules at `warn`. An
  element with no accessible name is the same defect in a Vite React app, in a Solid app and in an
  extension, so `react()` and `solid()` enable the plugin's own `recommended` preset and every target
  composing them installs it. The preset is taken whole rather than hand-picked, the way every other
  preset in these layers arrives: six rules chosen by a framework's config is that framework's floor,
  not a standard. Measured before landing: 31 newly error-level rules against a real Next project,
  zero new findings.
- **The template frameworks get the same floor, by three different mechanisms.** Vue, Svelte and
  Angular render templates rather than JSX, so `jsx-a11y` cannot see them. Each is covered now, and
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

The policy is `packages/create/src/model/naming/naming.ts`, one entry per target. Every glob was
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
`lintel.config.json` by hand. `aliases` exists because `eslint.config.js` is emitted whole, so an
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
`eslint-plugin-jsx-a11y`, both `@html-eslint` packages and `@types/chrome`. The merge is `patchPackageJson`, which
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

## Renaming a generated agent file, and the orphan it leaves

`GENERATED_AGENT_TARGETS` is the closed list of exact paths `sync --force` may delete, and it is
also the only thing standing between a rename and a file nobody can remove. A path that leaves the
list stops being removable: it is no longer expected, so it is never written, and it is no longer
in the inventory, so it is never obsolete either. `sync` goes quiet about it and the project keeps
a file this CLI wrote and then forgot.

So a rename inside that inventory is two edits, not one: the new path replaces the old, and the old
path stays behind as a removable entry until every project that could hold it has synced. Renaming
`command-parser.js` to `commandParser.js` needed only the first, because it had never shipped.

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

So the layout rule, which the route suites in `model/targets/reactNative.ts` also carry: **no
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
the plugin object, and `packages/create/src/artifacts/package-json/versions.ts`, which pins the range
generated projects get for `@linteljs/eslint-config`. Both are held against `package.json` by a test
(`meta.test.ts`, `versions.test.ts`), so a missed one fails `pnpm check` rather than shipping wrong.
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

### `@linteljs/workspace/create-rings`

`model/` is what the user chose, `artifacts/` turns those answers into file text, `run/` is
everything touching disk, argv or a terminal. The direction only ever points inward. That already
held in the import graph before the rule existed: `artifacts/` reached into `answers`, `targets`,
`aliases` and `versions` twenty times and into `cli`, `pipeline`, `sync`, `prompts` and `rewrite`
never. The rule is what stops it quietly stopping.

A route around it through the barrel is not a third zone: `src/index.ts` re-exports from `run/`, so
an inner ring importing it is a cycle, which `import-x/no-cycle` in `base` already reports.

It lives in the workspace config rather than a layer because the ring names are this package's, not
the standard's. It is scoped to source: a test arranges and asserts across rings by nature, and
policing its imports protects nothing.

### `@linteljs/workspace/scripts`

`auditIgnores.js` prints every coverage ignore with its stated reason and `smoke.js` narrates a
pack, so stdout is their output rather than a debugging leftover. `no-console` already allows `warn`
and `error` everywhere, which covers reporting a failure.

It is here rather than in `base()`, where it used to sit as `no-console: 'off'` for `**/*.js`.
Nothing `@linteljs/create` emits logs at all: the only `console` calls it ships are `console.error`,
which `no-console` permits, so that block bought a generated project nothing while handing its
`eslint.config.js`, `stylelint.config.js` and the two `*.config.js` files it copies a free
`console.log`. Neither package publishes `scripts/`.

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

### Coverage thresholds, in `vitest.config.ts`

A gate, not an aspiration. Without them `pnpm check` could not fail on coverage at all: the root
config carried none, and a package's own `vitest.config.ts` coverage block is ignored once the run
comes through `projects`.

One key per package rather than a single global block, because a glob key takes its files out of the
global thresholds, so a package dropped from the list would stop being gated without failing
anything. Named one by one, it has to be removed on purpose.
