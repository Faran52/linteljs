/**
 * `eslint-plugin-jsx-a11y-x` types `configs` as one frozen literal rather than a `Linter.Config`. Declared in
 * ESLint's own terms, with the one preset the layers read.
 *
 * Delete this file once the plugin's own declarations describe a flat config.
 */
declare module 'eslint-plugin-jsx-a11y-x' {
  import type { ESLint, Linter } from 'eslint';

  interface JsxA11yConfigs {
    recommended: Linter.Config;
    strict: Linter.Config;
  }

  interface JsxA11yPlugin extends ESLint.Plugin {
    configs: JsxA11yConfigs;
  }

  const plugin: JsxA11yPlugin;

  export default plugin;
}
