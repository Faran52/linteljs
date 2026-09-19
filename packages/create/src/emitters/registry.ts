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
import { linteljsConfigEmitter } from './always/linteljs-config/linteljsConfigEmitter';
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
 * order within a stage, which is why `linteljs-config` precedes `package-json` in the seeded list.
 *
 * What `create` and `sync` both write from. A condition belongs to the emitter that owns it, so there is nothing
 * to branch on here.
 */
export const BUILD_EMITTERS: Record<string, Emitter> = {
  'always/eslint-config': eslintConfigEmitter,
  'always/stylelint-config': stylelintConfigEmitter,
  'agents/linteljs-plugin': linteljsPluginEmitter,
  'agents/claude-settings': claudeSettingsEmitter,
  'agents/codex-marketplace': codexMarketplaceEmitter,
  'agents/copilot-instructions': copilotInstructionsEmitter,
  'agents/cursor-rules': cursorRulesEmitter,
  'always/banned-patterns': bannedPatternsEmitter,
  'always/husky': huskyEmitter,
  'always/lint-staged': lintStagedEmitter,
  'always/commitlint': commitlintEmitter,
  'always/tsconfig': tsconfigEmitter,
  'always/typecheck-staged': typecheckStagedEmitter,
  'always/ci-workflow': ciWorkflowEmitter,
  'typesafety/custom-types': customTypesEmitter,
  'libraries/style-entry': styleEntryEmitter,
  'always/package-json': packageJsonEmitter,
  'always/gitignore': gitignoreEmitter,
  'manager/pnpm-workspace': pnpmWorkspaceEmitter,
  'target/vite-config': viteConfigEmitter,
  'target/astro-config': astroConfigEmitter,
  'testing/vitest-config': vitestConfigEmitter,
  'testing/test-setup': testSetupEmitter,
  'manager/npmrc': npmrcEmitter,
  'manager/yarnrc': yarnrcEmitter,
};

// What a `create` run plants and `sync` never touches. The split is not new: it is what the stage runners were
// expressing by writing these outside the artifact list, said once.
export const SEED_EMITTERS: Record<string, Emitter> = {
  'always/linteljs-config': linteljsConfigEmitter,
  'always/readme': readmeEmitter,
  'target/manifest': manifestEmitter,
  'target/starter-source': starterSourceEmitter,
};
