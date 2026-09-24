import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  type Data,
  DEFAULT_ANSWERS,
  type Library,
  type Router,
  type Styling,
  type TargetId,
} from '@answers';

import { emitViteConfig, viteConfigEmitter } from './viteConfigEmitter';

interface AnswerOverrides {
  target?: TargetId;
  libraries?: Library[];
  router?: Router;
  styling?: Styling;
  data?: Data;
}

const configFor = (overrides: AnswerOverrides): string | null => {
  const answers: Answers = {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };
  return emitViteConfig(answers);
};

describe('emitViteConfig', () => {
  it('writes nothing for the two targets that own their own build', () => {
    expect(configFor({ target: 'next' })).toBeNull();
    expect(configFor({ target: 'angular' })).toBeNull();
  });

  it('imports and calls the framework plugin', () => {
    const react = configFor({ target: 'react' }) ?? '';

    expect(react).toContain("import react, { reactCompilerPreset } from '@vitejs/plugin-react';");
    expect(react).toContain('  ? [babel({ presets: [reactCompilerPreset()] }), react()]');
  });

  /**
   * The compiler is passed via Babel options to `@vitejs/plugin-react`. The VITEST guard keeps its memo cache out of
   * the test run, where it would leave one branch uncovered in every component.
   */
  it('declares the compiler in the plugin call', () => {
    const react = configFor({
      target: 'react',
      libraries: [],
    }) ?? '';

    expect(react).toBe(
      "import babel from '@rolldown/plugin-babel';\n"
      + "import react, { reactCompilerPreset } from '@vitejs/plugin-react';\n"
      + "import { defineConfig } from 'vite';\n"
      + '\n'
      + 'export default defineConfig({\n'
      + '  plugins: [\n'
      + '    ...(process.env.VITEST === undefined\n'
      + '      ? [babel({ presets: [reactCompilerPreset()] }), react()]\n'
      + '      : [react()]),\n'
      + '  ],\n'
      + '  resolve: { tsconfigPaths: true },\n'
      + '  server: { port: 3000 },\n'
      + '});\n',
    );
  });

  // One call per line: React's compiler call plus tailwind joined is 128 characters, over the emitted config's own 120
  // max-len with no fixer.
  it('keeps every plugin call inside the line length it emits for itself', () => {
    const react = configFor({
      target: 'react',
      libraries: [],
      styling: 'tailwind',
    }) ?? '';

    expect(react.split('\n').every((line) => {
      return line.length <= 120;
    })).toBe(true);
  });

  // `crx` is not a framework plugin but occupies the same slot: it turns a vanilla build into an extension build by
  // reading the manifest.
  it('builds the extension from its manifest rather than from a framework plugin', () => {
    const extension = configFor({ target: 'webextension' }) ?? '';

    expect(extension).toContain("import { crx } from '@crxjs/vite-plugin';");
    expect(extension).toContain("\n\nimport manifest from './manifest.json' with { type: 'json' };");
    expect(extension).toContain('    crx({ manifest }),');
  });

  it('stacks tailwind after whatever plugin the target already had', () => {
    expect(configFor({
      target: 'webextension',
      libraries: [],
      styling: 'tailwind',
    }) ?? '')
      .toContain('plugins: [\n    crx({ manifest }),\n    tailwindcss(),\n  ],');
    expect(configFor({
      target: 'vue',
      libraries: [],
      styling: 'tailwind',
    }) ?? '')
      .toContain('plugins: [\n    vue(),\n    tailwindcss(),\n  ],');
  });

  it('leaves tailwind out when it was not chosen', () => {
    expect(configFor({
      target: 'vue',
      libraries: [],
    }) ?? '').not.toContain('tailwind');
  });

  /*
   * First in the list, which is what StyleX's own documentation asks for: placed after the framework plugin it
   * breaks Fast Refresh. Built from the raw factory rather than imported from `@stylexjs/unplugin/vite`, because
   * every pre-built factory that package ships is typed `=> any` and a project that put one in `plugins` would
   * fail its own `no-unsafe-assignment`.
   */
  it('adds the stylex plugin before the framework one, through the one export it types', () => {
    const react = configFor({
      target: 'react',
      libraries: [],
      styling: 'stylex',
    }) ?? '';

    expect(react).toContain("import { unpluginFactory as stylex } from '@stylexjs/unplugin';");
    expect(react).toContain("import { createUnplugin } from 'unplugin';");
    expect(react).not.toContain('@stylexjs/unplugin/vite');
    expect(configFor({
      target: 'vue',
      libraries: [],
      styling: 'stylex',
    }) ?? '')
      .toContain('plugins: [\n    createUnplugin(stylex).vite({ useCSSLayers: true }),\n    vue(),\n  ],');
  });

  it('leaves stylex out when it was not chosen', () => {
    expect(configFor({
      target: 'vue',
      libraries: [],
    }) ?? '').not.toContain('stylex');
  });
});

/**
 * crx derives its inputs from the manifest, so a page the manifest does not name would not be built. A devtools
 * panel is that page: its devtools page opens it at runtime rather than declaring it.
 */
describe('extra rollup inputs', () => {
  it('names the panel as an input once the devtools surface is answered', () => {
    const output = emitViteConfig({
      ...DEFAULT_ANSWERS,
      target: 'webextension',
      surfaces: ['devtools-panel'],
    });

    // The project's own quoting, not JSON's: this file is linted by the config beside it.
    expect(output).toContain("build: { rollupOptions: { input: { panel: 'panel.html' } } },");
    expect(output).not.toContain('"panel"');
  });

  it('names none for the default surfaces, whose pages the manifest already names', () => {
    const output = emitViteConfig({
      ...DEFAULT_ANSWERS,
      target: 'webextension',
    });

    expect(output).not.toContain('rollupOptions');
  });
});

describe('the router', () => {
  // Neither router adds a build plugin: the starter's TanStack route tree is built from the one route list rather
  // than generated out of a `routes/` directory, which is what that plugin exists to do.
  it('adds nothing for either router', () => {
    expect(configFor({ router: 'tanstack-router' })).not.toContain('tanstackRouter');
    expect(configFor({ router: 'react-router' })).not.toContain('tanstackRouter');
  });
});

describe('viteConfigEmitter', () => {
  // Both reference repos rewrote `vite.config.ts` wholesale, so it is the project's after the first write.
  it('hands the config to the project after the first write', () => {
    expect(viteConfigEmitter(DEFAULT_ANSWERS).map(({ target, preserve }) => {
      return [target, preserve];
    })).toEqual([['vite.config.ts', true]]);
  });
});

// Hot reloading leaves one branch no test can reach in every component.
describe('the test run', () => {
  it('keeps solid hot reloading out of it', () => {
    expect(configFor({ target: 'solid' })).toContain('solid({ hot: process.env.VITEST === undefined })');
  });
});
