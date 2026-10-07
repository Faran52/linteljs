import tseslint from 'typescript-eslint';

import { rules } from '../../../src/rules/registry.ts';

import type { Linter } from 'eslint';
import type { LintelRuleModule } from '../../../src/types.ts';

const RULES = new Map<string, LintelRuleModule>(Object.entries(rules));
export const RULE_IDS = [...RULES.keys()];

export const moduleOf = (id: string): LintelRuleModule => {
  const module = RULES.get(id);

  if (module === undefined) {
    throw new Error(`unknown rule: ${id}\nknown: ${RULE_IDS.join(', ')}`);
  }

  return module;
};

// JavaScript stays on espree, what a consumer linting `.js` runs: typescript-eslint accepts more syntax.
export const configFor = (
  modules: Record<string, LintelRuleModule>,
  settings: Linter.RulesRecord,
  linterOptions: Linter.LinterOptions,
): Linter.Config[] => {
  const shared = {
    linterOptions,
    plugins: { '@linteljs': { rules: modules } },
    rules: settings,
  };
  const config = [
    {
      ...shared,
      files: ['**/*.ts', '**/*.tsx'],
      languageOptions: { parser: tseslint.parser },
    },
    {
      ...shared,
      files: ['**/*.js', '**/*.cjs'],
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    },
  ];

  return config;
};
