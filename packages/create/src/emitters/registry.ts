import { claudeSettingsEmitter } from './agents/claude-settings/claudeSettingsEmitter';
import { codexMarketplaceEmitter } from './agents/codex-marketplace/codexMarketplaceEmitter';
import { copilotInstructionsEmitter } from './agents/copilot-instructions/copilotInstructionsEmitter';
import { cursorRulesEmitter } from './agents/cursor-rules/cursorRulesEmitter';
import { linteljsPluginEmitter } from './agents/linteljs-plugin/linteljsPluginEmitter';
import { bannedPatternsEmitter } from './always/banned-patterns/bannedPatternsEmitter';
import { ciWorkflowEmitter } from './always/ci-workflow/ciWorkflowEmitter';
import { commitlintEmitter } from './always/commitlint/commitlintEmitter';
import { eslintConfigEmitter } from './always/eslint-config/eslintConfigEmitter';
import { gitignoreEmitter } from './always/gitignore/gitignoreEmitter';
import { huskyEmitter } from './always/husky/huskyEmitter';
import { lintStagedEmitter } from './always/lint-staged/lintStagedEmitter';
import { lintelConfigEmitter } from './always/lintel-config/lintelConfigEmitter';
import { packageJsonEmitter } from './always/package-json/packageJsonEmitter';
import { readmeEmitter } from './always/readme/readmeEmitter';
import { stylelintConfigEmitter } from './always/stylelint-config/stylelintConfigEmitter';
import { tsconfigEmitter } from './always/tsconfig/tsconfigEmitter';
import { typecheckStagedEmitter } from './always/typecheck-staged/typecheckStagedEmitter';
import { styleEntryEmitter } from './libraries/style-entry/styleEntryEmitter';
import { npmrcEmitter } from './manager/npmrc/npmrcEmitter';
import { pnpmWorkspaceEmitter } from './manager/pnpm-workspace/pnpmWorkspaceEmitter';
import { yarnrcEmitter } from './manager/yarnrc/yarnrcEmitter';
import { astroConfigEmitter } from './target/astro-config/astroConfigEmitter';
import { manifestEmitter } from './target/manifest/manifestEmitter';
import { starterSourceEmitter } from './target/starter-source/starterSourceEmitter';
import { viteConfigEmitter } from './target/vite-config/viteConfigEmitter';
import { testSetupEmitter } from './testing/test-setup/testSetupEmitter';
import { vitestConfigEmitter } from './testing/vitest-config/vitestConfigEmitter';
import { customTypesEmitter } from './typesafety/custom-types/customTypesEmitter';

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
  'linteljs-plugin': linteljsPluginEmitter,
  'claude-settings': claudeSettingsEmitter,
  'codex-marketplace': codexMarketplaceEmitter,
  'copilot-instructions': copilotInstructionsEmitter,
  'cursor-rules': cursorRulesEmitter,
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

// What a `create` run plants and `sync` never touches. The split is not new: it is what the stage runners were
// expressing by writing these outside the artifact list, said once.
export const SEED_EMITTERS: Record<string, Emitter> = {
  'lintel-config': lintelConfigEmitter,
  'readme': readmeEmitter,
  'manifest': manifestEmitter,
  'starter-source': starterSourceEmitter,
};
