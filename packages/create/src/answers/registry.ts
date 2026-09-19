import { agents } from './agents/agents';
import { plugins } from './agents/plugins';
import { CONFIG_SCHEMA_URL, CURRENT_SCHEMA_VERSION } from './constants';
import { form } from './libraries/form';
import { libraries } from './libraries/libraries';
import { packageManager } from './manager/packageManager';
import { aliases } from './recorded/aliases';
import { ignores } from './recorded/ignores';
import { resolveConditions } from './recorded/resolveConditions';
import { browser } from './target/browser';
import { browsers } from './target/browsers';
import { hostedFramework } from './target/hostedFramework';
import { router } from './target/router';
import { store } from './target/store';
import { surfaces } from './target/surfaces';
import { target } from './target/target';
import { testing } from './testing/testing';
import { typeSafety } from './typesafety/typeSafety';

import type { AliasMap } from '../config/types';
import type { Agent } from './agents/agents';
import type { Plugin } from './agents/plugins';
import type { Form } from './libraries/form';
import type { Library } from './libraries/libraries';
import type { PackageManager } from './manager/packageManager';
import type { Browser } from './target/browser';
import type { HostedFramework } from './target/hostedFramework';
import type { Router } from './target/router';
import type { Surface } from './target/surfaces';
import type { TargetId } from './target/target';
import type { Testing } from './testing/testing';
import type { TypeSafety } from './typesafety/typeSafety';

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
  libraries: Library[];
  // Absent is no form library.
  form?: Form;
  // Asked only where the target has a `routers` slot; absent is no router.
  router?: Router;
  // Always false on a target with no `store` slot, where the question is never asked.
  store: boolean;
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

/**
 * `extends Answers`, so a config plans directly. `utils/configUtils.ts`'s parser is the only list and refuses an
 * unknown property by name: `run/cli` once rebuilt `Answers` field by field and replanned a devtools-panel project
 * as a popup one.
 */
export interface LinteljsConfig extends Answers {
  $schema: typeof CONFIG_SCHEMA_URL;
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
}

// One line per record, insertion order the ask order and the order a config's keys are written in. `plugins` sits
// beside `agents` rather than with the never-asked tail, which is where today's hand-written config writer left it.
export const ANSWERS = {
  target,
  browser,
  surfaces,
  hostedFramework,
  testing,
  packageManager,
  libraries,
  form,
  router,
  store,
  typeSafety,
  agents,
  plugins,
  resolveConditions,
  aliases,
  browsers,
  ignores,
} as const;

export const DEFAULT_ANSWERS: Answers = {
  target: ANSWERS.target.default,
  browser: ANSWERS.browser.default,
  testing: ANSWERS.testing.default,
  packageManager: ANSWERS.packageManager.default,
  libraries: [...ANSWERS.libraries.default],
  store: false,
  typeSafety: ANSWERS.typeSafety.default,
  agents: [...ANSWERS.agents.default],
  plugins: [...ANSWERS.plugins.default],
};
