import type { Answers } from '@config/types';
import type { TargetRecord } from '@targets';
import type { AnswerRecord, ValueRecord } from '../types';

/**
 * `only`, for a record that carries `values` and a value chosen from them. `values` narrows to `Record<string,
 * ValueRecord>` on assignment: a closed key union is a legal source for a wider index signature of the same value
 * type, and every one of the four kinds with `values` shares this one.
 */
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
