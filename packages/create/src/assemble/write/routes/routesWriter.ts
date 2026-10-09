import { pascalCase } from 'es-toolkit';

import { quote } from '@emitters/utils/quoteUtils';

import {
  isShare,
  type Share,
  type ShareValue,
} from '../../utils/shareUtils';

interface Route {
  path: string;
  name: string;
  from: string;
}

const isRoute = (value: ShareValue): value is Share & Route => {
  return isShare(value) && typeof value['path'] === 'string' && typeof value['name'] === 'string'
    && typeof value['from'] === 'string';
};

// The `routes` share is a list of `{ path, name, from }`, each page a default import.
export const routesWriter = (share: Share): string => {
  const { routes } = share;

  if (!Array.isArray(routes) || !routes.every(isRoute)) {
    throw new Error('share key routes must be a list of { path, name, from }');
  }

  const imports = routes
    .map((route) => {
      return `import ${pascalCase(route.name)} from ${quote(route.from)};`;
    });
  const entries = routes
    .map((route) => {
      return `  { path: ${quote(route.path)}, name: ${quote(route.name)}, component: ${pascalCase(route.name)} },`;
    });

  const lines = [
    ...imports,
    '',
    'export const ROUTES = [',
    ...entries,
    '];',
    '',
  ];

  return lines.join('\n');
};
