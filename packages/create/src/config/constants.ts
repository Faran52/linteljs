import type { PackageManager } from '../answers/answers';
import type { ProjectShape, Stage } from './types';

/**
 * What a generated project declares it needs, and what the CLI refuses to run without. Read from `emitters/`,
 * which writes both into `package.json`, and from `process/`, which refuses a manager or a Node older than these
 * rather than letting a downstream tool fail three stages later. Neither ring owns it, so it sits below both.
 */
// An exact version: corepack rejects a range in `packageManager`.
export const PACKAGE_MANAGER_VERSIONS: Record<PackageManager, string> = {
  pnpm: '12.4.1',
  // 11, not 12: `create-expo-app` cannot read npm 12's `npm pack --dry-run --json`, so React Native needs npm 11
  // on PATH, and a project declaring a 12 floor then warns EBADENGINE on every install. expo/expo#48091.
  npm: '11.19.1',
  yarn: '4.18.0',
  bun: '1.3.14',
};

export const NODE_ENGINE = '>=26.8.2';

// How each manager is asked to run a script, which the emitters write into a generated `package.json` and its CI
// workflow, and which `terminal/` and `pipeline/` print and spawn. No ring owns it, so it sits below all of them.
export const RUN_PREFIX: Record<PackageManager, string> = {
  pnpm: 'pnpm',
  npm: 'npm run',
  yarn: 'yarn',
  bun: 'bun run',
};

/**
 * What this CLI put in a project, recorded where it can rewrite it freely. `sync` removes what is in here and no
 * longer expected, which is the only way it can know that an answer used to ask for a file: the answers live in
 * `linteljs.config.json` and a hand edit to that file leaves no trace of what they were.
 *
 * Its own tree rather than the config, because the config is the project's to reformat and `sync` never rewrites
 * it. This file is nobody's but linteljs's, so a sync may.
 */
export const MANAGED_PATH = 'plugins/linteljs/managed.json';

export const STAGES: Stage[] = [
  'scaffold',
  'lint',
  'package',
  'standard',
  'install',
  'fix',
];

// Birth, or planning without reading disk.
export const EMPTY_PROJECT: ProjectShape = {
  setupTests: [],
  styleEntries: [],
};
