# @linteljs/create

[![npm](https://img.shields.io/npm/v/@linteljs/create.svg)](https://www.npmjs.com/package/@linteljs/create)
[![ci](https://github.com/Faran52/linteljs/actions/workflows/ci.yml/badge.svg)](https://github.com/Faran52/linteljs/actions/workflows/ci.yml)

Create a TypeScript project that starts with a passing gate: a starter app with its tests, ESLint flat config,
Stylelint, TypeScript settings, git hooks, and coding-agent rules and hooks.

| Runner | Create alias | Direct run |
| --- | --- | --- |
| pnpm | `pnpm create @linteljs my-app` | `pnpm dlx @linteljs/create my-app` |
| npm | `npm create @linteljs my-app` | `npx @linteljs/create my-app` |
| Yarn | `yarn create @linteljs my-app` | `yarn dlx @linteljs/create my-app` |
| Bun | `bun create @linteljs my-app` | `bunx @linteljs/create my-app` |

Then `cd my-app` and run `check` (`pnpm check`, `npm run check`, and so on).

## Requirements

- Node 22.18.0 or newer, both to run `create` and in the project it writes: the first 22.x release that strips
  types by default, so the project's TypeScript scripts and hooks run with plain `node`.
- The manager that runs `create` becomes the project's, at its exact version: pnpm 10.26+, npm 9.6.5+, Yarn 4+,
  or Bun 1.2+. A manager below its floor is refused, never upgraded; Yarn 1 is refused as not supported.
- With pnpm's `minimumReleaseAge` set, the project starts on the newest versions older than the window. To start
  on today's, pass `pnpm --config.minimum-release-age=0 create @linteljs my-app` (the kebab-case spelling; the
  camel-case one is ignored as a flag), and use the same flag for the first install.

## What a run does

It asks the questions below, then runs five stages, each skippable with `--skip <stage>`:

1. **lint:** ESLint and Stylelint config.
2. **package:** `package.json`, TypeScript config, `.gitignore`, `linteljs.config.json`, and the manager's
   config (`pnpm-workspace.yaml`, `.yarnrc.yml` or `bunfig.toml`).
3. **standard:** the agent plugin and hooks, git hooks and commit checks, the CI workflow, test setup, the starter
   source and its tests.
4. **install:** the project's package manager.
5. **fix:** ESLint and Stylelint with `--fix`.

The generated `eslint.config.js` calls `composeConfig` from `@linteljs/eslint-config/compose-config`, which fixes
the layer order. `check` runs lint, the banned-pattern check, Stylelint, the typecheck, coverage at 100% (unless
`--testing none`), and the build.

The starter is linteljs's own, not a framework scaffolder's. Every target but the web extension gets a header with
tabs, Home, About and Version pages, and a status page for each 403, 404 and crash the target can produce. It follows the system colour scheme at WCAG AA
contrast in both, carries a description meta and, where a public directory is served, a `robots.txt`. It ships
the chosen languages and remembers the choice; the server-rendered targets read it from a `language` cookie and
render it from the first byte. It passes its own `check` before you change a line.

## Questions and options

Every answer is a terminal question, a flag, or a key in `linteljs.config.json`. A question is asked only where
the target offers it. Passing any answer flag makes the run non-interactive, with defaults for the rest.

| Question | Flag | Choices | Default |
| --- | --- | --- | --- |
| Project name | positional | a valid npm package name, scoped or not; the directory drops the scope | the name `package.json` records, else the directory's |
| Framework | `--target` | `react`, `next`, `vue`, `nuxt`, `svelte`, `solid`, `angular`, `astro`, `webextension`, `react-native` | `react` |
| Browser | `--browser` | `chrome`, `firefox` (webextension) | `chrome` |
| Surfaces | `--surfaces` | `popup`, `background`, `devtools-panel` (webextension) | `popup,background` |
| UI framework | `--hosted` | `react`, `vue`, `svelte`, `solid` (webextension, astro) | none |
| Testing | `--testing` | `vitest`, `none` (react-native runs the suites on Jest, through `jest-expo`) | `vitest` |
| Libraries | `--libraries` | `zod`, `es-toolkit`, `ts-pattern`, `t3-env` | `es-toolkit` |
| Styling | `--styling` | `tailwind`, `stylex` (StyleX not on angular or react-native) | none |
| Form library | `--form` | `tanstack-form`, `react-hook-form` (React Hook Form on React renderers only) | none |
| Router | `--router` | `react-router`, `react-router-framework`, `tanstack-router` (react) | none |
| State store | `--store` | the stores the target offers | none |
| Data fetching | `--data` | `tanstack-query`, `rtk-query` (with `redux-toolkit`) | none |
| API mocking | `--mocking` | `msw` | none |
| Languages | `--languages` | `en`, `ar`, `ja`, `ko`, `zh-CN`, `zh-TW`, with English always shipped (a webextension needs a popup) | none |
| Type safety | `--type-safety` | `strict`, `relaxed` | `strict` |
| AI agents | `--agents` | `claude-code`, `codex`, `copilot`, `cursor` | `claude-code` |
| AI plugins | `--plugins` | `ponytail`, `context7`, `frontend-design` | all three |

A list takes comma-separated values or the flag repeated.

```bash
npx @linteljs/create my-app --target svelte --libraries zod,es-toolkit --testing none
```

```text
@linteljs/create [name] [options]
@linteljs/create sync [options]

  --existing        run in this directory, which already exists, rather than making <name>/
  --no-install      skip the install and the eslint --fix pass that needs it
  --seed            with --existing, plant the starter and seed files a new project is born with
  --skip <stage>    skip a stage: lint, package, standard, install, fix (repeatable)
  --yes, -y         accept the defaults, ask nothing; sync: apply without asking
  --version, -v
  --help, -h
```

Without a terminal, a run needs `--yes` or an answer flag; a name alone writes nothing and exits 1. With no name
it takes the directory's. Ctrl+C writes nothing.

## Existing projects and updates

```bash
npx @linteljs/create --existing
npx @linteljs/create sync
npx @linteljs/create sync --yes
```

`--existing` applies the standard in place, reading `linteljs.config.json` if it exists and asking otherwise; it
never guesses a framework.

`sync` updates only what linteljs owns: its hooks, scripts and configs, and the `@linteljs/*` versions in
`package.json`, which it moves only when they are behind. It shows one table of the files to add, update or delete
and the versions to upgrade, then asks once. `--yes` applies without asking; without a terminal and without
`--yes` it writes nothing and exits 1. A dependency the project lacks is printed as an install command for its
package manager, never written. After its first write, `sync` never rewrites your other dependencies or
`package.json` scripts, `.github/workflows/ci.yml`, `vite.config.ts`, `vitest.config.ts`, `jest.config.js`, `astro.config.mjs`,
`angular.json`, Expo's `app.json`, `linteljs.config.json`, your README, the starter source, or an agent's
instruction file. Removing an agent from the config removes only the exact paths linteljs wrote for it, and
dropping any other answer removes what it alone wrote. Nor does `sync` switch a test runner: where `package.json`
installs one runner and the target now runs another, as a React Native project from before 2.0 does, it writes
nothing and exits 1, since the suites, setup and test scripts it would strand are yours to port.

## Agents

`plugins/linteljs/` holds one plugin every chosen agent reads: the rules as skill references, and hooks that deny
banned git operations, warn when ESLint runs without `--fix`, and check each file an agent writes for banned
patterns. The hooks inspect commands, never run them. In Claude Code a fourth hook warns once when a session's
context passes 150K tokens, and `.claude/settings.json` adds a `[CTX nK]` badge for the session and for each
subagent: green, amber past 130K, red past 150K. A status line of your own is kept.

| Path | Written for | Owned by |
| --- | --- | --- |
| `plugins/linteljs/` | every project | linteljs |
| `CLAUDE.md`, `.claude/settings.json` | Claude Code | you; linteljs merges its entries into the settings |
| `AGENTS.md`, `.agents/plugins/marketplace.json` | Codex | you; linteljs |
| `.github/copilot-instructions.md`, `.github/instructions/`, `.github/hooks/linteljs.json` | Copilot | you; linteljs |
| `.cursor/rules/`, `.cursor/hooks.json` | Cursor | you for `linteljs.mdc`; linteljs merges its hook entries |

Nothing is installed on your behalf: your agent asks you to trust the directory and approve the plugin and hooks,
and the project passes its gate if you decline. Codex runs plugin hooks only once trusted through `/hooks`, and
runs a cached copy of the plugin, so reinstall it after a `sync` that changes `plugins/linteljs/`. Cursor has no
edit event a hook can answer, so there the banned-pattern check runs on commit only.

## More

[docs/DESIGN.md](https://github.com/Faran52/linteljs/blob/main/docs/DESIGN.md) carries the reasoning and the
non-goals. The config layers are
[`@linteljs/eslint-config`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-config), and the rules
behind them [`@linteljs/eslint-plugin`](https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin).

## License

MIT
