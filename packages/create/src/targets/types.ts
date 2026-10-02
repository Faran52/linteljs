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

export interface StarterTest {
  target: string;
  // Written only when this file exists.
  covers: string;
  when?: (answers: Answers) => boolean;
  variant?: string;
  shared?: true | TargetId;
  source?: string;
}

export interface ConditionalStyle {
  path: string;
  when: (answers: Answers) => boolean;
}

export type StarterStyle = string | ConditionalStyle;

// The asset sits at `target` under `templates/starter-source/<id>/`, so the path is spelled once.
export interface StarterFile {
  target: string;
  // A predicate: `Button` ships with a store *or* a form, which ANDed fields cannot say.
  when?: (answers: Answers) => boolean;
  variant?: string;
  // `true` is `starter-source/shared/`; a target id is that target's tree.
  shared?: true | TargetId;
  // Angular names files in kebab and the other nine in camel, so a shared asset lands under two names.
  source?: string;
  // React's StyleX sheet, spread with `attrs` for the `class` every other framework reads.
  stylexAttrs?: true;
}

// Compiles the catalog from the inlang project the i18n config emitter writes. `prepare` and `typecheck` run its
// command first, since lint and the type checker read the output.
export interface I18nCompiler {
  command: string;
  devDependencies: string[];
  vitePlugin: PluginSpec;
}

export interface I18nParts {
  dependencies: string[];
  // Absent where each suite wraps its render in the provider instead.
  testSetup?: string;
  compiler?: I18nCompiler;
}

// `include` matters as much as `extensions`, or a web variant resolves under a native test.
export interface TestPlatform {
  name: string;
  extensions: string[];
  include: string[];
}

export interface PluginSpec {
  imports: string[];
  calls: string[];
}

// A framework's own record is app-shaped, so a host composes only this narrow set.
export interface FrameworkParts {
  framework: HostedFramework;
  sfcExtension?: 'vue' | 'svelte';
  componentGlob: string;
  vitePlugin: PluginSpec;
  dependencies: string[];
  devDependencies: string[];
  testDevDependencies: string[];
  // Svelte and Solid ship a server build that `mount()` cannot use.
  testConditions?: string[];
  allowBuilds?: string[];
  // `@types/react` already answers for React, and the SFC frameworks have no JSX to type.
  jsxImportSource?: string;
  jsx?: 'preserve' | 'react-jsx';
  stateRules: string[];
}

// `name` pinned only where `parent` depends on it, so every other consumer keeps its own.
export interface ScopedOverride {
  parent: string;
  name: string;
}

export interface TailwindSlot {
  imports: string[];
  dependencies: string[];
  devDependencies: string[];
  tsconfigInclude?: string[];
  overrides?: ScopedOverride[];
}

export interface TsconfigDelta {
  jsx?: 'react-jsx' | 'preserve';
  jsxImportSource?: string;
  plugins?: TsconfigPlugin[];
  useDefineForClassFields?: boolean;
  // `noEmit` makes ngtsc emit nothing.
  dropsNoEmit?: boolean;
  include?: string[];
  // An allow-list once populated: an installed but unlisted `@types/chrome` still lints as unresolved.
  types?: string[];
  // An extending config replaces `paths`, so `$lib` is re-declared.
  extends?: string;
  rootDirs?: string[];
  // Declaring `paths` would replace Nuxt's merged alias set with half of it.
  dropsPaths?: true;
}

interface VitestFactory {
  imports: string[];
  call: string;
}

// One record per target, so emitters stay free of `switch (target)`.
export interface TargetRecord {
  id: TargetId;
  // `| undefined` so an overlay can clear it: React Router's framework mode has no document.
  htmlEntry?: string | undefined;
  // An import of a file the answers never wrote fails the build with ENOENT.
  starterStyles?: StarterStyle[];
  // The Tailwind theme bridge, imported after the framework so its `@theme` can point at the tokens above it.
  tailwindTheme?: string;
  // One value: the composer owns the order.
  framework?: Framework;
  // Angular's template processor covers markup, so the html layer would double-report.
  html: boolean;
  // A file type, so it stacks with a hosted framework.
  astro?: true;
  sfcExtension?: 'vue' | 'svelte';
  styleEntry: string;
  // The first is what a config migrated from v2 lands on.
  stores?: readonly Store[];
  // Absent, the question is not asked.
  routers?: readonly Router[];
  tailwind?: TailwindSlot;
  hostsBrowser?: true;
  // Present once a target translates its starter: what `languages` adds to its dependencies and test setup.
  i18n?: I18nParts;
  hostsFramework?: true;
  ignores: string[];
  naming: NamingMap;
  folderNaming: NamingMap;
  // The route unit's directory, first: it imports every layer below it.
  routeAlias?: AliasMap;
  hooksAlias?: AliasMap;
  extraAliases?: AliasMap;
  // So none names a directory that is not there.
  omitAliases?: string[];
  tsconfig: TsconfigDelta;
  // Absent decides both whether `vite.config.ts` is written and whether `vite/client` lands in `types`.
  vitePlugin?: PluginSpec;
  vitestPlugin?: PluginSpec;
  vitestFactory?: VitestFactory;
  coverageExclude?: string[];
  // Without `browser`, vitest loads Svelte's server build and `mount()` throws.
  testConditions?: string[];
  // Angular's plugin runs `vmThreads`, whose VM context lacks `BroadcastChannel`, so msw fails on import.
  testPool?: string;
  // Next has no Vite config, so it compiles StyleX through Babel and PostCSS.
  stylexBuild?: string[];
  // Only where StyleX compiles through PostCSS; elsewhere the at-rule expands to nothing.
  stylexAtRule?: boolean;
  // Copied regardless of the testing answer, since the manifest references it either way.
  starterFiles: StarterFile[];
  // Written paths that open with `'use client';`.
  clientBoundaries?: readonly string[];
  viteInputs?: Record<string, string>;
  // Required: the generated project gates at 100% on what those files are.
  starterTests: StarterTest[];
  typecheck: string;
  expoProject?: true;
  // Expo's default `expo/AppEntry` reads a root `App.tsx` a routed project does not have.
  packageMain?: string;
  nuxtProject?: true;
  // Where a browser mock worker has to land; React Native has no dev server.
  publicDirectory?: string;
  reactRouterProject?: true;
  angularProject?: true;
  build: string;
  // SvelteKit's `svelte-kit sync` writes the tsconfig the emitted one extends.
  prepare?: string;
  testPlatforms?: TestPlatform[];
  extraScripts?: Record<string, string>;
  dependencies?: string[];
  devDependencies: string[];
  testDevDependencies?: string[];
  // pnpm aborts with `ERR_PNPM_IGNORED_BUILDS` when one is missing.
  allowBuilds: string[];
  // For a target whose platform pins a release every other target has moved past.
  versions?: Record<string, string>;
  stateRules: string[];
  testSetup?: string;
  // A path: the React family and Solid mock a navigate hook, SvelteKit mocks `$app/state`.
  routerMock?: string;
}
