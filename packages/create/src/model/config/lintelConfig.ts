import { constants } from 'node:fs';
import { lstat, open } from 'node:fs/promises';
import { join } from 'node:path';

import {
  AGENTS,
  type AliasMap,
  type Answers,
  BROWSERS,
  FORM_LIBRARIES,
  HOSTED_FRAMEWORKS,
  LIBRARIES,
  type Library,
  PACKAGE_MANAGERS,
  PLUGINS,
  ROUTERS,
  SURFACES,
  TARGET_IDS,
  TESTING_CHOICES,
  TYPE_SAFETY_CHOICES,
} from '../answers/answers';
import { targetFor } from '../targets';

// `extends Answers`, so a config plans directly. This parser is the only list and refuses an unknown property by
// name: `run/cli` once rebuilt `Answers` field by field and replanned a devtools-panel project as a popup one.
export interface LintelConfig extends Answers {
  $schema: typeof CONFIG_SCHEMA_URL;
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
}

type JsonValue = null | boolean | number | string | object;

interface ConfigObject {
  $schema?: JsonValue;
  schemaVersion?: JsonValue;
  target?: JsonValue;
  browser?: JsonValue;
  hostedFramework?: JsonValue;
  surfaces?: JsonValue;
  testing?: JsonValue;
  packageManager?: JsonValue;
  libraries?: JsonValue;
  router?: JsonValue;
  store?: JsonValue;
  typeSafety?: JsonValue;
  agents?: JsonValue;
  plugins?: JsonValue;
  resolveConditions?: JsonValue;
  aliases?: JsonValue;
  browsers?: JsonValue;
  ignores?: JsonValue;
}

export const CONFIG_PATH = 'lintel.config.json';
export const CONFIG_SCHEMA_URL
  = 'https://raw.githubusercontent.com/Faran52/linteljs/main/schemas/lintel.config.v1.schema.json';
export const CURRENT_SCHEMA_VERSION = 1;

const isPlainObject = (value: unknown): value is object => {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
};

const isConfigObject = (value: unknown): value is ConfigObject => {
  return isPlainObject(value);
};

const isJsonArray = (value: JsonValue | undefined): value is JsonValue[] => {
  return Array.isArray(value);
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

  if (new Set(choices).size !== choices.length) {
    throw new Error(`${field} must not contain duplicate values`);
  }

  return choices;
};

// An open vocabulary, so only the shape is checked.
const conditionNames = (value: JsonValue | undefined): string[] => {
  if (!isJsonArray(value) || value.length === 0) {
    throw new Error('resolveConditions must be a non-empty array');
  }

  const names = value.map((item) => {
    if (typeof item !== 'string' || item === '') {
      throw new Error('resolveConditions must contain only non-empty strings');
    }

    return item;
  });

  if (new Set(names).size !== names.length) {
    throw new Error('resolveConditions must not contain duplicate values');
  }

  return names;
};

// Names are the project's; the sigil is checked because `simple-import-sort` groups on it and a bare key sorts as a
// package.
const aliasMap = (value: JsonValue | undefined): AliasMap => {
  if (!isPlainObject(value)) {
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

// An open vocabulary, so only the shape is checked.
const globList = (value: JsonValue | undefined): string[] => {
  if (!isJsonArray(value) || value.length === 0) {
    throw new Error('ignores must be a non-empty array');
  }

  const globs = value.map((item) => {
    if (typeof item !== 'string' || item === '') {
      throw new Error('ignores must contain only non-empty strings');
    }

    return item;
  });

  if (new Set(globs).size !== globs.length) {
    throw new Error('ignores must not contain duplicate values');
  }

  return globs;
};

// One form library at most; the prompt offers them as one choice.
const libraryChoices = (value: JsonValue | undefined): Library[] => {
  const libraries = arrayChoices(value, 'libraries', LIBRARIES);

  if (libraries.filter((library) => {
    return FORM_LIBRARIES.includes(library);
  }).length > 1) {
    throw new Error(`libraries must contain at most one of: ${FORM_LIBRARIES.join(', ')}`);
  }

  return libraries;
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
  misfit(answers.libraries.includes('react-hook-form') && record.framework !== 'react', 'react-hook-form');
};

const expectedKeys = [
  '$schema',
  'schemaVersion',
  'target',
  'aliases',
  'browsers',
  'ignores',
  'browser',
  'hostedFramework',
  'surfaces',
  'testing',
  'packageManager',
  'libraries',
  'router',
  'store',
  'typeSafety',
  'agents',
  'plugins',
  'resolveConditions',
];

export const emitLintelConfig = (answers: Answers): string => {
  return `${JSON.stringify({
    $schema: CONFIG_SCHEMA_URL,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ...answers,
  }, null, 2)}\n`;
};

const configFrom = (parsed: ConfigObject): LintelConfig => {
  const schemaVersion = parsed.schemaVersion;

  if (schemaVersion === undefined) {
    throw new Error('schemaVersion must be 1');
  }

  if (typeof schemaVersion !== 'number') {
    throw new Error('schemaVersion must be 1');
  }

  if (schemaVersion !== CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `lintel.config.json schema version ${String(schemaVersion)} is unsupported; update @linteljs/create`,
    );
  }

  const unexpected = Object.keys(parsed).find((key) => {
    return !expectedKeys.includes(key);
  });

  if (unexpected !== undefined) {
    throw new Error(`lintel.config.json has unexpected property: ${unexpected}`);
  }

  const schema = parsed.$schema;

  if (schema !== CONFIG_SCHEMA_URL) {
    throw new Error(`$schema must be ${CONFIG_SCHEMA_URL}`);
  }

  const store = parsed.store;

  if (typeof store !== 'boolean') {
    throw new Error('store must be a boolean');
  }

  const config: LintelConfig = {
    $schema: schema,
    schemaVersion,
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
    ...(parsed.router === undefined ? {} : { router: choice(parsed.router, 'router', ROUTERS) }),
    store,
    typeSafety: choice(parsed.typeSafety, 'typeSafety', TYPE_SAFETY_CHOICES),
    agents: arrayChoices(parsed.agents, 'agents', AGENTS),
    ...(parsed.resolveConditions === undefined
      ? {}
      : { resolveConditions: conditionNames(parsed.resolveConditions) }),
    ...(parsed.aliases === undefined ? {} : { aliases: aliasMap(parsed.aliases) }),
    ...(parsed.browsers === undefined
      ? {}
      : { browsers: arrayChoices(parsed.browsers, 'browsers', BROWSERS, 1) }),
    ...(parsed.ignores === undefined ? {} : { ignores: globList(parsed.ignores) }),
    plugins: arrayChoices(parsed.plugins, 'plugins', PLUGINS),
  };

  refuseMisfit(config);

  return config;
};

export const parseLintelConfig = (text: string): LintelConfig => {
  try {
    const parsed: unknown = JSON.parse(text);

    if (!isConfigObject(parsed)) {
      throw new Error('lintel.config.json must be a JSON object');
    }

    return configFrom(parsed);
  }
  catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('lintel.config.json is not valid JSON');
    }

    throw error;
  }
};

export const readLintelConfig = async (cwd: string): Promise<LintelConfig> => {
  const path = join(cwd, CONFIG_PATH);
  let text: string;

  try {
    const entry = await lstat(path);

    if (entry.isSymbolicLink()) {
      throw new Error('lintel.config.json must be a regular file; symbolic links are not allowed');
    }

    if (!entry.isFile()) {
      throw new Error('lintel.config.json must be a regular file');
    }

    const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);

    try {
      // Asks the descriptor, catching a swap after the `lstat`; no test can stage the race.
      /* v8 ignore next 3 */
      if (!(await file.stat()).isFile()) {
        throw new Error('lintel.config.json must be a regular file');
      }

      text = await file.readFile('utf8');
    }
    finally {
      await file.close();
    }
  }
  catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error('lintel.config.json was not found; this is not a LintelJS-managed project');
    }

    // The same race, answered with the message a named link gets.
    /* v8 ignore next 3 */
    if (error instanceof Error && 'code' in error && error.code === 'ELOOP') {
      throw new Error('lintel.config.json must be a regular file; symbolic links are not allowed');
    }

    throw error;
  }

  return parseLintelConfig(text);
};
