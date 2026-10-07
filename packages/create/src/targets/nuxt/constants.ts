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
  'src/views/about/AboutView.vue',
  'src/views/version/VersionView.vue',
  'src/components/features/status-page/StatusPage.vue',
];

export const SHARED: readonly string[] = [
  'src/styles/tokens.css',
  'src/styles/base.css',
  'public/favicon.svg',
  'public/robots.txt',
];

// The contact page's sources whose suites are Vue's own.
export const CONTACT_FROM_VUE: readonly string[] = [
  'src/views/contact/ContactView.vue',
  'src/views/contact/use-contact-form/useContactForm.ts',
  'src/components/ui/text-input/TextInput.vue',
  'src/lib/apis/contact/contactApi.ts',
  'src/lib/providers/data/dataProvider.ts',
];

export {
  ACCESSORS as ACCESSORS,
  COMPONENTS as COMPONENTS,
  FORM_FILES as FORM_FILES,
} from '../vue/constants';
