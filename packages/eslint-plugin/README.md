# @linteljs/eslint-plugin

[![npm](https://img.shields.io/npm/v/@linteljs/eslint-plugin.svg)](https://www.npmjs.com/package/@linteljs/eslint-plugin)
[![ci](https://github.com/Faran52/linteljs/actions/workflows/ci.yml/badge.svg)](https://github.com/Faran52/linteljs/actions/workflows/ci.yml)

ESLint rules for TypeScript and React code: layout, comments, imports, functions, promises, declaration
order and React Native accessibility.

```bash
npm install --save-dev @linteljs/eslint-plugin
```

`pnpm add -D`, `yarn add -D`, and `bun add -d` work too.

## Use it

For flat config, spread the recommended preset:

```js
import linteljs from '@linteljs/eslint-plugin';

export default [
  ...linteljs.configs['flat/recommended'],
];
```

The same shape works in CommonJS:

```js
const linteljs = require('@linteljs/eslint-plugin');

module.exports = [
  ...linteljs.configs['flat/recommended'],
];
```

For ESLint 8 or older, use the legacy preset name:

```jsonc
{
  "extends": ["plugin:@linteljs/recommended"]
}
```

To enable a single rule:

```js
export default [
  {
    plugins: { '@linteljs': linteljs },
    rules: { '@linteljs/import-newlines': 'error' },
  },
];
```

## Everything, including the opt-outs

`recommended` carries the rules most projects want. `all` carries every rule, including those off by default.

```js
export default [
  ...linteljs.configs['flat/all'],
];
```

There are two presets and no others. A rule's subject is in its id rather than in a preset name:
the five `native-*` rules are React Native accessibility, and `react-no-global-namespace`,
`no-duplicate-jsx-props`, `prefer-destructured-props` and `sort-hook-dependencies` are for React-style
components. Those nine are opt-outs, so `recommended` does not carry them, and neither does it carry
`name-before-use`, a house style `@linteljs/eslint-config`'s `base` turns on. Name the ones you want, or take `all`
and turn off what you do not.

```js
export default [
  ...linteljs.configs['flat/recommended'],
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: { '@linteljs': linteljs },
    rules: { '@linteljs/react-no-global-namespace': 'error' },
  },
];
```

TypeScript-only rules are scoped to `**/*.{ts,tsx,mts,cts}`. Add a TypeScript parser before relying on them:

```js
import tseslint from 'typescript-eslint';

export default [
  ...linteljs.configs['flat/recommended'],
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: { parser: tseslint.parser },
  },
];
```

## Rules

Each rule link has examples, options, and cases it declines to fix. Fixable is the rule's `meta.fixable`: `code` or `whitespace`.

| Rule | Description | Recommended | Fixable | TypeScript only | Options |
| --- | --- | --- | --- | --- | --- |
| [`@linteljs/array-newline`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/array-newline) | Put each element of an array or array pattern with three or more on its own line. | yes | whitespace | | |
| [`@linteljs/chain-call-newline`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/chain-call-newline) | Put each call on its own line once a chain has two calls or a callback with a body. | yes | whitespace | | `maxLineLength` |
| [`@linteljs/comment-delimiter`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/comment-delimiter) | Use `//` for short comments and JSDoc blocks for longer prose. | yes | code | | |
| [`@linteljs/export-specifier-newline`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/export-specifier-newline) | Put each specifier of an export list with three or more on its own line. | yes | whitespace | | |
| [`@linteljs/import-newlines`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/import-newlines) | Put each named import of an import with three or more on its own line. | yes | whitespace | | `maxItems` |
| [`@linteljs/interface-order`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/interface-order) | Keep top-level interfaces and type aliases together, after imports and before runtime code. | yes | code | yes | `trimBlankLines` |
| [`@linteljs/member-newline`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/member-newline) | Put each member of an object, object pattern, interface, or type literal with three or more on its own line. | yes | whitespace | | `maxProperties` |
| [`@linteljs/name-before-use`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/name-before-use) | Name an await, a call that takes a call, or an inline array or object in a const before using it. | | | | `ignoreEmptyLiterals`, `ignoreLiteralArguments` |
| [`@linteljs/native-accessible-name`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/native-accessible-name) | Require an accessible name on React Native elements that are announced. | | | | `components` |
| [`@linteljs/native-no-nested-touchables`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/native-no-nested-touchables) | Disallow controls inside a container marked accessible. | | | | `components` |
| [`@linteljs/native-valid-accessibility-actions`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/native-valid-accessibility-actions) | Require accessibilityActions and onAccessibilityAction to be declared together and well formed. | | | |  |
| [`@linteljs/native-valid-accessibility-role`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/native-valid-accessibility-role) | Require accessibilityRole and role values React Native understands. | | | |  |
| [`@linteljs/native-valid-accessibility-state`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/native-valid-accessibility-state) | Require accessibilityState to be an object of the keys React Native reads. | | | |  |
| [`@linteljs/no-duplicate-interface`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/no-duplicate-interface) | Report a second interface of the same name in the same scope. | yes | | yes | |
| [`@linteljs/no-duplicate-jsx-props`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/no-duplicate-jsx-props) | Report duplicate JSX props on the same element. | | | | |
| [`@linteljs/no-eslint-disable`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/no-eslint-disable) | Fix what a rule reports, or name the exemption in the config. Do not disable it inline. | yes | | | `allowRules` |
| [`@linteljs/no-import-namespace-destructure`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/no-import-namespace-destructure) | Avoid destructuring namespace imports when a named import is enough. | yes | | | |
| [`@linteljs/no-inline-object-types`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/no-inline-object-types) | Give an object type a name instead of writing its shape inline. | yes | | yes | `allowIn` |
| [`@linteljs/prefer-alias`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/prefer-alias) | Import across aliased directories through the tsconfig alias, and within one relatively. | yes | code | yes | `aliasExempt`, `enforceRelativeImports` |
| [`@linteljs/prefer-arrow-functions`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/prefer-arrow-functions) | Prefer arrow functions when the conversion keeps behaviour the same. | yes | code | | `forceHoisted` |
| [`@linteljs/prefer-await-to-then`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/prefer-await-to-then) | Prefer `await` to `.then()`, `.catch()`, and `.finally()` when reading Promise values. | yes | | | `strict` |
| [`@linteljs/prefer-destructured-props`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/prefer-destructured-props) | Destructure component props in the function signature instead of reading them one field at a time. | | | | |
| [`@linteljs/prefer-try-catch`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/prefer-try-catch) | Prefer `try`/`catch` around an awaited rejection path instead of a promise callback. | yes | | | |
| [`@linteljs/react-no-global-namespace`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/react-no-global-namespace) | Import the React names a file uses instead of reaching them through the global namespace. | | code | | |
| [`@linteljs/sort-hook-dependencies`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/sort-hook-dependencies) | Keep hook dependency arrays in a consistent order. | | code | | `order`, `hooks` |
| [`@linteljs/union-newline`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/union-newline) | Split union types when object or function members make them hard to read. | yes | whitespace | yes | `maxGenericMembers` |

`prefer-await-to-then` and `prefer-try-catch` overlap by design. Where they divide the cases is in the Notes on
the [prefer-await-to-then](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/prefer-await-to-then)
and [prefer-try-catch](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/prefer-try-catch) pages.

## Compatibility

The package supports ESLint `>=6.0.0` and Node `>=18.0.0`.

| ESLint | Config format | Preset |
| --- | --- | --- |
| 10.x | Flat config | `configs['flat/recommended']` |
| 9.x | Flat config | `configs['flat/recommended']` |
| 8.x and below | eslintrc | `extends: ['plugin:@linteljs/recommended']` |

The package has no runtime dependencies: what it uses is bundled. Its compatibility matrix packs the tarball,
runs it with ESLint 6 through 10, and checks that fixed output is identical across them. A fixer must preserve
behaviour, so a rule that cannot prove a rewrite safe reports without fixing. The bundle targets Node 18 and the
source uses only ES2022 built-ins.

## Adding a rule

Each rule owns one directory under `src/rules/`, holding its implementation, its tests and its README. The
steps for adding one are in
[`.claude/skills/add-eslint-rule/SKILL.md`](https://github.com/Faran52/linteljs/blob/main/.claude/skills/add-eslint-rule/SKILL.md).

Beyond its own suite, a rule runs through two audits: `pnpm audit:real` runs every fixer over third-party
code, and `pnpm audit:negatives` breaks code a rule is silent on and checks that it then reports.

## License

MIT
