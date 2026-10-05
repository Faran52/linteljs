import { omit } from 'es-toolkit';

import { type Answers, type Artifact } from '@config/types';

import { keysOf } from '@utils/objectUtils';

import {
  type AnswerKey,
  type AnswerRecord,
  ANSWERS,
  CONFIG_PATH,
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
} from '@answers';
import { targetFor } from '@targets';

import { emitted } from '../../utils/artifactUtils';

// An unasked answer still holds its default in `Answers`; the reader restores it, so the file leaves it out.
const unaskedKeys = (answers: Answers): AnswerKey[] => {
  const target = targetFor(answers);

  return keysOf(ANSWERS)
    .filter((key: AnswerKey) => {
      const record: AnswerRecord = ANSWERS[key];

      return record.slot?.(target) === false;
    });
};

export const emitLinteljsConfig = (answers: Answers): string => {
  const asked = omit(answers, unaskedKeys(answers));

  return `${JSON.stringify({
    $schema: CONFIG_SCHEMA_URL,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ...asked,
  }, null, 2)}\n`;
};

// Written by `sync` only to migrate a 1.x project, so a reformatted config survives `sync`.
// Seeded first, so a run that dies before `package.json` leaves the answers recorded.
export const linteljsConfigEmitter = (answers: Answers): Artifact[] => {
  const config = emitLinteljsConfig(answers);
  const artifacts = [emitted('package', CONFIG_PATH, config)];

  return artifacts;
};
