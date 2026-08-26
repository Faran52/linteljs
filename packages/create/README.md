# @linteljs/create

[![npm](https://img.shields.io/npm/v/@linteljs/create.svg)](https://www.npmjs.com/package/@linteljs/create)
[![ci](https://github.com/Faran52/linteljs/actions/workflows/ci.yml/badge.svg)](https://github.com/Faran52/linteljs/actions/workflows/ci.yml)

Create a TypeScript project with the framework's own scaffolder, then layer in lintel's shared standard:
ESLint flat config, TypeScript settings, git hooks, test setup, and coding-agent rules.

| Runner | Create alias | Direct run |
| --- | --- | --- |
| pnpm | `pnpm create @linteljs my-app` | `pnpm dlx @linteljs/create my-app` |
| npm | `npm create @linteljs my-app` | `npx @linteljs/create my-app` |
| Yarn 2+ | `yarn create @linteljs my-app` | `yarn dlx @linteljs/create my-app` |
| Bun | `bun create @linteljs my-app` | `bunx @linteljs/create my-app` |

Yarn 1 cannot use `yarn create @scope` for this package. It looks for a binary called `create`, but this
package provides `create-linteljs`. Use `npx @linteljs/create my-app` with Yarn 1.

If you use pnpm and `minimumReleaseAge` is set, the override has to come before `create`:

```bash
pnpm --config.minimumReleaseAge=0 create @linteljs my-app
```

## Requirements

Node 24 or newer is required.

## What you get

The CLI guides you through a project questionnaire, then runs the official generator and layers the lintel
standard on top. The result is a project that starts with a working gate and a consistent setup across
frameworks.

The process runs in six stages:

1. **Scaffold:** runs the official framework generator.
2. **Lint:** writes ESLint and Stylelint config.
3. **Package:** updates package metadata, TypeScript config, `.gitignore`, and pnpm workspace config.
4. **Standard:** writes the agent plugin, hooks, commit checks, test setup, starter tests, and target config.
5. **Install:** runs the chosen package manager.
6. **Fix:** runs ESLint and Stylelint with `--fix`.

Every generated target is TypeScript. A fresh project starts with `pnpm check`, which runs linting, CSS
linting, type-checking, coverage, and the build. Coverage thresholds are 100%, and starter tests live beside
scaffolded code so the setup proves itself immediately.

The generated `eslint.config.js` uses `defineConfig` from `@linteljs/eslint-config/define-config`. The
composer fixes layer order and keeps framework import-sort groups aligned with the base layer. A project can
still compose exported layers by hand.

## Targets

| Target | Official scaffolder |
| --- | --- |
| React | Vite |
| Next.js | Create Next App |
| Vue | create-vue |
| Svelte | sv |
| Solid | Vite |
| Angular | Angular CLI |
| Astro | create-astro |
| React Native | Expo |
| Web Extension | Vite, then a Manifest V3 layer |

The CLI runs each scaffolder through the package manager selected in the questionnaire. The pnpm spellings are
not hard-coded into an npm, Yarn, or Bun project.

React Native needs **npm 11 on PATH** when using the current published Expo scaffolder. `create-expo-app`
shells out to `npm pack --dry-run --json`, and npm 12 returns an object where npm 11 returned an array, so
the scaffold fails before writing a file with `Could not parse JSON returned from "npm pack"`. That is
[expo/expo#48091](https://github.com/expo/expo/issues/48091). Node 24 bundles npm 12, so this bites by
default: `npm i -g npm@11` first, and undo it once a fixed `create-expo-app` ships.

The project name argument uses lowercase letters, digits, dots, dashes and underscores, starts with a letter
or digit, is not one of npm's reserved names, and is at most 214 characters. Anything past the name is
rejected rather than ignored. Leave the name out to answer that question in the CLI, or to take the name of
the directory you are in.

## Questions and options

The questionnaire covers project name, framework, testing, package manager, libraries, an optional state
store, type safety, AI agents, and AI plugins. A question is asked only where the target has a slot for
it. A target without a store choice does not ask for one, and the extension target additionally asks for
its browser, surfaces (popup, background, devtools panel), and the UI framework it hosts, while Astro asks
only for the last of those.

`--yes` accepts defaults, including React, Vitest, pnpm, strict type safety, Claude Code, and all three AI
plugins.

```text
@linteljs/create [name] [options]
@linteljs/create sync [options]

  --skip-scaffold   run stages 2-6 against an existing repository
  --no-install      skip install and the ESLint fix pass
  --fresh           with --skip-scaffold, treat the directory as new scaffolder output
  --skip <stage>    skip scaffold, lint, package, standard, install, or fix (repeatable)
  --yes, -y         accept defaults, ask nothing
  --force           sync: overwrite without asking
  --help, -h
```

The CLI refuses a non-interactive run unless you pass `--yes`. With no name argument it uses the directory's,
so `mkdir my-app && cd my-app && create --yes` needs nothing else. Ctrl+C writes nothing.

## Existing projects and updates

```bash
npx @linteljs/create --skip-scaffold
```

If `lintel.config.json` already exists, the CLI uses it and asks nothing. Otherwise it asks the questionnaire.
It does not guess a framework for an existing project. Pass `--yes` only when you want defaults.

`lintel.config.json` records answers at the project root. Edit it, then use `sync` to review the output:

```bash
npx @linteljs/create sync
npx @linteljs/create sync --force
```

The first command shows one diff per file and writes nothing. `--force` applies the planned files. Sync
updates the plugin, host declarations, and emitted ESLint, Stylelint, TypeScript, Vite, and Vitest config. It
does not replace `package.json`, `.gitignore`, `pnpm-workspace.yaml`, your README, or your `CLAUDE.md` and
`AGENTS.md` after their first write. It also leaves `lintel.config.json` untouched.

Removing an agent from the config can remove that agent's Lintel-owned declaration on the next `sync --force`.
It only removes exact paths the CLI owns.

## Agents

Choose Claude Code, Codex, or both. The generated `plugins/linteljs/` directory holds one shared plugin for
selected hosts. Host-specific files point to it instead of copying the standard.

| Path | Written for | Ownership after creation |
| --- | --- | --- |
| `plugins/linteljs/` | Every project | Lintel |
| `.claude/settings.json` | Claude Code | Shared: Lintel merges its plugin entries into what you have |
| `.agents/plugins/marketplace.json` | Codex | Lintel |
| `CLAUDE.md` | Claude Code | You |
| `AGENTS.md` | Codex | You |

The declarations do not install anything. Your agent asks you to trust the directory, install any declared
plugin, and approve hooks when you open the project. The project still lints, builds, and passes its gate if
you decline.

The hooks warn about ESLint without `--fix`, reject banned git operations, and check each file an agent writes
for banned patterns. They inspect command payloads. They do not execute commands.

## Why this is shared

Copied configuration drifts: a project silently loses a rule while its config still looks like the others.
Lintel puts shared rules in `@linteljs/eslint-config`, keeps generated files reviewable through `sync`, and
leaves framework scaffolding to each official generator. [DESIGN.md](https://github.com/Faran52/linteljs/blob/main/DESIGN.md)
carries the reasoning, including the non-goals.

## Related packages

- [`@linteljs/eslint-config`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-config): composable ESLint flat-config layers.
- [`@linteljs/eslint-plugin`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin): the custom rules behind them.

## License

MIT
