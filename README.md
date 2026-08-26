# lintel

[![npm](https://img.shields.io/npm/v/@linteljs/create.svg)](https://www.npmjs.com/package/@linteljs/create)
[![ci](https://github.com/Faran52/linteljs/actions/workflows/ci.yml/badge.svg)](https://github.com/Faran52/linteljs/actions/workflows/ci.yml)

Lint, type-check, and test standards for TypeScript projects, shipped as three packages: a scaffolder, a
shared ESLint flat config, and the custom rules behind it.

```bash
npm create @linteljs
```

The scaffolder runs the framework's own generator first, then layers the lintel standard on top. The result
is a project with ESLint flat config, TypeScript settings, git hooks, test setup, and coding-agent rules,
ready for React, Next.js, Vue, Svelte, Solid, Angular, Astro, React Native through Expo, and Manifest V3 web
extensions.

Other package managers, the long forms, and the Yarn 1 caveat are in the
[create package README](packages/create).

## The gate

Every generated project starts with a single command:

```bash
npm check
```

It runs linting, CSS linting, type-checking, coverage, and the build. Coverage thresholds are 100%.

## Packages

| Package | Use it for |
| --- | --- |
| [`@linteljs/create`](packages/create) | Start a project or bring an existing one under the standard. |
| [`@linteljs/eslint-config`](packages/eslint-config) | Compose ESLint flat-config layers. |
| [`@linteljs/eslint-plugin`](packages/eslint-plugin) | Use the custom rules behind the config. |

## Existing projects

Lintel applies to an existing repository without scaffolding it:

```bash
npx @linteljs/create --skip-scaffold
```

Later, review what an update would change before it touches anything:

```bash
npx @linteljs/create sync
```

`sync` diffs Lintel-owned files against the versions on disk and writes nothing until `--force` is passed.
It plans from `lintel.config.json`, so it never guesses a framework or overrides recorded choices.

## Why

Copied configuration drifts quietly: a missing setting can disable a rule while two config files still look
alike. Lintel keeps the shared rules in a published package and the generated files explicit, so an update
arrives as a reviewable diff. [DESIGN.md](DESIGN.md) carries the reasoning, including the non-goals.

## Development

```bash
pnpm install
pnpm check
```

Requires Node 24+ and pnpm 11. `pnpm check` runs the same chain a generated project gets. The networked
end-to-end suite is separate: `pnpm --filter @linteljs/create test:e2e` scaffolds every target for real and
runs each generated gate.

## License

MIT
