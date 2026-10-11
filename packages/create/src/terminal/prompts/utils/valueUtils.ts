import { keysOf } from '@utils/objectUtils';

import type { ChoiceRecord } from '@answers';
import type { Answers } from '@config/types';
import type { TargetRecord } from '@targets';

// The parser refuses the same values through the same predicate.
export const offeredValuesOf = <V extends string>(
  record: Pick<ChoiceRecord<V>, 'key' | 'values'>,
  target: TargetRecord,
  answered: Answers,
): readonly [V, ...V[]] => {
  const [first, ...rest] = keysOf(record.values)
    .filter((value) => {
      return record.values[value].only === undefined || record.values[value].only(target, answered);
    });

  // A record offering a prompted target nothing is a data bug.
  if (first === undefined) {
    throw new Error(`${record.key} offers no value to ${target.id}`);
  }

  const offered: readonly [V, ...V[]] = [first, ...rest];

  return offered;
};
