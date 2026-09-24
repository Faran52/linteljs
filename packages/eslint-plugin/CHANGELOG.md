# Changelog

All three packages share one version and release together. An entry here describes this package;
when a version's change lives in a sibling it is described there instead:

- [`@linteljs/create`](../create/CHANGELOG.md)
- [`@linteljs/eslint-config`](../eslint-config/CHANGELOG.md)

## Unreleased

- **Breaking: Node `>=14.0.0`.** The floor was 12. The bundle now targets `node14`, so it keeps optional
  chaining and nullish coalescing, and CI runs ESLint 5, 6 and 7 against it on a bare `node:14-alpine`.
- `react-no-global-namespace` fixes a Svelte component correctly: the `react` import goes inside the
  `<script>` holding the reference, at its indent, rather than above the tag, and a reference in the markup
  is reported with no fix.
- `interface-order` checks each Svelte `<script>`, where it used to report nothing, and its fix keeps the
  script's indentation.
- `interface-order` takes `{ trimBlankLines: boolean }`, default `true`: the fix empties whitespace-only lines
  inside the declarations it moves. `false` moves the text byte for byte.
- A crash on a lookup the parse should guarantee now names the lookup that failed and asks for the parser in
  the issue.

- **Breaking: `interface-order` is now in `recommended`.** It was opt-out through 1.x on the grounds
  that it asks for a house layout rather than making a claim about a type. A shared config is a house
  layout, and every project `@linteljs/create` writes already received the rule through `base`, so
  leaving it out of the preset only hid the position from a consumer composing the plugin directly.
  A project with a different convention will report on upgrade. The rule still reports rather than
  rewriting freely, and its fix is still `reorder`.

- **Breaking: `newline-destructuring` is now `member-newline`.** The rule governs destructuring
  patterns, interface bodies and type literals, so two thirds of the old name described something it
  does not do, and it sat beside `destructuring-property-newline` reading as a near-duplicate of a
  rule it does not overlap. Rename the id wherever it is configured. Nothing else about the rule
  changed: the same shapes are reported, with the same fixes and the same options.
- **Breaking: two of that rule's message ids changed.** `consistNewline` is now `membersOnNewline`,
  matching `destructuring-property-newline`'s `propertiesOnNewline` and dropping a truncation that
  read as a typo, and `multilineProperty` is now `multilineMember`. `mustSplit` and
  `noBlankBetween` are unchanged, so JSON and SARIF output naming those two still matches.
- All four of that rule's messages say "Members" where they said "Properties". An interface body has
  members, and reporting one as a property was wrong. The `{{maxProperties}}` placeholder keeps its
  name, because it is the option name and the option is not renamed.
- **Breaking: the five `react-native-*` rules are now `native-*`.** `react-native-accessible-name` is
  `native-accessible-name`, `react-native-no-nested-touchables` is `native-no-nested-touchables`,
  `react-native-valid-accessibility-actions` is `native-valid-accessibility-actions`,
  `react-native-valid-accessibility-role` is `native-valid-accessibility-role`, and
  `react-native-valid-accessibility-state` is `native-valid-accessibility-state`. Under the old prefix
  they sorted among the `react-*` rules and read as React rules. Rename the ids wherever they are
  configured. Nothing else about the rules changed: the same elements are reported, with the same
  messages and the same options.
- `react-no-global-namespace` recognises a directive by its string value. typescript-eslint gives
  every expression statement a `directive` key, so a file of plain statements was read as one long
  prologue: `React.createElement('div');` alone crashed the rule, and after a leading `run();` the
  import was inserted below it.
- `no-inline-object-types` no longer treats a literal outside any generic as an argument to one
  named `''`, so `allowIn: ['']` stops silencing it everywhere.

## 1.6.0

New rule, `react-no-global-namespace`. `@types/react` declares `React` as a global namespace so JSX
resolves without an import, which makes `children?: React.ReactNode` compile in a file that never
imports React. It is not a type error and nothing else reports it, so a file stops saying where its
types come from and nobody finds out. Fixable: the name is imported from `react` and the member
access replaced, merging into an existing import rather than duplicating it. Outside `recommended`
and enabled by the React layer in `@linteljs/eslint-config`.

**Breaking: the category presets are gone.** `meta.docs.category` had eight values and each one
published a preset, so `imports`, `types` and `suppression` were one-rule presets and
`accessibility` was exactly the rules whose id begins `react-native-`, both directions. A rule's
subject is in its id now, the way `@stylistic` carries `jsx-*`, and the presets carry the level
alone. `configs.recommended` is unchanged; `configs.all` replaces the eight, carrying every rule
including the opt-outs. Name the rules you want, or take `all` and turn off what you do not.

`meta.docs.category` is replaced by `meta.docs.fixShape`, which says what a fixer may do to the
token stream rather than what a rule is about: `whitespace` leaves the tokens identical, `reorder`
keeps the same tokens in a different order, and absent means it may rewrite code. It has one reader,
the fixer-safety suite, which is what the category was doing for it before.

1.5.4 was cut and never published.

## 1.5.3

No rule changes. The three versions move together, so this carries generated-project floors moving
with the workspace: pnpm 12.1.0, Node >=26.8.1, and `@types/node` 26.4.0.

## 1.5.2

`comment-delimiter` no longer merges a run of `//` lines into a `/** */` block when one of them
carries a literal `*/`: merging closed the block early and spilled the rest of the comment as code.
The corpus audit's own comment-loss check moves with it, comparing normalized content lines rather
than whole comment values, so a legitimate merge or split no longer reads as every comment vanishing.

## 1.5.1

No rule changes. The three versions move together, so this carries the pnpm 12 generated-project
pin and mature dependency floors in `@linteljs/create` and `@linteljs/eslint-config`.

The mutation audit moves to Stryker 10.0.0; its Vitest dry run still discovers 2,146 mutants and
passes all 5,076 tests before mutation execution.

## 1.5.0

## 1.5.0

Two rules, taking the total to fourteen.

- `no-duplicate-jsx-props` reports a prop named more than once on one element. React keeps the last
  occurrence and drops the rest in silence, so the first value disappears without a word from the
  compiler, the type checker or any other rule. Report only: deleting either occurrence guesses
  which value the author meant. A spread between two occurrences resets the count, since overriding
  through `{...props}` is deliberate.
- `comment-delimiter` keeps `//` for comments of one or two lines and JSDoc for three or more,
  which the published standard has always said and nothing checked. It fixes in both directions and
  leaves directives, trailing comments and test files alone.

Neither is in `recommended`: `comment-delimiter` is, and arrives through the preset; the JSX rule is
turned on by the React and Solid layers of `@linteljs/eslint-config`.

## 1.4.6

No change to the rules. The three versions move together, so this carries the write-time guard fix in
`@linteljs/create`.

## 1.4.5

No change to the rules. The three versions move together, so this carries the merged type floor and the
discovered style entry in `@linteljs/create`.

## 1.4.4

No change to the rules. The three versions move together, so this carries the caught-value carve-out
in the type floor `@linteljs/create` ships.

## 1.4.3

No change to the rules. The three versions move together, so this carries the `sync` dependency reconciliation in
`@linteljs/create`.

## 1.4.2

No change to the rules. The three versions move together, so this carries the hosted-extension JSX
fix in `@linteljs/create`.

## 1.4.1

No change to the rules. The three versions move together, so this carries the `ignores` answer in
`@linteljs/create`.

## 1.4.0

No change to the rules. The three versions move together, so this carries the base layer's two new
file-scoped grants and the four `@linteljs/create` gaps.

## 1.3.2

No change to the rules. The three versions move together, so this carries the dependency floors and the `sync`
fix in `@linteljs/create`.

## 1.3.1

No change to the rules. The three versions move together, so this carries the shipped agent rules and the starter
tests in `@linteljs/create`.

## 1.3.0

No change to this package. The three versions move together, so this carries the extension
target's surfaces axis in `@linteljs/create`.

## 1.2.0

No change to this package. The three versions move together, so this carries the Astro target and the
extension's two axes in `@linteljs/create`, and the accessibility layers in
`@linteljs/eslint-config`.

## 1.1.4

No change to this package. The three versions move together, so this carries the `@linteljs/create`
fixes.

## 1.1.3

No change to this package. The three versions move together, so this carries the import-sort fix in
`@linteljs/eslint-config`.

## 1.1.2

No change to this package. The three versions move together, so this is 1.1.1 under the version its
release branch named.

## 1.1.1

The same code as 1.1.0. That version was published by hand to bootstrap npm trusted publishing,
which cannot be registered for a package that does not exist yet; this is the first release to go
out through the pipeline that will publish every version after it.

## 1.1.0

### Added

- `prefer-destructured-props`: requires a component's props to be destructured in the signature
  rather than read member by member. Detects components through `memo`/`forwardRef` wrapper
  chains, stays quiet on any whole-value use, on dynamic keys that cannot be destructured, and
  on hooks and helpers. No autofix on purpose: a signature rewrite is not safely automatable.
  Not in `recommended`; the React layer of `@linteljs/eslint-config` opts in. Verified on ESLint 5
  through 10 in the compat matrix.

## 1.0.4

### Added

- ESLint 5 support. The declared peer range always included ESLint 5, but the `.cjs` entry point
  landed in its YAML config branch and failed to load. The entry format now works on every
  supported major.
- `pnpm compat`: packs the tarball, installs ESLint 5 through 10 side by side, and checks that
  every major produces identical fixed output on a fixture that trips every recommended rule.

### Changed

- The CommonJS entry moved from `dist/index.cjs` to `dist/index.js`, with a `dist/package.json`
  marking the directory as CommonJS. Importing the package by name is unaffected.
- The bundle targets Node 12 to match the declared `engines.node >= 12`.

### Fixed

- Rules read `sourceCode`, `physicalFilename` and the scope helpers through a compat layer, so
  they work on ESLint majors before 8.40 instead of silently reporting nothing.
