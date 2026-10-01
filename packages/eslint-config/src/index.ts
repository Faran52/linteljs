// No `composeConfig`: it would load every framework layer, so it lives at `/compose-config`.
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
  TypescriptOptions,
} from './types';
