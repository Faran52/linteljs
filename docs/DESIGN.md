# Design

Why linteljs exists, and the decisions that are not visible in the code.

Everything else lives with the thing it describes: the layers are documented in
`packages/eslint-config/README.md`, the pipeline in `packages/create/README.md`, and each non-obvious mechanism in
a comment beside the code that needed it. A design document that restates code goes stale and then misleads. This
one states each decision as it stands, with the reasoning and the measurement that hold it up today.

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
- [What a project owns](#what-a-project-owns)
- [The agent hooks](#the-agent-hooks)
- [Comments](#comments)

For work on this workspace itself:

- [One shape for every ring](#one-shape-for-every-ring)
- [The shipped starter source, and the gate that reads it](#the-shipped-starter-source-and-the-gate-that-reads-it)
- [One version per shared dependency](#one-version-per-shared-dependency)
- [The end-to-end matrix](#the-end-to-end-matrix)
- [Releasing](#releasing)
- [Workspace lint exemptions](#workspace-lint-exemptions)
- [Still open](#still-open)

## The problem

Lint, type, test and agent standards get copied by hand into each new project. The copies drift.

`compatlens/eslint.config.js` (166 lines) and `self-portfolio/eslint.config.js` (200 lines) were roughly 85%
identical: the same `@stylistic` overrides, the same five `import-x` rules, the same `unused-imports` block, the
same sort groups, comments included word for word. They had diverged in a way that silently disabled a rule:

| setting | self-portfolio | compatlens | `importX.flatConfigs.typescript` |
| --- | --- | --- | --- |
| `import-x/parsers` | absent, so `no-cycle` never fires | `.ts`, `.tsx` only | `.ts`, `.tsx`, `.cts`, `.mts` |
| `import-x/extensions` | absent | absent | 8 extensions |
| `import-x/external-module-folders` | absent | absent | present |

The comment explaining why `import-x/parsers` is required existed only in the repo that had it. Nothing could
have said which copy was right.

## The goal, and the rule under it

One command produces a new project with the standard already applied. One command re-applies it to a project that
already exists. The shared rules live in a published package, so a fix reaches every project on update instead of
being re-copied into some of them.

Every decision below is the same decision: a thing is spelled once, in one place, and everything that needs it
points at that place rather than carrying a copy. Every copy is a future disagreement, and the one that loses is
usually the one nobody was reading.

- **One token source.** `tokens.css` holds every value. Tailwind's `@theme inline` and StyleX's `defineVars` both
  point at those custom properties, so `bg-primary`, `tokens.primary` and `var(--primary)` are one colour.
- **One page, one file.** The starter's markup does not change with the styling answer.
- **One file per axis, never per combination.** A file that would vary by two answers is split until each half
  varies by one.
- **One list.** The pages the header renders and the pages the router registers are the same array. The rings and
  their direction are one list that the lint config and its own suite both read.
- **One rule, one place.** `rtk-query` is legal or not by one predicate, which the prompt hides by and the parser
  refuses by.

## Non-goals

These are decisions, not omissions. Re-adding any of them needs an argument.

- **No official scaffolder is run.** `@linteljs/create` writes every file of a project from its own templates. A
  borrowed template is a ceiling: every improvement to what a project is born with becomes a patch against a file
  somebody else wrote, as an exact string match a generator can invalidate without warning, and an answer that has
  to reach into rendered source (a router, a form, a store) has nowhere to land. Owning the template is affordable
  because the authoring job is small: scaffolded with the exact argv each record once produced, what a project
  needs beyond this CLI's own emitters is under two dozen files on every target but React Native, most of a
  generator's source files are demo content that is deleted rather than maintained, and the boot wiring that
  genuinely comes from upstream is a handful of files per target that change rarely.
- **No drift gate against upstream generators.** A generator's output is not a proxy for anything this repository
  wants to be measured against, because the templates follow this repository's own principles. The end-to-end
  suite performs a real generate, install and full gate for every target, so a framework change that *breaks* a
  project is caught. What is declined on purpose is the weaker signal that a framework has begun *recommending*
  something new: a run of every generator against the templates reported 90 paths, almost all of them welcome
  screens, logos and images, and each needed a hand-kept reason to be declined. Do not build one without first
  overturning this.
- **Latest version of each framework only.** No version matrix. `VERSIONS` in
  `emitters/constants.ts` is the table that says what latest means, framework runtimes
  included; nothing arrives from a generator's own `package.json`.
- **No JavaScript output.** `@linteljs/create` generates TypeScript, and there is no question about it. The
  standard it ships is typed end to end: `type-standards.md` is written against a compiler,
  `scripts/typecheckStaged.ts` gates every commit, `tsc --noEmit` is a leg of `check`, and the `.d.ts` naming key
  exists because declarations do. A JavaScript answer would switch all of that off and ship a project holding
  itself to a lesser standard under the same name.

  A project that recorded `typescript: false` is refused, not converted: `parseLinteljsConfig` rejects a property
  it does not know, naming it, so both routes that plan from a recorded block (`sync`, and `create --existing`)
  stop before writing. Converting would rewrite that project's `eslint.config.js`, `tsconfig.json` and scripts as
  TypeScript over source that is not, which is not recoverable without git. It is the parser that refuses and
  there is no second list of known answers elsewhere: a second list that drops what it does not name in silence is
  how a devtools-panel project gets replanned as a popup one.
- **No Prettier.** `@stylistic/eslint-plugin` owns formatting as lint rules. One tool, one config.
- **No Stryker in a generated project.** It is worth adding to a project that needs it and does not earn its setup
  cost in an empty one. This workspace runs it (`pnpm --filter <package> mutation`). MSW is an answer rather than a
  default, see [The api edge](#the-api-edge).
- **No Emotion or styled-components.** That was one project's choice, never a standard.
- **A layer never weakens `base`.** Framework layers add rules for their framework. Every exemption that survives
  carries a measurement showing the tooling forced it: a plugin double-reporting one defect, a framework owning a
  filename. "It would be noisy otherwise" is not a reason.
- **No forked extension framework.** The `webextension` target is a Vite project with a manifest and
  `@crxjs/vite-plugin`, which reads the manifest and builds each surface the way the browser loads it. WXT and
  `vite-plugin-web-extension` both work, and both bring a project layout of their own that would sit on top of the
  one `repo-structure.webextension.md` describes. The manifest ships with empty `permissions` and
  `host_permissions`: those are the project's security surface, and a template guessing at them is how an
  extension ends up asking for more than it uses.
- **No browser runner in the extension target.** `web-ext@10.6.0` is 329 packages and 81 MB for one `start`
  script, including a second, deprecated ESLint and an Android Debug Bridge client. A developer loads `dist/`
  unpacked in Chrome or through "Load Temporary Add-on" in Firefox, so both browsers cost the same. `web-ext lint`
  and `web-ext sign` run under `npx` on the day an extension is submitted.
- **No bespoke React Native ESLint layer.** `eslint-plugin-react-native` peers at `eslint ^9` and would cap
  `@linteljs/eslint-config`, which peers `>=9` and develops on 10. `eslint-config-expo` bundles its own
  `@typescript-eslint`, `eslint-plugin-import`, `eslint-plugin-react` and `react-hooks`, every one colliding with a
  layer `base()` already registers. Given up: the RN-only style rules (`no-inline-styles`, `no-raw-text`). Kept:
  one ESLint major and no plugin fighting `base()`. See
  [React Native lints as React without the accessibility preset](#react-native-lints-as-react-without-the-accessibility-preset).
- **The plugin, not the framework's config.** `next()` registers `@next/eslint-plugin-next` rather than wrapping
  `eslint-config-next`. That config bundles `eslint-plugin-react`, `react-hooks`, `eslint-plugin-import` and
  `jsx-a11y` and enables a slice of each, three of the four are ground the layers already cover with newer plugins,
  and its bundled `eslint-plugin-react` calls `context.getFilename()`, removed in ESLint 10. Taking the plugin alone
  keeps the 22 `@next/next` rules that are the point. A Next project gets what a React project gets by stacking on
  `react()`, and the only accessibility detail left in `next()` is that `next/image` renders an `img`, which
  `alt-text` has to be told.
- **No bundler choice for Next.** Turbopack is the framework's default and `--rspack` its one alternative. A
  generated project takes the default, which is the position every other target is in.
- **No deprecation notice is muted.** Nothing emitted writes `allowedDeprecatedVersions`, and the end-to-end suite
  asserts on install warnings for all five managers but never on a deprecation. A deprecation says a third-party
  package reached end of life; it is true, the package belongs to somebody else, and config in a generated project
  only hides it from the person who could report it. The one that reaches a generated project today is React
  Native's `expo` pulling `uuid@7` through `@expo/config-plugins` and `xcode`.

## The layers and the rules

### What git ignores, ESLint ignores

Flat config reads no `.gitignore`, so a build output would have to be named twice, and copies drift. `base()` reads
the file through `includeIgnoreFile` from `eslint/config`, not a hand-written conversion, because gitignore
semantics (negation, anchoring, directory-only patterns) are easy to get subtly wrong and are not this package's
problem to own. The hardcoded entries stay: a project may not gitignore `dist/`, and `plugins/linteljs/` is
committed on purpose.

### Accessibility belongs to the markup, not to a framework

An element with no accessible name is the same defect in a Vite React app, a Solid app and an extension, so
`react()` and `solid()` enable the `jsx-a11y-x` `recommended` preset whole, the way every other preset in these
layers arrives. Measured against a real Next project: 31 newly error-level rules, zero new findings.

**The plugin is the `-x` fork, and that is a bun decision.** `eslint-plugin-jsx-a11y` caps its `eslint` peer at 9.
It runs on 10; the metadata is stale. npm waves it through with `legacy-peer-deps`, pnpm with
`peerDependencyRules` and yarn with `packageExtensions`, but bun has no equivalent: measured against a real
install, `.npmrc` `legacy-peer-deps`, `bunfig.toml` `logLevel = "error"`, `install.peer = false`, `--omit=peer`,
`--silent`, a root `peerDependenciesMeta` and a `bun patch` of the plugin's range all still print
`warn: incorrect peer dependency`, because bun reads the range from the registry manifest. So the layers take
`eslint-plugin-jsx-a11y-x`, whose range admits 10, at the cost of the `jsx-a11y-x/*` rule prefix.
`eslint-plugin-astro` keeps the original, because it loads it by literal name and prefixes its ids with `astro/`;
aliasing the fork in would emit `astro/jsx-a11y-x/*` ids it never registers. That is the single
`eslint-plugin-jsx-a11y>eslint` allowance the emitted `pnpm-workspace.yaml` still names.

**The template frameworks get the same floor, by three mechanisms**, because what each ecosystem ships differs:

| framework | mechanism | why not the others |
| --- | --- | --- |
| Vue | `eslint-plugin-vuejs-accessibility`, `flat/recommended`, 20 rules | `eslint-plugin-vue` carries no accessibility rule of its own |
| Angular | `angular-eslint`'s `templateAccessibility`, 11 rules | `templateRecommended` is four rules and none is about accessibility |
| Svelte | `svelte-check --fail-on-warnings` | `eslint-plugin-svelte` v3 ships zero a11y rules; the compiler owns them |

Svelte's compiler reports a11y as *warnings*, and `svelte-check` exits 0 on a warning. Measured: an `<img>` with no
`alt` printed `a11y_missing_attribute` and exited 0; with the flag, exit 1. A project that drops the flag silently
loses the whole category.

Vue's preset is ordered *ahead* of `@linteljs/vue`. Its second entry sets `languageOptions.parser` for `**/*.vue`,
and placed later it lands on the same glob and takes the `parserOptions` carrying `projectService` with it.

### React Native lints as React without the accessibility preset

`Framework` carries a `react-native` member whose layer is `reactCore()`: everything `react()` has except the
`jsx-a11y-x` preset. Measured on one snippet written twice: as web markup it reports `alt-text`,
`anchor-is-valid`, `click-events-have-key-events` and `no-static-element-interactions`; as React Native markup it
reports none, because those rules key on lowercase DOM element names and read `<Image>`, `<Text>` and `<Pressable>`
as unknown components. The preset would be 34 rules that cannot fire.

In its place the layer names five rules of `@linteljs/eslint-plugin`'s own, reading the props React Native
announces with, scoped to this layer because `Button`, `Switch`, `Image` and `TextInput` mean something else on
the web. They are ours rather than a dependency because both published packages were refused:
`eslint-plugin-react-native-a11y` caps its `eslint` peer at 8 and ships eslintrc configs only, which reintroduces
on bun the peer warning the `-x` fork removes; `eslint-plugin-triple-rn-a11y` is one agency's internal plugin at
179 weekly downloads whose ids carry a vendor prefix users would type into disable comments.

**None of the five has a fixer, on purpose.** A fixer that inserts `accessibilityLabel="Text input field"` invents
a label: it silences the rule and ships a control that announces the wrong thing. A name is a sentence only the
author knows, a role guessed from `"img"` could be `image` or `imagebutton`, and the repairs for a nested
touchable produce different interfaces.

### One item per line, object literals included

`base` enables `@stylistic/object-property-newline` with `allowAllPropertiesOnSameLine: false`, paired with
`@stylistic/object-curly-newline` scoped to `ObjectExpression`. Without it a four-property literal stays on one
line while the identical destructuring pattern is split by `destructuring-property-newline`, and at 120 columns
`max-len` never reaches it. The pairing matters: `object-property-newline` alone fixes to a hanging brace. The scope
keeps it off imports, exports and destructuring, which the four `@linteljs` newline rules own.

JSX props take the object form of `@stylistic/jsx-max-props-per-line`, `{ maximum: { single: 2, multi: 1 } }`,
replacing the preset's `{ maximum: 1, when: 'multiline' }`, which caps a one-line tag at nothing. Two on a line
rather than one: `<path d="M12 28 H108" strokeWidth="13" />` is one idea, and a third prop is where a reader starts
scanning. Measured on the shipped starters: twelve findings across six files, every one autofixable.

### Duplicate JSX props: this plugin's rule, not a dependency

React keeps the last of two identical props and drops the rest without a word, and a duplicated prop passes lint,
typecheck and the type floor. `@eslint-react/eslint-plugin` ships `no-duplicate-key` and no props equivalent
(checked against its 140 rules), and `react/jsx-no-duplicate-props` lives in `eslint-plugin-react`, which this
config does not install. So `@linteljs/no-duplicate-jsx-props` is roughly sixty lines here, enabled by the React
and Solid layers.

- **Report-only.** Deleting either occurrence guesses which value the author meant.
- **A spread resets the count.** The same name on either side of `{...props}` is the documented way to offer a
  default. Three occurrences with a spread between the first two still report the third.

### `no-inline-object-types` and `interface-order` are in `recommended`

Both are opinions about types rather than defects. One asks for a name, the other for a position.

An inline shape cannot be imported, extended, narrowed by a guard or documented, so the second place that needs it
repeats it or takes a worse type. The honest objection is blast radius: `useState<{ id: string }>()` reports on
idiomatic React. The answer is that each such shape has a name the reader wanted, `allowIn` covers the case where
the literal is a matcher rather than a shape, and the alternative is a rule almost nobody turns on.

`interface-order` puts top-level interfaces and type aliases after the imports and before the runtime code. That
is a house layout, and a shared config is a house layout: every generated project receives it through `base`, and
leaving it out of `recommended` would only hide that from a consumer composing the plugin directly. A project with
a different convention reports on upgrade, which is why the fix is `reorder` and report-only rather than a free
rewrite. `base` restates it over `TYPED_FILES` to reach a `<script lang="ts">` block the plugin's own preset cannot.

### Size limits count code, and a suite has none

`base` caps a function at 350 lines (`max-lines-per-function`) and a file at 500 (`max-lines`), 350 for a component
file (`**/*.{tsx,jsx,vue,svelte}`) and 800 for anything under a `utils/` directory. Both count code only
(`skipBlankLines`, `skipComments`), so a comment is never the line that tips a file over. A React or Solid
component is a function and meets the function cap; a `.vue`, `.svelte` or `.astro` component is a file and meets
the file cap, template and script counted together, and a function in its script meets the function cap. An
Angular component class is a `.ts` file, so the 500 cap holds it and the function cap holds each method. A `utils/`
module is a drawer of small helpers rather than one subject, which is why it gets the most room; the glob is
`**/utils/**` rather than `*Utils.ts` because Angular spells the suffix in kebab (`fetch-extended-utils.ts`).

`**/*.{test,spec}.*`, `**/__mocks__/**` and `**/e2e/**` are exempt from both: a suite is a list of cases, and a
`describe` callback is as long as the list. `base` names `.astro` only when asked (`astro: true`, which
`composeConfig` passes through), because naming it unasked would make ESLint lint `.astro` files in a project that
has no parser for them.

The numbers govern this workspace too. Measured the way the rules count, in non-test source: the longest file is
`create/src/targets/react/reactTarget.ts` at 483 lines, the longest `utils/` module
`eslint-plugin/scripts/audit/false-negatives/utils/functionShapesUtils.ts` at 475, and the longest function
`base` itself at 180. The workspace kept its own 200-line cap on `*Utils.ts` and a 500-line function cap before
the layer carried any; both are gone, since a workspace-only number would be a second standard the published one
does not state.

## Targets

Ten: React, Next.js, Vue, Nuxt, Svelte, Solid, Angular, Astro, React Native through Expo, and a Manifest V3
browser extension, for which `compatlens` is the reference.

Two of them host a UI framework rather than being one. Astro renders `.astro` templates and hydrates islands; the
extension renders whatever its surfaces are written in. Both take the same `hostedFramework` answer, composed from
`targets/utils/frameworkUtils.ts` rather than read off the framework's own record, because those records are
app-shaped (their route unit, typecheck and aliases describe a standalone app) and a host needs the narrow set that
varies. Svelte's entry there is the bare `@sveltejs/vite-plugin-svelte`, not `sveltekit()`, since a host owns its
own entry.

### The extension target has three axes, and none is a second target

A `browser` (`chrome`/`firefox`), a surface list, and an optional hosted framework move one record rather than
forking it. All three were measured against `compatlens` and `claude-firefox`.

**The browser decides the manifest shape and the ambient types, not the bundler.** `crx` builds for both, and its
manifest type carries the `service_worker` and `scripts` background forms plus `browser_specific_settings.gecko`,
so a hand-rolled multi-entry `build.rollupOptions.input` buys nothing and costs hashed filenames the manifest
cannot reference. It also decides the background starter: `@types/firefox-webext-browser` declares `browser.*` and
no `chrome`, and its install-details type requires `temporary`, so the entry, its handler and the test are per
browser. Chrome's starter under Firefox's types lints as findings on an undeclared global.

**The surfaces decide what the extension is.** `popup`, `background` and `devtools-panel` drive what the manifest
names, which starter files exist, what the build needs an input for, and which entry shells coverage excludes.
Absent means the popup and background pair, so a config that never recorded the answer still describes its own
project. The answer exists because `compatlens` is a devtools panel and nothing else, and a devtools-only extension
is a normal extension, not a deviation. A panel needs a Rollup input of its own: `crx` derives inputs from the
manifest, and the manifest names the *devtools page*, whose only job is to call `devtools.panels.create` with the
panel's URL at runtime. The crx documentation puts an extra page in `build.rollupOptions.input`, which is what the
target's `viteInputs` emits.

The manifest is **emitted rather than templated**: two axes reach it, and a file per combination would be twelve
templates holding one shape. It is birth-only, since a real extension's manifest is its permissions, icons and
store metadata within a week.

**The hosted framework** decides what a component is, which Vite plugin runs ahead of `crx`, and which layer lints
it. A Solid extension is `webextension` plus `hostedFramework: 'solid'`, which is what makes `compatlens`
expressible.

Extension entry HTML stays flat at the repo root, because the browser resolves `devtools_page` and panel pages
against the extension root.

### React Router framework mode is a router value; Nuxt is a target

`router: 'react-router-framework'` is the third value of the React target's `router` answer. It is the same library
with its build, route modules and generated types turned on, so it moves the build (`react-router build`), the
typecheck (`react-router typegen && tsc --noEmit`), the Vite plugin (`reactRouter()`) and the tsconfig, which is
why `reactTarget` is a function of the answers the way `astroTarget` and `webextensionTarget` are. React already
asks the question that decides which router a project gets, so framework mode has an axis to hang off. The emitted
`react-router.config.ts` sets `appDirectory: 'src'` and `ssr: true`.

Nuxt changes just as many fields: a solution-style `tsconfig.json` that `tsc --noEmit` cannot typecheck, no Vite
config because Nuxt owns Vite, `nuxt prepare` generating `.nuxt/` before anything can typecheck, and auto-imports
that change the lint surface. But Vue asks no router question and no mode question, so a Nuxt mode would mean
inventing an answer whose two values share almost no fields, which is a target with extra steps. It is a target,
and it takes what it shares with Vue from Vue's own tree.

Neither moves the source root. Both default to `app/` and both document one option to move it, `srcDir` on Nuxt
and `appDirectory` on React Router, and both are set, so every glob in this repository reads `src/`.

## The templates

### How a template is laid out

**One file per axis, never per combination.** React's Contact demo crosses a form library, a data layer and Zod,
which is twelve combinations, and is nine files. The joins do it: `useSubmitContact()` has one signature in all
three api spellings, so the form never learns which layer runs it; `ROUTES` is one array the header, the route
table and the no-router switch all read; the entry is one file because the router lives in `App` and the store and
data layer live in providers beside it. `starterSourceEmitter` refuses two starter files for one destination under
one answer set, which would otherwise be a silent last-one-wins race on disk.

**TanStack Router builds its tree from the one route list.** File-based routing is that library's default, and the
starter declines it: a `routes/` directory plus a generated `routeTree.gen.ts` is a second list of the pages, and
the form answer adds a page, so the generated file would need a copy per combination. Reading the array the header
reads keeps it one `App.tsx`, with no generated file, no build plugin, and no ESLint, coverage or banned-pattern
exception for one file. The cost is the statically-known route tree, so a link is checked against `string`; a
project that wants the generated tree adds the plugin and the directory.

**`shared` names a tree, not a flag.** `StarterFile.shared` is `true | TargetId`: `true` is
`starter-source/shared/`, the framework-free tree (tokens, stylesheets, page tables, validation rules, the fetch
adapter, and any file two frameworks write to the byte, such as a barrel or the contact api with no data layer),
and a target id is that target's tree, so Next reads `shared: 'react'` for the primitives, stores and
api modules it renders identically. Anything with a framework in it is not shared: React's `className` is not
Vue's `class`, React destructures props and Solid may not, and React's route element is a node where Solid's has to
be a function.

**A template names its own asset under each project's convention.** `StarterFile.source` lets one asset land under
two names: `fetchExtendedUtils.ts` is `fetch-extended-utils.ts` on Angular, which names every file in kebab, the way
`Mark.tsx` is `AppMark.vue` on Vue.

**The asset path is the destination path**, verbatim, under the answer that gates the file where one does.
`webextension/chrome/src/background/index.ts` and `webextension/firefox/src/background/index.ts` both land at
`src/background/index.ts`. A record names the destination and the gate, and `starterSourceEmitter` derives the
asset; `registry.test.ts` resolves every derived asset against disk across every answer that opens one.

### Every starter file carries a suite

A generated project gates at 100% on statements, branches, functions and lines, and its coverage config includes
`src/**` explicitly, so every file under `src/` is measured whether or not a test imports it. A starter file without
a suite fails the gate it was born with. Four things follow:

- **`StarterTest` has the `when` its file counterpart has.** A router turns the header's tabs from buttons into
  links, so the suite varies with the file.
- **A suite covers what it renders, so there are fewer suites than files.** The contact suite covers the page, the
  binding, the api, the schema, the input and the button. Only a branch nothing renders needs its own.
- **A hook that only works inside a component is covered through one.** Svelte's store selector is an `$effect`,
  so the store is covered by the page that renders it.
- **A file with no runtime is excluded rather than covered.** A `*.stylex.ts` token table is compiled to CSS, so
  nothing executes it.

The contact button is disabled while submitting and carries no in-flight label: that label is reachable only in
the window before a promise that resolves immediately, so a test for it is a race.

### Every component sits in a directory named for it

One kebab-case directory per component under `components/ui/` and `components/features/`, holding the component,
its suite and its stylesheet, on every target. A colocated stylesheet not beside its component is just a
stylesheet.

Vue and Nuxt ship `AppButton` and `AppMark` in `ui/app-button/` and `ui/app-mark/`. `vue/multi-word-component-names`
is an error in this standard's layer, and a single-word component collides with the HTML element of the same name,
which is the defect that rule exists to catch; the `App` prefix is Vue's own documented answer. Route files stay
lowercase where a router owns the filename (`about/page.tsx`, `about/+page.svelte`, `about.astro`,
`pages/about.vue`), since there the filename is the URL.

### The colocated stylesheet is imported globally, never from a `<style>` block

Angular scopes component CSS through `ViewEncapsulation`, Svelte scopes a `<style>` in a `.svelte` file, and Vue
has `<style scoped>`, so a class the shared stylesheet defines does not reach a component that declares its own
styles locally. `Button.css` sits beside `Button.svelte` and the style entry imports it; nothing goes in a `<style>`
block. The rule reads identically on every target.

### Per-target notes

- **Astro has nothing to hydrate.** A layout and a directory of pages, a link is a navigation, so there is no
  router answer and no provider. `vitest` cannot execute a `.astro` file, so the one helper under coverage is
  `isCurrentPath`, which exists for a real reason: Astro serves `/about` and `/about/` as the same page. The tables
  the templates read are excluded; Astro's container API is the way to take them back.
- **The extension popup is built node by node**, with `document.createElement`, not from a string of markup. An
  extension runs under a content security policy with no reason to trust markup, and a reference kept cannot be
  null, where querying back out of `innerHTML` is a guard for a case that cannot happen and a branch the 100% gate
  cannot cover. The mark lives in `lib/mark/`, because with no hosted framework a file under `components/` is a
  component by directory and with one by extension, and a string of markup satisfies neither.
- **React Native's route list is out of coverage with the shell.** The nav is the tab bar in `src/app/_layout.tsx`,
  excluded because rendering the navigator reaches Expo's TypeScript source in `node_modules`, which no test
  transform strips, and `src/config/routes.ts` would otherwise be a table nothing executes.
- **Svelte's link resolver takes one route at a time.** `resolve()` types its argument as a conditional on the
  route, so the route list resolves each entry where its literal is known; that list therefore imports
  `$app/paths` and is not shared.
- **Every framework reads a TanStack form through one selector.** `form.state` and `getFieldValue` are plain reads
  on a TanStack Store and only the selector is tracked, so a field built from plain reads renders its first value
  forever. Svelte's binding is a plain `.ts` module, since a rune for `sent` would force `.svelte.ts` for a boolean
  the form holds as `isSubmitSuccessful`, and Svelte suites mount a wrapper component from `__mocks__/`, outside the
  coverage include, to hold a context.
- **A component's props type lives in a plain module.** A `.ts` file cannot import a type from a `.svelte` or
  `.vue` one under the compiler behind lint, so it resolves to `any`.
- **Angular's `angular.json` is emitted rather than templated**, because it carries the project's name.

The form, Zod and data answers are demonstrated on every target that renders a contact page. Astro, the extension
and Angular install the form library without a demo, and Nuxt declares its stores without a counter; recorded here
so the absence reads as a decision rather than a forgotten file.

## The starter page

Ten targets render one design. The extension popup is 360px wide and React Native has no HTML, so a single column,
no grid, and nothing that does not map to `View`, `Text` and `Pressable`.

### The HTML is the contract

React Hook Form and TanStack Form emit identical DOM, and so does every store. One suite covers every
implementation because it asserts by role and accessible name. What is fixed is structure and accessible names,
not class attributes, which is what lets the suite survive every styling answer.

The one exception is the nav. An element that navigates is an `<a>`; an element that swaps view state is a
`<button>`. The no-router build renders buttons, because faking an anchor with `preventDefault` breaks middle-click
and lies about the address bar.

### Layout, routes and components

A header carrying the project name and the routes, and a hero centred in what it leaves. The name is the `name`
answer, truncated in the header and wrapped balanced in the hero.

| route | holds |
| --- | --- |
| Home | the mark, the name, the lede, one live control, one hint |
| Contact | the form, when a form library is selected |
| About | the gate, where the standard lives, what `sync` does |
| Version | the stack, and the answers the project was generated from |

The hero carries one live control, the store demo when a store is selected, captioned with the library the answer
installed. The form is a page, not a hero control: two fields in the hero turn it into a card stack that reads as a
dashboard.

The components are derived from those pages, not chosen as a kit, so a project that deletes the starter is left
with the directories:

| component | why it is a component |
| --- | --- |
| `ui/button/Button` | two call sites, and the disabled and submit states the form needs |
| `ui/text-input/TextInput` | the label, error slot, `aria-invalid` and `aria-describedby` wiring; `multiline` rather than a second `TextArea` |
| `ui/mark/Mark` | the SVG and its animation, rendered once, on Home |
| `features/app-header/AppHeader` | the name and the nav, and the one place the router and no-router spellings differ |

The section label and the key-and-value row on About and Version are classes in the shared stylesheet, not
components: a flexbox line with no props and no behaviour. The form's label is visible and bound with `for`.

### The mark

A heavy beam with three shorter lines beneath it that drift out of alignment and snap back on a five second loop,
1.3s apart and 0.4s back with a slight overshoot, because slow decay reads as drift and fast correction as the fix.
Pure CSS and SVG, so web targets receive markup plus a stylesheet; React Native ships it static rather than paying
for `react-native-svg` and Reanimated.

**The hero carries it, the header does not.** A hero is the welcome screen, thrown away the day real work starts.
A header survives the starter and ships to the project's users, and a tool's mark there advertises linteljs to a
project's customers without the project choosing to. A neutral placeholder mark is refused too: an empty slot says
"no logo yet" more honestly than a circle standing in for a decision.

### Version renders what was recorded, and says so

Emitted literals, under a line naming what they are as of, on every target. `package.json` holds ranges, not
resolved versions, so a build-time import would answer `^19.3.0`, which a literal already carries, at the cost of
`resolveJsonModule` and per-target exceptions. Two rows cannot be read at runtime at all, since a browser does not
know its machine's Node or package manager; they are recorded as `nodeVersion` and `packageManagerVersion`. Each
framework's own `version` export would be accurate and a different import on every target, for one line nobody
keeps.

The same record carries `CHECK` and `GATE`, which Home and About print. Both are read off the scripts
`package.json` receives, the manager's run prefix included, so a page cannot name a command the project does not
run: React Native's `build` is `expo export`, and a project with no tests has no coverage leg.

## Project structure

The published `repo-structure.<target>.md` rules describe the layout, and the templates seed it populated rather
than empty, so the first component a project author writes has a sibling to copy. The shape was validated against
`ai-manager`, a linteljs project whose architecture was curated against real work: thirty-two primitives under
`components/ui/` and fourteen features under `components/features/`, filling in the standard rather than drifting
from it. Its token vocabulary is the one the starter uses (see [The styling answer](#the-styling-answer)).

```
src/
  config/                constants, envVars.ts
  typings/               ambient .d.ts only
  assets/  styles/
  components/
    ui/                  primitives, one kebab-case directory each, and one barrel
    features/            reusable domain features, each with its own barrel
  lib/
    store/  utils/
    services/            domain logic, never HTTP
    providers/           context and DI providers
    apis/                endpoint definitions and schemas
    hooks/               framework-named
  <route unit>/          framework-owned
```

`partials/` is a private slot inside any page or feature folder, never nested. `services/` and `apis/` are
distinct: `apis/` holds endpoints and request/response schemas, separate per direction, and `services/` holds
domain logic with no HTTP dependency. `components/{ui,features}/` applies to the extension too, where a component
is a DOM-building module.

A kebab-case directory holding an entry named for it, its suite and its stylesheet is the same subject rule this
workspace holds itself to, one ring out. It holds in `lib/` too: `utils/` is the one folder of loose files, each
ending in `Utils` (`lib/utils/fetchExtendedUtils.ts`, `fetch-extended-utils.ts` on Angular), so an import names
what it reaches for without the folder. Every other module is a subject directory whose entry takes the subject
plus the folder's kind, the way `targets/react/reactTarget.ts` does here: `store/counter/counterStore.ts`,
`providers/data/DataProvider.tsx` (a component, so the component spelling), `apis/contact/contactApi.ts`, and
`lib/mark/mark.ts` on the extension, where `lib/` itself names no kind. `config/` stays flat, since it holds data.
`repo-structure.standard.md` states both, and the emitted `naming` map carries the suffix: `'**/utils/*.ts'` to
`*Utils`, and on Angular `'src/**/utils/*.ts'` to `*-utils`, since the shipped `scripts/utils/` stays camelCase.
The entry's spelling is the target's: `componentNaming()` and `sfcNaming()` give React, Solid, Vue and Svelte a PascalCase entry, and Angular is `'src/**/*.ts': 'KEBAB_CASE'`,
`ng generate`'s own spelling, so the same component is `components/ui/button/button.ts`.

### Per framework

| target | route unit | hooks slot | notes |
| --- | --- | --- | --- |
| React | `src/pages/<kebab>/{Name}Page.tsx` | `lib/hooks/` `use*` | closest to the spine |
| Next.js | `src/app/` | `lib/hooks/` `use*` | `lib/server/` for `server-only` modules; no Pages Router |
| Vue, Nuxt | `src/views/`, `src/pages/` on Nuxt | `lib/composables/` | Pinia stores in `lib/store/` |
| Svelte | `src/routes/` | `lib/hooks/` | `$lib` points at `src/lib`; components at `src/components/` |
| Solid | `src/pages/` | `lib/primitives/` `create*` | the `use` prefix is wrong in Solid |
| Angular | `src/app/` | `lib/services/`, DI replaces hooks | `src/config/` replaces `src/environments/` |
| React Native | `src/app/`, owned by expo-router | `src/hooks/` `use*` | no test file under `src/app/`, see [React Native](#react-native) |
| Extension | `manifest.json` declares every surface | `lib/` directly | `src/background/`, `src/devtools/`, `src/panel/` as surfaces; no `lib/store/` |

A routed unit is a page whether or not a router was selected. What the router answer changes is how you get
between pages: links with the address bar following, or a click handler over local state. A project that adds a
router later changes one component and writes a route table; no page moves. Collapsing an unrouted project into
one `App.tsx` would make adding a router a restructure.

### File naming

The policy is a `naming` and `folderNaming` pair on each record, composed from the globs in `targets/constants.ts`.
Every glob was measured against `micromatch@4.0.8`, which `check-file` matches with; `targets/utils/namingUtils.test.ts`
pins the exact strings, and an edited glob needs a fresh probe before it lands.

- **A component file is anything but camelCase.** React, Solid and Svelte bind naming rules to the identifier,
  never the file, and every file-based router owns spellings no positive convention accepts (`page`, `_layout`,
  `+page@(app)`, `[slug]`, `(tabs)`, `{-$id}`). A negative rule admits all of them and still rejects a camelCase
  component.
- **Tests carry no filename key; declarations carry their own.** `check-file` applies every matching key rather
  than the most specific, so `App.test.ts` beside `App.vue` under the camelCase script key could satisfy nothing.
  `.d.ts` files are excluded from the script key for the same reason and get a kebab-or-camel key.
- **A route directory is exempt from the script rule only.** `+page.server.ts` and `opengraph-image.ts` are the
  framework's names.
- **Angular is kebab-case, files and folders**, one key with no exclusions, because `app.spec.ts` reduces to `app`
  under `ignoreMiddleExtensions`.
- **Router folder segments are granted only where the family has a file-based router today or may adopt one**: the
  React family and SvelteKit. No grammar for hypothetical routers.

## Answers

Every answer changes what the CLI emits: a dependency, a lint layer, a starter file, a coverage exclusion.
Something that changes nothing the CLI writes is a `pnpm add` and not a question. Answer flags go through
`parseLinteljsConfig`, so `--target wat` fails with the message a bad `linteljs.config.json` does.

**A library is a thing that is only a dependency.** `libraries` holds `zod`, `es-toolkit`, `ts-pattern` and
`t3-env`. Anything that changes what is emitted, or of which at most one can be installed, is its own single-select
field: `form`, `styling`, `data`, `mocking`, `router`, `store`. A single select hiding inside a multi-select makes
every consumer re-impose the exclusion and leaves the full library set an illegal value of itself.

**A `schemaVersion: 1` config is migrated, never refused.** Its form library and Tailwind are lifted out of
`libraries` into their own fields and the file reports the current version from then on. A config written before an
answer existed is not broken. `lintel.config.v1.schema.json` stays published, because those files name it in
`$schema`.

### Form, bindings, and the React test

TanStack Form and React Hook Form bind the same inputs, so at most one is installed. React Hook Form is offered only
where the target renders with React: React, Next, React Native, and an Astro or extension host with a React island.
`rendersWithReact` asks that, since Next and React Native are their own `framework` values for their own ESLint
layers.

Bindings follow the framework, not the target: TanStack Query, Form and Store install `@tanstack/<framework>-*` for
the rendering framework, so an Astro site hosting React gets the React binding and a plain extension gets none.
t3-env is `@t3-oss/env-core` everywhere except Next, whose own package reads `process.env` the way the App Router
exposes it.

### The styling answer

`styling: 'tailwind' | 'stylex'`, absent meaning plain CSS. The per-value `only` gate means a target offers what it
can run:

| target | tailwind | stylex | how |
| --- | --- | --- | --- |
| react, next, solid | yes | yes | the JSX spread `stylex.props()` is written for |
| vue, nuxt | yes | yes | compiled SFC, extra bundler configuration |
| svelte | yes | yes | `stylex.attrs()`, and SvelteKit is in StyleX's own setup docs |
| astro, webextension | yes | yes | through whichever framework hosts, or none |
| angular | yes | no | no official path |
| react-native | yes, NativeWind | no | reaches native only through `react-strict-dom` |

**Angular.** StyleX documents Babel, PostCSS, webpack, Vite, Rspack, esbuild, Bun, Next.js, React Router and
SvelteKit, and not Angular, and an Angular template is HTML with no spread site. An answer whose setup this repo
would invent and then own is not one upstream supports. **React Native.** `react-strict-dom` is described by its
maintainers as not production ready. Tailwind reaches native through NativeWind 5, which runs Tailwind 4 through
PostCSS inside `withNativewind` from `metro.config.js`, because Metro has no Tailwind pipeline; NativeWind 4 is
refused for pinning React Native alone to Tailwind 3 against the latest-only non-goal. The style entry gets
NativeWind's imports in place of `@import "tailwindcss"`.

**The markup does not change with the answer.** Every page is `className="hero"`, `starter.css` ships in every
case, and what the answer decides is what is installed and wired. `@theme inline` maps Tailwind's colour names onto
the `tokens.css` custom properties and `defineVars` takes `var(--primary)` as its value: one source, three names.
The cost is real: **the starter shows neither idiom**, so a Tailwind project finds semantic classes rather than
utilities to copy. Per-system markup would be roughly a hundred and sixty files across the targets, each page
maintained three times, which is the drift this repository exists to stop.

**The token vocabulary is `ai-manager`'s**: the names, a radius scale keyed by what a thing is, the
`--motion-fast` and `--motion-ease` pair, and theming by a `.dark` class. The UI kit is coming out of that project,
for web and React Native both, so the starter speaks its language. Several web spellings do not cross to React
Native (custom properties, `color-mix()`, `outline` focus rings, `:hover`, `text-wrap: balance`), which argues for
the kit's token layer being TypeScript that emits both.

### The data answer

`data: 'tanstack-query' | 'rtk-query'`, absent meaning the api layer is called directly. Two cache layers and two
providers in one project is a combination the shape of the answer should refuse.

- **`rtk-query` requires `store: redux-toolkit`**, because it ships inside `@reduxjs/toolkit` and needs that store's
  reducer and middleware. The constraint is the value's own `only`, which receives the answers given so far: the
  prompt hides the value by it and `parseLinteljsConfig` refuses a hand-written config by it. One predicate, so
  the two cannot disagree.
- **`tanstack-query` is offered with every store.** Redux for client state and TanStack Query for server state is a
  real architecture.
- **Either works with either form.** The form binds the inputs and the data layer owns the submit's pending and
  error state.

The contact api validates and resolves locally, touching no network, so it works offline, in CI, in a 360px popup
and on React Native. Under `rtk-query` it is not a function with a third spelling: it is an endpoint injected into
`baseApi` through `injectEndpoints`, with `queryFn` as the documented place for an endpoint that is not a request,
because forcing RTK Query through a plain function throws away the cache, the invalidation and the generated hooks.
The store registers the api's reducer and middleware; that coupling is RTK Query's design, and a starter that hid
it would teach the wrong thing.

### The api edge

**`fetchExtendedUtils.ts` ships on every project.** One place that speaks HTTP, whatever was answered. It answers parsed
JSON or throws `ApiError`, so a caller has two cases: no `response.ok` to forget and no second parse. The body is
typed `object`, because `unknown`, `unknown[]` and `Record<string, unknown>` are refused by the type floor, and a
second type parameter does not work since TypeScript takes type arguments all or nothing. Query strings go through
`qs` rather than `URLSearchParams`, which stringifies `['a', 'b']` to `a,b`; `repeat` format, because `qs.parse`
reads it back without being told.

**MSW (`mocking: 'msw'`) makes an api layer demonstrable.** Without it a project that posts anywhere fails offline,
in CI, and on every target with no server. With it the api layer makes a real request and the boundary moves
rather than the call site, so the code under test is the code that ships. The setup fragment sets
`onUnhandledRequest: 'error'`, since an unhandled request is a test reaching the network, and is appended last so
the interceptor listens before anything asks. The handlers live under `__mocks__/msw/`: `node.ts` for the test run
everywhere, and `browser.ts` wherever a dev server serves a directory the worker can live in, which is every target
but React Native.

**The accessor takes each framework's own word:**

| target | directory | entry | what comes back |
| --- | --- | --- | --- |
| react, next | `lib/hooks/` | `useExtendedQuery` | values |
| react-native | `src/hooks/` | `useExtendedQuery` | values |
| vue, nuxt | `lib/composables/` | `useExtendedQuery` | refs |
| solid | `lib/primitives/` | `createExtendedQuery` | accessors |
| svelte | `lib/hooks/` | `createExtendedQuery` | the binding's reactive object |
| angular | `lib/services/` | `injectExtendedQuery` | signals |

Unwrapping a ref in a Vue composable hands the caller a snapshot that never updates, and Solid tracks a read, so a
returned value would be read once outside any tracking scope. Angular has neither hooks nor composables, so this is
a function run in an injection context. A suite for one of these is a `.ts`, because a camelCase `.tsx` is refused
by the rule that keeps components PascalCase; React builds its provider with `createElement` and Solid with
`createComponent`.

Astro and the extension get the adapter and the mocks and no accessor: their query binding is the hosted
framework's, and an accessor here would be one file per hosted framework.

**RTK Query gets `base/baseApi.ts` and no accessor.** `createApi` generates a hook per endpoint, and
`useGetVersionQuery` says what it fetches where `useExtendedQuery('/version')` does not. What ships is what sits
under every endpoint: one `fetchBaseQuery` against the origin the mocks answer on, one cache, one set of tags.
Domain slices use `injectEndpoints`, because two `createApi` calls are two caches, and a tag invalidated in one is
invisible to the other.

### The store answer

A store is a choice, an `optionalChoice` whose values carry an `only` reading the target's own `stores` list, so
which stores a target offers is the target's business and a new one is a value plus a name on each target offering
it.

| target | stores |
| --- | --- |
| react, next, react-native | `zustand`, `redux-toolkit`, `tanstack-store` |
| vue, nuxt | `pinia`, `tanstack-store` |
| angular | `ngrx-signals`, `ngrx-store` |
| svelte, solid | `tanstack-store` |
| astro | `nanostores`, bound through the hosted framework |
| webextension | not asked |

A store installs a dependency and nothing else; none ships ESLint rules, and the `@store/*` alias and
`src/lib/store/` already reach every project. Absent means the framework's own state: `createStore` from
`solid-js/store`, a `$state` rune in a `.svelte.ts` module. The extension is not asked because an MV3 service worker
is torn down between events, so in-memory state dies with it and real state belongs in `chrome.storage`.

Angular lists SignalStore first. Both live in the NgRx monorepo on one release train, so maintenance separates
nothing; `ng new` writes a standalone, signal-first app and SignalStore is the NgRx API built for it, while the
classic store's actions, reducers, effects and selectors are the RxJS-era shape. Classic stays offered for the
decade of installed base behind it (981k weekly downloads against SignalStore's 519k, measured 2026-08-06).

### The router answer

Only the React target has a `routers` slot: `react-router`, declarative, with its route table in
`src/routes/router.tsx`; `react-router-framework`, see [Targets](#react-router-framework-mode-is-a-router-value-nuxt-is-a-target);
and `tanstack-router`. Next, SvelteKit, Nuxt, Expo and Astro route by file; Vue installs its router
unconditionally, because a Vue application routes; Solid and Angular are a `pnpm add`.

### Recorded answers

`aliases`, `ignores`, `resolveConditions` and `browsers` are recorded, not asked: facts about a project, discovered
after generation and edited into `linteljs.config.json` by hand. `aliases` exists because `eslint.config.js` is
emitted whole, so an alias added there would be gone on the next sync; recorded, one line reaches the ESLint config,
the tsconfig paths and the resolver together. `browsers` is separate from `browser` because `browser` decides the
background shape, ambient types and starter code, while `browsers` decides how many manifests come out: a project
shipping to both stores builds one bundle and swaps the manifest at package time, since the two differ only in
`browser_specific_settings`. `packageManager`, `packageManagerVersion` and `nodeVersion` are read off the host that
ran `create`, see [The executor's manager and Node](#the-executors-manager-and-node).

## Versions

### Solid stays on 1 until two peers move

`@tanstack/solid-query` peers `solid-js ^1.6.0` and `@astrojs/solid-js` peers `solid-js ^1.9.13`. The first is a
library offered on Solid and the second is how Astro hosts it, so moving earlier would mean a target that cannot
take its own options. Measured 2026-09-21, so the day they move is an afternoon: Solid 2 is `solid-js@^2.0.0-rc.9`
and `@solidjs/web@^2.0.0-rc.9` with `jsxImportSource: "@solidjs/web"` and `@solidjs/vite-plugin@^3.0.0-next.44`
in turnkey mode (no `index.html`, entries generated around `src/App.tsx` and `src/Document.tsx`);
`@solidjs/testing-library@1.0.0-beta.3` peers `solid-js >=2.0.0-0`; `@solidjs/router@2.0.0-next.26` matches; and
`eslint-plugin-solid` 0.18 ships `configs/v2`, so the Solid layer switches on the version rather than forking.

### The React Compiler runs natively

React, and the extension's and Astro's React hosts, run the React Compiler as `oxc-transform-react` through
`@vitejs/plugin-react`'s own `compiler` option, which `@astrojs/react` passes through. `@astrojs/react` 7 refuses
the `babel` option outright, and the Babel pass needed three more packages. Measured 2026-09-26 on built bundles,
counting the memo cache calls the compiler writes: the React starter has six natively and none with the compiler
off, and an Astro island carries `c(6)`, so the compiler is proven to run, not only to build. The plugin marks it
experimental, and both it and `@astrojs/react` peer `oxc-transform-react ^0.145.0`, which on a zero major admits
0.145 alone. The Babel pass is the fallback if a release breaks: the plugin still exports `reactCompilerPreset()`.

The compiler is off under `VITEST`, since the memo cache leaves one branch per component no suite reaches. Next
keeps its own switch, off like everything else in `next.config.ts`. Framework mode builds through `reactRouter()`,
which runs no compiler. React Native keeps Expo's path through `babel-preset-expo`.

## React Native

### Vitest, like every other target

One runner across all ten, so `testing` is a yes or no rather than a choice of runner. `jest-expo` reaches 71%
coverage and stops: modules that exist only as `.web` are never loaded by a native run, and jest-expo's web project
does not survive Reanimated's web build. Two vitest projects with different `resolve.extensions` load both, and
with `babel-preset-expo` out of the path `Platform.OS` and `process.env.EXPO_OS` stay runtime reads. That is the
difference between 71% and 100%. The cost is `@srsholmes/vitest-react-native`, at 0.1.x and one maintainer, in the
path of the gate; if it goes unmaintained the way back is `jest-expo` and a lower ceiling, not a lower threshold.
It passes `hostComponentNames` to `@testing-library/react-native` 14, which dropped the option and warns per suite;
measured harmless, and pinning back a major to silence a warning is the wrong trade.

### `build` is `expo export`, and it takes a layout rule

`check` ends on `build` for every target. An Expo app ships through `eas build`, which needs an account and a remote
builder, so this record's `build` is `expo export`: a real Metro bundle for ios, android and web, with static
rendering of every route. The three take about 18 seconds together and none needs Xcode or the Android SDK.

**No test file under `src/app/`, ever.** Everything under the route root is a route: expo-router's context regex
collects every `.ts`/`.tsx` and ignores only `+api`, `+middleware`, `+html` and `+native-intent`, and its `ignore`
option is read from `app.json`, where regexes cannot survive JSON. Measured on expo-router 57.0.11, a suite under
`src/app/` kills the web export at static render on `expect is not defined` and the ios export by bundling
`@testing-library/react-native` into the app graph. So route suites sit directly in `src/`, named for the route
with the path flattened: `app-index.test.tsx` for `src/app/index.tsx`. Do not change the record's `build` or move
a test under `src/app/` without running `pnpm --filter @linteljs/create test:e2e -t react-native`.

### It follows the Expo SDK's pins, not react-native's latest

react-native, react, Reanimated, worklets and the Expo modules sit at exactly what `expo-template-default@sdk-57`
pins: react-native 0.86.3, react 19.2.3, Reanimated 4.5.1, worklets 0.10.1. No Expo SDK is tested against 0.87;
SDK 58 goes to 0.88 and this target moves with it. react and `@types/react` are pinned on the target record rather
than in `VERSIONS`, since every other target is on 19.3. A template release moves the target only once every floor
it names is two days old, since pnpm 12's default `minimumReleaseAge` refuses anything younger.

The project declares `@react-native/metro-config` at react-native's own version:
`@react-native/community-cli-plugin` peers exactly its own release and worklets peers it at `*`, which a manager
answers with the newest, so undeclared the two resolve apart and `pnpm peers check` reports it. Yarn 4 reports
YN0086 for seven requests inside Expo SDK 57's own tree, none of them a clash (`@expo/cli` passing no `react` to
`@expo/log-box`, `@expo/router-server` and `expo-symbols` asking for `expo-constants` and `expo-font`,
`expo-linking` passing no `expo` to `expo-constants`, two Babel packages passing no `@babel/core`); each has a
`packageExtensions` entry, and the target carries no `logFilters`.

## Package managers

pnpm reads approved install scripts from `allowBuilds` in `pnpm-workspace.yaml`; bun reads `trustedDependencies`
in `package.json` and nothing else (measured on bun 1.3.11: an `allowBuilds` key in `bunfig.toml` leaves the script
blocked). npm 12 reads `allowScripts` from `package.json`. All of them take the one list `allowedBuildNames`
builds.

`.npmrc` and `.yarnrc.yml` are load-bearing, measured on React and Next with each removed. Without
`legacy-peer-deps` npm refuses the install outright; its price is that npm installs no peers, which is why `vite` is
a named dev dependency wherever vitest is. Without `nodeLinker: node-modules` yarn's PnP breaks the ESLint
TypeScript resolver and `check` fails with 46 errors.

`.yarnrc.yml` is emitted, so its `packageExtensions` follow the dependencies a project installs, and it answers a
peer with `packageExtensions`, never `logFilters`. `@vue/test-utils` peering on `@vue/compiler-dom` and
`eslint-plugin-vuejs-accessibility` on `globals` are marked optional on the package that asks, since each is
supplied by a tree the project does not own. `postcss-html` on `postcss` is answered by supplying it: stylelint 17
dropped its own postcss, so `postcss-html` would rest on whatever `postcss-safe-parser` hoists, and marking it
optional leaves YN0002 printing. A blanket `YN0002`/`YN0060` discard would also stop the suite's no-warnings
assertion firing on yarn, since with nothing printed yarn never reports `Done with warnings`. No target filters
anything: the last, Angular's discard of `@angular/build` peering vitest 4, went when `@angular/build` 22.2 admitted
vitest 5, and pnpm's `peerDependencyRules` block went with it. The discard had also hidden two `YN0086`s on
Angular, `@tanstack/angular-store` asking `@tanstack/angular-form` for `@angular/common` and `goober` asking the
query devtools for `csstype`, which `packageExtensions` now answers.

### The executor's manager and Node

The package manager is not asked and not flagged. It is the one that invoked the CLI, recorded into
`linteljs.config.json`, and refused below a floor (`MANAGER_FLOORS`) rather than installed. Measured 2026-09-21:

| fact | source |
| --- | --- |
| pnpm's agent is `pnpm/12.5.1 npm/? node/? darwin arm64`: no Node version in it | measured |
| bun runs the CLI itself: `process.versions.node` is `24.3.0` there and `process.versions.bun` is set | measured |
| a yarn 1 on PATH, in a project whose `packageManager` says `yarn@4.18.0`, answers `yarn --version` with `4.18.0` | measured |
| `packageManager` must be an exact `name@x.y.z`; corepack does not ship with Node 25+ and does not know bun; pnpm 10+ switches to the named version | corepack README, pnpm settings, measured |
| `devEngines.packageManager` with `onFail: 'error'` is enforced by npm 11 (`EBADDEVENGINES`) and pnpm; npm 10 ignores it | measured, pnpm settings |
| `allowBuilds` needs pnpm 10.26.0; below it install scripts are skipped | pnpm settings/build.md |
| type stripping is on by default and warning-free from Node 22.18.0 | Node docs, measured |

A generated project declares the manager three ways. `packageManager` is the exact version that ran `create`,
which corepack and pnpm's switch read. `engines` is the floor this CLI was tested against, so a project is not
pinned to one machine's patch release. `devEngines.packageManager` with `onFail: 'error'` is the only one that
refuses a different manager outright. Bun gets no `packageManager`, since neither corepack nor pnpm knows it, and
`engines.bun` says what the field would have.

Node is `>=22.18` in a generated project (`NODE_ENGINE`) and `>=22.13.0` as this CLI's own floor. The project's
floor is type stripping on by default: the shipped `scripts/*.ts` and the plugin's hooks run as plain
`node file.ts`, from lint-staged and from hosts that pass no Node flags. The CLI's is `@inquirer/prompts` 8, which
declares `^22.13.0 || >=23.5.0`. Pinned tools that want more say so themselves as `EBADENGINE` warnings. CI runs on
the major that ran `create`, read off the recorded `nodeVersion`.

### Yarn 1 is its own manager, not a lower yarn floor

`yarn` means Berry and floors at 4.0.0; `yarn-classic` means 1.22.22, the last classic release. A classic project
cannot read `.yarnrc.yml`, has no `packageExtensions`, has no `dlx`, and installs with `--frozen-lockfile` rather
than `--immutable`, so each difference is a row in a table that already varies by manager. It is the one id that is
not its command, which `MANAGER_BINARIES` exists for: `packageManager`, `engines`, `devEngines` and the refusal
message all say `yarn`. `yarn create @linteljs` needs a binary called `create`, which yarn 1 looks for by name.

Detection splits the two on the major of the agent's first token, and with no agent on the lockfile: classic
writes `# yarn lockfile v1`, Berry writes `__metadata`. That is what makes `sync` and `--existing` work in a yarn 1
repository, which is where an unadopted standard is found. A classic project gets no install-script gate: yarn 1
runs every install script and has no setting that says otherwise. The README says so too.

## What a project owns

Every file this CLI owns reaches disk as an `Artifact` through `artifactWriter`; `pipelineRun.ts` holds no
`projectFileWriter` call, which its suite pins by reading its own source. Adding a conditional file is an emitter,
never an orchestrator edit: the coupling `switch (target)` is banned for in the emitters, one level up.

### Two artifact lists, and why `sync` sees only one

- `buildArtifacts` is the toolchain linteljs maintains. `create` and `sync` both write from it, which is what lets
  `sync` re-apply a changed standard to an existing project.
- `seedArtifacts` is what a `create` run plants and `sync` never touches: `linteljs.config.json`, the README, the
  manifest and the starter source.

`sync` reads `linteljs.config.json` rather than writing it, so a project that reformatted its config keeps those
bytes through `sync --force`. Two properties carry what would otherwise be branches in the pipeline: `seed: true`
is birth only (`create`, and `--existing --seed`), and `requires` names a path that has to exist, which skips a
starter test whose file a rearranged starter moved. A `preserve` file that already exists is the project's on
every run, born or not.

### Birth-only and owned-outright files

**The build configs are birth-only.** `vite.config.ts`, `vitest.config.ts`, `astro.config.mjs` and the test setup
carry `preserve`. What this CLI writes is a starting point every real project outgrows inside its first feature:
one reference extension builds an IIFE bundle per content script plus a native messaging host, another a second
mode for a preview page, and the emitted vitest excludes name this CLI's guesses at a layout where a project excludes
the entry points it has. Re-emitting would flatten that, and reporting it as `changed` invites a `--force` that
does.

**`.github/workflows/ci.yml` is owned outright, the opposite call.** A gate nothing runs is not a gate: a
reference repo renamed `check` and left its workflow calling the old name, and every push failed for two days while
the project gated clean locally. The command is derived from `buildScripts`, since a workflow cannot name a script
`package.json` does not define, and a project with more to run adds `deploy.yml` beside it. A drifting `ci.yml` is a
`sync` diff instead of a red build.

**`package.json` is a merged artifact**, like `.gitignore` and `pnpm-workspace.yaml`, through `patchPackageJson`, so
a dependency a release adds to a layer reaches existing projects on `sync` and not only new ones. Two of three
reference migrations had to add plugins by hand that their recorded answers already implied.

### What `sync` may delete, and why the project holds the list

A project records what this CLI wrote in `plugins/linteljs/managed.json`, and `sync --force` deletes what is in that
record and no longer expected. It lives in linteljs's own tree rather than in `linteljs.config.json`, which is the
project's to reformat.

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
it, and each guard treats nothing as a finding: the git guard denies, the eslint guard warns. A PowerShell
subexpression, script block or `Start-Process` is read as the commands inside it and marks the enclosing command
opaque, which the git guard also denies. `cmd /c`, `pwsh -Command` and `Invoke-Expression` are unwrapped the way
`sh -c` is. It is a guardrail: a variable holding a subcommand still passes, in either shell.

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

In a project that chose Cursor and Claude Code, Cursor also loads the linteljs plugin's `hooks.json`. Each hook
answers under Cursor on the one event `.cursor/hooks.json` gives it, and Claude Code's copy arrives as
`preToolUse` and `postToolUse` on `Write`, which are not those, and prints nothing. That is decided from the
payload rather than a flag, so it holds however Cursor loaded the copy.

`.cursor/hooks.json` is merged, since every Cursor project hook shares it: a sync replaces the entries naming
`plugins/linteljs/hooks/` and keeps the rest, and dropping Cursor removes the file. `.github/hooks/linteljs.json` is
linteljs's own name in a directory Copilot reads whole, so it is owned outright. VS Code's Local agent also reads
`.github/hooks/*.json` but sends its own payloads with tool names it leaves to the debug log, so nothing relies on
it.

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
where the ring has one (`targets/` gives `reactTarget`), the group where a group changes it (`disk/read/` gives
`projectShapeReader`, `pipeline/passes/` gives `fixPass`), and nothing where a ring has no one kind (`terminal/`
holds `cli/cli.ts`). `disk/` splits into `read/` and `write/` so the group supplies `Reader` and `Writer`; `spawns/`
is a plural of its members, every one of which runs a binary and waits. The rule is derived, not invented:
`fixPass.ts` and `localBinary.ts` already carried the noun their ring gives them.

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
tables sit in `utils/loaderUtils.ts` with a suite, and why `answers/registry.ts` and the plugin's `rules/index.ts`
have suites asserting what a reader depends on.

The suites that cover a package rather than one file (`meta.test.ts`, `types.test.ts`, `fixerSafety.test.ts`,
`ruleModules.test.ts`, `hooks.test.ts`) are named in `.claude/rules/repo-structure.md`; the report lists them so they
stay visible, and fails on any other test file with no source beside it.

## The shipped starter source, and the gate that reads it

`templates/starter-source/**` is outside every `tsconfig` include, ignored by the root `eslint.config.ts`, and
outside the vitest include. It cannot become ordinary source: it imports 53 distinct external packages this
workspace resolves none of (`@angular/*`, `expo`, `react-native`, `next`, `svelte`, `vue`, `solid-js`, `pinia`, every
`@tanstack/*` binding, every testing library, and the `$app`, `$lib` and `@/*` specifiers three frameworks resolve
themselves). Making it ordinary source means installing ten targets' runtime and test dependencies into a workspace
of three ESLint packages.

So `pnpm lint:starters`, a leg of `pnpm check`, lints each file the way the project receiving it will.
`composeConfig` is the function a generated `eslint.config.js` calls, handed that target's framework and its
record's `naming` and `folderNaming` maps, and each file is judged at the path its record places it on, which is what makes the naming rules mean anything. The answers widen
per target until every file is placed, so a starter nothing ships is reported rather than linted at a guess. It
reads the same `starterSourceEmitter` as the pipeline, so the two cannot disagree about where a file lives.
`lint:starters:fix` runs the same config to repair what is autofixable, because a `create` run's `fix` stage is
skippable. `.astro`, `.vue` and `.svelte` are read by their own parsers with `projectService` off, since it resolves
a file against a real `tsconfig.json` and this walk lints text at a path nothing on disk holds; one rule goes off
with it, `sonarjs/no-redundant-optional`, which reads the program to decide whether to run.

The test setup is not a starter but fragments joined into one file, `__mocks__/setupTests.ts`, so the walk also
joins them as `testSetupEmitter` does, once per distinct join its answer sets produce (one set adds `msw` and
TanStack Query to reach every fragment), and lints the result at that path. It lints with `fix` on and reports only
what survives: the joined text puts a later fragment's imports mid-file, and the project's own `fix` stage hoists
them at birth. With nothing on disk to write back to, `lint:starters:fix` leaves the setup alone.

What a rule cannot see is a name that resolves to nothing, so the script builds a program too, with
`@types/chrome`, `@types/firefox-webext-browser`, `@types/react` and `vitest/globals` installed as gate machinery.
The two extension packages are mutually exclusive, so it is three programs. Only diagnostics naming a name or module
that could not be found are kept. There is no `declare module '*'`: a wildcard matches every specifier that fails to
resolve, relative ones included, so a misspelled import would pass. A bare specifier is discarded by its shape and a
relative one is a finding.

**Its ceiling is stated.** It runs no type-aware rules, because a program over dependencies this workspace does not
install is not a program. Everything that needs real framework types (a `safeParse` read as `{ issues }` rather than
`{ error }` against Zod 4, a props type resolved to `any` across a component boundary, a promise dropped from a blur
handler) is found only by a real project. The fast loop for that is one project on disk, not the matrix: generate
into a temp directory with `--no-install`, point the two `@linteljs/*` dependencies at packed tarballs through
`overrides`, install once, and run the project's own `lint:fix` and `pnpm check`. About ninety seconds, and the same
gate the matrix runs.

`children?: React.ReactNode` with no React import is legal TypeScript, since `@types/react` declares `React`
globally for JSX. It is a style this standard holds, so it is `@linteljs/react-no-global-namespace`: published,
fixable, outside `recommended`, enabled by the React layer. The gate carries no copy of it.

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

Every answer this CLI can be given is covered, in 209 cases rather than the whole product. `matrix.ts` enumerates
them; nothing is listed by hand. Per target, every legal combination of the single-select axes on every package
manager is enumerated, and a greedy cover keeps enough of them that every *pair* of answer values appears at least
once. A multi-select axis is never combined: it is always its full value (`libraries`, `agents`, `plugins`,
`surfaces`), so every case carries a target's heaviest dependency set. The axes are `packageManager`,
`hostedFramework`, `browser`, `styling`, `form`, `router`, `store`, `data`, `testing` and `typeSafety`.

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
| `customTypes.d.ts` against KEBAB_CASE | Angular, with `typeSafety: relaxed` |
| rolldown's unmet peer, which no `packageExtensions` can mark optional | React, on yarn 1 |

Greedy set cover over the legal enumeration: every case it can pick is one `refuseMisfit` accepts, so nothing has to
be checked for legality and the pair universe is by construction the reachable one. It is deterministic, so a label
that failed names the same case when run again with `-t`. Three-way interactions are given up; `E2E_FULL=1` runs the
cross product for a pre-release sweep. `matrix.test.ts` pins that no reachable pair is lost, against a pair
definition of its own rather than the generator's, and that the combination behind each defect above still appears.

The manager is an axis because what it changes is how it resolves the dependency set a target and its answers emit,
and the files the CLI writes for it (`pnpm-workspace.yaml`, `.yarnrc.yml`, the script spellings): a pair of the
manager with each answer that moves a dependency. The floor is five managers times a target's widest axis, which is
what Astro and the extension, at 30 each, sit on.

### One registry on a fixed port

The suite publishes the three packages to a local Verdaccio on port 48730, one registry per run. Yarn's global
metadata cache stores tarball URLs including the port, so a fixed port keeps that cache valid between runs rather
than pointing at a dead host. In `e2e.yml` every job is its own machine; locally, parallelism is `maxConcurrency`
inside one process. One process publishes once, so there is no publish lock, and the CI cache key carries no job,
because npmjs serves every manager the same bytes.

### The split is by package manager, not vitest's `--shard`

Vitest splits by file, and one file holds every target, so a file split balances nothing. A runner cannot honestly
hold every manager: yarn 1 and yarn 4 both answer to `yarn`, so one on PATH is only ever one of the two. So `E2E_PM`
names one manager, and the suite runs its cases on whatever binary of it is on PATH, reading the version from
`--version`. A yarn whose major does not match fails the run once, before any case. `e2e.yml` runs one job per
manager. Unset, a run takes every manager whose binary answers with a version this suite would record as that
manager, since no machine carries all five.

The jobs are not even and do not need to be: at concurrency two, npm measured 2843 case-seconds, yarn-classic 2466,
yarn 1629, pnpm 1622 and bun 1471, so the slowest job is about 24 minutes of cases. The pair cover gives each
manager 40 to 46 of the 209.

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
  push to the same branch rather than running forty minutes of gates to die on a version conflict.
- **The branch deletes itself once the tag holds the commit.** The delete names `refs/heads/` in full, because with
  a tag of the same name `git push origin --delete v1.2.0` answers `dst refspec matches more than one` and removes
  neither, failing the run after all three packages are published.
- **`release` waits for `ci` and `e2e` rather than reading their conclusions.** They start from the same push, and
  an in-progress run has no conclusion to fail on, so reading without waiting passes vacuously.
- **No `NPM_TOKEN`.** Each package has a trusted publisher on npmjs.com naming this repository, this workflow file
  and the `npm` environment, and pnpm exchanges the workflow's OIDC token for a short-lived one. Renaming
  `release.yml` breaks publishing until all three are re-registered.
- **Publish order is plugin, then config, then CLI**, the dependency order reversed, so a consumer installing
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

`dist/`, `coverage/`, `.smoke/`, `.compat/` and `reports/` are tool output: `.smoke/` exists while a package's
`smoke` script runs, `.compat/` during the plugin's `compat`, which installs six ESLint majors into it, and
`reports/` is where `mutation` writes Stryker's HTML.

`__mocks__/fixtures/` is deliberately defective input for `eslint-config`'s own tests: an import cycle, an
unawaited promise, and an SFC pair. Linting them reports the defect each exists to trigger, and the `.vue` and
`.svelte` pair cannot parse without the layers those tests compose.

`templates/fragments/test-setup/setupTests.angular.ts`, `setupTests.reactNative.ts`, `setupTests.msw.ts` and
`templates/starter-source/**` are shipped
source, copied to disk and never imported here. Each imports the framework it is written for, none of which is
installed here, so every import is unresolvable and every call through one untyped. The MSW setup differs only in
what it reaches for: `./msw/node`, a path in the project it lands in and no path at all here. They are data here
and code only in a generated project, where that project's own `eslint .` judges them; `pnpm lint:starters` and the
end-to-end suite are what prove it.

### `'**/utils/*.ts': '*Utils'`

`check-file` takes a raw glob as the naming pattern: the rule validates the value with `is-glob` and micromatches the
extension-stripped basename against it (`eslint-plugin-check-file@3.3.2`, `filename-naming-convention`). So
`*Utils` is a pattern, and it and the `CAMEL_CASE` entry above it both apply, which makes `layoutUtils` the only
shape satisfying the pair. Proven to fire: `src/utils/stray.ts` reports `The filename "stray.ts" does not match the
"*Utils" pattern`, and `strayUtils.ts` exits 0. `ignoreMiddleExtensions` is on, so `layoutUtils.test.ts` is judged
on `layoutUtils`.

### `resolver: { project: 'packages/*/tsconfig.json' }`

The default resolver reads a single tsconfig discovered from the working directory, which in a workspace is the
root, and each package's `@mocks/*` lives in its own tsconfig. Measured without the override: 85
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
(`DEFAULT_ANSWERS`, `ANSWERS`) from the `answers/` barrel and nothing deeper. Five suites do; the records under test
are built from answers, and a copy of the defaults in `__mocks__/` would be a second spelling of them.

### `@linteljs/workspace/create-worlds`

Which folder a module belongs to is read off its import lines: `node:fs` means `disk/`, `node:child_process` means
`spawns/`, `node:process` and `@inquirer/*` mean `terminal/`. Nothing else may reach a world, so the only route to a
disk is a function that can be substituted, and `answers/`, `targets/` and `emitters/` are provably pure. The
patterns and the exemptions are built from `WORLDS` in `rings.ts`: a ring is exempt from the world it owns, and
`pipeline/e2e/` is exempt besides, because it is the harness rather than the package and spawning real managers is
all it does. `pipeline/` owns no world, so the rest of it is held like any inner ring.

`node:path`, `node:os` and `node:url` are not restricted: path arithmetic touches nothing. `spawns/` reaches `disk/`
for one thing, `isExecutableFile`, which is how a binary on `PATH` is resolved: a filesystem question only a spawner
asks, one way, since nothing in `disk/` spawns. It is sync on purpose, because its answer feeds a `spawnSync` with
no asynchronous point to wait at.

### The `es-toolkit/compat` ban

`es-toolkit/compat` is banned outright, in every package: the strict entry or the standard library. `/compat` is
the lodash-compatibility build, and this workspace never had lodash to migrate from, so its looser signatures only
buy a way to make a call typecheck that should not have been an es-toolkit call. Measured: the strict `sortBy` and
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
`MANAGED_PATH`, `RUN_PREFIX` and `NODE_ENGINE` are read by several rings and stay. The gain is that `src/config/`
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
`@linteljs/workspace/scripts-logger` turns it off for that logger alone. `base()` still stands the
rule down under `scripts/` for a consumer, a published default that is not this repository's to narrow.
`release/run-rules/runRulesRelease.ts` writes to `process.stdout` instead: it runs in a container holding only the
plugin's own `dist/` and `scripts/`, with no logger above them.

`sonarjs/no-os-command-from-path` joins it for the same directories. The audits and smokes run
`execFileSync('pnpm', ...)`, and the rule wants an absolute path because a writeable `PATH` entry could shadow the
name. That is a real hazard for a program a user runs and not for one a maintainer invokes in this checkout, where
resolving `pnpm` to an absolute path would consult the same `PATH`.

### `@linteljs/workspace/ast-identity`

`sonarjs/different-types-comparison` cannot read an AST identity check. ESLint brands every node it hands a rule:
`Rule.Node` is `(Program & { parent: null }) | (Exclude<ESTree.Node, ESTree.Program> & NodeParentExtension)`. A node
reached through a field (`parent.callee`, `parent.object`, `outer.parent.body`) carries the plain ESTree type, and
sonarjs reads the intersection and the union member as disjoint, so it calls `parent.callee === fn` impossible when
that is the whole question the rule asks.

Measured: with the rule forced on, it reports five comparisons across the three files the block names. They are
not constant, which the plugin's 100% branch gate proves: each is taken both ways by a test. Treat the count as a
reading to re-take, not to trust; if it reaches zero, the reports are right and the block is wrong. The files are
named one by one, so another site has to be added on purpose.

### `@linteljs/workspace/rule-tester`

`RuleTester.run()` registers its cases at module scope, and `sonarjs/no-empty-test-file` looks for a literal `it` or
`test` call. It finds none and calls the file empty. Measured: wrapping `tsRuleTester.run(...)` in an explicit
`describe(...)` does not silence it either, so no shape of the file satisfies it. Scoped to the rule suites alone.

### `@linteljs/workspace/e2e-test`

`targets.e2e.test.ts` under `pipeline/e2e/targets/` is `it.concurrent.each(cases)(label, runE2eCase)` per target,
and every assertion lives in `runE2eCase`. `vitest/expect-expect` reads the callback body for `expect` calls and
finds no body, since the helper is passed by reference. Measured: `assertFunctionNames: ['runE2eCase']` does not help,
because it matches calls inside the body and there is no call. Off for that directory alone.

### Coverage thresholds, in `vitest.config.ts`

A gate, not an aspiration. The root config is what gates: a package's own `vitest.config.ts` coverage block is
ignored once the run comes through `projects`.

One global block at 100% rather than a key per package. A glob key takes its files out of the global thresholds, so
with keys a folder nobody named stays ungated; with one global block every file in `coverage.include` is held, and a
file joins the gate the moment it is included.

The end-to-end harness (`e2e/registry/`, `e2e/runner/`, `e2e/targets/`, `e2e/utils/` and the files at `e2e/`'s top
level) is excluded: it spawns, publishes and needs the registry, so it runs only under `test:e2e`, and a helper there
would land as a 0% file against a 100% threshold. `e2e/matrix/` is pure and runs in the default suite, so it is held
to the gate. Nothing else is excluded: `cli.ts` is not an entrypoint, since `bin/createLinteljs.ts` reads
`process.argv` and sets `process.exitCode`, and `main` is a function from an argv array to an exit code that
`cli.test.ts` calls directly.

## Still open

Neither of these is a decision anybody made, and both are one line to change.

- **Whether a generated project takes Geist.** `ai-manager` ships `@fontsource-variable/geist`. The starter's
  `--font-sans` is a system stack, so adding Geist in front of it is additive. Two packages in every project is the
  cost.
- **One measure across pages, or two.** Form fields want a narrower column than a row list does. It is a single
  value in the shared stylesheet.
