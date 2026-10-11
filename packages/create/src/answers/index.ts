export {
  CONFIG_PATH,
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
  LEGACY_CONFIG_PATH,
  PROJECT_NAME_PATTERN,
  WORKSPACE_KEYS,
} from './constants';
export {
  type AnswerKey,
  ANSWERS,
  DEFAULT_ANSWERS,
  type LinteljsConfig,
} from './registry';
export type {
  AnswerRecord,
  ChoiceRecord,
  ListRecord,
  MapRecord,
  MultiRecord,
  OptionalChoiceRecord,
  OptionalMultiRecord,
  TextRecord,
  ValueRecord,
} from './types';
export { parseLinteljsConfig } from './utils/configUtils';
export {
  type ConfigEntry,
  configOf,
  isWorkspaceKey,
  projectAnswersOf,
  workspaceConfigOf,
} from './utils/projectUtils';
export {
  isJsonArray,
  type JsonValue,
  unaskedValueOf,
} from './utils/readUtils';
export { onlyFor, promptOf } from './utils/recordUtils';
