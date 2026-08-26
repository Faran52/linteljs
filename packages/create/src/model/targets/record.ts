import type {
  AliasMap,
  Answers,
  Framework,
  NamingMap,
  TargetId,
} from '../answers/answers';

// `create` runs a create-shorthand (`pnpm create vite`); `dlx` runs a binary with no create alias (`pnpm dlx sv
// create`).
export type ScaffoldKind = 'create' | 'dlx';

export interface ScaffoldSpec {
  kind: ScaffoldKind;
  args: string[];
}

export interface TsconfigPlugin {
  name: string;
}

// A test shipped with the project, covering the code its scaffolder just wrote. See README.
export interface StarterTest {
  // Relative to `assets/`.
  source: string;
  target: string;
  // The file it imports. Written only when that file exists.
  covers: string;
}

// A file the generator named against convention, and the name `run/repair` moves it to, repointing every specifier
// that named it.
export interface StarterRename {
  // Both relative to the project root.
  from: string;
  to: string;
}

// A source file the scaffolder never wrote, copied onto disk once at birth; the project owns it from then on.
export interface StarterFile {
  // Relative to `assets/`.
  source: string;
  target: string;
}

// One repair to a generator's starter code. `run/repair` owns when these run, and why.
export interface StarterFix {
  // Exact path, relative to the project root. No globbing: these are known generator files.
  path: string;
  // Absent when the file is correct where it stands and only its location is the defect.
  transform?: (source: string) => string;
  // Destination for a misplaced file; the original is removed (example: `create-vue`'s demo store, moved out of
  // `src/stores/`).
  moveTo?: string;
}

// One vitest project; `include` matters as much as `extensions`, since a test written against the native implementation
// fails once the web variant resolves under it.
export interface TestPlatform {
  name: string;
  extensions: string[];
  include: string[];
  exclude?: string[];
}

// A plugin as written into a config file. Shared by `vite.config.ts` and `vitest.config.ts`.
export interface PluginSpec {
  imports: string[];
  calls: string[];
  /**
   * Helper declarations emitted between the imports and the config, for a plugin assembled rather than called: the
   * React Compiler's Babel pass is an async factory so it can pin itself to the `pre` group ahead of SWC. Absent on
   * every spec that names its plugins directly.
   */
  prelude?: string[];
}

// The framework's hook equivalent; `label` exists so Solid can name its own "primitives" rather than "Hooks". Absent on
// Angular and the extension target, which have no such slot.
export interface HooksSlot {
  label: string;
  path: string;
}

/**
 * The store a yes to the state-store question brings; absent where there is no choice to make, so the question is never
 * asked: Solid and Svelte ship theirs inside the framework (`solid-js/store`, runes), and an MV3 service worker is torn
 * down between events, so extension state belongs in `chrome.storage` rather than memory.
 */
export interface StoreSlot {
  // Printed in the prompt, so a yes names what it chooses.
  label: string;
  // The runtime package a yes installs; absent on Vue, whose `--pinia` flag has `create-vue` install Pinia itself.
  dependency?: string;
}

export interface TsconfigDelta {
  jsx?: 'react-jsx' | 'preserve';
  jsxImportSource?: string;
  plugins?: TsconfigPlugin[];
  useDefineForClassFields?: boolean;
  // Angular only. Parameter properties are not erasable, so the flag is absent, not `false`.
  dropsErasableSyntaxOnly?: boolean;
  // Angular only: `noEmit` in tsconfig makes ngtsc emit nothing, falling back to Vite's transform, which can't read a
  // decorator; `typecheck` passes `--noEmit` on the command line instead.
  dropsNoEmit?: boolean;
  include?: string[];
  // Ambient `@types/*` beyond the shared set; once populated this becomes an allow-list, so an installed-but-unlisted
  // package (`@types/chrome`) still lints its calls as unresolved.
  types?: string[];
  /**
   * The base config a framework supplies: SvelteKit's `.svelte-kit/tsconfig.json` (from `svelte-kit sync`) for
   * `$app/*`, ambient declarations and route types, and Expo's `expo/tsconfig.base`. An extending config replaces
   * rather than merges `paths`, so `$lib` is re-declared separately.
   */
  extends?: string;
}

// One record per target; everything that varies between the scaffolds lives here, so emitters stay free of
// `switch (target)`.
export interface TargetRecord {
  id: TargetId;
  label: string;
  // The exact argv the pipeline runs. Answers included, so it cannot be a constant.
  scaffold: (name: string, answers: Answers) => ScaffoldSpec;
  // One value, not a list: the composer owns the order and sort bucket.
  framework?: Framework;
  // Angular's template processor covers markup, so the html layer would double-report there.
  html: boolean;
  // The `.astro` layer, asked for as a file type rather than a framework, so it stacks with a hosted one.
  astro?: true;
  // Decides two things that must agree: whether `vite.config.ts` is written, and whether `vite/client` lands in
  // tsconfig `types`.
  vite: boolean;
  // The single-file-component extension, where the framework has one; drives the stylelint syntax, the `lint:css` glob,
  // coverage include and `type-standards.md` frontmatter.
  sfcExtension?: 'vue' | 'svelte';
  /**
   * The global stylesheet this target's scaffolder writes and already wires, quoted as the tailwind layer's
   * `entryPoint` so the plugin reads the project's own theme instead of Tailwind's defaults. Verified per scaffolder,
   * because the path is theirs, not this CLI's. Absent on Svelte: `sv create --template minimal` ships no stylesheet
   * at all, so there is nothing to name.
   */
  styleEntry?: string;
  // Where routes live, quoted into CLAUDE.md and the repo-structure rule.
  routeUnit: string;
  // Absent where the framework has none: Angular uses DI, plain TypeScript uses `lib/`.
  hooksSlot?: HooksSlot;
  // What the state-store question offers this target; absent, the question is not asked.
  store?: StoreSlot;
  // Whether the browser question is asked for this target. The extension target is the only one it means anything to.
  hostsBrowser?: true;
  // Whether the UI-framework question is asked. Set on a target that renders with a framework but is not one.
  hostsFramework?: true;
  ignores: string[];
  naming: NamingMap;
  // Kebab-case everywhere, except a target whose routes are files needs `[slug]`/`(tabs)` allowed rather than excluded
  // by path; the two shapes are named in `model/naming`.
  folderNaming: NamingMap;
  hooksAlias?: AliasMap;
  // Aliases only this target has, merged at the tail of the lib family so ordering holds.
  extraAliases?: AliasMap;
  // Shared aliases this target lacks; plain TypeScript's `repo-structure.md` has no `lib/store/`, so aliasing it
  // would name nothing.
  omitAliases?: string[];
  tsconfig: TsconfigDelta;
  // Names this scaffolder imports as values although they are types, keyed by module; `rewriteScaffoldedSource` adds
  // inline `type` so `verbatimModuleSyntax` accepts it.
  typeOnlyImports?: Record<string, string[]>;
  /**
   * What this target contributes to `vite.config.ts` `plugins`. Required, and empty on the three targets that own no
   * vite config: they return before `emitViteConfig` reads it, so an optional field would only add a branch no answer
   * can reach.
   */
  vitePlugin: PluginSpec;
  // Plugins `vitest.config.ts` needs. Only a non-Vite target can need one.
  vitestPlugin?: PluginSpec;
  /**
   * A factory the emitted vitest config is passed to instead of `defineConfig`. Astro is the only user: its Vite
   * options live in `astro.config.mjs` and `getViteConfig` is the documented way to hand them to vitest, since there is
   * no `vite.config.ts` to merge.
   */
  vitestFactory?: { imports: string[];
    call: string; };
  // Coverage exclusions beyond the shared set: modules with no branch to miss.
  coverageExclude?: string[];
  // Resolve conditions for the test run only; without `browser`, vitest loads Svelte's server build and `mount()`
  // throws `lifecycle_function_unavailable`.
  testConditions?: string[];
  // Source the scaffolder does not write, copied once at birth (never re-synced) and regardless of the testing answer,
  // since the manifest references it either way.
  starterFiles?: StarterFile[];
  /**
   * Extra Rollup inputs, for a page the build has to produce and no config names for it. crx derives its inputs from
   * the manifest, so this is for a page the manifest does not mention: a devtools panel, which its devtools page opens
   * at runtime.
   */
  viteInputs?: Record<string, string>;
  starterTests?: StarterTest[];
  // Files this generator named against the standard, renamed onto it at birth; Expo is the only user, since every other
  // generator already writes convention-compliant names.
  starterRenames?: StarterRename[];
  // Seeds PROJECT_SKIPPED for this target's starter tests; React Native's native-module mocks need `unknown`/`any`
  // shapes the strict floor otherwise bans.
  exemptsStarterTests?: true;
  // Repairs to this generator's own starter code. Fresh scaffolder output only.
  starterFixes?: StarterFix[];
  // Files the generator wrote that nothing references once lintel's own are in place, removed on fresh output only;
  // Angular's `tsconfig.app.json`/`tsconfig.spec.json` aren't in this class, since `angular.json` names both.
  staleScaffoldFiles?: string[];
  // One vitest project per platform; React Native resolves `foo.web.tsx` over `foo.tsx` on web, so without a separate
  // project per platform's `resolve.extensions`, one variant never executes and the coverage gate lies.
  testPlatforms?: TestPlatform[];
  // A birth-only template filled with the project name, relative to `assets/`; the extension's `manifest.json` is the
  typecheck: string;
  // A `build` script for a scaffolder that writes none; React Native only, since `eas build` needs a remote account and
  // `expo export` is what proves the app bundles instead.
  build?: string;
  // What runs on install before `husky`, for a framework that generates something the gate reads; SvelteKit's `svelte-
  // kit sync` writes the `.svelte-kit/tsconfig.json` the emitted tsconfig extends.
  prepare?: string;
  // Scripts beyond the shared set, for a target with a way of running itself the gate does not cover.
  extraScripts?: Record<string, string>;
  // Runtime dependencies this target brings, beyond what its scaffolder installs; a hosted framework is the user.
  dependencies?: string[];
  devDependencies: string[];
  // Testing libraries the starter test needs. Installed only when vitest is selected.
  testDevDependencies?: string[];
  // Packages needing install scripts, beyond the shared two; pnpm aborts with `ERR_PNPM_IGNORED_BUILDS` when one is
  // missing, so an omission is an uninstallable project.
  allowBuilds: string[];
  // Framework-reactivity rule asset, relative to `assets/claude-rules/`.
  stateRules: string[];
  // The `__mocks__/setupTests` source. Overridden only where a test environment is needed.
  testSetup?: string;
  // Appends the router mocks to that setup. Set where one of the mocked bindings exists for this target's framework:
  // `react-router` and `@tanstack/react-router` on the React family, `@tanstack/solid-router` on Solid.
  routerMocks?: true;
}
