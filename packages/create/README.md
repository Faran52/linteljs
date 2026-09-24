# @linteljs/create

[![npm](https://img.shields.io/npm/v/@linteljs/create.svg)](https://www.npmjs.com/package/@linteljs/create)
[![ci](https://github.com/Faran52/linteljs/actions/workflows/ci.yml/badge.svg)](https://github.com/Faran52/linteljs/actions/workflows/ci.yml)

Create a TypeScript project with the framework's own scaffolder, then layer in linteljs's shared standard:
ESLint flat config, TypeScript settings, git hooks, test setup, and coding-agent rules.

| Runner | Create alias | Direct run |
| --- | --- | --- |
| pnpm | `pnpm create @linteljs my-app` | `pnpm dlx @linteljs/create my-app` |
| npm | `npm create @linteljs my-app` | `npx @linteljs/create my-app` |
| Yarn | `yarn create @linteljs my-app` | `yarn dlx @linteljs/create my-app` |
| Bun | `bun create @linteljs my-app` | `bunx @linteljs/create my-app` |

The manager that runs `create` is the project's, and the project keeps it. Both Yarns count: a Yarn 4 run
writes a Yarn 4 project, and a Yarn 1 run writes a Yarn 1 project, recorded as `yarn-classic`. `yarn create`
reaches this CLI on either, because the package provides a binary called `create` as well as
`create-linteljs`, which is what `yarn create @scope` on Yarn 1 looks for. `yarn dlx` exists only from Yarn 2,
so on Yarn 1 use the create alias.

A Yarn 1 project is the one shape that cannot gate its install scripts. pnpm has `allowBuilds`, npm has
`allowScripts`, Bun has `trustedDependencies` and Yarn 4 has `enableScripts`; Yarn 1 runs every one of them
and has no setting that says otherwise. Everything else in the standard is the same.

If you use pnpm with `minimumReleaseAge` set, nothing breaks: pnpm resolves the newest version of each dependency
that is older than your window, and the project starts there. To start on today's instead, the override goes before
`create`, in the kebab-case pnpm's CLI takes. The camel-case spelling is the one `pnpm-workspace.yaml` uses and is
silently ignored as a flag:

```bash
pnpm --config.minimum-release-age=0 create @linteljs my-app
```

The same applies to the project's own first install: a lockfile written with the window off is rejected by a later
`pnpm install` with the window on, so use the flag for both or neither.

## Requirements

Node 22 (22.13.0 or newer to run `create`; the project it writes declares 22.18 or newer, the first release that
runs its TypeScript scripts and hooks with plain `node`), and the package manager that runs `create`, which the project then keeps: pnpm
10.26 or newer, npm 9.6.5 or newer, Yarn 4 or newer, Yarn 1.22.22, or Bun 1.2 or newer. Nothing is installed on your
behalf: a manager below its floor is refused with the reason, rather than upgraded behind your back.

## What you get

The CLI guides you through a project questionnaire, then runs the official generator and layers the linteljs
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

The generated `eslint.config.js` uses `composeConfig` from `@linteljs/eslint-config/compose-config`. The
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

The CLI runs each scaffolder through the manager that ran `create`, React Native included: `create-expo` 5
normalises npm 12's pack output, which is what used to force that one target through npm. The pnpm spellings
are not hard-coded into an npm, Yarn, or Bun project.

The generated project declares that manager three ways: `packageManager` with the exact version that ran
`create`, `engines` with the floor above, and `devEngines.packageManager` with `onFail: "error"`, which npm 11
and pnpm both enforce. Bun gets `engines.bun` and no `packageManager`, since neither corepack nor pnpm's own
switch knows Bun.

The project name argument uses lowercase letters, digits, dots, dashes and underscores, starts with a letter
or digit, is not one of npm's reserved names, and is at most 214 characters. Anything past the name is
rejected rather than ignored. Leave the name out to answer that question in the CLI, or to take the name of
the directory you are in.

## Questions and options

Every answer is a question in the terminal, a flag on the command line, or a key in `linteljs.config.json`.
A question is asked only where the target has a slot for it.

| Question | Flag | Choices | Default | Asked on |
| --- | --- | --- | --- | --- |
| Project name | positional | a valid npm package name | the directory's name with `--yes` | every run that scaffolds |
| Framework | `--target` | `react`, `next`, `vue`, `svelte`, `solid`, `angular`, `astro`, `webextension`, `react-native` | `react` | every target |
| Browser | `--browser` | `chrome`, `firefox` | `chrome` | webextension |
| Surfaces | `--surfaces` | `popup`, `background`, `devtools-panel` | `popup,background` | webextension |
| UI framework | `--hosted` | `react`, `vue`, `svelte`, `solid`, or none | none | webextension, astro |
| Testing | `--testing` | `vitest`, `none` | `vitest` | every target |
| Libraries | `--libraries` | `zod`, `tanstack-query`, `tailwind`, `es-toolkit`, `ts-pattern`, `t3-env` | `tailwind` | every target |
| Form library | `--form` | `tanstack-form`, `react-hook-form` (React only), or none | none | every target |
| Router | `--router` | `react-router`, `tanstack-router`, or none | none | react |
| State store | `--store` | the stores that target offers, or none | none | every target but the extension |
| Type safety | `--type-safety` | `strict`, `relaxed` | `strict` | every target |
| AI agents | `--agents` | `claude-code`, `codex` | `claude-code` | every target |
| AI plugins | `--plugins` | `ponytail`, `context7`, `frontend-design` | all three | when an agent was chosen |

A list flag takes comma-separated values or the flag repeated. Passing any answer flag makes the run
non-interactive: the answers not given take their defaults, the way `--yes` takes all of them.

```bash
npx @linteljs/create my-app --target svelte --libraries zod,es-toolkit --testing none
```

What the libraries bring:

- **Zod** adds `lib/apis/` to the layout and, beside React Hook Form, `@hookform/resolvers`.
- **TanStack Query** and **TanStack Form** install the binding for the target's framework and, for Query, its
  ESLint rules. A host with no UI framework installs neither.
- **Tailwind CSS** wires `@tailwindcss/vite` or PostCSS and the class-order rules. React Native takes NativeWind 5,
  with `metro.config.js`, `nativewind-env.d.ts` and the NativeWind imports in `src/global.css`.
- **es-toolkit**, **ts-pattern** and **t3-env** are runtime dependencies only; Next gets `@t3-oss/env-nextjs`.

What the router brings, on React (Vite):

- **React Router** in declarative form: `src/routes/router.tsx` holds the table, `src/main.tsx` mounts the
  provider. A page lives in `src/pages/<kebab>/{Name}Page.tsx` and is named in the table once.
- **TanStack Router** in file-based form: `src/routes/__root.tsx` and `src/routes/index.tsx`, the Vite plugin
  ahead of React's, its ESLint rules, and a committed `src/routeTree.gen.ts` the plugin regenerates on every
  run. The tree is generated code: ESLint, coverage and the banned-pattern checker all skip it.

Both routers' `useNavigate` is mocked in the test setup, so a navigation asserts without a mounted router.

```text
@linteljs/create [name] [options]
@linteljs/create sync [options]

  --existing        run in this directory, which already exists, rather than making <name>/
  --no-install      skip the install and the eslint --fix pass that needs it
  --seed            with --existing, plant the starter and seed files a new project is born with
  --skip <stage>    skip a stage: lint, package, standard, install, fix (repeatable)
  --yes, -y         accept the defaults, ask nothing
  --force           sync: overwrite without asking
  --version, -v
  --help, -h
```

The CLI refuses a non-interactive run unless you pass `--yes` or an answer flag. With no name argument it uses
the directory's, so `mkdir my-app && cd my-app && create --yes` needs nothing else. Ctrl+C writes nothing.

A run numbers each stage as it starts and ends with what to do next:

```text
@linteljs/create 1.6.0
[1/5] lint: eslint and stylelint config
...
[3/5] standard: hooks, agent files, test setup and starter tests
  wrote CLAUDE.md
  ...
[5/5] fix: eslint and stylelint --fix
  eslint --fix: 3 files changed

Done. Next:
  cd my-app
  pnpm check
```

With `--no-install` the next steps start with the install and the fix pass that needs it. `sync` opens with
how many files would change, then one diff per file.

## Existing projects and updates

```bash
npx @linteljs/create --existing
```

If `linteljs.config.json` already exists, the CLI uses it and asks nothing. Otherwise it asks the questionnaire.
It does not guess a framework for an existing project. Pass `--yes` only when you want defaults.

`linteljs.config.json` records answers at the project root. Edit it, then use `sync` to review the output:

```bash
npx @linteljs/create sync
npx @linteljs/create sync --force
```

The first command shows one diff per file and writes nothing. `--force` applies the planned files. Sync
updates the plugin, host declarations, and emitted ESLint, Stylelint, TypeScript, Vite, and Vitest config. It
does not replace `package.json`, `.gitignore`, `pnpm-workspace.yaml`, your README, or your `CLAUDE.md` and
`AGENTS.md` after their first write. It also leaves `linteljs.config.json` untouched.

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
for banned patterns. They inspect command payloads, Bash and PowerShell alike. They do not execute commands.
Each is a TypeScript file in `plugins/linteljs/hooks/` that both hosts run with `node`, so a project needs Node
22.18 or newer. Codex runs plugin hooks only once you trust them through `/hooks`, and runs a cached copy of the
plugin, so reinstall it in Codex after a `sync` that changes `plugins/linteljs/`.

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
