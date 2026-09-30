import { base } from '../layers/base/baseLayer';
import { typescript } from '../layers/typescript/typescriptLayer';

import { FRAMEWORKS, LIBRARIES } from './utils/loaderUtils';

import type { ComposeConfigOptions, Layer } from '../types';

// Layer order is fixed here: `vue()`/`svelte()` nest typescript-eslint under their own parser and must follow it.
export const composeConfig = async (options: ComposeConfigOptions = {}): Promise<Layer> => {
  const {
    framework,
    typescript: withTypescript,
    vitest: withVitest,
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
  const vitestRules = withVitest === true ? (await import('../layers/vitest/vitestLayer')).vitest() : [];
  const htmlRules = withHtml === true ? (await import('../layers/html/htmlLayer')).html() : [];
  // `astro` also stays in `baseOptions`, which widens `base()` to `.astro`.
  const astroRules = baseOptions.astro === true ? (await import('../frameworks/astro/astroFramework')).astro() : [];

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
