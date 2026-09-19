import { agentArtifacts } from './agentArtifacts';
import { astroConfigEmitter } from './astro-config/astroConfigEmitter';
import { bannedPatternsEmitter } from './banned-patterns/bannedPatternsEmitter';
import { ciWorkflowEmitter } from './ci-workflow/ciWorkflowEmitter';
import { commitlintEmitter } from './commitlint/commitlintEmitter';
import { customTypesEmitter } from './custom-types/customTypesEmitter';
import { eslintConfigEmitter } from './eslint-config/eslintConfigEmitter';
import { gitignoreEmitter } from './gitignore/gitignoreEmitter';
import { huskyEmitter } from './husky/huskyEmitter';
import { lintStagedEmitter } from './lint-staged/lintStagedEmitter';
import { npmrcEmitter } from './npmrc/npmrcEmitter';
import { packageJsonEmitter } from './package-json/packageJsonEmitter';
import { pnpmWorkspaceEmitter } from './pnpm-workspace/pnpmWorkspaceEmitter';
import { styleEntryEmitter } from './style-entry/styleEntryEmitter';
import { stylelintConfigEmitter } from './stylelint-config/stylelintConfigEmitter';
import { testSetupEmitter } from './test-setup/testSetupEmitter';
import { tsconfigEmitter } from './tsconfig/tsconfigEmitter';
import { typecheckStagedEmitter } from './typecheck-staged/typecheckStagedEmitter';
import { viteConfigEmitter } from './vite-config/viteConfigEmitter';
import { vitestConfigEmitter } from './vitest-config/vitestConfigEmitter';
import { yarnrcEmitter } from './yarnrc/yarnrcEmitter';

import type { Emitter } from './artifact';

/**
 * Keyed by the directory the emitter lives in, which is named for the file it writes, so the path is spelled once
 * and `meta.test.ts` holds this listing against the directory listing in both directions. Insertion order is write
 * order within a stage, which is why `lintel-config` precedes `package-json` in the seeded list.
 *
 * What `create` and `sync` both write from. A condition belongs to the emitter that owns it, so there is nothing
 * to branch on here.
 */
export const BUILD_EMITTERS: Record<string, Emitter> = {
  'eslint-config': eslintConfigEmitter,
  'stylelint-config': stylelintConfigEmitter,
  'agents': agentArtifacts,
  'banned-patterns': bannedPatternsEmitter,
  'husky': huskyEmitter,
  'lint-staged': lintStagedEmitter,
  'commitlint': commitlintEmitter,
  'tsconfig': tsconfigEmitter,
  'typecheck-staged': typecheckStagedEmitter,
  'ci-workflow': ciWorkflowEmitter,
  'custom-types': customTypesEmitter,
  'style-entry': styleEntryEmitter,
  'package-json': packageJsonEmitter,
  'gitignore': gitignoreEmitter,
  'pnpm-workspace': pnpmWorkspaceEmitter,
  'vite-config': viteConfigEmitter,
  'astro-config': astroConfigEmitter,
  'vitest-config': vitestConfigEmitter,
  'test-setup': testSetupEmitter,
  'npmrc': npmrcEmitter,
  'yarnrc': yarnrcEmitter,
};
