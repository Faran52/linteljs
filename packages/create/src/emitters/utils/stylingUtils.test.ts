import {
  describe,
  expect,
  it,
} from 'vitest';

import { stylingPlugin } from './stylingUtils';

const STYLEX_CALL = "stylex({ aliases: stylexAliases, useCSSLayers: { before: ['reset'] } })";

describe('stylingPlugin', () => {
  it('runs tailwind through its own vite plugin', () => {
    const actual = stylingPlugin('tailwind');
    const expected = {
      imports: ["import tailwindcss from '@tailwindcss/vite';"],
      declarations: [],
      call: 'tailwindcss()',
    };
    expect(actual).toStrictEqual(expected);
  });

  it('runs stylex through its own vite adapter, typed, in css layers', () => {
    const actual = stylingPlugin('stylex');
    const expected = {
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
    };
    expect(actual).toStrictEqual(expected);
  });

  it('takes the stylex adapter bare in a javascript config, which nothing type-lints', () => {
    const actual = stylingPlugin('stylex', false);
    const expected = {
      imports: ["import stylex from '@stylexjs/unplugin/vite';"],
      declarations: ["const stylexAliases = { '@styles/*': [`${import.meta.dirname}/src/styles/*`] };"],
      call: STYLEX_CALL,
    };
    expect(actual).toStrictEqual(expected);
  });

  // The babel plugin reads no tsconfig paths: without this, `@styles/tokens.stylex` fails every stylex build.
  it('resolves the @styles alias through the path expression a config passes', () => {
    const stylesDir = "join(import.meta.dirname, 'src/styles/*')";
    const plugin = stylingPlugin('stylex', true, stylesDir);

    expect(plugin.declarations).toContain(`const stylexAliases = { '@styles/*': [${stylesDir}] };`);
  });

  it('adds nothing without a styling answer', () => {
    const actual = stylingPlugin(undefined);
    const expected = {
      imports: [],
      declarations: [],
    };
    expect(actual).toStrictEqual(expected);
  });
});
