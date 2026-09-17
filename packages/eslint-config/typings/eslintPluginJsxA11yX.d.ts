/**
 * `eslint-plugin-jsx-a11y-x` ships a `lib/index.d.ts` whose `configs` is typed as one frozen literal, so a layer
 * reading `configs.recommended` gets that literal rather than a `Linter.Config`. Declared in ESLint's own terms
 * instead, with the one preset the layers read.
 *
 * Delete this file once the plugin's own declarations describe a flat config.
 */
declare module 'eslint-plugin-jsx-a11y-x' {
  import type { ESLint, Linter } from 'eslint';

  interface JsxA11yPlugin extends ESLint.Plugin {
    configs: {
      recommended: Linter.Config;
      strict: Linter.Config;
    };
  }

  const plugin: JsxA11yPlugin;

  export default plugin;
}
