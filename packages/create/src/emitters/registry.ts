import { EMPTY_PROJECT, MANAGED_PATH } from '@config/constants';
import {
  type Artifact,
  type Emitter,
  type ProjectShape,
  type RootEmitter,
  type Workspace,
  type WorkspaceProject,
} from '@config/types';

import { projectDirectoryOf } from '@utils/answerUtils';

import { agentsMdEmitter } from './agents/agents-md/agentsMdEmitter';
import { antigravityRulesEmitter } from './agents/antigravity-rules/antigravityRulesEmitter';
import { claudeSettingsEmitter } from './agents/claude-settings/claudeSettingsEmitter';
import { codexMarketplaceEmitter } from './agents/codex-marketplace/codexMarketplaceEmitter';
import { copilotHooksEmitter } from './agents/copilot-hooks/copilotHooksEmitter';
import { copilotInstructionsEmitter } from './agents/copilot-instructions/copilotInstructionsEmitter';
import { cursorHooksEmitter } from './agents/cursor-hooks/cursorHooksEmitter';
import { cursorRulesEmitter } from './agents/cursor-rules/cursorRulesEmitter';
import { geminiSettingsEmitter } from './agents/gemini-settings/geminiSettingsEmitter';
import { bannedPatternsEmitter } from './always/banned-patterns/bannedPatternsEmitter';
import { ciWorkflowEmitter } from './always/ci-workflow/ciWorkflowEmitter';
import { commitGateEmitter } from './always/commit-gate/commitGateEmitter';
import { eslintConfigEmitter } from './always/eslint-config/eslintConfigEmitter';
import { gitignoreEmitter } from './always/gitignore/gitignoreEmitter';
import { huskyEmitter } from './always/husky/huskyEmitter';
import { linteljsConfigEmitter } from './always/linteljs-config/linteljsConfigEmitter';
import { linteljsPluginEmitter } from './always/linteljs-plugin/linteljsPluginEmitter';
import { linteljsRecordEmitter } from './always/linteljs-record/linteljsRecordEmitter';
import { packageJsonEmitter } from './always/package-json/packageJsonEmitter';
import { readmeEmitter } from './always/readme/readmeEmitter';
import { stylelintConfigEmitter } from './always/stylelint-config/stylelintConfigEmitter';
import { tsconfigEmitter } from './always/tsconfig/tsconfigEmitter';
import { workspaceRootEmitter } from './layout/workspace-root/workspaceRootEmitter';
import { i18nConfigEmitter } from './libraries/i18n-config/i18nConfigEmitter';
import { styleEntryEmitter } from './libraries/style-entry/styleEntryEmitter';
import { bunfigEmitter } from './manager/bunfig/bunfigEmitter';
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
import { tsdownConfigEmitter } from './target/tsdown-config/tsdownConfigEmitter';
import { viteConfigEmitter } from './target/vite-config/viteConfigEmitter';
import { jestConfigEmitter } from './testing/jest-config/jestConfigEmitter';
import { testSetupEmitter } from './testing/test-setup/testSetupEmitter';
import { vitestConfigEmitter } from './testing/vitest-config/vitestConfigEmitter';
import { customTypesEmitter } from './typesafety/custom-types/customTypesEmitter';
import { emitted } from './utils/artifactUtils';
import { atRoot, inProject } from './utils/layoutUtils';
import { managedRecord, removableIn } from './utils/managedUtils';

// Insertion order is write order within a stage, so `linteljs-config` precedes `package-json`.
export const BUILD_EMITTERS: Record<string, Emitter> = {
  'always/eslint-config': eslintConfigEmitter,
  'always/stylelint-config': stylelintConfigEmitter,
  'agents/claude-settings': claudeSettingsEmitter,
  'agents/codex-marketplace': codexMarketplaceEmitter,
  'agents/copilot-hooks': copilotHooksEmitter,
  'agents/cursor-hooks': cursorHooksEmitter,
  'agents/gemini-settings': geminiSettingsEmitter,
  'always/banned-patterns': bannedPatternsEmitter,
  'always/husky': huskyEmitter,
  'always/commit-gate': commitGateEmitter,
  'always/tsconfig': tsconfigEmitter,
  'always/ci-workflow': ciWorkflowEmitter,
  'typesafety/custom-types': customTypesEmitter,
  'libraries/style-entry': styleEntryEmitter,
  'always/package-json': packageJsonEmitter,
  'always/gitignore': gitignoreEmitter,
  'target/vite-config': viteConfigEmitter,
  'target/astro-config': astroConfigEmitter,
  'target/react-router-config': reactRouterConfigEmitter,
  'target/nuxt-config': nuxtConfigEmitter,
  'testing/vitest-config': vitestConfigEmitter,
  'testing/jest-config': jestConfigEmitter,
  'testing/test-setup': testSetupEmitter,
  'manager/yarnrc': yarnrcEmitter,
  'manager/bunfig': bunfigEmitter,
};

export const SEED_EMITTERS: Record<string, Emitter> = {
  'always/linteljs-record': linteljsRecordEmitter,
  'target/angular-config': angularConfigEmitter,
  'target/expo-config': expoConfigEmitter,
  'target/html-entry': htmlEntryEmitter,
  'target/manifest': manifestEmitter,
  'target/tsdown-config': tsdownConfigEmitter,
  'libraries/i18n-config': i18nConfigEmitter,
  'target/starter-source': starterSourceEmitter,
};

// Written once at the git root from every project, so no project emits them twice.
export const ROOT_EMITTERS: Record<string, RootEmitter> = {
  'manager/pnpm-workspace': pnpmWorkspaceEmitter,
  'layout/workspace-root': workspaceRootEmitter,
  'always/linteljs-plugin': linteljsPluginEmitter,
  'agents/copilot-instructions': copilotInstructionsEmitter,
  'agents/cursor-rules': cursorRulesEmitter,
  'agents/antigravity-rules': antigravityRulesEmitter,
  'agents/agents-md': agentsMdEmitter,
};

// Seeded first, so `linteljs.config.json` precedes the `package.json` its answers imply.
export const ROOT_SEED_EMITTERS: Record<string, RootEmitter> = {
  'always/linteljs-config': linteljsConfigEmitter,
  'always/readme': readmeEmitter,
};

const emittedBy = (
  emitters: Record<string, Emitter>,
  { name, answers }: WorkspaceProject,
  shape: ProjectShape,
): Artifact[] => {
  return Object.values(emitters)
    .flatMap((emit) => {
      return emit(answers, shape, name);
    });
};

const rootEmittedBy = (emitters: Record<string, RootEmitter>, workspace: Workspace): Artifact[] => {
  return Object.values(emitters)
    .flatMap((emit) => {
      return emit(workspace);
    });
};

// The first project's root files stand for every project's: a test holds them equal across targets.
const projectsEmittedBy = (
  emitters: Record<string, Emitter>,
  workspace: Workspace,
  shapes: readonly ProjectShape[],
): Artifact[] => {
  return workspace.projects
    .flatMap((project, index) => {
      const artifacts = emittedBy(emitters, project, shapes[index] ?? EMPTY_PROJECT);
      const own = index === 0
        ? artifacts
        : artifacts
            .filter(({ target }) => {
              return !atRoot(target);
            });

      const directory = projectDirectoryOf(project.answers, project.name);

      return inProject(directory, own);
    });
};

// A merge belongs here, not in a stage, or it reaches new projects and no old one.
export const buildArtifacts = (workspace: Workspace, shapes: readonly ProjectShape[] = []): Artifact[] => {
  const artifacts = projectsEmittedBy(BUILD_EMITTERS, workspace, shapes);
  const rootArtifacts = rootEmittedBy(ROOT_EMITTERS, workspace);

  // Computed here: an emitter would have to leave itself out of its own input.
  const removable = removableIn([...artifacts, ...rootArtifacts]);
  const record = managedRecord(removable);
  const managed = emitted('standard', MANAGED_PATH, record);
  const withManaged = [
    ...artifacts,
    ...rootArtifacts,
    managed,
  ];

  return withManaged;
};

// Kept out of `buildArtifacts`, which `sync` re-applies: none of this is linteljs's once the project has it.
export const seedArtifacts = (workspace: Workspace): Artifact[] => {
  const artifacts = [
    ...rootEmittedBy(ROOT_SEED_EMITTERS, workspace),
    ...projectsEmittedBy(SEED_EMITTERS, workspace, []),
  ];

  return artifacts;
};

// `sync --add`: a new project's own files, seeds and all; the root's are the workspace's already.
export const projectArtifacts = (project: WorkspaceProject): Artifact[] => {
  const artifacts = [
    ...emittedBy(SEED_EMITTERS, project, EMPTY_PROJECT),
    ...emittedBy(BUILD_EMITTERS, project, EMPTY_PROJECT),
  ]
    .filter(({ target }) => {
      return !atRoot(target);
    });

  const directory = projectDirectoryOf(project.answers, project.name);

  return inProject(directory, artifacts);
};
