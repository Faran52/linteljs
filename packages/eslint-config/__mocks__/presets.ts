import { vi } from 'vitest';

import type { Layer } from '../src/types';

interface PluginModule<P> {
  default: P;
}

interface ConfigBearing {
  configs: object;
}

// A layer built against a plugin release that no longer publishes a preset: `strip` rewrites the plugin's default
// export, and `load` imports the layer's module afresh so it sees the rewritten one.
export const layerWithout = async <P>(
  specifier: string,
  strip: (plugin: P) => P,
  load: () => Promise<() => Layer>,
): Promise<() => Layer> => {
  vi.resetModules();
  vi.doMock(specifier, async (importOriginal) => {
    const original = await importOriginal<PluginModule<P>>();

    return {
      ...original,
      default: strip(original.default),
    };
  });

  try {
    return await load();
  }
  finally {
    vi.doUnmock(specifier);
    vi.resetModules();
  }
};

// The plugin as a release that dropped `configs[key]` would ship it.
export const layerWithoutConfig = (
  specifier: string,
  key: string,
  load: () => Promise<() => Layer>,
): Promise<() => Layer> => {
  return layerWithout(specifier, (plugin: ConfigBearing) => {
    return {
      ...plugin,
      configs: {
        ...plugin.configs,
        [key]: undefined,
      },
    };
  }, load);
};
