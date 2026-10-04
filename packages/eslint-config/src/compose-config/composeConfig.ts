import { base } from '../layers/base/baseLayer';
import { typescript } from '../layers/typescript/typescriptLayer';

import { FRAMEWORKS, LIBRARIES } from './utils/loaderUtils';

import type { ComposeConfigOptions, Layer } from '../types';

const loadVitest = async (): Promise<Layer> => {
  const { vitest } = await import('../layers/vitest/vitestLayer');

  return vitest();
};

const loadJest = async (): Promise<Layer> => {
  const { jest } = await import('../layers/jest/jestLayer');

  return jest();
};

const loadHtml = async (): Promise<Layer> => {
  const { html } = await import('../layers/html/htmlLayer');

  return html();
};

const loadAstro = async (): Promise<Layer> => {
  const { astro } = await import('../frameworks/astro/astroFramework');

  return astro();
};

// Layer order is fixed here: `vue()`/`svelte()` nest typescript-eslint under their own parser and must follow it.
export const composeConfig = async (options: ComposeConfigOptions = {}): Promise<Layer> => {
  const {
    framework,
    typescript: withTypescript,
    vitest: withVitest,
    jest: withJest,
    html: withHtml,
    libraries = [],
    tailwindEntryPoint,
    ...baseOptions
  } = options;

  const parts = framework === undefined ? undefined : await FRAMEWORKS[framework]();
  const loading = libraries
    .map(async (library) => {
      return LIBRARIES[library]({ tailwindEntryPoint });
    });

  const libraryLayers = await Promise.all(loading);
  const vitestRules = withVitest === true ? await loadVitest() : [];
  const jestRules = withJest === true ? await loadJest() : [];
  const htmlRules = withHtml === true ? await loadHtml() : [];
  // `astro` also stays in `baseOptions`, which widens `base()` to `.astro`.
  const astroRules = baseOptions.astro === true ? await loadAstro() : [];

  const baseLayerOptions = parts === undefined
    ? baseOptions
    : {
        ...baseOptions,
        frameworkGroup: parts.group,
      };

  const configs: Layer = [
    ...base(baseLayerOptions),
    ...(withTypescript === true ? typescript(options) : []),
    ...(parts === undefined ? [] : parts.layer),
    ...libraryLayers.flat(),
    ...vitestRules,
    ...jestRules,
    ...htmlRules,
    ...astroRules,
  ];

  return configs;
};
