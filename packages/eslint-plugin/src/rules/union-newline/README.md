# @linteljs/union-newline

Split union types when object or function members make them hard to read.

- Category: `layout`
- Applies to: TypeScript only
- Fixable: yes (whitespace)
- In `recommended`: yes

A union splits for one of two reasons. Either it contains a member that is hard to read inline,
meaning an object, function, constructor or mapped type, or it sits inside a generic argument and
has more members than `maxGenericMembers`, at which point the argument list stops being scannable.

A union of plain members stays on one line however long it gets. Twelve string literals in a row
read fine; one inline object type does not.

## Examples of incorrect code for this rule

```ts
// incorrect: an object type member
type Alpha = { first: string } | string;

// incorrect: a function type member
type Beta = (() => void) | string;

// incorrect: a constructor type member
type Gamma = (new () => Widget) | string;

// incorrect: four members inside a generic argument, over the default of 3
type Delta = Record<'a' | 'b' | 'c' | 'd', string>;

// incorrect: the same rule applies to a property type
interface Holder {
  field: { first: string } | null;
}
```

```ts
/* eslint @linteljs/union-newline: ["error", { "maxGenericMembers": 1 }] */

// incorrect once the generic threshold is lowered to 1
type Narrow = Record<'a' | 'b', string>;
```

## Examples of correct code for this rule

```ts
// correct: plain members stay on one line however many there are
type Alpha = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';

// correct: one member per line once an object type is involved
type Beta = { first: string }
  | string;

// correct: a function type member, split
type Gamma = (() => void)
  | string;

// correct: split inside the generic argument
type Delta = Record<'a'
  | 'b'
  | 'c'
  | 'd', string>;

// correct: three members in a generic argument, at the default threshold
type Epsilon = Record<'a' | 'b' | 'c', string>;

// correct: continuation lines sit one step in from where the union starts
interface Holder {
  field: { first: string }
    | null;
}
```

## Options

```jsonc
{
  "@linteljs/union-newline": ["error", { "maxGenericMembers": 3 }]
}
```

- `maxGenericMembers`: integer, minimum 1, `3` by default. A union inside a generic argument splits
  once it has more members than this. It has no effect on a union containing an object, function,
  constructor or mapped type: that one always splits, whatever this is set to.

## What it declines to fix

A comment written between a member and the pipe that follows it stops the split. The fix replaces
that gap with a line break, so the comment would go with it. The rule reports and moves nothing.

## Notes

This rule only visits TypeScript union nodes, so every shipped config scopes it behind a TypeScript
glob and it never runs on a `.js` file.

Continuation lines sit one indentation step in from the line the union starts on, with the step
read off the file. Emitting them at column 0 put `| string` hard against the margin, which inside
an interface body is visibly wrong.
