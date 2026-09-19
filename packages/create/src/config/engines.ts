import type { PackageManager } from '../answers/answers';

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
