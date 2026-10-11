// `astro check` types an `.astro` import itself; `tsc` and the typed lint only see this.
declare module '*.astro' {
  import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

  const component: AstroComponentFactory;
  export default component;
}
