# @linteljs/eslint-config

[![npm](https://img.shields.io/npm/v/@linteljs/eslint-config.svg)](https://www.npmjs.com/package/@linteljs/eslint-config)
[![ci](https://github.com/Faran52/linteljs/actions/workflows/ci.yml/badge.svg)](https://github.com/Faran52/linteljs/actions/workflows/ci.yml)

Composable ESLint flat-config layers for TypeScript projects. Use `composeConfig` when you want the shared
layer order without hand-writing the stack.

```bash
npm install --save-dev @linteljs/eslint-config eslint typescript
```

It needs Node 18.18 or later, ESLint 9 or later, and TypeScript 5.0 up to 6.0, the range the bundled
typescript-eslint supports.

```js
// eslint.config.js
import { composeConfig } from '@linteljs/eslint-config/compose-config';

const config = await composeConfig({
  framework: 'react',
  typescript: true,
  vitest: true,
});

export default config;
```

`composeConfig` returns a flat-config array. Add your own blocks after it to override a rule or scope an
exception.

## Options

Each layer switch is off unless you enable it.

| Option | Effect |
| --- | --- |
| `framework` | Adds a framework layer: `'react'`, `'next'`, `'react-native'`, `'vue'`, `'nuxt'`, `'svelte'`, `'solid'`, or `'angular'`. `next` includes React, `nuxt` includes Vue, and `react-native` is React without the web accessibility preset. |
| `typescript` | Enables the TypeScript layer. |
| `vitest` | Enables rules for `*.test.*` and `*.spec.*` files. |
| `jest` | The same for a project on Jest, such as React Native on `jest-expo`. |
| `html` | Enables the HTML layer. |
| `astro` | Enables Astro rules for `.astro` templates, and widens `base` to them. It stacks with a framework layer rather than replacing one. |
| `libraries` | Adds any of `'tanstack-query'`, `'tanstack-router'`, `'tailwind'` and `'stylex'`. |
| `tailwindEntryPoint` | Path to the CSS file that contains `@import "tailwindcss"`, passed to the Tailwind layer. Ignored unless `libraries` includes `'tailwind'`. |
| `aliasExempt`, `enforceRelativeImports` | Options of `@linteljs/prefer-alias`, passed to the TypeScript layer. Ignored unless `typescript` is on. |
| `ignores`, `naming`, `folderNaming`, `aliases`, `resolver` | Passed through to `base` under the same names. |

Without `tailwindEntryPoint`, the Tailwind rules only reason about Tailwind's default theme. Point it at the
project stylesheet so the project's own tokens sort into the right group.

`frameworkGroup` is intentionally not a public option here. The composer reads it from the framework layer so
import sorting stays aligned with the framework that loaded it.

## Layer order

The composer applies the layers in this order: base, TypeScript, framework, library, Vitest, Jest, HTML, then
Astro.
Framework layers override shared layers. Vue and Svelte must come after TypeScript so their top-level parsers
can nest the TypeScript parser correctly. Astro is last for the same reason: it sets its own top-level parser for
`.astro` files, and any layer placed after it that carries a parser with no `files` glob would replace it.

`next()` and `nuxt()` stack on another layer: React comes first, then Next, and Vue first, then Nuxt. Angular
owns its template processing, so a generated Angular project does not add `html()`.

## Compose layers yourself

Use subpaths when the composer is not enough. Import only the layers you need, so you install only their peers.

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

Apply the same order yourself. The root export re-exports every layer except `composeConfig`, but importing it
loads every layer, so it needs every optional peer installed.

## Layers

| Export | Subpath | Purpose | Optional peers to install |
| --- | --- | --- | --- |
| `composeConfig(options?)` | `/compose-config` | Loads requested layers and orders them. | Those of the layers it loads. |
| `base(options?)` | `/base` | `@stylistic` layout, `import-x` module checks, import sorting, unused imports, file and folder naming, sonarjs, size caps, no magic numbers outside tests and config, at most three operators in one expression outside tests, `@linteljs/name-before-use`, `prefer-destructuring`, and the plugin's `recommended`. It works for JavaScript on its own. It extends the plugin's five TypeScript-only rules to `.vue` and `.svelte` files. The four React rules outside `recommended` arrive with `react()`, and `no-duplicate-jsx-props` with `solid()` too. | None. Its plugins are dependencies of this package. |
| `typescript(options?)` | `/typescript` | typescript-eslint's `strictTypeChecked`, `parameter-properties` (class properties only), its own `prefer-destructuring` in place of the core rule, and `@linteljs/prefer-alias`, which takes `aliasExempt` and `enforceRelativeImports`. JavaScript and HTML files get an untyped tail. | None beyond `typescript`. |
| `vitest()` | `/vitest` | Vitest recommended rules for test files. | `@vitest/eslint-plugin` |
| `jest()` | `/jest` | Jest recommended rules and globals for test files. | `eslint-plugin-jest` |
| `html()` | `/html` | HTML rules with its own parser. | `@html-eslint/eslint-plugin`, `@html-eslint/parser` |
| `astro()` | `/astro` | `.astro` template rules and accessibility, with its own parser. A file type, so it stacks with a framework layer rather than replacing one. | `eslint-plugin-astro` |
| `react()` | `/react` | `@eslint-react` with its stricter rules, React Hooks, JSX accessibility, the four `@eslint-react` DOM rules (`<button>` type, `<iframe>` sandbox, unsafe `target="_blank"`, `javascript:` URLs), sonarjs's React rules, and Lintel React rules. | `@eslint-react/eslint-plugin`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y-x` |
| `next()` | `/next` | Next's `core-web-vitals` rules, composed after `react()`, which brings the DOM rules. | `@next/eslint-plugin-next`, plus the peers of `react()`. |
| `reactNative()` | `/react-native` | React and React Hooks as `react()` has them, with this plugin's five React Native accessibility rules in place of JSX accessibility and the four DOM rules. | `@eslint-react/eslint-plugin`, `eslint-plugin-react-hooks` |
| `vue()` | `/vue` | Vue recommended rules and template accessibility, with TypeScript nested in the SFC parser. | `eslint-plugin-vue`, `vue-eslint-parser`, `eslint-plugin-vuejs-accessibility` |
| `nuxt()` | `/nuxt` | The two conventions Nuxt's build imposes, composed after Vue. | Those of `vue()`. |
| `svelte()` | `/svelte` | Svelte recommended rules with the same parser arrangement. Accessibility is the compiler's, reported by `svelte-check --fail-on-warnings`, not this layer's. | `eslint-plugin-svelte` |
| `solid()` | `/solid` | Solid TypeScript rules, JSX accessibility, and `sonarjs/jsx-no-leaked-render`, which needs `typescript()` beside it. | `eslint-plugin-solid`, `eslint-plugin-jsx-a11y-x` |
| `angular()` | `/angular` | Angular TypeScript rules, plus template rules and template accessibility. | `angular-eslint` |
| `tanstackQuery()` | `/tanstack-query` | TanStack Query recommended rules. | `@tanstack/eslint-plugin-query` |
| `tanstackRouter()` | `/tanstack-router` | TanStack Router recommended rules. | `@tanstack/eslint-plugin-router` |
| `tailwind(entryPoint?)` | `/tailwind` | better-tailwindcss's `recommended`: class order, line wrapping, and duplicate, conflicting, deprecated and non-canonical classes. Scripts, SFCs and `.astro` files. | `eslint-plugin-better-tailwindcss` |
| `stylex()` | `/stylex` | StyleX style validation, including a ban on the shorthands StyleX compiles to no CSS, plus multi-value shorthands, unused styles, legacy pseudo-class keys, `className` or `style` beside `stylex.props`, and tokens outside a `.stylex.ts` file. | `@stylexjs/eslint-plugin` |

## Base options

```ts
interface BaseOptions {
  ignores?: string[];
  naming?: NamingMap;
  folderNaming?: NamingMap;
  aliases?: AliasMap;
  frameworkGroup?: string[];
  resolver?: {
    project?: string;
    conditionNames?: string[];
    noWarnOnMultipleProjects?: boolean;
  };
  astro?: boolean;
}
```

Pass aliases to the composer instead of adding them in a later block. The base layer reads them for the
import-sort groups; resolution reads the tsconfig. Set `resolver.project` when the relevant tsconfig is not the one the
resolver finds from the working directory, `resolver.conditionNames` to override the export-map conditions the
resolver reads in, and `resolver.noWarnOnMultipleProjects` to silence the resolver's notice when `project` is a
glob matching more than one tsconfig. Set `astro` to give the frontmatter and template of a `.astro` file every
rule a script gets; the composer sets it with its own `astro` switch, and a hand-composed config sets it beside
`astro()`, which supplies the parser.

`base` also reads `.gitignore` from `process.cwd()` and turns what git ignores into what ESLint ignores. In a
monorepo that means the `.gitignore` of whichever directory ESLint was started from, so a package-level run picks
up that package's file and not the repository root's. Pass `ignores` for anything the root file covers.

## Import order

`simple-import-sort` groups imports in this order, one blank line between groups:

1. Node built-ins (`node:*`, `fs`, `path`).
2. The framework's own packages, from the framework layer.
3. Other packages.
4. Your aliases, in dependency order. Each bucket appears only when you declare one of its aliases:
   `@config`, `@typings`, `@styles`; then `@lib`, `@store`, `@services`, `@providers`, `@apis`, `@utils`,
   `@i18n`; then `@hooks`, `@composables`, `@primitives`; then `@ui`, `@features`, `@components`; then `@mocks`.
5. Any other alias you declare, in one group.
6. Parent imports, then sibling imports.
7. `import type` lines.
8. Stylesheets (`.css`, `.scss`).

## Why these layers exist

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

`pnpm smoke` packs the package and imports every export subpath, which catches an exports entry that builds but
fails for a consumer.

## License

MIT
