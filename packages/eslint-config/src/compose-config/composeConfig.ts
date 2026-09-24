import { base } from '../layers/base/baseLayer';
import { typescript } from '../layers/typescript/typescriptLayer';

import { FRAMEWORKS, LIBRARIES } from './utils/loaderUtils';

import type { ComposeConfigOptions, Layer } from '../types';
import type { FrameworkParts } from './utils/loaderUtils';

const loadVitest = async (): Promise<Layer> => {
  const { vitest } = await import('../layers/vitest/vitestLayer');

  return vitest();
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
    html: withHtml,
    astro: withAstro,
    libraries = [],
    tailwindEntryPoint,
    ...baseOptions
  } = options;

  let parts: FrameworkParts | undefined;
  let vitestRules: Layer = [];
  let htmlRules: Layer = [];
  let astroRules: Layer = [];

  if (framework !== undefined) {
    parts = await FRAMEWORKS[framework]();
  }

  const libraryLayers = await Promise.all(libraries.map(async (library) => {
    return LIBRARIES[library]({ tailwindEntryPoint });
  }));

  if (withVitest === true) {
    vitestRules = await loadVitest();
  }

  if (withHtml === true) {
    htmlRules = await loadHtml();
  }

  if (withAstro === true) {
    astroRules = await loadAstro();
  }

  return [
    ...base(parts === undefined
      ? baseOptions
      : {
          ...baseOptions,
          frameworkGroup: parts.group,
        }),
    ...(withTypescript === true ? typescript() : []),
    ...(parts === undefined ? [] : parts.layer),
    ...libraryLayers.flat(),
    ...vitestRules,
    ...htmlRules,
    ...astroRules,
  ];
};

export default composeConfig;
