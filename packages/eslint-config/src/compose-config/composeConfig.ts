import { base } from '../layers/base/baseLayer';
import { typescript } from '../layers/typescript/typescriptLayer';

import {
  E2E,
  FRAMEWORKS,
  LIBRARIES,
  STORIES,
  TESTING,
} from './utils/loaderUtils';

import type { ComposeConfigOptions, Layer } from '../types';

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
    testing,
    e2e,
    stories,
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
  const testingRules = testing === undefined ? [] : await TESTING[testing]();
  const e2eRules = e2e === undefined ? [] : await E2E[e2e]();
  const storiesRules = stories === undefined ? [] : await STORIES[stories]();
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
    ...testingRules,
    ...e2eRules,
    ...storiesRules,
    ...htmlRules,
    ...astroRules,
  ];

  return configs;
};
