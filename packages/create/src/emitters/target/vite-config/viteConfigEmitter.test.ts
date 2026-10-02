import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';
import { WELL_KNOWN_404 } from '@targets/react/constants';

import { emitViteConfig, viteConfigEmitter } from './viteConfigEmitter';

import type {
  Answers,
  Data,
  HostedFramework,
  Language,
  Library,
  Router,
  Styling,
  TargetId,
} from '@config/types';

interface AnswerOverrides {
  target?: TargetId;
  hostedFramework?: HostedFramework;
  libraries?: Library[];
  router?: Router;
  styling?: Styling;
  data?: Data;
  languages?: Language[];
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
    const nextConfig = configFor({ target: 'next' });
    expect(nextConfig).toBeNull();
    const angularConfig = configFor({ target: 'angular' });
    expect(angularConfig).toBeNull();
  });

  it.each<[string, AnswerOverrides, string[], string]>([
    [
      'react',
      { target: 'react' },
      [
        "import react from '@vitejs/plugin-react';",
        "import { defineConfig } from 'vite';",
      ],
      '    react({ compiler: process.env.VITEST === undefined }),',
    ],
    [
      'react in framework mode',
      {
        target: 'react',
        router: 'react-router-framework',
      },
      [
        "import { reactRouter } from '@react-router/dev/vite';",
        "import react from '@vitejs/plugin-react';",
        "import { defineConfig } from 'vite';",
      ],
      `    ${WELL_KNOWN_404},\n    ...(process.env.VITEST === undefined ? [reactRouter()] : [react()]),`,
    ],
    [
      'vue',
      { target: 'vue' },
      [
        "import vue from '@vitejs/plugin-vue';",
        "import { defineConfig } from 'vite';",
      ],
      '    vue(),',
    ],
    [
      'svelte',
      { target: 'svelte' },
      [
        "import adapter from '@sveltejs/adapter-auto';",
        "import { sveltekit } from '@sveltejs/kit/vite';",
        "import { defineConfig } from 'vite';",
      ],
      '    sveltekit({ adapter: adapter() }),',
    ],
    [
      'solid',
      { target: 'solid' },
      [
        "import { defineConfig } from 'vite';",
        "import solid from 'vite-plugin-solid';",
      ],
      '    solid({ hot: process.env.VITEST === undefined }),',
    ],
    [
      'webextension',
      { target: 'webextension' },
      [
        "import { crx } from '@crxjs/vite-plugin';",
        "import { defineConfig } from 'vite';",
        "import manifest from './manifest.json' with { type: 'json' };",
      ],
      '    crx({ manifest }),',
    ],
  ])('registers the plugins %s builds with', (_label, overrides, imports, plugins) => {
    const config = configFor(overrides) ?? '';

    const exportAt = config.indexOf('\nexport default');
    const importLines = config
      .slice(0, exportAt)
      .split('\n')
      .filter(Boolean);

    expect(importLines).toEqual(imports);
    expect(/ {2}plugins: \[\n([\s\S]*?)\n {2}\],/u.exec(config)?.[1]).toBe(plugins);
  });

  it('sets the framework group apart, as the emitted import sort has it', () => {
    const config = configFor({
      target: 'react',
      router: 'react-router-framework',
    }) ?? '';

    expect(config).toContain("import { reactRouter } from '@react-router/dev/vite';\n\nimport react");
  });

  it('declares the compiler in the plugin call', () => {
    const react = configFor({
      target: 'react',
      libraries: [],
    }) ?? '';

    expect(react).toBe(
      "import react from '@vitejs/plugin-react';\n"
      + "import { defineConfig } from 'vite';\n"
      + '\n'
      + 'export default defineConfig({\n'
      + '  plugins: [\n'
      + '    react({ compiler: process.env.VITEST === undefined }),\n'
      + '  ],\n'
      + '  resolve: { tsconfigPaths: true },\n'
      + '  server: { port: 3000 },\n'
      + '});\n',
    );
  });

  it('adds the i18n compiler plugin after the framework one once a language is chosen', () => {
    const translated = configFor({
      target: 'svelte',
      languages: ['ja'],
    }) ?? '';
    const english = configFor({ target: 'svelte' }) ?? '';

    const call = [
      '    paraglideVitePlugin({',
      "      project: './project.inlang',",
      "      outdir: './.svelte-kit/paraglide',",
      "      strategy: ['baseLocale'],",
      '      emitTsDeclarations: true,',
      '    }),',
    ].join('\n');

    expect(translated).toContain("import { paraglideVitePlugin } from '@inlang/paraglide-js';");
    expect(translated).toContain(call);
    const index = translated.indexOf('paraglideVitePlugin({');
    expect(index).toBeGreaterThan(translated.indexOf('sveltekit('));
    expect(english).not.toContain('paraglide');
  });

  it('adds no compiler plugin for a language on a target that has no i18n', () => {
    const translated = configFor({
      target: 'solid',
      languages: ['ja'],
    });
    const english = configFor({ target: 'solid' });

    expect(translated).toBe(english);
  });

  it('keeps every plugin call inside the line length it emits for itself', () => {
    const react = configFor({
      target: 'react',
      libraries: [],
      styling: 'tailwind',
    }) ?? '';

    const withinWidth = react
      .split('\n')
      .every((line) => {
        return line.length <= 120;
      });

    expect(withinWidth).toBe(true);
  });

  it('builds the extension from its manifest rather than from a framework plugin', () => {
    const extension = configFor({ target: 'webextension' }) ?? '';

    expect(extension).toContain("import { crx } from '@crxjs/vite-plugin';");
    expect(extension).toContain("\n\nimport manifest from './manifest.json' with { type: 'json' };");
    expect(extension).toContain('    crx({ manifest }),');
  });

  it.each<[HostedFramework, string, string]>([
    [
      'vue',
      "import vue from '@vitejs/plugin-vue';",
      'vue()',
    ],
    [
      'svelte',
      "import { svelte } from '@sveltejs/vite-plugin-svelte';",
      'svelte()',
    ],
    [
      'solid',
      "import solid from 'vite-plugin-solid';",
      'solid({ hot: process.env.VITEST === undefined })',
    ],
  ])('builds an extension hosting %s through its framework plugin', (hostedFramework, line, call) => {
    const config = configFor({
      target: 'webextension',
      hostedFramework,
    }) ?? '';

    expect(config).toContain(line);
    expect(config).toContain(`plugins: [\n    ${call},\n    crx({ manifest }),\n  ],`);
  });

  it('stacks tailwind after whatever plugin the target already had', () => {
    const onExtension = configFor({
      target: 'webextension',
      libraries: [],
      styling: 'tailwind',
    }) ?? '';

    expect(onExtension).toContain('plugins: [\n    crx({ manifest }),\n    tailwindcss(),\n  ],');

    const onVue = configFor({
      target: 'vue',
      libraries: [],
      styling: 'tailwind',
    }) ?? '';

    expect(onVue).toContain('plugins: [\n    vue(),\n    tailwindcss(),\n  ],');
    expect(onVue).toContain("import tailwindcss from '@tailwindcss/vite';");
  });

  it('leaves tailwind out when it was not chosen', () => {
    const config = configFor({
      target: 'vue',
      libraries: [],
    }) ?? '';

    expect(config).not.toContain('tailwind');
  });

  it('adds the stylex plugin before the framework one, through its typed vite adapter', () => {
    const config = configFor({
      target: 'vue',
      libraries: [],
      styling: 'stylex',
    });

    expect(config).toBe(`import { type UserOptions } from '@stylexjs/unplugin';
import stylexVite from '@stylexjs/unplugin/vite';
import vue from '@vitejs/plugin-vue';
import { type VitePlugin } from 'unplugin';
import { defineConfig } from 'vite';

const stylex: (options: Partial<UserOptions>) => VitePlugin = stylexVite;
const stylexAliases = { '@styles/*': [\`\${import.meta.dirname}/src/styles/*\`] };

export default defineConfig({
  plugins: [
    stylex({ aliases: stylexAliases, useCSSLayers: { before: ['reset'] } }),
    vue(),
  ],
  resolve: { tsconfigPaths: true },
  server: { port: 3000 },
});
`);
  });

  it('leaves stylex out when it was not chosen', () => {
    const config = configFor({
      target: 'vue',
      libraries: [],
    }) ?? '';

    expect(config).not.toContain('stylex');
  });
});

describe('extra rollup inputs', () => {
  it('names the panel as an input once the devtools surface is answered', () => {
    const output = emitViteConfig({
      ...DEFAULT_ANSWERS,
      target: 'webextension',
      surfaces: ['devtools-panel'],
    });

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
  it('adds nothing for either router', () => {
    const tanstackConfig = configFor({ router: 'tanstack-router' });
    expect(tanstackConfig).not.toContain('tanstackRouter');
    const reactRouterConfig = configFor({ router: 'react-router' });
    expect(reactRouterConfig).not.toContain('tanstackRouter');
  });
});

describe('viteConfigEmitter', () => {
  it('hands the config to the project after the first write', () => {
    const shapes = viteConfigEmitter(DEFAULT_ANSWERS)
      .map(({ target, preserve }) => {
        const shape = [target, preserve];
        return shape;
      });

    const expected = [['vite.config.ts', true]];
    expect(shapes).toEqual(expected);
  });

  it('writes nothing for a target whose build is not vite', () => {
    const artifacts = viteConfigEmitter({
      ...DEFAULT_ANSWERS,
      target: 'next',
    });

    expect(artifacts).toEqual([]);
  });
});
