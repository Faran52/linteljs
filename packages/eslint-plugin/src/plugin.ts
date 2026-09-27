import { TYPESCRIPT_FILES } from './constants.ts';
import { type RuleName, rules } from './rules/index.ts';

import type { ESLint, Linter } from 'eslint';
import type { LintelRuleModule, RuleLanguage } from './types.ts';

// Two, and the level is the only axis. A rule's domain is carried by its id, the way `native-*` and
// `@stylistic`'s `jsx-*` do, rather than by a field generating a preset per value.
export type PresetName = 'recommended' | 'all';

// A `files`-scoped block inside an eslintrc preset, which is where the TypeScript-only rules go.
export interface LegacyOverride {
  files: string[];
  rules: Partial<Record<string, Linter.RuleEntry>>;
}

// The eslintrc shape, for the majors that still read one.
export interface LegacyPreset {
  plugins: string[];
  rules: Partial<Record<string, Linter.RuleEntry>>;
  overrides: LegacyOverride[];
}

// Both `recommended` (eslintrc object) and `flat/recommended` (array), for eslintrc consumers on the peer floor.
export type LintelConfigs
  = & Record<PresetName, LegacyPreset>
    & Record<`flat/${PresetName}`, Linter.Config[]>;

interface WithConfigs {
  configs: LintelConfigs;
}

// Must track the package name: the eslintrc form derives the prefix from it, so a renamed package
// keeping the old prefix breaks every ESLint 5 to 8 consumer.
export const PLUGIN_NAME = '@linteljs';

// Named as well as default: a `.cjs` flat config reaches this through `require`'s namespace, not `default`.
export const meta = {
  name: '@linteljs/eslint-plugin',
  version: '2.0.0',
};

const plugin = {
  meta,
  rules,
} satisfies ESLint.Plugin;

const ruleEntries = Object.entries(rules) as [RuleName, LintelRuleModule][];

const byLanguage = (
  selected: [RuleName, LintelRuleModule][],
  language: RuleLanguage,
): [RuleName, LintelRuleModule][] => {
  return selected
    .filter(([, rule]) => {
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

/**
 * TypeScript-only rules go in a second block behind a `files` glob, so none is listed as enabled on a `.js` file.
 * Both presets always carry some, which is why there is no branch here: `recommended` and `all` are the two, and
 * `meta.test.ts` holds each to a second block rather than leaving that to read as an accident.
 */
const definePreset = (
  name: string,
  selected: [RuleName, LintelRuleModule][],
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

// `recommended` carries only rules with `meta.docs.recommended` set; `all` is every rule, which is the one way in
// for a rule that ships off by default.
const recommendedEntries = ruleEntries
  .filter(([, rule]) => {
    return rule.meta.docs.recommended;
  });

const presets: [PresetName, [RuleName, LintelRuleModule][]][] = [
  ['recommended', recommendedEntries],
  ['all', ruleEntries],
];

// The same selection as an eslintrc object: `plugins` is a name list and the TS-only block an `overrides` entry.
const defineLegacyPreset = (
  selected: [RuleName, LintelRuleModule][],
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
const linteljs: ESLint.Plugin & WithConfigs = Object.assign(plugin, { configs });

export default linteljs;
