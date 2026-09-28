import {
  describe,
  expect,
  it,
} from 'vitest';

import { stylingPlugin } from './stylingUtils';

describe('stylingPlugin', () => {
  it('runs tailwind through its own vite plugin', () => {
    expect(stylingPlugin('tailwind')).toStrictEqual({
      imports: ["import tailwindcss from '@tailwindcss/vite';"],
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
      declaration: 'const stylex: (options: Partial<UserOptions>) => VitePlugin = stylexVite;',
      call: 'stylex({ useCSSLayers: true })',
    });
  });

  it('takes the stylex adapter bare in a javascript config, which nothing type-lints', () => {
    expect(stylingPlugin('stylex', 'js')).toStrictEqual({
      imports: ["import stylex from '@stylexjs/unplugin/vite';"],
      call: 'stylex({ useCSSLayers: true })',
    });
  });

  it('adds nothing without a styling answer', () => {
    expect(stylingPlugin(undefined)).toStrictEqual({ imports: [] });
  });
});
