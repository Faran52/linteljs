import { constants } from 'node:fs';
import { lstat, open } from 'node:fs/promises';
import { join } from 'node:path';

import {
  AGENTS,
  type AliasMap,
  type Answers,
  BROWSERS,
  HOSTED_FRAMEWORKS,
  LIBRARIES,
  PACKAGE_MANAGERS,
  PLUGINS,
  SURFACES,
  TARGET_IDS,
  TESTING_CHOICES,
  TYPE_SAFETY_CHOICES,
} from '../answers/answers';

/**
 * A recorded config is the answers, plus two fields describing the file. `extends`, so the routes that plan from one
 * pass it straight to a plan: `run/cli` rebuilt `Answers` from it field by field, and dropped in silence any answer it
 * had not been taught about, which is how a devtools-panel project came back replanned as a popup one. This parser is
 * the only list, and it refuses an unknown property by name.
 *
 * `$schema` and `schemaVersion` come along. Both are validated to one permitted value, and `emitLintelConfig` writes
 * those same constants itself.
 */
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

  // `agents` is the only field with a floor and the floor is one, so there is no plural form to spell.
  if (choices.length < minimum) {
    throw new Error(`${field} must contain at least ${String(minimum)} value`);
  }

  if (new Set(choices).size !== choices.length) {
    throw new Error(`${field} must not contain duplicate values`);
  }

  return choices;
};

// Export-map condition names are an open vocabulary (`node`, `bun`, `worker`, whatever a package chose), so this
// validates the shape rather than the members: a non-empty list of distinct non-empty strings.
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

/**
 * A project's own aliases. Validated as a shape rather than against a list, the way `resolveConditions` is: the names
 * are a project's to choose. The sigil is checked because both consumers depend on it, `simple-import-sort` grouping
 * on it and tsconfig resolving through it, and a bare `engine` key silently sorts as a package instead.
 */
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

// Paths a project lints nothing in. An open vocabulary like `resolveConditions`, so only the shape is checked: a
// non-empty list of distinct non-empty strings.
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

  return {
    $schema: schema,
    schemaVersion,
    target: choice(parsed.target, 'target', TARGET_IDS),
    /**
     * All three default rather than being required, so a config written before they existed still parses: absent
     * `browser` is the chrome the only extension target used to assume, absent `hostedFramework` is the
     * plain-TypeScript shape every host had, and absent `surfaces` is the popup and background pair.
     */
    browser: parsed.browser === undefined ? 'chrome' : choice(parsed.browser, 'browser', BROWSERS),
    ...(parsed.hostedFramework === undefined
      ? {}
      : { hostedFramework: choice(parsed.hostedFramework, 'hostedFramework', HOSTED_FRAMEWORKS) }),
    // Absent means the popup-and-background pair, for the same reason: it is the only shape written before the answer.
    ...(parsed.surfaces === undefined
      ? {}
      : { surfaces: arrayChoices(parsed.surfaces, 'surfaces', SURFACES) }),
    testing: choice(parsed.testing, 'testing', TESTING_CHOICES),
    packageManager: choice(parsed.packageManager, 'packageManager', PACKAGE_MANAGERS),
    libraries: arrayChoices(parsed.libraries, 'libraries', LIBRARIES),
    store,
    typeSafety: choice(parsed.typeSafety, 'typeSafety', TYPE_SAFETY_CHOICES),
    agents: arrayChoices(parsed.agents, 'agents', AGENTS, 1),
    ...(parsed.resolveConditions === undefined
      ? {}
      : { resolveConditions: conditionNames(parsed.resolveConditions) }),
    ...(parsed.aliases === undefined ? {} : { aliases: aliasMap(parsed.aliases) }),
    // More than one only where the project ships to two stores; absent means just `browser`.
    ...(parsed.browsers === undefined
      ? {}
      : { browsers: arrayChoices(parsed.browsers, 'browsers', BROWSERS, 1) }),
    // Globs are a project's to choose, so this validates the shape the way `resolveConditions` does.
    ...(parsed.ignores === undefined ? {} : { ignores: globList(parsed.ignores) }),
    plugins: arrayChoices(parsed.plugins, 'plugins', PLUGINS),
  };
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
      // Asks the descriptor rather than the name, so it catches a swap after the `lstat` above. No test can stage
      // that race, hence the ignore.
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

    // The same race: a link that appeared after the `lstat`, answered with the message a named one gets.
    /* v8 ignore next 3 */
    if (error instanceof Error && 'code' in error && error.code === 'ELOOP') {
      throw new Error('lintel.config.json must be a regular file; symbolic links are not allowed');
    }

    throw error;
  }

  return parseLintelConfig(text);
};
