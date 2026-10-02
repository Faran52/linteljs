import { vi } from 'vitest';

import type { Layer } from '../src/types';

interface PluginModule<P> {
  default: P;
}

interface ConfigBearing {
  configs: object;
}

// `load` imports the layer afresh so it sees the rewritten default export.
export const layerWithout = async <P>(
  specifier: string,
  strip: (plugin: P) => P,
  load: () => Promise<() => Layer>,
): Promise<() => Layer> => {
  vi.resetModules();

  vi.doMock(specifier, async (importOriginal) => {
    const original = await importOriginal<PluginModule<P>>();

    const stripped = {
      ...original,
      default: strip(original.default),
    };

    return stripped;
  });

  try {
    return await load();
  }
  finally {
    vi.doUnmock(specifier);
    vi.resetModules();
  }
};

export const layerWithoutConfig = (
  specifier: string,
  key: string,
  load: () => Promise<() => Layer>,
): Promise<() => Layer> => {
  return layerWithout(specifier, (plugin: ConfigBearing) => {
    const withoutConfig = {
      ...plugin,
      configs: {
        ...plugin.configs,
        [key]: undefined,
      },
    };

    return withoutConfig;
  }, load);
};
