# @linteljs/eslint-plugin

[![npm](https://img.shields.io/npm/v/@linteljs/eslint-plugin.svg)](https://www.npmjs.com/package/@linteljs/eslint-plugin)
[![ci](https://github.com/Faran52/linteljs/actions/workflows/ci.yml/badge.svg)](https://github.com/Faran52/linteljs/actions/workflows/ci.yml)

ESLint rules for TypeScript and React code. The plugin covers layout, imports, functions, promises, and
member ordering with a small set of opinionated rules designed to stay consistent across projects.

```bash
npm install --save-dev @linteljs/eslint-plugin
```

`pnpm add -D`, `yarn add -D`, and `bun add -d` work too.

## Use it

For flat config, spread the recommended preset:

```js
import lintel from '@linteljs/eslint-plugin';

export default [
  ...lintel.configs['flat/recommended'],
];
```

The same shape works in CommonJS:

```js
const lintel = require('@linteljs/eslint-plugin');

module.exports = [
  ...lintel.configs['flat/recommended'],
];
```

For ESLint 8 or older, use the legacy preset name:

```jsonc
{
  "extends": ["plugin:@linteljs/recommended"]
}
```

Flat presets are arrays; legacy presets are eslintrc objects. Use the matching form for your config.

To enable a single rule:

```js
export default [
  {
    plugins: { '@linteljs': lintel },
    rules: { '@linteljs/import-newlines': 'error' },
  },
];
```

## Pick a category

Category presets include every rule in that group, including rules outside `recommended`.

```js
export default [
  ...lintel.configs['flat/layout'],
  ...lintel.configs['flat/promises'],
];
```

Available categories are `layout`, `ordering`, `imports`, `functions`, and `promises`.

TypeScript-only rules are scoped to `**/*.{ts,tsx,mts,cts}`. Add a TypeScript parser before relying on them:

```js
import tseslint from 'typescript-eslint';

export default [
  ...lintel.configs['flat/recommended'],
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: { parser: tseslint.parser },
  },
];
```

`union-newline` is in `recommended`. `interface-order` is not, but the `base` layer in
`@linteljs/eslint-config` turns it on. Without that layer, enable it through `flat/ordering` or by rule
name.

## Rules

Each rule link has examples, options, and cases it declines to fix.

| Rule | Description | Category | Recommended | TypeScript only | Options |
| --- | --- | --- | --- | --- | --- |
| [`@linteljs/comment-delimiter`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/comment-delimiter) | Use `//` for short comments and JSDoc blocks for longer prose. | layout | yes | | |
| [`@linteljs/destructuring-property-newline`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/destructuring-property-newline) | Keep destructuring patterns either compact or fully expanded, never half-split. | layout | yes | | |
| [`@linteljs/export-specifier-newline`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/export-specifier-newline) | Put each export specifier on its own line. | layout | yes | | |
| [`@linteljs/import-newlines`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/import-newlines) | Split import lists when they get crowded or too long. | layout | yes | | `maxItems`, `maxLineLength` |
| [`@linteljs/interface-order`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/interface-order) | Keep top-level interfaces and type aliases together, after imports and before runtime code. | ordering | | yes | |
| [`@linteljs/newline-destructuring`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/newline-destructuring) | Keep crowded destructuring patterns, interfaces, and type literals on separate lines. | layout | yes | | `maxProperties`, `maxPropertiesWithRest` |
| [`@linteljs/no-duplicate-jsx-props`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/no-duplicate-jsx-props) | Report duplicate JSX props on the same element. | functions | | | |
| [`@linteljs/no-import-namespace-destructure`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/no-import-namespace-destructure) | Avoid destructuring namespace imports when a named import is enough. | imports | yes | | |
| [`@linteljs/prefer-arrow-functions`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/prefer-arrow-functions) | Prefer arrow functions when the conversion keeps behaviour the same. | functions | yes | | `forceHoisted` |
| [`@linteljs/prefer-await-to-then`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/prefer-await-to-then) | Prefer `await` to `.then()`, `.catch()`, and `.finally()` when reading Promise values. | promises | yes | | `strict` |
| [`@linteljs/prefer-destructured-props`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/prefer-destructured-props) | Destructure component props in the function signature instead of reading them one field at a time. | functions | | | |
| [`@linteljs/prefer-try-catch`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/prefer-try-catch) | Prefer `try`/`catch` around an awaited rejection path instead of a promise callback. | promises | yes | | |
| [`@linteljs/sort-hook-dependencies`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/sort-hook-dependencies) | Keep hook dependency arrays in a consistent order. | ordering | | | `order`, `hooks` |
| [`@linteljs/union-newline`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/union-newline) | Split union types when object or function members make them hard to read. | layout | yes | yes | `maxGenericMembers` |

`prefer-await-to-then` and `prefer-try-catch` overlap by design. Where they divide the cases is in the Notes on
the [prefer-await-to-then](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/prefer-await-to-then)
and [prefer-try-catch](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/prefer-try-catch) pages.

## Compatibility

The package supports ESLint `>=5.0.0` and Node `>=12.0.0`.

| ESLint | Config format | Preset |
| --- | --- | --- |
| 10.x | Flat config | `configs['flat/recommended']` |
| 9.x | Flat config | `configs['flat/recommended']` |
| 8.x and below | eslintrc | `extends: ['plugin:@linteljs/recommended']` |

The package has no runtime dependencies. Its compatibility matrix packs the tarball, runs it with ESLint 5
through 10, and checks that fixed output stays identical across those versions. Compatibility helpers cover
ESLint APIs that moved between releases. A fixer must preserve behaviour, so a rule that cannot prove a
rewrite is safe reports without fixing. Rules are framework-agnostic: TypeScript-only rules are scoped away
from JavaScript files.

## Adding a rule

Each rule owns one directory under `src/rules/`, holding its implementation, its tests and its README. The
six steps for adding one are in the package's
[CLAUDE.md](https://github.com/Faran52/linteljs/blob/main/packages/eslint-plugin/CLAUDE.md).

## License

MIT
