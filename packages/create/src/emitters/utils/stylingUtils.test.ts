import {
  describe,
  expect,
  it,
} from 'vitest';

import { stylingPlugin } from './stylingUtils';

describe('stylingPlugin', () => {
  it('runs tailwind through its own vite plugin', () => {
    expect(stylingPlugin('tailwind')).toEqual({
      imports: ["import tailwindcss from '@tailwindcss/vite';"],
      declarations: [],
      calls: ['tailwindcss()'],
    });
  });

  // The package's own Vite adapter, whose `generateBundle` writes the CSS, given the type its `=> any` withholds.
  it('runs stylex through its own vite adapter, typed, in css layers', () => {
    expect(stylingPlugin('stylex')).toEqual({
      imports: [
        "import { type UserOptions } from '@stylexjs/unplugin';",
        "import stylexVite from '@stylexjs/unplugin/vite';",
        "import { type VitePlugin } from 'unplugin';",
      ],
      declarations: ['const stylex: (options: Partial<UserOptions>) => VitePlugin = stylexVite;'],
      calls: ['stylex({ useCSSLayers: true })'],
    });
  });

  it('takes the stylex adapter bare in a javascript config, which nothing type-lints', () => {
    expect(stylingPlugin('stylex', 'js')).toEqual({
      imports: ["import stylex from '@stylexjs/unplugin/vite';"],
      declarations: [],
      calls: ['stylex({ useCSSLayers: true })'],
    });
  });

  it('adds nothing without a styling answer', () => {
    expect(stylingPlugin(undefined)).toEqual({
      imports: [],
      declarations: [],
      calls: [],
    });
  });
});
