import process from 'node:process';

import {
  INSTALL_COMMANDS,
  MISSING_PACKAGE,
  NPM_INSTALL,
} from '../constants';

import type {
  FrameworkKey,
  Layer,
  LayerKey,
  LinteljsOptions,
} from '../../types';

export interface FrameworkParts {
  layer: Layer;
  group: string[];
}

// Loaded on demand: each plugin is an optional peer.
export const FRAMEWORKS: Record<FrameworkKey, () => Promise<FrameworkParts>> = {
  react: async () => {
    const { react, reactGroup } = await import('../../frameworks/react/reactFramework');

    const parts: FrameworkParts = {
      layer: react(),
      group: reactGroup,
    };

    return parts;
  },

  next: async () => {
    const { react } = await import('../../frameworks/react/reactFramework');
    const { next, nextGroup } = await import('../../frameworks/next/nextFramework');

    const parts: FrameworkParts = {
      layer: [...react(), ...next()],
      group: nextGroup,
    };

    return parts;
  },

  // `reactNative()` carries React's own rules, less the DOM accessibility preset.
  expo: async () => {
    const { reactNative, reactNativeGroup } = await import('../../frameworks/react-native/reactNativeFramework');

    const parts: FrameworkParts = {
      layer: reactNative(),
      group: reactNativeGroup,
    };

    return parts;
  },

  vue: async () => {
    const { vue, vueGroup } = await import('../../frameworks/vue/vueFramework');

    const parts: FrameworkParts = {
      layer: vue(),
      group: vueGroup,
    };

    return parts;
  },

  nuxt: async () => {
    const { vue } = await import('../../frameworks/vue/vueFramework');
    const { nuxt, nuxtGroup } = await import('../../frameworks/nuxt/nuxtFramework');

    const parts: FrameworkParts = {
      layer: [...vue(), ...nuxt()],
      group: nuxtGroup,
    };

    return parts;
  },

  svelte: async () => {
    const { svelte, svelteGroup } = await import('../../frameworks/svelte/svelteFramework');

    const parts: FrameworkParts = {
      layer: svelte(),
      group: svelteGroup,
    };

    return parts;
  },

  sveltekit: async () => {
    const { svelte, svelteGroup } = await import('../../frameworks/svelte/svelteFramework');

    const parts: FrameworkParts = {
      layer: svelte(),
      group: svelteGroup,
    };

    return parts;
  },

  solid: async () => {
    const { solid, solidGroup } = await import('../../frameworks/solid/solidFramework');

    const parts: FrameworkParts = {
      layer: solid(),
      group: solidGroup,
    };

    return parts;
  },

  angular: async () => {
    const { angular, angularGroup } = await import('../../frameworks/angular/angularFramework');

    const parts: FrameworkParts = {
      layer: angular(),
      group: angularGroup,
    };

    return parts;
  },
};

export const LAYERS: Record<LayerKey, (options: LinteljsOptions) => Promise<Layer>> = {
  tanstackQuery: async () => {
    const { tanstackQuery } = await import('../../libraries/tanstack-query/tanstackQueryLibrary');

    return tanstackQuery();
  },
  tanstackRouter: async () => {
    const { tanstackRouter } = await import('../../libraries/tanstack-router/tanstackRouterLibrary');

    return tanstackRouter();
  },
  tailwind: async (options) => {
    const { tailwind } = await import('../../libraries/tailwind/tailwindLibrary');
    const { tailwind: value } = options;

    return tailwind(typeof value === 'object' ? value.entryPoint : undefined);
  },
  stylex: async () => {
    const { stylex } = await import('../../libraries/stylex/stylexLibrary');

    return stylex();
  },
  vitest: async () => {
    const { vitest } = await import('../../layers/vitest/vitestLayer');

    return vitest();
  },
  jest: async () => {
    const { jest } = await import('../../layers/jest/jestLayer');

    return jest();
  },
  playwright: async () => {
    const { playwright } = await import('../../layers/playwright/playwrightLayer');

    return playwright();
  },
  storybook: async () => {
    const { storybook } = await import('../../layers/storybook/storybookLayer');

    return storybook();
  },
  html: async () => {
    const { html } = await import('../../layers/html/htmlLayer');

    return html();
  },
  astro: async () => {
    const { astro } = await import('../../frameworks/astro/astroFramework');

    return astro();
  },
};

const installCommand = (): string => {
  const agent = process.env['npm_config_user_agent'];
  const match = Object.entries(INSTALL_COMMANDS)
    .find(([manager]) => {
      return agent?.startsWith(`${manager}/`) === true;
    });

  return match === undefined ? NPM_INSTALL : match[1];
};

// Names the key and the command that installs its peer, where Node would only name the package it could not find.
export const withPeer = async <T>(key: string, load: () => Promise<T>): Promise<T> => {
  try {
    return await load();
  }
  catch (error) {
    const missing = MISSING_PACKAGE.exec(String(error));
    const peer = missing?.[1];

    if (peer === undefined) {
      throw error;
    }

    const message = `@linteljs/eslint-config: ${key} needs ${peer}. Install it with: ${installCommand()} ${peer}`;

    throw new Error(message, { cause: error });
  }
};
