<p align="center">
  <img src="https://raw.githubusercontent.com/Faran52/linteljs/main/packages/create/templates/starter-source/shared/public/favicon.svg" alt="linteljs" width="96">
</p>

<h1 align="center">linteljs</h1>

<p align="center">Lint, type-check and test standards for TypeScript projects.</p>

<p align="center">
  <a href="https://github.com/Faran52/linteljs/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/Faran52/linteljs/ci.yml?branch=main&logo=github&style=for-the-badge" alt="Build Status"></a>
  <a href="https://github.com/Faran52/linteljs/actions/workflows/ci.yml?query=branch%3Amain"><img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2FFaran52%2Flinteljs%2Fbadges%2Fcoverage.json&style=for-the-badge" alt="Coverage"></a>
  <a href="https://www.npmjs.com/package/@linteljs/create"><img src="https://img.shields.io/npm/v/@linteljs/create.svg?style=for-the-badge" alt="npm"></a>
  <a href="https://www.npmjs.com/package/@linteljs/create"><img src="https://img.shields.io/node/v/@linteljs/create?style=for-the-badge" alt="Node"></a>
</p>

linteljs ships as three packages: a scaffolder, a shared ESLint flat config, and the custom rules behind it. The
scaffolder writes a starter app with its tests, ESLint flat config, TypeScript settings, git hooks, and
coding-agent rules and hooks, for React, Next.js, Vue, Nuxt, Svelte, Solid, Angular, Astro, React Native through
Expo, Manifest V3 web extensions, and plain TypeScript libraries. Its `check` runs lint, the banned-pattern check,
CSS lint, the typecheck, coverage at 100% when the project has tests, and the build, and passes on the first run.

## Quick start

Node 22.18 or newer.

<details open>
<summary>npm</summary>

```sh
npm create @linteljs my-app
cd my-app
npm run check
```

</details>

<details>
<summary>pnpm</summary>

```sh
pnpm create @linteljs my-app
cd my-app
pnpm check
```

</details>

<details>
<summary>yarn</summary>

```sh
yarn create @linteljs my-app
cd my-app
yarn run check
```

</details>

<details>
<summary>bun</summary>

```sh
bun create @linteljs my-app
cd my-app
bun run check
```

</details>

For an existing project, `npx @linteljs/create --existing` applies the standard in place, and `sync`, run through
the project's own manager, updates it. The
[`@linteljs/create` README](packages/create/README.md#existing-projects-and-updates) has the details.

## Packages

| Package | Version | Use it for |
| --- | --- | --- |
| [`@linteljs/create`](packages/create/README.md) | [![npm](https://img.shields.io/npm/v/@linteljs/create.svg?style=for-the-badge)](https://www.npmjs.com/package/@linteljs/create) | Start a project, or bring an existing one under the standard. |
| [`@linteljs/eslint-config`](packages/eslint-config/README.md) | [![npm](https://img.shields.io/npm/v/@linteljs/eslint-config.svg?style=for-the-badge)](https://www.npmjs.com/package/@linteljs/eslint-config) | Compose ESLint flat-config layers, by hand or through `composeConfig`. |
| [`@linteljs/eslint-plugin`](packages/eslint-plugin/README.md) | [![npm](https://img.shields.io/npm/v/@linteljs/eslint-plugin.svg?style=for-the-badge)](https://www.npmjs.com/package/@linteljs/eslint-plugin) | Use the rules on their own. `recommended` holds the ones the config builds on. |

## Why

Copied configuration drifts quietly: a missing setting disables a rule while two config files still look alike.
linteljs keeps the shared rules in a published package and the generated files explicit, so an update arrives as
a reviewable diff.

## Documentation

- [docs/DESIGN.md](docs/DESIGN.md): the decisions the code cannot show, and the non-goals.
- Each package's README, linked above: every option, flag and rule.

## Contributing

```sh
pnpm install
pnpm check
```

Needs Node 26.10.0+ and pnpm 12.6+. [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) covers the rest, including the
networked end-to-end suite.

## License

[MIT](LICENSE)
