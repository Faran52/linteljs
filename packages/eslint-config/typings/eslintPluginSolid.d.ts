/**
 * `eslint-plugin-solid` types its rules against ESLint 8's `Rule.RuleModule`, whose `create`
 * signature differs from ESLint 10's, so `configs['flat/typescript']` is unassignable to
 * `Linter.Config` though the plugin runs fine. Declared here in ESLint's own terms.
 *
 * Delete this file once the plugin publishes types against ESLint 9 or newer.
 */
declare module 'eslint-plugin-solid' {
  import type { ESLint, Linter } from 'eslint';

  interface SolidConfigs {
    'recommended': Linter.Config;
    'typescript': Linter.Config;
    'flat/recommended': Linter.Config;
    'flat/typescript': Linter.Config;
  }

  interface SolidPlugin extends ESLint.Plugin {
    configs: SolidConfigs;
  }

  const plugin: SolidPlugin;

  export default plugin;
}
