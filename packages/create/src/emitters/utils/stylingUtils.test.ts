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
      calls: ['tailwindcss()'],
    });
  });

  // The raw factory, since every pre-built one `@stylexjs/unplugin` ships is typed `=> any`.
  it('runs stylex through the typed unplugin factory, in css layers', () => {
    expect(stylingPlugin('stylex')).toEqual({
      imports: [
        "import { unpluginFactory as stylex } from '@stylexjs/unplugin';",
        "import { createUnplugin } from 'unplugin';",
      ],
      calls: ['createUnplugin(stylex).vite({ useCSSLayers: true })'],
    });
  });

  it('adds nothing without a styling answer', () => {
    expect(stylingPlugin(undefined)).toEqual({
      imports: [],
      calls: [],
    });
  });
});
