# @linteljs/no-import-namespace-destructure

Avoid destructuring namespace imports when a named import is enough.

- Category: `imports`
- Applies to: JavaScript and TypeScript
- Fixable: no
- In `recommended`: yes

Destructuring a namespace import pulls the whole module in and then throws most of it away, which
defeats tree shaking and hides what the file actually uses. Naming the exports in the import
statement says the same thing in one place a bundler can read.

## Examples of incorrect code for this rule

```ts
import * as namespace from 'mod';

// incorrect: the whole module is imported so one name can be pulled off it
const { alpha } = namespace;
```

```ts
import * as namespace from 'mod';

// incorrect: the binding is resolved up the scope chain, so nesting hides nothing
const run = () => {
  const { alpha } = namespace;

  return alpha;
};
```

## Examples of correct code for this rule

```ts
// correct: name the exports in the import statement
import { alpha } from 'mod';
```

```ts
import * as namespace from 'mod';

// correct: reading a property off the namespace is not destructuring it
const value = namespace.alpha;
```

```ts
import * as namespace from 'mod';

// correct: the parameter shadows the import, so this is a different object
const run = (namespace: { alpha: string }) => {
  const { alpha } = namespace;

  return alpha;
};
```

## Options

None.

## Why there is no autofix

Turning `const { alpha } = namespace` into `import { alpha } from 'mod'` means editing a statement
elsewhere in the file, and whether the name is exported individually at all is not something this
rule can see. So it reports and you make the edit.

## Notes

Resolving the binding up the scope chain was a real bug fix. The first version of this rule looked
in the immediate scope only, so it was dead inside any function or block.
