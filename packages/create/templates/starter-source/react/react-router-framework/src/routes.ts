import {
  index,
  route,
  type RouteConfig,
} from '@react-router/dev/routes';

// Literal paths: the config reads this file before any page module loads.
export default [
  index('routes/home/HomeRoute.tsx'),
  route('about', 'routes/about/AboutRoute.tsx'),
  route('version', 'routes/version/VersionRoute.tsx'),
  route('*', 'routes/not-found/NotFoundRoute.tsx'),
] satisfies RouteConfig;
