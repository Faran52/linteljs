import { base } from '../layers/base/baseLayer';
import { typescript } from '../layers/typescript/typescriptLayer';

import {
  FRAMEWORK_KEYS,
  IMPLIED_BY,
  LAYER_KEYS,
} from './constants';
import {
  FRAMEWORKS,
  LAYERS,
  withPeer,
} from './utils/loaderUtils';

import type { Linter } from 'eslint';
import type {
  Layer,
  LinteljsOptions,
  Rules,
} from '../types';

// Layer order is fixed here: `vue()`/`svelte()` nest typescript-eslint under their own parser and must follow it.
export const linteljs = async (options: LinteljsOptions = {}, ...configs: Linter.Config<Rules>[]): Promise<Layer> => {
  const frameworkKeys = FRAMEWORK_KEYS
    .filter((key) => {
      const implied = IMPLIED_BY[key]
        .some((by) => {
          return options[by] === true;
        });

      return options[key] === true && !implied;
    });
  const layerKeys = LAYER_KEYS
    .filter((key) => {
      const value = options[key];

      return value !== undefined && value !== false;
    });

  const frameworks = await Promise.all(frameworkKeys
    .map((key) => {
      return withPeer(key, FRAMEWORKS[key]);
    }));
  const layers = await Promise.all(layerKeys
    .map((key) => {
      return withPeer(key, () => {
        return LAYERS[key](options);
      });
    }));

  const {
    root,
    gitignore,
    ignores,
    naming,
    folderNaming,
    resolver,
    astro,
  } = options;
  const frameworkGroup = frameworks
    .flatMap(({ group }) => {
      return group;
    });

  const config: Layer = [
    ...base({
      root,
      gitignore,
      ignores,
      naming,
      folderNaming,
      resolver,
      astro,
      frameworkGroup,
    }),
    ...(options.typescript === false ? [] : typescript(options)),
    ...frameworks
      .flatMap(({ layer }) => {
        return layer;
      }),
    ...layers.flat(),
    ...configs,
  ];

  return config;
};
