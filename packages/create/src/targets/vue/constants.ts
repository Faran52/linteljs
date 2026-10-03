import type { I18nParts } from '../types';
import type { AccessorNames } from '../utils/mockUtils';
import type { ComponentPaths } from '../utils/styleUtils';

export const ALWAYS: readonly string[] = [
  'src/App.vue',
  'src/router/index.ts',
  'src/components/ui/app-mark/AppMark.vue',
  'src/components/features/error-boundary/ErrorBoundary.vue',
];

export const SHARED: readonly string[] = [
  'src/lib/utils/statusUtils.ts',
  'src/styles/tokens.css',
  'src/styles/base.css',
  'public/favicon.svg',
  'public/robots.txt',
];

// Each ships a translated twin.
export const TRANSLATED: readonly string[] = [
  'src/main.ts',
  'src/views/AboutView.vue',
  'src/views/VersionView.vue',
  'src/components/features/app-header/AppHeader.vue',
  'src/components/features/status-page/StatusPage.vue',
];

// Written with a language alone, without their extension, since each takes a suite.
export const I18N_ONLY: readonly string[] = [
  'src/components/features/language-select/LanguageSelect',
  'src/components/ui/code-text/CodeText',
];

export const ACCESSORS: AccessorNames = {
  directory: 'src/lib/composables',
  query: 'useExtendedQuery',
  mutation: 'useExtendedMutation',
  testSuffix: '.test.ts',
};

// `vue/multi-word-component-names` refuses `Mark` and `Button`, so both take an `App` prefix.
export const COMPONENTS: ComponentPaths = {
  header: 'src/components/features/app-header/AppHeader',
  mark: 'src/components/ui/app-mark/AppMark',
  button: 'src/components/ui/app-button/AppButton',
  textInput: 'src/components/ui/text-input/TextInput',
};

// vue-i18n, Vue's own, with each mount installing it from the test setup.
export const VUE_I18N: I18nParts = {
  dependencies: ['vue-i18n'],
  testSetup: 'fragments/test-setup/setupTests.vueI18n.ts',
};

export const FORM_FILES = [
  'src/views/useContactForm.ts',
  'src/components/ui/text-input/TextInput.vue',
  'src/components/ui/text-input/types.ts',
] as const;

export const COUNTER_MODULE_STORES = ['pinia', 'tanstack-store'] as const;
