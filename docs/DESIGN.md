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
- **A project supports the package-manager version it declares, and no other.** `packageManager` in the
  generated `package.json` names one manager at one version, and that is the one the project is built and tested
  against. After generation the environment is the user's: another major on PATH, a global config or a registry
  mirror is theirs to reconcile, and neither the project nor this CLI adapts to it. Accepted with it: two managers
  can resolve different versions of the same dependency for the same answers without either failing. The
  end-to-end suite installs every target once on each manager, so a resolution that breaks fails there; one that
  differs and still installs and passes `check` on both is not looked for.
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
  asserts on install warnings for every manager but never on a deprecation. A deprecation says a third-party
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
It runs on 10; the metadata is stale. pnpm waves it through with `peerDependencyRules` and yarn with
`packageExtensions`, but bun has no equivalent: measured against a real
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

`@linteljs/vue/sfc-import-seam` turns `no-unsafe-argument` and `no-unsafe-assignment` off for every `.ts` file in a
Vue or Nuxt project, because the program behind lint reads an SFC import as an error type and `vue-tsc --noEmit`
checks that seam. Measured on 2026-10-01 against the `lint:starters` projects, every answer on, with the two
rules back on: Vue gave 11 findings, every one an SFC import (`createApp(App)` in `main.ts`, a route's `component:`
in `router/index.ts` and `views/routes.ts`, a `mount(ContactView)` result in its suite); Nuxt gave 2, both a real
`any` from Vitest's `expect.objectContaining` in the i18n plugin suite, which now reads the head it records instead.
The seam is Nuxt's too: a probe `.ts` importing `AppHeader.vue` gives the same error-typed finding, since Nuxt's
generated types declare no `*.vue` module. So the override stays as it is. A glob cannot name what imports an SFC
(an entry, a router, a route table and any suite all do), and a list of today's starter paths would miss the first
such file a project adds.

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

Every list layout splits at the same count: three or more items, one per line, the delimiters on lines of their own.
Two or fewer sit on one line or go fully one per line, and a half-split list, broken in some places and not others,
is fixed to the second. No rule joins lines. `@linteljs/member-newline` does it for an object literal, an object
pattern, an interface and a type literal, `@linteljs/array-newline` for an array and an array pattern,
`@linteljs/import-newlines` for an import and `@linteljs/export-specifier-newline` for an export list. One node,
one owner, and one threshold for all of them. Two exceptions are on purpose: `union-newline` splits on what a
union holds, not on how many members it has, and `@linteljs/chain-call-newline` splits a chain at two calls, or at
one callback with a body, since a chain reads as steps. Three rather than two keeps a pair on one line, `const [value, setValue] = useState(0)` among them, without an
exception for tuples.

`@stylistic` 5.10.0 cannot say it, which is why the plugin owns objects and arrays. `object-property-newline` has no
count: it splits at two, or with `allowAllPropertiesOnSameLine` passes `{\n  a: 1, b: 2, c: 3\n}` once
`object-curly-newline`'s `minProperties: 3` has moved the braces, and neither reports `{ a: 1,\n  b: 2 }`, all
measured. `array-bracket-newline` in `multiline` or `minItems` mode joins a one-element array of a single token past
`max-len`, and in `consistent` mode it accepts `[a,\n  b]` with a hanging bracket. So `base` turns
`object-property-newline` off and keeps `object-curly-newline` at `consistent` alone, for the single member the
plugin rules leave alone; its `multiline` would break the braces of `{ a, draw: () => {...} }` and split a pair.

JSX props take the object form of `@stylistic/jsx-max-props-per-line`, `{ maximum: { single: 2, multi: 1 } }`,
replacing the preset's `{ maximum: 1, when: 'multiline' }`, which caps a one-line tag at nothing. Two on a line
rather than one: `<path d="M12 28.5 H108" strokeWidth="13" />` is one idea, and a third prop is where a reader starts
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

### `no-duplicate-interface` rather than `no-redeclare`

TypeScript merges two interfaces of one name in one scope and says nothing, so the second edit to add an
`interface Props` extends the first. `@typescript-eslint/no-redeclare` does not fit: with `ignoreDeclarationMerge`
on it returns early when every declaration is an interface, and with it off it also reports a `const` and a `type`
sharing a name, the value-and-type companion pattern. `import-x/export` sees exported names only.

- **Interface pairs only.** A class and an interface are `no-unsafe-declaration-merging`'s; a namespace, function
  or value merging with an interface is deliberate.
- **One scope per block.** The top level, a `declare global` or `declare module` block, a `namespace` body and a
  function block are compared only with themselves, so augmentation stays allowed.
- **Report-only.** Merging the bodies guesses which member wins where both declare it.

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

The numbers govern this workspace too. Measured on 2026-10-04 the way the rules count, in non-test source: the
longest file is `create/src/targets/react/reactTarget.ts` at 441 lines, the longest `utils/` module
`create/templates/project/plugins/linteljs/hooks/utils/commandParserUtils.ts` at 694, and the longest function
`base` itself at 293, with `chain-call-newline`'s `create` at 286. The workspace has no cap of its own: a
workspace-only number would be a second standard the published one does not state.

### Magic numbers in source only

`base` turns on `@typescript-eslint/no-magic-numbers` for every script and SFC file, with core `no-magic-numbers`
off, since the typescript-eslint copy also runs on plain JavaScript. Suites, `__mocks__/`, e2e, `*.config.*` and
`constants.ts` are exempt: a case states its own numbers, a config file is a table of options, and `constants.ts`
is where a number gets its name. `-1`, `0`, `1` and `2` are allowed. Measured over the workspace source, suites and
config files out: the chosen options give 82 findings in 28 files; an empty `ignore` gives 664 in 120, and `[0, 1]`
183 in 73; `detectObjects: true` gives 90, so a column-width table stays legal; including `constants.ts` gives 90,
every one already a named entry. `1000` is not allowed, and is `MS_PER_SECOND` instead.

### Expression complexity in source only

`base` turns on `sonarjs/expression-complexity` at its default `max: 3`, restated, for every script and SFC file
except suites, `__mocks__/` and e2e: a case may spell out the condition it pins, while source names the parts of a
long condition in `const`s or a small predicate. Config files and `constants.ts` stay in scope, since the rule is
about reading a condition rather than naming a number. Measured on 2026-10-02: 18 findings in 8 files, all under
`eslint-plugin/scripts/` and `eslint-config/scripts/`, and none in the suites or the starters. Every one was
fixed in the code, so the root config carries no exemption for it.

### `name-before-use` reports and never fixes

`@linteljs/name-before-use` asks for an `await`, a call that takes a call, or an inline array or object to be named
in a `const` before it is used. It is report-only: the fix would have to invent the name, and an invented name reads
worse than the inline code it replaces. `ignoreEmptyLiterals` and `ignoreLiteralArguments` relax it for `[]`, `{}`
and a literal passed straight to a call. It is outside `recommended`, like the other opinionated rules a layer turns
on itself, and `base` turns it on with both options for every script and SFC file, suites included. The plugin's own
rules follow it: `create` returns a named `visitors: Rule.RuleListener`.

A suite that asserts on parsed JSON names it `const parsed: unknown = JSON.parse(text)`, the shape the banned-pattern
checker already grants. Hoisting it bare would type it `any`, and a
typed read helper or a `JSON.parse` exemption would each be a second way to say the same thing. Every finding in the
workspace was fixed in the code, so the root config carries no exemption for it.

### `base` carries no framework rule

`@stylistic`'s `recommended` and `sonarjs/recommended` are framework-blind: the first ships fourteen JSX rules, the
second React, Vue and Angular rules, to every file. `base` builds the stylistic preset with `jsx: false` and turns
the ten sonarjs framework rules off; each framework turns its own back on (`JSX_STYLE_RULES`, `sonarjsRules`), and
an `.astro` template, which parses as JSX, keeps the layout set. The layer suites hold `base`, `typescript()`,
`vitest()` and `html()` to no framework rule at all. Solid gets the JSX layout but not sonarjs's React rules.

### Destructuring in declarations only

`prefer-destructuring` reports `const width = box.width` and nothing else. On an assignment the fix needs
`({ width } = box);`, a statement that has to start with a parenthesis and reads worse than what it replaces, so
`AssignmentExpression` is off. Arrays are off on both: `const first = list[0]` names an index, which `[first]`
hides. A renamed property (`const tall = box.height`) is not reported, since `{ height: tall }` is no shorter.

### Aliases come from the program's `paths`

`@linteljs/prefer-alias` reads the aliases off the TypeScript program, not off a list in its options, and checks
each rewrite against the file tsc resolves. The tsconfig is already the one place a project declares its aliases,
so a second list in the ESLint config would drift from it. That needs type information, so the rule sits in
`typescript()` and reports nothing without it. `aliasExempt` is for a file some other tool reads without the
aliases, and `enforceRelativeImports` makes such a file relative throughout.

### No parameter properties

`typescript()` reports `constructor(private readonly value: number)` and wants the property declared in the body.
A parameter property is TypeScript that emits code, so Node's type stripping cannot run it and `erasableSyntaxOnly`
refuses it. The rule holds that in every consumer, including one whose tsconfig does not set the flag. A class
then reads like plain JavaScript: its fields are in its body.

### Rules `base` leaves off, measured

Each was tried against the workspace and the 670 starter files with `base` as it stands.

- `@stylistic/curly-newline`: with `minElements: 1` alone it reports a block holding only a comment, the
  `catch {` with a `// why` line under it that `base` allows (six findings, four unfixable); with
  `consistent: true` added it finds nothing, and on every one-line block it reports the same two braces
  `@stylistic/brace-style` already does.
- The `export` entry of `@stylistic/padding-line-between-statements`: a blank line before every export never
  settles in a barrel of re-exports, where the fix does not apply (46 findings left after `--fix`, every one in an
  `index.ts`). The rest of the list ships; `import-x/newline-after-import` already owns the line after imports.
- `import-x/consistent-type-specifier-style`: the workspace writes `import type` when every name is a type and an
  inline `type` when a line mixes types and values, the form `import-x/no-duplicates` with `prefer-inline` merges
  to. Neither style matches: `prefer-top-level` reports 279 imports in 169 files, `prefer-inline` 324 in 238.
- `import-x/no-named-as-default`: 70 findings. 68 are a layer imported by its default name (`import base from
  './baseLayer'`), where each layer exports the same value both ways on purpose, and two `eslint-plugin-import-x`,
  which ships its API the same way.
- `import-x/default`, `import-x/named` and `import-x/namespace`: TypeScript reports each (TS1192, TS2305, TS2339)
  with no export map to build; `import-x/typescript` already turns `named` off.
- `import-x/no-deprecated`: `@typescript-eslint/no-deprecated` and `sonarjs/deprecation` report the same JSDoc
  `@deprecated` with type information.

### Rules `typescript()` leaves off, measured

- `@typescript-eslint/no-use-before-define`, with `functions: false` and `variables: true`: five findings in the
  workspace, none in the starters. Four are mutual recursion between `const` arrows (`envSplit` and `envWrapper`,
  `renderedBy` and `descendantElements`), which `func-style: expression` makes the only way to write it and which
  no order settles; the escape would be a disable comment, which `@linteljs/no-eslint-disable` bans. With
  `variables: false` it finds nothing TypeScript does not already report as TS2448, TS2449 or TS2450.
- `@typescript-eslint/no-restricted-types`: the reference list bans only `Object`, which
  `@typescript-eslint/no-wrapper-object-types` in `strictTypeChecked` already reports, with `Function` left to
  `no-unsafe-function-type` and `{}` to `no-empty-object-type`. An empty list is no rule.

### Rules the React core leaves off, measured

- `@eslint-react/no-leaked-conditional-rendering`: it reports the same `count && <span />` as
  `sonarjs/jsx-no-leaked-render`, which the React core and `solid()` carry, so one defect read twice.
- `@eslint-react/no-unused-props`: it needs type information and throws on every `.tsx` when `composeConfig` runs
  with `typescript` off, which it allows; the sonarjs typed rules skip instead. On the typed starters it reports
  five, all the unread `error` prop of Next's `global-error.tsx`.
- `@eslint-react/dom-no-unknown-property`: the reference turns it on only to allow Emotion's `css` prop, and no
  target ships Emotion.

## Targets

Ten: React, Next.js, Vue, Nuxt, Svelte, Solid, Angular, Astro, React Native through Expo, and a Manifest V3
browser extension, for which `compatlens` is the reference.

Two of them host a UI framework rather than being one. Astro renders `.astro` templates and hydrates islands; the
extension renders whatever its surfaces are written in. Both take the same `hostedFramework` answer, composed from
`targets/utils/frameworkUtils.ts` rather than read off the framework's own record, because those records are
app-shaped (their route unit, typecheck and aliases describe a standalone app) and a host needs the narrow set that
varies. Svelte's entry there is the bare `@sveltejs/vite-plugin-svelte`, not `sveltekit()`, since a host owns its
own entry.

Every target exports a builder, `(answers: Answers) => TargetRecord`, that builds its record on each call, even
where it reads no answer; `targets/registry.ts` maps each id to its builder and emitters reach it only through
`targetFor`. A record held as a module constant ran its helpers (`translated`, `componentStyles`, `mockTests` and
the rest) at import, which Stryker counts as static, running every test for each such mutant. Measured on
2026-10-03 with `--dryRunOnly` over the five `targets-*` parts: 2175 of 3162 mutants static as constants, 509 of
3171 as builders. What stays static is module-level data.

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
which is eighteen combinations, and is one file per axis. The joins do it: `useSubmitContact()` (Solid's
`createSubmitContact()`) has one signature in all three api spellings, so the form never learns which layer runs it; `ROUTES` is one array the header, the route
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
api modules it renders identically. Logic with no framework in it is shared even where the module around it is
not: a framework's i18n module keeps its reactive state and its `t`, and reads language matching, direction,
detection order and placeholder filling from `shared/i18n/src/i18n/utils/languageUtils.ts`, and the language cookie
and `Accept-Language` parsing from `cookieUtils.ts` beside it, each with its one suite; every contact api wrapper, plain or a TanStack Query mutation, reads `submitContact` from
`shared/src/lib/apis/contact/submission.ts`. Every extended query adapter builds its query and mutation options
from `shared/src/lib/utils/queryOptionsUtils.ts`, typed structurally and handed the adapter's client for
invalidation, and every TanStack Form contact form takes `validateContactForm` from
`shared/src/lib/apis/contact/formValidator.ts`, one file for the plain and the zod rules since it calls whichever
`schemas.ts` ships. A copy of framework-free logic in two targets is a defect; the shell that imports it stays
per target. Anything with a framework in it
is not shared: React's `className` is not Vue's `class`, React destructures props and Solid may not, and React's
route element is a node where Solid's has to be a function. A target that writes a shared file under its own naming (Angular's `status-utils.ts`) keeps the one
source: the starter emitter rewrites a shared file's relative imports to the names the target writes, so a
difference in file naming alone is never a reason for a copy.

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
- **React Native's shell is under coverage.** jest-expo transforms Expo's TypeScript source in `node_modules`, so
  `src/app-layout.test.tsx` renders `src/app/_layout.tsx` through `expo-router/testing-library`, and the tab bar
  executes `src/config/routes.ts` with it. The Tailwind spelling of the suite stubs `global.css`, which only Metro
  reads through NativeWind.
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

The form, Zod and data answers are demonstrated on every target that renders a contact page. Angular always renders
one, on Reactive Forms, since `@angular/forms` ships with the framework; TanStack Form swaps the page's component for
`injectForm`. Astro and the extension install the form library without a demo, and Nuxt declares its stores without
a counter; recorded here so the absence reads as a decision rather than a forgotten file.

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
| `ui/button/Button` | the status page's retry, the store and the form, and the disabled and submit states |
| `ui/text-input/TextInput` | the label, error slot, `aria-invalid` and `aria-describedby` wiring; `multiline` rather than a second `TextArea` |
| `ui/mark/Mark` | the SVG and its animation, rendered once, on Home |
| `features/app-header/AppHeader` | the name and the nav, and the one place the router and no-router spellings differ |
| `features/status-page/StatusPage` | the one page a crash and every status render, see [A crash and a status have one page](#a-crash-and-a-status-have-one-page) |

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

### A crash and a status have one page

A starter catches a render error and answers a path nothing routes, each with its framework's own mechanism, and
both land on one `StatusPage` per framework: the code as the heading, one line under it, "Try again" on a crash and
"Go home" on every one. The line for each code lives once, in `src/config/statuses.ts`. The page's classes are the
`.status` block in `base.css` and the retry is the shared button, so nothing varies by styling: `base.css` ships
under every answer, and it makes each framework's mount point a flex column so the page centres in the height
under the header. Its message is the
`role="alert"`, and "Go home" is a full load, so a crash leaves no state behind (Next takes `Link`, which its
plugin requires). A status ships only where something can produce it: a 404 needs a router, and a 403 needs a
loader or a server that can refuse, or a boundary that can tell a refusal from a crash. Where the boundary is client
code, that is `ForbiddenError` in `src/lib/utils/statusUtils.ts` (`status-utils.ts` on Angular): thrown anywhere
below the boundary, it shows the 403 page, with no retry, since trying again cannot grant access.

| target | 404 | 403 | crash |
| --- | --- | --- | --- |
| react, no router | none, nothing routes | `ForbiddenError` | `ErrorBoundary`, a class, since only `getDerivedStateFromError` catches |
| react-router | the layout route's `errorElement` | loader, or `ForbiddenError` | the same `RouteError`; retry navigates to the same place, which resets it |
| react-router-framework | `ErrorBoundary` exported from `root.tsx` | loader; `ForbiddenError` once hydrated (a server render's error arrives without its class) | the same `RouteError` |
| tanstack-router | `defaultNotFoundComponent` | `ForbiddenError` | `defaultErrorComponent`, with its `reset` |
| next | `app/not-found.tsx` | `ForbiddenError` from a client component (a server component's error arrives without its class); `forbidden()` is experimental | `app/error.tsx` and `app/global-error.tsx`, with `reset` |
| vue | a catch-all route rendering the page | `ForbiddenError` | `onErrorCaptured` in `ErrorBoundary.vue` around `RouterView` |
| nuxt | `error.vue` | `createError` | `error.vue`, retry is `clearError()` |
| svelte | `+error.svelte` | `error(403)` | `+error.svelte`, retry is `invalidateAll()` |
| solid, no router | none, nothing routes | `ForbiddenError` | `<ErrorBoundary>` with its `reset` |
| angular | a `**` route rendering the page | `ForbiddenError` | a custom `ErrorHandler` sets a signal to the status the shell swaps its outlet for; retry clears it |
| astro | `src/pages/404.astro` | no: static output has no request to refuse | none: static output renders at build, so a crash fails the build, not a visit |
| react-native | `src/app/+not-found.tsx` | `ForbiddenError` | `ErrorBoundary` exported from the root `_layout.tsx`, with `retry` |
| webextension | none, no router | no | none: its pages are built node by node, with no framework boundary to use |

Where the boundary runs only inside its framework (Next's `error.tsx`, SvelteKit's `+error.svelte`, Nuxt's
`error.vue`), the suite renders the file as the page it is and hands it the status or the reset. `global-error.tsx`
is a document and leaves coverage with `layout.tsx`. Astro's `404.astro` is a page no suite executes, like its others; the build's `404.html` is
the check. React Native's page is the same markup in `StyleSheet` rules from `styles/starter.ts`, which the plain and
NativeWind starters share. Its suites stand a `Text` in for `Link`, since expo-router's entry loads Expo's
TypeScript source, which no test transform strips, and its boundary, `Try`, loads the same, so `CrashPage` is
handed an error and a `retry` rather than a throwing child.

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

**StyleX dev CSS under a server-rendered document.** The Vite plugin serves its dev CSS at `/virtual:stylex.css`
and links it only through `transformIndexHtml`, which runs on an `index.html`. Nuxt, SvelteKit, Astro and React
Router framework mode render their own document, so each links it in dev itself, with the runtime that refetches
it on update. Astro takes the link alone: every page is a full load, and its server render has already compiled
the page's styles. A build is unaffected, since the plugin appends to the emitted CSS asset.

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
| angular | `ngrx-signals` |
| svelte, solid | `tanstack-store` |
| astro | `nanostores`, bound through the hosted framework |
| webextension | not asked |

A store installs a dependency and nothing else; none ships ESLint rules, and the `@store/*` alias and
`src/lib/store/` already reach every project. Absent means the framework's own state: `createStore` from
`solid-js/store`, a `$state` rune in a `.svelte.ts` module. The extension is not asked because an MV3 service worker
is torn down between events, so in-memory state dies with it and real state belongs in `chrome.storage`.

Angular offers SignalStore only. `ng new` writes a standalone, signal-first app and SignalStore is the NgRx API
built for it; its Events plugin (NgRx 19.2+) covers the Flux style, so classic `@ngrx/store` adds a second
vocabulary for the same job.

### The router answer

Only the React target has a `routers` slot: `react-router`, declarative, with its route table in
`src/routes/router.tsx`; `react-router-framework`, see [Targets](#react-router-framework-mode-is-a-router-value-nuxt-is-a-target);
and `tanstack-router`. Next, SvelteKit, Nuxt, Expo and Astro route by file; Vue and Angular install their
router unconditionally, because an application on either routes; Solid's is a `pnpm add`.

### The languages answer

`--languages` takes any subset of `en`, `ar`, `ja`, `ko`, `zh-CN`, `zh-TW`, and defaults to none, like every
optional library: a project without it is byte-identical to one generated before the answer existed. Any choice
ships English as well, since it is the fallback. Only a target whose record carries `i18n` parts is asked; so far
that is React, in every router mode, Next, Vue, Nuxt, SvelteKit, Solid, Angular, Astro, React Native and the
webextension popup.

- **One library per framework, the most used and maintained one.** React takes i18next with react-i18next and no
  detector, Next takes next-intl, Vue and Nuxt take vue-i18n in composition mode, SvelteKit takes
  Paraglide JS, Solid takes @solid-primitives/i18n, React Native takes i18next with react-i18next and no
  detector. Angular and Astro take none: Angular's own signal is the
  whole runtime a switch needs, and an Astro page ships no framework to hold one, so each hand-rolled core is
  the same single-brace resolver.
- **Placeholders are single-brace ICU, `{name}`.** The shared `common.json` is read by every framework, and ICU is
  the form next-intl, vue-i18n and Paraglide read; React's i18next init sets `interpolation.prefix` and `suffix`
  to `{` and `}` to read it too.
- **A detected language is never stored.** The order is the stored choice, then the browser, then English. The
  language select is the one writer, so a first visit does not pass for a choice and a later change of browser
  language still reaches the page.
- **Every target detects through one `lookupTags`.** A script tag reads as its region, `zh-Hans` as `zh-CN` and
  `zh-Hant` as `zh-TW`, and `zh-HK` and `zh-MO` read as `zh-TW`, since both write Traditional. React reads it too
  rather than i18next's browser detector, which matched `zh-Hant` to the first `zh` it offers, `zh-CN`.
- **`src/i18n/config.ts` is emitted, everything else is a template.** Its imports name the chosen locales, so it
  depends on the answer; it holds data only. Each translated file is a `translated` pair: the English file as
  before, and an `i18n` twin that replaces it once a language is chosen.
- **Shared tables hold keys, not text.** The twins of `src/config/statuses.ts` and `src/config/standard.ts` hold a
  key into the flat, camelCase `common.json`, so every framework translates the same table. Text around a command
  is one key read through `Trans`, so the command stays in its `<code>` in any word order.
- **The contact rules return keys, not text.** A failed rule is a `contact*` locale key, and every contact hook
  takes the page's `translate`, so the labels and messages follow the language. The English stays in the schemas'
  `CONTACT_TEXT`, read only by a project with no languages.
- **What stays English.** The gate's `runs` and the recorded answer labels on the About and Version pages, since
  the generator emits them as facts about the project; and the home page, not yet translated.
- **Direction follows the language.** `<html lang dir>` is set on init and on every change, so Arabic turns the
  page `rtl`; the starter CSS uses logical properties only.
- **A server-rendered target serves the chosen language on the first byte.** React Router framework mode (in its
  root `loader`), Next (in the root layout), Nuxt (in `src/plugins/i18n.ts`) and SvelteKit (in
  `src/hooks.server.ts`) detect from the request: the language cookie, then `Accept-Language`. The server renders
  `<html lang dir>` and the page in that language, and the client hydrates in it. The language select writes the
  cookie, the one stored choice.
- **Next translates without routing.** No next-intl plugin, no `request.ts` and no locale segment in the URL:
  the language is the reader's choice, not a route. The root layout hands the detected language to
  `I18nProvider`, which reads it as the server snapshot of a `useSyncExternalStore`, so hydration matches. The
  translated pages are client components, and each suite wraps its render in the provider, so Next's `i18n`
  parts carry no test setup.
- **vue-i18n reads the shared locales as they are, once quoted.** Its message compiler reads `@` as the start of a
  linked message, so `src/i18n/index.ts` quotes each as the literal `{'@'}` at load, and the shared files stay
  plain. A translation that carries `<code>` is never rendered as HTML: `CodeText` splits the message on its
  marks and renders each command as text inside its own `<code>`, so `warnHtmlMessage` is off rather than met
  with `v-html`. The test setup installs the one `i18n` on every mount, in English until a suite switches.
- **Nuxt takes vue-i18n directly, not `@nuxtjs/i18n`.** The module writes a detected language to its cookie, so a
  first visit passes for a choice; its auto-imported `useI18n` also has nothing to resolve in vitest, which runs
  outside Nuxt's build. With vue-i18n alone, Nuxt reuses Vue's i18n core, pages and components.
  `src/plugins/i18n.ts` detects once on the server, carries the language to the client in `useState`, and binds
  the head's `lang` and `dir` to the locale.
- **SvelteKit takes Paraglide JS, not svelte-i18n.** A SvelteKit project with svelte-i18n 4.0.1 audited at one
  moderate advisory under `pnpm audit --prod` (GHSA-67mh-4wv8-2f99, the esbuild 0.19 it pins) and two under
  `pnpm audit`; with Paraglide JS and its message-format plugin the same project audits at none, and installs
  with no build scripts. `project.inlang/settings.json` is seeded beside the i18n config and points the plugin
  at the shared `common.json`. It loads the plugin from `node_modules`, not the CDN URL inlang documents, so a
  compile needs no network and the version is the one the lockfile pins.
- **Paraglide is a compile step.** `paraglide-js compile` writes typed message functions to
  `.svelte-kit/paraglide`, with declarations, ahead of `svelte-kit sync` in `prepare` and in `typecheck`, so a
  fresh clone and the gate both type against current messages; its Vite plugin compiles again for dev and
  build. Detection stays ours: `getLocale` is overwritten to read a store, so every message follows the
  language select, and the strategy is `baseLocale` so Paraglide neither reads nor writes storage itself.
- **Solid takes @solid-primitives/i18n.** Version 2.2.1 has no dependencies and no install scripts, so
  `allowBuilds` is unchanged, and a Solid project with it audits at no known vulnerabilities under
  `pnpm audit --prod`. Its own resolver reads `{{name}}`, so `src/i18n/index.ts` hands `translator` a
  single-brace one, which leaves a value it was not given in place, as the other libraries do.
- **`translator` is imported as `createTranslator`.** `solid/reactivity` reads a `create*` call as a reactive
  primitive, so the dictionary accessor passed to it counts as tracked, which it is: every `t()` reads the
  language signal afresh. Under the library's own name the rule warns that the accessor's reactivity is ignored.
- **Angular takes no library, not `@angular/localize`.** Angular's own i18n extracts messages at build time and
  emits one build per locale, so a language is a URL and a deploy, and switching it is a page load into another
  bundle; the shared `common.json` would also have to become XLIFF. The language select needs a runtime switch
  over the shared files, so `src/i18n/index.ts` holds a module-level `signal` and `t` reads the locales through
  it with the single-brace resolver. A template that calls `t` re-renders on a switch, so each component exposes
  `t` and nothing subscribes. `main.ts` applies the detected language before bootstrap, and with no SSR there is
  no hydration step. Nothing is installed, so `allowBuilds` is unchanged and an Angular project with languages
  audits at no known vulnerabilities under `pnpm audit --prod`.
- **Astro takes no library, not Astro's i18n routing.** Astro's routing is build-time: one URL per locale, a
  prefix in every path, and a choice made by the URL or by `Accept-Language`, so a detected language becomes a
  route and switching is a navigation to another page. The language select needs a runtime switch with the
  stored choice first and nothing detected stored, so pages render English at build time and each translated
  element carries `data-i18n` with its key, the values of its placeholders in its own `data-*` attributes.
  No island renders text, so a host framework needs no i18n of its own.
- **An inline boot sets `lang` and `dir` before the first paint.** An Astro page is a full load each time, so a
  bundled module, which runs after parsing, would show each page left to right before Arabic turns it. The
  layout inlines `bootScript()` in the head with `is:inline`: the source of `bootLanguage`, a self-contained
  function, called with the config as JSON. It reads the stored choice, then the browser, then English, and
  writes only `<html lang dir>`. The bundled `startLanguage` then renders each marked element in that
  language, splitting a message on its `<code>` marks into text and `code` nodes, and wires the select, the one
  writer of the stored choice. Measured on a built project, `dir` is `rtl` before `<body>` exists and in the
  first animation frame, on a reload and on a navigation.
- **The boot test checks the script's shape, not its run.** Evaluating the generated string in a suite is what
  `sonarjs/code-eval` forbids, so the suite runs `bootLanguage` itself and asserts that `bootScript()` is
  exactly its source called with the config's JSON, in order.
- **React Native keeps the choice in AsyncStorage 2.2.0, not 3.x or expo-sqlite.** 2.2.0 is the version Expo
  SDK 57's `bundledNativeModules.json` pins, so Expo Go and `expo install` agree with it; it is 381 KB unpacked,
  runs no install script and is `localStorage` on the web. 3.1.1 is 52 MB unpacked and IndexedDB on the web;
  expo-sqlite 57.0.3, whose `kv-store` reads the same, is 78 MB. An `allowBuilds` entry is not needed.
- **The device language comes from expo-localization, not `Intl`.** iOS resolves `Intl` against the app's own
  localizations, so a device in Arabic reads as `en-SA` in Expo Go, which has no Arabic. `getLocales()` is the
  device's own list of preferred languages, in order, so the starter reads it through the shared `pickLanguage`:
  the stored choice, then the first preferred language it offers, by its exact tag or a shorter prefix, then
  English, and nothing detected is stored. expo-localization 57.0.2 is what SDK 57's `bundledNativeModules.json`
  pins and is in Expo Go. Its config plugin also takes the chosen languages as `supportedLocales`, which a built
  app needs: iOS resolves the app's language from `CFBundleLocalizations`, and both systems list them in the
  per-app language setting.
- **The first render is English.** The static web export (`web.output: static`) is rendered in English, and
  hydration has to match it, so `initI18n` starts in English and `restoreLanguage` switches in an effect of
  the root layout once the stored or detected language is read.
- **The picker is a button opening a `Modal`.** React Native has no select: the header's button names the
  language in use and opens a radiogroup of every language under its own name, the one in use checked.
- **Native direction follows the device's language.** On the web `<html lang dir>` is set on every switch.
  Native lays out its direction at launch. Expo Go on SDK 57 lays it out right to left only where app.json sets
  `extra.supportsRTL`, read from the manifest, and the expo-localization plugin writes the same setting into a
  build; it is emitted when a chosen language is right to left. Expo's guide rules out mixing that with
  `I18nManager.allowRTL` and `forceRTL` from code: Expo Go resets them on every open, and on iOS the plugin sets
  them from the device's language at every launch. So a stored choice changes the text at once and never the
  layout direction, on both systems alike.
- **The webextension popup takes no library, not `chrome.i18n`.** `chrome.i18n` follows the browser's UI
  language and cannot switch at runtime, and its `_locales/*/messages.json` would duplicate the shared
  locales. The popup is plain DOM under every host, so it reads the shared locales through the same
  single-brace resolver as Angular and Astro, keeps the choice in `localStorage` and paints a native select.
- **Only an extension with a popup is asked.** The background, content script and devtools panel show no text,
  so the `i18n` parts ride on the popup surface, and an extension without one is not offered languages.
- **The popup is translated, though the home pages are not.** A popup is the extension's whole interface, a
  lede and a gate hint, so leaving it English would leave the answer with nothing to change.

### Recorded answers

`aliases`, `ignores`, `resolveConditions` and `browsers` are recorded, not asked: facts about a project, discovered
after generation and edited into `linteljs.config.json` by hand. `aliases` exists because `eslint.config.js` is
emitted whole, so an alias added there would be lost to the next config linteljs writes; recorded, one line reaches the ESLint config,
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

### Jest and jest-expo, not Vitest

React Native is the one target whose suites run on Jest, through `jest-expo`'s default preset: the runner Expo
ships and tests against, rather than a Vitest plugin at 0.1.x with one maintainer standing in for the native
renderer. The trade is stability. The gate holds: a generated project reaches 100% on statements, branches,
functions and lines (measured 2026-10-04 on a tanstack-query, zustand, i18n project: 179 statements, 58 branches,
53 functions, 80 of 80 tests; 83 of 83 once the LanguageSelect radiogroup case was added). `testing` stays a yes or
no: the target picks the runner, through the record's `testRunner`.

This section used to say jest-expo stops at 71%. The spike refuted that: 71% was a half-finished port, 73% with 9 of
17 suites failing to load on port errors (`Vitest cannot be imported in a CommonJS module`, `toHaveBeenCalledOnce is
not a function`, ``Property `OS` does not have access type get``). Every uncovered line needed a test or a mock, none
was unreachable. `Platform.OS` stays a runtime read under jest-expo, so `jest.replaceProperty(Platform, 'OS', 'web')`
covers a web branch. No target writes a `.web` module, so one native project is all it takes; were one added, a
second project on the native preset with a resolver preferring the `.web` sibling measured 100% again.

The cost, measured:

- Babel compiles every suite to CommonJS, not native ESM. A top-level `await` cannot run, so the setup and the msw
  fragment (`setupTests.mswJest.ts`) take modules through `jest.requireActual`, and a `jest.mock` factory is sync.
- Jest is pinned to `^29.7.0`, jest-expo 57's own major: jest-expo 57.0.5 depends on Jest 29 packages (`babel-jest`,
  `jest-environment-jsdom`, `@jest/globals`). Under the Jest 30 runner it works, but with two Jest majors in the
  tree, and `node_modules` grew from 587M to 745M.
- Slower: a warm run with coverage takes about 3.6 s against Vitest's 1.4 s (7.3 s with `--no-cache`).

No worklets resolver. `react-native-worklets/jest/resolver.js` lets the real Reanimated load, but under pnpm it
strips the native extensions from any `basedir` naming `react-native-worklets`, and expo-modules-core's `.pnpm`
directory carries that peer in its name. `NativeViewManagerAdapter` then resolves to its web file, which throws
`requireNativeViewManager is not available on ios` (from expo-glass-effect, through expo-router). The spike ran on
npm and never saw it. Reanimated keeps the View stand-in mock.

The `react-native` export condition jest-expo resolves takes a fix in `jest.config.js` for two answers. msw's `msw/node`
exports `"react-native": null`, so with msw the config sets `customExportConditions` to `node`, `require`,
`react-native`, and its CommonJS build requires three ES-only dependencies (`rettime`, `until-async`,
`@open-draft/deferred-promise`), two as `.mjs`, which the preset neither un-ignores nor transforms: the config
un-ignores them and adds a `.mjs` transform reusing the preset's own `babel-jest` entry. With redux-toolkit the
condition picks `immer` and `react-redux`'s `legacy-esm` builds, which the preset ignores, so both are un-ignored.
The un-ignore list is built from the answers.

No `babel.config.js`. The default preset carries its own Babel transform; only the `jest-expo/<platform>` presets
pass `babel-jest` a bare `caller` and fail without one (`SyntaxError: .../@react-native/jest-preset/jest/setup.js:
Unexpected token`). Measured at 100% on all four metrics without it, under Jest 30 and 29.7.

The `hostComponentNames` warning is gone. The Vitest plugin passed that option to `@testing-library/react-native`
14, which dropped it and printed `Unknown option(s) passed to configure: hostComponentNames` 17 times a run; Jest
prints none, and the end-to-end run of `react-native pnpm` passed 16 of 16 with no such line.

`sync` changes no runner. A project generated while React Native ran on Vitest keeps its suites, its setup and its
`test` scripts, none of which `sync` owns, so a sync writing the Jest lint config would strand them: measured on
such a project, rewriting `tsconfig.json` and `eslint.config.js` for Jest left every suite unresolved, `eslint .`
failing. So the refusal runs before any other step: where `package.json` installs one runner and the target now runs
another, `sync` writes nothing and exits 1 naming both; the project ports its suites, swaps the dependencies, and
syncs again.

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
### A native build opts into the UIScene life cycle

Xcode 27's iOS SDK refuses to launch an app that keeps the AppDelegate window: `expo run:ios` dies with "UIScene
life cycle is required for apps built with this SDK". Expo SDK 57 adopts the scene life cycle from expo 57.0.23 only
as an opt-in, so `app.json` sets `ios.enableSceneSupport` through `expo-build-properties`, at the SDK's
`bundledNativeModules` pin ([expo/expo#46664](https://github.com/expo/expo/issues/46664)). Measured 2026-10-05:
a generated project built with Xcode 27 launched on an iOS 27 iPhone 18 Pro simulator, its prebuilt `Info.plist`
carrying `UIApplicationSceneManifest`. SDK 58 adopts the life cycle by default and Expo says not to set the option
there, so the SDK 58 move drops the plugin entry.

Android on JDK 24 and later fails in `configureCMakeDebug`: the Android Gradle plugin runs Prefab 2.1.0, the last
release, as its own `java` process, and the JNA it bundles calls `System.load`, whose restricted-method warning the
plugin takes for a failure. `org.gradle.jvmargs` never reaches that process, and `JAVA_TOOL_OPTIONS` lives in no
committed file. React Native builds on JDK 17, so a starter config plugin writes
`android/gradle/gradle-daemon-jvm.properties` on every prebuild: Gradle runs its daemon, and Prefab with it, on
JDK 17 whatever `JAVA_HOME` names, and downloads Temurin 17 from Adoptium where none is installed. Measured
2026-10-05: after `expo prebuild --clean`, `assembleDebug` passed with `JAVA_HOME` on JDK 17, 25 and 27 and
`JAVA_TOOL_OPTIONS` unset, the download path passed with no JDK 17 on the machine, and `expo run:android` on JDK 25
opened Home on an emulator. The generated README's native-build notes say so, and name `expo run:*` through the
project's manager, since `npx` in a project whose `devEngines` names another manager fails with EBADDEVENGINES.

### The document head is web only, and a dev build carries no dev client

On iOS `expo-router/head` is a native module for Handoff, and in development it throws "Add the handoff origin"
unless the `expo-router` plugin names an `origin`. A starter has no real origin, so `DocumentHead` renders `<Head>`
on the web only. Measured 2026-10-05 on an iOS 27 simulator: with the guard removed the app opens on a Render
Error, and with it on Home.

`expo run:ios` opens `<scheme>://expo-development-client/?url=...` rather than launching by bundle id, and
expo-router maps that URL to `/`. Measured the same day: a fresh `expo run:ios`, a cold `simctl openurl` of the URL
and a warm one from the About tab each land on Home. So neither `expo-dev-client` nor an `app/+native-intent.tsx`
is added: each would answer a 404 that does not occur.


## Package managers

pnpm reads approved install scripts from `allowBuilds` in `pnpm-workspace.yaml`; bun reads `trustedDependencies`
in `package.json` and nothing else (measured on bun 1.3.11: an `allowBuilds` key in `bunfig.toml` leaves the script
blocked). npm 12 reads `allowScripts` from `package.json`. All of them take the one list `allowedBuildNames`
builds.

Every manager that has a release age gate gets two days, linteljs exempt: pnpm `minimumReleaseAge: 2880`
(minutes), bun `install.minimumReleaseAge = 172800` (seconds) in `bunfig.toml`, Yarn `npmMinimalAgeGate: 2880`
(minutes). CI e2e run 36732855202 failed every bun and yarn case on a half-published `@eslint-react/jsx` that
pnpm's gate held back. Measured 2026-10-01: bun 1.2.23 ignores the keys and 1.3.0 honours them, with exclusions
matched by exact name; Yarn 4.9.4 refuses `npmMinimalAgeGate` as an unrecognized setting and 4.10.1 reads it, so
`.yarnrc.yml` carries it only when the recorded Yarn is 4.10.1 or later. The
e2e harness zeroes none of them: each project's own exemption lets the just-published linteljs packages through.

`.yarnrc.yml` is load-bearing, measured on React and Next with it removed. npm emits no `.npmrc`: it resolves peers
itself, and a conflict must fail the install (and the e2e `npm ls --all`) rather than be silently chosen, which
`legacy-peer-deps` did. Measured 2026-10-01 with npm 11 and the flag off, `vite` for vitest and StyleX's
`@csstools/css-tokenizer` 4 both install correctly unnamed (`npm ls --all` exit 0, stylelint exit 0 on the
emitted CSS), so they are not named for npm; yarn installs no peers and still names `vite`. `test-renderer` stays
named: unnamed, npm picks 1.3.0, whose `react ^19.3.0` peer fails against Expo's 19.2.3 and `npm ls` exits 1. Without `nodeLinker: node-modules` yarn's PnP breaks the ESLint
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

Node is `>=22.18.0` in a generated project and as this CLI's own floor, one `NODE_FLOOR`. The floor is type
stripping on by default: the shipped `scripts/*.ts` and the plugin's hooks run as plain `node file.ts`, from
lint-staged and from hosts that pass no Node flags. The CLI alone could run on 22.13.0 (`@inquirer/prompts` 8), but
a machine that runs `create` should run the project it writes. Pinned tools that want more say so themselves as `EBADENGINE` warnings. CI runs on
the major that ran `create`, read off the recorded `nodeVersion`.

### Yarn 1 is not supported

`yarn` means Berry and floors at 4.0.0. A Yarn 1 project cannot read `.yarnrc.yml`, has no `packageExtensions`, no
`dlx`, no install-script gate (it runs every install script and has no setting that says otherwise), and takes
`--frozen-lockfile` rather than `--immutable`, so supporting it meant a manager id that was not its own command and a
row for it in every table that varies by manager. A Yarn 1 agent or binary reads as `yarn` at version 1.x, so the floor refuses it with a message that names
Yarn 1 rather than a version number.

## What a project owns

Every file this CLI owns reaches disk as an `Artifact` through `artifactWriter`; `pipelineRun.ts` holds no
`projectFileWriter` call, which its suite pins by reading its own source. Adding a conditional file is an emitter,
never an orchestrator edit, which would move up a level the `switch (target)` the emitters are barred from.

### Two artifact lists, and why `sync` sees only part of one

- `buildArtifacts` is the toolchain linteljs maintains, and `create` writes all of it. `sync` writes only its
  `plugins/linteljs/` entries, plus the ESLint config and the `@linteljs/*` dependencies, each behind its own y/N.
- `seedArtifacts` is what a `create` run plants and `sync` never touches: `linteljs.config.json`, the README, the
  manifest and the starter source.

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
- **The `@linteljs/eslint-config` peers missing or behind** get their own y/N, after which the `<pm> install` to
  run is printed. Every other dependency, the framework included, stays the project's.
- **The ESLint config** is written without asking when none exists. One that differs gets a y/N, which moves the
  first spelling ESLint would load to the first free `.bak`, `.bak.1` and so on, then writes `eslint.config.js`.
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

`.cursor/hooks.json` is merged, since every Cursor project hook shares it: a `create --existing` run replaces the
entries naming `plugins/linteljs/hooks/` and keeps the rest, and `sync` never touches it.
`.github/hooks/linteljs.json` is linteljs's own name in a directory Copilot reads whole, so it is owned outright. VS
Code's Local agent also reads `.github/hooks/*.json` but sends its own payloads with tool names it leaves to the
debug log, so nothing relies on it.

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

So `pnpm lint:starters`, a leg of `pnpm check`, lints each starter where it will run: in a generated project,
installed, under that project's own `eslint . --max-warnings 0`, type-aware rules included. A text read outside a
project has no program behind it: measured on 2026-10-01, the project service's default project over the starter
texts gave 6,261 findings across 488 files, every one from a type-aware rule and 6,210 of them `no-unsafe-*`, since
each framework import reads as an error type.

Its scope is the template texts: `STARTER_CASES` in `packages/create/e2e/starter-cover/` names 67 e2e
cases that between them write every distinct text a starter template can become (781 on 2026-10-02, per target and destination,
the joined test setup included), and `starterCover.test.ts` fails when a template, a transform or a new answer
leaves a text no case writes, naming the labels that would reach it. What the emitters write themselves is left to
the end-to-end matrix, which runs every pair. Each case is the pipeline's own output (`pipelineRun`, install and fix
skipped) under `~/.cache/linteljs/typed/projects/`, with `@linteljs/eslint-config` and, through a pnpm override,
`@linteljs/eslint-plugin` read from `pnpm pack` tarballs named by their hash, so the layers and rules are this
checkout's. Every lint runs `pnpm install` (a changed tarball is a changed path, so it reinstalls) and `prepare`
by hand, since regenerating deletes what `prepare` wrote and a no-op install does not rerun it. A skipped case
reruns `prepare` too, so `.nuxt/` and `.svelte-kit/` survive for a check run by hand in the project.

The nine StyleX cases also run `test` and `build` after lint: StyleX resolves `@styles` theme imports only when it
compiles, so a broken alias lints clean. The step costs 42 seconds of a warm `--all` run.

A case whose generated tree (less `node_modules`, the lockfile and `.git`) hashes as it did at its last clean lint is
skipped; `--all` lints every case. Measured on 2026-10-02, ten cores and five at a time: cold, 8.4 minutes; warm
with `--all`, 4.5 minutes; warm with nothing changed, 16 seconds. So `check` runs the changed mode and CI runs
`--all` first, with the cache keyed on `create`'s templates and source. A missing cache prints a notice and runs
cold rather than skip. `lint:starters:fix` writes a fix back to a template copied whole and untransformed, and only
when every case writing it fixed it the same way, since one text can land under two targets' rules.

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

Every answer that changes emitted code is covered, in 185 cases rather than the whole product. `matrix.ts`
enumerates them; nothing is listed by hand. Per target, every legal combination of the varying axes is enumerated
under pnpm, and a greedy cover keeps enough of them that every *pair* of answer values appears at least once: 144
cases. The axes are `hostedFramework`, `browser`, `styling`, `form`, `router`, `store`, `data`, `mocking`,
`languages`, `testing`, and each library on or off as an axis of its own. `agents`, `plugins` and `surfaces` are
always their full value, and `typeSafety` is always `strict`: neither changes what is installed, and `relaxed` only
loosens rules over the same files. `languages` is none or all six, since a project without it is byte-identical to
one generated before it and must stay covered, and the full set holds both zh tags, so `zh-TW` resolves only through
an exact-tag match.

On top of the pairs, 41 more. Per target, the first case answering the most (every library, every optional answer
the target offers) runs once on each other manager, npm, Yarn 4 and bun: 30 smoke cases. A smoke is the whole case,
so it holds each manager's config files, the husky install script under the lifecycle husky documents for it
(`prepare` for npm, pnpm and bun, `postinstall` for Yarn 4), the layout Metro has to read through symlinks, npm's
`npm ls --all`, and `INSTALL_NOISE` at the same strictness as pnpm. On React, the same case runs again with
`--skip fix` and with `--no-install`, after which the harness installs and runs `check` itself. On every target a
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
| `customTypes.d.ts` against KEBAB_CASE | Angular, with `typeSafety: relaxed` (no longer run: strict only) |

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
Native's web build is not what ships. On a server-rendered target with `languages`, the pass picks a language in
the page and holds that the raw HTML of the next route already carries its `lang` and `dir`. Framework mode also
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

The jobs are not even and do not need to be: pnpm carries 154 cases, npm 11, and Yarn 4 and bun 10 each.
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
GB; the npm smoke is 11 cases, so a cold cache costs one run little.

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

`dist/`, `coverage/`, `.smoke/`, `.compat/` and `reports/` are tool output: `.smoke/` exists while a package's
`smoke` script runs, `.compat/` during the plugin's `compat`, which installs six ESLint majors into it, and
`reports/` is where `mutation` writes Stryker's HTML.

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

Measured on 2026-10-05 for `setupTests.mswJest.ts`, the Jest twin of the MSW setup: without its entry, `eslint` on
it reports 9 errors, every one `no-unsafe-call`, `no-unsafe-member-access` or `no-unsafe-assignment`, because the
`jest` global and `./msw/node` resolve to nothing here.

### `'**/utils/*.ts': '*Utils'`

`check-file` takes a raw glob as the naming pattern: the rule validates the value with `is-glob` and micromatches the
extension-stripped basename against it (`eslint-plugin-check-file@3.3.2`, `filename-naming-convention`). So
`*Utils` is a pattern, and it and the `CAMEL_CASE` entry above it both apply, which makes `layoutUtils` the only
shape satisfying the pair. Proven to fire: `src/utils/stray.ts` reports `The filename "stray.ts" does not match the
"*Utils" pattern`, and `strayUtils.ts` exits 0. `ignoreMiddleExtensions` is on, so `layoutUtils.test.ts` is judged
on `layoutUtils`.

### `resolver: { project: 'packages/*/tsconfig.json' }`

The default resolver reads a single tsconfig discovered from the working directory, which in a workspace is the
root, and each package's `@mocks/*` lives in its own tsconfig. Measured on 2026-10-02 without the override: 156
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

Measured, last on 2026-10-02: with the rule forced on, it reports five comparisons across the three files the block names. They are
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
every block's `files` and `ignores`. Its `*.test.ts` stay suites through `**/*.{test,spec}.*`. Measured on 2026-10-03,
when the harness left `src/`: the source-only blocks then reached its 15 non-test modules and found five
`no-magic-numbers` (a 200 status, the ping's 100 attempts and 200ms interval, a milliseconds divisor, the three parts
of a version) and nothing from `expression-complexity`, `max-lines` or `max-lines-per-function`.

### `@linteljs/workspace/e2e-test`

`targets.e2e.test.ts` under `packages/create/e2e/targets/` is `it.concurrent.each(cases)(label, runE2eCase)` per target,
and every assertion lives in `runE2eCase`. `vitest/expect-expect` reads the callback body for `expect` calls and
finds no body, since the helper is passed by reference. Measured: `assertFunctionNames: ['runE2eCase']` does not help,
because it matches calls inside the body and there is no call. Off for that directory alone.

### Coverage thresholds, in `vitest.config.ts`

A gate, not an aspiration. The root config is what gates: a package's own `vitest.config.ts` coverage block is
ignored once the run comes through `projects`.

One global block at 100% rather than a key per package. A glob key takes its files out of the global thresholds, so
with keys a folder nobody named stays ungated; with one global block every file in `coverage.include` is held, and a
file joins the gate the moment it is included.

The end-to-end harness sits in `packages/create/e2e/`, outside every `src/`, so the include never reaches it: it
spawns, publishes and needs the registry, and a helper there would land as a 0% file against a 100% threshold. Its
pure suites (`matrix/`, `starter-cover/`) still run in the default suite, held by their assertions rather than the
gate. Beyond each package's `src/`, the include names ten `utils/` modules of the plugin's audits (five of
real-code, one of mutation-summary, four of false-negatives), the pure half of a script that otherwise spawns,
each with its own suite. It also takes every `utils/` file under `packages/create/templates/project/`: the logic
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
