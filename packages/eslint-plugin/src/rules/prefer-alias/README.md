# @linteljs/prefer-alias

Import across aliased directories through the tsconfig alias, and within one relatively.

- Applies to: TypeScript only, with type information
- Fixable: yes (code)
- In `recommended`: yes

The aliases are the program's own `paths`, read off typescript-eslint's parser services, and the file an
import points at is the one tsc resolves it to. Where tsc resolves nothing, as for a `.vue` component in a
program without vue-tsc, it is the file at exactly the path the import spells. Without type information the
rule reports nothing, and so it does in a project that sets `baseUrl`, where any bare specifier may resolve
from it and no rewrite can be proven to land on the same file.

A relative import (`./` or `../`) whose target sits in an aliased directory the importing file is not inside is
fixed to the most specific alias: the one whose directory is deepest. A `src/App.tsx` importing
`./components/features/header` is fixed to `@components/features/header`. An alias import pointing back into
the importing file's own aliased directory is fixed to a relative one, so a directory never imports itself
through its alias. An import stays as written when the alias would resolve somewhere else, or when neither tsc
nor a file at its exact path resolves it.

Only `prefix/*` patterns onto `directory/*` count, by their first substitution. An exact key onto the same
directory, as `"@ui": ["./src/ui"]` beside `"@ui/*": ["./src/ui/*"]`, names its index: `../ui` is fixed to
`@ui`. Any other exact key names one file, which tsc takes before any `prefix/*`: an import spelled as that key,
or a fix that would spell it, stays as written.

It checks `import` and `export ... from` declarations, and a dynamic `import()` whose specifier is a plain string literal.

## Examples of incorrect code for this rule

```ts
// src/app/page.ts
import { env } from '../config/env';

// src/main.ts
import { env } from './config/env';

// src/config/theme.ts
import { env } from '@config/env';
```

## Examples of correct code for this rule

```ts
// src/app/page.ts
import { env } from '@config/env';

// src/main.ts
import { env } from '@config/env';

// src/config/theme.ts
import { env } from './env';
```

## Options

- `aliasExempt` (globs, default none): files where nothing is reported. The globs match the path from the
  tsconfig declaring `paths` and know `**`, `*` and `?`.
- `enforceRelativeImports` (default `false`): in an `aliasExempt` file, report every alias import and fix it to
  a relative one, for a file a tool reads without the aliases.

```js
'@linteljs/prefer-alias': ['error', { aliasExempt: ['src/routes.ts'], enforceRelativeImports: true }]
```

## What it leaves alone

These stay relative by design:

- An import that stays inside the file's own aliased directory, or between two directories no alias holds.
- An import between two directories that only a catch-all alias holds, as Nuxt's `~/*` and `@/*` or Expo's `@/*`
  onto `src/`: both sit in that one alias, so the import is within one aliased directory.
- An import tsc does not resolve and no file sits at its exact path, as an extensionless directory with no index.
  A `.astro` file is linted without type information, so it is never checked.
