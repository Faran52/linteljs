import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  type Data,
  DEFAULT_ANSWERS,
  type HostedFramework,
  type Library,
  type Styling,
  type TargetId,
} from '@answers';

import { astroConfigEmitter, emitAstroConfig } from './astroConfigEmitter';

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
  // The same shape `emitViteConfig` uses for the targets that own no vite config.
  it('writes nothing for a target that is not astro', () => {
    expect(emitAstroConfig(answersFor({ target: 'react' }))).toBeNull();
    expect(emitAstroConfig(answersFor({ target: 'webextension' }))).toBeNull();
  });

  it('writes a bare config for a site that hosts nothing and takes no library', () => {
    expect(emitAstroConfig(answersFor({ libraries: [] }))).toBe(
      "import { defineConfig } from 'astro/config';\n\nexport default defineConfig({\n});\n",
    );
  });

  // One integration per hosted framework, by Astro's own package names.
  it.each<[HostedFramework, string, string]>([
    ['react', '@astrojs/react', 'react(reactCompiler)'],
    ['vue', '@astrojs/vue', 'vue()'],
    ['svelte', '@astrojs/svelte', 'svelte()'],
    ['solid', '@astrojs/solid-js', 'solid()'],
  ])('registers the %s integration', (hostedFramework, specifier, call) => {
    const output = emitAstroConfig(answersFor({ hostedFramework }));

    // Bound under the name the call uses.
    expect(output).toContain(`import ${call.slice(0, call.indexOf('('))} from '${specifier}';`);
    expect(output).toContain(`integrations: [${call}],`);
  });

  /**
   * The React Compiler is installed for a react island, so the config wires it: plain Babel options through the
   * `@astrojs/react` passthrough, since its Rolldown preset form fails the build with `Unknown option: .preset`.
   */
  it('wires the react compiler for a react island', () => {
    const output = emitAstroConfig(answersFor({
      hostedFramework: 'react',
      libraries: [],
    }));

    expect(output).toBe(
      "import { defineConfig } from 'astro/config';\n"
      + "import react from '@astrojs/react';\n"
      + '\n'
      + '// The React Compiler as plain Babel options through @astrojs/react; a Rolldown preset fails here with\n'
      + '// `Unknown option: .preset`, and without the guard the memo cache leaves a branch uncovered per component.\n'
      + 'const reactCompiler = process.env.VITEST === undefined\n'
      + "  ? { babel: { plugins: ['babel-plugin-react-compiler'] } }\n"
      + '  : {};\n'
      + '\n'
      + 'export default defineConfig({\n'
      + '  integrations: [react(reactCompiler)],\n'
      + '});\n',
    );
  });

  // The guard keeps the memo cache out of the test run, where it would leave one branch uncovered per component.
  it('keeps the compiler out of the test run through the vitest guard', () => {
    const output = emitAstroConfig(answersFor({
      hostedFramework: 'react',
      libraries: [],
      styling: 'tailwind',
    }));

    expect(output).toContain('const reactCompiler = process.env.VITEST === undefined');
    expect(output).toContain('integrations: [react(reactCompiler)],');
    expect(output).toContain('vite: { plugins: [tailwindcss()] },');
  });

  // Vue, Svelte and Solid have no compiler; their output must not change by one byte.
  it.each<HostedFramework>(['vue', 'svelte', 'solid'])(
    'emits no compiler wiring for %s',
    (hostedFramework) => {
      const output = emitAstroConfig(answersFor({ hostedFramework }));

      expect(output).not.toContain('reactCompiler');
      expect(output).not.toContain('babel-plugin-react-compiler');
    },
  );

  /**
   * Tailwind arrives as a Vite plugin, not an Astro integration: `@astrojs/tailwind` was for Tailwind 3, and 4 ships
   * `@tailwindcss/vite`. This file's `vite` key is the only route Vite options have into an Astro build.
   */
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

  /*
   * StyleX reaches this target through the Vite config it owns rather than one this CLI emits, so the plugin is
   * named here instead.
   */
  it('names the stylex plugin among the vite plugins', () => {
    const config = emitAstroConfig(answersFor({ styling: 'stylex' }));

    expect(config).toContain("import { unpluginFactory as stylex } from '@stylexjs/unplugin';");
    expect(config).toContain("import { createUnplugin } from 'unplugin';");
    expect(config).toContain('  vite: { plugins: [createUnplugin(stylex).vite({ useCSSLayers: true })] },\n');
  });
});

// The build configs are the project's after the first write: both reference repos rewrote their vite config wholesale.
describe('astroConfigEmitter', () => {
  it('hands the config to the project after the first write', () => {
    expect(astroConfigEmitter(answersFor()).map(({
      stage,
      target,
      preserve,
    }) => {
      return [stage, target, preserve];
    })).toEqual([['standard', 'astro.config.mjs', true]]);
  });

  it('writes nothing for a target that is not astro', () => {
    expect(astroConfigEmitter({
      ...DEFAULT_ANSWERS,
      target: 'react',
    })).toEqual([]);
  });
});
