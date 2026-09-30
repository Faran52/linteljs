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
  // `JSON.stringify` writes no key for an undefined value.
  description?: string | undefined;
  items?: SchemaProperty;
  minLength?: number;
  minItems?: number | undefined;
  pattern?: string;
  uniqueItems?: boolean;
  propertyNames?: SchemaPropertyNames;
  additionalProperties?: SchemaProperty;
}

// `browser` stays out of `required`: `configFrom` defaults it for configs that predate it.
const REQUIRED_KINDS = new Set(['choice', 'multi']);

const isRequired = (key: AnswerKey, record: AnswerRecord): boolean => {
  return key !== 'browser' && REQUIRED_KINDS.has(record.kind);
};

const withDescription = (record: AnswerRecord): Partial<SchemaProperty> => {
  return { description: record.description };
};

const enumProperty = (record: ChoiceRecord | OptionalChoiceRecord): SchemaProperty => {
  return {
    ...withDescription(record),
    enum: valuesOf(record.values),
  };
};

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

const enumListProperty = (record: MultiRecord | OptionalMultiRecord): SchemaProperty => {
  return {
    type: 'array',
    ...withDescription(record),
    items: { enum: valuesOf(record.values) },
    minItems: record.minimum,
    uniqueItems: true,
  };
};

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

// Generated from the records; `schemaUtils.test.ts` pins both checked-in copies against it.
export const schemaFor = (answers: Record<AnswerKey, AnswerRecord>): string => {
  const keys = valuesOf(answers);

  const required = [
    '$schema',
    'schemaVersion',
    ...keys
      .filter((key) => {
        return isRequired(key, answers[key]);
      }),
  ];

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
