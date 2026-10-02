import {
  describe,
  expect,
  it,
} from 'vitest';

import { stylingPlugin } from './stylingUtils';

const STYLEX_CALL = "stylex({ aliases: stylexAliases, useCSSLayers: { before: ['reset'] } })";

describe('stylingPlugin', () => {
  it('runs tailwind through its own vite plugin', () => {
    expect(stylingPlugin('tailwind')).toStrictEqual({
      imports: ["import tailwindcss from '@tailwindcss/vite';"],
      declarations: [],
      call: 'tailwindcss()',
    });
  });

  it('runs stylex through its own vite adapter, typed, in css layers', () => {
    expect(stylingPlugin('stylex')).toStrictEqual({
      imports: [
        "import { type UserOptions } from '@stylexjs/unplugin';",
        "import stylexVite from '@stylexjs/unplugin/vite';",
        "import { type VitePlugin } from 'unplugin';",
      ],
      declarations: [
        'const stylex: (options: Partial<UserOptions>) => VitePlugin = stylexVite;',
        "const stylexAliases = { '@styles/*': [`${import.meta.dirname}/src/styles/*`] };",
      ],
      call: STYLEX_CALL,
    });
  });

  it('takes the stylex adapter bare in a javascript config, which nothing type-lints', () => {
    expect(stylingPlugin('stylex', false)).toStrictEqual({
      imports: ["import stylex from '@stylexjs/unplugin/vite';"],
      declarations: ["const stylexAliases = { '@styles/*': [`${import.meta.dirname}/src/styles/*`] };"],
      call: STYLEX_CALL,
    });
  });

  // The babel plugin reads no tsconfig paths: without this, `@styles/tokens.stylex` fails every stylex build.
  it('resolves the @styles alias through the path expression a config passes', () => {
    const stylesDir = "join(import.meta.dirname, 'src/styles/*')";
    const plugin = stylingPlugin('stylex', true, stylesDir);

    expect(plugin.declarations).toContain(`const stylexAliases = { '@styles/*': [${stylesDir}] };`);
  });

  it('adds nothing without a styling answer', () => {
    expect(stylingPlugin(undefined)).toStrictEqual({
      imports: [],
      declarations: [],
    });
  });
});
