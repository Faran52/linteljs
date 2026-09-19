import type { PackageManager } from '../answers/answers';

// How each manager is asked to run a script, which the emitters write into a generated `package.json` and its CI
// workflow, and which `terminal/` and `pipeline/` print and spawn. No ring owns it, so it sits below all of them.
export const RUN_PREFIX: Record<PackageManager, string> = {
  pnpm: 'pnpm',
  npm: 'npm run',
  yarn: 'yarn',
  bun: 'bun run',
};
