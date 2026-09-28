import type { Styling } from '@config/types';

export interface StylingPlugin {
  imports: string[];
  declaration?: string;
  call?: string;
}

const STYLEX_CALL = 'stylex({ useCSSLayers: true })';

// `@stylexjs/unplugin/vite`: the generic adapter lacks `generateBundle` and emits no CSS.
// Typed `=> any`, so a TypeScript config gives it unplugin's Vite adapter type.
export const stylingPlugin = (styling: Styling | undefined, language: 'ts' | 'js' = 'ts'): StylingPlugin => {
  if (styling === 'tailwind') {
    return {
      imports: ["import tailwindcss from '@tailwindcss/vite';"],
      call: 'tailwindcss()',
    };
  }

  if (styling === 'stylex' && language === 'ts') {
    return {
      imports: [
        "import { type UserOptions } from '@stylexjs/unplugin';",
        "import stylexVite from '@stylexjs/unplugin/vite';",
        "import { type VitePlugin } from 'unplugin';",
      ],
      declaration: 'const stylex: (options: Partial<UserOptions>) => VitePlugin = stylexVite;',
      call: STYLEX_CALL,
    };
  }

  if (styling === 'stylex') {
    return {
      imports: ["import stylex from '@stylexjs/unplugin/vite';"],
      call: STYLEX_CALL,
    };
  }

  return { imports: [] };
};
