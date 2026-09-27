import { base } from '../layers/base/baseLayer';
import { typescript } from '../layers/typescript/typescriptLayer';

import { FRAMEWORKS, LIBRARIES } from './utils/loaderUtils';

import type { ComposeConfigOptions, Layer } from '../types';

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

  const parts = framework === undefined ? undefined : await FRAMEWORKS[framework]();
  const loading = libraries
    .map(async (library) => {
      return LIBRARIES[library]({ tailwindEntryPoint });
    });

  const libraryLayers = await Promise.all(loading);
  const vitestRules = withVitest === true ? await loadVitest() : [];
  const htmlRules = withHtml === true ? await loadHtml() : [];
  const astroRules = withAstro === true ? await loadAstro() : [];

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
