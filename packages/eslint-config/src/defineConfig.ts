import { base } from './base';
import { typescript } from './typescript';

import type {
  DefineConfigOptions,
  Framework,
  Layer,
  LibraryLayer,
} from './types';

/**
 * Composer: fixes the layer order (base, typescript, framework, libraries, vitest, html) so vue()/svelte(),
 * which nest typescript-eslint under their own top-level parser, keep it. Also reads the `simple-import-sort`
 * bucket off the framework layer already loaded, rather than a caller threading it back down.
 */

interface FrameworkParts {
  layer: Layer;
  group: string[];
}

// What a library layer may read off the caller's options. An object rather than a positional, so the day a second
// layer needs something the signature gains a key instead of an argument every entry has to accept.
interface LibraryOptions {
  tailwindEntryPoint?: string;
}

// Loaded on demand: each plugin here is an optional peer, so importing all six statically breaks most projects.
const FRAMEWORKS: Record<Framework, () => Promise<FrameworkParts>> = {
  react: async () => {
    const { react, reactGroup } = await import('./frameworks/react');

    return {
      layer: react(),
      group: reactGroup,
    };
  },

  // Next is the one framework that stacks rather than replaces, so this record holds layer lists, not one each.
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

// Async because the layers above load on demand; a config file may await it or hand ESLint the promise.
export const defineConfig = async (options: DefineConfigOptions = {}): Promise<Layer> => {
  const {
    framework,
    typescript: withTypescript,
    vitest: withVitest,
    html: withHtml,
    astro: withAstro,
    libraries = [],
    // Destructured so it does not reach `base()`, which takes no such option.
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
    // Last, so its parser owns `.astro` after `typescript()` has claimed the script extensions.
    ...astroRules,
  ];
};

export default defineConfig;
