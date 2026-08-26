# Changelog

All three packages share one version and release together. An entry here describes this package;
when a version's change lives in a sibling it is described there instead:

- [`@linteljs/create`](../create/CHANGELOG.md)
- [`@linteljs/eslint-config`](../eslint-config/CHANGELOG.md)

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
