# {{PROJECT_NAME}}

{{TARGET_LABEL}}, scaffolded with [linteljs](https://www.npmjs.com/package/@linteljs/create). Needs Node 22.18 or
newer.

## Commands

| what | command |
| --- | --- |
| lint | `{{RUN}} lint:fix`, then `{{RUN}} lint` |
| lint styles | `{{RUN}} lint:css` |
| typecheck | `{{RUN}} typecheck` |
{{TEST_ROWS}}| build | `{{RUN}} build` |
| full gate | `{{RUN}} check` |

{{WORKSPACE}}`check` chains `{{CHECK_CHAIN}}`. It passes on a new project, and coverage thresholds are 100%. `package.json`
is canonical for every other script.

## Where the standard lives

- `eslint.config.ts` composes layers from `@linteljs/eslint-config` and holds no rule logic of its own, so a
  rule fixed there reaches this project on update. `stylelint.config.js` and `tsconfig.json` are emitted the
  same way.
- The rules a linter cannot enforce (placement, import direction, types, state, tests) are in
  `plugins/linteljs/skills/linteljs/references/`, copied to `.github/instructions/` for Copilot,
  `.cursor/rules/` for Cursor and `.agents/rules/` for Antigravity when you chose them. Each chosen agent's own file (`CLAUDE.md`, `AGENTS.md`,
  `.github/copilot-instructions.md`, `.cursor/rules/linteljs.mdc`) points at them and is yours to edit.
- `{{SYNC}}` rewrites `plugins/linteljs/`, then asks before it moves the `@linteljs/*` versions,
  adds the ESLint config's missing peers, or backs up a changed `eslint.config.ts` to `.bak` and writes a fresh one.
  `--yes` accepts every step.

## Hooks

Git hooks run `scripts/checkBannedPatterns.ts`, `eslint --fix`, `stylelint --fix` and a typecheck of the staged
files, and commitlint checks each message. They install with `{{RUN}} install`.

Agent hooks live in `plugins/linteljs/hooks/`: they deny banned git operations, warn when eslint runs without
`--fix`, run `scripts/checkBannedPatterns.ts` over each file an agent writes, deny an edit to a file whose first
line marks it generated, and ask you before a dependency is added or removed. In Claude Code a commit is held
until `{{RUN}} check` has passed on the work tree it would commit, run on its own or redirected to a file outside
the work tree (leading `NAME=value` assignments are fine), never piped or chained, and a band above the prompt shows that state.

- **Claude Code and Codex** load them through the linteljs plugin. Codex skips plugin hooks until you trust
  them (`/hooks` in Codex), and runs a cached copy of the plugin, so reinstall it after a `sync` that changes
  `plugins/linteljs/`.
- **Cursor** reads `.cursor/hooks.json` once you trust the workspace: the git guard before each shell command,
  the eslint warning after it. Cursor gives a hook no path for an agent's edit, so the banned-pattern check runs
  on commit only and the generated-file guard not at all. With Claude Code chosen too, Cursor may also load Claude Code's hooks (Cursor Settings,
  Agents, Third-Party Imports); that copy stays silent under Cursor, so each guard answers once.
- **Gemini CLI** reads `.gemini/settings.json` once you trust the folder: the git and generated-file guards
  before a tool, the eslint warning and the banned-pattern findings after it. Antigravity runs no hooks.
- **Copilot** CLI and cloud agent read `.github/hooks/linteljs.json` with nothing to enable, and report the eslint
  warning and the banned-pattern findings after the tool runs.
