import { EMPTY_PROJECT, MANAGED_PATH } from '@config/constants';
import {
  type Artifact,
  type Emitter,
  type ProjectShape,
} from '@config/types';

import { claudeSettingsEmitter } from './agents/claude-settings/claudeSettingsEmitter';
import { codexMarketplaceEmitter } from './agents/codex-marketplace/codexMarketplaceEmitter';
import { copilotHooksEmitter } from './agents/copilot-hooks/copilotHooksEmitter';
import { copilotInstructionsEmitter } from './agents/copilot-instructions/copilotInstructionsEmitter';
import { cursorHooksEmitter } from './agents/cursor-hooks/cursorHooksEmitter';
import { cursorRulesEmitter } from './agents/cursor-rules/cursorRulesEmitter';
import { bannedPatternsEmitter } from './always/banned-patterns/bannedPatternsEmitter';
import { ciWorkflowEmitter } from './always/ci-workflow/ciWorkflowEmitter';
import { commitlintEmitter } from './always/commitlint/commitlintEmitter';
import { eslintConfigEmitter } from './always/eslint-config/eslintConfigEmitter';
import { gitignoreEmitter } from './always/gitignore/gitignoreEmitter';
import { huskyEmitter } from './always/husky/huskyEmitter';
import { lintStagedEmitter } from './always/lint-staged/lintStagedEmitter';
import { linteljsConfigEmitter } from './always/linteljs-config/linteljsConfigEmitter';
import { linteljsPluginEmitter } from './always/linteljs-plugin/linteljsPluginEmitter';
import { linteljsRecordEmitter } from './always/linteljs-record/linteljsRecordEmitter';
import { loggerUtilsEmitter } from './always/logger-utils/loggerUtilsEmitter';
import { packageJsonEmitter } from './always/package-json/packageJsonEmitter';
import { readmeEmitter } from './always/readme/readmeEmitter';
import { stylelintConfigEmitter } from './always/stylelint-config/stylelintConfigEmitter';
import { tsconfigEmitter } from './always/tsconfig/tsconfigEmitter';
import { typecheckStagedEmitter } from './always/typecheck-staged/typecheckStagedEmitter';
import { styleEntryEmitter } from './libraries/style-entry/styleEntryEmitter';
import { npmrcEmitter } from './manager/npmrc/npmrcEmitter';
import { pnpmWorkspaceEmitter } from './manager/pnpm-workspace/pnpmWorkspaceEmitter';
import { yarnrcEmitter } from './manager/yarnrc/yarnrcEmitter';
import { angularConfigEmitter } from './target/angular-config/angularConfigEmitter';
import { astroConfigEmitter } from './target/astro-config/astroConfigEmitter';
import { expoConfigEmitter } from './target/expo-config/expoConfigEmitter';
import { htmlEntryEmitter } from './target/html-entry/htmlEntryEmitter';
import { manifestEmitter } from './target/manifest/manifestEmitter';
import { nuxtConfigEmitter } from './target/nuxt-config/nuxtConfigEmitter';
import { reactRouterConfigEmitter } from './target/react-router-config/reactRouterConfigEmitter';
import { starterSourceEmitter } from './target/starter-source/starterSourceEmitter';
import { viteConfigEmitter } from './target/vite-config/viteConfigEmitter';
import { testSetupEmitter } from './testing/test-setup/testSetupEmitter';
import { vitestConfigEmitter } from './testing/vitest-config/vitestConfigEmitter';
import { customTypesEmitter } from './typesafety/custom-types/customTypesEmitter';
import { emitted } from './utils/artifactUtils';
import { managedRecord, removableIn } from './utils/managedUtils';

import type { HostedAnswers } from '@answers';

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
  'always/linteljs-plugin': linteljsPluginEmitter,
  'agents/claude-settings': claudeSettingsEmitter,
  'agents/codex-marketplace': codexMarketplaceEmitter,
  'agents/copilot-instructions': copilotInstructionsEmitter,
  'agents/copilot-hooks': copilotHooksEmitter,
  'agents/cursor-rules': cursorRulesEmitter,
  'agents/cursor-hooks': cursorHooksEmitter,
  'always/banned-patterns': bannedPatternsEmitter,
  'always/husky': huskyEmitter,
  'always/lint-staged': lintStagedEmitter,
  'always/commitlint': commitlintEmitter,
  'always/tsconfig': tsconfigEmitter,
  'always/typecheck-staged': typecheckStagedEmitter,
  'always/logger-utils': loggerUtilsEmitter,
  'always/ci-workflow': ciWorkflowEmitter,
  'typesafety/custom-types': customTypesEmitter,
  'libraries/style-entry': styleEntryEmitter,
  'always/package-json': packageJsonEmitter,
  'always/gitignore': gitignoreEmitter,
  'manager/pnpm-workspace': pnpmWorkspaceEmitter,
  'target/vite-config': viteConfigEmitter,
  'target/astro-config': astroConfigEmitter,
  'target/react-router-config': reactRouterConfigEmitter,
  'target/nuxt-config': nuxtConfigEmitter,
  'testing/vitest-config': vitestConfigEmitter,
  'testing/test-setup': testSetupEmitter,
  'manager/npmrc': npmrcEmitter,
  'manager/yarnrc': yarnrcEmitter,
};

// What a `create` run plants and `sync` never touches.
export const SEED_EMITTERS: Record<string, Emitter> = {
  'always/linteljs-config': linteljsConfigEmitter,
  'always/readme': readmeEmitter,
  'always/linteljs-record': linteljsRecordEmitter,
  'target/angular-config': angularConfigEmitter,
  'target/expo-config': expoConfigEmitter,
  'target/html-entry': htmlEntryEmitter,
  'target/manifest': manifestEmitter,
  'target/starter-source': starterSourceEmitter,
};

/**
 * Every file this CLI owns some or all of, which both `create` and `sync` write from. A merge belongs here, not in
 * a stage, or it reaches new projects and no old one. One line per emitter and no branch: whether a file is written
 * is the emitter's own question.
 */
export const buildArtifacts = (answers: HostedAnswers, project: ProjectShape, name: string): Artifact[] => {
  const artifacts = Object.values(BUILD_EMITTERS).flatMap((emit) => {
    return emit(answers, project, name);
  });

  /**
   * The record last, because it is a fact about the list rather than a member of it: every path above that this CLI
   * owns outright, which is what a later `sync` may remove once an answer stops asking for it. Computed here rather
   * than by an emitter, since an emitter would have to leave itself out of its own input.
   */
  return [...artifacts, emitted('standard', MANAGED_PATH, managedRecord(removableIn(artifacts)))];
};

/**
 * What a project is seeded with and owns afterward. Kept out of `buildArtifacts` because that list is what
 * `sync` re-applies and none of this is linteljs's to maintain once the project has it. Everything here still
 * reaches disk as an `Artifact`, so `applyArtifact` is the only writer either way.
 */
export const seedArtifacts = (
  answers: HostedAnswers,
  name: string,
  project: ProjectShape = EMPTY_PROJECT,
): Artifact[] => {
  return Object.values(SEED_EMITTERS).flatMap((emit) => {
    return emit(answers, project, name);
  });
};
