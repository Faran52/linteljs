export { type Agent } from './agents/agents/agentsAnswer';
export { type Plugin } from './agents/plugins/pluginsAnswer';
export {
  CONFIG_PATH,
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
  LEGACY_CONFIG_PATH,
} from './constants';
export { type Form } from './libraries/form/formAnswer';
export { type Library } from './libraries/libraries/librariesAnswer';
export { type PackageManager } from './manager/package-manager/packageManagerAnswer';
export {
  type AnswerKey,
  ANSWERS,
  type Answers,
  DEFAULT_ANSWERS,
  type LinteljsConfig,
} from './registry';
export { type Browser } from './target/browser/browserAnswer';
export { type HostedFramework } from './target/hosted-framework/hostedFrameworkAnswer';
export { type Router } from './target/router/routerAnswer';
export { type Surface } from './target/surfaces/surfacesAnswer';
export { type TargetId } from './target/target/targetAnswer';
export { type Testing } from './testing/testing/testingAnswer';
export { type TypeSafety } from './typesafety/type-safety/typeSafetyAnswer';
export {
  browsersOf,
  hasLibrary,
  hasSurface,
  hasTests,
  rendersWithReact,
} from './utils/answerUtils';
export { parseLinteljsConfig } from './utils/configUtils';
