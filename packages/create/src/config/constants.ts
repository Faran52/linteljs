import {
  type Framework,
  type Language,
  type PackageManager,
  type ProjectShape,
  type Stage,
} from './types';

// Refused below rather than installed, so a downstream tool does not fail three stages later.
export const MANAGER_FLOORS: Record<PackageManager, string> = {
  pnpm: '10.26.0',
  npm: '9.6.5',
  yarn: '4.0.0',
  bun: '1.2.0',
};

// 22.18.0 is the first release that strips types by default, which the shipped scripts and hooks need.
// The CLI and the project it writes share it, so a machine that runs `create` also runs the project.
export const NODE_FLOOR = '22.18.0';

export const RUN_PREFIX: Record<PackageManager, string> = {
  pnpm: 'pnpm',
  npm: 'npm run',
  yarn: 'yarn',
  bun: 'bun run',
};

// `sync` removes what is in here and no longer expected; a hand edit to the config leaves no trace.
export const MANAGED_PATH = 'plugins/linteljs/managed.json';

export const STAGES: Stage[] = [
  'lint',
  'package',
  'standard',
  'install',
  'fix',
];

export const EMPTY_PROJECT: ProjectShape = {
  setupTests: [],
  styleEntries: [],
};

// The order a project lists them in.
export const LANGUAGES: readonly Language[] = [
  'en',
  'ar',
  'ja',
  'ko',
  'zh-CN',
  'zh-TW',
];

const REACT_GROUP = [
  '^react$',
  '^react-dom$',
  '^react/',
  '^react-',
  '^@react',
];
const VUE_GROUP = [
  '^vue$',
  '^vue-router$',
  '^pinia$',
  '^@vue/',
];

// Each framework's import group, sorted first; `src/types.test.ts` pins them to eslint-config's.
export const FRAMEWORK_GROUPS: Record<Framework, string[]> = {
  'react': REACT_GROUP,
  'next': [
    ...REACT_GROUP,
    '^next$',
    '^next/',
  ],
  'react-native': REACT_GROUP,
  'vue': VUE_GROUP,
  'nuxt': [
    ...VUE_GROUP,
    '^nuxt$',
    '^nuxt/',
    '^#',
  ],
  'svelte': [
    '^svelte$',
    '^svelte/',
    '^@sveltejs/',
    String.raw`^\$app/`,
    String.raw`^\$env/`,
  ],
  'solid': [
    '^solid-js$',
    '^solid-js/',
    '^@solidjs/',
  ],
  'angular': [
    '^@angular/',
    '^rxjs$',
    '^rxjs/',
  ],
};
