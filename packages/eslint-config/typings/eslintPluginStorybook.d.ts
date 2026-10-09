/**
 * `eslint-plugin-storybook` types its rules against `@typescript-eslint/utils`' legacy `RuleContext`, which
 * ESLint 10's `Rule.RuleModule` no longer satisfies, so `configs['flat/recommended']` is unassignable to
 * `Linter.Config[]` though the plugin runs fine. Declared here in ESLint's own terms.
 *
 * Delete this file once the plugin publishes types against ESLint 10.
 */
declare module 'eslint-plugin-storybook' {
  import type { ESLint, Linter } from 'eslint';

  interface StorybookConfigs {
    'flat/recommended': Linter.Config[];
  }

  interface StorybookPlugin extends ESLint.Plugin {
    configs: StorybookConfigs;
  }

  const plugin: StorybookPlugin;

  export default plugin;
}
