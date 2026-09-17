import type {
  AliasMap,
  Answers,
  Framework,
  Library,
  NamingMap,
  PackageManager,
  Router,
  TargetId,
} from '../answers/answers';

// `create` runs a create-shorthand (`pnpm create vite`); `dlx` runs a binary with no create alias.
export type ScaffoldKind = 'create' | 'dlx';

export interface ScaffoldSpec {
  kind: ScaffoldKind;
  // `[scaffolder, name, ...flags]`: `scaffoldCommand` relies on the name sitting second.
  args: [string, string, ...string[]];
  // Runs the scaffolder through this manager rather than the answered one. For a scaffolder that shells out to npm
  // whatever launched it, so launching it through anything else only adds a layer that can break on its own.
  via?: PackageManager;
}

export interface TsconfigPlugin {
  name: string;
}

// A test shipped with the project, covering code its scaffolder wrote.
export interface StarterTest {
  // Relative to `assets/`.
  source: string;
  target: string;
  // Written only when this file exists.
  covers: string;
}

// A file the generator named against convention, moved by `run/repair` with every specifier repointed.
export interface StarterRename {
  // Both relative to the project root.
  from: string;
  to: string;
}

// Copied once at birth; the project owns it from then on.
export interface StarterFile {
  // Relative to `assets/`.
  source: string;
  target: string;
  // Written only when this library was chosen.
  library?: Library;
  // Written only when this router was chosen.
  router?: Router;
}

// One repair to a generator's starter code; `run/repair` owns when these run.
export interface StarterFix {
  // Exact path: these are known generator files.
  path: string;
  // Absent when only the location is the defect.
  transform?: (source: string) => string;
  // Destination for a misplaced file; the original is removed.
  moveTo?: string;
}

// One vitest project; `include` matters as much as `extensions`, or a web variant resolves under a native test.
export interface TestPlatform {
  name: string;
  extensions: string[];
  include: string[];
  exclude?: string[];
}

// A plugin as written into `vite.config.ts` or `vitest.config.ts`.
export interface PluginSpec {
  imports: string[];
  calls: string[];
}

// `label` lets Solid say "primitives" rather than "Hooks". Absent on Angular and the extension target.
export interface HooksSlot {
  label: string;
  path: string;
}

// Absent where there is no choice: Solid and Svelte ship a store, and MV3 state belongs in `chrome.storage`.
export interface StoreSlot {
  // Printed in the prompt.
  label: string;
  // Absent on Vue, whose `--pinia` flag has `create-vue` install Pinia itself.
  dependency?: string;
}

export interface TailwindSlot {
  // What the style entry imports instead of `@import "tailwindcss";`.
  imports: string[];
  dependencies: string[];
  devDependencies: string[];
}

export interface TsconfigDelta {
  jsx?: 'react-jsx' | 'preserve';
  jsxImportSource?: string;
  plugins?: TsconfigPlugin[];
  useDefineForClassFields?: boolean;
  // Angular only: parameter properties are not erasable.
  dropsErasableSyntaxOnly?: boolean;
  // Angular only: `noEmit` makes ngtsc emit nothing, so `typecheck` passes `--noEmit` on the command line.
  dropsNoEmit?: boolean;
  include?: string[];
  // Once populated this is an allow-list: an installed but unlisted `@types/chrome` still lints as unresolved.
  types?: string[];
  // A base config the framework supplies. An extending config replaces `paths`, so `$lib` is re-declared.
  extends?: string;
}

// One record per target, so emitters stay free of `switch (target)`.
export interface TargetRecord {
  id: TargetId;
  label: string;
  // Answers included, so it cannot be a constant.
  scaffold: (name: string, answers: Answers) => ScaffoldSpec;
  // One value: the composer owns the order.
  framework?: Framework;
  // Angular's template processor covers markup, so the html layer would double-report.
  html: boolean;
  // A file type, so it stacks with a hosted framework.
  astro?: true;
  // Decides both whether `vite.config.ts` is written and whether `vite/client` lands in tsconfig `types`.
  vite: boolean;
  // Drives the stylelint syntax, the `lint:css` glob, coverage and the `type-standards.md` frontmatter.
  sfcExtension?: 'vue' | 'svelte';
  // The scaffolder's own stylesheet, quoted as the tailwind layer's `entryPoint`. Absent on Svelte, which ships none.
  styleEntry?: string;
  // Quoted into CLAUDE.md and the repo-structure rule.
  routeUnit: string;
  // Absent where the framework has none.
  hooksSlot?: HooksSlot;
  // Absent, the question is not asked.
  store?: StoreSlot;
  // Absent, the question is not asked.
  routers?: Router[];
  // For a target with no Vite or PostCSS pipeline; React Native takes NativeWind.
  tailwind?: TailwindSlot;
  // Only the extension target asks.
  hostsBrowser?: true;
  // Set on a target that renders with a framework but is not one.
  hostsFramework?: true;
  ignores: string[];
  naming: NamingMap;
  // A target whose routes are files needs `[slug]`/`(tabs)` admitted; both shapes live in `model/naming`.
  folderNaming: NamingMap;
  hooksAlias?: AliasMap;
  // Merged at the tail of the lib family.
  extraAliases?: AliasMap;
  // Shared aliases this target lacks, so none names a directory that is not there.
  omitAliases?: string[];
  tsconfig: TsconfigDelta;
  // Names imported as values although they are types; `rewriteScaffoldedSource` adds inline `type`.
  typeOnlyImports?: Record<string, string[]>;
  // Required and empty on the three targets that own no vite config, which return before it is read.
  vitePlugin: PluginSpec;
  // Only a non-Vite target can need one.
  vitestPlugin?: PluginSpec;
  // A factory instead of `defineConfig`; Astro alone, whose Vite options come through `getViteConfig`.
  vitestFactory?: { imports: string[];
    call: string; };
  // Beyond the shared set: modules with no branch to miss.
  coverageExclude?: string[];
  // Test run only; without `browser`, vitest loads Svelte's server build and `mount()` throws.
  testConditions?: string[];
  // Copied once at birth regardless of the testing answer, since the manifest references it either way.
  starterFiles?: StarterFile[];
  // Rollup inputs for a page the manifest does not name: a devtools panel, opened at runtime.
  viteInputs?: Record<string, string>;
  starterTests?: StarterTest[];
  // Renamed onto the standard at birth; Expo is the only user.
  starterRenames?: StarterRename[];
  // Seeds PROJECT_SKIPPED; React Native's native-module mocks need shapes the strict floor bans.
  exemptsStarterTests?: true;
  // Fresh scaffolder output only.
  starterFixes?: StarterFix[];
  // Removed on fresh output only; Angular's `tsconfig.app.json` is not one, since `angular.json` names it.
  staleScaffoldFiles?: string[];
  // One project per platform, or one `.web` variant never executes and the coverage gate lies.
  testPlatforms?: TestPlatform[];
  // A birth-only template filled with the project name, relative to `assets/`.
  typecheck: string;
  // For a scaffolder that writes no `build`; React Native only.
  build?: string;
  // Runs on install before `husky`; SvelteKit's `svelte-kit sync` writes the tsconfig the emitted one extends.
  prepare?: string;
  // Beyond the shared set.
  extraScripts?: Record<string, string>;
  // Beyond what the scaffolder installs; a hosted framework is the user.
  dependencies?: string[];
  devDependencies: string[];
  // Installed only with vitest.
  testDevDependencies?: string[];
  // Beyond the shared two; pnpm aborts with `ERR_PNPM_IGNORED_BUILDS` when one is missing.
  allowBuilds: string[];
  // `dependent>peer` pairs pnpm may satisfy with the version named, beyond the eslint ones every project carries.
  peerAllowances?: Record<string, string>;
  // Peers yarn must see declared, as `dependent -> peer -> range`; the scaffolder's tree asks for them.
  peerExtensions?: Record<string, Record<string, string>>;
  // Relative to `assets/claude-rules/`.
  stateRules: string[];
  // Overridden only where a test environment is needed.
  testSetup?: string;
  // Set where a mocked router binding exists for this framework: React's two and `@tanstack/solid-router`.
  routerMocks?: true;
}
