import { COMPONENT, DECLARATION } from '../../naming/naming';

import type { HostedFramework, NamingMap } from '../../answers/answers';
import type { PluginSpec } from '../record';

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
  // Only Solid: `@types/react` already answers for React, and the SFC frameworks have no JSX to type.
  jsxImportSource?: string;
  // Absent for the SFC frameworks; a host with no framework has no `jsx` either.
  jsx?: 'preserve' | 'react-jsx';
  // Relative to `assets/claude-rules/`.
  stateRules: string[];
}

// What a host (the extension target, Astro) takes from a framework: the framework's own record is app-shaped, so
// only the narrow set here is composed.

// Off for the test run: the React Compiler's memo cache and `vite-plugin-solid`'s HMR handler each leave one
// uncovered branch per component. `process.env.VITEST`, not `mode`, because a function config cannot be merged.
export const OUTSIDE_TESTS = 'process.env.VITEST === undefined';

// The one spelling of React's build wiring, read by the React target and every host.
export const REACT_VITE_PLUGIN: PluginSpec = {
  imports: [
    "import react, { reactCompilerPreset } from '@vitejs/plugin-react';",
    "import babel from '@rolldown/plugin-babel';",
  ],
  calls: [
    `...(${OUTSIDE_TESTS}\n`
    + '      ? [babel({ presets: [reactCompilerPreset()] }), react()]\n'
    + '      : [react()])',
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
      'eslint-plugin-jsx-a11y-x',
      'eslint-plugin-react-hooks',
      '@vitejs/plugin-react',
      '@rolldown/plugin-babel',
      '@babel/core',
      'babel-plugin-react-compiler',
      '@types/react',
      '@types/react-dom',
    ],
    dependencies: ['react', 'react-dom'],
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
    // The bare plugin: a host owns its own entry, and `sveltekit()` would take it over.
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
    devDependencies: ['eslint-plugin-jsx-a11y-x', 'eslint-plugin-solid', 'vite-plugin-solid'],
    testDevDependencies: ['@solidjs/testing-library'],
    testConditions: ['development', 'browser'],
    stateRules: ['solid-reactivity.md'],
  },
};

export const partsFor = (framework: HostedFramework): FrameworkParts => {
  return PARTS[framework];
};

// The framework's extension marks a component, replacing the host's directory-based rule.
export const hostedNaming = (framework: HostedFramework): NamingMap => {
  const { componentGlob } = partsFor(framework);

  return {
    [componentGlob]: COMPONENT,
    'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    'src/**/*.d.ts': DECLARATION,
  };
};
