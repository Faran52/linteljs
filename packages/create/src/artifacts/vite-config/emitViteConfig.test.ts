import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  DEFAULT_ANSWERS,
  type Library,
  type TargetId,
} from '../../model/answers/answers';

import { emitViteConfig } from './emitViteConfig';

interface AnswerOverrides {
  target?: TargetId;
  libraries?: Library[];
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

    expect(react).toContain("import react from '@vitejs/plugin-react';");
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
      "import { defineConfig } from 'vite';\n"
      + "import react from '@vitejs/plugin-react';\n"
      + "import { reactCompilerPreset } from '@vitejs/plugin-react';\n"
      + "import babel from '@rolldown/plugin-babel';\n"
      + '\n'
      + '// The React Compiler preset for babel\n'
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

  // A spec that names its plugins directly carries no helper, so nothing changes for it.
  it('emits no prelude for a spec without one', () => {
    const vue = configFor({ target: 'vue' }) ?? '';

    expect(vue).not.toContain('const ');
    expect(vue.split('\n')[0]).toBe("import { defineConfig } from 'vite';");
  });

  // One call per line: React's compiler call plus tailwind joined is 128 characters, over the emitted config's own 120
  // max-len with no fixer.
  it('keeps every plugin call inside the line length it emits for itself', () => {
    const react = configFor({
      target: 'react',
      libraries: ['tailwind'],
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
    expect(extension).toContain("import manifest from './manifest.json';");
    expect(extension).toContain('    crx({ manifest }),');
  });

  it('stacks tailwind after whatever plugin the target already had', () => {
    expect(configFor({
      target: 'webextension',
      libraries: ['tailwind'],
    }) ?? '')
      .toContain('plugins: [\n    crx({ manifest }),\n    tailwindcss(),\n  ],');
    expect(configFor({
      target: 'vue',
      libraries: ['tailwind'],
    }) ?? '')
      .toContain('plugins: [\n    vue(),\n    tailwindcss(),\n  ],');
  });

  it('leaves tailwind out when it was not chosen', () => {
    expect(configFor({
      target: 'vue',
      libraries: [],
    }) ?? '').not.toContain('tailwind');
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
