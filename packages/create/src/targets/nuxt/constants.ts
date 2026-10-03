export const ALWAYS: readonly string[] = [
  'src/app.vue',
  'src/error.vue',
  'src/pages/index.vue',
  'src/pages/about.vue',
  'src/pages/version.vue',
];

export const FROM_VUE: readonly string[] = [
  'src/components/ui/app-mark/AppMark.vue',
  'src/components/ui/app-button/AppButton.vue',
];

// Each ships a translated twin, Vue's own.
export const TRANSLATED_FROM_VUE: readonly string[] = [
  'src/views/AboutView.vue',
  'src/views/VersionView.vue',
  'src/components/features/status-page/StatusPage.vue',
];

export const SHARED: readonly string[] = [
  'src/config/routes.ts',
  'src/styles/tokens.css',
  'src/styles/base.css',
  'public/favicon.svg',
  'public/robots.txt',
];

export { ACCESSORS as ACCESSORS } from '../vue/constants';
