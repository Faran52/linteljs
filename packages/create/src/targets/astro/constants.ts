import type { HostedFramework } from '@config/types';
import type { I18nParts } from '../types';
import type { ComponentPaths } from '../utils/styleUtils';

// A page names its view and nothing else, so no translated twin.
export const ALWAYS: readonly string[] = [
  'src/pages/index.astro',
  'src/pages/about.astro',
  'src/pages/version.astro',
  'src/pages/403.astro',
  'src/pages/404.astro',
  'src/pages/500.astro',
  'src/components/ui/mark/Mark.astro',
  'src/lib/utils/currentPathUtils.ts',
  'src/typings/astro.d.ts',
];

export const SHARED: readonly string[] = [
  'src/styles/tokens.css',
  'src/styles/base.css',
  'public/favicon.svg',
  'public/robots.txt',
];

// No button and no text input: the contact island brings its framework's own.
export const COMPONENTS: Pick<ComponentPaths, 'header' | 'mark'> = {
  header: 'src/components/features/app-header/AppHeader',
  mark: 'src/components/ui/mark/Mark',
};

// Each ships a translated twin under `i18n`.
export const TRANSLATED: readonly string[] = [
  'src/views/home/HomeView.astro',
  'src/views/about/AboutView.astro',
  'src/views/version/VersionView.astro',
  'src/views/status/StatusView.astro',
  'src/components/features/app-header/AppHeader.astro',
];

// One suite covers both spellings of its view.
export const VIEW_SUITES: readonly string[] = [
  'src/views/home/HomeView',
  'src/views/about/AboutView',
  'src/views/version/VersionView',
  'src/views/status/StatusView',
];

// A client script over the shared locales: no library, so nothing to install.
export const ASTRO_I18N: I18nParts = { dependencies: [] };

// Each island's own button and text input, at its framework's paths.
export const ISLAND_COMPONENTS: Record<HostedFramework, Pick<ComponentPaths, 'button' | 'textInput'>> = {
  react: {
    button: 'src/components/ui/button/Button',
    textInput: 'src/components/ui/text-input/TextInput',
  },
  svelte: {
    button: 'src/components/ui/button/Button',
    textInput: 'src/components/ui/text-input/TextInput',
  },
  solid: {
    button: 'src/components/ui/button/Button',
    textInput: 'src/components/ui/text-input/TextInput',
  },
  vue: {
    button: 'src/components/ui/app-button/AppButton',
    textInput: 'src/components/ui/text-input/TextInput',
  },
};

// Under `src/views/`, since Astro routes `src/pages/`.
export const CONTACT_VIEW = 'src/views/contact';

export const USE_CONTACT_FORM = 'use-contact-form/useContactForm';

// The page's contact words in every language, read at build time.
export const CONTACT_COPY = `${CONTACT_VIEW}/utils/contactCopyUtils`;

// How the page asset imports React's island; another framework's island rewrites this line.
export const REACT_ISLAND_IMPORT = "import { ContactIsland } from '@views/contact/ContactIsland';";
