import {
  type PackageManager,
  type ProjectShape,
  type Stage,
} from './types';

/**
 * The floors a generated project's own files need, refused below rather than installed, so a downstream tool does
 * not fail three stages later: pnpm 10.26 reads `allowBuilds`, npm 9.6.5 is what Astro asks, yarn 4 reads the
 * `.yarnrc.yml` written here (yarn 1 forwards to it through `dlx` and the `packageManager` field, so it never runs a
 * project of ours), bun 1.2 writes the text lockfile.
 */
export const MANAGER_FLOORS: Record<PackageManager, string> = {
  'pnpm': '10.26.0',
  'npm': '9.6.5',
  'yarn': '4.0.0',
  'yarn-classic': '1.22.22',
  'bun': '1.2.0',
};

/**
 * The command each id runs, which is the id itself for all but one: `yarn-classic` is yarn 1, wearing the same
 * `yarn` command as Berry. Anything that spawns a manager or writes one into a manifest reads this rather than the
 * id, or a project ends up declaring a `yarn-classic` nobody can install.
 */
export const MANAGER_BINARIES: Record<PackageManager, string> = {
  'pnpm': 'pnpm',
  'npm': 'npm',
  'yarn': 'yarn',
  'yarn-classic': 'yarn',
  'bun': 'bun',
};

/**
 * A generated project declares `>=22.18` and means it: the shipped `scripts/*.ts` and the plugin's hooks run as plain
 * `node file.ts`, and 22.18.0 is the first release that strips types by default. The pinned tools ask for more
 * (`@angular/create` and lint-staged 17.3 want 22.22), and say so themselves as EBADENGINE warnings; that is theirs to
 * declare, not ours to copy.
 */
export const NODE_ENGINE = '>=22.18';

/**
 * The CLI's own floor: `@inquirer/prompts` 8 declares `^22.13.0 || >=23.5.0`, and a questionnaire that reads raw
 * keypresses is not something to run below what its own library supports. It sits below `NODE_ENGINE` because
 * nothing the CLI runs strips types; the project it writes is what needs 22.18.
 */
export const NODE_FLOOR = '22.13.0';

// How each manager is asked to run a script, which the emitters write into a generated `package.json` and its CI
// workflow, and which `terminal/` and `pipeline/` print and spawn. No ring owns it, so it sits below all of them.
export const RUN_PREFIX: Record<PackageManager, string> = {
  'pnpm': 'pnpm',
  'npm': 'npm run',
  'yarn': 'yarn',
  // `run`, unlike Berry: `yarn check` on 1.x is yarn's own lockfile check, which would shadow the project's gate.
  'yarn-classic': 'yarn run',
  'bun': 'bun run',
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
