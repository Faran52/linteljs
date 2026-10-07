import type { ComponentPaths } from '../utils/styleUtils';

export const ALWAYS: readonly string[] = [
  'src/app.vue',
  'src/error.vue',
  'src/pages/index.vue',
  'src/pages/about.vue',
  'src/pages/version.vue',
];

// No contact page, so no text input.
export const COMPONENTS: Omit<ComponentPaths, 'textInput'> = {
  header: 'src/components/features/app-header/AppHeader',
  mark: 'src/components/ui/app-mark/AppMark',
  button: 'src/components/ui/app-button/AppButton',
};

export const FROM_VUE: readonly string[] = [
  'src/components/ui/app-mark/AppMark.vue',
  'src/components/ui/app-button/AppButton.vue',
];

// Each ships a translated twin, Vue's own.
export const TRANSLATED_FROM_VUE: readonly string[] = [
  'src/views/about/AboutView.vue',
  'src/views/version/VersionView.vue',
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
