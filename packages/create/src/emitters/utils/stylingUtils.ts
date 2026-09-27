import type { Styling } from '@config/types';
import type { PluginSpec } from '@targets';

export interface StylingPlugin extends PluginSpec {
  declarations: string[];
}

const STYLEX_CALL = 'stylex({ useCSSLayers: true })';

// `@stylexjs/unplugin/vite`: the generic adapter lacks `generateBundle`, so a build shipped class names with no CSS.
// Typed `=> any`, so a TypeScript config gives it unplugin's Vite adapter type.
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
