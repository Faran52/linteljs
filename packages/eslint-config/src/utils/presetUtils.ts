import type { ESLint, Linter } from 'eslint';

type PluginConfigs = NonNullable<ESLint.Plugin['configs']>;

type PluginConfig = PluginConfigs[string];

// `unknown` is the type-level wildcard here, which is why `type-standards.md` exempts this file.
interface RuleBearing {
  rules?: unknown;
}

type SingleConfig = Extract<PluginConfig, RuleBearing>;

// eslintrc carries `plugins` as an array.
const isFlatConfig = (config: SingleConfig): config is Linter.Config => {
  return !Array.isArray(config.plugins);
};

const scopedTo = (configs: Linter.Config[], files?: string[]): Linter.Config[] => {
  if (!files) {
    return configs;
  }

  return configs
    .map((config) => {
      return {
        ...config,
        files: config.files ?? files,
      };
    });
};

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
