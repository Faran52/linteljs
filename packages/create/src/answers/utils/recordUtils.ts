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

export const refusedValue = (
  record: AnswerRecord,
  chosen: Answers[keyof Answers],
  target: TargetRecord,
  answered: Answers,
): string | undefined => {
  if (typeof chosen !== 'string') {
    return undefined;
  }

  const only = onlyFor(record, chosen);

  return only === undefined || only(target, answered) ? undefined : chosen;
};
