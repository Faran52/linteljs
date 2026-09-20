import { isEqual } from 'es-toolkit';

import { isJsonObject, valuesOf } from '@utils/objectUtils';

import { targetFor } from '@targets';

import {
  CONFIG_SCHEMA_URL,
  CONFIG_SCHEMA_URL_V1,
  CURRENT_SCHEMA_VERSION,
  EXPECTED,
} from '../constants';
import { ANSWERS } from '../registry';

import { migrateForm } from './migrationUtils';
import {
  isJsonArray,
  readAnswer,
  unaskedValueOf,
} from './readUtils';
import { onlyFor } from './recordUtils';

import type { TargetRecord } from '@targets/types';
import type { Library } from '../libraries/libraries/librariesAnswer';
import type {
  AnswerKey,
  Answers,
  LinteljsConfig,
} from '../registry';
import type { AnswerRecord } from '../types';
import type { JsonValue } from './readUtils';

type ConfigObject = Partial<Record<keyof typeof EXPECTED, JsonValue>>;

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

/**
 * `ANSWERS` read as its own `Record<AnswerKey, unknown>`, so every key it yields is already `AnswerKey`: indexing
 * either `ANSWERS` or `answers` with one needs no further narrowing, and no branch is left proving what this
 * already guarantees.
 */
const ANSWER_KEYS = valuesOf(ANSWERS);

// The real type of `answers[key]` for `key: AnswerKey`, not `unknown`: every field `Answers` has, whichever this
// call's own `key` turns out to name.
const chosenValuesOf = (value: Answers[AnswerKey]): string[] => {
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

  const surfacesValue = readAnswer(ANSWERS.surfaces, parsed.surfaces);
  const hostedFrameworkValue = readAnswer(ANSWERS.hostedFramework, parsed.hostedFramework);
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
    ...(surfacesValue === undefined ? {} : { surfaces: surfacesValue }),
    ...(hostedFrameworkValue === undefined ? {} : { hostedFramework: hostedFrameworkValue }),
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
