import type { Styling } from '@config/types';
import type { PluginSpec } from '@targets';

// A styling plugin, with the statements that sit between a config's imports and its `export default`.
export interface StylingPlugin extends PluginSpec {
  declarations: string[];
}

const STYLEX_CALL = 'stylex({ useCSSLayers: true })';

/**
 * The Vite plugin a styling answer runs through, which every config that owns a `plugins` list spells the same way.
 *
 * StyleX goes through `@stylexjs/unplugin/vite`, the package's own Vite adapter: it adds the Vite-only hooks,
 * `generateBundle` among them, which is what writes the atomic rules into the built stylesheet. The generic
 * `createUnplugin(unpluginFactory).vite` has none of them, so a production build shipped class names with no CSS.
 * The adapter is typed `=> any`, which puts an `any` in `plugins` and fails the project's own lint, so a TypeScript
 * config gives it the type unplugin gives every Vite adapter; a JavaScript one is not type-linted and takes it bare.
 * `useCSSLayers` is its documented default for new projects and is what keeps the generated atomic rules from
 * outranking a hand-written one by specificity alone.
 */
export const stylingPlugin = (styling: Styling | undefined, language: 'ts' | 'js' = 'ts'): StylingPlugin => {
  if (styling === 'tailwind') {
    return {
      imports: ["import tailwindcss from '@tailwindcss/vite';"],
      declarations: [],
      calls: ['tailwindcss()'],
    };
  }

  if (styling === 'stylex' && language === 'js') {
    return {
      imports: ["import stylex from '@stylexjs/unplugin/vite';"],
      declarations: [],
      calls: [STYLEX_CALL],
    };
  }

  if (styling === 'stylex') {
    return {
      imports: [
        "import { type UserOptions } from '@stylexjs/unplugin';",
        "import stylexVite from '@stylexjs/unplugin/vite';",
        "import { type VitePlugin } from 'unplugin';",
      ],
      declarations: ['const stylex: (options: Partial<UserOptions>) => VitePlugin = stylexVite;'],
      calls: [STYLEX_CALL],
    };
  }

  return {
    imports: [],
    declarations: [],
    calls: [],
  };
};
