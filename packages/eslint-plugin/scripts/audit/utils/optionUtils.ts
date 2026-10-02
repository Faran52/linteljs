import { moduleOf } from './lintUtils.ts';

import type { Rule } from 'eslint';

type JSONSchema4 = Extract<NonNullable<Rule.RuleMetaData['schema']>, unknown[]>[number];

export type OptionValue = boolean | number | string | string[];

export interface Configuration {
  label: string;
  options: Record<string, Record<string, OptionValue>>;
  rule: string;
}

const EXTRA_HOOK_NAMES = ['useLayoutEffect', 'useImperativeHandle'];
const SCALAR_TYPES = [
  'boolean',
  'number',
  'string',
];

const isStringList = (value: unknown): value is string[] => {
  return Array.isArray(value) && value
    .every((item) => {
      return typeof item === 'string';
    });
};

const isScalar = (value: unknown): value is boolean | number | string => {
  return SCALAR_TYPES.includes(typeof value);
};

// An option type with no values here throws, so a new option cannot quietly go unswept.
const valuesFor = (property: JSONSchema4): OptionValue[] => {
  if (property.type === 'boolean') {
    const both = [true, false];

    return both;
  }

  if (property.enum !== undefined) {
    return property.enum.filter(isScalar);
  }

  const fallback: unknown = property.default;

  if (property.type === 'integer' && typeof fallback === 'number') {
    const sizes = [
      property.minimum ?? 0,
      fallback,
      fallback * 2 + 2,
    ];

    return sizes;
  }

  if (property.type === 'array' && isStringList(fallback)) {
    const hookLists = [fallback, [...fallback, ...EXTRA_HOOK_NAMES]];

    return hookLists;
  }

  throw new Error(`no values known for a schema property of type ${JSON.stringify(property.type)}`);
};

// Derived from `meta.schema`, so an option added to a rule is swept the day it lands.
export const configurationsFor = (rule: string): Configuration[] => {
  const { schema } = moduleOf(rule).meta;
  const [first] = Array.isArray(schema) ? schema : [];

  return Object.entries(first?.properties ?? {})
    .flatMap(([option, property]) => {
      return valuesFor(property)
        .map((value) => {
          const configuration: Configuration = {
            label: `${rule} { ${option}: ${JSON.stringify(value)} }`,
            options: { [rule]: { [option]: value } },
            rule,
          };

          return configuration;
        });
    });
};
