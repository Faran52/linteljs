import stylexPlugin from '@stylexjs/eslint-plugin';

import { SCRIPT_AND_SFC_FILES } from '../../config/constants';

import type { ESLint, Rule } from 'eslint';
import type { Layer } from '../../types';

/**
 * StyleX 0.19 compiles each of these to no CSS at all, without an error. Measured against its Babel plugin. It drops
 * `border` and the eight one-sided border shorthands too, and `valid-styles` refuses those itself while
 * `banPropsForLegacy` is off, so a limit here would never be read.
 */
const DROPPED_SHORTHANDS = [
  'animation',
  'background',
  'borderBlock',
  'borderInline',
];

const VALID_IMPORTS = ['stylex', '@stylexjs/stylex'];

/*
 * `valid-styles` 0.19 still calls `context.getScope()`, which ESLint 9 removed, on a name in a numeric property
 * that its own table of constants cannot resolve, and the whole run threw. Such a name is an import or a `let`,
 * which StyleX cannot compile either, and the rule reports it from any scope that does not hold it as a `const`.
 * A copy rather than a wrapper: the context is frozen, and these are every member ESLint's type declares.
 */
const withGetScope = (rule: Rule.RuleModule): Rule.RuleModule => {
  return {
    ...rule,
    create: (context) => {
      const { sourceCode } = context;
      const scoped = {
        id: context.id,
        options: context.options,
        settings: context.settings,
        languageOptions: context.languageOptions,
        cwd: context.cwd,
        filename: context.filename,
        physicalFilename: context.physicalFilename,
        sourceCode,
        report: (descriptor: Rule.ReportDescriptor) => {
          context.report(descriptor);
        },
        getScope: () => {
          return sourceCode.getScope(sourceCode.ast);
        },
      };

      return rule.create(scoped);
    },
  };
};

const { 'valid-shorthands': validShorthands, 'valid-styles': validStyles } = stylexPlugin.rules;

// Once, not per call: ESLint refuses two different objects under one plugin name.
const plugin: ESLint.Plugin = {
  ...stylexPlugin,
  rules: {
    ...stylexPlugin.rules,
    'valid-styles': withGetScope(validStyles),
    // Published as `type: 'error'`, which is none of ESLint's three, so no `--fix-type` ever applied its fix.
    'valid-shorthands': {
      ...validShorthands,
      meta: {
        ...validShorthands.meta,
        type: 'problem',
      },
    },
  },
};

// The plugin publishes no preset, so every rule is named here.
export const stylex = (): Layer => {
  return [{
    name: '@linteljs/stylex',
    files: [...SCRIPT_AND_SFC_FILES, '**/*.astro'],
    plugins: { '@stylexjs': plugin },
    rules: {
      '@stylexjs/valid-styles': ['error', {
        validImports: VALID_IMPORTS,
        // A value holding `var()` skips the rule's own check, so the ban has to be named.
        allowRawCSSVars: true,
        allowOuterPseudoAndMedia: false,
        banPropsForLegacy: false,
        propLimits: Object.fromEntries(DROPPED_SHORTHANDS
          .map((prop) => {
            return [prop, {
              limit: null,
              reason: 'StyleX drops this shorthand with no error. Use the longhands.',
            }];
          })),
      }],
      '@stylexjs/valid-shorthands': ['error', {
        validImports: VALID_IMPORTS,
        allowImportant: false,
        preferInline: false,
      }],
      '@stylexjs/no-unused': ['error', { validImports: VALID_IMPORTS }],
      '@stylexjs/no-conflicting-props': ['error', { validImports: VALID_IMPORTS }],
      '@stylexjs/no-legacy-contextual-styles': ['error', { validImports: VALID_IMPORTS }],
      '@stylexjs/enforce-extension': ['error', {
        validImports: VALID_IMPORTS,
        themeFileExtension: '.stylex',
        legacyAllowMixedExports: false,
        enforceDefineConstsExtension: false,
      }],
    },
  }];
};

export default stylex;
