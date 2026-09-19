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
