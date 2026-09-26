import type { Styling } from '@answers';
import type { PluginSpec } from '@targets';

/**
 * The Vite plugin a styling answer runs through, which every config that owns a `plugins` list spells the same way.
 *
 * StyleX goes through the raw factory in `unplugin`, not `@stylexjs/unplugin/vite`: every pre-built factory that
 * package ships is typed `=> any`, so the shorter import puts an `any` in `plugins` and the project fails its own
 * lint; `unpluginFactory` is the one export it types properly. `useCSSLayers` is its documented default for new
 * projects and is what keeps the generated atomic rules from outranking a hand-written one by specificity alone.
 */
export const stylingPlugin = (styling: Styling | undefined): PluginSpec => {
  if (styling === 'tailwind') {
    return {
      imports: ["import tailwindcss from '@tailwindcss/vite';"],
      calls: ['tailwindcss()'],
    };
  }

  if (styling === 'stylex') {
    return {
      imports: [
        "import { unpluginFactory as stylex } from '@stylexjs/unplugin';",
        "import { createUnplugin } from 'unplugin';",
      ],
      calls: ['createUnplugin(stylex).vite({ useCSSLayers: true })'],
    };
  }

  return {
    imports: [],
    calls: [],
  };
};
