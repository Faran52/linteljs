import {
  index,
  route,
  type RouteConfig,
} from '@react-router/dev/routes';

// Literal paths: the config reads this file before any page module loads.
export default [
  index('routes/home.tsx'),
  route('about', 'routes/about.tsx'),
  route('version', 'routes/version.tsx'),
] satisfies RouteConfig;
