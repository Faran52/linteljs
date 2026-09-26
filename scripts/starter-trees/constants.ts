import type { TargetId } from '../../packages/create/src/answers';

// Where a page lives on each target, printed under its tree.
export const ROUTE_UNIT: Record<TargetId, string> = {
  'angular': 'src/app/',
  'astro': 'src/pages/, whose files are the routes',
  'next': 'src/app/',
  'nuxt': 'src/pages/, whose files are the routes',
  'react': 'src/pages/<kebab>/{Name}Page.tsx',
  'react-native': 'src/app/',
  'solid': 'src/pages/<kebab>/{Name}Page.tsx',
  'svelte': 'src/routes/',
  'vue': 'src/views/, routed from src/router/',
  'webextension': 'manifest.json, whose entries name every surface',
};
