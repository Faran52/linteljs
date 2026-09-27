import type { Answers } from '@config/types';
import type { TargetRecord } from '@targets';
import type { AnswerRecord, ValueRecord } from '../types';

// A closed key union is a legal source for a wider index signature of the same value type.
export const onlyFor = (
  record: AnswerRecord,
  chosen: string,
): ((target: TargetRecord, answered: Answers) => boolean)
  | undefined => {
  if (!('values' in record)) {
    return undefined;
  }

  const values: Record<string, ValueRecord> = record.values;

  return values[chosen]?.only;
};
