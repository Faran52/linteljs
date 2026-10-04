# @linteljs/no-duplicate-interface

Report a second interface of the same name in the same scope.

- Applies to: TypeScript only
- Fixable: no
- In `recommended`: yes

TypeScript merges two interfaces that share a name and a scope into one, without a word. Two
edits that each add an `interface Props` to the same file leave one type with both sets of
members, and a clash between them surfaces far from either declaration, if at all.
`@typescript-eslint/no-redeclare` cannot close this: with `ignoreDeclarationMerge` on it skips
interface pairs, and with it off it also reports a `const` and a `type` sharing a name.

This rule reports the second and each later `interface` of a name in one scope. A scope is the
file's top level, a `declare global` block, a `declare module` block, a `namespace` body or a
function's block, and none is compared with another, so augmenting a global or a module's
interface stays allowed.

## Examples of incorrect code for this rule

```ts
// incorrect: the second Props merges into the first
interface Props { title: string }
interface Props { onClose: () => void }

// incorrect: an `export` does not start a new scope
export interface Options { debug: boolean }
interface Options { verbose: boolean }

// incorrect: two in the same augmentation block
declare global {
  interface Window { analytics: Analytics }
  interface Window { tracker: Tracker }
}
```

## Examples of correct code for this rule

```ts
// correct: augmenting a global from a module
declare global {
  interface Window { analytics: Analytics }
}

// correct: augmenting another package's interface
declare module 'vitest' {
  interface Assertion { toBeValid: () => void }
}

// correct: a merge with a class, namespace, function or value is not an interface pair
class Box {}
interface Box { size: number }
```

## Options

None.

## Why there is no autofix

Merging the two bodies is a guess when both declare the same member.

## Notes

A class and an interface sharing a name are reported by `@typescript-eslint/no-unsafe-declaration-merging`,
which is in its `recommended` preset.
