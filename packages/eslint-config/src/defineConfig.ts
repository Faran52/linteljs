import { base } from './base';
import { typescript } from './typescript';

import type {
  DefineConfigOptions,
  Framework,
  Layer,
  LibraryLayer,
} from './types';

interface FrameworkParts {
  layer: Layer;
  group: string[];
}

interface LibraryOptions {
  tailwindEntryPoint?: string;
}

// Loaded on demand: each plugin is an optional peer.
const FRAMEWORKS: Record<Framework, () => Promise<FrameworkParts>> = {
  react: async () => {
    const { react, reactGroup } = await import('./frameworks/react');

    return {
      layer: react(),
      group: reactGroup,
    };
  },

  next: async () => {
    const { react } = await import('./frameworks/react');
    const { next, nextGroup } = await import('./frameworks/next');

    return {
      layer: [...react(), ...next()],
      group: nextGroup,
    };
  },

  vue: async () => {
    const { vue, vueGroup } = await import('./frameworks/vue');

    return {
      layer: vue(),
      group: vueGroup,
    };
  },

  svelte: async () => {
    const { svelte, svelteGroup } = await import('./frameworks/svelte');

    return {
      layer: svelte(),
      group: svelteGroup,
    };
  },

  solid: async () => {
    const { solid, solidGroup } = await import('./frameworks/solid');

    return {
      layer: solid(),
      group: solidGroup,
    };
  },

  angular: async () => {
    const { angular, angularGroup } = await import('./frameworks/angular');

    return {
      layer: angular(),
      group: angularGroup,
    };
  },
};

const LIBRARIES: Record<LibraryLayer, (options: LibraryOptions) => Promise<Layer>> = {
  'tanstack-query': async () => {
    const { tanstackQuery } = await import('./libraries/tanstackQuery');

    return tanstackQuery();
  },
  'tanstack-router': async () => {
    const { tanstackRouter } = await import('./libraries/tanstackRouter');

    return tanstackRouter();
  },
  'tailwind': async ({ tailwindEntryPoint }) => {
    const { tailwind } = await import('./libraries/tailwind');

    return tailwind(tailwindEntryPoint);
  },
};

const vitestLayer = async (): Promise<Layer> => {
  const { vitest } = await import('./vitest');

  return vitest();
};

const htmlLayer = async (): Promise<Layer> => {
  const { html } = await import('./html');

  return html();
};

const astroLayer = async (): Promise<Layer> => {
  const { astro } = await import('./astro');

  return astro();
};

// Layer order is fixed here: `vue()`/`svelte()` nest typescript-eslint under their own parser and must follow it.
export const defineConfig = async (options: DefineConfigOptions = {}): Promise<Layer> => {
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
    vitestRules = await vitestLayer();
  }

  if (withHtml === true) {
    htmlRules = await htmlLayer();
  }

  if (withAstro === true) {
    astroRules = await astroLayer();
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

export default defineConfig;
