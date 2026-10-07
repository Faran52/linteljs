# Changelog

All three packages share one version and release together. An entry here describes this package;
when a version's change lives in a sibling it is described there instead:

- [`@linteljs/create`](../create/CHANGELOG.md)
- [`@linteljs/eslint-config`](../eslint-config/CHANGELOG.md)

## 2.0.0

### Breaking

- **Node `>=22.0.0`**, up from 12, and **ESLint `>=8.40.0`**, up from 5. Node below 22 and ESLint below 8.40
  are dropped. The eslintrc presets stay for ESLint 8.
- **The CommonJS entry is `dist/index.cjs`**, not `dist/index.js`, and its types `dist/index.d.cts`. Resolving
  through `main` or `exports` is unaffected; a deep import of `dist/index.js` breaks.
- **`newline-destructuring` is now `member-newline`.** Rename the id wherever it is configured. The message id
  `consistNewline` is now `membersOnNewline`, and the messages say "Members".
- **`member-newline` covers object literals, interfaces and type literals too**, at one threshold: three or more
  members go one per line, and two or fewer sit on one line or go fully one per line. A half-split pair such as
  `const { alpha,\n  bravo }` is fixed to one per line, and a split pair is no longer joined. A rest element
  counts like any other member, and a one-line object pattern holding a multi-line member goes one member per
  line. The base layer of `@linteljs/eslint-config` turns `@stylistic/object-property-newline` off to match.
- **`member-newline` loses `maxPropertiesWithRest` and `maxLineLength`**, and its `multilineMember` message.
  The fix is whitespace only, so a comment inside a pattern no longer blocks it and a trailing comma is left
  for `comma-dangle`. Remove both options from your config.
- **`destructuring-property-newline` is removed.** `member-newline` now reports a half-split object pattern,
  and `array-newline` an array pattern. Remove the id from your config.
- **`export-specifier-newline` splits at three or more specifiers**, not two, so `export { alpha, bravo }` is
  allowed. A half-split pair is fixed to one per line, never joined. It reports once per statement, with a new
  message, and its fix runs past a comment inside the braces.
- **`import-newlines` never joins lines and loses `maxLineLength`.** A split pair stays split, a half-split pair
  is fixed to one per line, and a long import under the count is left alone, so the `mustSplitLong` and
  `mustNotSplit` messages are gone. Only named imports count, and a single named import is never reported. The
  fix is whitespace only, so a comment inside the braces no longer blocks it and a trailing comma or a redundant
  `as` is left as written. Remove `maxLineLength` from your config.
- **The category presets are gone.** `configs.layout`, `ordering`, `imports`, `functions` and `promises`, and
  their `flat/` forms, give way to `configs.all` and `configs['flat/all']`, which carry every rule.
  `configs.recommended` stays.
- **`meta.docs.category` is replaced by `meta.docs.fixShape`**, and the exports `RULE_CATEGORIES` and
  `RuleCategory` by `FIX_SHAPES` and `FixShape`. `whitespace` leaves the tokens identical, `reorder` only
  reorders them, and an absent shape may rewrite code.
- **`recommended` gains seven rules**, so a project on it reports more on upgrade: `array-newline`,
  `chain-call-newline`, `interface-order`, `no-duplicate-interface`, `no-eslint-disable`,
  `no-inline-object-types` and `prefer-alias`.

### Added

- `array-newline` puts each element of an array or array pattern with three or more on its own line. Two or
  fewer may sit on one line, so `const [value, setValue] = useState(0)` stays as written. Fixable
  (whitespace), in `recommended`.
- `chain-call-newline` puts each call of a chain on its own line once the chain has two calls after its head,
  or one call taking a callback with a block body. `expect(x).toBe(y)` and `Object.keys(x).map(fn)` stay on one
  line. Fixable (whitespace), in `recommended`. `maxLineLength` (default `120`) caps the lines its fix writes.
- `name-before-use` reports an await, a call that takes a call, or an inline array or object anywhere but the
  right side of a declaration or assignment, a bare statement or `export default`. A ternary's branches, the right
  side of `&&`, `||` and `??`, and a call chain on a literal take the position of the whole expression, and a
  `return` names the await it holds whole. `ignoreEmptyLiterals` and `ignoreLiteralArguments` relax the literal
  half. Report-only, not in `recommended`; the base layer of `@linteljs/eslint-config` enables it.
- Five React Native accessibility rules: `native-accessible-name`, `native-no-nested-touchables`,
  `native-valid-accessibility-actions`, `native-valid-accessibility-role` and
  `native-valid-accessibility-state`. Report-only, not in `recommended`; the React Native layer of
  `@linteljs/eslint-config` enables them.
- `no-duplicate-interface` (TypeScript only) reports a second `interface` of the same name in one scope, which
  TypeScript merges silently. Augmenting a global or a module stays allowed. Report-only, in `recommended`.
- `no-eslint-disable` reports every directive that disables a rule: `eslint-disable`, `eslint-disable-line`,
  `eslint-disable-next-line`, and inline configuration such as `/* eslint no-console: "off" */`.
  `allowRules` names the rule ids a directive may carry; a bare directive is never allowed. Report-only, in
  `recommended`.
- `no-inline-object-types` (TypeScript only) reports a type literal with members anywhere but directly under a
  type alias. `allowIn` names generics whose arguments may stay inline, such as `Extract`, matched by the last
  segment of a qualified name. Report-only, in `recommended`.
- `prefer-alias` (TypeScript only, type-aware) imports across aliased directories through the tsconfig `paths`
  alias and within one relatively. A `./` or `../` import into an aliased directory the file is not inside is
  fixed to the alias, so a root `src/App.tsx` reaches `./components/...` through `@components/...`. Where tsc
  resolves nothing, as for a `.vue` file without vue-tsc, the file at the exact path the import spells counts.
  Without type information, or in a project that sets `baseUrl`, it reports nothing. `aliasExempt` silences files
  by glob, and `enforceRelativeImports` fixes every alias import in them to a relative one. Fixable, in
  `recommended`.
- `react-no-global-namespace` reports `React.X` reached through `@types/react`'s global namespace, in a type, a
  value or a JSX tag, and in a Svelte `<script>`. Fixable: it imports the name from `react`. Not in
  `recommended`; the React and React Native layers of `@linteljs/eslint-config` enable it.
- `interface-order` takes `trimBlankLines`, default `true`: the fix empties whitespace-only lines inside the
  declarations it moves. `false` moves the text byte for byte.
- `meta.docs.requiresTypeChecking` marks a rule that needs type information.

### Changed

- `es-toolkit` is bundled into `dist/`, so the package still has no runtime dependencies.
- A crash on a lookup the parse should guarantee names the lookup and asks for the parser in the issue.

### Fixed

- Every fixer writes the file's majority line ending, so one stray CRLF line no longer turns an LF file's new
  lines into CRLF.
- `comment-delimiter` no longer merges a `//# sourceMappingURL=` or `//# sourceURL=` line into a JSDoc block,
  and reports a run of `//` lines carrying a JSDoc tag without a fix, since a block would make the tag live.
- `export-specifier-newline` keeps a trailing comma on the last specifier's line instead of pushing it to column 0.
- `interface-order` checks each Svelte `<script>`, where it reported nothing, and its fix keeps the indentation.
- `prefer-arrow-functions` no longer converts a function reached through a hoisted caller or from a later
  `case` of its `switch`, both of which threw `ReferenceError`. It no longer asks for a block body in a StyleX
  dynamic style inside `stylex.create()`, which the compiler refuses, and a fix inside a converted function's
  body now lands in the same `--fix` run.
- `prefer-await-to-then` no longer reports a chain in a block at the top level of a file, such as an `if` or
  `for` body, which no function encloses and so none could make async.
- `prefer-destructured-props` no longer reports a props parameter written through, as in `props.alpha = 1`,
  `props.count++`, `delete props.alpha` or a destructuring target, since a destructured copy cannot write back.
- `prefer-try-catch` reports an awaited or async-returned chain behind a type wrapper, such as
  `await (fetch(url).catch(handle) as Promise<Data>)`, which both promise rules skipped.
  `prefer-await-to-then` hands `return p.then(x) as Promise<T>` in an async function off to it.
- `sort-hook-dependencies` swaps the names in place, keeping a trailing comma and an array laid out one name a
  line, where its fix rewrote the array onto one line.
- `union-newline` reports a union with a comment before any of its pipes without a fix, where it split the gaps
  ahead of the comment and left the rest on one line. A union opening with a `|` on its own line gets its
  continuation pipes under that one, not a step deeper.

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
