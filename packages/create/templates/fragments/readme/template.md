# {{PROJECT_NAME}}

{{TARGET_LABEL}}, scaffolded with [linteljs](https://www.npmjs.com/package/@linteljs/create).

## Commands

| what | command |
| --- | --- |
| lint | `{{RUN}} lint:fix`, then `{{RUN}} lint` |
| lint styles | `{{RUN}} lint:css` |
| typecheck | `{{RUN}} typecheck` |
{{TEST_ROWS}}| build | `{{RUN}} build` |
| full gate | `{{RUN}} check` |

`check` chains `{{CHECK_CHAIN}}`. It passes on a project one minute old, and coverage thresholds
are 100% rather than a number that moves. `package.json` is canonical for the rest, including
whatever the framework's own generator named its development server script.

## Where the standard lives

`eslint.config.js` composes layers from `@linteljs/eslint-config` and holds no rule logic of its own.
Fix a rule in that package and every project picks it up on update; do not add rules here that
belong in a layer. `stylelint.config.js` and `tsconfig.json` are emitted the same way.

`CLAUDE.md` and `.claude/rules/` carry the parts a linter cannot enforce: placement, import
direction, and how state works in this framework. `npx @linteljs/create sync` re-copies them from the
installed CLI, showing a diff and refusing to overwrite anything you have edited.

Git hooks run `scripts/checkBannedPatterns.ts`, `eslint --fix`, `stylelint --fix` and a typecheck
filtered to the staged files, and commit messages go through commitlint. They install with
`{{RUN}} install`.

Agent hooks live in `plugins/linteljs/hooks/`: they deny banned git operations, warn when eslint runs
without `--fix`, and run `scripts/checkBannedPatterns.ts` over each file an agent writes. Claude Code
and Codex load them through the linteljs plugin and run them with Node 22.18 or newer. Codex skips
plugin hooks until you trust them: run `/hooks` in Codex and trust the linteljs entries. Codex also
runs its own cached copy of the plugin, so after `sync` changes anything under `plugins/linteljs/`,
reinstall the linteljs plugin in Codex to pick the change up.

Cursor and Copilot run the same scripts from their own hooks files, written when you choose them.
Cursor reads `.cursor/hooks.json` once you trust the workspace: the git guard runs before each shell
command and the eslint warning after it. Cursor documents no file path for an agent's edit on an
event that can answer the agent, so there the banned-pattern check runs on commit only. If Claude
Code is chosen too, Cursor may also load Claude Code's copy of the hooks (Cursor Settings, Agents,
Third-Party Imports); that copy stays silent under Cursor, so each guard answers once. Copilot CLI
and the Copilot cloud agent read `.github/hooks/linteljs.json` with nothing to enable, and report
the eslint warning and the banned-pattern findings after the tool runs.
