import type { AccessorNames } from '../utils/mockUtils';
import type { ComponentPaths } from '../utils/styleUtils';

export const ALWAYS: readonly string[] = [
  'src/main.ts',
  'src/App.vue',
  'src/router/index.ts',
  'src/views/AboutView.vue',
  'src/views/VersionView.vue',
  'src/components/ui/app-mark/AppMark.vue',
  'src/components/features/app-header/AppHeader.vue',
];

export const SHARED: readonly string[] = [
  'src/config/standard.ts',
  'src/styles/tokens.css',
  'src/styles/base.css',
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
