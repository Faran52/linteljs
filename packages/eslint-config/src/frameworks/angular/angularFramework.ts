import angularEslint from 'angular-eslint';
import tseslint from 'typescript-eslint';

import { presetOf } from '../../utils/presetUtils';

import type { Layer } from '../../types';

export const angularGroup: string[] = ['^@angular/', '^rxjs$', '^rxjs/'];

const TS_FILES = ['**/*.ts'];

const TEMPLATE_FILES = ['**/*.html'];

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
      /*
       * A class with a decorator on it is not an extraneous class: it is how Angular declares a component, and a
       * component with no state of its own still has a template, a selector and a place in the injector. The rule
       * ships the option for exactly this, and without it every presentational component fails its own lint.
       */
      name: '@linteljs/angular/decorated-classes',
      files: TS_FILES,
      // Declared here so the layer stands alone: it names a rule whose plugin no preset above it registers.
      plugins: { '@typescript-eslint': tseslint.plugin },
      rules: { '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }] },
    },

    ...presetOf(angularEslint.configs.templateRecommended, 'angular-eslint/template', TEMPLATE_FILES),

    // `templateRecommended` has no accessibility rule; the eleven that are ship as their own preset.
    ...presetOf(angularEslint.configs.templateAccessibility, 'angular-eslint/templateAccessibility', TEMPLATE_FILES),
  ];
};

export default angular;
