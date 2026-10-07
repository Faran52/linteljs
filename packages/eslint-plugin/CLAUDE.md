# CLAUDE.md

`@linteljs/eslint-plugin`: rules for vertical layout, comment shape, import hygiene, modern idioms in
TypeScript and React, and React Native accessibility. The root `CLAUDE.md` applies; this file adds what is
the plugin's alone and wins inside the package.

## Hard rules

- **Autofix never changes behaviour.** A transform that cannot be proven safe ships as a suggestion or
  report-only.
- **Zero runtime dependencies.** No `dependencies` block. `eslint` is a peer, the rest are devDependencies.
- **The published floors hold.** `engines.node` is `>=22.0.0` and `peerDependencies.eslint` is `>=8.40.0`,
  and consumers install against both, so narrowing either is a silent break. Hence `tsdown.config.ts`
  targets `node22`, `tsconfig.src.json` holds `src/` to the ES2024 built-ins, and a rule reads only the
  context API 8.40 has (`context.sourceCode`, `context.physicalFilename`, `sourceCode.getScope(node)`).
  The eslintrc presets stay for ESLint 8 consumers.
- **No casts to satisfy a type, tests included.** Three survive as tracked debt; add none:
  `as RuleNode` in `preferArrowFunctionsRule.ts`, `{} as LintelConfigs` in `src/plugin.ts`,
  `as Partial<T>` in `src/utils/ruleUtils.ts`.
- **Arrow functions everywhere.** The plugin lints itself with `@linteljs/prefer-arrow-functions`.

## Layout

- `src/rules/<kebab-id>/` holds `<camelCaseExport>Rule.ts`, its test, `README.md` and a `utils/` for helpers only
  it reads; the directory name is the id, spelled once. No `index.ts` in a rule directory.
- `src/rules/registry.ts` is the registry and `registry.test.ts` holds the listing and each id
  to it; `src/index.ts` is the package barrel and `src/plugin.ts` assembles the presets.
- Adding a rule is the `add-eslint-rule` skill (`.claude/skills/add-eslint-rule/SKILL.md`).
- Two presets and no third: `recommended` (rules with `meta.docs.recommended`) and `all`, both derived from the
  registry. A layer that wants a group of rules names them itself.

## Where helpers go

- One rule's helper: that rule's `utils/<name>Utils.ts`.
- Shared between rules, `src/utils/`, one module each: `ruleUtils.ts` (ESLint's rule API: `createRule`,
  node aliases, `mustFind`, `optionsOf`, `resolveVariable`), `layoutUtils.ts` (reading or writing
  whitespace), `promiseChainUtils.ts` (the fluent-chain walk), `jsxUtils.ts` (JSX elements and attributes,
  typed structurally because ESTree has no JSX).
- Types in `src/types.ts`, data tables in `src/constants.ts`.
- Scripts: `scripts/<group>/<subject>/<subject><Group>.ts`, run through tsx and reporting through
  `create/templates/project/scripts/utils/loggerUtils.ts`. `build/` runs inside `pnpm build`,
  `release/` packs and proves the tarball, `audit/` runs the rules on third-party code.
  `release/run-rules/runRulesRelease.ts` runs on `node:22-alpine`, so it must parse on Node 22.

## Comments

The shipped testing standard's ban on comments in tests does not apply here: this repo is read to learn
how a rule is built. Keep comments to a short why, where the reason is not on the screen. Never restate
the code. Everything else in that standard stands.

## Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test:coverage` and `pnpm build` clean. Coverage is 100 on every
  axis; never lower a threshold.
- Run `--fix` on this repo after touching a fixer.
- Before a release: `pnpm smoke` (packs the tarball, runs ESLint through the ESM and CJS entries, scans
  the bundle for post-Node-22 APIs) and `pnpm compat` (ESLint 8.40 on eslintrc, 9 and 10 on flat config,
  byte-identical fixed text). Both need the network. CI runs them plus `oldest-runtime` on `node:22-alpine`
  with ESLint 8.40.0.
- The CJS build is `index.js`, not `.cjs`, so deep imports of it keep resolving;
  `scripts/build/dist-manifest/distManifestBuild.ts` marks `dist/` as `commonjs`.

## Tone

README, rule docs and every message: plain and direct. A rule message says what to do, in one line,
without apology. Nothing that reads as machine-written: no "delve", no "it's worth noting", no
three-item rhetorical lists.
