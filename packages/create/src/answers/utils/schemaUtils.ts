import { keysOf } from '@utils/objectUtils';

import {
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
  PROJECT_NAME_PATTERN,
  WORKSPACE_KEYS,
} from '../constants';

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

// `browser` and `layout` stay out of `required`: `configFrom` defaults them for configs that predate them.
const REQUIRED_KINDS = new Set(['choice', 'multi']);
const DEFAULTED = new Set<AnswerKey>(['browser', 'layout']);

const isRequired = (key: AnswerKey, record: AnswerRecord): boolean => {
  return !DEFAULTED.has(key) && REQUIRED_KINDS.has(record.kind);
};

const withDescription = (record: AnswerRecord): Partial<SchemaProperty> => {
  const descriptionPart: Partial<SchemaProperty> = { description: record.description };

  return descriptionPart;
};

const enumProperty = (record: ChoiceRecord | OptionalChoiceRecord): SchemaProperty => {
  const property: SchemaProperty = {
    ...withDescription(record),
    enum: keysOf(record.values),
  };

  return property;
};

const stringListProperty = (record: AnswerRecord): SchemaProperty => {
  const property: SchemaProperty = {
    type: 'array',
    ...withDescription(record),
    items: {
      type: 'string',
      minLength: 1,
    },
    minItems: 1,
    uniqueItems: true,
  };

  return property;
};

const enumListProperty = (record: MultiRecord | OptionalMultiRecord): SchemaProperty => {
  const property: SchemaProperty = {
    type: 'array',
    ...withDescription(record),
    items: { enum: keysOf(record.values) },
    minItems: record.minimum,
    uniqueItems: true,
  };

  return property;
};

const mapProperty = (record: AnswerRecord): SchemaProperty => {
  const property: SchemaProperty = {
    type: 'object',
    ...withDescription(record),
    propertyNames: { pattern: '^[@$]' },
    additionalProperties: {
      type: 'string',
      minLength: 1,
    },
  };

  return property;
};

const textProperty = (record: TextRecord): SchemaProperty => {
  const property: SchemaProperty = {
    type: 'string',
    ...withDescription(record),
    pattern: record.pattern,
  };

  return property;
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

const isWorkspaceKey = (key: AnswerKey): boolean => {
  return WORKSPACE_KEYS
    .some((workspaceKey) => {
      return workspaceKey === key;
    });
};

const requiredOf = (answers: Record<AnswerKey, AnswerRecord>, keys: AnswerKey[]): AnswerKey[] => {
  return keys
    .filter((key) => {
      return isRequired(key, answers[key]);
    });
};

const propertiesOf = (answers: Record<AnswerKey, AnswerRecord>, keys: AnswerKey[]): Record<string, SchemaProperty> => {
  const properties: Record<string, SchemaProperty> = {};

  for (const key of keys) {
    properties[key] = propertyFor(answers[key]);
  }

  return properties;
};

// Generated from the records; `schemaUtils.test.ts` pins both checked-in copies against it.
export const schemaFor = (answers: Record<AnswerKey, AnswerRecord>): string => {
  const keys = keysOf(answers);
  const workspaceKeys = keys.filter(isWorkspaceKey);
  const projectKeys = keys
    .filter((key) => {
      return !isWorkspaceKey(key);
    });

  const schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: CONFIG_SCHEMA_URL,
    title: 'LintelJS configuration',
    type: 'object',
    additionalProperties: false,
    required: [
      '$schema',
      'schemaVersion',
      ...requiredOf(answers, workspaceKeys),
      'projects',
    ],
    properties: {
      $schema: { const: CONFIG_SCHEMA_URL },
      schemaVersion: { const: CURRENT_SCHEMA_VERSION },
      ...propertiesOf(answers, workspaceKeys),
      projects: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: false,
          required: requiredOf(answers, projectKeys),
          properties: {
            name: {
              description: 'The project\'s directory under apps/ or packages/; required in a monorepo.',
              type: 'string',
              pattern: PROJECT_NAME_PATTERN,
            },
            ...propertiesOf(answers, projectKeys),
          },
        },
      },
    },
    // An absent layout is single, so the first rule applies to it too.
    allOf: [
      {
        if: { properties: { layout: { const: 'single' } } },
        then: { properties: { projects: { maxItems: 1 } } },
      },
      {
        if: {
          required: ['layout'],
          properties: { layout: { const: 'monorepo' } },
        },
        then: { properties: { projects: { items: { required: ['name'] } } } },
      },
    ],
  };

  return `${JSON.stringify(schema, null, 2)}\n`;
};
