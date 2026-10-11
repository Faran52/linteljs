import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

import {
  ERROR_PREFIX,
  EXPO_LAYER,
  INSTALL_COMMANDS,
  LOCKFILES,
  MISSING_PACKAGE,
  NPM_INSTALL,
  WXT_LAYER,
} from '../constants';

import type {
  Layer,
  LayerKey,
  LinteljsOptions,
  UiFramework,
} from '../../types';

export interface FrameworkParts {
  layer: Layer;
  group: string[];
}

const svelteParts = async (): Promise<FrameworkParts> => {
  const { svelte, svelteGroup } = await import('../../frameworks/svelte/svelteFramework');

  const parts: FrameworkParts = {
    layer: svelte(),
    group: svelteGroup,
  };

  return parts;
};

const angularParts = async (): Promise<FrameworkParts> => {
  const { angular, angularGroup } = await import('../../frameworks/angular/angularFramework');

  const parts: FrameworkParts = {
    layer: angular(),
    group: angularGroup,
  };

  return parts;
};

// Loaded on demand: each plugin is an optional peer.
export const FRAMEWORKS: Record<UiFramework, () => Promise<FrameworkParts>> = {
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
      layer: [...reactNative(), ...EXPO_LAYER],
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

  svelte: svelteParts,

  sveltekit: svelteParts,

  solid: async () => {
    const { solid, solidGroup } = await import('../../frameworks/solid/solidFramework');

    const parts: FrameworkParts = {
      layer: solid(),
      group: solidGroup,
    };

    return parts;
  },

  angular: angularParts,

  analog: angularParts,
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

    return tailwind(options.tailwind?.entryPoint);
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
  wxt: () => {
    return Promise.resolve(WXT_LAYER);
  },
};

// Sync, as `base` reads root: this runs once, on the way to a thrown error.
const declaredManager = (root: string): string | undefined => {
  const path = join(root, 'package.json');

  if (!existsSync(path)) {
    return undefined;
  }

  const text = readFileSync(path, 'utf8');
  const manifest: unknown = JSON.parse(text);

  if (typeof manifest !== 'object' || manifest === null || !('packageManager' in manifest)) {
    return undefined;
  }

  const { packageManager } = manifest;

  return typeof packageManager === 'string' ? packageManager.split('@')[0] : undefined;
};

const lockedManager = (root: string): string | undefined => {
  const lockfile = LOCKFILES
    .find(([file]) => {
      const path = join(root, file);

      return existsSync(path);
    });

  return lockfile?.[1];
};

// `packageManager` in root, then a lockfile in root, then whatever ran ESLint, then npm. Never the working directory.
const installCommand = (root: string | undefined): string => {
  const agent = process.env['npm_config_user_agent']?.split('/')[0];
  const managers = root === undefined
    ? [agent]
    : [
        declaredManager(root),
        lockedManager(root),
        agent,
      ];
  const command = managers
    .map((manager) => {
      return manager === undefined ? undefined : INSTALL_COMMANDS[manager];
    })
    .find((known) => {
      return known !== undefined;
    });

  return command ?? NPM_INSTALL;
};

// Names the option and the command that installs its peer, where Node would only name the package it could not find.
export const withPeer = async <T>(option: string, load: () => Promise<T>, root?: string): Promise<T> => {
  try {
    return await load();
  }
  catch (error) {
    const missing = MISSING_PACKAGE.exec(String(error));
    const peer = missing?.[1];

    if (peer === undefined) {
      throw error;
    }

    const command = installCommand(root);
    const message = `${ERROR_PREFIX} ${option} needs ${peer}. Install it with: ${command} ${peer}`;

    throw new Error(message, { cause: error });
  }
};
