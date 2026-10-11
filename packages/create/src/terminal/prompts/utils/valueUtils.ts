import {
  isJsonObject,
  isValueOf,
  keysOf,
} from '@utils/objectUtils';

import {
  type AnswerKey,
  type AnswerRecord,
  ANSWERS,
  type ChoiceRecord,
  isJsonArray,
  type JsonValue,
  type ValueRecord,
} from '@answers';

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

const isChoiceOf = (values: Record<string, Omit<ValueRecord, 'only'>>, value: JsonValue): boolean => {
  return typeof value === 'string' && isValueOf(value, values);
};

const isListOf = (value: JsonValue, isItem: (item: JsonValue) => boolean): boolean => {
  return isJsonArray(value) && value.every(isItem);
};

const isString = (value: JsonValue): boolean => {
  return typeof value === 'string';
};

// Absent fits only where `Answers` may leave the key out.
const fitsRecord = (record: AnswerRecord, value: JsonValue | undefined): boolean => {
  if (value === undefined) {
    return record.kind !== 'choice' && record.kind !== 'multi';
  }

  switch (record.kind) {
    case 'choice':

    case 'optionalChoice': {
      return isChoiceOf(record.values, value);
    }

    case 'multi':

    case 'optionalMulti': {
      return isListOf(value, (item) => {
        return isChoiceOf(record.values, item);
      });
    }

    case 'list': {
      return isListOf(value, isString);
    }

    case 'map': {
      return isJsonObject(value) && Object.values(value).every(isString);
    }

    case 'text': {
      return isString(value);
    }
  }
};

// A misfit is a data bug: every value comes from a record, a default or the flags already parsed.
export const assertAnswers: (answers: Partial<Record<AnswerKey, JsonValue>>) => asserts answers is Answers = (
  answers,
) => {
  const misfit = keysOf(ANSWERS)
    .find((key) => {
      return !fitsRecord(ANSWERS[key], answers[key]);
    });

  if (misfit !== undefined) {
    throw new Error(`${misfit} is not a value its record allows: ${JSON.stringify(answers[misfit])}`);
  }
};
