// What every project produces or must not commit, whatever its target.
export const BASE_IGNORED = [
  'node_modules/',
  '.env',
  '.env.*',
  '!.env.example',
  '.DS_Store',
  'coverage/',
  '*.tsbuildinfo',
];

// Yarn's own list for a project without Zero-Installs, from yarnpkg.com/getting-started/qa.
export const YARN_IGNORED = [
  '.yarn/*',
  '!.yarn/patches',
  '!.yarn/plugins',
  '!.yarn/releases',
  '!.yarn/sdks',
  '!.yarn/versions',
  '.pnp.*',
];

export const HEADING = '# linteljs';
