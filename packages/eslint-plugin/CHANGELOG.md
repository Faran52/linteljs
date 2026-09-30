# Changelog

All three packages share one version and release together. An entry here describes this package;
when a version's change lives in a sibling it is described there instead:

- [`@linteljs/create`](../create/CHANGELOG.md)
- [`@linteljs/eslint-config`](../eslint-config/CHANGELOG.md)

## 2.0.0

### Breaking

- **Node `>=18.0.0`**, up from 12. The bundle targets `node18`; CI runs ESLint 6 and 7 on `node:18-alpine`.
- **ESLint `>=6.0.0`**, up from 5.
- **`newline-destructuring` is now `member-newline`.** Rename the id wherever it is configured. Its message id
  `consistNewline` is now `membersOnNewline`, and the messages say "Members".
- **One threshold for list layouts: three or more items go one per line, and two or fewer may not be
  half-split.** `member-newline` keeps its `maxProperties` default of `2` and now holds every list it owns to it:
  two or fewer members sit on one line or go fully one per line, and `const { alpha,\n  bravo }` is fixed to the
  second. It never joins lines, so a split pair is no longer collapsed.
- **`export-specifier-newline` splits at three or more specifiers**, not two, so `export { alpha, bravo }` is
  allowed. A half-split pair such as `export { alpha,\n  bravo }` is fixed to one per line, never joined. It
  reports once per statement, with a new message, and its whitespace-only fix now runs past a comment inside the
  braces instead of declining.
- **`import-newlines` never joins lines and loses `maxLineLength`.** A split pair such as `import {\n  alpha,\n  bravo\n}`
  stays split, a half-split pair is fixed to one per line, and a long import under the count is left alone, so
  the `mustSplitLong` and `mustNotSplit` messages are gone. Only named imports count; a default or namespace import
  is never moved, and a single named import is never reported, even at `maxItems: 0`. The fix is whitespace only
  (`fixable: 'whitespace'`), so a comment inside the braces no longer blocks it and a trailing comma or a
  redundant `as` is left as written. Remove `maxLineLength` from your config.
- **`member-newline` takes object literals**, which `@stylistic/object-property-newline` split at two. The base
  layer turns that rule off (see `@linteljs/eslint-config`).
- **`member-newline` loses `maxPropertiesWithRest` and `maxLineLength`.** A rest element counts like any other
  member, and with no collapse there is no line to measure. Its `multilineMember` message is gone: a list with a
  member spanning lines follows the same count. The fix is whitespace only (`fixable: 'whitespace'`), so a comment
  inside a pattern no longer blocks it, and a trailing comma is left for `comma-dangle`. Remove both options from
  your config.
- **`destructuring-property-newline` is removed.** Every shape it reported now belongs to another rule:
  `member-newline` reports a half-split object pattern, and `array-newline` (below) an array pattern.
  Remove the id from your config.
- **The category presets are gone.** `configs.layout`, `ordering`, `imports`, `functions` and `promises` (and their
  `flat/` forms) are replaced by `configs.all` and `configs['flat/all']`, which carry every rule. Name the rules you
  want, or take `all` and turn off what you do not. `configs.recommended` stays.
- **`meta.docs.category` is replaced by `meta.docs.fixShape`**, and the exports `RULE_CATEGORIES` and `RuleCategory`
  by `FIX_SHAPES` and `FixShape`: `whitespace` leaves the tokens identical, `reorder` only reorders them, absent
  may rewrite code.
- **`recommended` gains six rules**, so a project on it reports more on upgrade: `array-newline`,
  `chain-call-newline`, `interface-order`, `no-duplicate-interface`, `no-eslint-disable` and
  `no-inline-object-types` (below).

### Added

- `array-newline` puts each element of an array or array pattern with three or more on its own line, with the
  brackets on lines of their own. Two or fewer sit on one line or go fully one per line, so
  `const [value, setValue] = useState(0)` stays as written and `[alpha,\n  bravo]` is fixed. The rule never
  joins lines. Fixable (whitespace), in `recommended`.
- `chain-call-newline` puts each call in a member chain on its own line once the chain has two calls after its
  head, or one call taking a callback with a block body. The head keeps a namespace call, so
  `Object.keys(x).map(fn)` and `expect(x).toBe(y)` stay on one line. Fixable (whitespace): breaks before each `.`
  and moves the callback's lines a step right; reports without a fix past `maxLineLength` (default `120`) or
  with a comment in the way.
- `no-duplicate-interface` (TypeScript only) reports a second `interface` of the same name in one scope, which
  TypeScript merges silently. The top level, each `declare global` and `declare module` block, each `namespace`
  body and each function block are separate scopes, so augmentation stays allowed. Report-only.
- `no-eslint-disable` reports `eslint-disable`, `eslint-disable-line` and `eslint-disable-next-line` directives.
  Report-only. `allowRules` names rule ids a directive may carry; a bare directive is never allowed.
- `no-inline-object-types` (TypeScript only) reports a type literal with members anywhere but directly under a type
  alias. `allowIn` names generics whose arguments may stay inline, such as `Extract`.
- `react-no-global-namespace` reports `React.X` resolved through `@types/react`'s global namespace, in a type, a value
  or a JSX tag such as `<React.Fragment>`. Fixable: imports the name from `react`, merging into an existing import,
  and in Svelte inside the `<script>` holding the reference. Outside `recommended`; the React layers enable it.
- Five React Native accessibility rules: `native-accessible-name`, `native-no-nested-touchables`,
  `native-valid-accessibility-actions`, `native-valid-accessibility-role` and `native-valid-accessibility-state`.
  Outside `recommended`; the `react-native` layer of `@linteljs/eslint-config` enables them.
- `interface-order` takes `{ trimBlankLines: boolean }`, default `true`: the fix empties whitespace-only lines inside
  the declarations it moves. `false` moves the text byte for byte.

### Fixed

- `native-no-nested-touchables` sees a touchable behind `{show && <Pressable />}` or a ternary branch.
- `comment-delimiter` no longer merges a `//# sourceMappingURL=` or `//# sourceURL=` line into a JSDoc block.
- `no-eslint-disable` reports an inline config comment that turns a rule off, such as
  `/* eslint no-console: "off" */`.
- `no-inline-object-types`: `allowIn` matches a qualified name such as `React.PropsWithChildren` by its last
  segment.
- `interface-order` checks each Svelte `<script>`, where it reported nothing, and its fix keeps the indentation.
- `export-specifier-newline` keeps a trailing comma on the last specifier's line instead of pushing it to column 0.
- `prefer-arrow-functions` no longer converts a function reached through a hoisted caller or from a later `case` of
  its `switch`, both of which threw `ReferenceError`, and no longer asks for a block body in a StyleX dynamic style
  inside `stylex.create()`, which the compiler refuses.
- A crash on a lookup the parse should guarantee now names the lookup and asks for the parser in the issue.

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
