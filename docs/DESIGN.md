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
`testing` stays a yes or no; the record's `testRunner` picks the runner. `Platform.OS` is a runtime read, so
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
- **msw's worker path sits at the root too**, since msw's install script reads the manifest where the install ran.
- **Single only for `--existing`**, which never moves files; `--layout monorepo` is refused there.
- **`sync --add` writes a `typescript` library in 2.0.** A second app is 2.1.

## What a project owns

Every file this CLI owns reaches disk as an `Artifact` through `artifactWriter`; `pipelineRun.ts` holds no
`projectFileWriter` call, which its suite pins by reading its own source. Adding a conditional file is an emitter,
never an orchestrator edit, which would move up a level the `switch (target)` the emitters are barred from.

### Two artifact lists, and why `sync` sees only part of one

- `buildArtifacts` is the toolchain linteljs maintains, and `create` writes all of it. `sync` writes only its
  `plugins/linteljs/` entries, plus the ESLint config and the `@linteljs/*` dependencies, each behind its own y/N.
- `seedArtifacts` is what a `create` run plants and `sync` never touches: `linteljs.config.json`, the README, the
  manifest and the starter source.
- `sync --add <name>` is a birth, not a sync: it builds both lists for a `typescript` target on the workspace's
  manager, Node and type safety, keeps only what lands in the app's directory, and writes it under
  `packages/<name>/`, seeds included. The root files are the workspace's already, and its globs take the package.
  Then it installs, as `create` does unless `--no-install`: the lockfile takes the new importer at once, so the
  frozen install CI runs passes. Every install it or `create` runs sets pnpm's `frozen-lockfile` and Yarn's
  immutable installs off, since both turn on under `CI` and refuse the lockfile change that is the point.

`sync` reads `linteljs.config.json` rather than writing it, so a project that reformatted its config keeps those
bytes. A 1.x project, whose answers sit in `lintel.config.json`, moves them with `create --existing`, which writes
`linteljs.config.json` first and removes the old file only after, because until the new name is on disk the old
one is the only copy of the answers. Two properties carry what would otherwise be branches in the pipeline:
`seed: true` is birth only (`create`, and `--existing --seed`), and `requires` names a path that has to exist,
which skips a starter test whose file a rearranged starter moved. A `preserve` file that already exists is the
project's on every `create --existing` run.

### What `sync` writes, and what it asks first

Every place that names `sync` to a project, its README, its About page and the CLI help, names it under the
project's own manager: `pnpm dlx`, `npx`, `yarn dlx` or `bunx @linteljs/create sync`. The project has no
`create-linteljs` bin, so `pnpm exec` finds nothing, and npm refuses `npx` with `EBADDEVENGINES` wherever
`devEngines.packageManager` names another manager, which every generated project's does. Measured on a pnpm Angular
project: `npx @linteljs/create sync` exits on `EBADDEVENGINES`, `pnpm dlx @linteljs/create sync` runs.

The runner-switch refusal runs first (see the Jest section). Then:

- **`plugins/linteljs/` is written without asking.** The folder is linteljs's whole, the one tree no project edits.
- **The `@linteljs/*` versions behind** are shown as a table, then a y/N. Only those entries of `package.json`
  move; a range that is not a version, such as `workspace:*`, never does.
- **The lint dependencies missing or behind**, the `@linteljs/eslint-config` peers and jiti, get their own y/N,
  after which the `<pm> install` to run is printed. Every other dependency, the framework included, stays the project's.
- **The ESLint config** is written without asking when none exists. One that differs gets a y/N, which moves the
  first spelling ESLint would load to the first free `.bak`, `.bak.1` and so on, then writes `eslint.config.ts`.
  A moved file is never lost, so the project can diff the two and carry its additions over.

`--yes` accepts every step. With no terminal and no `--yes`, a step that would ask writes nothing, says so on
stderr, and the run exits 1, so CI cannot read a skipped step as a pass. Declining exits 0.

### Birth-only and merged files

Every file outside `plugins/linteljs/` and the ESLint config is the project's once `create` has written it, and
`sync` writes none of them. The reasons each one is the project's still decide what `create --existing` does over
an existing file.

**The build configs are birth-only.** `vite.config.ts`, `vitest.config.ts`, `astro.config.mjs` and the test setup
carry `preserve`. What this CLI writes is a starting point every real project outgrows inside its first feature:
one reference extension builds an IIFE bundle per content script plus a native messaging host, another a second
mode for a preview page, and the emitted vitest excludes name this CLI's guesses at a layout where a project excludes
the entry points it has.

**`.github/workflows/ci.yml` is birth-only too.** A project's CI grows its own jobs (a deploy, a matrix), and the
workflow and the scripts it calls stay the project's together. The command is derived from `buildScripts` at
birth, since a workflow cannot name a script `package.json` does not define.

**`package.json`, `.gitignore` and `pnpm-workspace.yaml` are merged artifacts.** `create` writes them through a
merge that adds what is missing and keeps the rest. At birth the `pnpm-workspace.yaml` merge drops the
scaffolder's `ignoredBuiltDependencies`, which opts out of exactly the builds linteljs opts into.

Since no scaffolder runs, `.gitignore` carries the whole list: dependencies, env files (less `.env.example`),
`.DS_Store`, `coverage/` and `*.tsbuildinfo` on every target, Yarn's own list on Yarn, and the record's
`gitignore`, which copies the build, cache and generated entries of the target's official scaffolder verbatim.
Verbatim, so an `--existing` project born from that scaffolder gains nothing twice. A record drops an entry
naming a file its starter ships, as React Native drops Expo's `expo-env.d.ts`.

### What `sync` may delete, and why the project holds the list

A project records what this CLI wrote under `plugins/linteljs/` in `plugins/linteljs/managed.json`, and `sync`
deletes what is in that record and no longer expected. It lives in linteljs's own tree rather than in
`linteljs.config.json`, which is the project's to reformat.

A recorded path is deleted only when it starts with `plugins/linteljs/`, does not end in `/`, and is unchanged by
`posix.normalize`, so a hand-edited record cannot reach outside the folder or take a directory. The directories
the deletions leave empty are removed after, since an empty `.claude-plugin/` reads as if the host were still
configured. Nothing outside the folder is ever deleted: a host file such as `.cursor/hooks.json` may hold the
project's own entries.

The record exists because there is no other way to know. Answers change by hand-editing the config, so by the time
`sync` reads it the previous answers are gone. A hand-written list of paths drifts the moment a rule file is added,
and deriving one by running every emitter over every combination of answers only moves the bet: an answer that
gates a file and has no axis leaves a file nobody can remove. Renaming a recorded path is two edits: the new path
replaces the old, and the old stays removable until every project that could hold it has synced. A project with no
record reads as an empty one and loses nothing until its own run writes it, which is the safe direction to be wrong
in.

### Two standing lint grants a project receives

**`no-console` stands down under `scripts/`.** A build script reports to a terminal, where stdout is the output.
Firing there leaves every project turning the rule off for a glob of its own, and each reaches for `**/*.js`, which
silences a genuine stray in any plain-JS source.

**`sonarjs/code-eval` stands down under `__mocks__/`, the only hotspot rule granted anywhere.** A defect rule has a
clean state a rewrite can reach and a hotspot rule does not: `code-eval` asks a human to confirm, so every path that
executes a source string trips it forever. The case is narrow: `chrome.devtools.inspectedWindow.eval` hands the page
a source text and answers its completion value, so a fake of it has to execute. The fake uses `node:vm`'s
`runInThisContext`, whose semantics match (an expression, not a function body), rather than
`` new Function(`return ${expression}`)() ``, which keeps every defect rule on; only the hotspot remains, only inside
`__mocks__/` at any depth. `@linteljs/eslint-plugin`'s fixer
corpus runs each sample in `node:vm` the same way. `no-implied-eval` stays on everywhere, because
`setTimeout('...')` is a defect and no fixture needs it.

## The agent hooks

### One `hooks.json`, run by `node`, inside the plugin

| fact | source |
| --- | --- |
| Claude Code substitutes `${CLAUDE_PLUGIN_ROOT}` into a hook's `command` itself, in shell and exec form, and also exports it | code.claude.com/docs/en/hooks, "Exec form and shell form" |
| Claude Code loads a plugin in place when its marketplace is a local directory with a relative source, so `CLAUDE_PLUGIN_ROOT` is `<project>/plugins/linteljs` | code.claude.com/docs/en/plugin-marketplaces, "Local Directory Marketplaces" |
| Codex copies every installed plugin, local ones included, to `~/.codex/plugins/cache/<marketplace>/<plugin>/<version>/` and runs it from there | developers.openai.com/codex/plugins/build |
| Codex replaces `${PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_ROOT}` in `command` before any shell runs it, on every platform, and exports both | `codex-rs/hooks/src/engine/discovery.rs` at `c7c824d` |
| Codex's command handler has `command`, `commandWindows`, `timeout`, `async` and `statusMessage`; an unknown `args` is dropped without an error | `codex-rs/config/src/hook_config.rs` at `c7c824d` |
| a hook's stdout is parsed as the decision only when it starts with `{` and ends with `}`; Codex ignores plain text | both hosts' hooks references |

Every hook sits in `plugins/linteljs/hooks/` beside `hooks.json`, the only path both hosts reach: Claude Code runs
the plugin from the project, Codex from its cache copy. So nothing in a hook may reach the project through the
plugin's own location. The two command guards need nothing from the project, and the banned-pattern hook finds
`scripts/checkBannedPatterns.ts` by walking up from `CLAUDE_PROJECT_DIR` where the host exports it and from the
payload's `cwd` otherwise.

`hooks.json` is shell form, `node "${CLAUDE_PLUGIN_ROOT}/hooks/<name>Hook.ts"`, not exec form with `args`: Codex
drops `args` silently and would run a bare `node`, which reads the payload on stdin as a program. Both hosts
substitute the placeholder before a shell sees it, so the same line runs under sh, Git Bash, PowerShell and cmd with
no `commandWindows` and no wrapper.

The command guards read the payload's `tool_name` to choose a dialect, since Claude Code's PowerShell tool hands
them PowerShell. `utils/commandParserUtils.ts` answers the commands a line would run, or nothing when it cannot read
it, and each guard treats nothing as a finding: the git guard denies, the eslint guard warns. Bash compound
commands (`if`, `for`, `{ }`), subshells, `$( )`, backtick and process substitutions and unquoted heredoc bodies
are read as the commands inside them; a substitution inside a word marks that word computed, which the git guard
denies anywhere but a commit message. A PowerShell subexpression, script block or `Start-Process` is read as the
commands inside it and marks the enclosing command opaque, which the git guard also denies. `cmd /c`,
`pwsh -Command` and `Invoke-Expression` are unwrapped the way `sh -c` is. It is a guardrail: a variable holding a
subcommand and a `case` body still pass.

### Context: a warning hook and two status lines

| fact | source |
| --- | --- |
| a plugin's `settings.json` applies only `agent` and `subagentStatusLine`; `statusLine` is ignored there | code.claude.com/docs/en/plugins-reference, statusline |
| both status lines run with `CLAUDE_PROJECT_DIR` exported and expanded in `command` | probe, Claude Code 2.1.286 |
| the main status line's `context_window.total_input_tokens` equals the transcript's last usage sum | probe, 29520 both |
| a subagent task's `tokenCount` differs from its transcript's usage sum (14859 against 14725) | probe |

`contextWarningHook.ts` runs after every tool call in Claude Code (other hosts send no transcript and it stays
silent), reads the transcript's last usage, and warns once past 150K: the marker lives in `CLAUDE_PLUGIN_DATA`, and
dropping back under the ceiling, as a compact does, clears it. Since a plugin cannot set `statusLine`, both badges
are written into the generated `.claude/settings.json` and run the plugin's scripts through
`${CLAUDE_PROJECT_DIR}`. A project's own `statusLine` or `subagentStatusLine` wins on a `create --existing` run. The main badge reads
the payload's token count and falls back to the transcript; a subagent row reads its own transcript under
`subagents/` and falls back to `tokenCount`, since the two are not the same measure. The main badge refreshes every
5 seconds, so it moves while a long tool call runs. The number is always printed, so colour is never the only cue.

### The commit gate and the generated-file guard

`commitGateHook.ts` denies a `git commit` until the project's `check` script has passed on the tree it would
commit. That tree is the work tree, untracked files included and ignored ones not, written as a tree object from a
scratch copy of the index so the real index is never touched. It is taken when the check starts: a file changed
while the check runs leaves the pass stale. Only the check itself counts, run as `pnpm check` (or the manager's
`run check`, and `npm run check` on npm), on its own or with its output redirected to a file outside the work tree
(a log inside it is a file that changes while the check runs): a pipe hides its exit status and a chain adds to
it, so `pnpm check | tail` and `pnpm check; echo $?` record nothing. The one chain that counts is a leading
`cd <dir> && <check>`: `&&` runs the check only once the move worked, so the line's exit is the check's.
Leading `NAME=value` assignments count (`CI=1 pnpm check`), unless a value is computed (`CI="$(...)"`); a
wrapper (`env`, `time`, `sudo`, `bash -c`) does not, since what follows the assignments must read as the check.
The project is the one the command runs in, not the session's: a leading `cd <dir> &&` moves the whole line, and
each `git -C <dir>` moves a commit on from there, so an agent whose shell sits in another checkout is judged on the
worktree it names. `--git-dir` and `--work-tree` are not followed, and a `cd` after `;` or `||` moves nothing. A
line with several commits is held when any of them would be. The gate takes the run before
the command (`running`, with the tree) and `checkRecordHook.ts` the result after it, from `PostToolUse` for exit 0
and `PostToolUseFailure` otherwise. The record lives at `git rev-parse --git-path linteljs`, in the git directory,
so it is never in the work tree it describes and each worktree keeps its own. `checkStatusHook.ts` prints the state
word (`none`, `running`, `passed`, `failed`, `stale`) for a status band to read.

`generatedFileGuardHook.ts` denies an edit to a file whose first line carries a code generator's marker: `@generated`,
`do not edit`, `auto-generated` or `autogenerated`, `automatically generated`, `code generated`, case aside. linteljs
writes no marker of its own; the edit belongs in the generator's source. A file that does not exist yet is not
generated.

### The check band, in the same plugin

| fact | source |
| --- | --- |
| Claude Code loads a plugin's function hooks from the module `hooks/hooks.json` names under `modules`, beside its command hooks | the plugin-authoring reference bundled with Claude Code 2.1.289 |
| Claude Code before about 2.1.250 ignores `modules` beside command hooks, and drops a plugin whose `hooks.json` holds `modules` alone with a hook-load error | tested 2026-10-06 |
| Codex reads a plugin's `hooks/hooks.json` unless `.codex-plugin/plugin.json` names `hooks` (`./`-relative paths), and its `HooksFile` is `deny_unknown_fields` with `description` and `hooks` only | `codex-rs/core-plugins/src/loader.rs` and `codex-rs/config/src/hook_config.rs` at `c2abf86` |
| `claude plugin validate` reads a plugin's state from an inline shape in the types contract's `interface PluginState` | probe, Claude Code 2.1.289 |

`hooks/checkBand.tsx` runs `node hooks/checkStatusHook.ts` at session start and when a main-session turn ends, and
draws the state word in the `AbovePrompt` band. It sits in the linteljs plugin rather than a plugin of its own:
an older Claude Code ignores `modules` beside the command hooks and still runs them, where a plugin holding only
the band would fail to load there. The floor is the version that draws it; below it the band is absent and
nothing else changes.

`hooks.json`, `checkBand.tsx`, `types/index.d.ts` and `.claude-plugin/plugin.json`, which names the types, are
written for Claude Code alone, so each host's manifest names only files that host gets. Codex would refuse
`modules`, so `.codex-plugin/plugin.json` names `hooks/codexHooks.json`, which the emitter writes from `hooks.json`
without that key: one source, and Codex never reads the file it would reject. Cursor and Copilot have their own
files already.

The plugin is vendored tooling: generated projects ignore `plugins/linteljs/**` in ESLint, and every generated
`tsconfig.json` excludes `plugins/linteljs` from the one shared emitter, since every target includes `**/*.tsx`
and the band imports `claude-code`, which only the engine provides. Nothing in a project relied on that typecheck:
the hooks are typechecked and tested here, and `sync` rewrites the folder. The band's gate is
`claude plugin test .claude/skills/linteljs`, which runs the repo mod's byte-equal copy of `checkBand.tsx` and its
suite (`hooks.test.ts` holds the copies equal); its suite is not shipped. `claude plugin test` runs every
`*.test.ts(x)` under the folder it is given and cannot select files, so on the shipped folder it also runs the
Node hook suites, which do not load there. Measured on Claude Code 2.1.291: on the shipped folder 4 pass and 21
fail, all 21 "the file did not load"; on the repo mod 26 pass.

### Cursor and Copilot: their own hooks files, the same scripts

| fact | source |
| --- | --- |
| Cursor project hooks are `.cursor/hooks.json`, `"version": 1`, run from the project root in a trusted workspace; cloud agents run them too | cursor.com/docs/agent/hooks, "Configuration" and "Cloud agent support" |
| `beforeShellExecution` gets `command` and `cwd` and answers `permission`, `user_message`, `agent_message`; Cursor's own examples print `{"permission":"allow"}` for a clear command | same page, "beforeShellExecution" and the examples |
| `postToolUse` gets `tool_name` (`Shell`), `tool_input.command` and `cwd`, and answers `additional_context`; `afterFileEdit` gets `file_path` and answers nothing | same page, "postToolUse", "afterFileEdit" |
| every Cursor payload carries `cursor_version` and `hook_event_name`; hooks get `CURSOR_PROJECT_DIR` and `CLAUDE_PROJECT_DIR` | same page, "Common schema", "Environment Variables" |
| Cursor loads Claude Code's hooks when Third-Party Imports is on, the default, mapping `PreToolUse` to `preToolUse`, `Bash` to `Shell` and `Edit` to `Write` | cursor.com/docs/reference/third-party-hooks |
| Copilot reads `.github/hooks/*.json`, `"version": 1`; `preToolUse` and `postToolUse` get `toolName` and `toolArgs`, which the CLI sends as JSON text; the shell tools are `bash` and `powershell`, the edit tools `edit` and `create` | docs.github.com/en/copilot/reference/hooks-configuration, and the CLI hooks tutorial |
| `command` is copied into `bash` and `powershell` where they are absent; `cwd` is relative to the repository root; the cloud agent honours `bash` or `command` only | same reference, "Command hooks" |
| `preToolUse` answers `permissionDecision` and `permissionDecisionReason`, with no added context; `postToolUse` answers `additionalContext` | same reference, "preToolUse decision control", "postToolUse output" |

Each host reaches `plugins/linteljs/hooks/<name>Hook.ts` as `node` with that fixed path from the project root:
Cursor runs project hooks there, and Copilot's `cwd: "."` puts them there, so Copilot's file uses `command` rather
than a `bash` and a `powershell` saying the same thing.

Nothing is copied per host. `utils/hostUtils.ts` reads which host called from the payload's shape, `cursor_version`
for Cursor and `toolName` for Copilot, with Claude Code and Codex the shape with neither. It hands each guard the
command and its dialect, or the edited paths and `cwd`, and writes the decision in that host's words. A dialect
comes from the tool name; Cursor names no shell, so the platform decides, PowerShell on Windows.

The git guard denies before the command on every host. The eslint warning is added context, which Claude Code and
Codex take before a shell command and Cursor and Copilot only after. The banned-pattern check is a block reason
after an edit under Claude Code and Codex and added context under Copilot, which reads the edit tool's `path`.
Cursor's edit event that names a file answers nothing, and the one that can answer does not document where the path
is, so there the check runs on commit.

The commit gate and its check record run under Claude Code only: Cursor's `afterShellExecution` carries no exit
status, and Copilot reports a shell tool as a success either way, so neither can tell a check that passed from one
that failed. The generated-file guard runs under Claude Code and Copilot, since Cursor's edit event names no file.

In a project that chose Cursor and Claude Code, Cursor also loads the linteljs plugin's `hooks.json`. Each hook
answers under Cursor on the one event `.cursor/hooks.json` gives it, and Claude Code's copy arrives as
`preToolUse` and `postToolUse` on `Write`, which are not those, and prints nothing. That is decided from the
payload rather than a flag, so it holds however Cursor loaded the copy.

`.cursor/hooks.json` is merged, since every Cursor project hook shares it: a `create --existing` run replaces the
entries naming `plugins/linteljs/hooks/` and keeps the rest, and `sync` never touches it.
`.github/hooks/linteljs.json` is linteljs's own name in a directory Copilot reads whole, so it is owned outright. VS
Code's Local agent also reads `.github/hooks/*.json` but sends its own payloads with tool names it leaves to the
debug log, so nothing relies on it.

### Gemini CLI and Antigravity: one AGENTS.md, hooks for Gemini CLI only

| fact | source |
| --- | --- |
| Gemini CLI reads `GEMINI.md` by default and any other name listed in `.gemini/settings.json` `context.fileName` | geminicli.com/docs/reference/configuration, `context.fileName` |
| Gemini CLI hooks live in `settings.json` under `hooks.<Event>` as `{ matcher, hooks: [{ type: "command", command }] }`, with `$GEMINI_PROJECT_DIR` in the docs' own command | geminicli.com/docs/hooks |
| every hook gets `session_id`, `transcript_path`, `cwd`, `hook_event_name`, `timestamp`, and a tool event `tool_name` and `tool_input`; `BeforeTool` denies with `decision` and `reason`, and `AfterTool` appends `hookSpecificOutput.additionalContext` to the tool result | geminicli.com/docs/hooks/reference |
| Antigravity reads `AGENTS.md` or `GEMINI.md` with no frontmatter, and drops a `.agents/rules/*.md` without a `trigger` of `always_on`, `model_decision`, `glob` (with `globs`) or `manual` | antigravity.google/docs/rules |

`AGENTS.md` is the one adapter for Codex, Gemini CLI and Antigravity, written once whichever of them is chosen.
Gemini CLI reads it through `context.fileName`, which keeps `GEMINI.md` listed so a project's own still loads.
A second adapter would load twice in Antigravity, which reads both names.

Gemini CLI sends Claude Code's field names with its own event names, so `utils/hostUtils.ts` tells it apart by
`hook_event_name` and, as with Cursor, its one shell tool takes the platform's dialect. A denial answers before the
tool; the eslint warning and the banned-pattern findings are added context after it, since an `AfterTool` block
replaces the tool's result. No commit gate: its payload documents no exit status. `.gemini/settings.json` is merged
like `.cursor/hooks.json`, and `sync` never touches it. Gemini CLI has no path-scoped rules, so it reaches the rules
through the skill `AGENTS.md` names, as Codex does.

Antigravity gets the rules in `.agents/rules/`, `trigger: glob` with Cursor's comma-joined `globs`, or `always_on`
for a rule with no `paths:`. Its hooks and MCP files have no official schema yet, so it gets neither.

## Comments

A comment states a why the code cannot: a measurement, an upstream issue, a constraint, a deliberate deviation. One
or two lines. What the next line does is not a comment; history is not a comment; a decision worth a paragraph
lives in this file and the comment points here. Exported API in the two published ESLint packages keeps a
one-sentence doc where the name alone does not say what a value means. Tests keep a comment where a fixture's shape
has a reason not on screen.

## One shape for every ring

A ring is named for what its members are, or for the world it reaches where the world is the membership test. A
subject is a kebab-case directory holding one entry named for it, its suite, a `constants.ts` for a table it alone
owns, and a `utils/` for helpers only it reads. The entry takes the singular of whatever names the kind: the ring
where the ring has one (`targets/` gives `reactTarget`, `spawns/` gives `gitSpawn`), the group where a group changes it (`disk/read/` gives
`projectShapeReader`, `pipeline/passes/` gives `fixPass`), and nothing where a ring has no one kind (`terminal/`
holds `cli/cli.ts`). `disk/` splits into `read/` and `write/` so the group supplies `Reader` and `Writer`; `spawns/`
is a plural of its members, every one of which runs a binary and waits.

`src/meta.test.ts` carries a row per ring: the suffix its entries take, the registry that has to name the same
subjects where there is one, and `files: true` for rings read by path rather than by subject. One table rather than
a file per ring, because the assertions are identical, so a new ring is one entry, held against `src/rings.ts`. It
also refuses a barrel export nothing outside the ring takes, and counts a take generously: a barrel is reached as
`./terminal` by a sibling and as `../src/terminal` from `__mocks__/`, and a re-export is a take, since
`src/index.ts` carrying `main` onward is the package surface asking for it.

`terminal/host/` asks which manager and which Node a run records, read off the user agent, the lockfile and `PATH`;
`nodeRefusal` sits in `terminal/host/utils/hostUtils.ts` beside the manager refusal that asks the same question of
whatever invoked the CLI.

**`eslint-config` takes the same shape.** `layers/<name>/<name>Layer.ts`, `frameworks/<name>/<name>Framework.ts`,
`libraries/<name>/<name>Library.ts`. The tsdown entries are keyed, so `dist/react.mjs` is flat whatever path backs
it. The suffix is on the file and not the export (`baseLayer.ts` exports `base`), because the export is what a
consumer imports and renaming it would be a breaking change bought for symmetry. `src/meta.test.ts` holds the
three groups and holds the tsdown entries to `exports` one to one, since an `exports` subpath with no entry builds,
typechecks and publishes, and only a packed-tarball smoke would catch it.

**`templates/` is laid out as the destination.** `project/` is the tree a project receives, `starter-source/` the
per-target starters, `fragments/` the pieces joined into one file, and `schemas/` the mirror of the repository's
own, published under a raw GitHub URL and pinned by `answers/utils/schemaUtils.test.ts`. `copied(target)` derives
the source from where the file lands, so a shipped file is spelled once; a fragment has no destination, so it keeps
an explicit list.

### One code file, one test file

`pnpm test:isolated` runs every suite in a process of its own and holds each source to the suite beside it, because
the merged run hides a module covered only by another file's test. A file with no suite is one of two things. A
`constants.ts` is data and has to stay data: a function or branch in one fails the run, since a table asserted equal
to itself proves nothing. A barrel of nothing but `export ... from` has no code, told by its source rather than its
name. Anything else without a suite fails however much it looks like a table, which is why `compose-config`'s loader
tables sit in `utils/loaderUtils.ts` with a suite, and why `answers/registry.ts` and the plugin's `rules/registry.ts`
have suites asserting what a reader depends on.

The suites that cover a package rather than one file (`meta.test.ts`, `types.test.ts`, `fixerSafety.test.ts`,
`ruleModules.test.ts`, `hooks.test.ts`) are named in `.claude/rules/repo-structure.md`; the report lists them so they
stay visible, and fails on any other test file with no source beside it.

## The shipped starter source, and the gate that reads it

`templates/starter-source/**` is outside every `tsconfig` include, ignored by the root `eslint.config.ts`, and
outside the vitest include. It cannot become ordinary source: it imports dozens of external packages this
workspace resolves none of (`@angular/*`, `expo`, `react-native`, `next`, `svelte`, `vue`, `solid-js`, `pinia`, every
`@tanstack/*` binding, every testing library, and the `$app`, `#lib` and `@/*` specifiers three frameworks resolve
themselves). Making it ordinary source means installing ten targets' runtime and test dependencies into a workspace
of three ESLint packages.

So `pnpm lint:starters`, a leg of `pnpm check`, lints each starter where it will run: in a generated project,
installed, under that project's own `eslint . --max-warnings 0`, type-aware rules included. A text read outside a
project has no program behind it: measured, the project service's default project over the starter
texts gave 6,261 findings across 488 files, every one from a type-aware rule and 6,210 of them `no-unsafe-*`, since
each framework import reads as an error type.

Its scope is the template texts: `STARTER_CASES` in `packages/create/e2e/starter-cover/` names 70 e2e cases that
between them write every distinct text a starter template can become, per target and destination, the joined test
setup included, and `starterCover.test.ts` fails when a template, a transform or a new answer
leaves a text no case writes, naming the labels that would reach it. What the emitters write themselves is left to
the end-to-end matrix, which runs every pair. Each case is the pipeline's own output (`pipelineRun`, install and fix
skipped) under `~/.cache/linteljs/typed/projects/`, with `@linteljs/eslint-config` and, through a pnpm override,
`@linteljs/eslint-plugin` read from `pnpm pack` tarballs named by their hash, so the layers and rules are this
checkout's. Every lint runs `pnpm install` (a changed tarball is a changed path, so it reinstalls) and `prepare`
by hand, since regenerating deletes what `prepare` wrote and a no-op install does not rerun it. Each case is first
generated into a scratch directory inside a git repository (so generating skips its own `git init`) and hashed
there, so a skipped case leaves its project, `.nuxt/` and `.svelte-kit/` included, as it was for a check run by
hand, and spawns nothing: with every case unchanged, 29.5 seconds became 14.5.

Every case with a suite then runs its own `test:coverage`, since `test` passed a Solid island whose project
stopped at 95% branches. The script name is part of each stamp, so a case stamped green under another script runs
again. The nine StyleX cases also run `build`: StyleX resolves `@styles` theme imports only when it compiles, so a
broken alias lints clean.

A case whose generated tree (less `node_modules`, the lockfile and `.git`) hashes as it did at its last clean lint is
skipped; `--all` lints every case. Measured on ten cores, five at a time: cold, 8.4 minutes; warm
with `--all`, 4.5 minutes; warm with nothing changed, 14.5 seconds. So `check` runs the changed mode and CI runs
`--all` first, with the cache keyed on `create`'s templates and source. A missing cache prints a notice and runs
cold rather than skip. `lint:starters:fix` writes a fix back to a template copied whole and untransformed, and only
when every case writing it fixed it the same way, since one text can land under two targets' rules.

`children?: React.ReactNode` with no React import is legal TypeScript, since `@types/react` declares `React`
globally for JSX. It is a style this standard holds, so it is `@linteljs/react-no-global-namespace`: published,
fixable, outside `recommended`, enabled by the React layer. The gate carries no copy of it.

## How `check` runs

`build` runs first, since the packages typecheck against each other's built declarations. `scripts/gate/gateScript.ts`
then starts the other six at once, each writing its own log under `node_modules/.cache/linteljs-gate/` (ignored, so
the commit gate's tree never sees it), and prints one line per step. A failed step adds the first 8 and last 6 lines
of its log, so an agent reads a failure in about fifteen lines rather than the whole run; under `CI`, where nothing
can read the file afterwards, it prints the whole log. The exit is 1 when any step fails.

The six are independent only because none writes what another reads. `lint:starters` packs the packages, and
`pnpm pack` runs `prepack`, which rebuilt `dist` while `typecheck` read it (TS2307 on `@linteljs/eslint-plugin`). The
gate sets `LINTELJS_GATE_BUILT=1` for its steps and `packTarball` then packs with `--ignore-scripts`; a
`pnpm lint:starters` on its own still builds through `prepack`.

Under `CI` the six run one after another. A runner has 4 cores and `test:coverage` alone keeps them busy, so running
the rest beside it would mostly stretch the suite; the series is the safe default there.

Measured on an M1 with ten cores, warm, every starter unchanged:

| step | chained, before | in series, after | at once, after |
| --- | --- | --- | --- |
| `lint` | 32.5 s | 29.7 s | 51.0 to 53.9 s |
| `lint:types` | 0.4 s | 0.3 s | 0.4 s |
| `lint:starters` | 29.5 s | 10.1 s | 53.4 to 54.0 s |
| `lint:css` | 0.7 s | 0.5 s | 0.9 to 1.2 s |
| `typecheck` | 5.4 s | 5.1 s | 15.8 to 17.2 s |
| `test:coverage` | 104 s | 96.5 s | 122.1 to 122.2 s |
| `check`, with `build` | 176 s | 146 s | 126 to 129 s |

`lint:starters` fell when unchanged starters stopped being prepared again. A changed case now also runs
`test:coverage`: every case changed, 95 at five at a time, took 10.9 minutes against 4.5 for a warm `--all` before,
about 35 seconds a case against 14. At once, every step slows under contention, but the wall time is `test:coverage`
plus `build`, about 18 seconds under the series (`CI=1 pnpm check`).

Tried and left out:

- **ESLint `--cache`.** The cache keys a file on its own text and the config, so a type change in one file leaves a
  type-aware finding in an unchanged file that imports it hidden. Probed: a function changed from
  `Promise<string>` to `string` made `await-thenable` fire in its unchanged reader; the cached run passed and the
  uncached one failed.
- **Vitest `pool: 'threads'` for `create` and `eslint-config`.** 143 seconds against 104, and 56 tests fail: a
  worker thread cannot `process.chdir`, and `os.homedir()` there does not read a stubbed `HOME`.
- **Incremental `tsc`.** Already on: `incremental` in `tsconfig.json`.

### Coverage runs in shards in CI

`ci.yml` runs `check` with `LINTELJS_GATE_SKIP=test:coverage`, the gate dropping each step that variable names,
and runs the suite as four `test:shard` jobs instead. Each writes a vitest blob with its coverage, thresholds off,
since one shard covers about a quarter of the code. The `coverage` job merges the four with `test:merge`, which
applies the one global 100% over the root `coverage.include`. Merged from three of the four, it fails at about 90%.

Vitest splits by file, and one file, `composeConfig.test.ts` at 57 s, sets the floor. Measured on an M1 with ten
cores, the slowest shard took 75 s at two and at three (the two slowest files share a shard), 67 s at four; past
four, no shard drops below that one file, and every shard pays its own install and build.

### The coverage badge is CI's own number

The READMEs' coverage badge reads a shields endpoint JSON, not a coverage service and not a fixed 100%. On a push
to `main`, the `coverage` job turns the merged `coverage-summary.json` into that JSON, its message the lowest of
the four totals, and force-pushes it as the one commit of the `badges` branch, which the badge reads through
raw.githubusercontent.com. The step runs after a threshold failure too, so a drop shows. It needs
`contents: write`, which only that job gets; pull requests never publish.

## One version per shared dependency

A dependency more than one package in this workspace declares reads `catalog:`, and its version lives once in the
`catalog:` block of `pnpm-workspace.yaml`. Two ranges for one package in one workspace is a copy, and copies drift
until nothing says which was meant: `~x` in two packages and `^x` in a third is the shape it takes.

Peer ranges stay out, because they are deliberately wider than what this workspace installs: `eslint` is `>=9` for a
consumer and `catalog:` for development.

`pnpm pack` rewrites the protocol to the catalog's range, so a published tarball never carries `catalog:`. That
means releases go through pnpm; a bare `npm publish` would ship the protocol verbatim.

`@linteljs/create`'s `VERSIONS` table is deliberately **not** on the catalog. It names versions for somebody else's
project, and the two move for different reasons. The one coupling that matters, that a generated project is never
handed something older than the layers it installs were built against, is gated by `packageJsonUtils.test.ts`
against the catalog.

## The end-to-end matrix

Every answer that changes emitted code is covered, in a matrix of cases rather than the whole product. `matrix.ts`
enumerates them; nothing is listed by hand. Per target, every legal combination of the varying axes is enumerated
under pnpm, and a greedy cover keeps enough of them that every *pair* of answer values appears at least once: 151
cases. The axes are `hostedFramework`, `browser`, `styling`, `form`, `router`, `store`, `data`, `mocking`,
`languages`, `testing`, and each library on or off as an axis of its own. `agents`, `plugins` and `surfaces` are
always their full value, and `typeSafety` is always `strict`: neither changes what is installed, and `relaxed` only
loosens rules over the same files. `languages` is none or all six, since a project without it must stay covered, and the full set holds both zh tags, so `zh-TW` resolves only through
an exact-tag match.

On top of the pairs, 49 more. Per target, the first case answering the most (every library, every optional answer
the target offers) runs once on each other manager, npm, Yarn 4 and bun: 33 smoke cases. A smoke is the whole case,
so it holds each manager's config files, the husky install script under the lifecycle husky documents for it
(`prepare` for npm, pnpm and bun, `postinstall` for Yarn 4), the layout Metro has to read through symlinks, npm's
`npm ls --all`, and `INSTALL_NOISE` at the same strictness as pnpm. On React, the same case runs again with
`--skip fix` and with `--no-install`, after which the harness installs and runs `check` itself, and as a monorepo
on each of the four managers, which also commits through the hooks: lint-staged in the app, commitlint at the
root. The pnpm monorepo runs once more with `sync --add lib` and a second install before `check`, which `CI`
freezes, so an added package reaches the lockfile and passes the workspace's gate. On every target a
browser serves, the same case runs a browser pass after `check`: 8 cases. React's widest case takes the
declarative router, so the widest React Router framework-mode case runs a ninth browser pass, on npm, the one
server-rendered React.

An install is around 60% of a case, 19.7 to 30.5 seconds of a 39 to 52 second one, so the full product is days of
machine time and splitting it across machines divides that rather than reducing it. Installing once per distinct
dependency set would not fix it: `typeSafety` is nearly the only axis that changes nothing installed, a 30% cut not
worth a tree-cloning mechanism.

### Every pair of answers, not every combination

Every defect the suite has found was a two-way interaction, and none needed a third axis pinned:

| defect | the two answers |
| --- | --- |
| `ERR_PNPM_IGNORED_BUILDS` on `vue-demi` | hosted framework Vue, with TanStack Query |
| floating promise in `src/devtools/index.ts` | the extension target, on Chrome |
| a leftover `app.spec.ts` | Angular, with `testing: none` |
| `@mocks/renderScreen` importing what is not installed | React Native, with `testing: none` |

Greedy set cover over the legal enumeration: every case it can pick is one `refuseMisfit` accepts, so nothing has to
be checked for legality and the pair universe is by construction the reachable one. It is deterministic, so a label
that failed names the same case when run again with `-t`. Three-way interactions are given up; `E2E_FULL=1` runs the
cross product for a pre-release sweep. `matrix.test.ts` pins that no reachable pair is lost, against a pair
definition of its own rather than the generator's, and that the combination behind each defect above still appears.

The manager is not an axis. What it changes is how the dependency set a target emits is resolved and the files
the CLI writes for it (`pnpm-workspace.yaml`, `.yarnrc.yml`, the script spellings), and the widest case holds every
dependency a target can emit, so one smoke per manager and target installs all of them. What a manager resolves
differently but still installs is the accepted risk under [Non-goals](#non-goals).

### The browser pass

`browser/browser.ts` serves the built project with its own `preview` script (`start` for Next, `ng serve` for
Angular, which has no preview server), loads `/` in the system Chrome through `playwright-core`, and follows every
same-origin link the page holds, each loaded fresh so the server answers it too. A console error, an uncaught page
error, a status other than 200 or a page without an `h1` fails the case. `channel: 'chrome'` rather than a
downloaded browser, because the CDN playwright downloads from can be blocked where npm is not. The extension and
React Native have no pass: an extension's pages are loaded by the browser from `dist/`, not served, and React
Native's web build is not what ships. A library has no page. On a server-rendered target with `languages`, the pass
picks a language in the page and holds that the raw HTML of the next route already carries its `lang` and `dir`. Framework mode also
requests a path no route claims and holds that its catch-all answers 404 with an `h1`, in the chosen `lang` and
`dir`. Measured: 1.8 s on Next, 3.7 s on React, 5.6 s on Angular, on top of a 50 to 60 second case.

### One registry on a fixed port

The suite publishes the three packages to a local Verdaccio on port 48730, one registry per run. Yarn's global
metadata cache stores tarball URLs including the port, so a fixed port keeps that cache valid between runs rather
than pointing at a dead host. In `e2e.yml` every job is its own machine; locally, parallelism is `maxConcurrency`
inside one process. One process publishes once, so there is no publish lock, and the CI cache key carries no job,
because npmjs serves every manager the same bytes.

### The split is by package manager, not vitest's `--shard`

Vitest splits by file, and one file holds every target, so a file split balances nothing. A runner cannot honestly
hold every manager: a machine carries one yarn, and the suite needs a 4. So `E2E_PM`
names one manager, and the suite runs its cases on whatever binary of it is on PATH, reading the version from
`--version`. A yarn whose major does not match fails the run once, before any case. `e2e.yml` runs one job per
manager. Unset, a run takes every manager whose binary answers with a version this suite would record as that
manager.

The jobs are not even and do not need to be: pnpm carries most cases, and npm, Yarn 4 and bun a smoke each.
Measured on one machine at concurrency two, a 16-case subset (12 pnpm, 4 smokes) took 980 seconds, about 61
seconds a case; a React Native smoke on npm took 197.

### Concurrency is real, and caches are shared carefully

A case is an `it.concurrent`, and `spawnSync` would block the event loop for the length of an install. `run`
collects from a `spawn`, keeping stdout and stderr in separate buffers and joining them at the end exactly as
`spawnSync` would: every matcher in `INSTALL_NOISE` is line-anchored, and interleaving by chunk can split a line.

Files stay serial and the cases inside one run together. A run without `E2E_PM` mixes managers in every file, so
`createProject` holds one install per manager at a time, pnpm excepted: its store is built for concurrent writers,
and yarn's and bun's caches are not. Only one yarn is ever in a run, so the two never share `YARN_CACHE_FOLDER`.

bun's cache is pruned rather than deleted. bun has no split between a cache of bytes and a cache of which versions
exist, and the suite publishes `@linteljs/*` under a version no run has used, so a cached manifest does not list it.
`pruneBunCache` deletes only the `@linteljs/*` entries. Anything the prune misses fails loudly, because
`verifyLintOutput` asserts the resolved version is this run's.

npm's cache lives in `.e2e/npm-cache` and teardown removes it. npm never evicts, and kept across runs it reached 34
GB; the npm smoke is a handful of cases, so a cold cache costs one run little.

## Releasing

Push a branch named for the version. That is the whole ritual:

```
bump the three package versions, and the two constants that mirror them
git switch -c v1.2.0 && git push -u origin v1.2.0
```

`ci`, `e2e` and `release` all start from that push. `release` waits for the first two, runs the gates too slow for
`ci`, publishes all three, and only then writes the `v1.2.0` tag and the GitHub release. Nothing releases off
`main`, because `main` is not a `v*` branch.

- **One version across three packages.** They are one product with a one-way dependency, and `@linteljs/create`
  writes a range for `@linteljs/eslint-config` into every project. Independent versions would be a matrix nothing
  tests, so the branch name states the version once and the run refuses if any package disagrees.
- **The branch is the trigger, not a tag.** A tag can be pushed onto any commit, so it never says where a release
  came from; a branch trigger makes "which branches contain it" tautological.
- **The tag is written after the publish.** A tag means all three are on npm, which is what lets it refuse a second
  push to the same branch rather than running every gate to die on a version conflict.
- **The branch deletes itself once the tag holds the commit.** The delete names `refs/heads/` in full, because with
  a tag of the same name `git push origin --delete v1.2.0` answers `dst refspec matches more than one` and removes
  neither, failing the run after all three packages are published.
- **`release` waits for `ci` and `e2e` rather than reading their conclusions.** They start from the same push, and
  an in-progress run has no conclusion to fail on, so reading without waiting passes vacuously.
- **No `NPM_TOKEN`.** Each package has a trusted publisher on npmjs.com naming this repository, this workflow file
  and the `npm` environment, and pnpm exchanges the workflow's OIDC token for a short-lived one. Renaming
  `release.yml` breaks publishing until all three are re-registered.
- **Publish order is plugin, then config, then CLI**, each after what it depends on, so a consumer installing
  mid-release always resolves a complete tree.
- **A version bump touches five files.** The three `package.json`s, `packages/eslint-plugin/src/plugin.ts`, which
  hand-writes `meta.version` because ESLint reads it off the plugin object, and
  `packages/create/src/emitters/constants.ts`, which pins the range generated projects get for
  `@linteljs/eslint-config`. Both are held against `package.json` by a test (`meta.test.ts`,
  `packageJsonUtils.test.ts`), so a missed one fails `pnpm check`. The three `CHANGELOG.md` files change by hand.

## Workspace lint exemptions

The measurements behind every block in the root `eslint.config.ts`. They live here because each is a paragraph and
the config is a list of decisions. Each block names the heading below that holds its reasoning. An exemption whose
measurement is missing from this section is an exemption to delete.

### Ignores

`dist/`, `coverage/`, `.vitest/`, `.smoke/`, `.compat/` and `reports/` are tool output: `.vitest/blob/` holds
CI's coverage shards, `.smoke/` exists while a package's `smoke` script runs, `.compat/` during the plugin's
`compat`, which installs six ESLint majors into it, and `reports/` is where `mutation` writes Stryker's HTML.

`__mocks__/fixtures/` is deliberately defective input for `eslint-config`'s own tests: an import cycle, an
unawaited promise, and an SFC pair. Linting them reports the defect each exists to trigger, and the `.vue` and
`.svelte` pair cannot parse without the layers those tests compose.

`templates/fragments/test-setup/setupTests.angular.ts`, `setupTests.reactNative.ts`, `setupTests.msw.ts`,
`setupTests.mswJest.ts`, `setupTests.i18n.ts`, `setupTests.reactNativeI18n.ts`, `setupTests.vueI18n.ts` and `templates/starter-source/**` are shipped
source, copied to disk and never imported here. Each imports the framework it is written for, none of which is
installed here, so every import is unresolvable and every call through one untyped. The MSW setup differs only in
what it reaches for: `./msw/node`, a path in the project it lands in and no path at all here; the i18n setups
reach for `@i18n` alike, an alias only that project declares. They are data here
and code only in a generated project, where that project's own `eslint .` judges them; `pnpm lint:starters` and the
end-to-end suite are what prove it.

Measured for `setupTests.mswJest.ts`, the Jest twin of the MSW setup: without its entry, `eslint` on
it reports 9 errors, every one `no-unsafe-call`, `no-unsafe-member-access` or `no-unsafe-assignment`, because the
`jest` global and `./msw/node` resolve to nothing here.

The two Claude Code mods, the shipped check band under `packages/create/templates/project/plugins/linteljs/` and
this repo's own under `.claude/skills/linteljs/`, import `claude-code` and `claude-code/testing`, modules only the
Claude Code engine provides. Locally they are typechecked and linted against the declarations the engine writes:
`pnpm mod-types` puts them at each mod's `.claude-plugin/types/` (gitignored), each mod's `tsconfig.json` extends
them, `pnpm typecheck:mods` runs `tsc` on both, and `modModules()` in `eslint.config.ts` hands the files those
tsconfigs check to ESLint. In CI no engine runs to write them, so `scripts/typecheck-mods/` skips and
`UNTYPED_MODS` ignores every mod whose `index.d.ts` is missing. That lasts until Anthropic publishes the types
for 2.1.289 or later: `claude plugin validate` and `claude plugin test` strip types without checking them
(anthropics/claude-code#99771), and they run locally only: `claude plugin test` on the repo mod alone is the
check band's gate (its suite runs there as a copy). CI runs neither. `.fallowrc.json` ignores `.claude/**`.
Measured: without it `fallow list` finds the repo mod's 13 files, and `fallow` fails on 12 unused files (the
engine loads `register.tsx` by name, and `claude plugin test` runs the suites), the check band copy as a clone
group, and 20 health findings scored on Fallow's estimate, since `claude plugin test` writes no coverage.

The decisions the mod's code cannot show:

- **The check band is a copy.** `claude plugin validate` refuses an import from outside the plugin's folder, a
  symlink, and a second `modules` entry, so the shipped `checkBand.tsx` and its suite are carried byte for byte.
  An `it.each` in the shipped `hooks.test.ts` fails the moment either copy drifts from its source.
- **It is named `linteljs`.** The band's atom is keyed to plugin `linteljs`; under another name the copy would
  need an edit, and it would stop being a copy.
- **The CI band listens on classic events.** The check band holds `session.start` and `turn.complete`, so the CI
  band refreshes on `classic.SessionStart` and `classic.Stop` (the main session's), at most every 3 minutes.
- **One line, drawn by the CI band.** The copy stays byte-equal, so `register.tsx` takes only its refresh and
  the CI band's render draws the check state first, with the shipped `MARKS`. It declares its own `check` atom:
  the engine refuses a `read` of an atom imported from another module.
- **Stale worktrees warn, never deny.** A worktree no agent of this session owns may belong to another session's
  live agent, so a deny would block work that is not stale. A HEAD ahead of `origin/HEAD` adds an `ff-only` note
  to the spawned agent's prompt, since a new worktree starts at origin's default branch.
- **A refused note is swallowed.** The leftover-worktree warning goes through `session.append`, which the engine
  may refuse; the refusal is caught so the spawn and its base note still go ahead.
- **No guard carries a `.catch`.** The engine drops a hook that throws or overruns and the call goes on without
  it, which is also what a `.catch` answering `undefined` does, so a broken guard never takes the tool down.
  Measured: a `tool.call` hook that throws, registered with and without that `.catch`, passes the call on
  either way under `claude plugin test`.

### `'**/utils/*.ts': '*Utils'`

`check-file` takes a raw glob as the naming pattern: the rule validates the value with `is-glob` and micromatches the
extension-stripped basename against it (`eslint-plugin-check-file@3.3.2`, `filename-naming-convention`). So
`*Utils` is a pattern, and it and the `CAMEL_CASE` entry above it both apply, which makes `layoutUtils` the only
shape satisfying the pair. Proven to fire: `src/utils/stray.ts` reports `The filename "stray.ts" does not match the
"*Utils" pattern`, and `strayUtils.ts` exits 0. `ignoreMiddleExtensions` is on, so `layoutUtils.test.ts` is judged
on `layoutUtils`.

### `resolver: { project: 'packages/*/tsconfig.json' }`

The default resolver reads a single tsconfig discovered from the working directory, which in a workspace is the
root, and each package's `@mocks/*` lives in its own tsconfig. Measured without the override: 156
`import-x/no-unresolved` findings, every one an `@mocks/` import.

`noWarnOnMultipleProjects` rides beside it. The resolver prints "Multiple projects found" twice per run when
`project` is a glob, and its advice (one tsconfig with references) is a layout this workspace deliberately does not
have. The notice carries no finding, so silencing it changes nothing `pnpm lint` reports.

### `@linteljs/workspace/create-rings`

`answers/`, `config/`, `targets/` and `utils/` are the inner rings and reach nothing outward. `emitters/` turns
answers into file text and may read the inner rings but not `disk/`, `pipeline/`, `spawns/` or `terminal/`. The
direction only ever points inward. Among the inner four it points one way too, in `INNER_RINGS` order: `answers/`,
`targets/`, `utils/`, `config/`, each reading only those after it. The zones are built from `INNER_RINGS`,
`MIDDLE_RINGS` and `OUTER_RINGS` in `packages/create/src/rings.ts`, the one list of the rings, so a new ring is a line
there rather than an edit here.

A route around it through the package barrel is not a third zone: `src/index.ts` re-exports from the outer rings, so
an inner ring importing it is a cycle, which `import-x/no-cycle` in `base` already reports. It lives in the
workspace config rather than a layer because the ring names are this package's, not the standard's, and it is scoped
to source: a test arranges and asserts across rings by nature. The inner order alone also holds in the suites,
through `@linteljs/workspace/create-rings-tests`, with one exemption: a `targets/` suite may take its answer fixtures
(`DEFAULT_ANSWERS`, `ANSWERS`) from the `answers/` barrel and nothing deeper. Eleven suites do; the records under test
are built from answers, and a copy of the defaults in `__mocks__/` would be a second spelling of them.

### `@linteljs/workspace/create-worlds`

Which folder a module belongs to is read off its import lines: `node:fs` means `disk/`, `node:child_process` means
`spawns/`, `node:process` and `@inquirer/*` mean `terminal/`. Nothing else may reach a world, so the only route to a
disk is a function that can be substituted, and `answers/`, `targets/` and `emitters/` are provably pure. The
patterns and the exemptions are built from `WORLDS` in `rings.ts`: a ring is exempt from the world it owns. The e2e
harness spawns real managers and nothing else, so it lives outside `src/` in `packages/create/e2e/` and the block
never reaches it. `pipeline/` owns no world, so it is held like any inner ring.

`node:path`, `node:os` and `node:url` are not restricted: path arithmetic touches nothing. `spawns/` reaches `disk/`
for one thing, `isExecutableFile`, which is how a binary on `PATH` is resolved: a filesystem question only a spawner
asks, one way, since nothing in `disk/` spawns. It is sync on purpose, because its answer feeds a `spawnSync` with
no asynchronous point to wait at.

### The `es-toolkit/compat` ban

`es-toolkit/compat` is banned outright, in every package: the strict entry or the standard library. `/compat` is
the lodash-compatibility build, and this workspace never had lodash to migrate from, so its looser signatures only
buy a way to make a call typecheck that should not have been an es-toolkit call. es-toolkit itself is in use:
bundled into `eslint-config` and `eslint-plugin`, and a runtime dependency of `create`. Measured: the strict `sortBy` and
`orderBy` are `<T extends object>` and take no `string[]`, while `/compat`'s `sortBy<T>(collection: ArrayLike<T>,
...)` accepts every string sort here. Taking it would replace `localeCompare(left, right, 'en')` comparators with a
default comparison that orders mixed case differently, which moves the bytes of `plugins/linteljs/managed.json`,
and nothing pins that file's order.

`base` carries the ban, so this workspace is held to it through the layer it publishes. Two config objects naming
one rule do not merge their options; the later replaces the earlier wholesale. So a workspace block naming
`no-restricted-imports` after `base` replaces the published ban, and a workspace-wide block after `create-worlds`
would switch the `node:fs` restriction off. `create-worlds` therefore repeats the compat pattern: it is the last
block naming the rule for `packages/create/src/**`, and what it replaces is `base`. Both halves are checked by
probing: a compat import and a `node:fs` import in an emitter are each reported.

### `@linteljs/workspace/create-config-data`

`src/config/` is data and only data: `types.ts` and `constants.ts`, the types, constants and tables no ring owns. A
function that builds one of them goes to a `utils/` at the level of its readers, which is the rule that decides
where a helper sits anywhere else: `emitted`, `copied` and `merged` are in `emitters/utils/artifactUtils.ts` and the
managed-record builders in `emitters/utils/managedUtils.ts`, because only emitters read them, while `Artifact`,
`MANAGED_PATH`, `RUN_PREFIX` and `NODE_FLOOR` are read by several rings and stay. The gain is that `src/config/`
carries no suite and no coverage: asserting a table equals itself proves nothing, and what is worth checking about a
table is a fact about the code that reads it. `src/types.test.ts` pins the types this package redeclares from
`@linteljs/eslint-config` to that package's own, at the package root because it is a fact about two packages.

The selector is `ArrowFunctionExpression`, `FunctionDeclaration` and `FunctionExpression`, not `TSFunctionType`. A
function *type* is vocabulary and stays: `Emitter`, `MergedText.merge` and `CopiedAssets.transform` describe a shape
a ring implements rather than behaviour this folder owns.

### `noInlineConfig`

`linterOptions: { noInlineConfig: true }` at the root, so no `eslint-disable` in this repo can suppress anything. A
directive becomes inert and is reported as having no effect, which `--max-warnings 0` on `lint` turns into a
failure, and the rule it named fires regardless. Measured both ways: a stray directive exits 1, and one over a real
`console.log` reports the `no-console` error as well. This workspace keeps its exemptions in one file with a
measurement each, and an inline directive is neither.

Root rather than `base`, so it is not shipped. A generated project is already held to this by
`scripts/checkBannedPatterns.ts`, which refuses the directive at write time through the `PostToolUse` hook and on
commit through lint-staged, and putting it in the layer would make every existing consumer's directives inert on
upgrade: a breaking change for enforcement the project already has.

### `@linteljs/workspace/scripts`

Every script under `scripts/` and `packages/*/scripts/` reports through the logger a generated project receives,
`packages/create/templates/project/scripts/utils/loggerUtils.ts`. So this block turns `no-console` *on* for every
method, `warn` and `error` included, with options given since severity alone inherits the layer's `allow`, and
`@linteljs/workspace/scripts-logger` turns it off for that logger alone: with it on, the logger reports 6 findings. `base()` still stands the
rule down under `scripts/` for a consumer, a published default that is not this repository's to narrow.
`release/run-rules/runRulesRelease.ts` writes to `process.stdout` instead: it runs in a container holding only the
plugin's own `dist/` and `scripts/`, with no logger above them.

### `@linteljs/workspace/ast-identity`

`sonarjs/different-types-comparison` cannot read an AST identity check. ESLint brands every node it hands a rule:
`Rule.Node` is `(Program & { parent: null }) | (Exclude<ESTree.Node, ESTree.Program> & NodeParentExtension)`. A node
reached through a field (`parent.callee`, `parent.object`, `outer.parent.body`) carries the plain ESTree type, and
sonarjs reads the intersection and the union member as disjoint, so it calls `parent.callee === fn` impossible when
that is the whole question the rule asks.

Measured with the rule forced on: it reports five comparisons across the three files the block names. They are
not constant, which the plugin's 100% branch gate proves: each is taken both ways by a test. Treat the count as a
reading to re-take, not to trust; if it reaches zero, the reports are right and the block is wrong. The files are
named one by one, so another site has to be added on purpose.

### `@linteljs/workspace/rule-tester`

`RuleTester.run()` registers its cases at module scope, and `sonarjs/no-empty-test-file` looks for a literal `it` or
`test` call. It finds none and calls the file empty: forced on, it reports 25 of the 26 rule suites. Measured too: wrapping `tsRuleTester.run(...)` in an explicit
`describe(...)` does not silence it either, so no shape of the file satisfies it. Scoped to the rule suites alone.

### `@linteljs/workspace/e2e-source`

An inclusion rather than an exemption. `base` treats every `e2e/` as a suite, which is right for a generated project's
Playwright folder and stays as shipped. This workspace's one `e2e/` is the create harness, `packages/create/e2e/`,
which is source that happens to drive a suite, so the root config maps `base`'s output and drops `**/e2e/**` from
every block's `files` and `ignores`. Its `*.test.ts` stay suites through `**/*.{test,spec}.*`. Measured: the
source-only blocks reach its non-test modules and found five `no-magic-numbers` (a 200 status, the ping's 100 attempts and 200ms interval, a milliseconds divisor, the three parts
of a version) and nothing from `expression-complexity`, `max-lines` or `max-lines-per-function`.

### `@linteljs/workspace/e2e-test`

`targets.e2e.test.ts` under `packages/create/e2e/targets/` is `it.concurrent.each(cases)(label, runE2eCase)` per target,
and every assertion lives in `runE2eCase`. `vitest/expect-expect` reads the callback body for `expect` calls and
finds no body, since the helper is passed by reference. Measured: `assertFunctionNames: ['runE2eCase']` does not help,
because it matches calls inside the body and there is no call. Off for that directory alone.

### `@linteljs/workspace/band-types`

`packages/create/templates/project/plugins/linteljs/types/index.d.ts` is the check band's state contract and
`.claude/skills/linteljs/types/index.d.ts` the repo mod's, and `claude plugin validate` reads a plugin's state
only from an inline shape in `interface PluginState`. Measured on Claude Code 2.1.289: with
`linteljs: LinteljsState`, a named interface, validate fails with `linteljs.check is not declared`; inline, it
passes, and `eslint` on the file reports 1 error, `no-inline-object-types`. Off for those two files.

### `@linteljs/workspace/mods`

Two rules restated for the files the mods' tsconfigs check (`modModules()`), and nowhere else.

- `@typescript-eslint/no-misused-promises` with `checksVoidReturn.arguments: false`. The engine's `On` is one
  overload per event, and checking each async hook passed to `on(...)` against them stalls the rule. Measured on
  `repoGuards.ts` at the rule's defaults: 318,223 ms of a 319.9 s run, with no finding (an earlier run gave
  326,041 ms of 331 s); with the option the run takes 1.6 s, again with no finding.
- `import-x/no-unresolved` ignoring `^claude-code(/testing)?$`. Both are ambient `declare module` blocks in the
  engine-written types, which the resolver cannot reach. Measured: 9 findings without the ignore, 3 `claude-code`
  and 6 `claude-code/testing`, all such imports; `tsc` resolves them through `pnpm typecheck:mods`.

### Coverage thresholds, in `vitest.config.ts`

A gate, not an aspiration. The root config is what gates: a package's own `vitest.config.ts` coverage block is
ignored once the run comes through `projects`.

One global block at 100% rather than a key per package. A glob key takes its files out of the global thresholds, so
with keys a folder nobody named stays ungated; with one global block every file in `coverage.include` is held, and a
file joins the gate the moment it is included.

The end-to-end harness sits in `packages/create/e2e/`, outside every `src/`, so the include never reaches it: it
spawns, publishes and needs the registry, and a helper there would land as a 0% file against a 100% threshold. Its
pure suites (`matrix/`, `starter-cover/`) still run in the default suite, held by their assertions rather than the
gate. Beyond each package's `src/`, the include names the `utils/` modules of the package scripts (the plugin's
audits and release scripts, and `collect-builds` and `smoke` in create), the pure half of a script that otherwise
spawns, each with its own suite. A script's entry (`smokeScript.ts`, `collectBuildsScript.ts`) has none: it reads
its arguments, spawns or writes, and logs, and every decision it makes is in its `utils/`. `writeSchemasScript.ts`
has no `utils/`: it writes what `schemaFor` answers, which `answers/utils/schemaUtils.test.ts` holds.
It also takes every `utils/` file under `packages/create/templates/project/`: the logic
of every shipped hook and gate script, and the shipped logger. They reach every generated project, and a guard there is security code. Each hook
and gate script is a thin entry over its `utils/` module: it reads stdin or argv, calls one function and exits, so
every decision it makes is in the gate. The entries stay out of the include, since their suites spawn them under
`node`, where v8 sees nothing; those suites hold the wiring end to end. `readPayload` takes a path so its suite reads in
process what a hook reads from stdin. Nothing else is excluded: `cli.ts` is not an entrypoint, since `bin/createLinteljs.ts` reads
`process.argv` and sets `process.exitCode`, and `main` is a function from an argv array to an exit code that
`cli.test.ts` calls directly.

## Still open

Neither of these is a decision anybody made, and both are one line to change.

- **Whether a generated project takes Geist.** `ai-manager` ships `@fontsource-variable/geist`. The starter's
  `--font-sans` is a system stack, so adding Geist in front of it is additive. Two packages in every project is the
  cost.
- **One measure across pages, or two.** Form fields want a narrower column than a row list does. It is a single
  value in the shared stylesheet.
