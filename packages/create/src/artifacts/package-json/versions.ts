import type { PackageManager } from '../../model/answers/answers';

/**
 * Caret ranges, not pins, so a project picks up patch fixes on install; bump this file and nothing else. Two rules for
 * a new entry: the range must actually resolve (these tests assert on emitted text, never a registry), and an entry
 * this workspace also installs must be at least the version the `catalog:` in `pnpm-workspace.yaml` holds. That is
 * where a shared version now lives, rather than in each package's own devDependencies; `versions.test.ts` gates it.
 */
/**
 * Named, not just an entry below, because `emitPnpmWorkspace` needs the major to write a peer allowance and reading it
 * back out of the table is an index lookup whose `undefined` arm no answer can reach. One constant, used in both
 * places, keeps this file the only one a bump touches without inventing a dead branch to satisfy the type.
 */
export const ESLINT_RANGE = '^10.9.1';

export const VERSIONS: Record<string, string> = {
  // Angular's only route onto vitest: it runs the real Angular compiler over the test graph.
  '@analogjs/vite-plugin-angular': '^2.7.0',
  // Astro's own integrations, one per hosted framework, plus its type checker and the eslint pair for `.astro`.
  '@astrojs/check': '^0.9.10',
  '@astrojs/react': '^6.0.2',
  '@astrojs/solid-js': '^7.0.2',
  '@astrojs/svelte': '^9.0.1',
  '@astrojs/vue': '^7.0.2',
  '@babel/core': '^8.0.1',
  '@commitlint/cli': '^21.2.2',
  '@commitlint/config-conventional': '^21.2.2',
  // Reads manifest.json and builds every surface it names: what makes an extension build out of a vanilla one.
  '@crxjs/vite-plugin': '^2.7.1',
  '@eslint-react/eslint-plugin': '^5.18.6',
  '@html-eslint/eslint-plugin': '^0.65.0',
  '@html-eslint/parser': '^0.65.0',
  // NgRx stable (21.x) peers on Angular 21 while `ng new` writes Angular 22; the rc peers `^22.0.0`, and the caret
  // admits every stable 22.x the day it lands, so the range self-heals. Measurements in DESIGN.md.
  '@ngrx/signals': '^22.0.0-rc.0',
  '@rolldown/plugin-babel': '^0.2.3',
  '@solidjs/testing-library': '^0.8.10',
  // What lets vitest load React Native at all: strips the untranspiled Flow types and stands in for native modules.
  '@srsholmes/vitest-react-native': '^0.1.5',
  // The bare Svelte Vite plugin, for a host that owns its own entry; `sveltekit()` would take the entry over.
  '@sveltejs/vite-plugin-svelte': '^7.3.0',
  // The PostCSS half of the pair below, for a target with no vite.config.ts to call a plugin from; same release train,
  // so the two ranges move together.
  '@tailwindcss/postcss': '^4.3.3',
  '@tailwindcss/vite': '^4.3.3',
  '@tanstack/angular-query-experimental': '^5.101.4',
  '@tanstack/eslint-plugin-query': '^5.102.3',
  '@tanstack/react-query': '^5.101.4',
  '@tanstack/solid-query': '^5.101.4',
  // The svelte binding is the one that has moved to 6; the rest of the family is still on 5.
  '@tanstack/svelte-query': '^6.1.38',
  '@tanstack/vue-query': '^5.101.4',
  // An unbundled peer of the React binding, declared not inherited, or pnpm leaves the first render() unresolved.
  '@testing-library/dom': '^10.4.1',
  '@testing-library/react': '^16.3.2',
  '@testing-library/react-native': '^14.0.1',
  '@testing-library/svelte': '^5.4.2',
  '@types/chrome': '^0.2.5',
  '@types/firefox-webext-browser': '^143.0.0',
  '@types/node': '^24.13.3',
  '@types/react': '^19.2.18',
  '@types/react-dom': '^19.2.4',
  '@vitejs/plugin-react': '^6.0.5',
  // The SWC build plugin, which the Babel-based compiler pass runs ahead of; the RN record keeps the plain plugin,
  // but only as a vitest transform.
  '@vitejs/plugin-react-swc': '^4.3.1',
  '@vitest/coverage-v8': '^4.1.11',
  '@vitest/eslint-plugin': '^1.6.27',
  '@vue/test-utils': '^2.4.11',
  'angular-eslint': '^22.1.0',
  'astro': '^7.2.1',
  'astro-eslint-parser': '^3.1.0',
  'babel-plugin-react-compiler': '^1.0.0',
  'eslint': ESLINT_RANGE,
  // The plugin, not `eslint-config-next`: the config bundles three plugins the layers already cover with newer ones.
  // See `frameworks/next.ts`.
  '@next/eslint-plugin-next': '^16.3.3',
  // The sibling package: tracks its own version, and versions.test.ts fails the moment they diverge.
  '@linteljs/eslint-config': '^1.5.1',
  'eslint-plugin-react-hooks': '^7.1.1',
  'eslint-plugin-astro': '^3.1.0',
  'eslint-plugin-jsx-a11y': '^6.10.2',
  'eslint-plugin-better-tailwindcss': '^4.7.0',
  'eslint-plugin-solid': '^0.16.0',
  'eslint-plugin-svelte': '^3.23.0',
  '@vitejs/plugin-vue': '^6.0.8',
  'eslint-plugin-vue': '^10.10.0',
  'eslint-plugin-vuejs-accessibility': '^2.6.0',
  'happy-dom': '^20.11.2',
  'husky': '^9.1.7',
  'lint-staged': '^17.3.0',
  // Stylelint's syntax for the `<style>` block of a single-file component. Vue and Svelte only.
  'postcss-html': '^2.0.0',
  // Runtime frameworks: a vanilla or Astro scaffold installs none of them, so a hosted framework brings its own.
  'react': '^19.2.8',
  'react-dom': '^19.2.8',
  'solid-js': '^1.9.14',
  // stylelint-config-standard@40 peers on ^17, so the two move together.
  'stylelint': '^17.14.1',
  'stylelint-config-recess-order': '^7.8.0',
  'stylelint-config-standard': '^40.0.0',
  'stylelint-config-tailwindcss': '^1.0.1',
  'svelte': '^5.56.10',
  'svelte-check': '^4.7.5',
  'svelte-eslint-parser': '^1.8.1',
  'tailwindcss': '^4.3.3',
  /**
   * Tilde, not caret, and the one entry here that carries a ceiling: `typescript-eslint` peers
   * `>=4.8.4 <6.1.0`, so a caret admits a 6.1 the type-aware layer would refuse the moment one publishes.
   * @linteljs/eslint-config already pins `~6.0.3` in its own devDependencies; this makes the emitted project agree
   * with the layer it installs. The 6.x line currently ends at 6.0.3 (`latest` is already on 7), so this costs a
   * generated project nothing today and stops it resolving a compiler its own lint gate rejects.
   */
  'typescript': '~6.0.3',
  'vite-plugin-solid': '^2.11.14',
  'vitest': '^4.1.11',
  'vue': '^3.5.41',
  'vue-eslint-parser': '^10.4.1',
  'vue-tsc': '^3.3.9',
  // Runs, lints and packages a Firefox extension; it is not a bundler, which crxjs still is.
  'web-ext': '^10.6.0',
  'zod': '^4.4.3',
  'zustand': '^5.0.14',
};

// Written into `packageManager`, pinning the manager itself: an exact version, since corepack rejects a range.
export const PACKAGE_MANAGER_VERSIONS: Record<PackageManager, string> = {
  pnpm: '12.0.0',
  npm: '12.0.2',
  yarn: '4.18.0',
  bun: '1.3.14',
};

export const NODE_ENGINE = '>=24.19.0';
