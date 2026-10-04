# @linteljs/interface-order

Keep top-level interfaces and type aliases together, after imports and before runtime code.

- Applies to: TypeScript only
- Fixable: yes (code)
- In `recommended`: yes

Types belong in one block near the top of the file, where a reader looking for the shape of things
can find them without scrolling past the implementation. Only top-level `interface` and `type`
declarations are checked, exported or not. Anything nested inside a function or a block is left
where it is. The block goes after the last import or directive (`'use client'`), and each Svelte
`<script>` is checked on its own.

## Examples of incorrect code for this rule

```ts
import { thing } from 'mod';

const value = thing;

// incorrect: the alias sits below runtime code
type Alpha = string;
```

```ts
const start = Date.now();

// incorrect: an interface below runtime code, exported or not
export interface Options {
  retries: number;
}
```

## Examples of correct code for this rule

```ts
import { thing } from 'mod';

type Alpha = string;

const value = thing;
```

```ts
// correct: every type in one block, after the imports, before the code
import { thing } from 'mod';

interface Options {
  retries: number;
}

type Alpha = string;

const value = thing;
```

```ts
// correct: a type declared inside a function is not top level
const build = () => {
  interface Local {
    id: string;
  }

  return null as unknown as Local;
};
```

## Options

### `trimBlankLines`

Whether a blank line that still holds indentation comes out empty when the fix moves the declaration it
sits in. Defaults to `true`: an editor that keeps the indent on an empty line leaves whitespace the
move would otherwise carry to its new place. Set it to `false` to move the text byte for byte.

```js
{
  rules: {
    '@linteljs/interface-order': ['error', { trimBlankLines: false }],
  },
}
```

## Notes

Every type declaration is safe to move, including one derived from a value:

```ts
type Size = (typeof SIZES)[number];

const SIZES = ['small', 'large'] as const;
```

TypeScript resolves type positions lazily, so this compiles.

A comment above a declaration belongs to it and travels with it. The fix deletes from the end of
the preceding statement, so the blank line that separated them goes too and the file does not come
back with a double gap.

A comment on the same line as a statement belongs to that statement, and there is nothing ambiguous
about that one. It travels with a declaration that moves, and it stays put on a declaration that
does not, including the one the moved block is inserted after. So this:

```ts
import { thing } from 'mod'; // note

const value = thing; // runtime note

type Alpha = string; // what this models
```

fixes to this, with all three notes still on the statement each was written for:

```ts
import { thing } from 'mod'; // note

type Alpha = string; // what this models

const value = thing; // runtime note
```

Left behind, such a comment ends up describing whatever statement slides underneath it, and several
of them in one file pile onto a single line.
