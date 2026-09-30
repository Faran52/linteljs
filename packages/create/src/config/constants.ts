import {
  type Language,
  type PackageManager,
  type ProjectShape,
  type Stage,
} from './types';

// Refused below rather than installed, so a downstream tool does not fail three stages later.
export const MANAGER_FLOORS: Record<PackageManager, string> = {
  'pnpm': '10.26.0',
  'npm': '9.6.5',
  'yarn': '4.0.0',
  'yarn-classic': '1.22.22',
  'bun': '1.2.0',
};

// `yarn-classic` runs `yarn`: a manifest declaring `yarn-classic` could not be installed.
export const MANAGER_BINARIES: Record<PackageManager, string> = {
  'pnpm': 'pnpm',
  'npm': 'npm',
  'yarn': 'yarn',
  'yarn-classic': 'yarn',
  'bun': 'bun',
};

// 22.18.0 is the first release that strips types by default, which the shipped scripts and hooks need.
export const NODE_ENGINE = '>=22.18';

// `@inquirer/prompts` 8 declares `^22.13.0 || >=23.5.0`; nothing the CLI runs strips types.
export const NODE_FLOOR = '22.13.0';

export const RUN_PREFIX: Record<PackageManager, string> = {
  'pnpm': 'pnpm',
  'npm': 'npm run',
  'yarn': 'yarn',
  // `run`, unlike Berry: `yarn check` on 1.x is yarn's own lockfile check, which would shadow the project's gate.
  'yarn-classic': 'yarn run',
  'bun': 'bun run',
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
