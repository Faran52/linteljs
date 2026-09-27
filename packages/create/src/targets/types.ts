import {
  type AliasMap,
  type Answers,
  type Framework,
  type HostedFramework,
  type NamingMap,
  type Router,
  type Store,
  type TargetId,
} from '@config/types';

export interface TsconfigPlugin {
  name: string;
}

// A test shipped with the project, covering the source beside it.
export interface StarterTest {
  // The path in the project, and the asset's own path under this target's starter tree. See `StarterFile`.
  target: string;
  // The module under test. Written only when this file exists.
  covers: string;
  /**
   * Written only where this holds; absent is always. The same field `StarterFile` carries, for the same reason: a
   * suite is written against one spelling of what it covers, so the router that turns a tab from a button into a
   * link changes the suite with it.
   */
  when?: (answers: Answers) => boolean;
  // The directory between the target and the path, where several spellings fill one destination.
  variant?: string;
  // The tree this suite comes from, when it is not this target's own. See `StarterFile`.
  shared?: true | TargetId;
  // As `StarterFile.source`: the asset path, where a naming rule makes it differ from the destination.
  source?: string;
}

export interface ConditionalStyle {
  path: string;
  when: (answers: Answers) => boolean;
}

export type StarterStyle = string | ConditionalStyle;

/**
 * Copied once at birth; the project owns it from then on.
 *
 * `target` is the whole of it. The asset sits at that same path under
 * `templates/starter-source/<target id>/`, below the answer that gates it where one does, so the pairing is the
 * path rather than a second string that can disagree with it. `starterSourceEmitter` does the derivation and
 * `registry.test.ts` holds every derived path against what is on disk.
 */
export interface StarterFile {
  target: string;
  /**
   * Written only where this holds; absent is always. A predicate rather than one optional field per answer,
   * because a file can need more than one of them at once: `Button` ships with a store *or* a form, which a set of
   * fields ANDed together cannot say.
   */
  when?: (answers: Answers) => boolean;
  // The directory between the target and the path, where several spellings fill one destination.
  variant?: string;
  /**
   * The tree this file comes from, when it is not this target's own. `true` is `starter-source/shared/`, for a file
   * with nothing framework-specific in it: the tokens, the stylesheets and the validation rules are the same bytes
   * on every target, and nine copies of them is the drift this repository exists to stop. A target id is that
   * target's tree, for a file two targets share a framework over: Next's primitives are React's, to the byte.
   */
  shared?: true | TargetId;
  /**
   * The asset path, where it differs from the destination. Absent is the ordinary case, and the ordinary case is
   * that the two are the same: a subject directory is named for the file it writes.
   *
   * A file shared across every target has to satisfy every target's naming rule at once, and two of those rules
   * disagree: Angular names every source file in kebab and the other nine name theirs in camel. So
   * `fetchExtended.ts` is the asset and Angular receives it as `fetch-extended.ts`, the way `Mark.tsx` is
   * `AppMark.vue` on Vue.
   */
  source?: string;
}

// One vitest project; `include` matters as much as `extensions`, or a web variant resolves under a native test.
export interface TestPlatform {
  name: string;
  extensions: string[];
  include: string[];
}

// A plugin as written into `vite.config.ts` or `vitest.config.ts`.
export interface PluginSpec {
  imports: string[];
  calls: string[];
}

// What a host (the extension target, Astro) takes from a framework: the framework's own record is app-shaped, so
// only the narrow set here is composed.
export interface FrameworkParts {
  // The layer name, the same string as the framework id.
  framework: HostedFramework;
  sfcExtension?: 'vue' | 'svelte';
  // So a host's naming map marks components by extension rather than by directory.
  componentGlob: string;
  vitePlugin: PluginSpec;
  // Not installed by a vanilla or Astro scaffold.
  dependencies: string[];
  // The layer's peers, plus the Vite plugin.
  devDependencies: string[];
  // Installed only with a suite.
  testDevDependencies: string[];
  // Svelte and Solid ship a server build that `mount()` cannot use.
  testConditions?: string[];
  // A build script the framework's own tree needs approved; a denied one fails with ERR_PNPM_IGNORED_BUILDS.
  allowBuilds?: string[];
  // Only Solid: `@types/react` already answers for React, and the SFC frameworks have no JSX to type.
  jsxImportSource?: string;
  // Absent for the SFC frameworks; a host with no framework has no `jsx` either.
  jsx?: 'preserve' | 'react-jsx';
  // Relative to `templates/fragments/claude-rules/`.
  stateRules: string[];
}

export interface TailwindSlot {
  // What the style entry imports instead of `@import "tailwindcss";`.
  imports: string[];
  dependencies: string[];
  devDependencies: string[];
  // Added to `tsconfig.json`'s `include` under this answer alone.
  tsconfigInclude?: string[];
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
  // Two trees read as one, which is how a generator's route types resolve beside the modules they type.
  rootDirs?: string[];
  /*
   * Nuxt only: its `alias` option merges a project's own aliases into the paths it generates, alongside the `#`
   * ones its build owns. Declaring `paths` here would replace that merged set with half of it.
   */
  dropsPaths?: true;
}

// A factory instead of `defineConfig`; Astro alone, whose Vite options come through `getViteConfig`.
interface VitestFactory {
  imports: string[];
  call: string;
}

// One record per target, so emitters stay free of `switch (target)`.
export interface TargetRecord {
  id: TargetId;
  // The module the emitted `index.html` loads.
  /*
   * Explicitly `| undefined` so a record built by overlay can clear it. React Router's framework mode is the case:
   * it takes the base React record and has no document of its own, and the emitter reads this rather than `html`.
   */
  htmlEntry?: string | undefined;
  // Every stylesheet the starter ships, as the style entry imports them. Colocated beside what they style and
  // imported from one place, because three targets scope a component's own `<style>` block away from the markup.
  /*
   * What the style entry imports, in order. A plain path is unconditional; a `when` is for a component stylesheet
   * whose component is itself conditional, because an entry that imports a file the answers never wrote fails the
   * build with ENOENT rather than degrading.
   */
  starterStyles?: StarterStyle[];
  // The Tailwind theme bridge, imported after the framework so its `@theme` can point at the tokens above it.
  tailwindTheme?: string;
  // One value: the composer owns the order.
  framework?: Framework;
  // Angular's template processor covers markup, so the html layer would double-report.
  html: boolean;
  // A file type, so it stacks with a hosted framework.
  astro?: true;
  // Drives the stylelint syntax, the `lint:css` glob, coverage and the `type-standards.md` frontmatter.
  sfcExtension?: 'vue' | 'svelte';
  // The scaffolder's own stylesheet, quoted as the tailwind layer's `entryPoint`. Absent on Svelte, which ships none.
  // Every target has one, so the emitters never ask whether there is a stylesheet to import into.
  styleEntry: string;
  // Absent, the question is not asked. The order is the offer's: the first is what a config migrated from v2 lands on.
  stores?: readonly Store[];
  // Absent, the question is not asked.
  routers?: readonly Router[];
  // For a target with no Vite or PostCSS pipeline; React Native takes NativeWind.
  tailwind?: TailwindSlot;
  // Only the extension target asks.
  hostsBrowser?: true;
  // Set on a target that renders with a framework but is not one.
  hostsFramework?: true;
  ignores: string[];
  naming: NamingMap;
  // A target whose routes are files needs `[slug]`/`(tabs)` admitted; both shapes live in `targets/constants`.
  folderNaming: NamingMap;
  hooksAlias?: AliasMap;
  // Merged at the tail of the lib family.
  extraAliases?: AliasMap;
  // Shared aliases this target lacks, so none names a directory that is not there.
  omitAliases?: string[];
  tsconfig: TsconfigDelta;
  // What `vite.config.ts` registers. Absent where the target owns no Vite config, which decides both whether that
  // file is written and whether `vite/client` lands in tsconfig `types`.
  vitePlugin?: PluginSpec;
  // Only a non-Vite target can need one.
  vitestPlugin?: PluginSpec;
  vitestFactory?: VitestFactory;
  // Beyond the shared set: modules with no branch to miss.
  coverageExclude?: string[];
  // Test run only; without `browser`, vitest loads Svelte's server build and `mount()` throws.
  testConditions?: string[];
  /**
   * The vitest worker pool, where the default is wrong for a target. Angular's is the one: its Vite plugin runs
   * the suite in `vmThreads`, and a VM context carries none of Node's own globals, so `BroadcastChannel` is
   * undefined and msw fails on the import line. `forks` is vitest's own default and has every one of them.
   */
  testPool?: string;
  /**
   * What compiles StyleX here, where it is not the unplugin. Everything that reaches Vite takes that, including
   * the two that own their Vite config rather than emitting one; Next has no Vite config to put a plugin in and
   * compiles through Babel and PostCSS instead.
   */
  stylexBuild?: string[];
  /**
   * Whether the style entry carries `@stylex;`. Only where StyleX compiles through PostCSS: that at-rule is
   * where the plugin writes the atomic rules, and on a bundler-plugin target it would be an at-rule nothing
   * expands. It goes last, since the rules it expands to would otherwise sit ahead of an `@import`.
   */
  stylexAtRule?: boolean;
  // Copied once at birth regardless of the testing answer, since the manifest references it either way.
  // Required: every target's tree is this repository's own, so every one of them names its files.
  starterFiles: StarterFile[];
  // Rollup inputs for a page the manifest does not name: a devtools panel, opened at runtime.
  viteInputs?: Record<string, string>;
  // Required for the same reason, and because the generated project gates at 100% on what those files are.
  starterTests: StarterTest[];
  // The typecheck script a generated package.json runs.
  typecheck: string;
  // Expo reads its application metadata from `app.json`, three of whose fields are the project's name.
  expoProject?: true;
  /*
   * The manifest's `main`, where the runtime loads something other than its own default. Expo's default is
   * `expo/AppEntry`, which reads a root `App.tsx` that a routed project does not have.
   */
  packageMain?: string;
  /*
   * Nuxt reads `nuxt.config.ts` for everything, including the source root and the compiler options its own
   * generated tsconfigs carry, which is the only supported way to reach them.
   */
  nuxtProject?: true;
  /*
   * The directory this target's dev server serves as-is, where a browser mock worker has to land. Absent on a
   * target with no dev server to serve one, which is React Native: there its mocks reach the test run alone.
   */
  publicDirectory?: string;
  // React Router's framework mode reads its own `react-router.config.ts`, which names the source root.
  reactRouterProject?: true;
  // Angular's CLI reads its whole build from `angular.json`, which is keyed by the project's name.
  angularProject?: true;
  // The build script. Required: every target owns its own build.
  build: string;
  // Runs on install before `husky`; SvelteKit's `svelte-kit sync` writes the tsconfig the emitted one extends.
  prepare?: string;
  // A runner of its own, for a target whose modules neither resolve nor render the way a browser's do.
  testPlatforms?: TestPlatform[];
  // Beyond the shared set.
  extraScripts?: Record<string, string>;
  // Beyond the set every project installs; a hosted framework is the user.
  dependencies?: string[];
  devDependencies: string[];
  // Installed only with vitest.
  testDevDependencies?: string[];
  // Beyond the shared two; pnpm aborts with `ERR_PNPM_IGNORED_BUILDS` when one is missing.
  allowBuilds: string[];
  // Read before `VERSIONS`, for a target whose platform pins a release every other target has moved past.
  versions?: Record<string, string>;
  // Relative to `templates/fragments/claude-rules/`.
  stateRules: string[];
  // Overridden only where a test environment is needed.
  testSetup?: string;
  /**
   * The fragment that stands a router in for a suite that renders no router. A path rather than a flag, because
   * what has to be stood in for differs: the React family and Solid mock a navigate hook off their binding, and
   * SvelteKit mocks `$app/state`, which its own runtime rather than a package fills in.
   */
  routerMock?: string;
}
