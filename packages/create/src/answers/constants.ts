export const CONFIG_PATH = 'linteljs.config.json';
// What every version through 1.6.0 wrote. Read when the current name is absent, and removed by `sync` once it is not.
export const LEGACY_CONFIG_PATH = 'lintel.config.json';
export const CONFIG_SCHEMA_URL
  = 'https://raw.githubusercontent.com/Faran52/linteljs/main/schemas/linteljs.config.v2.schema.json';
// Still published: a project written before v2 carries this in `$schema` and its editor resolves it.
export const CONFIG_SCHEMA_URL_V1
  = 'https://raw.githubusercontent.com/Faran52/linteljs/main/schemas/lintel.config.v1.schema.json';
export const CURRENT_SCHEMA_VERSION = 2;
