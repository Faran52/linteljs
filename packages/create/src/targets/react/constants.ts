import type { Router } from '@config/types';
import type { I18nParts } from '../types';
import type { AccessorNames } from '../utils/mockUtils';

export const ROUTERS: readonly Router[] = [
  'react-router',
  'react-router-framework',
  'tanstack-router',
];

// Framework mode routes through React Router's own build, so it has no `App.tsx`.
export const DECLARATIVE_ROUTERS: readonly Router[] = ['react-router', 'tanstack-router'];

export const ALWAYS: readonly string[] = ['src/components/ui/mark/Mark.tsx'];

// Page paths without their extension, since each ships a translated twin and a suite.
export const ALWAYS_PAGES: readonly string[] = [
  'src/pages/about/AboutPage',
  'src/pages/version/VersionPage',
];

export const CONTACT_PAGE = 'src/pages/contact/ContactPage';

export const SHARED: readonly string[] = [
  'src/lib/utils/statusUtils.ts',
  'src/styles/tokens.css',
  'src/styles/base.css',
  'public/favicon.svg',
];

// A camelCase `.tsx` is refused by the naming rule, so hooks take `.ts` suites.
export const REACT_ACCESSORS: AccessorNames = {
  directory: 'src/lib/hooks',
  query: 'useExtendedQuery',
  mutation: 'useExtendedMutation',
  testSuffix: '.test.ts',
};

export const WELL_KNOWN_404 = `{
      // Chrome DevTools asks for \`/.well-known/\` files, and React Router logs each miss as an error.
      name: 'well-known-404',
      configureServer: (server) => {
        server.middlewares
          .use((request, response, next) => {
            if (request.url?.startsWith('/.well-known/') === true) {
              response.statusCode = 404;
              response.end();

              return;
            }

            next();
          });
      },
    }`;

// i18next is the most used React i18n, and react-i18next and its browser detector are its own.
export const REACT_I18N: I18nParts = {
  dependencies: [
    'i18next',
    'i18next-browser-languagedetector',
    'react-i18next',
  ],
  testSetup: 'fragments/test-setup/setupTests.i18n.ts',
};

// Each `root.tsx` variant, and whether it is the StyleX one.
export const ROOT_VARIANTS = [['react-router-framework', false], ['stylex', true]] as const;
