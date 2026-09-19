import { isEqual } from 'es-toolkit';

import { targetFor } from '../targets';
import { isJsonObject } from '../utils/jsonUtils';

import { agents } from './agents/agents';
import { plugins } from './agents/plugins';
import {
  CONFIG_SCHEMA_URL,
  CONFIG_SCHEMA_URL_V1,
  CURRENT_SCHEMA_VERSION,
} from './constants';
import { form } from './libraries/form';
import { libraries } from './libraries/libraries';
import { packageManager } from './manager/packageManager';
import { onlyFor, valuesOf } from './record';
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
import {
  isJsonArray,
  migrateForm,
  readAnswer,
} from './utils/readUtils';

import type { AliasMap } from '../config/types';
import type { TargetRecord } from '../targets/record';
import type { Agent } from './agents/agents';
import type { Plugin } from './agents/plugins';
import type { Form } from './libraries/form';
import type { Library } from './libraries/libraries';
import type { PackageManager } from './manager/packageManager';
import type { AnswerRecord } from './record';
import type { Browser } from './target/browser';
import type { HostedFramework } from './target/hostedFramework';
import type { Router } from './target/router';
import type { Surface } from './target/surfaces';
import type { TargetId } from './target/target';
import type { Testing } from './testing/testing';
import type { TypeSafety } from './typesafety/typeSafety';
import type { JsonValue } from './utils/readUtils';

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
  // Absent means the host's own plain-TypeScript shape.
  hostedFramework?: HostedFramework;
  // Absent means `popup` and `background`, the only shape written before the answer existed.
  surfaces?: Surface[];
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

// `extends Answers`, so a config plans directly. This parser is the only list and refuses an unknown property by
// name: `run/cli` once rebuilt `Answers` field by field and replanned a devtools-panel project as a popup one.
export interface LinteljsConfig extends Answers {
  $schema: typeof CONFIG_SCHEMA_URL;
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
}

type ConfigObject = Partial<Record<keyof typeof EXPECTED, JsonValue>>;

// One line per record, insertion order the ask order and the order a config's keys are written in. `plugins` sits
// beside `agents` rather than with the never-asked tail, which is where today's hand-written config writer left it.
export const ANSWERS = {
  target,
  browser,
  hostedFramework,
  surfaces,
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

// Every property a config may carry, spelled once. A `Record` rather than a list, so `Answers` gaining a field
// fails here until it is named: the shape below and the refusal of an unexpected key both read off this.
const EXPECTED: Record<keyof Answers | '$schema' | 'schemaVersion', true> = {
  $schema: true,
  schemaVersion: true,
  target: true,
  browser: true,
  hostedFramework: true,
  surfaces: true,
  testing: true,
  packageManager: true,
  libraries: true,
  form: true,
  router: true,
  store: true,
  typeSafety: true,
  agents: true,
  plugins: true,
  resolveConditions: true,
  aliases: true,
  browsers: true,
  ignores: true,
};

const expectedKeys = Object.keys(EXPECTED);

const isConfigObject = (value: unknown): value is ConfigObject => {
  return isJsonObject(value);
};

// 1 is read and migrated, 2 is current. Anything else names the fix rather than the shape.
const schemaVersionOf = (value: JsonValue | undefined): number => {
  if (typeof value !== 'number') {
    throw new Error('schemaVersion must be 1 or 2');
  }

  if (value !== 1 && value !== CURRENT_SCHEMA_VERSION) {
    throw new Error(`linteljs.config.json schema version ${String(value)} is unsupported; update @linteljs/create`);
  }

  return value;
};

const isFormValue = (item: JsonValue): item is string => {
  return typeof item === 'string' && item in ANSWERS.form.values;
};

// The v1 spelling, and what a `--libraries react-hook-form` flag still reaches for.
const libraryChoices = (value: JsonValue | undefined): Library[] => {
  const named = isJsonArray(value) ? value.find(isFormValue) : undefined;

  if (named !== undefined) {
    throw new Error(`${named} is a form library: name it in "form" rather than in "libraries"`);
  }

  return readAnswer(ANSWERS.libraries, value);
};

const unaskedValueOf = (record: AnswerRecord): unknown => {
  if (record.kind === 'boolean') {
    return false;
  }

  if (record.kind === 'choice' || record.kind === 'multi') {
    return record.default;
  }

  return undefined;
};

/**
 * `ANSWERS` read as its own `Record<AnswerKey, unknown>`, so every key it yields is already `AnswerKey`: indexing
 * either `ANSWERS` or `answers` with one needs no further narrowing, and no branch is left proving what this
 * already guarantees.
 */
const ANSWER_KEYS = valuesOf(ANSWERS);

const chosenValuesOf = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => {
      return typeof item === 'string';
    });
  }

  return typeof value === 'string' ? [value] : [];
};

/**
 * Legality lives on the records, read back in two passes. The first refuses an answer given for a target with no
 * slot for it; the second refuses a value offered but not `only` for this target, which `form` and `router` use.
 * Both throw the message `refuseMisfit` always has: the answer, or the value, is not one for this target.
 */
const refuseMisfit = (answers: Answers, record: TargetRecord): void => {
  for (const key of ANSWER_KEYS) {
    const candidate: AnswerRecord = ANSWERS[key];

    if (candidate.slot === undefined || candidate.slot(record)) {
      continue;
    }

    if (!isEqual(answers[key], unaskedValueOf(candidate))) {
      throw new Error(`${key} is not an answer for ${answers.target}`);
    }
  }

  for (const key of ANSWER_KEYS) {
    const candidate: AnswerRecord = ANSWERS[key];

    for (const chosen of chosenValuesOf(answers[key])) {
      const only = onlyFor(candidate, chosen);

      if (only !== undefined && !only(record)) {
        throw new Error(`${chosen} is not an answer for ${answers.target}`);
      }
    }
  }
};

const configFrom = (raw: ConfigObject): LinteljsConfig => {
  const schemaVersion = schemaVersionOf(raw.schemaVersion);
  const parsed = migrateForm(raw, schemaVersion, ANSWERS.form.values);

  const unexpected = Object.keys(parsed).find((key) => {
    return !expectedKeys.includes(key);
  });

  if (unexpected !== undefined) {
    throw new Error(`linteljs.config.json has unexpected property: ${unexpected}`);
  }

  const expectedSchema = schemaVersion === 1 ? CONFIG_SCHEMA_URL_V1 : CONFIG_SCHEMA_URL;

  if (parsed.$schema !== expectedSchema) {
    throw new Error(`$schema must be ${expectedSchema}`);
  }

  const hostedFrameworkValue = readAnswer(ANSWERS.hostedFramework, parsed.hostedFramework);
  const surfacesValue = readAnswer(ANSWERS.surfaces, parsed.surfaces);
  const formValue = readAnswer(ANSWERS.form, parsed.form);
  const routerValue = readAnswer(ANSWERS.router, parsed.router);
  const resolveConditionsValue = readAnswer(ANSWERS.resolveConditions, parsed.resolveConditions);
  const aliasesValue = readAnswer(ANSWERS.aliases, parsed.aliases);
  const browsersValue = readAnswer(ANSWERS.browsers, parsed.browsers);
  const ignoresValue = readAnswer(ANSWERS.ignores, parsed.ignores);

  const config: LinteljsConfig = {
    $schema: CONFIG_SCHEMA_URL,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    target: readAnswer(ANSWERS.target, parsed.target),
    // Defaults so a config written before the extension axes existed still parses.
    browser: parsed.browser === undefined ? ANSWERS.browser.default : readAnswer(ANSWERS.browser, parsed.browser),
    ...(hostedFrameworkValue === undefined ? {} : { hostedFramework: hostedFrameworkValue }),
    ...(surfacesValue === undefined ? {} : { surfaces: surfacesValue }),
    testing: readAnswer(ANSWERS.testing, parsed.testing),
    packageManager: readAnswer(ANSWERS.packageManager, parsed.packageManager),
    libraries: libraryChoices(parsed.libraries),
    ...(formValue === undefined ? {} : { form: formValue }),
    ...(routerValue === undefined ? {} : { router: routerValue }),
    store: readAnswer(ANSWERS.store, parsed.store),
    typeSafety: readAnswer(ANSWERS.typeSafety, parsed.typeSafety),
    agents: readAnswer(ANSWERS.agents, parsed.agents),
    ...(resolveConditionsValue === undefined ? {} : { resolveConditions: resolveConditionsValue }),
    ...(aliasesValue === undefined ? {} : { aliases: aliasesValue }),
    ...(browsersValue === undefined ? {} : { browsers: browsersValue }),
    ...(ignoresValue === undefined ? {} : { ignores: ignoresValue }),
    plugins: readAnswer(ANSWERS.plugins, parsed.plugins),
  };

  refuseMisfit(config, targetFor(config));

  return config;
};

export const parseLinteljsConfig = (text: string): LinteljsConfig => {
  try {
    const parsed: unknown = JSON.parse(text);

    if (!isConfigObject(parsed)) {
      throw new Error('linteljs.config.json must be a JSON object');
    }

    return configFrom(parsed);
  }
  catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('linteljs.config.json is not valid JSON');
    }

    throw error;
  }
};
