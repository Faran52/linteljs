export { hasProjectsBlock } from './agents/utils/adapterUtils';
export {
  arrayLiteral,
  configSource,
  emitEslintConfig,
  objectLiteral,
} from './always/eslint-config/eslintConfigEmitter';
export { gitignoreEntries, mergeGitignore } from './always/gitignore/gitignoreEmitter';
export { linteljsConfigEmitter } from './always/linteljs-config/linteljsConfigEmitter';
export {
  checkScriptOf,
  installScriptOf,
  lintScriptsOf,
  styleGlob,
} from './always/utils/scriptUtils';
export {
  GATE_SCRIPTS,
  STYLE_GLOB,
  TEST_RUNNERS,
} from './constants';
export { rootAnswersOf } from './layout/workspace-root/workspaceRootEmitter';
export { pnpmWorkspaceEmitter } from './manager/pnpm-workspace/pnpmWorkspaceEmitter';
export {
  buildArtifacts,
  projectArtifacts,
  seedArtifacts,
} from './registry';
export { starterSourceEmitter } from './target/starter-source/starterSourceEmitter';
export { testSetupEmitter } from './testing/test-setup/testSetupEmitter';
export { packageAnswersOf, workspaceOf } from './utils/layoutUtils';
export {
  buildDevDependencies,
  type DependencyDrift,
  dependencyDrift,
  parsePackageJson,
  serializedPackageJson,
  type Upgrade,
  upgradedPackageJson,
} from './utils/packageJsonUtils';
export { testRunnerOf } from './utils/runnerUtils';
export {
  type Artifact,
  type ArtifactContent,
} from '@config/types';
