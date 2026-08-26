import { COMPONENT, DECLARATION } from '../../naming/naming';

import type { HostedFramework, NamingMap } from '../../answers/answers';
import type { PluginSpec } from '../record';

export interface FrameworkParts {
  // The `@linteljs/eslint-config` layer name, which is the same string as the framework id.
  framework: HostedFramework;
  // The single-file-component extension, where the framework has one.
  sfcExtension?: 'vue' | 'svelte';
  // What the component file looks like, so a host's naming map marks components by extension rather than by directory.
  componentGlob: string;
  vitePlugin: PluginSpec;
  // The framework itself, which a vanilla or Astro scaffold does not install.
  dependencies: string[];
  // The ESLint plugins and parsers the layer peers on, plus the Vite plugin itself.
  devDependencies: string[];
  // Installed only when a suite was asked for.
  testDevDependencies: string[];
  /**
   * Install scripts a host must approve for this framework's build plugin, since pnpm aborts the first install on
   * `ERR_PNPM_IGNORED_BUILDS` otherwise. Only React has one: `@vitejs/plugin-react-swc` pulls `@swc/core`, which is
   * a native binary.
   */
  allowBuilds?: string[];
  // Resolve conditions the test run needs; Svelte and Solid ship a server build that `mount()` cannot use.
  testConditions?: string[];
  // The `jsxImportSource` a host's tsconfig needs so TypeScript resolves this framework's JSX types. Only Solid: React
  // is what `@types/react` already answers for, and the two single-file-component frameworks have no JSX to type.
  jsxImportSource?: string;
  // The `jsx` mode a host's tsconfig needs. Absent for the two single-file-component frameworks, which have no JSX at
  // all. A host with no framework has no `jsx` either, so this is what a hosted one adds rather than overrides.
  jsx?: 'preserve' | 'react-jsx';
  // The reactivity rule asset, relative to `assets/claude-rules/`.
  stateRules: string[];
}

/**
 * The pieces a UI framework contributes to a record that is not itself a framework target: the extension target and
 * Astro both host one. Composed from here rather than read off the framework's own record, because those records are
 * app-shaped: their `scaffold`, `routeUnit`, `typecheck`, `starterTests` and aliases describe a standalone app, and a
 * host has its own. What a host needs is the narrow set below, which is exactly what varies with the framework.
 */

/**
 * Off for the test run: the React Compiler's memo cache and `vite-plugin-solid`'s HMR handler each leave one
 * permanently-uncovered branch in every component, putting 100% branch coverage out of reach otherwise. Uses
 * `process.env.VITEST` rather than `mode`, because `vitest.config.ts` merges the vite config as an object, and a
 * function config cannot be merged.
 */
export const OUTSIDE_TESTS = 'process.env.VITEST === undefined';

// The one spelling of React's build wiring, read by the React target's own record and by every host that composes it.
export const REACT_VITE_PLUGIN: PluginSpec = {
  imports: [
    "import react from '@vitejs/plugin-react-swc';",
    "import babel from '@rolldown/plugin-babel';",
  ],
  prelude: [
    '// Ahead of SWC while the source is still raw TSX; the VITEST guard keeps the memo cache out of the test',
    '// run, where it leaves one permanently-uncovered branch in every component.',
    'const reactCompiler = async () => {',
    '  const compilerBabel = await babel({',
    '    include: [/\\.[tj]sx$/],',
    "    parserOpts: { plugins: ['jsx', 'typescript'] },",
    "    plugins: ['babel-plugin-react-compiler'],",
    '  });',
    '',
    "  return { ...compilerBabel, enforce: 'pre' };",
    '};',
  ],
  calls: [
    'react()',
    `...(${OUTSIDE_TESTS} ? [await reactCompiler()] : [])`,
  ],
};

const PARTS: Record<HostedFramework, FrameworkParts> = {
  react: {
    framework: 'react',
    jsx: 'react-jsx',
    componentGlob: 'src/**/*.tsx',
    vitePlugin: REACT_VITE_PLUGIN,
    devDependencies: [
      '@eslint-react/eslint-plugin',
      'eslint-plugin-jsx-a11y',
      'eslint-plugin-react-hooks',
      '@vitejs/plugin-react-swc',
      '@rolldown/plugin-babel',
      // No @types/babel__core: Babel 8 bundles its own declarations, which is what `@rolldown/plugin-babel`'s
      // types import resolves through.
      '@babel/core',
      'babel-plugin-react-compiler',
      '@types/react',
      '@types/react-dom',
    ],
    dependencies: ['react', 'react-dom'],
    allowBuilds: ['@swc/core'],
    testDevDependencies: ['@testing-library/dom', '@testing-library/react'],
    stateRules: ['react-state.md', 'hooks-order.md'],
  },
  vue: {
    framework: 'vue',
    sfcExtension: 'vue',
    componentGlob: 'src/**/*.vue',
    vitePlugin: {
      imports: ["import vue from '@vitejs/plugin-vue';"],
      calls: ['vue()'],
    },
    dependencies: ['vue'],
    devDependencies: [
      'eslint-plugin-vue',
      'eslint-plugin-vuejs-accessibility',
      'vue-eslint-parser',
      '@vitejs/plugin-vue',
      'vue-tsc',
    ],
    testDevDependencies: ['@vue/test-utils'],
    stateRules: ['vue-reactivity.md'],
  },
  svelte: {
    framework: 'svelte',
    sfcExtension: 'svelte',
    componentGlob: 'src/**/*.svelte',
    // The bare plugin, not `sveltekit()`: a host owns its own entry, and the kit plugin would take it over.
    vitePlugin: {
      imports: ["import { svelte } from '@sveltejs/vite-plugin-svelte';"],
      calls: ['svelte()'],
    },
    dependencies: ['svelte'],
    devDependencies: [
      'eslint-plugin-svelte',
      'svelte-eslint-parser',
      'svelte-check',
      '@sveltejs/vite-plugin-svelte',
    ],
    testDevDependencies: ['@testing-library/svelte'],
    testConditions: ['browser'],
    stateRules: ['svelte-reactivity.md'],
  },
  solid: {
    framework: 'solid',
    jsx: 'preserve',
    componentGlob: 'src/**/*.tsx',
    vitePlugin: {
      imports: ["import solid from 'vite-plugin-solid';"],
      calls: [`solid({ hot: ${OUTSIDE_TESTS} })`],
    },
    dependencies: ['solid-js'],
    jsxImportSource: 'solid-js',
    devDependencies: ['eslint-plugin-jsx-a11y', 'eslint-plugin-solid', 'vite-plugin-solid'],
    testDevDependencies: ['@solidjs/testing-library'],
    testConditions: ['development', 'browser'],
    stateRules: ['solid-reactivity.md'],
  },
};

export const partsFor = (framework: HostedFramework): FrameworkParts => {
  return PARTS[framework];
};

// A host's naming map once a framework is in it: the framework's own component extension marks a component, and every
// other script is a module. Replaces the host's directory-based rule, which only exists for a host with no framework.
export const hostedNaming = (framework: HostedFramework): NamingMap => {
  const { componentGlob } = partsFor(framework);

  return {
    [componentGlob]: COMPONENT,
    'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/**/*.d.ts': DECLARATION,
  };
};
