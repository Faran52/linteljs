import type {
  E2e,
  Framework,
  Layer,
  LibraryLayer,
  Stories,
  Testing,
} from '../../types';

export interface FrameworkParts {
  layer: Layer;
  group: string[];
}

interface LibraryOptions {
  tailwindEntryPoint?: string;
}

// Loaded on demand: each plugin is an optional peer.
export const FRAMEWORKS: Record<Framework, () => Promise<FrameworkParts>> = {
  'react': async () => {
    const { react, reactGroup } = await import('../../frameworks/react/reactFramework');

    const parts: FrameworkParts = {
      layer: react(),
      group: reactGroup,
    };

    return parts;
  },

  'next': async () => {
    const { react } = await import('../../frameworks/react/reactFramework');
    const { next, nextGroup } = await import('../../frameworks/next/nextFramework');

    const parts: FrameworkParts = {
      layer: [...react(), ...next()],
      group: nextGroup,
    };

    return parts;
  },

  'react-native': async () => {
    const { reactNative, reactNativeGroup } = await import('../../frameworks/react-native/reactNativeFramework');

    const parts: FrameworkParts = {
      layer: reactNative(),
      group: reactNativeGroup,
    };

    return parts;
  },

  'vue': async () => {
    const { vue, vueGroup } = await import('../../frameworks/vue/vueFramework');

    const parts: FrameworkParts = {
      layer: vue(),
      group: vueGroup,
    };

    return parts;
  },

  'nuxt': async () => {
    const { vue } = await import('../../frameworks/vue/vueFramework');
    const { nuxt, nuxtGroup } = await import('../../frameworks/nuxt/nuxtFramework');

    const parts: FrameworkParts = {
      layer: [...vue(), ...nuxt()],
      group: nuxtGroup,
    };

    return parts;
  },

  'svelte': async () => {
    const { svelte, svelteGroup } = await import('../../frameworks/svelte/svelteFramework');

    const parts: FrameworkParts = {
      layer: svelte(),
      group: svelteGroup,
    };

    return parts;
  },

  'solid': async () => {
    const { solid, solidGroup } = await import('../../frameworks/solid/solidFramework');

    const parts: FrameworkParts = {
      layer: solid(),
      group: solidGroup,
    };

    return parts;
  },

  'angular': async () => {
    const { angular, angularGroup } = await import('../../frameworks/angular/angularFramework');

    const parts: FrameworkParts = {
      layer: angular(),
      group: angularGroup,
    };

    return parts;
  },
};

export const LIBRARIES: Record<LibraryLayer, (options: LibraryOptions) => Promise<Layer>> = {
  'tanstack-query': async () => {
    const { tanstackQuery } = await import('../../libraries/tanstack-query/tanstackQueryLibrary');

    return tanstackQuery();
  },
  'tanstack-router': async () => {
    const { tanstackRouter } = await import('../../libraries/tanstack-router/tanstackRouterLibrary');

    return tanstackRouter();
  },
  'tailwind': async ({ tailwindEntryPoint }) => {
    const { tailwind } = await import('../../libraries/tailwind/tailwindLibrary');

    return tailwind(tailwindEntryPoint);
  },
  'stylex': async () => {
    const { stylex } = await import('../../libraries/stylex/stylexLibrary');

    return stylex();
  },
};

export const TESTING: Record<Testing, () => Promise<Layer>> = {
  vitest: async () => {
    const { vitest } = await import('../../layers/vitest/vitestLayer');

    return vitest();
  },
  jest: async () => {
    const { jest } = await import('../../layers/jest/jestLayer');

    return jest();
  },
};

// Names the option and the peer it needs, where Node would only name the package it could not find.
export const withPeer = async (option: string, peer: string, load: () => Promise<Layer>): Promise<Layer> => {
  try {
    return await load();
  }
  catch (error) {
    if (String(error).includes(peer)) {
      const message = `@linteljs/eslint-config: ${option} needs ${peer}; install it as a dev dependency`;

      throw new Error(message, { cause: error });
    }

    throw error;
  }
};

// Maestro flows are YAML, which ESLint does not read.
export const E2E: Record<E2e, () => Promise<Layer>> = {
  playwright: async () => {
    return withPeer("e2e: 'playwright'", 'eslint-plugin-playwright', async () => {
      const { playwright } = await import('../../layers/playwright/playwrightLayer');

      return playwright();
    });
  },
  maestro: () => {
    return Promise.resolve([]);
  },
};

export const STORIES: Record<Stories, () => Promise<Layer>> = {
  storybook: async () => {
    return withPeer("stories: 'storybook'", 'eslint-plugin-storybook', async () => {
      const { storybook } = await import('../../layers/storybook/storybookLayer');

      return storybook();
    });
  },
};
