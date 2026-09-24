# Design, v2

The decisions v2 makes that `DESIGN.md` does not yet carry. This file merges into `DESIGN.md` when
v2 ships, at which point it goes away. One entry here reverses a non-goal recorded there and one
weakens a second, and each carries the measurement that earned it.

## Contents

- [What changes](#what-changes)
- [Once](#once)
- [The scaffolder, and why v2 stops running one](#the-scaffolder-and-why-v2-stops-running-one)
- [How a template is laid out](#how-a-template-is-laid-out-and-the-three-rules-that-keep-it-small)
- [Where the migration is](#where-the-migration-is)
- [What v2 deletes](#what-v2-deletes)
- [The drift gate, built and then retired](#the-drift-gate-built-and-then-retired)
- [The starter page](#the-starter-page)
- [The architecture a project is born with](#the-architecture-a-project-is-born-with)
- [The styling answer](#the-styling-answer)
- [A proposed tenth target: React Router framework mode](#a-proposed-tenth-target-react-router-framework-mode)
- [The data answer, and what `lib/apis/` is](#the-data-answer-and-what-libapis-is)
- [Still open](#still-open)

## What changes

`@linteljs/create` stops shelling out to official scaffolders and owns its own templates.

The reason is flexibility, not cost. A borrowed template is a ceiling. Every improvement to what a
project is born with had to be expressed as a patch against a file somebody else wrote, or refused
outright, and the patches were exact string matches that a generator could invalidate without
warning. That is why the architecture a project receives stalled at whatever `create-vite` felt like
writing: not because a better shape was unknown, but because there was nowhere to put it.

The measurements below say the reversal is affordable. They are not why it is worth doing. Owning the
template means a defect in the starter is a fix rather than a transform, the layout a project is born
with is a decision rather than an inheritance, and an answer that needs to reach into rendered source
has somewhere to reach.

## Once

Every decision in this file is the same decision. A thing is spelled once, in one place, and everything that needs
it points at that place rather than carrying a copy.

- **One token source.** `tokens.css` holds every value. Tailwind's `@theme inline` and StyleX's `defineVars` both
  point at those custom properties rather than restating them, so `bg-primary`, `tokens.primary` and
  `var(--primary)` are one colour and retinting is one edit.
- **One page, one file.** The starter's markup does not change with the styling answer, so About is written once
  rather than three times. What varies is what is installed and configured around it.
- **One file per axis, never per combination.** A file that would vary by two answers is split until each half
  varies by one. React's entry is one file because the router lives in `App` and the store in a provider beside
  it; the alternative was a copy per pairing.
- **One list.** The pages the header renders and the pages the router registers are the same array. The rings and
  their direction are one list that both the lint config and its own suite read.
- **One rule, one place.** `rtk-query` is legal or not by one predicate, which the prompt hides by and the parser
  refuses by. Two mechanisms would be two chances to disagree.

The repository already argued this from the other end: `DESIGN.md` opens on two ESLint configs that were 85%
identical and had silently diverged, where nothing could tell you which one was right. Every copy is a future
disagreement, and the one that loses is usually the one nobody was reading.

## The scaffolder, and why v2 stops running one

`DESIGN.md` records **"No forked framework templates. Official scaffolders are shelled out to, never
reimplemented"** as its first non-goal. This reverses it. Three measurements earned the reversal.

### What a scaffolder actually contributes

Every target was scaffolded on 2026-09-21 with the exact argv its record produces, and the output
classified against what this CLI already writes.

| target | files written | the template must own | source files | of which demo content |
| --- | --- | --- | --- | --- |
| astro | 10 | 7 | 2 | the welcome page |
| webextension | 12 | 8 | 2 | the counter page |
| svelte | 14 | 24 | 4 | `+page.svelte` |
| next | 17 | 11 | 4 | `page.tsx` |
| solid | 17 | 9 | 2 | `App.tsx` |
| react | 18 | 9 | 2 | `App.tsx` |
| angular | 22 | 17 | 5 | the hero markup |
| vue | 31 | 21 | 14 | 8: `TheWelcome`, `WelcomeItem`, five icons, `HelloWorld` |
| react-native | 51 | 46 | 18 | roughly 15: the whole tab demo |

"Files written" is the bare scaffolder. "The template must own" is what survives a full `create` run
without being an emitted artifact, so it is the real size of the authoring job, and it is under two
dozen everywhere except React Native. Svelte is higher than its scaffolder count because `sv create`
writes little and this CLI's own starter files fill the rest.

Both halves are on disk under `template-scaffolder-temporary/`, which is gitignored:
`_raw/<target>/` is the bare scaffolder output and `<target>/` is the full generated project.
Diffing the two is what says exactly what the emitters contribute, the merged files included.

Two cautions on those trees. They were generated at `DEFAULT_ANSWERS`, which is not minimal:
`--libraries tailwind,es-toolkit --agents claude-code --plugins ponytail,context7,frontend-design`.
Tailwind being on means the style entry in `<target>/` carries an `@import "tailwindcss"` this CLI
merged in, and Next's own `globals.css` differs because `nextTarget` passes `--tailwind` to the
generator. `_raw/next/` was taken with `--no-tailwind` and is the one to author from. The two halves
were also collected about an hour apart, both against `@latest`, so a generator that published in
between would leave them a version apart.

The source column overstates the work, because a v2 template is this repo's own starter rather than a
copy of somebody else's. The demo content is deleted, not maintained. What is genuinely needed from
upstream is boot wiring: `main.tsx`, `index.html`, `_layout.tsx`, `app.config.ts`, `router/index.ts`.
That is a handful of files per target and it changes rarely.

### Latest-only was already not true

`DESIGN.md`'s second non-goal, **"Latest version of each framework only"**, is not reversed. What is
reversed is the assumption underneath it, that the scaffolder supplies the latest framework for free.

`VERSIONS` in `emitters/always/package-json/constants.ts` already hand-pins 111 packages, and six of
them are framework runtimes: `react`, `react-dom`, `vue`, `svelte`, `solid-js` and `astro`. Only
`next`, `expo`, `@angular/*` and `@sveltejs/kit` still arrive from a generator's own `package.json`,
merged over by `patchPackageJson`. Latest-only already meant a table this repo maintains, for
two thirds of the targets. v2 extends that table by four entries rather than inventing a practice.

### The surgery is the cost, and it is already being paid

Nothing above is what makes the current design expensive. This is:

- `targets/react-native/constants.ts` is 259 lines: **12 starter fixes** repairing nineteen findings
  by exact string match against Expo's template text, and **14 renames**.
- Nineteen starter suites are written against modules `create-expo` owns, against a 100% coverage
  gate.
- `scripts/lintStarters.ts` is 357 lines and three synthetic TypeScript programs with stand-in
  `@types` packages, and exists for one reason. `DESIGN.md` says it outright: "Twenty-seven of the
  thirty-one suites there test a module the official scaffolder writes. Owning those means forking
  the templates, which is the first non-goal in this document."

The gate that cannot see the starter tree, and the exact-text patches against source this repo did
not write, are both the same fact: the templates are borrowed. v2 stops borrowing them.

### The thing that got us here

Routers, forms and stores are answers now, and each has to reach into rendered source. Only four of
the nine targets declare `starterFiles` at all; `next`, `vue`, `svelte`, `solid` and `angular`
declare none and ship starter *tests* over scaffolder-written source. On those five there is nowhere
for option-driven source to land except another string patch. Owning the base is what makes the
composition possible, not merely cheaper.

## How a template is laid out, and the three rules that keep it small

Proven on React and then on Solid, which is why it is written here rather than left in the records.

### One file per axis, never per combination

A file that would vary by two answers is split until each half varies by one. React's Contact demo crosses a form
library, a data layer and Zod, which is twelve combinations, and is nine files.

The joins are what do it. `useSubmitContact()` has one signature in all three api spellings, so the form hook never
learns which layer runs it. `ROUTES` is one array the header, the route table and the no-router switch all read, so
a form adding a Contact page is one file rather than three. The entry is one file because the router lives in `App`
and the store and the data layer live in providers beside it; putting any of them in the entry would have made it a
copy per pairing.

The rule has a mechanical check behind it. `starterSourceEmitter` refuses two starter files for one destination
under one answer set, and it caught three record defects within minutes of being written: an entry listed both
always and per router, and two providers listed both always and per variant. Each would have been a silent
last-one-wins race on disk.

### The worked case: TanStack Router builds its tree from the one route list

File-based routing is that library's own default, and the starter declines it. A `routes/` directory plus the
`routeTree.gen.ts` its plugin writes is a second list of the pages, and the form answer adds a page, so the
generated file would need a copy per combination of router and form. Reading the array the header already reads
keeps it a sum: one `App.tsx`, no `routes/` directory, no generated file, no build plugin, and a form adding
Contact appears in the nav and the router at once.

What it costs is the statically-known route tree, so a link is checked against `string` rather than against a union
of the project's own paths. What it buys is that the route table cannot disagree with the nav, which is the failure
this repository exists to stop, and a project that wants the generated tree adds the plugin and the directory.

It also deleted what that tree dragged behind it: the plugin and its dependency, the `src/routeTree.gen.ts` entry
in the emitted ESLint ignores, its entry in the banned-pattern checker's skip list (the generated file carries
`as any` and `@ts-nocheck` by design), and its coverage exclusion. Five emitters stopped carrying an exception for
one file.

The variant it replaced could not have worked: its route file default-imported a named export and rendered `App`,
which renders the router that contains it, and its tree registered only `/` while the header linked to three paths.
It was scaffolder output that never got rewritten, and the coverage pass above is what surfaced it.

### `shared` names a tree, not a flag

Next renders React, so a primitive, a store module and an api module are the same file there as in `react/`. The
document, the routing and which components are the client boundary are not, and those are Next's own. Rather than
keep a second copy of eleven identical files, `StarterFile.shared` widened from `true` to `true | TargetId`: `true`
is the framework-free tree, and a target id is that target's tree.

It reads as what it is at the call site, `shared: 'react'`, and it keeps the rule the section below states: a file
exists once, and whoever else needs it names where it lives. Next's own tree is fifteen files, which is the
document, the five route files, the header, the two client slots and the config.

### `starter-source/shared/` for anything with no framework in it

The tokens, the stylesheets, the page tables and the validation rules are the same bytes on every target. They sit
under `shared/` and a record marks the file `shared: true`; six files written once rather than fifty-four across
nine targets. `lintStarters.ts` skips that directory when listing targets and lints its files through whichever
target places them.

What is not shared is anything with a framework in it, which is every component: React's `class` is Solid's
`className`, React destructures props and Solid may not, and React's route element is a node where Solid's has to
be a function or the page renders before it is shown. Those are the differences porting exists to find.

### Every starter file carries a suite, and a suite varies by answer like any other file

A generated project gates at 100% on statements, branches, functions and lines, and its coverage config names
`src/**/*.{ts,tsx,…}` as an explicit include, so every file under `src/` is measured whether or not a test ever
imports it. A starter file that ships without a suite therefore fails the gate it was born with, on its first run,
before the project has written a line. Owning the templates is what made this ours to get right: under a scaffolder
the starter was somebody else's welcome screen and its suite came with it.

Four things follow, and each was a real defect found by working the arithmetic rather than by running anything:

- **`StarterTest` gained the `when` its file counterpart already had.** The App and header suites are written
  against one spelling of the header, and a router turns its tabs from buttons into links, so the suite varies with
  the file. Without `when` a router meant shipping a suite that could not pass.
- **A suite covers what it renders, so there are fewer of them than there are files.** The contact suite covers the
  page, the form binding, the api, the schema, the text input and the button at once. Only a branch nothing renders
  needs its own: a submit button, a multiline field, an error message.
- **A hook that only works inside a component is covered through one.** Svelte's store selector is an `$effect`,
  which runs only while a component is initialising, so the store is covered by the page that renders it and there
  is no module suite beside it that would read a count that never moves.
- **A file with no runtime is excluded rather than covered.** A `*.stylex.ts` token table is compiled to CSS by the
  bundler, so nothing imports it and nothing executes it; left in the include it sits at zero and every StyleX
  project fails.

One thing the pass removed rather than tested: the contact form's button said `Sending` while a submit was in
flight. That label is reachable only in the window between a click and a promise that resolves immediately, so a
test for it is a race, and a starter does not need it. The button is disabled while submitting, which is the part
that matters and is deterministic.

## Where the migration is

| target | template | note |
| --- | --- | --- |
| react | **owned** | the reference shape |
| solid | **owned** | proved the shape ports |
| vue | **owned** | SFCs, an unconditional router, a store installed as a plugin |
| svelte | **owned** | runes, `+page.svelte`, and SvelteKit's own shell |
| next | **owned** | the App Router, a server-rendered document and React's primitives taken whole |
| astro | **owned** | server-rendered pages, a layout for the document, no client entry at all |
| webextension | **owned** | the popup is the surface, built node by node, and the manifest names the rest |
| angular | **owned** | `angular.json` is emitted rather than templated, because it carries the project's name |
| react-native | **owned** | expo-router's directory is the routes, so a tab bar stands where the others draw a header |

`scaffold` being optional is what let them cross one at a time. All nine have crossed, so no record carries it and
nothing is fetched.

**The debt that was deferred to Phase 6 is paid.** Suites that named a target only because it still fetched were
pointed at angular, then the last `dlx` generator and the last one with starter fixes; `staleScaffoldFiles`
had no declarer left once svelte crossed, so the field, the pass that read it and its suite are deleted rather than
moved again.

### What the scaffolder was quietly installing

Found by the first end-to-end run after Svelte crossed, and true of every target that had crossed before it: the
generator was what installed the framework. `sv create` put `@sveltejs/kit` in the manifest, and the `prepare`
script this CLI writes runs `svelte-kit sync`, so a project with no generator had no such binary and died during
`pnpm install`. React, Solid and Vue had the same hole one stage later, at lint and build rather than at install.

The fix is `PARTS`, which already held the right list for each framework because a host has always had to install
what it renders. The four crossed records now read their `dependencies`, `devDependencies`, `testDevDependencies`
and `stateRules` off it and add only what owning the build costs: `vite` everywhere, and `@sveltejs/kit` plus
`@sveltejs/adapter-auto` for the one target that is a framework rather than a framework on Vite. Two other names
had been absent for the same reason and are now pinned: `vue-router`, because a Vue application routes and nothing
asks otherwise, and `pinia`, whose entry in `STORE_DEPENDENCIES` was empty with a comment saying `create-vue`
installed it from `--pinia`.

The lesson generalises past this release: every line of a generated `package.json` that came from somebody else is
a line nobody here wrote down, and crossing a target over is the moment it becomes this repository's to declare.

### The contact demo is part of the starter, on every target that is offered a form

`form`, `zod` and `data` are answers every target can give. Until this pass only React demonstrated them, so a Vue
project that answered `tanstack-form` installed `@tanstack/vue-form` and showed nothing, and one that answered
`zod` installed a validator nothing imported. That is the same defect as an unused dependency anywhere else, and
the answer is to port the demo rather than to narrow the question.

What the port cost, per framework, was reactivity rather than markup:

- **Solid and Svelte and Vue all read the form through one `useSelector`.** `form.state` and `getFieldValue` are
  plain reads on a TanStack Store, and only the selector is tracked, so a field built from the plain reads renders
  its first value and never moves again. Every field is a getter over that one subscription.
- **Svelte's binding is a plain `.ts` module, not a `.svelte.ts` one.** A rune for `sent` would have forced the
  extension, for a boolean the form already holds as `isSubmitSuccessful`.
- **Svelte needs a wrapper component to test with.** Its data slot is a component, where Vue installs a plugin and
  Solid nests a JSX element, so a suite that needs the slot around its subject needs a component of its own. It
  ships under `__mocks__/`, which is outside the coverage include and is where this repo's other per-target test
  helper already lives.
- **`resolve()` takes one route at a time.** SvelteKit's link resolver types its argument as a conditional on the
  route, so a union of routes matches no arm of it. The route list therefore resolves each entry where its literal
  is known, and the header reads the resolved href. That also moved the list out of `shared/`, since it now
  imports `$app/paths`.

### What `lint:starters` cannot see, measured

`scripts/lintStarters.ts` already says it runs no type-aware rules, because a program over dependencies this
workspace does not install is not a program. This pass is what that omission costs: it reported zero findings on a
Svelte tree whose first real run produced eleven errors, and every one of them was a type this workspace has no
types for.

Three defects, all invisible without a real install:

- **`safeParse` answers `{ error }`, not `{ issues }`.** The shared Zod rules read `parsed.issues`, which is a
  compile error against Zod 4 and therefore an `error` type, and five `no-unsafe-*` findings downstream of it. It
  had been written and linted clean and would have shipped on every target that answers `zod`.
- **A `.ts` file cannot import a type from a `.svelte` or a `.vue` one.** The compiler behind lint has no parser
  for a component, so `TextInputProps` resolved to `any` and every field built from it was unsafe. The props
  interface now sits in a plain module beside the component, and the component takes it from there.
- **`validateField` answers a promise.** Four bindings called it from a blur handler and dropped it.

The conclusion is not that the gate should do more. It is that `lint:starters` is a transition gate with a stated
ceiling, Phase 6 removes it by making the starter tree ordinary source, and until then no target counts as crossed
until a real project built from it passes its own gate.

### The loop that finds these is local, not the matrix

The first eight of those defects were found one per end-to-end run, at four minutes a run, because the matrix was
being used as a debugging loop. It is not one: it starts a registry, publishes three packages and installs eleven
projects to tell you about one file.

What replaced it is a single project on disk. Generate into a temp directory with `--no-install`, point the two
`@linteljs/*` dependencies at packed tarballs through `overrides`, install once, run the project's own `lint:fix`
and then its own `pnpm check`. That is ninety seconds, and it is the same gate the matrix runs, so anything the
matrix would report this reports first. The matrix goes back to being what it is for: proving the cross product on
every package manager before a release.

Run that way, the four crossed targets took another twelve defects out, and none of them was findable any other
way: a React form binding that read its state through `getFieldValue` and therefore rendered the first value
forever, a Solid `<Show>` that built its block once so the page never swapped, a Solid test that passed an element
where the framework needed a thunk and so read none of the providers around it, `@stylexjs/unplugin` never being
installed at all, React 19 deprecating the whole `FormEvent` family, `@tanstack/*-store` deprecating `useStore`,
and a banned-pattern checker that read Vue's typed `defineEmits` tuple as an index signature.

### Astro is the one with nothing to hydrate

Every other target has an entry that mounts something. Astro has a layout and a directory of pages, and a link is
a navigation rather than a state change, so there is no router answer, no page switch and no provider. What that
leaves is a template this repository writes and a build Astro owns: `astro.config.mjs` was already emitted, so the
tree is six `.astro` files, the shared tables and one helper.

The helper is the interesting part. `vitest` cannot execute a `.astro` file, so the coverage include never held
one, and the old starter carried a `formatDate` placeholder purely so the measurement was not `0/0`. It is now
`isCurrentPath`, which the header actually calls and which exists for a real reason: Astro serves `/about` and
`/about/` as the same page, and a header comparing the strings would mark neither. The tables the templates read
are excluded with that stated, and Astro's container API is the way to take them back.

Crossing it also found that `lint:starters` had never linted a template of any kind: it walked script extensions
only. Astro's parser needs nothing of a file's surroundings, so `.astro` joins the walk. `.vue` and `.svelte`
cannot: both layers set `projectService`, which resolves a file against a real `tsconfig.json`, and that walk lints
text at a path nothing on disk holds.

### The extension's popup is the surface, and it is built rather than templated

A popup is a panel a few hundred pixels wide that closes when it loses focus. It carries no nav, no routes and no
second page, so the hero is the whole of it, and the other surfaces are the extension's other entries with the
manifest naming each. That much was already the design; what crossing it settled is how the popup is written.

Node by node, with `document.createElement`, not from one string of markup. Two reasons, and the second is the real
one. An extension runs under a content security policy that has no reason to trust markup. And a reference kept is
a reference that cannot be null, where querying back out of `innerHTML` for the element you just wrote is a guard
for a case that cannot happen, which is a branch the project's own 100% gate then cannot cover. The first version
of this file did exactly that and sat at 50% branches.

The mark moved to `lib/` for a smaller reason worth recording, because it is the sort of thing only a real project
finds: with no hosted framework a file under `components/` is PascalCase and a component by directory, and with one
it is camelCase and a component by extension. A string of markup is not a component under either rule, and no name
satisfies both.

### React Native's route list goes out of coverage with the shell

`DESIGN.md` carries why React Native follows the Expo SDK's pins rather than react-native's latest, and the three
0.87 workarounds that pin deleted.

`src/config/routes.ts` is shared by five targets, and on
four of them `AppHeader` reads it and that component's suite covers it. Here the nav is the tab bar inside
`src/app/_layout.tsx`, which is already excluded because rendering the navigator reaches Expo's own TypeScript
source inside `node_modules` that no test transform strips. Excluding one without the other leaves a table nothing
executes.

### Every component sits in a directory named for it, and two targets did not

`v2-trees.html` puts one kebab-case directory per component under `components/ui/` and
`components/features/`, holding the component, its suite and its stylesheet. Eight targets shipped
that. Vue and Nuxt shipped a flat `components/ui/AppButton.vue`, and React Native shipped a flat
`components/ui/Mark.tsx`.

The flat shape is not a cosmetic difference, and what it broke is the rule two sections above. The
shared stylesheet lands at `components/features/app-header/AppHeader.css` on every target, so on Vue
and Nuxt the component sat at `components/features/AppHeader.vue` and its stylesheet sat in a
directory of its own, one level away, holding nothing else. A colocated stylesheet that is not
beside its component is just a stylesheet. All three targets now match the other seven.

**The names stay Vue's rather than the tree's, and that is the one divergence kept.** The agreed
trees say `ui/button/Button.vue` and `ui/mark/Mark.vue`. Vue's own `vue/multi-word-component-names`
is an error in this standard's layer, and `Button` and `Mark` are one word each, so those two names
cannot be written in a Vue project without turning the rule off. The rule is worth keeping: a
single-word component collides with the HTML element of the same name, which is the defect it
exists to catch. So Vue and Nuxt ship `AppButton` and `AppMark` in `ui/app-button/` and
`ui/app-mark/`, which is Vue's own documented answer to the same problem, and the directory is the
kebab of the file as everywhere else. The trees are what is out of date here, not the code.

Route files stay lowercase where a router owns the filename, which is not a divergence at all: Next
writes `about/page.tsx`, SvelteKit writes `about/+page.svelte`, Astro writes `about.astro`, and
Nuxt writes `pages/about.vue`. In each the filename is the URL, so the case is the router's to
decide and `v2-trees.html` already shows it that way.

## The api edge: one adapter, mocks, and an accessor in each framework's own word

Three things land together because they are one decision seen from three sides: where a request is made, what
answers it, and what a component calls to start it.

### `fetchExtended.ts` ships on every project

One place that speaks HTTP, whatever was answered about data or mocking. A project with neither still makes
requests, and the alternative is each of them writing its own `fetch` wrapper the first time it needs one. It
answers parsed JSON or throws `ApiError`, so a caller has two cases rather than four: no `response.ok` to forget
and no second parse to get wrong.

Its signature is shaped by the mechanical floor rather than by taste, and the floor was right every time.
`unknown`, `unknown[]` and `Record<string, unknown>` are all refused for the body, so the body is `object`. A
second type parameter for it does not work either: TypeScript takes type arguments all or nothing, so naming the
response would silently pin the body to its default at every call site, which is the defect that a generated
project found before any test did.

**`qs` rather than `URLSearchParams`, for arrays.** The platform stringifies `['a', 'b']` to `a,b` and loses the
shape. `qs` writes `tag=a&tag=b` and parses it back to an array. `repeat` of the three formats it offers, because
`qs.parse` reads that one back without being told the format: `brackets` is a Rails and PHP convention rather than
a general one, and `comma` collapses to the string this exists to avoid.

**And the name is two names.** Angular names every source file in kebab and the other nine name theirs in camel, so
no single spelling satisfies both rules. `StarterFile` gained a `source` field: the asset is `fetchExtended.ts` and
Angular receives it as `fetch-extended.ts`, which is the same bytes under each project's own convention, the way
`Mark.tsx` is `AppMark.vue` on Vue. That is not the `starterRenames` phase 6 deleted, which rewrote a generator's
output; this is a template naming its own asset.

### MSW is what makes an api layer demonstrable at all

The handlers are the reason the starter can speak HTTP. Without them a project that posts anywhere fails offline,
fails in CI, and fails on every target with no server behind it, which is why the api layer answered locally
before this. With them the api layer makes a real request and the boundary moves rather than the call site, so the
code under test is the code that ships.

`onUnhandledRequest: 'error'` in the setup file, because a request nobody wrote a handler for is a test reaching
the network, which is the failure this layer exists to make impossible rather than something to let through
quietly. The fragment is appended last, so the interceptor is listening before anything above it asks for
anything.

Two spellings of the handlers, because the contact endpoint answers a page that exists only where a form does. Two
halves otherwise: `node.ts` for the test run everywhere, and `browser.ts` only where a dev server serves a
directory the worker can live in, which is every target but React Native.

### The accessor takes each framework's own word, and Angular has no word for it

`v2-trees.html` and the records already disagreed with the idea of one name. What a target calls this is on its own
record, and the helper reads it rather than assuming:

| target | directory | entry | what comes back |
| --- | --- | --- | --- |
| react, next | `lib/hooks/` | `useExtendedQuery` | values |
| react-native | `src/hooks/` | `useExtendedQuery` | values |
| vue, nuxt | `lib/composables/` | `useExtendedQuery` | refs |
| solid | `lib/primitives/` | `createExtendedQuery` | accessors |
| svelte | `lib/hooks/` | `createExtendedQuery` | the binding's reactive object |
| angular | `lib/services/` | `injectExtendedQuery` | signals |

What comes back is not cosmetic. Unwrapping a ref in a Vue composable hands the caller a snapshot that never
updates again, and Solid tracks a read rather than a render, so returning the value would read it once outside any
tracking scope. Angular is the one with no slot at all: it has neither hooks nor composables, so this is a function
that runs in an injection context, named `inject*` and spelled in kebab like every file that target writes.

**A suite for one of these is a `.ts`, never a `.tsx`.** A camelCase `.tsx` is refused by the same naming rule that
keeps components PascalCase, so React's suites build their provider with `createElement` and Solid's with
`createComponent`. Svelte's need a component to hold the context at all, so they mount one from `__mocks__/`.

### Astro and the extension get the adapter and the mocks, and no accessor

Both are hosts rather than frameworks: whichever framework is answered for them is what renders, so their query
binding is that framework's and an accessor here would be one file per hosted framework, which is the product this
repository keeps refusing. They receive the adapter, which has no framework in it, and the handlers, which have
none either. A project that hosts React and wants the hook copies four lines out of the React target, and a
project that hosts none has nothing for a hook to bind to.

It is the same shape as the recorded gap on `form`, where astro, webextension and angular install the library
without a demo, and it is recorded here for the same reason: so the absence reads as a decision rather than a
file somebody forgot.

### RTK Query gets one file, and that is the point

There is no `useExtendedQuery` under `rtk-query` and there should not be. `createApi` generates a hook per
endpoint, so a hand-written wrapper would be a second way to do what the library already does, and
`useGetVersionQuery` says what it fetches where `useExtendedQuery('/version')` does not.

What is worth sharing is what sits underneath every endpoint, so that is what ships: `baseApi.ts`, one
`fetchBaseQuery` against the same origin the mocks answer on, one cache, one set of tags. Domain slices reach it
through `injectEndpoints` rather than calling `createApi` again, because two of those are two caches and two
reducers, and a tag invalidated in one is invisible to the other.

## What v2 deletes

- `pipeline/passes/repair/` entirely.
- Most of `pipeline/passes/rewrite/`. `stripTsExtensions`, `markTypeOnlyImports` and
  `guardMountLookups` all exist to make somebody else's source compile under this repo's tsconfig.
- `scripts/lintStarters.ts` **stays**, and this is the one thing v2 planned to delete and did not.
  The intent was that the starter tree becomes ordinary source under `pnpm check`: inside the
  tsconfig, inside the vitest include, linted by the root config. Measured at the end of phase 5,
  the tree imports 53 distinct external packages and this workspace resolves none of them:
  `@angular/*`, `expo`, `react-native`, `next`, `svelte`, `vue`, `solid-js`, `pinia`, every
  `@tanstack/*` binding, every testing library, and the `$app`, `$lib` and `@/*` specifiers three
  frameworks resolve themselves. Making the tree ordinary source means installing nine targets'
  runtime and test dependencies into a workspace of three ESLint packages, which is a heavier price
  than the script, and it buys a typecheck the synthetic programs already do. So the script is a
  permanent part of the repository rather than a transition gate, and it grew in v2 rather than
  shrinking: 357 lines to 440, and 197 starter files linted through their own target's layers.
  `repo-structure.md` already argued the same thing from the other side, that the templates cannot
  live under `src/`; this is that argument measured.
- From `TargetRecord`: `scaffold`, `starterFixes`, `starterRenames`, `typeOnlyImports`,
  `exemptsStarterTests`. With them, the `StarterFix` and `StarterRename` types.
  `staleScaffoldFiles` is already gone: svelte was its last declarer.
- `esmAssetImports` and `ASSET_REQUIRE`, `tabsToSpaces`.
- The `scaffold` stage in `pipelineRun.ts`, and `runs/pipeline/utils/scaffoldUtils.ts`.
- The end-to-end suite's dependence on eight upstream CLIs at `@latest`. It still installs, so it
  still hits the network, but a generator changing what it writes stops being able to break it.

## The drift gate, built and then retired

Owning the templates means boot wiring goes stale, and that is the one thing that genuinely gets
worse. Incidental evidence it is real: `create-vite` now writes `public/icons.svg` and
`src/assets/hero.png`, neither of which existed when the current records were written.

The gate runs each generator bare and diffs the result against the committed template's boot wiring.
It reports; it does not rewrite.

The argv belongs to the gate rather than to `TargetRecord`. While the pipeline invoked a generator the
two had to agree, which is what made the record the right home; once it never does, a copy there is
data nothing reads, and the gate's own table is the single home rather than a second one.

It is deliberately not the script that collected the reference trees. That one ran the full CLI to
capture what the emitters produce on top, which is a different question and was answered once. The
gate needs the scaffolder alone, and wants to be written against that requirement rather than adapted
from the collection pass.

### Retired on 2026-09-22, and why the reasoning below is kept

It is gone: `scripts/checkDrift.ts`, the `drift` script and the row in `CLAUDE.md`'s command table.
The decision is the user's and it follows from what v2 is. This repository owns its templates and
they follow its own principles, so a generator's output is no longer a proxy for anything it wants
to be measured against. The gate's own premise, written below, was that such output stands in for
current idiom. Once the idiom is this repository's, the proxy measures the wrong thing, and the
three hand-kept tables it needed were maintenance paid for advice that would be declined.

What is given up is narrow and worth naming. The 127-case end-to-end suite still performs a real
scaffold, install and full gate for every target, so a framework change that *breaks* a project is
still caught, and caught harder than a file-list diff would catch it. What is lost is the weaker
signal that a framework has begun *recommending* something new, which is the signal being declined
on purpose rather than by oversight.

The rest of this section is kept as the record of what was built and what it found, so that the
decision to retire it is legible as a decision rather than as a gap. Do not rebuild it without
first overturning the principle above.

### What it turned out to be

`scripts/checkDrift.ts`, run by `pnpm drift`, with `--strict` for a non-zero exit and a target name
to narrow it. Every case runs a real generator over the network, so it is not part of `pnpm check`.
Each target's generator runs bare into a temporary directory, and the file list it writes is compared
with the list `buildArtifacts` and `seedArtifacts` produce for the same target under the bare answer
set. The first full run confirmed the guess above from the other side: `public/icons.svg` and
`src/assets/hero.png` are both there, on react, solid and webextension alike.

**The declined table is the gate, not an exemption on it.** A first run reported 90 paths across nine
targets, and almost all of them are a welcome screen: Vue's five icon components, Expo's twenty four
images, every generator's own logo. None of that is drift, because replacing it is what v2 is. A gate
that reports all 90 every time reports nothing, so each of those paths carries an entry with the
reason it was declined, and what the gate now surfaces is what is new. That is the whole mechanism:
the list is a record of what somebody read once, and the report is what nobody has read yet.

The three kinds of entry are worth naming, since they are what a future reader has to sort a finding
into. A file this CLI emits itself, where the generator's copy is irrelevant. An image or a welcome
screen, where absence is the point. An editor or deployment file, which is a project's own business.
A path that fits none of the three is the finding the gate exists for.

It executes the pnpm that invoked it, by absolute path out of `npm_execpath`, rather than one off
`PATH`. That is what `sonarjs/no-os-command-from-path` asks for, and it is also the pnpm that runs
the rest of the repository. Corepack's entry is a native binary, so it is executed rather than handed
to node, which is the one thing that is not obvious about it.

## The starter page

Nine frameworks render one design. Two constraints shaped it: the extension popup is 360px wide, and
React Native has no HTML. So a single column, no grid, and nothing that does not map to `View`,
`Text` and `Pressable`.

### The HTML is the contract

The markup is the spec. React Hook Form and TanStack Form emit identical DOM; so do Zustand, Redux
Toolkit, TanStack Store, Pinia, NgRx and Nano Stores. One starter suite covers every implementation
because it asserts by role and accessible name:

```ts
await user.click(screen.getByRole('button', { name: 'Add one' }));
expect(screen.getByText('4')).toBeInTheDocument();
```

What is fixed is structure and accessible names, not class attributes. That is what lets the same
suite survive all three styling systems below.

There is one honest exception, and it is in the nav only. An element that navigates is an `<a>`; an
element that swaps view state is a `<button>`. The no-router build renders buttons. Faking it with an
anchor and `preventDefault` would break middle-click and open-in-new-tab, and would lie about the
address bar.

### The mark

A heavy beam with three shorter lines beneath it. The beam never moves; the lines drift out of
alignment and snap back to it on a five second loop, top to bottom. The timing is deliberately
asymmetric, 1.3s to drift apart and 0.4s to snap back with a slight overshoot, because slow decay
reads as drift and fast correction reads as the fix. Even timing read as a jitter.

It is a picture of what the tool does rather than of what the word means. Four earlier marks drew the
etymology, two posts and a beam, in thin strokes: they had no silhouette and dissolved at header
size. The mark is static at 20px in the header, because a small animating logo in the chrome is a
distraction rather than a brand.

Pure CSS and SVG, so eight targets receive it as markup plus a stylesheet rather than as nine
animation implementations. React Native ships it static, since animating it there would cost
`react-native-svg` and Reanimated for a splash screen.

#### The hero carries it, the header does not

The mark is linteljs's, and it appears only in content a project deletes. The header carries the
project name and the nav, and no mark at all.

The line is between content and chrome. A hero is the welcome screen, thrown away the day real work
starts, and a tool signing its own welcome screen is what every scaffolder does: Vite and
create-react-app both put their logo there, and neither has any persistent chrome to put one in. A
header is different. It survives the starter, it ships to the project's users, and putting another
company's mark in it means a project advertises linteljs to its own customers without ever choosing
to. Nothing about generating a project earns that.

So `ui/mark/Mark` renders at one size, on Home, and leaves with the page. The earlier two-size design
is gone with the header instance.

A neutral placeholder mark was the other candidate and is refused. There is no such thing as a
placeholder logo with a design; it would be a circle or a lettermark standing in for a decision the
project has not made, and an empty slot says the same thing more honestly. A project puts its logo in
the header when it has one, wherever it wants it.

### The layout and the routes

A header carrying the mark and the project name on the left and the routes on the right, and a hero
centred in what the header leaves. The project name is the `name` answer, interpolated at emit time;
the emitters already receive it. It is truncated in the header and wraps balanced in the hero,
because an npm name runs long and it appears in both places.

| route | holds |
| --- | --- |
| Home | the mark, the name, the lede, one live control, one hint |
| Contact | the form, when a form library is selected |
| About | the gate, where the standard lives, what `sync` does |
| Version | the stack, and the answers the project was generated from |

The header is present either way. With a router the tabs are links and the address bar follows;
without one they swap the rendered page from local state and the URL never moves. Same design, same
pages, and a project that adds a router later rewires the nav without touching a page.

The hero carries exactly one live control, which is the store demo when a store is selected. It
carries a caption naming the library the answer actually installed, because a button reading "Add
one" beside a bare numeral explains nothing. The form is a page rather than a hero control: two
fields do not fit the hero without turning it back into a card stack, which an earlier pass was and
which read as a dashboard rather than a welcome screen.

## The architecture a project is born with

The published `repo-structure.<target>.md` already describes the layout: `components/ui/` for
primitives, `components/features/` for reusable domain features, `lib/` split into `utils`,
`services`, `apis`, `hooks`, `providers` and `store`. What a generated project actually received was
an empty version of it, because the scaffolder wrote `App.tsx` and there was no way to seed a shape
into somebody else's template. The rule described a layout the starter did not demonstrate.

v2 seeds it populated. The evidence that the shape holds is `ai-manager`, which is itself a linteljs
project (`schemaVersion: 1`, astro hosting react, tailwind, strict) whose architecture was curated
against real work rather than proposed. It carries thirty-two primitives under `components/ui/` and
fourteen features under `components/features/`, and it did not drift from the published standard: it
filled it in.

Its conventions are what the templates adopt.

```
components/
  ui/
    index.ts                    one barrel, `export * from './button/Button'`
    button/
      Button.tsx
      Button.test.tsx
    segmented-control/
      SegmentedControl.tsx
      SegmentedControl.test.tsx
      SegmentedControl.css      colocated, imported by the style entry
  features/
    app-header/
      AppHeader.tsx
      AppHeader.test.tsx
      AppHeader.css
      index.ts                  a feature carries its own barrel
```

A kebab-case directory holding a PascalCase entry named for it, its suite beside it, and its
stylesheet colocated. That is the same subject-directory rule this workspace holds itself to, one
ring out, so the standard a project receives and the standard this repo runs on are one idea rather
than two.

The entry's own spelling is the target's, not a rule laid over it, and the records already say so.
`componentNaming()` and `sfcNaming()` give React, Solid, Vue and Svelte the PascalCase entry above.
Angular does not take it: `angularTarget.ts` is `'src/**/*.ts': 'KEBAB_CASE'`, which is `ng generate`'s
own spelling and the 2025 style guide, so the same component is `components/ui/button/button.ts` with
`button.html` and `button.css` beside it. What is constant is the directory and what sits in it, not
the case of the filename.

Pages take the framework's spelling for the same reason. `sfcNaming('svelte', 'routes')` exempts the
route directory precisely so SvelteKit's own names pass, so the four pages there are
`src/routes/+page.svelte` and `src/routes/about/+page.svelte` rather than `HomePage.svelte`.

### The colocated stylesheet is imported globally, never from a `<style>` block

Angular scopes component CSS through `ViewEncapsulation`, Svelte scopes a `<style>` inside a
`.svelte` file, and Vue has `<style scoped>`. On those three a class the shared starter stylesheet
defines does not reach a component that declares its own styles locally, and none of the published
`repo-structure.*.md` files say anything about it: `scoped`, `:global` and `encapsulation` appear in
none of them.

So the file is colocated and the import is not. `Button.css` sits beside `Button.svelte` and the
style entry imports it; nothing goes in a `<style>` block. Colocation survives, the class reaches the
element, and the rule reads identically on all nine targets rather than being three rules. It is also
what `ai-manager` already does, where every `components/**/*.css` is imported from `global.css`; that
worked there without being a decision because Astro and React do not scope, and here it has to be one.

The starter page is what populates it. Its button, its text input and its header are not throwaway
markup inside `App.tsx`; they are the first entries in `components/ui/` and `components/features/`,
so the layout is demonstrated rather than described and the first component a project author writes
has a sibling to copy. That is only possible because the template is ours: there is no way to seed a
`components/ui/` into a file `create-vite` owns.

### Version renders what was recorded, and says so

The page is emitted literals, under a line naming what they are as of. Not a runtime read, not a
build-time import, on any of the nine.

Two facts decide it. The first is that **`package.json` holds ranges, not resolved versions**, so a
build-time import of it answers `^19.3.0`, which is exactly what a literal already carries. It would
cost `resolveJsonModule` in the tsconfig emitter and two per-target exceptions, since React Native and
Angular do not do it the same way, and buy nothing. The second is that **two of the rows cannot be
read at runtime at all**: a browser does not know its machine's Node or package manager. Those are
already recorded, `nodeVersion` and `packageManagerVersion` in `linteljs.config.json`, because this
CLI reads them off the machine that ran it.

So the page was never going to be fully live, and the half that could be adds a tsconfig flag to
restate a range. Literals under an honest label are the whole of it, and `sync` refreshes them the
same way it refreshes everything else it owns.

The rejected third option was resolved versions through each framework's own export, `version` from
`react` and `vue`, `VERSION` from Angular. Those are accurate, and they are a different import on
every target for one line of a starter page nobody keeps.

### A routed unit is a page, router or no router

The pages live where the target's `routeUnit` says, and that is true whether a router was selected or
not. On React and Solid that is `src/pages/<kebab>/{Name}Page.tsx`; on a file-routed target it is the
framework's own directory, `src/app/about/page.tsx` on Next and `src/routes/about/+page.svelte` on
SvelteKit. Four pages, always: Home, About, Version, and Contact when a form library is selected.

What the router answer changes is how you get between them and nothing else:

| | router | no router |
| --- | --- | --- |
| page files | `src/pages/<kebab>/{Name}Page.tsx` | identical |
| navigation | `<a href>`, the address bar follows | a click handler over local state |
| route table | `src/routes/` | absent |
| the diff | `AppHeader` and `src/routes/` | |

So the no-router build is not a smaller shape, it is the same shape with a different mechanism. A
project that adds a router later writes a route table and changes one component; no page moves, no
import is repointed, and nothing is renamed. The alternative, collapsing an unrouted project into a
single `App.tsx`, makes adding a router a restructure, and it teaches a layout the standard then has
to unteach.

The question only genuinely arises on React and Solid. Next, SvelteKit, Astro and Expo route by file,
so the router is the framework and there is no second case; Vue's scaffolder installs its router
unconditionally; the extension has surfaces rather than routes.

### Only what the starter page uses

Four components, and the list is derived from the locked pages rather than chosen as a starter kit.
A project that deletes the starter deletes all four and is left with the directories, which is the
correct outcome: the layout is the standard, the components are a demonstration of it.

| component | where | why it is a component |
| --- | --- | --- |
| `ui/button/Button` | Home, Contact | two call sites, and it carries the disabled and submit states the form needs |
| `ui/text-input/TextInput` | Contact | label, error slot and the `aria-invalid` and `aria-describedby` wiring, which is the part worth writing once |
| `ui/mark/Mark` | header at 20px, hero at 150px | one SVG at two sizes with the animation on only the larger, so the size is a prop rather than two copies |
| `features/app-header/AppHeader` | every page | the brand, the name and the nav, and the one place the router and no-router spellings differ |

`TextInput` takes a `multiline` prop rather than a second `TextArea` existing. Contact needs both an
input and a textarea, and what is worth sharing is the label and error scaffolding around them, not
the control itself.

Two more were considered and are markup instead. The section label on About and Version is a class in
the shared stylesheet, not an `Eyebrow`; so is the key-and-value row those two pages repeat. Both are
a single flexbox line with no props and no behaviour, and `ai-manager` having an `Eyebrow` is not a
reason for a starter to ship one: that component exists there because thirty screens were drifting on
tracking, which is a problem a project earns rather than inherits.

One deliberate divergence from `ai-manager`. Its `TextInput` labels with `aria-label` and renders no
visible `<label>`, which suits a dense tool pane. The starter's form is a form, so the label is
visible and bound with `for`, and the error is wired with `aria-describedby`.

It also seeds the UI kit. The primitives the starter needs are the primitives the kit starts from,
which is why the token vocabulary below is `ai-manager`'s rather than something invented for this.

## The styling answer

```
styling: 'tailwind' | 'stylex' | 'none'
```

`tailwind` comes out of `libraries`, which makes the full library set legal again. This is the
defect the form answer had before 1.7.0 and `DESIGN.md` already records the shape of the fix: a
single-select hiding inside a multi-select, which every consumer had to know about. Migration is the
same silent lift, `libraries: ['tailwind']` becoming `styling: 'tailwind'`, and `migrationUtils.ts`
has the pattern written once already.

The scaffolder reversal pays for part of this: `nextTarget`'s `--tailwind` flag disappears with the
`scaffold` field, so that coupling dies rather than needing a third branch.

### Which targets offer which, and why

`styling` is not a flat three everywhere. It takes the same per-value `only` gate the store answer
uses, so a target offers what it can actually run.

| target | tailwind | stylex | measured |
| --- | --- | --- | --- |
| react, next, solid | yes | yes | the JSX spread `stylex.props()` is written for |
| vue | yes | yes | compiled SFC, extra bundler configuration |
| svelte | yes | yes | `stylex.attrs()`, and SvelteKit is in StyleX's own setup docs |
| astro, webextension | yes | yes | through whichever framework hosts, or none |
| angular | yes | **no** | no official path |
| react-native | yes | **no** | reaches native only through `react-strict-dom` |

Two refusals, each for its own reason.

**Angular.** StyleX documents Babel, PostCSS, webpack, Vite, Rspack, esbuild, Bun, Next.js, React
Router and SvelteKit, and not Angular. Meta does not use Angular and has said it is unlikely to
maintain an example for it. An integration is reachable by adapting the webpack instructions, but
there is no documented way to apply the API from an Angular template, which is HTML rather than
JavaScript and so has no spread site. Offering an answer whose setup this repo would have to invent
and then own is not the same as offering one upstream supports.

**React Native.** It reaches native only through `react-strict-dom`, which its own maintainers
describe as not production ready. Tailwind reaches native through NativeWind 5, which is real, and
`DESIGN.md` already refused NativeWind 4 for pinning React Native to an older Tailwind. The same
reasoning applies harder to an experimental bridge.

Svelte was nearly refused alongside them on the assumption that a compiled component has no spread
site. It does: `stylex.attrs()` answers a class and a style string rather than a props object, for
exactly this case, and a SvelteKit demo exists from a StyleX maintainer. The API differing per target
costs nothing here, because what the contract fixes is the rendered DOM and both spellings produce
the same `class` and `style`.

### Two token sources, not three

The starter page renders in the selected system, including `none`. That is three spellings of one
design, and they are not equally expensive.

| styling | what ships beyond the tokens and the starter stylesheet |
| --- | --- |
| none | nothing |
| tailwind | `tailwindcss`, its Vite plugin, `@import "tailwindcss"`, and `theme.css` |
| stylex | `@stylexjs/stylex`, `@stylexjs/unplugin`, and `tokens.stylex.ts` |

**The markup does not change.** Every page is `className="hero"` whatever was answered, so `starter.css`
ships in all three cases and every page is one file. What the styling answer decides is what is
installed and wired, not how the starter is written.

The three token spellings all point at `tokens.css`: `@theme inline` maps Tailwind's colour names onto
those custom properties, and `defineVars` takes `var(--primary)` as its value rather than the colour.
One source, three names for it.

The cost is real and is the reason this was a decision rather than an obvious call: **the starter shows
neither idiom.** A project that chose Tailwind opens `HomePage.tsx` and finds semantic classes rather
than utilities to copy. What it gets instead is a working, themed system from its first line of its own
code, and one file per page rather than three. Per-system markup was the alternative: nine files times
three spellings on React alone, roughly a hundred and sixty across the targets, each page maintained
three times. That is the drift this repository exists to stop, bought back a phase after reversing a
non-goal to escape it.

`styleEntryEmitter` is gated on `hasLibrary(answers, 'tailwind')` today and returns `[]` otherwise.
In v2 it writes for all three and becomes the styling emitter, which the answer rename implies
anyway. The style entry each target already declares is where `tokens.css` and `starter.css` are
imported.

### The token vocabulary comes from ai-manager

The names, the radius scale keyed by what a thing is rather than by size, the `--motion-fast` and
`--motion-ease` pair, and theming by a `.dark` class rather than a media query are all lifted from
`ai-manager/src/styles/tokens.css`. The UI kit is coming out of that project, for web and React
Native both, so the starter speaks its language rather than inventing a second vocabulary that would
have to be reconciled later. The values are this repo's own warm palette.

One note for the kit rather than for v2: several things in the web spelling do not cross to React
Native. Custom properties, `color-mix()`, `outline` for focus rings, `:hover`, `text-wrap: balance`.
That argues for the token layer being TypeScript that emits both, rather than CSS that a native
target cannot read. `ai-manager` already half-says this, holding its motion values in `constants.ts`
and mirroring them in `tokens.css`, which is one fact written twice.

## The data answer, and what `lib/apis/` is

```
data: 'tanstack-query' | 'rtk-query' | 'none'
```

`tanstack-query` leaves `libraries`, which is the third instance of one pattern. The form library left
in 1.7.0 because two libraries binding the same inputs are exclusive; `tailwind` leaves in v2 because
Tailwind and StyleX are the same job; TanStack Query and RTK Query are the same job. What remains in
`libraries` is `zod`, `es-toolkit`, `ts-pattern` and `t3-env`, which gives that answer a definition it
did not have: **a library is a thing that is only a dependency.** Anything that changes what is
emitted is its own field.

A single select is what makes the collision impossible. Two cache layers, two providers and two
idioms in one project is not a combination worth validating against; it is one the shape of the
answer should refuse.

- **`rtk-query` requires `store: redux-toolkit`**, because it ships inside `@reduxjs/toolkit` and
  needs that store's reducer and middleware. It is not a separate dependency.
- **`tanstack-query` is offered with every store**, Redux included. Redux for client state and
  TanStack Query for server state is a real architecture, not a mistake to prevent.
- **Either works with either form.** The form library binds the inputs and the data layer owns the
  submit's pending and error state. They do not meet.

### The cross-answer constraint is new machinery

`rtk-query` with any store but `redux-toolkit` has to be refused, and nothing here can do that today.
`askedWhen` is documented "Prompt only" on `types.ts:25`: it skips the question and does not reject
the value, so a hand written config would parse clean. The form exclusion was solved structurally, by
making it a field a second value cannot fit in, and that does not reach across two fields.
`parseLinteljsConfig` gains a validation pass over the whole answer set, which is the first rule it
carries that is not about one field at a time.

### One demo, composed rather than three

Zod, the form and the data layer compose into a single interaction instead of each needing its own:

```
src/lib/apis/contact/
  schemas.ts     the zod schema, or plain predicates without zod
  api.ts         validates and resolves 200
  index.ts
```

The api is local and touches no network. It parses and resolves, which is what makes it work offline,
in CI, in a 360px popup and on React Native, where five of the ten targets have no server to call.

| answer | where the submit's state comes from |
| --- | --- |
| form alone | local state |
| form and `tanstack-query` | `useMutation` |
| form and `rtk-query` | a generated `useSubmitContactMutation` |

The rendered DOM is identical in all three, so one suite covers them.

### RTK Query keeps its own shape

`api.ts` is not one file with three spellings. Under `none` and `tanstack-query` it exports typed
async functions. Under `rtk-query` it is a `createApi` slice, because forcing RTK Query through a
plain function wrapper fights the library and throws away the cache, the invalidation and the
generated hooks that are the reason to pick it.

```ts
export const contactApi = createApi({
  reducerPath: 'contactApi',
  baseQuery: fakeBaseQuery(),
  endpoints: (build) => ({
    submitContact: build.mutation<ContactResult, ContactValues>({
      queryFn: (values) => { /* parse, then data or error */ },
    }),
  }),
});
```

`fakeBaseQuery()` is RTK Query's own answer to having no HTTP, so this is idiomatic rather than a
workaround, and `queryFn` is the documented place for logic that is not a request. It does mean
`lib/store/` and `lib/apis/` are coupled under this answer: the store must register
`[contactApi.reducerPath]` and concat its middleware. That coupling is RTK Query's design, and a
starter that hides it teaches the wrong thing.

### Where `data` demonstrates itself without a form

The Version page. It already renders a list of values, and with `data` selected it renders the
identical DOM through a query over `lib/apis/version/api.ts`, which returns the same recorded
literals. The page does not change shape, only where its data comes from, and it gains a loading
state.

That keeps "Version renders what was recorded" intact, since the literals move into the api module
rather than becoming live. Refusing `data` unless a form was selected was the alternative and is
wrong: applications fetch without forms.

## A proposed tenth target: React Router framework mode

Proposed, not committed. Recorded here so the measurement exists when it is decided.

`DESIGN.md` refuses framework mode today, in the router bullet: React Router is emitted declaratively
"because framework mode replaces Vite's entry and build, which is a different project." v2 does not
weaken that. It sharpens it, because the reason changes. Under v1 the objection was that this CLI
could not patch its way to that shape. Under v2 it could write every file, and the objection that
remains is the better one: framework mode is a peer of Next, not a value of `router`.

Measured 2026-09-21 with `pnpm create react-router@latest`, which answers 8.4.0 and framework mode
with `ssr: true`.

| | the react target | React Router framework mode |
| --- | --- | --- |
| source root | `src/` | `app/` |
| entry | `src/main.tsx` and `index.html` | `app/root.tsx`, and no `index.html` |
| the document | `index.html` | `root.tsx` exports `Layout()`, which is the `<html>` |
| routes | a table this CLI writes | `app/routes.ts`, typed config, plus `app/routes/*.tsx` |
| alias | `@/*` to `./src/*` | `~/*` to `./app/*` |
| build | `vite build` | `react-router build`, a server bundle and a client one |
| typecheck | `tsc --noEmit` | `react-router typegen && tsc` |
| its own config | none | `react-router.config.ts` |
| generated types | none | `.react-router/types/**`, imported as `./+types/root` |
| also written | | `Dockerfile`, `.dockerignore`, `.agents/skills/react-router/` |

Every one of those is a record field or a glob this CLI already owns, which is why it is a target
rather than a special case. `SOURCE_ROOT` in `pipeline/utils/sourceUtils.ts`, every `naming` and
`folderNaming` glob, and the coverage excludes all say `src/`. `html: true` drives the html layer over
an `index.html` that does not exist here. `typecheck` becomes a command with a prerequisite, which no
record has needed before. `.react-router/` needs the treatment `routeTree.gen.ts` already gets from
ESLint, coverage and the banned-pattern checker. And `ssr: true` means the gate's `build` leg is
checking a server, which is a different claim than it makes anywhere else.

### Where the option lives

In `target`, as `react-router`, with its record at `targets/react-router/reactRouterTarget.ts` like
every other. Not in `router`, and not as a `mode` slot on the react target: a thing that moves the
source root and replaces the build tool is not a routing choice, and calling it one is how a target
ends up with a branch in every glob it owns.

The id is the same string as the existing `router: 'react-router'`, and that is safe rather than
ambiguous, because the two are never asked together. The framework owns routing, so the tenth target
carries no `routers` slot and `router` is never put to it. A config reads `{"target": "react-router"}`
or `{"target": "react", "router": "react-router"}`, and those are two different projects that cannot
be confused for each other. The prompt carries the distinction where a person sees it, in the labels:
"React Router" with "Full stack React, server rendered" against "React Router" with "Declarative
routing in a single page app".

Renaming one of the two was the alternative. It costs a migration for a collision that cannot occur,
and the honest name for the framework is the framework's name.

### What this does not change

`router: 'react-router'` stays declarative on the react target, and v2 makes it cheaper rather than
harder: this CLI writes `src/routes/router.tsx` itself now, so there is no generator to fight and
nothing to patch.

The same question exists one library over. TanStack Router has TanStack Start, which is the identical
framework-mode shape and would be the same kind of target if it were ever wanted.

### Nuxt is the same question in Vue, and the residue answers it: a target

Measured rather than argued. `pnpm create nuxt@latest --template v4` writes eight files. Three of
them contradict Vue's record outright, and the one that looks like it does turns out not to.

- **The source root is `app/` out of the box, and it does not have to be.** `srcDir` is a documented
  string option whose Nuxt 4 default is `"app"`, so this target sets `srcDir: 'src/'` and keeps the
  layout every other one uses. Proven rather than assumed: with the tree moved and that one line set,
  Nuxt's own generated `.nuxt/tsconfig.app.json` resolves `../src/*` and `../src/**/*`, and
  `nuxt build` completes. So the source root is not a reason for anything, and `SOURCE_ROOT` stays
  what it is.
- **`tsconfig.json` is `files: []` and four project references into `.nuxt/`.** Solution style, which
  no other target uses and which `tsconfigEmitter` does not write. `tsc --noEmit` against it
  typechecks nothing, so `typecheck` cannot be Vue's `vue-tsc --noEmit` either.
- **There is no vite config.** Nuxt owns Vite internally, so `vite: true` and the whole
  `vitePlugin` slot have nothing to attach to.
- **`postinstall: nuxt prepare`** generates `.nuxt/` before anything can typecheck, which is the same
  shape as SvelteKit's `svelte-kit sync` and the reason that field exists.

On top of that, auto-imports change the lint surface rather than the layout: `defineNuxtConfig`,
`NuxtRouteAnnouncer` and `NuxtWelcome` are all global in the scaffolded file, with no import
statement anywhere, which is a question `import-x/no-unresolved` and the naming rule both have to be
told about.

So a mode on `vue` would make `html`, `vite`, `build`, `typecheck`, `routeUnit`, `tsconfig` and
`extraScripts` all functions of the mode, which is a record with a branch in every field rather than
a mode. Next earned its own target for three of these reasons. It is a target.

This is the opposite conclusion to React Router framework mode, and the two are worth reading
together, because the reason is not how many fields change. Framework mode changes just as many: its
build is `react-router build`, its typecheck is `react-router typegen && tsc`, its tsconfig needs
`rootDirs` and a `.react-router/types` include, and its vite plugin is `reactRouter()` rather than
the React one.

**Neither of them moves the source root, and the phase plan was wrong to pair them for that reason.**
Both default to `app/` and both document one option to move it: `srcDir` on Nuxt, `appDirectory` on
React Router, whose own documentation uses `"src"` as the worked example. Both are set, so every glob
in this repository keeps reading `src/` and nothing downstream learns a second answer. The plan had
these two landing together because both were thought to move it; they land together because they were
the last two, which is a weaker reason and the true one. `SOURCE_ROOT` itself is gone: it was read by
the rewrite and repair passes alone, and phase 6 deleted both.

What separates them is whether there is an axis to hang the thing off. React already asks a `router`
question, and framework mode is a third answer to it, so it has a place to live and `reactTarget`
becomes a function of answers the way `astroTarget` and `webextensionTarget` already are. Vue asks no
router question and no mode question, so a Nuxt mode means inventing an answer whose two values share
almost no fields, and an answer like that is a target with extra steps.

## Still open

Neither of these gates the first template. Both are one line to change afterwards, and they are here
so they are not mistaken for decisions nobody made.

- **Whether a generated project takes Geist.** `ai-manager` ships `@fontsource-variable/geist`. The
  mockups name it with a system fallback, so the template is correct either way and adding it later
  is additive. Two packages in every project is the cost.
- **One measure across pages, or two.** Form fields want a narrower column than a row list does. It
  is a single value in the shared stylesheet.
