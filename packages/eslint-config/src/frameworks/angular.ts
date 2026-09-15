import angularEslint from 'angular-eslint';

import { presetOf } from '../utils/presetUtils';

import type { Layer } from '../types';

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

    ...presetOf(angularEslint.configs.templateRecommended, 'angular-eslint/template', TEMPLATE_FILES),

    // `templateRecommended` has no accessibility rule; the eleven that are ship as their own preset.
    ...presetOf(angularEslint.configs.templateAccessibility, 'angular-eslint/templateAccessibility', TEMPLATE_FILES),
  ];
};

export default angular;
