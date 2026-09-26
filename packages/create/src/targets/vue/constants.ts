import type { AccessorNames } from '../utils/mockUtils';
import type { ComponentPaths } from '../utils/styleUtils';

/**
 * Every file the template writes whatever was answered. No `scaffold` on this record: the tree is this
 * repository's own, so nothing is fetched and the whole of `src/` comes from `templates/starter-source/vue/`.
 *
 * The router is unconditional here, as it was when `create-vue` installed it: a Vue application routes, and this
 * target asks no router question to answer otherwise.
 */
export const ALWAYS: readonly string[] = [
  'src/main.ts',
  'src/App.vue',
  'src/router/index.ts',
  'src/views/AboutView.vue',
  'src/views/VersionView.vue',
  'src/components/ui/app-mark/AppMark.vue',
  'src/components/features/app-header/AppHeader.vue',
];

// The same bytes on every target: the tokens, the stylesheets and the page tables have no framework in them, so
// they are written once under `starter-source/shared/` and every target takes that copy.
export const SHARED: readonly string[] = [
  'src/config/standard.ts',
  'src/styles/tokens.css',
  'src/styles/base.css',
];

// Vue calls it a composable, and refs come back rather than values.
export const ACCESSORS: AccessorNames = {
  directory: 'src/lib/composables',
  query: 'useExtendedQuery',
  mutation: 'useExtendedMutation',
  testSuffix: '.test.ts',
};

/*
 * Vue's own spelling of the four styled components. `vue/multi-word-component-names` refuses `Mark` and `Button`,
 * so both take an `App` prefix and their directories are named for what they hold, which is what keeps a
 * stylesheet and a style module beside the component rather than one directory over.
 */
export const COMPONENTS: ComponentPaths = {
  header: 'src/components/features/app-header/AppHeader',
  mark: 'src/components/ui/app-mark/AppMark',
  button: 'src/components/ui/app-button/AppButton',
  textInput: 'src/components/ui/text-input/TextInput',
};
