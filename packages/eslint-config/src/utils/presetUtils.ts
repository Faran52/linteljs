import type { ESLint, Linter } from 'eslint';

type PluginConfigs = NonNullable<ESLint.Plugin['configs']>;

type PluginConfig = PluginConfigs[string];

type SingleConfig = Extract<PluginConfig, { rules?: unknown }>;

// eslintrc carries `plugins` as an array, so flatness is checked at runtime, not asserted.
const isFlatConfig = (config: SingleConfig): config is Linter.Config => {
  return !Array.isArray(config.plugins);
};

const scopedTo = (configs: Linter.Config[], files?: string[]): Linter.Config[] => {
  if (!files) {
    return configs;
  }

  return configs.map((config) => {
    return {
      ...config,
      files: config.files ?? files,
    };
  });
};

// A preset read off a plugin, normalised to a flat-config array since `Plugin.configs` holds three shapes at once.
// `files` fills any entry with no glob of its own: vue scopes its parser block but not its rules, solid nothing.
export const presetOf = (config: PluginConfig | undefined, label: string, files?: string[]): Linter.Config[] => {
  if (!config) {
    throw new Error(`@linteljs/eslint-config: ${label} is not published by its plugin`);
  }

  if (Array.isArray(config)) {
    return scopedTo(config, files);
  }

  if (!isFlatConfig(config)) {
    throw new Error(`@linteljs/eslint-config: ${label} is an eslintrc config, not a flat one`);
  }

  return scopedTo([config], files);
};
