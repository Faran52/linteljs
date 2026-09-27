# CLAUDE.md

`@linteljs/eslint-plugin`. A published ESLint plugin: 23 rules for vertical layout, comment shape,
import hygiene, modern idioms in TypeScript and React, and React Native accessibility. Public repo,
published to npm, so everything in it is outward-facing.

The rules were lifted from `~/Projects/self-portfolio/tools/eslint`, where they ran unbundled and
local-only. That version is not the source of truth any more. This repo owns them.

## 1. Hard rules

- **No em-dashes.** Anywhere. Not in code comments, JSDoc, docs, README, commit messages or rule
  descriptions. Commas, colons, parentheses.
- **Nothing that reads as machine-written.** No "delve", no "it's worth noting", no three-item
  rhetorical lists, no comment that restates the line below it. If a comment does not say why,
  delete it.
- **Zero runtime dependencies.** `package.json` has no `dependencies` block and must not grow one.
  `eslint` is a peer, everything else is a devDependency.
- **No casts to satisfy a type, anywhere, including tests.** A cast means the fixture is wrong.
  Five survive and are tracked debt, with no new ones added. Three narrow an ESLint node to the
  shape the traversal actually hands over: `as RuleNode` in
  `prefer-arrow-functions/preferArrowFunctions.ts`, `as ImportNode` in
  `import-newlines/importNewlines.ts`, `as PropertyNode[]` in
  `member-newline/memberNewline.ts`. The other two are not that shape and were
  undercounted here until a review found them: `{} as LintelConfigs` in `plugin.ts`, a `Record`
  keyed by a union that cannot be built incrementally without one, and `as Partial<T>` in
  `utils/ruleUtils.ts`, which `.claude/rules/type-standards.md` carries in its own exempt table.
  `plugin.ts` and not `index.ts`: the preset assembly moved out of the barrel and both the cast and
  the `Partial<>` went with it.

  `utils/compatUtils.ts` needs none: it describes both ESLint shapes as one interface with every
  member optional, which a real context satisfies structurally. `union-newline/unionNewline.ts`
  used to carry a sixth, `(node.parent?.type as string)`, suppressing a real TS2367 rather than narrowing
  anything; it reads `mustFind(node.parent).type` into a `string` now, because ESLint types `parent`
  as ESTree and a TypeScript node type genuinely does occur there.
- **A test that cannot fail is not a test.** Break the rule, watch the suite go red, revert.
- **Autofix must never change behaviour.** A fix that alters what the program does is a bug report
  waiting to happen against a public package. If a transform cannot be proven safe, it ships as a
  suggestion or as report-only.

## 2. Conventions

- **pnpm 12 only** to develop, Node 26 to develop, and neither is what the package declares.
  `engines.node` is `>=14.0.0` and `peerDependencies.eslint` is `>=5.0.0`, matching what is
  published: `@linteljs/eslint-plugin` has installs against those floors and narrowing them is a silent
  break. That is why `tsdown.config.ts` targets `node14`, why no rule uses `findLast`,
  `findLastIndex` or `toSorted`, and why `utils/compatUtils.ts` exists.
- **Arrow functions everywhere.** The plugin lints itself with its own
  `@linteljs/prefer-arrow-functions`, so this is enforced, not a preference.
- `"type": "module"`, so `scripts/` is TypeScript run through tsx, `tsx
  scripts/<group>/<subject>/<subject><Group>.ts`, with no build step: `build/` runs
  inside `pnpm build`, `release/` packs the tarball and proves it, `audit/` points the rules at real
  third-party code. Each script is the ring shape below: `audit/real-code/realCodeAudit.ts`, its own
  `utils/*Utils.ts` and `constants.ts`, and what several scripts in a group read in the group's `utils/`.
  `tsconfig.json` includes `scripts/**/*.ts`, so they are typechecked and type-aware linted like
  anything else, and they report through the shipped
  `create/templates/project/scripts/utils/loggerUtils.ts`.
  `release/run-rules/runRulesRelease.ts` is the exception twice over: CI builds it with tsdown into a `.mjs` on the
  host, `--target node14`, and runs that on a bare `node:14-alpine`, so its syntax is what Node 14 parses, and it writes
  to `process.stdout`, since nothing above the package is copied in. `stryker.config.mjs` stays
  JavaScript, the only extension Stryker's config discovery looks for.
  Linting comes from the workspace root's `eslint.config.ts`, which carries this package's two
  documented rule exemptions.
- A rule is a `kebab-case` directory named after its id, and everything that rule owns lives in it:
  `<camelCaseExport>.ts`, `<camelCaseExport>.test.ts`, `README.md`, and a `utils/` subdirectory for
  the helpers only that rule uses. The implementation file is named for its single export, which is
  the repo-wide convention, so the directory is the one place the kebab-case id is written and
  nothing has to translate between two spellings of it. No rule directory holds an `index`:
  `src/index.ts` is the package's barrel, and `src/rules/index.ts` is the registry, code rather than
  a barrel, with `index.test.ts` beside it. `README.md` rather than the camelCase filename because
  GitHub renders a directory's README when you browse to it, which is what makes `meta.docs.url`
  point at the directory and land on the doc and the source at once.
- `package.json` is canonical for package manager, engines, dependencies and scripts.

## 3. Adding a rule

Five steps. The type system catches a missed one in the first two, and `src/meta.test.ts` catches
the rest.

1. `src/rules/<kebab-case>/<camelCaseExport>.ts`, built with `createRule('<kebab-case>', { ... })` from
   `src/utils/ruleUtils.ts`. `language` and `recommended` are compulsory. `fixShape` is optional and only for
   a rule with a fixer: it says what that fixer may do to the token stream, and `fixerSafety.test.ts`
   is what holds it to the claim.
2. One line in the `rules` object in `src/rules/index.ts`.
3. `src/rules/<kebab-case>/<camelCaseExport>.test.ts`.
4. `src/rules/<kebab-case>/README.md`.
5. An entry in `__mocks__/ruleMetadata.json`. It is a golden file of every rule's public surface:
   messages, schema, type, fixable and the four `docs` fields, `fixShape` among them. `meta.test.ts` asserts it covers
   exactly the registered rules, so a new rule without one fails, and an accidental change to an
   existing message or schema fails too.

Steps 1, 3 and 4 are the same directory, read back rather than probed at three derived paths:
`src/rules/index.test.ts` holds the listing of `src/rules/` against the registry in both directions,
and each id to the rule its own directory exports, and `meta.test.ts` holds each directory's files,
less what sits directly under `utils/`, equal to the three names derived from the id. A directory
nobody registered fails, and so does a leftover `index.ts` or half a rename. The `*Utils` suffix under `utils/` is the lint naming map's, not the
suite's.

`src/ruleModules.test.ts` needs no step: it reads the same listing and imports each rule inside a
test body, checking the module exports the rule under the module's own name. It is its own file
because `meta.test.ts` imports the barrel statically: a rule that throws while its module is
evaluated takes that file down as a failed file with no test results, which Stryker reads as a
surviving mutant. Imported inside the test body it is one ordinary failure with the rule's name on
it.

Code shared *between* rules lives in five modules under `src/utils`, and a helper belongs to
exactly one of them: `ruleUtils.ts` for the names ESLint's rule API is reached through (`createRule`,
`docsUrl`, the node type aliases, `mustFind`, `rangeOf`, `optionsOf`, `rebuildLosesComments`,
`resolveVariable`, `FUNCTION_TYPES`), `layoutUtils.ts` for anything that reads or writes whitespace, `promiseChainUtils.ts` for the
fluent-chain walk the two promise rules share, `compatUtils.ts` for anything that reads an
accessor ESLint moved between majors, and `jsxUtils.ts` for reading a JSX element: its name, its
attributes, the value behind one, and the walk down its children. Each has a colocated test file. `src/types.ts` holds types only, and the published tables
`FIX_SHAPES`, `RULE_LANGUAGES` and `TYPESCRIPT_FILES` are data in `src/constants.ts`.

`jsxUtils.ts` is where the five React Native accessibility rules get their node shapes. JSX is
absent from ESLint's ESTree types, so it describes what those rules read as structural interfaces
with every field optional, which a real parsed node satisfies without a cast. The cost is that a
few reads (`elementAttributesOf`, `propertiesOf`, `elementsOf`, and the declining arm of each
guard) can only be reached by calling them directly, which is what `jsxUtils.test.ts` does and
why that file is shaped the way it is rather than driving everything through a rule.

Code one rule owns stays in that rule's own `utils/` subdirectory. Splitting it out into
`src/utils` used to be the wrong move for a single-consumer helper, and out of a flat `rules/` it
broke one-rule-per-file; a `utils/` beside the rule is where it belongs, because a helper sitting
as a sibling of the rule reads like a second rule. Five rules carry one today:

- `destructuring-property-newline/utils/commaUtils.ts`, the comma-to-newline fix that declines when a
  comment sits in the gap it would reflow.
- `prefer-arrow-functions/utils/writeUtils.ts`, the emitter (function node in, arrow text out), and
  `utils/safetyUtils.ts`, the layer that decides whether a rewrite is allowed at all.
- `import-newlines/utils/writeUtils.ts`, the same emitter split: statement in, replacement text
  out. Answering with a string rather than a fix is what lets the rule measure a collapsed import
  against the line limit before deciding to report it.
- `member-newline/utils/boundaryUtils.ts`, where a member begins and ends once its comments
  are counted, and the layout analysis read off those boundaries. Two of that rule's defects lived
  there, and both fix strategies plus the whole report ladder are decided from it.
- `react-no-global-namespace/utils/elementUtils.ts`, the walk from a JSX element down to the tag
  names reaching a namespace, and `utils/nameUtils.ts`, the one read of a node's `name`. JSX is
  absent from ESLint's ESTree types, so both describe what they read structurally, which is the
  same reason `src/utils/jsxUtils.ts` is shaped that way.

The `Utils` suffix is enforced wherever the directory is called `utils`: the root
`eslint.config.ts` maps `**/utils/*.ts` to `*Utils` through `check-file`, which now reaches a rule's
own `utils/` as well as `src/utils`. That is the reason the helpers moved into one rather than
staying beside the rule under a convention nothing checked. Neither count above is derived, and
both are only as true as the last person who read them.

The presets and the docs URL derive from the registry, so do not hand-maintain those. The
README rule table is **not** derived: no script writes it. `meta.test.ts` checks that its rows name
every rule id once, in id order, and nothing about the other columns, so a wrong description or a
missing options column passes. Edit it by hand and read it back.

There are two presets and there is no third. `recommended` carries the rules with
`meta.docs.recommended`, `all` carries every rule, and a rule's subject lives in its id rather than
in a preset name: `native-*` is React Native accessibility and `react-*` is React. A group of
rules a layer wants is named by that layer, which is what
`frameworks/react-native/reactNativeFramework.ts` does with the five accessibility rules and
`frameworks/utils/reactCoreUtils.ts` with the three React ones.

## 3b. Comments

The testing standard this workspace ships (`packages/create/templates/fragments/claude-rules/testing.standard.md`)
bans comments in tests. That rule came from a private app and **does not apply here**. This repo is public and people will read it to learn how a rule is built, so:

- Comments are minimal: a short why, or none. Only where the reason is not on the screen: why a fixture
  is shaped that way, why a branch exists, what a fix deliberately does not do.
- Do not narrate. A comment restating the line below it gets deleted.

Everything else in that standard stands, in particular no casts and no test that cannot fail.

## 4. Verification

Claim nothing that has not been run.

- `pnpm lint`, `pnpm typecheck`, `pnpm test:coverage` and `pnpm build` clean.
- The bundler is **tsdown** (rolldown), not tsup. It emits `index.mjs`/`index.d.mts` for ESM and
  `index.js`/`index.d.ts` for CJS, and the `exports` map names those exactly. The CJS half is
  `.js` rather than `.cjs` because ESLint 5's config loader switches on the extension and sends a
  `.cjs` main to its YAML branch; `scripts/build/dist-manifest/distManifestBuild.ts` drops a `dist/package.json`
  marking the directory `commonjs` so Node still reads it correctly under `"type": "module"`.
  Sourcemaps are off on purpose: tsdown drives the declaration sourcemap from the
  same flag and emits a `sourceMappingURL` for a `.map` it never writes.
- Coverage thresholds are 100 across lines, branches, functions and statements. They are a gate,
  not a target, and lowering one to make a build pass is not an option.
- `pnpm smoke` packs the tarball and runs a real ESLint against it through both the ESM
  and the CJS entry point. Unit tests cannot catch a broken `exports` map or a missing entry in
  `files`. Run it before any release.
- `peerDependencies.eslint` is `>=5.0.0`, and a rule that only works on one major is broken. No
  rule reads `context.sourceCode`, `context.physicalFilename` or
  `sourceCode.getScope`/`getAncestors`/`getDeclaredVariables` directly: each moved between majors,
  and `utils/compatUtils.ts` reads the modern shape first and the legacy one second. Its own test
  drives both, because the legacy half cannot execute on the ESLint this suite runs against and
  would otherwise sit uncovered forever.
- `pnpm compat` is what turns that from a declaration into a fact. It packs the
  tarball, installs ESLint 5, 6, 7, 8, 9 and 10 side by side, and lints one fixture that trips
  every universal rule in `recommended`, through `.eslintrc.json` on 5 to 8 and flat config on 9
  and 10, so both published preset shapes are exercised by a real consumer. It then asserts every
  major emits byte-identical fixed text. Network and minutes, so it is not in `check`; run it
  before any release. It found the seven rules still destructuring `sourceCode` off the context,
  which the whole unit suite passed straight through.
- The Node floor cannot be proven the same way, because the matrix runs every ESLint on whichever
  Node invoked it. `smokeRelease.ts` greps the bundle for APIs newer than Node 14 instead: a bundler
  downlevels `?.` and leaves `array.at(-1)` exactly where it was.
- CI runs all of the above. `.github/workflows/ci.yml` carries the gate, the two packed-artifact
  smokes, the six-major ESLint matrix, and an `oldest-runtime` job that runs the built bundle
  inside `node:14-alpine`. That container job is the only thing that can
  prove the declared Node floor: a bundler lowers syntax and leaves built-in methods where they
  were, so `smokeRelease.ts`'s scan for post-Node-14 APIs is a cheaper check of the same property rather
  than a substitute for running it.
- Grep the diff for em-dashes before committing, same as any outward artifact.

## 5. Defects found in the ported rules, and how

Every one was confirmed by a failing test or a real run before being fixed. Kept here because the
same mistakes are the ones a new rule will make.

- `prefer-arrow-functions` converted a function called above its own declaration, turning working
  code into a `ReferenceError`. Now reports under its own message with no fix. Found by reading,
  confirmed by running the fixer.
- `prefer-catch` rewrote `then(a, b)` into `catch(b).then(a)`, a different program, and on
  `then(a, b, extra)` deleted the middle argument. Replaced by `prefer-try-catch`, report-only.
- `no-import-namespace-destructure` resolved names in the immediate scope only, so it was dead
  inside any function or block. Now walks the scope chain.
- `import-newlines`, `member-newline`, `export-specifier-newline` and `union-newline` all
  emitted fixes at column 0. Found by running `--fix` on this repo.
- `member-newline` counted a doc comment between members as a blank line, so every
  documented interface reported forever with no fix that could satisfy it.
- The CJS entry exposed no `meta`, because a `.cjs` config gets the namespace rather than the
  default export. Found by the release smoke.
- The bundle carried a side-effect `require('eslint')` even though every import was type-only:
  `verbatimModuleSyntax` keeps the statement for `import { type X }`. Found by loading the packed
  artifact rather than by reading the source.

The lesson each time: dogfooding and running the artifact found things reading the code did not.

## 6. Tone

Applies to the README, the rule docs and every error message, not just to chat. Plain and direct.
A rule message tells the reader what to do, in one line, without apology. Short sentences. If a
line does not sound like something Faran would say out loud, rewrite it.
