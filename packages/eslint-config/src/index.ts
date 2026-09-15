// No `defineConfig`: the barrel would load all six framework layers. It lives at `/define-config`.
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
  react,
  reactGroup,
} from './frameworks/react';
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
