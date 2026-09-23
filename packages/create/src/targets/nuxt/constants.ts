/*
 * Every file this target writes whatever was answered. The views, the mark and the header come from Vue's own
 * tree rather than a copy: Nuxt is Vue with a build around it, and a page that renders the same markup should be
 * the same bytes. What is here is the shell and the three route files that give Nuxt its directory of routes.
 */
export const ALWAYS: readonly string[] = [
  'src/app.vue',
  'src/components/features/app-header/AppHeader.vue',
  'src/pages/index.vue',
  'src/pages/about.vue',
  'src/pages/version.vue',
];

// Taken from `starter-source/vue/`, because Nuxt renders the same views Vue does.
export const FROM_VUE: readonly string[] = [
  'src/views/AboutView.vue',
  'src/views/VersionView.vue',
  'src/components/ui/app-mark/AppMark.vue',
];

// The same bytes on every target: the tokens, the stylesheets and the page tables have no framework in them.
export const SHARED: readonly string[] = [
  'src/config/standard.ts',
  'src/config/routes.ts',
  'src/styles/tokens.css',
  'src/styles/base.css',
];

// Nuxt takes Vue's composables, which is what it takes its views from too.
export { ACCESSORS as ACCESSORS } from '../vue/constants';
