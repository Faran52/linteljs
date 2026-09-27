import type { Answers } from '@config/types';

export type SchemaVersion = 1 | typeof CURRENT_SCHEMA_VERSION;

export const CONFIG_PATH = 'linteljs.config.json';
// What every version through 1.5.3 wrote; `sync` removes it.
export const LEGACY_CONFIG_PATH = 'lintel.config.json';
export const CONFIG_SCHEMA_URL
  = 'https://raw.githubusercontent.com/Faran52/linteljs/main/schemas/linteljs.config.v2.schema.json';
// Still published: a pre-v2 project's `$schema` names it.
export const CONFIG_SCHEMA_URL_V1
  = 'https://raw.githubusercontent.com/Faran52/linteljs/main/schemas/lintel.config.v1.schema.json';
export const CURRENT_SCHEMA_VERSION = 2;

// Keyed by the union, so the lookup is total and needs no unreachable fallback.
export const SCHEMA_URLS: Record<SchemaVersion, string> = {
  1: CONFIG_SCHEMA_URL_V1,
  [CURRENT_SCHEMA_VERSION]: CONFIG_SCHEMA_URL,
};

// A `Record`, so `Answers` gaining a field fails here until it is named.
export const EXPECTED: Record<keyof Answers | '$schema' | 'schemaVersion', true> = {
  $schema: true,
  schemaVersion: true,
  target: true,
  browser: true,
  surfaces: true,
  hostedFramework: true,
  testing: true,
  packageManager: true,
  packageManagerVersion: true,
  nodeVersion: true,
  libraries: true,
  styling: true,
  form: true,
  router: true,
  store: true,
  data: true,
  mocking: true,
  typeSafety: true,
  agents: true,
  plugins: true,
  resolveConditions: true,
  aliases: true,
  browsers: true,
  ignores: true,
};
