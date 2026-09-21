import type { Answers } from './registry';

export const CONFIG_PATH = 'linteljs.config.json';
// What every version through 1.6.0 wrote. Read when the current name is absent, and removed by `sync` once it is not.
export const LEGACY_CONFIG_PATH = 'lintel.config.json';
export const CONFIG_SCHEMA_URL
  = 'https://raw.githubusercontent.com/Faran52/linteljs/main/schemas/linteljs.config.v2.schema.json';
// Still published: a project written before v2 carries this in `$schema` and its editor resolves it.
export const CONFIG_SCHEMA_URL_V1
  = 'https://raw.githubusercontent.com/Faran52/linteljs/main/schemas/lintel.config.v1.schema.json';
export const CURRENT_SCHEMA_VERSION = 2;

// Every property a config may carry, spelled once. A `Record` rather than a list, so `Answers` gaining a field fails
// here until it is named: `ConfigObject` in `utils/configUtils.ts` and the unexpected-key refusal both read off it.
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
