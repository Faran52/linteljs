import {
  index,
  route,
  type RouteConfig,
} from '@react-router/dev/routes';

/*
 * The route table React Router reads at build time to generate each module's types, which is why the paths are
 * literals rather than derived from `ROUTES`: this file is read by the config, before any page module loads.
 * `ROUTES` stays the one list the header renders from, and a page added there is added here in one line.
 */
export default [
  index('routes/home.tsx'),
  route('about', 'routes/about.tsx'),
  route('version', 'routes/version.tsx'),
] satisfies RouteConfig;
