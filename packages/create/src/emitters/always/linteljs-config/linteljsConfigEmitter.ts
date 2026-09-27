import { type Answers, type Artifact } from '@config/types';

import {
  CONFIG_PATH,
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
} from '@answers';

import { emitted } from '../../utils/artifactUtils';

// The envelope every recorded project carries, so `sync` and `create --existing` replan from what it says.
export const emitLinteljsConfig = (answers: Answers): string => {
  return `${JSON.stringify({
    $schema: CONFIG_SCHEMA_URL,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ...answers,
  }, null, 2)}\n`;
};

/**
 * The record every later run replans from. Written on every `create` and never by `sync`, which reads it: a
 * project that reformatted its own config keeps those bytes through a `sync --force`. First in the seeded list,
 * so a run that dies before `package.json` leaves the answers recorded rather than the dependencies they imply.
 */
export const linteljsConfigEmitter = (answers: Answers): Artifact[] => {
  return [emitted('package', CONFIG_PATH, emitLinteljsConfig(answers))];
};
