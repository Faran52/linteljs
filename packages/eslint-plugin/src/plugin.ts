import { type RuleName, rules } from './rules/index.ts';
import {
  type LintelRuleModule,
  RULE_CATEGORIES,
  type RuleCategory,
  type RuleLanguage,
  TYPESCRIPT_FILES,
} from './types.ts';

import type { ESLint, Linter } from 'eslint';

export type PresetName = 'recommended' | RuleCategory;

// The eslintrc shape, for the majors that still read one.
export interface LegacyPreset {
  plugins: string[];
  rules: Partial<Record<string, Linter.RuleEntry>>;
  overrides: {
    files: string[];
    rules: Partial<Record<string, Linter.RuleEntry>>;
  }[];
}

// Both `recommended` (eslintrc object) and `flat/recommended` (array), for eslintrc consumers on the peer floor.
export type LintelConfigs
  = & Record<PresetName, LegacyPreset>
    & Record<`flat/${PresetName}`, Linter.Config[]>;

// Must track the package name: the eslintrc form derives the prefix from it, so a renamed package
// keeping the old prefix breaks every ESLint 5 to 8 consumer.
export const PLUGIN_NAME = '@linteljs';

// Named as well as default: a `.cjs` flat config reaches this through `require`'s namespace, not `default`.
export const meta = {
  name: '@linteljs/eslint-plugin',
  version: '1.5.0',
};

const plugin = {
  meta,
  rules,
} satisfies ESLint.Plugin;

const ruleEntries = Object.entries(rules) as [RuleName, LintelRuleModule][];

const selectByCategory = (category: RuleCategory): [RuleName, LintelRuleModule][] => {
  return ruleEntries.filter(([, rule]) => {
    return rule.meta.docs.category === category;
  });
};

const byLanguage = (
  selected: [RuleName, LintelRuleModule][],
  language: RuleLanguage,
): [RuleName, LintelRuleModule][] => {
  return selected.filter(([, rule]) => {
    return rule.meta.docs.language === language;
  });
};

const toRuleRecord = (
  selected: [RuleName, LintelRuleModule][],
): Partial<Record<string, Linter.RuleEntry>> => {
  const record: Partial<Record<string, Linter.RuleEntry>> = {};

  for (const [name] of selected) {
    record[`${PLUGIN_NAME}/${name}`] = 'error';
  }

  return record;
};

// TypeScript-only rules go in a second block behind a `files` glob, so none is listed as enabled on a `.js` file.
const definePreset = (
  name: string,
  selected: [RuleName, LintelRuleModule][],
): Linter.Config[] => {
  const typescriptOnly = byLanguage(selected, 'typescript');

  const preset: Linter.Config[] = [
    {
      name: `${PLUGIN_NAME}/${name}`,
      plugins: { [PLUGIN_NAME]: plugin },
      rules: toRuleRecord(byLanguage(selected, 'universal')),
    },
  ];

  if (typescriptOnly.length > 0) {
    preset.push({
      name: `${PLUGIN_NAME}/${name}/typescript`,
      files: [...TYPESCRIPT_FILES],
      rules: toRuleRecord(typescriptOnly),
    });
  }

  return preset;
};

// `recommended` carries only rules with `meta.docs.recommended` set; a category preset carries its whole category.
const recommendedEntries = ruleEntries.filter(([, rule]) => {
  return rule.meta.docs.recommended;
});

const presets: [PresetName, [RuleName, LintelRuleModule][]][] = [
  ['recommended', recommendedEntries],
  ...RULE_CATEGORIES.map((category): [PresetName, [RuleName, LintelRuleModule][]] => {
    return [category, selectByCategory(category)];
  }),
];

// The same selection as an eslintrc object: `plugins` is a name list and the TS-only block an `overrides` entry.
const defineLegacyPreset = (
  selected: [RuleName, LintelRuleModule][],
): LegacyPreset => {
  const typescriptOnly = byLanguage(selected, 'typescript');

  return {
    plugins: [PLUGIN_NAME],
    rules: toRuleRecord(byLanguage(selected, 'universal')),
    overrides: typescriptOnly.length === 0
      ? []
      : [{
          files: [...TYPESCRIPT_FILES],
          rules: toRuleRecord(typescriptOnly),
        }],
  };
};

const buildConfigs = (): LintelConfigs => {
  // A Record keyed by a union can't be built incrementally without this cast; Object.fromEntries would return any.
  const built = {} as LintelConfigs;

  for (const [name, selected] of presets) {
    built[name] = defineLegacyPreset(selected);
    built[`flat/${name}`] = definePreset(name, selected);
  }

  return built;
};

// Explicit annotation, not decoration: inference names a transitive `@eslint/core` path and fails on TS2742.
export const configs: LintelConfigs = buildConfigs();

// The same object the presets register: ESLint compares plugins by identity ("Cannot redefine plugin").
const lintel: ESLint.Plugin & { configs: LintelConfigs } = Object.assign(plugin, { configs });

export default lintel;
