# @linteljs/comment-delimiter

Use `//` for short comments and JSDoc blocks for longer prose.

- Category: `layout`
- Applies to: JavaScript and TypeScript
- Fixable: yes
- In `recommended`: yes

The standard this workspace publishes says `//` for one or two lines and `/** */` at three or
more. Nothing checked it, so it drifted: 33 single-line `/** */` comments were measured in one
project that otherwise passed its whole gate. A rule the reader cannot see at a glance holds only
as long as someone remembers it.

The fix rewrites the delimiter and nothing else. Text, indentation and order are carried across
unchanged, so a run of `//` lines becomes the same sentences inside one block and a short JSDoc
becomes the same sentences on `//` lines.

## What it leaves alone

Directives are machine-addressed rather than prose, and rewriting one breaks what points at it.
A shebang, a `/// <reference>`, any `eslint-disable` form, `@ts-expect-error`, `@ts-ignore`,
`v8 ignore`, `c8 ignore`, `istanbul ignore` and `prettier-ignore` are all skipped, and a directive
in the middle of a run also ends the run rather than joining it.

A comment sharing a line with code is skipped too. A trailing note is one line by construction,
and moving it would move the code with it.

A plain `/* */` block is not JSDoc and is not this rule's business.

Test files are skipped entirely: the same standard says a test carries no comments at all, which
is a different rule.

## Examples of incorrect code for this rule

```ts
/** Shared expo-out curve; every surface enters and exits on this single easing. */
export const easing = 'cubic-bezier(0.16, 1, 0.3, 1)';

// The adapter runs Astro at runtime, so the package is a
// runtime dependency rather than a build one.
export const runtime = true;
```

## Examples of correct code for this rule

```ts
export const easing = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * The adapter runs Astro at runtime, so the package is a
 * runtime dependency rather than a build one.
 */
export const runtime = true;

// eslint-disable-next-line no-console
console.log(value);
```

## Options

None.
