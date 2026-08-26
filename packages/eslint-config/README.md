# @linteljs/eslint-config

[![npm](https://img.shields.io/npm/v/@linteljs/eslint-config.svg)](https://www.npmjs.com/package/@linteljs/eslint-config)
[![ci](https://github.com/Faran52/linteljs/actions/workflows/ci.yml/badge.svg)](https://github.com/Faran52/linteljs/actions/workflows/ci.yml)

Composable ESLint flat-config layers for TypeScript projects. Use `defineConfig` when you want the shared
layer order without hand-writing the stack.

```bash
npm install --save-dev @linteljs/eslint-config eslint
```

```js
// eslint.config.js
import { defineConfig } from '@linteljs/eslint-config/define-config';

const config = await defineConfig({
  framework: 'react',
  typescript: true,
  vitest: true,
});

export default config;
```

`defineConfig` returns a normal flat-config array. Add your own blocks after it to override a rule or scope an
exception.

## Options

Each layer switch is off unless you enable it.

| Option | Effect |
| --- | --- |
| `framework` | Adds a framework layer: `'react'`, `'next'`, `'vue'`, `'svelte'`, `'solid'`, or `'angular'`. `next` includes React. |
| `typescript` | Enables the TypeScript layer. |
| `vitest` | Enables rules for `*.test.*` and `*.spec.*` files. |
| `html` | Enables the HTML layer. |
| `astro` | Enables Astro rules for `.astro` templates. It stacks with a framework layer rather than replacing one. |
| `libraries` | Adds `'tanstack-query'` and/or `'tailwind'`. |
| `tailwindEntryPoint` | Path to the CSS file that contains `@import "tailwindcss"`, passed to the Tailwind layer. Ignored unless `libraries` includes `'tailwind'`. |
| `ignores`, `naming`, `folderNaming`, `aliases`, `resolver` | Passed through to `base` under the same names. |

Without `tailwindEntryPoint`, the Tailwind rules only reason about Tailwind's default theme. Point it at the
project stylesheet so the project's own tokens sort into the right group.

`frameworkGroup` is intentionally not a public option here. The composer reads it from the framework layer so
import sorting stays aligned with the framework that loaded it.

## Layer order

The composer applies the layers in this order: base, TypeScript, framework, library, Vitest, then HTML.
Framework layers override shared layers. Vue and Svelte must come after TypeScript so their top-level parsers
can nest the TypeScript parser correctly.

`next()` is the one framework layer that stacks: React comes first, then Next. Angular owns its template
processing, so a generated Angular project does not add `html()`.

## Compose layers yourself

Use subpaths when the composer is not enough. Import only the layers you need to avoid pulling in optional
peers for frameworks or libraries you are not using.

```js
import base from '@linteljs/eslint-config/base';
import typescript from '@linteljs/eslint-config/typescript';
import react, { reactGroup } from '@linteljs/eslint-config/react';

export default [
  ...base({ frameworkGroup: reactGroup, aliases: { /* ... */ } }),
  ...typescript(),
  ...react(),
];
```

Apply the same order yourself. The root export re-exports layers for convenience, but subpaths are the better
choice for a project config.

## Layers

| Export | Subpath | Purpose | Optional peers to install |
| --- | --- | --- | --- |
| `defineConfig(options?)` | `/define-config` | Loads requested layers and orders them. | Those of the layers it loads. |
| `base(options?)` | `/base` | Shared style, imports, unused imports, naming, complexity, and Lintel rules. It works for JavaScript on its own. Beyond the plugin's `recommended`, `base` enables `@linteljs/interface-order` everywhere and widens `@linteljs/union-newline`; the other three Lintel rules outside `recommended` arrive with `react()` and `solid()`. | None. Its plugins are dependencies of this package. |
| `typescript()` | `/typescript` | Strict type-aware rules and an untyped tail for JavaScript and HTML. | None. |
| `vitest()` | `/vitest` | Vitest recommended rules for test files. | `@vitest/eslint-plugin` |
| `html()` | `/html` | HTML rules with its own parser. | `@html-eslint/eslint-plugin`, `@html-eslint/parser` |
| `astro()` | `/astro` | `.astro` template rules and accessibility, with its own parser. A file type, so it stacks with a framework layer rather than replacing one. | `eslint-plugin-astro`, `astro-eslint-parser` |
| `react()` | `/react` | React, React Hooks, JSX accessibility, and Lintel React rules. | `@eslint-react/eslint-plugin`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y` |
| `next()` | `/next` | Next configuration, composed after React. | `@next/eslint-plugin-next`, plus the peers of `react()`. |
| `vue()` | `/vue` | Vue recommended rules and template accessibility, with TypeScript nested in the SFC parser. | `eslint-plugin-vue`, `vue-eslint-parser`, `eslint-plugin-vuejs-accessibility` |
| `svelte()` | `/svelte` | Svelte recommended rules with the same parser arrangement. Accessibility is the compiler's, reported by `svelte-check --fail-on-warnings`, not this layer's. | `eslint-plugin-svelte`, `svelte-eslint-parser` |
| `solid()` | `/solid` | Solid TypeScript rules and JSX accessibility. | `eslint-plugin-solid`, `eslint-plugin-jsx-a11y` |
| `angular()` | `/angular` | Angular TypeScript rules, plus template rules and template accessibility. | `angular-eslint` |
| `tanstackQuery()` | `/tanstack-query` | TanStack Query recommended rules. | `@tanstack/eslint-plugin-query` |
| `tailwind()` | `/tailwind` | Tailwind class-order, duplicate, and conflict checks. | `eslint-plugin-better-tailwindcss` |

Framework and library plugins are optional peer dependencies. Install the peers for layers you enable; the
column above names them per layer.

## Base options

```ts
interface BaseOptions {
  ignores?: string[];
  naming?: NamingMap;
  folderNaming?: NamingMap;
  aliases?: AliasMap;
  frameworkGroup?: string[];
  resolver?: { project?: string };
}
```

Pass aliases to the composer instead of adding them in a later block. The base layer uses them for both import
resolution and import-sort groups. Set `resolver.project` when the relevant tsconfig is not the one the
resolver finds from the working directory.

## Why these layers exist

The config is layered so a project only loads the plugins it chose. `defineConfig` makes that order a tested
public API instead of an undocumented convention.

`base` uses `import-x`'s TypeScript settings rather than a hand-written replacement. Those settings tell the
resolver which parser handles the file it resolved. Without them, `import-x/no-cycle` can miss cycles in
TypeScript files.

Vue turns off `@typescript-eslint/no-unsafe-argument` and `@typescript-eslint/no-unsafe-assignment` for `*.ts`
files only. TypeScript cannot resolve an SFC import there without Vue's tsserver plugin, while `vue-tsc
--noEmit` checks the same seam. SFC scripts remain covered by the nested parser.

## Development

```bash
pnpm build
pnpm typecheck
pnpm smoke
```

`pnpm smoke` packs the package and imports every export subpath. It catches an exports entry that builds
successfully but fails for a consumer.

## License

MIT
