import { isJsonObject, valuesOf } from '#utils/objectUtils';

import type { AliasMap } from '#config/types';
import type {
  AnswerRecord,
  ChoiceRecord,
  ListRecord,
  MapRecord,
  MultiRecord,
  OptionalChoiceRecord,
  OptionalMultiRecord,
  TextRecord,
} from '../types';

export type JsonValue = null | boolean | number | string | object;

type ReadResult<R extends AnswerRecord>
  = R extends ListRecord ? string[] | undefined
    : R extends MapRecord ? AliasMap | undefined
      : R extends TextRecord ? string | undefined
        : R extends MultiRecord<infer V> ? V[]
          : R extends OptionalMultiRecord<infer V> ? V[] | undefined
            : R extends ChoiceRecord<infer V> ? V
              : R extends OptionalChoiceRecord<infer V> ? V | undefined
                : never;

export const isJsonArray = (value: JsonValue | undefined): value is JsonValue[] => {
  return Array.isArray(value);
};

/**
 * What a record's own answer is worth when nothing asked for it: a record's `default` for the two kinds that are
 * required in `Answers`, and `undefined` for the five kinds that are optional there. `refuseMisfit` compares an
 * answer against this to tell an unasked value from a misfit one; the prompt writes it for a question a `slot` or
 * an `askedWhen` skipped.
 */
export const unaskedValueOf = (record: AnswerRecord): JsonValue | undefined => {
  const isRequired = record.kind === 'choice' || record.kind === 'multi';

  return isRequired ? record.default : undefined;
};

export const refuseDuplicates = (values: string[], field: string): void => {
  if (new Set(values).size !== values.length) {
    throw new Error(`${field} must not contain duplicate values`);
  }
};

export const isValueOf = <V extends string>(value: string, values: Record<V, unknown>): value is V => {
  return value in values;
};

const choiceValue = <V extends string>(
  value: JsonValue | undefined,
  key: string,
  values: Record<V, unknown>,
): V => {
  if (typeof value !== 'string' || !isValueOf(value, values)) {
    throw new Error(`${key} must be one of: ${valuesOf(values).join(', ')}`);
  }

  return value;
};

const arrayOfChoices = <V extends string>(
  value: JsonValue | undefined,
  key: string,
  values: Record<V, unknown>,
  minimum: number,
): V[] => {
  if (!isJsonArray(value)) {
    throw new Error(`${key} must be an array`);
  }

  const choices = value.map((item) => {
    return choiceValue(item, key, values);
  });

  if (choices.length < minimum) {
    throw new Error(`${key} must contain at least ${String(minimum)} value`);
  }

  refuseDuplicates(choices, key);

  return choices;
};

// `resolveConditions` and `ignores` are both open vocabularies, so only the shape is checked, and it is the same
// shape: a non-empty list of distinct non-empty strings.
const stringList = (value: JsonValue | undefined, key: string): string[] => {
  if (!isJsonArray(value) || value.length === 0) {
    throw new Error(`${key} must be a non-empty array`);
  }

  const names = value.map((item) => {
    if (typeof item !== 'string' || item === '') {
      throw new Error(`${key} must contain only non-empty strings`);
    }

    return item;
  });

  refuseDuplicates(names, key);

  return names;
};

// The record's `pattern` is the whole vocabulary, so a value that misses it is no more a reading of this key than a
// number would be.
const textValue = (value: JsonValue | undefined, key: string, pattern: string): string => {
  if (typeof value !== 'string' || !new RegExp(pattern, 'u').test(value)) {
    throw new Error(`${key} must be a string`);
  }

  return value;
};

// Names are the project's; the sigil is checked because `simple-import-sort` groups on it and a bare key sorts as a
// package.
const aliasMap = (value: JsonValue | undefined, key: string): AliasMap => {
  if (!isJsonObject(value)) {
    throw new Error(`${key} must be an object`);
  }

  const entries = Object.entries(value);

  for (const [alias, directory] of entries) {
    if (!alias.startsWith('@') && !alias.startsWith('$')) {
      throw new Error(`${key} key must start with @ or $: ${alias}`);
    }

    if (typeof directory !== 'string' || directory === '') {
      throw new Error(`${key}.${alias} must be a non-empty string`);
    }
  }

  return Object.fromEntries(entries.map(([alias, directory]) => {
    return [alias, String(directory)];
  }));
};

/**
 * One reader per kind, dispatched off `record.kind`: a `choice` or `multi` throws when the value is missing or
 * illegal, since both are required in `Answers`; the rest answer `undefined` for an absent value, since both are
 * optional there. `record.key` is the field name every message carries, so no caller spells it a second time.
 */
export const readAnswer = <R extends AnswerRecord>(record: R, value: JsonValue | undefined): ReadResult<R> => {
  switch (record.kind) {
    case 'choice': {
      return choiceValue(value, record.key, record.values) as ReadResult<R>;
    }

    case 'optionalChoice': {
      return (value === undefined ? undefined : choiceValue(value, record.key, record.values)) as ReadResult<R>;
    }

    case 'multi': {
      return arrayOfChoices(value, record.key, record.values, record.minimum ?? 0) as ReadResult<R>;
    }

    case 'optionalMulti': {
      return (value === undefined
        ? undefined
        : arrayOfChoices(value, record.key, record.values, record.minimum ?? 0)) as ReadResult<R>;
    }

    case 'list': {
      return (value === undefined ? undefined : stringList(value, record.key)) as ReadResult<R>;
    }

    case 'map': {
      return (value === undefined ? undefined : aliasMap(value, record.key)) as ReadResult<R>;
    }

    case 'text': {
      return (value === undefined
        ? undefined
        : textValue(value, record.key, record.pattern)) as ReadResult<R>;
    }
  }
};
