import type {
  Framework,
  Layer,
  LibraryLayer,
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

    return {
      layer: react(),
      group: reactGroup,
    };
  },

  'next': async () => {
    const { react } = await import('../../frameworks/react/reactFramework');
    const { next, nextGroup } = await import('../../frameworks/next/nextFramework');

    return {
      layer: [...react(), ...next()],
      group: nextGroup,
    };
  },

  'react-native': async () => {
    const { reactNative, reactNativeGroup } = await import('../../frameworks/react-native/reactNativeFramework');

    return {
      layer: reactNative(),
      group: reactNativeGroup,
    };
  },

  'vue': async () => {
    const { vue, vueGroup } = await import('../../frameworks/vue/vueFramework');

    return {
      layer: vue(),
      group: vueGroup,
    };
  },

  'nuxt': async () => {
    const { vue } = await import('../../frameworks/vue/vueFramework');
    const { nuxt, nuxtGroup } = await import('../../frameworks/nuxt/nuxtFramework');

    return {
      layer: [...vue(), ...nuxt()],
      group: nuxtGroup,
    };
  },

  'svelte': async () => {
    const { svelte, svelteGroup } = await import('../../frameworks/svelte/svelteFramework');

    return {
      layer: svelte(),
      group: svelteGroup,
    };
  },

  'solid': async () => {
    const { solid, solidGroup } = await import('../../frameworks/solid/solidFramework');

    return {
      layer: solid(),
      group: solidGroup,
    };
  },

  'angular': async () => {
    const { angular, angularGroup } = await import('../../frameworks/angular/angularFramework');

    return {
      layer: angular(),
      group: angularGroup,
    };
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
