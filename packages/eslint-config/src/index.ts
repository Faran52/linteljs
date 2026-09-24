/**
 * Every layer, one export each, which is what makes `scripts/smoke/smokeScript.ts` able to hold the barrel and the
 * `exports` map to the same list. No `defineConfig`: it would load every framework layer, so it lives at
 * `/define-config`. Taking a layer through its own subpath stays the better choice for a project, since the barrel
 * resolves the optional peer of every layer in it.
 */
export { astro } from './astro';
export { base } from './base';
export {
  angular,
  angularGroup,
} from './frameworks/angular';
export {
  next,
  nextGroup,
} from './frameworks/next';
export {
  nuxt,
  nuxtGroup,
} from './frameworks/nuxt';
export {
  react,
  reactGroup,
} from './frameworks/react';
export {
  reactNative,
  reactNativeGroup,
} from './frameworks/reactNative';
export {
  solid,
  solidGroup,
} from './frameworks/solid';
export {
  svelte,
  svelteGroup,
} from './frameworks/svelte';
export {
  vue,
  vueGroup,
} from './frameworks/vue';
export { html } from './html';
export { tailwind } from './libraries/tailwind';
export { tanstackQuery } from './libraries/tanstackQuery';
export { tanstackRouter } from './libraries/tanstackRouter';
export type {
  AliasMap,
  BaseOptions,
  DefineConfigOptions,
  Framework,
  Layer,
  LibraryLayer,
  NamingConvention,
  NamingMap,
  ResolverOptions,
} from './types';
export { typescript } from './typescript';
export { vitest } from './vitest';
