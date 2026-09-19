import { type AliasMap } from '../config/types';
import { targetFor } from '../targets';
import { isJsonObject } from '../utils/jsonUtils';

import {
  AGENTS,
  type Answers,
  BROWSERS,
  type Form,
  FORMS,
  HOSTED_FRAMEWORKS,
  LIBRARIES,
  type Library,
  PACKAGE_MANAGERS,
  PLUGINS,
  rendersWithReact,
  ROUTERS,
  SURFACES,
  TARGET_IDS,
  TESTING_CHOICES,
  TYPE_SAFETY_CHOICES,
} from './answers';

// `extends Answers`, so a config plans directly. This parser is the only list and refuses an unknown property by
// name: `run/cli` once rebuilt `Answers` field by field and replanned a devtools-panel project as a popup one.
export interface LinteljsConfig extends Answers {
  $schema: typeof CONFIG_SCHEMA_URL;
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
}

type JsonValue = null | boolean | number | string | object;

type ConfigObject = Partial<Record<keyof typeof EXPECTED, JsonValue>>;

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

export const CONFIG_PATH = 'linteljs.config.json';
// What every version through 1.6.0 wrote. Read when the current name is absent, and removed by `sync` once it is not.
export const LEGACY_CONFIG_PATH = 'lintel.config.json';
export const CONFIG_SCHEMA_URL
  = 'https://raw.githubusercontent.com/Faran52/linteljs/main/schemas/linteljs.config.v2.schema.json';
// Still published: a project written before v2 carries this in `$schema` and its editor resolves it.
export const CONFIG_SCHEMA_URL_V1
  = 'https://raw.githubusercontent.com/Faran52/linteljs/main/schemas/lintel.config.v1.schema.json';
export const CURRENT_SCHEMA_VERSION = 2;
const FORM_NAMES: readonly string[] = FORMS;

const isConfigObject = (value: unknown): value is ConfigObject => {
  return isJsonObject(value);
};

const isJsonArray = (value: JsonValue | undefined): value is JsonValue[] => {
  return Array.isArray(value);
};

const refuseDuplicates = (values: string[], field: string): void => {
  if (new Set(values).size !== values.length) {
    throw new Error(`${field} must not contain duplicate values`);
  }
};

const choice = <T extends string>(
  value: JsonValue | undefined,
  field: string,
  allowed: readonly T[],
): T => {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new Error(`${field} must be one of: ${allowed.join(', ')}`);
  }

  return value as T;
};

const arrayChoices = <T extends string>(
  value: JsonValue | undefined,
  field: string,
  allowed: readonly T[],
  minimum = 0,
): T[] => {
  if (!isJsonArray(value)) {
    throw new Error(`${field} must be an array`);
  }

  const choices = value.map((item) => {
    return choice(item, field, allowed);
  });

  if (choices.length < minimum) {
    throw new Error(`${field} must contain at least ${String(minimum)} value`);
  }

  refuseDuplicates(choices, field);

  return choices;
};

// `resolveConditions` and `ignores` are both open vocabularies, so only the shape is checked, and it is the same
// shape: a non-empty list of distinct non-empty strings.
const stringList = (value: JsonValue | undefined, field: string): string[] => {
  if (!isJsonArray(value) || value.length === 0) {
    throw new Error(`${field} must be a non-empty array`);
  }

  const names = value.map((item) => {
    if (typeof item !== 'string' || item === '') {
      throw new Error(`${field} must contain only non-empty strings`);
    }

    return item;
  });

  refuseDuplicates(names, field);

  return names;
};

// Names are the project's; the sigil is checked because `simple-import-sort` groups on it and a bare key sorts as a
// package.
const aliasMap = (value: JsonValue | undefined): AliasMap => {
  if (!isJsonObject(value)) {
    throw new Error('aliases must be an object');
  }

  const entries = Object.entries(value);

  for (const [alias, directory] of entries) {
    if (!alias.startsWith('@') && !alias.startsWith('$')) {
      throw new Error(`aliases key must start with @ or $: ${alias}`);
    }

    if (typeof directory !== 'string' || directory === '') {
      throw new Error(`aliases.${alias} must be a non-empty string`);
    }
  }

  return Object.fromEntries(entries.map(([alias, directory]) => {
    return [alias, String(directory)];
  }));
};

// An answer the target never asks for is refused, so neither a flag nor a hand edit installs a router into a Vue app.
const refuseMisfit = (answers: Answers): void => {
  const record = targetFor(answers);
  const misfit = (condition: boolean, answer: string): void => {
    if (condition) {
      throw new Error(`${answer} is not an answer for ${answers.target}`);
    }
  };

  misfit(answers.router !== undefined && record.routers === undefined, 'router');
  misfit(answers.hostedFramework !== undefined && record.hostsFramework !== true, 'hostedFramework');
  misfit(answers.browser !== 'chrome' && record.hostsBrowser !== true, 'browser');
  misfit(answers.surfaces !== undefined && record.hostsBrowser !== true, 'surfaces');
  misfit(answers.browsers !== undefined && record.hostsBrowser !== true, 'browsers');
  misfit(answers.store && record.store === undefined, 'store');
  misfit(answers.form === 'react-hook-form' && !rendersWithReact(record.framework), 'react-hook-form');
};

const isForm = (value: unknown): value is Form => {
  return typeof value === 'string' && FORM_NAMES.includes(value);
};

// v1 kept the form library inside `libraries`. Lift it before the members are checked against today's `LIBRARIES`,
// or a valid v1 file fails as an unknown library. Silent, the way an absent `surfaces` still describes its project.
const migrateForm = (parsed: ConfigObject, schemaVersion: number): ConfigObject => {
  const listed = parsed.libraries;

  if (schemaVersion !== 1 || !isJsonArray(listed)) {
    return parsed;
  }

  const forms = listed.filter(isForm);

  if (forms.length > 1) {
    throw new Error(`libraries must contain at most one of: ${FORMS.join(', ')}`);
  }

  const [form] = forms;

  if (form === undefined) {
    return parsed;
  }

  return {
    ...parsed,
    libraries: listed.filter((library) => {
      return !isForm(library);
    }),
    form,
  };
};

// The v1 spelling, and what a `--libraries react-hook-form` flag still reaches for.
const libraryChoices = (value: JsonValue | undefined): Library[] => {
  const named = isJsonArray(value) ? value.find(isForm) : undefined;

  if (named !== undefined) {
    throw new Error(`${named} is a form library: name it in "form" rather than in "libraries"`);
  }

  return arrayChoices(value, 'libraries', LIBRARIES);
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

const configFrom = (raw: ConfigObject): LinteljsConfig => {
  const schemaVersion = schemaVersionOf(raw.schemaVersion);
  const parsed = migrateForm(raw, schemaVersion);

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

  const store = parsed.store;

  if (typeof store !== 'boolean') {
    throw new Error('store must be a boolean');
  }

  const config: LinteljsConfig = {
    $schema: CONFIG_SCHEMA_URL,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    target: choice(parsed.target, 'target', TARGET_IDS),
    // All three default so a config written before they existed still parses.
    browser: parsed.browser === undefined ? 'chrome' : choice(parsed.browser, 'browser', BROWSERS),
    ...(parsed.hostedFramework === undefined
      ? {}
      : { hostedFramework: choice(parsed.hostedFramework, 'hostedFramework', HOSTED_FRAMEWORKS) }),
    ...(parsed.surfaces === undefined
      ? {}
      : { surfaces: arrayChoices(parsed.surfaces, 'surfaces', SURFACES) }),
    testing: choice(parsed.testing, 'testing', TESTING_CHOICES),
    packageManager: choice(parsed.packageManager, 'packageManager', PACKAGE_MANAGERS),
    libraries: libraryChoices(parsed.libraries),
    ...(parsed.form === undefined ? {} : { form: choice(parsed.form, 'form', FORMS) }),
    ...(parsed.router === undefined ? {} : { router: choice(parsed.router, 'router', ROUTERS) }),
    store,
    typeSafety: choice(parsed.typeSafety, 'typeSafety', TYPE_SAFETY_CHOICES),
    agents: arrayChoices(parsed.agents, 'agents', AGENTS),
    ...(parsed.resolveConditions === undefined
      ? {}
      : { resolveConditions: stringList(parsed.resolveConditions, 'resolveConditions') }),
    ...(parsed.aliases === undefined ? {} : { aliases: aliasMap(parsed.aliases) }),
    ...(parsed.browsers === undefined
      ? {}
      : { browsers: arrayChoices(parsed.browsers, 'browsers', BROWSERS, 1) }),
    ...(parsed.ignores === undefined ? {} : { ignores: stringList(parsed.ignores, 'ignores') }),
    plugins: arrayChoices(parsed.plugins, 'plugins', PLUGINS),
  };

  refuseMisfit(config);

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
