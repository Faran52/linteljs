/**
 * `eslint-plugin-solid` ships rule types built against ESLint 8's `Rule.RuleModule`, whose
 * `create` signature no longer matches the one ESLint 10 declares. Nothing about the plugin's
 * runtime is wrong (its presets load and its rules report), but its published types make
 * `configs['flat/typescript']` unassignable to `Linter.Config`, and the fix is not ours to
 * make upstream.
 *
 * Declared here in ESLint's own terms instead. Delete this file once the plugin republishes
 * against ESLint 9 or newer.
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
