import { isEqual } from 'es-toolkit';

import { isJsonObject, keysOf } from '@utils/objectUtils';

import { targetFor, type TargetRecord } from '@targets';

import {
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
  EXPECTED,
  SCHEMA_URLS,
  type SchemaVersion,
} from '../constants';
import {
  ANSWERS,
  DEFAULT_ANSWERS,
  type LinteljsConfig,
} from '../registry';

import { migratedStore, migrateLifted } from './migrationUtils';
import {
  isJsonArray,
  type JsonValue,
  readAnswer,
  unaskedValueOf,
} from './readUtils';
import { refusedValue } from './recordUtils';

import type { Answers, Library } from '@config/types';
import type { AnswerRecord } from '../types';

type ConfigObject = Partial<Record<keyof typeof EXPECTED, JsonValue>>;

const expectedKeys = Object.keys(EXPECTED);

const isConfigObject = (value: unknown): value is ConfigObject => {
  return isJsonObject(value);
};

const schemaVersionOf = (value: JsonValue | undefined): SchemaVersion => {
  if (typeof value !== 'number') {
    throw new Error('schemaVersion must be 1 or 2');
  }

  if (value !== 1 && value !== CURRENT_SCHEMA_VERSION) {
    throw new Error(`linteljs.config.json schema version ${String(value)} is unsupported; update @linteljs/create`);
  }

  return value;
};

const storeAnswerOf = (parsed: ConfigObject, schemaVersion: number): JsonValue | undefined => {
  const raw = parsed.store;
  const wasYesOrNo = schemaVersion === 1 && typeof raw === 'boolean';
  // Answers nothing but for a `true`, so it is safe to read before knowing whether it applies.
  const migrated: JsonValue | undefined = migratedStore(raw, () => {
    return targetFor({
      ...DEFAULT_ANSWERS,
      target: readAnswer(ANSWERS.target, parsed.target),
    }).stores?.[0];
  });

  return wasYesOrNo ? migrated : raw;
};

const isFormValue = (item: JsonValue): item is string => {
  return typeof item === 'string' && item in ANSWERS.form.values;
};

// The v1 spelling, still reached by a `--libraries react-hook-form` flag.
const libraryChoices = (value: JsonValue | undefined): Library[] => {
  const named = isJsonArray(value) ? value.find(isFormValue) : undefined;

  if (named !== undefined) {
    throw new Error(`${named} is a form library: name it in "form" rather than in "libraries"`);
  }

  return readAnswer(ANSWERS.libraries, value);
};

// Read as its own `Record`, so every key it yields is already `AnswerKey`.
const ANSWER_KEYS = keysOf(ANSWERS);

const refuseMisfit = (answers: Answers, record: TargetRecord): void => {
  for (const key of ANSWER_KEYS) {
    const candidate: AnswerRecord = ANSWERS[key];

    if (candidate.slot === undefined || candidate.slot(record)) {
      continue;
    }

    const unasked = unaskedValueOf(candidate);

    if (!isEqual(answers[key], unasked)) {
      throw new Error(`${key} is not an answer for ${answers.target}`);
    }
  }

  for (const key of ANSWER_KEYS) {
    const refused = refusedValue(ANSWERS[key], answers[key], record, answers);

    if (refused !== undefined) {
      throw new Error(`${refused} is not an answer for ${answers.target}`);
    }
  }
};

const lifted = (raw: ConfigObject, schemaVersion: SchemaVersion): ConfigObject => {
  const fromV1 = schemaVersion === 1;

  const withForm = migrateLifted(raw, fromV1, 'form', ANSWERS.form.values);
  const withStyling = migrateLifted(withForm, fromV1, 'styling', ANSWERS.styling.values);

  return migrateLifted(withStyling, fromV1, 'data', ANSWERS.data.values);
};

// The library answers, apart so neither half outgrows its complexity budget.
const libraryAnswersFrom = (parsed: ConfigObject, schemaVersion: SchemaVersion): Partial<LinteljsConfig> => {
  const stylingValue = readAnswer(ANSWERS.styling, parsed.styling);
  const formValue = readAnswer(ANSWERS.form, parsed.form);
  const routerValue = readAnswer(ANSWERS.router, parsed.router);
  const storeValue = readAnswer(ANSWERS.store, storeAnswerOf(parsed, schemaVersion));
  const dataValue = readAnswer(ANSWERS.data, parsed.data);
  const mockingValue = readAnswer(ANSWERS.mocking, parsed.mocking);
  const languagesValue = readAnswer(ANSWERS.languages, parsed.languages);
  const libraryAnswers: Partial<LinteljsConfig> = {
    ...(stylingValue === undefined ? {} : { styling: stylingValue }),
    ...(formValue === undefined ? {} : { form: formValue }),
    ...(routerValue === undefined ? {} : { router: routerValue }),
    ...(storeValue === undefined ? {} : { store: storeValue }),
    ...(dataValue === undefined ? {} : { data: dataValue }),
    ...(mockingValue === undefined ? {} : { mocking: mockingValue }),
    ...(languagesValue === undefined ? {} : { languages: languagesValue }),
  };

  return libraryAnswers;
};

// `exactOptionalPropertyTypes` refuses a key written `undefined`, so each optional answer is a conditional spread.
const answersFrom = (parsed: ConfigObject, schemaVersion: SchemaVersion): LinteljsConfig => {
  const surfacesValue = readAnswer(ANSWERS.surfaces, parsed.surfaces);
  const hostedFrameworkValue = readAnswer(ANSWERS.hostedFramework, parsed.hostedFramework);
  const managerVersionValue = readAnswer(ANSWERS.packageManagerVersion, parsed.packageManagerVersion);
  const nodeVersionValue = readAnswer(ANSWERS.nodeVersion, parsed.nodeVersion);
  const resolveConditionsValue = readAnswer(ANSWERS.resolveConditions, parsed.resolveConditions);
  const aliasesValue = readAnswer(ANSWERS.aliases, parsed.aliases);
  const browsersValue = readAnswer(ANSWERS.browsers, parsed.browsers);
  const ignoresValue = readAnswer(ANSWERS.ignores, parsed.ignores);

  const config: LinteljsConfig = {
    $schema: CONFIG_SCHEMA_URL,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    target: readAnswer(ANSWERS.target, parsed.target),
    // Defaults, so a config without the extension axes still parses.
    browser: parsed.browser === undefined ? ANSWERS.browser.default : readAnswer(ANSWERS.browser, parsed.browser),
    ...(surfacesValue === undefined ? {} : { surfaces: surfacesValue }),
    ...(hostedFrameworkValue === undefined ? {} : { hostedFramework: hostedFrameworkValue }),
    testing: readAnswer(ANSWERS.testing, parsed.testing),
    packageManager: readAnswer(ANSWERS.packageManager, parsed.packageManager),
    ...(managerVersionValue === undefined ? {} : { packageManagerVersion: managerVersionValue }),
    ...(nodeVersionValue === undefined ? {} : { nodeVersion: nodeVersionValue }),
    libraries: libraryChoices(parsed.libraries),
    ...libraryAnswersFrom(parsed, schemaVersion),
    typeSafety: readAnswer(ANSWERS.typeSafety, parsed.typeSafety),
    agents: readAnswer(ANSWERS.agents, parsed.agents),
    ...(resolveConditionsValue === undefined ? {} : { resolveConditions: resolveConditionsValue }),
    ...(aliasesValue === undefined ? {} : { aliases: aliasesValue }),
    ...(browsersValue === undefined ? {} : { browsers: browsersValue }),
    ...(ignoresValue === undefined ? {} : { ignores: ignoresValue }),
    plugins: readAnswer(ANSWERS.plugins, parsed.plugins),
    layout: parsed.layout === undefined ? ANSWERS.layout.default : readAnswer(ANSWERS.layout, parsed.layout),
  };

  return config;
};

const configFrom = (raw: ConfigObject): LinteljsConfig => {
  const schemaVersion = schemaVersionOf(raw.schemaVersion);
  const parsed = lifted(raw, schemaVersion);

  const unexpected = Object.keys(parsed)
    .find((key) => {
      return !expectedKeys.includes(key);
    });

  if (unexpected !== undefined) {
    throw new Error(`linteljs.config.json has unexpected property: ${unexpected}`);
  }

  const expectedSchema = SCHEMA_URLS[schemaVersion];

  if (parsed.$schema !== expectedSchema) {
    throw new Error(`$schema must be ${expectedSchema}`);
  }

  const read = answersFrom(parsed, schemaVersion);
  const record = targetFor(read);
  // The default is the same for every target, and a record from before 2.0 wrote `vitest` on React Native.
  const config: LinteljsConfig = read.testing === 'vitest' && record.testRunner === 'jest'
    ? {
        ...read,
        testing: 'jest',
      }
    : read;

  refuseMisfit(config, record);

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
