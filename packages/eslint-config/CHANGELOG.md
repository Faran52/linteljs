# Changelog

All three packages share one version and release together. An entry here describes this package;
when a version's change lives in a sibling it is described there instead:

- [`@linteljs/create`](../create/CHANGELOG.md)
- [`@linteljs/eslint-plugin`](../eslint-plugin/CHANGELOG.md)

## 2.0.0

### Breaking

- **`defineConfig` is now `composeConfig`, at `@linteljs/eslint-config/compose-config`.** The `./define-config`
  subpath is gone, `DefineConfigOptions` is `ComposeConfigOptions`, and there is no default export. Change the
  import to `import { composeConfig } from '@linteljs/eslint-config/compose-config'`; the options are the same.
- **`typescript` `>=5 <6.1.0` is a required peer.** The ceiling is the bundled `typescript-eslint`'s, so a fresh
  install no longer resolves a TypeScript 7 that every typed layer would refuse.
- **`react()` takes its accessibility rules from `eslint-plugin-jsx-a11y-x`**, a maintained fork, in place of
  `eslint-plugin-jsx-a11y`. Install the new peer and rename `jsx-a11y/*` overrides to `jsx-a11y-x/*`.
- **`base` carries no framework rule.** `@stylistic`'s fourteen JSX layout rules move to `react()`,
  `react-native()`, `next()`, `solid()` and the `.astro` template. There, `jsx-max-props-per-line` allows two
  props on a one-line tag. sonarjs's React rules (`jsx-no-leaked-render`, `no-hook-setter-in-body`,
  `no-useless-react-setstate`, `no-uniq-key`, `prefer-read-only-props`, `no-debounce-throttle-in-render`) move to
  the React frameworks, its Vue rules (`no-vue-class-component`, `no-vue-mixins`,
  `no-mutate-reactive-state-in-updated-hook`) to `vue()` and `nuxt()`, and `no-angular-bypass-sanitization` to
  `angular()`. An override of one of them in a `base`-only config now names a rule that is off.
- **`newline-destructuring` is `@linteljs/member-newline`.** Rename any override of it.
- **`base` lays out lists at three or more.** `@linteljs/member-newline` owns object literals, object patterns,
  interfaces and type literals, and `@linteljs/array-newline` arrays: three or more items go one per line, two or
  fewer stay as written unless half split. `@stylistic/object-property-newline`, which split at two, is off, and
  `@stylistic/object-curly-newline` keeps only `consistent`.
- **`base` caps size**, in lines of code with blank lines and comments free: `max-lines-per-function` at 350, and
  `max-lines` at 500, 350 for a `.tsx`, `.jsx`, `.vue` or `.svelte` file and 800 under a `utils/` directory. Tests,
  `__mocks__/` and `e2e/` are exempt.
- **`base` reports more.**
  - The plugin's `recommended` adds `@linteljs/chain-call-newline`, `no-duplicate-interface`, `no-eslint-disable`
    and `no-inline-object-types`, and reaches `.vue` and `.svelte` files as well as scripts.
  - `prefer-destructuring` in a declaration: `const width = box.width` is fixed to `const { width } = box`. Arrays,
    assignments and renamed properties are left alone.
  - Six `import-x` rules: `no-self-import`, `no-useless-path-segments` (fixed; an explicit `/index` stays),
    `no-absolute-path` (fixed), `no-mutable-exports`, `no-commonjs` and `no-amd`. `require` stays with
    `@typescript-eslint/no-require-imports`, which keeps its asset allowance.
  - `@stylistic/padding-line-between-statements`: a blank line before and after every function, block-like
    statement and multi-line expression statement.
  - `@stylistic/function-call-argument-newline` (`consistent`) and `function-paren-newline`
    (`multiline-arguments`): `fn(a,\n  b)` goes to one argument per line, with the parens on their own lines.
  - `@stylistic/semi-style` (`last`), `no-extra-semi`, `switch-colon-spacing`, `function-call-spacing` (`never`)
    and `linebreak-style` (`unix`), and core `no-debugger` and `object-shorthand` (`always`, with `avoidQuotes`).
  - `es-toolkit/compat` is a restricted import.
- **`typescript()` reports more.** `@typescript-eslint/prefer-destructuring` replaces the core rule on TypeScript
  files, with the same options. `@typescript-eslint/parameter-properties` (`prefer: 'class-property'`) reports
  `constructor(private readonly value: number)`; declare the property in the class body. It has no fix.
- **The React frameworks report more.** `react()`, `react-native()` and `next()` add `@eslint-react`'s
  `no-class-component`, `no-misused-capture-owner-stack`, `no-unstable-context-value`, `no-unstable-default-props`
  and `jsx-no-useless-fragment`, `react-hooks/void-use-memo`, `@stylistic/jsx-self-closing-comp` and
  `jsx-pascal-case`, and `@linteljs/react-no-global-namespace`. `jsx-no-children-prop` and `use-state` go from
  warning to error. `react()` and `next()` also report, at error, a `<button>` with no `type`, an `<iframe>` with no
  `sandbox`, a `target="_blank"` link to another origin with no `rel="noreferrer noopener"`, and a `javascript:`
  URL. `react-native()` does not add these four.
- **`solid()` reports more:** `sonarjs/jsx-no-leaked-render`, so a number rendered through `&&`, which shows a `0`,
  is reported. It needs type information, so it runs beside `typescript()`. `@stylistic/jsx-self-closing-comp` and
  `jsx-pascal-case` are on too.
- **`base` bans magic numbers in source files.** `@typescript-eslint/no-magic-numbers` runs on every script and
  SFC file except suites, `__mocks__/`, `e2e/`, `*.config.*` and `constants.ts`. `-1`, `0`, `1` and `2` pass, as
  do array indexes, default values, class field initial values, object property values, enum members, numeric
  literal types, readonly class properties and type indexes. Anything else wants a named `const`. Core
  `no-magic-numbers` is off, so the two never double-report.
- **`base` caps the operators in one expression.** `sonarjs/expression-complexity` runs at error, at its default `max` of 3, on
  every script and SFC file except suites, `__mocks__/` and `e2e/`. A condition joining four or more `&&`, `||`
  and `?:` wants its parts named in `const`s or a small predicate first.
- **`base` asks for values to be named before use.** `@linteljs/name-before-use` runs on every script and SFC
  file, suites included, with `ignoreEmptyLiterals` and `ignoreLiteralArguments` on. An `await`, a call that takes
  a call, or an inline array or object in a condition, an argument, `expect`, a `return` or an arrow's body wants
  a named `const` first; `[]`, `{}` and a literal passed straight to a call pass. It reports and never fixes.

### Added

- New layers, each on its own subpath, on the barrel, and in `composeConfig`:
  - `reactNative()` at `./react-native` (`framework: 'react-native'`): the hooks and component rules React has,
    without the DOM accessibility ones, plus the five `@linteljs/native-*` rules.
  - `nuxt()` at `./nuxt` (`framework: 'nuxt'`).
  - `tanstackRouter()` at `./tanstack-router` (`libraries: ['tanstack-router']`), over the optional peer
    `@tanstack/eslint-plugin-router`.
  - `stylex()` at `./stylex` (`libraries: ['stylex']`), over the optional peer `@stylexjs/eslint-plugin`. It
    validates styles in scripts, `.vue`, `.svelte` and `.astro` files, bans the shorthands StyleX compiles to no
    CSS (`background`, `border` and its side and logical forms, `animation`), and reports unused styles, legacy
    pseudo-class keys, `className` or `style` beside a `stylex.props` spread, and tokens outside a `.stylex.ts`
    file.
  - `jest()` at `./jest` (`jest: true`), over the optional peer `eslint-plugin-jest` `>=29`: its
    `flat/recommended` rules on test files, the counterpart of `vitest` for a project on Jest, such as React
    Native on `jest-expo`.
- `nuxtGroup`, `reactNativeGroup`, `tailwind` and the `TypescriptOptions` type join the barrel.
- `typescript()` turns on `@linteljs/prefer-alias` over `.ts`, `.tsx`, `.mts`, `.cts`, `.vue` and `.svelte`, and
  takes `aliasExempt` and `enforceRelativeImports` for it, as does `composeConfig`.
- Astro projects lint `.astro` files as scripts. `base({ astro: true })`, which `composeConfig` sets from its own
  `astro` switch, gives the frontmatter and template every rule a script gets, including the 350-line component
  cap. The Tailwind layer reaches `.astro` class attributes too. `@stylistic/jsx-one-expression-per-line` stays
  off in `.astro`, where a line break in text renders as a space.
- `resolver.noWarnOnMultipleProjects` passes through to the import resolver, for a workspace whose `project` is a
  glob.

### Changed

- `vitest/expect-expect` counts `expectTypeOf` and `assertType`, so a suite asserting only over types passes.
- `typescript-eslint` moves to ^8.71.0 and `eslint-plugin-sonarjs` to ^4.2.2.
- `es-toolkit` is bundled into `dist/`, so it adds no runtime dependency.
- `astro-eslint-parser` and `svelte-eslint-parser` are no longer optional peers: `eslint-plugin-astro` and
  `eslint-plugin-svelte` depend on them, so installing the plugin is enough.

### Fixed

- Import sorting files `@styles` with `@config` and `@typings`, and `@i18n` with `@lib`, `@utils` and the other
  library aliases, rather than in the trailing group of aliases no bucket names.
- An alias whose `paths` key has its wildcard mid-key, such as `@features/*/api`, sorts into its alias bucket.
- `import-x/no-duplicates` merges with `prefer-inline`, so two imports of one module become one import with an
  inline `type` on each type-only name. Its default fix put values inside `import type { … }`, which fails to
  compile.
- One owner per rule. `@eslint-react`'s nine copies of the `react-hooks` rules are off, so a React project no
  longer reports every hook defect twice. `sonarjs/no-unused-vars`, `sonarjs/no-array-delete` and
  `sonarjs/prefer-regexp-exec` are off behind `unused-imports` and `typescript-eslint`.
- `astro()` names typescript-eslint's parser for `.astro` frontmatter and `<script>` blocks rather than resolving
  it from the working directory, which under pnpm or Yarn PnP fell back to espree and failed on every `interface`.
- `svelte()` no longer parses a `.svelte.js` rune module with typescript-eslint, which failed outside every
  tsconfig.
- `sonarjs/code-eval` stands down under a `__mocks__/` at any depth, not only at the root.
- `vuejs-accessibility/label-has-for` accepts a label bound by `for` alone.
- Angular's `@typescript-eslint/no-extraneous-class` allows a decorated class.
- `vue/multi-word-component-names` is no longer restated over `vue/flat/recommended`.

## 1.5.3

No config changes. The version moves with `@linteljs/create`.

## 1.5.2

- `@tanstack/eslint-plugin-query` moves to 5.102.8, `eslint-plugin-solid` to 0.16.1 and `vue` to
  3.5.42, after all three cleared the workspace's two-day maturity window.

## 1.5.1

- `typescript-eslint` moves to 8.68.0 and the Next.js development surface moves to 16.3.3 after
  both releases cleared the workspace's two-day maturity window.

## 1.5.0

- Object literals take one property per line, through `@stylistic/object-property-newline` with
  `allowAllPropertiesOnSameLine: false`. It is paired with `@stylistic/object-curly-newline` scoped
  to `ObjectExpression`, because the first rule alone fixes to a hanging brace, and the scope keeps
  both off imports, exports and destructuring patterns, which the four `@linteljs` newline rules
  already own.
- The React and Solid layers enable `@linteljs/no-duplicate-jsx-props`.
- Plugin peers move: `@html-eslint/*` to 0.65, `@next/eslint-plugin-next` to 16.3.2,
  `@tanstack/eslint-plugin-query` to 5.102.2, and `eslint-plugin-solid` to 0.16, which crosses two
  minors on 0.x.

## 1.4.6

No change to the layers. The three versions move together, so this carries the write-time guard fix in
`@linteljs/create`.

## 1.4.5

No change to the layers. The three versions move together, so this carries the merged type floor and the
discovered style entry in `@linteljs/create`.

## 1.4.4

No change to the layers. The three versions move together, so this carries the caught-value carve-out
in the type floor `@linteljs/create` ships.

## 1.4.3

No change to the layers. The three versions move together, so this carries the `sync` dependency reconciliation in
`@linteljs/create`.

## 1.4.2

No change to the layers. The three versions move together, so this carries the hosted-extension JSX
fix in `@linteljs/create`.

## 1.4.1

No change to the layers. The three versions move together, so this carries the `ignores` answer in
`@linteljs/create`.

## 1.4.0

### Changed

- **`no-console` stands down under `scripts/`.** A build or packaging script reports to a terminal,
  which is the one place stdout is the output rather than a leftover debug line. Firing there left
  every project turning the rule off for a glob of its own, and all three reference repos reached for
  `**/*.js`, which also silences a genuine stray in any plain-JS source file.
- **`sonarjs/code-eval` stands down under `__mocks__/`, and it is the only hotspot rule granted
  anywhere.** A defect rule has a clean state a rewrite can reach; a hotspot rule does not, since its
  message asks a human to confirm the execution is safe and every path that executes a source string
  trips it forever. `chrome.devtools.inspectedWindow.eval` hands the inspected page a source text and
  answers its completion value, so a fake of it that does not execute is not a fake of it. A reference
  repo had three rules off over one line; two came back on once the fixture used `node:vm` rather than
  `new Function`, which is the API whose semantics match. `no-implied-eval` stays on everywhere,
  including there.

## 1.3.2

No change to the layers. The three versions move together, so this carries the dependency floors and the `sync`
fix in `@linteljs/create`.

## 1.3.1

No change to the layers. The three versions move together, so this carries the shipped agent rules and the starter
tests in `@linteljs/create`.

## 1.3.0

No change to the layers. The three versions move together, so this carries the extension target's
surfaces axis in `@linteljs/create`.

## 1.2.0

### Fixed

- The import resolver sets `alwaysTryTypes`, so a declaration file is tried in addition to whatever a package's
  `exports` map resolves to.

### Changed

- `next()` registers `@next/eslint-plugin-next` instead of wrapping `eslint-config-next`. That config bundles
  `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-import` and `eslint-plugin-jsx-a11y` and enables a
  slice of each; three of the four duplicate what `base()` and `react()` already do with `import-x`, `@eslint-react` and
  `react-hooks` v7. Taking the plugin alone keeps the 22 `@next/next` rules and deletes two workarounds: surgery on the
  upstream flat entries, and forty lines that read the installed React version off disk to pin `settings.react.version`,
  which existed because the bundled `eslint-plugin-react` calls `context.getFilename()`, removed in ESLint 10, and every
  `react/*` rule threw at load without it. What is left in `next()` is Next and nothing else: a Next project gets what a
  React project gets by stacking on `react()`, plus those 22 rules, plus the one genuinely Next-specific accessibility
  detail, that `next/image` renders an `img` and `alt-text` has to be told. Three plugins left the dependency graph, and
  with them three of the four peer allowances a workspace needed. `eslint-config-next` is no longer a peer;
  `@next/eslint-plugin-next` and `eslint-plugin-jsx-a11y` are, both optional.
- `base()` enables `import-x/no-anonymous-default-export`. `eslint-config-next` was the only thing enabling its
  `eslint-plugin-import` equivalent, so the rule reached Next projects and nothing else, though nothing about it is
  framework-specific: it is the convention every emitted config already follows. It found two anonymous default exports
  in this workspace the moment it was turned on.

### Added

- `resolver.conditionNames` names the export-map conditions the resolver tries, and in what order. It exists for a
  dependency that publishes subpaths through a wildcard `exports` map: `@modelcontextprotocol/sdk` maps `"./*"` to both
  `./dist/esm/*` and `./dist/esm/*.d.ts`, so under `types` alone `sdk/server/mcp.js` resolves to a
  `server/mcp.js.d.ts` that does not exist and `import-x/no-unresolved` reports an import `tsc` resolves fine. Putting
  `import` ahead of `types` fixes that case and is deliberately **not** the default, because it also makes
  `react-native` resolve to its Flow-typed `index.js` rather than `index.d.ts`, which import-x cannot parse: measured,
  that took a generated React Native project from a clean gate to 127 findings, since the parse failures also stopped
  `eslint --fix` and left 111 autofixable ones behind. Only the end-to-end suite catches this, so a change to the
  resolver defaults is one to run it for.
- Accessibility rules across the JSX layers. `react()` and `solid()` enable `eslint-plugin-jsx-a11y`'s own flat
  `recommended` preset, which reaches React, Next and React Native through the first and Solid through the second, and
  an extension or Astro site hosting either through the same layers. It used to arrive only in Next projects, by
  accident, through `eslint-config-next`, which enabled six of these rules at `warn`; that was Next's choice of floor
  rather than a standard, and an element with no accessible name is the same defect in a Vite app. The preset is taken
  whole, the way every other preset in this package is, rather than hand-picked. Measured on a real Next project before
  landing it: 31 newly error-level rules, zero new findings.
- Accessibility for the template frameworks, which `jsx-a11y` cannot see. `vue()` enables
  `eslint-plugin-vuejs-accessibility`'s `flat/recommended`, 20 rules, since `eslint-plugin-vue` carries none of its own;
  it is ordered ahead of this package's own `.vue` block because the preset sets a parser for the same glob and would
  otherwise take the `parserOptions` that put `projectService` there. `angular()` adds `angular-eslint`'s
  `templateAccessibility`, 11 rules, none of which is in the `templateRecommended` it already applied. Both are new
  optional peers in the case of Vue, and already-installed presets in the case of Angular.

  Svelte gets none, on purpose: `eslint-plugin-svelte` v3 ships zero accessibility rules, having moved them into the
  compiler. Its gate is `svelte-check --fail-on-warnings`, which `@linteljs/create` now passes, because the compiler
  reports accessibility as a warning and `svelte-check` exits 0 on a warning. An `<img>` with no `alt` printed
  `a11y_missing_attribute` and passed; with the flag it fails.
- `vitest/valid-expect` allows the second argument. Vitest's `expect(actual, message)` takes a message naming what the
  assertion means, which Jest has no equivalent for and which the rule's default of one argument reported. Raised to
  two rather than turned off, so a third argument is still a mistake.



- `defineConfig` takes `tailwindEntryPoint`, the CSS file holding `@import "tailwindcss"`, and passes it to the
  tailwind layer as `settings['better-tailwindcss'].entryPoint`. Without it the plugin reasons about Tailwind's
  default theme, so a project's own tokens are foreign classes: it sorts them into the wrong group and warns, once per
  class string, that the entry point is `undefined`. Measured on a real project, the theme-aware order is the reverse
  of the theme-blind one for every custom token (`bg-accent`, `text-meta`, `label-caps`), so a `--fix` without this
  committed an order the plugin itself disagrees with once told where the theme is. The layer still takes no
  entry point by default, which is a fresh scaffold, and `no-unknown-classes` stays off either way.

## 1.1.4

No change to this package. The three versions move together, so this carries the `@linteljs/create`
fixes.

## 1.1.3

### Fixed

- An alias declared bare (`'@engine': './src/engine'`, imported as `from '@engine'` with nothing
  after it) got no import-sort bucket. The pattern ended in `/`, which cannot match a bare
  specifier, so a project whose aliases are all barrels had every one of its own imports fall
  through to the node_modules bucket, silently and with lint green. The pattern now admits a slash
  or the end of the specifier. Type imports are unchanged: `simple-import-sort` appends a NUL to
  those, so they still land in the type group.
- The same alias declared twice, once bare and once with `/*`, no longer emits its pattern twice.

Emitted patterns change shape (`^@ui/` becomes `^@ui(?:/|$)`), so a project may find `eslint --fix`
wanting to reorder imports once after upgrading.

## 1.1.2

### Changed

- The README says how to extend the config, which it never did: adding a plugin this package does
  not ship, turning one of its rules off, and scoping an exemption to a path. Also the two things
  that bite first, both confirmed against a real ESLint rather than asserted: a plugin name already
  taken fails the entire config with `Cannot redefine plugin` when the object differs, and
  `eslint.config.js` is emitted rather than preserved, so `sync --force` overwrites edits made to it.

No change to the layers themselves.

## 1.1.1

The same code as 1.1.0. That version was published by hand to bootstrap npm trusted publishing,
which cannot be registered for a package that does not exist yet; this is the first release to go
out through the pipeline that will publish every version after it.

## 1.1.0

### Added

- A `tailwind` library layer on `eslint-plugin-better-tailwindcss`: class order, duplicates and
  conflicts as lint findings. `no-unknown-classes` stays off, since without a per-project
  `entryPoint` the rule cannot tell a custom CSS class from a typo.
- The React layer enables `@linteljs/prefer-destructured-props`, so props are destructured in the
  signature across the React family. Solid keeps the opposite rule its own plugin enforces.

### Fixed

- The naming block registers `check-file` itself, so a folder rule reaching an `.html` or `.css`
  no longer fails with an unresolvable plugin.
- A corrupt `react/package.json` now fails loudly during config construction instead of being
  read as "react is not installed" and crashing later inside `eslint-plugin-react`.

## 1.0.4

First published release.

### Added

- Flat-config layers composed through `defineConfig`, which owns the layer order so the Vue and
  Svelte parsers and `typescript-eslint` always nest correctly.
- One subpath export per layer. A project loads only the frameworks it asked for: a React project
  installs nothing for Vue, Svelte, Solid or Angular.
