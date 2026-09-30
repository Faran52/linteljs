import { TYPESCRIPT_FILES } from './constants.ts';
import { rules } from './rules/index.ts';

import type { ESLint, Linter } from 'eslint';
import type { LintelRuleModule, RuleLanguage } from './types.ts';

// A rule's domain is carried by its id, not by a field generating a preset per value.
export type PresetName = 'recommended' | 'all';

export interface LegacyOverride {
  files: string[];
  rules: Partial<Record<string, Linter.RuleEntry>>;
}

export interface LegacyPreset {
  plugins: string[];
  rules: Partial<Record<string, Linter.RuleEntry>>;
  overrides: LegacyOverride[];
}

export type LintelConfigs
  = & Record<PresetName, LegacyPreset>
    & Record<`flat/${PresetName}`, Linter.Config[]>;

interface WithConfigs {
  configs: LintelConfigs;
}

type RuleEntry = [string, LintelRuleModule];

// The eslintrc form derives the prefix from the package name; a mismatch breaks every ESLint 5 to 8 consumer.
export const PLUGIN_NAME = '@linteljs';

// Named as well as default: a `.cjs` flat config reaches this through `require`'s namespace.
export const meta = {
  name: '@linteljs/eslint-plugin',
  version: '2.0.0',
};

const plugin = {
  meta,
  rules,
} satisfies ESLint.Plugin;

const ruleEntries: RuleEntry[] = Object.entries(rules);

const byLanguage = (
  selected: RuleEntry[],
  language: RuleLanguage,
): RuleEntry[] => {
  return selected
    .filter(([, rule]) => {
      return rule.meta.docs.language === language;
    });
};

const toRuleRecord = (
  selected: RuleEntry[],
): Partial<Record<string, Linter.RuleEntry>> => {
  const record: Partial<Record<string, Linter.RuleEntry>> = {};

  for (const [name] of selected) {
    record[`${PLUGIN_NAME}/${name}`] = 'error';
  }

  return record;
};

// TypeScript-only rules sit behind a `files` glob, so none is enabled on a `.js` file.
const definePreset = (
  name: string,
  selected: RuleEntry[],
): Linter.Config[] => {
  return [
    {
      name: `${PLUGIN_NAME}/${name}`,
      plugins: { [PLUGIN_NAME]: plugin },
      rules: toRuleRecord(byLanguage(selected, 'universal')),
    },
    {
      name: `${PLUGIN_NAME}/${name}/typescript`,
      files: [...TYPESCRIPT_FILES],
      rules: toRuleRecord(byLanguage(selected, 'typescript')),
    },
  ];
};

// `all` is the one way in for a rule that ships off by default.
const recommendedEntries = ruleEntries
  .filter(([, rule]) => {
    return rule.meta.docs.recommended;
  });

const presets: [PresetName, RuleEntry[]][] = [
  ['recommended', recommendedEntries],
  ['all', ruleEntries],
];

const defineLegacyPreset = (
  selected: RuleEntry[],
): LegacyPreset => {
  return {
    plugins: [PLUGIN_NAME],
    rules: toRuleRecord(byLanguage(selected, 'universal')),
    overrides: [{
      files: [...TYPESCRIPT_FILES],
      rules: toRuleRecord(byLanguage(selected, 'typescript')),
    }],
  };
};

const buildConfigs = (): LintelConfigs => {
  // A Record keyed by a union cannot be built incrementally without this cast.
  const built = {} as LintelConfigs;

  for (const [name, selected] of presets) {
    built[name] = defineLegacyPreset(selected);
    built[`flat/${name}`] = definePreset(name, selected);
  }

  return built;
};

// Explicit annotation, not decoration: inference names a transitive `@eslint/core` path and fails on TS2742.
export const configs: LintelConfigs = buildConfigs();

// ESLint compares plugins by identity ("Cannot redefine plugin").
const linteljs: ESLint.Plugin & WithConfigs = Object.assign(plugin, { configs });

export default linteljs;
