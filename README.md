# linteljs

[![npm](https://img.shields.io/npm/v/@linteljs/create.svg)](https://www.npmjs.com/package/@linteljs/create)
[![ci](https://github.com/Faran52/linteljs/actions/workflows/ci.yml/badge.svg)](https://github.com/Faran52/linteljs/actions/workflows/ci.yml)

Lint, type-check and test standards for TypeScript projects, shipped as three packages: a scaffolder, a shared
ESLint flat config, and the custom rules behind it.

```bash
npm create @linteljs my-app
cd my-app
npm run check
```

The scaffolder writes a starter app with its tests, ESLint flat config, TypeScript settings, git hooks, and
coding-agent rules and hooks, for React, Next.js, Vue, Nuxt, Svelte, Solid, Angular, Astro, React Native through
Expo, and Manifest V3 web extensions. `check` runs lint, the banned-pattern check, CSS lint, the typecheck,
coverage at 100% when the project has tests, and the build, and it passes on the first run. Generated projects need Node 22.18 or newer.

## Packages

| Package | Use it for |
| --- | --- |
| [`@linteljs/create`](packages/create) | Start a project, or bring an existing one under the standard. Every package manager, option and flag is in its README. |
| [`@linteljs/eslint-config`](packages/eslint-config) | Compose ESLint flat-config layers, by hand or through `composeConfig`. |
| [`@linteljs/eslint-plugin`](packages/eslint-plugin) | Use the 26 rules on their own. `recommended` holds the ones the config builds on. |

## Existing projects

```bash
npx @linteljs/create --existing
npx @linteljs/create sync
```

`--existing` applies the standard in place. `sync` rewrites `plugins/linteljs/`, then asks before each
other step: the `@linteljs/*` versions, the ESLint config's peers, and a changed ESLint config, which it backs up
to `.bak` first. `--yes` accepts every step. It plans from `linteljs.config.json`, so it never
guesses a framework or overrides a recorded choice.

## Why

Copied configuration drifts quietly: a missing setting disables a rule while two config files still look alike.
linteljs keeps the shared rules in a published package and the generated files explicit, so an update arrives as
a reviewable diff. [docs/DESIGN.md](docs/DESIGN.md) carries the reasoning, including the non-goals.

## Development

```bash
pnpm install
pnpm check
```

Needs Node 26.10.0+ and pnpm 12.6+. [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) covers the rest, including the
networked end-to-end suite (`pnpm --filter @linteljs/create test:e2e`).

## License

MIT
