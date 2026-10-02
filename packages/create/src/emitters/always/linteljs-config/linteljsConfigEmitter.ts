import { type Answers, type Artifact } from '@config/types';

import {
  CONFIG_PATH,
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
} from '@answers';

import { emitted } from '../../utils/artifactUtils';

export const emitLinteljsConfig = (answers: Answers): string => {
  return `${JSON.stringify({
    $schema: CONFIG_SCHEMA_URL,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ...answers,
  }, null, 2)}\n`;
};

// Never written by `sync`, so a reformatted config survives `sync`.
// Seeded first, so a run that dies before `package.json` leaves the answers recorded.
export const linteljsConfigEmitter = (answers: Answers): Artifact[] => {
  return [emitted('package', CONFIG_PATH, emitLinteljsConfig(answers))];
};
