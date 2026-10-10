import { base } from '../layers/base/baseLayer';
import { typescript } from '../layers/typescript/typescriptLayer';

import { LAYER_OPTIONS } from './constants';
import {
  FRAMEWORKS,
  LAYERS,
  withPeer,
} from './utils/loaderUtils';
import { checkOptions } from './utils/optionUtils';

import type { Linter } from 'eslint';
import type {
  Layer,
  LinteljsOptions,
  Rules,
  UiFramework,
} from '../types';

const uiFrameworksOf = (options: LinteljsOptions): [string, UiFramework][] => {
  const { framework, islands } = options;
  const named: [string, UiFramework][] = [];

  if (framework !== undefined && framework !== 'astro' && framework !== 'wxt') {
    named.push([`framework: ${JSON.stringify(framework)}`, framework]);
  }

  if (islands !== undefined) {
    for (const island of islands) {
      named.push([`islands: ${JSON.stringify(island)}`, island]);
    }
  }

  return named;
};

// Layer order is fixed here: `vue()`/`svelte()` nest typescript-eslint under their own parser and must follow it.
export const linteljs = async (options: LinteljsOptions = {}, ...configs: Linter.Config<Rules>[]): Promise<Layer> => {
  checkOptions(options);

  const frameworks = await Promise.all(uiFrameworksOf(options)
    .map(([label, key]) => {
      return withPeer(label, FRAMEWORKS[key]);
    }));
  const layers = await Promise.all(LAYER_OPTIONS
    .filter(([
      ,
      option,
      value,
    ]) => {
      return options[option] === value;
    })
    .map(([
      key,
      option,
      value,
    ]) => {
      return withPeer(`${option}: ${JSON.stringify(value)}`, () => {
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
      astro: options.framework === 'astro',
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
