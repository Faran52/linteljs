# Design

The decisions the code cannot show, and the non-goals. The layers are documented in
`packages/eslint-config/README.md`, the pipeline in `packages/create/README.md`, and each non-obvious mechanism in
a comment beside its code.

## Contents

For a consumer deciding whether to use linteljs:

- [The problem](#the-problem)
- [The goal, and the rule under it](#the-goal-and-the-rule-under-it)
- [Non-goals](#non-goals)

For a rule, layer or target designer:

- [The layers and the rules](#the-layers-and-the-rules)
- [Targets](#targets)
- [The templates](#the-templates)
- [The starter page](#the-starter-page)
- [Project structure](#project-structure)
- [Answers](#answers)
- [Versions](#versions)
- [React Native](#react-native)
- [Package managers](#package-managers)
- [Monorepo layout](#monorepo-layout)
- [What a project owns](#what-a-project-owns)
- [The agent hooks](#the-agent-hooks)
- [Comments](#comments)

For work on this workspace itself:

- [One shape for every ring](#one-shape-for-every-ring)
- [The shipped starter source, and the gate that reads it](#the-shipped-starter-source-and-the-gate-that-reads-it)
- [How `check` runs](#how-check-runs)
- [One version per shared dependency](#one-version-per-shared-dependency)
- [The end-to-end matrix](#the-end-to-end-matrix)
- [Releasing](#releasing)
- [Workspace lint exemptions](#workspace-lint-exemptions)
- [Still open](#still-open)

## The problem

Lint, type, test and agent standards copied by hand into each project drift. Two hand-copied ESLint configs that
were 85% identical had diverged so that one silently never ran `import-x/no-cycle`, and nothing could say which
copy was right.

## The goal, and the rule under it

One command creates a project with the standard applied, one re-applies it to an existing project, and the shared
rules live in a published package so a fix reaches every project on update. Under every decision below: a thing is
spelled once, in one place, and everything else points at it.

- **One token source.** `tokens.css` holds every value; Tailwind's `@theme inline` and StyleX's `defineVars` both
  point at its custom properties.
- **One page, one file.** The starter's markup does not change with the styling answer.
- **One file per axis, never per combination.** A file that would vary by two answers is split.
- **One list.** The header's pages and the router's pages are one array; the rings are one list the lint config
  and its suite both read.
- **One rule, one place.** An answer is legal or not by one predicate, which the prompt hides by and the parser
  refuses by.

## Non-goals

Decisions, not omissions. Re-adding any of them needs an argument.

- **No official scaffolder is run.** `@linteljs/create` writes every file from its own templates. A borrowed
  template is a ceiling: every improvement becomes a string patch against someone else's file, and an answer that
  reaches into rendered source has nowhere to land. Owning it is cheap: under two dozen files per target beyond
  the CLI's own emitters, React Native aside.
- **No drift gate against upstream generators.** The templates follow this repo's principles, not a generator's.
  The end-to-end suite catches a framework change that breaks a project; a framework newly *recommending*
  something is not tracked (a trial run reported 90 paths, almost all demo assets).
- **Latest version of each framework only.** No version matrix. `VERSIONS` in `emitters/constants.ts` says what
  latest means; nothing comes from a generator's `package.json`.
- **A project supports the package-manager version it declares, and no other.** After generation, another major
  on PATH, a global config or a mirror is the user's to reconcile. Two managers resolving different versions for
  the same answers, both passing `check`, is accepted.
- **No JavaScript output.** The standard is typed end to end; a JavaScript answer would switch it off under the
  same name. A recorded `typescript: false` is refused, not converted: `parseLinteljsConfig` rejects an unknown
  property, so `sync` and `create --existing` stop before writing. The parser is the one list of known answers.
- **No Prettier.** `@stylistic/eslint-plugin` owns formatting as lint rules.
- **No Stryker in a generated project.** It does not earn its setup in an empty project. This workspace runs it.
  MSW is an answer, not a default ([The api edge](#the-api-edge)).
- **No Emotion or styled-components.**
- **A layer never weakens `base`.** Framework layers add rules. A surviving exemption carries a measurement that
  the tooling forced it. "It would be noisy otherwise" is not a reason.
- **No forked extension framework.** The `webextension` target is Vite plus `@crxjs/vite-plugin`; WXT and
  `vite-plugin-web-extension` bring a layout of their own. The manifest ships with empty `permissions` and
  `host_permissions`: that is the project's security surface, not a template's guess.
- **No browser runner in the extension target.** `web-ext` is 329 packages and 81 MB for one `start` script. Load
  `dist/` unpacked; run `web-ext lint` and `sign` under `npx` when submitting.
- **No bespoke React Native ESLint layer.** `eslint-plugin-react-native` peers `eslint ^9`, and
  `eslint-config-expo` bundles plugins that collide with `base()`. Given up: `no-inline-styles`, `no-raw-text`. See
  [React Native lints as React without the accessibility preset](#react-native-lints-as-react-without-the-accessibility-preset).
- **The plugin, not the framework's config.** `next()` registers `@next/eslint-plugin-next`, not
  `eslint-config-next`, whose bundled `eslint-plugin-react` calls `context.getFilename()`, removed in ESLint 10.
  A Next project stacks on `react()`; `next()` only tells `alt-text` that `next/image` renders an `img`.
- **No bundler choice for Next.** Turbopack is the default and the generated project takes it.
- **No deprecation notice is muted.** Nothing writes `allowedDeprecatedVersions`, and the end-to-end suite never
  asserts on a deprecation: it is true, and muting hides it from the person who could report it.

## The layers and the rules

### What git ignores, ESLint ignores

Flat config reads no `.gitignore`, so `base()` reads it through `includeIgnoreFile` rather than a hand-written
conversion of gitignore semantics. The hardcoded entries stay: a project may not gitignore `dist/`, and
`plugins/linteljs/` is committed on purpose.

### Accessibility belongs to the markup, not to a framework

A nameless element is the same defect on every framework, so `react()` and `solid()` enable the `jsx-a11y-x`
`recommended` preset whole (on a real Next project: 31 new rules, zero new findings).

**The plugin is the `-x` fork because of bun.** `eslint-plugin-jsx-a11y` caps its `eslint` peer at 9, and bun has
no way to silence the peer warning (it reads the registry manifest), so the layers take
`eslint-plugin-jsx-a11y-x` at the cost of the `jsx-a11y-x/*` prefix. `eslint-plugin-astro` falls back to the fork,
so no project installs the original.

**The template frameworks get the same floor, by three mechanisms:**

| framework | mechanism | why not the others |
| --- | --- | --- |
| Vue | `eslint-plugin-vuejs-accessibility`, `flat/recommended` | `eslint-plugin-vue` has no a11y rule |
| Angular | `angular-eslint`'s `templateAccessibility` | `templateRecommended` has none about a11y |
| Svelte | `svelte-check --fail-on-warnings` | `eslint-plugin-svelte` v3 has zero; the compiler owns them |

Svelte reports a11y as warnings and `svelte-check` exits 0 on one; drop the flag and the category is gone.

Vue's preset is ordered *ahead* of `@linteljs/vue`: placed later, its `**/*.vue` parser entry takes the
`parserOptions` carrying `projectService` with it.

`@linteljs/vue/sfc-import-seam` turns `no-unsafe-argument` and `no-unsafe-assignment` off for every `.ts` file in a
Vue or Nuxt project: lint's program reads an SFC import as an error type (Vue starters: 11 findings, all SFC
imports; Nuxt likewise), and `vue-tsc` checks that seam. No glob can name what imports an SFC.

### React Native lints as React without the accessibility preset

The `react-native` layer is `reactCore()`: `react()` less the `jsx-a11y-x` preset, whose rules key on lowercase DOM
names and cannot fire on `<Image>` or `<Pressable>`. In its place, five `@linteljs/eslint-plugin` rules read the
props React Native announces with, scoped to this layer. They are ours because `eslint-plugin-react-native-a11y`
caps `eslint` at 8 with eslintrc only, and `eslint-plugin-triple-rn-a11y` is one agency's vendor-prefixed plugin.

**None of the five has a fixer.** A fixer would invent a label or guess a role, silencing the rule and shipping a
control that announces the wrong thing.

### One item per line, object literals included

Every list layout splits at three or more items, one per line, delimiters on their own lines; two or fewer sit on
one line or go fully one per line, and a half-split list is fixed to the second. No rule joins lines. One node, one
owner, one threshold: `member-newline` (objects, patterns, interfaces, type literals), `array-newline`,
`import-newlines`, `export-specifier-newline`. Exceptions: `union-newline` splits on what a union holds, and
`chain-call-newline` splits at two calls or one callback with a body. Three rather than two keeps a pair like
`const [value, setValue] = useState(0)` on one line.

The plugin owns objects and arrays because `@stylistic` cannot count: `object-property-newline` splits at two and
misses `{ a: 1,\n  b: 2 }`, and `array-bracket-newline` either joins past `max-len` or accepts a hanging bracket.
So `base` turns `object-property-newline` off and keeps `object-curly-newline` at `consistent` only.

JSX props use `jsx-max-props-per-line` `{ maximum: { single: 2, multi: 1 } }`: two props on a line is one idea, a
third is where a reader starts scanning.

### Duplicate JSX props: this plugin's rule, not a dependency

React silently keeps the last of two identical props. `@eslint-react` has no props equivalent and
`eslint-plugin-react` is not installed, so `@linteljs/no-duplicate-jsx-props` lives here, in the React and Solid
layers.

- **Report-only.** Deleting either occurrence guesses which value was meant.
- **A spread resets the count.** The same name on either side of `{...props}` is how a default is offered.

### `no-duplicate-interface` rather than `no-redeclare`

TypeScript silently merges two same-named interfaces in one scope. `no-redeclare` either skips all-interface
merges or also reports the value-and-type companion pattern; `import-x/export` sees exports only.

- **Interface pairs only.** Class merges are `no-unsafe-declaration-merging`'s; other merges are deliberate.
- **One scope per block**, so `declare global`, `declare module` and namespace augmentation stay allowed.
- **Report-only.** Merging the bodies guesses which member wins.

### `no-inline-object-types` and `interface-order` are in `recommended`

Both are opinions. An inline shape cannot be imported, extended or documented, so the second use repeats it;
`allowIn` covers a literal that is a matcher rather than a shape. `interface-order` (types after imports, before
runtime code) is a house layout, and a shared config is one; hiding it outside `recommended` would only hide it from
a direct consumer. Its fix is report-only `reorder`. `base` restates it over `TYPED_FILES` to reach
`<script lang="ts">`.

### Size limits count code, and a suite has none

Limits: function 350, file 500, component file 350, `utils/` file 800, blanks and comments free. A React or Solid
component meets the function cap; an SFC meets the file cap. `utils/` gets the most room because it is a drawer of
helpers, and the glob is `**/utils/**` because Angular spells the suffix in kebab. Suites, `__mocks__/` and `e2e/`
are exempt: a suite is as long as its case list. `.astro` is named only with `astro: true`, or a project without
the parser would lint it.

The workspace meets the same numbers (longest file 438, `utils/` module 694, function 295) and has no cap of its
own: a second number would be a standard the published one does not state.

### Magic numbers in source only

`@typescript-eslint/no-magic-numbers` (core rule off) for script and SFC files; suites, `__mocks__/`, e2e,
`*.config.*` and `constants.ts` exempt, since `constants.ts` is where a number gets its name. Allowed: `-1`, `0`,
`1`, `2`; `detectObjects: true`. Measured on the workspace: these options give 82 findings, an empty `ignore` 664,
`[0, 1]` 183.

### Expression complexity in source only

`sonarjs/expression-complexity` at `max: 3` for script and SFC files except suites, `__mocks__/` and e2e: a case may
spell out its condition; source names the parts. Config files and `constants.ts` stay in scope.

### `name-before-use` reports and never fixes

A fix would have to invent the name. `base` turns it on with `ignoreEmptyLiterals` and `ignoreLiteralArguments`,
suites included. A suite names parsed JSON `const parsed: unknown = JSON.parse(text)`; a typed helper or a
`JSON.parse` exemption would be a second way to say it.

### `base` carries no framework rule

`@stylistic` `recommended` and `sonarjs/recommended` ship JSX and framework rules to every file. `base` builds the
stylistic preset with `jsx: false` and turns the sonarjs framework rules off; each framework layer turns its own
back on. The layer suites hold `base`, `typescript()`, `vitest()` and `html()` to no framework rule.

### Destructuring in declarations only

`prefer-destructuring` covers declarations only: on an assignment the fix needs `({ width } = box);`. Arrays are
off, since `list[0]` names an index that `[first]` hides.

### Aliases come from the program's `paths`

`@linteljs/prefer-alias` reads aliases off the TypeScript program, since the tsconfig is already where a project
declares them; a list in ESLint options would drift. So it needs type information and sits in `typescript()`.

### No parameter properties

A parameter property emits code, so Node's type stripping and `erasableSyntaxOnly` refuse it; `typescript()`
holds that even where the flag is unset.

### Rules `base` leaves off, measured

- `@stylistic/curly-newline`: reports a `catch {` holding only a comment (six findings, four unfixable), or, with
  `consistent: true`, only what `brace-style` already reports.
- The `export` entry of `padding-line-between-statements`: never settles in a barrel (46 findings left after
  `--fix`).
- `import-x/consistent-type-specifier-style`: neither style matches the workspace's `prefer-inline` merges
  (279 and 324 findings).
- `import-x/no-named-as-default`: 70 findings, all a value exported both ways on purpose.
- `import-x/default`, `named`, `namespace`: TypeScript reports each (TS1192, TS2305, TS2339).
- `import-x/no-deprecated`: `@typescript-eslint/no-deprecated` and `sonarjs/deprecation` already report it.

### Rules `typescript()` leaves off, measured

- `@typescript-eslint/no-use-before-define`: with `variables: true`, four of five findings are mutual recursion
  between `const` arrows that no order settles; with `variables: false`, nothing TS2448-2450 misses.
- `@typescript-eslint/no-restricted-types`: the reference list bans only `Object`, already reported by
  `no-wrapper-object-types`.

### Rules the React core leaves off, measured

- `@eslint-react/no-leaked-conditional-rendering`: duplicates `sonarjs/jsx-no-leaked-render`.
- `@eslint-react/no-unused-props`: throws on every `.tsx` when `typescript` is off.
- `@eslint-react/dom-no-unknown-property`: on in the reference only for Emotion's `css` prop.

## Targets

Eleven: React, Next.js, Vue, Nuxt, Svelte, Solid, Angular, Astro, React Native through Expo, a Manifest V3
browser extension, and a TypeScript library with no framework.

Astro and the extension host a UI framework rather than being one. Both take the same `hostedFramework` answer,
composed from `targets/utils/frameworkUtils.ts` rather than read off the framework's record, because those records
are app-shaped and a host needs only the narrow set that varies. Svelte's host entry is the bare
`@sveltejs/vite-plugin-svelte`, since a host owns its entry.

Every target exports a builder, `(answers: Answers) => TargetRecord`, called fresh each time, even where it reads
no answer, and suites call it inside each `it`. A record held as a module constant runs its helpers at import,
which Stryker counts as static and tests with every test (2175 of 3162 mutants static as constants, 509 as
builders). Only module-level data stays static.

### The extension target has three axes, and none is a second target

A `browser` (`chrome`/`firefox`), a surface list and an optional hosted framework move one record rather than
forking it.

**The browser decides the manifest shape and the ambient types, not the bundler.** `crx` builds both, so a
hand-rolled multi-entry Rollup input buys nothing and costs hashed names the manifest cannot reference.
`@types/firefox-webext-browser` declares `browser.*` and no `chrome`, so the background starter is per browser.

**The surfaces decide what the extension is.** `popup`, `background` and `devtools-panel` drive the manifest, the
starter files, the build inputs and the coverage excludes. Absent means popup and background, so an older config
still describes its project. A devtools-only extension is normal. A panel needs a Rollup input of its own, since
the manifest names only the devtools page.

The manifest is **emitted rather than templated** (two axes reach it, twelve combinations of one shape) and
birth-only, since a real manifest is the project's within a week.

**The hosted framework** decides what a component is, which Vite plugin runs ahead of `crx`, and which layer lints.

Extension entry HTML stays at the repo root: the browser resolves pages against the extension root.

### React Router framework mode is a router value; Nuxt is a target

`router: 'react-router-framework'` is the third value of React's `router` answer: the same library with its build,
route modules and typegen on, and React already asks the router question. The emitted `react-router.config.ts`
sets `appDirectory: 'src'` and `ssr: true`.

Nuxt changes as many fields (solution-style tsconfig, no Vite config, `nuxt prepare`, auto-imports), but Vue asks
no router or mode question, so a mode would be an invented answer whose two values share almost nothing. It is a
target, taking what it shares from Vue's tree.

Neither moves the source root: `srcDir` and `appDirectory` are both set, so every glob reads `src/`.

## The templates

### How a template is laid out

**One file per axis, never per combination.** React's Contact demo crosses form, data layer and Zod (eighteen
combinations) as one file per axis, joined by seams: `useSubmitContact()` has one signature in every api spelling,
`ROUTES` is one array for the header, the route table and the no-router switch, and the router lives in `App`.
`starterSourceEmitter` refuses two starter files for one destination under one answer set.

**TanStack Router builds its tree from the one route list.** File-based routing would be a second list of pages
and a generated file per combination. The cost is a route tree not statically known, so a link is checked against
`string`.

**`shared` names a tree, not a flag.** `StarterFile.shared` is `true` (`starter-source/shared/`, the framework-free
tree) or a target id (that target's tree, as Next reads `shared: 'react'`). Framework-free logic is shared even when
its module is not: language matching, cookies, contact endpoints, query options and validation each live once
under `shared/`, and only the framework shell stays per target. A copy of framework-free logic in two targets is a
defect. Anything with a framework in it is not shared. The emitter rewrites a shared file's relative imports to
the target's naming, so naming alone never justifies a copy. Contact endpoints sit in `apis/`, the one layer that
knows HTTP, since the standard bars a service from importing an api.

**A template names its own asset under each project's convention.** `StarterFile.source` lets one asset land
under two names (`fetchExtendedUtils.ts` is `fetch-extended-utils.ts` on Angular).

**The asset path is the destination path**, under the answer that gates it; `registry.test.ts` resolves every
derived asset against disk across every answer.

### Every starter file carries a suite

A generated project gates at 100% with `src/**` included, so a starter file without a suite fails the gate it is
born with. So `StarterTest` has the same `when` as its file; a suite covers what it renders, so there are fewer
suites than files; a hook usable only in a component is covered through one; a file with no runtime (a
`*.stylex.ts` table) is excluded. The contact button carries no in-flight label, since testing it is a race.

### Every component sits in a directory named for it

One kebab-case directory per component under `components/ui/` and `components/features/`, holding the component,
its suite and its stylesheet. Vue and Nuxt prefix `App` (`AppButton`, `AppMark`) because
`vue/multi-word-component-names` is an error and a single word collides with an HTML element. Route files stay as
the router names them, since there the filename is the URL.

### The colocated stylesheet is imported globally, never from a `<style>` block

Angular, Svelte and Vue scope local styles, so a shared class would not reach a component with a `<style>`
block. The style entry imports each colocated stylesheet; nothing goes in `<style>`.

### Per-target notes

- **Astro hydrates only the contact island.** No router answer and no app-wide provider. `isCurrentPath` exists
  because Astro serves `/about` and `/about/` as one page.
- **The extension popup is built node by node**, not from markup: a CSP gives no reason to trust markup, and
  querying back out of `innerHTML` is a guard the 100% gate cannot cover. The mark lives in `lib/mark/`.
- **React Native's shell is under coverage**, rendered through `expo-router/testing-library`.
- **React Native's tabs are a route group.** A `+not-found` beside the tabs made VoiceOver say "1 of 5" over four
  tabs, so the pages sit in `src/app/(tabs)/` and the root layout is a headerless `Stack` holding the group and
  the 404.
- **Svelte's route list is not shared**: `resolve()` needs each route's literal, so it imports `$app/paths`.
- **Every framework reads a TanStack form through one selector**, since plain reads render the first value
  forever. Svelte's binding is a plain `.ts` module rather than a rune file for one boolean.
- **A component's props type lives in a plain module**, since a `.ts` import from a `.svelte` or `.vue` file is
  `any` under lint's compiler.
- **Angular's `angular.json` is emitted rather than templated**: it carries the project's name.

The form, Zod and data answers are demonstrated on every target with a contact page, React Native reusing React's
hooks. Angular always renders one on Reactive Forms. On Astro the contact island is the hosted framework's own page
inside a `ContactIsland` that brings its provider (an island is its own root), and under languages the page hands
it the build-time words as a prop and the island follows `<html lang>`, so no i18n library ships to it. Astro's
Solid host inlines `solid-js` in vitest and runs vite-plugin-solid with `hot: false`, or coverage stops at 95%
branches. The extension, the library and Astro hosting nothing have no contact page (`noContactPage`), so the
form, data and mocking questions are not asked there. The extension installs the form library without a demo and
Nuxt declares its stores without a counter, on purpose.

## The starter page

Ten targets render one design. The extension popup is 360px wide and React Native has no HTML, so a single column,
no grid, and nothing that does not map to `View`, `Text` and `Pressable`.

### The HTML is the contract

Every form library and store emits identical DOM, so one suite covers every implementation by asserting on role
and accessible name, never on class attributes. The exception is the nav: an element that navigates is an `<a>`,
one that swaps view state is a `<button>`, so the no-router build renders buttons rather than faking anchors.

### Layout, routes and components

A header with the name and the routes, and a centred hero. Routes: Home (mark, name, lede, one live control),
Contact (when a form library is chosen), About (the gate, the standard, `sync`), Version (the stack and the
recorded answers). The form is a page, not a hero control: two fields turn the hero into a dashboard.

The components (`Button`, `TextInput`, `Mark`, `AppHeader`, `StatusPage`) are derived from those pages, not chosen
as a kit. `TextInput` takes `multiline` rather than a second `TextArea`. A section label or a key-and-value row is a
class, not a component: no props, no behaviour.

### The mark

A beam with three lines that drift out of alignment and snap back: slow decay reads as drift, fast correction as the
fix. Pure CSS and SVG; React Native ships it static rather than pay for `react-native-svg` and Reanimated.

**The hero carries it, the header does not.** A header ships to the project's users, and a tool's mark there
advertises linteljs without the project choosing to. A placeholder mark is refused too: an empty slot is more
honest.

### A crash and a status have one page

A render error and an unrouted path, each caught by the framework's own mechanism, land on one `StatusPage` per
framework: the code, one line (once, in `src/config/statuses.ts`), "Try again" on a crash and "Go home" always.
"Go home" is a full load, so a crash leaves no state behind. Its styles are `base.css`, which ships under every
answer, so nothing varies by styling.

A status ships only where something can produce it: a 404 needs a router, a 403 a loader, a server, or a boundary
that can tell a refusal from a crash. On client boundaries that is `ForbiddenError` in `statusUtils.ts`, shown with
no retry. A server render's error arrives without its class, so Next and React Router framework mode recognise it
client-side only. Astro (static output: a crash fails the build) and the extension (no framework boundary) have no
crash page; Next's `forbidden()` is experimental and unused.

### Version renders what was recorded, and says so

Emitted literals under an "as of" line. `package.json` holds ranges, not resolved versions, and a browser cannot
know its machine's Node or package manager, so a runtime read is either wrong or impossible.

The same record carries `CHECK` and `GATE`, read off the emitted scripts with the manager's run prefix, so a page
cannot name a command the project does not run.

## Project structure

The published `repo-structure.<target>.md` rules describe the layout, per framework included. The templates seed
it populated rather than empty, so the first component has a sibling to copy. The shape was validated against a
real linteljs project (32 primitives, 14 features) that filled in the standard rather than drifting from it.

`services/` holds domain logic and never HTTP; `apis/` holds endpoints and per-direction schemas. `partials/` is a
private slot inside a page or feature folder, never nested. `components/{ui,features}/` applies to the extension
too.

The subject rule this workspace holds holds there too: `utils/` is the one folder of loose files, each ending in
`Utils` (`*-utils` on Angular), and every other module is a subject directory whose entry takes the subject plus the
folder's kind (`store/counter/counterStore.ts`). `config/` stays flat, since it holds data. Angular is kebab-case
throughout, `ng generate`'s spelling. Solid's hooks are `create*` in `lib/primitives/`, since `use` is wrong there.

A routed unit is a page whether or not a router was chosen, so adding a router later changes one component and
writes a route table; no page moves.

### Per framework

The route unit, hooks slot and per-target layout live in each `repo-structure.<target>.md`. Next has no Pages
Router. Angular's `src/config/` replaces `src/environments/`. The extension has no `lib/store/`.

### File naming

Each record's `naming` and `folderNaming` are composed from the globs in `targets/constants.ts`, matched with
`micromatch@4`, which `check-file` uses; `namingUtils.test.ts` pins the strings, and an edited glob needs a fresh
probe.

- **A component file is anything but camelCase.** File-based routers own spellings no positive convention accepts
  (`page`, `_layout`, `+page@(app)`, `[slug]`, `(tabs)`); a negative rule admits them and still rejects a camelCase
  component.
- **Tests carry no filename key; declarations carry their own.** `check-file` applies every matching key, so a test
  beside an SFC could satisfy nothing.
- **A route directory is exempt from the script rule only**, since `+page.server.ts` is the framework's name.
- **Angular is one kebab-case key with no exclusions.**
- **Router folder segments are granted only where a file-based router exists or is plausible**: the React family
  and SvelteKit.

## Answers

Every answer changes what the CLI emits. Something that changes nothing the CLI writes is a `pnpm add`, not a
question. Answer flags go through `parseLinteljsConfig`, so a bad flag fails like a bad config.

**A library is a thing that is only a dependency.** `libraries` holds `zod`, `es-toolkit`, `ts-pattern`, `t3-env`.
Anything that changes what is emitted, or of which at most one can be installed, is its own single-select field
(`form`, `styling`, `data`, `mocking`, `router`, `store`); a single select hidden in a multi-select makes every
consumer re-impose the exclusion.

**A `schemaVersion: 1` config is migrated, never refused**, and `lintel.config.v1.schema.json` stays published
because old files name it in `$schema`.

### Form, bindings, and the React test

At most one form library. React Hook Form is offered only where the target renders with React, which
`rendersWithReact` asks, since Next and React Native are their own `framework` values. Bindings follow the
rendering framework, not the target: an Astro site hosting React gets the React binding, a plain extension none.
t3-env is `@t3-oss/env-core` except on Next, whose package reads `process.env` the App Router way.

### The styling answer

`styling: 'tailwind' | 'stylex'`, absent meaning plain CSS; a target offers what it can run. Angular has no
StyleX: upstream documents no Angular path, and an answer this repo would invent and own is not supported. React
Native has no StyleX (`react-strict-dom` is not production ready) and gets Tailwind through NativeWind 5;
NativeWind 4 is refused for pinning Tailwind 3 against the latest-only non-goal.

**StyleX dev CSS under a server-rendered document.** The Vite plugin links its dev CSS only through
`transformIndexHtml`, so Nuxt, SvelteKit, Astro and React Router framework mode link it themselves in dev.

**The markup does not change with the answer.** Every page uses semantic classes and `starter.css` ships in every
case; `@theme inline` and `defineVars` both point at `tokens.css`. The accepted cost: **the starter shows neither
idiom**. Per-system markup would be about 160 files, each page kept three times.

**The token vocabulary is the coming UI kit's**, web and React Native both. Several web spellings do not cross to
React Native, which argues for the kit's token layer being TypeScript that emits both.

### The data answer

`data: 'tanstack-query' | 'rtk-query'`, absent meaning the api layer is called directly; two cache layers in one
project is a combination the answer's shape refuses.

- **`rtk-query` requires `store: redux-toolkit`**, by the value's own `only`, which both the prompt and the parser
  read. One predicate, so they cannot disagree.
- **`tanstack-query` is offered with every store.**
- **Either works with either form.** The form binds inputs; the data layer owns submit state.

Without MSW the contact api resolves locally, so it works offline, in CI, in a popup and on React Native. Under
`rtk-query` it is an endpoint injected into `baseApi` (a `queryFn` without MSW), since a plain function would throw
away RTK Query's cache and hooks. The store registers the api's reducer and middleware: RTK Query's design, not
hidden.

### The api edge

**`fetchExtendedUtils.ts` ships on every project**: the one place that speaks HTTP. It returns parsed JSON or
throws `ApiError`, so there is no `response.ok` to forget. The body is typed `object` because the type floor
refuses `unknown` shapes and type arguments are all or nothing. Query strings use `qs` in `repeat` format, since
`URLSearchParams` stringifies arrays as `a,b`; Angular lists `qs` in `allowedCommonJsDependencies`.

**MSW (`mocking: 'msw'`) makes an api layer demonstrable.** The boundary moves rather than the call site, so the
code under test is the code that ships. `onUnhandledRequest: 'error'`, since an unhandled request is a test
reaching the network. The worker starts in development only and is not awaited (nothing posts before a person
sends the form), except in Nuxt's plugin, which Nuxt awaits anyway. SvelteKit's `server.fs.allow` gains
`__mocks__`, or the worker's import is a 403. The extension starts none: it fetches nothing under `/api`.

The project's own install script copies the worker (`msw init`, reading `msw.workerDirectory`), not msw's
postinstall: that one swallows its errors, reads the manifest where the install ran, and a warm pnpm store
replays its cached build without running it, leaving no `mockServiceWorker.js`.

React Native starts `msw/native` from `src/main.ts` under `__DEV__`, so Metro strips it from a release. Hermes
lacks `MessageEvent` and `BroadcastChannel`, which msw needs to exist at load, so a polyfill aliases them. No URL
polyfill: Expo resolves `/api/contact` against the dev server.

The starter copy says what MSW changes, so the page never claims what the network tab contradicts: a locale key's
`<key>Msw` twin replaces it under MSW, and `CONTACT_COPY` ships as an `msw` variant asset.

**The accessor takes each framework's own word**: `useExtendedQuery` on React (values) and Vue (refs, since an
unwrapped ref is a snapshot), `createExtendedQuery` on Solid (accessors, since Solid tracks reads) and Svelte,
`injectExtendedQuery` on Angular (signals, in an injection context). Astro and the extension get the adapter and
no accessor, since their binding is the hosted framework's.

**RTK Query gets `base/baseApi.ts` and no accessor.** `createApi` generates a named hook per endpoint. Domain slices
use `injectEndpoints`, because two `createApi` calls are two caches with invisible tags.

### The store answer

A store is an `optionalChoice` whose values read the target's own `stores` list. It installs a dependency and
nothing else. Absent means the framework's own state. The extension is not asked: an MV3 service worker dies
between events, so state belongs in `chrome.storage`. Angular offers SignalStore only: it is NgRx's signal-first
API, and its Events plugin covers the Flux style, so classic `@ngrx/store` would be a second vocabulary.

### The router answer

Only React has a `routers` slot (`react-router`, `react-router-framework`, `tanstack-router`). Next, SvelteKit,
Nuxt, Expo and Astro route by file; Vue and Angular install their router unconditionally; Solid's is a `pnpm add`.

### The languages answer

`--languages` takes any subset of `en`, `ar`, `ja`, `ko`, `zh-CN`, `zh-TW`, default none, so a project without it is
byte-identical to one from before the answer existed. A choice always ships English, the fallback. Only a target
whose record carries `i18n` parts is asked.

- **One library per framework, the most used and maintained**: i18next with react-i18next (React, React Native),
  next-intl, vue-i18n (Vue, Nuxt), Paraglide JS (SvelteKit), @solid-primitives/i18n. Angular, Astro and the
  extension popup take none and share one single-brace resolver.
- **Placeholders are single-brace ICU, `{name}`**, the form most of them read; i18next is configured to match.
- **A detected language is never stored.** Order: stored choice, browser, English. The language select is the one
  writer, so a first visit does not pass for a choice.
- **Every target detects through one `lookupTags`**: script tags read as regions (`zh-Hant`, `zh-HK`, `zh-MO` as
  `zh-TW`). i18next's detector matched `zh-Hant` to `zh-CN`.
- **`src/i18n/config.ts` is emitted, everything else is a template**, each translated file a `translated` pair.
- **Shared tables hold keys, not text**, so every framework translates the same table; text around a command is
  one key through `Trans`, so the command keeps its `<code>` in any word order.
- **The contact rules return keys, not text.** English stays in `CONTACT_TEXT` for a project with no languages.
- **What stays English**: the gate's `runs`, the recorded answer labels (facts the generator emits), and the home
  page, not yet translated.
- **Direction follows the language.** `<html lang dir>` on init and every change; the CSS uses logical properties
  only.
- **A server-rendered target serves the chosen language on the first byte**: React Router framework mode, Next,
  Nuxt and SvelteKit read the cookie, then `Accept-Language`, and hydrate in it.
- **Next translates without routing.** The language is the reader's choice, not a route: no next-intl plugin and
  no locale segment.
- **vue-i18n reads the shared locales as they are.** `@` is quoted at load, and `<code>` is split by `CodeText`
  rather than met with `v-html`.
- **Nuxt takes vue-i18n directly, not `@nuxtjs/i18n`**, which stores a detected language and whose auto-imported
  `useI18n` cannot resolve in vitest.
- **SvelteKit takes Paraglide JS, not svelte-i18n**, which pinned an esbuild with an advisory; Paraglide audits
  clean and runs no build scripts. Its inlang plugin loads from `node_modules`, not the CDN, so a compile needs no
  network.
- **Paraglide is a compile step**, run before `svelte-kit sync` in `prepare` and `typecheck`. Detection stays ours:
  `getLocale` reads a store and the strategy is `baseLocale`.
- **Solid takes @solid-primitives/i18n**: no dependencies, no install scripts. It is imported as
  `createTranslator` so `solid/reactivity` reads the accessor as tracked, which it is.
- **Angular takes no library, not `@angular/localize`**, which builds one bundle per locale, so a switch is a page
  load and the locales would become XLIFF. A module-level `signal` is the whole runtime.
- **Astro takes no library, not Astro's i18n routing**, which makes a language a URL. Pages render English at build
  and mark elements with `data-i18n`; the contact island takes its words from the page instead.
- **An inline boot sets `lang` and `dir` before the first paint**, since an Astro page is a full load and a bundled
  module runs too late for Arabic. The suite checks `bootScript()` is `bootLanguage`'s source plus the config,
  rather than evaluating it, which `sonarjs/code-eval` forbids.
- **React Native keeps the choice in AsyncStorage 2.2.0**, the version Expo's SDK pins (381 KB); 3.x is 52 MB and
  expo-sqlite 78 MB.
- **The device language comes from expo-localization, not `Intl`**: iOS resolves `Intl` against the app's own
  localizations, so Arabic reads as `en-SA` in Expo Go. Its plugin's `supportedLocales` lists the languages a build
  needs.
- **The first render is English**, matching the static web export; the stored language switches in an effect.
- **The picker is a button opening a `Modal`**: React Native has no select.
- **Native direction follows the device's language.** Native lays out direction at launch, and Expo rules out
  `forceRTL` from code, so a stored choice changes the text at once and never the layout direction.
- **The extension popup takes no library, not `chrome.i18n`**, which follows the browser's language and cannot
  switch at runtime. Only an extension with a popup is asked; the popup is translated, since it is the whole
  interface.

### Recorded answers

`aliases`, `ignores`, `resolveConditions` and `browsers` are recorded, not asked: facts found after generation and
edited into `linteljs.config.json`. `aliases` exists because `eslint.config.ts` is emitted whole; one recorded line
reaches ESLint, the tsconfig and the resolver. `browsers` (how many manifests) is separate from `browser` (the
background shape and types): one bundle, the manifest swapped at package time. `packageManager`,
`packageManagerVersion` and `nodeVersion` are read off the host that ran `create`, see
[The executor's manager and Node](#the-executors-manager-and-node).

## Versions

### The published packages' floors

Both libraries need Node 22. The plugin peers ESLint `>=8.40.0`, the first with `context.sourceCode`, so no shim,
and keeps its eslintrc presets for ESLint 8 users. The config is flat config only, ESLint 9 or later.
`pnpm compat` and CI's `oldest-runtime` hold those floors.

### Solid stays on 1 until two peers move

`@tanstack/solid-query` and `@astrojs/solid-js` peer `solid-js ^1`, so moving first would leave a target unable to
take its own options. `eslint-plugin-solid` ships `configs/v2`, so the layer will switch on the version rather
than fork.

### The React Compiler runs natively

React and the React hosts run the compiler as `oxc-transform-react` through `@vitejs/plugin-react`'s `compiler`
option, not Babel: `@astrojs/react` 7 refuses the `babel` option, and Babel needed three more packages. The
built bundles carry the memo cache calls, so it is proven to run. The Babel pass, `reactCompilerPreset()`, is the
fallback. The plugin is held at exactly 6.1.1 and Astro scopes an override to `@astrojs/react`
(withastro/astro#18151) until `@astrojs/react` peers `oxc-transform-react ^0.152`; then both are lifted.

The compiler is off under `VITEST`, since the memo cache leaves an unreachable branch per component. Next keeps
its own switch, off; framework mode runs none; React Native keeps `babel-preset-expo`.

## React Native

### Jest and jest-expo, not Vitest

React Native's suites run on Jest through `jest-expo`'s default preset, the runner Expo ships and tests against,
rather than a 0.1.x single-maintainer Vitest plugin. The trade is stability, and the 100% gate still holds.
The record's `testRunner` picks the runner and `testing` records it, `jest` here, or `none`, so the config names
what runs. The parser reads `vitest` on React Native as `jest`: the default is the same for every target, and a
record from before 2.0 wrote it. `Platform.OS` is a runtime read, so
`jest.replaceProperty` covers a web branch.

The accepted costs:

- Suites compile to CommonJS, so no top-level `await`: setup takes modules through `jest.requireActual`.
- Jest is pinned to `^29.7.0`, jest-expo's own major; Jest 30 works but puts two majors in the tree.
- Slower than Vitest; `testTimeout: 15_000`, since a first render transforms React Native lazily.

No worklets Jest resolver: under pnpm it strips native extensions from expo-modules-core's path, and a web file
throws. Reanimated keeps the View stand-in mock.

The `react-native` export condition needs `jest.config.js` fixes for msw (`customExportConditions`, un-ignored ESM
dependencies, a `.mjs` transform) and redux-toolkit (un-ignored `immer` and `react-redux`); the list is built from
the answers. No `babel.config.js`: the default preset carries its own transform.

`sync` changes no runner. A project whose installed runner differs from the target's is refused before any write,
naming both; rewriting its lint and tsconfig for Jest would strand suites `sync` does not own.

### `build` is `expo export`, and it takes a layout rule

`check` ends on `build` everywhere. `eas build` needs an account and a remote builder, so this `build` is
`expo export` for ios, android and web, which needs no Xcode or Android SDK.

**No test file under `src/app/`, ever.** expo-router collects every `.ts`/`.tsx` there as a route, and its `ignore`
option cannot be written in `app.json`; a suite there breaks the web and ios exports. Route suites sit in `src/`,
named for the route flattened (`app-tabs-index.test.tsx`). Change `build` or this layout only with
`pnpm --filter @linteljs/create test:e2e -t react-native`.

### It follows the Expo SDK's pins, not react-native's latest

react-native, react, Reanimated, worklets and the Expo modules sit at exactly what the SDK's default template pins,
which `expo-doctor` checks; no Expo SDK is tested against a newer react-native. react and `@types/react` are pinned
on the target record, not `VERSIONS`, since other targets are newer. A template release is taken only once every
floor it names passes pnpm's `minimumReleaseAge`.

The project declares `@react-native/metro-config` at react-native's version, or the CLI plugin's exact peer and
worklets' `*` peer resolve apart. Yarn's YN0086 reports inside Expo's own tree each get a `packageExtensions`
entry, never `logFilters`.

### A native build opts into the UIScene life cycle

Xcode 27's SDK refuses to launch an app without the UIScene life cycle, which Expo SDK 57 adopts only as an opt-in,
so `app.json` sets `ios.enableSceneSupport` through `expo-build-properties`
([expo/expo#46664](https://github.com/expo/expo/issues/46664)). SDK 58 adopts it by default; drop the entry then.

Android on JDK 24+ fails in `configureCMakeDebug` (Prefab's bundled JNA warning is taken as a failure), and no
committed flag reaches that process. React Native builds on JDK 17, so a starter config plugin writes
`android/gradle/gradle-daemon-jvm.properties` on every prebuild, and Gradle runs on JDK 17 whatever `JAVA_HOME`
says, downloading it if absent. The generated README names `expo run:*` through the project's manager, since `npx`
fails `devEngines` with EBADDEVENGINES.

### The document head is web only, and a dev build carries no dev client

On iOS `expo-router/head` throws in development unless the plugin names a real `origin`, which a starter has none
of, so `DocumentHead` renders `<Head>` on the web only. `expo run:ios` opens a dev-client URL that expo-router maps
to `/`, so neither `expo-dev-client` nor `+native-intent.tsx` is added for a 404 that does not occur.

## Package managers

One list, `allowedBuildNames`, feeds each manager's install-script allowlist: pnpm `allowBuilds`, bun
`trustedDependencies` (it reads nothing else), npm `allowScripts`.

Every manager with a release-age gate gets two days, linteljs exempt: pnpm `minimumReleaseAge`, bun
`install.minimumReleaseAge`, Yarn `npmMinimalAgeGate` (only when the recorded Yarn is 4.10.1+, which reads it). A
half-published dependency once failed every bun and yarn case that pnpm's gate held back. The e2e harness zeroes
none of them.

npm emits no `.npmrc`: a peer conflict must fail the install rather than be chosen silently by
`legacy-peer-deps`. Peers npm resolves correctly unaided are not named for it; `test-renderer` is, since npm
otherwise picks one that clashes with Expo's React. Yarn needs `nodeLinker: node-modules`, since PnP breaks the
ESLint TypeScript resolver.

`.yarnrc.yml` is emitted, so its `packageExtensions` follow what a project installs, and it answers a peer with
`packageExtensions`, never `logFilters`. A peer supplied by a tree the project does not own is marked optional on
the asker. `postcss-html` on `postcss` is answered by supplying it: stylelint 17 dropped its own, and marking it
optional leaves YN0002 printing. A blanket `YN0002`/`YN0060` discard would also blind the suite's no-warnings
assertion on yarn. No target filters anything.

### The executor's manager and Node

The package manager is not asked and not flagged: it is the one that invoked the CLI, recorded, and refused below
`MANAGER_FLOORS` rather than installed. A project declares it three ways: `packageManager` at the exact version
that ran `create` (corepack and pnpm's switch read it), `engines` at the tested floor so a project is not pinned
to one patch, and `devEngines.packageManager` with `onFail: 'error'`, the one that refuses another manager. Bun
gets no `packageManager`, since corepack and pnpm do not know it; `engines.bun` says it instead. pnpm's floor is
10.26.0, where `allowBuilds` exists.

Node is `>=22.18.0` for a generated project and this CLI, one `NODE_FLOOR`: type stripping is on by default from
there, and the shipped scripts and hooks run as plain `node file.ts`. A machine that runs `create` should run the
project it writes. CI runs the major recorded in `nodeVersion`.

### Yarn 1 is not supported

`yarn` means Berry, floor 4.0.0. Yarn 1 reads no `.yarnrc.yml`, has no `packageExtensions`, no `dlx` and no
install-script gate, so supporting it meant a row in every manager table. The floor refuses it by name.

## Monorepo layout

`--layout monorepo` writes the same project moved under `apps/<name>/`, root tooling aside. The emitters do not know
the layout; one move in the registry rebases their paths.

- **Plain workspaces.** The manager's own workspaces and recursive run. Turborepo, Nx and Bazel are deferred to
  2.1: a task graph and cache a two-package repo does not need, and one more config across four managers.
- **`apps/*` and `packages/*`**, the convention every manager documents.
- **ESLint per package.** Each package lints, typechecks and tests itself; one root config would have to know every
  package's layers. The root keeps one lint-staged config, so lint-staged runs each package's from its directory.
- **The root lints like a single repo**, over its own `scripts/`.
- **The app copies msw's worker itself**, from its own install script ([The api edge](#the-api-edge)).
- **Single only for `--existing`**, which never moves files; `--layout monorepo` is refused there.
- **`sync --add` writes a `typescript` library in 2.0.** A second app is 2.1.

## What a project owns

Every file this CLI owns reaches disk as an `Artifact` through `artifactWriter`; `pipelineRun.ts` holds no
`projectFileWriter` call (its suite pins that). A conditional file is an emitter, never an orchestrator edit.

### Two artifact lists, and why `sync` sees only part of one

- `buildArtifacts` is the toolchain linteljs maintains; `create` writes all of it. `sync` writes only its
  `plugins/linteljs/` entries, the ESLint config and the `@linteljs/*` dependencies, each behind its own y/N.
- `seedArtifacts` is what `create` plants and `sync` never touches: the config, README, manifest and starter
  source.
- `sync --add <name>` is a birth: both lists for a `typescript` target, kept to what lands under
  `packages/<name>/`, then an install with pnpm's `frozen-lockfile` and Yarn's immutable installs off, since both
  turn on under `CI` and refuse the lockfile change that is the point.

`sync` reads `linteljs.config.json` and never writes it, so a reformatted config keeps its bytes. A 1.x project
moves `lintel.config.json` with `create --existing`, which removes the old file only after the new one is on disk.
`seed: true` is birth only, `requires` skips a starter test whose file was moved, and an existing `preserve` file is
the project's on every `create --existing`.

### What `sync` writes, and what it asks first

Everything that names `sync` names it under the project's own manager (`pnpm dlx`, `npx`, `yarn dlx`, `bunx`): the
project has no bin, and `npx` fails `devEngines` with `EBADDEVENGINES` under another manager.

The runner-switch refusal runs first. Then:

- **`plugins/linteljs/` is written without asking**: the one tree no project edits.
- **The `@linteljs/*` versions behind** are shown, then a y/N. A non-version range like `workspace:*` never moves.
- **The lint dependencies missing or behind** get their own y/N. Every other dependency stays the project's.
- **The ESLint config** is written unasked when none exists; one that differs gets a y/N and is moved to the first
  free `.bak`, so nothing is lost.

`--yes` accepts every step. With no terminal and no `--yes`, a step that would ask writes nothing and the run exits
1, so CI cannot read a skip as a pass. Declining exits 0.

### Birth-only and merged files

Every file outside `plugins/linteljs/` and the ESLint config is the project's once written, and `sync` writes none.

**The build configs are birth-only** (`preserve`): every real project outgrows them inside its first feature.

**`.github/workflows/ci.yml` is birth-only too.** A project's CI grows its own jobs, and the workflow and the
scripts it calls stay the project's together.

**`package.json`, `.gitignore` and `pnpm-workspace.yaml` are merged artifacts**: missing entries added, the rest
kept. Since no scaffolder runs, `.gitignore` carries the whole list, the target's official scaffolder entries
copied verbatim so an `--existing` project born from it gains nothing twice.

### What `sync` may delete, and why the project holds the list

`plugins/linteljs/managed.json` records what this CLI wrote there, and `sync` deletes what is recorded and no
longer expected. It lives in linteljs's tree, not the project's config. A recorded path is deleted only inside
`plugins/linteljs/`, never a directory, and only when `posix.normalize` leaves it unchanged. Nothing outside the
folder is ever deleted: a host file may hold the project's own entries.

The record exists because nothing else can know: answers change by hand-editing the config, so the previous ones
are gone; a hand-kept list drifts; and deriving one from every answer combination misses a file an axis-less answer
gates. A rename keeps the old path removable until every project could have synced. No record reads as empty, the
safe direction to be wrong in.

### Two standing lint grants a project receives

**`no-console` stands down under `scripts/`.** A build script reports to a terminal. Without the grant, projects
turn it off over `**/*.js`, silencing real strays.

**`sonarjs/code-eval` stands down under `__mocks__/`, the only hotspot rule granted anywhere.** A hotspot rule has
no clean state a rewrite can reach. A fake of `chrome.devtools.inspectedWindow.eval` has to execute source, which it
does through `node:vm` `runInThisContext`, so every defect rule stays on. `no-implied-eval` stays on everywhere.

## The agent hooks

### One `hooks.json`, run by `node`, inside the plugin

Every hook sits in `plugins/linteljs/hooks/`, the only path both Claude Code (runs the plugin in place) and Codex
(runs a cache copy) reach, so no hook reaches the project through its own location; they walk up from
`CLAUDE_PROJECT_DIR` or the payload's `cwd`.

`hooks.json` is shell form, `node "${CLAUDE_PLUGIN_ROOT}/hooks/<name>Hook.ts"`, not exec form: Codex silently
drops `args` and would run a bare `node`. Both hosts substitute the placeholder before any shell, so one line runs
under sh, PowerShell and cmd.

The command guards pick a dialect from `tool_name`. `commandParserUtils.ts` answers the commands a line would run,
or nothing when it cannot read it, and nothing is a finding (the git guard denies, the eslint guard warns).
Substitutions and nested shells are read as the commands inside them; a computed word or opaque PowerShell
construct is denied outside a commit message. It is a guardrail, not a sandbox.

### Context: a warning hook and two status lines

A plugin's `settings.json` cannot set `statusLine`, so both badges go in the generated `.claude/settings.json`; a
project's own wins on `create --existing`. `contextWarningHook.ts` warns once past 150K under Claude Code (other
hosts send no transcript); dropping back under clears the marker. A subagent row reads its own transcript, since a
task's `tokenCount` is a different measure. The number is always printed, so colour is never the only cue.

### The commit gate and the generated-file guard

`commitGateHook.ts` denies a `git commit` until `check` has passed on the tree it would commit: the work tree,
untracked included, snapshot as a tree object from a scratch index when the check starts, so a change mid-run
leaves the pass stale. Only the check itself counts, alone or redirected to a file outside the tree: a pipe hides
its status and a chain adds to it. A leading `cd <dir> &&` and leading literal `NAME=value` assignments count; a
wrapper does not. The project judged is the one the command runs in (`cd`, `git -C`), not the session's. The record
lives at `git rev-parse --git-path linteljs`, so it is never in the tree it describes and each worktree keeps its
own.

`generatedFileGuardHook.ts` denies an edit to a file whose first line carries a generator's marker; the edit
belongs in the generator. linteljs writes no marker of its own.

### The check band, in the same plugin

`hooks/checkBand.tsx` draws the check state in the `AbovePrompt` band. It sits in the linteljs plugin rather than
its own because an older Claude Code ignores `modules` beside command hooks but drops a plugin holding `modules`
alone. Codex refuses `modules`, so its manifest names `hooks/codexHooks.json`, emitted from `hooks.json` without
that key.

Generated projects ignore `plugins/linteljs/**` in ESLint and exclude it from `tsconfig.json`, since the band
imports `claude-code`, which only the engine provides; the hooks are typechecked and tested here. The band's gate
is `claude plugin test .claude/skills/linteljs`, over the repo mod's byte-equal copy, since `claude plugin test`
cannot select files and the shipped folder's Node suites do not load under it.

### Cursor and Copilot: their own hooks files, the same scripts

Each host runs `node plugins/linteljs/hooks/<name>Hook.ts` from the project root. Nothing is copied per host:
`hostUtils.ts` tells hosts apart by payload shape and writes each decision in that host's words.

What runs where follows what each host can answer: the git guard denies before the command everywhere. The commit
gate runs under Claude Code only, since Cursor and Copilot report no reliable exit status. The banned-pattern check
and generated-file guard skip Cursor, whose edit events name no answerable file; there the check runs on commit.
When Cursor also loads Claude Code's `hooks.json`, the hooks answer only on the event `.cursor/hooks.json` gives
them, decided from the payload.

`.cursor/hooks.json` is merged (shared by every Cursor hook); `.github/hooks/linteljs.json` is owned outright. VS
Code's Local agent payloads are undocumented, so nothing relies on them.

### Gemini CLI and Antigravity: one AGENTS.md, hooks for Gemini CLI only

`AGENTS.md` is the one adapter for Codex, Gemini CLI and Antigravity; Gemini CLI reads it through `context.fileName`
with `GEMINI.md` still listed. A second adapter would load twice in Antigravity, which reads both.

Gemini CLI denies before the tool and adds the eslint and banned-pattern findings as context after, since an
`AfterTool` block replaces the result. No commit gate: no documented exit status. `.gemini/settings.json` is
merged. Antigravity gets the rules in `.agents/rules/` (`trigger: glob` or `always_on`), and no hooks or MCP until
it documents a schema.

## Comments

A comment states a why the code cannot: a measurement, an upstream issue, a constraint, a deliberate deviation, in
one or two lines. Never what the next line does, never history; a decision worth a paragraph lives here and the
comment points at it. Exported API in the two ESLint packages keeps a one-sentence doc where the name does not say
what a value means.

## One shape for every ring

A ring is named for what its members are, or for the world it reaches. A subject is a kebab-case directory with one
entry named for it, its suite, its own `constants.ts` and `utils/`. The entry takes the singular of whatever names
the kind: the ring (`targets/` gives `reactTarget`), the group where one changes it (`disk/read/` gives
`projectShapeReader`), or nothing where a ring has no one kind (`terminal/cli/cli.ts`).

`src/meta.test.ts` holds every ring in one table against `src/rings.ts`, since the assertions are identical, and
refuses a barrel export nothing outside the ring takes.

**`eslint-config` takes the same shape** (`layers/<name>/<name>Layer.ts` and so on). The suffix is on the file, not
the export (`baseLayer.ts` exports `base`): renaming an export would be a breaking change bought for symmetry. Its
`meta.test.ts` holds the tsdown entries to `exports` one to one, since a subpath with no entry builds, typechecks
and publishes.

**`templates/` is laid out as the destination.** `project/` is what a project receives, `starter-source/` the
starters, `fragments/` pieces joined into one file, `schemas/` the published mirror. `copied(target)` derives the
source from where the file lands, so a shipped file is spelled once.

### One code file, one test file

`pnpm test:isolated` holds each source to the suite beside it, since the merged run hides a module covered only by
another file's test. A file with no suite is either a `constants.ts` that is data only (a table asserted equal to
itself proves nothing) or a pure re-export barrel, told by its source. Anything else without a suite fails. The
package-wide suites are named in `.claude/rules/repo-structure.md`.

## The shipped starter source, and the gate that reads it

`templates/starter-source/**` is outside every tsconfig, the root ESLint config and vitest: it imports ten targets'
runtimes, which this workspace does not install, and outside a project the type-aware rules have no program
(6,261 findings, almost all `no-unsafe-*`).

So `pnpm lint:starters` lints each starter where it will run: in a generated, installed project, under its own
`eslint . --max-warnings 0`, with the packages packed from this checkout. `STARTER_CASES` names the cases that
between them write every distinct starter text, and `starterCover.test.ts` fails when a text is written by no case;
what emitters write is left to the end-to-end matrix. Each case also runs `test:coverage` (a Solid island once
passed `test` at 95% branches), and the StyleX cases run `build`, since StyleX resolves theme imports only when it
compiles.

A case whose generated tree hashes as it did at its last clean lint is skipped; `check` runs that changed mode and
CI runs `--all`. A missing cache runs cold rather than skip. `lint:starters:fix` writes a fix back only to a template
copied whole and only when every case writing it fixed it the same way.

`children?: React.ReactNode` with no React import is legal TypeScript; this standard's style is
`@linteljs/react-no-global-namespace`, in the React layer. The gate carries no copy of a rule.

## How `check` runs

`build` first, since the packages typecheck against each other's built declarations; then the other six at once,
each logging under `node_modules/.cache/linteljs-gate/` (ignored, so the commit gate's tree never sees it). A
failed step prints a short excerpt, so a failure reads in about fifteen lines; under `CI` it prints the whole log.

The six are independent only because none writes what another reads: the gate sets `LINTELJS_GATE_BUILT=1` so
`lint:starters` packs with `--ignore-scripts` instead of rebuilding `dist` under `typecheck`.

Under `CI` the six run in series: a 4-core runner is saturated by `test:coverage` alone.

Tried and left out:

- **ESLint `--cache`.** It keys a file on its own text, so a type change hides a type-aware finding in an unchanged
  importer (probed with `await-thenable`).
- **Vitest `pool: 'threads'`.** Slower, and a worker cannot `process.chdir` or read a stubbed `HOME`.
- **Incremental `tsc`.** Already on.

### Coverage runs in shards in CI

`ci.yml` runs `check` with `LINTELJS_GATE_SKIP=test:coverage` and the suite as four `test:shard` jobs, thresholds
off, since one shard covers about a quarter. The `coverage` job merges them with `test:merge`, which applies the one
global 100%. Four, because the slowest single file sets the floor past that and every shard pays its own install.

### The coverage badge is CI's own number

The badge reads a shields endpoint JSON, not a coverage service or a fixed 100%. On a push to `main` the `coverage`
job writes the lowest of the four merged totals and force-pushes it as the one commit of the `badges` branch, even
after a threshold failure, so a drop shows. Only that job gets `contents: write`; pull requests never publish.

## One version per shared dependency

A dependency more than one package declares reads `catalog:`, its version once in `pnpm-workspace.yaml`. Peer
ranges stay out: they are deliberately wider (`eslint` is `>=9` for a consumer). `pnpm pack` rewrites the protocol,
so releases go through pnpm; a bare `npm publish` would ship `catalog:` verbatim.

`@linteljs/create`'s `VERSIONS` is deliberately **not** on the catalog: it names versions for someone else's
project. `packageJsonUtils.test.ts` gates the one coupling, that a project is never handed something older than its
layers were built against.

## The end-to-end matrix

Every answer that changes emitted code is covered by a matrix of cases, not the whole product. `matrix.ts`
enumerates them; nothing is listed by hand. Per target, the legal combinations of the varying axes are enumerated
under pnpm and a greedy cover keeps enough that every *pair* of answer values appears once. `agents`, `plugins` and
`surfaces` are always full and `typeSafety` always `strict`: neither changes what is installed. `languages` is none
or all six.

On top of the pairs: per target, the widest case runs once on each other manager (npm, Yarn 4, bun), holding each
manager's config files, its husky lifecycle and `INSTALL_NOISE` at pnpm's strictness. React's widest case also runs
with `--skip fix`, with `--no-install`, and as a monorepo on all four managers (committing through the hooks), and
the pnpm monorepo once more with `sync --add lib`. Every served target runs a browser pass, plus React Router
framework mode on npm.

An install is around 60% of a case, so the full product is days of machine time, and installing once per
dependency set would save about 30%, not worth a tree-cloning mechanism.

### Every pair of answers, not every combination

Every defect the suite has found was a two-way interaction (Vue host with TanStack Query, Angular with
`testing: none`, and so on). The greedy cover picks only from the legal enumeration, so the pair universe is the
reachable one, and it is deterministic, so a failed label names the same case under `-t`. Three-way interactions
are given up; `E2E_FULL=1` runs the cross product. `matrix.test.ts` pins that no reachable pair is lost, against a
pair definition of its own, and that each found defect's combination still appears.

The manager is not an axis: the widest case holds every dependency a target can emit, so one smoke per manager and
target installs them all. A manager resolving differently but still installing is the accepted risk under
[Non-goals](#non-goals).

### The browser pass

The built project is served by its own `preview` script and loaded in the system Chrome through `playwright-core`,
following every same-origin link. A console error, a page error, a non-200 or a page without an `h1` fails.
`channel: 'chrome'`, since the CDN playwright downloads from can be blocked where npm is not. No pass for the
extension (pages are loaded from `dist/`, not served), React Native (its web build is not what ships) or a library.
Server-rendered targets with `languages` check the next route's raw HTML already carries `lang` and `dir`.

### One registry on a fixed port

One local Verdaccio per run on port 48730: Yarn's metadata cache stores tarball URLs with the port, so a fixed
port keeps it valid. One process publishes once, so there is no publish lock.

### The split is by package manager, not vitest's `--shard`

One file holds every target, so a file split balances nothing, and a machine carries one yarn. So `E2E_PM` names
one manager, run on whatever binary of it is on PATH; a mismatched yarn major fails once, before any case.
`e2e.yml` runs one job per manager; uneven jobs are fine.

### Concurrency is real, and caches are shared carefully

Cases are `it.concurrent`, so `run` collects from `spawn`, joining stdout and stderr at the end as `spawnSync`
would, since `INSTALL_NOISE` is line-anchored. `createProject` holds one install per manager at a time, pnpm
excepted, whose store takes concurrent writers. bun's cache is pruned of `@linteljs/*` only, since bun caches
version lists with bytes; `verifyLintOutput` asserts the resolved version is this run's. npm's cache lives in
`.e2e/npm-cache` and is removed at teardown, since npm never evicts.

## Releasing

Push a branch named for the version. That is the whole ritual:

```
bump the three package versions, and the two constants that mirror them
git switch -c v1.2.0 && git push -u origin v1.2.0
```

`ci`, `e2e` and `release` start from that push. `release` waits for the first two, runs the gates too slow for
`ci`, publishes all three, then writes the tag and the GitHub release. Nothing releases off `main`.

- **One version across three packages.** One product with a one-way dependency; independent versions would be a
  matrix nothing tests. The run refuses if any package disagrees with the branch.
- **The branch is the trigger, not a tag.** A tag can be pushed onto any commit, so it never says where a release
  came from.
- **The tag is written after the publish**, so a tag means all three are on npm, and a second push to the same
  branch is refused early.
- **The branch deletes itself once the tag holds the commit**, naming `refs/heads/` in full, since a same-named tag
  makes the short form ambiguous and delete neither.
- **`release` waits for `ci` and `e2e` rather than reading their conclusions**: an in-progress run has none, so
  reading would pass vacuously.
- **No `NPM_TOKEN`.** Trusted publishers name this repo, `release.yml` and the `npm` environment; renaming the
  workflow breaks publishing until all three are re-registered.
- **Publish order is plugin, then config, then CLI**, so a mid-release install resolves a complete tree.
- **A version bump touches five files**: the three `package.json`s, `meta.version` in
  `packages/eslint-plugin/src/plugin.ts` (ESLint reads it off the object), and the `@linteljs/eslint-config` range
  in `packages/create/src/emitters/constants.ts`. Tests hold both to `package.json`. Changelogs change by hand.

## Workspace lint exemptions

The measurements behind every block in the root `eslint.config.ts`, each named by a pointer at its block. An
exemption whose measurement is missing here is one to delete.

### Ignores

`dist/`, `coverage/`, `.vitest/`, `.smoke/`, `.compat/` and `reports/` are tool output (CI's coverage shards, the
`smoke` and `compat` scratch installs, Stryker's HTML).

`__mocks__/fixtures/` is deliberately defective input for `eslint-config`'s tests (a cycle, an unawaited promise,
an SFC pair that cannot parse without the composed layers); linting it reports the defect each exists to trigger.

The shipped `templates/fragments/test-setup/setupTests.*.ts` files listed in the config and
`templates/starter-source/**` are shipped source, never imported here. Each imports a framework this workspace does
not install, or a path or alias (`./msw/node`, `@i18n`) only the generated project has, so every import is
unresolvable. A generated project's own `eslint .` judges them, proven by `pnpm lint:starters` and the end-to-end
suite. Measured on `setupTests.mswJest.ts` without its entry: 9 errors, all `no-unsafe-*`.

The two Claude Code mods (the shipped check band under `packages/create/templates/project/plugins/linteljs/` and
`.claude/skills/linteljs/`) import `claude-code`, which only the engine provides. Locally `pnpm mod-types` writes
the declarations, `pnpm typecheck:mods` checks both, and `modModules()` lints what those tsconfigs check. In CI no
engine writes them, so `UNTYPED_MODS` ignores a mod whose `index.d.ts` is missing, until the types are published
(`claude plugin validate` and `test` strip types without checking, anthropics/claude-code#99771).
`.fallowrc.json` ignores `.claude/**`: without it `fallow` fails on 12 unused files (the engine loads
`register.tsx` by name and `claude plugin test` runs the suites), the band copy as a clone group, and 20 health
findings scored without coverage.

The decisions the mod's code cannot show:

- **The check band is a copy.** `claude plugin validate` refuses an import from outside the plugin, a symlink and a
  second `modules` entry, so `checkBand.tsx` and its suite are carried byte for byte, held equal by `hooks.test.ts`.
- **It is named `linteljs`**, since the band's atom is keyed to that plugin name.
- **The CI band listens on classic events** (`classic.SessionStart`, `classic.Stop`), at most every 3 minutes.
- **One line, drawn by the CI band**, check state first; it declares its own `check` atom, since the engine
  refuses a `read` of an atom imported from another module.
- **Stale worktrees warn, never deny**: one may belong to another session's live agent. A HEAD ahead of
  `origin/HEAD` adds an `ff-only` note, since a new worktree starts at origin's default branch.
- **A refused note is swallowed**, so the spawn goes ahead.
- **No guard carries a `.catch`.** The engine drops a hook that throws and the call goes on, which is what a
  `.catch` would do (measured both ways under `claude plugin test`).

### `'**/utils/*.ts': '*Utils'`

`check-file` takes a raw glob as the naming pattern (`eslint-plugin-check-file@3.3.2`), so `*Utils` and the
`CAMEL_CASE` entry both apply and `layoutUtils` is the only shape satisfying both. Proven to fire: `stray.ts` under
`utils/` reports, `strayUtils.ts` exits 0. `ignoreMiddleExtensions` judges `layoutUtils.test.ts` as `layoutUtils`.

### `resolver: { project: 'packages/*/tsconfig.json' }`

The default resolver reads only the root tsconfig, and each package's `@mocks/*` lives in its own. Measured without
the override: 156 `import-x/no-unresolved`, every one an `@mocks/` import. `noWarnOnMultipleProjects` silences a
notice that carries no finding and advises a layout this workspace deliberately does not have.

### `@linteljs/workspace/create-rings`

The inner rings reach nothing outward; `emitters/` may read the inner rings but not `disk/`, `pipeline/`, `spawns/`
or `terminal/`. Among the inner four the direction follows `INNER_RINGS` order. The zones are built from the ring
lists in `packages/create/src/rings.ts`, so a new ring is a line there. A route through the package barrel is a
cycle `import-x/no-cycle` already reports. It lives here, not in a layer, because the ring names are this
package's. Scoped to source; the suites keep the inner order through `create-rings-tests`, with one exemption: a
`targets/` suite may take `DEFAULT_ANSWERS` and `ANSWERS` from the `answers/` barrel (eleven suites do), since a
copy in `__mocks__/` would be a second spelling.

### `@linteljs/workspace/create-worlds`

A module's world is read off its imports: `node:fs` means `disk/`, `node:child_process` `spawns/`, `node:process`
and `@inquirer/*` `terminal/`. Nothing else may reach a world, so every disk access can be substituted and
`answers/`, `targets/` and `emitters/` are provably pure. Built from `WORLDS` in `rings.ts`. `node:path`, `node:os`
and `node:url` are free. `spawns/` reaches `disk/` for `isExecutableFile` alone, sync because it feeds a
`spawnSync`. The e2e harness lives outside `src/`, so the block never reaches it.

### The `es-toolkit/compat` ban

Banned in every package: there was never lodash to migrate from, and its looser signatures only make a wrong call
typecheck. Measured: strict `sortBy` takes no `string[]` while `/compat`'s does, and taking it would replace
`localeCompare(left, right, 'en')` with a default comparison that reorders mixed case and moves the bytes of
`plugins/linteljs/managed.json`.

`base` carries the ban. A later block naming `no-restricted-imports` replaces earlier options wholesale, so
`create-worlds`, the last block naming it for `packages/create/src/**`, repeats the compat pattern. Probed: a compat
import and a `node:fs` import in an emitter are each reported.

### `@linteljs/workspace/create-config-data`

`src/config/` is data only, so it carries no suite and no coverage: asserting a table equals itself proves nothing.
A function that builds a table goes to a `utils/` at the level of its readers. The selector is the three function
node kinds, not `TSFunctionType`: a function *type* is vocabulary a ring implements. `src/types.test.ts` pins the
types redeclared from `@linteljs/eslint-config`.

### `noInlineConfig`

No `eslint-disable` here can suppress anything: a directive is inert, reported as unused, and `--max-warnings 0`
fails it. Measured: a stray directive exits 1, and one over a real `console.log` reports `no-console` as well. Root
rather than `base`: a generated project is held to this by `checkBannedPatterns.ts` at write time and on commit,
and in the layer it would make every consumer's directives inert on upgrade.

### `@linteljs/workspace/scripts`

Every script reports through the shipped logger, so this block turns `no-console` *on* for every method (options
given, since severity alone inherits the layer's `allow`), and `scripts-logger` turns it off for that logger alone,
which otherwise reports 6 findings. `base()` still stands the rule down under `scripts/` for consumers.
`runRulesRelease.ts` writes to `process.stdout`: it runs in a container with only the plugin's `dist/` and
`scripts/`.

### `@linteljs/workspace/ast-identity`

`sonarjs/different-types-comparison` reads ESLint's branded `Rule.Node` and a field-reached plain ESTree node as
disjoint, so it calls `parent.callee === fn` impossible. Forced on: five reports across the three named files, each
comparison taken both ways under the 100% branch gate. Re-take the count; at zero the block is wrong. Files are named
one by one so a new site is added on purpose.

### `@linteljs/workspace/rule-tester`

`RuleTester.run()` registers cases at module scope, so `sonarjs/no-empty-test-file` finds no `it` call: forced on,
25 of 26 rule suites report. Wrapping the run in `describe(...)` does not satisfy it either.

### `@linteljs/workspace/e2e-source`

An inclusion. `base` treats every `e2e/` as a suite, right for a generated project. This workspace's
`packages/create/e2e/` is source that drives a suite, so the root config drops `**/e2e/**` from every block; its
`*.test.ts` stay suites. Measured: the source-only blocks found five `no-magic-numbers` there and nothing else.

### `@linteljs/workspace/e2e-test`

`targets.e2e.test.ts` passes `runE2eCase` by reference, so `vitest/expect-expect` finds no body to read.
`assertFunctionNames: ['runE2eCase']` does not help: there is no call. Off for that directory.

### `@linteljs/workspace/band-types`

`claude plugin validate` reads a plugin's state only from an inline shape in `interface PluginState`. Measured on
Claude Code 2.1.289: a named interface fails with `linteljs.check is not declared`; inline passes, and
`no-inline-object-types` reports 1 error. Off for the two `types/index.d.ts` files.

### `@linteljs/workspace/mods`

Two rules restated for `modModules()` files only.

- `no-misused-promises` with `checksVoidReturn.arguments: false`: checking async hooks against the engine's
  per-event `On` overloads stalls the rule. Measured on `repoGuards.ts`: 318 s of a 320 s run with no finding; 1.6 s
  with the option.
- `import-x/no-unresolved` ignoring `^claude-code(/testing)?$`, ambient modules the resolver cannot reach: 9
  findings without it, all such imports; `tsc` resolves them.

### Coverage thresholds, in `vitest.config.ts`

The root config gates; a package's own coverage block is ignored under `projects`. One global 100% block rather
than a key per package, since a glob key takes its files out of the global thresholds and leaves an unnamed folder
ungated.

The e2e harness is outside every `src/`, so it is not included: it spawns and publishes, and would land at 0%. Its
pure suites still run. Beyond `src/`, the include takes package scripts' `utils/` and every `utils/` under
`packages/create/templates/project/`: shipped hook and gate logic is security code. Entries stay out, since their
suites spawn them under `node`, where v8 sees nothing; every decision is in the `utils/`. Nothing else is excluded:
`main` is a function from argv to an exit code that `cli.test.ts` calls directly.

## Still open

Neither is a decision yet, and both are one line to change.

- **Whether a generated project takes Geist.** Additive in front of the system `--font-sans`; the cost is two
  packages in every project.
- **One measure across pages, or two.** Form fields want a narrower column than a row list. One value in the shared
  stylesheet.
