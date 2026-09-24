import { valuesOf } from '@utils/objectUtils';

import { CONFIG_SCHEMA_URL, CURRENT_SCHEMA_VERSION } from '../constants';

import type { AnswerKey } from '../registry';
import type {
  AnswerRecord,
  ChoiceRecord,
  MultiRecord,
  OptionalChoiceRecord,
  OptionalMultiRecord,
  TextRecord,
} from '../types';

interface SchemaPropertyNames {
  pattern: string;
}

interface SchemaProperty {
  type?: 'array' | 'boolean' | 'object' | 'string';
  const?: number | string;
  enum?: readonly string[];
  description?: string;
  items?: SchemaProperty;
  minLength?: number;
  minItems?: number;
  pattern?: string;
  uniqueItems?: boolean;
  propertyNames?: SchemaPropertyNames;
  additionalProperties?: SchemaProperty;
}

// `browser` is the one required-kind answer a config may still omit: `configFrom` defaults it to `'chrome'` for a
// config written before the extension axes existed, so the schema does not demand it either.
const REQUIRED_KINDS = new Set(['boolean', 'choice', 'multi']);

const isRequired = (key: AnswerKey, record: AnswerRecord): boolean => {
  return key !== 'browser' && REQUIRED_KINDS.has(record.kind);
};

const withDescription = (record: AnswerRecord): Partial<SchemaProperty> => {
  return record.description === undefined ? {} : { description: record.description };
};

// A scalar choice: `choice` and `optionalChoice` share this shape, one required and one not.
const enumProperty = (record: ChoiceRecord | OptionalChoiceRecord): SchemaProperty => {
  return {
    ...withDescription(record),
    enum: valuesOf(record.values),
  };
};

// `resolveConditions` and `ignores`: an open vocabulary, so there is nothing to enumerate, only the shape.
const stringListProperty = (record: AnswerRecord): SchemaProperty => {
  return {
    type: 'array',
    ...withDescription(record),
    items: {
      type: 'string',
      minLength: 1,
    },
    minItems: 1,
    uniqueItems: true,
  };
};

// `libraries`, `agents`, `plugins`, `surfaces`, `browsers`: a closed vocabulary, `minItems` only where a record
// names one, since a `multi` and an `optionalMulti` both default to none.
const enumListProperty = (record: MultiRecord | OptionalMultiRecord): SchemaProperty => {
  return {
    type: 'array',
    ...withDescription(record),
    items: { enum: valuesOf(record.values) },
    ...(record.minimum === undefined ? {} : { minItems: record.minimum }),
    uniqueItems: true,
  };
};

// `aliases`, the one `map`: an object rather than an array, its own shape entirely.
const mapProperty = (record: AnswerRecord): SchemaProperty => {
  return {
    type: 'object',
    ...withDescription(record),
    propertyNames: { pattern: '^[@$]' },
    additionalProperties: {
      type: 'string',
      minLength: 1,
    },
  };
};

// `packageManagerVersion` and `nodeVersion`: one string each, `pattern` the whole of what the schema can say.
const textProperty = (record: TextRecord): SchemaProperty => {
  return {
    type: 'string',
    ...withDescription(record),
    pattern: record.pattern,
  };
};

const propertyFor = (record: AnswerRecord): SchemaProperty => {
  switch (record.kind) {
    case 'text': {
      return textProperty(record);
    }

    case 'list': {
      return stringListProperty(record);
    }

    case 'map': {
      return mapProperty(record);
    }

    case 'multi':
    case 'optionalMulti': {
      return enumListProperty(record);
    }

    case 'choice':
    case 'optionalChoice': {
      return enumProperty(record);
    }
  }
};

/**
 * The v2 schema, generated from the records rather than hand-kept: `required` off the kinds that are required in
 * `Answers` (`browser` alone excepted, for the config files that predate it), every property's shape off its own
 * record's `kind`, in `ANSWERS`' own order. `scripts/write-schemas/writeSchemasScript.ts` writes this to both
 * checked-in copies, and `schemaUtils.test.ts` pins them against it, so a schema that drifts from the records is a
 * failing test rather than a silent one.
 */
export const schemaFor = (answers: Record<AnswerKey, AnswerRecord>): string => {
  const keys = valuesOf(answers);

  const required = ['$schema', 'schemaVersion', ...keys.filter((key) => {
    return isRequired(key, answers[key]);
  })];

  const properties: Record<string, SchemaProperty> = {
    $schema: { const: CONFIG_SCHEMA_URL },
    schemaVersion: { const: CURRENT_SCHEMA_VERSION },
  };

  for (const key of keys) {
    properties[key] = propertyFor(answers[key]);
  }

  const schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: CONFIG_SCHEMA_URL,
    title: 'LintelJS configuration',
    type: 'object',
    additionalProperties: false,
    required,
    properties,
  };

  return `${JSON.stringify(schema, null, 2)}\n`;
};
