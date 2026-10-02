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

// Written by `sync` only to migrate a 1.x project, so a reformatted config survives `sync`.
// Seeded first, so a run that dies before `package.json` leaves the answers recorded.
export const linteljsConfigEmitter = (answers: Answers): Artifact[] => {
  const config = emitLinteljsConfig(answers);
  const artifacts = [emitted('package', CONFIG_PATH, config)];

  return artifacts;
};
