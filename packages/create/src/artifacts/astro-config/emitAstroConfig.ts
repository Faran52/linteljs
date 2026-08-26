import { hasLibrary } from '../../model/answers/answers';
import { targetFor } from '../../model/targets';
import { OUTSIDE_TESTS } from '../../model/targets/utils/frameworkUtils';

import type { Answers, HostedFramework } from '../../model/answers/answers';

/**
 * Emits `astro.config.mjs`, which is where an Astro project's build lives: there is no `vite.config.ts`, and Vite
 * options reach Vite through this file's `vite` key. `.mjs` because that is the name `astro check` and the CLI look for
 * first, and a generated project is `type: module` either way, so the extension is upstream's convention rather than a
 * statement about module format.
 *
 * Returns null for every target that is not Astro, the way `emitViteConfig` returns null for the three that own no
 * Vite config.
 */

// The import and call for the integration that renders a hosted framework's components.
const INTEGRATIONS: Record<HostedFramework, {
  specifier: string;
  call: string;
  compiler?: string[];
}> = {
  /**
   * Plain Babel options, not `reactCompilerPreset()`: that helper answers a Rolldown preset, while `@astrojs/react`
   * passes its argument through to `@vitejs/plugin-react` as Babel options and fails the build on the preset form
   * with `Unknown option: .preset`. The guard keeps the memo cache out of the test run, where it would leave one
   * branch uncovered in every component against a 100% threshold.
   */
  react: {
    specifier: '@astrojs/react',
    call: 'react(reactCompiler)',
    compiler: [
      '// The React Compiler as plain Babel options through @astrojs/react; a Rolldown preset fails here with',
      '// `Unknown option: .preset`, and without the guard the memo cache leaves a branch uncovered per component.',
      `const reactCompiler = ${OUTSIDE_TESTS}`,
      "  ? { babel: { plugins: ['babel-plugin-react-compiler'] } }",
      '  : {};',
    ],
  },
  vue: {
    specifier: '@astrojs/vue',
    call: 'vue()',
  },
  svelte: {
    specifier: '@astrojs/svelte',
    call: 'svelte()',
  },
  solid: {
    specifier: '@astrojs/solid-js',
    call: 'solid()',
  },
};

const BINDING: Record<HostedFramework, string> = {
  react: 'react',
  vue: 'vue',
  svelte: 'svelte',
  solid: 'solid',
};

// The wiring sits between the imports and the config; every framework but React emits nothing here.
const compilerPrelude = (framework: HostedFramework | undefined): string => {
  const lines = framework === undefined ? undefined : INTEGRATIONS[framework].compiler;

  return lines === undefined ? '' : `${lines.join('\n')}\n\n`;
};

export const emitAstroConfig = (answers: Answers): string | null => {
  if (targetFor(answers).astro !== true) {
    return null;
  }

  const framework = answers.hostedFramework;
  const tailwind = hasLibrary(answers, 'tailwind');

  const imports = [
    "import { defineConfig } from 'astro/config';",
    ...(framework === undefined
      ? []
      : [`import ${BINDING[framework]} from '${INTEGRATIONS[framework].specifier}';`]),
    ...(tailwind ? ["import tailwindcss from '@tailwindcss/vite';"] : []),
  ].join('\n');

  const integrations = framework === undefined
    ? ''
    : `  integrations: [${INTEGRATIONS[framework].call}],\n`;

  // Tailwind reaches Astro as a Vite plugin, not an Astro integration: the `@astrojs/tailwind` integration was for
  // Tailwind 3, and version 4 ships `@tailwindcss/vite` instead.
  const vite = tailwind ? '  vite: { plugins: [tailwindcss()] },\n' : '';

  return `${imports}

${compilerPrelude(framework)}export default defineConfig({
${integrations}${vite}});
`;
};
