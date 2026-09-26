import { agentsAnswer } from './agents/agents/agentsAnswer';
import { pluginsAnswer } from './agents/plugins/pluginsAnswer';
import { CONFIG_SCHEMA_URL, CURRENT_SCHEMA_VERSION } from './constants';
import { dataAnswer } from './libraries/data/dataAnswer';
import { formAnswer } from './libraries/form/formAnswer';
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
import { type Store, storeAnswer } from './target/store/storeAnswer';
import { surfacesAnswer } from './target/surfaces/surfacesAnswer';
import { targetAnswer } from './target/target/targetAnswer';
import { testingAnswer } from './testing/testing/testingAnswer';
import { typeSafetyAnswer } from './typesafety/type-safety/typeSafetyAnswer';

import type { AliasMap } from '@config/types';
import type { Agent } from './agents/agents/agentsAnswer';
import type { Plugin } from './agents/plugins/pluginsAnswer';
import type { Data } from './libraries/data/dataAnswer';
import type { Form } from './libraries/form/formAnswer';
import type { Library } from './libraries/libraries/librariesAnswer';
import type { Mocking } from './libraries/mocking/mockingAnswer';
import type { Styling } from './libraries/styling/stylingAnswer';
import type { PackageManager } from './recorded/package-manager/packageManagerAnswer';
import type { Browser } from './target/browser/browserAnswer';
import type { HostedFramework } from './target/hosted-framework/hostedFrameworkAnswer';
import type { Router } from './target/router/routerAnswer';
import type { Surface } from './target/surfaces/surfacesAnswer';
import type { TargetId } from './target/target/targetAnswer';
import type { Testing } from './testing/testing/testingAnswer';
import type { TypeSafety } from './typesafety/type-safety/typeSafetyAnswer';

export type AnswerKey = keyof typeof ANSWERS;

/**
 * One field per record, its type read off the record's own module rather than off `typeof ANSWERS`: a record whose
 * own value reads `Answers` (`plugins.askedWhen`) or a `TargetRecord` field of its own type (`router`'s `only`)
 * would otherwise need `Answers` to resolve itself before it exists.
 */
export interface Answers {
  target: TargetId;
  // Asked only for the extension target.
  browser: Browser;
  // Absent means `popup` and `background`, the only shape written before the answer existed.
  surfaces?: Surface[];
  // Absent means the host's own plain-TypeScript shape.
  hostedFramework?: HostedFramework;
  testing: Testing;
  packageManager: PackageManager;
  // Both recorded from the host that ran `create`; absent in a config written before they were.
  packageManagerVersion?: string;
  nodeVersion?: string;
  libraries: Library[];
  // Absent is plain CSS: the tokens and the starter stylesheet, with no utility system.
  styling?: Styling;
  // Absent is no form library.
  form?: Form;
  // Asked only where the target has a `routers` slot; absent is no router.
  router?: Router;
  // Asked only where the target has a `stores` slot; absent is the framework's own state and nothing installed.
  store?: Store;
  // Absent is calling the api layer directly. `rtk-query` is legal only with the Redux store that ships it.
  data?: Data;
  // Absent is an api layer that answers locally, with no request for a handler to intercept.
  mocking?: Mocking;
  typeSafety: TypeSafety;
  agents: Agent[];
  plugins: Plugin[];
  // Never asked: a fact about a project's dependencies, edited into `linteljs.config.json` by hand when one needs it.
  resolveConditions?: string[];
  // Never asked: the directories a project grew. Recorded here because `eslint.config.js` is emitted whole, so an
  // alias added there was lost on the next `sync`. A value ending in `/*` names a directory, otherwise a barrel.
  aliases?: AliasMap;
  // The browsers the extension is packaged for; one bundle, one manifest each, since Chrome rejects
  // `browser_specific_settings` and AMO requires it. Absent means just `browser`.
  browsers?: Browser[];
  // Paths this project lints nothing in. Not for build outputs, which `.gitignore` already covers: for a generated
  // file the project commits.
  ignores?: string[];
}

// What a run hands the stages: `create` records the host's Node and `sync` fills it where a config predates it, so
// by the time anything is written it is always there.
export type HostedAnswers = Answers & Required<Pick<Answers, 'nodeVersion'>>;

// `extends Answers`, so a config plans directly. `utils/configUtils.ts`'s parser is the only list and refuses an
// unknown property by name.
export interface LinteljsConfig extends Answers {
  $schema: typeof CONFIG_SCHEMA_URL;
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
}

// One line per record, insertion order the ask order and the order a config's keys are written in. `plugins` sits
// beside `agents` rather than with the never-asked tail.
export const ANSWERS = {
  target: targetAnswer,
  browser: browserAnswer,
  surfaces: surfacesAnswer,
  hostedFramework: hostedFrameworkAnswer,
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
  testing: ANSWERS.testing.default,
  packageManager: ANSWERS.packageManager.default,
  libraries: [...ANSWERS.libraries.default],
  typeSafety: ANSWERS.typeSafety.default,
  agents: [...ANSWERS.agents.default],
  plugins: [...ANSWERS.plugins.default],
};
