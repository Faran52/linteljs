# @linteljs/react-no-global-namespace

Import the React names a file uses instead of reaching them through the global namespace.

- Applies to: JavaScript and TypeScript
- Fixable: yes (code)
- In `recommended`: no, opt in explicitly

`@types/react` declares `React` as a global namespace so JSX resolves without an import, which means
`React.ReactNode` compiles in a file that never imports React. Nothing refuses it: it is not a type
error, and no rule in this plugin or in typescript-eslint reports it. What it costs is that the file
no longer says where its types come from, and a reader cannot tell an imported name from an ambient
one.

A file that imports React itself is doing something else. `import React from 'react'` binds the
namespace locally, and reaching through that binding is this file's own import, so it is not
reported.

## Examples of incorrect code for this rule

```tsx
// incorrect: `ReactNode` arrives through a global nothing in this file asked for
interface Props {
  children?: React.ReactNode;
}
```

```jsx
// incorrect: the same reach, in a value position
React.createElement('div');
```

```jsx
// incorrect: and again in markup, where the tag name is not a member expression
const el = <React.Fragment>text</React.Fragment>;
```

## Examples of correct code for this rule

```tsx
import { type ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}
```

```jsx
import React from 'react';

// the namespace is this file's own binding
React.createElement('div');
```

## Fix

The name is imported from `react` and the member access is replaced with it. A type position takes a
`type` specifier.

A JSX element is rewritten at both tags by one fix, since `<Fragment>` against `</React.Fragment>`
would not parse and ESLint keeps whatever the last pass produced.

Every report in a file carries the same fix, which imports all the names and rewrites every reach at
once. A fix per reach would each edit the one import statement, ESLint applies one such fix a pass,
and its ten passes stop before a file with more than ten reaches is done.

Where the file already imports a named list from `react`, the name joins that list. Where it does
not, the fix writes a second `import { ... } from 'react'` rather than rewriting what is there: a
type-only import (`import type { FC } from 'react'`) cannot carry a `type` specifier, and a default
or namespace import has no list to join. Two imports from one module are valid; the alternatives are
not.

A new statement goes after the directive prologue rather than at the top of the file. `'use client'`
is a directive only while nothing precedes it, and an import above one leaves Next's compiler
refusing the file.

Two cases report without a fix, both for the same reason: the name is taken and rewriting the member
access would quietly mean something else.

- The file declares its own `ReactNode`.
- The file imports the name as a type, `import type { Fragment } from 'react'` or
  `import { type Fragment }`, and the reach is a value. `<Fragment>` against a type-only binding is
  what TypeScript refuses, so reading the name alone is not enough: a value reach needs a value
  specifier.

## What it leaves alone

A declaration file, and any file whose body carries a top-level `declare` and no import at all.
Adding an import turns a script into a module: `declare module '*.svg'` becomes an augmentation of a
module that does not exist and every global in the file stops being global. There is nothing to
report either, because the file cannot take the import the message asks for.

## Options

None.

## When not to use it

A codebase that prefers `React.FC` and `React.ReactNode` as a house style. This rule is off in
`recommended` for that reason and is enabled by the React layer in `@linteljs/eslint-config`.
