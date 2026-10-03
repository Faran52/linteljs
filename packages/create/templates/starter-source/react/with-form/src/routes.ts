import {
  index,
  route,
  type RouteConfig,
} from '@react-router/dev/routes';

// Literal paths: the config reads this file before any page module loads.
export default [
  index('routes/home.tsx'),
  route('contact', 'routes/contact.tsx'),
  route('about', 'routes/about.tsx'),
  route('version', 'routes/version.tsx'),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
