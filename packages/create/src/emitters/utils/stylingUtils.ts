import type { Styling } from '@config/types';

export interface StylingPlugin {
  imports: string[];
  declarations: string[];
  call?: string;
}

const STYLEX_CALL = "stylex({ aliases: stylexAliases, useCSSLayers: { before: ['reset'] } })";

// The path expression a config resolves `src/styles/*` with; Nuxt's passes its own `join`.
const STYLES_DIR = '`${import.meta.dirname}/src/styles/*`';

// StyleX reads no tsconfig paths, so it reaches `@styles/tokens.stylex` only through an absolute alias.
const stylexAliases = (stylesDir: string): string => {
  return `const stylexAliases = { '@styles/*': [${stylesDir}] };`;
};

// `@stylexjs/unplugin/vite`: the generic adapter lacks `generateBundle` and emits no CSS.
// Typed `=> any`, so a TypeScript config gives it unplugin's Vite adapter type.
export const stylingPlugin = (
  styling: Styling | undefined,
  typed = true,
  stylesDir = STYLES_DIR,
): StylingPlugin => {
  if (styling === 'tailwind') {
    return {
      imports: ["import tailwindcss from '@tailwindcss/vite';"],
      declarations: [],
      call: 'tailwindcss()',
    };
  }

  if (styling === 'stylex' && typed) {
    return {
      imports: [
        "import { type UserOptions } from '@stylexjs/unplugin';",
        "import stylexVite from '@stylexjs/unplugin/vite';",
        "import { type VitePlugin } from 'unplugin';",
      ],
      declarations: [
        'const stylex: (options: Partial<UserOptions>) => VitePlugin = stylexVite;',
        stylexAliases(stylesDir),
      ],
      call: STYLEX_CALL,
    };
  }

  if (styling === 'stylex') {
    return {
      imports: ["import stylex from '@stylexjs/unplugin/vite';"],
      declarations: [stylexAliases(stylesDir)],
      call: STYLEX_CALL,
    };
  }

  return {
    imports: [],
    declarations: [],
  };
};
