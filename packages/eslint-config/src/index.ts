/**
 * Every layer, one export each, which is what makes `scripts/smoke/smokeScript.ts` able to hold the barrel and the
 * `exports` map to the same list. No `composeConfig`: it would load every framework layer, so it lives at
 * `/compose-config`. Taking a layer through its own subpath stays the better choice for a project, since the barrel
 * resolves the optional peer of every layer in it.
 */
export {
  angular,
  angularGroup,
} from './frameworks/angular/angularFramework';
export { astro } from './frameworks/astro/astroFramework';
export {
  next,
  nextGroup,
} from './frameworks/next/nextFramework';
export {
  nuxt,
  nuxtGroup,
} from './frameworks/nuxt/nuxtFramework';
export {
  react,
  reactGroup,
} from './frameworks/react/reactFramework';
export {
  reactNative,
  reactNativeGroup,
} from './frameworks/react-native/reactNativeFramework';
export {
  solid,
  solidGroup,
} from './frameworks/solid/solidFramework';
export {
  svelte,
  svelteGroup,
} from './frameworks/svelte/svelteFramework';
export {
  vue,
  vueGroup,
} from './frameworks/vue/vueFramework';
export { base } from './layers/base/baseLayer';
export { html } from './layers/html/htmlLayer';
export { typescript } from './layers/typescript/typescriptLayer';
export { vitest } from './layers/vitest/vitestLayer';
export { stylex } from './libraries/stylex/stylexLibrary';
export { tailwind } from './libraries/tailwind/tailwindLibrary';
export { tanstackQuery } from './libraries/tanstack-query/tanstackQueryLibrary';
export { tanstackRouter } from './libraries/tanstack-router/tanstackRouterLibrary';
export type {
  AliasMap,
  BaseOptions,
  ComposeConfigOptions,
  Framework,
  Layer,
  LibraryLayer,
  NamingConvention,
  NamingMap,
  ResolverOptions,
} from './types';
