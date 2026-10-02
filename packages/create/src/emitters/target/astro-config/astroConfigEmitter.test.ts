import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';

import { astroConfigEmitter, emitAstroConfig } from './astroConfigEmitter';

import type {
  Answers,
  Data,
  HostedFramework,
  Library,
  Styling,
  TargetId,
} from '@config/types';

interface AnswerOverrides {
  target?: TargetId;
  hostedFramework?: HostedFramework;
  libraries?: Library[];
  styling?: Styling;
  data?: Data;
}

const answersFor = (overrides: AnswerOverrides = {}): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    target: 'astro',
    ...overrides,
  };
};

describe('emitAstroConfig', () => {
  it('writes nothing for a target that is not astro', () => {
    const astroConfig = emitAstroConfig(answersFor({ target: 'react' }));
    expect(astroConfig).toBeNull();
    const astroConfig2 = emitAstroConfig(answersFor({ target: 'webextension' }));
    expect(astroConfig2).toBeNull();
  });

  it('writes a bare config for a site that hosts nothing and takes no library', () => {
    const astroConfig = emitAstroConfig(answersFor({ libraries: [] }));

    expect(astroConfig).toBe(
      "import { defineConfig } from 'astro/config';\n\nexport default defineConfig({\n});\n",
    );
  });

  it.each<[HostedFramework, string, string]>([
    [
      'react',
      '@astrojs/react',
      'react({ compiler: process.env.VITEST === undefined })',
    ],
    [
      'vue',
      '@astrojs/vue',
      'vue()',
    ],
    [
      'svelte',
      '@astrojs/svelte',
      'svelte()',
    ],
    [
      'solid',
      '@astrojs/solid-js',
      'solid()',
    ],
  ])('registers the %s integration', (hostedFramework, specifier, call) => {
    const output = emitAstroConfig(answersFor({ hostedFramework }));

    expect(output).toContain(`import ${call.slice(0, call.indexOf('('))} from '${specifier}';`);
    expect(output).toContain(`integrations: [${call}],`);
  });

  it('wires the react compiler for a react island', () => {
    const output = emitAstroConfig(answersFor({
      hostedFramework: 'react',
      libraries: [],
    }));

    expect(output).toBe(
      "import react from '@astrojs/react';\n"
      + "import { defineConfig } from 'astro/config';\n"
      + '\n'
      + 'export default defineConfig({\n'
      + '  integrations: [react({ compiler: process.env.VITEST === undefined })],\n'
      + '});\n',
    );
  });

  it('keeps the compiler out of the test run through the vitest guard, beside a styling plugin', () => {
    const output = emitAstroConfig(answersFor({
      hostedFramework: 'react',
      libraries: [],
      styling: 'tailwind',
    }));

    expect(output).toContain('integrations: [react({ compiler: process.env.VITEST === undefined })],');
    expect(output).toContain('vite: { plugins: [tailwindcss()] },');
  });

  it.each<HostedFramework>([
    'vue',
    'svelte',
    'solid',
  ])(
    'emits no compiler wiring for %s',
    (hostedFramework) => {
      const output = emitAstroConfig(answersFor({ hostedFramework }));

      expect(output).not.toContain('compiler');
    },
  );

  it('passes tailwind through the vite key rather than as an integration', () => {
    const output = emitAstroConfig(answersFor({
      libraries: [],
      styling: 'tailwind',
    }));

    expect(output).toContain("import tailwindcss from '@tailwindcss/vite';");
    expect(output).toContain('vite: { plugins: [tailwindcss()] },');
    expect(output).not.toContain('integrations');
  });

  it('carries both where a site hosts a framework and takes tailwind', () => {
    const output = emitAstroConfig(answersFor({
      hostedFramework: 'vue',
      libraries: [],
      styling: 'tailwind',
    }));

    expect(output).toContain('integrations: [vue()],');
    expect(output).toContain('vite: { plugins: [tailwindcss()] },');
  });

  it('names the stylex plugin among the vite plugins', () => {
    const config = emitAstroConfig(answersFor({ styling: 'stylex' }));

    expect(config).toContain("import stylex from '@stylexjs/unplugin/vite';");
    expect(config).not.toContain("from 'unplugin';");
    const aliases = "const stylexAliases = { '@styles/*': [`${import.meta.dirname}/src/styles/*`] };";
    const plugins = "plugins: [stylex({ aliases: stylexAliases, useCSSLayers: { before: ['reset'] } })]";

    expect(config).toContain(`\n\n${aliases}\n\nexport default`);
    expect(config).toContain(`  vite: { ${plugins} },\n`);
  });
});

describe('astroConfigEmitter', () => {
  it('hands the config to the project after the first write', () => {
    const shapes = astroConfigEmitter(answersFor())
      .map(({
        stage,
        target,
        preserve,
      }) => {
        return [
          stage,
          target,
          preserve,
        ];
      });

    const expected = [[
      'standard',
      'astro.config.mjs',
      true,
    ]];
    expect(shapes).toEqual(expected);
  });

  it('writes nothing for a target that is not astro', () => {
    const artifacts = astroConfigEmitter({
      ...DEFAULT_ANSWERS,
      target: 'react',
    });

    expect(artifacts).toEqual([]);
  });
});
