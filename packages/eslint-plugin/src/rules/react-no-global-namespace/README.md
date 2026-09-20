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

Where the file already imports a named list from `react`, the name joins that list. Where it does
not, the fix writes a second `import { ... } from 'react'` rather than rewriting what is there: a
type-only import (`import type { FC } from 'react'`) cannot carry a `type` specifier, and a default
or namespace import has no list to join. Two imports from one module are valid; the alternatives are
not.

One case reports without a fix: a name already bound to something else in scope. Rewriting
`React.ReactNode` to `ReactNode` where the file declares its own `ReactNode` would quietly mean the
other one.

## Options

None.

## When not to use it

A codebase that prefers `React.FC` and `React.ReactNode` as a house style. This rule is off in
`recommended` for that reason and is enabled by the React layer in `@linteljs/eslint-config`.
