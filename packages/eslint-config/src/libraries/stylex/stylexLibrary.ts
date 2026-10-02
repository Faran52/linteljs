import stylexPlugin from '@stylexjs/eslint-plugin';

import { SCRIPT_AND_SFC_FILES } from '../../config/constants';

import type { ESLint, Rule } from 'eslint';
import type { Layer } from '../../types';

interface PropLimit {
  limit: null;
  reason: string;
}

// StyleX 0.19 silently compiles each of these to no CSS, measured against its Babel plugin.
const DROPPED_SHORTHANDS = [
  'animation',
  'background',
  'borderBlock',
  'borderInline',
];

const VALID_IMPORTS = ['stylex', '@stylexjs/stylex'];

// `valid-styles` 0.19 calls `context.getScope()`, gone in ESLint 9, so the run throws.
// A copy rather than a wrapper: the context is frozen.
const withGetScope = (rule: Rule.RuleModule): Rule.RuleModule => {
  const scopedRule: Rule.RuleModule = {
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

  return scopedRule;
};

const { 'valid-shorthands': validShorthands, 'valid-styles': validStyles } = stylexPlugin.rules;

// Once, not per call: ESLint refuses two different objects under one plugin name.
const plugin: ESLint.Plugin = {
  ...stylexPlugin,
  rules: {
    ...stylexPlugin.rules,
    'valid-styles': withGetScope(validStyles),
    // Published as `type: 'error'`, none of ESLint's three, so no `--fix-type` applies its fix.
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
  const shorthandLimits = DROPPED_SHORTHANDS
    .map((prop) => {
      const limit: [string, PropLimit] = [prop, {
        limit: null,
        reason: 'StyleX drops this shorthand with no error. Use the longhands.',
      }];

      return limit;
    });
  const propLimits = Object.fromEntries(shorthandLimits);

  const layer: Layer = [{
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
        propLimits,
      }],
      '@stylexjs/valid-shorthands': 'error',
      '@stylexjs/no-unused': 'error',
      '@stylexjs/no-conflicting-props': 'error',
      '@stylexjs/no-legacy-contextual-styles': 'error',
      '@stylexjs/enforce-extension': 'error',
    },
  }];

  return layer;
};

export default stylex;
