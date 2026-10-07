import { agentsAnswer } from './agents/agents/agentsAnswer';
import { pluginsAnswer } from './agents/plugins/pluginsAnswer';
import { CONFIG_SCHEMA_URL, CURRENT_SCHEMA_VERSION } from './constants';
import { layoutAnswer } from './layout/layout/layoutAnswer';
import { dataAnswer } from './libraries/data/dataAnswer';
import { formAnswer } from './libraries/form/formAnswer';
import { languagesAnswer } from './libraries/languages/languagesAnswer';
import { librariesAnswer } from './libraries/libraries/librariesAnswer';
import { mockingAnswer } from './libraries/mocking/mockingAnswer';
import { stylingAnswer } from './libraries/styling/stylingAnswer';
import { aliasesAnswer } from './recorded/aliases/aliasesAnswer';
import { ignoresAnswer } from './recorded/ignores/ignoresAnswer';
import { nodeVersionAnswer } from './recorded/node-version/nodeVersionAnswer';
import { packageManagerAnswer } from './recorded/package-manager/packageManagerAnswer';
import { packageManagerVersionAnswer } from './recorded/package-manager-version/packageManagerVersionAnswer';
import { resolveConditionsAnswer } from './recorded/resolve-conditions/resolveConditionsAnswer';
import { browserAnswer } from './target/browser/browserAnswer';
import { browsersAnswer } from './target/browsers/browsersAnswer';
import { hostedFrameworkAnswer } from './target/hosted-framework/hostedFrameworkAnswer';
import { routerAnswer } from './target/router/routerAnswer';
import { storeAnswer } from './target/store/storeAnswer';
import { surfacesAnswer } from './target/surfaces/surfacesAnswer';
import { targetAnswer } from './target/target/targetAnswer';
import { testingAnswer } from './testing/testing/testingAnswer';
import { typeSafetyAnswer } from './typesafety/type-safety/typeSafetyAnswer';

import type { Answers } from '@config/types';

export type AnswerKey = keyof typeof ANSWERS;

export interface LinteljsConfig extends Answers {
  $schema: typeof CONFIG_SCHEMA_URL;
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
}

// Insertion order is the ask order and the order a config's keys are written in.
export const ANSWERS = {
  target: targetAnswer,
  browser: browserAnswer,
  surfaces: surfacesAnswer,
  hostedFramework: hostedFrameworkAnswer,
  layout: layoutAnswer,
  testing: testingAnswer,
  packageManager: packageManagerAnswer,
  packageManagerVersion: packageManagerVersionAnswer,
  nodeVersion: nodeVersionAnswer,
  libraries: librariesAnswer,
  styling: stylingAnswer,
  form: formAnswer,
  router: routerAnswer,
  store: storeAnswer,
  data: dataAnswer,
  mocking: mockingAnswer,
  languages: languagesAnswer,
  typeSafety: typeSafetyAnswer,
  agents: agentsAnswer,
  plugins: pluginsAnswer,
  resolveConditions: resolveConditionsAnswer,
  aliases: aliasesAnswer,
  browsers: browsersAnswer,
  ignores: ignoresAnswer,
} as const;

export const DEFAULT_ANSWERS: Answers = {
  target: ANSWERS.target.default,
  browser: ANSWERS.browser.default,
  layout: ANSWERS.layout.default,
  testing: ANSWERS.testing.default,
  packageManager: ANSWERS.packageManager.default,
  libraries: [...ANSWERS.libraries.default],
  typeSafety: ANSWERS.typeSafety.default,
  agents: [...ANSWERS.agents.default],
  plugins: [...ANSWERS.plugins.default],
};
