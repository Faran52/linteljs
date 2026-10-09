import { keysOf } from '@utils/objectUtils';

import { type TargetRecord, TARGETS } from '@targets';

import {
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
  PROJECT_NAME_PATTERN,
  TARGET_BOUND_KEYS,
  WORKSPACE_KEYS,
} from '../constants';
import {
  type AnswerKey,
  ANSWERS,
  DEFAULT_ANSWERS,
} from '../registry';

import { refusedValue } from './recordUtils';

import type {
  Answers,
  HostedFramework,
  TargetId,
} from '@config/types';
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

interface Variant {
  hosted?: HostedFramework;
  answered: Answers;
  record: TargetRecord;
}

interface ConstCondition {
  const: string;
}

interface EnumCondition {
  enum: readonly string[];
}

interface NotEnum {
  not: EnumCondition;
}

interface NotConst {
  not: ConstCondition;
}

interface RefusalProperties {
  target: ConstCondition | EnumCondition;
  hostedFramework?: NotEnum;
}

interface RefusalIf {
  required?: string[];
  properties: RefusalProperties;
}

interface RequiredList {
  required: string[];
}

interface NotRequired {
  not: RequiredList;
}

interface ValueRefused {
  properties: Record<string, NotConst>;
}

type RefusalThen = NotRequired | ValueRefused;

interface Refusal {
  if: RefusalIf;
  then: RefusalThen;
}

type Refuses = (variant: Variant) => boolean;

// Each target-bound answer is a choice among values, so its refusals are a slot and a value per target.
type TargetBoundKey = (typeof TARGET_BOUND_KEYS)[number];

type SchemaAnswers = Record<AnswerKey, AnswerRecord> & Record<TargetBoundKey, OptionalChoiceRecord>;

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

const variantsOf = (target: TargetId): Variant[] => {
  const answered: Answers = { ...DEFAULT_ANSWERS, target };
  const record = TARGETS[target](answered);
  const hosts = record.hostsFramework === true ? keysOf(ANSWERS.hostedFramework.values) : [];
  const hostedVariants = hosts
    .map((hosted): Variant => {
      const hostedAnswers: Answers = { ...answered, hostedFramework: hosted };

      const variant: Variant = {
        hosted,
        answered: hostedAnswers,
        record: TARGETS[target](hostedAnswers),
      };

      return variant;
    });
  const plain: Variant = { answered, record };
  const variants = [plain, ...hostedVariants];

  return variants;
};

// Refused on some hosted frameworks only; `required` spares an absent one when the plain target is allowed.
const hostedRefusal = (target: TargetId, variants: Variant[], refuses: Refuses, then: RefusalThen): Refusal => {
  const allowedHosts = variants
    .flatMap((variant) => {
      const hosts = variant.hosted === undefined || refuses(variant) ? [] : [variant.hosted];

      return hosts;
    });
  const plainAllowed = !variants
    .some((variant) => {
      return variant.hosted === undefined && refuses(variant);
    });

  const refusal: Refusal = {
    if: {
      ...(plainAllowed ? { required: ['hostedFramework'] } : {}),
      properties: {
        target: { const: target },
        hostedFramework: { not: { enum: allowedHosts } },
      },
    },
    then,
  };

  return refusal;
};

const refusalsOf = (refuses: Refuses, then: RefusalThen): Refusal[] => {
  const whole: TargetId[] = [];
  const partial: Refusal[] = [];

  for (const target of keysOf(TARGETS)) {
    const variants = variantsOf(target);
    const refused = variants.filter(refuses).length;

    if (refused === variants.length) {
      whole.push(target);
    }
    else if (refused > 0) {
      partial.push(hostedRefusal(target, variants, refuses, then));
    }
  }

  const wholeRefusal: Refusal[] = whole.length === 0 ? [] : [{ if: { properties: { target: { enum: whole } } }, then }];

  const refusals = [...wholeRefusal, ...partial];

  return refusals;
};

// The parser's slot and value refusals, run over every target so the schema cannot drift from them.
const projectRefusals = (answers: SchemaAnswers): Refusal[] => {
  return TARGET_BOUND_KEYS
    .flatMap((key) => {
      const record = answers[key];

      const unslotted = (variant: Variant): boolean => {
        return record.slot?.(variant.record) === false;
      };

      const values = Object.keys(record.values);
      const valueRefusals = values
        .flatMap((value) => {
          return refusalsOf((variant) => {
            return !unslotted(variant) && refusedValue(record, value, variant.record, variant.answered) !== undefined;
          }, { properties: { [key]: { not: { const: value } } } });
        });

      const keyRefusals = [...refusalsOf(unslotted, { not: { required: [key] } }), ...valueRefusals];

      return keyRefusals;
    });
};

// Generated from the records; `schemaUtils.test.ts` pins both checked-in copies against it.
export const schemaFor = (answers: SchemaAnswers): string => {
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
          allOf: projectRefusals(answers),
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
