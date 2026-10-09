import type { Answers, WorkspaceKey } from '@config/types';
import type { AnswerKey } from './registry';

export type SchemaVersion = 1 | 2 | typeof CURRENT_SCHEMA_VERSION;

export const CONFIG_PATH = 'linteljs.config.json';
// The pre-v2 config name; `sync` removes it.
export const LEGACY_CONFIG_PATH = 'lintel.config.json';
export const CONFIG_SCHEMA_URL
  = 'https://raw.githubusercontent.com/Faran52/linteljs/main/schemas/linteljs.config.v3.schema.json';
// Still published: a v2 project's `$schema` names it.
export const CONFIG_SCHEMA_URL_V2
  = 'https://raw.githubusercontent.com/Faran52/linteljs/main/schemas/linteljs.config.v2.schema.json';
// Still published: a pre-v2 project's `$schema` names it.
export const CONFIG_SCHEMA_URL_V1
  = 'https://raw.githubusercontent.com/Faran52/linteljs/main/schemas/lintel.config.v1.schema.json';
export const CURRENT_SCHEMA_VERSION = 3;

// Keyed by the union, so the lookup is total and needs no unreachable fallback.
export const SCHEMA_URLS: Record<SchemaVersion, string> = {
  1: CONFIG_SCHEMA_URL_V1,
  2: CONFIG_SCHEMA_URL_V2,
  [CURRENT_SCHEMA_VERSION]: CONFIG_SCHEMA_URL,
};

// A `Record`, so `Answers` gaining a field fails here until it is named.
export const EXPECTED: Record<keyof Answers | '$schema' | 'schemaVersion', null> = {
  $schema: null,
  schemaVersion: null,
  target: null,
  browser: null,
  surfaces: null,
  hostedFramework: null,
  testing: null,
  e2e: null,
  stories: null,
  packageManager: null,
  packageManagerVersion: null,
  nodeVersion: null,
  libraries: null,
  styling: null,
  form: null,
  router: null,
  store: null,
  data: null,
  mocking: null,
  languages: null,
  typeSafety: null,
  agents: null,
  plugins: null,
  layout: null,
  resolveConditions: null,
  aliases: null,
  browsers: null,
  ignores: null,
};

// In ask order, which is the order a v3 config writes them above `projects`.
export const WORKSPACE_KEYS: readonly WorkspaceKey[] = [
  'layout',
  'packageManager',
  'packageManagerVersion',
  'nodeVersion',
  'typeSafety',
  'agents',
  'plugins',
];

export const V3_TOP_KEYS: readonly string[] = [
  '$schema',
  'schemaVersion',
  ...WORKSPACE_KEYS,
];

// A monorepo project's name and its directory under apps/ or packages/: kebab-case only.
export const PROJECT_NAME_PATTERN = '^[a-z0-9]+(-[a-z0-9]+)*$';

// The answers whose offer turns on the target alone, so the schema can carry the refusals `configUtils` makes.
export const TARGET_BOUND_KEYS = ['e2e', 'stories'] as const satisfies readonly AnswerKey[];
