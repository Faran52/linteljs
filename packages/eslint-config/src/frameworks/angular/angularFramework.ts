import angularEslint from 'angular-eslint';
import tseslint from 'typescript-eslint';

import { presetOf, sonarjsRules } from '../../utils/presetUtils';

import type { Linter } from 'eslint';
import type { Layer } from '../../types';

export const angularGroup: string[] = [
  '^@angular/',
  '^rxjs$',
  '^rxjs/',
];

const TS_FILES = ['**/*.ts'];

const TEMPLATE_FILES = ['**/*.html'];

const ANGULAR_SONARJS_RULES: Linter.RulesRecord = { 'sonarjs/no-angular-bypass-sanitization': 'error' };

// Brings its own template parser, so it is the one target without `html()`.
export const angular = (): Layer => {
  return [
    ...presetOf(angularEslint.configs.tsRecommended, 'angular-eslint/tsRecommended', TS_FILES),

    {
      name: '@linteljs/angular/inline-templates',
      files: TS_FILES,
      processor: angularEslint.processInlineTemplates,
    },

    {
      // Angular declares a component by decorator; without this every presentational component fails.
      name: '@linteljs/angular/decorated-classes',
      files: TS_FILES,
      // Declared so the layer stands alone: no preset above registers this plugin.
      plugins: { '@typescript-eslint': tseslint.plugin },
      rules: { '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }] },
    },

    // `sonarjs/recommended`'s Angular rule, which `base` turns off.
    ...sonarjsRules('@linteljs/angular/sonarjs', ANGULAR_SONARJS_RULES, TS_FILES),

    ...presetOf(angularEslint.configs.templateRecommended, 'angular-eslint/template', TEMPLATE_FILES),

    // `templateRecommended` has no accessibility rule.
    ...presetOf(angularEslint.configs.templateAccessibility, 'angular-eslint/templateAccessibility', TEMPLATE_FILES),
  ];
};

export default angular;
