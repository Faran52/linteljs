import type { Router } from '@config/types';
import type { AccessorNames } from '../utils/mockUtils';

export const ROUTERS: readonly Router[] = ['react-router', 'react-router-framework', 'tanstack-router'];

// Framework mode routes through React Router's own build, so it has no `App.tsx`.
export const DECLARATIVE_ROUTERS: readonly Router[] = ['react-router', 'tanstack-router'];

export const ALWAYS: readonly string[] = [
  'src/pages/about/AboutPage.tsx',
  'src/pages/version/VersionPage.tsx',
  'src/components/ui/mark/Mark.tsx',
];

export const SHARED: readonly string[] = [
  'src/config/standard.ts',
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
